import { workspacesDe, rutaDeVuelta, esApp } from './workspaces.js';
import { chatVivo } from './chat-vivo.js';
import { menu as uiMenu, instalarUi, cerrarMenu, cerrarPopover } from './ui.js';
import { pintarActualizacion } from './app-mac.js';
import { pintarSpotify } from './spotify.js';
import { pocket, soloCompu } from './pocket.js';
import { applyViews, movedRoute } from './roleviews.js';
import { applyLevels, baseDefaults, LEVELS_ID } from './levels.js';
import { $, $$, html, raw, mount, api, events, toast, col, ask, closeDrawer, setViewSection, IC, emblem, emblemaTema, initials, infoTips, canTransition, ico, skel, roleName, escalonar } from './core.js';
import { openSearch, searchOpen } from './search.js';
import { marcarSeccion, instalarBoton } from './guia.js';
import { primerDia } from './primer-dia.js';
import { svgIco } from './iconos.js';
import { abrirEnChat } from './areas.js';
import { WORKSPACES, wsDe, wsDeRuta, puedeWs, herramientaDe } from './herramientas.js';
import { migasDe } from './migas.js';
import { contextoDe } from './contexto.js';
import { SECCIONES } from './guia-secciones.js';

// Tooltips de [data-tip] y teclado/ARIA de toda lista .tabs / .seg (ui.js), una vez para todo el OS.
instalarUi();

// La entrada del OS: el router, la única barra y el dueño de lo que comparten las pantallas.
// Seis cosas, nada más: HOME (#/home: tu día, Ask y lo importante) · CALENDARIO (#/calendario/trabajo: el de trabajo; y
// #/calendario/contenido/<marca>: el de contenido de una marca) · LIBRARY (#/org/library) · ORGANIZATION (#/org/…: cómo se
// maneja Inherent) · INHERENT AI (#/chat el Chat, #/ai/mcps los MCPs; #/ai es su portada) · ÁREAS (#/areas/<área>: Strategy,
// Marketing, Creative, Consulting y Production, donde cada una guarda su información y despliega lo importante).
// Las herramientas de los workspaces (herramientas.js, screens/workspace.js) están escondidas, no borradas: #/ws/… y las rutas
// viejas (#/marcas/…, #/estrategia/…, #/consulting/…) abren la página de su área. El cliente ya no se elige en la barra: el
// Chat lo elige en su caja. Una sola barra: lateral en la compu (⌘B la deja en íconos); en el cel, la barra de abajo con sus
// hojas. Los nombres viven en NAV (inglés, como los puso el CEO, salvo «Áreas»: se cambian en un solo lugar).
// Alias, nunca 404: #/marcas/…, #/estrategia/…, #/consulting/…, #/content/…, #/mimarca/…, #/ws/…, #/<pantalla>/… siguen
// abriendo (alias() y el hook de replaceState los canonizan a #/areas/…, #/org/… o #/home). Los permisos los pone el
// servidor; aquí solo se refleja (sees, puedeVerArea).
const root = $('#root');
// ---------- La pantalla de arranque (index.html › #boot) ----------
// La página nunca queda en blanco: el HTML ya pinta el emblema, una barra fina y la etapa («Conectando…»). Aquí se le cambia
// la etapa, se saca de #root (mount() lo vaciaría) para que se quede encima mientras se pinta lo de abajo, y se desvanece
// (fundido + leve escala, 220 ms; con «reducir movimiento», solo el fundido) cuando el cascarón o el login ya están listos.
const boot = $('#boot');
let bootSale = !boot; // true: ya se fue (o nunca hubo)
const bootEtapa = (t) => {
  const e = $('#boot-t'); if (!e || bootSale || e.textContent === t) return;
  e.textContent = t; e.classList.remove('cambia'); void e.offsetWidth; e.classList.add('cambia');
};
const bootSoltar = () => { if (boot && !bootSale && boot.parentElement !== document.body) document.body.append(boot); };
function bootSalir() {
  if (bootSale) return;
  bootSoltar(); bootSale = true;
  // Dos cuadros: lo de abajo se pinta con la pantalla de arranque todavía encima, y entonces se desvanece.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    boot.classList.add('fuera'); boot.setAttribute('aria-hidden', 'true');
    const fin = () => boot.remove();
    boot.addEventListener('transitionend', fin, { once: true }); setTimeout(fin, 500);
  }));
}
// El botón de día y noche muestra a dónde vas: de noche el sol, de día la luna. El tema lo lleva tema.js.
export let me = null;
let renderGen = 0;
const rutaOS = () => rutaDeVuelta(lsGet('os.ruta'), landing(false));

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
  bootSoltar(); // la pantalla de arranque se queda encima mientras el login se pinta, y se desvanece (misma salida que el cascarón)
  mount(root, html`<div class="login">
    <div class="side entra-lista">
      <div class="lg-marca"><div>${emblem()}</div><div style="width:auto"><img src="/brand/wordmark-light.svg" alt="Inherent"><small>Operating System</small></div></div>
      <p class="lg-frase">We build cool brands—and the growth systems behind them.</p>
      <p class="lg-sub">${pendingConnect() ? 'Entra con tu Google para conectar Inherent OS con tu app.' : 'Entra con tu cuenta de Google de Inherent.'}</p>
      ${err ? html`<div class="warnbox">${ERR[err] || 'No se pudo iniciar sesión.'}${detail ? html`<div class="sm" style="margin-top:4px;opacity:.8">Detalle: ${detail}</div>` : ''}</div>` : ''}
      ${st.google ? html`<a class="gbtn" href="/api/auth/google">${IC.google} Continuar con Google</a>
        <a class="gbtn sec" href="/api/auth/google?portal=1">Soy cliente: entrar a mi portal</a>`
        : html`<div class="warnbox">El login con Google todavía no está configurado.</div>`}
      ${!st.db ? html`<div class="warnbox">La base de datos todavía no está conectada.</div>` : ''}
      ${local ? html`<a class="gbtn sec" href="/api/auth/dev">Entrar en modo prueba (solo local)</a>` : ''}
      <p class="lg-nota">Equipo: cuentas <b>@${st.domain}</b> · Clientes: el correo que Inherent aprobó</p>
      <div class="perm"><span>Al entrar te pediremos permiso para:</span>
        <div>${IC.cal} <span><b>Google Calendar</b>: ver y crear eventos de proyectos</span></div>
        <div>${IC.drive} <span><b>Google Drive</b>: ver y crear archivos de la Biblioteca</span></div>
      </div>
    </div></div>`);
  if (err) history.replaceState(null, '', '/');
  bootSalir();
}

// ---------- Quién ve qué (refleja; el permiso lo pone el servidor) ----------
const full = (a) => me.areas.includes(a) && me.views?.[a] !== 'resumen';
const area = (a) => () => me.areas.includes(a);
const ceo = () => me.role === 'ceo';
const equipo = () => me.role !== 'client';
// Las 5 áreas (las mismas de herramientas.js): id, nombre, ícono, color (--ui-m-<id>) y el modo del Chat que abre cada una.
const AREAS = WORKSPACES.map((w) => ({ id: w.id, nombre: w.nombre, icono: w.icono, color: w.color, modo: w.modo }));
const areaDe = (id) => AREAS.find((a) => a.id === id) || null;
// Strategy y Consulting las ve quien ve Estrategia; Marketing, Creative y Production, quien ve marcas (brandAccess.any).
// puedeWs ya es esa regla; aquí solo se le pone nombre de área.
const puedeVerArea = (m, id) => Boolean(m) && puedeWs(m, id);
// Las pantallas que viven en #/org/… (Mi perfil, el portal del cliente, Home y el Calendario van aparte). Library sigue en
// #/org/library, pero ya no es una página de Organization: tiene su lugar en la barra.
const ORG_SCREENS = ['work', 'setup', 'clients', 'operations', 'portal', 'sales', 'services', 'finanzas', 'vision', 'team', 'roadmap', 'library'];
// Las áreas que cuentan como «ve algo de Organization» (Equipo y Visión los ve todo el equipo, y Library va aparte: no cuentan).
const ORG_AREAS = ['home', 'work', 'control', 'resultados', 'clients', 'operations', 'sales', 'finanzas', 'roadmap'];
const hasOrg = () => me.role !== 'client' && ORG_AREAS.some((a) => me.areas.includes(a));
const sees = (k) => {
  if (k === 'me') return true;
  if (me.role === 'client') return k === 'portal';
  if (['avisos', 'home', 'calendario', 'chat', 'ai', 'agentes', 'ajustes', 'vision'].includes(k)) return true;
  if (k === 'setup') return me.role === 'ceo';
  if (k === 'services') return me.areas.includes('sales');
  if (k === 'areas') return me.role !== 'client' && AREAS.some((a) => puedeVerArea(me, a.id));
  return me.areas.includes(k);
};

