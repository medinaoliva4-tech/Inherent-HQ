import { instalarMenu } from './menu-contextual.js';
import { applyViews, movedRoute } from './roleviews.js';
import { applyLevels, baseDefaults, LEVELS_ID } from './levels.js';
import { $, $$, html, raw, mount, api, events, toast, closeDrawer, setViewSection, IC, emblem, emblemaTema, initials, infoTips, canTransition, ico, skel, roleName } from './core.js';
import { openSearch, searchOpen } from './search.js';
import { marcarSeccion, instalarBoton } from './guia.js';
import { primerDia } from './primer-dia.js';
import { svgIco } from './iconos.js';
import { ponerTema, esNoche, temaElegido } from './tema.js';
import { abrirEnChat } from './areas.js';
import { WORKSPACES, wsDe, moduloDe, wsDeRuta, puedeWs } from './herramientas.js';
import { cargarContexto, contextoLista, contextoActual, contextoDe, ponerContexto, selectorHtml, instalarContexto, cerrarPopovers } from './contexto.js';

// La entrada del OS: el router, la única barra y el dueño de lo que comparten las pantallas (PLAN-WORKSPACES §3).
// Tres capas: HOME (#/home: tu día, Ask y los accesos) · ORGANIZATION (#/org/…: cómo se maneja Inherent) · AI HARNESS
// (#/ai y #/chat). Debajo, los cinco WORKSPACES de herramientas.js (#/ws/<ws>/<cliente>/<pestaña>[/<herramienta>/…]),
// que trabajan sobre el cliente del contexto (contexto.js: el selector arriba de la barra, guardado por persona).
// Una sola barra: lateral en la compu (⌘B la deja en íconos); en el cel, el chip del cliente arriba y la barra de abajo
// con sus hojas. Los nombres viven en NAV (inglés, como los puso el CEO: se cambian en un solo lugar).
// Alias, nunca 404: #/marcas/…, #/estrategia/…, #/consulting/…, #/content/…, #/mimarca/…, #/<pantalla>/… siguen
// abriendo (alias() y el hook de replaceState los canonizan a #/ws/…, #/org/… o #/home). Los permisos los pone el servidor;
// aquí solo se refleja (sees, puedeWs). Ya no existen el dock, los espacios, el switch de áreas ni la subnav.
const root = $('#root');
// El botón de día y noche muestra a dónde vas: de noche el sol, de día la luna. El tema lo lleva tema.js.
const icoTema = () => svgIco(esNoche() ? 'sun' : 'moon', 18);
export let me = null;
let renderGen = 0;

const ERR = { conector: 'No se pudo conectar la app.', dominio: 'No pudimos verificar esa cuenta de Google.', noaprobado: 'Esa cuenta todavía no tiene acceso. Pídele a Inherent que la apruebe.', estado: 'El inicio de sesión expiró. Inténtalo otra vez.', inactivo: 'Tu cuenta está desactivada. Habla con el CEO.', google: 'Google no dejó terminar el inicio de sesión.', servidor: 'Falló al guardar tu sesión.' };

// Conectar una app (Claude, ChatGPT…): llega a `/?connect=<id>`; si no hay sesión, primero se entra con Google.
{ const c = new URLSearchParams(location.search).get('connect'); if (c) { try { sessionStorage.setItem('connect', c); } catch {} history.replaceState(null, '', '/'); } }
const pendingConnect = () => { try { return sessionStorage.getItem('connect'); } catch { return null; } };

