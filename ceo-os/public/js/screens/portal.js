// El portal del cliente, como el dashboard de la web: Resumen · Contenido · Entregas · Metas.
// Todo sale de /api/portal (el servidor decide qué se ve). Lo que no tiene dato dice «—» y qué falta conectar: nunca un número inventado.
// Intel («Entregables» de estrategia) NO se muestra aquí: es información del cliente, pero no para el cliente.
import { html, raw, mount, api, toast, fdate, fdateLong, K, $, $$, ico, initials, ask, confirmAsk, embedUrl } from '../core.js';
import { reloj } from '../video.js';
import { estadoDe } from '../element.js';
import { fallo } from '../visual.js';

const ST = { 'Entregado': 'green', 'En revisión': 'amber', 'En curso': 'lime', 'Por empezar': '' };
const lvName = (lv) => (!lv ? '' : lv <= 4 ? 'Entrega básica' : lv <= 6 ? 'Entrega sencilla' : lv >= 9 ? 'Entrega fuerte' : 'Entrega media');
const TABS = [['resumen', 'Resumen'], ['contenido', 'Contenido'], ['entregas', 'Entregas'], ['metas', 'Metas']];
let TAB = 'resumen';

// El estado de una pieza como lo lee el cliente (sale de estadoDe: Idea · En proceso · Listo · Publicado).
const pstate = (x) => { const e = estadoDe(x); return e === 'Publicado' || e === 'Archivado' ? ['Publicado', 's-pub'] : e === 'Listo' ? ['Programado', 's-prog'] : e === 'En proceso' ? (x.por_aprobar ? ['Por aprobar', 's-rev'] : x.cliente === 'cambios' ? ['Cambios pedidos', 's-rev'] : ['En producción', 's-idea']) : ['En idea', 's-idea']; };
const porAprobar = (x) => x.por_aprobar === true && estadoDe(x) === 'En proceso'; // solo lo que el equipo envió a aprobación
const EST = { Entregado: 's-pub', Hecho: 's-pub', Agendada: 's-prog', 'En curso': 's-prog', 'Por empezar': 's-idea', 'Por agendar': 's-rev' };

// El cambio contra el periodo anterior: «↑ +22%». Sin dato anterior, no se muestra.
const delta = (k) => (k?.pct == null ? '' : k.pct > 0 ? html`<span class="pd-d up">↑ +${k.pct}%</span>` : k.pct < 0 ? html`<span class="pd-d down">↓ −${Math.abs(k.pct)}%</span>` : html`<span class="pd-d">→ 0%</span>`);
const kcard = (label, value, line, title = '') => html`<div class="pd-kpi" ${title ? raw(`title="${title.replace(/"/g, '&quot;')}"`) : ''}><span class="pd-l">${label}</span><b class="pd-v ${value === '—' ? 'none' : ''}">${value}</b><div class="pd-sub">${line}</div></div>`;

// La gráfica de 30 días: leads en barras, alcance en línea (cada uno a su propia escala, como en la web). Solo lo que existe.
function chart(serie) {
  const W = 640, H = 230, L = 8, R = 8, T = 18, B = 34, n = serie.length, step = (W - L - R) / n, base = H - B;
  const reach = serie.map((s) => s.alcance), leads = serie.map((s) => s.leads);
  const hasR = reach.some((v) => v != null), hasL = leads.some((v) => v), maxR = Math.max(1, ...reach.map((v) => v || 0)), maxL = Math.max(1, ...leads.map((v) => v || 0));
  const x = (i) => L + step * i + step / 2, yR = (v) => T + (1 - v / maxR) * (base - T - 6);
  const bars = hasL ? leads.map((v, i) => (v ? `<rect x="${(x(i) - step * 0.3).toFixed(1)}" y="${(base - (v / maxL) * (base - T - 30)).toFixed(1)}" width="${(step * 0.6).toFixed(1)}" height="${((v / maxL) * (base - T - 30)).toFixed(1)}" rx="3" class="pd-bar"><title>${serie[i].date}: ${v} leads</title></rect>` : '')).join('') : '';
  let d = '', pen = false;
  if (hasR) reach.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${yR(v).toFixed(1)} `; pen = true; });
  const dots = hasR ? reach.map((v, i) => (v == null ? '' : `<circle cx="${x(i).toFixed(1)}" cy="${yR(v).toFixed(1)}" r="9" class="pd-hit"><title>${serie[i].date}: ${K(v)} de alcance</title></circle>`)).join('') : '';
  const lab = (i, a) => `<text x="${a === 'end' ? W - R : a === 'middle' ? W / 2 : L}" y="${H - 8}" text-anchor="${a}" class="pd-ax">Día ${i}</text>`;
  return raw(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de alcance y leads de los últimos 30 días" class="pd-chart"><g class="pd-grid"><line x1="0" y1="30" x2="${W}" y2="30"/><line x1="0" y1="95" x2="${W}" y2="95"/><line x1="0" y1="160" x2="${W}" y2="160"/></g>${bars}${hasR ? `<path d="${d}" class="pd-line"/>${dots}` : ''}${lab(1, 'start')}${lab(15, 'middle')}${lab(30, 'end')}</svg>`);
}

