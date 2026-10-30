// Agent Area (#/ai/agentes…) · la entrada: runs en curso, los workflows del OS y las plantillas para importar.
//   #/ai/agentes              → portada
//   #/ai/agentes/<run>        → un run por etapas (agentes-run.js)
//   #/ai/agentes/flujo/<id>   → el editor de un workflow (agentes-editor.js)
// Los workflows son del OS: se importan de una plantilla (repo o PDF) y quedan independientes; el repo da la estructura,
// no las respuestas (esas salen de fuentes reales con las conexiones de Hermes).
import { html, raw, mount, acts, ico, skel, toast, api, ask } from '../core.js';
import { tipoDe } from '../agentes-flujos.js';
import { cargarContexto } from '../contexto.js';
import { pintarRun } from '../agentes-run.js';
import { pintarEditor } from '../agentes-editor.js';

export const esqueleto = () => skel('pagina');
const ID = /^[\w-]{4,60}$/;

export async function render(el, { me, sub = [], alive }) {
  if (sub[0] === 'flujo' && ID.test(sub[1] || '')) return pintarEditor(el, me, sub[1], alive);
  if (ID.test(sub[0] || '') && sub[0] !== 'flujo') return pintarRun(el, me, sub[0], alive);
  return pintarPortada(el, me, alive);
}

// Pide los datos de un run nuevo y lo crea. La usan la portada y el editor.
export async function nuevoRun(me, workflows, preferido = '') {
  const ctx = await cargarContexto(me).catch(() => []);
  const opts = workflows.filter((w) => w.etapas.length && !w.archivado).map((w) => [w.id, `${w.nombre} · ${w.etapas.length} etapas`]);
  if (!opts.length) return toast('Primero importa o crea un workflow', true);
  const clientes = [['', 'Sin cliente (Inherent)'], ...ctx.filter((c) => c.slug && c.slug !== 'inherent').map((c) => [c.slug, c.name])];
  const v = await ask('Nuevo run', [
    { k: 'workflow', l: 'Workflow', t: 'select', opts, v: preferido || opts[0][0], req: true },
    { k: 'titulo', l: 'Título', ph: 'Ej.: Construir estrategia de crecimiento — NAO' },
    { k: 'objetivo', l: 'Objetivo', t: 'textarea', ph: '¿Qué tiene que lograr este run?' },
    { k: 'cliente', l: 'Cliente', t: 'select', opts: clientes },
  ], 'Crear run');
  if (!v) return;
  try {
    const { run } = await api('agentes/runs', { method: 'POST', body: { ...v, cliente_nombre: ctx.find((c) => c.slug === v.cliente)?.name || '' } });
    location.hash = '#/ai/agentes/' + run.id;
  } catch (e) { toast(e.message, true); }
}

const cadena = (etapas) => html`<span class="ag-chain">${etapas.map((e, i) => html`${i ? html`<i></i>` : ''}<span class="ag-chain-n" style="--c:var(${tipoDe(e.tipo).color})" title="${e.nombre} · ${tipoDe(e.tipo).nombre}${e.gate ? ' · 🚦' : ''}">${ico(tipoDe(e.tipo).icono, 11)}</span>`)}</span>`;