async function loginView() {
  delete document.documentElement.dataset.pantalla; delete document.documentElement.dataset.capa; delete document.documentElement.dataset.barra;
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

// ---------- Quién ve qué (refleja; el permiso lo pone el servidor) ----------
const full = (a) => me.areas.includes(a) && me.views?.[a] !== 'resumen';
const area = (a) => () => me.areas.includes(a);
const ceo = () => me.role === 'ceo';
const equipo = () => me.role !== 'client';
// Las pantallas de Organization (lo que vive en #/org/…: Mi perfil, el portal del cliente y Home van aparte).
const ORG_SCREENS = ['work', 'setup', 'clients', 'operations', 'portal', 'sales', 'services', 'finanzas', 'vision', 'team', 'roadmap', 'library'];
// Las áreas que cuentan como «ve algo de Organization» (Equipo y Visión los ve todo el equipo: no cuentan).
const ORG_AREAS = ['home', 'work', 'control', 'resultados', 'clients', 'operations', 'sales', 'finanzas', 'roadmap', 'library'];
const hasOrg = () => me.role !== 'client' && ORG_AREAS.some((a) => me.areas.includes(a));
const sees = (k) => {
  if (k === 'me') return true;
  if (me.role === 'client') return k === 'portal';
  if (['avisos', 'home', 'chat', 'ai', 'vision'].includes(k)) return true;
  if (k === 'setup') return me.role === 'ceo';
  if (k === 'services') return me.areas.includes('sales');
  if (k === 'ws') return WORKSPACES.some((w) => puedeWs(me, w.id));
  return me.areas.includes(k);
};

// ---------- La barra: el árbol de §3.2 en una sola constante ----------
// Un ítem: { id, nombre, ruta, icono, ve() }. Los grupos (Organization, AI Harness) traen `items` (y Company) como
// [id, nombre, ruta, ve?, ícono]; sin `ve`, la página la ve todo el equipo. Los workspaces salen de herramientas.js.
const NAV = [
  { id: 'home', nombre: 'Home', ruta: 'home', icono: 'nav-home', ve: equipo },
  { id: 'org', nombre: 'Organization', ruta: 'org', icono: 'nav-organization', ve: () => hasOrg(),
    items: [
      ['operations', 'Projects', 'org/operations', area('operations'), 'kanban'],
      ['work', 'Tasks', 'org/work', area('work'), 'square-check'],
      ['sales', 'CRM', 'org/sales', area('sales'), 'megaphone'],
      ['cal', 'Deadlines', 'org/operations/cal', area('operations'), 'calendar-days'],
      ['clients', 'Clients', 'org/clients', area('clients'), 'folder-open'],
      ['services', 'Services', 'org/services', () => full('sales'), 'briefcase'],
    ],
    company: [
      ['team', 'Team', 'org/team', area('team'), 'users'],
      ['vision', 'Vision', 'org/vision', equipo, 'eye'],
      ['roadmap', 'Roadmap', 'org/roadmap', area('roadmap'), 'rocket'],
      ['laya', 'Laya', 'org/team/laya', ceo, 'message-square'],
      ['setup', 'Setup', 'org/setup', ceo, 'settings'],
    ] },
  { id: 'ai', nombre: 'AI Harness', ruta: 'ai', icono: 'nav-ai', ve: equipo, portada: 'ai',
    items: [['chat', 'Chat', 'chat', null, 'chat-ia'], ['agents', 'Agents', 'ai/agents', null, 'agents'], ['skills', 'Skills', 'ai/skills', null, 'skills'], ['workflows', 'Workflows', 'ai/workflows', null, 'workflows'], ['memory', 'Memory', 'ai/memory', null, 'memory'], ['models', 'Models', 'ai/models', null, 'models'], ['evals', 'Evaluations', 'ai/evals', null, 'evals']] },
  ...WORKSPACES.map((w) => ({ id: w.id, nombre: w.nombre, ruta: 'ws/' + w.id, icono: w.icono, color: w.color, ws: w, ve: () => puedeWs(me, w.id) })),
  { id: 'library', nombre: 'Library', ruta: 'org/library', icono: 'nav-library', ve: area('library') },
  { id: 'finances', nombre: 'Finances', ruta: 'org/finanzas', icono: 'nav-finances', ve: area('finanzas') },
];
const navDe = (id) => NAV.find((n) => n.id === id);
const esGrupo = (n) => Boolean(n.items || n.company);
const veIt = ([, , , v]) => !v || v();
const itemsDe = (n, k = 'items') => (n[k] || []).filter(veIt);
// Todas las páginas de un ítem (sin filtrar por perfil) y solo las que esta persona ve.
const todasDe = (n) => (esGrupo(n) ? [...(n.items || []), ...(n.company || [])] : [[n.id, n.nombre, n.ruta, null, n.icono]]);
const paginasDe = (n) => (esGrupo(n) ? [...itemsDe(n), ...itemsDe(n, 'company')] : todasDe(n));
// Una página está «abierta» cuando la ruta es ella o empieza por ella; gana la más larga (org/operations/cal antes que org/operations).
const enRuta = (url, ruta) => url === ruta || url.startsWith(ruta + '/');
// → [página, ítem de NAV] donde está la ruta, o null.
function paginaDe(url) {
  let mejor = null;
  for (const n of NAV) if (n.ve()) for (const it of paginasDe(n)) if (enRuta(url, it[2]) && (!mejor || it[2].length > mejor[0][2].length)) mejor = [it, n];
  return mejor;
}
const enCompany = (url) => itemsDe(navDe('org'), 'company').some((it) => enRuta(url, it[2]));
// Un grupo está en su ruta cuando la página abierta es suya; sin página (la portada del Harness, el portal visto por el
// equipo) vale el prefijo de su ruta (Library y Finances viven en org/… pero son ítems de primer nivel: no cuentan).
const grupoEnRuta = (n, url) => { const pag = paginaDe(url); return pag ? pag[1] === n : enRuta(url, n.ruta); };

const SCREENS = { me: 'me', avisos: 'avisos', home: 'home', work: 'work', finanzas: 'finance', sales: 'sales', services: 'services', operations: 'operations', roadmap: 'roadmap', clients: 'clients', library: 'library', team: 'team', setup: 'setup', portal: 'portal', vision: 'vision', chat: 'llm', ai: 'harness', ws: 'workspace' };
// El nombre de cada pantalla (lo que recibe en `label`): los de NAV, más las que no están en la barra.
const LABEL = { me: 'Mi perfil', avisos: 'Avisos', portal: 'Mi portal', chat: 'Chat', ai: 'AI Harness', ws: 'Workspaces', home: 'Home' };
for (const n of NAV) for (const [, nombre, ruta] of todasDe(n)) { const m = /^org\/([\w-]+)$/.exec(ruta); if (m && !LABEL[m[1]]) LABEL[m[1]] = nombre; }
// La capa de cada pantalla (html[data-capa]): home · org · ai · ws · '' (Mi perfil, Avisos, el portal).
const capaDe = (k) => (k === 'home' ? 'home' : k === 'ws' ? 'ws' : k === 'chat' || k === 'ai' ? 'ai' : ORG_SCREENS.includes(k) ? 'org' : '');

// ---------- Alias de rutas viejas (PLAN §3.6) ----------
const HUB_MAP = { control: 'home', operations: 'org/operations', work: 'org/work', sales: 'org/sales', finanzas: 'org/finanzas', resultados: 'home', responsabilidades: 'org/services/responsabilidades', vistas: 'org/team/vistas', setup: 'org/setup' };
const CT_MOD = { research: 'investigacion', refs: 'investigacion', semana: 'investigacion', shot: 'investigacion', postear: 'ideas', guiones: 'creacion', plan: 'calendario', calendario: 'calendario', analytics: 'resultados', bandeja: 'calendario/analytics' };
// Las secciones de antes → las pantallas que las formaban (abre la primera que esta persona ve).
const OLD_SECTION = { hoy: ['home', 'work'], clientes: ['clients', 'operations'], proyectos: ['clients', 'operations'], ventas: ['sales'], comercial: ['sales'], servicios: ['services'], finanzas: ['finanzas'], inherent: ['vision', 'team', 'roadmap', 'library', 'setup'], equipo: ['team'] };

// ---------- Lo que se recuerda por persona (localStorage, siempre en try/catch) ----------
const LS = (k) => `os.${k}.${me?.email || ''}`;
const lsGet = (k) => { try { return localStorage.getItem(LS(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS(k), v); } catch {} };
const hashNow = () => location.hash.replace(/^#\/?/, '');
const desk = matchMedia('(min-width: 761px)');

// ---------- Rutas: alias de las viejas y la forma canónica ----------
function alias(parts) {
  const mv = movedRoute(parts); if (mv) return mv; // lo que se mudó de sección (Ventas → Servicios…): roleviews.js → MOVED
  const [a, ...r] = parts;
  const deWs = (ruta) => (ruta === 'home' ? ['home'] : ruta.split('/'));
  if (a === 'control-hub') { const to = r[0] && HUB_MAP[r[0]]; return to ? [...to.split('/'), ...r.slice(1)] : ['home']; }
  if (a === 'org' && (!r.length || r[0] === 'home')) return ['home'];
  if (a === 'mimarca') {
    const t = r[0] || 'roadmap';
    if (t === 'inspo') return ['marcas', 'personal', 'investigacion', ...r.slice(1, 2)];
    if (t === 'contenido') return ['marcas', 'personal', ...(r[1] === 'analytics' ? ['resultados'] : r[1] === 'calendario' ? ['calendario'] : ['ideas'])];
    return ['marcas', 'personal', 'marca', ...(['roadmap', 'asociaciones'].includes(t) ? [t] : [])];
  }
  if (a === 'content') {
    let slug = r[1] || ''; if (!slug) { try { slug = localStorage.getItem('content.profile') || ''; } catch { slug = ''; } }
    // Las fuentes son el Customer Bullseye (Strategy › Research), con el slug tal cual (la marca personal también).
    if (r[0] === 'fuentes') { const s = slug || contextoActual(me); return s ? ['ws', 'strategy', s, 'research', 'customer-bullseye'] : ['ws', 'strategy']; }
    if (!slug || slug === 'personal' || /-personal$/.test(slug)) slug = 'inherent';
    return ['marcas', slug, ...(CT_MOD[r[0]] || 'investigacion').split('/')];
  }
  if (a === 'clients' && r[0] && r[1] === 'marca') return ['marcas', r[0], ...(r[2] === 'inspo' ? ['investigacion'] : ['marca'])];
  if (a === 'contenido') return ['home'];
  // Marcas, Estrategia y Consulting de antes → su workspace (herramientas.js sabe la tabla; el contexto llena el cliente que falte).
  if (a === 'marcas' || a === 'estrategia' || a === 'consulting') { const w = wsDeRuta(parts.join('/'), { contexto: contextoActual(me) }); return w?.ruta ? deWs(w.ruta) : ['home']; }
  if (a === 'org' && r[0] && !SCREENS[r[0]] && OLD_SECTION[r[0]]) { const k = OLD_SECTION[r[0]].find((x) => sees(x)); return !k || k === 'home' ? ['home'] : ['org', k]; }
  if (!SCREENS[a] && OLD_SECTION[a]) return ['org', a];
  return null;
}
// → { key, rest, url }: la pantalla a abrir, su sub-ruta y la dirección canónica.
function resolve(path) {
  let parts = path.replace(/\/+$/, '').split('/');
  if (parts.length === 1 && parts[0] === '') parts = [];
  for (let i = 0; i < 4; i++) { const n = parts.length ? alias(parts) : null; if (!n) break; parts = n; }
  const fallback = () => resolve(landing(false));
  if (!parts.length) return resolve(landing());
  const a = parts[0];
  if (a === 'me') return { key: 'me', rest: parts.slice(1), url: parts.join('/') };
  if (a === 'avisos') return sees('avisos') ? { key: 'avisos', rest: [], url: 'avisos' } : fallback();
  if (a === 'home') return sees('home') ? { key: 'home', rest: [], url: 'home' } : fallback();
  if (a === 'chat') return sees('chat') ? { key: 'chat', rest: parts.slice(1), url: parts.join('/') } : fallback();
  if (a === 'ai') return sees('ai') ? { key: 'ai', rest: parts.slice(1, 2), url: parts.slice(0, 2).join('/') } : fallback();
  if (a === 'ws') {
    const w = wsDeRuta(parts.join('/'), { contexto: contextoActual(me) });
    if (!w?.ws || !puedeWs(me, w.ws)) return fallback();
    let url = w.ruta;
    // Sin cliente: el del contexto, si esta persona lo ve; si no, el workspace solo (workspace.js muestra el selector en grande).
    if (!w.slug) { const ctx = contextoActual(me); if (ctx && contextoDe(ctx)) url = `ws/${w.ws}/${ctx}/overview`; }
    return { key: 'ws', rest: url.split('/').slice(1), url };
  }
  const org = a === 'org' ? parts.slice(1) : parts;
  if (!org.length) return fallback();
  const key = org[0];
  // Control del flujo e Indicadores se volvieron parte de Home: sus links viejos abren Home.
  if (key === 'control' || key === 'resultados') return resolve('home');
  if (!SCREENS[key] || !ORG_SCREENS.includes(key) || !sees(key)) return path === landing(false) ? { key: 'vision', rest: [], url: 'org/vision' } : fallback();
  if (key === 'portal' && me.role === 'client') return { key, rest: org.slice(1), url: org.join('/') };
  return { key, rest: org.slice(1), url: 'org/' + org.join('/') };
}
// Una ruta guardada que todavía puede abrir (solo la forma; el permiso lo revisa resolve, sin volver a landing).
const esRutaViva = (r) => /^(home|ai|chat|avisos|me)(\/|$)|^(org|ws)\/./.test(r || '');
// Dónde abre la app: la última ruta, o lo que el CEO decidió para el perfil (me.start) → Home, una sección o un workspace.
function landing(useLast = true) {
  if (me.role === 'client') return 'portal';
  const last = useLast ? lsGet('last.route') : null;
  if (last && esRutaViva(last)) return last;
  const st = me.start || 'home';
  if (st === 'content') return puedeWs(me, 'marketing') ? 'ws/marketing' : puedeWs(me, 'strategy') ? 'ws/strategy' : 'home';
  if (st === 'home') return 'home';
  if (SCREENS[st] && ORG_SCREENS.includes(st) && sees(st)) return 'org/' + st;
  if (!hasOrg()) { if (puedeWs(me, 'marketing')) return 'ws/marketing'; if (puedeWs(me, 'strategy')) return 'ws/strategy'; }
  return 'home';
}
// El nombre de donde estás, para la vista grande («← Projects / Inherent»): la página de la barra, o el cliente en un workspace.
setViewSection(() => {
  if (!me) return '';
  const cur = resolve(hashNow());
  if (cur.key === 'ws') return contextoDe(cur.rest[1])?.name || wsDe(cur.rest[0])?.nombre || 'Workspaces';
  return paginaDe(cur.url)?.[0]?.[1] || LABEL[cur.key] || '';
});

// ---------- La sección para «Cómo se usa» (las claves de guia-secciones.js) ----------
const SECCION_ORG = { work: 'hoy', clients: 'proyectos', operations: 'proyectos', portal: 'proyectos', sales: 'ventas', services: 'servicios', finanzas: 'finanzas', vision: 'inherent', team: 'inherent', roadmap: 'inherent', library: 'inherent', setup: 'inherent' };
function seccionGuia(cur) {
  if (cur.key === 'me') return 'me';
  if (cur.key === 'home') return 'home';
  if (cur.key === 'ai') return 'ai';
  if (cur.key === 'ws') {
    const [ws, , , tool, resto] = cur.rest;
    // La herramienta abierta por su clave de módulo de antes (los videos ya grabados siguen calzando); si no, el workspace.
    const mod = !tool ? '' : tool === 'design-studio' ? 'diseno' : tool === 'creative-direction-lab' && resto === 'formatos' ? 'formatos' : moduloDe(tool);
    return mod || `ws-${ws}`;
  }
  return SECCION_ORG[cur.key] || null;
}

// ---------- Los grupos de la barra (abiertos o cerrados) ----------
// Un grupo está abierto cuando la ruta es suya o la persona lo abrió (os.lat.grp.<correo> = {"org":true,…}). Cerrarlo
// estando en su ruta dura hasta la siguiente navegación (si no, el botón no serviría de nada).
let grpCerrado = new Set();
const grpGuardados = () => { try { return JSON.parse(lsGet('lat.grp') || '{}') || {}; } catch { return {}; } };
const grpAbierto = (id, enSuRuta) => (enSuRuta && !grpCerrado.has(id)) || grpGuardados()[id] === true;
const grpEnRuta = (id, cur) => (id === 'company' ? enCompany(cur.url) : grupoEnRuta(navDe(id), cur.url));
function toggleGrp(id) {
  const cur = resolve(hashNow()), en = grpEnRuta(id, cur), g = grpGuardados();
  if (grpAbierto(id, en)) { g[id] = false; if (en) grpCerrado.add(id); } else { g[id] = true; grpCerrado.delete(id); }
  lsSet('lat.grp', JSON.stringify(g)); paintLat(cur);
  $(`.lat [data-grp-tg="${id}"]`)?.focus();
}

// ---------- La barra lateral (compu) ----------
const latMini = () => lsGet('barra.mini') === '1';
const latIt = (ruta, label, icon, on, { sub = '', style = '' } = {}) => html`<a class="lat-it${on ? ' on' : ''}" href="#/${ruta}" title="${label}"${on ? raw(' aria-current="page"') : ''}${style ? raw(` style="${style}"`) : ''}>${icon}<span class="lat-t">${label}</span></a>${sub}`;
const latSubs = (xs) => (xs.length ? html`<div class="lat-subs">${xs.map(([ruta, label, on, icon]) => html`<a class="${on ? 'on' : ''}" href="#/${ruta}"${on ? raw(' aria-current="page"') : ''}>${icon || ''}${label}</a>`)}</div>` : '');
// Organization y AI Harness: el ítem abre su portada (el Harness) o su primera página visible (Organization no tiene portada);
// la flecha solo abre o cierra; Company va colapsado adentro.
function latGrupo(n, cur) {
  const items = itemsDe(n), comp = itemsDe(n, 'company'), pag = paginaDe(cur.url), enEste = grupoEnRuta(n, cur.url), enComp = n.id === 'org' && enCompany(cur.url);
  const abierto = grpAbierto(n.id, enEste), compAbierto = grpAbierto('company', enComp);
  const primera = n.portada || (items[0] || comp[0])?.[2] || n.ruta, esOn = (it) => pag?.[0] === it;
  const link = (it) => html`<a class="${esOn(it) ? 'on' : ''}" href="#/${it[2]}"${esOn(it) ? raw(' aria-current="page"') : ''}>${it[1]}</a>`;
  return html`<div class="lat-grp" data-grp="${n.id}"${abierto ? raw(' open') : ''}>${latIt(primera, n.nombre, ico(n.icono, 16), enEste)}<button type="button" class="lat-grp-tg" data-grp-tg="${n.id}" aria-expanded="${abierto ? 'true' : 'false'}" aria-label="${abierto ? 'Cerrar' : 'Abrir'} ${n.nombre}">${ico('chevron-down', 14)}</button>
    <div class="lat-subs">${items.map(link)}${comp.length ? html`<div class="lat-sub-grp" data-grp="company"${compAbierto ? raw(' open') : ''}><button type="button" class="lat-sub-tg" data-grp-tg="company" aria-expanded="${compAbierto ? 'true' : 'false'}">Company ${ico('chevron-down', 12)}</button><div class="lat-subs">${comp.map(link)}</div></div>` : ''}</div></div>`;
}
// Un workspace: su ítem con su color; el abierto muestra sus pestañas debajo (con el cliente de la ruta).
function latWs(n, cur) {
  const on = cur.key === 'ws' && cur.rest[0] === n.id, slug = on ? cur.rest[1] || '' : '';
  const sub = slug ? latSubs(n.ws.pestanas.map((p) => [`ws/${n.id}/${slug}/${p.id}`, p.nombre, p.id === cur.rest[2]])) : '';
  return latIt(n.ruta, n.nombre, ico(n.icono, 16), on, { sub, style: `--ac:var(${n.color})` });
}
// El subtítulo de «Ask InherentOS»: el modo con el que abriría el Chat y el cliente.
const chatSub = (cur) => { const w = cur.key === 'ws' ? wsDe(cur.rest[0]) : null, c = contextoDe((cur.key === 'ws' && cur.rest[1]) || contextoActual(me)); return `${w ? w.nombre : 'Organization'}${c ? ' · ' + c.name : ''}`; };
function paintLat(cur = resolve(hashNow())) {
  const lat = $('.lat'), nav = lat && $('#lat-nav', lat); if (!nav) return;
  // Se vuelve a pintar en cada navegación: el foco del teclado se queda en el mismo link o en la misma flecha.
  const act = document.activeElement?.closest?.('#lat-nav a, #lat-nav button'), foco = act ? act.getAttribute('href') || act.dataset.grpTg || '' : '';
  const cab = cur.key === 'me' ? latIt('me', 'Mi perfil', ico('user', 16), true) : '';
  if (me.role === 'client') { mount(nav, html`${cab}${latIt('portal', 'Mi portal', ico('nav-portal', 16), cur.key === 'portal')}`); return; }
  const pag = paginaDe(cur.url); let rotulo = false;
  mount(nav, html`${cab}${NAV.filter((n) => n.ve()).map((n) => {
    if (n.ws) { const k = rotulo ? '' : html`<span class="lat-k">Workspaces</span>`; rotulo = true; return html`${k}${latWs(n, cur)}`; }
    if (esGrupo(n)) return latGrupo(n, cur);
    return latIt(n.ruta, n.nombre, ico(n.icono, 16), pag?.[0]?.[2] === n.ruta);
  })}`);
  $('.lat-avisos', lat)?.classList.toggle('on', cur.key === 'avisos');
  const sub = $('#lat-chat-sub', lat); if (sub) sub.textContent = chatSub(cur);
  if (foco) [...nav.querySelectorAll('a, button')].find((x) => x.getAttribute('href') === foco || x.dataset.grpTg === foco)?.focus();
  $('.lat-it.on', lat)?.scrollIntoView?.({ block: 'nearest' });
}
// El selector de cliente (arriba de la barra; en el cel, el chip de arriba). Se repinta cuando llega la lista o cambia el elegido.
function pintarSelector() {
  if (me.role === 'client') return;
  for (const el of [$('#lat-ctx'), $('#top-ctx')]) if (el) { mount(el, selectorHtml(me)); if ($('.ctx-pop')) $('[data-ctx-menu]', el)?.setAttribute('aria-expanded', 'true'); }
}
function markNav(cur = resolve(hashNow())) { paintLat(cur); paintCel(cur); }
// «Ask InherentOS»: abre el Chat en el modo del workspace abierto (o Organización) con el cliente del contexto.
function preguntarAlChat() {
  const cur = resolve(hashNow()), w = cur.key === 'ws' ? wsDe(cur.rest[0]) : null;
  const slug = (cur.key === 'ws' && cur.rest[1]) || contextoActual(me);
  const mes = cur.key === 'ws' && cur.rest[3] === 'content-strategy-studio' && /^\d{4}-\d{2}$/.test(cur.rest[4] || '') ? cur.rest[4] : '';
  abrirEnChat(me.email, { modo: w?.modo || 'organizacion', slug, mes });
}
// Tu primer día y «Cómo se usa» son los mismos botones de siempre: en la compu viven abajo en la barra; en el cel, arriba.
function ubicarAyuda() { const dest = desk.matches ? $('#lat-ayuda') : $('#top-ayuda'); if (dest) for (const id of ['pdchip', 'guiabtn']) { const b = $('#' + id); if (b && b.parentElement !== dest) dest.append(b); } }
// Todo popover propio lleva data-popover: cerrarPopovers (contexto.js) los quita; aquí además se apagan sus botones.
function cerrarTodo() { cerrarPopovers(); for (const b of $$('[data-hoja], [data-lat="yo"]')) b.setAttribute('aria-expanded', 'false'); }
function menuYo(btn) {
  const viejo = $('.lat-menu'); cerrarTodo(); if (viejo) return;
  const m = document.createElement('div'); m.className = 'lat-menu'; m.setAttribute('role', 'menu'); m.setAttribute('data-popover', '');
  const pintar = () => mount(m, html`<span class="lat-menu-k">Día y noche</span><div class="lat-tema" role="group" aria-label="Día y noche">${[['sistema', 'Como mi compu'], ['dia', 'Día'], ['noche', 'Noche']].map(([k, l]) => html`<button type="button" class="${temaElegido() === k ? 'on' : ''}" aria-pressed="${temaElegido() === k ? 'true' : 'false'}" data-tema="${k}">${l}</button>`)}</div>
    <a role="menuitem" href="#/me">${ico('user', 15)} Mi perfil</a>`);
  pintar(); btn.closest('.lat-yo').append(m); btn.setAttribute('aria-expanded', 'true');
  m.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tema]'); if (t) { ponerTema(t.dataset.tema); pintar(); m.querySelector(`[data-tema="${t.dataset.tema}"]`)?.focus(); return; }
    if (e.target.closest('a')) cerrarTodo();
  });
}
const ponerMini = (on) => { lsSet('barra.mini', on ? '1' : '0'); document.documentElement.toggleAttribute('data-lat-mini', on); if (me) paintLat(); const b = $('.lat [data-lat="mini"]'); if (b) { b.setAttribute('aria-label', on ? 'Mostrar la barra (⌘B)' : 'Esconder la barra (⌘B)'); b.title = on ? 'Mostrar la barra · ⌘B' : 'Esconder la barra · ⌘B'; } };
function latHtml(mac) {
  const cliente = me.role === 'client';
  return html`<aside class="lat" aria-label="Barra lateral">
    <a class="lat-marca" href="#/${cliente ? 'portal' : 'home'}" aria-label="Inherent OS"><span class="lat-emb">${emblemaTema()}</span><span class="lat-wm"><img class="wm-dia" src="/brand/wordmark-dark.svg" alt="Inherent"><img class="wm-noche" src="/brand/wordmark-light.svg" alt=""><sup>OS</sup></span></a>
    ${cliente ? '' : html`<div class="lat-ctx" id="lat-ctx">${selectorHtml(me)}</div>
    <button type="button" class="lat-it lat-buscar" data-lat="buscar" title="Buscar · ${mac ? '⌘' : 'Ctrl+'}K">${ico('search', 16)}<span class="lat-t">Buscar</span><kbd>${mac ? '⌘K' : 'Ctrl K'}</kbd></button>
    <a class="lat-it lat-avisos" href="#/avisos" data-avisos title="Avisos">${ico('bell', 16)}<span class="lat-t">Avisos</span><b class="lat-n" data-avisos-n hidden></b></a>`}
    <nav class="lat-nav" id="lat-nav" aria-label="Secciones"></nav>
    <div class="lat-pie">
      ${cliente ? '' : html`<div class="lat-ayuda" id="lat-ayuda"></div>
      <button type="button" class="lat-chat" data-lat="chat" title="Ask InherentOS: abre el Chat con lo que estás viendo">${ico('chat-ia', 20)}<span><b>Ask InherentOS</b><small id="lat-chat-sub"></small></span></button>`}
      <div class="lat-yo"><button type="button" class="lat-yo-b" data-lat="yo" aria-haspopup="menu" aria-expanded="false" title="Tú: día y noche, Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<i>${initials(me.name)}</i>`}<span><b>${me.name}</b><small>${me.title || roleName(me.role)}</small></span></button>
        <button type="button" class="lat-ib" data-lat="mini" aria-label="Esconder la barra (⌘B)" title="Esconder la barra · ⌘B">${ico('panel-left', 16)}</button></div>
    </div></aside>`;
}
// Lo que hacen los botones de la barra (y los mismos dentro de la hoja «Más» del cel).
function accionLat(k, b) {
  if (k === 'buscar') return search();
  if (k === 'chat') return preguntarAlChat();
  if (k === 'yo') return menuYo(b);
  if (k === 'mini') return ponerMini(!latMini());
  if (k === 'guia') return $('#guiabtn')?.click();
}
function instalarLat() {
  const lat = $('.lat'); if (!lat) return;
  lat.addEventListener('click', (e) => {
    const tg = e.target.closest('[data-grp-tg]'); if (tg) return toggleGrp(tg.dataset.grpTg);
    const b = e.target.closest('[data-lat]'); if (b) accionLat(b.dataset.lat, b);
  });
  ponerMini(latMini());
  desk.addEventListener('change', () => { ubicarAyuda(); markNav(); });
  ubicarAyuda();
}
// ⌘B (Ctrl+B): la barra con o sin nombres. No cuando se escribe.
document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 'b' || !me || !desk.matches || !$('.lat')) return;
  if (e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  e.preventDefault(); ponerMini(!latMini());
});

// ---------- El cel: el chip del cliente arriba, la barra de abajo y sus hojas ----------
function celHtml() {
  const b = (id, label, icon, hoja = true) => (hoja ? html`<button type="button" class="nc-b" data-nc="${id}" data-hoja="${id}" aria-haspopup="dialog" aria-expanded="false">${ico(icon, 20)}<span>${label}</span></button>` : html`<a class="nc-b" href="#/${id}" data-nc="${id}">${ico(icon, 20)}<span>${label}</span></a>`);
  if (me.role === 'client') return html`<nav class="nav-cel" aria-label="Secciones">${b('portal', 'Mi portal', 'nav-portal', false)}${b('mas', 'Más', 'ellipsis')}</nav>`;
  return html`<nav class="nav-cel" aria-label="Secciones">${b('home', 'Home', 'nav-home', false)}${hasOrg() ? b('org', 'Organization', 'nav-organization') : ''}${b('ai', 'AI', 'nav-ai')}${sees('ws') ? b('ws', 'Workspaces', 'layout-grid') : ''}${b('mas', 'Más', 'ellipsis')}</nav>`;
}
// El botón de abajo que corresponde a la ruta.
const celKey = (cur) => (cur.key === 'home' ? 'home' : cur.key === 'ws' ? 'ws' : cur.key === 'chat' || cur.key === 'ai' ? 'ai' : ['library', 'finanzas', 'avisos', 'me'].includes(cur.key) ? 'mas' : cur.key === 'portal' && me.role === 'client' ? 'portal' : ORG_SCREENS.includes(cur.key) ? 'org' : '');
function paintCel(cur = resolve(hashNow())) {
  const k = celKey(cur);
  for (const b of $$('.nav-cel [data-nc]')) { const on = b.dataset.nc === k; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); }
}
// La hoja de abajo: una sola (div.hoja[data-popover] en body) con los links del grupo; se cierra al navegar, afuera y con Escape.
function abrirHoja(id, btn) {
  const misma = $('.hoja')?.dataset.hoja === id; cerrarTodo(); if (misma) return;
  const cur = resolve(hashNow()), pag = paginaDe(cur.url);
  const it = (ruta, label, icon, on, style = '') => html`<a class="hoja-it${on ? ' on' : ''}" href="#/${ruta}"${on ? raw(' aria-current="page"') : ''}${style ? raw(` style="${style}"`) : ''}>${icon}<span>${label}</span></a>`;
  const bt = (k, label, icon) => html`<button type="button" class="hoja-it" data-lat="${k}">${icon}<span>${label}</span></button>`;
  const deNav = (xs) => xs.map((x) => it(x[2], x[1], ico(x[4] || 'dot', 18), pag?.[0] === x));
  let titulo = '', cuerpo = '';
  if (id === 'org') { const n = navDe('org'), comp = itemsDe(n, 'company'); titulo = n.nombre; cuerpo = html`${deNav(itemsDe(n))}${comp.length ? html`<span class="lat-k">Company</span>${deNav(comp)}` : ''}`; }
  else if (id === 'ai') { const n = navDe('ai'); titulo = n.nombre; cuerpo = html`${it(n.portada, n.nombre, ico(n.icono, 18), cur.url === n.portada)}${deNav(itemsDe(n))}`; }
  else if (id === 'ws') {
    titulo = 'Workspaces';
    cuerpo = html`${NAV.filter((n) => n.ws && n.ve()).map((n) => { const on = cur.key === 'ws' && cur.rest[0] === n.id, slug = on ? cur.rest[1] || '' : ''; return html`${it(n.ruta, n.nombre, ico(n.icono, 18), on, `--ac:var(${n.color})`)}${slug ? html`<div class="hoja-subs">${n.ws.pestanas.map((p) => it(`ws/${n.id}/${slug}/${p.id}`, p.nombre, '', p.id === cur.rest[2]))}</div>` : ''}`; })}`;
  } else {
    titulo = 'Más';
    const lib = navDe('library'), fin = navDe('finances'), guia = $('#guiabtn');
    cuerpo = me.role === 'client' ? html`${it('me', 'Mi perfil', ico('user', 18), cur.key === 'me')}` : html`${lib.ve() ? it(lib.ruta, lib.nombre, ico(lib.icono, 18), pag?.[0]?.[2] === lib.ruta) : ''}${fin.ve() ? it(fin.ruta, fin.nombre, ico(fin.icono, 18), pag?.[0]?.[2] === fin.ruta) : ''}
      ${it('avisos', 'Avisos', ico('bell', 18), cur.key === 'avisos')}${bt('buscar', 'Buscar', ico('search', 18))}${bt('chat', 'Ask InherentOS', ico('chat-ia', 18))}${it('me', 'Mi perfil', ico('user', 18), cur.key === 'me')}${guia && !guia.hidden ? bt('guia', 'Cómo se usa', ico('video', 18)) : ''}`;
  }
  const h = document.createElement('div'); h.className = 'hoja'; h.dataset.hoja = id; h.setAttribute('data-popover', ''); h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', titulo);
  mount(h, html`<div class="hoja-h"><b>${titulo}</b><button type="button" class="lat-ib" data-hoja-x aria-label="Cerrar">${ico('x', 16)}</button></div><div class="hoja-lista">${cuerpo}</div>`);
  document.body.append(h); btn?.setAttribute('aria-expanded', 'true');
  ($('.hoja-it.on', h) || $('.hoja-it', h))?.focus();
}
// Un solo juego de manejadores a nivel document para las hojas y el menú de «tú» (Anexo A: abrir o cerrar lo decide el DOM).
document.addEventListener('click', (e) => {
  if (!me) return;
  if (e.target.closest('[data-hoja-x]')) return cerrarTodo();
  const b = e.target.closest('[data-hoja]'); if (b) return abrirHoja(b.dataset.hoja, b);
  const l = e.target.closest('.hoja [data-lat]'); if (l) { cerrarTodo(); accionLat(l.dataset.lat, l); }
});
document.addEventListener('pointerdown', (e) => { if ($('[data-popover]') && !e.target?.closest?.('[data-popover], [data-hoja], [data-lat="yo"]')) cerrarTodo(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !$('[data-popover]')) return;
  const volver = $('[data-hoja][aria-expanded="true"]') || $('.lat [data-lat="yo"]'); cerrarTodo(); volver?.focus();
});

// ---------- El buscador: «Ir a» con lo que ve este perfil ----------
function jumpItems() {
  if (me.role === 'client') return [];
  const out = [], ctx = contextoActual(me), ctxN = contextoDe(ctx)?.name || '';
  const push = (title, sub, route, icon) => out.push({ title, sub, route, icon: String(icon) });
  push('Chat', 'AI Harness · Inherent LLM', '#/chat', svgIco('chat-ia', 16));
  push('Avisos', 'Lo que pide atención: tu trabajo, cada cliente y la plataforma', '#/avisos', svgIco('bell', 16));
  push('Home', 'Tu día, tus accesos y lo que necesita tu decisión', '#/home', svgIco('nav-home', 16));
  const org = navDe('org');
  if (org.ve()) { for (const it of itemsDe(org)) push(it[1], 'Organization', '#/' + it[2], svgIco(it[4], 16)); for (const it of itemsDe(org, 'company')) push(it[1], 'Organization · Company', '#/' + it[2], svgIco(it[4], 16)); }
  for (const it of itemsDe(navDe('ai')).slice(1)) push(it[1], 'AI Harness', '#/' + it[2], svgIco(it[4], 16));
  for (const n of NAV) if (n.ws && n.ve()) { push(n.nombre, ctxN ? `Workspace · ${ctxN}` : 'Workspace', '#/' + n.ruta, svgIco(n.icono, 16)); if (ctx) for (const p of n.ws.pestanas) push(`${n.nombre} · ${p.nombre}`, ctxN, `#/ws/${n.id}/${ctx}/${p.id}`, svgIco(n.icono, 16)); }
  for (const id of ['library', 'finances']) { const n = navDe(id); if (n.ve()) push(n.nombre, 'Organization', '#/' + n.ruta, svgIco(n.icono, 16)); }
  // Cada cliente abre en el último workspace que usaste (o Marketing; la marca personal en Creative), en su Overview.
  const ult = lsGet('ws.ultimo');
  const wsPara = (c) => [...(c.personal ? ['creative', 'production'] : []), ult, 'marketing', 'strategy', 'creative', 'consulting', 'production'].find((w) => w && puedeWs(me, w));
  for (const c of contextoLista()) { const w = wsPara(c); if (w) push(c.name, c.personal ? 'Cliente · privada' : `Cliente · ${wsDe(w).nombre}`, `#/ws/${w}/${c.slug}/overview`, c.personal ? svgIco('lock', 16) : html`<span class="nav-mono sm">${initials(c.name)}</span>`); }
  return out;
}
const search = () => { if (me && me.role !== 'client') openSearch({ jump: jumpItems }); };
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { if (!me || me.role === 'client' || !$('.app') || document.querySelector('dialog[open]')) return; e.preventDefault(); if (!searchOpen()) search(); } });

