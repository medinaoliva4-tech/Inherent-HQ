import { applyViews, GROUPS, groupOf } from './roleviews.js';
import { $, $$, html, raw, mount, api, events, toast, closeDrawer, IC, emblem, initials, esc, LOGO, infoTips, canTransition } from './core.js';

// La barra: 8 secciones. Cada una abre una pantalla; las demás pantallas de la sección siguen por su ruta (Equipo → «Más»).
// #/<sección> lleva a su pantalla; las rutas de siempre (#/work, #/sales, #/finanzas, #/control, #/resultados, #/setup) siguen igual.
const ICONS = {
  hoy: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  clientes: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
  servicios: 'M4 7h16v12H4zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 12h16',
  contenido: 'M4 5h16v14H4zM10 9l5 3-5 3z',
  mimarca: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  roadmap: 'M4 19V5M4 19h16M8 15l4-5 3 3 5-7',
  equipo: 'M17 20a5 5 0 0 0-10 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 20a4 4 0 0 0-3-3.9M3 20a4 4 0 0 1 3-3.9',
  library: 'M4 4h6l2 2h8v14H4z',
  portal: 'M3 21V8l9-5 9 5v13M9 21v-6h6v6',
};
// La pantalla que abre cada sección: [ruta, nombre, área que hace falta, solo CEO]. Una sola por sección: sin pestañas arriba.
const TABS = {
  hoy: [['home', 'Hoy', 'home']],
  clientes: [['clients', 'Clientes', 'clients']],
  servicios: [['services', 'Servicios', 'sales']],
  contenido: [['content', 'Contenido', 'content']],
  mimarca: [['mimarca', 'Mi marca', null, true]],
  roadmap: [['roadmap', 'Roadmap', 'roadmap']],
  equipo: [['team', 'Equipo', 'team']],
  library: [['library', 'Library', 'library']],
};
const SCREENS = { me: 'me', home: 'home', control: 'control', work: 'work', finanzas: 'finance', sales: 'sales', services: 'services', operations: 'operations', roadmap: 'roadmap', clients: 'clients', content: 'content', mimarca: 'me-brand', library: 'library', team: 'team', setup: 'setup', portal: 'portal', resultados: 'results' };
const LABEL = { home: 'Hoy', control: 'Control', work: 'Workspace', finanzas: 'Finanzas', sales: 'Comercial', services: 'Servicios', operations: 'Proyectos', roadmap: 'Roadmap', clients: 'Clientes', content: 'Contenido', mimarca: 'Mi marca', library: 'Library', team: 'Equipo', setup: 'Arranque', portal: 'Mi portal', resultados: 'Indicadores', me: 'Mi perfil' };
// Rutas que no son un área de la matriz: solo el CEO las abre.
const CEO_ONLY = ['setup', 'mimarca'];
// Pantallas viejas → su sección nueva (la configuración guardada no se rompe).
const ALIAS = { services: 'sales' };
const root = $('#root');
const SUN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const setTheme = (dark) => { if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme; };
try { setTheme(localStorage.getItem('theme') === 'dark'); } catch {}
export let me = null;
let renderGen = 0;

const ERR = { conector: 'No se pudo conectar la app.', dominio: 'No pudimos verificar esa cuenta de Google.', noaprobado: 'Esa cuenta todavía no tiene acceso. Pídele a Inherent que la apruebe.', estado: 'El inicio de sesión expiró. Inténtalo otra vez.', inactivo: 'Tu cuenta está desactivada. Habla con el CEO.', google: 'Google no dejó terminar el inicio de sesión.', servidor: 'Falló al guardar tu sesión.' };

// Conectar una app (Claude, ChatGPT…): llega a `/?connect=<id>`; si no hay sesión, primero se entra con Google.
{ const c = new URLSearchParams(location.search).get('connect'); if (c) { try { sessionStorage.setItem('connect', c); } catch {} history.replaceState(null, '', '/'); } }
const pendingConnect = () => { try { return sessionStorage.getItem('connect'); } catch { return null; } };

