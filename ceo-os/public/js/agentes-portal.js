// Agent Area · el portal de un agente (#/ai/agentes/<agente>[/<pestaña>]), al estilo del editor de Kargul:
//   arriba la ruta (Agentes › Área), el nombre con su estado, qué hace y «Nuevo trabajo»; debajo las pestañas
//   Resumen · Flujo · Trabajos · Configuración.
//   · Resumen: qué hace, lo que espera tu aprobación, sus etapas en orden (paso 1 → paso N), los trabajos recientes y su ficha.
//   · Flujo: el editor (agentes-editor.js).
//   · Trabajos: todos sus trabajos, filtrables, con el avance de cada uno.
//   · Configuración: secciones con su explicación a la izquierda y los campos a la derecha. Se guarda sola (con su v: si
//     alguien lo cambió, el 409 avisa).
import { html, raw, mount, ico, skel, toast, api, confirmAsk } from './core.js';
import { AREAS_AGENTE, ESTADOS_AGENTE, CONEXIONES, tipoDe, ESTADOS } from './agentes-flujos.js';
import { areaNombre, colorArea, chipEstado, rutaAgente, rutaTrabajo, nuevoTrabajo } from './agentes-ui.js';
import { pintarEditor } from './agentes-editor.js';
import { pintarMemoria } from './agentes-memoria.js';
import { iaDeUso, proveedorDe } from './ia-proveedores.js';
import { CONECTORES, logoConector } from './conectores.js';
import { fallo } from './visual.js';

