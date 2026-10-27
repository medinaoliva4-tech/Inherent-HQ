// Los clientes de Estrategia (los que ve esta persona), tal como los da /api/estrategia: slug, nombre, nivel, ficha, etapa y
// el estado de sus bloques. La lista única del selector de cliente la arma contexto.js uniendo esto con brandlist.js; aquí
// siguen leyendo strategy.js, consulting.js, llm.js, clients.js, work.js y app.js. Se lee una vez por sesión;
// forgetEstrategia() la vuelve a leer (por ejemplo, al aprobar un bloque).
import { api } from './core.js';

let cache = null, pending = null;
export function loadEstrategia({ force = false } = {}) {
  if (cache && !force) return Promise.resolve(cache);
  if (pending && !force) return pending;
  pending = api('estrategia').then((d) => { cache = d; pending = null; return d; }).catch(() => { pending = null; return (cache ||= { clientes: [], puede: {} }); });
  return pending;
}
export const estrategiaNow = () => cache?.clientes || [];
export const forgetEstrategia = () => { cache = null; pending = null; };
