// Página pública de aprobación (aprobar.html#t=<token>): sin cuenta, una sola respuesta. El token vive en el fragmento de la URL
// (no llega a registros ni al Referer), se manda en el CUERPO y se borra de la barra al cargar. Muestra solo lo que el servidor permite.
const app = document.getElementById('app');
const H = { 'content-type': 'application/json', 'x-ceoos': '1' };
const token = new URLSearchParams(location.hash.slice(1)).get('t') || '';
history.replaceState(null, '', location.pathname);
const el = (tag, attrs = {}, ...hijos) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); } n.append(...hijos.flat().filter((x) => x != null)); return n; };
const pinta = (...hijos) => app.replaceChildren(el('p', { class: 'marca' }, 'INHERENT'), ...hijos);
const aviso = (texto, tipo = '') => el('p', { class: `estado ${tipo}`.trim(), role: tipo === 'mal' ? 'alert' : 'status' }, texto);
const post = async (ruta, cuerpo) => { const r = await fetch(`/api/portal/aprobacion/${ruta}`, { method: 'POST', headers: H, body: JSON.stringify(cuerpo) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(j.error || 'No se pudo completar.'), { code: j.code }); return j; };

async function responder(accion, nota, botones) {
  botones.forEach((b) => { b.disabled = true; });
  try { const r = await post('responder', { token, accion, nota }); pinta(el('div', { class: 'tarjeta' }, el('h1', {}, r.mensaje), el('p', { class: 'sub' }, 'Ya puedes cerrar esta página.'))); }
  catch (e) { pinta(aviso(e.message, 'mal')); }
}
async function iniciar() {
  if (!token) return pinta(aviso('Este enlace no sirve. Pídele a Inherent uno nuevo.', 'mal'));
  let v; try { v = await post('ver', { token }); } catch (e) { return pinta(aviso(e.message, 'mal')); }
  const nota = el('textarea', { id: 'nota', 'aria-label': 'Qué hay que cambiar', placeholder: '¿Qué hay que cambiar?', hidden: '' });
  const aprobar = el('button', { type: 'button', class: 'primario' }, 'Aprobar'), cambios = el('button', { type: 'button' }, 'Pedir cambios'), enviar = el('button', { type: 'button', hidden: '', class: 'primario' }, 'Enviar cambios');
  const todos = [aprobar, cambios, enviar];
  aprobar.addEventListener('click', () => responder('aprobar', '', todos));
  cambios.addEventListener('click', () => { nota.hidden = false; enviar.hidden = false; cambios.hidden = true; aprobar.hidden = true; nota.focus(); });
  enviar.addEventListener('click', () => { if (!nota.value.trim()) { nota.focus(); return; } responder('cambios', nota.value, todos); });
  pinta(el('div', { class: 'tarjeta' }, el('h1', {}, v.titulo || 'Tu pieza'), el('p', { class: 'sub' }, [v.herramienta, `versión ${v.version}`, v.marca].filter(Boolean).join(' · '))),
    el('div', { class: 'acciones' }, aprobar, cambios, nota, enviar), el('p', { class: 'sub' }, 'Tu respuesta se envía una sola vez.'));
}
iniciar();
