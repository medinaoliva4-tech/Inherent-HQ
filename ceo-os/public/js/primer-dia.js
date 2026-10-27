// El primer día: la primera vez que alguien entra, el OS lo lleva de la mano en 6 pasos con check.
// Cada paso se comprueba solo (la app, Claude, Laya, Google, la prueba final); se puede pausar y el OS recuerda dónde iba
// (team.<email>.primer_dia). Un chip en la barra lo vuelve a abrir. El cliente no lo ve.
import { html, raw, mount, api, toast, $, ico, roleName } from './core.js';
import { PUENTE } from './laya.js';

const PASOS = [
  ['quien', 'Quién eres', 'Tu puesto y lo que vas a ver'],
  ['app', 'Instala la app', 'Inherent OS en tu Mac, con el puente adentro'],
  ['claude', 'Entra a Claude', 'Con tu cuenta, desde la app'],
  ['laya', 'Laya y el ojo visual', 'Se descargan solos la primera vez'],
  ['google', 'Conecta Google', 'Drive y Calendar'],
  ['prueba', 'Una prueba', 'Crea algo de punta a punta'],
];
const OPCIONALES = new Set(['app', 'claude', 'laya']);
let dlg = null, salud = null;

async function saludPuente() {
  try { const r = await fetch(PUENTE + '/health', { credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback', signal: AbortSignal.timeout(4000) }); return r.ok ? await r.json() : null; } catch { return null; }
}
const enApp = () => Boolean(window.inherentEscritorio);
const arch = () => (/arm|aarch64|apple/i.test(navigator.userAgent + (navigator.platform || '')) || (navigator.userAgentData?.platform === 'macOS' && !/Intel/.test(navigator.userAgent)) ? 'arm64' : 'x64');

// Comprueba cada paso contra lo que hay. Devuelve { quien, app, claude, laya, google, prueba }.
async function comprobar(me) {
  const h = (me.primer_dia?.hechos) || {};
  const [s, pd] = await Promise.all([saludPuente(), api('me/primer-dia').catch(() => ({}))]);
  salud = s;
  return {
    quien: Boolean(h.quien),
    app: Boolean(h.app) || enApp() || Boolean(s),
    claude: Boolean(h.claude) || Boolean(s?.chat?.claude),
    laya: Boolean(h.laya) || Boolean(s?.listo),
    google: Boolean(me.google?.drive && me.google?.calendar),
    prueba: Boolean(h.prueba) || Boolean(pd.prueba),
  };
}
async function guardar(me, cambios) {
  const cur = me.primer_dia || { paso: 0, hechos: {}, pausado: false, hecho_at: null };
  const r = await api('me/primer-dia', { method: 'PUT', body: { ...cur, ...cambios, hechos: { ...(cur.hechos || {}), ...(cambios.hechos || {}) } } }).catch(() => null);
  if (r?.primer_dia) me.primer_dia = r.primer_dia;
  pintarChip(me);
}

export const primerDiaHecho = (me) => Boolean(me.primer_dia?.hecho_at);
export const avancePrimerDia = (me) => { const h = me.primer_dia?.hechos || {}; return { n: PASOS.filter(([k]) => h[k]).length, total: PASOS.length }; };

// El chip de la barra: «Tu primer día · 2 de 6». Solo mientras el recorrido está pausado.
export function pintarChip(me) {
  const c = $('#pdchip'); if (!c) return;
  const on = me.role !== 'client' && !primerDiaHecho(me) && Boolean(me.primer_dia?.pausado);
  c.hidden = !on; if (on) { const a = avancePrimerDia(me); c.innerHTML = `Tu primer día · ${a.n} de ${a.total}`; c.dataset.n = `${a.n}/${a.total}`; c.title = `Tu primer día · ${a.n} de ${a.total}`; c.onclick = () => abrirPrimerDia(me); }
}

// Al entrar: si nunca lo terminó y no lo pausó, se abre solo.
export async function primerDia(me) {
  if (!me || me.role === 'client' || primerDiaHecho(me)) return;
  pintarChip(me);
  if (me.primer_dia?.pausado) return;
  abrirPrimerDia(me);
}

export async function abrirPrimerDia(me) {
  if (dlg) dlg.remove();
  dlg = document.createElement('dialog'); dlg.className = 'pd-dlg'; dlg.setAttribute('aria-label', 'Tu primer día en Inherent OS');
  document.body.append(dlg);
  let ok = Object.fromEntries(PASOS.map(([k]) => [k, Boolean(me.primer_dia?.hechos?.[k])])), paso = PASOS.findIndex(([k]) => !ok[k]), revisando = false;
  if (paso < 0) paso = PASOS.length - 1;
  const [primero] = me.name.split(' ');
  const espacios = [me.areas?.some((a) => ['home', 'work', 'clients', 'operations', 'sales', 'finanzas'].includes(a)) && 'Organization', me.areas?.includes('estrategia') && 'Estrategia', (me.areas?.includes('content') || me.areas?.includes('marcas')) && 'Marcas'].filter(Boolean);
  const cuerpo = (k) => {
    if (k === 'quien') return html`<p>Hola, ${primero}. En Inherent eres <b>${me.title || (me.roles || []).map(roleName).join(' · ') || (me.role === 'ceo' ? 'el CEO' : 'parte del equipo')}</b>.</p>
      <p>Vas a ver ${espacios.length ? html`<b>${espacios.join(' · ')}</b>` : 'tu espacio de trabajo'}: lo que tu puesto necesita, nada más. Si te falta algo, el CEO lo abre en Vistas por rol.</p>
      <div class="row"><button class="btn" data-pd="hecho" data-k="quien">Entendido</button></div>`;
    if (k === 'app') return html`<p>Inherent OS corre mejor en su propia app: trae el puente para hablar con tu Claude y con Laya, y se actualiza sola.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn" href="/api/escritorio/descarga?arch=${arch()}" target="_blank" rel="noopener">${ico('download', 15)} Descargar para Mac</a><a class="btn ghost" href="/api/escritorio/descarga?arch=${arch() === 'arm64' ? 'x64' : 'arm64'}" target="_blank" rel="noopener">Para ${arch() === 'arm64' ? 'Mac con Intel' : 'Mac con chip Apple'}</a></div>
      <p class="mut sm">Ábrela, entra con tu Google y vuelve aquí: el OS la detecta solo. ${salud || enApp() ? html`<b class="ok">La app ya está abierta ✓</b>` : 'Si macOS dice que no la puede abrir: clic derecho → Abrir.'}</p>
      ${revisar('app')}`;
    if (k === 'claude') return html`<p>El chat de Estrategia y el de Diseño usan <b>tu</b> Claude, en tu compu. La app lo instala; tú entras con tu cuenta.</p>
      <p class="mut sm">Si la app te lo pide: abre la Terminal, escribe <code>claude</code> y Enter, luego <code>/login</code> y Enter, y entra en el navegador.</p>
      ${salud ? html`<p class="mut sm">${salud.chat?.claude ? html`<b class="ok">Claude responde ✓</b>` : 'Todavía no encuentro Claude en tu compu.'}</p>` : html`<p class="mut sm">Primero abre la app (paso 2).</p>`}
      ${revisar('claude')}`;
    if (k === 'laya') return html`<p><b>Laya</b> juzga las piezas con el criterio de Inherent y el <b>ojo visual</b> dice si una imagen se ve de la marca. Los dos corren en tu compu y se descargan solos la primera vez (unos minutos).</p>
      ${salud ? html`<p class="mut sm">${salud.listo ? html`<b class="ok">Laya lista ✓</b>` : salud.cargando ? 'Laya se está descargando…' : salud.error ? 'Laya todavía no está instalada: la app te lo ofrece al abrirla.' : 'Laya todavía no carga.'}${salud.ojo ? html` · El ojo visual: ${salud.ojo.listo ? 'listo ✓' : salud.ojo.disponible ? 'se carga al primer uso' : 'no instalado (opcional)'}` : ''}</p>` : html`<p class="mut sm">Primero abre la app (paso 2).</p>`}
      ${revisar('laya')}`;
    if (k === 'google') return html`<p>Con Google conectado, el OS guarda archivos en <b>Drive</b> y agenda en <b>Calendar</b> con tu cuenta.</p>
      <p class="mut sm">${me.google?.drive && me.google?.calendar ? html`<b class="ok">Drive y Calendar conectados ✓</b>` : html`Falta ${[!me.google?.drive && 'Drive', !me.google?.calendar && 'Calendar'].filter(Boolean).join(' y ')}. Vuelve a entrar con Google y acepta los permisos.`}</p>
      ${me.google?.drive && me.google?.calendar ? html`<div class="row"><button class="btn" data-pd="hecho" data-k="google">Seguir</button></div>` : html`<div class="row" style="gap:8px"><a class="btn" href="/api/auth/google">Conectar Google</a>${revisarBtn('google')}</div>`}`;
    return html`<p>Última: crea algo de verdad. <b>Una idea</b> en Marcas › Ideas, <b>una tarea</b> en Mis tareas o <b>un lead</b> en Ventas. Cuando exista, este paso se marca solo.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap">${espacios.includes('Marcas') ? html`<a class="btn" href="#/marcas" data-pd="ir">Ir a Marcas</a>` : ''}${me.areas?.includes('work') ? html`<a class="btn ${espacios.includes('Marcas') ? 'ghost' : ''}" href="#/org/work" data-pd="ir">Ir a Mis tareas</a>` : ''}${me.areas?.includes('sales') ? html`<a class="btn ghost" href="#/org/sales" data-pd="ir">Ir a Ventas</a>` : ''}${revisarBtn('prueba')}</div>
      <p class="mut sm">Puedes pausar aquí: el recorrido te espera en la barra de arriba.</p>`;
  };
  const revisarBtn = (k) => html`<button class="btn ghost" data-pd="revisar" data-k="${k}" ${revisando ? raw('disabled') : ''}>${revisando ? 'Revisando…' : 'Ya lo hice: revisar'}</button>`;
  const revisar = (k) => html`<div class="row" style="gap:8px;flex-wrap:wrap">${revisarBtn(k)}${OPCIONALES.has(k) ? html`<button class="linkish mut sm" data-pd="saltar" data-k="${k}">Mi puesto no usa esto · saltar</button>` : ''}</div>`;
  const pintar = () => {
    const [k, titulo] = PASOS[paso], hechos = PASOS.filter(([x]) => ok[x]).length, todo = hechos === PASOS.length;
    mount(dlg, html`<div class="pd-wrap"><aside class="pd-lista"><div class="pd-cab"><b>Tu primer día</b><span class="mut sm">${hechos} de ${PASOS.length}</span></div>
        ${PASOS.map(([x, t, s], i) => html`<button type="button" class="pd-paso ${i === paso ? 'on' : ''} ${ok[x] ? 'ok' : ''}" data-pd="paso" data-i="${i}"><i>${ok[x] ? ico('check', 12) : i + 1}</i><span><b>${t}</b><small>${s}</small></span></button>`)}
        <div class="sp"></div><button type="button" class="linkish mut sm" data-pd="pausa">Seguir después</button></aside>
      <section class="pd-cuerpo">${todo ? html`<span class="lbl">Listo</span><h2>Ya puedes trabajar, ${primero}.</h2><p>Todo en orden. En cada sección hay un botón <b>«Cómo se usa»</b> con el video de esa parte; y en tu perfil, la lista de los que te tocan.</p><div class="row"><button class="btn" data-pd="fin">Empezar</button></div>`
        : html`<span class="lbl">Paso ${paso + 1} de ${PASOS.length}</span><h2>${titulo}</h2>${cuerpo(k)}`}</section></div>`);
  };
  dlg.onclick = async (e) => {
    const b = e.target.closest('[data-pd]'); if (!b) return;
    const a = b.dataset.pd, k = b.dataset.k;
    if (a === 'paso') { paso = +b.dataset.i; pintar(); return; }
    if (a === 'hecho' || a === 'saltar') { ok[k] = true; await guardar(me, { hechos: { [k]: true }, paso }); avanzar(); return; }
    if (a === 'revisar') {
      revisando = true; pintar();
      const r = await comprobar(me); Object.assign(ok, Object.fromEntries(Object.entries(r).filter(([, v]) => v)));
      revisando = false;
      if (ok[k]) { await guardar(me, { hechos: { [k]: true }, paso }); toast('Listo ✓'); avanzar(); } else { pintar(); toast(k === 'app' ? 'Todavía no encuentro la app abierta en esta compu' : k === 'prueba' ? 'Todavía no hay nada creado con tu cuenta' : 'Todavía no está listo', true); }
      return;
    }
    if (a === 'ir') { await guardar(me, { pausado: true, paso }); dlg.close(); return; }
    if (a === 'pausa') { await guardar(me, { pausado: true, paso }); dlg.close(); return; }
    if (a === 'fin') { await guardar(me, { hecho_at: true, pausado: false, paso }); dlg.close(); toast('¡Bienvenido! 🎉'); return; }
  };
  const avanzar = () => { const sig = PASOS.findIndex(([x]) => !ok[x]); paso = sig < 0 ? PASOS.length - 1 : sig; pintar(); };
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); guardar(me, { pausado: true, paso }); dlg.close(); });
  dlg.addEventListener('close', () => { dlg.remove(); dlg = null; });
  pintar(); dlg.showModal();
  // Al abrir, se comprueba lo que ya está (sin bloquear la pantalla).
  comprobar(me).then((r) => { const antes = { ...ok }; Object.assign(ok, Object.fromEntries(Object.entries(r).filter(([, v]) => v))); const nuevos = Object.keys(ok).filter((x) => ok[x] && !antes[x]); if (nuevos.length) { guardar(me, { hechos: Object.fromEntries(nuevos.map((x) => [x, true])), paso }); if (ok[PASOS[paso][0]]) avanzar(); else pintar(); } else pintar(); });
}
