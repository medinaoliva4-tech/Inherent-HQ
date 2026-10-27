// Production Brief Builder (herramienta production-brief de Production): las piezas de ④ con material video o foto (¿se pueden producir?),
// el techo de realidad de la ficha (horas y sesiones; un video planificado = 20 min) y las piezas devueltas a ④ con su motivo y 2 alternativas.
// Existe para que el contenido, el pedido a la IA, la lectura de su respuesta y las reglas de cierre vivan en un solo módulo puro (sin DOM ni red)
// que comparten la vista, el servidor y las pruebas. Aquí nunca hay tarifas ni costos: lo que no se sabe dice ⚠️ SIN DATOS, nunca 0.
import { plano, corta, entero, numeroONull, sinAcentos, leerHerramienta, armarPrompt, celda, SIN_DATOS } from '../consulting/marcos.js';
import { techo as techoDe, carga, MIN_POR_VIDEO } from '../produccion.js';

export const BLOQUE = 'produccion';
export const MATERIALES = ['video', 'foto'];
export const PRODUCIBLE = [['si', 'Sí'], ['ajuste', 'Con ajuste'], ['no', 'No']];
const PROD_IDS = PRODUCIBLE.map((x) => x[0]);
const MAX_PIEZAS = 120;

export const piezaVacia = () => ({ id_creativo: '', formato: '', fecha: '', material: 'video', producible: '', nota: '' });
export const devueltaVacia = () => ({ id_creativo: '', motivo: '', alternativas: ['', ''], tarea: '' });

export function vacio() {
  return { mes: '', techo: { horas: null, sesiones: null, fuente: '' }, piezas: [], devueltas: [], cerrado: false };
}

const fechaOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? '')) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime());
const mesOk = (s) => (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(s ?? '')) ? String(s) : '');

// Solo lo conocido, con su tipo y su tamaño. Lo demás (llaves de más, costos, tarifas, id, v, _meta) se cae.
export function limpiar(c) {
  const o = plano(c) ? c : {}, t = plano(o.techo) ? o.techo : {};
  const piezas = [], vistas = new Set();
  for (const p of Array.isArray(o.piezas) ? o.piezas : []) {
    if (!plano(p)) continue;
    const id = corta(p.id_creativo, 40); if (!id || vistas.has(id)) continue;
    vistas.add(id);
    const mat = sinAcentos(p.material), prod = sinAcentos(p.producible).replace(/^(sí|si)$/, 'si');
    piezas.push({ id_creativo: id, formato: corta(p.formato, 40), fecha: fechaOk(p.fecha) ? p.fecha : '', material: MATERIALES.includes(mat) ? mat : 'video', producible: PROD_IDS.includes(prod) ? prod : '', nota: corta(p.nota, 240) });
    if (piezas.length >= MAX_PIEZAS) break;
  }
  const devueltas = [], dv = new Set();
  for (const d of Array.isArray(o.devueltas) ? o.devueltas : []) {
    if (!plano(d)) continue;
    const id = corta(d.id_creativo, 40); if (!id || dv.has(id)) continue;
    dv.add(id);
    const alt = (Array.isArray(d.alternativas) ? d.alternativas : []).map((x) => corta(x, 240)).slice(0, 2);
    while (alt.length < 2) alt.push('');
    devueltas.push({ id_creativo: id, motivo: corta(d.motivo, 300), alternativas: alt, tarea: corta(d.tarea, 80) });
  }
  return {
    mes: mesOk(o.mes),
    techo: { horas: numeroONull(t.horas, { min: 0, max: 400 }), sesiones: entero(t.sesiones, 0, 60), fuente: corta(t.fuente, 160) },
    piezas, devueltas, cerrado: o.cerrado === true,
  };
}