// ---------- El cascarón: la barra, la cabecera del cel y el main ----------
function shell() {
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
  const cliente = me.role === 'client';
  document.documentElement.dataset.barra = 'lateral';
  mount(root, html`${latHtml(mac)}<div class="app">
    <header class="top">
      <div class="brand"><div class="emb">${emblemaTema()}</div><div class="word"><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:24px;display:inline-block;vertical-align:middle"><sup>OS</sup></div></div>
      ${cliente ? '' : html`<div class="top-ctx" id="top-ctx">${selectorHtml(me)}</div>`}
      <div class="sp"></div>
      ${cliente ? '' : html`<button class="searchbtn" id="searchbtn" type="button" aria-label="Buscar (${mac ? '⌘' : 'Ctrl+'}K)" title="Buscar · ${mac ? '⌘' : 'Ctrl+'}K">${ico('search', 17)}<kbd>${mac ? '⌘K' : 'Ctrl K'}</kbd></button>`}
      ${cliente ? '' : html`<span class="top-ayuda" id="top-ayuda"><button class="pdchip" id="pdchip" type="button" hidden aria-label="Seguir tu primer día"></button><button class="guiabtn" id="guiabtn" type="button" hidden aria-label="Cómo se usa esta parte">${ico('video', 15)}<span>Cómo se usa</span></button></span>`}
      ${cliente ? '' : html`<a class="bellbtn" href="#/avisos" data-avisos aria-label="Avisos" title="Avisos">${ico('bell', 18)}<b data-avisos-n hidden></b></a>`}
      <button class="themebtn" id="themebtn" title="${esNoche() ? 'Modo día' : 'Modo noche'}" aria-label="Cambiar modo día / noche">${raw(icoTema())}</button>
      <div class="avatar" id="avatar" title="Mi perfil" role="button" tabindex="0" aria-label="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(me.name)}</div>
    </header>
    <main id="main"></main>
    ${celHtml()}
  </div>`);
  instalarLat();
  $('#searchbtn')?.addEventListener('click', search);
  instalarBoton(me);
  // Tocar tu foto abre tu perfil (foto, cumpleaños, conexiones, cerrar sesión).
  $('#avatar').onclick = () => { location.hash = '/me'; };
  $('#avatar').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = '/me'; } };
  // Modo noche: se guarda en este navegador.
  $('#themebtn').onclick = () => ponerTema(esNoche() ? 'dia' : 'noche');
  if (cliente) return;
  // El selector de cliente: elegir dentro de un workspace mantiene workspace y pestaña (sin la herramienta: el otro cliente
  // puede no tenerla); en Home y el Harness se queda donde estás y la pantalla vuelve a leer el contexto.
  instalarContexto(me, { alElegir: (slug) => {
    const cur = resolve(hashNow());
    const to = cur.key === 'ws' ? '/' + ['ws', cur.rest[0], slug, cur.rest[2] || 'overview'].join('/') : location.hash.slice(1) || '/home';
    if (to !== location.hash.slice(1)) location.hash = to;
    else if (cur.key === 'home' || cur.key === 'ai') render();
    else markNav();
  } });
  // La lista de clientes llega después: la barra, el chip y ⌘K se enteran.
  cargarContexto(me).then(() => { if (me) { pintarSelector(); markNav(); } });
}

