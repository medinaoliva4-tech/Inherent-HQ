// Los clientes del espacio Estrategia (los que ve esta persona). Los leen la barra de Estrategia, su pantalla de inicio y el
// buscador (Ir a). Se leen una vez por sesión; forgetEstrategia() los vuelve a leer (por ejemplo, al aprobar un bloque).
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
