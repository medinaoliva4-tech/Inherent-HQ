// Conectar Inherent OS a la IA de cada persona (Claude, ChatGPT, Claude Code, Codex), como cualquier
// conector MCP: se pega `https://<app>/mcp`, la app abre Inherent OS, la persona entra con Google y da «Permitir».
// Con eso, desde un chat: «¿qué tengo pendiente hoy?», «arma una cotización para NAO», «crea el proyecto».
import { html, mount, api, toast, drawer, closeDrawer, LOGO, emblem, ico } from './core.js';

export const dismissed = () => { try { return localStorage.getItem('ai.connect.off') === '1'; } catch { return false; } };
export const dismiss = () => { try { localStorage.setItem('ai.connect.off', '1'); } catch {} };
const mcpUrl = () => `${location.origin}/mcp`;
const tiles = (ks = ['claude', 'chatgpt', 'claudecode', 'codex']) => html`<div class="ailogos">${ks.map((k) => html`<span class="ailogo">${LOGO[k]}</span>`)}</div>`;

// La «noti»: texto arriba, logos abajo, mientras la persona no haya conectado ninguna app.
export const connectNotice = (me) => (me.mcp || dismissed() || me.role === 'client' ? '' : html`<div class="ainoti">
  <button class="aix" data-ai="off" title="Ahora no" aria-label="Cerrar">${ico('x', 16)}</button>
  <b>Habla con Inherent OS desde tu IA</b>
  <div class="mut sm">Pregúntale tus pendientes, pídele una cotización o que arme un proyecto, desde un chat.</div>
  <div class="aifoot">${tiles()}<button class="btn" data-ai="open">Conectar</button></div></div>`);
export function hookNotice(root, me, after) {
  root.addEventListener('click', (e) => { const t = e.target.closest('[data-ai]'); if (!t) return; if (t.dataset.ai === 'off') { dismiss(); t.closest('.ainoti')?.remove(); } else openConnect(me, after); });
}