// ---------- Cálculos ----------
// El techo que manda: el del contenido, o el de la ficha si viene en extra.ficha (si los dos hablan, manda el menor).
export const techoDe_ = (c, extra) => {
  const t = limpiar(c).techo;
  return extra?.ficha ? { ...techoDe(extra.ficha, t), fuente: t.fuente || 'la ficha de oferta' } : t;
};
export const cargaDe = (c, extra) => carga(limpiar(c).piezas, techoDe_(c, extra));
export const aProducir = (c) => limpiar(c).piezas.filter((p) => p.producible !== 'no');
export const sinDecidir = (c) => limpiar(c).piezas.filter((p) => !p.producible);
// Piezas marcadas «no» que aún no tienen devolución a ④.
export const sinDevolver = (c) => { const x = limpiar(c), d = new Set(x.devueltas.map((e) => e.id_creativo)); return x.piezas.filter((p) => p.producible === 'no' && !d.has(p.id_creativo)); };

// Lo que falta para cerrar el brief (cada texto es un criterio en «falta»). Con la capacidad pasada no se cierra.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [], t = techoDe_(c, extra), k = carga(c.piezas, t);
  if (!c.piezas.length) f.push('Faltan las piezas a producir: tráelas de ④ (filas con material video o foto)');
  const sd = sinDecidir(c); if (sd.length) f.push(`${sd.length} pieza${sd.length === 1 ? '' : 's'} sin decidir si se puede producir (sí, no o con ajuste): ${sd.slice(0, 4).map((p) => p.id_creativo).join(', ')}`);
  if (t.horas === null) f.push(`El techo de horas está sin dato (${SIN_DATOS}): sale de la ficha de oferta`);
  if (t.sesiones === null) f.push(`El techo de sesiones está sin dato (${SIN_DATOS}): sale de la ficha de oferta`);
  if (k.pasa) f.push(`La capacidad está pasada: ${k.videos} videos × ${MIN_POR_VIDEO} min = ${k.horas} h contra ${k.techoHoras} h de la ficha${k.techoSesiones !== null && k.sesiones > k.techoSesiones ? ` (${k.sesiones} sesiones de ${k.techoSesiones})` : ''}. Pasa piezas a «no» y devuélvelas a ④, o escala el alcance al CEO`);
  const sv = sinDevolver(c); if (sv.length) f.push(`Sin devolver a ④: ${sv.map((p) => p.id_creativo).join(', ')} (marcadas «no» producible)`);
  for (const d of c.devueltas) {
    if (!d.motivo) f.push(`La devolución de ${d.id_creativo} no dice el motivo`);
    if (d.alternativas.filter(Boolean).length < 2) f.push(`La devolución de ${d.id_creativo} necesita 2 alternativas`);
  }
  return f;
}

