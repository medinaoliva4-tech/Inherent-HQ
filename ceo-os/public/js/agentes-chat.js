// Chat de trabajo (PLAN-GATEWAY F4 · §8): un trabajo del Agent Area se lleva de punta a punta desde una conversación guardada.
//   Agent  (cabecera): qué agente, con qué modelo del servidor, qué conexiones y en qué etapa va.
//   Hilo   : tus mensajes y los del agente, y entre ellos lo que pasa en el trabajo (etapa enviada, resultado listo con su
//            tarjeta para aprobar o pedir ajuste, aprobada…). Mientras el servidor trabaja una etapa, su actividad en vivo.
//   Queue  : las etapas en cola, la activa marcada; se ejecutan y se aprueban desde ahí.
//   Sources: las fuentes que usó cada etapa, con verificar / quitar.
//   File tree: los inputs del equipo y lo que el trabajo produce (un .md por etapa).
// Todo corre en el servidor (D13): la conversación vive en `chat_sesiones` (oculta, una por persona y trabajo) y las etapas
// en `agent_runs`. La vista por etapas (las tres columnas, con las otras IAs) sigue en …/trabajos/<id>/etapas.
import { html, raw, mount, ico, skel, toast, api, ask, md, esc, drawer, closeDrawer } from './core.js';
import { activa, completo, progreso, puede, enServidor, leerOutput, CONEXIONES, ESTADOS } from './agentes-flujos.js';
import { idChatTrabajo, sistemaTrabajo, hilo, fuentes, archivos } from './agentes-chat-datos.js';
import { crearSesionServidor, turnoServidor, decidirPropuesta } from './chat-gateway.js';
import { nombrePaso } from './ia-pasos.js';
import { rutaAgente, rutaTrabajo } from './agentes-ui.js';

const enc = encodeURIComponent;
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '');
const quien = (e) => String(e || '').split('@')[0];
const PREF = ['deepseek-v4-flash', 'deepseek-v4-pro'];
const prefModelo = (me) => `os.agentes.chat.modelo.${me.email}`;
const leerPref = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const ponerPref = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const ICO_EST = { aprobada: 'check', revision: 'file-text', en_cola: 'loader-circle', trabajando: 'loader-circle', ajuste: 'rotate-cw', pendiente: '' };

