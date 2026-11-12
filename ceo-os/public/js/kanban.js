// Un solo Kanban de tareas para toda la app: Proyectos (todas), la página de un proyecto (las de ese proyecto)
// y el Workspace de cada persona (las suyas). Mismo componente, distinto filtro.
// Columnas por estado (los estados de siempre de db/tasks); las tarjetas se arrastran entre columnas y guardan el estado.
// Arrastrar: con el mouse, al mover; en el cel, manteniendo el dedo un momento (así deslizar sigue sirviendo para moverse).
//
// taskKanban(box, {
//   tasks: () => [...],            las tareas (función: quien llama reemplaza su arreglo al guardar)
//   projects, team, me,
//   scope: (t) => bool,            el filtro fijo (ej. solo las de este proyecto, solo las mías)
//   show: { project, person },     qué filtros se ven arriba (chips de proyecto · responsable)
//   key: 'ops',                    dónde se recuerda el filtro elegido (en este navegador)
//   edit: true,                    se puede arrastrar
//   save: async (t, patch) => t|null,
//   open: (t) => …,                al tocar una tarjeta
//   add: (status, { project }) => …,  «+ Tarea» (opcional)
//   changed: () => …,              después de mover una tarjeta (ej. repintar el avance)
// }) → { paint }
import { html, raw, mount, fdate, today, initials, toast, ico, $, $$ } from './core.js';

export const DEPTS = [['①', 'Strategy'], ['②', 'Growth'], ['②B', 'Branding'], ['③', 'Marketing'], ['④', 'Creatividad'], ['⑤', 'Producción'], ['⑥A', 'Diseño gráfico'], ['⑦', 'Video Editing'], ['⑧', 'Community'], ['⑨', 'Posting'], ['⑩', 'Ads']];
// Las columnas: [estado guardado, cómo se llama en pantalla].
export const KCOLS = [['Por empezar', 'Por empezar'], ['En curso', 'En proceso'], ['En revisión', 'En revisión'], ['Hecha', 'Listo']];
const DONE_SHOW = 12;

// El departamento siempre con número y nombre («③ Marketing», nunca «③» solo).
export function deptLabel(d) {
  const s = String(d || '').trim(); if (!s) return '';
  const hit = [...DEPTS].sort((a, z) => z[0].length - a[0].length).find(([n]) => s === n || s.startsWith(n + ' ') || (s.startsWith(n) && !/^[A-Z]/.test(s.slice(n.length))));
  return hit ? `${hit[0]} ${hit[1]}` : s;
}

const lsGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export function taskKanban(box, o) {
  const { projects = [], team = [], me = {}, scope = () => true, show = {}, key = 'k', edit = true } = o;
  const LP = `kb.${key}.p.${me.email || ''}`, LW = `kb.${key}.w.${me.email || ''}`;
  let fp = show.project ? lsGet(LP, '') : '', fw = show.person ? lsGet(LW, '') : '', allDone = false, suppress = false;
  const person = (k) => team.find((x) => x.id === k || x.email === k);
  const proj = (id) => projects.find((p) => p.id === id);
  const st = (t) => t.status || 'Por empezar';
  const T = () => today();
  const av = (k) => { const p = person(k), n = p?.name || (k ? String(k).split('@')[0] : '');
    if (!k) return html`<span class="kb-av none" title="Sin responsable">${ico('user', 12)}</span>`;
    return p?.picture ? html`<img class="kb-av" src="${p.picture}" alt="" title="${n}" referrerpolicy="no-referrer">` : html`<span class="kb-av" title="${n}" style="${p?.color ? `background:${p.color}` : ''}">${initials(n)}</span>`; };

  const scoped = () => o.tasks().filter(scope);
  const filtered = () => scoped().filter((t) => (!fp || (fp === '_' ? !t.project_id : t.project_id === fp)) && (!fw || (fw === '_' ? !t.assignee : fw === 'me' ? t.assignee === me.email : t.assignee === fw)));

  const card = (t) => {
    const p = proj(t.project_id), s = st(t), late = t.due && t.due < T() && s !== 'Hecha', dl = deptLabel(t.dept), who = person(t.assignee);
    return html`<div class="kb-card ${late ? 'late' : ''} ${edit ? 'drag' : ''}" data-kid="${t.id}" tabindex="0" role="button" aria-label="${t.title}${late ? ' · vencida' : ''}">
      <b class="kb-t">${t.title}</b>
      <div class="kb-meta"><span class="kb-cli">${p ? p.client || p.name : 'Interno'}</span>${dl ? html`<span class="kb-dept">${dl}</span>` : ''}</div>
      <div class="kb-foot">${av(t.assignee)}<span class="kb-who">${who ? who.name.split(' ')[0] : t.assignee ? String(t.assignee).split('@')[0] : 'Sin responsable'}</span><span class="kb-sp"></span>${t.due ? html`<span class="kb-due">${late ? 'Venció ' : ''}${fdate(t.due)}</span>` : ''}</div></div>`;
  };

  function bar() {
    const all = scoped(), chips = [];
    if (show.project) {
      const ids = new Set(all.map((t) => t.project_id || '_'));
      const list = projects.filter((p) => ids.has(p.id));
      if (fp && fp !== '_' && !list.some((p) => p.id === fp)) fp = '';
      chips.push(html`<div class="kb-chips" role="group" aria-label="Filtrar por proyecto"><button class="kb-chip ${!fp ? 'on' : ''}" data-kf="p" data-v="">Todos</button>${list.map((p) => html`<button class="kb-chip ${fp === p.id ? 'on' : ''}" data-kf="p" data-v="${p.id}" title="${p.client && p.client !== p.name ? `${p.client} · ${p.name}` : p.name}">${p.name}</button>`)}${ids.has('_') ? html`<button class="kb-chip ${fp === '_' ? 'on' : ''}" data-kf="p" data-v="_">Interno</button>` : ''}</div>`);
    }
    let sel = '';
    if (show.person) {
      const ks = [...new Set(all.map((t) => t.assignee).filter(Boolean))].map((k) => [k, person(k)?.name || String(k).split('@')[0]]).sort((a, z) => a[1].localeCompare(z[1]));
      if (fw && !['me', '_'].includes(fw) && !ks.some(([k]) => k === fw)) fw = '';
      sel = html`<label class="kb-who-sel">${ico('user', 14)}<select class="in" data-kf="w" aria-label="Filtrar por responsable"><option value="">Todos</option>${me.email ? html`<option value="me" ${fw === 'me' ? raw('selected') : ''}>Yo</option>` : ''}${ks.filter(([k]) => k !== me.email).map(([k, n]) => html`<option value="${k}" ${fw === k ? raw('selected') : ''}>${n}</option>`)}<option value="_" ${fw === '_' ? raw('selected') : ''}>Sin responsable</option></select></label>`;
    }
    const open = filtered().filter((t) => st(t) !== 'Hecha').length;
    const pr = fp && fp !== '_' && o.openProject ? proj(fp) : null;
    return html`<div class="kb-bar">${chips}<div class="kb-tools">${sel}<span class="kb-count">${open} ${open === 1 ? 'abierta' : 'abiertas'}</span>${pr ? html`<button class="btn ghost sm" data-kact="openp">Abrir ${pr.name} ${ico('right', 13)}</button>` : ''}</div></div>`;
  }

  function paint() {
    const list = filtered(), T0 = T();
    const by = Object.fromEntries(KCOLS.map(([s]) => [s, []])); list.forEach((t) => (by[st(t)] || by['Por empezar']).push(t));
    const byDue = (a, z) => String(a.due || '9').localeCompare(String(z.due || '9')) || String(a.title).localeCompare(String(z.title));
    Object.entries(by).forEach(([s, l]) => l.sort(s === 'Hecha' ? (a, z) => String(z.done_at || z._meta?.updated_at || '').localeCompare(String(a.done_at || a._meta?.updated_at || '')) : byDue));
    const keepX = $('.kb-board', box)?.scrollLeft || 0;
    mount(box, html`<div class="kb">${bar()}
      <div class="kb-board" role="list">${KCOLS.map(([s, l]) => { const ts = by[s], cut = s === 'Hecha' && !allDone && ts.length > DONE_SHOW, late = s !== 'Hecha' ? ts.filter((t) => t.due && t.due < T0).length : 0;
        return html`<section class="kb-col" data-st="${s}" role="listitem" aria-label="${l}">
          <header class="kb-h"><i class="kb-dot s${KCOLS.findIndex(([x]) => x === s)}"></i><b>${l}</b><span class="kb-n">${ts.length}</span>${late ? html`<span class="kb-late" title="${late} vencidas">${late} vencida${late === 1 ? '' : 's'}</span>` : ''}</header>
          <div class="kb-list">${(cut ? ts.slice(0, DONE_SHOW) : ts).map(card)}${!ts.length ? html`<div class="kb-empty">Nada aquí</div>` : ''}
            ${cut ? html`<button class="kb-more" data-kact="more">Ver las ${ts.length} listas</button>` : ''}
            ${o.add && s === 'Por empezar' ? html`<button class="kb-add" data-kact="add" data-s="${s}">${ico('plus', 14)} Tarea</button>` : ''}</div></section>`; })}</div></div>`);
    const b = $('.kb-board', box); if (b && keepX) b.scrollLeft = keepX;
  }

  // ---------- filtros, abrir, agregar ----------
  box.addEventListener('click', (e) => {
    if (suppress) { e.preventDefault(); e.stopPropagation(); return; }
    const f = e.target.closest('button[data-kf="p"]'); if (f) { fp = f.dataset.v; lsSet(LP, fp); return paint(); }
    const a = e.target.closest('[data-kact]');
    if (a) { const k = a.dataset.kact; if (k === 'more') { allDone = true; return paint(); } if (k === 'add') return o.add?.(a.dataset.s, { project: fp && fp !== '_' ? fp : '' }); if (k === 'openp') return o.openProject?.(fp); return; }
    const c = e.target.closest('.kb-card'); if (c) { const t = o.tasks().find((x) => x.id === c.dataset.kid); if (t) o.open?.(t); }
  }, true);
  box.addEventListener('change', (e) => { const s = e.target.closest('select[data-kf="w"]'); if (s) { fw = s.value; lsSet(LW, fw); paint(); } });
  box.addEventListener('keydown', (e) => { const c = e.target.closest?.('.kb-card'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); c.click(); } });

  // ---------- arrastrar entre columnas (mouse y touch) ----------
  if (edit) box.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.kb-card'); if (!c || !box.contains(c) || e.button !== 0) return;
    const touch = e.pointerType !== 'mouse', x0 = e.clientX, y0 = e.clientY;
    let d = null, timer = null, last = e, raf = 0;
    const begin = () => {
      const r = c.getBoundingClientRect(), g = c.cloneNode(true);
      g.classList.add('kb-ghost'); g.removeAttribute('tabindex'); Object.assign(g.style, { width: r.width + 'px', left: r.left + 'px', top: r.top + 'px' });
      document.body.append(g); c.classList.add('kb-dragging'); document.documentElement.classList.add('kb-drag');
      d = { g, dx: x0 - r.left, dy: y0 - r.top, col: null }; if (touch) navigator.vibrate?.(8);
      place(last);
    };
    const colAt = (ev) => { d.g.style.display = 'none'; const el = document.elementFromPoint(ev.clientX, ev.clientY); d.g.style.display = ''; return el?.closest('.kb-col') || null; };
    const place = (ev) => {
      d.g.style.transform = `translate(${ev.clientX - x0}px, ${ev.clientY - y0}px) rotate(1.5deg)`;
      const col = colAt(ev); if (col !== d.col) { $$('.kb-col.over', box).forEach((k) => k.classList.remove('over')); if (col && box.contains(col)) col.classList.add('over'); d.col = col && box.contains(col) ? col : null; }
      // Cerca del borde, el tablero se desliza solo (en el cel las columnas no caben todas).
      const b = $('.kb-board', box), br = b?.getBoundingClientRect();
      cancelAnimationFrame(raf);
      if (b && br && b.scrollWidth > b.clientWidth) { const edge = 48, v = ev.clientX < br.left + edge ? -14 : ev.clientX > br.right - edge ? 14 : 0;
        if (v) { const step = () => { b.scrollLeft += v; place2(); raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); } }
    };
    const place2 = () => { const col = colAt(last); if (col !== d.col) { $$('.kb-col.over', box).forEach((k) => k.classList.remove('over')); if (col && box.contains(col)) col.classList.add('over'); d.col = col && box.contains(col) ? col : null; } };
    const mv = (ev) => {
      last = ev; const dist = Math.hypot(ev.clientX - x0, ev.clientY - y0);
      if (!d) { if (touch) { if (dist > 8) end(); return; } if (dist < 5) return; begin(); }
      ev.preventDefault(); place(ev);
    };
    const tm = (ev) => { if (d) ev.preventDefault(); };
    const end = async (ev) => {
      clearTimeout(timer); cancelAnimationFrame(raf);
      removeEventListener('pointermove', mv); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); removeEventListener('touchmove', tm); c.removeEventListener('contextmenu', cm);
      if (!d) return;
      const { g, col } = d; d = null; g.remove(); c.classList.remove('kb-dragging'); document.documentElement.classList.remove('kb-drag'); $$('.kb-col.over', box).forEach((k) => k.classList.remove('over'));
      suppress = true; setTimeout(() => { suppress = false; }, 0);
      if (!ev || ev.type === 'pointercancel' || !col) return;
      const t = o.tasks().find((x) => x.id === c.dataset.kid), to = col.dataset.st;
      if (!t || !to || to === st(t)) return;
      c.classList.add('kb-saving'); col.querySelector('.kb-list')?.prepend(c);
      const r = await o.save(t, { status: to });
      if (r) toast(`${t.title} → ${KCOLS.find(([s]) => s === to)[1]}`);
      paint(); o.changed?.();
    };
    const cm = (ev) => { if (touch) ev.preventDefault(); };
    if (touch) { timer = setTimeout(begin, 380); c.addEventListener('contextmenu', cm); }
    addEventListener('pointermove', mv, { passive: false }); addEventListener('pointerup', end); addEventListener('pointercancel', end); addEventListener('touchmove', tm, { passive: false });
  });

  paint();
  return { paint, project: () => (fp && fp !== '_' ? fp : '') };
}