async function render() {
  cerrarTodo(); grpCerrado = new Set();
  const cur = resolve(hashNow());
  // La dirección siempre dice dónde se abrió de verdad (alias y rutas que este perfil no ve se reescriben).
  if (cur.url !== hashNow()) history.replaceState(null, '', '#/' + cur.url);
  const H = document.documentElement; H.dataset.pantalla = cur.key; H.dataset.capa = capaDe(cur.key);
  if (cur.key === 'ws') {
    const [ws, slug] = cur.rest;
    // El cliente de la ruta pasa a ser el contexto; y se recuerda el último workspace y su cliente (home.js los lee).
    if (slug && slug !== contextoActual(me)) ponerContexto(me, slug);
    lsSet('ws.ultimo', ws); if (slug) { try { localStorage.setItem(`os.ws.ultimo.${me.email}.${ws}`, slug); } catch {} }
  }
  if (!['me', 'avisos'].includes(cur.key)) lsSet('last.route', cur.url);
  markNav(cur);
  if (me.role !== 'client') marcarSeccion(seccionGuia(cur));
  $('#avatar')?.classList.toggle('on', cur.key === 'me');
  for (const b of $$('[data-avisos]')) b.classList.toggle('on', cur.key === 'avisos');
  // Contenedor nuevo por pantalla: así no quedan escuchadores de la pantalla anterior.
  // Cambiar de sección sin saltos: arriba de una vez (sin animar el scroll) y la página no se encoge
  // mientras carga la siguiente (antes «Cargando…» la hacía chiquita y el navegador brincaba).
  const old = $('#main'), keep = old.offsetHeight;
  const main = old.cloneNode(false); main.removeAttribute('inert'); main.classList.remove('llm-host'); main.style.minHeight = keep + 'px';
  const gen = ++renderGen, vt = canTransition(), alive = () => gen === renderGen;
  // El módulo de la pantalla llega ANTES de la transición (después de la primera vez ya está en caché): así la transición
  // nunca espera a la red y la pantalla no se queda congelada en la anterior.
  // Mientras baja, la pantalla vieja ya no se puede tocar (si no, una pestaña tocada a destiempo cambiaría la dirección).
  old.inert = true;
  let mod = null, err = null;
  try { mod = await import(`./screens/${SCREENS[cur.key]}.js`); } catch (e) { err = e; }
  if (!alive()) return;
  // Si lo que falló fue bajar el código de la pantalla, «Reintentar» recarga la página (el navegador de la app de Mac
  // recuerda el módulo que falló y volver a pedirlo fallaría igual).
  const fallo = (e) => { main.style.minHeight = ''; const recarga = e === err || /dynamically imported module|Importing a module script failed|module script/i.test(e?.message || ''); mount(main, html`<div class="warnbox ui-fallo">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : recarga ? 'No se pudo abrir esta parte (¿se fue el internet?).' : e.message || 'No cargó.'} <button type="button" class="btn ghost xs" data-reintentar="${recarga ? 'recargar' : ''}">Reintentar</button></div>`); };
  main.addEventListener('click', (e) => { const b = e.target.closest('[data-reintentar]'); if (b && alive()) { if (b.dataset.reintentar === 'recargar') location.reload(); else render(); } });
  let lista = null;
  const pintar = () => {
    if (!alive()) return null; // ya se pidió otra pantalla: esta no se pinta
    closeDrawer();
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
    const rootEl = document.documentElement; rootEl.dataset.vt = 'nav';
    const t = document.startViewTransition(pintar);
    t.finished.finally(() => { if (rootEl.dataset.vt === 'nav') delete rootEl.dataset.vt; });
    await t.updateCallbackDone.catch(() => {});
  } else pintar();
  await lista;
}