// ---------- La barra: el árbol en una sola constante ----------
// Un ítem: { id, nombre, ruta, icono, ve() }. Los grupos (Organization, Inherent AI, Áreas) traen `items` (y Company) como
// [id, nombre, ruta, ve?, ícono, color?]; sin `ve`, la página la ve todo el equipo; con `color`, el ítem lleva el de su área.
// Home, Calendario y Library son ítems de primer nivel (sin flecha). Library conserva su regla de siempre (area('library')).
const NAV = [
  { id: 'home', nombre: 'Hoy', ruta: 'home', icono: 'nav-home', ve: equipo },
  { id: 'chat', nombre: 'Chat', ruta: 'chat', icono: 'chat-ia', ve: equipo, oculto: true }, // se abre desde el selector de workspace
  { id: 'agentes', nombre: 'Agentes', ruta: 'ai/agentes', icono: 'agents', ve: equipo },
  { id: 'calendario', nombre: 'Calendario', ruta: 'calendario', icono: 'calendar', ve: equipo },
  { id: 'org', nombre: 'Organización', ruta: 'org', icono: 'nav-organization', ve: () => hasOrg(),
    items: [
      ['operations', 'Proyectos', 'org/operations', area('operations'), 'kanban'],
      ['work', 'Tareas', 'org/work', area('work'), 'square-check'],
      ['sales', 'CRM', 'org/sales', area('sales'), 'megaphone'],
      ['cal', 'Fechas', 'org/operations/cal', area('operations'), 'calendar-days'],
      ['clients', 'Clientes', 'org/clients', area('clients'), 'folder-open'],
      ['services', 'Servicios', 'org/services', () => full('sales'), 'briefcase'],
      ['finances', 'Finanzas', 'org/finanzas', area('finanzas'), 'nav-finances'],
    ] },
  { id: 'empresa', nombre: 'Empresa', ruta: 'org/team', icono: 'users', ve: () => hasOrg(),
    items: [
      ['team', 'Equipo', 'org/team', area('team'), 'users'],
      ['vision', 'Visión', 'org/vision', equipo, 'eye'],
      ['roadmap', 'Roadmap', 'org/roadmap', area('roadmap'), 'rocket'],
      ['laya', 'Laya', 'org/team/laya', ceo, 'message-square'],
      ['setup', 'Configuración', 'org/setup', ceo, 'settings'],
    ] },
  { id: 'areas', nombre: 'Áreas', ruta: 'areas', icono: 'layout-grid', ve: () => sees('areas'),
    items: AREAS.map((a) => [a.id, a.nombre, 'areas/' + a.id, () => puedeVerArea(me, a.id), a.icono, a.color]) },
  { id: 'library', nombre: 'Biblioteca', ruta: 'org/library', icono: 'nav-library', ve: area('library') },
  // Abajo, junto a tu cuenta: no son destinos del día a día.
  { id: 'mcps', nombre: 'Conexiones', ruta: 'ai/mcps', icono: 'link', ve: equipo, pie: true },
  { id: 'ajustes', nombre: 'Ajustes', ruta: 'ajustes/ia', icono: 'settings', ve: equipo, pie: true },
];
const navDe = (id) => NAV.find((n) => n.id === id);
const esGrupo = (n) => Boolean(n.items);
const veIt = ([, , , v]) => !v || v();
const itemsDe = (n, k = 'items') => (n[k] || []).filter(veIt);
// Todas las páginas de un ítem (sin filtrar por perfil) y solo las que esta persona ve.
const todasDe = (n) => (esGrupo(n) ? n.items || [] : [[n.id, n.nombre, n.ruta, null, n.icono]]);
const paginasDe = (n) => (esGrupo(n) ? itemsDe(n) : todasDe(n));
// Una página está «abierta» cuando la ruta es ella o empieza por ella; gana la más larga (org/operations/cal antes que org/operations).
const enRuta = (url, ruta) => url === ruta || url.startsWith(ruta + '/');
// → [página, ítem de NAV] donde está la ruta, o null.
function paginaDe(url) {
  let mejor = null;
  for (const n of NAV) if (n.ve()) for (const it of paginasDe(n)) if (enRuta(url, it[2]) && (!mejor || it[2].length > mejor[0][2].length)) mejor = [it, n];
  return mejor;
}
// Un grupo está en su ruta cuando la página abierta es suya; sin página (la portada de Inherent AI, el portal visto por el
// equipo) vale el prefijo de su ruta.
const grupoEnRuta = (n, url) => { const pag = paginaDe(url); return pag ? pag[1] === n : enRuta(url, n.ruta); };

