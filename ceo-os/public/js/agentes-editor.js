// Agent Area · el editor de un workflow (#/ai/agentes/flujo/<id>), al estilo de un editor de automatizaciones:
// a la izquierda la paleta de nodos (Investigación, Análisis, Decisión, Entregable, Validación), al centro el lienzo con las
// etapas conectadas de arriba a abajo, y a la derecha el inspector del nodo (Construir · Reglas · Conexiones).
// El workflow es del OS: guardar no toca el repo. Editan CEO y COO (el servidor lo hace cumplir); el resto lo ve.
import { html, raw, mount, ico, skel, toast, api, ask } from './core.js';
import { TIPOS, CONEXIONES, tipoDe, normalizarEtapa } from './agentes-flujos.js';
import { hermesDe, toolsetsHermes } from './hermes.js';
import { nuevoRun } from './screens/agentes.js';

const lineas = (xs) => (xs || []).join('\n');
const deLineas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
const etiquetaTool = (t) => String(t.label || t.name).replace(/^[^\p{L}\p{N}]+/u, '').trim() || t.name;

export async function pintarEditor(el, me, id, alive) {
  mount(el, skel('pagina'));
  let wf, editor;
  try { ({ workflow: wf, editor } = await api('agentes/workflows/' + encodeURIComponent(id))); }
  catch (e) { if (alive()) mount(el, html`<div class="empty card">${e.message}<a class="btn ghost sm" href="#/ai/agentes">Volver</a></div>`); return; }
  if (!alive()) return;
  const tools = hermesDe(me) ? await toolsetsHermes(me).catch(() => []) : [];
  let etapas = (wf.etapas || []).map((e) => ({ ...e })), meta = { nombre: wf.nombre, agente: wf.agente || '', depto: wf.depto || '', descripcion: wf.descripcion || '', estado: wf.estado, limites: wf.limites || [] };
  let sel = 0, tab = 'workflow', panel = 'construir', sucio = false, guardando = false;
  const ro = !editor;
  const marcar = () => { sucio = true; pinta(); };

  const nodo = (e, i) => {
    const t = tipoDe(e.tipo);
    return html`<div class="wfe-node ${i === sel ? 'sel' : ''}" style="--c:var(${t.color})" data-act="sel" data-i="${i}" tabindex="0" role="button" aria-label="Etapa ${i + 1}: ${e.nombre}">
      <div class="wfe-node-h">${ico(t.icono, 14)}<span>${t.nombre}</span>${e.gate ? html`<span class="wfe-tag">🚦 CEO</span>` : ''}<span class="wfe-n">${i + 1}</span></div>
      <div class="wfe-node-b"><b>${e.nombre}</b><span>${e.proposito || t.sub}</span>
        <span class="wfe-meta">${e.herramientas?.length ? html`<span>${ico('link', 11)} ${e.herramientas.length} conexión${e.herramientas.length === 1 ? '' : 'es'}</span>` : ''}${e.fuentes_min ? html`<span>${ico('globe', 11)} ≥${e.fuentes_min} fuentes</span>` : ''}${e.entrega?.campos?.length ? html`<span>${ico('file-text', 11)} ${e.entrega.campos.length} campos</span>` : ''}</span></div>
      ${ro ? '' : html`<div class="wfe-node-a"><button type="button" data-act="subir" data-i="${i}" aria-label="Subir" ${i ? '' : raw('disabled')}>${ico('arrow-up', 12)}</button><button type="button" data-act="bajar" data-i="${i}" aria-label="Bajar" ${i < etapas.length - 1 ? '' : raw('disabled')}>${ico('arrow-down', 12)}</button><button type="button" data-act="duplicar" data-i="${i}" aria-label="Duplicar">${ico('copy', 12)}</button><button type="button" data-act="quitar" data-i="${i}" aria-label="Quitar" ${etapas.length > 1 ? '' : raw('disabled')}>${ico('x', 12)}</button></div>`}
    </div>`;
  };
  const insertar = (i) => (ro ? html`<span class="wfe-edge"></span>` : html`<span class="wfe-edge"><button type="button" class="wfe-plus" data-act="insertar" data-i="${i}" aria-label="Agregar etapa aquí">${ico('plus', 12)}</button></span>`);

  const inspector = () => {
    const e = etapas[sel]; if (!e) return '';
    const dis = ro ? raw('disabled') : '';
    const campo = (k, l, v, t = 'input', ph = '') => html`<label class="wfe-f"><span>${l}</span>${t === 'textarea' ? html`<textarea class="in" rows="3" data-k="${k}" placeholder="${ph}" ${dis}>${v}</textarea>` : html`<input class="in" data-k="${k}" value="${v}" placeholder="${ph}" ${dis}>`}</label>`;
    const conTodas = [...CONEXIONES.map((c) => ({ id: c.id, nombre: c.nombre, sub: c.sub })), ...tools.filter((t) => !CONEXIONES.some((c) => c.id === t.name)).map((t) => ({ id: t.name, nombre: etiquetaTool(t), sub: `${t.enabled ? 'activo' : 'apagado'} en tu Hermes${t.tools.length ? ` · ${t.tools.slice(0, 3).join(', ')}` : ''}` }))];
    return html`<aside class="wfe-insp card">
      <div class="wfe-tabs">${[['construir', 'Construir'], ['reglas', 'Reglas'], ['conexiones', 'Conexiones']].map(([k, l]) => html`<button type="button" class="${panel === k ? 'on' : ''}" data-act="panel" data-p="${k}">${l}</button>`)}</div>
      ${panel === 'construir' ? html`<div class="wfe-sec"><h3>Detalles</h3>
          <label class="wfe-f"><span>Tipo</span><select class="in" data-k="tipo" ${dis}>${TIPOS.map((t) => html`<option value="${t.id}" ${e.tipo === t.id ? raw('selected') : ''}>${t.nombre}</option>`)}</select></label>
          ${campo('nombre', 'Nombre', e.nombre)}
          ${campo('proposito', 'Propósito', e.proposito, 'textarea', '¿Qué pregunta responde esta etapa?')}
          ${campo('inputs', 'Inputs que necesita (uno por línea)', lineas(e.inputs), 'textarea')}
          ${campo('tareas', 'Tareas del agente (una por línea)', lineas(e.tareas), 'textarea')}
          <h3>Entrega</h3>
          ${campo('entrega.titulo', 'Título del resultado', e.entrega?.titulo || '', 'input', 'Ej.: Ideal Customer Profile')}
          ${campo('entrega.campos', 'Campos (uno por línea)', lineas(e.entrega?.campos), 'textarea', 'Segmento\nComprador\nDolores')}
          ${e.metodo ? html`<p class="mut xs">Método de referencia: <code>${e.metodo}</code></p>` : ''}</div>`
      : panel === 'reglas' ? html`<div class="wfe-sec"><h3>Reglas</h3>
          ${campo('criterios', 'Criterios de éxito (uno por línea)', lineas(e.criterios), 'textarea')}
          <label class="wfe-f"><span>Fuentes externas mínimas</span><input class="in" type="number" min="0" max="10" data-k="fuentes_min" value="${e.fuentes_min || 0}" ${dis}><span class="mut xs">Si no las alcanza, el resultado queda marcado «Falta evidencia».</span></label>
          <label class="wfe-chk"><input type="checkbox" data-k="gate" ${e.gate ? raw('checked') : ''} ${dis}> 🚦 Gate del CEO (solo el CEO aprueba esta etapa)</label>
          ${e.gate ? campo('nota_gate', 'Por qué es gate', e.nota_gate || '') : ''}
          <p class="mut xs">Toda etapa necesita aprobación humana (CEO o COO) para avanzar. Nada se publica ni se manda al cliente desde aquí.</p></div>`
      : html`<div class="wfe-sec"><h3>Conexiones y MCP</h3><p class="mut xs">Con qué investiga el agente en esta etapa. Las reales viven en Hermes (sus toolsets y MCPs); el agente las usa al correr.</p>
          ${conTodas.map((c) => html`<label class="wfe-chk"><input type="checkbox" data-con="${c.id}" ${(e.herramientas || []).includes(c.id) ? raw('checked') : ''} ${dis}><span><b>${c.nombre}</b><span class="mut xs">${c.sub}</span></span></label>`)}
          ${hermesDe(me) ? '' : html`<p class="mut xs">Conecta Hermes en el <a href="#/chat">Chat</a> para ver tus MCPs aquí.</p>`}
          <a class="btn ghost sm" href="#/ai/mcps">${ico('puzzle', 13)} Conectar un MCP</a></div>`}
    </aside>`;
  };

  const pinta = () => {
    const y = el.querySelector('.wfe-canvas')?.scrollTop || 0;
    mount(el, html`<div class="wfe">
      <header class="wfe-top">
        <nav class="wfe-crumb"><a href="#/ai/agentes">Agent Area</a>${ico('chevron-right', 12)}<b>${meta.nombre}</b><span class="chip sm2 ${meta.estado === 'activo' ? 'ok' : ''}">${meta.estado === 'activo' ? 'Activo' : 'Borrador'}</span>${sucio ? html`<span class="mut xs">· cambios sin guardar</span>` : ''}</nav>
        <div class="wfe-top-a">
          <button class="btn ghost sm" data-act="conexiones">${ico('puzzle', 13)} Conexiones</button>
          ${ro ? '' : html`<button class="btn ghost sm" data-act="guardar" ${sucio && !guardando ? '' : raw('disabled')}>Guardar</button>`}
          <button class="btn sm" data-act="run">${ico('play', 13)} Iniciar run</button>
        </div>
      </header>
      <nav class="wfe-vtabs">${[['workflow', 'Workflow'], ['ajustes', 'Ajustes']].map(([k, l]) => html`<button type="button" class="${tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`)}</nav>
      ${tab === 'workflow' ? html`<div class="wfe-body ${ro ? 'ro' : ''}">
        ${ro ? '' : html`<aside class="wfe-pal card"><h3>Acciones</h3>${['Entender', 'Decidir', 'Entregar'].map((g) => html`<div class="wfe-pal-g"><span>${g}</span>${TIPOS.filter((t) => t.grupo === g).map((t) => html`<button type="button" data-act="agregar" data-t="${t.id}" style="--c:var(${t.color})">${ico(t.icono, 14)}<span><b>${t.nombre}</b><span>${t.sub}</span></span></button>`)}</div>`)}
          ${wf.origen?.fuente ? html`<p class="mut xs wfe-orig">Importado de <code>${wf.origen.fuente}</code>. Ya no está conectado: editar aquí no toca el repo.</p>` : ''}</aside>`}
        <div class="wfe-canvas">${etapas.map((e, i) => html`${i ? insertar(i) : ''}${nodo(e, i)}`)}${ro ? '' : html`${insertar(etapas.length)}`}<div class="wfe-end">${ico('check', 12)} Entrega aprobada</div></div>
        ${inspector()}</div>`
      : html`<div class="card wfe-ajustes"><div class="wfe-sec">
          <label class="wfe-f"><span>Nombre</span><input class="in" data-m="nombre" value="${meta.nombre}" ${ro ? raw('disabled') : ''}></label>
          <label class="wfe-f"><span>Agente</span><input class="in" data-m="agente" value="${meta.agente}" placeholder="Ej.: Strategy" ${ro ? raw('disabled') : ''}></label>
          <label class="wfe-f"><span>Departamento</span><input class="in" data-m="depto" value="${meta.depto}" ${ro ? raw('disabled') : ''}></label>
          <label class="wfe-f"><span>Qué hace</span><textarea class="in" rows="3" data-m="descripcion" ${ro ? raw('disabled') : ''}>${meta.descripcion}</textarea></label>
          <label class="wfe-f"><span>Lo que NO hace (uno por línea)</span><textarea class="in" rows="4" data-m="limites" ${ro ? raw('disabled') : ''}>${lineas(meta.limites)}</textarea></label>
          <label class="wfe-f"><span>Estado</span><select class="in" data-m="estado" ${ro ? raw('disabled') : ''}><option value="borrador" ${meta.estado !== 'activo' ? raw('selected') : ''}>Borrador</option><option value="activo" ${meta.estado === 'activo' ? raw('selected') : ''}>Activo</option></select></label>
          ${ro ? '' : html`<div class="wfe-row"><button class="btn ghost sm" data-act="duplicar-wf">${ico('copy', 13)} Duplicar workflow</button><button class="btn ghost sm" data-act="archivar-wf">Archivar</button></div>`}
        </div></div>`}
    </div>`);
    const c = el.querySelector('.wfe-canvas'); if (c) c.scrollTop = y;
  };

  const mover = (i, d) => { const j = i + d; if (j < 0 || j >= etapas.length) return; [etapas[i], etapas[j]] = [etapas[j], etapas[i]]; sel = j; marcar(); };
  const nueva = (tipo) => { const t = tipoDe(tipo); return normalizarEtapa({ tipo, nombre: t.nombre, herramientas: t.herramientas, fuentes_min: t.fuentes_min }); };
  let insertarEn = null;
  const mapa = {
    sel: (b) => { sel = Number(b.dataset.i); pinta(); },
    panel: (b) => { panel = b.dataset.p; pinta(); },
    tab: (b) => { tab = b.dataset.t; pinta(); },
    subir: (b) => mover(Number(b.dataset.i), -1),
    bajar: (b) => mover(Number(b.dataset.i), 1),
    duplicar: (b) => { const i = Number(b.dataset.i); etapas.splice(i + 1, 0, normalizarEtapa({ ...etapas[i], id: '', nombre: `${etapas[i].nombre} (copia)` })); sel = i + 1; marcar(); },
    quitar: (b) => { const i = Number(b.dataset.i); if (etapas.length < 2 || !confirm(`¿Quitar «${etapas[i].nombre}» del workflow?`)) return; etapas.splice(i, 1); sel = Math.min(sel, etapas.length - 1); marcar(); },
    insertar: (b) => { insertarEn = Number(b.dataset.i); toast('Elige el tipo de etapa en Acciones'); el.querySelector('.wfe-pal')?.classList.add('pide'); },
    agregar: (b) => { const i = insertarEn ?? sel + 1; etapas.splice(i, 0, nueva(b.dataset.t)); sel = i; insertarEn = null; panel = 'construir'; marcar(); },
    conexiones: () => { tab = 'workflow'; panel = 'conexiones'; pinta(); },
    run: async () => { if (sucio && !ro) await mapa.guardar(); const { items } = await api('agentes/workflows'); nuevoRun(me, items, wf.id); },
    guardar: async () => {
      guardando = true; pinta();
      try { ({ workflow: wf } = await api(`agentes/workflows/${wf.id}/guardar`, { method: 'POST', body: { ...meta, etapas, v: wf.v } })); etapas = wf.etapas.map((e) => ({ ...e })); sucio = false; toast('Workflow guardado'); }
      catch (e) { toast(e.message, true); }
      guardando = false; if (alive()) pinta();
    },
    'duplicar-wf': async () => { try { const { workflow } = await api('agentes/workflows', { method: 'POST', body: { desde: wf.id } }); location.hash = '#/ai/agentes/flujo/' + workflow.id; } catch (e) { toast(e.message, true); } },
    'archivar-wf': async () => { if (!confirm('¿Archivar este workflow? Nada se borra y sus runs siguen.')) return; try { await api(`agentes/workflows/${wf.id}/archivar`, { method: 'POST', body: { archivado: true } }); location.hash = '#/ai/agentes'; } catch (e) { toast(e.message, true); } },
  };
  el.onclick = (ev) => { const t = ev.target.closest('[data-act]'); if (t && el.contains(t)) mapa[t.dataset.act]?.(t, ev); };
  el.onkeydown = (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.wfe-node')) { ev.preventDefault(); mapa.sel(ev.target); } };
  el.oninput = (ev) => {
    const t = ev.target; if (ro) return;
    if (t.dataset.m) { meta[t.dataset.m] = t.dataset.m === 'limites' ? deLineas(t.value) : t.value; sucio = true; el.querySelector('.wfe-top-a [data-act=guardar]')?.removeAttribute('disabled'); return; }
    const e = etapas[sel]; if (!e) return;
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
    if (t.dataset.con) { const s = new Set(e.herramientas || []); t.checked ? s.add(t.dataset.con) : s.delete(t.dataset.con); e.herramientas = [...s]; }
    if (!sucio) { sucio = true; el.querySelector('.wfe-top-a [data-act=guardar]')?.removeAttribute('disabled'); }
    // Refresca solo el nodo (sin re-pintar el inspector, para no perder el foco al escribir).
    const n = el.querySelector(`.wfe-node[data-i="${sel}"] .wfe-node-b b`); if (n && k === 'nombre') n.textContent = e.nombre;
  };
  el.onchange = (ev) => { const t = ev.target; if (t.dataset.con || t.dataset.k === 'fuentes_min' || t.dataset.m === 'estado') pinta(); };
  pinta();
}
