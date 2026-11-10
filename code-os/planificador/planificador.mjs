// Planificador por deadline. Puro (sin red ni disco): recibe trabajos y una función de capacidad.
//  - Reserva presupuesto (en llamadas) por nivel para cada trabajo, en orden de deadline (EDF).
//  - Avisa temprano si no alcanza.
//  - Baja de nivel lo marcado como repetitivo (alto→medio→bajo) antes de pedir más.
//  - Nunca asigna pago por token sin aprobación: devuelve una solicitud y espera.
export const NIVELES = ['alto', 'medio', 'bajo'];
export const MARGEN = 0.2;        // colchón sobre la estimación
export const UMBRAL_JUSTO = 0.8;  // si usa ≥80% de lo disponible, el trabajo queda "justo"

// Supuestos de costo por llamada de la válvula de pago (USD). Calibrar con el medidor real.
export const COSTO_LLAMADA_USD = { alto: 0.06, medio: 0.01, bajo: 0.003 };
const DIA = 24 * 3600e3;

const nivelAbajo = (n) => NIVELES[NIVELES.indexOf(n) + 1] ?? null;
const redondea = (x) => Math.ceil(x);

/**
 * @param {object} p
 * @param {Array}  p.trabajos  [{id, titulo, deadline (ISO|ms), partes:[{nivel, llamadas, repetitivo?, nombre?}]}]
 * @param {(nivel:string, desde:number, hasta:number)=>number} p.capacidad llamadas gratis/suscripción disponibles en [desde,hasta]
 * @param {number} [p.ahora]
 * @param {Object<string,{usd:number}>} [p.aprobaciones] por id de trabajo: gasto en pago por token ya aprobado por el CEO
 * @param {number} [p.margen]
 * @param {Object<string,number>} [p.costoLlamadaUsd]
 */
export function planificar({ trabajos, capacidad, ahora = Date.now(), aprobaciones = {}, margen = MARGEN, costoLlamadaUsd = COSTO_LLAMADA_USD }) {
  const reservado = { alto: 0, medio: 0, bajo: 0 }; // por ahora acumulado de trabajos con deadline más cercano
  const orden = [...trabajos].sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
  const salida = [];

  for (const t of orden) {
    const deadline = typeof t.deadline === 'number' ? t.deadline : Date.parse(t.deadline);
    const dias = (deadline - ahora) / DIA;
    const avisos = [];
    const bajados = [];
    const partes = t.partes.map((p, i) => ({ ...p, nombre: p.nombre ?? `parte ${i + 1}`, llamadas: p.llamadas * (1 + margen), origen: p.nivel }));

    if (deadline <= ahora) {
      salida.push({ id: t.id, titulo: t.titulo, estado: 'no_alcanza', dias_restantes: +dias.toFixed(2), reserva: { alto: 0, medio: 0, bajo: 0 }, bajados, pago: null, aprobaciones_pendientes: [],
        avisos: [{ gravedad: 'critico', mensaje: 'El deadline ya pasó.' }] });
      continue;
    }

    const libre = (n) => Math.max(0, capacidad(n, ahora, deadline) - reservado[n]);
    const necesidad = () => Object.fromEntries(NIVELES.map((n) => [n, partes.filter((p) => p.nivel === n).reduce((s, p) => s + p.llamadas, 0)]));

    // 1) bajar de nivel lo repetitivo donde falte cupo (empezando por alto, grandes primero)
    for (const n of ['alto', 'medio']) {
      let guard = 0;
      while (necesidad()[n] > libre(n) && guard++ < 1000) {
        const cand = partes.filter((p) => p.nivel === n && p.repetitivo).sort((a, b) => b.llamadas - a.llamadas)[0];
        if (!cand) break;
        const destino = nivelAbajo(n);
        bajados.push({ parte: cand.nombre, de: n, a: destino, llamadas: redondea(cand.llamadas) });
        cand.nivel = destino;
      }
    }

    // 2) qué falta todavía
    const need = necesidad();
    const faltante = Object.fromEntries(NIVELES.map((n) => [n, Math.max(0, redondea(need[n] - libre(n)))]));
    const reserva = Object.fromEntries(NIVELES.map((n) => [n, redondea(Math.min(need[n], libre(n)))]));

    // 3) lo que falta solo se cubre con pago por token → requiere aprobación
    const aprobacionesPendientes = [];
    let pago = null;
    const usdNecesario = NIVELES.reduce((s, n) => s + faltante[n] * costoLlamadaUsd[n], 0);
    if (usdNecesario > 0) {
      const aprobado = aprobaciones[t.id]?.usd ?? 0;
      if (aprobado >= usdNecesario) pago = { usd: +usdNecesario.toFixed(2), llamadas: faltante, aprobado: true };
      else aprobacionesPendientes.push({
        trabajo: t.id, motivo: 'pago_por_token', usd_estimado: +usdNecesario.toFixed(2), llamadas: faltante,
        mensaje: `Para llegar a "${t.titulo ?? t.id}" a tiempo hay que gastar ~US$${usdNecesario.toFixed(2)} por token (válvula DeepSeek/frontier). Nada se gasta sin tu aprobación.`,
      });
    }

    // 4) avisos tempranos
    if (bajados.length) avisos.push({ gravedad: 'info', mensaje: `Bajé ${bajados.length} parte(s) repetitiva(s) a un nivel más barato: ${bajados.map((b) => `${b.parte} ${b.de}→${b.a}`).join(', ')}.` });
    const cubierto = !aprobacionesPendientes.length;
    const hayFalta = Object.values(faltante).some((x) => x > 0);
    if (hayFalta && !pago) avisos.push({ gravedad: dias < 2 ? 'critico' : 'advertencia', mensaje: `No alcanza el cupo gratis/de suscripción para "${t.titulo ?? t.id}" (faltan ${NIVELES.filter((n) => faltante[n]).map((n) => `${faltante[n]} llamadas de ${n}`).join(', ')}). Quedan ${dias.toFixed(1)} días: decide ahora si recortas alcance, mueves el deadline o apruebas gasto.` });

    // 5) consumir de la bolsa común (solo lo realmente reservado)
    for (const n of NIVELES) reservado[n] += reserva[n];

    const usoRel = Math.max(...NIVELES.map((n) => { const cap = libre(n) + reserva[n]; return cap > 0 ? reserva[n] / cap : 0; }));
    let estado = 'ok';
    if (hayFalta && !pago) estado = aprobacionesPendientes.length ? 'requiere_aprobacion' : 'no_alcanza';
    else if (usoRel >= UMBRAL_JUSTO) estado = 'justo';

    salida.push({ id: t.id, titulo: t.titulo, estado, dias_restantes: +dias.toFixed(2), reserva, bajados, pago, aprobaciones_pendientes: aprobacionesPendientes, avisos });
  }
  return { generado: new Date(ahora).toISOString(), trabajos: salida, reservado };
}
