// Ajustes (#/ajustes/ia) · conectar la IA del OS en un minuto: elige un proveedor, pega su llave y listo.
// Arriba los tres pasos (se van marcando solos), después «Para qué se usa» (IA para Agents, para investigar y para el Chat:
// cada uso elige proveedor y modelo de los conectados) y abajo todos los proveedores con su logo. Las llaves se guardan
// cifradas en el servidor y nunca vuelven aquí (solo sus últimos 4). Conectan el CEO y el COO; el resto ve el estado.
import { html, raw, mount, ico, skel, toast, api, drawer, closeDrawer, confirmAsk } from '../core.js';
import { PROVEEDORES, USOS, proveedorDe, logoDe } from '../ia-proveedores.js';

export const esqueleto = () => skel('pagina');
const logo = (id, cls = '') => html`<span class="aj-logo ${cls}"><img src="${logoDe(id)}" alt="" loading="lazy"></span>`;

export async function render(el, { me, alive }) {
  mount(el, skel('pagina'));
  let est;
  try { est = await api('ia/estado'); } catch (e) { return mount(el, html`<div class="empty card">${e.message}</div>`); }
  if (!alive()) return;
  const ed = est.editor;
  const st = (id) => est.proveedores.find((p) => p.id === id) || {};

  const pasos = () => {
    const hay = est.proveedores.some((p) => p.conectado), usado = Boolean(est.usos?.agents?.proveedor);
    const n = !hay ? 0 : !usado ? 1 : 2;
    return html`<div class="aj-pasos">${[['Elige una IA', 'La que ya pagas o la que quieras probar'], ['Pega su llave', 'La probamos al instante'], ['Listo', 'Agentes y Chat ya la usan']].map(([t, s], i) => html`<div class="aj-paso ${i < n || (i === 2 && n === 2) ? 'hecho' : i === n ? 'ahora' : ''}"><span class="aj-paso-n">${i < n || (i === 2 && n === 2) ? ico('check', 13) : i + 1}</span><span><b>${t}</b><span class="mut sm">${s}</span></span></div>${i < 2 ? html`<span class="aj-paso-l ${i < n ? 'hecho' : ''}"></span>` : ''}`)}</div>`;
  };

  const usoCard = (u) => {
    const x = est.usos?.[u.id] || {}, conectados = est.proveedores.filter((p) => p.conectado && (u.id !== 'investigacion' || proveedorDe(p.id)?.busca));
    const p = x.proveedor && st(x.proveedor).conectado ? st(x.proveedor) : null;
    return html`<div class="card aj-uso">
      <div class="aj-uso-h">${p ? logo(p.id, 'sm') : html`<span class="aj-logo sm vacio">${ico(u.icono, 15)}</span>`}<div><b>${u.nombre}</b><span class="mut sm">${u.sub}</span></div></div>
      ${conectados.length ? html`<div class="aj-uso-f">
        <select class="in sm" data-uso="${u.id}" data-k="proveedor" ${ed ? '' : raw('disabled')}><option value="">${u.id === 'investigacion' ? 'Sin investigación web' : 'Elige una IA'}</option>${conectados.map((c) => html`<option value="${c.id}" ${x.proveedor === c.id ? raw('selected') : ''}>${proveedorDe(c.id)?.nombre}</option>`)}</select>
        ${p ? html`<select class="in sm" data-uso="${u.id}" data-k="modelo" ${ed ? '' : raw('disabled')}>${(p.modelos || []).map((m) => html`<option value="${m}" ${x.modelo === m ? raw('selected') : ''}>${m}</option>`)}</select>` : ''}
        ${u.id === 'chat' ? html`<span class="mut xs">Todas las IAs conectadas aparecen en el selector del Chat; esta es la que abre por defecto.</span>` : ''}</div>`
      : html`<p class="mut sm">${u.id === 'investigacion' ? 'Conecta Perplexity u OpenRouter para que los agentes traigan fuentes reales.' : 'Conecta una IA abajo y queda aquí sola.'}</p>`}
    </div>`;
  };

  const tarjeta = (p) => {
    const s = st(p.id), on = s.conectado, local = p.forma === 'local';
    return html`<button type="button" class="aj-prov ${on ? 'on' : ''}" data-act="${local ? 'local' : 'abrir'}" data-p="${p.id}">
      ${logo(p.id)}
      <span class="aj-prov-t"><span class="aj-prov-n"><b>${p.nombre}</b>${p.recomendado ? html`<span class="aj-badge">Recomendado</span>` : ''}${p.busca ? html`<span class="aj-badge suave">${ico('globe', 10)} Busca en la web</span>` : ''}</span>
        <span class="mut sm">${p.sub}</span>
        ${on ? html`<span class="aj-ok xs">${ico('check', 11)} Conectada${s.ultimos4 ? ` · ••••${s.ultimos4}` : ''}${s.modelos?.length ? ` · ${s.modelos.length} modelos` : ''}</span>` : local ? html`<span class="mut xs">En tu compu · se conecta en el Chat</span>` : ''}</span>
      <span class="aj-prov-a">${on ? ico('check', 15) : local ? ico('arrow-right', 15) : ico('plus', 15)}</span></button>`;
  };

  const pinta = () => mount(el, html`<div class="aj">
    <div class="aj-hero"><span class="lbl">Ajustes</span><h1>IA del OS</h1><p class="mut">Conecta las IAs que usa el equipo. ${ed ? 'Pega una llave y listo: no hay que instalar nada.' : 'Las conectan el CEO o el COO; aquí ves cuáles están listas.'}</p></div>
    <nav class="iai-tabs"><a href="#/ajustes/ia" aria-current="page">${ico('sparkles', 14)} IA</a><a href="#/ai/mcps">${ico('puzzle', 14)} Conexiones (MCP)</a></nav>
    ${pasos()}
    <div class="hy-bh iai-sec"><h2>Para qué se usa</h2><span>Cada parte del OS usa la IA que elijas</span></div>
    <div class="aj-usos">${USOS.map(usoCard)}</div>
    <div class="hy-bh iai-sec"><h2>Proveedores</h2><span>Con una llave basta. OpenRouter da acceso a casi todos los modelos con una sola</span></div>
    <div class="aj-provs">${PROVEEDORES.filter((p) => p.forma !== 'local').map(tarjeta)}</div>
    <div class="hy-bh iai-sec"><h2>En tu compu</h2><span>Usan tu suscripción o tu harness; cada quien las conecta en su compu</span></div>
    <div class="aj-provs">${PROVEEDORES.filter((p) => p.forma === 'local').map(tarjeta)}</div>
  </div>`);

  // El panel para conectar un proveedor: consigue la llave → pégala → probamos → ¡listo!
  function abrir(id) {
    const p = proveedorDe(id), s = st(id);
    const cuerpo = (fase = '', msg = '') => html`<div class="aj-con">
      <div class="aj-con-h">${logo(id, 'xl')}<div><h1>${p.nombre}</h1><p class="mut">${p.sub}</p></div></div>
      ${fase === 'ok' ? html`<div class="aj-exito"><span class="aj-check">${ico('check', 30)}</span><b>¡Conectada!</b><span class="mut">${msg}</span></div>` : html`
      ${s.conectado ? html`<p class="aj-ok">${ico('check', 13)} Conectada${s.ultimos4 ? ` · ••••${s.ultimos4}` : ''}${s.base ? ` · ${s.base}` : ''} · ${s.modelos?.length || 0} modelos</p>` : ''}
      ${!ed ? html`<p class="mut">Solo el CEO o el COO conectan IAs.</p>` : html`
      <ol class="aj-con-pasos">
        ${p.forma === 'url' ? html`<li><b>La dirección de tu servidor</b><span class="mut sm">La que expone la API compatible con OpenAI (termina en /v1).</span><input class="in" id="aj-base" placeholder="${p.ejemplo}" value="${s.base || ''}" autocomplete="off"></li>
          <li><b>Su llave, si pide</b><input class="in" id="aj-llave" type="password" placeholder="Opcional" autocomplete="off"></li>`
        : html`<li><b>Consigue tu llave</b><span class="mut sm">Se abre la página de ${p.nombre}: crea una y cópiala.</span><a class="btn ghost sm" href="${p.llave}" target="_blank" rel="noreferrer">${ico('external-link', 13)} Abrir ${p.nombre}</a></li>
          <li><b>Pégala aquí</b><input class="in" id="aj-llave" type="password" placeholder="sk-…" autocomplete="off" spellcheck="false"></li>`}
      </ol>
      ${msg ? html`<p class="aj-err sm">${ico('triangle-alert', 13)} ${msg}</p>` : ''}
      <div class="aj-con-a"><button class="btn" data-act="conectar" ${fase === 'probando' ? raw('disabled') : ''}>${fase === 'probando' ? html`<span class="aj-spin"></span> Probando…` : s.conectado ? 'Cambiar llave' : 'Conectar'}</button>
        ${s.conectado ? html`<button class="btn ghost" data-act="modelos">${ico('rotate-cw', 13)} Actualizar modelos</button><button class="btn ghost" data-act="quitar">Desconectar</button>` : ''}</div>
      <p class="mut xs">La llave se guarda cifrada en el servidor del OS y no vuelve a mostrarse. Se usa solo para las IAs que elijas arriba.</p>`}`}
    </div>`;
    const accs = {
      conectar: async () => {
        const llave = document.getElementById('aj-llave')?.value || '', base = document.getElementById('aj-base')?.value || '';
        drawer(cuerpo('probando'), accs, { title: p.nombre });
        try {
          est = await api('ia/conectar', { method: 'POST', body: { proveedor: id, llave, base } });
          drawer(cuerpo('ok', `${st(id).modelos?.length || 0} modelos disponibles`), accs, { title: p.nombre });
          if (alive()) pinta();
          setTimeout(() => { if (document.querySelector('.aj-exito')) closeDrawer(); }, 1600);
        } catch (e) { drawer(cuerpo('', e.message), accs, { title: p.nombre }); }
      },
      modelos: async () => { try { est = await api('ia/modelos', { method: 'POST', body: { proveedor: id } }); toast('Modelos actualizados'); drawer(cuerpo(), accs, { title: p.nombre }); pinta(); } catch (e) { toast(e.message, true); } },
      quitar: async () => { if (!(await confirmAsk(`¿Desconectar ${p.nombre}? Se borra su llave.`))) return; try { est = await api('ia/desconectar', { method: 'POST', body: { proveedor: id } }); closeDrawer(); toast(`${p.nombre} desconectada`); pinta(); } catch (e) { toast(e.message, true); } },
    };
    drawer(cuerpo(), accs, { title: p.nombre });
    setTimeout(() => document.getElementById(p.forma === 'url' ? 'aj-base' : 'aj-llave')?.focus(), 80);
  }

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b || !el.contains(b)) return;
    if (b.dataset.act === 'abrir') abrir(b.dataset.p);
    if (b.dataset.act === 'local') location.hash = proveedorDe(b.dataset.p)?.donde || '#/chat';
  });
  el.addEventListener('change', async (ev) => {
    const t = ev.target; if (!t.dataset.uso || !ed) return;
    const u = t.dataset.uso, x = { ...(est.usos?.[u] || {}) };
    if (t.dataset.k === 'proveedor') { x.proveedor = t.value; x.modelo = st(t.value).modelos?.[0] || ''; } else x.modelo = t.value;
    try { est = await api('ia/uso', { method: 'POST', body: { uso: u, ...x } }); toast('Guardado'); pinta(); } catch (e) { toast(e.message, true); }
  });
  pinta();
}
