import { instalarMenu } from './menu-contextual.js';
import { applyViews, GROUPS, SPACES, movedRoute } from './roleviews.js';
import { applyLevels, baseDefaults, LEVELS_ID } from './levels.js';
import { $, $$, html, raw, mount, api, events, toast, closeDrawer, setViewSection, IC, emblem, initials, esc, LOGO, infoTips, canTransition, ico, skel } from './core.js';
import { loadBrands, brandsNow, brandAccess, MODULES, AREAS, areaOf, firstOfArea, modulesFor, defaultModule, isSoon } from './brandlist.js';
import { openSearch, searchOpen } from './search.js';
import { loadEstrategia, estrategiaNow } from './stratlist.js';
import { marcarSeccion, instalarBoton } from './guia.js';
import { primerDia } from './primer-dia.js';
import { pintarDock, quitarDock, icoApp } from './dock.js';
import { svgIco } from './iconos.js';
import { ponerTema, esNoche } from './tema.js';

// Tres espacios, como cambiar de app en un iPhone: el interruptor de arriba (junto al logo) cambia entre
//   ORGANIZATION  cómo se maneja la empresa   Hoy · Proyectos · Ventas · Servicios · Finanzas · Inherent
//   ESTRATEGIA    la estrategia de cada cliente  una tarjeta por cliente → Diagnóstico · Oferta · Modelo de dinero · Leads · Roadmap
//                 (App 02: solo el CEO y quien él habilite en Vistas por rol; el cliente nunca)
//   MARCAS        cómo se crean marcas         una tile por marca → Investigación · Ideas · Calendario · Marca (+ lo que viene)
// Cada espacio tiene su propia barra (en el cel, la barra de abajo cambia con el espacio) y una fila de pestañas debajo.
// Rutas: #/org/<pantalla>/…, #/estrategia/<cliente>/<bloque> y #/marcas/<marca>/<módulo>/…. TODAS las rutas viejas siguen funcionando (alias):
//   #/<pantalla>/… → #/org/<pantalla>/… · #/control-hub/<herramienta> → su sección nueva · #/content/<pestaña>/<perfil> y
//   #/mimarca/<pestaña> → su marca en Marcas · #/clients/<slug>/marca → Marcas → esa marca → Marca.
// El espacio elegido se recuerda por persona (localStorage) y por ruta. El buscador global (⌘K) vive en los dos.
// Arriba de los espacios, dos apps unidas por el dock (dock.js): Organización (Organization y Marcas) y Chat (#/chat, el
// Inherent LLM: Estrategia, Organización y Diseño en un solo chat con Hermes). Estrategia ya no va en el interruptor: su
// pantalla sigue en #/estrategia (el tablero, y el chat por el puente mientras Hermes no está instalado).
// Los íconos de la barra salen del set del OS (iconos.js: nav-hoy, nav-proyectos…).
const svg = (k) => raw(svgIco('nav-' + k, 16));
// Organization: las pantallas de cada sección → [ruta, nombre, qué hace falta para verla]. Varias = pestañas debajo de la barra.
// Qué hace falta: un área de la matriz · 'ceo' · 'all' (todo el equipo) · una función.
const full = (a) => me.areas.includes(a) && me.views?.[a] !== 'resumen';
const TABS = {
  // Control del flujo e Indicadores ya no son pestañas: su pulso y lo que necesita atención viven en Hoy (cada número lleva a su área).
  hoy: [['home', 'Hoy', 'home'], ['work', 'Mis tareas', 'work']],
  proyectos: [['clients', 'Clientes', 'clients'], ['operations', 'Proyectos', 'operations']],
  ventas: [['sales', 'Ventas', 'sales']],
  servicios: [['services', 'Servicios', () => full('sales')]],
  finanzas: [['finanzas', 'Finanzas', 'finanzas']],
  inherent: [['vision', 'Visión y misión', 'all'], ['team', 'Equipo', 'team'], ['team/vistas', 'Vistas por rol', 'ceo'], ['team/laya', 'Laya', 'ceo'], ['roadmap', 'Roadmap', 'roadmap'], ['library', 'Library', 'library'], ['setup', 'Arranque', 'ceo']],
};
const ORG = GROUPS.filter((g) => g[3] === 'org').map(([k, l]) => [k, l]);
const SCREENS = { me: 'me', home: 'home', control: 'control', work: 'work', finanzas: 'finance', sales: 'sales', services: 'services', operations: 'operations', roadmap: 'roadmap', clients: 'clients', content: 'content', mimarca: 'me-brand', library: 'library', team: 'team', setup: 'setup', portal: 'portal', resultados: 'results', 'control-hub': 'control-hub', vision: 'vision', marcas: 'brands', estrategia: 'strategy', chat: 'llm' };
const LABEL = { home: 'Hoy', control: 'Control del flujo', work: 'Mis tareas', finanzas: 'Finanzas', sales: 'Ventas', services: 'Servicios', operations: 'Proyectos', roadmap: 'Roadmap', clients: 'Clientes', content: 'Contenido', mimarca: 'Mi marca', library: 'Library', team: 'Equipo', setup: 'Arranque', portal: 'Mi portal', resultados: 'Indicadores', me: 'Mi perfil', 'control-hub': 'Centro de control', vision: 'Visión y misión', marcas: 'Marcas', estrategia: 'Estrategia', chat: 'Inherent LLM' };
// Las pantallas de Organization (lo que no es Marcas, Mi perfil ni el portal del cliente).
const ORG_SCREENS = ['home', 'control', 'work', 'resultados', 'setup', 'clients', 'operations', 'portal', 'sales', 'services', 'finanzas', 'vision', 'team', 'roadmap', 'library'];
// Las áreas que cuentan como «ve algo de Organization» (Equipo y Visión los ve todo el equipo: no cuentan).
const ORG_AREAS = ['home', 'work', 'control', 'resultados', 'clients', 'operations', 'sales', 'finanzas', 'roadmap', 'library'];
// Alias de rutas viejas.
const HUB_MAP = { control: 'control', operations: 'operations', work: 'work', sales: 'sales', finanzas: 'finanzas', resultados: 'resultados', responsabilidades: 'services/responsabilidades', vistas: 'team/vistas', setup: 'setup' };
const CT_MOD = { research: 'investigacion', refs: 'investigacion', semana: 'investigacion', fuentes: 'investigacion', shot: 'investigacion', postear: 'ideas', guiones: 'ideas', plan: 'calendario', calendario: 'calendario', analytics: 'resultados', bandeja: 'calendario/analytics' };
const OLD_SECTION = { hoy: 'hoy', clientes: 'proyectos', proyectos: 'proyectos', ventas: 'ventas', servicios: 'servicios', finanzas: 'finanzas', inherent: 'inherent', equipo: 'inherent', comercial: 'ventas' };
const root = $('#root');
// El botón de día y noche muestra a dónde vas: de noche el sol, de día la luna. El tema lo lleva tema.js (uno para las dos apps).
const icoTema = () => svgIco(esNoche() ? 'sun' : 'moon', 18);
export let me = null;
let renderGen = 0;

