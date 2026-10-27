// Marca › Crear › Plan del mes: la herramienta. El plan de ③ Marketing de cada mes, a la vista para revisarlo y pasarlo a
// Ideas. Se arma en el Chat, en modo Marketing (o en el chat de Diseño gráfico, etapa 1); aquí se ve, se revisa y se pasa a Creatividad.
// Rutas: #/marcas/<marca>/plan · #/marcas/<marca>/plan/<AAAA-MM>
import { html, raw, mount, api, toast, ico, confirmAsk, $, $$ } from './core.js';
import { nombreMes, revisarSlots, sumaPilares, avancePlan, SECCIONES_P, NOMBRE_P } from './plan-mes.js';
import { docHtml } from './artifact.js';
import { abrirEnChat } from './areas.js';

const PILAR_C = ['#2a1f17', '#8a6a50', '#c9b39b', '#5d7a46', '#3f6ea8', '#b4472f'];
export const mesDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const mesesPlan = (hoy = new Date()) => [mesDe(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), mesDe(hoy), mesDe(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1))];

// El panel del plan (lo usan la herramienta y el chat), como artifact (artifact.js).
// o = { b, mes, plan, piezas, edit, fresh, pasando, cerrar (en el chat), abrir: [href, texto] }
export function planPanel(o) {
  const p = o.plan || {}, mes = o.mes, fresh = o.fresh || [], n = avancePlan(p), fr = (k) => (fresh.includes(k) ? 'fresh' : '');
  const avisos = revisarSlots(p.slots || [], p.canales || []), aviso = (id) => avisos.find((a) => a.id === id)?.avisos || [];
  const suma = sumaPilares(p.pilares || []);
  const vacio = (t) => html`<p class="ev-vacio">${t}</p>`;
  const Mes = nombreMes(mes).replace(/^./, (c) => c.toUpperCase());
  const estado = o.piezas ? 'En Ideas' : n ? `Borrador · ${n} de 5` : 'Vacío';
  const traza = (t) => (t ? `Traza a la estrategia: ${t}` : '');
  const cuerpo = html`
      <section class="ev-sec ${fr('campana')}"><p class="ad-lb">La idea del mes${p.campana?.tipo ? ` · ${p.campana.tipo === 'pilar' ? 'Pilar' : 'Campaña'}` : ''}</p>
        ${p.campana?.nombre ? html`<h2 class="ad-big">«${p.campana.nombre}»</h2>` : ''}
        ${p.campana?.idea ? html`<p class="ad-q">${p.campana.idea}${p.campana.meta || p.campana.traza ? html` <small>${[p.campana.meta ? `Meta: ${p.campana.meta}` : '', traza(p.campana.traza)].filter(Boolean).join(' · ')}</small>` : ''}</p>` : vacio('Marketing decide si el mes es campaña (un mensaje que tiene que llegar) o pilar (lo de siempre), y la idea que lo amarra.')}</section>
      <section class="ev-sec ${fr('mensaje')}"><p class="ad-lb">El mensaje, en orden</p>${p.mensaje?.length ? html`<div class="ev-g3">${p.mensaje.map((m, i) => html`<div class="ev-c"><span class="lbl" style="margin:0">${i + 1}</span><b>${m.titulo}</b>${m.para ? html`<small class="mut">${m.para}</small>` : ''}</div>`)}</div>` : vacio('Qué se dice primero, qué lo prueba y qué se pide.')}</section>
      <section class="ev-sec ${fr('pilares')}"><p class="ad-lb">Los pilares y su peso${p.pilares?.length && suma !== 100 ? html` <span class="pm-warn">Suman ${suma}%, no 100%</span>` : ''}</p>${p.pilares?.length ? html`<div class="pm-pbar">${p.pilares.map((x, i) => html`<i style="width:${suma ? (x.peso / Math.max(suma, 100)) * 100 : 0}%;background:${PILAR_C[i % PILAR_C.length]}"></i>`)}</div><div class="pm-leg">${p.pilares.map((x, i) => html`<span title="${x.para || ''}"><i style="background:${PILAR_C[i % PILAR_C.length]}"></i>${x.nombre} ${x.peso}%</span>`)}</div>` : vacio('De qué se habla y cuánto pesa cada tema en el mes.')}</section>
      <section class="ev-sec ${fr('canales')}"><p class="ad-lb">Cada canal, su función</p>${p.canales?.length ? html`<div class="ev-g3">${p.canales.map((c) => html`<div class="ev-c"><b>${c.canal}</b><small class="mut">${[c.funcion, c.frecuencia, c.formatos].filter(Boolean).join(' · ')}</small>${c.no ? html`<small class="mut">No: ${c.no}</small>` : ''}</div>`)}</div>` : vacio('Para qué sirve cada canal y qué no se hace ahí. Dos canales con la misma función: sobra uno.')}</section>
      <section class="ev-sec ${fr('slots')}"><p class="ad-lb">Las piezas del mes${p.slots?.length ? ` · ${p.slots.length}` : ''}${avisos.length ? html` <span class="pm-warn">${avisos.length} por revisar</span>` : ''}</p>
        ${p.slots?.length ? html`<div class="pm-tbl"><table><thead><tr><th>Sem.</th><th>Canal</th><th>Formato</th><th>Función</th><th>A quién</th><th>Consciencia</th><th>Para qué</th><th>Traza a</th></tr></thead><tbody>${p.slots.map((s) => html`<tr class="${aviso(s.id).length ? 'mal' : ''}"><td>${s.semana}</td><td>${s.canal}</td><td>${s.formato}</td><td>${s.funcion ? html`<span class="pm-tag">${s.funcion}</span>` : ''}</td><td>${s.temperatura}</td><td>${s.consciencia}</td><td>${s.objetivo}${aviso(s.id).map((a) => html`<small class="pm-warn">${a}</small>`)}</td><td>${s.traza}</td></tr>`)}</tbody></table></div>` : vacio('Una fila por pieza: semana, canal, formato y el trabajo que hace. El día exacto lo pone Creatividad.')}</section>`;
  return docHtml({ ic: 'target', titulo: `Plan de ${Mes} · ③ Marketing`, sub: o.b.name, estado, ok: Boolean(o.piezas), cerrar: o.cerrar,
    acciones: o.abrir ? html`<a class="btn ghost xs" href="${o.abrir[0]}" ${o.abrir[2] ? raw(`data-etapa="${o.abrir[2]}"`) : ''}>${ico(o.abrir[2] ? 'spark' : 'link', 12)} ${o.abrir[1]}</a>` : '',
    prog: SECCIONES_P.map((k) => [NOMBRE_P[k].replace(/^(La|El|Los|Las) /, '').replace(/^./, (c) => c.toUpperCase()), Boolean(k === 'campana' ? p.campana?.nombre : p[k]?.length)]),
    cuerpo,
    pie: { texto: o.piezas ? `${o.piezas} pieza${o.piezas === 1 ? '' : 's'} de este plan ya están en Ideas.` : 'Marketing decide qué se dice, dónde y cuándo. Las piezas las escribe Creatividad.',
      accion: html`${o.piezas ? html`<a class="btn ghost xs" href="#/marcas/${o.b.slug}/ideas">Ver en Ideas</a>` : ''}${p.slots?.length && o.edit ? html`<button class="btn" data-act="pasar" ${o.pasando ? raw('disabled') : ''}>${o.pasando ? 'Pasando…' : `${o.piezas ? 'Poner al día' : 'Pasar'} ${p.slots.length} piezas a Ideas`} ${ico('right', 13)}</button>` : ''}` } });
}
// «Pasar a Creatividad»: cada slot queda como pieza del calendario. Devuelve cuántas quedaron, o null.
export async function pasarPlan(b, mes, plan) {
  const avisos = revisarSlots(plan.slots || [], plan.canales || []);
  if (avisos.length && !(await confirmAsk(`${avisos.length} slot${avisos.length === 1 ? '' : 's'} tienen algo por revisar (se marcan en rojo). ¿Los paso así a Creatividad?`))) return null;
  try { const r = await api(`plan/${encodeURIComponent(b.slug)}/${mes}/a-creatividad`, { method: 'POST', body: {} }); toast(r.nuevas ? `${r.nuevas} piezas nuevas en el calendario${r.puestas ? ` · ${r.puestas} puestas al día` : ''}` : `${r.puestas} piezas puestas al día`); return r.nuevas + r.puestas; }
  catch (e) { toast(e.message, true); return null; }
}

