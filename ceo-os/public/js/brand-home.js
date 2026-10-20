// Inicio de una marca (App 01 · Marca › Inicio): cómo va la marca hoy, en una sola vista, para nosotros y para el cliente.
//   1. El mes: en qué día del ciclo (1 a 20) vamos, qué toca hoy y cómo van las piezas del mes por estado.
//   2. Lo urgente: lo que espera aprobación del cliente, lo próximo en salir y lo que funciona en Investigación.
//   3. La estrategia (etapa y bloques aprobados) y los números de los últimos 30 días, si este perfil los ve.
//   4. Las herramientas, agrupadas por área (Entender · Crear · Diseño · Publicar · Medir), con un link a cada una.
// Todo sale de datos reales; lo que no existe todavía lo dice en una línea (nunca un número inventado).
import { html, raw, mount, api, col, ico, fdate, today, $ } from './core.js';
import { AREAS, MODULES, isSoon, modulesFor, brandAccess } from './brandlist.js';
import { ESTADOS, estadoDe, separar, nombreDe } from './element.js';
import { CYCLE } from './cycle.js';
import { loQueFunciona } from './investigacion.js';
import { loadEstrategia } from './stratlist.js';
import { BLOQUES, etapaLabel, etapaDe } from './estrategia.js';

const safeImg = (u) => (/^https:\/\/[^\s'"()]+$|^\/api\/media\/img-[a-f0-9]{24}$/.test(String(u || '')) ? u : null);
const EST_CLS = { Idea: 'e-idea', 'En proceso': 'e-proc', Listo: 'e-listo', Publicado: 'e-pub' };
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('es-GT'));

export async function brandHome(el, { me, b, alive }) {
  const A = brandAccess(me), live = modulesFor(me, b), base = `#/marcas/${b.slug}`;
  const ve = { contenido: A.contentFull, estrategia: me.role !== 'client' && (me.areas || []).includes('estrategia') && !b.personal && b.slug !== 'personal', portal: (me.areas || []).includes('portal') && b.client };
  const S = { posts: null, inv: null, est: null, portal: null };
  const T = today(), mes = T.slice(0, 7), dia = +T.slice(8, 10);

  const paint = () => { if (!alive()) return; mount(el, html`<div class="bh">${mesCard()}<div class="bh-row">${aprobarCard()}${proximoCard()}${funcionaCard()}</div>${ve.estrategia || ve.portal ? html`<div class="bh-row two">${ve.estrategia ? estrategiaCard() : ''}${ve.portal ? numerosCard() : ''}</div>` : ''}${herramientas()}</div>`); };

  // ---------- 1 · El mes ----------
  function mesCard() {
    const fase = dia > 20 ? null : CYCLE.filter(([, a, z]) => dia >= a && dia <= z).at(-1) || null;
    const posts = S.posts?.filter((p) => (p.date || '').startsWith(mes)) || null;
    const cuenta = Object.fromEntries(ESTADOS.map((e) => [e, posts ? posts.filter((p) => estadoDe(p) === e).length : null]));
    const total = posts?.length || 0;
    return html`<section class="bh-card bh-mes"><div class="bh-mes-l"><span class="lbl">El ciclo de este mes</span>
        <div class="bh-dia"><b>${dia > 20 ? '20+' : dia}</b><span>${dia > 20 ? 'El ciclo de este mes ya se presentó. Lo presentado se publica desde el día 1.' : html`día de 20 · <strong>${fase ? fase[0] : ''}</strong>`}</span></div>
        <div class="bh-ciclo" aria-label="Fases del ciclo">${CYCLE.map(([n, a, z]) => html`<i class="${dia > z ? 'ok' : dia >= a ? 'now' : ''}" style="flex:${z - a + 1}" title="${n} · días ${a === z ? a : `${a} a ${z}`}"></i>`)}</div>
        <div class="bh-ciclo-l mut sm"><span>Día 1 · reunión</span><span>11 · último día para producir</span><span>20 · presentación</span></div></div>
      <div class="bh-mes-r"><span class="lbl">Piezas del mes${posts ? ` · ${total}` : ''}</span>
        ${!A.contentFull ? html`<p class="mut sm">Tu perfil no ve el contenido de esta marca.</p>` : html`
        <div class="bh-bar" role="img" aria-label="${ESTADOS.map((e) => `${e}: ${cuenta[e] ?? 0}`).join(', ')}">${total ? ESTADOS.map((e) => (cuenta[e] ? html`<i class="${EST_CLS[e]}" style="flex:${cuenta[e]}"></i>` : '')) : html`<i class="vacio"></i>`}</div>
        <div class="bh-est">${ESTADOS.map((e) => html`<a href="${base}/ideas"><span class="bh-dot ${EST_CLS[e]}"></span><b>${cuenta[e] == null ? '…' : cuenta[e]}</b><span class="mut sm">${e}</span></a>`)}</div>
        ${posts && !total ? html`<p class="mut sm">Todavía no hay piezas con fecha este mes. Se crean en <a href="${base}/ideas">Ideas</a>.</p>` : ''}`}</div></section>`;
  }

  // ---------- 2 · Lo urgente ----------
  function aprobarCard() {
    if (!A.contentFull) return '';
    const l = S.posts ? S.posts.filter((p) => p.por_aprobar && estadoDe(p) === 'En proceso') : null;
    return html`<section class="bh-card"><header class="bh-h"><span class="lbl">Esperando al cliente</span>${l?.length ? html`<span class="chip amber">${l.length}</span>` : ''}</header>
      ${l == null ? html`<p class="mut sm">Cargando…</p>` : l.length ? html`<ul class="bh-list">${l.slice(0, 4).map((p) => html`<li><a href="${base}/ideas"><b>${nombreDe(p, b.name)}</b><span class="mut sm">${p.date ? fdate(p.date) : 'Sin fecha'}</span></a></li>`)}</ul>`
        : html`<p class="bh-empty">${ico('check', 16)} Nada pendiente de aprobación.</p>`}</section>`;
  }
  function proximoCard() {
    if (!A.contentFull) return '';
    const l = S.posts ? S.posts.filter((p) => p.date && p.date >= T && estadoDe(p) !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date)) : null;
    return html`<section class="bh-card"><header class="bh-h"><span class="lbl">Lo próximo en salir</span><a class="bh-more" href="${base}/calendario">Calendario ${ico('right', 12)}</a></header>
      ${l == null ? html`<p class="mut sm">Cargando…</p>` : l.length ? html`<ul class="bh-list">${l.slice(0, 4).map((p) => html`<li><a href="${base}/calendario"><span class="bh-date"><b>${+p.date.slice(8, 10)}</b><span>${fdate(p.date).replace(/^\d+\s*/, '').slice(0, 3)}</span></span><span class="bh-li-t"><b>${nombreDe(p, b.name)}</b><span class="mut sm">${estadoDe(p)}${p.format ? ` · ${p.format}` : ''}</span></span></a></li>`)}</ul>`
        : html`<p class="bh-empty">Nada agendado desde hoy.</p>`}</section>`;
  }
  function funcionaCard() {
    if (!A.contentFull) return '';
    const items = S.inv ? (S.inv.items || []).filter((x) => x.url) : null, top = items ? loQueFunciona(items).slice(0, 3) : null;
    return html`<section class="bh-card"><header class="bh-h"><span class="lbl">Lo que funciona</span><a class="bh-more" href="${base}/investigacion">Investigación ${ico('right', 12)}</a></header>
      ${S.inv?.error ? html`<p class="mut sm">${S.inv.error}</p>` : top == null ? html`<p class="mut sm">Cargando…</p>` : top.length ? html`<div class="bh-top">${top.map((x) => { const t = safeImg(x.thumb); return html`<a href="${base}/investigacion" class="bh-top-i">${t ? html`<img src="${t}" alt="" loading="lazy" referrerpolicy="no-referrer">` : html`<span class="bh-top-ph">${ico('image', 18)}</span>`}<span class="bh-top-t">${x.handle ? '@' + x.handle : x.title || 'Post'}${x.x ? html` · <b>×${(+x.x).toFixed(1)}</b>` : ''}</span></a>`; })}</div>`
        : html`<p class="bh-empty">${S.inv?.estado?.last ? 'Esta semana nada rindió arriba de su promedio.' : 'Se llena con la primera búsqueda de los lunes.'}</p>`}</section>`;
  }

  // ---------- 3 · Estrategia y números ----------
  function estrategiaCard() {
    const c = S.est;
    return html`<section class="bh-card"><header class="bh-h"><span class="lbl">Estrategia</span><a class="bh-more" href="#/estrategia/${b.slug}">Abrir ${ico('right', 12)}</a></header>
      ${c === null ? html`<p class="mut sm">Cargando…</p>` : !c ? html`<p class="mut sm">Esta marca no tiene estrategia en el OS.</p>` : html`
      <div class="bh-kv"><div><span class="mut sm">Etapa</span><b>${c.etapa ? `${etapaLabel(etapaDe(c.etapa.n))}${c.etapa.confirmada ? '' : ' · sin confirmar'}` : 'Sin etapa'}</b></div><div><span class="mut sm">Aprobado por el CEO</span><b>${c.aprobados} de 5 bloques</b></div></div>
      <div class="bh-blocks">${BLOQUES.map((x) => html`<a href="#/estrategia/${b.slug}/${x.id}" class="${c.bloques[x.id] || 'vacio'}" title="${x.nombre}"><i></i><span>${x.nombre}</span></a>`)}</div>`}</section>`;
  }
  function numerosCard() {
    const r = S.portal?.resumen;
    const k = (l, v, sub) => html`<div class="bh-k"><span class="mut sm">${l}</span><b>${v}</b>${sub ? html`<span class="mut sm">${sub}</span>` : ''}</div>`;
    const pc = (x) => (x?.pct == null ? '' : `${x.pct > 0 ? '+' : ''}${x.pct}% vs. 30 días antes`);
    return html`<section class="bh-card"><header class="bh-h"><span class="lbl">Los últimos 30 días</span><a class="bh-more" href="${base}/resultados">Resultados ${ico('right', 12)}</a></header>
      ${S.portal === null ? html`<p class="mut sm">Cargando…</p>` : S.portal?.error ? html`<p class="mut sm">${S.portal.error}</p>` : html`<div class="bh-kpis">
        ${k('Publicadas', num(r.piezas?.valor), r.piezas?.aTiempo != null ? `${r.piezas.aTiempo}% a tiempo` : '')}
        ${k('Alcance', r.alcance ? num(r.alcance.valor) : '—', r.alcance ? pc(r.alcance) : r.falta?.alcance)}
        ${k('Leads', r.leads ? num(r.leads.valor) : '—', r.leads ? pc(r.leads) : r.falta?.leads)}
        ${k('Seguidores nuevos', r.seguidores ? num(r.seguidores.valor) : '—', r.seguidores ? pc(r.seguidores) : r.falta?.seguidores)}</div>`}</section>`;
  }

  // ---------- 4 · Las herramientas, por área ----------
  function herramientas() {
    const mod = (k) => MODULES.find(([x]) => x === k);
    return html`<section class="bh-areas"><h2>Herramientas</h2><div class="bh-grid">${AREAS.filter(([k]) => k !== 'inicio').map(([k, l, ic, mods, que]) => {
      const vis = mods.filter((m) => isSoon(m) || live.includes(m)); if (!vis.length) return '';
      return html`<div class="bh-area"><header><span class="bh-area-i">${ico(ic, 17)}</span><div><b>${l}</b><span class="mut sm">${que}</span></div></header>
        <div class="bh-tools">${vis.map((m) => { const [, n, mi] = mod(m); return html`<a href="${base}/${m}" class="${isSoon(m) ? 'soon' : ''}">${ico(mi, 14)}<span>${n}</span>${isSoon(m) ? html`<i class="soon-tag">Pronto</i>` : ico('right', 12)}</a>`; })}</div></div>`;
    })}</div></section>`;
  }

  // ---------- Los datos: se pinta ya y se completa conforme llegan ----------
  paint();
  const jobs = [];
  if (A.contentFull) {
    jobs.push(col('content').list().then((all) => { S.posts = separar(all.filter((c) => c.kind === 'post' && c.profile === b.slug)).vivos; }).catch(() => { S.posts = []; }));
    jobs.push(api(`investigacion?profile=${encodeURIComponent(b.slug)}`).then((r) => { S.inv = r; }).catch((e) => { S.inv = { error: e.message, items: [] }; }));
  }
  if (ve.estrategia) jobs.push(loadEstrategia().then((d) => { S.est = (d.clientes || []).find((c) => c.slug === b.slug) || false; }).catch(() => { S.est = false; }));
  if (ve.portal) jobs.push(api(`portal?slug=${encodeURIComponent(b.slug)}`).then((r) => { S.portal = r; }).catch((e) => { S.portal = { error: e.message }; }));
  for (const j of jobs) j.then(paint);
}