const ERR = { conector: 'No se pudo conectar la app.', dominio: 'No pudimos verificar esa cuenta de Google.', noaprobado: 'Esa cuenta todavía no tiene acceso. Pídele a Inherent que la apruebe.', estado: 'El inicio de sesión expiró. Inténtalo otra vez.', inactivo: 'Tu cuenta está desactivada. Habla con el CEO.', google: 'Google no dejó terminar el inicio de sesión.', servidor: 'Falló al guardar tu sesión.' };

// Conectar una app (Claude, ChatGPT…): llega a `/?connect=<id>`; si no hay sesión, primero se entra con Google.
{ const c = new URLSearchParams(location.search).get('connect'); if (c) { try { sessionStorage.setItem('connect', c); } catch {} history.replaceState(null, '', '/'); } }
const pendingConnect = () => { try { return sessionStorage.getItem('connect'); } catch { return null; } };

async function loginView() {
  quitarDock(); delete document.documentElement.dataset.app;
  let st = { google: false, db: false, domain: 'inherentglobal.com' };
  try { st = await api('status'); } catch {}
  const qs = new URLSearchParams(location.search); const err = qs.get('error'), detail = qs.get('detail');
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  mount(root, html`<div class="login">
    <div class="art"><div class="quote"><p>We build cool brands—<br><em>and the growth systems behind them.</em></p></div></div>
    <div class="side">
      <div class="row" style="gap:18px"><div style="width:52px">${emblem()}</div><div><img src="/brand/wordmark-light.svg" alt="Inherent" style="height:58px;display:block"><div style="font-size:11px;letter-spacing:4px;font-weight:700;opacity:.8;margin-top:10px">OPERATING SYSTEM</div></div></div>
      <p style="font-size:17px;opacity:.8;margin-top:18px;max-width:420px">${pendingConnect() ? 'Entra con tu Google para conectar Inherent OS con tu app.' : 'Entra con tu cuenta de Google de Inherent.'}</p>
      ${err ? html`<div class="warnbox">${ERR[err] || 'No se pudo iniciar sesión.'}${detail ? html`<div class="sm" style="margin-top:4px;opacity:.8">Detalle: ${detail}</div>` : ''}</div>` : ''}
      ${st.google ? html`<a class="gbtn" href="/api/auth/google" style="text-decoration:none">${IC.google} Continuar con Google</a>
        <a class="gbtn" href="/api/auth/google?portal=1" style="text-decoration:none;background:transparent;color:var(--cream);border:1px solid rgba(244,238,229,.3)">Soy cliente · entrar a mi portal</a>`
        : html`<div class="warnbox">El login con Google todavía no está configurado.</div>`}
      ${!st.db ? html`<div class="warnbox">La base de datos todavía no está conectada.</div>` : ''}
      ${local ? html`<a class="gbtn" href="/api/auth/dev" style="text-decoration:none;background:transparent;color:var(--cream);border:1px solid rgba(244,238,229,.3)">Entrar en modo prueba (solo local)</a>` : ''}
      <div class="sm" style="opacity:.6;text-align:center">Equipo: cuentas <b>@${st.domain}</b> · Clientes: el correo que Inherent aprobó</div>
      <div class="perm"><span class="sm" style="opacity:.7">Al entrar te pediremos permiso para:</span>
        <div>${IC.cal} <span><b>Google Calendar</b> · ver y crear eventos de proyectos</span></div>
        <div>${IC.drive} <span><b>Google Drive</b> · ver y crear archivos de la Library</span></div>
      </div>
    </div></div>`);
  if (err) history.replaceState(null, '', '/');
}

