// Inherent AI (#/ai): el Chat, los Agentes y los MCPs, sobre el servidor de Inherent (PLAN-GATEWAY F3). Hermes se retiró.
//   · Portada: tres tarjetas. Chat (el servidor en línea y sus modelos), Agentes (los trabajos que esperan tu OK) y MCPs
//     (cuántas conexiones tienes). Solo lee.
//   · #/ai/mcps: el directorio de conectores (mcp-directorio.js: conectar de verdad, con el OS como puente) y el conector de
//     Inherent OS hacia tu Claude o ChatGPT (connectai.js).
import { html, raw, mount, acts, ico, skel, LOGO, $ } from '../core.js';
import { saludServidor } from '../chat-gateway.js';
import { openConnect } from '../connectai.js';

export const esqueleto = () => skel('pagina');

const ACTUAL = raw('aria-current="page"'); // constante segura: la pestaña abierta
const pl = (n, uno, otros) => `${n} ${n === 1 ? uno : otros}`;
const punto = (estado) => html`<span class="iai-dot ${estado}" aria-hidden="true"></span>`;
const revisando = (t) => html`<p class="mut sm">${t}</p>`;
const seccion = (titulo, sub, cuerpo) => html`<div class="hy-bh iai-sec"><h2>${titulo}</h2>${sub ? html`<span>${sub}</span>` : ''}</div>${cuerpo}`;
// Lecturas del OS para la portada (sin escrituras): los trabajos de los agentes y el estado de las conexiones.
const leer = async (ruta) => { try { const r = await fetch('/api/' + ruta, { credentials: 'same-origin', headers: { 'X-CEOOS': '1' } }); return r.ok ? await r.json() : null; } catch { return null; } };