export async function pintarChatRun(el, me, id, alive) {
  mount(el, skel('pagina'));
  let run, rol, gw, mensajes = [], turno = null, escribiendo = null, ctrl = null, enviando = false;
  try { [{ run, rol }, gw] = await Promise.all([api('agentes/runs/' + enc(id)), api('agentes/gateway').catch(() => null)]); }
  catch (e) { if (alive()) mount(el, html`<div class="empty card">${e.message}<a class="btn ghost sm" href="#/ai/agentes">Volver</a></div>`); return; }
  if (!alive()) return;
  const sid = idChatTrabajo(run, me.email);
  let existe = false;
  try { const j = await api('chat/sesiones/' + enc(sid)); mensajes = (j.messages || []).filter((m) => m.content || m.propuestas?.length); turno = j.turno; existe = true; }
  catch (e) { if (e.status !== 404) toast(e.message, true); }
  if (!alive()) return;

  const modelos = gw?.en_linea ? [...gw.modelos].sort((a, b) => (PREF.indexOf(a) + 1 || 9) - (PREF.indexOf(b) + 1 || 9)) : [];
  let modelo = leerPref(prefModelo(me));
  if (!modelos.includes(modelo)) modelo = modelos[0] || '';

  // ---------- Piezas ----------
  const cabecera = () => {
    const n = activa(run), e = run.etapas[n], pr = progreso(run);
    const con = [...new Set(run.etapas.flatMap((x) => x.herramientas || []))].map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || h);
    return html`<header class="wc-agent wc-glass">
      <span class="wc-av" aria-hidden="true">${(run.flujo.agente || run.flujo.nombre || '?').slice(0, 1)}</span>
      <div class="wc-agent-t"><nav class="wc-crumb"><a href="#/ai/agentes">Agentes</a>${ico('chevron-right', 11)}<a href="${rutaAgente(run.flujo.id)}">${run.flujo.nombre}</a></nav>
        <h1>${run.titulo}</h1>
        <p class="wc-meta"><span>${run.cliente ? run.cliente_nombre || run.cliente : 'Inherent'}</span>
          <span class="wc-chip ${completo(run) ? 'ok' : e.estado}">${completo(run) ? 'Completo' : `Etapa ${n + 1}/${run.etapas.length} · ${e.nombre}`}</span>
          ${con.length ? html`<span class="wc-con">${ico('puzzle', 12)} ${con.join(' · ')}</span>` : ''}</p></div>
      <div class="wc-agent-a">
        <label class="wc-model"><span>Modelo</span>${modelos.length ? html`<select data-ch="modelo" aria-label="Modelo del servidor">${modelos.map((m) => html`<option value="${m}" ${m === modelo ? raw('selected') : ''}>${m}</option>`)}</select>` : html`<b class="wc-off">Servidor fuera de línea</b>`}</label>
        <span class="wc-prog" title="${pr.hechas} de ${pr.total} etapas aprobadas"><i style="width:${pr.pct}%"></i></span>
        <a class="btn ghost sm" href="${rutaTrabajo(run.flujo.id, run.id)}/etapas">${ico('kanban', 13)} Vista por etapas</a>
      </div></header>`;
  };

  const accionEtapa = (n) => {
    const e = run.etapas[n];
    if (n !== activa(run) || run.archivado || completo(run)) return '';
    if (e.estado === 'revision') return html`<button class="btn sm ag-dark" data-act="aprobar" data-n="${n}" ${puede(run, n, 'aprobar', { rol }) ? raw(`disabled title="${esc(puede(run, n, 'aprobar', { rol }))}"`) : ''}>${ico('check', 12)} Aprobar</button>`;
    if (e.estado === 'en_cola') return html`<button class="btn ghost sm" data-act="cancelar">Sacar de la cola</button>`;
    if (['pendiente', 'ajuste'].includes(e.estado)) return html`<button class="btn sm" data-act="ejecutar" ${run.pausado || !modelo ? raw(`disabled title="${run.pausado ? 'El agente está en pausa' : 'El servidor no está en línea'}"`) : ''}>${ico(e.estado === 'ajuste' ? 'rotate-cw' : 'play', 12)} ${e.estado === 'ajuste' ? 'Re-ejecutar' : 'Ejecutar'}</button>`;
    return '';
  };
  const cola = () => {
    const act = activa(run);
    return html`<section class="wc-panel wc-glass" aria-label="Cola de etapas"><h2>${ico('list', 13)} Cola</h2>
      <ol class="wc-queue">${run.etapas.map((e, n) => html`<li class="${e.estado} ${n === act && !completo(run) ? 'act' : ''}">
        <span class="wc-q-dot">${ICO_EST[e.estado] ? ico(ICO_EST[e.estado], 11) : String(n + 1)}</span>
        <div class="wc-q-b"><b>${e.nombre}${e.gate ? ' 🚦' : ''}</b><span>${ESTADOS[e.estado] || e.estado}${e.estado === 'aprobada' && e.aprobada_por ? ` · ${quien(e.aprobada_por)}` : ''}</span>${accionEtapa(n)}</div></li>`)}</ol>
      ${run.pausado ? html`<p class="wc-note">${ico('pause', 12)} El agente está en pausa.</p>` : ''}</section>`;
  };
  const panelFuentes = () => {
    const gs = fuentes(run);
    return html`<section class="wc-panel wc-glass" aria-label="Fuentes"><h2>${ico('globe', 13)} Fuentes <span class="wc-n">${gs.reduce((s, g) => s + g.xs.length, 0)}</span></h2>
      ${gs.length ? gs.map((g) => html`<div class="wc-src-g"><span class="wc-src-h">${g.n + 1} · ${g.nombre}</span>${g.xs.map((x) => html`<div class="wc-src ${x.verificada ? 'ok' : ''}">
        <div class="wc-src-b"><b>${x.titulo}</b>${/^https?:/.test(x.url || '') ? html`<a href="${x.url}" target="_blank" rel="noreferrer">${x.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 44)}</a>` : x.url ? html`<code>${x.url}</code>` : ''}</div>
        ${run.archivado ? '' : html`<span class="wc-src-a"><button type="button" class="wc-ic ${x.verificada ? 'on' : ''}" data-act="verificar" data-id="${x.id}" data-n="${g.n}" title="${x.verificada ? 'Verificada · quitar la marca' : 'Marcar como verificada'}" aria-pressed="${x.verificada ? 'true' : 'false'}">${ico('check', 12)}</button><button type="button" class="wc-ic" data-act="quitar-fuente" data-id="${x.id}" data-n="${g.n}" title="Quitar esta fuente" aria-label="Quitar">${ico('x', 12)}</button></span>`}</div>`)}</div>`)
        : html`<p class="wc-empty">Aún no hay fuentes. Las que use el agente aparecen aquí para verificarlas.</p>`}</section>`;
  };
  const arbol = () => html`<section class="wc-panel wc-glass" aria-label="Archivos"><h2>${ico('folder', 13)} Archivos ${run.archivado ? '' : html`<button type="button" class="wc-ic wc-h-a" data-act="input" title="Añadir un input" aria-label="Añadir un input">${ico('plus', 13)}</button>`}</h2>
    <ul class="wc-tree">${archivos(run).map((c) => html`<li><details open><summary>${ico('folder', 13)} ${c.carpeta} <span class="wc-n">${c.items.length}</span></summary>
      <ul>${c.items.length ? c.items.map((x) => (c.carpeta === 'Producido'
        ? html`<li><button type="button" data-act="abrir" data-n="${x.n}">${ico('file-text', 12)} <span>${x.nombre}</span><i class="wc-dot ${x.estado}" title="${ESTADOS[x.estado] || ''}"></i></button></li>`
        : html`<li><button type="button" data-act="abrir-input" data-id="${x.id}">${ico(x.tipo === 'link' ? 'link' : 'file-text', 12)} <span>${x.nombre}</span></button></li>`)) : html`<li class="wc-empty">Vacío</li>`}</ul></details></li>`)}</ul></section>`;

  // ---------- El hilo ----------
  const pasos = (m) => (m.pasos?.length ? html`<div class="wc-steps">${m.pasos.slice(-8).map((p) => html`<span>${ico(/web|buscar/.test(p.nombre) ? 'search' : 'puzzle', 11)} ${nombrePaso(p.nombre)}${p.detalle && p.detalle.length < 60 ? html` · <i>${p.detalle}</i>` : ''}</span>`)}</div>` : '');
  const propuestas = (m) => (m.propuestas || []).map((p) => html`<div class="wc-prop ${p.estado}"><div><b>${p.titulo || p.tool}</b><span>${p.estado === 'pendiente' ? 'Propuesta: espera tu OK' : p.estado === 'aprobada' ? 'Aprobada y hecha en el OS' : p.estado === 'rechazada' ? 'Rechazada' : `No se pudo: ${p.error || ''}`}</span></div>
    ${p.estado === 'pendiente' ? html`<span class="wc-prop-a"><button class="btn sm" data-act="prop" data-pid="${p.id}" data-d="aprobar">Aprobar</button><button class="btn ghost sm" data-act="prop" data-pid="${p.id}" data-d="rechazar">Rechazar</button></span>` : ''}</div>`);
  const mensaje = (m, i) => (m.role === 'user'
    ? html`<div class="wc-msg yo"><div class="wc-bub">${m.content}</div><span class="wc-t">${hora(m.at)}</span></div>`
    : html`<div class="wc-msg ia"><span class="wc-av sm" aria-hidden="true">${(run.flujo.agente || run.flujo.nombre || '?').slice(0, 1)}</span><div class="wc-ia-b">${pasos(m)}<div class="ag-md">${raw(md(m.content || ''))}</div>${propuestas(m)}
        ${m.content && !m.parcial && run.etapas[activa(run)]?.estado === 'revision' ? html`<div class="wc-msg-a"><button type="button" class="btn ghost xs" data-act="como-ajuste" data-i="${i}">${ico('rotate-cw', 11)} Pedirlo como ajuste</button></div>` : ''}
        <span class="wc-t">${m.modelo || ''} ${hora(m.at)}</span></div></div>`);
  const tarjetaResultado = (n) => {
    const e = run.etapas[n], o = leerOutput(e.entrega || e.output, e.nombre), hip = (e.campos || []).filter((c) => c.estado !== 'evidencia').length;
    const enRev = e.estado === 'revision' && n === activa(run);
    return html`<article class="wc-res wc-glass ${e.estado}"><header><span class="wc-res-k">Etapa ${n + 1} · ${e.nombre}</span><b>${o.titulo}</b>
        <span class="wc-chip ${e.confianza >= 70 ? 'ok' : 'revision'}">${e.confianza ? `${e.confianza}% confianza` : 'Sin evidencia'}</span>${e.estado === 'aprobada' ? html`<span class="wc-chip ok">${ico('check', 11)} Aprobada</span>` : ''}</header>
      <div class="ag-md wc-res-md">${raw(md(String(e.salida || '').slice(0, 1600)))}</div>
      ${hip || e.faltantes?.length ? html`<p class="wc-res-n">${hip ? `${hip} de ${e.campos.length} campos son hipótesis. ` : ''}${e.faltantes?.length ? `Faltó evidencia: ${e.faltantes.slice(0, 3).join('; ')}` : ''}</p>` : ''}
      <footer><button type="button" class="btn ghost sm" data-act="abrir" data-n="${n}">${ico('file-text', 12)} Ver completo</button>
        ${enRev ? html`<button type="button" class="btn ghost sm" data-act="ajuste" data-n="${n}">${ico('rotate-cw', 12)} Pedir ajuste</button>${accionEtapa(n)}` : ''}</footer></article>`;
  };
  const evento = (x) => {
    if (x.ultimo) return tarjetaResultado(x.etapa);
    const e = run.etapas[x.etapa];
    return html`<div class="wc-ev ${x.h.accion}"><span>${ico(x.h.accion === 'fallo' ? 'triangle-alert' : x.h.accion === 'aprobar' ? 'check' : 'dot', 11)}</span>
      <p><b>${x.titulo}</b>${e ? ` · ${e.nombre}` : ''}${x.h.quien && x.h.quien !== 'gateway' ? ` · ${quien(x.h.quien)}` : ''}${x.h.nota && ['ajuste', 'fallo', 'encolar'].includes(x.h.accion) ? html` <i>«${String(x.h.nota).slice(0, 220)}»</i>` : ''}</p><span class="wc-t">${hora(x.at)}</span></div>`;
  };
  const enVivo = () => {
    const n = activa(run), e = run.etapas[n];
    if (!enServidor(e)) return '';
    const acts = (e.actividades || []).slice(-6);
    return html`<div class="wc-live wc-glass"><header>${ico('loader-circle', 13)} <b>${e.estado === 'en_cola' ? 'En cola en el servidor' : 'El servidor está trabajando la etapa'}</b><span>${e.nombre} · ${e.modelo || ''}</span></header>
      <ol>${acts.map((a) => html`<li class="${a.aviso ? 'warn' : ''}"><b>${a.titulo}</b>${a.detalle ? html` <span>${String(a.detalle).slice(0, 160)}</span>` : ''}</li>`)}</ol>
      <p class="wc-note">Puedes seguir conversando o cerrar esta pantalla: el resultado llega aquí.</p></div>`;
  };
  const vacio = () => html`<div class="wc-hello"><b>¿Por dónde empezamos?</b><p>Pregúntale al agente sobre ${run.etapas[activa(run)]?.nombre || 'el trabajo'}, dale contexto o ejecuta la etapa desde la cola.</p>
    <div class="wc-sug">${[`¿Qué necesitas para «${run.etapas[activa(run)]?.nombre}»?`, '¿Qué falta para cerrar esta etapa?', 'Resume lo aprobado hasta ahora'].map((s) => html`<button type="button" data-act="sugerir" data-t="${s}">${s}</button>`)}</div></div>`;

  const sugerencias = () => {
    const n = activa(run), e = run.etapas[n];
    if (run.archivado || completo(run)) return '';
    if (e.estado === 'revision') return html`<button type="button" data-act="ajuste" data-n="${n}">${ico('rotate-cw', 12)} Pedir ajuste</button>${puede(run, n, 'aprobar', { rol }) ? '' : html`<button type="button" data-act="aprobar" data-n="${n}">${ico('check', 12)} Aprobar ${e.nombre}</button>`}`;
    if (['pendiente', 'ajuste'].includes(e.estado) && modelo && !run.pausado) return html`<button type="button" data-act="ejecutar">${ico('play', 12)} ${e.estado === 'ajuste' ? 'Re-ejecutar' : 'Ejecutar'} ${e.nombre}</button>`;
    return '';
  };

  const pintarHilo = () => {
    const box = el.querySelector('.wc-thread'); if (!box) return;
    const abajo = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const ms = escribiendo?.content ? [...mensajes, escribiendo] : mensajes; // vacío: solo los puntos de «pensando»
    const items = hilo(run, ms);
    mount(box, html`${items.map((x) => (x.tipo === 'msg' ? mensaje(x.m, x.i) : evento(x)))}${items.some((x) => x.tipo === 'msg') || escribiendo ? '' : vacio()}${enVivo()}
      ${escribiendo && !escribiendo.content ? html`<div class="wc-typing" aria-live="polite"><i></i><i></i><i></i> ${escribiendo.nota || 'Pensando…'}</div>` : ''}`);
    if (abajo) box.scrollTop = box.scrollHeight;
  };
  const pintarLados = () => {
    const h = el.querySelector('.wc-head-slot'), r = el.querySelector('.wc-rail'), s = el.querySelector('.wc-quick');
    if (h) mount(h, cabecera()); if (r) mount(r, html`${cola()}${panelFuentes()}${arbol()}`); if (s) mount(s, sugerencias());
  };
  const pinta = () => { pintarLados(); pintarHilo(); const b = el.querySelector('[data-act="enviar"]'); if (b) { b.disabled = enviando || !modelo; b.hidden = enviando; } const d = el.querySelector('[data-act="detener"]'); if (d) d.hidden = !enviando; };

  mount(el, html`<div class="wc">
    <div class="wc-head-slot"></div>
    <div class="wc-body">
      <main class="wc-main wc-glass">
        <div class="wc-thread" role="log" aria-live="polite" aria-label="Conversación del trabajo"></div>
        <form class="wc-composer" data-form="enviar">
          <div class="wc-quick"></div>
          <div class="wc-box"><textarea rows="1" placeholder="${modelos.length ? `Escríbele a ${run.flujo.agente || run.flujo.nombre}…` : 'El servidor está fuera de línea: vuelve en un momento'}" aria-label="Mensaje" ${modelos.length ? '' : raw('disabled')}></textarea>
            <button type="submit" class="wc-send" data-act="enviar" aria-label="Enviar">${ico('arrow-up', 16)}</button><button type="button" class="wc-send stop" data-act="detener" aria-label="Detener" hidden>${ico('square', 13)}</button></div>
        </form>
      </main>
      <aside class="wc-rail" aria-label="El trabajo"></aside>
    </div></div>`);
  const ta = el.querySelector('textarea');
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; });
  ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); enviar(); } });
  pinta();

  // ---------- Acciones ----------
  const recargar = async () => { try { ({ run } = await api('agentes/runs/' + enc(run.id))); } catch {} };
  const guardar = async (ruta, cuerpo, ok) => {
    try { ({ run } = await api(`agentes/runs/${enc(run.id)}/${ruta}`, { method: 'POST', body: cuerpo || {} })); if (ok) toast(ok); return true; }
    catch (e) { toast(e.message, true); if (e.status === 409) await recargar(); return false; }
    finally { if (alive()) pinta(); }
  };

  async function enviar(texto) {
    const t = String(texto ?? ta.value).trim();
    if (!t || enviando || !modelo) return;
    if (!texto) { ta.value = ''; ta.style.height = 'auto'; }
    enviando = true;
    await recargar(); // el contexto va al día con la base: lo que aprobó otro, lo que terminó el servidor
    mensajes = [...mensajes, { role: 'user', content: t, at: new Date().toISOString() }];
    escribiendo = { role: 'assistant', content: '', nota: '', pasos: [] };
    pinta();
    ctrl = new AbortController();
    try {
      if (!existe) { await crearSesionServidor({ id: sid, titulo: `${run.flujo.nombre} · ${run.titulo}`.slice(0, 120), oculto: true }).catch((e) => { if (e.status !== 409) throw e; }); existe = true; }
      await turnoServidor(sid, { mensaje: t, sistema: sistemaTrabajo(run, { nombre: me.name || quien(me.email) }), modelo: { provider: 'servidor', model: modelo }, signal: ctrl.signal, on: {
        delta: (x) => { escribiendo = { ...escribiendo, content: x, nota: '' }; if (alive()) pintarHilo(); },
        tool: (p) => { escribiendo = { ...escribiendo, nota: nombrePaso(p.nombre), pasos: [...escribiendo.pasos, p].slice(-12) }; if (alive()) pintarHilo(); },
        nota: (n) => { escribiendo = { ...escribiendo, nota: n }; if (alive()) pintarHilo(); },
      } });
    } catch (e) { if (e.name !== 'AbortError') toast(e.status === 503 ? 'El servidor no está en línea ahora. Intenta en un momento.' : e.message, true); }
    enviando = false; ctrl = null; escribiendo = null;
    await releerChat();
    if (alive()) pinta();
  }
  async function releerChat() {
    try { const j = await api('chat/sesiones/' + enc(sid)); mensajes = (j.messages || []).filter((m) => m.content || m.propuestas?.length); turno = j.turno; } catch {}
  }

  // Mientras el servidor trabaja una etapa, se relee el trabajo (la actividad y el resultado llegan de la base).
  let vigilando = false;
  async function vigilar() {
    if (vigilando) return; vigilando = true;
    try {
      while (alive() && enServidor(run.etapas[activa(run)])) {
        await new Promise((r) => setTimeout(r, 2500));
        if (!alive()) return;
        const antes = run.etapas[activa(run)];
        await recargar();
        const ahora = run.etapas.find((x) => x.id === antes.id);
        if (ahora?.estado === 'revision') toast('Resultado listo: revísalo en el chat');
        else if (ahora && ['pendiente', 'ajuste'].includes(ahora.estado) && ahora.actividades?.at(-1)?.aviso) toast(ahora.actividades.at(-1).detalle || 'Falló en el servidor', true);
        if (alive()) pinta();
      }
    } finally { vigilando = false; }
  }
  const ejecutar = async () => { if (await guardar(`etapa/${activa(run)}/encolar`, { modelo }, 'Etapa enviada al servidor')) vigilar(); };
  async function pedirAjuste(n, nota) {
    const v = nota ? { nota } : await ask('Pedir ajuste', [{ k: 'nota', l: '¿Qué tiene que cambiar?', t: 'textarea', req: true, v: ta.value.trim() }], 'Pedir ajuste y re-ejecutar');
    if (!v) return;
    if (!(await guardar(`etapa/${n}/ajuste`, { nota: String(v.nota).slice(0, 1000) }, 'Ajuste pedido'))) return;
    if (!nota && ta.value.trim() === String(v.nota).trim()) ta.value = '';
    if (modelo && !run.pausado) await ejecutar();
  }
  function abrirEtapa(n) {
    const e = run.etapas[n], o = leerOutput(e.entrega || e.output, e.nombre), noC = puede(run, n, 'corregir', { rol });
    drawer(html`<div class="ag-rev"><span class="lbl">Etapa ${n + 1} · ${e.nombre}</span><h1>${o.titulo}</h1>
      <p class="sm mut">${ESTADOS[e.estado] || e.estado}${e.confianza ? ` · confianza ${e.confianza}%` : ''}${e.modelo ? ` · ${e.modelo}` : ''}</p>
      <div class="ag-md card">${raw(md(e.salida || ''))}</div>
      <div class="ag-rev-a"><button class="btn ghost" data-act="descargar">${ico('download', 14)} Descargar .md</button>${noC ? '' : html`<button class="btn ghost" data-act="corregir">${ico('pencil', 14)} Corregir</button>`}</div></div>`, {
      descargar: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([e.salida || ''], { type: 'text/markdown' })); a.download = archivos(run)[1].items.find((x) => x.n === n)?.nombre || 'etapa.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
      corregir: async () => { closeDrawer(); const v = await ask('Corregir resultado', [{ k: 'salida', l: 'Resultado (markdown)', t: 'textarea', v: e.salida, req: true }, { k: 'nota', l: 'Qué corregiste' }], 'Guardar corrección'); if (v) await guardar(`etapa/${n}/corregir`, v, 'Corrección guardada'); },
    }, { title: o.titulo });
  }
  function abrirInput(iid) {
    const x = (run.inputs || []).find((y) => y.id === iid); if (!x) return;
    drawer(html`<div class="ag-rev"><span class="lbl">Input · ${x.interna ? 'fuente interna' : 'fuente externa'}</span><h1>${x.titulo}</h1>${x.meta ? html`<p class="sm mut">${x.meta}</p>` : ''}
      ${x.url ? html`<p><a href="${x.url}" target="_blank" rel="noreferrer">${x.url}</a></p>` : ''}${x.texto ? html`<pre class="wc-pre">${x.texto}</pre>` : ''}
      ${run.archivado ? '' : html`<div class="ag-rev-a"><button class="btn ghost" data-act="quitar">Quitar input</button></div>`}</div>`,
    { quitar: async () => { closeDrawer(); await guardar('inputs', { id: x.id, archivado: true }, 'Input quitado'); } }, { title: 'Input' });
  }
  async function agregarInput() {
    const v = await ask('Añadir input', [
      { k: 'tipo', l: 'Qué es', t: 'select', opts: [['texto', 'Texto pegado'], ['link', 'Enlace']], v: 'texto' },
      { k: 'titulo', l: 'Título', ph: 'Ej.: Entrevista del fundador' },
      { k: 'url', l: 'Enlace (si es enlace)', ph: 'https://…' },
      { k: 'texto', l: 'Contenido (si es texto)', t: 'textarea' },
      { k: 'interna', l: 'Origen', t: 'select', opts: [['1', 'Fuente interna (del cliente o de Inherent)'], ['', 'Fuente externa']], v: '1' },
    ], 'Añadir');
    if (v) await guardar('inputs', { ...v, interna: Boolean(v.interna) }, 'Input agregado');
  }

  const mapa = {
    ejecutar,
    cancelar: () => guardar(`etapa/${activa(run)}/cancelar`, {}, 'Etapa fuera de la cola'),
    aprobar: (b) => guardar(`etapa/${Number(b.dataset.n)}/aprobar`, {}, 'Etapa aprobada'),
    ajuste: (b) => pedirAjuste(Number(b.dataset.n)),
    'como-ajuste': (b) => { const m = mensajes[Number(b.dataset.i)]; if (m?.content) pedirAjuste(activa(run), m.content); },
    abrir: (b) => abrirEtapa(Number(b.dataset.n)),
    'abrir-input': (b) => abrirInput(b.dataset.id),
    input: agregarInput,
    verificar: (b) => { const x = (run.evidencia || []).find((y) => y.id === b.dataset.id && y.etapa === Number(b.dataset.n)); return guardar('evidencia', { id: b.dataset.id, etapa: Number(b.dataset.n), verificada: !x?.verificada }); },
    'quitar-fuente': (b) => guardar('evidencia', { id: b.dataset.id, etapa: Number(b.dataset.n), quitada: true }, 'Fuente quitada'),
    prop: async (b) => { try { await decidirPropuesta(sid, b.dataset.pid, b.dataset.d); await releerChat(); toast(b.dataset.d === 'aprobar' ? 'Hecho en el OS' : 'Propuesta rechazada'); } catch (e) { toast(e.message, true); } if (alive()) pinta(); },
    sugerir: (b) => enviar(b.dataset.t),
    enviar: () => enviar(),
    detener: () => ctrl?.abort(),
  };
  el.addEventListener('click', (ev) => { const t = ev.target.closest('[data-act]'); if (!t || !el.contains(t)) return; if (t.dataset.act === 'enviar') ev.preventDefault(); mapa[t.dataset.act]?.(t, ev); });
  el.addEventListener('submit', (ev) => { ev.preventDefault(); enviar(); });
  el.addEventListener('change', (ev) => { if (ev.target.dataset.ch === 'modelo') { modelo = ev.target.value; ponerPref(prefModelo(me), modelo); } });

  if (enServidor(run.etapas[activa(run)])) vigilar();
  // Si quedó una respuesta a medias (cerraste la pantalla mientras respondía), se sigue leyendo hasta que termine.
  if (['en_cola', 'trabajando'].includes(turno?.estado)) (async () => { while (alive() && ['en_cola', 'trabajando'].includes(turno?.estado)) { await new Promise((r) => setTimeout(r, 1200)); await releerChat(); if (alive()) pintarHilo(); } })();
}
