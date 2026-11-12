// Vistas nativas del workspace Code: misma sesión y pase del Chat del OS.
// Replica el flujo de Cambios, Archivos y Terminal de code-os/ui sin montar otra app.
import { html, mount, toast } from '../core.js';
import { lineasDiff, mensajeComentarios } from './code-panel-puro.js';
import { sesionCode, cambios, archivos, leerArchivo, guardarArchivo, fusionarCode, terminalCode } from '../chat-code.js';

const VISTAS = [['cambios', 'Cambios'], ['archivos', 'Archivos'], ['terminal', 'Terminal'], ['vista', 'Vista previa']];
const fecha = (s) => String(s || '').slice(0, 120);
const hoja = (s) => String(s || '').slice(0, 100_000);
const codigo = (s) => String(s || '').replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '').slice(-100_000);


const listaArchivos = (ns) => html`<ul class="cp-files">${(Array.isArray(ns) ? ns : []).map((n) => html`<li>${n.tipo === 'carpeta' ? html`<details open><summary>${n.nombre || n.ruta}</summary>${listaArchivos(n.hijos)}</details>` : html`<button type="button" data-cp="abrir" data-ruta="${n.ruta}">${n.nombre || n.ruta}</button>`}</li>`)}</ul>`;
const nav = (actual) => html`<nav class="tabs mini" aria-label="Vistas de Código">${VISTAS.map(([id, nombre]) => html`<button type="button" data-cp="tab" data-v="${id}" aria-current="${actual === id ? 'page' : 'false'}">${nombre}</button>`)}</nav>`;
const vacio = (titulo, nota) => html`<div class="cp-empty"><b>${titulo}</b><p>${nota}</p></div>`;

