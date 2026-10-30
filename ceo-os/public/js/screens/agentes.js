// Agent Area (#/ai/agentes[/<run>]) · trabajar con un agente por etapas, como lo pide AGENTS IN OS.pdf:
// arriba la línea de etapas (siempre visible), a la izquierda los inputs de la etapa, al centro qué hace el agente y el resultado
// parcial, a la derecha la evidencia y las fuentes (se pliega) con el historial, y abajo «¿Qué necesita de mí?» con
// Ejecutar · Aprobar · Corregir · Solicitar ajuste · Continuar. Toda etapa se aprueba para avanzar; las 🚦 solo el CEO.
// La IA es la de cada persona (correrPedido: Hermes → puente → claude.ai) o el simulado (STUB, marcado). El servidor
// (api/_lib/agentes.js) guarda y hace cumplir las reglas; aquí solo se reflejan (puede() de agentes-flujos.js).
import { html, raw, mount, acts, ico, skel, toast, api, ask, md, $, esc } from '../core.js';
import { ESTADOS, activa, completo, puede, pedido, leerRespuesta, simular, leerOutput } from '../agentes-flujos.js';
import { AGENTES } from '../harness/agentes.js';
import { correrPedido, caminoIA } from '../ia-herramienta.js';
import { cargarContexto } from '../contexto.js';

export const esqueleto = () => skel('pagina');
const enc = encodeURIComponent;
const VIA = { hermes: 'Hermes', puente: 'Claude · puente', 'claude-web': 'claude.ai', simulado: 'Simulado' };
const ACC = { crear: 'creó el run', ejecutar: 'ejecutó la etapa', aprobar: 'aprobó', corregir: 'corrigió el resultado', ajuste: 'pidió un ajuste', fuente: 'agregó una fuente', verificar: 'verificó una fuente', desverificar: 'quitó la verificación', archivar: 'archivó el run', restaurar: 'restauró el run' };
const quien = (e) => String(e || '').split('@')[0];
const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const prefRunner = (me) => `os.agentes.runner.${me.email}`;

export async function render(el, { me, sub = [], alive }) {
  const id = sub[0] && /^[\w-]{4,60}$/.test(sub[0]) ? sub[0] : '';
  if (id) return pintarRun(el, me, id, alive);
  return pintarLista(el, me, alive);
}

