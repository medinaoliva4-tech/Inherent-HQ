import { $, $$, html, raw, mount, api, events, toast, closeDrawer, IC, emblem, initials, esc, LOGO, infoTips } from './core.js';

const NAV = [
  ['home', 'Home', 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  ['control', 'Control', 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6'],
  ['work', 'Workspace', 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'],
  ['finanzas', 'Finance', 'M3 17l6-6 4 4 8-8M15 7h6v6'],
  ['sales', 'Sales', 'M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0'],
  ['operations', 'Operations', 'M4 6h16M4 12h10M4 18h7'],
  ['clients', 'Clients', 'M3 21V8l9-5 9 5v13M9 21v-6h6v6'],
  ['content', 'Content', 'M5 4h14v16l-7-4-7 4z'],
  ['library', 'Library', 'M4 4h6l2 2h8v14H4z'],
  ['team', 'Team', 'M17 20a5 5 0 0 0-10 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M21 20a4 4 0 0 0-3-3.9M3 20a4 4 0 0 1 3-3.9'],
  ['portal', 'Mi portal', 'M3 21V8l9-5 9 5v13M9 21v-6h6v6'],
];
const SCREENS = { me: 'me', home: 'home', control: 'control', work: 'work', finanzas: 'finance', sales: 'sales', operations: 'operations', clients: 'clients', content: 'content', library: 'library', team: 'team', setup: 'setup', portal: 'portal' };
const root = $('#root');
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
    <div class="art"><div class="quote"><p>Operamos el crecimiento.<br><em>No pierdas años.</em></p></div></div>
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

function shell() {
  const allowed = NAV.filter(([k]) => me.areas.includes(k) && (k !== 'portal' || me.role === 'client'));
  mount(root, html`<div class="app">
    <header class="top">
      <div class="brand"><div class="emb">${emblem()}</div><div class="word"><img src="/brand/wordmark-dark.svg" alt="Inherent" style="height:24px;display:inline-block;vertical-align:middle"><sup>OS</sup></div></div>
      <nav class="nav">${allowed.map(([k, l, d]) => html`<button data-go="${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>${l}</button>`)}</nav>
      <div class="sp"></div>
      <div class="avatar" id="avatar" title="Mi perfil">${me.picture ? html`<img src="${me.picture}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : initials(me.name)}</div>
    </header>
    <main id="main"></main>
  </div>`);
  $('.nav').onclick = (e) => { const b = e.target.closest('[data-go]'); if (b) location.hash = '/' + b.dataset.go; };
  // Tocar tu foto abre tu perfil (foto, cumpleaños, conexiones, cerrar sesión).
  $('#avatar').onclick = () => { location.hash = '/me'; };
}

async function render() {
  const [area, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  const key = me.areas.includes(area) || area === 'me' || (area === 'setup' && me.role === 'ceo') ? area : me.areas.includes('home') ? 'home' : me.areas[0];
  $$('.nav [data-go]').forEach((b) => b.classList.toggle('on', b.dataset.go === key));
  $('#avatar')?.classList.toggle('on', key === 'me');
  // En cel, la barra de abajo se desliza hasta la sección actual (solo la barra: scrollIntoView movía toda la página en iOS).
  { const nav = $('.nav'), on = $('.nav [data-go].on'); if (nav && on && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' }); }
  closeDrawer();
  // Contenedor nuevo por pantalla: así no quedan escuchadores de la pantalla anterior.
  // Cambiar de sección sin saltos: arriba de una vez (sin animar el scroll) y la página no se encoge
  // mientras carga la siguiente (antes «Cargando…» la hacía chiquita y el navegador brincaba).
  const old = $('#main'), keep = old.offsetHeight;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); $('.app')?.scrollTo({ top: 0, left: 0, behavior: 'instant' }); // en el cel el que se desliza es .app
  const main = old.cloneNode(false); main.style.minHeight = keep + 'px'; old.replaceWith(main);
  main.classList.add('enter'); setTimeout(() => main.classList.remove('enter'), 900);
  const gen = ++renderGen;
  const slow = setTimeout(() => { if (gen === renderGen && !main.childElementCount) mount(main, html`<p class="loading">Cargando…</p>`); }, 250);
  try {
    const mod = await import(`./screens/${SCREENS[key]}.js`);
    if (gen !== renderGen) return;
    await mod.render(main, { me, area: key, sub: rest, label: NAV.find((n) => n[0] === key)?.[1] || (key === 'me' ? 'Mi perfil' : 'Arranque'), alive: () => gen === renderGen });
  } catch (e) {
    mount(main, html`<div class="warnbox">${e.code === 'NO_DB' ? 'La base de datos todavía no está conectada.' : e.message}</div>`);
  } finally { clearTimeout(slow); if (gen === renderGen) main.style.minHeight = ''; }
}

window.addEventListener('hashchange', () => me && render());
$('#veil').onclick = closeDrawer;
events.addEventListener('logout', () => { if (me) { me = null; toast('Tu sesión expiró', true); loginView(); } });

async function start(u) {
  me = u;
  const c = pendingConnect();
  if (c && me.role !== 'client') { try { sessionStorage.removeItem('connect'); } catch {} const { consentView } = await import('./connectai.js'); return consentView(root, me, c, () => { shell(); render(); }); }
  shell(); render();
}
api('me').then(start).catch(loginView);
// La «i» de información se pone sola en cada título que se pinta.
{ let q = false; new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; infoTips(root); }); }).observe(root, { childList: true, subtree: true }); }