export function openConnect(me, after) {
  let tab = 'claude';
  const url = mcpUrl();
  const allow = html`te abre Inherent OS → entra con tu Google → <b>Permitir</b>`;
  // Cada app: sus pasos y un botón que copia lo necesario y abre la pantalla exacta donde se pega.
  const APPS = {
    claude: { name: 'Claude', open: 'https://claude.ai/settings/connectors', btn: 'Abrir Conectores de Claude',
      steps: html`<ol class="sm aisteps"><li>Dale el botón de abajo: copia la URL y abre los conectores de Claude.</li><li><b>Agregar conector personalizado</b> → Nombre: <code>Inherent OS</code> → URL: pega → <b>Agregar</b>.</li><li><b>Conectar</b>: ${allow}.</li><li>En un chat, activa «Inherent OS» y pregunta: <i>«¿qué tengo pendiente hoy?»</i></li></ol>` },
    chatgpt: { name: 'ChatGPT', open: 'https://chatgpt.com/#settings/Connectors', btn: 'Abrir Conectores de ChatGPT',
      steps: html`<ol class="sm aisteps"><li>Dale el botón de abajo: copia la URL y abre la configuración de ChatGPT.</li><li><b>Apps y conectores → Configuración avanzada</b> → activa <b>Modo desarrollador</b>.</li><li><b>Crear</b> → Nombre: <code>Inherent OS</code> → URL: pega → Autenticación: <b>OAuth</b> → marca «Confío en esta app» → <b>Crear</b>.</li><li>ChatGPT ${allow}.</li><li>En un chat: <b>+ → Más → Inherent OS</b> y pregunta.</li></ol>` },
    claudecode: { name: 'Claude Code', cmd: `claude mcp add --transport http inherent-os ${url}`, btn: 'Copiar comando',
      steps: html`<ol class="sm aisteps"><li>Pega esto en tu terminal, una sola vez:</li></ol><pre class="aicode">claude mcp add --transport http inherent-os ${url}</pre><ol class="sm aisteps" start="2"><li>Abre <code>claude</code>, escribe <code>/mcp</code> → <b>inherent-os</b> → <b>Authenticate</b>: ${allow}.</li></ol>` },
    codex: { name: 'Codex', cmd: `codex mcp add inherent-os --url ${url} && codex mcp login inherent-os`, btn: 'Copiar comando',
      steps: html`<ol class="sm aisteps"><li>Pega esto en tu terminal, una sola vez:</li></ol><pre class="aicode">codex mcp add inherent-os --url ${url} && codex mcp login inherent-os</pre><ol class="sm aisteps" start="2"><li>Se abre el navegador: ${allow}.</li></ol>` },
  };
  const apps = () => me.mcp_apps || [];
  const draw = () => drawer(html`<div class="row">${tiles()}<div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
    <h2>Conecta tu IA</h2>
    <p class="mut">Como cualquier conector: pegas esta URL y la app te pide entrar con tu Google. Actúa como <b>tú</b> y solo ve y hace lo que tu perfil permite.</p>
    <div class="aiurl"><code>${url}</code><button class="btn xs" data-act="copy">Copiar</button></div>
    <div class="aitabs">${Object.entries(APPS).map(([k, a]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}"><span class="ailogo sm">${LOGO[k]}</span>${a.name}</button>`)}</div>
    ${APPS[tab].steps}<button class="btn" data-act="go" style="margin-top:12px">${APPS[tab].btn}${APPS[tab].open ? ' ↗' : ''}</button>
    ${apps().length || me.mcp ? html`<div style="margin-top:26px"><div class="sm mut" style="margin-bottom:8px">Conectadas</div>
      ${apps().map((x) => html`<div class="row aiconn"><span class="grow">${x.name}<span class="mut sm"> · ${String(x.at || '').slice(0, 10)}</span></span><button class="btn ghost xs" data-act="cut" data-g="${x.g}">Desconectar</button></div>`)}
      <button class="btn ghost xs" data-act="cut" style="margin-top:8px">Desconectar todo</button></div>` : ''}`, {
    copy: () => copy(url, 'URL copiada'),
    tab: (t) => { tab = t.dataset.t; draw(); },
    go: () => { const a = APPS[tab]; if (a.open) window.open(a.open, '_blank', 'noopener'); copy(a.cmd || url, a.open ? 'URL copiada · pégala en la app' : 'Copiado · pégalo en tu terminal'); },
    cut: async (t) => {
      try {
        await api('me/mcp' + (t.dataset.g ? `?g=${encodeURIComponent(t.dataset.g)}` : ''), { method: 'DELETE' });
        me.mcp_apps = t.dataset.g ? apps().filter((x) => x.g !== t.dataset.g) : [];
        me.mcp = me.mcp_apps.length > 0;
        toast('Desconectada'); draw(); after?.();
      } catch (e) { toast(e.message, true); }
    },
  });
  draw();
}
async function copy(text, msg) { try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast('Selecciona y copia el texto', true); } }

// La pantalla de «Permitir»: llega aquí cuando una app pide conectarse (ya con sesión de Google).
const guessLogo = (n) => { n = String(n).toLowerCase(); return n.includes('claude code') || n.includes('claude-code') ? 'claudecode' : n.includes('claude') ? 'claude' : n.includes('chatgpt') || n.includes('openai') ? 'chatgpt' : n.includes('codex') ? 'codex' : null; };
export async function consentView(root, me, id, done) {
  let r;
  try { r = await api(`oauth/request?id=${encodeURIComponent(id)}`); }
  catch (e) { toast(e.message, true); return done(); }
  const lg = guessLogo(r.client_name);
  mount(root, html`<div class="consent"><div class="ccard">
    <div class="clogos"><span class="ailogo lg">${lg ? LOGO[lg] : html`<b>${r.client_name.slice(0, 1)}</b>`}</span><span class="cdots">⋯</span><span class="ailogo lg dark">${emblem()}</span></div>
    <h1><b>${r.client_name}</b> quiere conectarse a tu Inherent OS</h1>
    <p class="mut">Va a actuar como <b>tú</b> (${me.email}) y solo verá y hará lo que tu perfil permite: tus pendientes, tareas, clientes, cotizaciones y proyectos.</p>
    <div class="sm mut">Te regresa a <code>${r.host}</code></div>
    <div class="row" style="gap:10px;margin-top:22px"><button class="btn" data-c="yes">Permitir</button><button class="btn ghost" data-c="no">Cancelar</button></div>
    <div class="sm mut" style="margin-top:18px">Puedes desconectarla cuando quieras: tu foto → Claude · ChatGPT · Codex.</div>
  </div></div>`);
  root.querySelector('.ccard').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    root.querySelectorAll('[data-c]').forEach((x) => (x.disabled = true));
    try { const { redirect } = await api('oauth/decide', { method: 'POST', body: { id, allow: b.dataset.c === 'yes' } }); location.href = redirect; }
    catch (err) { toast(err.message, true); done(); }
  });
}
