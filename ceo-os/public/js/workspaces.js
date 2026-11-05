// Los workspaces de la esquina superior (PLAN-GATEWAY §22): Inherent OS y el Chat. Qué abre cada persona lo decide su rol:
// el OS entra donde el CEO lo fijó en Vistas por rol (me.start) y un cliente no ve el selector. Puro y sin pantalla.
export function workspacesDe(me = {}, { verChat = false, rutaOS = 'home' } = {}) {
  if (me.role === 'client') return [];
  const xs = [{ id: 'os', nombre: 'Inherent OS', sub: 'Gestión de tu rol', ruta: rutaOS }];
  if (verChat) xs.push({ id: 'chat', nombre: 'Inherent Chat', sub: 'Conversaciones y agentes', ruta: 'chat' });
  return xs;
}
// A dónde vuelve el OS desde el Chat: la pantalla donde estabas o, si no hay, el inicio de tu rol.
export const rutaDeVuelta = (ultima, inicio) => (ultima && !/^chat(\/|$)/.test(ultima) ? ultima : inicio);
export const esApp = (clave) => (clave === 'chat' ? 'chat' : 'os');
