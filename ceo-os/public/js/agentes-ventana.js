// F4.5 · La ventana de un agente (PLAN-GATEWAY §20.5, §20.6, §20.8): la pestaña de un trabajo en el panel del Chat.
//   cabecera (agente, etapa x/y, modelo, avance) · la cola de etapas · EL DOCUMENTO del trabajo, que se va armando etapa por
//   etapa con sus fuentes enlazadas adentro · las fuentes (verificar / quitar) · los archivos (inputs y producido).
// Las preguntas y las tarjetas viven en el hilo del Chat, no aquí. Aprobar se hace abriendo el documento (abrirDocumento):
// abrirlo cuenta como leerlo y recién entonces se activa el OK (lo hace cumplir el servidor).
import { html, raw, mount, ico, toast, api, ask, md, esc, drawer, closeDrawer } from './core.js';
import { activa, completo, progreso, puede, enServidor, leerOutput, ESTADOS, faltaAporte } from './agentes-flujos.js';
import { rutaEtapas } from './agentes-ui.js';
import { fuentes, archivos, mapaFuentes, enlazarCitas, modeloDeEtapa, idChatTrabajo } from './chat-agentes.js';
import { pideLecturaCompleta } from './revisor.js';

// La decisión corta: qué propone, la alternativa, qué asumió y qué le faltó según el revisor.
const tarjetaRevision = (e) => {
  const r = e.revision; if (!r) return '';
  const fallan = r.criterios.filter((c) => !c.cumple), d = r.decision;
  return html`<section class="ag-dec ${fallan.length ? 'mal' : ''}"><b>${fallan.length ? `Le faltan ${fallan.length} de ${r.criterios.length} criterios` : `Cumple los ${r.criterios.length} criterios`}${r.vueltas ? ' · se corrigió una vez' : ''}</b>
    ${d.propone ? html`<p><span>Propone</span>${d.propone}</p>` : ''}${d.alternativa ? html`<p><span>Alternativa</span>${d.alternativa}</p>` : ''}${d.asumio.length ? html`<p><span>Asumió</span>${d.asumio.join(' · ')}</p>` : ''}
    ${fallan.length ? html`<ul>${fallan.map((c) => html`<li>${c.texto}${c.razon ? `: ${c.razon}` : ''}</li>`)}</ul>` : ''}</section>`;
};

const enc = encodeURIComponent;
const quien = (e) => String(e || '').split('@')[0];
const ICO_EST = { aprobada: 'check', revision: 'file-text', en_cola: 'loader-circle', trabajando: 'loader-circle', ajuste: 'rotate-cw', pendiente: '' };
const post = (run, ruta, body = {}) => api(`agentes/runs/${enc(run.id)}/${ruta}`, { method: 'POST', body });
const docHtml = (run, n) => raw(enlazarCitas(String(md(run.etapas[n].salida || '')), mapaFuentes(run, n)));

// La acción de la etapa activa en la cola. El flujo avanza solo dentro de lo platicado; «Continuar» es para cuando el servidor
// no estaba en línea al aprobar, y lo que va más allá de lo platicado se platica primero en el Chat (onPlan).
function accionCola(run, n, modelos) {
  const e = run.etapas[n];
  if (n !== activa(run) || run.archivado || completo(run) || enServidor(e)) return '';
  if (e.estado === 'pregunta') return html`<span class="wc-note">${ico('chat', 12)} Responde en el Chat</span>`;
  if (run.plan_ok && n > run.plan_ok.hasta && e.estado === 'pendiente') return html`<button type="button" class="btn" data-act="plan">${ico('chat', 12)} Platicar lo que sigue</button>`;
  if (faltaAporte(run, n)) return html`<span class="wc-note">${ico('chat', 12)} Falta tu aporte: dalo en el Chat</span>`;
  if (e.estado === 'revision') return html`<button type="button" class="btn" data-act="doc" data-n="${n}">${ico('file-text', 12)} Abrir documento</button>`;
  if (!['pendiente', 'ajuste', 'detenida'].includes(e.estado)) return '';
  return html`<button type="button" class="btn" data-act="continuar" ${run.pausado || !modelos.length ? raw(`disabled title="${run.pausado ? 'El agente está en pausa' : 'El servidor no está en línea'}"`) : ''}>${ico(e.estado === 'pendiente' ? 'play' : 'rotate-cw', 12)} ${e.estado === 'ajuste' ? 'Re-ejecutar' : e.estado === 'detenida' ? 'Reintentar' : 'Continuar'}</button>`;
}