// Una tarea por devolución para ④ Creatividad. La clave («fila») es la pieza, no su lugar: reordenar no duplica.
export function tareasDe(contenido) {
  const c = limpiar(contenido), out = [];
  for (const d of c.devueltas) {
    if (!d.motivo) continue;
    out.push({ title: `Rehacer ${d.id_creativo}: ${d.motivo}`.slice(0, 200), due: '', dept: 'Creatividad', fila: `dev-${sinAcentos(d.id_creativo).replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
      por_que: [`Devuelta por Production${c.mes ? ` (${c.mes})` : ''}: ${d.motivo}`, ...d.alternativas.filter(Boolean).map((a, i) => `Alternativa ${i + 1}: ${a}`)].join(' · '), assignee: '' });
  }
  return out.slice(0, 12);
}

export function resumenTexto(contenido) {
  const c = limpiar(contenido), k = cargaDe(c);
  return [`Production Brief${c.mes ? ` ${c.mes}` : ''}: ${c.piezas.length} piezas`, `${k.videos} videos = ${k.horas} h`, k.techoHoras === null ? `techo ${SIN_DATOS}` : `techo ${k.techoHoras} h${k.pasa ? ' (pasado)' : ''}`, c.devueltas.length ? `${c.devueltas.length} devueltas a ④` : ''].filter(Boolean).join(' · ');
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const piezas = (Array.isArray(ctx?.piezas) ? ctx.piezas : []).filter(plano).slice(0, 30).map((p) => `${corta(p.id_creativo || p.id, 30)}|${corta(p.formato, 20)}|${corta(p.fecha, 10)}|${corta(p.material, 6)}`).join('; ');
  const cuerpo = [
    'MÉTODO',
    `1) PIEZAS: las filas de ④ (04-contenido/<mes>/ideas/plan-de-contenido.csv) con material video o foto. Por cada una: id_creativo, formato, fecha (AAAA-MM-DD) y si es producible: «si», «ajuste» (se puede con un cambio que dices en nota) o «no». ${piezas ? `Piezas leídas: ${piezas}.` : 'Si no las tienes, ⚠️ SIN DATOS: sale de ④ Creatividad.'}`,
    `2) TECHO DE REALIDAD: las horas de grabación y las sesiones por mes de la ficha de oferta son el techo (la ficha manda; si el cliente declara menos, manda la menor). Un video planificado se graba en ${MIN_POR_VIDEO} min si se agrupa por setup. Si la ficha no las dice: null (⚠️ SIN DATOS), nunca 0.`,
    '3) DEVUELTAS A ④: cada pieza «no» va devuelta con el motivo (concreto: locación, talento, fecha, tiempo) y exactamente 2 alternativas que sí se pueden producir.',
    '4) Lo que no entra en las horas es decisión de alcance: se escala al CEO con números, no se acomoda en silencio. Nunca tarifas ni costos.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"mes":"AAAA-MM","techo":{"horas":8,"sesiones":2,"fuente":"ficha de oferta"},"piezas":[{"id_creativo":"…","formato":"Reel","fecha":"AAAA-MM-DD","material":"video|foto","producible":"si|ajuste|no","nota":"…"}],"devueltas":[{"id_creativo":"…","motivo":"…","alternativas":["…","…"]}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Production Brief","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Production de Inherent. Arma el PRODUCTION BRIEF de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»${mesOk(ctx?.mes) ? ` para ${ctx.mes}` : ''}: qué de ④ se puede grabar o fotografiar con las horas de la ficha.`, cuerpo, salida }, ctx);
}

export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), k = cargaDe(c);
  const L = [`# Production Brief${c.mes ? ` · ${c.mes}` : ''}`, '', '## Techo de realidad', ''];
  L.push(`- Horas de grabación: ${k.techoHoras === null ? SIN_DATOS : `${k.techoHoras} h`}`, `- Sesiones: ${k.techoSesiones === null ? SIN_DATOS : k.techoSesiones}`,
    `- Pide el brief: ${k.videos} videos × ${MIN_POR_VIDEO} min = ${k.horas} h${k.pasa ? ' — ⚠️ pasa el techo' : ''}`, '', '## Piezas a producir', '');
  if (c.piezas.length) {
    L.push('| Pieza | Formato | Fecha | Material | Producible | Nota |', '|---|---|---|---|---|---|');
    for (const p of c.piezas) L.push(`| ${celda(p.id_creativo)} | ${celda(p.formato) || '—'} | ${p.fecha || '—'} | ${p.material} | ${PRODUCIBLE.find((x) => x[0] === p.producible)?.[1] || SIN_DATOS} | ${celda(p.nota)} |`);
  } else L.push(`${SIN_DATOS}: faltan las piezas de ④.`);
  L.push('', '## Devueltas a ④', '');
  if (c.devueltas.length) for (const d of c.devueltas) L.push(`- **${d.id_creativo}** — ${d.motivo || SIN_DATOS}`, ...d.alternativas.filter(Boolean).map((a, i) => `  - Alternativa ${i + 1}: ${a}`));
  else L.push('Ninguna.');
  return L.join('\n');
}
