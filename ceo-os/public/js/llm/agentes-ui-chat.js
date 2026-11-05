// F4.5 · Los agentes dentro del Chat (PLAN-GATEWAY §20): el menú «@», la tarjeta «Así lo voy a trabajar», los eventos de cada
// trabajo en el hilo (con el nombre y el color de su agente), la tarjeta del resultado y las pestañas del panel.
// Solo dibuja: el estado y las llamadas viven en screens/llm.js.
import { html, raw, ico, esc } from '../core.js';
import { activa, completo, puede, leerOutput, ESTADOS, enServidor, faltaAporte, leyo, puedeRecibir } from '../agentes-flujos.js';
import { colorArea, areaNombre } from '../agentes-ui.js';

const quien = (e) => String(e || '').split('@')[0];
const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '');
const color = (run) => `--c:var(${colorArea(run?.flujo?.area)})`;
const inicial = (n) => String(n || '?').slice(0, 1);

// El menú «@» (mismo lugar que los comandos «/»): los agentes activos que coinciden con lo escrito.
export function menuArroba(agentes, v) {
  const m = /^@(\S*)$/.exec(String(v || '').trim()); if (!m) return [];
  const q = m[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return agentes.filter((a) => a.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').includes(q)).slice(0, 8);
}
export const menuArrobaHtml = (xs) => html`${xs.map((a, i) => html`<button type="button" class="${i ? '' : 'on'}" data-a="arroba" data-n="${a.nombre}"><b style="${raw(color({ flujo: a }))}">@${a.nombre}</b><span>${areaNombre(a.area)} · ${a.etapas.length} etapas${a.objetivo ? ` · ${a.objetivo}` : ''}</span></button>`)}`;

// La tarjeta del plan: se platica antes de empezar. Tarjeta = { agente (workflow completo), resto, plan, hasta, cliente,
// clientes (si hay que elegir), estado: pendiente|creando|hecho|cancelado|error, run? }
export function planHtml(p, i) {
  const vivo = p.estado === 'pendiente' || p.estado === 'error';
  return html`<div class="lm a"><span class="lm-av ag" style="${raw(color({ flujo: p.agente }))}">${inicial(p.agente.nombre)}</span><div class="lm-tx">
    <div class="lpl ${p.estado}" style="${raw(color({ flujo: p.agente }))}"><span class="lm-k">${ico('list', 12)} @${p.agente.nombre} · así lo voy a trabajar</span>
      ${p.resto ? html`<b>${p.resto}</b>` : ''}
      <ol class="lpl-e">${p.plan.map((e) => html`<li class="${e.n > p.hasta ? 'fuera' : ''}"><span>${e.n + 1}</span><div><b>${e.nombre}${e.gate ? ' 🚦' : ''}</b><small>${e.entrega} · ${e.modelo}${e.aporte ? ' · te pedirá tu aporte' : ''}</small></div></li>`)}</ol>
      ${vivo ? html`<div class="lpl-f">
        ${p.clientes ? html`<label>Para<select data-ch="plan-cliente" data-i="${i}">${p.clientes.map(([s, n]) => html`<option value="${s}" ${s === p.cliente ? raw('selected') : ''}>${n}</option>`)}</select></label>` : ''}
        ${p.equipo?.length ? html`<label>Con ${p.equipo.map((x) => x.nombre).join(', ')}<select data-ch="plan-modo" data-i="${i}"><option value="secuencia" ${p.modo === 'secuencia' ? raw('selected') : ''}>Uno después del otro</option><option value="paralelo" ${p.modo === 'paralelo' ? raw('selected') : ''}>Todos a la vez</option></select></label>` : ''}
        <label>Sigue solo hasta<select data-ch="plan-hasta" data-i="${i}">${p.plan.map((e) => html`<option value="${e.n}" ${e.n === p.hasta ? raw('selected') : ''}>${e.n + 1} · ${e.nombre}</option>`)}</select></label></div>
        <p class="lpl-n">Al aprobar cada etapa, la siguiente arranca sola hasta donde digas. Lo que siga después lo platicamos. Lo último de esta conversación entra al trabajo como contexto y lo ve quien vea el trabajo.</p>
        ${p.estado === 'error' ? html`<p class="lm-err">${p.error}</p>` : ''}
        <div class="lm-ops"><button type="button" class="si" data-a="plan-empezar" data-i="${i}">Empezar</button><button type="button" data-a="plan-cancelar" data-i="${i}">Cancelar</button></div>`
      : html`<span class="lm-meta-ok">${p.estado === 'creando' ? 'Creando el trabajo…' : p.estado === 'cancelado' ? 'Cancelado' : html`${ico('check', 13)} En marcha · sigue sola hasta ${p.plan.find((e) => e.n === p.hasta)?.nombre || ''}`}</span>`}
    </div></div></div>`;
}

// La tarjeta del resultado vigente de una etapa (Abrir documento · Pedir ajuste · Aprobar, que se activa al leerlo).
function usarHtml(run, n, { me, otros = [], sesion = '' }) {
  if (run.etapas[n].estado !== 'aprobada') return '';
  if (!leyo(run, n, me.email)) return html`<small class="lres-c">Abre el documento para pasarlo a otro agente.</small>`;
  const ops = [...otros.filter((r) => puedeRecibir(run, r)).map((r) => [r.id, `@${r.flujo.nombre} · ${r.titulo}`.slice(0, 60)]), ...(sesion ? [['chat', 'Esta conversación']] : [])];
  return ops.length ? html`<div class="lres-u"><select aria-label="Pasar el resultado a">${ops.map(([v, t]) => html`<option value="${v}">${t}</option>`)}</select><button type="button" data-a="ag-usar" data-run="${run.id}" data-n="${n}">${ico('arrow-right', 13)} Usar en…</button></div>` : '';
}
function resultadoHtml(run, n, ctx) {
  const { me, rol } = ctx, e = run.etapas[n], o = leerOutput(e.entrega || e.output, e.nombre), enRev = e.estado === 'revision' && n === activa(run);
  const noA = enRev ? puede(run, n, 'aprobar', { rol, email: me.email }) : null;
  return html`<div class="lres ${e.estado}"><div class="lres-h"><span class="lm-k">Etapa ${n + 1} · ${e.nombre}</span><b>${o.titulo}</b>
      <span class="lres-c">${e.confianza ? `${e.confianza}% confianza` : 'Sin evidencia'}${e.estado === 'aprobada' ? ` · aprobada por ${quien(e.aprobada_por)}` : ''}</span></div>
    ${e.faltantes?.length ? html`<small class="lres-f">Faltó evidencia: ${e.faltantes.slice(0, 3).join('; ')}</small>` : ''}
    <div class="lm-ops"><button type="button" data-a="ag-doc" data-run="${run.id}" data-n="${n}">${ico('file-text', 13)} Abrir documento</button>
      ${enRev ? html`<button type="button" data-a="ag-ajuste" data-run="${run.id}" data-n="${n}">${ico('rotate-cw', 13)} Pedir ajuste</button>
      <button type="button" class="si" data-a="ag-aprobar" data-run="${run.id}" data-n="${n}" ${noA ? raw(`disabled title="${esc(noA)}"`) : ''}>${ico('check', 13)} ${noA === 'Abre el documento para aprobar' ? 'Abre el documento para aprobar' : 'Aprobar'}</button>` : ''}</div>${usarHtml(run, n, ctx)}</div>`;
}

// Un evento de un trabajo en el hilo: una línea con el agente, o la tarjeta del resultado si es el vigente de su etapa.
export function eventoHtml({ run, x }, ctx) {
  const e = run.etapas[x.etapa];
  if (x.vigente) return preguntaHtml(run, x.etapa);
  const linea = html`<div class="lev ${x.h.accion}" style="${raw(color(run))}"><button type="button" class="lev-ag" data-a="ag-tab" data-run="${run.id}" title="Ver a ${run.flujo.nombre}">${inicial(run.flujo.nombre)}</button>
    <p><b>${run.flujo.nombre}</b> · ${x.titulo}${e ? ` · ${e.nombre}` : ''}${x.h.quien && x.h.quien !== 'gateway' ? ` · ${quien(x.h.quien)}` : ''}${x.h.nota && ['ajuste', 'fallo', 'preguntar', 'responder'].includes(x.h.accion) ? html` <i>«${String(x.h.nota).slice(0, 200)}»</i>` : ''}${x.h.nota && ['usar', 'recibir'].includes(x.h.accion) ? ` · ${x.h.nota}` : ''}${x.h.accion === 'encolar' && /^auto/.test(x.h.nota || '') ? ' · sigue sola' : ''}</p><span class="lev-t">${hora(x.at)}</span></div>`;
  return x.ultimo ? html`${linea}${resultadoHtml(run, x.etapa, ctx)}` : linea;
}

// Las preguntas y el aporte van en el Chat (nunca en la ventana). El campo de texto sobrevive al repintado: lleva data-k.
function campoRespuesta(run, n, accion, boton, ph) {
  return html`<div class="lpr-r"><textarea rows="2" data-k="${accion}-${run.id}-${n}" placeholder="${ph}" aria-label="${boton}"></textarea><button type="button" class="si" data-a="${accion}" data-run="${run.id}" data-n="${n}">${boton}</button></div>`;
}
function preguntaHtml(run, n) {
  const q = run.etapas[n].pregunta || {};
  return html`<div class="lpr" style="${raw(color(run))}"><span class="lm-k">${inicial(run.flujo.nombre)} · ${run.flujo.nombre} pregunta</span><b>${q.texto}</b>${q.por_que ? html`<small>${q.por_que}</small>` : ''}
    ${q.opciones?.length ? html`<div class="lm-ops">${q.opciones.map((o) => html`<button type="button" data-a="ag-resp" data-run="${run.id}" data-n="${n}" data-t="${o}">${o}</button>`)}</div>` : ''}
    ${campoRespuesta(run, n, 'ag-resp', 'Responder', 'Tu respuesta…')}</div>`;
}
function aporteHtml(run, n) {
  return html`<div class="lpr aporte" style="${raw(color(run))}"><span class="lm-k">${inicial(run.flujo.nombre)} · Tu aporte para ${run.etapas[n].nombre}</span><b>${run.etapas[n].aporte.pregunta}</b><small>${run.flujo.nombre} no arranca esta etapa sin esto.</small>
    ${campoRespuesta(run, n, 'ag-aporte', 'Dar mi aporte', 'Tu punto de vista…')}</div>`;
}

// Lo que pasa ahora en un trabajo: el aporte que falta, una etapa detenida o una línea viva, al final del hilo.
export function vivoHtml(run) {
  const n = activa(run), e = run.etapas[n];
  if (run.archivado || completo(run)) return '';
  if (['pendiente', 'ajuste', 'detenida'].includes(e.estado) && faltaAporte(run, n) && (!run.plan_ok || n <= run.plan_ok.hasta)) return aporteHtml(run, n);
  if (e.estado === 'detenida') return html`<div class="lpr" style="${raw(color(run))}"><span class="lm-k">${inicial(run.flujo.nombre)} · ${run.flujo.nombre} se detuvo</span><b>${e.nombre} falló dos veces</b><small>${(e.actividades || []).at(-1)?.detalle || ''}</small><div class="lm-ops"><button type="button" class="si" data-a="ag-reintentar" data-run="${run.id}" data-n="${n}">${ico('rotate-cw', 13)} Reintentar</button></div></div>`;
  if (!enServidor(e)) return '';
  const a = (e.actividades || []).at(-1);
  return html`<div class="lev vivo" style="${raw(color(run))}"><button type="button" class="lev-ag" data-a="ag-tab" data-run="${run.id}">${inicial(run.flujo.nombre)}</button><p><b>${run.flujo.nombre}</b> · ${e.estado === 'en_cola' ? 'en cola' : 'trabajando'} ${e.nombre}${a ? html` · <i>${a.titulo}</i>` : ''}</p><i class="lm-spin"></i></div>`;
}

// Las pestañas del panel: el modo y una por trabajo ligado a la conversación.
export const pestanasHtml = (modo, runs, tab) => html`<nav class="lpt" aria-label="Panel"><button type="button" class="${tab === 'modo' ? 'on' : ''}" data-a="ag-tab" data-run="modo">${modo.nombre}</button>
  ${runs.map((r) => html`<span class="lpt-t ${tab === r.id ? 'on' : ''}" style="${raw(color(r))}"><button type="button" data-a="ag-tab" data-run="${r.id}"><i class="lpt-d ${completo(r) ? 'ok' : r.etapas[activa(r)]?.estado}"></i>${r.flujo.nombre}</button><button type="button" class="lpt-x" data-a="ag-cerrar" data-run="${r.id}" aria-label="Cerrar la pestaña de ${r.flujo.nombre}">${ico('x', 11)}</button></span>`)}</nav>`;
export const estadoCorto = (run) => (completo(run) ? 'Completo' : ESTADOS[run.etapas[activa(run)]?.estado] || '');