window.addEventListener('hashchange', () => me && render());
window.addEventListener('tema', () => { const b = $('#themebtn'); if (b) { b.innerHTML = icoTema(); b.title = esNoche() ? 'Modo día' : 'Modo noche'; } });
// El CEO cambió la matriz de Vistas por rol: la barra se recalcula y, si la ruta ya no se ve, se vuelve a pintar.
events.addEventListener('roleviews', (e) => { if (!me) return; applyViews(me, e.detail); markNav(); const cur = resolve(hashNow()); if (cur.url !== hashNow()) render(); });
// Una pantalla cambió su ruta sola: la barra se pone al día.
events.addEventListener('navsync', () => { if (me) { markNav(); if (me.role !== 'client') marcarSeccion(seccionGuia(resolve(hashNow()))); } });
// Cambió el cliente del contexto (el selector, un workspace o el Chat): el chip, la barra y «Ask InherentOS» lo reflejan.
events.addEventListener('contexto', () => { if (me) { pintarSelector(); markNav(); } });
// Las pantallas siguen escribiendo su ruta de siempre (#/sales/quotes, #/estrategia/<c>/<bloque>, #/content/…): aquí se
// canoniza (#/org/…, #/ws/…) para que recargar, compartir el link y la barra queden en sincronía. Adentro se llama al original.
{ const rs = history.replaceState.bind(history);
  history.replaceState = (st, t, url) => {
    if (me && typeof url === 'string' && url.startsWith('#/')) {
      const h = url.slice(2), m = /^([\w-]+)(.*)$/.exec(h);
      if (m && ['estrategia', 'marcas', 'consulting', 'content', 'mimarca'].includes(m[1])) { const c = resolve(h); if (c.url !== h) url = '#/' + c.url; }
      else if (m && ORG_SCREENS.includes(m[1]) && location.hash.startsWith('#/org/')) url = '#/org/' + h;
    }
    const out = rs(st, t, url);
    if (me && typeof url === 'string' && url.startsWith('#/')) {
      const h = url.slice(2); if (!/^(me|avisos)(\/|$)/.test(h)) lsSet('last.route', h);
      // Una pantalla cambió de pestaña sola (Finanzas, Equipo, un bloque de Strategy…): la barra marca la nueva.
      if ($('.lat')) queueMicrotask(() => markNav());
    }
    return out;
  }; }
