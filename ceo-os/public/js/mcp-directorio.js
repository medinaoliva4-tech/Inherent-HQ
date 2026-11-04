// Inherent AI → MCPs · el directorio de conectores, al estilo de un catálogo de apps: todos con su logo, filtros por tipo
// de trabajo, buscador y un botón para conectar de verdad desde aquí. El OS hace de puente (api/_lib/conectores.js): abre
// el login del servicio, guarda el permiso cifrado y los agentes usan sus herramientas desde el servidor.
import { html, raw, mount, ico, toast, api, drawer, closeDrawer } from './core.js';
import { CONECTORES, CATEGORIAS, TIPO_TEXTO, conectorDe, logoConector } from './conectores.js';

export async function pintarDirectorio(box, me) {
  let est = null, cat = 'todo', q = '';
  const cargar = async () => { est = await api('conectores/estado').catch(() => ({ conectores: [], puente: false })); };
  await cargar();
  const st = (id) => est.conectores.find((c) => c.id === id) || {};

  // Lo que volvió del login del servicio (/?conectado=notion#/ai/mcps · ?error=…).
  const qs = new URLSearchParams(location.search);
  if (qs.get('conectado')) { const c = conectorDe(qs.get('conectado')); if (c) setTimeout(() => celebrar(c), 200); }
  if (qs.get('error')) toast(qs.get('error'), true);
  if (qs.get('conectado') || qs.get('error')) try { history.replaceState(null, '', '/#/ai/mcps'); } catch {}

  const tarjeta = (c) => {
    const s = st(c.id), on = s.conectado;
    return html`<button type="button" class="mcd-card ${on ? 'on' : ''}" data-act="abrir" data-id="${c.id}">
      <span class="mcd-logo"><img src="${logoConector(c)}" alt="" loading="lazy"></span>
      <span class="mcd-t"><span class="mcd-n"><b>${c.nombre}</b>${ico('check', 12)}<span class="mcd-tipo">${TIPO_TEXTO[c.tipo]}</span></span>
        <span class="mcd-sub">${c.sub}</span>
        <span class="mcd-de">${on ? html`<span class="mcd-ok">${ico('check', 10)} Conectado</span> · ` : ''}de ${c.de}</span></span>
      <span class="mcd-a ${on ? 'on' : ''}">${on ? ico('check', 16) : ico('plus', 16)}</span></button>`;
  };
  const lista = () => CONECTORES.filter((c) => (cat === 'todo' || c.cat === cat) && (!q || `${c.nombre} ${c.sub} ${c.de}`.toLowerCase().includes(q.toLowerCase())));
  const pinta = () => {
    const xs = lista(), conectados = CONECTORES.filter((c) => st(c.id).conectado);
    mount(box, html`<div class="mcd">
      <div class="mcd-hero"><div><h2>Conectores</h2><p class="mut">Conecta tus herramientas y tus agentes las usan: buscan en tu Notion, arman en Canva, leen tu Drive. Un clic y el servicio te pide permiso.</p></div>
        <label class="mcd-q">${ico('search', 14)}<input class="in" type="search" placeholder="Buscar" value="${q}" data-q></label></div>
      ${conectados.length ? html`<div class="mcd-tuyos"><span class="mut sm">Tuyos</span>${conectados.map((c) => html`<button type="button" class="mcd-chip" data-act="abrir" data-id="${c.id}"><img src="${logoConector(c)}" alt="">${c.nombre}</button>`)}</div>` : ''}
      <nav class="mcd-cats">${CATEGORIAS.map(([k, n]) => html`<button type="button" class="${cat === k ? 'on' : ''}" data-act="cat" data-c="${k}">${n}</button>`)}</nav>
      <div class="mcd-sec"><b>${cat === 'todo' && !q ? 'Más usados' : 'Resultados'}</b><span class="mcd-count">${xs.length}</span></div>
      <div class="mcd-grid">${xs.map(tarjeta)}</div>
      ${xs.length ? '' : html`<p class="mut">Nada con «${q}». Si tiene un MCP propio, agrégalo en Avanzado.</p>`}
    </div>`);
  };

  function celebrar(c) {
    drawer(html`<div class="mcd-exito"><span class="mcd-logo xl"><img src="${logoConector(c)}" alt=""></span><span class="aj-check">${ico('check', 30)}</span><h1>${c.nombre} conectado</h1><p class="mut">Tus agentes ya pueden usarlo: actívalo en la pestaña Conexiones de una etapa del workflow.</p><button class="btn" data-act="close">Listo</button></div>`, {}, { title: c.nombre });
  }

  function abrir(id) {
    const c = conectorDe(id), s = st(id);
    const pie = () => {
      if (c.tipo === 'google') return s.conectado ? html`<p class="aj-ok">${ico('check', 13)} Viene con tu cuenta de Google del OS.</p>` : html`<p class="mut">Se activa con tu cuenta de Google: sal y vuelve a entrar al OS aceptando el permiso de ${c.nombre}.</p>`;
      if (c.tipo === 'os') return s.conectado ? html`<p class="aj-ok">${ico('check', 13)} Integración del OS activa.</p>` : html`<p class="mut">La configura el CEO en el servidor del OS${c.env ? ` (${c.env})` : ''}.</p>`;
      if (c.tipo === 'pronto') return html`<p class="mut">Todavía no tiene un MCP remoto público que el OS pueda conectar directo. Cuando lo publique, se conecta aquí con un clic.</p>`;
      if (!est.puente) return html`<p class="aj-err sm">${ico('triangle-alert', 13)} Falta configurar APP_URL en el servidor para conectar desde aquí.</p>`;
      if (s.conectado) return html`<p class="aj-ok">${ico('check', 13)} Conectado</p><div class="aj-con-a"><button class="btn ghost" data-act="probar">${ico('zap', 13)} Ver sus herramientas</button><button class="btn ghost" data-act="quitar">Desconectar</button></div><div id="mcd-tools"></div>`;
      if (c.tipo === 'token') return html`<ol class="aj-con-pasos"><li><b>Crea un token</b><a class="btn ghost sm" href="${c.ayuda}" target="_blank" rel="noreferrer">${ico('external-link', 13)} Abrir ${c.nombre}</a></li><li><b>Pégalo aquí</b><input class="in" id="mcd-token" type="password" autocomplete="off" placeholder="Token"></li></ol><div class="aj-con-a"><button class="btn" data-act="token">Conectar</button></div>`;
      return html`<ol class="aj-con-pasos"><li><b>Toca «Conectar»</b><span class="mut sm">Se abre ${c.nombre} para que inicies sesión y le des permiso al OS.</span></li><li><b>Vuelves aquí solo</b><span class="mut sm">El permiso queda guardado cifrado y es solo tuyo.</span></li></ol><div class="aj-con-a"><button class="btn" data-act="oauth">${ico('link', 13)} Conectar ${c.nombre}</button></div>`;
    };
    const vista = (extra = '') => html`<div class="aj-con"><div class="aj-con-h"><span class="mcd-logo xl"><img src="${logoConector(c)}" alt=""></span><div><h1>${c.nombre}</h1><p class="mut">${c.sub} · de ${c.de}</p><span class="mcd-tipo">${TIPO_TEXTO[c.tipo]}</span></div></div>${pie()}${extra}</div>`;
    const accs = {
      oauth: async (b) => { b.disabled = true; b.innerHTML = '<span class="aj-spin"></span> Abriendo…'; try { const { url } = await api('conectores/conectar', { method: 'POST', body: { id } }); location.href = url; } catch (e) { toast(e.message, true); drawer(vista(html`<p class="aj-err sm">${ico('triangle-alert', 13)} ${e.message}</p>`), accs, { title: c.nombre }); } },
      token: async (b) => { const token = document.getElementById('mcd-token')?.value || ''; b.disabled = true; b.innerHTML = '<span class="aj-spin"></span> Probando…'; try { await api('conectores/conectar', { method: 'POST', body: { id, token } }); await cargar(); pinta(); celebrar(c); } catch (e) { drawer(vista(html`<p class="aj-err sm">${ico('triangle-alert', 13)} ${e.message}</p>`), accs, { title: c.nombre }); } },
      probar: async () => { const box2 = document.getElementById('mcd-tools'); if (box2) box2.innerHTML = '<p class="mut sm">Preguntándole…</p>'; try { const { tools } = await api('conectores/probar', { method: 'POST', body: { id } }); if (box2) mount(box2, html`<p class="sm"><b>${tools.length} herramientas</b></p><ul class="mcd-tools">${tools.slice(0, 40).map((t) => html`<li><code>${t.name}</code><span class="mut xs">${t.description}</span></li>`)}</ul>`); } catch (e) { if (box2) mount(box2, html`<p class="aj-err sm">${e.message}</p>`); } },
      quitar: async () => { if (!confirm(`¿Desconectar ${c.nombre}? Se borra tu permiso.`)) return; await api('conectores/desconectar', { method: 'POST', body: { id } }).catch(() => {}); await cargar(); pinta(); closeDrawer(); toast(`${c.nombre} desconectado`); },
    };
    drawer(vista(), accs, { title: c.nombre });
  }

  box.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b || !box.contains(b)) return;
    if (b.dataset.act === 'abrir') abrir(b.dataset.id);
    if (b.dataset.act === 'cat') { cat = b.dataset.c; pinta(); }
  });
  box.addEventListener('input', (ev) => { if (ev.target.matches('[data-q]')) { q = ev.target.value; const pos = ev.target.selectionStart; pinta(); const i = box.querySelector('[data-q]'); i?.focus(); i?.setSelectionRange(pos, pos); } });
  pinta();
}
