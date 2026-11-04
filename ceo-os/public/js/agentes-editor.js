// Agent Area · editor del workflow de un agente (pestaña Workflow de su portal).
// Estilo editor de automatizaciones al estilo Kargul: paleta de acciones a la izquierda,
// lienzo central con nodos conectados por líneas, inspector del nodo a la derecha
// (Construir · Reglas · Conexiones). El workflow es del OS: guardar no toca el repo.
// Editan CEO y COO; el resto lo ve.
import { html, raw, mount, ico, toast, api } from './core.js';
import { TIPOS, CONEXIONES, tipoDe, normalizarEtapa } from './agentes-flujos.js';
import { hermesDe, toolsetsHermes } from './hermes.js';
import { CONECTORES, logoConector } from './conectores.js';

const lineas = (xs) => (xs || []).join('\n');
const deLineas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
const etiquetaTool = (t) => String(t.label || t.name).replace(/^[^\p{L}\p{N}]+/u, '').trim() || t.name;

// Grupos de nodos como Kargul (Entender · Decidir · Entregar).
const GRUPOS = [
  { label: 'Entender', tipos: ['investigacion', 'analisis'] },
  { label: 'Decidir', tipos: ['decision'] },
  { label: 'Entregar', tipos: ['entregable', 'validacion'] },
];

// Posiciones calculadas de los nodos para el lienzo (columna vertical).
let nodosPos = []; // { id, x, y, w, h }

