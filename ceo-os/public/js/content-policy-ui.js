import { api, ask } from './core.js';
import { necesitaOrigen } from './content-reglas.js';
// Una decisión explícita; el servidor comprueba de nuevo versión, marca, aprobación y cadena.
export async function prepararContenido(data) {
  if (!necesitaOrigen(data) || data.viene_de?.length) return data;
  const { items = [] } = await api(`content/origenes?profile=${encodeURIComponent(data.profile || '')}`);
  if (!items.length) throw new Error('Falta un origen aprobado que trace hasta el cliente ideal. Apruébalo en Strategy antes de producir.');
  const r = await ask('¿De qué versión aprobada nace?', [{ k: 'origen', l: 'Origen aprobado', t: 'select', req: true, opts: items.map((x) => [x.id, `${x.titulo} · versión ${x.version}`]) }], 'Usar esta versión');
  if (!r) throw Object.assign(new Error('Guardado cancelado'), { code: 'CANCELADO' });
  const d = items.find((x) => x.id === r.origen);
  return { ...data, viene_de: [{ id: d.id, version: d.version }] };
}