async function loginView() {
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

const tabOk = ([, , area, ceo]) => (!ceo || me.role === 'ceo') && (!area || me.areas.includes(area));
const tabsOf = (g) => (TABS[g] || []).filter(tabOk);
// La sección aparece si su pantalla se ve o si el perfil ve alguna de las pantallas que agrupa (Clientes también con Proyectos).
// Servicios pide ver Comercial de verdad (en resumen, lo del CRM vive en Clientes → Prospectos; Finanzas en resumen sigue en #/finanzas).
const full = (a) => me.areas.includes(a) && (!me.views || !['resumen'].includes(me.views[a]));
const groupOn = ([g, , list]) => (g === 'servicios' ? full('sales') || full('finanzas') : tabsOf(g).length || (g !== 'equipo' && list.some((a) => me.areas.includes(a))));
// El equipo ve: Hoy · Clientes (lo suyo) · Contenido (si lo tiene) · Library. Equipo (quién es quién) sigue en #/team.
const navItems = () => (me.role === 'client' ? [['portal', 'Mi portal']] : GROUPS.filter((x) => groupOn(x) && (x[0] !== 'equipo' || me.role !== 'team')).map(([g, l]) => [g, l]));
const navHtml = () => html`${navItems().map(([k, l]) => html`<button data-go="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[k]}"/></svg>${l}</button>`)}`;
const hashNow = () => location.hash.replace(/^#\/?/, '');
// La sección de una ruta: la de su pantalla (setup va con Administración; el portal visto por el equipo, con Clientes).
const groupFor = (area) => (area === 'setup' ? 'equipo' : area === 'mimarca' ? 'mimarca' : area === 'portal' ? (me.role === 'client' ? 'portal' : 'clientes') : groupOf(ALIAS[area] || area));
// La pestaña activa: la ruta más larga que calza con la actual (team/vistas antes que team).
const tabFor = (g, path) => tabsOf(g).filter(([r]) => path === r || path.startsWith(r + '/')).sort((a, z) => z[0].length - a[0].length)[0];
function paintSub(key) {
  const sub = $('#subnav'); if (!sub) return;
  const g = groupFor(key), list = g ? tabsOf(g) : [], h = hashNow(), on = g && tabFor(g, h.split('/')[0] === key ? h : key);
  // Una sola pantalla en la sección: sin pestañas (no hace falta elegir).
  if (list.length < 2) { sub.hidden = true; sub.innerHTML = ''; return; }
  sub.hidden = false;
  mount(sub, html`<div class="tabs" role="tablist">${list.map((t) => html`<button role="tab" class="${on === t ? 'on' : ''}" data-sub="${t[0]}">${t[1]}</button>`)}</div>`);
}
// Vistas por rol: las secciones ocultas no aparecen en la barra.
// Dónde abre: «Workspace» (la cola de siempre) hoy es Hoy → sus responsabilidades.
const landing = () => { const st = me.start === 'work' && me.areas.includes('home') ? 'home' : me.start; return me.areas.includes(st) ? st : me.areas.includes('home') ? 'home' : me.areas[0]; };
const sees = (a) => me.areas.includes(ALIAS[a] || a) || (CEO_ONLY.includes(a) && me.role === 'ceo');
const markNav = () => { const a = hashNow().split('/')[0]; const key = sees(a) ? a : landing(); const g = groupFor(key); $$('.nav [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === g)); paintSub(key); };
events.addEventListener('roleviews', (e) => { if (!me) return; applyViews(me, e.detail); mount($('.nav'), navHtml()); markNav(); const a = location.hash.replace(/^#\/?/, '').split('/')[0]; if (!sees(a) && a !== 'me') render(); });

function shell() {
  mount(root, html`<div class="app">
    <header class="top">
      <div class="brand"><div class="emb">${emblem()}</div><div class="word"><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:24px;display:inline-block;vertical-align:middle"><sup>OS</sup></div></div>
      <nav class="nav">${navHtml()}</nav>
      <div class="sp"></div>
      <button class="themebtn" id="themebtn" title="Modo noche" aria-label="Cambiar modo día / noche">${raw(document.documentElement.dataset.theme === 'dark' ? SUN : MOON)}</button>
      <div class="avatar" id="avatar" title="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(me.name)}</div>
    </header>
    <div id="subnav" class="subnav" hidden></div>
    <main id="main"></main>
  </div>`);
  // Tocar una sección abre su primera pantalla visible (o el portal, para el cliente).
  $('.nav').onclick = (e) => { const b = e.target.closest('[data-go]'); if (!b) return; const g = b.dataset.go; location.hash = '/' + (g === 'portal' ? 'portal' : tabsOf(g)[0]?.[0] || (GROUPS.find(([k]) => k === g)?.[2] || []).find((a) => me.areas.includes(a)) || g); };
  $('#subnav').onclick = (e) => { const b = e.target.closest('[data-sub]'); if (b) location.hash = '/' + b.dataset.sub; };
  // Tocar tu foto abre tu perfil (foto, cumpleaños, conexiones, cerrar sesión).
  $('#avatar').onclick = () => { location.hash = '/me'; };
  // Modo noche: se guarda en este navegador.
  $('#themebtn').onclick = () => { const dark = document.documentElement.dataset.theme !== 'dark'; setTheme(dark); try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {} $('#themebtn').innerHTML = dark ? SUN : MOON; };
}

async function render() {
  let [area, ...rest] = hashNow().split('/');
  // #/<sección> (ej. #/operaciones) lleva a su primera pantalla visible; las rutas de cada pantalla siguen igual.
  if (TABS[area] && !SCREENS[area]) { const t = tabsOf(area)[0] || [(GROUPS.find(([k]) => k === area)?.[2] || []).find((a) => me.areas.includes(a))]; if (t[0]) { history.replaceState(null, '', '#/' + t[0]); [area, ...rest] = t[0].split('/'); } }
  // Sin sección (o una que no ve): cada perfil abre donde el CEO decidió, por defecto en Hoy.
  const key = sees(area) || area === 'me' ? area : landing();
  // Una ruta que este perfil no ve: la dirección cambia a donde de verdad abrió (así la barra y las pestañas no mienten).
  if (area && key !== area) { history.replaceState(null, '', '#/' + key); rest = []; }
  const g = groupFor(key);
  $$('.nav [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === g));
  paintSub(key);
  $('#avatar')?.classList.toggle('on', key === 'me');
  // En cel, la barra de abajo se desliza hasta la sección actual (solo la barra: scrollIntoView movía toda la página en iOS).
  { const nav = $('.nav'), on = $('.nav [data-go].on'); if (nav && on && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' }); }
  closeDrawer();
  // Contenedor nuevo por pantalla: así no quedan escuchadores de la pantalla anterior.
  // Cambiar de sección sin saltos: arriba de una vez (sin animar el scroll) y la página no se encoge
  // mientras carga la siguiente (antes «Cargando…» la hacía chiquita y el navegador brincaba).
  const old = $('#main'), keep = old.offsetHeight;
  const main = old.cloneNode(false); main.style.minHeight = keep + 'px';
  const gen = ++renderGen, vt = canTransition();
  const apply = async () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); $('.app')?.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // en el cel el que se desliza es .app
    old.replaceWith(main);
    if (!vt) { main.classList.add('enter'); setTimeout(() => main.classList.remove('enter'), 900); }
    const slow = setTimeout(() => { if (gen === renderGen && !main.childElementCount) mount(main, html`<p class="loading">Cargando…</p>`); }, 250);
    try {
      const mod = await import(`./screens/${SCREENS[key]}.js`);
      if (gen !== renderGen) return;
      await mod.render(main, { me, area: key, sub: rest, label: LABEL[key] || key, alive: () => gen === renderGen });
    } catch (e) {
      mount(main, html`<div class="warnbox">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : e.message}</div>`);
    } finally { clearTimeout(slow); if (gen === renderGen) main.style.minHeight = ''; }
  };
  // Con transiciones, la pantalla vieja se queda a la vista hasta que la nueva está lista y entonces cambia suave.
  if (vt) {
    const root = document.documentElement; root.dataset.vt = 'nav';
    const t = document.startViewTransition(apply);
    t.finished.finally(() => { if (root.dataset.vt === 'nav') delete root.dataset.vt; });
    await t.updateCallbackDone.catch(() => {});
  } else await apply();
}

window.addEventListener('hashchange', () => me && render());
$('#veil').onclick = closeDrawer;
events.addEventListener('logout', () => { if (me) { me = null; toast('Tu sesión expiró', true); loginView(); } });

async function start(u) {
  me = u;
  // El servidor ya manda areas, views, scope y start aplicados; la matriz se guarda para recalcular en vivo si el CEO la cambia.
  if (me.role !== 'client') { let doc = null; try { doc = await api('db/settings/role_views'); } catch {} applyViews(me, doc); if (!location.hash.replace(/^#\/?/, '')) history.replaceState(null, '', '#/' + landing()); }
  const c = pendingConnect();
  if (c && me.role !== 'client') { try { sessionStorage.removeItem('connect'); } catch {} const { consentView } = await import('./connectai.js'); return consentView(root, me, c, () => { shell(); render(); }); }
  shell(); render();
  // Las responsabilidades recurrentes (recetas internas encendidas) dejan su tarea al abrir la app, una vez al día. El cron diario hace lo mismo.
  if (['ceo', 'coo'].includes(me.role)) { try { const d = new Date().toISOString().slice(0, 10); if (localStorage.getItem('rec.run') !== d) api('recipes/run', { method: 'POST', body: {} }).then(() => { try { localStorage.setItem('rec.run', d); } catch {} }).catch(() => {}); } catch {} }
}
api('me').then(start).catch(loginView);
// La «i» de información se pone sola en cada título que se pinta.
{ let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; infoTips(root); }); }).observe(root, { childList: true, subtree: true }); }
