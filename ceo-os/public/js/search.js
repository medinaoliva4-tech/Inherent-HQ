// El buscador global (⌘K / Ctrl+K, o la lupa de la barra): un sheet tipo Spotlight sobre cualquier pantalla.
// Sin texto muestra «Ir a» (las secciones y las marcas que ve tu perfil). Con texto, además, busca en el servidor
// (GET /api/search, con el mismo alcance que las listas). Resultados agrupados por tipo, con su estado; ↑↓ y Enter abre.
import { html, raw, mount, api, ico } from './core.js';
import { ESTADO_CLS } from './element.js';

const TYPES = {
  hacer: ['Hacer', 'zap'], ir: ['Ir a', 'right'], cliente: ['Clientes', 'users'], proyecto: ['Proyectos', 'layers'], tarea: ['Tareas', 'check'], lead: ['Leads', 'megaphone'],
  cotizacion: ['Cotizaciones', 'doc'], servicio: ['Servicios', 'tool'], paquete: ['Paquetes', 'puzzle'], doc: ['Library', 'folder'], research: ['Research', 'search'], idea: ['Ideas', 'bulb'],
};
const ORDER = Object.keys(TYPES);
const fold = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tone = (s) => (s in ESTADO_CLS ? ESTADO_CLS[s] : /hecha|aceptada|pagad|ganad/i.test(s) ? 'green' : /revisi|enviada|propuesta|curso/i.test(s) ? 'amber' : /atrasad|perdid|vencid|rechaz/i.test(s) ? 'red' : '');