// ---------- Quién ve qué ----------
const needOk = (n) => (n === 'all' ? me.role !== 'client' : n === 'ceo' ? me.role === 'ceo' : typeof n === 'function' ? n() : me.areas.includes(n));
const tabsOf = (g) => (TABS[g] || []).filter(([, , n]) => needOk(n));
const hasOrg = () => me.role !== 'client' && ORG_AREAS.some((a) => me.areas.includes(a));
const hasMarcas = () => brandAccess(me).any;
const hasEstrategia = () => me.role !== 'client' && me.areas.includes('estrategia');
// Los espacios que esta persona puede abrir (el interruptor aparece con dos o más).
// Estrategia se mudó al Chat: ya no va en el interruptor (su pantalla sigue abriendo por link, desde el panel del Chat y con ⌘K).
const spacesFor = () => SPACES.filter(([k]) => (k === 'org' ? hasOrg() : k === 'marcas' ? hasMarcas() : false));
const sees = (k) => {
  if (k === 'me') return true;
  if (me.role === 'client') return k === 'portal';
  if (k === 'vision' || k === 'chat') return true;
  if (k === 'setup') return me.role === 'ceo';
  if (k === 'marcas') return hasMarcas();
  if (k === 'estrategia') return hasEstrategia();
  if (k === 'services') return me.areas.includes('sales');
  return me.areas.includes(k);
};
// La sección de Organization de una pantalla (el portal visto por el equipo va con Proyectos).
const sectionOf = (key) => (key === 'portal' ? 'proyectos' : ORG.map(([g]) => g).find((g) => (TABS[g] || []).some(([r]) => r.split('/')[0] === key)) || null);
// El nombre de donde estás, para la vista grande («← Proyectos / Inherent»): la pestaña abierta, o la marca en Marcas.
setViewSection(() => {
  if (!me) return '';
  const cur = resolve(hashNow());
  if (cur.key === 'marcas') return cur.rest[0] === 'diseno' ? 'Chat' : brandsNow().find((b) => b.slug === cur.rest[0])?.name || 'Marcas';
  if (cur.key === 'estrategia') return estrategiaNow().find((c) => c.slug === cur.rest[0])?.nombre || 'Estrategia';
  const path = [cur.key, ...cur.rest].join('/');
  const tab = (TABS[sectionOf(cur.key)] || []).filter(([r]) => path === r || path.startsWith(r + '/')).sort((a, z) => z[0].length - a[0].length)[0];
  return tab?.[1] || LABEL[cur.key] || '';
});