const SCREENS = { ws: 'workspace', me: 'me', avisos: 'avisos', home: 'home', work: 'work', finanzas: 'finance', sales: 'sales', services: 'services', operations: 'operations', roadmap: 'roadmap', clients: 'clients', library: 'library', team: 'team', setup: 'setup', portal: 'portal', vision: 'vision', chat: 'llm', ai: 'harness', agentes: 'agentes', ajustes: 'ajustes', areas: 'areas', calendario: 'calendario' };
// El nombre de cada pantalla (lo que recibe en `label`): los de NAV, más las que no están en la barra.
const LABEL = { ajustes: 'Ajustes', agentes: 'Agentes', me: 'Mi perfil', avisos: 'Avisos', portal: 'Mi portal', chat: 'Chat', ai: 'Inherent AI', areas: 'Áreas', home: 'Home', calendario: 'Calendario' };
for (const n of NAV) for (const [, nombre, ruta] of todasDe(n)) { const m = /^org\/([\w-]+)$/.exec(ruta); if (m && !LABEL[m[1]]) LABEL[m[1]] = nombre; }
// La capa de cada pantalla (html[data-capa]): home · calendario · org · ai · areas · '' (Mi perfil, Avisos, el portal).
const capaDe = (k) => (k === 'home' ? 'home' : k === 'calendario' ? 'calendario' : k === 'areas' || k === 'ws' ? 'areas' : k === 'chat' || k === 'ai' || k === 'agentes' ? 'ai' : ORG_SCREENS.includes(k) ? 'org' : '');

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
  // Una ruta de workspace de antes (ws/<ws>/…) abre la página de su área; cualquier otra se queda como viene.
  const deWs = (ruta) => { const p = String(ruta || 'home').split('/'); return p[0] === 'ws' ? (wsDe(p[1]) ? ['areas', p[1]] : ['home']) : p; };
  if (a === 'ws' && !(wsDe(r[0]) && r[1])) return deWs(parts.join('/')); // con cliente, abre el workspace de esa herramienta
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
    // Las fuentes eran el Customer Bullseye de Strategy: ahora abren el área.
    if (r[0] === 'fuentes') return ['areas', 'strategy'];
    if (!slug || slug === 'personal' || /-personal$/.test(slug)) slug = 'inherent';
    // El calendario de contenido de una marca ahora es Calendario › Contenido.
    if (r[0] === 'calendario') return ['calendario', 'contenido', slug];
    return ['marcas', slug, ...(CT_MOD[r[0]] || 'investigacion').split('/')];
  }
  if (a === 'clients' && r[0] && r[1] === 'marca') return ['marcas', r[0], ...(r[2] === 'inspo' ? ['investigacion'] : ['marca'])];
  if (a === 'contenido') return ['home'];
  // Marcas, Estrategia y Consulting de antes → el área de su workspace (herramientas.js sabe la tabla; el cliente se descarta).
  if (a === 'marcas' && r[0] && r[1] === 'calendario') return ['calendario', 'contenido', r[0] === 'personal' || /-personal$/.test(r[0]) ? 'inherent' : r[0]];
  if (a === 'marcas' || a === 'estrategia' || a === 'consulting') return deWs(wsDeRuta(parts.join('/'))?.ruta);
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
  // Calendario: #/calendario/trabajo (el de trabajo) o #/calendario/contenido[/<marca>]; sin vista abre Trabajo. La pantalla recibe
  // sub[0] = la vista y sub[1] = la marca (si viene).
  if (a === 'calendario') {
    if (!sees('calendario')) return fallback();
    const v = parts[1] === 'contenido' ? 'contenido' : 'trabajo', rest = v === 'contenido' && /^[\w.-]+$/.test(parts[2] || '') ? [v, parts[2]] : [v];
    return { key: 'calendario', rest, url: 'calendario/' + rest.join('/') };
  }
  if (a === 'ws') return puedeVerArea(me, parts[1]) ? { key: 'ws', rest: parts.slice(1), url: parts.join('/') } : fallback();
  if (a === 'chat') return sees('chat') ? { key: 'chat', rest: parts.slice(1), url: parts.join('/') } : fallback();
  // Inherent AI: #/ai es su portada y #/ai/mcps la de MCPs; cualquier otra sub-página (las de antes) vuelve a #/ai.
  // Agents: #/ai/agentes[/<agente>[/<pestaña>|/trabajos/<trabajo>[/etapas]]] (el trabajo abre su chat; /etapas, la vista por etapas).
  if (a === 'ai' && parts[1] === 'agentes') { const ID = /^[\w-]{4,60}$/, [ag, tab, tr, vista] = parts.slice(2); const rest = !ID.test(ag || '') ? [] : tab === 'trabajos' && ID.test(tr || '') ? [ag, 'trabajos', tr, ...(vista === 'etapas' ? ['etapas'] : [])] : ['workflow', 'trabajos', 'settings'].includes(tab) ? [ag, tab] : [ag]; return sees('agentes') ? { key: 'agentes', rest, url: ['ai', 'agentes', ...rest].join('/') } : fallback(); }
  // Ajustes: #/ajustes[/ia]. Todo el equipo lo abre; conectar lo hacen el CEO y el COO (el servidor lo hace cumplir).
  if (a === 'ajustes') return sees('ajustes') ? { key: 'ajustes', rest: ['ia'], url: 'ajustes/ia' } : fallback();
  if (a === 'ai') return sees('ai') ? (parts[1] === 'mcps' ? { key: 'ai', rest: ['mcps'], url: 'ai/mcps' } : { key: 'ai', rest: [], url: 'ai' }) : fallback();
  // Áreas: #/areas/<área>. Sin área (o una que no existe) abre la primera que esta persona ve; una que no ve, el fallback de siempre.
  if (a === 'areas') {
    const ver = AREAS.filter((x) => puedeVerArea(me, x.id)), id = parts[1];
    if (id && areaDe(id)) return puedeVerArea(me, id) ? (['agents', 'movimientos', 'notas', 'embudo', 'rentabilidad', 'radar', 'resultados', 'meta', 'voz', 'costo'].includes(parts[2]) ? { key: 'areas', rest: [id, parts[2]], url: `areas/${id}/${parts[2]}` } : { key: 'areas', rest: [id], url: 'areas/' + id }) : fallback();
    return ver.length ? { key: 'areas', rest: [ver[0].id], url: 'areas/' + ver[0].id } : fallback();
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
const esRutaViva = (r) => /^(home|calendario|ai|chat|avisos|me|areas)(\/|$)|^(org|ws)\/./.test(r || '');
// Dónde abre la app: la última ruta, o lo que el CEO decidió para el perfil (me.start) → Home, una sección o un área.
function landing(useLast = true) {
  if (me.role === 'client') return 'portal';
  const last = useLast ? lsGet('last.route') : null;
  if (last && esRutaViva(last)) return last;
  const st = me.start || 'home';
  if (st === 'content') return puedeVerArea(me, 'marketing') ? 'areas/marketing' : puedeVerArea(me, 'strategy') ? 'areas/strategy' : 'home';
  if (st === 'home') return 'home';
  if (SCREENS[st] && ORG_SCREENS.includes(st) && sees(st)) return 'org/' + st;
  if (!hasOrg()) { if (puedeVerArea(me, 'marketing')) return 'areas/marketing'; if (puedeVerArea(me, 'strategy')) return 'areas/strategy'; }
  return 'home';
}
// El nombre de donde estás, para la vista grande («← Projects / Inherent»): la página de la barra (un área incluida).
setViewSection(() => {
  if (!me) return '';
  const cur = resolve(hashNow());
  return paginaDe(cur.url)?.[0]?.[1] || LABEL[cur.key] || '';
});

// ---------- La sección para «Cómo se usa» (las claves de guia-secciones.js) ----------
const SECCION_ORG = { work: 'hoy', clients: 'proyectos', operations: 'proyectos', portal: 'proyectos', sales: 'ventas', services: 'servicios', finanzas: 'finanzas', vision: 'inherent', team: 'inherent', roadmap: 'inherent', library: 'inherent', setup: 'inherent' };
function seccionGuia(cur) {
  if (cur.key === 'me') return 'me';
  if (cur.key === 'home') return 'home';
  if (cur.key === 'calendario') return 'calendario';
  if (cur.key === 'ai' || cur.key === 'agentes') return 'ai';
  // Un área usa la clave de su video (ws-<área>: los ya grabados siguen calzando); si no existe, la de Áreas.
  if (cur.key === 'areas') { const k = `ws-${cur.rest[0]}`; return SECCIONES.some(([x]) => x === k) ? k : 'areas'; }
  return SECCION_ORG[cur.key] || null;
}

// ---------- Los grupos de la barra (abiertos o cerrados) ----------
// Un grupo está abierto cuando la ruta es suya o la persona lo abrió (os.lat.grp.<correo> = {"org":true,…}). Cerrarlo
// estando en su ruta dura hasta la siguiente navegación (si no, el botón no serviría de nada).
let grpCerrado = new Set();
const grpGuardados = () => { try { return JSON.parse(lsGet('lat.grp') || '{}') || {}; } catch { return {}; } };
const grpAbierto = (id, enSuRuta) => (enSuRuta && !grpCerrado.has(id)) || grpGuardados()[id] === true;
const grpEnRuta = (id, cur) => grupoEnRuta(navDe(id), cur.url);
function toggleGrp(id) {
  const cur = resolve(hashNow()), en = grpEnRuta(id, cur), g = grpGuardados();
  const abria = !grpAbierto(id, en), grp = () => $(`.lat [data-grp="${id}"]>.lat-subs`);
  if (!abria) { g[id] = false; if (en) grpCerrado.add(id); } else { g[id] = true; grpCerrado.delete(id); }
  lsSet('lat.grp', JSON.stringify(g));
  // La lista se abre y se cierra deslizándose: al cerrar, primero se recoge y después se pinta la barra.
  const mueve = (el, h, de, a) => el.animate([{ height: de ? h + 'px' : 0, opacity: de ? 1 : 0, overflow: 'hidden' }, { height: a ? h + 'px' : 0, opacity: a ? 1 : 0, overflow: 'hidden' }], { duration: 320, easing: 'cubic-bezier(.22,.8,.2,1)' });
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches, viejo = grp();
  if (!abria && viejo && !calma) { mueve(viejo, viejo.offsetHeight, true, false).onfinish = () => { paintLat(cur); $(`.lat [data-grp-tg="${id}"]`)?.focus(); }; return; }
  paintLat(cur);
  const nuevo = grp(); if (abria && nuevo && !calma) mueve(nuevo, nuevo.offsetHeight, false, true);
  $(`.lat [data-grp-tg="${id}"]`)?.focus();
}

// ---------- La barra lateral (compu) ----------
const latMini = () => lsGet('barra.mini') === '1';
const latIt = (ruta, label, icon, on) => html`<a class="lat-it${on ? ' on' : ''}" href="#/${ruta}" aria-label="${label}"${latMini() ? raw(` title="${label}"`) : ''}${on ? raw(' aria-current="page"') : ''}>${icon}<span class="lat-t">${label}</span></a>`;
// Organization, Inherent AI y Áreas: el ítem abre su portada (Inherent AI) o su primera página visible; la flecha solo abre
// o cierra; Company va colapsado adentro de Organization. Un ítem con color (cada área) lleva su ícono con el color del área.
function latGrupo(n, cur) {
  const items = itemsDe(n), pag = paginaDe(cur.url), enEste = grupoEnRuta(n, cur.url), abierto = grpAbierto(n.id, enEste);
  const esOn = (it) => pag?.[0] === it;
  const link = (it) => html`<a class="${esOn(it) ? 'on' : ''}${it[5] ? ' lat-area' : ''}" href="#/${it[2]}"${esOn(it) ? raw(' aria-current="page"') : ''}>${it[5] ? ico(it[4], 14) : ''}${it[1]}</a>`;
  return html`<div class="lat-grp" data-grp="${n.id}"${abierto ? raw(' open') : ''}>${latIt((items[0])?.[2] || n.ruta, n.nombre, ico(n.icono, 16), enEste)}<button type="button" class="lat-grp-tg" data-grp-tg="${n.id}" aria-expanded="${abierto ? 'true' : 'false'}" aria-label="${abierto ? 'Cerrar' : 'Abrir'} ${n.nombre}">${ico('down', 13)}</button>
    <div class="lat-subs">${items.map(link)}</div></div>`;
}
// El indicador del ítem activo: dos píldoras (span.lat-ind, app.css) que se deslizan de un ítem al siguiente en vez de apagarse
// en uno y encenderse en otro: la del ítem de la barra y la de la página abierta dentro de su grupo. paintLat vuelve a pintar
// la barra entera en cada navegación; los indicadores son los únicos nodos que se conservan (se vuelven a meter y se les da un
// cuadro para que recuerden dónde estaban: de ahí parte el viaje). `quieto`: acomodarlos sin viaje (la primera vez, o cuando
// la barra cambia de tamaño). En el cel no hay barra lateral: no hacen nada.
const latInds = {};
let latRO = null;
function latIndicador(nav, quieto = false) {
  for (const [k, sel] of [['item', '.lat-it.on'], ['pag', '.lat-subs a.on']]) {
    let ind = latInds[k];
    if (!ind) { ind = latInds[k] = document.createElement('span'); ind.className = `lat-ind lat-ind-${k}`; ind.setAttribute('aria-hidden', 'true'); }
    if (ind.parentElement !== nav) { nav.prepend(ind); void ind.offsetWidth; }
    const on = [...nav.querySelectorAll(sel)].find((x) => x.getClientRects().length);
    if (!on) { ind.classList.remove('on'); nav.removeAttribute('data-ind-' + k); continue; }
    const n = nav.getBoundingClientRect(), r = on.getBoundingClientRect();
    const sinViaje = quieto || !ind.classList.contains('on');
    ind.classList.toggle('fijo', sinViaje);
    ind.style.width = r.width + 'px'; ind.style.height = r.height + 'px';
    ind.style.transform = `translate(${Math.round(r.left - n.left + nav.scrollLeft)}px, ${Math.round(r.top - n.top + nav.scrollTop)}px)`;
    ind.classList.add('on'); nav.setAttribute('data-ind-' + k, '');
    if (sinViaje) { void ind.offsetWidth; ind.classList.remove('fijo'); }
  }
  if (!latRO && 'ResizeObserver' in window) { latRO = new ResizeObserver(() => { const k = $('#lat-nav'); if (k) latIndicador(k, true); }); latRO.observe(nav); }
}
function paintLat(cur = resolve(hashNow())) {
  const lat = $('.lat'), nav = lat && $('#lat-nav', lat); if (!nav) return;
  // Se vuelve a pintar en cada navegación: el foco del teclado se queda en el mismo link o en la misma flecha.
  const act = document.activeElement?.closest?.('#lat-nav a, #lat-nav button'), foco = act ? act.getAttribute('href') || act.dataset.grpTg || '' : '';
  const cab = cur.key === 'me' ? latIt('me', 'Mi perfil', ico('user', 16), true) : '';
  if (me.role === 'client') { mount(nav, html`${cab}${latIt('portal', 'Mi portal', ico('nav-portal', 16), cur.key === 'portal')}`); latIndicador(nav); return; }
  const pag = paginaDe(cur.url);
  mount(nav, html`${cab}${NAV.filter((n) => n.ve() && !n.pie && !n.oculto).map((n) => (esGrupo(n) ? latGrupo(n, cur) : latIt(n.ruta, n.nombre, ico(n.icono, 16), pag?.[0]?.[2] === n.ruta)))}`);
  latIndicador(nav);
  $('.lat-avisos', lat)?.classList.toggle('on', cur.key === 'avisos');
  const enChat = cur.key === 'chat', ws = $('#lat-ws-n', lat), volver = $('#lat-volver', lat);
  if (ws) ws.textContent = enChat ? 'Inherent Chat' : 'Inherent OS';
  if (volver) { const r = rutaOS(); volver.hidden = !enChat; volver.href = '#/' + r; volver.querySelector('span').textContent = `Volver a ${paginaDe(r)?.[0]?.[1] || 'Inherent OS'}`; }
  const ctx = $('#lat-ctx', lat); if (ctx) { ctx.hidden = cur.key !== 'chat'; if (cur.key !== 'chat') ctx.replaceChildren(); }
  if (foco) [...nav.querySelectorAll('a, button')].find((x) => x.getAttribute('href') === foco || x.dataset.grpTg === foco)?.focus({ focusVisible: false });
  $('.lat-it.on', lat)?.scrollIntoView?.({ block: 'nearest' });
}
function markNav(cur = resolve(hashNow())) { paintLat(cur); paintCel(cur); pintarMigas(cur); }
// Atrás, adelante y la dirección. En el Chat no: tiene su propio encabezado.
function pintarMigas(cur) {
  const n = $('#migas'); if (!n) return;
  n.hidden = cur.key === 'chat';
  if (n.hidden) return;
  const xs = migasDe(cur.url, { cliente: (s) => contextoDe(s)?.name, area: (id) => wsDe(id)?.nombre || areaDe(id)?.nombre, pestana: (ar, id) => wsDe(ar)?.pestanas?.find((p) => p.id === id)?.nombre, herramienta: (id) => herramientaDe(id)?.nombre, pagina: paginaDe(cur.url)?.[0]?.[1] || LABEL[cur.key] });
  const nav = window.navigation, atras = nav ? nav.canGoBack : true, adelante = nav ? nav.canGoForward : true;
  mount(n, html`<button type="button" data-mig="atras" aria-label="Atrás" title="Atrás" ${atras ? '' : 'disabled'}>${ico('chevron-left', 17)}</button><button type="button" data-mig="adelante" aria-label="Adelante" title="Adelante" ${adelante ? '' : 'disabled'}>${ico('chevron-right', 17)}</button>
    <ol>${xs.map((x, i) => (i === xs.length - 1 ? html`<li aria-current="page">${x.t}</li>` : html`<li><a href="${x.r}">${x.t}</a></li>`))}</ol>`);
}
// Tu primer día y «Cómo se usa» son los mismos botones de siempre: en la compu viven abajo en la barra; en el cel, arriba.
function ubicarAyuda() { const dest = desk.matches ? $('#lat-ayuda') : $('#top-ayuda'); if (dest) for (const id of ['pdchip', 'guiabtn']) { const b = $('#' + id); if (b && b.parentElement !== dest) dest.append(b); } }
// Todo popover propio (el menú de «tú», las hojas del cel) lleva data-popover: aquí se quitan y se apagan sus botones.
function cerrarTodo() { for (const p of $$('[data-popover]')) p.remove(); for (const b of $$('[data-hoja]')) b.setAttribute('aria-expanded', 'false'); }
// El selector de arriba: qué workspaces abre tu rol. Es un ui.menu (teclado, Esc, clic afuera y el foco de vuelta).
function menuWs(btn) {
  for (const p of $$('[data-popover]')) p.remove();
  const actual = esApp(resolve(hashNow()).key), xs = workspacesDe(me, { verChat: sees('chat'), rutaOS: rutaOS() });
  uiMenu(btn, xs.map((w) => ({ label: w.nombre, sub: w.sub, href: `#/${w.ruta}`, checked: w.id === actual })), { titulo: 'Workspaces', etiqueta: 'Workspaces', ancho: 280 });
}
// El menú de «tú», al pie de la barra: abre hacia arriba.
function menuYo(btn) {
  for (const p of $$('[data-popover]')) p.remove();
  const modo = window.inherentTema?.modo() || 'automatico';
  uiMenu(btn, [
    { label: 'Mi perfil', icon: 'user', href: '#/me' },
    { label: 'Conexiones', icon: 'link', href: '#/ai/mcps' },
    '-',
    { label: 'Apariencia automática', icon: 'sparkles', checked: modo === 'automatico', onSelect: () => window.inherentTema?.elegir('automatico') },
    { label: 'Modo claro', icon: 'sparkles', checked: modo === 'claro', onSelect: () => window.inherentTema?.elegir('claro') },
    { label: 'Modo oscuro', icon: 'sparkles', checked: modo === 'oscuro', onSelect: () => window.inherentTema?.elegir('oscuro') },
  ], { etiqueta: 'Tu cuenta', placement: 'top-start', ancho: 240 });
}
const ponerMini = (on) => { lsSet('barra.mini', on ? '1' : '0'); document.documentElement.toggleAttribute('data-lat-mini', on); if (me) paintLat(); const b = $('.lat [data-lat="mini"]'); if (b) { b.setAttribute('aria-label', on ? 'Mostrar la barra (⌘B)' : 'Esconder la barra (⌘B)'); b.title = on ? 'Mostrar la barra · ⌘B' : 'Esconder la barra · ⌘B'; } };
function latHtml(mac) {
  const cliente = me.role === 'client';
  return html`<aside class="lat" aria-label="Barra lateral">
    <div class="lat-top">${cliente ? '' : html`<button type="button" class="lat-ws" data-lat="ws" aria-haspopup="menu" aria-expanded="false"><span id="lat-ws-n">Inherent OS</span>${ico('chevrons-up-down', 14)}</button>`}<button type="button" class="lat-ib" data-lat="mini" aria-label="Esconder la barra (⌘B)" title="Esconder la barra · ⌘B">${ico('panel-left', 16)}</button></div>
    ${cliente ? '' : html`<a class="lat-volver" id="lat-volver" href="#/home" hidden>${ico('chevron-left', 15)}<span></span></a><button type="button" class="lat-it lat-buscar" data-lat="buscar" title="Buscar · ${mac ? '⌘' : 'Ctrl+'}K">${ico('search', 16)}<span class="lat-t">Buscar</span><kbd>${mac ? '⌘K' : 'Ctrl K'}</kbd></button>
    <a class="lat-it lat-avisos" href="#/avisos" data-avisos title="Avisos">${ico('bell', 16)}<span class="lat-t">Avisos</span><b class="lat-n" data-avisos-n hidden></b></a>`}
    <nav class="lat-nav" id="lat-nav" aria-label="Secciones"></nav>
    <div class="lat-ctx" id="lat-ctx" hidden></div>
    <div class="lat-pie">
      ${cliente ? '' : html`<div class="lat-sp" id="lat-sp" hidden></div><div class="lat-ayuda" id="lat-ayuda"></div>`}
      <div class="lat-yo"><button type="button" class="lat-yo-b" data-lat="yo" aria-haspopup="menu" aria-expanded="false" title="Tu cuenta">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : html`<i>${initials(me.name)}</i>`}<span><b>${me.name}</b><small>${me.title || roleName(me.role)}</small></span></button>
        <a class="lat-ib" href="#/ajustes/ia" aria-label="Ajustes" title="Ajustes">${ico('settings', 16)}</a></div>
    </div></aside>`;
}
// Lo que hacen los botones de la barra (y los mismos dentro de la hoja «Más» del cel).
function accionLat(k, b) {
  if (k === 'buscar') return search();
  if (k === 'yo') return menuYo(b);
  if (k === 'ws') return menuWs(b);
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
  pintarActualizacion();
  pintarSpotify(me);
}
// ⌘B (Ctrl+B): la barra con o sin nombres. No cuando se escribe.
document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.key.toLowerCase() !== 'b' || !me || !desk.matches || !$('.lat')) return;
  if (e.target.closest?.('input,textarea,select,[contenteditable="true"]')) return;
  e.preventDefault(); ponerMini(!latMini());
});

