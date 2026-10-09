import { $, h, api, events, toast } from './core.js';

const AREAS = {
  finanzas:     { icon: '💰', name: 'Finanzas',     mod: () => import('./finanzas.js') },
  conocimiento: { icon: '🧠', name: 'Conocimiento', mod: () => import('./soon.js') },
  content:      { icon: '🎬', name: 'Content',      mod: () => import('./soon.js') },
  sales:        { icon: '🤝', name: 'Sales',        mod: () => import('./sales.js') },
  strategy:     { icon: '🎯', name: 'Strategy',     mod: () => import('./soon.js') },
  operations:   { icon: '⚙️', name: 'Operations',   mod: () => import('./operations.js') },
};
const root = $('#app');
let me = null;

function loginView() {
  const err = h('div', { class: 'bad sm' });
  const form = h('form', { onsubmit: async (e) => {
    e.preventDefault();
    err.textContent = '';
    try {
      me = await api('/api/login', { method: 'POST', body: { user: form.user.value.trim().toLowerCase(), password: form.password.value, code: form.code.value.replace(/\D/g, '') } });
      boot();
    } catch (x) { err.textContent = x.message; }
  } },
    h('h2', {}, 'CEO ', h('span', { style: { color: 'var(--acc)' } }, 'OS')),
    h('div', { class: 'mut sm' }, 'Inherent HQ · acceso del equipo'),
    h('div', {}, h('label', {}, 'Usuario'), h('input', { name: 'user', autocomplete: 'username', required: true, autofocus: true })),
    h('div', {}, h('label', {}, 'Contraseña'), h('input', { name: 'password', type: 'password', autocomplete: 'current-password', required: true })),
    h('div', {}, h('label', {}, 'Código 2FA (app de autenticación)'), h('input', { name: 'code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 6, required: true })),
    err, h('button', { class: 'btn' }, 'Entrar'));
  root.replaceChildren(h('div', { class: 'login' }, form));
}

async function render() {
  const area = location.hash.slice(2) || me.areas[0];
  const key = me.areas.includes(area) ? area : me.areas[0];
  const main = $('main');
  main.replaceChildren(h('p', { class: 'mut' }, 'Cargando…'));
  document.querySelectorAll('nav a[data-a]').forEach((a) => a.classList.toggle('on', a.dataset.a === key));
  try {
    const m = await AREAS[key].mod();
    main.replaceChildren();
    await m.render(main, { me, area: key, meta: AREAS[key] });
  } catch (e) { main.replaceChildren(h('p', { class: 'bad' }, e.message)); }
}

function shell() {
  const nav = h('nav', {},
    h('h1', {}, 'CEO ', h('b', {}, 'OS')),
    ...me.areas.map((k) => h('a', { 'data-a': k, onclick: () => (location.hash = '/' + k) }, h('span', {}, AREAS[k].icon), AREAS[k].name)),
    h('div', { class: 'sp' }),
    h('div', { class: 'who' }, `${me.name} · ${me.role.toUpperCase()}`),
    h('a', { onclick: async () => { await api('/api/logout', { method: 'POST' }); me = null; loginView(); } }, '↩ Salir'));
  root.replaceChildren(h('div', { class: 'shell' }, nav, h('main')));
}

function boot() { shell(); render(); }
window.addEventListener('hashchange', () => me && render());
events.addEventListener('logout', () => { me = null; toast('Sesión vencida', true); loginView(); });

api('/api/me').then((u) => { me = u; boot(); }).catch(loginView);
