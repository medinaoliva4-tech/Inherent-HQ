// Clic derecho en todo el OS, solo donde ahorra pasos: tareas, proyectos, clientes, leads y las respuestas del chat de
// Estrategia. En lo demás queda el menú normal del navegador. Reusa el menú de la Library (library-ui.js › ctxMenu).
// Mover un lead de etapa no va aquí: tiene sus candados (siguiente paso y fecha), así que se abre el lead.
import { col, ask, toast } from './core.js';
import { ctxMenu } from './library-ui.js';

const copiar = async (t, que = 'Copiado') => { try { await navigator.clipboard.writeText(t); toast(que); } catch { toast('No pude copiar', true); } };
const link = (h) => location.origin + location.pathname + h;
// Volver a pintar la pantalla con lo nuevo.
const refrescar = () => dispatchEvent(new HashChangeEvent('hashchange'));
const hoy = () => new Date().toISOString().slice(0, 10);

async function guardar(coll, id, cambio, ok) {
  try { const d = await col(coll).get(id); await col(coll).save({ ...d, ...cambio(d) }); toast(ok); refrescar(); } catch (e) { toast(e.message, true); }
}

function tarea(el, me) {
  const id = el.dataset.id;
  return [
    { l: 'Abrir', run: () => el.click() },
    { l: 'Marcar como hecha', run: () => guardar('tasks', id, () => ({ status: 'Hecha' }), 'Tarea hecha') },
    { l: 'Asignármela', run: () => guardar('tasks', id, () => ({ assignee: me.email }), 'Ahora es tuya') },
    { l: 'Cambiar fecha…', run: async () => { const d = await col('tasks').get(id).catch(() => null); const v = await ask('Nueva fecha de entrega', [{ k: 'due', l: 'Fecha', t: 'date', v: d?.due || hoy(), req: true }]); if (v) guardar('tasks', id, () => ({ due: v.due }), 'Fecha cambiada'); } },
  ];
}

function proyecto(id) {
  const h = `#/operations/p/${encodeURIComponent(id)}`;
  return [
    { l: 'Abrir', run: () => { location.hash = h; } },
    { l: 'Cambiar fase…', run: async () => {
      const p = await col('projects').get(id).catch(() => null); const fs = p?.phases || [];
      if (!fs.length) return toast('Este proyecto no tiene fases', true);
      const v = await ask('¿En qué fase va?', [{ k: 'f', l: 'Fase actual', t: 'select', opts: fs.map((f, i) => [String(i), f.name]), v: String(Math.max(0, fs.findIndex((f) => f.status === 'now'))) }]);
      if (!v) return; const n = +v.f;
      guardar('projects', id, () => ({ phases: fs.map((f, i) => ({ ...f, status: i < n ? 'done' : i === n ? 'now' : f.status === 'done' || f.status === 'now' ? '' : f.status })) }), `Fase: ${fs[n].name}`);
    } },
    '-', { l: 'Copiar link', run: () => copiar(link(h), 'Link copiado') },
  ];
}

function cliente(slug) {
  const h = `#/clients/${slug}`;
  return [
    { l: 'Abrir perfil', run: () => { location.hash = h; } },
    { l: 'Abrir su Estrategia', run: () => { location.hash = `#/estrategia/${slug}`; } },
    { l: 'Abrir su Marca', run: () => { location.hash = `#/marcas/${slug}`; } },
    '-', { l: 'Copiar link', run: () => copiar(link(h), 'Link copiado') },
  ];
}

async function lead(el, me) {
  const id = el.dataset.id, l = await col('leads').get(id).catch(() => null);
  return [
    { l: 'Abrir (mover de etapa)', run: () => el.click() },
    { l: 'Anotar actividad…', run: async () => { const v = await ask(`Anotar en ${l?.name || 'el lead'}`, [{ k: 'text', l: 'Qué pasó', t: 'textarea', req: true }]); if (v) guardar('leads', id, (d) => ({ activity: [...(d.activity || []), { at: new Date().toISOString(), who: me.name, text: v.text }] }), 'Anotado'); } },
    '-', { l: 'Copiar teléfono', off: !l?.phone, run: () => copiar(l.phone, 'Teléfono copiado') },
    { l: 'Copiar correo', off: !l?.email, run: () => copiar(l.email, 'Correo copiado') },
  ];
}

function respuesta(el) {
  const texto = (el.querySelector('.es-b')?.innerText || '').trim(), guardarBtn = el.querySelector('[data-act="guardar"]');
  return [
    { l: 'Copiar', run: () => copiar(texto) },
    { l: 'Guardar como borrador del bloque', off: !guardarBtn, run: () => guardarBtn.click() },
    { l: 'Preguntar más sobre esto', run: () => { const ta = document.querySelector('#es-in'); if (!ta) return; ta.value = `Sobre esto: «${texto.slice(0, 160)}${texto.length > 160 ? '…' : ''}» — `; ta.focus(); ta.dispatchEvent(new Event('input')); } },
  ];
}

export function instalarMenu(me) {
  document.addEventListener('contextmenu', async (e) => {
    if (e.target.closest('input, textarea, [contenteditable], .lib-menu, [data-ctx]')) return; // texto y la Library tienen el suyo
    const t = e.target.closest('[data-act="task"][data-id], [data-act="lead"][data-id], a[href^="#/operations/p/"], a[href^="#/clients/"], .es-m.a');
    if (!t) return;
    let items = null;
    if (t.matches('[data-act="task"]')) items = tarea(t, me);
    else if (t.matches('[data-act="lead"]')) { e.preventDefault(); items = await lead(t, me); }
    else if (t.matches('.es-m.a')) { if (!t.querySelector('.es-b')?.innerText.trim()) return; items = respuesta(t); }
    else { const h = t.getAttribute('href'); const p = /^#\/operations\/p\/([^/]+)/.exec(h), c = /^#\/clients\/([\w-]+)$/.exec(h); if (p) items = proyecto(decodeURIComponent(p[1])); else if (c) items = cliente(c[1]); }
    if (!items) return;
    e.preventDefault(); ctxMenu(e.clientX, e.clientY, items);
  });
}
