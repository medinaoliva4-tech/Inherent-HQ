// Vista de Equipo para la siguiente etapa (herramienta organization-architect de Consulting): organigrama de hoy vs el de la siguiente
// etapa, «Solo el fundador» / «Nunca le debería llegar», valores como criterios, matriz RACI, perfiles, rituales y las preguntas de
// estructura corporativa para el especialista. Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar,
// resumen). Pinta con html`…` (todo se escapa), edita con inputs nativos, avisa cada cambio con el contenido limpio y recalcula lo
// derivado (columnas, conteo de A, avisos) sin tocar el campo donde la persona escribe. Lo que falta dice ⚠️ SIN DATOS.
import { html, mount, ico, toast, confirmAsk } from '../core.js';
import { ETAPAS_HORMOZI, etapaHormozi, SIN_DATOS, corta, numeroONull } from './marcos.js';
import * as P from './procesos.js';
import { DESTINOS, LETRAS, RITUALES, vacio, limpiar, columnas, conteoA, puestosSinPerfil, aDiagrama } from './organizacion.js';

const LISTAS = [['hoy', 'Hoy'], ['siguiente.puestos', 'La siguiente etapa']];
const lineas = (t) => String(t ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const estrategiaDe = (ctx) => (ctx && typeof ctx.estrategia === 'object' && ctx.estrategia) || {};
const sig = (es) => (es.etapa && es.etapa.n != null && Number(es.etapa.n) < 9 && etapaHormozi(Number(es.etapa.n) + 1) ? Number(es.etapa.n) + 1 : null);
const ruta = (obj, r) => r.split('.').reduce((o, k) => o?.[k], obj);
const ponerRuta = (obj, r, v) => { const p = r.split('.'), u = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[u] = v; };
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.dataset.tipo === 'num' ? numeroONull(t.value) : t.dataset.lineas ? lineas(t.value) : t.value);
const idNuevo = (lista, pref) => { const u = new Set(lista.map((x) => x.id)); let k = lista.length + 1; while (u.has(`${pref}${k}`)) k++; return `${pref}${k}`; };

// El contenido de trabajo: el limpio, con los rituales de los SOPs siempre presentes.
function base(contenido) {
  const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {}));
  for (const r of RITUALES) if (!c.rituales.some((x) => x.id === r.id)) c.rituales.push({ id: r.id, nombre: r.nombre, ritmo: '', dueno: '', participan: '', para_que: '', cita: '' });
  return c;
}