async function pintarPortada(el, me, alive) {
  mount(el, skel('pagina'));
  const [{ items: runs }, { items: workflows, editor }, { plantillas }] = await Promise.all([api('agentes/runs'), api('agentes/workflows'), api('agentes/plantillas')]);
  if (!alive()) return;
  const importadas = new Set(workflows.map((w) => w.origen?.id).filter(Boolean));

  const fila = (r) => {
    const hechas = r.etapas.filter((e) => e.estado === 'aprobada').length, act = r.etapas[r.activa];
    const espera = !r.completo && act?.estado === 'revision';
    return html`<a class="ag-run card" href="#/ai/agentes/${r.id}">
      <span class="ag-run-ic">${ico('agents', 16)}</span>
      <span class="ag-run-t"><b>${r.titulo}</b><span class="mut sm">${r.flujo.nombre}${r.cliente_nombre || r.cliente ? ` · ${r.cliente_nombre || r.cliente}` : ''}</span></span>
      <span class="ag-run-bar" title="${hechas} de ${r.etapas.length} etapas aprobadas">${r.etapas.map((e) => html`<i class="${e.estado}"></i>`)}</span>
      <span class="chip sm2 ${r.completo ? 'ok' : espera ? 'warn' : ''}">${r.completo ? 'Completo' : r.pausado ? 'En pausa' : espera ? 'Esperando tu aprobación' : act ? act.nombre : ''}</span></a>`;
  };
  const tarjetaWf = (w) => html`<article class="card ag-flow">
      <div class="ag-flow-h"><b>${w.nombre}</b><span class="chip sm2 ${w.estado === 'activo' ? 'ok' : ''}">${w.estado === 'activo' ? 'Activo' : 'Borrador'}</span></div>
      ${w.descripcion ? html`<p class="mut sm">${w.descripcion}</p>` : ''}
      ${cadena(w.etapas)}
      <p class="mut xs">${w.etapas.length} etapas · ${w.runs} run${w.runs === 1 ? '' : 's'}${w.origen?.tipo === 'repo' || w.origen?.tipo === 'pdf' ? ' · importado de una plantilla' : ''}</p>
      <div class="ag-flow-a"><a class="btn ghost sm" href="#/ai/agentes/flujo/${w.id}">${ico(editor ? 'pencil' : 'eye', 13)} ${editor ? 'Editar' : 'Ver'}</a><button class="btn sm" data-act="run" data-w="${w.id}">${ico('play', 13)} Iniciar run</button></div></article>`;
  const tarjetaPl = (p) => html`<article class="card ag-flow ag-pl">
      <div class="ag-flow-h">${p.n ? html`<span class="ag-n">${p.n}</span>` : ''}<b>${p.nombre}</b>${p.fuente === 'AGENTS IN OS.pdf' ? html`<span class="chip sm2">PDF</span>` : ''}</div>
      <p class="mut sm">${p.hace}</p>
      <details class="ag-det"><summary>${p.etapas.length} etapas</summary><ol class="ag-steps-mini">${p.etapas.filter((e) => !e.loop).map((e) => html`<li>${e.nombre}${e.gate ? ' 🚦' : ''}</li>`)}</ol><p class="mut xs">Fuente: <code>${p.fuente}</code></p></details>
      ${editor ? html`<button class="btn ghost sm" data-act="importar" data-p="${p.id}" ${p.etapas.length ? '' : raw('disabled')}>${ico('copy', 13)} ${importadas.has(p.id) ? 'Importar otra copia' : 'Importar como workflow'}</button>` : ''}</article>`;

  mount(el, html`<div class="iai-hero sp-hero"><span class="lbl">Inherent AI</span><h1>Agent Area</h1>
      <p>Objetivo → Investigación → Interpretación → Decisión → Resultado → Validación. El agente trabaja con fuentes reales y cada etapa necesita tu aprobación.</p></div>
    <nav class="iai-tabs" aria-label="Inherent AI"><a href="#/chat">${ico('chat', 14)} Chat</a><a href="#/ai/agentes" aria-current="page">${ico('agents', 14)} Agent Area</a><a href="#/ai/mcps">${ico('puzzle', 14)} MCPs</a></nav>
    <div class="hy-bh iai-sec"><h2>Runs</h2><span>Lo que los agentes están trabajando</span><button class="btn sm" data-act="run" style="margin-left:auto">${ico('plus', 14)} Nuevo run</button></div>
    ${runs.length ? html`<div class="ag-runs">${runs.map(fila)}</div>` : html`<div class="empty card ag-empty">${ico('agents', 22)}<b>Todavía no hay runs</b><span class="mut sm">${workflows.length ? 'Inicia un run desde uno de tus workflows.' : 'Importa una plantilla o crea un workflow, y después inicia un run.'}</span></div>`}
    <div class="hy-bh iai-sec"><h2>Workflows</h2><span>Del OS: se editan aquí, sin tocar el repo</span>${editor ? html`<button class="btn ghost sm" data-act="nuevo-wf" style="margin-left:auto">${ico('plus', 14)} Nuevo workflow</button>` : ''}</div>
    ${workflows.length ? html`<div class="ag-flows">${workflows.map(tarjetaWf)}</div>` : html`<div class="empty card ag-empty"><b>Sin workflows todavía</b><span class="mut sm">${editor ? 'Importa una plantilla de abajo: se copia su estructura y queda como workflow propio, editable.' : 'El CEO o el COO los crean.'}</span></div>`}
    <div class="hy-bh iai-sec"><h2>Plantillas</h2><span>Los métodos de agents/*/WORKFLOW.md y del PDF. Importar copia la estructura; no queda conectado al repo</span></div>
    <div class="ag-flows">${plantillas.map(tarjetaPl)}</div>`);

  acts(el, {
    run: (b) => nuevoRun(me, workflows, b.dataset.w),
    importar: async (b) => {
      try { const { workflow } = await api('agentes/workflows', { method: 'POST', body: { plantilla: b.dataset.p } }); toast('Importado: ahora es un workflow del OS'); location.hash = '#/ai/agentes/flujo/' + workflow.id; }
      catch (e) { toast(e.message, true); }
    },
    'nuevo-wf': async () => {
      const v = await ask('Nuevo workflow', [{ k: 'nombre', l: 'Nombre', req: true, ph: 'Ej.: Auditoría de marca' }, { k: 'agente', l: 'Agente', ph: 'Ej.: Branding' }, { k: 'descripcion', l: 'Qué hace', t: 'textarea' }], 'Crear');
      if (!v) return;
      try { const { workflow } = await api('agentes/workflows', { method: 'POST', body: v }); location.hash = '#/ai/agentes/flujo/' + workflow.id; }
      catch (e) { toast(e.message, true); }
    },
  });
}
