// Marcas (App 01): cómo se crean marcas creativas. Arriba, una tile por marca (los clientes activos, Inherent y la marca
// personal del CEO, con candado). Al entrar a una marca: Investigación · Ideas · Calendario · Marca (lo que ya existía en
// Contenido, Mi marca y Cliente → Marca, montado con la marca fija) y, como «Próximamente», Creación, Formatos,
// Design system, Video y Ads. Las pestañas de la marca viven en la barra de abajo de la de arriba (subnav de app.js).
// Rutas: #/marcas · #/marcas/<marca> · #/marcas/<marca>/<módulo>/…
import { html, mount, col, ico, initials, fdate, today, events, $ } from '../core.js';
import { loadBrands, brandAccess, MODULES, areaOf, modulesFor, defaultModule, isSoon } from '../brandlist.js';
import { estadoDe, separar } from '../element.js';
import { render as content } from './content.js';
import { render as meBrand } from './me-brand.js';
import { brandBoard } from '../brand-board.js';
import { brandHome } from '../brand-home.js';
import { canEdit } from '../roleviews.js';

const TONE = ['', 't1', 't2'];
const sync = () => events.dispatchEvent(new Event('navsync'));

export async function render(el, { me, sub = [], alive }) {
  const A = brandAccess(me);
  if (!A.any) return mount(el, html`<div class="empty"><b>Tu perfil no ve ninguna marca</b>Pídele al CEO acceso a Contenido o a Clientes en Equipo → Vistas por rol.</div>`);
  mount(el, html`<p class="loading">Cargando…</p>`);
  const brands = await loadBrands(me);
  if (!alive()) return;
  const [slug, mod0, ...rest] = sub;
  if (!slug) return tiles(brands);
  const b = brands.find((x) => x.slug === slug);
  if (!b) return mount(el, html`<a class="btn ghost" href="#/marcas">${ico('grid', 14)} Todas las marcas</a><div class="empty" style="margin-top:16px"><b>No encontré esa marca</b>${slug === 'personal' ? 'La marca personal es solo del CEO.' : 'Puede que no esté entre tus clientes o que ya no esté activa.'}</div>`);
  // Sin módulo (o uno que no existe): abre en el primero que este perfil puede abrir. La barra se entera (navsync).
  const live = modulesFor(me, b);
  let mod = MODULES.some(([k]) => k === mod0) ? mod0 : defaultModule(me, b);
  if (!isSoon(mod) && !live.includes(mod)) mod = defaultModule(me, b);
  if (mod !== mod0) { history.replaceState(null, '', `#/marcas/${slug}/${mod}`); sync(); }
  return page(b, mod, rest, live);

  // ---------- Inicio: una tile por marca ----------
  function tiles(list) {
    const counts = {}; // slug → { ideas, next, prox }
    const paint = () => {
      if (!alive()) return;
      mount(el, html`<div class="hello sp-hero"><h1>Marcas</h1><p>Elige una marca para <em>investigar, idear y calendarizar</em>.</p></div>
        ${list.length ? html`<div class="sp-tiles brand-tiles">${list.map((x, i) => tile(x, i, counts[x.slug]))}</div>`
          : html`<div class="empty"><b>Todavía no hay marcas</b>Aparecen cuando un cliente activo tiene su ficha de oferta en clients/ o su perfil de contenido.</div>`}`);
    };
    paint();
    if (!A.contentFull || !list.length) return;
    col('content').list().then((all) => {
      const T = today();
      for (const x of list) {
        const { vivos } = separar(all.filter((c) => c.kind === 'post' && c.profile === x.slug));
        const prox = vivos.filter((p) => p.date && p.date >= T && estadoDe(p) !== 'Publicado').sort((a, z) => a.date.localeCompare(z.date));
        counts[x.slug] = { ideas: vivos.filter((p) => estadoDe(p) === 'Idea').length, proceso: vivos.filter((p) => ['En proceso', 'Listo'].includes(estadoDe(p))).length, next: prox[0] || null, research: all.filter((c) => c.kind === 'research' && c.profile === x.slug).length };
      }
      paint();
    }).catch(() => {});
  }
  function tile(x, i, n) {
    return html`<a class="sp-tile r43 brand-tile ${x.personal ? 'private' : ''}" href="#/marcas/${x.slug}">
      <div class="sp-tile-top"><span class="sp-mono ${x.personal ? 'priv' : TONE[i % 3]}">${x.personal ? ico('lock', 16) : initials(x.name)}</span><div style="min-width:0"><div class="sp-tile-name">${x.name}</div><div class="sp-tile-sub">${x.sub}</div></div><span class="sp-tile-go">↗</span></div>
      ${A.contentFull ? html`<div class="brand-nums"><div><span class="lbl">Ideas</span><b>${n ? n.ideas : '—'}</b></div><div><span class="lbl">En proceso</span><b>${n ? n.proceso : '—'}</b></div><div><span class="lbl">Research</span><b>${n ? n.research : '—'}</b></div></div>` : ''}
      <div class="sp-tile-foot"><span>${n?.next ? html`${ico('cal', 13)} ${fdate(n.next.date)} · ${n.next.title}` : x.content || !A.content ? 'Sin publicaciones agendadas' : 'Sin perfil de contenido todavía'}</span>${x.personal ? html`<span class="chip dark brand-lock" title="Solo la ve el CEO: ni la API ni el conector la entregan a nadie más">${ico('lock', 12)} Privado</span>` : ''}</div></a>`;
  }

  // ---------- Una marca abierta ----------
  async function page(b, mod, rest, live) {
    const M = MODULES.find(([k]) => k === mod);
    const what = { inicio: 'Cómo va la marca hoy', resultados: 'Qué funcionó y qué no', investigacion: 'Lo que funciona en su categoría y por qué', ideas: 'Las ideas y piezas, de la idea a publicado', calendario: 'Qué sale y qué se graba cada día', marca: b.personal ? 'Tu roadmap y con qué se asocia tu marca' : 'Con qué se asocia la marca: lo que ve, a quién sigue y cómo suena' }[mod] || M[3];
    mount(el, html`<div class="hello sp-hero row brand-hero" style="align-items:flex-end"><span class="sp-mono big ${b.personal ? 'priv' : ''}">${b.personal ? ico('lock', 20) : initials(b.name)}</span><div style="min-width:0"><h1>${b.name}</h1><p>${mod === 'inicio' ? what : html`<span class="mut">${areaOf(mod)[1]} ›</span> <em>${M[1]}</em> · ${what}`}</p></div><div class="sp"></div>${b.personal ? html`<span class="chip dark" title="Solo la ve el CEO: ni la API ni el conector la entregan a nadie más">${ico('lock', 13)} Privado</span>` : ''}</div>
      <div id="bmod"></div>`);
    const box = $('#bmod', el), base = `#/marcas/${b.slug}/${mod}`;
    if (isSoon(mod)) return mount(box, html`<section class="sp-panel soon-panel"><span class="soon-ic">${ico(M[2], 22)}</span><span class="chip">Próximamente</span><h2>${M[1]}</h2><p>${M[3]}</p><div class="mut sm">Llega en una fase siguiente. Mientras tanto, ${live.length ? html`sigue en <a href="#/marcas/${b.slug}/${live[0]}">${MODULES.find(([k]) => k === live[0])[1]}</a>` : 'las demás pestañas siguen como hoy'}.</div></section>`);
    const common = { me, alive, fixed: b.slug };
    if (mod === 'inicio') return brandHome(box, { me, b, alive });
    if (mod === 'resultados') { box.dataset.island = '1'; return content(box, { ...common, sub: ['analytics'], embed: { base, only: ['analytics'], brand: b.name } }); }
    if (mod === 'investigacion') { box.dataset.island = '1'; return content(box, { ...common, sub: ['research'], embed: { base, only: ['research'], inspo: Boolean(b.personal), plat: rest[0], brand: b.name } }); }
    if (mod === 'ideas') { box.dataset.island = '1'; return content(box, { ...common, sub: ['postear'], embed: { base, only: ['postear'], brand: b.name } }); }
    if (mod === 'calendario') { box.dataset.island = '1'; return content(box, { ...common, sub: ['calendario'], embed: { base, only: ['calendario'], brand: b.name } }); }
    if (mod === 'marca') {
      if (b.personal) return meBrand(box, { me, sub: rest, alive, embed: { base, only: ['roadmap', 'asociaciones'] } });
      const acc = await col('accounts').get('acc-' + b.slug).catch(() => null);
      if (!alive()) return;
      return brandBoard({ el: box, me, id: b.slug, name: b.name, edit: canEdit(me, 'clients'), business: true, folder: acc?.assets || '' });
    }
  }
}