export function pintarVentana(box, { me, run, rol, modelos = [], onCambio = () => {}, onPlan = () => {} }) {
  box._av = { me, run, rol, modelos, onCambio, onPlan };
  const n = activa(run), e = run.etapas[n], pr = progreso(run), ajena = run.chat?.owner && run.chat.owner !== String(me.email).toLowerCase();
  const gs = fuentes(run), [ins, prod] = archivos(run);
  mount(box, html`<div class="avw">
    <header class="av-h"><span class="wc-av sm" aria-hidden="true">${(run.flujo.agente || run.flujo.nombre || '?').slice(0, 1)}</span>
      <div class="av-h-t"><b>${run.flujo.nombre}</b><span>${run.titulo}${run.cliente ? ` · ${run.cliente_nombre || run.cliente}` : ''}</span></div>
      <span class="wc-chip ${completo(run) ? 'ok' : e.estado}">${completo(run) ? 'Completo' : `${n + 1}/${run.etapas.length}`}</span></header>
    <div class="av-meta"><span class="wc-prog" title="${pr.hechas} de ${pr.total} aprobadas"><i style="width:${pr.pct}%"></i></span>
      ${completo(run) ? '' : html`<span>${e.nombre} · ${e.modelo || modeloDeEtapa(e, modelos)}</span>`}
      ${ajena && ['ceo', 'coo'].includes(rol) ? html`<button type="button" class="btn ghost sm" data-act="ver-chat">${ico('eye', 11)} Ver la conversación de ${quien(run.chat.owner)}</button>` : ''}
      ${run.chat ? '' : html`<button type="button" class="btn ghost sm" data-act="chat-anterior">${ico('chat', 11)} Conversación anterior</button>`}
      <a class="btn ghost sm" href="${rutaEtapas(run.flujo.id, run.id)}">${ico('kanban', 11)} Historial</a></div>

    <section class="av-sec" aria-label="Etapas"><h3>${ico('list', 12)} Etapas</h3>
      <ol class="wc-queue">${run.etapas.map((x, i) => html`<li class="${x.estado} ${i === n && !completo(run) ? 'act' : ''}">
        <span class="wc-q-dot">${ICO_EST[x.estado] ? ico(ICO_EST[x.estado], 11) : String(i + 1)}</span>
        <div class="wc-q-b"><b>${x.nombre}${x.gate ? ' 🚦' : ''}</b><span>${ESTADOS[x.estado] || x.estado}${x.estado === 'aprobada' && x.aprobada_por ? ` · ${quien(x.aprobada_por)}` : ''}${run.plan_ok && i > run.plan_ok.hasta && x.estado === 'pendiente' ? ' · sin platicar' : ''}</span>${accionCola(run, i, modelos)}</div></li>`)}</ol>
      ${run.pausado ? html`<p class="wc-note">${ico('pause', 12)} El agente está en pausa.</p>` : ''}</section>

    <section class="av-sec" aria-label="Documento"><h3>${ico('file-text', 12)} Documento</h3>
      ${run.etapas.some((x) => x.salida) || enServidor(e) ? run.etapas.map((x, i) => (x.salida && !(i === n && enServidor(x) && x.borrador) ? html`<article class="av-doc ${x.estado}">
          <header><b>${i + 1} · ${leerOutput(x.entrega || x.output, x.nombre).titulo}</b><span class="wc-chip ${x.estado}">${ESTADOS[x.estado] || x.estado}</span><button type="button" class="wc-ic" data-act="doc" data-n="${i}" title="Abrir" aria-label="Abrir el documento de ${x.nombre}">${ico('external-link', 12)}</button></header>
          <div class="ag-md av-doc-md">${docHtml(run, i)}</div></article>`
        : i === n && enServidor(x) ? html`<article class="av-doc vivo"><header><b>${i + 1} · ${x.nombre}</b><span class="wc-chip en_cola">${x.estado === 'en_cola' ? 'En cola' : 'Escribiendo…'}</span></header>
          ${x.borrador ? html`<div class="ag-md av-doc-md">${raw(md(x.borrador))}</div>` : ''}
          <ol class="av-acts">${(x.actividades || []).slice(-5).map((a) => html`<li class="${a.aviso ? 'warn' : ''}"><b>${a.titulo}</b>${a.detalle ? html` <span>${String(a.detalle).slice(0, 140)}</span>` : ''}</li>`)}</ol></article>` : ''))
        : html`<p class="wc-empty">El documento se va armando aquí, etapa por etapa.</p>`}</section>

    <section class="av-sec" aria-label="Fuentes"><h3>${ico('globe', 12)} Fuentes <span class="wc-n">${gs.reduce((s, g) => s + g.xs.length, 0)}</span></h3>
      ${gs.length ? gs.map((g) => html`<div class="wc-src-g"><span class="wc-src-h">${g.n + 1} · ${g.nombre}</span>${g.xs.map((x) => html`<div class="wc-src ${x.verificada ? 'ok' : ''}">
        <div class="wc-src-b"><b>${x.id} · ${x.titulo}</b>${/^https?:/.test(x.url || '') ? html`<a href="${x.url}" target="_blank" rel="noreferrer">${x.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 44)}</a>` : x.url ? html`<code>${x.url}</code>` : ''}</div>
        ${run.archivado ? '' : html`<span class="wc-src-a"><button type="button" class="wc-ic ${x.verificada ? 'on' : ''}" data-act="verificar" data-id="${x.id}" data-n="${g.n}" title="${x.verificada ? 'Verificada · quitar la marca' : 'Marcar como verificada'}" aria-pressed="${x.verificada ? 'true' : 'false'}">${ico('check', 12)}</button><button type="button" class="wc-ic" data-act="quitar-fuente" data-id="${x.id}" data-n="${g.n}" title="Quitar esta fuente" aria-label="Quitar">${ico('x', 12)}</button></span>`}</div>`)}</div>`)
        : html`<p class="wc-empty">Las fuentes que use el agente aparecen aquí para verificarlas.</p>`}</section>

    <section class="av-sec" aria-label="Archivos"><h3>${ico('folder', 12)} Archivos ${run.archivado ? '' : html`<button type="button" class="wc-ic wc-h-a" data-act="input" title="Añadir un input" aria-label="Añadir un input">${ico('plus', 13)}</button>`}</h3>
      <ul class="wc-tree">${[ins, prod].map((c) => html`<li><details open><summary>${ico('folder', 13)} ${c.carpeta} <span class="wc-n">${c.items.length}</span></summary>
        <ul>${c.items.length ? c.items.map((x) => (c.carpeta === 'Producido'
          ? html`<li><button type="button" data-act="doc" data-n="${x.n}">${ico('file-text', 12)} <span>${x.nombre}</span><i class="wc-dot ${x.estado}" title="${ESTADOS[x.estado] || ''}"></i></button></li>`
          : html`<li><button type="button" data-act="abrir-input" data-id="${x.id}">${ico(x.tipo === 'link' ? 'link' : 'file-text', 12)} <span>${x.nombre}</span></button></li>`)) : html`<li class="wc-empty">Vacío</li>`}</ul></details></li>`)}</ul></section>
  </div>`);
  if (!box._avOn) { box._avOn = true; box.addEventListener('click', (ev) => clic(box, ev)); }
}