let live = null; // el buscador abierto (solo uno)
// «Hacer»: acciones de un toque (no solo ir a una pantalla). Las que crean algo abren su propio diálogo; nada se envía solo.
// Cada una: { title, sub, route } o { title, sub, run } (run se llama después de cerrar el buscador).
export function accionesDe(me, { slug = '' } = {}) {
  if (!me || me.role === 'client') return [];
  const a = [
    { title: 'Crear una tarea', sub: 'Con responsable y fecha', icon: '', run: async () => { const [{ newTask }, core] = await Promise.all([import('./create.js'), import('./core.js')]); const [team, projects] = await Promise.all([core.teamList().catch(() => []), core.col('projects').list().catch(() => [])]); const t = await newTask({ team, me, projects, pre: { assignee: me.email } }); if (t) core.toast('Tarea creada'); } },
    { title: 'Nuevo lote de leads', sub: 'Describe a tu cliente ideal y pega prospectos', route: '#/revenue/nuevo' },
    { title: 'Ideas de contenido', sub: 'Lo que funciona en el nicho, listo para grabar', route: '#/studio/ideas' },
    { title: 'Construir un agente', sub: 'Cuéntalo en una frase y se arma el borrador', route: '#/sistemas', antes: () => { try { sessionStorage.setItem('sa.abrir-ia', '1'); } catch {} } },
    { title: 'Nuevo workflow', sub: 'Pasos y aprobaciones, como borrador', route: '#/sistemas/workflows' },
    { title: 'Curva de retención de un guion', sub: 'Dónde se cae la gente y qué cambiar', route: '#/studio/retencion' },
    { title: 'Modo rodaje', sub: 'El shot list del día, escena por escena', route: '#/studio/rodaje' },
    { title: 'Presentación del día 20', sub: 'Lo aprobado del ciclo, a pantalla completa', route: '#/studio/presentacion' },
    ...(slug && slug !== 'personal' ? [{ title: 'Pegar lo que se habló', sub: `Sala de ${slug}: compromisos con su cita`, route: `#/clients/${slug}/sala` }] : []),
    { title: 'Vincular Telegram', sub: 'Decide desde el teléfono', route: '#/ajustes/canales' },
  ];
  return a.map((x) => ({ ...x, type: 'hacer', route: x.route || '#' }));
}
// jump(): [{ title, sub, route, icon }] — a dónde se puede ir sin buscar (lo arma app.js con lo que ve el perfil).
export function openSearch({ jump = () => [], acciones = () => [] } = {}) {
  if (live) { live.input.focus(); live.input.select(); return; }
  const back = document.activeElement;
  const veil = document.createElement('div'); veil.className = 'spot-veil';
  mount(veil, html`<div class="spot" role="dialog" aria-modal="true" aria-label="Buscar en Inherent OS">
    <div class="spot-in">${ico('search', 20)}<input id="spotq" type="search" placeholder="Busca o haz algo: «nuevo lote», un cliente, una tarea…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="spotr" aria-autocomplete="list"><kbd class="spot-esc" data-x>esc</kbd></div>
    <div class="spot-r" id="spotr" role="listbox" aria-label="Resultados"></div>
    <div class="spot-foot"><span><kbd>↑</kbd><kbd>↓</kbd> moverte</span><span><kbd>↵</kbd> abrir</span><span><kbd>esc</kbd> cerrar</span></div></div>`);
  document.body.append(veil);
  document.documentElement.classList.add('spot-open');
  const input = veil.querySelector('#spotq'), box = veil.querySelector('#spotr');
  let rows = [], sel = 0, seq = 0, t = null, server = null, loading = false, failed = false;
  live = { input };
  requestAnimationFrame(() => veil.classList.add('on'));
  input.focus();

  const close = () => {
    if (!live) return; live = null; clearTimeout(t);
    document.documentElement.classList.remove('spot-open');
    veil.classList.remove('on'); setTimeout(() => veil.remove(), 180);
    document.removeEventListener('keydown', onKey, true);
    if (back && back.isConnected && back !== document.body) try { back.focus({ preventScroll: true }); } catch {}
  };
  const go = (r) => { if (!r) return; close(); if (r.run) { Promise.resolve(r.run()).catch(() => {}); return; } r.antes?.(); if (location.hash !== r.route) location.hash = r.route.replace(/^#/, ''); else if (r.antes) window.dispatchEvent(new HashChangeEvent('hashchange')); };

  function paint() {
    const q = input.value.trim(), f = fold(q);
    const pasa = (j) => !f || f.split(/\s+/).every((w) => fold(`${j.title} ${j.sub || ''}`).includes(w));
    const hacer = acciones().filter(pasa).slice(0, q ? 4 : 6);
    const jumps = jump().filter(pasa).slice(0, q ? 5 : 8).map((j) => ({ ...j, type: 'ir' }));
    rows = [...hacer, ...jumps, ...(q ? server || [] : [])];
    sel = Math.min(sel, Math.max(0, rows.length - 1));
    const groups = ORDER.map((k) => [k, rows.filter((r) => r.type === k)]).filter(([, l]) => l.length);
    let i = -1;
    mount(box, html`${groups.map(([k, l]) => html`<div class="spot-g" role="group" aria-label="${TYPES[k][0]}"><div class="spot-gh">${TYPES[k][0]}<span>${l.length}</span></div>
      ${l.map((r) => { i++; return html`<a class="spot-row ${i === sel ? 'on' : ''}" role="option" id="spo-${i}" aria-selected="${i === sel ? 'true' : 'false'}" href="${r.route}" data-i="${i}">
        <span class="spot-ic">${r.icon ? raw(String(r.icon)) : ico(TYPES[r.type]?.[1] || 'dot', 16)}</span>
        <span class="spot-t"><b>${r.title}</b>${r.sub ? html`<small>${r.sub}</small>` : ''}</span>
        ${r.status ? html`<span class="chip sm2 ${tone(r.status)}">${r.status}</span>` : ''}<span class="spot-go" aria-hidden="true">↵</span></a>`; })}</div>`)}
      ${q && loading && !server ? html`<p class="loading sm">Buscando…</p>` : ''}
      ${q && !loading && !rows.length ? html`<div class="spot-none"><b>${failed ? 'No pude buscar ahora' : `Nada con «${q}»`}</b><span class="mut">${failed ? 'Revisa tu conexión e inténtalo de nuevo.' : 'Prueba con otra palabra: un cliente, un lead, una tarea o una idea.'}</span></div>` : ''}`);
    input.setAttribute('aria-activedescendant', rows.length ? `spo-${sel}` : '');
    box.querySelector('.spot-row.on')?.scrollIntoView({ block: 'nearest' });
  }
  const ask = () => {
    const q = input.value.trim(); clearTimeout(t);
    if (!q) { server = null; loading = false; failed = false; return paint(); }
    loading = true; server = null; paint();
    const n = ++seq;
    t = setTimeout(() => api('search?q=' + encodeURIComponent(q)).then((r) => { if (n !== seq || !live) return; server = r.items || []; failed = false; })
      .catch(() => { if (n !== seq || !live) return; server = []; failed = true; })
      .finally(() => { if (n !== seq || !live) return; loading = false; paint(); }), 140);
  };
  function onKey(e) {
    if (!live) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return close(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!rows.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length; paint(); return; }
    if (e.key === 'Enter') { e.preventDefault(); return go(rows[sel]); }
    if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
  }
  document.addEventListener('keydown', onKey, true);
  input.addEventListener('input', () => { sel = 0; ask(); });
  veil.addEventListener('mousedown', (e) => { if (e.target === veil) close(); });
  veil.addEventListener('click', (e) => {
    if (e.target.closest('[data-x]')) return close();
    const a = e.target.closest('.spot-row'); if (!a) return;
    e.preventDefault(); go(rows[+a.dataset.i]);
  });
  box.addEventListener('mousemove', (e) => { const a = e.target.closest('.spot-row'); if (!a || +a.dataset.i === sel) return; sel = +a.dataset.i; box.querySelectorAll('.spot-row').forEach((x) => { const on = +x.dataset.i === sel; x.classList.toggle('on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); }); input.setAttribute('aria-activedescendant', `spo-${sel}`); });
  paint();
}
export const searchOpen = () => Boolean(live);