// ---------- El espacio: se recuerda por persona y la última ruta de cada uno ----------
const LS = (k) => `os.${k}.${me?.email || ''}`;
const lsGet = (k) => { try { return localStorage.getItem(LS(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS(k), v); } catch {} };
let space = null; // 'org' | 'estrategia' | 'marcas' | null (cliente)
const hashNow = () => location.hash.replace(/^#\/?/, '');

// Dónde abre Organization: lo que el CEO decidió para el perfil (por defecto Hoy).
const orgLanding = () => { const st = me.start === 'work' && me.areas.includes('home') ? 'home' : me.start; return st && st !== 'content' && me.areas.includes(st) ? st : ['home', 'work'].find((a) => me.areas.includes(a)) || ORG_AREAS.find((a) => me.areas.includes(a)) || 'vision'; };
// La casa de cada espacio (sin la última ruta).
const spaceHome = (sp) => (sp === 'marcas' ? 'marcas' : sp === 'estrategia' ? 'estrategia' : 'org/' + orgLanding());
// Al abrir la app o al tocar el interruptor: el espacio recordado y, adentro, la última ruta que se usó.
function landing(useLast = true) {
  if (me.role === 'client') return 'portal';
  let sp = lsGet('space') || (me.start === 'content' || !hasOrg() ? 'marcas' : 'org');
  if (sp === 'chat') { const l = useLast && lsGet('last.chat'); return l && l.startsWith('chat') ? l : 'chat'; }
  if (sp === 'estrategia' && !hasEstrategia()) sp = 'org';
  if (sp === 'marcas' && !hasMarcas()) sp = 'org';
  if (sp === 'org' && !hasOrg() && hasMarcas()) sp = 'marcas';
  const last = useLast && lsGet('last.' + sp);
  return last && (sp === 'org' ? last.startsWith('org/') : last.startsWith(sp)) ? last : spaceHome(sp);
}

// El dock: Organización vuelve al último espacio (Organization o Marcas) y a su última ruta; Chat, a la última conversación.
function irApp(a) {
  if (a === 'chat') { const l = lsGet('last.chat'); location.hash = '/' + (l && l.startsWith('chat') ? l : 'chat'); return; }
  let sp = lsGet('space.os'); if (!['org', 'marcas', 'estrategia'].includes(sp) || (sp === 'marcas' && !hasMarcas()) || (sp === 'org' && !hasOrg()) || (sp === 'estrategia' && !hasEstrategia())) sp = hasOrg() ? 'org' : 'marcas';
  const last = lsGet('last.' + sp);
  location.hash = '/' + (last && (sp === 'org' ? last.startsWith('org/') : last.startsWith(sp)) ? last : spaceHome(sp));
}

// ---------- Rutas: alias de las viejas y la forma canónica ----------
function alias(parts) {
  const mv = movedRoute(parts); if (mv) return mv; // lo que se mudó de sección (Ventas → Servicios…): roleviews.js → MOVED
  const [a, ...r] = parts;
  if (a === 'control-hub') return r[0] && HUB_MAP[r[0]] ? ['org', ...HUB_MAP[r[0]].split('/'), ...r.slice(1)] : ['org', 'home'];
  if (a === 'mimarca') {
    const t = r[0] || 'roadmap';
    if (t === 'inspo') return ['marcas', 'personal', 'investigacion', ...r.slice(1, 2)];
    if (t === 'contenido') return ['marcas', 'personal', ...(r[1] === 'analytics' ? ['resultados'] : r[1] === 'calendario' ? ['calendario'] : ['ideas'])];
    return ['marcas', 'personal', 'marca', ...(['roadmap', 'asociaciones'].includes(t) ? [t] : [])];
  }
  if (a === 'content') {
    let slug = r[1]; if (!slug) { try { slug = localStorage.getItem('content.profile'); } catch {} }
    if (!slug || slug === 'personal' || /-personal$/.test(slug)) slug = 'inherent';
    return ['marcas', slug, ...(CT_MOD[r[0]] || 'investigacion').split('/')];
  }
  if (a === 'clients' && r[0] && r[1] === 'marca') return ['marcas', r[0], ...(r[2] === 'inspo' ? ['investigacion'] : ['marca'])];
  if (a === 'contenido') return ['marcas'];
  if (a === 'org' && r[0] && !SCREENS[r[0]] && OLD_SECTION[r[0]]) { const t = tabsOf(OLD_SECTION[r[0]])[0]; return t ? ['org', ...t[0].split('/')] : ['org']; }
  if (!SCREENS[a] && OLD_SECTION[a]) return ['org', a];
  return null;
}
// → { key, rest, url, space }: la pantalla a abrir, su sub-ruta, la dirección canónica y su espacio.
function resolve(path) {
  let parts = path.split('/');
  if (parts.length === 1 && parts[0] === '') parts = [];
  for (let i = 0; i < 4; i++) { const n = parts.length ? alias(parts) : null; if (!n) break; parts = n; }
  const fallback = () => resolve(landing(false));
  if (!parts.length) return resolve(landing());
  if (parts[0] === 'me') return { key: 'me', rest: parts.slice(1), url: parts.join('/'), space: null };
  if (parts[0] === 'marcas') return sees('marcas') ? { key: 'marcas', rest: parts.slice(1), url: parts.join('/'), space: 'marcas' } : fallback();
  if (parts[0] === 'estrategia') return sees('estrategia') ? { key: 'estrategia', rest: parts.slice(1), url: parts.join('/'), space: 'estrategia' } : fallback();
  if (parts[0] === 'chat') return sees('chat') ? { key: 'chat', rest: parts.slice(1), url: parts.join('/'), space: 'chat' } : fallback();
  let org = parts[0] === 'org' ? parts.slice(1) : parts;
  if (!org.length) return resolve(spaceHome('org'));
  const key = org[0];
  // Control del flujo e Indicadores se volvieron parte de Hoy: sus links viejos abren Hoy.
  if (key === 'control' || key === 'resultados') return resolve('org/home');
  if (!SCREENS[key] || !sees(key) || ['content', 'mimarca', 'control-hub', 'marcas', 'estrategia'].includes(key)) return path === landing(false) ? { key: 'vision', rest: [], url: 'org/vision', space: 'org' } : fallback();
  if (key === 'portal' && me.role === 'client') return { key, rest: org.slice(1), url: org.join('/'), space: null };
  return { key, rest: org.slice(1), url: 'org/' + org.join('/'), space: 'org' };
}

// ---------- La barra (una por espacio) y las pestañas de debajo ----------
const navItems = () => {
  if (me.role === 'client') return [['portal', 'Mi portal', svg('portal')]];
  // Estrategia es un solo chat: el cliente se elige en la caja del chat, no en la barra.
  if (space === 'estrategia') return [['estrategia', 'Estrategia', svg('estrategia')]];
  // Marcas: las marcas (cada perfil se abre desde ahí). Su chat se mudó al Chat (modo Diseño); #/marcas/diseno sigue abriendo.
  if (space === 'marcas') return [['marcas', 'Todas', svg('marcas')]];
  return ORG.filter(([g]) => tabsOf(g).length).map(([g, l]) => [g, l, svg(g)]);
};
const navHtml = () => html`${navItems().map(([k, l, i]) => html`<button data-go="${k}" title="${l}">${i}<span>${l}</span></button>`)}`;
const switchHtml = () => html`<div class="space-sw" role="tablist" aria-label="Espacio" data-n="${spacesFor().length}">${spacesFor().map(([k, l]) => html`<button role="tab" data-space="${k}" aria-selected="${space === k ? 'true' : 'false'}">${l}</button>`)}<span class="space-ind" aria-hidden="true"></span></div>`;
const showSwitch = () => me.role !== 'client' && spacesFor().length >= 2;
// El botón activo de la barra según la ruta.
function navKey(cur) {
  if (!cur) return null;
  if (cur.key === 'portal' && me.role === 'client') return 'portal';
  if (cur.key === 'marcas') return cur.rest[0] === 'diseno' ? 'marcas/diseno' : 'marcas';
  if (cur.key === 'estrategia') return cur.rest[0] ? `estrategia/${cur.rest[0]}` : 'estrategia';
  return sectionOf(cur.key);
}
function moveInd() {
  const nav = $('.nav'); if (!nav) return;
  let ind = nav.querySelector('.nav-ind'); if (!ind) { ind = document.createElement('span'); ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true'); nav.prepend(ind); }
  const on = nav.querySelector('[data-go].on');
  if (!on) { ind.style.opacity = '0'; return; }
  // Medido contra la propia barra (no contra offsetParent), y vuelto a medir cuando la barra cambia de tamaño.
  const nr = nav.getBoundingClientRect(), br = on.getBoundingClientRect();
  ind.style.width = br.width + 'px'; ind.style.transform = `translateX(${br.left - nr.left + nav.scrollLeft - nav.clientLeft}px)`; ind.style.opacity = '1';
  if (!nav._ro && window.ResizeObserver) { nav._ro = new ResizeObserver(() => requestAnimationFrame(moveInd)); nav._ro.observe(nav); }
  if (!ind.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.add('ready')));
}
function moveSwitch() {
  const sw = $('.space-sw'); if (!sw) return;
  const on = sw.querySelector(`[data-space="${space}"]`), ind = sw.querySelector('.space-ind');
  sw.dataset.on = space || '';
  sw.querySelectorAll('[data-space]').forEach((b) => b.setAttribute('aria-selected', b === on ? 'true' : 'false'));
  if (!on || !ind) { if (ind) ind.style.opacity = '0'; return; }
  ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft - 3}px)`; ind.style.opacity = '1';
  if (!ind.classList.contains('ready')) requestAnimationFrame(() => requestAnimationFrame(() => ind.classList.add('ready')));
}
addEventListener('resize', () => requestAnimationFrame(() => { moveInd(); moveSwitch(); }));
document.fonts?.ready.then(() => { moveInd(); moveSwitch(); });
// La barra se vuelve a pintar cuando cambia de espacio, cuando llegan las marcas o cuando el CEO cambia la matriz.
let navFor = null;
function paintNav(force) {
  const nav = $('.nav'); if (!nav) return;
  const sig = space + '|' + navItems().map(([k]) => k).join(',');
  if (force || sig !== navFor) {
    navFor = sig; mount(nav, navHtml()); nav.setAttribute('aria-label', space === 'marcas' ? 'Marcas' : space === 'estrategia' ? 'Estrategia' : 'Organization');
    nav.classList.toggle('brands', space === 'marcas' || space === 'estrategia'); document.documentElement.dataset.space = space || '';
  }
  const top = $('.top'); const want = showSwitch();
  if (top && Boolean($('.space-sw', top)) !== want) { if (want) $('.brand', top).insertAdjacentHTML('afterend', String(switchHtml())); else $('.space-sw', top).remove(); }
  top?.classList.toggle('has-sw', want);
}
function markNav(cur = resolve(hashNow())) {
  paintNav();
  const k = navKey(cur);
  $$('.nav [data-go]').forEach((b) => { const on = b.dataset.go === k; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  paintSub(cur); moveInd(); moveSwitch(); requestAnimationFrame(() => { moveInd(); moveSwitch(); });
  // En cel, la barra de abajo se desliza hasta la sección actual (solo la barra: scrollIntoView movía toda la página en iOS).
  const nav = $('.nav'), on = $('.nav [data-go].on'); if (nav && on && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' });
}
function paintSub(cur) {
  const sub = $('#subnav'); if (!sub) return;
  let list = [], on = null;
  if (cur?.space === 'org') {
    const g = sectionOf(cur.key); list = g ? tabsOf(g).map(([r, l]) => ({ route: 'org/' + r, label: l, r })) : [];
    const path = [cur.key, ...cur.rest].join('/');
    on = list.filter((t) => path === t.r || path.startsWith(t.r + '/')).sort((a, z) => z.r.length - a.r.length)[0];
  } else if (cur?.space === 'marcas' && cur.rest[0]) {
    const b = brandsNow().find((x) => x.slug === cur.rest[0]);
    if (b) {
      const live = modulesFor(me, b), mod = cur.rest[1] || defaultModule(me, b);
      // Dos filas: las áreas (por función) y, abajo, las herramientas del área abierta. Inicio va solo, sin segunda fila.
      const area = areaOf(mod), modName = (k) => MODULES.find(([x]) => x === k);
      const tools = area[0] === 'inicio' ? [] : area[3].filter((k) => isSoon(k) || live.includes(k)).map((k) => ({ route: `marcas/${b.slug}/${k}`, label: modName(k)[1], k, soon: isSoon(k) }));
      const areas = AREAS.filter(([k, , , mods]) => k === 'inicio' ? live.includes('inicio') : mods.some((m) => isSoon(m) || live.includes(m)));
      sub.hidden = false;
      mount(sub, html`<div class="brand-nav"><div class="tabs area-tabs" role="tablist" aria-label="Áreas de la marca">${areas.map(([k, l, ic, , que]) => html`<button role="tab" class="${k === area[0] ? 'on' : ''}" aria-selected="${k === area[0] ? 'true' : 'false'}" data-sub="marcas/${b.slug}/${firstOfArea(me, b, k)}" title="${que}">${ico(ic, 15)}<span>${l}</span></button>`)}</div>
        ${tools.length ? html`<div class="tabs mod-tabs" role="tablist" aria-label="Herramientas de ${area[1]}">${tools.map((t) => html`<button role="tab" class="${t.k === mod ? 'on' : ''} ${t.soon ? 'soon' : ''}" aria-selected="${t.k === mod ? 'true' : 'false'}" data-sub="${t.route}" ${t.soon ? raw('title="Próximamente"') : ''}>${t.label}${t.soon ? html`<i class="soon-tag">Pronto</i>` : ''}</button>`)}</div>` : ''}</div>`);
      for (const tb of sub.querySelectorAll('.tabs')) { const ob = tb.querySelector('button.on'); if (ob && tb.scrollWidth > tb.clientWidth) tb.scrollLeft = ob.offsetLeft - (tb.clientWidth - ob.offsetWidth) / 2; }
      return;
    }
  }
  if (list.length < 2) { sub.hidden = true; sub.innerHTML = ''; return; }
  sub.hidden = false;
  mount(sub, html`<div class="tabs ${cur.space === 'marcas' ? 'mod-tabs' : ''}" role="tablist" aria-label="${cur.space === 'marcas' ? 'Módulos de la marca' : cur.space === 'estrategia' ? 'Bloques de la estrategia' : 'Pestañas de la sección'}">${list.map((t) => html`<button role="tab" class="${on === t ? 'on' : ''} ${t.soon ? 'soon' : ''}" aria-selected="${on === t ? 'true' : 'false'}" data-sub="${t.route}" ${t.soon ? raw('title="Próximamente"') : ''}>${t.label}${t.soon ? html`<i class="soon-tag">Pronto</i>` : ''}</button>`)}</div>`);
  const tb = sub.querySelector('.tabs'), ob = sub.querySelector('button.on'); if (tb && ob && tb.scrollWidth > tb.clientWidth) tb.scrollLeft = ob.offsetLeft - (tb.clientWidth - ob.offsetWidth) / 2;
}
events.addEventListener('roleviews', (e) => { if (!me) return; applyViews(me, e.detail); navFor = null; markNav(); const cur = resolve(hashNow()); if (cur.url !== hashNow()) render(); });
// Una pantalla cambió su ruta sola (ej. Marcas eligió el módulo con el que abre): la barra y las pestañas se ponen al día.
events.addEventListener('navsync', () => { if (me) { markNav(); if (me.role !== 'client') marcarSeccion(seccionGuia(resolve(hashNow()))); } });
// La sección para el botón «Cómo se usa» (las claves de guia-secciones.js): la sección de Organization, Estrategia, o el módulo de la marca.
const seccionGuia = (cur) => (cur.key === 'me' ? 'me' : cur.key === 'estrategia' ? 'estrategia' : cur.key === 'marcas' ? (cur.rest[0] === 'diseno' ? 'diseno' : cur.rest[0] ? cur.rest[1] || null : 'marcas') : sectionOf(cur.key));

// ---------- El buscador: «Ir a» con lo que ve este perfil ----------
function jumpItems() {
  if (me.role === 'client') return [];
  const out = [{ title: 'Chat · Inherent LLM', sub: 'Estrategia, Organización y Diseño en un solo chat', route: '#/chat', icon: icoApp('chat') }];
  if (hasOrg()) for (const [g, l] of ORG) for (const [r, tl, n] of TABS[g]) if (needOk(n)) out.push({ title: tl, sub: tl === l ? 'Organization' : `Organization · ${l}`, route: '#/org/' + r, icon: svg(g) });
  if (hasEstrategia()) { out.push({ title: 'Estrategia', sub: 'Todos los clientes', route: '#/estrategia', icon: svg('estrategia') }); for (const c of estrategiaNow()) out.push({ title: c.nombre, sub: 'Estrategia', route: `#/estrategia/${c.slug}`, icon: html`<span class="nav-mono sm">${initials(c.nombre)}</span>` }); }
  if (hasMarcas()) { out.push({ title: 'Marcas', sub: 'Todas las marcas', route: '#/marcas', icon: svg('marcas') }); if (brandAccess(me).contentFull) out.push({ title: 'Chat de Diseño gráfico', sub: 'Plan del mes, ideas y diseño', route: '#/marcas/diseno', icon: svg('estrategia') }); for (const b of brandsNow()) out.push({ title: b.name, sub: b.personal ? 'Marcas · privada' : 'Marcas', route: `#/marcas/${b.slug}`, icon: b.personal ? ico('lock', 16) : html`<span class="nav-mono sm">${initials(b.name)}</span>` }); }
  return out;
}
const search = () => { if (me && me.role !== 'client') openSearch({ jump: jumpItems }); };
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { if (!me || me.role === 'client' || !$('.app') || document.querySelector('dialog[open]')) return; e.preventDefault(); if (!searchOpen()) search(); } });

