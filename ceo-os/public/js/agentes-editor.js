// Agent Area · el Flujo de un agente (pestaña Flujo de su portal), al estilo del editor de Kargul:
//   · un lienzo de pantalla completa con rejilla: se mueve arrastrando el fondo (o con dos dedos) y tiene zoom y «ajustar».
//   · las etapas son tarjetas en columna, unidas por líneas; el «+» entre dos inserta una etapa ahí.
//   · «Acciones» flota a la izquierda (se pliega): los tipos de etapa, agrupados en Entender · Decidir · Entregar.
//   · el inspector flota a la derecha solo cuando eliges una etapa: Construir · Reglas · Conexiones, y abajo «Siguiente etapa».
// El flujo es lineal: el orden de las etapas es el orden en que corre cada trabajo. Es del OS: guardar no toca el repo.
// Editan el CEO y el COO; el resto lo ve.
import { html, raw, mount, ico, toast, api } from './core.js';
import { TIPOS, CONEXIONES, tipoDe, normalizarEtapa } from './agentes-flujos.js';
import { CONECTORES, logoConector } from './conectores.js';
import { proveedorDe } from './ia-proveedores.js';

const lineas = (xs) => (xs || []).join('\n');
const deLineas = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
const GRUPOS = [['Entender', ['investigacion', 'analisis']], ['Decidir', ['decision']], ['Entregar', ['entregable', 'validacion']]];

// Geometría del lienzo (en unidades del «mundo»; la vista lo traslada y escala).
const W = 360, H = 150, GAP = 70, PASO = H + GAP;
const yDe = (i) => i * PASO;
const ZMIN = 0.4, ZMAX = 1.25;
const K_ACC = 'os.flujo.acciones';

