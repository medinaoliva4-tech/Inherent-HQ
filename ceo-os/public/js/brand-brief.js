// App 01 · Marca › Entender › Brief del ciclo: el brief de comunicación de cada mes y su candado.
// El brief lo escribe ④ Creatividad en el repo (04-contenido/AAAA-MM/brief-del-ciclo.md): aquí se lee. Sin brief de un mes, el
// calendario no deja crear piezas con fecha de ese mes (calendario-contenido.js · candado). El CEO puede abrir un mes sin brief.
import { html, mount, api, col, ico, md, fdate, today } from './core.js';
import { mesesConBrief, candado, mesNombre, BRIEF } from './calendario-contenido.js';

export async function brandBrief(el, { me, b, alive }) {
  mount(el, html`<p class="loading">Cargando…</p>`);
  const [rc, bo] = await Promise.all([api('repo/content').catch(() => null), col('settings').get('brief_open').catch(() => null)]);
  if (!alive()) return;
  const months = (rc?.profiles || []).find((p) => p.slug === b.slug)?.months || [];
  const conBrief = mesesConBrief(months), abiertos = bo?.marcas?.[b.slug] || [];
  const T = today().slice(0, 7), sig = new Date(Date.parse(T + '-15T12:00') + 31 * 864e5).toISOString().slice(0, 7);
  const lista = [...new Set([sig, T, ...months.map((m) => m.mes)])].sort().reverse().slice(0, 8);
  let sel = conBrief.includes(T) ? T : conBrief[0] || T;
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${b.slug}`;
  function paint() {
    const m = months.find((x) => x.mes === sel), f = m?.files.find((x) => x.name === BRIEF), k = candado(sel, conBrief, abiertos);
    mount(el, html`<div class="bb"><nav class="bb-meses" aria-label="Meses">${lista.map((mes) => { const c = candado(mes, conBrief, abiertos); return html`<button type="button" class="bb-mes ${mes === sel ? 'on' : ''}" data-mes="${mes}">${ico(c.cerrado ? 'lock' : 'check', 13)}<span>${mesNombre(mes)}</span>${mes === T ? html`<i>Este mes</i>` : ''}</button>`; })}</nav>
      <section class="bb-doc">${f ? html`<header class="bb-h"><span class="chip av-st-ok">${ico('check', 12)} Brief listo</span><span class="mut sm">${carpeta}/04-contenido/${sel}/${BRIEF}</span></header><div class="es-md">${md(f.content)}</div>`
        : html`<div class="bb-vacio"><span class="av-empty-i">${ico('lock', 24)}</span><h2>${k.cerrado ? `Sin brief de ${mesNombre(sel)}` : `${mesNombre(sel)} está abierto sin brief`}</h2>
          <p>${k.cerrado ? 'Mientras no haya brief, el calendario no deja crear piezas con fecha de este mes. Las ideas sin fecha sí.' : `Lo abrió ${String(k.abierto?.por || '').split('@')[0]} el ${fdate(String(k.abierto?.en || '').slice(0, 10))}.`}</p>
          <p class="mut sm">Lo escribe ④ Creatividad con Claude Code en <code>${carpeta}/04-contenido/${sel}/${BRIEF}</code>, después del plan del mes (días 1 a 3 del ciclo).</p></div>`}</section></div>`);
  }
  el.onclick = (e) => { const t = e.target.closest('[data-mes]'); if (t) { sel = t.dataset.mes; paint(); } };
  paint();
}