function shell() {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  mount(root, html`<div class="app">
    <header class="top">
      <div class="brand"><div class="emb">${emblem()}</div><div class="word"><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:24px;display:inline-block;vertical-align:middle"><sup>OS</sup></div></div>
      <nav class="nav" aria-label="Secciones"></nav>
      <div class="sp"></div>
      ${me.role !== 'client' ? html`<a class="tochat" href="#/chat" aria-label="Abrir el Chat (Inherent LLM)" title="Chat · Inherent LLM">${icoApp('chat')}</a>` : ''}
      ${me.role !== 'client' ? html`<button class="searchbtn" id="searchbtn" type="button" aria-label="Buscar (${mac ? '⌘' : 'Ctrl+'}K)" title="Buscar · ${mac ? '⌘' : 'Ctrl+'}K">${ico('search', 17)}<kbd>${mac ? '⌘K' : 'Ctrl K'}</kbd></button>` : ''}
      ${me.role !== 'client' ? html`<button class="pdchip" id="pdchip" type="button" hidden aria-label="Seguir tu primer día"></button><button class="guiabtn" id="guiabtn" type="button" hidden aria-label="Cómo se usa esta parte">${ico('video', 15)}<span>Cómo se usa</span></button>` : ''}
      <button class="themebtn" id="themebtn" title="Modo noche" aria-label="Cambiar modo día / noche">${raw(icoTema())}</button>
      <div class="avatar" id="avatar" title="Mi perfil" role="button" tabindex="0" aria-label="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(me.name)}</div>
    </header>
    <div id="subnav" class="subnav" hidden></div>
    <main id="main"></main>
  </div>`);
  navFor = null; paintNav(true);
  // Tocar una sección abre su primera pantalla visible; una marca, su página; «Marcas», la pantalla de inicio con las tiles.
  $('.nav').onclick = (e) => { const b = e.target.closest('[data-go]'); if (!b) return; const g = b.dataset.go; location.hash = '/' + (g === 'portal' ? 'portal' : g.startsWith('marcas') || g.startsWith('estrategia') ? g : 'org/' + (tabsOf(g)[0]?.[0] || orgLanding())); };
  $('#subnav').onclick = (e) => { const b = e.target.closest('[data-sub]'); if (b) location.hash = '/' + b.dataset.sub; };
  // El interruptor: cambia de espacio y vuelve a donde estabas en ese espacio.
  $('.top').addEventListener('click', (e) => { const b = e.target.closest('[data-space]'); if (!b || b.dataset.space === space) return; lsSet('space', b.dataset.space); const last = lsGet('last.' + b.dataset.space); location.hash = '/' + (last || spaceHome(b.dataset.space)); });
  $('#searchbtn')?.addEventListener('click', search);
  instalarBoton(me);
  // Tocar tu foto abre tu perfil (foto, cumpleaños, conexiones, cerrar sesión).
  $('#avatar').onclick = () => { location.hash = '/me'; };
  $('#avatar').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = '/me'; } };
  // Modo noche: se guarda en este navegador.
  $('#themebtn').onclick = () => ponerTema(esNoche() ? 'dia' : 'noche');
  // Las marcas llegan después (la barra de Marcas y el buscador las usan).
  if (hasMarcas()) loadBrands(me).then(() => { if (me) markNav(); });
  // Estrategia: los clientes llegan después (la barra y el buscador los usan).
  if (hasEstrategia()) loadEstrategia().then(() => { if (me) markNav(); });
}