// ---------- El cel: la barra de abajo (Home · Calendario · Áreas · Inherent AI · Más) y sus hojas ----------
// Más trae Organization con sus páginas, Library, Avisos, Buscar, Mi perfil y Cómo se usa.
function celHtml() {
  const b = (id, label, icon, hoja = true) => (hoja ? html`<button type="button" class="nc-b" data-nc="${id}" data-hoja="${id}" aria-haspopup="dialog" aria-expanded="false">${ico(icon, 20)}<span>${label}</span></button>` : html`<a class="nc-b" href="#/${id}" data-nc="${id}">${ico(icon, 20)}<span>${label}</span></a>`);
  if (me.role === 'client') return html`<nav class="nav-cel" aria-label="Secciones">${b('portal', 'Mi portal', 'nav-portal', false)}${b('mas', 'Más', 'ellipsis')}</nav>`;
  return html`<nav class="nav-cel" aria-label="Secciones">${b('home', 'Hoy', 'nav-home', false)}${b('chat', 'Chat', 'chat-ia', false)}${b('ai/agentes', 'Agentes', 'agents', false)}${b('calendario', 'Calendario', 'calendar', false)}${b('mas', 'Más', 'ellipsis')}</nav>`;
}
// El botón de abajo que corresponde a la ruta (Organization y Library viven en la hoja «Más», con Avisos y Mi perfil).
const celKey = (cur) => {
  const k = cur.key;
  if (k === 'home' || k === 'calendario' || k === 'chat') return k;
  if (k === 'agentes') return 'ai/agentes';
  if (k === 'portal' && me.role === 'client') return 'portal';
  return ['avisos', 'me', 'ajustes', 'ai', 'areas'].includes(k) || ORG_SCREENS.includes(k) ? 'mas' : '';
};
function paintCel(cur = resolve(hashNow())) {
  const tt = $('#top-t'); if (tt) tt.textContent = cur.key === 'ws' ? wsDe(cur.rest[0])?.nombre || 'Áreas' : paginaDe(cur.url)?.[0]?.[1] || LABEL[cur.key] || 'Inherent';
  const k = celKey(cur);
  for (const b of $$('.nav-cel [data-nc]')) { const on = b.dataset.nc === k; b.classList.toggle('on', on); on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); }
}
// La hoja de abajo: una sola (div.hoja[data-popover] en body) con los links del grupo; se cierra al navegar, afuera y con Escape.
function abrirHoja(id, btn) {
  const misma = $('.hoja')?.dataset.hoja === id; cerrarTodo(); if (misma) return;
  const cur = resolve(hashNow()), pag = paginaDe(cur.url);
  const it = (ruta, label, icon, on, style = '') => html`<a class="hoja-it${on ? ' on' : ''}" href="#/${ruta}"${on ? raw(' aria-current="page"') : ''}${style ? raw(` style="${style}"`) : ''}>${icon}<span>${label}</span></a>`;
  const bt = (k, label, icon) => html`<button type="button" class="hoja-it" data-lat="${k}">${icon}<span>${label}</span></button>`;
  // x[5] es el color del área (un token --ui-m-<id> propio, nunca texto de usuario).
  const deNav = (xs) => xs.filter((x) => !soloCompu(x[2])).map((x) => it(x[2], x[1], ico(x[4] || 'dot', 18), pag?.[0] === x, x[5] ? `--ac:var(${x[5]})` : ''));
  let titulo = '', cuerpo = '';
  {
    titulo = 'Más';
    const guia = $('#guiabtn');
    if (me.role === 'client') cuerpo = html`${it('me', 'Mi perfil', ico('user', 18), cur.key === 'me')}`;
    else {
      const grupo = (id) => { const n = navDe(id); return n.ve() ? html`<span class="lat-k">${n.nombre}</span>${deNav(itemsDe(n))}` : ''; }, lib = navDe('library');
      const it1 = (n) => it(n.ruta, n.nombre, ico(n.icono, 18), pag?.[0]?.[2] === n.ruta || cur.key === n.id);
      cuerpo = html`${['home', 'chat', 'agentes', 'calendario'].map((id) => it1(navDe(id)))}${grupo('org')}${grupo('empresa')}${grupo('areas')}<span class="lat-k">Más</span>${lib.ve() ? it(lib.ruta, lib.nombre, ico(lib.icono, 18), pag?.[0]?.[2] === lib.ruta) : ''}${it('avisos', 'Avisos', ico('bell', 18), cur.key === 'avisos')}${it('ai/mcps', 'Conexiones', ico('link', 18), cur.url === 'ai/mcps')}${it('ajustes/ia', 'Ajustes', ico('settings', 18), cur.key === 'ajustes')}${guia && !guia.hidden ? bt('guia', 'Cómo se usa', ico('video', 18)) : ''}`;
    }
  }
  const h = document.createElement('div'); h.className = 'hoja'; h.dataset.hoja = id; h.setAttribute('data-popover', ''); h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', titulo);
  mount(h, html`<div class="hoja-h"><img src="/brand/wordmark-light.svg" alt="Inherent"><span class="sp"></span>${me.role === 'client' ? '' : html`<button type="button" class="lat-ib" data-lat="buscar" aria-label="Buscar">${ico('search', 20)}</button>`}<button type="button" class="lat-ib" data-hoja-x aria-label="Cerrar">${ico('x', 20)}</button></div><div class="hoja-lista">${cuerpo}</div>
    <div class="hoja-pie"><a class="hoja-yo" href="#/me" aria-label="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer">` : initials(me.name)}</a>${me.role === 'client' ? '' : html`<a class="hoja-nueva" href="#/chat">${ico('plus', 18)} Nueva conversación</a>`}</div>`);
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
document.addEventListener('pointerdown', (e) => { if ($('[data-popover]') && !e.target?.closest?.('[data-popover], [data-hoja]')) cerrarTodo(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || !$('[data-popover]')) return;
  const volver = $('[data-hoja][aria-expanded="true"]'); cerrarTodo(); volver?.focus();
});

// ---------- El buscador: «Ir a» con lo que ve este perfil ----------
// Chat, MCPs, Calendario, Library, las áreas, Home, las páginas de Organization y Avisos (solo lo que esta persona ve).
function jumpItems() {
  if (me.role === 'client') return [];
  const out = [];
  const push = (title, sub, route, icon) => out.push({ title, sub, route, icon: String(icon) });
  // Primero lo de todos los días (la lista vacía muestra 12): Chat, Agentes, Calendario, Biblioteca y las áreas.
  push('Chat', 'Conversaciones con tu información', '#/chat', svgIco('chat-ia', 16));
  push('Agentes', 'Encarga trabajo y revisa su avance', '#/ai/agentes', svgIco('agents', 16));
  push('Calendario', 'Trabajo y contenido: reuniones, entregas, facturas y publicaciones', '#/calendario', svgIco('calendar', 16));
  const lib = navDe('library'); if (lib.ve()) push(lib.nombre, 'SOPs, playbooks y prompts del equipo', '#/' + lib.ruta, svgIco(lib.icono, 16));
  for (const it of itemsDe(navDe('areas'))) push(it[1], 'Áreas', '#/' + it[2], svgIco(it[4], 16));
  push('Hoy', 'Tu día, lo importante y lo que necesita tu decisión', '#/home', svgIco('nav-home', 16));
  for (const id of ['org', 'empresa']) { const n = navDe(id); if (n.ve()) for (const it of itemsDe(n)) push(it[1], n.nombre, '#/' + it[2], svgIco(it[4], 16)); }
  push('Conexiones', 'Conecta tus herramientas', '#/ai/mcps', svgIco('link', 16));
  push('Avisos', 'Lo que pide atención: tu trabajo, cada cliente y la plataforma', '#/avisos', svgIco('bell', 16));
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
      <button type="button" class="top-hoja" data-hoja="mas" aria-haspopup="dialog" aria-expanded="false" aria-label="Abrir menú">${raw('<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 15h11"/></svg>')}</button><b class="top-t" id="top-t"></b>
      <div class="brand"><div class="emb">${emblemaTema()}</div><div class="word"><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:24px;display:inline-block;vertical-align:middle"><sup>OS</sup></div></div>
      <div class="sp"></div>
      ${cliente ? '' : html`<button class="searchbtn" id="searchbtn" type="button" aria-label="Buscar (${mac ? '⌘' : 'Ctrl+'}K)" title="Buscar · ${mac ? '⌘' : 'Ctrl+'}K">${ico('search', 17)}<kbd>${mac ? '⌘K' : 'Ctrl K'}</kbd></button>`}
      ${cliente ? '' : html`<span class="top-ayuda" id="top-ayuda"><button class="pdchip" id="pdchip" type="button" hidden aria-label="Seguir tu primer día"></button><button class="guiabtn" id="guiabtn" type="button" hidden aria-label="Cómo se usa esta parte">${ico('video', 15)}<span>Cómo se usa</span></button></span>`}
      ${cliente ? '' : html`<a class="bellbtn" href="#/avisos" data-avisos aria-label="Avisos" title="Avisos">${ico('bell', 18)}<b data-avisos-n hidden></b></a>`}
      <div class="avatar" id="avatar" title="Mi perfil" role="button" tabindex="0" aria-label="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(me.name)}</div>
    </header>
    <nav class="migas" id="migas" aria-label="Dónde estás" hidden></nav>
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
}

// Cuando el esqueleto (o un «Cargando…») cede su lugar a la pantalla, lo que llega entra escalonado (core.js › escalonar:
// .entra con --i). Se arma por navegación y se apaga solo: al entrar la pantalla, o a los 8 s si nunca llega.
function entradaAuto(main, alive) {
  const mo = new MutationObserver(() => {
    if (!alive()) return mo.disconnect();
    if (main.querySelector(':scope > .skel, :scope > .loading')) return; // todavía carga
    mo.disconnect(); escalonar(main);
  });
  mo.observe(main, { childList: true }); setTimeout(() => mo.disconnect(), 8000);
}

async function render() {
  cerrarTodo(); cerrarMenu(); cerrarPopover(); grpCerrado = new Set();
  const cur = resolve(hashNow());
  // La dirección siempre dice dónde se abrió de verdad (alias y rutas que este perfil no ve se reescriben).
  if (cur.url !== hashNow()) history.replaceState(null, '', '#/' + cur.url);
  const H = document.documentElement, antes = H.dataset.pantalla;
  if (cur.key !== 'chat' && !['me', 'avisos'].includes(cur.key)) lsSet('os.ruta', cur.url);
  // Dentro del Chat, cambiar de conversación no reconstruye nada: solo cambia su contenido.
  if (cur.key === 'chat' && antes === 'chat' && chatVivo()) { lsSet('last.route', cur.url); chatVivo()(cur.rest); return; }
  const cambiaApp = Boolean(antes) && esApp(antes) !== esApp(cur.key);
  const pintarCascaron = () => { H.dataset.pantalla = cur.key; H.dataset.capa = capaDe(cur.key); markNav(cur); };
  if (!cambiaApp) pintarCascaron();
  // Se recuerda la última área abierta (home.js la lee para abrir el Chat en su modo desde «Ask»).
  if (cur.key === 'areas') lsSet('ws.ultimo', cur.rest[0]);
  if (!['me', 'avisos'].includes(cur.key)) lsSet('last.route', cur.url);
  if (me.role !== 'client') marcarSeccion(seccionGuia(cur));
  $('#avatar')?.classList.toggle('on', cur.key === 'me');
  for (const b of $$('[data-avisos]')) b.classList.toggle('on', cur.key === 'avisos');
  // Contenedor nuevo por pantalla: así no quedan escuchadores de la pantalla anterior.
  // Cambiar de sección sin saltos: arriba de una vez (sin animar el scroll) y la página no se encoge
  // mientras carga la siguiente (antes «Cargando…» la hacía chiquita y el navegador brincaba).
  const old = $('#main'), keep = old.offsetHeight;
  const main = old.cloneNode(false); main.removeAttribute('inert'); main.classList.remove('llm-host'); main.style.minHeight = keep + 'px';
  // La primera pantalla no usa View Transition: la pantalla de arranque que se desvanece encima ya es su transición.
  const gen = ++renderGen, vt = canTransition() && bootSale, alive = () => gen === renderGen;
  // El módulo de la pantalla llega ANTES de la transición (después de la primera vez ya está en caché): así la transición
  // nunca espera a la red y la pantalla no se queda congelada en la anterior.
  // Mientras baja, la pantalla vieja ya no se puede tocar (si no, una pestaña tocada a destiempo cambiaría la dirección).
  old.inert = true;
  let mod = null, err = null;
  try { mod = await import(`./screens/${pocket() && soloCompu(cur.url) ? 'solo-compu' : SCREENS[cur.key]}.js`); } catch (e) { err = e; }
  if (!alive()) return;
  // Si lo que falló fue bajar el código de la pantalla, «Reintentar» recarga la página (el navegador de la app de Mac
  // recuerda el módulo que falló y volver a pedirlo fallaría igual).
  const fallo = (e) => { main.style.minHeight = ''; const recarga = e === err || /dynamically imported module|Importing a module script failed|module script/i.test(e?.message || ''); mount(main, html`<div class="warnbox ui-fallo">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : recarga ? 'No se pudo abrir esta parte (¿se fue el internet?).' : e.message || 'No cargó.'} <button type="button" class="btn ghost sm" data-reintentar="${recarga ? 'recargar' : ''}">Reintentar</button></div>`); };
  main.addEventListener('click', (e) => { const b = e.target.closest('[data-reintentar]'); if (b && alive()) { if (b.dataset.reintentar === 'recargar') location.reload(); else render(); } });
  let lista = null;
  const pintar = () => {
    if (!alive()) return null; // ya se pidió otra pantalla: esta no se pinta
    if (cambiaApp) pintarCascaron(); // el cambio de app entra dentro de la transición
    closeDrawer();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); $('.app')?.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // en el cel el que se desliza es .app
    old.replaceWith(main);
    if (!vt) { main.classList.add('enter'); setTimeout(() => main.classList.remove('enter'), 900); }
    // La forma de la pantalla mientras llegan los datos (se ve solo si tarda: antes de 160 ms no aparece nada).
    mount(main, mod?.esqueleto?.() || skel('pagina'));
    bootSalir(); // la primera vez: lo de abajo ya está pintado, la pantalla de arranque se desvanece
    if (cur.key !== 'chat') entradaAuto(main, alive); // el Chat arma su propia caja: nada de transform encima
    if (err) { fallo(err); return null; }
    lista = Promise.resolve()
      .then(() => mod.render(main, { me, area: cur.key, sub: cur.rest, label: LABEL[cur.key] || cur.key, alive }))
      .catch((e) => { if (alive()) fallo(e); })
      .finally(() => { if (alive()) main.style.minHeight = ''; });
    // Si la pantalla queda lista en menos de 150 ms entra directo; si no, entra su esqueleto y los datos llegan encima.
    return Promise.race([lista, new Promise((r) => setTimeout(r, 150))]);
  };
  if (vt) {
    const rootEl = document.documentElement, tipoVt = cambiaApp ? 'app' : 'nav'; rootEl.dataset.vt = tipoVt;
    const t = document.startViewTransition(pintar);
    t.ready.catch(() => {}); // saltada por otra o con la pestaña oculta, `ready` se rechaza: no es un error
    t.finished.catch(() => {}).finally(() => { if (rootEl.dataset.vt === tipoVt) delete rootEl.dataset.vt; }); // una transición saltada por otra no es un error
    await t.updateCallbackDone.catch(() => {});
  } else pintar();
  await lista;
}

window.addEventListener('hashchange', () => me && render());
document.addEventListener('click', (e) => { const b = e.target.closest('[data-mig]'); if (b) history[b.dataset.mig === 'atras' ? 'back' : 'forward'](); });
// Estado vacío con «Armarlo en el Chat» (visual.js › vacio): abre el Chat en el modo que trae el botón.
document.addEventListener('click', (e) => { const b = e.target.closest('[data-vac-chat]'); if (b && me) abrirEnChat(me.email, { modo: b.dataset.vacChat, slug: b.dataset.vacSlug || '', borrador: b.dataset.vacBorrador || '' }); });
// El CEO cambió la matriz de Vistas por rol: la barra se recalcula y, si la ruta ya no se ve, se vuelve a pintar.
events.addEventListener('roleviews', (e) => { if (!me) return; applyViews(me, e.detail); markNav(); const cur = resolve(hashNow()); if (cur.url !== hashNow()) render(); });
// Una pantalla cambió su ruta sola: la barra se pone al día.
events.addEventListener('navsync', () => { if (me) { markNav(); if (me.role !== 'client') marcarSeccion(seccionGuia(resolve(hashNow()))); } });
// Las pantallas siguen escribiendo su ruta de siempre (#/sales/quotes, #/estrategia/<c>/<bloque>, #/content/…, #/ws/…): aquí se
// canoniza (#/org/…, #/areas/…) para que recargar, compartir el link y la barra queden en sincronía. Adentro se llama al original.
{ const rs = history.replaceState.bind(history);
  history.replaceState = (st, t, url) => {
    if (me && typeof url === 'string' && url.startsWith('#/')) {
      const h = url.slice(2), m = /^([\w-]+)(.*)$/.exec(h);
      if (m && ['estrategia', 'marcas', 'consulting', 'content', 'mimarca', 'ws'].includes(m[1])) { const c = resolve(h); if (c.url !== h) url = '#/' + c.url; }
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
  bootEtapa('Preparando tu espacio…'); // la sesión ya contestó: ahora van las vistas por rol y los niveles
  if (u.role !== 'client') instalarMenu(u);
  // El servidor ya manda areas, views, scope y start aplicados; la matriz se guarda para recalcular en vivo si el CEO la cambia.
  if (me.role !== 'client') { let doc = null; const lv = Promise.all([api('db/settings'), me.role === 'ceo' ? api('internos/baseline').catch(() => null) : null]).then(([r, b]) => { if (b) baseDefaults(b.base); applyLevels((r.items || []).find((x) => x.id === LEVELS_ID)); }).catch(() => {}); try { doc = await api('db/settings/role_views'); } catch {} applyViews(me, doc); await lv; }
  if (!hashNow()) history.replaceState(null, '', '#/' + landing());
  const c = pendingConnect();
  if (c && me.role !== 'client') { try { sessionStorage.removeItem('connect'); } catch {} const { consentView } = await import('./connectai.js'); bootSoltar(); setTimeout(bootSalir, 80); return consentView(root, me, c, () => { shell(); render(); }); }
  bootSoltar(); shell(); render();
  // Por si la primera pantalla no baja (sin internet): el arranque no se queda tapando el cascarón.
  setTimeout(bootSalir, 2500);
  // Las pantallas de todos los días se bajan en segundo plano: el primer clic ya no espera a que llegue su código.
  if (me.role !== 'client') { const pre = () => { for (const k of ['home', 'calendario', 'work', 'operations', 'sales', 'finanzas', 'clients', 'areas', 'ai', 'chat']) if (SCREENS[k] && sees(k)) import(`./screens/${SCREENS[k]}.js`).catch(() => {}); }; 'requestIdleCallback' in window ? requestIdleCallback(pre, { timeout: 3000 }) : setTimeout(pre, 1500); }
  // El primer día: la primera vez, el recorrido de 6 pasos (se puede pausar; el chip de la barra lo retoma).
  if (me.role !== 'client') primerDia(me);
  // Avisos: la campanita cuenta lo que pide atención (servidor + tu compu) y se pone al día sola.
  if (me.role !== 'client') import('./avisos-ui.js').then((a) => a.instalarCampana(me)).catch(() => {});
  if (me.role !== 'client') import('./chat-avisos-ui.js').then((a) => a.instalarAvisosChat(me)).catch(() => {});
  // El cascarón instalable y los avisos usan el mismo service worker en todos los roles.
  import('./avisos.js').then((a) => a.registrarSW()).catch(() => {});
  // Las responsabilidades recurrentes (recetas internas encendidas) dejan su tarea al abrir la app, una vez al día. El cron diario hace lo mismo.
  if (['ceo', 'coo'].includes(me.role)) { try { const d = new Date().toISOString().slice(0, 10); if (localStorage.getItem('rec.run') !== d) api('recipes/run', { method: 'POST', body: {} }).then(() => { try { localStorage.setItem('rec.run', d); } catch {} }).catch(() => {}); } catch {} }
}
// «Conectando…» es la primera etapa (ya viene en el HTML); si la sesión tarda, la pantalla de arranque lo dice.
const bootLento = setTimeout(() => bootEtapa('Sigue conectando…'), 6000);
api('me').finally(() => clearTimeout(bootLento)).then(start).catch(loginView);
// La «i» de información se pone sola en cada título que se pinta.
{ let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; infoTips(root); }); }).observe(root, { childList: true, subtree: true }); }

// ---------- Clic derecho en todo el OS (ui.menu), solo donde ahorra pasos ----------
// Tareas, proyectos, clientes, leads y las respuestas del chat de Estrategia. En lo demás queda el menú del navegador.
// Mover un lead de etapa no va aquí: tiene sus candados (siguiente paso y fecha), así que se abre el lead.
const copiar = async (t, que = 'Copiado') => { try { await navigator.clipboard.writeText(t); toast(que); } catch { toast('No pude copiar', true); } };
const link = (h) => location.origin + location.pathname + h;
// Volver a pintar la pantalla con lo nuevo.
const refrescar = () => dispatchEvent(new HashChangeEvent('hashchange'));
const hoy = () => new Date().toISOString().slice(0, 10);

async function guardar(coll, id, cambio, ok) {
  try { const d = await col(coll).get(id); await col(coll).save({ ...d, ...cambio(d) }); toast(ok); refrescar(); } catch (e) { toast(e.message, true); }
}

function tarea(el, me) {
  const id = el.dataset.id;
  return [
    { l: 'Abrir', run: () => el.click() },
    { l: 'Marcar como hecha', run: () => guardar('tasks', id, () => ({ status: 'Hecha' }), 'Tarea hecha') },
    { l: 'Asignármela', run: () => guardar('tasks', id, () => ({ assignee: me.email }), 'Ahora es tuya') },
    { l: 'Cambiar fecha…', run: async () => { const d = await col('tasks').get(id).catch(() => null); const v = await ask('Nueva fecha de entrega', [{ k: 'due', l: 'Fecha', t: 'date', v: d?.due || hoy(), req: true }]); if (v) guardar('tasks', id, () => ({ due: v.due }), 'Fecha cambiada'); } },
  ];
}

function proyecto(id) {
  const h = `#/operations/p/${encodeURIComponent(id)}`;
  return [
    { l: 'Abrir', run: () => { location.hash = h; } },
    { l: 'Cambiar fase…', run: async () => {
      const p = await col('projects').get(id).catch(() => null); const fs = p?.phases || [];
      if (!fs.length) return toast('Este proyecto no tiene fases', true);
      const v = await ask('¿En qué fase va?', [{ k: 'f', l: 'Fase actual', t: 'select', opts: fs.map((f, i) => [String(i), f.name]), v: String(Math.max(0, fs.findIndex((f) => f.status === 'now'))) }]);
      if (!v) return; const n = +v.f;
      guardar('projects', id, () => ({ phases: fs.map((f, i) => ({ ...f, status: i < n ? 'done' : i === n ? 'now' : f.status === 'done' || f.status === 'now' ? '' : f.status })) }), `Fase: ${fs[n].name}`);
    } },
    '-', { l: 'Copiar link', run: () => copiar(link(h), 'Link copiado') },
  ];
}

