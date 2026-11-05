// Chat de trabajo (PLAN-GATEWAY F4) · la parte pura, sin pantalla (se prueba en node: npm run test:agentes).
// Un trabajo del Agent Area se lleva como en Claude: una conversación guardada en la base, más las piezas de §8:
//   Agent (cabecera) · Queue (las etapas en cola) · Sources (las fuentes de cada etapa) · File tree (inputs y lo producido).
// La conversación es una de `chat_sesiones` (oculta: no sale en la lista del Chat), una por persona y por trabajo, con un id
// fijo: la misma persona la retoma desde cualquier compu. La responde el trabajador del VPS con el contexto del trabajo.
import { activa, completo, leerOutput, CONEXIONES, ESTADOS } from './agentes-flujos.js';

// El área del agente → el modo del Chat (el id de la conversación lo lleva, como todas las del servidor).
const MODO = { strategy: 'estrategia', marketing: 'marketing', creative: 'diseno', production: 'produccion', consulting: 'consulting' };
export const modoDeArea = (area) => MODO[area] || 'organizacion';

// Un hash corto y estable del correo: el id dice de quién es la conversación sin poner el correo en la base.
export function huella(s) {
  let h = 5381;
  for (const c of String(s || '').toLowerCase()) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
// El id de la conversación de trabajo: inh-<modo>-t<trabajo>-<huella del correo>. Cabe en el formato de leerIdSesion.
export function idChatTrabajo(run, email) {
  const t = String(run?.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 38);
  return `inh-${modoDeArea(run?.flujo?.area)}-t${t || 'x'}-${huella(email)}`;
}

const corta = (s, n) => { const t = String(s || ''); return t.length > n ? `${t.slice(0, n)}…` : t; };
// Lo que el servidor sabe del trabajo en cada turno (se arma de nuevo cada vez: siempre va al día con la base).
// Cabe en el contexto de 32k (§4): lo aprobado y los inputs van recortados; lo completo está en la pantalla.
export function sistemaTrabajo(run, { nombre = '' } = {}) {
  const f = run.flujo || {}, n = activa(run), e = run.etapas[n] || {}, o = leerOutput(e.entrega || e.output, e.nombre);
  const inputs = (run.inputs || []).filter((x) => !x.archivado);
  const con = (e.herramientas || []).map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || h);
  const aprobadas = run.etapas.filter((x) => x.estado === 'aprobada' && x.salida);
  let presupuesto = 9000; // caracteres para lo aprobado: lo más reciente primero
  const previas = [...aprobadas].reverse().map((x) => {
    if (presupuesto < 400) return `### ${x.nombre} (aprobada · el texto está en Archivos → Producido)`;
    const t = corta(x.salida, Math.min(3500, presupuesto)); presupuesto -= t.length; return `### ${x.nombre} (aprobada)\n${t}`;
  }).reverse();
  let paraInputs = 6000; // caracteres para el texto de los inputs; los que no alcanzan van solo con su título
  const lineaInput = (x) => { const t = x.texto && paraInputs > 200 ? corta(x.texto, Math.min(1500, paraInputs)) : ''; paraInputs -= t.length; return `[${x.id}] ${x.titulo}${x.url ? ` — ${x.url}` : ''}${t ? `\n${t}` : ''}`; };
  return [
    `Eres «${f.agente || f.nombre || 'el agente'}» de Inherent${f.depto ? ` (${f.depto})` : ''} y trabajas el trabajo «${run.titulo}» junto a ${nombre || 'la persona'} en el chat de trabajo.`,
    'Cómo trabajas aquí: ayudas a pensar, revisar y mejorar la etapa activa; respondes corto y concreto, en español neutro y de tú (nunca de «vos»). Lo que propongas cambiar del resultado lo escribes ya redactado, listo para pedirlo como ajuste.',
    'Lo que NO haces: no ejecutas ni apruebas etapas (la persona lo hace con los botones de la cola) · no digas que algo quedó hecho si no lo hizo el OS · NUNCA inventes: cada dato lleva su fuente (input, etapa aprobada o una página que leíste con tus herramientas) o se dice que es hipótesis.',
    f.limites?.length ? `Lo que este agente no hace: ${f.limites.join(' · ')}` : '',
    run.objetivo ? `Objetivo del trabajo: ${run.objetivo}` : '',
    run.cliente ? `Cliente: ${run.cliente_nombre || run.cliente}. Puedes leer su información en el OS con tus herramientas.` : 'Es un trabajo interno de Inherent.',
    `Etapas (${run.etapas.length}): ${run.etapas.map((x, i) => `${i + 1}. ${x.nombre} — ${ESTADOS[x.estado] || x.estado}${i === n && !completo(run) ? ' ← ACTIVA' : ''}`).join(' · ')}`,
    completo(run) ? 'El trabajo está completo: todas las etapas están aprobadas.' : [
      `Etapa activa: ${n + 1} · ${e.nombre}${e.gate ? ' (🚦 la aprueba solo el CEO)' : ''}.`,
      e.proposito ? `Propósito: ${e.proposito}` : '',
      `Entrega: ${o.titulo}${o.campos.length ? ` (campos: ${o.campos.join(', ')})` : ''}`,
      e.criterios?.length ? `Criterios de éxito: ${e.criterios.join('; ')}` : '',
      con.length ? `Conexiones de la etapa: ${con.join(', ')}` : '',
      e.estado === 'ajuste' && e.ajuste ? `Ajuste pedido (falta re-ejecutar): ${e.ajuste}` : '',
      e.estado === 'pregunta' && e.pregunta ? `Le preguntaste a la persona: ${e.pregunta.texto}` : '',
      e.estado === 'revision' && e.salida ? `RESULTADO EN REVISIÓN (lo que la persona está por aprobar)${e.confianza ? ` · confianza ${e.confianza}%` : ''}:\n${corta(e.salida, 7000)}${e.faltantes?.length ? `\nFaltó evidencia de: ${e.faltantes.join('; ')}` : ''}` : '',
    ].filter(Boolean).join('\n'),
    inputs.length ? `Inputs del equipo (id entre corchetes):\n${inputs.slice(0, 30).map(lineaInput).join('\n')}` : 'Todavía no hay inputs del equipo.',
    previas.length ? `Lo aprobado hasta ahora:\n${previas.join('\n\n')}` : '',
  ].filter(Boolean).join('\n\n');
}