async function clic(box, ev) {
  const t = ev.target.closest('[data-act]'); if (!t || !box.contains(t)) return;
  const S = box._av; if (!S) return;
  const { me, run, rol, onCambio, onPlan } = S, a = t.dataset.act, n = Number(t.dataset.n);
  const guardar = async (ruta, cuerpo, ok) => { try { const r = await post(run, ruta, cuerpo); if (ok) toast(ok); onCambio(r.run); } catch (e) { toast(e.message, true); } };
  if (a === 'doc') return abrirDocumento(run, n, { me, rol, modelos: S.modelos, onCambio });
  if (a === 'abrir-input') return abrirInput(run, t.dataset.id, onCambio);
  if (a === 'plan') return onPlan(run);
  if (a === 'continuar') return guardar(`etapa/${activa(run)}/encolar`, {}, 'Etapa enviada al servidor');
  if (a === 'verificar') { const x = (run.evidencia || []).find((y) => y.id === t.dataset.id && y.etapa === n); return guardar('evidencia', { id: t.dataset.id, etapa: n, verificada: !x?.verificada }); }
  if (a === 'quitar-fuente') return guardar('evidencia', { id: t.dataset.id, etapa: n, quitada: true }, 'Fuente quitada');
  if (a === 'input') return agregarInput(run, onCambio);
  if (a === 'ver-chat') return verConversacion(run);
  if (a === 'chat-anterior') return conversacionAnterior(run, me);
}