const TABS = [['overview', 'Resumen'], ['workflow', 'Flujo'], ['trabajos', 'Trabajos'], ['settings', 'Configuración']];
const cuando = (iso) => (iso ? new Date(iso).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const AYUDA_ESTADO = { borrador: 'Lo estás armando. Ya se puede probar con un trabajo, pero todavía no está listo para el equipo.', activo: 'Listo para trabajar: el equipo le puede encargar trabajos.', pausado: 'No acepta trabajos nuevos. Los que ya tiene siguen donde estaban.' };

export async function pintarPortal(el, me, id, tab, alive) {
  mount(el, skel('pagina'));
  let wf, editor, trabajos, ia;
  try {
    [{ workflow: wf, editor }, { items: trabajos }, ia] = await Promise.all([api('agentes/workflows/' + encodeURIComponent(id)), api('agentes/runs?agente=' + encodeURIComponent(id)), api('ia/estado').catch(() => null)]);
  } catch (e) { if (alive()) mount(el, html`${fallo({ titulo: 'No pude abrir este agente', linea: e.message, boton: { texto: 'Volver a Agentes', href: '#/ai/agentes' } })}`); return; }
  if (!alive()) return;
  if (!TABS.some(([k]) => k === tab)) tab = 'overview';
  let filtro = '';

  const resumen = () => ({ id: wf.id, nombre: wf.nombre });
  const iaDe = () => (wf.ia?.proveedor ? { ...wf.ia, propia: true } : iaDeUso(ia, 'agents'));
  const iaTexto = () => { const p = iaDe(); return p?.proveedor ? `${proveedorDe(p.proveedor)?.nombre || p.proveedor}${p.modelo ? ` · ${p.modelo}` : ''}` : 'Sin IA configurada'; };
  const estadoTrabajo = (t) => {
    const act = t.etapas[t.activa], espera = !t.completo && act?.estado === 'revision';
    return t.completo ? ['ok', 'Completo'] : t.pausado ? ['', 'En pausa'] : espera ? ['warn', 'Por aprobar'] : ['now', act ? (ESTADOS[act.estado] || 'En curso') : 'En curso'];
  };
  const grupoDe = (t) => { const [k] = estadoTrabajo(t); return k === 'ok' ? 'completos' : k === 'warn' ? 'aprobar' : 'curso'; };

  const cabeza = () => html`<header class="agp-top">
      <div class="agp-id">
        <nav class="agp-crumb" aria-label="Ruta"><a href="#/ai/agentes">Agentes</a>${ico('chevron-right', 12)}<a href="#/areas/${wf.area || 'strategy'}/agents">${areaNombre(wf.area)}</a></nav>
        <div class="agp-name"><span class="agx-av" style="--c:var(${colorArea(wf.area)})">${(wf.nombre || '?').slice(0, 1)}</span><h1>${wf.nombre}</h1>${chipEstado(wf.estado)}</div>
      </div>
      <button class="btn" data-act="trabajo" ${wf.estado === 'pausado' ? raw('disabled title="El agente está en pausa"') : ''}>${ico('play', 13)} Nuevo trabajo</button></header>
    <nav class="tabs" aria-label="Secciones del agente">${TABS.map(([k, l]) => html`<a href="${rutaAgente(wf.id, k === 'overview' ? '' : k)}" class="${tab === k ? 'on' : ''}" ${tab === k ? raw('aria-current="page"') : ''}>${l}</a>`)}</nav>`;

  const filaTrabajo = (t) => {
    const hechas = t.etapas.filter((e) => e.estado === 'aprobada').length, act = t.etapas[t.activa], [k, txt] = estadoTrabajo(t);
    return html`<a class="agp-job" href="${rutaTrabajo(wf.id, t.id)}">
      <span class="agp-job-t"><b>${t.titulo}</b><small>${t.cliente_nombre || t.cliente || 'Inherent'}</small></span>
      <span class="agp-prog"><span class="ag-run-bar">${t.etapas.map((e) => html`<i class="${e.estado}"></i>`)}</span><small>${hechas} de ${t.etapas.length}</small></span>
      <span class="agp-job-e">${t.completo ? '—' : act ? html`<small>Paso ${t.activa + 1}</small> ${act.nombre}` : ''}</span>
      <span><span class="agp-st ${k}">${txt}</span></span>
      <span class="mut sm">${cuando(t.actualizado)}</span></a>`;
  };
  const vacioTrabajos = (txt) => html`<div class="agp-vacio"><span class="agp-vacio-ic">${ico('play', 16)}</span><b>${txt}</b><span class="mut sm">Un trabajo es un encargo concreto: el agente recorre sus ${wf.etapas.length} etapas y tú apruebas cada una.</span><button class="btn" data-act="trabajo">${ico('play', 13)} Nuevo trabajo</button></div>`;

  // ---------- Resumen ----------
  const overview = () => {
    const activos = trabajos.filter((t) => !t.completo), esperan = activos.filter((t) => grupoDe(t) === 'aprobar'), listos = trabajos.filter((t) => t.completo);
    const ids = [...new Set(wf.etapas.flatMap((e) => e.herramientas || []))];
    const cons = ids.map((h) => { const c = CONECTORES.find((x) => x.id === h); return { nombre: c?.nombre || CONEXIONES.find((x) => x.id === h)?.nombre || h, logo: c ? logoConector(c) : '' }; });
    const ia1 = iaDe();
    return html`<div class="agp-ov">
      <section class="agp-what"><p class="agp-obj">${wf.objetivo || wf.descripcion || html`<span class="mut">Todavía no dice qué hace. ${editor ? html`<a href="${rutaAgente(wf.id, 'settings')}">Escríbelo en Configuración</a>.` : ''}</span>`}</p>
        ${wf.objetivo && wf.descripcion && wf.descripcion.trim() !== wf.objetivo.trim() ? html`<p class="mut sm">${wf.descripcion}</p>` : ''}</section>
      <div class="agp-kpis">
        <a class="agp-kpi ${esperan.length ? 'warn' : ''}" href="${rutaAgente(wf.id, 'trabajos')}"><span>Por aprobar</span><b>${esperan.length}</b><small>${esperan.length ? 'Te esperan para seguir' : 'Nada pendiente'}</small></a>
        <a class="agp-kpi" href="${rutaAgente(wf.id, 'trabajos')}"><span>En curso</span><b>${activos.length - esperan.length}</b><small>trabajando</small></a>
        <a class="agp-kpi" href="${rutaAgente(wf.id, 'trabajos')}"><span>Completados</span><b>${listos.length}</b><small>trabajos</small></a>
      </div>
      <section class="agp-card">
        <div class="agp-card-h"><div><b>Cómo trabaja</b><small>Cada trabajo recorre estas etapas en orden. Tú apruebas cada una antes de pasar a la siguiente.</small></div><a class="btn ghost" href="${rutaAgente(wf.id, 'workflow')}">${editor ? 'Editar flujo' : 'Ver flujo'}</a></div>
        <ol class="agp-steps">${wf.etapas.map((e, i) => { const t = tipoDe(e.tipo); return html`<li data-tt="${t.id}"><a href="${rutaAgente(wf.id, 'workflow')}">
          <span class="agp-step-n">${i + 1}</span><span class="agp-step-k">${ico(t.icono, 12)} ${t.nombre}</span><b>${e.nombre}</b>
          ${e.gate ? html`<span class="kf-gate">${ico('lock', 10)} Aprueba el CEO</span>` : ''}</a></li>`; })}</ol>
      </section>
      <div class="agp-grid">
        <section class="agp-card"><div class="agp-card-h"><div><b>Trabajos recientes</b></div>${trabajos.length ? html`<a class="btn ghost" href="${rutaAgente(wf.id, 'trabajos')}">Ver todos</a>` : ''}</div>
          ${trabajos.length ? html`<div class="agp-jobs mini">${trabajos.slice(0, 5).map(filaTrabajo)}</div>` : vacioTrabajos('Todavía no le encargas nada')}</section>
        <section class="agp-card agp-ficha"><div class="agp-card-h"><div><b>Ficha</b></div></div>
          <dl>
            <div><dt>Área</dt><dd><span class="agx-area" style="--c:var(${colorArea(wf.area)})">${areaNombre(wf.area)}</span></dd></div>
            <div><dt>IA</dt><dd>${ia1?.proveedor ? html`${iaTexto()}<small>${ia1.propia ? 'Propia de este agente' : 'La de Ajustes → IA'}</small>` : html`<a href="#/ajustes/ia">Conectar una IA</a>`}</dd></div>
            <div><dt>Conexiones</dt><dd>${cons.length ? html`<span class="agp-cons">${cons.map((c) => html`<span>${c.logo ? html`<img src="${c.logo}" alt="">` : ico('link', 12)} ${c.nombre}</span>`)}</span>` : 'Ninguna'}</dd></div>
            <div><dt>Límites</dt><dd>${(wf.limites || []).length ? `${wf.limites.length} reglas que nunca rompe` : 'Sin límites escritos'}</dd></div>
            ${wf.origen?.fuente ? html`<div><dt>Origen</dt><dd><code>${wf.origen.fuente}</code></dd></div>` : ''}
          </dl></section>
      </div></div>`;
  };

  // ---------- Trabajos ----------
  const listaTrabajos = () => {
    const n = (g) => trabajos.filter((t) => grupoDe(t) === g).length;
    const xs = trabajos.filter((t) => !filtro || grupoDe(t) === filtro);
    return html`<div class="agp-trab">
      <div class="agx-bar"><div class="agx-chips" role="group" aria-label="Filtrar trabajos">
        ${[['', 'Todos', trabajos.length], ['aprobar', 'Por aprobar', n('aprobar')], ['curso', 'En curso', n('curso')], ['completos', 'Completos', n('completos')]].map(([k, l, c]) => html`<button type="button" data-filtro="${k}" class="${filtro === k ? 'on' : ''}">${l}<span>${c}</span></button>`)}</div></div>
      ${trabajos.length ? html`<div class="agp-jobs">
        <div class="agp-job agp-job-th"><span>Trabajo</span><span>Avance</span><span>Etapa actual</span><span>Estado</span><span>Actualizado</span></div>
        ${xs.map(filaTrabajo)}${xs.length ? '' : html`<div class="agx-vacio mut">Ningún trabajo con ese filtro.</div>`}</div>` : html`<section class="agp-card">${vacioTrabajos('Sin trabajos todavía')}</section>`}
    </div>`;
  };

  // ---------- Configuración ----------
  const seccion = (titulo, ayuda, cuerpo, extra = '') => html`<section class="agp-sec ${extra}"><div class="agp-sec-l"><b>${titulo}</b><p>${ayuda}</p></div><div class="agp-sec-r">${cuerpo}</div></section>`;
  const settings = () => {
    const dis = editor ? '' : raw('disabled');
    const conectados = (ia?.proveedores || []).filter((p) => p.conectado);
    const def = iaDeUso(ia, 'agents');
    return html`<div class="agp-set">
      <div class="agp-set-h"><span class="agp-auto sm"><i></i> ${editor ? 'Los cambios se guardan solos' : 'Solo el CEO o el COO lo editan'}</span></div>
      ${seccion('General', 'Cómo se llama y qué tiene que lograr. El objetivo es lo primero que ve el equipo.', html`
        <label class="kf-f"><span>Nombre</span><input class="in" data-s="nombre" value="${wf.nombre}" ${dis}></label>
        <label class="kf-f"><span>Objetivo</span><input class="in" data-s="objetivo" value="${wf.objetivo || ''}" placeholder="Ej.: Entregar la estrategia de crecimiento aprobada" ${dis}></label>
        <label class="kf-f"><span>Descripción</span><textarea class="in" rows="3" data-s="descripcion" ${dis}>${wf.descripcion || ''}</textarea></label>
        <label class="kf-f"><span>Área</span><select class="in" data-s="area" ${dis}>${AREAS_AGENTE.map(([k, n]) => html`<option value="${k}" ${wf.area === k ? raw('selected') : ''}>${n}</option>`)}</select></label>`)}
      ${seccion('Estado', 'Si el equipo le puede encargar trabajos.', html`
        <div class="seg">${ESTADOS_AGENTE.map(([k, n]) => html`<button type="button" data-act="estado" data-e="${k}" class="${wf.estado === k ? 'on' : ''}" ${dis}>${n}</button>`)}</div>
        <p class="mut sm agp-est-ayuda">${AYUDA_ESTADO[wf.estado] || ''}</p>`)}
      ${seccion('IA', 'Con qué IA trabaja por defecto. Cada etapa del Flujo puede usar otra (por ejemplo, una gratis para preparar y una fuerte para decidir).', html`
        <label class="kf-f"><span>IA del agente</span><select class="in" data-s="ia" ${dis}>
          <option value="">La de Ajustes · ${def?.proveedor ? `${proveedorDe(def.proveedor)?.nombre || def.proveedor}${def.modelo ? ` · ${def.modelo}` : ''}` : 'sin configurar'}</option>
          ${conectados.map((p) => html`<optgroup label="${proveedorDe(p.id)?.nombre || p.id}">${(p.modelos || []).slice(0, 60).map((m) => html`<option value="${p.id}|${m}" ${wf.ia?.proveedor === p.id && wf.ia?.modelo === m ? raw('selected') : ''}>${m}</option>`)}</optgroup>`)}
        </select></label>
        <a class="btn ghost" href="#/ajustes/ia">${ico('settings', 13)} Conectar otra IA</a>`)}
      ${seccion('Límites', 'Lo que este agente nunca hace. Viaja en cada pedido a la IA.', html`
        <label class="kf-f"><span>Uno por línea</span><textarea class="in" rows="5" data-s="limites" ${dis}>${(wf.limites || []).join('\n')}</textarea></label>`)}
      ${editor ? seccion('Más', 'Duplicar crea una copia independiente. Archivar lo esconde; nada se borra y sus trabajos siguen.', html`
        <div class="agp-more"><button class="btn ghost" data-act="duplicar">${ico('copy', 13)} Duplicar agente</button><button class="btn ghost agp-danger" data-act="archivar">Archivar agente</button></div>`, 'agp-sec-more') : ''}
    </div>`;
  };

  const pinta = () => {
    if (tab === 'workflow') {
      mount(el, html`${cabeza()}<div class="agp-mem"></div><div class="agp-wf"></div>`);
      pintarMemoria(el.querySelector('.agp-mem'), wf, editor, (nuevo) => { wf = nuevo; });
      return pintarEditor(el.querySelector('.agp-wf'), me, wf, editor, (nuevo) => { wf = nuevo; });
    }
    mount(el, html`${cabeza()}${tab === 'overview' ? overview() : tab === 'settings' ? settings() : listaTrabajos()}`);
  };

  // Configuración: guarda sola, medio segundo después de dejar de escribir.
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
    const b = ev.target.closest('[data-act],[data-filtro]'); if (!b || !el.contains(b) || b.closest('.agp-wf')) return;
    if (b.dataset.filtro !== undefined) { filtro = b.dataset.filtro; return pinta(); }
    const a = b.dataset.act;
    if (a === 'trabajo') return nuevoTrabajo(me, resumen());
    if (a === 'estado') {
      wf.estado = b.dataset.e; guardar({ estado: wf.estado }, true);
      el.querySelectorAll('[data-act="estado"]').forEach((x) => x.classList.toggle('on', x === b));
      const ay = el.querySelector('.agp-est-ayuda'); if (ay) ay.textContent = AYUDA_ESTADO[wf.estado] || '';
      el.querySelector('.agp-name .agx-est')?.replaceWith(Object.assign(document.createElement('span'), { className: `agx-est ${wf.estado}`, textContent: ESTADOS_AGENTE.find(([k]) => k === wf.estado)[1] }));
      return;
    }
    if (a === 'duplicar') { try { const { workflow } = await api('agentes/workflows', { method: 'POST', body: { desde: wf.id } }); location.hash = rutaAgente(workflow.id, 'settings'); } catch (e) { toast(e.message, true); } return; }
    if (a === 'archivar') { if (!(await confirmAsk('¿Archivar este agente? Nada se borra y sus trabajos siguen.'))) return; try { await api(`agentes/workflows/${wf.id}/archivar`, { method: 'POST', body: { archivado: true } }); location.hash = '#/ai/agentes'; } catch (e) { toast(e.message, true); } }
  });
  el.addEventListener('input', (ev) => {
    const k = ev.target.dataset.s; if (!k || !editor) return;
    const v = ev.target.value;
    if (k === 'limites') return guardar({ limites: v.split('\n').map((x) => x.trim()).filter(Boolean) });
    if (k === 'ia') { const [proveedor, ...m] = v.split('|'); wf.ia = { proveedor: proveedor || '', modelo: m.join('|') }; return guardar({ ia: wf.ia }, true); }
    if (k === 'area') { wf.area = v; return guardar({ area: v }, true); }
    wf[k] = v; guardar({ [k]: v });
    if (k === 'nombre') { const h = el.querySelector('.agp-name h1'); if (h) h.textContent = v; }
  });
  pinta();
}