export async function render(el, { me, sub, alive }) {
  const slug = me.role === 'client' ? '' : sub[0] || '';
  const q0 = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  let d;
  try { d = await api('portal' + (slug ? `?slug=${encodeURIComponent(slug)}` : '')); } catch (e) { return mount(el, html`${fallo({ titulo: 'No pude abrir el portal', linea: e.message })}`); }
  if (!alive()) return;
  // Videos que el equipo mandó a revisión (solo los de esta marca; sin nada interno). Si falla, el portal sigue sin ellos.
  let vids = [];
  try { vids = await api('portal/videos' + q0); } catch { vids = []; }
  if (!alive()) return;
  const isClient = me.role === 'client', r = d.resumen, en = d.entregas;
  const q = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  const pend = d.content.filter(porAprobar), pendN = pend.length + vids.filter((v) => v.revision !== 'Aprobado').length;
  const ob = d.onboarding, obN = ob ? ob.items.filter((x) => x.done).length : 0, obAll = ob ? obN === ob.items.length : false;
  const R0 = 26, C0 = 2 * Math.PI * R0;
  const ring = (pct) => html`<div class="sp-ring pt-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6"/>${raw(pct ? `<circle class="val" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C0.toFixed(2)}" stroke-dashoffset="${(C0 * (1 - pct / 100)).toFixed(2)}"/>` : '')}</svg><b>${pct == null ? '—' : html`${pct}<small>%</small>`}</b></div>`;
  const falta = (k) => (r.falta[k] ? html`<span class="pd-falta">${r.falta[k]}</span>` : '');
  const num = (v) => (v == null ? '—' : v);

  // ---- Onboarding: lo que necesitamos del cliente. Arriba mientras no esté completo; completo, se guarda dentro de Resumen.
  const onbBody = ob ? html`<div class="mut sm" style="margin-top:8px">${obAll ? '¡Gracias! Con esto el equipo ya tiene todo para avanzar.' : 'Lo que necesitamos de ti para arrancar. Marca lo que ya hiciste y deja un link o comentario si hace falta.'}</div>
        <div class="sp-meter" style="margin:10px 0 6px"><i style="width:${Math.round((obN / (ob.items.length || 1)) * 100)}%"></i></div>
        ${ob.items.map((x, i) => html`<div class="onbi"><label class="check"><input type="checkbox" data-i="${i}" ${x.done ? raw('checked') : ''}> <span>${x.t}</span></label><input class="in sm" data-n="${i}" value="${x.note || ''}" placeholder="Link o comentario (opcional)"></div>`)}
        <div class="row" style="margin-top:10px"><button class="btn" data-ob="save">Guardar</button></div>` : '';
  const onbTop = ob && !obAll ? html`<section class="sp-panel onb pt-onb" id="onb"><div class="sp-panel-h row" style="gap:10px;flex-wrap:wrap"><h3>${ico('smile')} Tu onboarding</h3><div class="sp"></div><span class="sm mut">${obN}/${ob.items.length} listos</span></div>${onbBody}</section>` : '';
  const onbDone = ob && obAll ? html`<details class="pd-onbd" id="onb"><summary>${ico('check')} Onboarding completo <span class="mut sm">${obN}/${ob.items.length}</span></summary>${onbBody}</details>` : '';

  // ---- Resumen
  const fuentesMax = r.fuentes?.length ? Math.max(...r.fuentes.map((f) => f.n)) : 1;
  const hayGrafica = r.serie.some((s) => s.alcance != null || s.leads);
  const resumen = html`
    <div class="pd-kpis">
      ${kcard('Alcance', r.alcance ? K(r.alcance.valor) : '—', r.alcance ? delta(r.alcance) : falta('alcance'))}
      ${kcard('Seguidores nuevos', r.seguidores ? (r.seguidores.valor > 0 ? '+' : '') + r.seguidores.valor.toLocaleString('en-US') : '—', r.seguidores ? delta(r.seguidores) : falta('seguidores'), r.seguidores?.total ? `En total: ${r.seguidores.total.toLocaleString('en-US')}` : '')}
      ${kcard('Leads', r.leads ? r.leads.valor : '—', r.leads ? delta(r.leads) : falta('leads'))}
      ${kcard('Reuniones', r.reuniones ? r.reuniones.valor : '—', r.reuniones ? delta(r.reuniones) : falta('reuniones'))}
      ${kcard('Piezas publicadas', r.piezas.valor, r.piezas.aTiempo != null ? html`<span class="pd-d">${r.piezas.aTiempo}% a tiempo</span>` : '')}
    </div>
    <div class="pd-row">
      <div class="pd-box"><h4>Últimos 30 días · <b>Alcance</b> + leads</h4>
        ${hayGrafica ? html`${chart(r.serie)}<div class="pd-leg">${r.serie.some((s) => s.alcance != null) ? html`<span><i class="ln"></i>Alcance</span>` : ''}${r.serie.some((s) => s.leads) ? html`<span><i class="br"></i>Leads</span>` : ''}</div>`
          : html`<div class="pd-empty"><b>Todavía no hay datos de estos 30 días</b>${[r.falta.alcance, r.falta.leads].filter(Boolean).join(' · ') || 'Aún no hay movimiento en este periodo.'}</div>`}
      </div>
      <div class="pd-box"><h4>De dónde vienen los leads</h4>
        ${r.fuentes?.length ? html`<div class="pd-src">${r.fuentes.map((f) => html`<div><span>${f.fuente}</span><span class="t"><i style="width:${Math.max(6, Math.round((f.n / fuentesMax) * 100))}%"></i></span><b>${f.n}</b></div>`)}</div>`
          : r.fuentes ? html`<div class="pd-empty"><b>Sin leads en estos 30 días</b>Cuando entren, aquí ves de dónde vienen.</div>`
          : html`<div class="pd-empty"><b>—</b>${r.falta.leads}: así sabrás de dónde viene cada lead.</div>`}
      </div>
    </div>
    ${d.projects.length ? html`<div class="pd-sec"><h3>Lo que contrataste</h3></div>
      ${d.projects.map((p) => html`<section class="pt-proj">
        <div class="pt-proj-h">${ring(p.progress)}<div style="flex:1;min-width:0"><h3>${p.name}</h3>${p.phases.length ? html`<div class="pt-phases">${p.phases.map((f) => html`<span class="pt-ph ${f.status}">${f.status === 'done' ? ico('check', 12) : html`<i></i>`} ${f.name}${f.end ? html`<small>${fdate(f.end)}</small>` : ''}</span>`)}</div>` : ''}</div></div>
        ${p.services.length ? html`<div class="sp-tiles pt-tiles">${p.services.map((sv) => html`<div class="sp-tile pt-svc">
          <div class="row" style="gap:8px;align-items:flex-start"><span class="sp-tile-name">${sv.name}</span><div class="sp"></div><span class="chip ${ST[sv.status] || ''}" style="font-size:11px;flex:none">${sv.status}</span></div>
          <div class="sp-tile-sub">${lvName(sv.level)}${sv.days ? ` · ${sv.days} días hábiles` : ''}${sv.due ? ` · entrega ${fdate(sv.due)}` : ''}</div>
          ${sv.progress != null ? html`<div class="sp-meter"><i style="width:${sv.progress}%"></i></div>` : ''}
          ${sv.includes.length ? html`<ul class="pt-inc">${sv.includes.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div>`)}</div>` : ''}</section>`)}` : ''}
    <section class="sp-panel pd-team" id="pteam"><div class="sp-panel-h row"><h3>Tu equipo</h3></div>
      <b style="font-weight:600">¿Alguien de tu equipo ve esto?</b><div class="mut sm">Invítalo: entra con su Google y ve este mismo portal.</div>
      ${d.people.length ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${d.people.map((p) => html`<span class="chip">${p.name || p.email} · ${p.email}</span>`)}</div>` : ''}
      <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><input class="in" id="invn" placeholder="Nombre" style="max-width:180px"><input class="in" id="inve" type="email" placeholder="correo@suempresa.com" style="max-width:260px"><button class="btn ghost" data-ob="invite">Invitar a alguien de mi equipo</button></div></section>
    ${onbDone}`;

  // ---- Contenido
  const cardCls = ['a', 'b', 'c', 'd'];
  const videoCard = (v) => {
    const vig = v.versiones.find((x) => x.v === v.version) || v.versiones.at(-1), emb = vig ? embedUrl(vig.link) : null;
    return html`<article class="pd-box pd-vid" data-vid="${v.id}">
      <h4>${v.titulo} <span class="pd-c">v${v.version}</span></h4>
      ${emb ? html`<div class="pd-vp"><iframe src="${emb}" title="${v.titulo}" allow="autoplay; fullscreen" allowfullscreen loading="lazy" style="width:100%;aspect-ratio:${v.formato === '9:16' ? '9/16;max-height:520px' : v.formato === '4:5' ? '4/5;max-height:520px' : v.formato === '1:1' ? '1/1' : '16/9'};border:0;border-radius:12px"></iframe></div>`
        : vig?.link ? html`<a class="btn ghost" href="${vig.link}" target="_blank" rel="noopener noreferrer">Ver el video ↗</a>` : html`<div class="mut sm">Todavía no hay link de este video.</div>`}
      ${vig?.nota ? html`<p class="mut sm">${vig.nota}</p>` : ''}
      ${v.caption ? html`<div class="pd-pn"><b class="sm">Caption</b><div class="sm" style="white-space:pre-wrap">${v.caption}</div></div>` : ''}
      ${v.comentarios.length ? html`<div class="pd-list">${v.comentarios.map((c) => html`<div class="pd-li"><span class="pd-st s-idea">${c.seg != null ? reloj(c.seg) : 'General'}</span><span>${c.texto}<small>${c.por === 'cliente' ? 'Tú' : 'Equipo'} · v${c.version}</small></span></div>`)}</div>` : ''}
      ${isClient ? html`<div class="pd-act"><button class="btn sm ghost" data-vc="${v.id}">Comentar</button><button class="btn sm" data-vr="aprobar" data-id="${v.id}">Aprobar</button><button class="btn sm ghost" data-vr="cambios" data-id="${v.id}">Pedir cambios</button></div>` : ''}
    </article>`;
  };
  const contenido = html`
    ${vids.length ? html`<div class="pd-sec"><h3>Videos por revisar</h3></div>${vids.map(videoCard)}` : ''}
    ${pend.length ? html`<div class="pd-banner">${ico('check')} ${pend.length === 1 ? '1 pieza espera tu OK' : `${pend.length} piezas esperan tu OK`}</div>` : ''}
    ${d.content.length ? html`<div class="pd-cal">${d.content.map((x, i) => { const [lab, cls] = pstate(x);
      return html`<article class="pd-post">
        <div class="pd-im ${cardCls[i % 4]}"><span>${x.title}</span></div>
        <div class="pd-m"><span>${x.format} · ${fdate(x.date)}</span><span class="pd-st ${cls}">${lab}</span></div>
        ${x.url || (x.cliente === 'cambios' && !porAprobar(x) && x.nota) ? html`<div class="pd-pn">${x.url ? html`<a href="${x.url}" target="_blank" rel="noopener noreferrer">Ver pieza ↗</a>` : ''}${x.cliente === 'cambios' && !porAprobar(x) && x.nota ? html`<span class="mut sm">Pediste: «${x.nota}»</span>` : ''}</div>` : ''}
        ${isClient && porAprobar(x) ? html`<div class="pd-act"><button class="btn sm" data-pa="aprobar" data-id="${x.id}">Aprobar</button><button class="btn sm ghost" data-pa="cambios" data-id="${x.id}">Pedir cambios</button></div>` : ''}
      </article>`; })}</div>`
      : html`<div class="pd-empty"><b>Todavía no hay piezas</b>Aquí verás cada pieza con su fecha y su estado.</div>`}
    <p class="pd-note">Aquí apruebas cada pieza antes de que salga. Nada se publica sin tu OK.</p>`;

  // ---- Entregas
  const dot = (e) => (['Entregado', 'Hecho'].includes(e) ? 'ok' : 'mid');
  const entregas = html`
    <div class="pd-box"><h4>Esta semana</h4>
      <div class="pd-list">
        ${en.semana.map((x) => html`<div class="pd-li"><span class="pd-dot ${dot(x.estado)}"></span><span>${x.title}<small>${[x.dept, x.due ? 'entrega ' + fdate(x.due) : ''].filter(Boolean).join(' · ')}</small></span><span class="pd-st ${EST[x.estado] || 's-idea'}">${x.estado}</span></div>`)}
        ${en.presentacion ? html`<div class="pd-li"><span class="pd-dot ${dot(en.presentacion.estado)}"></span><span>${en.presentacion.name}<small>${fdate(en.presentacion.date)} · contigo</small></span><span class="pd-st ${EST[en.presentacion.estado] || 's-idea'}">${en.presentacion.estado}</span></div>` : ''}
        ${!en.semana.length && !en.presentacion ? html`<div class="pd-empty"><b>Esta semana no hay entregas programadas</b>Cuando haya, las ves aquí con su estado.</div>` : ''}
      </div></div>
    <div class="pd-row even">
      <div class="pd-box"><h4>Reuniones <span class="pd-c">${d.meetings.length}</span></h4>
        ${d.meetings.length ? d.meetings.map((m) => html`<div class="meet"><div class="mdate"><b>${fdate(m.date).split(' ')[0]}</b><span>${fdate(m.date).split(' ').slice(1).join(' ')}</span></div><div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:600">${m.name}</b>${m.status === 'hecha' ? html`<span class="chip green" style="font-size:11px">Hecha</span>` : ''}</div>${m.approves ? html`<div class="sm" style="margin-top:4px">${ico('check', 14)} Aprobamos: ${m.approves}</div>` : ''}<div class="sm" style="margin-top:4px">${m.topics.map((t) => html`<span class="mtopic">${t}</span>`)}</div></div></div>`) : html`<div class="mut sm" style="padding:6px 0">Sin reuniones agendadas.</div>`}</div>
      <div class="pd-box"><h4>Entregado ${d.folder ? html`<a class="pd-lk" href="${d.folder}" target="_blank" rel="noopener noreferrer">Tu carpeta de entregables ↗</a>` : ''}</h4>
        ${d.delivered.length ? d.delivered.map((x) => html`<div class="wkrow"><span class="pt-ok">${ico('check', 14)}</span><span class="grow">${x.title}</span><span class="mut sm">${x.date ? fdate(x.date) : ''}</span></div>`) : html`<div class="mut sm" style="padding:6px 0">Aquí aparece lo que vamos entregando.</div>`}</div>
    </div>`;

  // ---- Metas
  const metas = html`<div class="pd-box"><h4>Tus metas</h4>
    ${d.goals.length ? d.goals.map((g) => html`<div class="pd-goal"><div class="pd-gt"><span>${g.goal}</span><b>${g.metric ? (g.current || g.baseline || '—') : ''}</b></div>
      ${g.avance != null ? html`<div class="t"><i style="width:${g.avance}%"></i></div>` : ''}
      <div class="pd-gs mut sm">${[g.metric ? `Hoy ${g.current || g.baseline || '—'} · Meta ${g.target || '—'}` : '', g.avance != null ? `${g.avance}%` : '', g.due ? 'Para el ' + fdateLong(g.due) : ''].filter(Boolean).join(' · ')}</div></div>`)
      : html`<div class="pd-empty"><b>Todavía no hay metas</b>Cuando se definan, aquí ves cada una con su avance.</div>`}</div>`;

  const panes = { resumen, contenido, entregas, metas };
  mount(el, html`<div id="pt">
    ${me.role !== 'client' ? html`<div class="asbar">${ico('eye')} Así ve ${d.name} su portal <a href="#/clients/${d.slug}">Volver al cliente</a></div>` : ''}
    ${onbTop}
    <div class="pd" id="pd">
      <div class="pd-hd"><div class="pd-av">${initials(d.name)}</div>
        <div style="min-width:0"><h1>${d.name}</h1><small>Últimos 30 días · ${fdate(r.desde)} al ${fdate(r.hasta)}</small></div>
        <div class="sp"></div><span class="pd-chip live">● En vivo</span>${d.plan ? html`<span class="pd-chip">Tu nivel: ${d.plan}</span>` : ''}</div>
      <div class="pd-tabs" role="tablist">${TABS.map(([k, l]) => html`<button role="tab" data-tab="${k}" class="${TAB === k ? 'on' : ''}" aria-selected="${TAB === k}">${l}${k === 'contenido' && pendN ? html`<i class="pd-n">${pendN}</i>` : ''}</button>`)}</div>
      ${TABS.map(([k]) => html`<div class="pd-pane ${TAB === k ? 'on' : ''}" id="pd-${k}" role="tabpanel">${panes[k]}</div>`)}
    </div></div>`);
  const again = () => render(el, { me, sub, alive });
  $('#pt', el).addEventListener('click', async (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { TAB = t.dataset.tab; $$('.pd-tabs button', el).forEach((b) => { const on = b.dataset.tab === TAB; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); }); $$('.pd-pane', el).forEach((p) => p.classList.toggle('on', p.id === 'pd-' + TAB)); return; }
    const pa = e.target.closest('[data-pa]');
    if (pa) {
      const x = d.content.find((c) => c.id === pa.dataset.id); if (!x) return;
      let body;
      if (pa.dataset.pa === 'aprobar') { if (!(await confirmAsk(`¿Aprobar «${x.title}»? Queda programada para salir.`))) return; body = { accion: 'aprobar' }; }
      else { const v = await ask(`Pedir cambios · ${x.title}`, [{ k: 'nota', l: '¿Qué cambiamos?', t: 'textarea', req: true }], 'Enviar'); if (!v) return; body = { accion: 'cambios', nota: v.nota }; }
      try { await api(`portal/content/${encodeURIComponent(x.id)}`, { method: 'POST', body }); toast(body.accion === 'aprobar' ? 'Aprobada. Queda programada' : 'Listo: le avisamos al equipo'); again(); } catch (err) { toast(err.message, true); }
      return;
    }
    const vc = e.target.closest('[data-vc]');
    if (vc) {
      const v = vids.find((x) => x.id === vc.dataset.vc); if (!v) return;
      const r = await ask(`Comentar · ${v.titulo}`, [{ k: 'seg', l: 'Segundo del video (opcional, ej. 0:12)' }, { k: 'texto', l: 'Tu comentario', t: 'textarea', req: true }], 'Enviar'); if (!r) return;
      try { await api(`portal/videos/${encodeURIComponent(v.id)}/comentarios`, { method: 'POST', body: { texto: r.texto, seg: r.seg || null, version: v.version } }); toast('Comentario enviado'); again(); } catch (err) { toast(err.message, true); }
      return;
    }
    const vr = e.target.closest('[data-vr]');
    if (vr) {
      const v = vids.find((x) => x.id === vr.dataset.id); if (!v) return;
      let body;
      if (vr.dataset.vr === 'aprobar') { if (!(await confirmAsk(`¿Aprobar «${v.titulo}» (v${v.version})?`))) return; body = { accion: 'aprobar', version: v.version }; }
      else { const r = await ask(`Pedir cambios · ${v.titulo}`, [{ k: 'nota', l: '¿Qué cambiamos?', t: 'textarea', req: true }], 'Enviar'); if (!r) return; body = { accion: 'cambios', nota: r.nota, version: v.version }; }
      try { await api(`portal/videos/${encodeURIComponent(v.id)}/revision`, { method: 'POST', body }); toast(body.accion === 'aprobar' ? 'Aprobado' : 'Listo: le avisamos al equipo'); again(); } catch (err) { toast(err.message, true); }
      return;
    }
    const b = e.target.closest('[data-ob]'); if (!b) return;
    if (b.dataset.ob === 'save') {
      const items = d.onboarding.items.map((x, i) => ({ done: $(`[data-i="${i}"]`, el).checked, note: $(`[data-n="${i}"]`, el).value.trim() }));
      try { const rs = await api('portal/onboarding' + q, { method: 'PUT', body: { items } }); toast(rs.done ? '¡Onboarding completo! Gracias' : 'Guardado'); again(); } catch (err) { toast(err.message, true); }
    } else {
      const email = $('#inve', el).value.trim(), name = $('#invn', el).value.trim(); if (!email) return toast('Escribe su correo', true);
      try { const rs = await api('portal/invite' + q, { method: 'POST', body: { email, name } }); toast(rs.mailed ? `Listo: le llegó un correo a ${email}` : `Listo: ${email} ya tiene acceso. Dile que entre a ${location.origin} con su Google.`); again(); } catch (err) { toast(err.message, true); }
    }
  });
}