function cliente(slug) {
  const h = `#/clients/${slug}`;
  return [
    { l: 'Abrir perfil', run: () => { location.hash = h; } },
    { l: 'Abrir su Estrategia', run: () => { location.hash = `#/ws/strategy/${slug}/overview`; } },
    { l: 'Abrir su Marca', run: () => { location.hash = `#/ws/marketing/${slug}/overview`; } },
    '-', { l: 'Copiar link', run: () => copiar(link(h), 'Link copiado') },
  ];
}

async function lead(el, me) {
  const id = el.dataset.id, l = await col('leads').get(id).catch(() => null);
  return [
    { l: 'Abrir (mover de etapa)', run: () => el.click() },
    { l: 'Anotar actividad…', run: async () => { const v = await ask(`Anotar en ${l?.name || 'el lead'}`, [{ k: 'text', l: 'Qué pasó', t: 'textarea', req: true }]); if (v) guardar('leads', id, (d) => ({ activity: [...(d.activity || []), { at: new Date().toISOString(), who: me.name, text: v.text }] }), 'Anotado'); } },
    '-', { l: 'Copiar teléfono', off: !l?.phone, run: () => copiar(l.phone, 'Teléfono copiado') },
    { l: 'Copiar correo', off: !l?.email, run: () => copiar(l.email, 'Correo copiado') },
  ];
}