// El documento de una etapa: abrirlo cuenta como leerlo. Desde aquí se aprueba, se pide un ajuste o se corrige.
export async function abrirDocumento(run, n, { me, rol, modelos = [], onCambio = () => {} }) {
  const e = run.etapas[n]; if (!e?.salida) return;
  const o = leerOutput(e.entrega || e.output, e.nombre);
  if (['revision', 'aprobada'].includes(e.estado)) { try { ({ run } = await post(run, `etapa/${n}/leida`)); onCambio(run); } catch (er) { toast(er.message, true); } }
  const noA = puede(run, n, 'aprobar', { rol, email: me.email }), noC = puede(run, n, 'corregir', { rol }), enRev = e.estado === 'revision' && n === activa(run);
  const sigue = run.plan_ok && n + 1 < run.etapas.length && n + 1 <= run.plan_ok.hasta ? ` Después sigue sola con ${run.etapas[n + 1].nombre}.` : '';
  drawer(html`<div class="ag-rev"><span class="lbl">Etapa ${n + 1} · ${e.nombre}</span><h1>${o.titulo}</h1>
    <p class="sm mut">${ESTADOS[e.estado] || e.estado}${e.confianza ? ` · confianza ${e.confianza}%` : ''}${e.modelo ? ` · ${e.modelo}` : ''}${e.faltantes?.length ? ` · faltó evidencia de: ${e.faltantes.slice(0, 3).join('; ')}` : ''}</p>
    ${e.gate ? html`<p class="ag-gate sm">🚦 ${e.nota_gate || 'Gate del CEO: solo el CEO aprueba esta etapa'}</p>` : ''}
    ${tarjetaRevision(e)}
    ${pideLecturaCompleta(run, n) ? html`<div class="ag-md card">${docHtml(run, n)}</div>` : html`<details class="ag-doc"><summary>Leer el documento completo</summary><div class="ag-md card">${docHtml(run, n)}</div></details>`}
    <div class="ag-rev-a">${enRev ? html`<button class="btn" data-act="aprobar" ${noA ? raw(`disabled title="${esc(noA)}"`) : ''}>${ico('check', 14)} Aprobar</button>
      <button class="btn ghost" data-act="ajuste">${ico('rotate-cw', 14)} Pedir ajuste</button>` : ''}
      ${enRev && !noC ? html`<button class="btn ghost" data-act="corregir">${ico('pencil', 14)} Corregir</button>` : ''}
      <button class="btn ghost" data-act="descargar">${ico('download', 14)} Descargar .md</button></div>
    ${enRev ? html`<p class="xs mut">${noA || `Al aprobar queda en el trabajo.${sigue}`}</p>` : ''}</div>`, {
    aprobar: async () => { closeDrawer(); try { const r = await post(run, `etapa/${n}/aprobar`); toast('Etapa aprobada'); onCambio(r.run); } catch (er) { toast(er.message, true); } },
    ajuste: async () => {
      closeDrawer();
      const v = await ask('Pedir ajuste', [{ k: 'nota', l: '¿Qué tiene que cambiar?', t: 'textarea', req: true }], 'Pedir ajuste y re-ejecutar'); if (!v) return;
      try { let r = await post(run, `etapa/${n}/ajuste`, { nota: String(v.nota).slice(0, 1000) }); if (modelos.length && !r.run.pausado) r = await post(r.run, `etapa/${n}/encolar`); toast('Ajuste pedido: el servidor la re-ejecuta'); onCambio(r.run); } catch (er) { toast(er.message, true); }
    },
    corregir: async () => { closeDrawer(); const v = await ask('Corregir resultado', [{ k: 'salida', l: 'Resultado (markdown)', t: 'textarea', v: e.salida, req: true }, { k: 'nota', l: 'Qué corregiste' }], 'Guardar corrección'); if (!v) return; try { const r = await post(run, `etapa/${n}/corregir`, v); toast('Corrección guardada'); onCambio(r.run); } catch (er) { toast(er.message, true); } },
    descargar: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([e.salida || ''], { type: 'text/markdown' })); a.download = archivos(run)[1].items.find((x) => x.n === n)?.nombre || 'etapa.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); },
    'abrir-input': (b) => abrirInput(run, b.dataset.id, onCambio),
  }, { title: o.titulo });
}

