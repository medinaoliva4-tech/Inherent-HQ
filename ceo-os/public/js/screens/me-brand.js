// Mi marca: la marca personal del CEO, privada. Cuatro pestañas: Roadmap (actividades programables, que también salen en Hoy),
// Asociaciones (moodboard, música, personas y marcas), Inspo (Research por plataforma: IG · TikTok · LinkedIn) y Contenido
// (Ideas · Calendario · Analytics del perfil «personal»). El servidor ya protege el perfil; aquí se repite el guard.
import { html, raw, mount, col, acts, ask, confirmAsk, toast, ico, fdate, today, $, swap } from '../core.js';
import { render as content } from './content.js';
import { brandBoard } from '../brand-board.js';

const TABS = [['roadmap', 'Roadmap'], ['asociaciones', 'Asociaciones'], ['inspo', 'Inspo'], ['contenido', 'Contenido']];
const RTYPES = [['grabar', 'Grabar', 'video'], ['publicar', 'Publicar', 'play'], ['evento', 'Evento', 'cal'], ['aprender', 'Aprender', 'book'], ['otro', 'Otro', 'dot']];
const rtype = (t) => RTYPES.find(([k]) => k === t) || RTYPES[4];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const mlabel = (ym) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(2, 4)}`;
const addM = (ym, n) => { const d = new Date(ym + '-15T12:00'); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 7); };
const isMine = (t, me) => t.tipo === 'Personal' && t.profile === 'personal' && (t._meta?.created_by || t.assignee || '').toLowerCase() === me.email;

export async function render(el, opts) {
  const { me, sub, alive } = opts;
  if (me.role !== 'ceo') return mount(el, html`<div class="empty"><b>Mi marca es solo del CEO</b>Tu perfil no la ve.</div>`);
  const T = col('tasks');
  let tab = TABS.some(([k]) => k === sub[0]) ? sub[0] : 'roadmap';
  let tasks = null, mfilter = today().slice(0, 7);

  function paint() {
    if (!alive()) return;
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Mi marca</h1><p>Tu marca personal: <em>roadmap, asociaciones, inspo y contenido</em>.</p></div><div class="sp"></div><span class="chip dark" title="Solo la ve el CEO: ni la API ni el conector la entregan a nadie más">${ico('lock', 13)} Privado</span></div>
      <div class="tabs" style="margin:0 0 16px">${TABS.map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>
      <div id="cbody" class="swap"></div>`);
    const b = $('#cbody', el);
    if (tab === 'roadmap') return roadmap(b);
    if (tab === 'asociaciones') return brandBoard({ el: b, me, id: 'personal', name: 'Marca personal', edit: true, business: false });
    if (tab === 'inspo') { b.dataset.island = '1'; return content(b, { me, sub: ['research'], alive, fixed: 'personal', embed: { base: '#/mimarca/inspo', only: ['research'], inspo: true, plat: sub[1] } }); }
    if (tab === 'contenido') { b.dataset.island = '1'; return content(b, { me, sub: [sub[1]], alive, fixed: 'personal', embed: { base: '#/mimarca/contenido', only: ['postear', 'calendario', 'analytics'] } }); }
  }

  // ---------- Roadmap: actividades de la marca personal, como tareas Personal (solo las ve quien las creó) ----------
  async function roadmap(b) {
    if (!tasks) { mount(b, html`<p class="loading">Cargando…</p>`); try { tasks = (await T.list()).filter((t) => isMine(t, me)); } catch (e) { return mount(b, html`<div class="empty"><b>No pude leer el roadmap</b>${e.message}</div>`); } if (!alive() || !b.isConnected) return; }
    const open = (t) => (t.status || 'Por empezar') !== 'Hecha';
    const M0 = addM(today().slice(0, 7), -1), months = Array.from({ length: 6 }, (_, i) => addM(M0, i));
    const ofM = (ym) => tasks.filter((t) => String(t.due || '').slice(0, 7) === ym);
    const list = (mfilter === 'todas' ? tasks : ofM(mfilter)).slice().sort((a, z) => String(a.due || '9').localeCompare(String(z.due || '9')));
    const pend = tasks.filter(open).length;
    mount(b, html`<div class="row" style="margin-bottom:14px;flex-wrap:wrap;gap:8px"><span class="mut sm">${tasks.length} actividad${tasks.length === 1 ? '' : 'es'} · ${pend} pendiente${pend === 1 ? '' : 's'} · también salen en Hoy</span><div class="sp"></div><button class="btn" data-act="plan">${ico('plus')} Programar</button></div>
      <div class="rmmonths">${months.map((ym) => { const l = ofM(ym); return html`<button class="rmm ${mfilter === ym ? 'on' : ''} ${ym === today().slice(0, 7) ? 'now' : ''}" data-act="mf" data-m="${ym}"><span class="lbl">${mlabel(ym)}</span><b>${l.length}</b><span class="dots">${l.map((t) => html`<i class="${rtype(t.rtype)[0]}" title="${t.title}"></i>`)}</span></button>`; })}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="chip ${mfilter === 'todas' ? 'dark' : ''}" data-act="mf" data-m="todas">Todas</button>${RTYPES.map(([k, l, i]) => html`<span class="chip">${ico(i, 13)} ${l} · ${tasks.filter((t) => rtype(t.rtype)[0] === k).length}</span>`)}</div>
      <div class="card" style="padding:8px 16px">${list.length ? list.map((t) => html`<div class="rmrow ${open(t) ? '' : 'done'}"><input type="checkbox" data-act="done" data-id="${t.id}" ${open(t) ? '' : raw('checked')}><span class="d">${t.due ? fdate(t.due) : 'sin fecha'}</span><span class="chip">${ico(rtype(t.rtype)[2], 13)} ${rtype(t.rtype)[1]}</span><span class="t"><b style="font-weight:500">${t.title}</b>${t.description ? html`<small>${t.description}</small>` : ''}</span><button class="sm mut" data-act="edit" data-id="${t.id}">${ico('edit')}</button><button class="sm mut" data-act="del" data-id="${t.id}">${ico('x', 16)}</button></div>`)
        : html`<div class="empty" style="margin:10px 0"><b>${mfilter === 'todas' ? 'Sin actividades todavía' : `Nada en ${mlabel(mfilter)}`}</b>Programa una grabación, una publicación, un evento o algo que quieras aprender.</div>`}</div>`);
  }
  const rform = async (t) => ask(t ? 'Editar actividad' : 'Programar actividad', [{ k: 'title', l: 'Qué', v: t?.title, req: true }, { k: 'due', l: 'Fecha', t: 'date', v: t?.due || today(), req: true, half: true }, { k: 'rtype', l: 'Tipo', t: 'select', opts: RTYPES.map(([k, l]) => [k, l]), v: t?.rtype || 'grabar', half: true }, { k: 'status', l: 'Estado', t: 'select', opts: ['Por empezar', 'En curso', 'Hecha'], v: t?.status || 'Por empezar' }, { k: 'description', l: 'Nota', t: 'textarea', v: t?.description }], t ? 'Guardar' : 'Programar');
  const upd = async (t, patch) => { try { const r = await T.save({ ...t, ...patch }); tasks = tasks.map((x) => (x.id === r.id ? r : x)); return r; } catch (e) { toast(e.message, true); return null; } };

  // Inspo, Contenido y Asociaciones son islas: sus botones no le hablan a esta pantalla.
  const island = (map) => Object.fromEntries(Object.entries(map).map(([k, fn]) => [k, (t, e) => { if (t.closest('[data-island]')) return; return fn(t, e); }]));
  acts(el, island({
    tab: (t) => { tab = t.dataset.t; history.replaceState(null, '', `#/mimarca/${tab}`); swap(el, paint); },
    mf: (t) => { mfilter = t.dataset.m; roadmap($('#cbody', el)); },
    plan: async () => {
      const v = await rform(null); if (!v) return;
      try { const r = await T.create({ ...v, tipo: 'Personal', profile: 'personal', assignee: me.email, accountable: '', project_id: '', visibility: 'all', viewers: [], checklist: [], comments: [] }); tasks = [...tasks, r]; mfilter = r.due.slice(0, 7); toast('Programada · también la ves en Hoy'); roadmap($('#cbody', el)); } catch (e) { toast(e.message, true); }
    },
    edit: async (t) => { const x = tasks.find((y) => y.id === t.dataset.id); if (!x) return; const v = await rform(x); if (!v) return; if (await upd(x, v)) { toast('Guardado'); roadmap($('#cbody', el)); } },
    del: async (t) => { const x = tasks.find((y) => y.id === t.dataset.id); if (!x || !(await confirmAsk(`¿Quitar «${x.title}» del roadmap?`))) return; try { await T.remove(x.id); tasks = tasks.filter((y) => y.id !== x.id); roadmap($('#cbody', el)); } catch (e) { toast(e.message, true); } },
  }));
  acts(el, { done: async (cb) => { const x = tasks.find((y) => y.id === cb.dataset.id); if (!x) return; const r = await upd(x, { status: cb.checked ? 'Hecha' : 'Por empezar' }); if (r) roadmap($('#cbody', el)); else cb.checked = !cb.checked; } }, 'change');
  paint();
}