// ---------- La portada: runs + agentes ----------
async function pintarLista(el, me, alive) {
  mount(el, skel('pagina'));
  const [{ items }, { flujos }, ctx] = await Promise.all([api('agentes/runs'), api('agentes/flujos'), cargarContexto(me).catch(() => [])]);
  if (!alive()) return;
  const fila = (r) => {
    const hechas = r.etapas.filter((e) => e.estado === 'aprobada').length, act = r.etapas[r.activa];
    const espera = !r.completo && act?.estado === 'revision';
    return html`<a class="ag-run card" href="#/ai/agentes/${r.id}">
      <span class="ag-run-ic">${ico('agents', 16)}</span>
      <span class="ag-run-t"><b>${r.titulo}</b><span class="mut sm">${r.flujo.n} · ${r.flujo.nombre}${r.cliente_nombre || r.cliente ? ` · ${r.cliente_nombre || r.cliente}` : ''}</span></span>
      <span class="ag-run-bar" title="${hechas} de ${r.etapas.length} etapas aprobadas">${r.etapas.map((e) => html`<i class="${e.estado}"></i>`)}</span>
      <span class="chip sm2 ${r.completo ? 'ok' : espera ? 'warn' : ''}">${r.completo ? 'Completo' : espera ? 'Esperando tu revisión' : act ? act.nombre : ''}</span></a>`;
  };
  const tarjeta = (f) => html`<article class="card ag-flow">
      <div class="ag-flow-h"><span class="ag-n">${f.n}</span><b>${f.nombre}</b>${f.fuente === 'AGENTS IN OS.pdf' ? html`<span class="chip sm2">PDF</span>` : ''}</div>
      <p class="mut sm">${f.hace}</p>
      <details class="ag-det"><summary>${f.etapas.length} etapas${f.etapas.some((e) => e.gate) ? ' · 🚦 gate del CEO' : ''}</summary>
        <ol class="ag-steps-mini">${f.etapas.map((e) => html`<li><span class="ag-n">${e.codigo}</span>${e.nombre}${e.gate ? ' 🚦' : ''}${e.proposito ? html`<span class="mut sm"> — ${e.proposito}</span>` : ''}</li>`)}</ol>
        ${f.limites?.length ? html`<p class="sm"><b>No hace:</b> <span class="mut">${f.limites.slice(0, 3).join(' · ')}</span></p>` : ''}
        <p class="mut xs">Fuente: <code>${f.fuente}</code>${f.leido === false ? ' · no se pudo leer' : ''}</p></details>
      <button class="btn ghost sm" data-act="nuevo" data-f="${f.id}" ${f.etapas.length ? '' : raw('disabled')}>${ico('plus', 14)} Nuevo run</button></article>`;

  mount(el, html`<div class="iai-hero sp-hero"><span class="lbl">Inherent AI</span><h1>Agent Area</h1>
      <p>Objetivo → Investigación → Interpretación → Decisión → Resultado → Validación. Cada etapa necesita tu aprobación para avanzar.</p></div>
    <nav class="iai-tabs" aria-label="Inherent AI"><a href="#/chat">${ico('chat', 14)} Chat</a><a href="#/ai/agentes" aria-current="page">${ico('agents', 14)} Agent Area</a><a href="#/ai/mcps">${ico('puzzle', 14)} MCPs</a></nav>
    <div class="hy-bh iai-sec"><h2>Runs</h2><span>Lo que los agentes están trabajando</span><button class="btn sm" data-act="nuevo" style="margin-left:auto">${ico('plus', 14)} Nuevo run</button></div>
    ${items.length ? html`<div class="ag-runs">${items.map(fila)}</div>` : html`<div class="empty card ag-empty">${ico('agents', 22)}<b>Todavía no hay runs</b><span class="mut sm">Elige un agente y empieza: el agente propone etapa por etapa y tú validas.</span></div>`}
    <div class="hy-bh iai-sec"><h2>Agentes</h2><span>Leídos de agents/*/brain/WORKFLOW.md del repo + la Estrategia guiada del PDF</span></div>
    <div class="ag-flows">${flujos.map(tarjeta)}</div>`);

  acts(el, {
    nuevo: async (b) => {
      const opts = flujos.filter((f) => f.etapas.length).map((f) => [f.id, `${f.n} · ${f.nombre} (${f.etapas.length} etapas)`]);
      const clientes = [['', 'Sin cliente (Inherent)'], ...ctx.filter((c) => c.slug && c.slug !== 'inherent').map((c) => [c.slug, c.name])];
      const v = await ask('Nuevo run de agente', [
        { k: 'flujo', l: 'Agente', t: 'select', opts, v: b.dataset.f || opts[0]?.[0], req: true },
        { k: 'titulo', l: 'Título', ph: 'Ej.: Estrategia NAO — Q1' },
        { k: 'objetivo', l: 'Objetivo', t: 'textarea', ph: '¿Qué tiene que lograr este run?' },
        { k: 'cliente', l: 'Cliente', t: 'select', opts: clientes },
      ], 'Crear run');
      if (!v) return;
      try {
        const { run } = await api('agentes/runs', { method: 'POST', body: { ...v, cliente_nombre: ctx.find((c) => c.slug === v.cliente)?.name || '' } });
        location.hash = '#/ai/agentes/' + run.id;
      } catch (e) { toast(e.message, true); }
    },
  });
}