function abrirInput(run, iid, onCambio) {
  const x = (run.inputs || []).find((y) => y.id === iid); if (!x) return;
  drawer(html`<div class="ag-rev"><span class="lbl">Input · ${x.interna ? 'fuente interna' : 'fuente externa'}</span><h1>${x.titulo}</h1>${x.meta ? html`<p class="sm mut">${x.meta}</p>` : ''}
    ${x.url ? html`<p><a href="${x.url}" target="_blank" rel="noreferrer">${x.url}</a></p>` : ''}${x.texto ? html`<pre class="wc-pre">${x.texto}</pre>` : ''}
    ${run.archivado || /^i-chat/.test(x.id) ? '' : html`<div class="ag-rev-a"><button class="btn ghost" data-act="quitar">Quitar input</button></div>`}</div>`,
  { quitar: async () => { closeDrawer(); try { const r = await post(run, 'inputs', { id: x.id, archivado: true }); toast('Input quitado'); onCambio(r.run); } catch (e) { toast(e.message, true); } } }, { title: 'Input' });
}

async function agregarInput(run, onCambio) {
  const v = await ask('Añadir input', [
    { k: 'tipo', l: 'Qué es', t: 'select', opts: [['texto', 'Texto pegado'], ['link', 'Enlace']], v: 'texto' },
    { k: 'titulo', l: 'Título', ph: 'Ej.: Entrevista del fundador' },
    { k: 'url', l: 'Enlace (si es enlace)', ph: 'https://…' },
    { k: 'texto', l: 'Contenido (si es texto)', t: 'textarea' },
    { k: 'interna', l: 'Origen', t: 'select', opts: [['1', 'Fuente interna (del cliente o de Inherent)'], ['', 'Fuente externa']], v: '1' },
  ], 'Añadir');
  if (!v) return;
  try { const r = await post(run, 'inputs', { ...v, interna: Boolean(v.interna) }); toast('Input agregado'); onCambio(r.run); } catch (e) { toast(e.message, true); }
}

// Los trabajos que se llevaron en el chat de F4 guardaron su conversación aparte: se lee aquí, solo lectura. No se borra.
async function conversacionAnterior(run, me) {
  try {
    const j = await api(`chat/sesiones/${enc(idChatTrabajo(run, me.email))}`);
    drawer(html`<div class="ag-rev"><p class="av-franja">${ico('eye', 12)} Conversación anterior · solo lectura</p><h1>${run.titulo}</h1>
      <div class="av-lect">${(j.messages || []).filter((m) => m.content).map((m) => (m.role === 'user' ? html`<div class="wc-msg yo"><div class="wc-bub">${m.content}</div></div>` : html`<div class="ag-md">${raw(md(m.content))}</div>`))}</div></div>`, {}, { title: 'Conversación anterior' });
  } catch (e) { toast(e.status === 404 ? 'Este trabajo no tiene una conversación anterior' : e.message, true); }
}

// Solo el CEO y el COO, solo lectura: la conversación de quien llamó al agente, con de quién es, el cliente y el trabajo.
async function verConversacion(run) {
  try {
    const j = await api(`chat/sesiones/${enc(run.chat.sesion)}/lectura?run=${enc(run.id)}`);
    drawer(html`<div class="ag-rev"><p class="av-franja">${ico('eye', 12)} Solo lectura · de ${quien(j.owner)} · ${run.cliente_nombre || run.cliente || 'Inherent'} · ${run.titulo}</p><h1>${j.title || 'Conversación'}</h1>
      <div class="av-lect">${j.messages.map((m) => (m.role === 'user' ? html`<div class="wc-msg yo"><div class="wc-bub">${m.content}</div></div>` : html`<div class="ag-md">${raw(md(m.content))}</div>`))}</div></div>`, {}, { title: 'Conversación' });
  } catch (e) { toast(e.message, true); }
}
