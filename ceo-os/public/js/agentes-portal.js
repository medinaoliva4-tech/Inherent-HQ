// Agent Area · el portal de un agente (#/ai/agentes/<agente>[/<pestaña>]), al estilo de un editor de automatizaciones:
// arriba la ruta (Agents › Área › Agente) con su estado y «Nuevo trabajo»; debajo las pestañas Overview · Workflow ·
// Trabajos · Settings. Settings se guarda solo (con su v: si alguien lo cambió, el 409 avisa).
import { html, raw, mount, ico, skel, toast, api } from './core.js';
import { AREAS_AGENTE, ESTADOS_AGENTE, CONEXIONES, tipoDe, ESTADOS } from './agentes-flujos.js';
import { areaNombre, colorArea, chipEstado, rutaAgente, rutaTrabajo, nuevoTrabajo, cadena } from './agentes-ui.js';
import { pintarEditor } from './agentes-editor.js';
import { iaDeUso, proveedorDe } from './ia-proveedores.js';

const TABS = [['overview', 'Resumen'], ['workflow', 'Flujo'], ['trabajos', 'Trabajos'], ['settings', 'Configuración']];
const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

export async function pintarPortal(el, me, id, tab, alive) {
  mount(el, skel('pagina'));
  let wf, editor, trabajos, ia;
  try {
    [{ workflow: wf, editor }, { items: trabajos }, ia] = await Promise.all([api('agentes/workflows/' + encodeURIComponent(id)), api('agentes/runs?agente=' + encodeURIComponent(id)), api('ia/estado').catch(() => null)]);
  } catch (e) { if (alive()) mount(el, html`<div class="empty card">${e.message}<a class="btn ghost sm" href="#/ai/agentes">Volver a Agentes</a></div>`); return; }
  if (!alive()) return;
  if (!TABS.some(([k]) => k === tab)) tab = 'overview';

  const resumen = () => ({ id: wf.id, nombre: wf.nombre });
  const iaTexto = () => {
    const p = wf.ia?.proveedor ? { proveedor: wf.ia.proveedor, modelo: wf.ia.modelo } : iaDeUso(ia, 'agents');
    return p?.proveedor ? `${proveedorDe(p.proveedor)?.nombre || p.proveedor}${p.modelo ? ` · ${p.modelo}` : ''}${wf.ia?.proveedor ? '' : ' (la de Ajustes)'}` : 'Sin IA configurada';
  };

  const cabeza = () => html`<header class="agp-top">
      <nav class="wfe-crumb"><a href="#/ai/agentes">Agentes</a>${ico('chevron-right', 12)}<a href="#/areas/${wf.area || 'strategy'}/agents">${areaNombre(wf.area)}</a>${ico('chevron-right', 12)}<b>${wf.nombre}</b>${chipEstado(wf.estado)}</nav>
      <button class="btn sm" data-act="trabajo" ${wf.estado === 'pausado' ? raw('disabled title="El agente está en pausa"') : ''}>${ico('play', 13)} Nuevo trabajo</button></header>
    <nav class="wfe-vtabs agp-tabs">${TABS.map(([k, l]) => html`<a href="${rutaAgente(wf.id, k === 'overview' ? '' : k)}" class="${tab === k ? 'on' : ''}">${l}</a>`)}</nav>`;

  const filaTrabajo = (t) => {
    const hechas = t.etapas.filter((e) => e.estado === 'aprobada').length, act = t.etapas[t.activa];
    const espera = !t.completo && act?.estado === 'revision';
    return html`<a class="agp-job" href="${rutaTrabajo(wf.id, t.id)}"><span class="agp-job-t"><b>${t.titulo}</b><span class="mut sm">${t.cliente_nombre || t.cliente || 'Inherent'} · ${cuando(t.actualizado)}</span></span>
      <span class="ag-run-bar" title="${hechas} de ${t.etapas.length}">${t.etapas.map((e) => html`<i class="${e.estado}"></i>`)}</span>
      <span class="chip sm2 ${t.completo ? 'ok' : espera ? 'warn' : ''}">${t.completo ? 'Completo' : t.pausado ? 'En pausa' : espera ? 'Esperando aprobación' : act ? `${ESTADOS[act.estado] || ''} · ${act.nombre}` : ''}</span></a>`;
  };

  const overview = () => {
    const activos = trabajos.filter((t) => !t.completo), esperan = activos.filter((t) => t.etapas[t.activa]?.estado === 'revision'), listos = trabajos.filter((t) => t.completo);
    const cons = [...new Set(wf.etapas.flatMap((e) => e.herramientas || []))].map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || h);
    return html`<div class="agp-ov">
      <div class="agp-h"><span class="agx-av big" style="--c:var(${colorArea(wf.area)})">${ico('agents', 20)}</span><div><h1>${wf.nombre}</h1><p class="mut">${wf.objetivo || wf.descripcion || 'Sin objetivo todavía: agrégalo en Configuración.'}</p></div></div>
      <div class="agp-stats">
        <div class="card agp-stat"><span class="agp-stat-h">${ico('loader-circle', 15)} En curso</span><b>${activos.length}</b><span class="mut sm">trabajos</span></div>
        <div class="card agp-stat"><span class="agp-stat-h">${ico('triangle-alert', 15)} Esperando tu aprobación</span><b>${esperan.length}</b><span class="mut sm">etapas por revisar</span></div>
        <div class="card agp-stat"><span class="agp-stat-h">${ico('check', 15)} Completados</span><b>${listos.length}</b><span class="mut sm">trabajos</span></div>
      </div>
      <div class="agp-grid">
        <section class="card agp-card"><div class="agp-card-h">${ico('layers', 15)}<b>Trabajos recientes</b><a class="btn ghost xs" href="${rutaAgente(wf.id, 'trabajos')}">Ver todos</a></div>
          ${trabajos.length ? trabajos.slice(0, 5).map(filaTrabajo) : html`<div class="agp-vacio"><p class="mut sm">Todavía no hay trabajos. Encárgale el primero.</p><button class="btn sm" data-act="trabajo">${ico('play', 13)} Nuevo trabajo</button></div>`}</section>
        <section class="card agp-card"><div class="agp-card-h">${ico('git-branch', 15)}<b>Cómo trabaja</b><a class="btn ghost xs" href="${rutaAgente(wf.id, 'workflow')}">Workflow</a></div>
          ${cadena(wf.etapas)}
          <ol class="agp-steps">${wf.etapas.map((e) => html`<li><span class="ag-n">${tipoDe(e.tipo).nombre}</span>${e.nombre}${e.gate ? ' 🚦' : ''}</li>`)}</ol>
          <p class="mut sm">${ico('layers', 12)} Este flujo define cómo trabaja el agente. Cada trabajo (run) que le encargues ejecuta estas etapas, una a una, y tú apruebas cada una antes de seguir.</p>
          <div class="agp-kv"><span class="mut sm">IA</span><a href="${wf.ia?.proveedor ? rutaAgente(wf.id, 'settings') : '#/ajustes/ia'}">${iaTexto()}</a></div>
          <div class="agp-kv"><span class="mut sm">Conexiones</span><span>${cons.length ? cons.join(' · ') : 'Ninguna'}</span></div></section>
      </div></div>`;
  };

  const settings = () => {
    const dis = editor ? '' : raw('disabled');
    const conectados = (ia?.proveedores || []).filter((p) => p.conectado);
    return html`<div class="agp-set">
      <div class="agp-set-h"><div><h1>Configuración</h1><p class="mut">Cómo se llama, qué busca, en qué área vive y con qué IA trabaja.</p></div><span class="agp-auto sm"><i></i> ${editor ? 'Los cambios se guardan solos' : 'Solo el CEO o el COO lo editan'}</span></div>
      <section class="card agp-sec"><div class="agp-sec-h"><span class="agp-sec-ic">${ico('agents', 16)}</span><div><b>General</b><span class="mut sm">Nombre, objetivo y si está trabajando.</span></div></div>
        <div class="agp-f2"><label class="wfe-f"><span>Nombre</span><input class="in" data-s="nombre" value="${wf.nombre}" ${dis}></label>
          <label class="wfe-f"><span>Objetivo</span><input class="in" data-s="objetivo" value="${wf.objetivo || ''}" placeholder="Ej.: Entregar la estrategia de crecimiento aprobada" ${dis}></label></div>
        <label class="wfe-f"><span>Descripción</span><textarea class="in" rows="3" data-s="descripcion" ${dis}>${wf.descripcion || ''}</textarea></label>
        <div class="agp-f2"><label class="wfe-f"><span>Área</span><select class="in" data-s="area" ${dis}>${AREAS_AGENTE.map(([k, n]) => html`<option value="${k}" ${wf.area === k ? raw('selected') : ''}>${n}</option>`)}</select></label>
          <div class="wfe-f"><span>Estado</span><div class="agp-seg">${ESTADOS_AGENTE.map(([k, n]) => html`<button type="button" data-act="estado" data-e="${k}" class="${wf.estado === k ? 'on' : ''}" ${dis}>${n}</button>`)}</div></div></div></section>
      <section class="card agp-sec"><div class="agp-sec-h"><span class="agp-sec-ic">${ico('sparkles', 16)}</span><div><b>IA</b><span class="mut sm">Por defecto usa la «IA para Agents» de Ajustes. Aquí puedes darle una propia.</span></div></div>
        <label class="wfe-f"><span>Con qué IA trabaja</span><select class="in" data-s="ia" ${dis}>
          <option value="">La de Ajustes · ${(() => { const d = iaDeUso(ia, 'agents'); return d?.proveedor ? `${proveedorDe(d.proveedor)?.nombre || d.proveedor}${d.modelo ? ` · ${d.modelo}` : ''}` : 'sin configurar'; })()}</option>
          ${conectados.map((p) => html`<optgroup label="${proveedorDe(p.id)?.nombre || p.id}">${(p.modelos || []).slice(0, 60).map((m) => html`<option value="${p.id}|${m}" ${wf.ia?.proveedor === p.id && wf.ia?.modelo === m ? raw('selected') : ''}>${m}</option>`)}</optgroup>`)}
        </select></label>
        <a class="btn ghost sm" href="#/ajustes/ia">${ico('settings', 13)} Conectar otra IA en Ajustes</a></section>
      <section class="card agp-sec"><div class="agp-sec-h"><span class="agp-sec-ic">${ico('triangle-alert', 16)}</span><div><b>Límites</b><span class="mut sm">Lo que este agente nunca hace. Viaja en cada pedido a la IA.</span></div></div>
        <label class="wfe-f"><span>Uno por línea</span><textarea class="in" rows="4" data-s="limites" ${dis}>${(wf.limites || []).join('\n')}</textarea></label></section>
      ${editor ? html`<div class="wfe-row"><button class="btn ghost sm" data-act="duplicar">${ico('copy', 13)} Duplicar agente</button><button class="btn ghost sm" data-act="archivar">Archivar agente</button></div>` : ''}
    </div>`;
  };

  const pinta = async () => {
    if (tab === 'workflow') {
      mount(el, html`${cabeza()}<div class="agp-wf"></div>`);
      return pintarEditor(el.querySelector('.agp-wf'), me, wf, editor, (nuevo) => { wf = nuevo; });
    }
    mount(el, html`${cabeza()}${tab === 'overview' ? overview() : tab === 'settings' ? settings() : html`<section class="card agp-card agp-jobs"><div class="agp-card-h"><b>Trabajos</b><span class="mut sm">${trabajos.length}</span></div>${trabajos.length ? trabajos.map(filaTrabajo) : html`<div class="agp-vacio"><p class="mut sm">Sin trabajos todavía.</p><button class="btn sm" data-act="trabajo">${ico('play', 13)} Nuevo trabajo</button></div>`}</section>`}`);
  };

  // Settings: guarda solo, medio segundo después de dejar de escribir.
  let t = null, pendiente = {};
  const guardar = (cambio, ya = false) => {
    Object.assign(pendiente, cambio); clearTimeout(t);
    const ir = async () => {
      const body = { ...pendiente, v: wf.v }; pendiente = {};
      try { ({ workflow: wf } = await api(`agentes/workflows/${wf.id}/guardar`, { method: 'POST', body })); el.querySelector('.agp-auto')?.classList.add('ok'); setTimeout(() => el.querySelector('.agp-auto')?.classList.remove('ok'), 1200); }
      catch (e) { toast(e.message, true); }
    };
    if (ya) ir(); else t = setTimeout(ir, 600);
  };
  el.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b || !el.contains(b) || b.closest('.agp-wf')) return;
    const a = b.dataset.act;
    if (a === 'trabajo') return nuevoTrabajo(me, resumen());
    if (a === 'estado') { wf.estado = b.dataset.e; guardar({ estado: wf.estado }, true); el.querySelectorAll('.agp-seg button').forEach((x) => x.classList.toggle('on', x === b)); el.querySelector('.agp-top .agx-est')?.replaceWith(Object.assign(document.createElement('span'), { className: `agx-est ${wf.estado}`, textContent: ESTADOS_AGENTE.find(([k]) => k === wf.estado)[1] })); return; }
    if (a === 'duplicar') { try { const { workflow } = await api('agentes/workflows', { method: 'POST', body: { desde: wf.id } }); location.hash = rutaAgente(workflow.id, 'settings'); } catch (e) { toast(e.message, true); } return; }
    if (a === 'archivar') { if (!confirm('¿Archivar este agente? Nada se borra y sus trabajos siguen.')) return; try { await api(`agentes/workflows/${wf.id}/archivar`, { method: 'POST', body: { archivado: true } }); location.hash = '#/ai/agentes'; } catch (e) { toast(e.message, true); } }
  });
  el.addEventListener('input', (ev) => {
    const k = ev.target.dataset.s; if (!k || !editor) return;
    const v = ev.target.value;
    if (k === 'limites') return guardar({ limites: v.split('\n').map((x) => x.trim()).filter(Boolean) });
    if (k === 'ia') { const [proveedor, ...m] = v.split('|'); wf.ia = { proveedor: proveedor || '', modelo: m.join('|') }; return guardar({ ia: wf.ia }, true); }
    if (k === 'area') { wf.area = v; return guardar({ area: v }, true); }
    wf[k] = v; guardar({ [k]: v });
  });
  pinta();
}