// La herramienta: el plan del mes y el botón para trabajarlo en el chat.
export async function planMesUI(el, { me, b, alive, rest = [] }) {
  el.dataset.island = '1';
  const meses = mesesPlan(), mes = /^\d{4}-\d{2}$/.test(rest[0] || '') ? rest[0] : meses[1];
  mount(el, html`<p class="loading">Cargando…</p>`);
  let d;
  try { d = await api(`plan/${encodeURIComponent(b.slug)}/${mes}`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude abrir el plan</b>${e.message}</div>`); }
  if (!alive()) return;
  const S = { plan: d.plan || {}, piezas: d.piezas || 0, pasando: false };
  const paint = () => mount(el, html`<div class="pmt-top"><div class="tabs" style="margin:0">${meses.map((x) => html`<a class="${x === mes ? 'on' : ''}" href="#/marcas/${b.slug}/plan/${x}">${nombreMes(x).replace(/^./, (c) => c.toUpperCase())}</a>`)}</div><span class="sp"></span>
      ${!d.estrategia?.aprobada ? html`<span class="pm-warn">${ico('lock', 12)} La estrategia de ${b.name} todavía no está aprobada</span>` : ''}</div>
    <section class="pm-pane pmt">${planPanel({ b, mes, plan: S.plan, piezas: S.piezas, edit: d.puede?.editar, pasando: S.pasando, abrir: [`#/chat`, 'Trabajarlo en el Chat', 'plan'] })}</section>`);
  paint();
  el.onclick = async (e) => {
    const t = e.target.closest('[data-act="pasar"],[data-etapa]'); if (!t) return;
    if (t.dataset.etapa) { e.preventDefault(); return abrirEnChat(me.email, { modo: 'marketing', slug: b.slug, mes, borrador: `Armemos el plan de ${nombreMes(mes)} de ${b.name}: la idea del mes, el mensaje, los pilares, los canales y las piezas.` }); }
    S.pasando = true; paint(); const n = await pasarPlan(b, mes, S.plan); if (n != null) S.piezas = n; S.pasando = false; if (alive()) paint();
  };
}
