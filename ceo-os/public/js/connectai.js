// Conectar Inherent OS al Claude o al Codex de cada persona (un link personal, MCP).
// Con eso, desde un chat: «¿qué tengo pendiente hoy?», «arma una cotización para NAO», «crea el proyecto».
import { html, mount, api, toast, drawer, closeDrawer, LOGO, $ } from './core.js';

export const dismissed = () => { try { return localStorage.getItem('ai.connect.off') === '1'; } catch { return false; } };
export const dismiss = () => { try { localStorage.setItem('ai.connect.off', '1'); } catch {} };

// La «noti»: una tarjeta con los logos, mientras la persona no se haya conectado.
export const connectNotice = (me) => (me.mcp || dismissed() || me.role === 'client' ? '' : html`<div class="ainoti"><span class="lg2">${LOGO.claude}</span><span class="lg2">${LOGO.codex}</span>
  <div class="grow"><b style="font-weight:500">Habla con Inherent OS desde Claude o Codex</b><div class="mut sm">Pregúntale tus pendientes, pídele una cotización o que arme un proyecto, desde un chat.</div></div>
  <button class="btn" data-ai="open">Conectar</button><button class="sm mut" data-ai="off" title="Ahora no">✕</button></div>`);
export function hookNotice(root, me, after) {
  root.addEventListener('click', (e) => { const t = e.target.closest('[data-ai]'); if (!t) return; if (t.dataset.ai === 'off') { dismiss(); t.closest('.ainoti')?.remove(); } else openConnect(me, after); });
}

export function openConnect(me, after) {
  let url = null, tab = 'claude';
  const steps = () => (!url ? '' : tab === 'claude' ? html`<ol class="sm aisteps"><li>En Claude (web o app): <b>Configuración → Conectores → Agregar conector personalizado</b>.</li><li>Nombre: <code>Inherent OS</code></li><li>URL: pega tu link (arriba).</li><li>Listo. En un chat nuevo, activa «Inherent OS» y pregúntale: <i>«¿qué tengo pendiente hoy?»</i></li></ol>`
    : tab === 'code' ? html`<div class="sm" style="margin-bottom:6px">En tu terminal, una sola vez:</div><pre class="aicode">claude mcp add --transport http inherent-os ${url}</pre>`
    : html`<div class="sm" style="margin-bottom:6px">Agrega esto a <code>~/.codex/config.toml</code>:</div><pre class="aicode">[mcp_servers.inherent-os]
url = "${url}"</pre>`);
  const draw = () => drawer(html`<div class="row"><span class="lg2">${LOGO.claude}</span><span class="lg2">${LOGO.codex}</span><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
    <h2>Conectar con Claude o Codex</h2>
    <p class="mut">Tu link personal: Claude actúa como <b>tú</b> y solo ve y hace lo que tu perfil permite. Es para consultas y cosas puntuales: tus pendientes, una cotización, armar un proyecto, una idea de contenido.</p>
    ${url ? html`<div class="aiurl"><code>${url}</code><button class="btn xs" data-act="copy">Copiar</button></div><div class="mut sm" style="margin-top:6px">🔒 Es como una contraseña: no lo compartas. Si se filtra, genera otro y el anterior deja de servir.</div>
      <div class="tabs" style="margin:16px 0 10px">${[['claude', 'Claude (web y app)'], ['code', 'Claude Code'], ['codex', 'Codex']].map(([k, l]) => html`<button class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</div>${steps()}`
      : html`<button class="btn" data-act="gen" style="margin-top:12px">${me.mcp ? 'Generar un link nuevo' : 'Generar mi link'}</button>${me.mcp ? html`<div class="mut sm" style="margin-top:8px">Ya tienes uno conectado. Uno nuevo reemplaza al anterior.</div>` : ''}`}
    ${me.mcp || url ? html`<div style="margin-top:22px"><button class="btn ghost xs" data-act="revoke">Desconectar (revocar mi link)</button></div>` : ''}`, {
    gen: async () => { try { url = (await api('me/mcp', { method: 'POST' })).url; me.mcp = true; draw(); after?.(); } catch (e) { toast(e.message, true); } },
    copy: async () => { try { await navigator.clipboard.writeText(url); toast('Link copiado ✅'); } catch { toast('Selecciona y copia el link', true); } },
    tab: (t) => { tab = t.dataset.t; draw(); },
    revoke: async () => { try { await api('me/mcp', { method: 'DELETE' }); me.mcp = false; url = null; toast('Link revocado'); closeDrawer(); after?.(); } catch (e) { toast(e.message, true); } },
  });
  draw();
}
