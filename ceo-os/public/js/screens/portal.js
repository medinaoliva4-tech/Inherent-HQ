// El portal del cliente: cómo va lo que contrató, su contenido, su calendario, sus reuniones,
// sus metas, lo entregado y sus redes. Todo sale de /api/portal (el servidor decide qué se ve).
import { html, raw, mount, api, toast, fdate, fdateLong, K, $, $$, lineChart, ICON, ico, initials } from '../core.js';
import { bars, PAL } from '../charts.js';
import { estadoDe } from '../element.js';

const ST = { 'Entregado': 'green', 'En revisión': 'amber', 'En curso': 'lime', 'Por empezar': '' };
// El estado de cada pieza, como lo lee el cliente (los estados viejos se leen como los nuevos).
const PS = { Idea: 'Idea', 'En proceso': 'En producción', Listo: 'Listo para publicar', Publicado: 'Publicado', Archivado: 'Publicado' };
const lvName = (lv) => (!lv ? '' : lv <= 4 ? 'Entrega básica' : lv <= 6 ? 'Entrega sencilla' : lv >= 9 ? 'Entrega fuerte' : 'Entrega media');
const bar = (p) => html`<div class="gbar"><i style="width:${p ?? 0}%"></i></div>`;

export async function render(el, { me, sub, alive }) {
  const slug = me.role === 'client' ? '' : sub[0] || '';
  let d;
  try { d = await api('portal' + (slug ? `?slug=${encodeURIComponent(slug)}` : '')); } catch (e) { return mount(el, html`<div class="empty"><b>No pude abrir el portal</b>${e.message}</div>`); }
  if (!alive()) return;
  const all = d.projects.flatMap((p) => p.services);
  const avg = d.projects.filter((p) => p.progress != null);
  const progress = avg.length ? Math.round(avg.reduce((a, p) => a + p.progress, 0) / avg.length) : null;
  const nextMeet = d.meetings.find((m) => m.date >= d.today && m.status !== 'hecha');
  const upcoming = d.content.filter((x) => x.date >= d.today);
  const n = (num) => (num == null ? '—' : num);
  const M = d.today.slice(0, 7);
  const pubM = d.content.filter((x) => x.date.slice(0, 7) === M && estadoDe(x) === 'Publicado').length;
  // Lo que viene: el contenido por salir y las reuniones por delante, en una sola banda por fecha.
  const next = [...upcoming.map((x) => ({ date: x.date, k: 'post', title: x.title, sub: [x.format, x.pillar].filter(Boolean).join(' · '), st: PS[estadoDe(x)] })),
    ...d.meetings.filter((m) => m.date >= d.today && m.status !== 'hecha').map((m) => ({ date: m.date, k: 'meet', title: m.name, sub: m.approves ? `Aprobamos: ${m.approves}` : m.topics.join(' · '), st: 'Reunión' }))].sort((a, z) => a.date.localeCompare(z.date));
  const R0 = 26, C0 = 2 * Math.PI * R0;
  const ring = (pct) => html`<div class="sp-ring pt-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="trk" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6"/>${raw(pct ? `<circle class="val" cx="32" cy="32" r="${R0}" fill="none" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C0.toFixed(2)}" stroke-dashoffset="${(C0 * (1 - pct / 100)).toFixed(2)}"/>` : '')}</svg><b>${pct == null ? '—' : html`${pct}<small>%</small>`}</b></div>`;
  // Las piezas del mes por semana (planificadas vs publicadas): sale del calendario, sin estimar nada.
  const [yy, mm] = M.split('-').map(Number), nW = Math.ceil(new Date(yy, mm, 0).getDate() / 7);
  const wk = Array.from({ length: nW }, (_, i) => { const l = d.content.filter((x) => x.date.slice(0, 7) === M && Math.floor((+x.date.slice(8) - 1) / 7) === i); return { label: `S${i + 1}`, values: [l.length, l.filter((x) => estadoDe(x) === 'Publicado').length] }; });
  mount(el, html`
    ${me.role !== 'client' ? html`<div class="asbar">${ico('eye')} Así ve ${d.name} su portal <a href="#/clients/${d.slug}">Volver al cliente</a></div>` : ''}
    <header class="sp-cover pt-cover">
      <div class="sp-cover-top"><div class="sp-cover-mono">${initials(d.name)}</div>
        <div style="flex:1;min-width:220px"><span class="lbl">Tu proyecto con Inherent</span><h1>${d.name}</h1>
          <div class="sp-cover-chips">${d.plan ? html`<span class="chip">Tu nivel: ${d.plan}</span>` : ''}${d.folder ? html`<a class="chip" href="${d.folder}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">${ico('folder', 13)} Tu carpeta de entregables ↗</a>` : ''}</div></div></div>
      <div class="sp-cover-nums"><div><span class="lbl">Avance</span><b>${progress == null ? '—' : progress + '%'}</b></div><div><span class="lbl">Próxima reunión</span><b>${nextMeet ? fdate(nextMeet.date) : '—'}</b></div><div><span class="lbl">Por publicar</span><b>${upcoming.length}</b></div><div><span class="lbl">Entregado</span><b>${d.delivered.length}</b></div></div>
    </header>
    ${d.onboarding ? (() => { const ob = d.onboarding, n = ob.items.filter((x) => x.done).length, all = n === ob.items.length;
      return html`<section class="sp-panel onb pt-onb ${all ? 'ok' : ''}" id="onb"><div class="sp-panel-h row" style="gap:10px;flex-wrap:wrap"><h3>${all ? html`${ico('check')} Onboarding completo` : html`${ico('smile')} Tu onboarding`}</h3><div class="sp"></div><span class="sm mut">${n}/${ob.items.length} listos</span></div>
        <div class="mut sm" style="margin-top:8px">${all ? '¡Gracias! Con esto el equipo ya tiene todo para avanzar.' : 'Lo que necesitamos de ti para arrancar. Marca lo que ya hiciste y deja un link o comentario si hace falta.'}</div>
        <div class="sp-meter" style="margin:10px 0 6px"><i style="width:${Math.round((n / (ob.items.length || 1)) * 100)}%"></i></div>
        ${ob.items.map((x, i) => html`<div class="onbi"><label class="check"><input type="checkbox" data-i="${i}" ${x.done ? raw('checked') : ''}> <span>${x.t}</span></label><input class="in sm" data-n="${i}" value="${x.note || ''}" placeholder="Link o comentario (opcional)"></div>`)}
        <div class="row" style="margin-top:10px"><button class="btn" data-ob="save">Guardar</button></div>
        <div class="onbteam sp-inset"><b style="font-weight:600">¿Alguien de tu equipo ve esto?</b><div class="mut sm">Invítalo: entra con su Google y ve este mismo portal.</div>
          ${d.people.length ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${d.people.map((p) => html`<span class="chip">${p.name || p.email} · ${p.email}</span>`)}</div>` : ''}
          <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><input class="in" id="invn" placeholder="Nombre" style="max-width:180px"><input class="in" id="inve" type="email" placeholder="correo@suempresa.com" style="max-width:260px"><button class="btn ghost" data-ob="invite">Invitar a alguien de mi equipo</button></div></div></section>`; })() : ''}

    ${d.projects.length ? html`<div class="sec-title"><h2 class="ttl">${ICON.list}Lo que contrataste</h2></div>
      ${d.projects.map((p) => html`<section class="pt-proj">
        <div class="pt-proj-h">${ring(p.progress)}<div style="flex:1;min-width:0"><h3>${p.name}</h3>${p.phases.length ? html`<div class="pt-phases">${p.phases.map((f) => html`<span class="pt-ph ${f.status}">${f.status === 'done' ? ico('check', 12) : html`<i></i>`} ${f.name}${f.end ? html`<small>${fdate(f.end)}</small>` : ''}</span>`)}</div>` : ''}</div></div>
        ${p.services.length ? html`<div class="sp-tiles pt-tiles">${p.services.map((sv) => html`<div class="sp-tile pt-svc">
          <div class="row" style="gap:8px;align-items:flex-start"><span class="sp-tile-name">${sv.name}</span><div class="sp"></div><span class="chip ${ST[sv.status] || ''}" style="font-size:11px;flex:none">${sv.status}</span></div>
          <div class="sp-tile-sub">${lvName(sv.level)}${sv.days ? ` · ${sv.days} días hábiles` : ''}${sv.due ? ` · entrega ${fdate(sv.due)}` : ''}</div>
          ${sv.progress != null ? html`<div class="sp-meter"><i style="width:${sv.progress}%"></i></div>` : ''}
          ${sv.includes.length ? html`<ul class="pt-inc">${sv.includes.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div>`)}</div>` : ''}</section>`)}` : ''}

    <div class="sec-title"><h2 class="ttl">${ICON.cal}Lo que viene</h2><span class="mut sm">Tu contenido por salir y las reuniones</span></div>
    ${next.length ? html`<div class="sp-strip pt-next" role="list">${next.map((x) => html`<div class="pt-nx nx-${x.k}" role="listitem"><div class="pt-nx-d"><b>${fdate(x.date).split(' ')[0]}</b><span>${fdate(x.date).split(' ').slice(1).join(' ')}</span></div>
        <div style="min-width:0"><span class="lbl">${x.st}</span><b class="pt-nx-t">${x.title}</b>${x.sub ? html`<span class="mut sm">${x.sub}</span>` : ''}</div></div>`)}</div>`
      : html`<div class="sp-callout info"><span class="grow">Todavía no hay contenido ni reuniones por delante en tu calendario.</span></div>`}

    <div class="sec-title"><h2 class="ttl">${ICON.chart}Resultados</h2>${d.analytics ? html`<span class="mut sm">Tus redes · ${d.analytics.handles.map((h) => '@' + h).join(', ')} · últimos 30 días</span>` : html`<span class="mut sm">Tu contenido de este mes</span>`}</div>
    <section class="sp-panel pt-res">
      ${d.analytics ? html`<div class="sp-kpis pt-kpis">${[['Seguidores', d.analytics.followers ? K(d.analytics.followers) : '—'], ['Alcance', K(d.analytics.reach)], ['Vistas', K(d.analytics.views)], ['Engagement', d.analytics.er == null ? '—' : d.analytics.er + '%'], ['Posts', n(d.analytics.posts)]].map(([l, v]) => html`<div><span class="lbl">${l}</span><b>${v}</b></div>`)}</div>
        ${d.analytics.series.length > 1 ? html`<div class="wkhead" style="border:0;background:none;margin:0;padding:10px 0 0"><h3>Alcance por día</h3></div><div class="chart" id="pch"></div>` : ''}`
      : html`<div class="sp-kpis pt-kpis"><div><span class="lbl">Piezas del mes</span><b>${wk.reduce((a, w) => a + w.values[0], 0)}</b></div><div><span class="lbl">Publicadas</span><b>${pubM}</b></div><div><span class="lbl">Por publicar</span><b>${upcoming.length}</b></div></div>
        <div class="wkhead" style="border:0;background:none;margin:0;padding:10px 0 4px"><h3>Planificadas vs. publicadas, por semana</h3></div>${bars(wk, [{ name: 'Planificadas', c: PAL.light }, { name: 'Publicadas', c: PAL.ink }], { h: 140, empty: 'Todavía no hay piezas con fecha este mes.' })}`}
      ${d.goals.length ? html`<div class="pt-goals"><h3>Tus metas</h3>${d.goals.map((g) => { const b = parseFloat(String(g.baseline || '').replace(/[^\d.-]/g, '')) || 0, t = parseFloat(String(g.target || '').replace(/[^\d.-]/g, '')), c = parseFloat(String(g.current || '').replace(/[^\d.-]/g, '')); const p = g.status === 'done' ? 100 : Number.isFinite(t) && Number.isFinite(c) && t !== b ? Math.max(0, Math.min(100, Math.round(((c - b) / (t - b)) * 100))) : null;
        return html`<div class="pt-goal"><div class="row" style="gap:8px;flex-wrap:wrap"><b>${g.goal}</b><div class="sp"></div><span class="mut sm">${g.due ? 'Para el ' + fdateLong(g.due) : ''}</span></div>${g.metric ? html`<div class="gmetric"><span class="mut sm">${ico('ruler')} ${g.metric}</span><div class="row" style="gap:10px;margin-top:6px"><span class="sm">Hoy <b style="font-weight:600">${g.current || g.baseline || '—'}</b></span>${bar(p)}<span class="sm">Meta <b style="font-weight:600">${g.target || '—'}</b></span></div></div>` : ''}</div>`; })}</div>` : ''}
    </section>

    <div class="grid g2 pt-two">
      <section class="sp-panel"><div class="sp-panel-h row"><h3>Reuniones</h3><span class="mut sm">${d.meetings.length}</span></div>
        ${d.meetings.length ? d.meetings.map((m) => html`<div class="meet"><div class="mdate"><b>${fdate(m.date).split(' ')[0]}</b><span>${fdate(m.date).split(' ').slice(1).join(' ')}</span></div><div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:600">${m.name}</b>${m.status === 'hecha' ? html`<span class="chip green" style="font-size:11px">Hecha</span>` : ''}</div>${m.approves ? html`<div class="sm" style="margin-top:4px">${ico('check', 14)} Aprobamos: ${m.approves}</div>` : ''}<div class="sm" style="margin-top:4px">${m.topics.map((t) => html`<span class="mtopic">${t}</span>`)}</div></div></div>`) : html`<div class="mut sm" style="padding:12px 0">Sin reuniones agendadas.</div>`}</section>
      <section class="sp-panel"><div class="sp-panel-h row"><h3>Entregado</h3><div class="sp"></div>${d.folder ? html`<a class="sm" href="${d.folder}" target="_blank" rel="noopener noreferrer">Tu carpeta de entregables ↗</a>` : ''}</div>
        ${d.delivered.length ? d.delivered.map((x) => html`<div class="wkrow"><span class="pt-ok">${ico('check', 14)}</span><span class="grow">${x.title}</span><span class="mut sm">${x.date ? fdate(x.date) : ''}</span></div>`) : html`<div class="mut sm" style="padding:12px 0">Aquí aparece lo que vamos entregando.</div>`}</section>
    </div>

    ${d.content.length ? html`<div class="sec-title"><h2 class="ttl">${ICON.list}Tu contenido</h2><span class="mut sm">Lo que viene y lo último</span></div>
      <section class="sp-panel">${d.content.map((x) => html`<div class="wkrow"><span class="wkt">${fdate(x.date)}</span><span class="grow">${x.title}<span class="mut sm"> · ${x.format}${x.pillar ? ' · ' + x.pillar : ''}</span></span><span class="chip ${estadoDe(x) === 'Publicado' ? 'green' : estadoDe(x) === 'Listo' ? 'lime' : ''}" style="font-size:11px">${PS[estadoDe(x)]}</span></div>`)}</section>` : ''}`);
  const q = slug ? `?slug=${encodeURIComponent(slug)}` : '';
  $('#onb', el)?.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ob]'); if (!b) return;
    if (b.dataset.ob === 'save') {
      const items = d.onboarding.items.map((x, i) => ({ done: $(`[data-i="${i}"]`, el).checked, note: $(`[data-n="${i}"]`, el).value.trim() }));
      try { const r = await api('portal/onboarding' + q, { method: 'PUT', body: { items } }); toast(r.done ? '¡Onboarding completo! Gracias' : 'Guardado'); render(el, { me, sub, alive }); } catch (err) { toast(err.message, true); }
    } else {
      const email = $('#inve', el).value.trim(), name = $('#invn', el).value.trim(); if (!email) return toast('Escribe su correo', true);
      try { const r = await api('portal/invite' + q, { method: 'POST', body: { email, name } }); toast(r.mailed ? `Listo: le llegó un correo a ${email}` : `Listo: ${email} ya tiene acceso. Dile que entre a ${location.origin} con su Google.`); render(el, { me, sub, alive }); } catch (err) { toast(err.message, true); }
    }
  });
  const ch = $('#pch', el); if (ch) lineChart(ch, d.analytics.series.map((x) => fdate(x.date)), [{ name: 'Alcance', v: d.analytics.series.map((x) => x.reach), c: '#2c1f16', fill: true }]);
}
