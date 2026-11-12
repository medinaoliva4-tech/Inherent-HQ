// Reuniones de cada proyecto: salen de la receta de su tipo (ver recipes.js) y se agendan en el
// calendario de Inherent con invitación a quienes tienen que estar.
import { html, raw, col, api, ask, toast, fdate, IC, ico } from './core.js';
import { WHO, holders } from './cycle.js';

const ST = { todo: ['Por agendar', ''], agendada: ['Agendada', 'blue'], hecha: ['Hecha', 'green'] };
export const upcoming = (projects, from = new Date().toISOString().slice(0, 10)) => projects.flatMap((p) => (p.meetings || []).map((m, i) => ({ ...m, i, p }))).filter((m) => m.status !== 'hecha' && m.date >= from).sort((a, z) => a.date.localeCompare(z.date));

// Quiénes son, en personas del equipo (el cliente y el especialista van aparte).
export function people(m, team, meEmail, p = m.p) {
  const who = holders(team, meEmail, p?.roles_map);
  return (m.who || []).map((r) => ({ role: r, label: WHO[r] || r, email: ['cliente', 'especialista'].includes(r) ? null : who(r) })).map((x) => ({ ...x, name: x.email ? team.find((t) => (t.email || t.id) === x.email)?.name || x.email : null }));
}
export const isMine = (m, team, meEmail) => people(m, team, meEmail).some((x) => x.email === meEmail);

export function meetingRows(list, team, me, canEdit) {
  if (!list.length) return html`<div class="mut sm" style="padding:6px 0">Sin reuniones por delante.</div>`;
  return html`${list.map((m) => { const ps = people(m, team, me.email); return html`<div class="meet">
    <div class="mdate"><b>${fdate(m.date).split(' ')[0]}</b><span>${fdate(m.date).split(' ').slice(1).join(' ')}</span></div>
    <div class="grow" style="min-width:0"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500">${m.name}</b><span class="chip ${ST[m.status]?.[1] || ''}" style="font-size:11px">${ST[m.status]?.[0] || 'Por agendar'}</span>${m.approves ? html`<span class="chip amber" style="font-size:11px">${ico('check', 14)} Se aprueba: ${m.approves}</span>` : ''}<span class="mut sm">${m.p.client || m.p.name}</span></div>
      <div class="mut sm" style="margin-top:4px">${ico('users')} ${ps.map((x) => x.name ? `${x.label} (${x.name.split(' ')[0]})` : x.label).join(' · ')}</div>
      <div class="sm" style="margin-top:4px">${(m.topics || []).map((t) => html`<span class="mtopic">${t}</span>`)}</div></div>
    ${canEdit ? html`<div class="row" style="gap:6px;align-self:center">${m.link ? html`<a class="btn ghost sm" href="${m.link}" target="_blank" rel="noopener noreferrer">${IC.cal} Ver</a>` : html`<button class="btn sm" data-act="mtsched" data-p="${m.p.id}" data-i="${m.i}">${IC.cal} Agendar</button>`}<button class="btn ghost sm" data-act="mtdone" data-p="${m.p.id}" data-i="${m.i}" title="Marcar hecha">${ico('check', 14)}</button></div>` : m.link ? html`<a class="btn ghost sm" href="${m.link}" target="_blank" rel="noopener noreferrer" style="align-self:center">${IC.cal}</a>` : ''}
  </div>`; })}`;
}

// Agenda en el calendario de Inherent (o el tuyo si no hay) e invita a los del equipo.
export async function schedule(p, i, team, me) {
  const m = p.meetings[i];
  const v = await ask(`Agendar: ${m.name}`, [{ k: 'date', l: 'Fecha', t: 'date', v: m.date, req: true, half: true }, { k: 'time', l: 'Hora', v: '10:00', half: true }, { k: 'minutes', l: 'Duración (min)', t: 'number', v: 60, half: true }], 'Agendar e invitar');
  if (!v) return null;
  const ps = people(m, team, me.email, p);
  const description = `${p.name}\n\nQuiénes: ${ps.map((x) => x.name || x.label).join(', ')}\nTemas:\n${(m.topics || []).map((t) => '• ' + t).join('\n')}${m.approves ? `\n\nSe aprueba: ${m.approves}` : ''}\n\nInherent OS`;
  try {
    const e = await api('google/calendar', { method: 'POST', body: { summary: `${p.client || 'Inherent'} · ${m.name}`, date: v.date, time: v.time, minutes: v.minutes, description, calendar: 'inherent', attendees: ps.map((x) => x.email).filter(Boolean) } });
    const meetings = p.meetings.map((x, k) => (k === i ? { ...x, date: v.date, status: 'agendada', link: e.link } : x));
    const r = await col('projects').save({ ...p, meetings });
    toast('Agendada e invitaciones enviadas'); return r;
  } catch (err) { toast(err.message, true); return null; }
}
export async function markDone(p, i) {
  try { return await col('projects').save({ ...p, meetings: p.meetings.map((x, k) => (k === i ? { ...x, status: 'hecha' } : x)) }); } catch (e) { toast(e.message, true); return null; }
}