async function render() {
  const cur = resolve(hashNow());
  // La dirección siempre dice dónde se abrió de verdad (alias y rutas que este perfil no ve se reescriben).
  if (cur.url !== hashNow()) history.replaceState(null, '', '#/' + cur.url);
  if (cur.space) { space = cur.space; lsSet('space', space); lsSet('last.' + space, cur.url); if (space !== 'chat') lsSet('space.os', space); }
  // El dock: en qué app estás. En el Chat la barra de arriba se esconde (la app ocupa toda la pantalla).
  if (me.role !== 'client') { const app = cur.space === 'chat' ? 'chat' : 'os'; document.documentElement.dataset.app = app; pintarDock(app, irApp); }
  else if (!space) space = me.role === 'client' ? null : landing().startsWith('marcas') ? 'marcas' : landing().startsWith('estrategia') ? 'estrategia' : 'org';
  if (cur.space === 'marcas' && cur.rest[0] && !brandsNow().length) loadBrands(me).then(() => { if (me) markNav(); });
  markNav(cur);
  if (me.role !== 'client') marcarSeccion(seccionGuia(cur));
  $('#avatar')?.classList.toggle('on', cur.key === 'me');
  closeDrawer();
  // Contenedor nuevo por pantalla: así no quedan escuchadores de la pantalla anterior.
  // Cambiar de sección sin saltos: arriba de una vez (sin animar el scroll) y la página no se encoge
  // mientras carga la siguiente (antes «Cargando…» la hacía chiquita y el navegador brincaba).
  const old = $('#main'), keep = old.offsetHeight;
  const main = old.cloneNode(false); main.style.minHeight = keep + 'px';
  const gen = ++renderGen, vt = canTransition(), alive = () => gen === renderGen;
  // El módulo de la pantalla llega ANTES de la transición (después de la primera vez ya está en caché): así la transición
  // nunca espera a la red y la pantalla no se queda congelada en la anterior.
  let mod = null, err = null;
  try { mod = await import(`./screens/${SCREENS[cur.key]}.js`); } catch (e) { err = e; }
  if (!alive()) return;
  const fallo = (e) => mount(main, html`<div class="warnbox ui-fallo">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : e.message || 'No cargó.'} <button type="button" class="btn ghost xs" data-reintentar>Reintentar</button></div>`);
  main.addEventListener('click', (e) => { if (e.target.closest('[data-reintentar]') && alive()) render(); });
  let lista = null;
  const pintar = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); $('.app')?.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // en el cel el que se desliza es .app
    old.replaceWith(main);
    if (!vt) { main.classList.add('enter'); setTimeout(() => main.classList.remove('enter'), 900); }
    // La forma de la pantalla mientras llegan los datos (se ve solo si tarda: antes de 160 ms no aparece nada).
    mount(main, mod?.esqueleto?.() || skel('pagina'));
    if (err) { fallo(err); return null; }
    lista = Promise.resolve()
      .then(() => mod.render(main, { me, area: cur.key, sub: cur.rest, label: LABEL[cur.key] || cur.key, alive }))
      .catch((e) => { if (alive()) fallo(e); })
      .finally(() => { if (alive()) main.style.minHeight = ''; });
    // Si la pantalla queda lista en menos de 150 ms entra directo; si no, entra su esqueleto y los datos llegan encima.
    return Promise.race([lista, new Promise((r) => setTimeout(r, 150))]);
  };
  if (vt) {
    const root = document.documentElement; root.dataset.vt = 'nav';
    const t = document.startViewTransition(pintar);
    t.finished.finally(() => { if (root.dataset.vt === 'nav') delete root.dataset.vt; });
    await t.updateCallbackDone.catch(() => {});
  } else pintar();
  await lista;
}