// Los eventos del trabajo que entran al hilo, entre los mensajes, por hora. Lo demás (tomar, verificar…) se ve en las piezas.
const EVENTO = { crear: 'Trabajo creado', encolar: 'Etapa enviada al servidor', ejecutar: 'Resultado listo', aprobar: 'Etapa aprobada', ajuste: 'Ajuste pedido', corregir: 'Resultado corregido a mano', fallo: 'Falló en el servidor', cancelar: 'Etapa sacada de la cola', pausar: 'Agente en pausa', reanudar: 'Agente reanudado', input: 'Input agregado', preguntar: 'Te hizo una pregunta', responder: 'Respondiste', aporte: 'Diste tu aporte', usar: 'Resultado pasado a', recibir: 'Recibió un resultado' };
// → [{ tipo: 'msg', i, m } | { tipo: 'evento', h, etapa, titulo, ultimo }] en orden. `ultimo`: el resultado vigente de su etapa
// (ese se pinta como tarjeta con su resultado; los anteriores, como una línea).
export function hilo(run, mensajes = []) {
  const evs = (run.historial || []).filter((h) => EVENTO[h.accion]).map((h) => ({ tipo: 'evento', at: h.at, h, etapa: h.etapa, titulo: EVENTO[h.accion] }));
  const ultimoRes = new Map();
  const ultimoPreg = new Map();
  evs.forEach((x, k) => { if (x.h.accion === 'ejecutar') ultimoRes.set(x.etapa, k); if (x.h.accion === 'preguntar') ultimoPreg.set(x.etapa, k); });
  evs.forEach((x, k) => { x.ultimo = x.h.accion === 'ejecutar' && ultimoRes.get(x.etapa) === k && ['revision', 'aprobada'].includes(run.etapas[x.etapa]?.estado); x.vigente = x.h.accion === 'preguntar' && ultimoPreg.get(x.etapa) === k && run.etapas[x.etapa]?.estado === 'pregunta'; });
  const ms = mensajes.map((m, i) => ({ tipo: 'msg', at: m.at || '', i, m }));
  // Orden estable por hora; un mensaje sin hora (el que se está escribiendo) va al final.
  return [...evs, ...ms].map((x, k) => ({ x, k, t: x.at ? Date.parse(x.at) : Infinity })).sort((a, b) => a.t - b.t || a.k - b.k).map((y) => y.x);
}

// Sources: las fuentes que usó cada etapa (sin las que alguien quitó), agrupadas por etapa.
export function fuentes(run) {
  return run.etapas.map((e, n) => ({ n, nombre: e.nombre, xs: (run.evidencia || []).filter((x) => x.etapa === n && !x.quitada) })).filter((g) => g.xs.length);
}

// File tree: las carpetas del trabajo. Inputs (lo que dio el equipo) y Producido (el resultado de cada etapa, como .md).
const nombreArchivo = (n, s) => `${String(n + 1).padStart(2, '0')}-${String(s || 'etapa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}.md`;
export function archivos(run) {
  const inputs = (run.inputs || []).filter((x) => !x.archivado).map((x) => ({ id: x.id, tipo: x.tipo, nombre: x.titulo || x.url || 'Input', url: x.url || '', texto: x.texto || '', meta: x.meta || '' }));
  const producido = run.etapas.map((e, n) => ({ n, e })).filter(({ e }) => e.salida).map(({ n, e }) => ({ n, nombre: nombreArchivo(n, e.nombre), estado: e.estado, texto: e.salida, titulo: leerOutput(e.entrega || e.output, e.nombre).titulo }));
  return [{ carpeta: 'Inputs', items: inputs }, { carpeta: 'Producido', items: producido }];
}