export async function render(el, { me, sub = [], alive }) {
  let pagina = String(sub[0] || '');
  // Cualquier otra página → #/ai (se canoniza la ruta y se pinta la portada).
  if (pagina && pagina !== 'mcps') { pagina = ''; try { history.replaceState(null, '', '#/ai'); } catch {} }
  let gen = 0;

  const cabecera = () => html`<div class="iai-hero sp-hero"><span class="lbl">${pagina ? 'Inherent AI' : 'Tu IA de trabajo'}</span><h1>${pagina ? 'Conexiones' : 'Inherent AI'}</h1>
    <p>${pagina ? 'Conecta tus herramientas: el Chat y los agentes las usan desde el servidor, con tu permiso.' : 'Corre en el servidor de Inherent: siempre encendido, con tus conexiones y tus permisos.'}</p></div>
    <nav class="iai-tabs" aria-label="Inherent AI"><a href="#/chat">${ico('chat', 14)} Chat</a><a href="#/ai/agentes">${ico('sparkles', 14)} Agentes</a><a href="#/ai/mcps" ${pagina ? ACTUAL : ''}>${ico('puzzle', 14)} Conexiones</a></nav>`;

  // ---------- Portada ----------
  function portada() {
    return {
      cuerpo: html`<section class="iai-cards" aria-label="Inherent AI">
        <article class="card iai-card"><div class="iai-card-h"><span class="iai-ic">${ico('chat', 20)}</span><b>Chat</b></div>
          <p class="mut sm">Conversa con el contexto de Inherent y de cada cliente. Busca en la web, lee el OS como tú y te propone cambios que apruebas.</p>
          <div class="iai-estado" id="iai-chat">${revisando('Revisando el servidor…')}</div>
          <a class="btn iai-go" href="#/chat">Abrir el Chat</a></article>
        <article class="card iai-card"><div class="iai-card-h"><span class="iai-ic">${ico('sparkles', 20)}</span><b>Agentes</b></div>
          <p class="mut sm">Cada agente sigue su flujo de etapas; le encargas un trabajo y apruebas cada paso.</p>
          <div class="iai-estado" id="iai-agentes">${revisando('Revisando los trabajos…')}</div>
          <a class="btn iai-go" href="#/ai/agentes">Ver los agentes</a></article>
        <article class="card iai-card"><div class="iai-card-h"><span class="iai-ic">${ico('puzzle', 20)}</span><b>Conexiones</b></div>
          <p class="mut sm">Notion, Canva, Figma, Drive… conéctalos una vez y el servidor los usa por ti.</p>
          <div class="iai-estado" id="iai-mcps">${revisando('Revisando tus conexiones…')}</div>
          <a class="btn iai-go" href="#/ai/mcps">Ver conexiones</a></article></section>`,
      despues: async (g) => {
        const vivo = () => alive() && g === gen;
        const [srv, runs, con] = await Promise.all([saludServidor(), leer('agentes/runs'), leer('conectores/estado')]);
        if (!vivo()) return;
        const chat = $('#iai-chat', el), ag = $('#iai-agentes', el), mcp = $('#iai-mcps', el);
        if (chat) mount(chat, srv.on ? html`<p class="sm">${punto('ok')} <b>En línea</b>${srv.version ? html` <span class="mut">· servidor ${srv.version}</span>` : ''}</p><p class="mut sm">${pl((srv.modelos || []).length, 'modelo', 'modelos')}: ${(srv.modelos || []).slice(0, 3).join(', ')}</p>`
          : html`<p class="sm">${punto('warn')} <b>Fuera de línea ahora</b></p><p class="mut sm">Suele volver en un momento.</p>`);
        const xs = (runs?.items || []).filter((r) => !r.completo && !r.archivado), esperan = xs.filter((r) => r.etapas?.[r.activa]?.estado === 'revision').length;
        if (ag) mount(ag, runs ? html`<p class="sm">${punto(esperan ? 'warn' : 'ok')} <b>${esperan ? pl(esperan, 'trabajo espera tu OK', 'trabajos esperan tu OK') : 'Nada esperando tu OK'}</b></p><p class="mut sm">${pl(xs.length, 'trabajo en curso', 'trabajos en curso')}</p>` : html`<p class="mut sm">No pude leer los trabajos.</p>`);
        const conectados = (con?.conectores || []).filter((c) => c.conectado).length;
        if (mcp) mount(mcp, con ? html`<p class="sm">${punto(conectados ? 'ok' : 'off')} <b>${conectados ? pl(conectados, 'conexión', 'conexiones') : 'Sin conexiones todavía'}</b></p>` : html`<p class="mut sm">No pude leer tus conexiones.</p>`);
      },
    };
  }

  // ---------- MCPs ----------
  const conexion = () => html`<section class="card iai-conn"><span class="ailogos">${['claude', 'chatgpt', 'claudecode', 'codex'].map((k) => html`<span class="ailogo sm">${LOGO[k]}</span>`)}</span>
    <div class="grow"><b>Habla con Inherent OS desde tu IA</b><div class="mut sm">Conéctalo a Claude o ChatGPT: pregúntale tus pendientes, pídele una cotización o que arme un proyecto.</div></div>
    <span class="mut sm">${me.mcp ? html`Conectado ${ico('check', 13)}` : 'Sin conectar'}</span><button type="button" class="btn" data-act="conectar">${me.mcp ? 'Ver conexiones' : 'Conectar'}</button></section>`;

  function paginaMcps() {
    return {
      cuerpo: html`<div id="iai-dir"></div>
        ${seccion('Conecta Inherent OS a otra IA (Claude, ChatGPT)', 'El conector de Inherent OS hacia tu Claude o ChatGPT', html`<div id="iai-conn">${conexion()}</div>`)}`,
      // El directorio de conectores (mcp-directorio.js): conectar de verdad desde aquí, con el OS como puente.
      despues: (g) => { import('../mcp-directorio.js').then((m) => { const box = $('#iai-dir', el); if (box && g === gen) m.pintarDirectorio(box, me); }); },
    };
  }

  function paint() {
    const g = ++gen, pg = pagina === 'mcps' ? paginaMcps() : portada();
    mount(el, html`${cabecera()}${pg.cuerpo}`);
    pg.despues?.(g);
  }

  acts(el, {
    conectar: () => openConnect(me, () => { const c = $('#iai-conn', el); if (c) mount(c, conexion()); }),
  });

  paint();
}