$('#veil').onclick = closeDrawer;
events.addEventListener('logout', () => { if (me) { me = null; toast('Tu sesión expiró', true); loginView(); } });

async function start(u) {
  me = u;
  if (u.role !== 'client') instalarMenu(u);
  // El servidor ya manda areas, views, scope y start aplicados; la matriz se guarda para recalcular en vivo si el CEO la cambia.
  if (me.role !== 'client') { let doc = null; const lv = Promise.all([api('db/settings'), me.role === 'ceo' ? api('internos/baseline').catch(() => null) : null]).then(([r, b]) => { if (b) baseDefaults(b.base); applyLevels((r.items || []).find((x) => x.id === LEVELS_ID)); }).catch(() => {}); try { doc = await api('db/settings/role_views'); } catch {} applyViews(me, doc); await lv; }
  if (!hashNow()) history.replaceState(null, '', '#/' + landing());
  const c = pendingConnect();
  if (c && me.role !== 'client') { try { sessionStorage.removeItem('connect'); } catch {} const { consentView } = await import('./connectai.js'); return consentView(root, me, c, () => { shell(); render(); }); }
  shell(); render();
  // Las pantallas de todos los días se bajan en segundo plano: el primer clic ya no espera a que llegue su código.
  if (me.role !== 'client') { const pre = () => { for (const k of ['home', 'work', 'operations', 'sales', 'finanzas', 'clients', 'ws', 'ai', 'chat']) if (SCREENS[k] && sees(k)) import(`./screens/${SCREENS[k]}.js`).catch(() => {}); }; 'requestIdleCallback' in window ? requestIdleCallback(pre, { timeout: 3000 }) : setTimeout(pre, 1500); }
  // El primer día: la primera vez, el recorrido de 6 pasos (se puede pausar; el chip de la barra lo retoma).
  if (me.role !== 'client') primerDia(me);
  // Avisos: la campanita cuenta lo que pide atención (servidor + tu compu) y se pone al día sola.
  if (me.role !== 'client') import('./avisos-ui.js').then((a) => a.instalarCampana(me)).catch(() => {});
  // El service worker de los avisos (web push). Sin él, nada cambia.
  if (me.role !== 'client') import('./avisos.js').then((a) => a.registrarSW()).catch(() => {});
  // Las responsabilidades recurrentes (recetas internas encendidas) dejan su tarea al abrir la app, una vez al día. El cron diario hace lo mismo.
  if (['ceo', 'coo'].includes(me.role)) { try { const d = new Date().toISOString().slice(0, 10); if (localStorage.getItem('rec.run') !== d) api('recipes/run', { method: 'POST', body: {} }).then(() => { try { localStorage.setItem('rec.run', d); } catch {} }).catch(() => {}); } catch {} }
}
api('me').then(start).catch(loginView);
// La «i» de información se pone sola en cada título que se pinta.
{ let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; infoTips(root); }); }).observe(root, { childList: true, subtree: true }); }