// Se monta dentro de la pestaña Workflow del portal del agente. onGuardado(wf) avisa al portal.
export async function pintarEditor(el, me, wf, editor, onGuardado = () => {}, alive = () => el.isConnected) {
  const [tools, estCon] = await Promise.all([
    hermesDe(me) ? toolsetsHermes(me).catch(() => []) : [],
    api('conectores/estado').catch(() => null),
  ]);
  const conectado = (id) => Boolean(estCon?.conectores?.find((c) => c.id === id)?.conectado);
  let etapas = (wf.etapas || []).map((e) => ({ ...e }));
  let sel = 0, panel = 'construir', sucio = false, guardando = false;
  const ro = !editor;
  const marcar = () => { sucio = true; pinta(); };

  const tDe = (id) => tipoDe(id);

  // Calcula posiciones de nodos en columna vertical centrada.
  const calcularPos = () => {
    const W = 340;
    const gap = 120;
    let y = 40;
    nodosPos = etapas.map((e, i) => ({
      id: e.id || `et-${i}`,
      x: 24,
      y,
      w: W,
      h: 104,
      idx: i,
    }));
    y += gap;
  };
  calcularPos();

  const posDe = (id) => nodosPos.find((n) => n.id === id) || nodosPos[0];

  // SVG de línea curva entre dos nodos consecutivos.
  const svgLine = (x1, y1, x2, y2) => {
    const cx = (x1 + x2) / 2;
    return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
  };

  const conexionesSvg = () => {
    const paths = [];
    for (let i = 0; i < etapas.length - 1; i++) {
      const a = posDe(etapas[i].id || `et-${i}`);
      const b = posDe(etapas[i + 1].id || `et-${i + 1}`);
      const x1 = a.x + a.w / 2;
      const y1 = a.y + a.h;
      const x2 = b.x + b.w / 2;
      const y2 = b.y;
      paths.push(html`<path d="${svgLine(x1, y1, x2, y2)}" fill="none" stroke="var(--line)" stroke-width="2" class="wfe-conn"></path>`);
    }
    return paths;
  };

  const nodoHtml = (e, i) => {
    const t = tDe(e.tipo);
    const p = posDe(e.id || `et-${i}`);
    const seleccionado = i === sel;
    const estilo = `left:${p.x}px;top:${p.y}px`;
    return html`<div class="wfe-node ${seleccionado ? 'sel' : ''}" style="${estilo}" data-act="sel" data-i="${i}" tabindex="0" role="button" aria-label="Etapa ${i + 1}: ${e.nombre}">
      <div class="wfe-node-h">
        <span class="wfe-node-ic" style="color:var(--c,${t.color})">${ico(t.icono, 16)}</span>
        <div class="wfe-node-info">
          <div class="wfe-node-t">${t.nombre}</div>
          <div class="wfe-node-d mut xs">${e.proposito || t.sub}</div>
        </div>
        ${e.gate ? html`<span class="wfe-node-gate">🚦 CEO</span>` : ''}
        <span class="wfe-node-handle-out" data-act="handle-out" data-i="${i}" style="background:var(--c,${t.color})"></span>
      </div>
      <div class="wfe-node-b">
        <span class="wfe-node-meta">
          ${e.herramientas?.length ? html`<span>${ico('link', 11)} ${e.herramientas.length} conexión${e.herramientas.length === 1 ? '' : 'es'}</span>` : ''}
          ${e.fuentes_min ? html`<span>${ico('globe', 11)} ≥${e.fuentes_min} fuentes</span>` : ''}
          ${e.entrega?.campos?.length ? html`<span>${ico('file-text', 11)} ${e.entrega.campos.length} campos</span>` : ''}
        </span>
      </div>
      <span class="wfe-node-handle-in" data-act="handle-in" data-i="${i}"></span>
      ${ro ? '' : html`<div class="wfe-node-a">
        <button type="button" data-act="agregar-despues" data-i="${i}" aria-label="Agregar paso después">${ico('plus', 11)}</button>
        <button type="button" data-act="subir" data-i="${i}" aria-label="Subir" ${i ? '' : raw('disabled')}>${ico('arrow-up', 11)}</button>
        <button type="button" data-act="bajar" data-i="${i}" aria-label="Bajar" ${i < etapas.length - 1 ? '' : raw('disabled')}>${ico('arrow-down', 11)}</button>
        <button type="button" data-act="duplicar" data-i="${i}" aria-label="Duplicar">${ico('copy', 11)}</button>
        <button type="button" data-act="quitar" data-i="${i}" aria-label="Quitar" ${etapas.length > 1 ? '' : raw('disabled')}>${ico('x', 11)}</button>
      </div>`}
    </div>`;
  };

  const inspectorHtml = () => {
    const e = etapas[sel];
    if (!e) return '';
    const t = tDe(e.tipo);
    const dis = ro ? raw('disabled') : '';
    const campo = (k, l, v, tipo = 'input', ph = '') => html`<label class="wfe-f"><span>${l}</span>${tipo === 'textarea' ? html`<textarea class="in" rows="3" data-k="${k}" placeholder="${ph}" ${dis}>${v}</textarea>` : html`<input class="in" data-k="${k}" value="${v}" placeholder="${ph}" ${dis}>`}</label>`;
    const conTodas = [
      ...CONEXIONES.map((c) => ({ id: c.id, nombre: c.nombre, sub: c.sub })),
      ...CONECTORES.filter((c) => ['mcp', 'token'].includes(c.tipo)).map((c) => ({
        id: c.id,
        nombre: c.nombre,
        sub: conectado(c.id) ? 'Conectado · el agente usa sus herramientas' : 'Sin conectar: conéctalo en MCPs',
        logo: logoConector(c),
        on: conectado(c.id),
      })),
      ...tools.filter((t2) => !CONEXIONES.some((c) => c.id === t2.name)).map((t2) => ({
        id: t2.name,
        nombre: etiquetaTool(t2),
        sub: `${t2.enabled ? 'activo' : 'apagado'} en tu Hermes${t2.tools.length ? ` · ${t2.tools.slice(0, 3).join(', ')}` : ''}`,
      })),
    ];
    return html`<aside class="wfe-insp card">
      <div class="wfe-insp-h">
        <span class="wfe-insp-t">${t.nombre}</span>
        <div class="wfe-tabs">${[['construir', 'Construir'], ['reglas', 'Reglas'], ['conexiones', 'Conexiones']].map(([k, l]) => html`<button type="button" class="${panel === k ? 'on' : ''}" data-act="panel" data-p="${k}">${l}</button>`)}</div>
      </div>
      ${panel === 'construir'
        ? html`<div class="wfe-sec">
          <label class="wfe-f"><span>Tipo</span><select class="in" data-k="tipo" ${dis}>${TIPOS.map((t2) => html`<option value="${t2.id}" ${e.tipo === t2.id ? raw('selected') : ''}>${t2.nombre}</option>`)}</select></label>
          ${campo('nombre', 'Nombre', e.nombre)}
          ${campo('proposito', 'Propósito', e.proposito, 'textarea', '¿Qué pregunta responde esta etapa?')}
          ${campo('inputs', 'Inputs que necesita (uno por línea)', lineas(e.inputs), 'textarea')}
          ${campo('tareas', 'Tareas del agente (uno por línea)', lineas(e.tareas), 'textarea')}
          <h3 class="wfe-sec-t">Entrega</h3>
          ${campo('entrega.titulo', 'Título del resultado', e.entrega?.titulo || '', 'input', 'Ej.: Ideal Customer Profile')}
          ${campo('entrega.campos', 'Campos (uno por línea)', lineas(e.entrega?.campos), 'textarea', 'Segmento\nComprador\nDolores')}
          ${e.metodo ? html`<p class="mut xs">Método de referencia: <code>${e.metodo}</code></p>` : ''}
        </div>`
        : panel === 'reglas'
        ? html`<div class="wfe-sec">
          ${campo('criterios', 'Criterios de éxito (uno por línea)', lineas(e.criterios), 'textarea')}
          <label class="wfe-f"><span>Fuentes externas mínimas</span><input class="in" type="number" min="0" max="10" data-k="fuentes_min" value="${e.fuentes_min || 0}" ${dis}><span class="mut xs">Si no las alcanza, el resultado queda marcado «Falta evidencia».</span></label>
          <label class="wfe-chk"><input type="checkbox" data-k="gate" ${e.gate ? raw('checked') : ''} ${dis}> 🚦 Gate del CEO (solo el CEO aprueba esta etapa)</label>
          ${e.gate ? campo('nota_gate', 'Por qué es gate', e.nota_gate || '') : ''}
          <p class="mut xs">Toda etapa necesita aprobación humana (CEO o COO) para avanzar. Nada se publica ni se manda al cliente desde aquí.</p>
        </div>`
        : html`<div class="wfe-sec"><h3 class="wfe-sec-t">Conexiones y MCP</h3><p class="mut xs">Con qué investiga el agente en esta etapa. Las reales viven en Hermes (sus toolsets y MCPs); el agente las usa al correr.</p>
          ${conTodas.map((c) => html`<label class="wfe-chk"><input type="checkbox" data-con="${c.id}" ${(e.herramientas || []).includes(c.id) ? raw('checked') : ''} ${dis}>${c.logo ? html`<img class="wfe-con-logo" src="${c.logo}" alt="">` : ''}<span><b>${c.nombre}</b><span class="mut xs">${c.sub}</span></span></label>`)}
          ${hermesDe(me) ? '' : html`<p class="mut xs">Conecta Hermes en el <a href="#/chat">Chat</a> para ver tus MCPs aquí.</p>`}
          <a class="btn ghost sm" href="#/ai/mcps">${ico('puzzle', 13)} Conectar un MCP</a></div>`}
      ${!ro && e ? html`<div class="wfe-insp-foot"><button class="btn" data-act="agregar-despues" data-i="${sel}">${ico('plus', 13)} Agregar siguiente paso</button></div>` : ''}
    </aside>`;
  };

  const paletaHtml = () => {
    if (ro) return '';
    return html`<aside class="wfe-pal card"><h3 class="wfe-pal-t">Acciones</h3>
      ${GRUPOS.map((g) => html`<div class="wfe-pal-g"><span>${g.label}</span>
        ${g.tipos.map((tid) => {
          const t = tDe(tid);
          return html`<button type="button" data-act="agregar" data-t="${t.id}" style="--c:var(${t.color})">${ico(t.icono, 14)}<span><b>${t.nombre}</b><span>${t.sub}</span></span></button>`;
        })}
      </div>`)}
      ${wf.origen?.fuente ? html`<p class="mut wfe-orig">Empezó desde el método <code>${wf.origen.fuente}</code>. Ya no está conectado: editar aquí no toca el repo.</p>` : ''}
    </aside>`;
  };

  const pinta = () => {
    mount(el, html`<div class="wfe-layout">
      <div class="wfe-top">
        <p class="mut sm">${ro ? 'Solo el CEO o el COO editan el workflow.' : 'Arma las etapas del agente. Toca un nodo para configurarlo.'}${sucio ? html` <b class="wfe-sucio">· cambios sin guardar</b>` : ''}</p>
        <div class="wfe-top-a">${ro ? '' : html`<button class="btn" data-act="guardar" ${sucio && !guardando ? '' : raw('disabled')}>Guardar</button>`}</div>
      </div>
      <div class="wfe-body ${ro ? 'ro' : ''}">
        ${paletaHtml()}
        <div class="wfe-canvas-wrapper">
          <div class="wfe-canvas">
            <svg class="wfe-connections" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">${conexionesSvg()}</svg>
            <div class="wfe-nodes">${etapas.map((e, i) => nodoHtml(e, i))}</div>
          </div>
          <div class="wfe-canvas-hint mut xs sm">${etapas.length === 0 ? 'Agrega el primer paso desde Acciones.' : ''}</div>
        </div>
        ${inspectorHtml()}
      </div>
    </div>`);
  };

  const nueva = (tipo) => {
    const t = tDe(tipo);
    return normalizarEtapa({ tipo, nombre: t.nombre, herramientas: t.herramientas, fuentes_min: t.fuentes_min });
  };

  const insertarDespues = (i, etapa) => {
    etapas.splice(i + 1, 0, etapa);
    sel = i + 1;
    panel = 'construir';
    calcularPos();
    marcar();
  };

  const mapa = {
    sel: (b) => {
      sel = Number(b.dataset.i);
      calcularPos();
      pinta();
    },
    panel: (b) => { panel = b.dataset.p; pinta(); },
    subir: (b) => {
      const i = Number(b.dataset.i);
      const j = i - 1;
      if (j < 0) return;
      [etapas[i], etapas[j]] = [etapas[j], etapas[i]];
      sel = j;
      calcularPos();
      marcar();
    },
    bajar: (b) => {
      const i = Number(b.dataset.i);
      const j = i + 1;
      if (j >= etapas.length) return;
      [etapas[i], etapas[j]] = [etapas[j], etapas[i]];
      sel = j;
      calcularPos();
      marcar();
    },
    duplicar: (b) => {
      const i = Number(b.dataset.i);
      etapas.splice(i + 1, 0, normalizarEtapa({ ...etapas[i], id: '', nombre: `${etapas[i].nombre} (copia)` }));
      sel = i + 1;
      calcularPos();
      marcar();
    },
    quitar: (b) => {
      const i = Number(b.dataset.i);
      if (etapas.length < 2 || !confirm(`¿Quitar «${etapas[i].nombre}» del workflow?`)) return;
      etapas.splice(i, 1);
      sel = Math.min(sel, etapas.length - 1);
      calcularPos();
      marcar();
    },
    agregar: (b) => {
      insertarDespues(sel, nueva(b.dataset.t));
    },
    'agregar-despues': (b) => {
      const i = Number(b.dataset.i);
      insertarDespues(i, nueva(tDe(etapas[i].tipo).id));
    },
    guardar: async () => {
      guardando = true;
      pinta();
      try {
        ({ workflow: wf } = await api(`agentes/workflows/${wf.id}/guardar`, { method: 'POST', body: { etapas, v: wf.v } }));
        etapas = wf.etapas.map((e) => ({ ...e }));
        sucio = false;
        toast('Workflow guardado');
        onGuardado(wf);
      } catch (e) { toast(e.message, true); }
      guardando = false;
      if (alive()) pinta();
    },
  };

  el.onclick = (ev) => {
    const t = ev.target.closest('[data-act]');
    if (!t || !el.contains(t)) return;
    const a = t.dataset.act;
    if (a === 'handle-out' || a === 'handle-in') return; // conexiones automáticas entre pasos consecutivos
    if (mapa[a]) mapa[a](t, ev);
  };

  el.oninput = (ev) => {
    const t = ev.target;
    if (ro) return;
    const e = etapas[sel];
    if (!e) return;
    const k = t.dataset.k;
    if (k) {
      if (['inputs', 'tareas', 'criterios'].includes(k)) e[k] = deLineas(t.value);
      else if (k === 'entrega.titulo') e.entrega = { ...(e.entrega || {}), titulo: t.value };
      else if (k === 'entrega.campos') e.entrega = { ...(e.entrega || {}), campos: deLineas(t.value) };
      else if (k === 'fuentes_min') e.fuentes_min = Math.max(0, Math.min(10, Number(t.value) || 0));
      else if (k === 'gate') { e.gate = t.checked; return marcar(); }
      else if (k === 'tipo') { e.tipo = t.value; return marcar(); }
      else e[k] = t.value;
    }
    if (t.dataset.con) {
      const s = new Set(e.herramientas || []);
      t.checked ? s.add(t.dataset.con) : s.delete(t.dataset.con);
      e.herramientas = [...s];
    }
    if (!sucio) {
      sucio = true;
      el.querySelector('.wfe-top-a [data-act=guardar]')?.removeAttribute('disabled');
    }
  };
  el.onchange = (ev) => {
    const t = ev.target;
    if (t.dataset.con || t.dataset.k === 'fuentes_min') pinta();
  };
  pinta();
}
