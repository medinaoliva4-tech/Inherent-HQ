// El portal del cliente: cómo va lo que contrató, su contenido, su calendario, sus reuniones,
// sus metas, lo entregado y sus redes. Todo sale de /api/portal (el servidor decide qué se ve).
import { html, raw, mount, api, toast, fdate, fdateLong, K, $, $$, lineChart, ICON, ico } from '../core.js';

const ST = { 'Entregado': 'green', 'En revisión': 'amber', 'En curso': 'lime', 'Por empezar': '' };
const PS = { Idea: 'Idea', Grabado: 'En producción', Editado: 'En producción', Programado: 'Programado', Publicado: 'Publicado' };
const lvName = (lv) => (!lv ? '' : lv <= 6 ? 'Entrega sencilla' : lv >= 9 ? 'Entrega fuerte' : 'Entrega media');
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
  mount(el, html`
    ${me.role !== 'client' ? html`<div class="asbar">${ico('eye')} Así ve ${d.name} su portal <a href="#/clients/${d.slug}">Volver al cliente</a></div>` : ''}
    <div class="hello"><h1>${d.name}</h1><p>${d.plan ? html`Tu plan: <em>${d.plan}</em>` : 'Tu proyecto con Inherent'}</p></div>
    ${d.onboarding ? (() => { const ob = d.onboarding, n = ob.items.filter((x) => x.done).length, all = n === ob.items.length;
      return html`<div class="card onb ${all ? 'ok' : ''}" id="onb"><div class="row" style="gap:10px;flex-wrap:wrap"><b style="font-weight:500;font-size:18px">${all ? html`${ico('check')} Onboarding completo` : html`${ico('smile')} Tu onboarding`}</b><div class="sp"></div><span class="sm mut">${n}/${ob.items.length} listos</span></div>
        <div class="mut sm" style="margin-top:4px">${all ? '¡Gracias! Con esto el equipo ya tiene todo para avanzar.' : 'Lo que necesitamos de ti para arrancar. Marca lo que ya hiciste y deja un link o comentario si hace falta.'}</div>
        <div class="gbar" style="margin:10px 0"><i style="width:${Math.round((n / (ob.items.length || 1)) * 100)}%"></i></div>
        ${ob.items.map((x, i) => html`<div class="onbi"><label class="check"><input type="checkbox" data-i="${i}" ${x.done ? raw('checked') : ''}> <span>${x.t}</span></label><input class="in sm" data-n="${i}" value="${x.note || ''}" placeholder="Link o comentario (opcional)"></div>`)}
        <div class="row" style="margin-top:10px"><button class="btn" data-ob="save">Guardar</button></div>
        <div class="onbteam"><b style="font-weight:500">¿Alguien de tu equipo ve esto?</b><div class="mut sm">Invítalo: entra con su Google y ve este mismo portal.</div>
          ${d.people.length ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${d.people.map((p) => html`<span class="chip">${p.name || p.email} · ${p.email}</span>`)}</div>` : ''}
          <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap"><input class="in" id="invn" placeholder="Nombre" style="max-width:180px"><input class="in" id="inve" type="email" placeholder="correo@suempresa.com" style="max-width:260px"><button class="btn ghost" data-ob="invite">Invitar a alguien de mi equipo</button></div></div></div>`; })() : ''}
    <div class="wkkpis">${[['Avance', progress == null ? '—' : progress + '%'], ['Próxima reunión', nextMeet ? fdate(nextMeet.date) : '—'], ['Por publicar', upcoming.length], ['Entregado', d.delivered.length]].map(([l, v]) => html`<div class="wkkpi"><span class="lbl">${l}</span><b>${v}</b></div>`)}</div>

    ${d.projects.length ? html`<div class="sec-title"><h2 class="ttl">${ICON.list}Lo que contrataste</h2></div>
      ${d.projects.map((p) => html`<div class="card" style="margin-bottom:12px"><div class="row" style="gap:10px;flex-wrap:wrap"><b style="font-weight:500;font-size:18px">${p.name}</b><div class="sp"></div>${p.progress != null ? html`<span class="sm mut">${p.progress}%</span>` : ''}</div>
        ${p.progress != null ? html`<div style="margin:8px 0 4px">${bar(p.progress)}</div>` : ''}
        ${p.phases.length ? html`<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${p.phases.map((f) => html`<span class="chip ${f.status === 'done' ? 'green' : f.status === 'now' ? 'lime' : ''}" style="font-size:11.5px">${f.status === 'done' ? ico('check', 12) : ''} ${f.name}${f.end ? ' · ' + fdate(f.end) : ''}</span>`)}</div>` : ''}
        ${p.services.length ? html`<div class="grid g2" style="margin-top:12px;align-items:start">${p.services.map((s) => html`<div class="card glass" style="padding:14px"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500">${s.name}</b><div class="sp"></div><span class="chip ${ST[s.status] || ''}" style="font-size:11px">${s.status}</span></div>
          <div class="mut sm" style="margin-top:4px">${lvName(s.level)}${s.days ? ` · ${s.days} días hábiles` : ''}${s.due ? ` · entrega ${fdate(s.due)}` : ''}</div>
          ${s.progress != null ? html`<div style="margin-top:8px">${bar(s.progress)}</div>` : ''}
          ${s.includes.length ? html`<ul class="sm" style="margin:8px 0 0 18px;padding:0">${s.includes.map((x) => html`<li>${x}</li>`)}</ul>` : ''}</div>`)}</div>` : ''}</div>`)}` : ''}

    <div class="grid g2" style="align-items:start;margin-top:4px">
      <div><div class="sec-title"><h2 class="ttl">${ICON.cal}Tu contenido</h2><span class="mut sm">Lo que viene y lo último</span></div>
        <div class="card">${d.content.length ? d.content.map((x) => html`<div class="wkrow"><span class="wkt" style="background:${x.date >= d.today ? '#f4ede3' : '#f4eee4'}">${fdate(x.date)}</span><span class="grow">${x.title}<span class="mut sm"> · ${x.format}${x.pillar ? ' · ' + x.pillar : ''}</span></span><span class="chip ${x.status === 'Publicado' ? 'green' : x.status === 'Programado' ? 'lime' : ''}" style="font-size:11px">${PS[x.status] || x.status}</span></div>`) : html`<div class="mut sm">Todavía no hay contenido en el calendario.</div>`}</div></div>
      <div><div class="sec-title"><h2 class="ttl">${ICON.team}Reuniones</h2></div>
        <div class="card">${d.meetings.length ? d.meetings.map((m) => html`<div class="meet"><div class="mdate"><b>${fdate(m.date).split(' ')[0]}</b><span>${fdate(m.date).split(' ').slice(1).join(' ')}</span></div><div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500">${m.name}</b>${m.status === 'hecha' ? html`<span class="chip green" style="font-size:11px">Hecha</span>` : ''}</div>${m.approves ? html`<div class="sm" style="margin-top:4px">${ico('check', 14)} Aprobamos: ${m.approves}</div>` : ''}<div class="sm" style="margin-top:4px">${m.topics.map((t) => html`<span class="mtopic">${t}</span>`)}</div></div></div>`) : html`<div class="mut sm">Sin reuniones agendadas.</div>`}</div></div>
    </div>

    ${d.goals.length ? html`<div class="sec-title"><h2 class="ttl">${ICON.target}Tus metas</h2></div><div class="goals">${d.goals.map((g) => { const b = parseFloat(String(g.baseline || '').replace(/[^\d.-]/g, '')) || 0, t = parseFloat(String(g.target || '').replace(/[^\d.-]/g, '')), c = parseFloat(String(g.current || '').replace(/[^\d.-]/g, '')); const p = g.status === 'done' ? 100 : Number.isFinite(t) && Number.isFinite(c) && t !== b ? Math.max(0, Math.min(100, Math.round(((c - b) / (t - b)) * 100))) : null;
      return html`<div class="card goal"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500;font-size:17px">${g.goal}</b><div class="sp"></div><span class="mut sm">${g.due ? 'Para el ' + fdateLong(g.due) : ''}</span></div>${g.metric ? html`<div class="gmetric"><span class="mut sm">${ico('ruler')} ${g.metric}</span><div class="row" style="gap:10px;margin-top:6px"><span class="sm">Hoy <b style="font-weight:500">${g.current || g.baseline || '—'}</b></span>${bar(p)}<span class="sm">Meta <b style="font-weight:500">${g.target || '—'}</b></span></div></div>` : ''}</div>`; })}</div>` : ''}

    ${d.analytics ? html`<div class="sec-title"><h2 class="ttl">${ICON.chart}Tus redes</h2><span class="mut sm">${d.analytics.handles.map((h) => '@' + h).join(', ')} · últimos 30 días</span></div>
      <div class="wkkpis">${[['Seguidores', d.analytics.followers ? K(d.analytics.followers) : '—'], ['Alcance', K(d.analytics.reach)], ['Vistas', K(d.analytics.views)], ['Engagement', d.analytics.er == null ? '—' : d.analytics.er + '%'], ['Posts', n(d.analytics.posts)]].map(([l, v]) => html`<div class="wkkpi"><span class="lbl">${l}</span><b>${v}</b></div>`)}</div>
      ${d.analytics.series.length > 1 ? html`<div class="card wkbox"><div class="wkhead"><h3>Alcance por día</h3></div><div class="chart" id="pch"></div></div>` : ''}` : ''}

    <div class="sec-title"><h2 class="ttl">${ICON.folder}Entregado</h2>${d.folder ? html`<a class="sm" href="${d.folder}" target="_blank" rel="noopener noreferrer">Tu carpeta de entregables ↗</a>` : ''}</div>
    <div class="card">${d.delivered.length ? d.delivered.map((x) => html`<div class="wkrow"><span style="width:22px;text-align:center">${ico('check', 14)}</span><span class="grow">${x.title}</span><span class="mut sm">${x.date ? fdate(x.date) : ''}</span></div>`) : html`<div class="mut sm">Aquí aparece lo que vamos entregando.</div>`}</div>`);
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