export async function pintarEditor(el, me, wf, editor, onGuardado = () => {}, alive = () => el.isConnected) {
  const [estCon, estIA] = await Promise.all([
    api('conectores/estado').catch(() => null),
    api('ia/estado').catch(() => null),
  ]);
  const iasOS = (estIA?.proveedores || []).filter((p) => p.conectado && p.modelos?.length);
  const conectado = (id) => Boolean(estCon?.conectores?.find((c) => c.id === id)?.conectado);
  const ro = !editor;
  let etapas = (wf.etapas || []).map((e) => ({ ...e }));
  let sel = etapas.length ? 0 : null, panel = 'construir', sucio = false, guardando = false, menuEn = null;
  let accAbierto = true; try { accAbierto = localStorage.getItem(K_ACC) !== '0'; } catch {}
  const view = { x: 0, y: 0, z: 1, listo: false };
  let full = false, lugar = null; // pantalla completa: el Flujo cubre toda la ventana (Esc o el mismo botón salen)

  const modeloDe = (e) => (e.ia?.proveedor ? e.ia.modelo : wf.ia?.proveedor ? wf.ia.modelo : '');
  const conexionesDe = (e) => (e.herramientas || []).map((h) => CONEXIONES.find((c) => c.id === h)?.nombre || CONECTORES.find((c) => c.id === h)?.nombre || h);

  // ---------- Piezas ----------
  const nodo = (e, i) => {
    const t = tipoDe(e.tipo), m = modeloDe(e), cons = conexionesDe(e);
    return html`<div class="kf-node ${i === sel ? 'sel' : ''}" data-t="${t.id}" style="top:${yDe(i)}px" data-act="sel" data-i="${i}" tabindex="0" role="button" aria-label="Etapa ${i + 1}: ${e.nombre}">
      <span class="kf-h-in" aria-hidden="true"></span>
      <div class="kf-node-h"><span class="kf-node-ic">${ico(t.icono, 15)}</span><span class="kf-node-k">${t.nombre}</span>
        ${e.gate ? html`<span class="kf-gate" title="Esta etapa solo la aprueba el CEO">${ico('lock', 11)} Aprueba el CEO</span>` : html`<span class="kf-node-n">Paso ${i + 1}</span>`}</div>
      <div class="kf-node-b"><b class="kf-node-t">${e.nombre || t.nombre}</b><span class="kf-node-d">${e.proposito || t.sub}</span></div>
      <div class="kf-node-f">${m ? html`<span title="Modelo">${ico('sparkles', 11)} ${m}</span>` : html`<span class="mut">${ico('sparkles', 11)} IA del agente</span>`}
        ${cons.length ? html`<span title="${cons.join(', ')}">${ico('link', 11)} ${cons.length}</span>` : ''}
        ${e.entrega?.campos?.length ? html`<span title="Campos de la entrega">${ico('file-text', 11)} ${e.entrega.campos.length}</span>` : ''}</div>
      <span class="kf-h-out" aria-hidden="true"></span>
    </div>`;
  };

  const lineasSvg = () => {
    const out = [];
    for (let i = 0; i < etapas.length - 1; i++) {
      const y1 = yDe(i) + H, y2 = yDe(i + 1);
      out.push(html`<path d="M0 ${y1} L0 ${y2 - 6}" class="kf-edge"/><path d="M-4.5 ${y2 - 9} L0 ${y2 - 2} L4.5 ${y2 - 9}" class="kf-edge kf-arrow"/>`);
    }
    if (!ro && etapas.length) { const y1 = yDe(etapas.length - 1) + H; out.push(html`<path d="M0 ${y1} L0 ${y1 + GAP - 18}" class="kf-edge kf-edge-tail"/>`); }
    return out;
  };

  // El «+» entre etapas (y al final) abre un menú corto con los tipos.
  const masEntre = () => (ro ? '' : etapas.map((_, i) => {
    const y = i === etapas.length - 1 ? yDe(i) + H + GAP - 18 : yDe(i) + H + GAP / 2;
    return html`<button type="button" class="kf-plus ${i === etapas.length - 1 ? 'fin' : ''}" style="top:${y}px" data-act="menu" data-i="${i}" aria-label="${i === etapas.length - 1 ? 'Agregar etapa al final' : `Insertar etapa después del paso ${i + 1}`}">${ico('plus', 13)}${i === etapas.length - 1 ? html`<span>Agregar etapa</span>` : ''}</button>
      ${menuEn === i ? html`<div class="kf-menu" style="top:${y + 18}px" role="menu">${TIPOS.map((t) => html`<button type="button" role="menuitem" data-act="insertar" data-i="${i}" data-t="${t.id}" data-tt="${t.id}">${ico(t.icono, 14)}<span><b>${t.nombre}</b><span>${t.sub}</span></span></button>`)}</div>` : ''}`;
  }));

  const acciones = () => (ro ? '' : html`<aside class="kf-panel kf-acts ${accAbierto ? 'open' : ''}" aria-label="Acciones">
    <div class="kf-panel-h"><b>Acciones</b><button type="button" class="kf-ib" data-act="acciones" aria-expanded="${accAbierto}" aria-label="${accAbierto ? 'Plegar acciones' : 'Abrir acciones'}">${ico(accAbierto ? 'chevron-up' : 'chevron-down', 15)}</button></div>
    ${accAbierto ? html`<div class="kf-acts-b">
      <p class="kf-hint">Toca un tipo para agregarlo ${sel == null ? 'al final' : `después del paso ${sel + 1}`}.</p>
      ${GRUPOS.map(([g, ids]) => html`<section><span class="kf-grp">${g}</span>${ids.map((id) => { const t = tipoDe(id); return html`<button type="button" class="kf-act" data-tt="${t.id}" data-act="agregar" data-t="${t.id}">${ico(t.icono, 15)}<span><b>${t.nombre}</b><span>${t.sub}</span></span>${ico('plus', 13)}</button>`; })}</section>`)}
      ${wf.origen?.fuente ? html`<p class="kf-orig">Nació del método <code>${wf.origen.fuente}</code>. Ya es independiente: editar aquí no toca el repo.</p>` : ''}
    </div>` : ''}
  </aside>`);

  const inspector = () => {
    const e = sel == null ? null : etapas[sel];
    if (!e) return '';
    const t = tipoDe(e.tipo), dis = ro ? raw('disabled') : '';
    const campo = (k, l, v, tipo = 'input', ph = '', ayuda = '') => html`<label class="kf-f"><span>${l}</span>${tipo === 'textarea' ? html`<textarea class="in" rows="3" data-k="${k}" placeholder="${ph}" ${dis}>${v}</textarea>` : html`<input class="in" data-k="${k}" value="${v}" placeholder="${ph}" ${dis}>`}${ayuda ? html`<small>${ayuda}</small>` : ''}</label>`;
    const cons = [
      ...CONEXIONES.map((c) => ({ id: c.id, nombre: c.nombre, sub: c.sub })),
      ...CONECTORES.filter((c) => ['mcp', 'token'].includes(c.tipo)).map((c) => ({ id: c.id, nombre: c.nombre, sub: conectado(c.id) ? 'Conectado' : 'Sin conectar · conéctalo en MCPs', logo: logoConector(c), off: !conectado(c.id) })),
    ];
    const ultimo = sel === etapas.length - 1;
    return html`<aside class="kf-panel kf-insp" data-tt="${t.id}" aria-label="Etapa ${sel + 1}">
      <div class="kf-insp-h">
        <span class="kf-insp-k">${ico(t.icono, 15)} Paso ${sel + 1} · ${t.nombre}</span>
        <button type="button" class="kf-ib" data-act="cerrar" aria-label="Cerrar">${ico('x', 15)}</button>
      </div>
      <div class="kf-seg" role="tablist">${[['construir', 'Construir'], ['reglas', 'Reglas'], ['conexiones', 'Conexiones']].map(([k, l]) => html`<button type="button" role="tab" aria-selected="${panel === k}" class="${panel === k ? 'on' : ''}" data-act="panel" data-p="${k}">${l}</button>`)}</div>
      <div class="kf-insp-b">
      ${panel === 'construir' ? html`
        ${campo('nombre', 'Nombre', e.nombre)}
        <div class="kf-f2">
          <label class="kf-f"><span>Tipo</span><select class="in" data-k="tipo" ${dis}>${TIPOS.map((x) => html`<option value="${x.id}" ${e.tipo === x.id ? raw('selected') : ''}>${x.nombre}</option>`)}</select></label>
          <label class="kf-f"><span>Modelo</span><select class="in" data-k="ia" ${dis}>
            <option value="" ${e.ia?.proveedor ? '' : raw('selected')}>El del agente${wf.ia?.proveedor ? ` · ${wf.ia.modelo}` : ''}</option>
            ${iasOS.map((p) => html`<optgroup label="${proveedorDe(p.id)?.nombre || p.id}">${p.modelos.slice(0, 80).map((m) => html`<option value="${p.id}|${m}" ${e.ia?.proveedor === p.id && e.ia?.modelo === m ? raw('selected') : ''}>${m}</option>`)}</optgroup>`)}
            ${e.ia?.proveedor && !iasOS.some((p) => p.id === e.ia.proveedor) ? html`<option value="${e.ia.proveedor}|${e.ia.modelo}" selected>${e.ia.modelo} (sin conectar)</option>` : ''}
          </select></label>
        </div>
        ${campo('proposito', 'Qué resuelve', e.proposito, 'textarea', '¿Qué pregunta responde esta etapa?')}
        ${campo('inputs', 'Lo que necesita', lineas(e.inputs), 'textarea', 'Uno por línea', 'Lo que el equipo o las etapas anteriores le dan.')}
        ${campo('tareas', 'Lo que hace', lineas(e.tareas), 'textarea', 'Uno por línea')}
        <div class="kf-sep"><span>Lo que entrega</span></div>
        ${campo('entrega.titulo', 'Título', e.entrega?.titulo || '', 'input', 'Ej.: Ideal Customer Profile')}
        ${campo('entrega.campos', 'Campos', lineas(e.entrega?.campos), 'textarea', 'Segmento\nComprador\nDolores', 'Uno por línea. Cada campo sale como Hipótesis o Con evidencia.')}
        ${e.metodo ? html`<p class="kf-hint">Método de referencia: <code>${e.metodo}</code></p>` : ''}`
      : panel === 'reglas' ? html`
        ${campo('criterios', 'Criterios de éxito', lineas(e.criterios), 'textarea', 'Uno por línea')}
        <label class="kf-f"><span>Fuentes externas mínimas</span><input class="in" type="number" min="0" max="10" data-k="fuentes_min" value="${e.fuentes_min || 0}" ${dis}><small>Si no las alcanza, el resultado queda como «Falta evidencia».</small></label>
        <label class="kf-sw"><input type="checkbox" data-k="gate" ${e.gate ? raw('checked') : ''} ${dis}><span><b>Solo la aprueba el CEO</b><small>Sin esto, la aprueba el CEO o el COO.</small></span></label>
        ${e.gate ? campo('nota_gate', 'Por qué', e.nota_gate || '') : ''}
        <p class="kf-hint">Toda etapa se aprueba antes de seguir. Nada se publica ni se manda al cliente desde aquí.</p>`
      : html`
        <p class="kf-hint">Con qué trabaja el agente en esta etapa.</p>
        <div class="kf-cons">${cons.map((c) => html`<label class="kf-con ${c.off ? 'off' : ''}"><input type="checkbox" data-con="${c.id}" ${(e.herramientas || []).includes(c.id) ? raw('checked') : ''} ${dis}>${c.logo ? html`<img src="${c.logo}" alt="">` : html`<span class="kf-con-ic">${ico('link', 13)}</span>`}<span><b>${c.nombre}</b><small>${c.sub}</small></span></label>`)}</div>
        <a class="btn ghost sm" href="#/ai/mcps">${ico('puzzle', 13)} Conectar un MCP</a>`}
      </div>
      <div class="kf-insp-f">
        ${ro ? '' : html`<div class="kf-tools">
          <button type="button" class="kf-ib" data-act="subir" aria-label="Subir" title="Subir" ${sel ? '' : raw('disabled')}>${ico('arrow-up', 14)}</button>
          <button type="button" class="kf-ib" data-act="bajar" aria-label="Bajar" title="Bajar" ${ultimo ? raw('disabled') : ''}>${ico('arrow-down', 14)}</button>
          <button type="button" class="kf-ib" data-act="duplicar" aria-label="Duplicar" title="Duplicar">${ico('copy', 14)}</button>
          <button type="button" class="kf-ib" data-act="quitar" aria-label="Quitar" title="Quitar" ${etapas.length > 1 ? '' : raw('disabled')}>${ico('trash-2', 14)}</button></div>`}
        ${ultimo ? (ro ? '' : html`<button type="button" class="btn kf-next" data-act="menu" data-i="${sel}">${ico('plus', 14)} Agregar etapa</button>`)
          : html`<button type="button" class="btn kf-next" data-act="siguiente">Siguiente etapa ${ico('arrow-down', 14)}</button>`}
      </div>
    </aside>`;
  };

  const pinta = () => {
    mount(el, html`<div class="kf ${ro ? 'ro' : ''} ${full ? 'full' : ''}">
      <div class="kf-bar">
        <p><b>${etapas.length} etapa${etapas.length === 1 ? '' : 's'}</b><span class="mut"> · cada trabajo las recorre en este orden y tú apruebas cada una</span>${sucio ? html`<span class="kf-sucio">Cambios sin guardar</span>` : ''}</p>
        <div class="kf-bar-a">${ro ? html`<span class="mut sm">Solo el CEO o el COO editan el flujo</span>` : html`<button class="btn sm" data-act="guardar" ${sucio && !guardando ? '' : raw('disabled')}>${guardando ? 'Guardando…' : 'Guardar'}</button>`}
          <button type="button" class="kf-ib kf-full-b" data-act="full" aria-pressed="${full}" aria-label="${full ? 'Salir de pantalla completa' : 'Pantalla completa'}" title="${full ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa (F)'}">${ico(full ? 'x' : 'scan', 16)}</button></div>
      </div>
      <div class="kf-canvas" data-canvas>
        <div class="kf-world" style="transform:translate(${view.x}px,${view.y}px) scale(${view.z})">
          <svg class="kf-svg" width="1" height="1" aria-hidden="true">${lineasSvg()}</svg>
          ${etapas.map(nodo)}
          ${masEntre()}
          ${etapas.length ? '' : html`<div class="kf-vacio">${ro ? 'Este agente todavía no tiene etapas.' : 'Agrega la primera etapa desde Acciones.'}</div>`}
        </div>
        ${acciones()}
        ${inspector()}
        <div class="kf-zoom" aria-label="Zoom">
          <button type="button" class="kf-ib" data-act="zoom-in" aria-label="Acercar" ${view.z >= ZMAX - 0.01 ? raw('disabled') : ''}>${ico('plus', 15)}</button>
          <button type="button" class="kf-ib" data-act="zoom-out" aria-label="Alejar" ${view.z <= ZMIN + 0.01 ? raw('disabled') : ''}>${ico('minus', 15)}</button>
          <button type="button" class="kf-ib" data-act="ajustar" aria-label="Ajustar a la pantalla" title="Ajustar">${ico('scan', 15)}</button>
        </div>
      </div>
    </div>`);
    if (!view.listo) { ajustar(false); view.listo = true; }
  };

  // ---------- Vista: mover, zoom, ajustar ----------
  const lienzo = () => el.querySelector('[data-canvas]');
  const mundo = () => el.querySelector('.kf-world');
  const aplicar = () => { const w = mundo(); if (w) w.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})`; };
  // todo = true: que quepa el flujo entero (botón «ajustar»); si no, tamaño de lectura desde la primera etapa (al abrir).
  function ajustar(todo = true) {
    const c = lienzo(); if (!c) return;
    const r = c.getBoundingClientRect(), alto = Math.max(H, yDe(Math.max(etapas.length, 1) - 1) + H + (ro ? 0 : GAP));
    const { izq, libre } = libreX(r);
    const ancho = (libre - 40) / W;
    view.z = Math.max(ZMIN, Math.min(1, ancho, todo ? (r.height - 80) / alto : 1));
    view.x = izq + libre / 2; view.y = 36;
    aplicar();
  }
  const zoomEn = (f, cx, cy) => {
    const z = Math.max(ZMIN, Math.min(ZMAX, view.z * f)); if (z === view.z) return;
    view.x = cx - (cx - view.x) * (z / view.z); view.y = cy - (cy - view.y) * (z / view.z); view.z = z; aplicar();
    el.querySelector('[data-act=zoom-in]')?.toggleAttribute('disabled', view.z >= ZMAX - 0.01);
    el.querySelector('[data-act=zoom-out]')?.toggleAttribute('disabled', view.z <= ZMIN + 0.01);
  };
  // Llevar una etapa a la vista (al elegirla o al pasar a la siguiente).
  // El espacio libre entre los paneles flotantes (Acciones a la izquierda, el inspector a la derecha).
  const libreX = (r) => { const izq = !ro && accAbierto ? 300 : 0, der = sel != null ? 440 : 0; return { izq, libre: Math.max(320, r.width - izq - der) }; };
  const enfocar = (i) => {
    const c = lienzo(); if (!c) return;
    const r = c.getBoundingClientRect(), { izq, libre } = libreX(r), yv = view.y + yDe(i) * view.z;
    view.x = izq + libre / 2; // la columna, centrada donde no la tapa ningún panel
    if (i != null && (yv < 20 || yv + H * view.z > r.height - 20)) view.y = r.height / 2 - (yDe(i) + H / 2) * view.z;
    aplicar();
  };

  let arrastre = null;
  el.onpointerdown = (ev) => {
    const c = lienzo(); if (!c || !c.contains(ev.target)) return;
    if (ev.target.closest('.kf-node,.kf-panel,.kf-zoom,.kf-plus,.kf-menu,button,input,select,textarea,a')) return;
    arrastre = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y, movio: false };
    c.setPointerCapture(ev.pointerId); c.classList.add('panning');
  };
  el.onpointermove = (ev) => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) arrastre.movio = true;
    view.x = arrastre.vx + dx; view.y = arrastre.vy + dy; aplicar();
  };
  el.onpointerup = () => {
    if (!arrastre) return;
    const movio = arrastre.movio; arrastre = null; lienzo()?.classList.remove('panning');
    if (!movio && (sel != null || menuEn != null)) { const habia = sel != null; sel = null; menuEn = null; pinta(); if (habia) enfocar(null); } // un clic en el vacío cierra
  };
  el.addEventListener('wheel', (ev) => {
    const c = lienzo(); if (!c || !c.contains(ev.target) || ev.target.closest('.kf-panel,.kf-menu')) return;
    ev.preventDefault();
    const r = c.getBoundingClientRect();
    if (ev.ctrlKey || ev.metaKey) zoomEn(Math.exp(-ev.deltaY * 0.01), ev.clientX - r.left, ev.clientY - r.top);
    else { view.x -= ev.deltaX; view.y -= ev.deltaY; aplicar(); }
  }, { passive: false });

  // ---------- Cambios ----------
  const marcar = () => { sucio = true; pinta(); };
  const nueva = (tipo) => { const t = tipoDe(tipo); return normalizarEtapa({ tipo, nombre: t.nombre, herramientas: t.herramientas, fuentes_min: t.fuentes_min }); };
  const insertar = (i, tipo) => { etapas.splice(i + 1, 0, nueva(tipo)); sel = i + 1; panel = 'construir'; menuEn = null; marcar(); enfocar(sel); };

  const mapa = {
    sel: (b) => { sel = Number(b.dataset.i); menuEn = null; pinta(); enfocar(sel); },
    cerrar: () => { sel = null; pinta(); enfocar(null); },
    panel: (b) => { panel = b.dataset.p; pinta(); },
    acciones: () => { accAbierto = !accAbierto; try { localStorage.setItem(K_ACC, accAbierto ? '1' : '0'); } catch {} pinta(); enfocar(sel); },
    menu: (b) => { const i = Number(b.dataset.i); menuEn = menuEn === i ? null : i; pinta(); },
    insertar: (b) => insertar(Number(b.dataset.i), b.dataset.t),
    agregar: (b) => insertar(sel == null ? etapas.length - 1 : sel, b.dataset.t),
    siguiente: () => { if (sel < etapas.length - 1) { sel += 1; pinta(); enfocar(sel); } },
    subir: () => { const i = sel; if (!i) return; [etapas[i - 1], etapas[i]] = [etapas[i], etapas[i - 1]]; sel = i - 1; marcar(); },
    bajar: () => { const i = sel; if (i >= etapas.length - 1) return; [etapas[i + 1], etapas[i]] = [etapas[i], etapas[i + 1]]; sel = i + 1; marcar(); },
    duplicar: () => { const i = sel; etapas.splice(i + 1, 0, normalizarEtapa({ ...etapas[i], id: '', nombre: `${etapas[i].nombre} (copia)` })); sel = i + 1; marcar(); enfocar(sel); },
    quitar: () => { const i = sel; if (etapas.length < 2 || !confirm(`¿Quitar «${etapas[i].nombre}» del flujo?`)) return; etapas.splice(i, 1); sel = Math.min(i, etapas.length - 1); marcar(); },
    'zoom-in': () => { const r = lienzo().getBoundingClientRect(); zoomEn(1.2, r.width / 2, r.height / 2); },
    'zoom-out': () => { const r = lienzo().getBoundingClientRect(); zoomEn(1 / 1.2, r.width / 2, r.height / 2); },
    ajustar: () => ajustar(),
    // Pantalla completa: el Flujo sale de #main (que tiene su propio apilamiento, debajo de la barra lateral) al body, y vuelve.
    full: () => {
      full = !full; document.documentElement.classList.toggle('kf-fullscreen', full);
      if (full) { lugar = document.createComment('flujo'); el.before(lugar); document.body.append(el); }
      else if (lugar) { lugar.replaceWith(el); lugar = null; }
      pinta(); ajustar(false); enfocar(sel);
    },
    guardar: async () => {
      guardando = true; pinta();
      try {
        ({ workflow: wf } = await api(`agentes/workflows/${wf.id}/guardar`, { method: 'POST', body: { etapas, v: wf.v } }));
        etapas = wf.etapas.map((e) => ({ ...e })); sucio = false; toast('Flujo guardado'); onGuardado(wf);
      } catch (e) { toast(e.message, true); }
      guardando = false; if (alive()) pinta();
    },
  };
  el.onclick = (ev) => { const b = ev.target.closest('[data-act]'); if (b && el.contains(b) && mapa[b.dataset.act] && !b.disabled) mapa[b.dataset.act](b, ev); };
  // Esc sale de pantalla completa aunque el foco no esté en el Flujo (al repintar, el foco vuelve al documento).
  const teclaGlobal = (ev) => {
    if (!el.isConnected || (lugar && !lugar.isConnected)) { document.removeEventListener('keydown', teclaGlobal); return; }
    if (ev.key === 'Escape' && full && !el.contains(ev.target)) mapa.full();
  };
  document.addEventListener('keydown', teclaGlobal);
  // Si se cambia de pantalla estando en pantalla completa, el Flujo (que vive en el body) se va con ella.
  window.addEventListener('hashchange', () => { if (lugar) { el.remove(); lugar = null; full = false; } document.documentElement.classList.remove('kf-fullscreen'); }, { once: true });
  el.onkeydown = (ev) => {
    const escribiendo = ev.target.closest?.('input,textarea,select,[contenteditable]');
    if (ev.key === 'Escape' && (menuEn != null || sel != null)) { menuEn = null; sel = null; pinta(); return; }
    if (ev.key === 'Escape' && full) return mapa.full();
    if (!escribiendo && (ev.key === 'f' || ev.key === 'F')) return mapa.full();
    if (!escribiendo && ev.key === '0') return ajustar();
    const n = ev.target.closest?.('.kf-node'); if (n && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); mapa.sel(n); }
  };

  // Escribir en el inspector no repinta todo (no se pierde el foco): actualiza la etapa y su tarjeta.
  el.oninput = (ev) => {
    const t = ev.target; if (ro || sel == null) return;
    const e = etapas[sel]; if (!e) return;
    const k = t.dataset.k;
    if (k) {
      if (['inputs', 'tareas', 'criterios'].includes(k)) e[k] = deLineas(t.value);
      else if (k === 'entrega.titulo') e.entrega = { ...(e.entrega || {}), titulo: t.value };
      else if (k === 'entrega.campos') e.entrega = { ...(e.entrega || {}), campos: deLineas(t.value) };
      else if (k === 'fuentes_min') e.fuentes_min = Math.max(0, Math.min(10, Number(t.value) || 0));
      else if (k === 'gate') { e.gate = t.checked; return marcar(); }
      else if (k === 'tipo') { e.tipo = t.value; return marcar(); }
      else if (k === 'ia') { const [proveedor, ...m] = t.value.split('|'); e.ia = { proveedor: proveedor || '', modelo: m.join('|') }; return marcar(); }
      else e[k] = t.value;
      const card = el.querySelector(`.kf-node[data-i="${sel}"]`);
      if (card && k === 'nombre') card.querySelector('.kf-node-t').textContent = t.value || tipoDe(e.tipo).nombre;
      if (card && k === 'proposito') card.querySelector('.kf-node-d').textContent = t.value || tipoDe(e.tipo).sub;
    }
    if (t.dataset.con) { const s = new Set(e.herramientas || []); t.checked ? s.add(t.dataset.con) : s.delete(t.dataset.con); e.herramientas = [...s]; }
    if (!sucio) { sucio = true; el.querySelector('.kf-bar [data-act=guardar]')?.removeAttribute('disabled'); el.querySelector('.kf-bar p')?.insertAdjacentHTML('beforeend', '<span class="kf-sucio">Cambios sin guardar</span>'); }
  };
  el.onchange = (ev) => { if (ev.target.dataset.con) pinta(); };

  pinta();
}