function respuesta(el) {
  const texto = (el.querySelector('.es-b')?.innerText || '').trim(), guardarBtn = el.querySelector('[data-act="guardar"]');
  return [
    { l: 'Copiar', run: () => copiar(texto) },
    { l: 'Guardar como borrador del bloque', off: !guardarBtn, run: () => guardarBtn.click() },
    { l: 'Preguntar más sobre esto', run: () => { const ta = document.querySelector('#es-in'); if (!ta) return; ta.value = `Sobre esto: «${texto.slice(0, 160)}${texto.length > 160 ? '…' : ''}» — `; ta.focus(); ta.dispatchEvent(new Event('input')); } },
  ];
}

function instalarMenu(me) {
  document.addEventListener('contextmenu', async (e) => {
    if (e.target.closest('input, textarea, [contenteditable], .ui-menu, [data-ctx]')) return; // texto y la Library tienen el suyo
    const t = e.target.closest('[data-act="task"][data-id], [data-act="lead"][data-id], a[href^="#/operations/p/"], a[href^="#/clients/"], .es-m.a');
    if (!t) return;
    let items = null;
    if (t.matches('[data-act="task"]')) items = tarea(t, me);
    else if (t.matches('[data-act="lead"]')) { e.preventDefault(); items = await lead(t, me); }
    else if (t.matches('.es-m.a')) { if (!t.querySelector('.es-b')?.innerText.trim()) return; items = respuesta(t); }
    else { const h = t.getAttribute('href'); const p = /^#\/operations\/p\/([^/]+)/.exec(h), c = /^#\/clients\/([\w-]+)$/.exec(h); if (p) items = proyecto(decodeURIComponent(p[1])); else if (c) items = cliente(c[1]); }
    if (!items) return;
    e.preventDefault(); uiMenu(e, items);
  });
}
