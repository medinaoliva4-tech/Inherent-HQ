// El Chat en el servidor (PLAN-GATEWAY F3): las mismas funciones que la pantalla del Chat usa con Hermes (hermes.js), pero
// contra la base del OS y el trabajador del VPS. Las conversaciones se guardan en el OS (se retoman desde cualquier compu)
// y la respuesta se escribe en vivo en la base: aquí se relee cada ~0.7 s mientras el servidor responde.
import { api } from './core.js';

export const PROVEEDOR = 'servidor';
const enc = encodeURIComponent;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// El modelo por defecto del Chat en el servidor: rápido y sin razonamiento oculto (PLAN-GATEWAY §9).
const PREFERIDOS = ['deepseek-v4-flash', 'deepseek-v4-pro'];

// → { on, auth, version, servidor: true, modelos } (la misma forma que saludHermes, para que la pantalla no cambie)
export async function saludServidor() {
  try { const j = await api('chat/servidor'); return { on: j.en_linea, auth: j.en_linea, version: j.version, servidor: true, modelos: j.modelos || [] }; }
  catch { return { on: false, auth: false, servidor: true, modelos: [] }; }
}
// → { actual: { provider, model }, proveedores: [{ slug, nombre, listo, actual, modelos }] } (la forma de modelosHermes)
export async function modelosServidor() {
  const j = await api('chat/servidor'), xs = [...(j.modelos || [])].sort((a, b) => (PREFERIDOS.indexOf(a) + 1 || 9) - (PREFERIDOS.indexOf(b) + 1 || 9));
  return { actual: { provider: PROVEEDOR, model: xs[0] || '' }, proveedores: [{ slug: PROVEEDOR, nombre: 'Servidor', listo: Boolean(j.en_linea && xs.length), actual: true, modelos: xs }] };
}
export async function sesionesServidor() { return (await api('chat/sesiones')).sessions || []; }
export const crearSesionServidor = ({ id, titulo }) => api('chat/sesiones', { method: 'POST', body: { id, titulo } });
export async function mensajesServidor(id) { return ((await api('chat/sesiones/' + enc(id))).messages || []).filter((m) => m.content); }
export const borrarSesionServidor = (id) => api('chat/sesiones/' + enc(id), { method: 'DELETE' });
export const ramificarServidor = (id, { nuevoId, titulo }) => api(`chat/sesiones/${enc(id)}/fork`, { method: 'POST', body: { id: nuevoId, titulo } });

// Un turno: lo deja en cola y relee la conversación hasta que el servidor termina. on.delta(texto) con lo que lleva escrito.
// Detenerlo (signal) le avisa al servidor, que corta la respuesta y deja lo que alcanzó a escribir.
export async function turnoServidor(id, { mensaje, sistema, modelo = {}, esfuerzo = '', signal, on = {} }) {
  // Un modelo que no es del servidor (p. ej. el que quedó guardado de Hermes) se cambia por el del servidor por defecto.
  const m = modelo.provider === PROVEEDOR && modelo.model ? modelo.model : (await modelosServidor()).actual.model;
  const { desde } = await api(`chat/sesiones/${enc(id)}/turno`, { method: 'POST', body: { mensaje, sistema, modelo: m, esfuerzo } });
  const detener = () => api(`chat/sesiones/${enc(id)}/detener`, { method: 'POST' }).catch(() => {});
  signal?.addEventListener('abort', detener, { once: true });
  let texto = '', avisoCola = false;
  for (let fallos = 0; ;) {
    if (signal?.aborted) throw Object.assign(new Error('Interrumpido.'), { name: 'AbortError' });
    await espera(texto ? 700 : 900);
    let j;
    try { j = await api(`chat/sesiones/${enc(id)}?desde=${desde}`); fallos = 0; }
    catch (e) { if (++fallos > 8) throw e; continue; } // un corte de red no tumba la respuesta
    const a = (j.messages || []).find((m) => m.role === 'assistant');
    if (a?.content && a.content !== texto) { texto = a.content; on.delta?.(texto); }
    const estado = j.turno?.estado;
    if (estado === 'en_cola' && !avisoCola) { avisoCola = true; on.nota?.('En cola en el servidor…'); }
    if (estado === 'listo') return { texto: a?.content || texto, estado: 'completed' };
    if (estado === 'error') throw new Error(j.turno.error || 'El servidor no pudo responder');
    if (estado === 'detenido') throw Object.assign(new Error('Interrumpido.'), { name: 'AbortError' });
  }
}