export async function pintarCodePanel(box, { email, idOs, estado, alChat, alive, aislada = false }) {
  const s = estado, gen = (s.gen = (s.gen || 0) + 1);
  if (s.ws) { s.ws.close(); s.ws = null; }
  const vivo = () => gen === s.gen && alive() && box.isConnected;
  const sesion = idOs ? sesionCode(email, idOs) : '';
  const cab = html`<div class="cp-head"><span class="cp-k">Inherent OS / Code</span><b>${sesion ? 'Proyecto conectado' : 'Sin sesión de Code'}</b></div>${nav(s.vista || 'cambios')}`;
  const pintar = (cuerpo) => { if (vivo()) mount(box, html`<div class="cp">${cab}<div class="cp-body">${cuerpo}</div></div>`); };
  box.onclick = async (e) => {
    const b = e.target.closest('[data-cp]'); if (!b || !box.contains(b)) return;
    const a = b.dataset.cp;
    if (a === 'tab') { s.vista = b.dataset.v; s.ruta = ''; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (a === 'recargar') return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada });
    if (a === 'abrir') { s.ruta = b.dataset.ruta; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (a === 'volver') { s.ruta = ''; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (a === 'mencionar') return alChat(`@${s.ruta} `);
    if (a === 'guardar') { const t = box.querySelector('.cp-editor')?.value; if (t === undefined || t === s.original) return; try { await guardarArchivo(email, idOs, s.ruta, t); s.original = t; toast('Archivo guardado'); } catch (err) { toast(err.message, true); } return; }
    if (a === 'comentar') { if (!b.dataset.linea || b.disabled) return; s.comentando = { ruta:b.dataset.ruta, linea:Number(b.dataset.linea), lado:b.dataset.lado }; const form = document.createElement('form'); form.className = 'cp-comment-form'; form.innerHTML = '<textarea aria-label="Comentario de línea" maxlength="1000" placeholder="¿Qué debería cambiar aquí?"></textarea><div><button type="button" data-cp="cancelar">Cancelar</button><button type="submit">Agregar</button></div>'; box.querySelector('.cp-comment-form')?.remove(); b.after(form); form.querySelector('textarea').focus(); return; }
    if (a === 'cancelar') { box.querySelector('.cp-comment-form')?.remove(); return; }
    if (a === 'quitar') { s.comentarios.splice(Number(b.dataset.i), 1); return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (a === 'enviar-comentarios') { alChat(mensajeComentarios(s.comentarios)); s.comentarios = []; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (a === 'revisar') return alChat('Revisa los cambios de esta sesión: busca errores, riesgos y lo que falte probar. No edites nada; dame la lista.');
    if (a === 'fusionar') { if (!aislada) return; b.disabled = true; try { await fusionarCode(email, idOs); toast('Cambios fusionados'); return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); } catch (err) { toast(err.message, true); b.disabled = false; } }
  };
  box.onsubmit = (e) => {
    const f = e.target; if (!box.contains(f)) return; e.preventDefault();
    if (f.classList.contains('cp-comment-form')) { const texto = f.querySelector('textarea')?.value.trim(); if (!texto || !s.comentando) return; (s.comentarios ||= []).push({ ...s.comentando, texto }); s.comentando = null; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
    if (f.dataset.cpForm === 'terminal') { const input = f.querySelector('input'), c = input?.value; if (c && s.ws?.readyState === WebSocket.OPEN) { s.ws.send(c + '\n'); input.value = ''; } return; }
    if (f.dataset.cpForm === 'vista') { const valor = f.querySelector('input')?.value.trim(); if (!/^https?:\/\//i.test(valor)) return toast('Usa una URL http o https', true); s.preview = valor; return pintarCodePanel(box, { email, idOs, estado:s, alChat, alive, aislada }); }
  };
  if (!sesion) pintar(vacio('Primero habla con Code', 'Envía un mensaje en modo Code para crear la sesión. Aquí aparecerán sus cambios, archivos y terminal.'));
  else if (s.vista === 'archivos') {
    pintar(vacio('Leyendo archivos…', 'El árbol viene de la sesión del servidor.'));
    try { const xs = await archivos(email, idOs); if (vivo()) pintar(s.ruta ? html`<div class="cp-filebar"><button type="button" data-cp="volver">← Archivos</button><code>${s.ruta}</code><button type="button" data-cp="mencionar">@</button><button type="button" data-cp="guardar">Guardar</button></div><div class="cp-loading">Abriendo archivo…</div>` : html`<div class="cp-toolbar"><span>Carpeta del proyecto</span><button type="button" data-cp="recargar">Actualizar</button></div>${xs?.length ? listaArchivos(xs) : vacio('Carpeta vacía', 'Esta sesión todavía no tiene archivos visibles.')}`);
      if (s.ruta && vivo()) { s.original = hoja(await leerArchivo(email, idOs, s.ruta)); if (vivo()) pintar(html`<div class="cp-filebar"><button type="button" data-cp="volver">← Archivos</button><code>${s.ruta}</code><button type="button" data-cp="mencionar">@</button><button type="button" data-cp="guardar">Guardar</button></div><textarea class="cp-editor" aria-label="Editor de ${s.ruta}" spellcheck="false">${s.original}</textarea>`); }
    } catch (e) { pintar(vacio('No se pudieron abrir los archivos', e.message)); }
  } else if (s.vista === 'terminal') {
    pintar(html`<div class="cp-terminal"><pre aria-label="Salida de Terminal">${s.terminalOutput || 'Conectando con el proyecto…'}</pre><form data-cp-form="terminal"><label class="sr-only" for="cp-comando">Comando</label><span>›</span><input id="cp-comando" autocomplete="off" spellcheck="false" placeholder="Escribe un comando y Enter"><button type="submit">Enviar</button></form></div>`);
    try {
      const url = await terminalCode(email, idOs); if (!vivo()) return;
      const ws = new WebSocket(url); ws.binaryType = 'arraybuffer'; s.ws = ws;
      ws.onopen = () => { if (vivo()) { s.terminalOutput = 'Terminal conectada.\n'; const pre = box.querySelector('.cp-terminal pre'); if (pre) pre.textContent = s.terminalOutput; } };
      ws.onmessage = (e) => { if (!vivo()) return; const chunk = typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data); s.terminalOutput = codigo((s.terminalOutput || '') + chunk); const pre = box.querySelector('.cp-terminal pre'); if (pre) { pre.textContent = s.terminalOutput; pre.scrollTop = pre.scrollHeight; } };
      ws.onerror = () => { if (vivo()) { const pre = box.querySelector('.cp-terminal pre'); if (pre) pre.textContent += '\nNo se pudo conectar la terminal.'; } };
      ws.onclose = () => { if (vivo()) { const pre = box.querySelector('.cp-terminal pre'); if (pre) pre.textContent += '\nTerminal desconectada.'; } };
    } catch (e) { pintar(vacio('Terminal no disponible', e.message)); }
  } else if (s.vista === 'vista') {
    pintar(html`<form class="cp-preview-form" data-cp-form="vista"><input type="url" aria-label="Dirección de vista previa" placeholder="https://staging…" value="${s.preview || ''}" required><button type="submit">Abrir</button></form>${s.preview ? html`<div class="cp-preview-link"><span>Si el sitio no permite incrustarse,</span> <a href="${s.preview}" target="_blank" rel="noopener noreferrer">ábrelo en otra pestaña ↗</a></div><iframe class="cp-preview" title="Vista previa" src="${s.preview}" loading="lazy" referrerpolicy="no-referrer"></iframe>` : vacio('Vista previa', 'Abre una URL de staging o de un deployment para comprobar el resultado.')}`);
  } else {
    s.vista = 'cambios'; pintar(vacio('Leyendo cambios…', 'El diff viene de la sesión del servidor.'));
    try { const ds = await cambios(email, idOs); if (!vivo()) return;
      const mas = ds.reduce((n, d) => n + (Number(d.mas) || 0), 0), menos = ds.reduce((n, d) => n + (Number(d.menos) || 0), 0);
      pintar(ds.length ? html`<div class="cp-toolbar"><span>${ds.length} archivos · <em>+${mas}</em> <i>−${menos}</i></span><button type="button" data-cp="revisar">Revisar</button><button type="button" data-cp="fusionar" ${aislada ? '' : 'disabled'} title="${aislada ? 'Fusionar sesión aislada' : 'Solo una sesión aislada se puede fusionar'}">Fusionar</button><button type="button" data-cp="recargar">↻</button></div>
        <p class="cp-hint">Toca una línea para comentar. Los comentarios se envían juntos al Chat.</p>
        ${ds.map((d) => html`<section class="cp-diff"><details open><summary><code>${fecha(d.ruta)}</code><span>+${d.mas} −${d.menos}</span></summary><div class="cp-diff-lines">${lineasDiff(d.diff).map((l) => html`<button type="button" class="cp-line ${l.tipo}" data-cp="comentar" data-ruta="${d.ruta}" data-linea="${l.linea}" data-lado="${l.lado}" ${l.linea ? '' : 'disabled'}><span>${l.linea || ''}</span><code>${l.texto}</code></button>`)}</div></details></section>`)}
        ${s.comentarios?.length ? html`<div class="cp-comments"><b>${s.comentarios.length} comentarios listos</b>${s.comentarios.map((c, i) => html`<p><code>${c.ruta}:${c.linea}</code> ${c.texto}<button type="button" data-cp="quitar" data-i="${i}" aria-label="Quitar comentario">×</button></p>`)}<button type="button" data-cp="enviar-comentarios">Enviar comentarios al Chat</button></div>` : ''}` : vacio('Sin cambios', 'Code todavía no ha modificado archivos en esta sesión.'));
    } catch (e) { pintar(vacio('No se pudieron leer los cambios', e.message)); }
  }

}