window.addEventListener('hashchange', () => me && render());
window.addEventListener('tema', () => { const b = $('#themebtn'); if (b) { b.innerHTML = icoTema(); b.title = esNoche() ? 'Modo día' : 'Modo noche'; } });
// Las pantallas siguen escribiendo su ruta de siempre (#/sales/quotes…). Dentro de Organization se guarda como
// #/org/sales/quotes, así recargar o compartir el link abre en el mismo lugar (y la última ruta del espacio se recuerda).
{ const rs = history.replaceState.bind(history);
  history.replaceState = (st, t, url) => {
    const m = typeof url === 'string' && /^#\/([\w-]+)(.*)$/.exec(url);
    if (m && me && location.hash.startsWith('#/org/') && ORG_SCREENS.includes(m[1])) url = '#/org/' + m[1] + m[2];
    const out = rs(st, t, url);
    if (me && typeof url === 'string') { const h = url.replace(/^#\/?/, ''); if (h.startsWith('org/')) lsSet('last.org', h); else if (h.startsWith('marcas')) lsSet('last.marcas', h); else if (h.startsWith('estrategia')) lsSet('last.estrategia', h); else if (h.startsWith('chat')) lsSet('last.chat', h); }
    return out;
  }; }
$('#veil').onclick = closeDrawer;
events.addEventListener('logout', () => { if (me) { me = null; toast('Tu sesión expiró', true); loginView(); } });

async function start(u) {
  me = u;
  if (u.role !== 'client') instalarMenu(u);
  // El servidor ya manda areas, views, scope y start aplicados; la matriz se guarda para recalcular en vivo si el CEO la cambia.
  if (me.role !== 'client') { let doc = null; const lv = Promise.all([api('db/settings'), me.role === 'ceo' ? api('internos/baseline').catch(() => null) : null]).then(([r, b]) => { if (b) baseDefaults(b.base); applyLevels((r.items || []).find((x) => x.id === LEVELS_ID)); }).catch(() => {}); try { doc = await api('db/settings/role_views'); } catch {} applyViews(me, doc); await lv; if (!hashNow()) history.replaceState(null, '', '#/' + landing()); }
  const c = pendingConnect();
  if (c && me.role !== 'client') { try { sessionStorage.removeItem('connect'); } catch {} const { consentView } = await import('./connectai.js'); return consentView(root, me, c, () => { shell(); render(); }); }
  shell(); render();
  // Las pantallas de todos los días se bajan en segundo plano: el primer clic ya no espera a que llegue su código.
  if (me.role !== 'client') { const pre = () => { for (const k of ['home', 'work', 'operations', 'sales', 'finanzas', 'clients', 'marcas', 'chat']) if (SCREENS[k] && sees(k)) import(`./screens/${SCREENS[k]}.js`).catch(() => {}); }; 'requestIdleCallback' in window ? requestIdleCallback(pre, { timeout: 3000 }) : setTimeout(pre, 1500); }
  // El primer día: la primera vez, el recorrido de 6 pasos (se puede pausar; el chip de la barra lo retoma).
  if (me.role !== 'client') primerDia(me);
  // El service worker de los avisos (web push). Sin él, nada cambia.
  if (me.role !== 'client') import('./avisos.js').then((a) => a.registrarSW()).catch(() => {});
  // Las responsabilidades recurrentes (recetas internas encendidas) dejan su tarea al abrir la app, una vez al día. El cron diario hace lo mismo.
  if (['ceo', 'coo'].includes(me.role)) { try { const d = new Date().toISOString().slice(0, 10); if (localStorage.getItem('rec.run') !== d) api('recipes/run', { method: 'POST', body: {} }).then(() => { try { localStorage.setItem('rec.run', d); } catch {} }).catch(() => {}); } catch {} }
}
api('me').then(start).catch(loginView);
// La «i» de información se pone sola en cada título que se pinta.
{ let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; infoTips(root); }); }).observe(root, { childList: true, subtree: true }); }