// ---------- Un run ----------
async function pintarRun(el, me, id, alive) {
  mount(el, skel('pagina'));
  let run, rol, sel = null, panel = 'evidencia', ocupado = false, revelar = 0;
  let abierto = localStorage.getItem('os.agentes.evi') !== '0';
  try { ({ run, rol } = await api('agentes/runs/' + enc(id))); } catch (e) { if (alive()) mount(el, html`<div class="empty card">${e.message}<a class="btn ghost sm" href="#/ai/agentes">Volver</a></div>`); return; }
  if (!alive()) return;
  const flujoAg = AGENTES.find((a) => a.id === run.flujo.id);
  const modo = flujoAg?.modo || 'estrategia';
  const camino = await caminoIA(me).catch(() => 'claude-web');
  const runnerGuardado = localStorage.getItem(prefRunner(me)) || 'auto';
  let runner = runnerGuardado;

  const pinta = () => {
    const act = activa(run), n = sel ?? act, e = run.etapas[n], siguiente = run.etapas[n + 1];
    const esActiva = n === act && !run.archivado && !completo(run);
    const evi = (run.evidencia || []).filter((x) => x.etapa === n);
    const o = leerOutput(e.output, e.nombre);
    const no = (acc) => puede(run, n, acc, { rol });
    const necesita = run.archivado ? 'Run archivado: solo lectura.'
      : completo(run) ? 'Todas las etapas están aprobadas. El run está completo.'
      : !esActiva ? (e.estado === 'aprobada' ? `Aprobada por ${quien(e.aprobada_por)} · ${cuando(e.aprobada_en)}. Solo lectura.` : 'Esta etapa se desbloquea cuando se aprueben las anteriores.')
      : e.estado === 'pendiente' ? 'Ejecuta la etapa: el agente trabaja con los inputs y con lo que ya aprobaste.'
      : e.estado === 'ajuste' ? `Pediste un ajuste: «${e.ajuste}». Vuelve a ejecutar la etapa.`
      : e.estado === 'revision' ? (e.gate && rol !== 'ceo' ? '🚦 Gate del CEO: esta etapa la aprueba el CEO.' : 'Revisa el resultado y la evidencia. Aprueba, corrige o pide un ajuste.')
      : '';
    const acts = e.actividades || [], vistos = revelar ? acts.slice(0, revelar) : acts;
    const historial = [...(run.historial || [])].reverse().slice(0, 60);

    mount(el, html`<div class="ag-run-view">
      <header class="ag-head">
        <div class="ag-head-t"><a class="mut sm" href="#/ai/agentes">${ico('chevron-left', 14)} Agent Area</a>
          <h1>${run.titulo}</h1>
          <span class="mut sm">${run.flujo.n} · ${run.flujo.nombre}${run.cliente ? ` · ${run.cliente_nombre || run.cliente}` : ''} · creado por ${quien(run.creado_por)}</span>
          ${run.objetivo ? html`<p class="sm ag-obj">Objetivo: ${run.objetivo}</p>` : ''}</div>
        <div class="ag-head-a">
          <label class="sm mut">Con qué corre
            <select class="in sm" data-ch="runner">
              <option value="auto" ${runner === 'auto' ? raw('selected') : ''}>Tu IA (${VIA[camino] || camino})</option>
              <option value="simulado" ${runner === 'simulado' ? raw('selected') : ''}>Simulado (stub)</option>
            </select></label>
          ${!run.archivado ? html`<button class="btn ghost sm" data-act="archivar">Archivar</button>` : html`<button class="btn ghost sm" data-act="restaurar">Restaurar</button>`}
        </div>
      </header>

      <ol class="ag-stepper" aria-label="Etapas">${run.etapas.map((x, i) => html`<li>
        <button type="button" class="ag-step ${x.estado} ${i === n ? 'sel' : ''} ${i === act && !completo(run) ? 'act' : ''}" data-act="ver" data-n="${i}">
          <span class="ag-dot">${x.estado === 'aprobada' ? ico('check', 12) : x.estado === 'trabajando' ? ico('loader-circle', 12) : String(i + 1)}</span>
          <span class="ag-step-t"><b>${x.nombre}${x.gate ? ' 🚦' : ''}</b><span>${ESTADOS[x.estado] || x.estado}</span></span></button>
        ${i < run.etapas.length - 1 ? html`<span class="ag-sep">${ico('chevron-right', 12)}</span>` : ''}</li>`)}</ol>

      <div class="ag-body ${abierto ? '' : 'sin-evi'}">
        <aside class="ag-inputs">
          <div class="ag-k">Etapa</div><b>${e.codigo} · ${e.nombre}</b>
          ${e.proposito ? html`<p class="mut sm">${e.proposito}</p>` : ''}
          ${e.skill ? html`<p class="sm mut">Skill: <code>${e.skill}</code></p>` : ''}
          ${e.gate ? html`<p class="ag-gate sm">🚦 ${e.nota_gate || 'Gate del CEO'}</p>` : ''}
          ${e.inputs.length ? html`<div class="ag-k">Inputs requeridos</div><ul class="ag-ul">${e.inputs.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
          ${n > 0 ? html`<div class="ag-k">Usa lo aprobado</div><ul class="ag-ul">${run.etapas.slice(0, n).map((x, i) => html`<li><button type="button" class="lnk" data-act="ver" data-n="${i}">${x.estado === 'aprobada' ? '✓' : '○'} ${x.nombre}</button></li>`)}</ul>` : ''}
          ${e.criterios.length ? html`<div class="ag-k">Criterios de éxito</div><ul class="ag-ul">${e.criterios.map((x) => html`<li>${x}</li>`)}</ul>` : ''}
          ${run.flujo.limites?.length ? html`<div class="ag-k">Lo que no hace</div><ul class="ag-ul">${run.flujo.limites.slice(0, 5).map((x) => html`<li>${x}</li>`)}</ul>` : ''}
        </aside>

        <section class="ag-main">
          <div class="ag-sec-h">${ico('sparkles', 15)}<b>Qué está haciendo el agente</b>
            ${e.via ? html`<span class="chip sm2 ${e.stub ? 'warn' : ''}">${e.stub ? 'STUB · simulado' : VIA[e.via] || e.via}${e.modelo && !e.stub ? ` · ${e.modelo}` : ''}</span>` : ''}
            ${e.intento > 1 ? html`<span class="chip sm2">Intento ${e.intento}</span>` : ''}</div>
          ${ocupado && esActiva ? html`<div class="card ag-box mut sm">${ico('loader-circle', 14)} Trabajando en la etapa…</div>`
            : acts.length ? html`<ol class="card ag-box ag-acts">${vistos.map((a) => html`<li class="${/^⚠️/.test(a.t) ? 'warn' : ''}">${a.t}</li>`)}${revelar && revelar < acts.length ? html`<li class="mut">…</li>` : ''}</ol>`
            : html`<div class="card ag-box mut sm">Sin actividad todavía. Tareas previstas: ${(e.tareas.length ? e.tareas : [e.proposito || '—']).join(' · ')}</div>`}

          <div class="ag-sec-h">${ico('file-text', 15)}<b>Resultado parcial</b><span class="chip sm2 ${e.estado === 'aprobada' ? 'ok' : e.estado === 'revision' ? 'warn' : ''}">${ESTADOS[e.estado]}</span></div>
          ${e.salida ? html`<div class="card ag-box ag-md">${raw(md(e.salida))}</div>` : html`<div class="card ag-box mut sm">Output esperado: ${o.titulo}${o.campos.length ? ` (${o.campos.join(', ')})` : ''}</div>`}
        </section>

        ${abierto ? html`<aside class="ag-evi">
          <div class="ag-evi-tabs"><button type="button" class="${panel === 'evidencia' ? 'on' : ''}" data-act="panel" data-p="evidencia">Evidencia & Fuentes (${evi.length})</button><button type="button" class="${panel === 'historial' ? 'on' : ''}" data-act="panel" data-p="historial">${ico('clock', 12)} Historial</button><button type="button" class="ag-x" data-act="plegar" aria-label="Plegar">${ico('panel-right', 14)}</button></div>
          ${panel === 'evidencia' ? html`${evi.map((x) => html`<div class="ag-src card"><div class="ag-src-h"><b>${x.titulo}</b><span class="chip sm2 ${x.verificada ? 'ok' : 'warn'}">${x.verificada ? 'Verificada' : 'SIN VERIFICAR'}</span></div>
              ${x.url ? (/^https?:/.test(x.url) ? html`<a class="xs" href="${x.url}" target="_blank" rel="noreferrer">${x.url}</a>` : html`<code class="xs">${x.url}</code>`) : ''}
              ${x.extracto ? html`<p class="mut xs">${x.extracto}</p>` : ''}
              <label class="xs mut"><input type="checkbox" data-ch="verif" data-id="${x.id}" ${x.verificada ? raw('checked') : ''} ${run.archivado ? raw('disabled') : ''}> La revisé (verificada)</label></div>`)}
            ${evi.length ? '' : html`<p class="mut sm">Sin evidencia para esta etapa.</p>`}
            ${run.archivado ? '' : html`<button class="btn ghost sm" data-act="fuente">${ico('plus', 13)} Agregar fuente</button>`}`
          : html`<ol class="ag-hist">${historial.map((h) => html`<li><b>${quien(h.quien)}</b> ${ACC[h.accion] || h.accion}${h.etapa != null && run.etapas[h.etapa] ? html` <span class="mut">· ${run.etapas[h.etapa].nombre}</span>` : ''}<span class="mut xs">${cuando(h.at)}</span>${h.nota ? html`<span class="ag-nota xs">${h.nota}</span>` : ''}</li>`)}</ol>`}
        </aside>` : html`<button type="button" class="ag-evi-off" data-act="plegar" aria-label="Mostrar evidencia">${ico('panel-right', 14)}<span>Evidencia & Fuentes</span></button>`}
      </div>

      <footer class="ag-foot">
        <div class="ag-foot-t"><span class="mut xs">¿Qué necesita de mí?</span><b>${necesita}</b>${esActiva && siguiente ? html`<span class="mut xs">Después: etapa ${n + 2} · ${siguiente.nombre}</span>` : ''}</div>
        ${esActiva ? html`
          ${['pendiente', 'ajuste'].includes(e.estado) ? html`<button class="btn" data-act="ejecutar" ${ocupado ? raw('disabled') : ''}>${ico(e.estado === 'ajuste' ? 'rotate-cw' : 'play', 14)} ${e.estado === 'ajuste' ? 'Re-ejecutar con el ajuste' : 'Ejecutar etapa'}</button>` : ''}
          ${e.estado === 'revision' ? html`
            <button class="btn ghost" data-act="ajuste">Solicitar ajuste</button>
            <button class="btn ghost" data-act="corregir" ${no('corregir') ? raw(`disabled title="${esc(no('corregir'))}"`) : ''}>Corregir</button>
            <button class="btn" data-act="aprobar" ${no('aprobar') ? raw(`disabled title="${esc(no('aprobar'))}"`) : ''}>${ico('check', 14)} Aprobar</button>` : ''}` : ''}
        ${!run.archivado && !completo(run) && n !== act && run.etapas[act] ? html`<button class="btn" data-act="ir">Ir a la etapa activa ${ico('arrow-right', 14)}</button>` : ''}
        ${!run.archivado && e.estado === 'aprobada' && n === act - 1 && run.etapas[act] ? html`<button class="btn" data-act="continuar">Continuar a ${run.etapas[act].nombre} ${ico('arrow-right', 14)}</button>` : ''}
      </footer></div>`);
  };

  const guardar = async (ruta, cuerpo, ok) => {
    try { ({ run } = await api(`agentes/runs/${enc(run.id)}/${ruta}`, { method: 'POST', body: cuerpo || {} })); if (ok) toast(ok); }
    catch (e) { toast(e.message, true); if (e.status === 409) ({ run } = await api('agentes/runs/' + enc(run.id))); }
    if (alive()) pinta();
  };

  async function ejecutar(n) {
    ocupado = true; run.etapas[n] = { ...run.etapas[n], estado: 'trabajando' }; pinta();
    let res;
    try {
      if (runner === 'simulado') res = { ...simular(run, n), via: 'simulado', modelo: '' };
      else {
        const out = await correrPedido(me, { modo, slug: run.cliente, nombre: `${run.flujo.nombre} · ${run.etapas[n].nombre}`, mensaje: pedido(run, n) });
        res = { ...leerRespuesta(out.texto), via: out.via, modelo: out.modelo };
      }
    } catch (e) {
      ocupado = false;
      if (e.name !== 'AbortError') toast(`${e.message}. Puedes correrla en Simulado.`, true);
      ({ run } = await api('agentes/runs/' + enc(run.id))); if (alive()) pinta(); return;
    }
    ocupado = false;
    await guardar(`etapa/${n}/resultado`, res, 'Etapa ejecutada: revísala');
    // Revelado de la actividad, línea por línea.
    const total = run.etapas[n]?.actividades?.length || 0; revelar = 1;
    const t = setInterval(() => { if (!alive() || revelar >= total) { clearInterval(t); revelar = 0; } else revelar++; if (alive()) pinta(); }, 220);
  }

  acts(el, {
    ver: (b) => { sel = Number(b.dataset.n); pinta(); },
    ir: () => { sel = null; pinta(); },
    panel: (b) => { panel = b.dataset.p; pinta(); },
    plegar: () => { abierto = !abierto; localStorage.setItem('os.agentes.evi', abierto ? '1' : '0'); pinta(); },
    ejecutar: () => ejecutar(activa(run)),
    continuar: () => { sel = null; ejecutar(activa(run)); },
    aprobar: async () => {
      const n = activa(run);
      if (run.etapas[n].gate && !confirm('🚦 Es un gate del CEO. ¿Apruebas esta etapa?')) return;
      sel = n; await guardar(`etapa/${n}/aprobar`, {}, 'Etapa aprobada');
    },
    ajuste: async () => { const v = await ask('Solicitar ajuste', [{ k: 'nota', l: '¿Qué tiene que cambiar?', t: 'textarea', req: true }], 'Pedir ajuste'); if (v) await guardar(`etapa/${activa(run)}/ajuste`, v, 'Ajuste pedido: re-ejecuta la etapa'); },
    corregir: async () => { const n = activa(run); const v = await ask('Corregir resultado', [{ k: 'salida', l: 'Resultado (markdown)', t: 'textarea', v: run.etapas[n].salida, req: true }, { k: 'nota', l: 'Qué corregiste' }], 'Guardar corrección'); if (v) await guardar(`etapa/${n}/corregir`, v, 'Corrección guardada'); },
    fuente: async () => { const v = await ask('Agregar fuente', [{ k: 'titulo', l: 'Título', req: true }, { k: 'url', l: 'URL o ruta' }, { k: 'extracto', l: 'Extracto', t: 'textarea' }, { k: 'verificada', l: '¿La verificaste?', t: 'select', opts: [['', 'No'], ['1', 'Sí']] }], 'Agregar'); if (v) await guardar('evidencia', { ...v, verificada: Boolean(v.verificada), etapa: sel ?? activa(run) }, 'Fuente agregada'); },
    archivar: async () => { if (confirm('¿Archivar este run? Nada se borra.')) await guardar('archivar', { archivado: true }, 'Run archivado'); },
    restaurar: () => guardar('archivar', { archivado: false }, 'Run restaurado'),
  });
  el.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.dataset.ch === 'runner') { runner = t.value; localStorage.setItem(prefRunner(me), runner); }
    if (t.dataset.ch === 'verif') guardar('evidencia', { id: t.dataset.id, verificada: t.checked, etapa: sel ?? activa(run) });
  });
  pinta();
}