// Un campo: input nativo si se edita; texto plano (o ⚠️ SIN DATOS) si es de solo lectura.
function campos(editable) {
  const ro = (v, o) => html`<span class="org-ro" data-vacio="${v ? 0 : 1}">${v || (o.sd ? `${SIN_DATOS}: ${o.sd}` : '—')}</span>`;
  return {
    txt: (r, v, o = {}) => (editable ? html`<input class="in" type="text" data-c="${r}" value="${v ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(v, o)),
    area: (r, v, o = {}) => (editable ? html`<textarea class="in" data-c="${r}" rows="${o.filas || 2}" maxlength="${o.max || 400}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${v ?? ''}</textarea>` : ro(v, o)),
    lin: (r, lista, o = {}) => (editable ? html`<textarea class="in" data-c="${r}" data-lineas="1" rows="${o.filas || 3}" placeholder="Una por línea" aria-label="${o.label || ''}">${(lista || []).join('\n')}</textarea>` : (lista || []).length ? html`<ul>${lista.map((x) => html`<li>${x}</li>`)}</ul>` : ro('', o)),
    sel: (r, op, actual, o = {}) => (editable
      ? html`<select class="in" data-c="${r}" data-tipo="${o.num ? 'num' : ''}" aria-label="${o.label || ''}"><option value="">${o.vacio || '—'}</option>${op.map(([v, l]) => html`<option value="${v}" ${String(actual ?? '') === String(v) ? 'selected' : ''}>${l}</option>`)}</select>`
      : ro(op.find(([v]) => String(v) === String(actual ?? ''))?.[1] || '', o)),
    chk: (r, v, o = {}) => (editable ? html`<input type="checkbox" data-c="${r}" ${v ? 'checked' : ''} aria-label="${o.label || ''}">` : ro(v ? 'Sí' : 'No', o)),
  };
}
const del = (a, ...d) => html`<button type="button" class="btn ghost" data-act="${a}" data-i="${d[0]}" data-j="${d[1] ?? ''}" aria-label="Quitar" title="Quitar">${ico('x', 14)}</button>`;

// ---------- Regiones derivadas (se recalculan solas y no llevan campos de escritura salvo el «reporta», que depende de los roles) ----------
const reporta = ({ c, f, lista, i }) => {
  const ps = ruta(c, lista), p = ps[i]; if (!p) return html``;
  return f.sel(`${lista}.${i}.reporta`, ps.filter((x) => x.id !== p.id && x.rol).map((x) => [x.id, x.rol]), p.reporta, { vacio: '— sin jefe', label: 'A quién reporta' });
};
const columnasR = ({ c }) => {
  const col = columnas(c), li = (d) => html`<li>${d.texto}${d.destino === 'delega' ? html` <span class="mut sm">→ ${d.rol || `${SIN_DATOS}: rol`}</span>` : d.destino === 'elimina' ? html` <span class="mut sm">→ se elimina</span>` : ''}</li>`;
  const vacio = (t) => html`<p class="mut sm">${c.decisiones.length ? '—' : `${SIN_DATOS}: ${t}`}</p>`;
  return html`<div class="org-cols"><article class="org-col" data-k="fundador"><h4>Solo el fundador</h4>${col.fundador.length ? html`<ul>${col.fundador.map(li)}</ul>` : vacio('salen de las decisiones que hoy toma')}</article>
    <article class="org-col" data-k="nunca"><h4>Nunca le debería llegar</h4>${col.nuncaLlega.length ? html`<ul>${col.nuncaLlega.map(li)}</ul>` : vacio('salen de las decisiones que se delegan o se eliminan')}</article></div>
    ${col.sinDestino.length ? html`<p class="org-aviso">${ico('triangle-alert', 15)} ${col.sinDestino.length === 1 ? '1 decisión sin destino' : `${col.sinDestino.length} decisiones sin destino`}: se queda, se delega con criterio o se elimina.</p>` : ''}`;
};
const aRaci = ({ c, i }) => { const a = conteoA(c.raci.filas[i] || {}); return a === 1 ? html`<span class="org-a-ok" data-a="1">${ico('circle-check', 14)} Una A</span>` : html`<span class="org-a-mal" data-a="${a}">${ico('triangle-alert', 14)} ${a === 0 ? 'Sin A' : `${a} A: debe ser una`}</span>`; };
const perfiles = ({ c }) => { const s = puestosSinPerfil(c); return s.length ? html`<p class="org-aviso">${ico('triangle-alert', 15)} Sin perfil: ${s.map((p) => p.rol).join(', ')}</p>` : html``; };
const REGIONES = { rep: reporta, cols: columnasR, raci: aRaci, perf: perfiles };

// ---------- Secciones ----------
function puestos(lista, E) {
  const { c, f, editable } = E, ps = ruta(c, lista);
  return html`${ps.length ? html`<ul class="org-puestos">${ps.map((p, i) => html`<li class="org-puesto" data-fundador="${p.fundador ? 1 : 0}">
    <label class="org-f"><span class="sr-only">Rol</span>${f.txt(`${lista}.${i}.rol`, p.rol, { max: 60, label: 'Rol del puesto (el puesto, no una persona)', ph: 'Rol' })}</label>
    <span class="org-f" data-r="rep" data-lista="${lista}" data-i="${i}"></span>
    <label class="org-f org-chk"><span class="mut sm">Fundador</span>${f.chk(`${lista}.${i}.fundador`, p.fundador, { label: 'Es el puesto del fundador' })}</label>
    ${editable ? del('org-del-puesto', i, lista) : ''}</li>`)}</ul>` : html`<p class="org-sd">${SIN_DATOS}: ${lista === 'hoy' ? 'cómo está armado el equipo hoy (roles, no nombres)' : 'sale del headcount que pide la etapa siguiente de Hormozi'}</p>`}
    ${editable ? html`<button type="button" class="btn ghost" data-act="org-add-puesto" data-j="${lista}">${ico('plus', 14)} Agregar puesto</button>` : ''}`;
}
function raci(E) {
  const { c, f, editable } = E, { roles, filas } = c.raci;
  return html`${roles.length && filas.length ? html`<div class="org-raci-w"><table class="org-raci"><caption class="sr-only">Matriz RACI: R hace, A responde, C consulta, I informa. Cada fila lleva una sola A.</caption>
    <thead><tr><th scope="col">Actividad</th>${roles.map((r, j) => html`<th scope="col">${editable ? html`${f.txt(`raci.roles.${j}.nombre`, r.nombre, { max: 60, label: 'Rol de la columna', ph: 'Rol' })}${del('org-del-rol', j)}` : r.nombre}</th>`)}<th scope="col">A</th>${editable ? html`<th></th>` : ''}</tr></thead>
    <tbody>${filas.map((r, i) => html`<tr data-i="${i}"><th scope="row">${f.txt(`raci.filas.${i}.actividad`, r.actividad, { max: 120, label: 'Actividad', ph: 'Actividad o decisión' })}</th>
      ${roles.map((x) => html`<td>${f.sel(`raci.filas.${i}.celdas.${x.id}`, LETRAS.map(([k, l]) => [k, `${k} · ${l}`]), r.celdas[x.id], { label: `${r.actividad || 'Actividad'} · ${x.nombre}` })}</td>`)}
      <td class="org-a" data-r="raci" data-i="${i}"></td>${editable ? html`<td>${del('org-del-fila', i)}</td>` : ''}</tr>`)}</tbody></table></div>`
    : html`<p class="org-sd">${SIN_DATOS}: la RACI sale de las actividades del equipo de la siguiente etapa y de sus roles</p>`}
    ${editable ? html`<div class="org-fila-btn"><button type="button" class="btn ghost" data-act="org-add-rol" ${roles.length >= 10 ? 'disabled' : ''}>${ico('plus', 14)} Agregar rol</button> <button type="button" class="btn ghost" data-act="org-add-fila" ${roles.length ? '' : 'disabled'}>${ico('plus', 14)} Agregar fila</button></div>` : ''}`;
}
function plantilla(E) {
  const { c, f, editable, es } = E, s = c.siguiente, st = sig(es), e = etapaHormozi(s.etapa);
  return html`<div class="org" data-editable="${editable ? 1 : 0}">
    <section class="org-sec" aria-label="Organigrama">
      <h3 class="org-t">${ico('users', 16)} Organigrama <span class="mut sm">hoy vs lo que pide la siguiente etapa</span></h3>
      <p class="org-lectura mut sm">${st ? `Strategy ubicó la etapa actual: la siguiente es la ${st} · ${etapaHormozi(st).nombre}.` : `${SIN_DATOS}: Strategy aún no ubica la etapa; la siguiente se elige aquí.`} Los puestos son roles, no personas.</p>
      <div class="org-form">
        <label class="org-f"><span class="lbl">Siguiente etapa</span>${f.sel('siguiente.etapa', ETAPAS_HORMOZI.map((x) => [x.n, `${x.n} · ${x.nombre}`]), s.etapa, { num: 1, vacio: '— sin ubicar', label: 'Siguiente etapa del roadmap' })}</label>
        <label class="org-f org-f-ancho"><span class="lbl">Headcount que pide</span>${f.txt('siguiente.headcount', s.headcount, { max: 240, label: 'Headcount de la siguiente etapa', ph: 'Cuántas personas y en qué roles', sd: 'sale del pizarrón de la etapa en hormozi-brain' })}</label>
        <label class="org-f org-f-ancho"><span class="lbl">Rol del fundador</span>${f.txt('siguiente.rol_fundador', s.rol_fundador, { max: 240, label: 'Rol del fundador en la siguiente etapa', ph: 'Qué hace el fundador en esa etapa', sd: 'sale del pizarrón de la etapa en hormozi-brain' })}</label>
        <label class="org-f org-f-ancho"><span class="lbl">Cita del roadmap</span>${f.txt('siguiente.cita', s.cita, { max: 240, label: 'Cita del roadmap', ph: '[ROADMAP VIDEO | STAGE 4 | 00:10:00]', sd: 'cita del video de la etapa' })}</label></div>
      <div class="org-par">${LISTAS.map(([l, t]) => html`<div class="org-lado" data-l="${l}"><h4>${t}</h4><div data-lista="${l}"></div></div>`)}</div>
      <details class="org-diagrama"><summary>${ico('eye', 14)} Ver los organigramas como diagrama</summary>
        <div class="org-dg-par">${LISTAS.map(([l, t]) => html`<figure class="org-dg-f"><figcaption><b>${t}</b></figcaption><div class="org-dg" data-l="${l}"></div></figure>`)}</div></details>
    </section>

    <section class="org-sec" aria-label="Decisiones del fundador">
      <h3 class="org-t">${ico('user', 16)} Decisiones del fundador <span class="mut sm">cada una con destino</span></h3>
      <div data-r="cols"></div>
      <div data-lista="decisiones"></div>
    </section>

    <section class="org-sec" aria-label="Valores como criterios de decisión">
      <h3 class="org-t">${ico('target', 16)} Valores como criterios <span class="mut sm">cómo decide el equipo sin preguntar</span></h3>
      <div data-lista="valores"></div>
    </section>

    <section class="org-sec" aria-label="Matriz RACI">
      <h3 class="org-t">${ico('list-checks', 16)} Matriz RACI <span class="mut sm">cada fila, exactamente una A</span></h3>
      <div data-lista="raci"></div>
    </section>

    <section class="org-sec" aria-label="Perfiles de puesto">
      <h3 class="org-t">${ico('user', 16)} Perfiles de puesto</h3>
      <div data-r="perf"></div><div data-lista="perfiles"></div>
    </section>

    <section class="org-sec" aria-label="Rituales">
      <h3 class="org-t">${ico('calendar', 16)} Rituales <span class="mut sm">Monday Hour One y Gametape Review</span></h3>
      <div class="org-rit">${c.rituales.map((r, i) => html`<article class="org-ritual" data-id="${r.id}"><h4>${r.nombre}</h4><p class="mut sm">${RITUALES.find((x) => x.id === r.id)?.que || ''}</p>
        <label class="org-f"><span class="lbl">Ritmo</span>${f.txt(`rituales.${i}.ritmo`, r.ritmo, { max: 80, label: `Ritmo de ${r.nombre}`, ph: 'Cada lunes, 1 hora', sd: 'lo define el equipo' })}</label>
        <label class="org-f"><span class="lbl">Dueño (un rol)</span>${f.txt(`rituales.${i}.dueno`, r.dueno, { max: 60, label: `Dueño de ${r.nombre}`, ph: 'Rol', sd: 'falta el rol dueño' })}</label>
        <label class="org-f"><span class="lbl">Participan</span>${f.txt(`rituales.${i}.participan`, r.participan, { max: 120, label: `Quién participa en ${r.nombre}`, ph: 'Roles' })}</label>
        <label class="org-f org-f-ancho"><span class="lbl">Para qué</span>${f.area(`rituales.${i}.para_que`, r.para_que, { max: 240, label: `Para qué es ${r.nombre}`, ph: 'Qué cambia en el equipo' })}</label>
        <label class="org-f org-f-ancho"><span class="lbl">Cita</span>${f.txt(`rituales.${i}.cita`, r.cita, { max: 200, label: `Cita de ${r.nombre}`, ph: '[5 SCALING FRAMEWORKS SOPS | … | pág. PDF N]' })}</label></article>`)}</div>
    </section>

    <section class="org-sec" aria-label="Estructura corporativa">
      <h3 class="org-t">${ico('wrench', 16)} Estructura corporativa <span class="mut sm">preguntas para el especialista, no estructura legal</span></h3>
      ${f.lin('estructura', c.estructura, { filas: 5, label: 'Preguntas para el abogado o contador', sd: 'preguntas para el especialista' })}
    </section>
  </div>`;
}
// Las listas que cambian de forma (agregar y quitar) se pintan enteras en su propio lugar.
const LISTAS_PINTAR = {
  hoy: (E) => puestos('hoy', E), 'siguiente.puestos': (E) => puestos('siguiente.puestos', E),
  decisiones: (E) => { const { c, f, editable } = E; return html`${c.decisiones.length ? html`<ul class="org-dec">${c.decisiones.map((d, i) => html`<li class="org-d" data-destino="${d.destino}">
    <label class="org-f org-f-ancho"><span class="lbl">Decisión</span>${f.txt(`decisiones.${i}.texto`, d.texto, { max: 200, label: 'Decisión que toma el fundador', ph: 'Qué decide hoy el fundador' })}</label>
    <label class="org-f"><span class="lbl">Destino</span>${f.sel(`decisiones.${i}.destino`, DESTINOS.map((x) => [x.id, x.nombre]), d.destino, { vacio: '— sin destino', label: 'Destino de la decisión', sd: 'falta el destino' })}</label>
    <label class="org-f"><span class="lbl">Rol que la toma</span>${f.txt(`decisiones.${i}.rol`, d.rol, { max: 60, label: 'Rol que la toma', ph: 'Si se delega' })}</label>
    <label class="org-f org-f-ancho"><span class="lbl">Criterio</span>${f.txt(`decisiones.${i}.criterio`, d.criterio, { max: 300, label: 'Criterio: cómo decide sin preguntar (o por qué se elimina)', ph: 'Cuando pase X, se decide Y' })}</label>
    ${editable ? del('org-del-dec', i) : ''}</li>`)}</ul>` : html`<p class="org-sd">${SIN_DATOS}: salen de los pasos del Mapa que dependen del fundador y de la entrevista</p>`}
    ${editable ? html`<button type="button" class="btn ghost" data-act="org-add-dec" ${c.decisiones.length >= 25 ? 'disabled' : ''}>${ico('plus', 14)} Agregar decisión</button>` : ''}`; },
  valores: (E) => { const { c, f, editable } = E; return html`${c.valores.length ? html`<ul class="org-val">${c.valores.map((v, i) => html`<li class="org-v">
    <label class="org-f"><span class="lbl">Valor</span>${f.txt(`valores.${i}.valor`, v.valor, { max: 80, label: 'Valor', ph: 'Ej. Velocidad' })}</label>
    <label class="org-f org-f-ancho"><span class="lbl">Criterio de decisión</span>${f.txt(`valores.${i}.criterio`, v.criterio, { max: 300, label: 'Criterio de decisión de este valor', ph: 'Cuando pase X, se decide Y', sd: 'un valor sin criterio no sirve' })}</label>
    ${editable ? del('org-del-val', i) : ''}</li>`)}</ul>` : html`<p class="org-sd">${SIN_DATOS}: salen de cómo decide hoy el fundador</p>`}
    ${editable ? html`<button type="button" class="btn ghost" data-act="org-add-val" ${c.valores.length >= 8 ? 'disabled' : ''}>${ico('plus', 14)} Agregar valor</button>` : ''}`; },
  raci: (E) => raci(E),
  perfiles: (E) => { const { c, f, editable } = E; return html`${c.perfiles.length ? html`<div class="org-perfiles">${c.perfiles.map((p, i) => html`<article class="org-perfil"><header><label class="org-f"><span class="lbl">Rol</span>${f.txt(`perfiles.${i}.rol`, p.rol, { max: 60, label: 'Rol del perfil', ph: 'Rol' })}</label>${editable ? del('org-del-perfil', i) : ''}</header>
    <label class="org-f org-f-ancho"><span class="lbl">Misión</span>${f.area(`perfiles.${i}.mision`, p.mision, { max: 300, label: 'Misión del puesto', ph: 'Para qué existe este puesto', sd: 'falta la misión' })}</label>
    <label class="org-f"><span class="lbl">Responde por</span>${f.lin(`perfiles.${i}.responde_por`, p.responde_por, { label: 'De qué responde', sd: 'falta de qué responde' })}</label>
    <label class="org-f"><span class="lbl">Decide</span>${f.lin(`perfiles.${i}.decide`, p.decide, { label: 'Qué decide solo' })}</label>
    <label class="org-f"><span class="lbl">Escala</span>${f.lin(`perfiles.${i}.escala`, p.escala, { label: 'Qué escala al fundador' })}</label>
    <label class="org-f"><span class="lbl">Se mide por</span>${f.lin(`perfiles.${i}.mide`, p.mide, { label: 'Cómo se mide' })}</label></article>`)}</div>` : html`<p class="org-sd">${SIN_DATOS}: un perfil por puesto de la siguiente etapa</p>`}
    ${editable ? html`<button type="button" class="btn ghost" data-act="org-add-perfil" ${c.perfiles.length >= 15 ? 'disabled' : ''}>${ico('plus', 14)} Agregar perfil</button>` : ''}`; },
};

export const vista = {
  // El contenido inicial: vacío, salvo la siguiente etapa que Strategy ya permite ubicar y los pasos del Mapa que dependen del fundador.
  nuevo(ctx) {
    const c = vacio(), n = sig(estrategiaDe(ctx)), pm = (Array.isArray(ctx?.entradas) ? ctx.entradas : []).filter((e) => e?.tool === 'process-mapper').pop();
    if (n !== null) c.siguiente.etapa = n;
    if (pm) c.decisiones = P.pasosFundador(P.limpiar(pm.contenido), 'hoy').map((p, i) => ({ id: `d${i + 1}`, texto: p.nombre, destino: '', criterio: '', rol: '' }));
    return c;
  },

  pintar(el, { contenido, editable, onCambio, ctx } = {}) {
    const c = base(contenido), ed = Boolean(editable), E = { c, f: campos(ed), editable: ed, es: estrategiaDe(ctx) };
    mount(el, plantilla(E));
    const root = el.firstElementChild, cache = new WeakMap();
    const poner = (nodo, h) => { const s = String(h); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, h); } };
    const emitir = () => { if (ed && typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const refrescar = () => { for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ ...E, c, lista: nodo.dataset.lista, i: Number(nodo.dataset.i), k: nodo.dataset.k })); } };
    const pintarLista = (k) => { const d = [...root.querySelectorAll('[data-lista]')].find((x) => x.dataset.lista === k && !x.dataset.r); if (d && LISTAS_PINTAR[k]) { cache.delete(d); mount(d, LISTAS_PINTAR[k](E)); } };
    const pintarTodo = () => { for (const k of Object.keys(LISTAS_PINTAR)) pintarLista(k); refrescar(); };
    pintarTodo();

    // Los organigramas como diagrama (solo lectura): se pintan al abrirlo y se repintan, sin prisa, cuando algo cambia.
    const det = root.querySelector('.org-diagrama'), dgs = {}; let tDg = 0, turno = 0;
    const pintarDiagramas = async () => {
      if (!root.isConnected || !det.open) return;
      const mi = ++turno;
      try {
        const { diagramView } = await import('../diagram-editor.js');
        if (mi !== turno || !root.isConnected || !det.open) return;
        const lim = limpiar(c);
        for (const [l] of LISTAS) {
          const host = [...root.querySelectorAll('.org-dg')].find((h) => h.dataset.l === l); if (!host) continue;
          dgs[l]?.destroy?.(); dgs[l] = null; host.innerHTML = '';
          const ps = ruta(lim, l);
          if (!ps.length) { mount(host, html`<p class="org-sd">${SIN_DATOS}: aún no hay puestos</p>`); continue; }
          dgs[l] = diagramView(host, aDiagrama(ps), {});
        }
      } catch { for (const h of root.querySelectorAll('.org-dg')) mount(h, html`<p class="org-sd">No pude dibujar el diagrama. Las listas de arriba siguen siendo las mismas.</p>`); }
    };
    const repintar = () => { if (!det.open) return; clearTimeout(tDg); tDg = setTimeout(pintarDiagramas, 250); };
    det.addEventListener('toggle', () => { if (det.open) pintarDiagramas(); else { turno++; for (const l of Object.keys(dgs)) { dgs[l]?.destroy?.(); dgs[l] = null; } } });
    if (!ed) return;

    const alCambiar = (e) => {
      const t = e.target, k = t?.dataset?.c; if (!k || !root.contains(t)) return;
      ponerRuta(c, k, valorDe(t));
      emitir(); refrescar(); repintar();
    };
    root.addEventListener('input', alCambiar);
    root.addEventListener('change', alCambiar);

    const enfocar = (k, sel = 'input,textarea,select') => { const d = [...root.querySelectorAll('[data-lista]')].find((x) => x.dataset.lista === k && !x.dataset.r); [...(d?.querySelectorAll(sel) || [])].filter((x) => x.dataset.c).pop()?.focus(); };
    const cambio = (k) => { pintarLista(k); emitir(); refrescar(); repintar(); };
    const quitar = async (lista, i, nombre, k, despues) => {
      if (nombre) { const ok = await confirmAsk(`Quitar «${corta(nombre, 60)}». Si ya lo guardaste, queda en las versiones anteriores.`); if (!ok || !root.isConnected) return; }
      despues?.(); lista.splice(i, 1); cambio(k);
    };
    root.addEventListener('click', async (e) => {
      const b = e.target.closest?.('[data-act]'); if (!b || !root.contains(b)) return;
      const a = b.dataset.act, i = Number(b.dataset.i), j = b.dataset.j;
      if (a === 'org-add-puesto') {
        const ps = ruta(c, j); if (!ps) return;
        if (ps.length >= 25) return toast('Cada organigrama llega hasta 25 puestos', true);
        ps.push({ id: idNuevo(ps, j === 'hoy' ? 'h' : 's'), rol: '', reporta: '', fundador: false }); cambio(j); enfocar(j);
      } else if (a === 'org-del-puesto') {
        const ps = ruta(c, j), p = ps?.[i]; if (!p) return;
        await quitar(ps, i, p.rol, j, () => { for (const x of ps) if (x.reporta === p.id) x.reporta = ''; });
      } else if (a === 'org-add-dec') { c.decisiones.push({ id: idNuevo(c.decisiones, 'd'), texto: '', destino: '', criterio: '', rol: '' }); cambio('decisiones'); enfocar('decisiones'); }
      else if (a === 'org-del-dec') await quitar(c.decisiones, i, c.decisiones[i]?.texto, 'decisiones');
      else if (a === 'org-add-val') { c.valores.push({ id: idNuevo(c.valores, 'v'), valor: '', criterio: '' }); cambio('valores'); enfocar('valores'); }
      else if (a === 'org-del-val') await quitar(c.valores, i, c.valores[i]?.valor, 'valores');
      else if (a === 'org-add-perfil') { c.perfiles.push({ id: idNuevo(c.perfiles, 'pf'), rol: '', mision: '', responde_por: [], decide: [], escala: [], mide: [] }); cambio('perfiles'); enfocar('perfiles'); }
      else if (a === 'org-del-perfil') await quitar(c.perfiles, i, c.perfiles[i]?.rol, 'perfiles');
      else if (a === 'org-add-rol') { if (c.raci.roles.length >= 10) return; c.raci.roles.push({ id: idNuevo(c.raci.roles, 'r'), nombre: '' }); cambio('raci'); }
      else if (a === 'org-del-rol') { const r = c.raci.roles[i]; if (!r) return; await quitar(c.raci.roles, i, r.nombre, 'raci', () => { for (const f of c.raci.filas) delete f.celdas[r.id]; }); }
      else if (a === 'org-add-fila') { c.raci.filas.push({ id: idNuevo(c.raci.filas, 'f'), actividad: '', celdas: {} }); cambio('raci'); }
      else if (a === 'org-del-fila') await quitar(c.raci.filas, i, c.raci.filas[i]?.actividad, 'raci');
    });
  },

  // Una línea para el Overview: puestos, decisiones con destino y filas RACI sin una A.
  resumen(contenido) {
    const c = base(contenido), col = columnas(c), mal = c.raci.filas.filter((f) => conteoA(f) !== 1).length;
    return html`<span class="org-res"><span class="chip">${c.siguiente.puestos.length ? `${c.hoy.length} → ${c.siguiente.puestos.length} puestos` : `Puestos: ${SIN_DATOS}`}</span><span class="chip">${c.decisiones.length ? `${col.fundador.length} se quedan · ${col.nuncaLlega.length} se delegan o eliminan` : `Decisiones: ${SIN_DATOS}`}</span><span class="chip" data-ok="${c.raci.filas.length && !mal ? 1 : 0}">${c.raci.filas.length ? (mal ? `RACI: ${mal} filas sin una A` : 'RACI completa') : `RACI: ${SIN_DATOS}`}</span></span>`;
  },
};
