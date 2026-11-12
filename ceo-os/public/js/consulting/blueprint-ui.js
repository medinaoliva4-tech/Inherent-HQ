// La vista del Plan de crecimiento 90 días (solution-blueprint-builder de Consulting): un tablero de filas por mes (1, 2 y 3) sobre
// el módulo puro blueprint.js. Existe para que el Tool Shell solo monte `vista` en el centro: arriba la banda de contexto (los
// objetivos de Strategy, solo lectura) y el aviso de capacidad del Diagnóstico; abajo, una tarjeta por fila con su objetivo
// (marcado si no cumple verbo + área + de X a Y + fecha), restricción, sistema, innovación, tipo, dueño (un rol), primer paso y
// métrica. El mes se cambia con un select (no se arrastra). Una fila fuera del alcance se ve tachada: no se vuelve tarea, se escala al CEO.
import { html, raw, mount, ico } from '../core.js';
import { SISTEMAS, SISTEMAS_IDS, INNOVACION, HORIZONTES, SIN_DATOS, objetivoFaltas, entradaDe, nombreFactor } from './marcos.js';
import { MESES, TIPOS, MAX_FILAS, MENSAJE_CAPACIDAD, vacio, filaVacia, limpiar } from './blueprint.js';
import { limpiar as limpiarSalud, capacidadRoja } from './salud.js';
import { limpiar as limpiarCausas, factoresDe, factorMayorBrecha } from './causas.js';

const TIPO_TXT = { capacidad: 'Capacidad', demanda: 'Demanda' };
const CAPACIDAD_TXT = { verde: 'verde', ambar: 'ámbar', rojo: 'rojo' };
const MALAS = new Set(['__proto__', 'constructor', 'prototype']);
const PLAZO = (id) => HORIZONTES.find((h) => h.id === id)?.nombre || id;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// ---------- Reglas de una fila (las mismas de faltas() en blueprint.js: aquí se dicen fila por fila) ----------
const objetivoMotivos = (f) => (f.objetivo ? objetivoFaltas(f.objetivo) : ['Falta el objetivo']);
const vacioEn = (f, k) => !String(f[k] ?? '').trim();
// Una fila de demanda en un mes anterior a alguna de capacidad (o sin ninguna de capacidad) rompe «primero capacidad».
const violaCapacidad = (filas, f) => f.tipo === 'demanda' && (filas.some((k) => k.tipo === 'capacidad') ? filas.some((k) => k.tipo === 'capacidad' && k.mes > f.mes) : true);
const conFaltas = (f) => objetivoMotivos(f).length > 0 || vacioEn(f, 'dueno') || vacioEn(f, 'primer_paso') || vacioEn(f, 'metrica');

export const vista = {
  // El contenido inicial de un entregable nuevo: sin horizontes y sin filas.
  nuevo() { return vacio(); },

  // Re-pinta todo dentro de `el`. `c` es el estado vivo: cada cambio lo actualiza, recalcula las marcas sin tocar los campos (que no
  // pierdan el foco) y le avisa al shell con el contenido completo. Cambiar el mes, agregar o quitar una fila sí re-pinta.
  pintar(el, { contenido, editable = false, onCambio = () => {}, ctx = {} } = {}) {
    const c = limpiar(contenido), ed = Boolean(editable);
    const avisar = () => onCambio(structuredClone(c));

    // Lo que dicen los entregables que alimentan este plan (el shell los trae en ctx.entradas). Si algo no tiene la forma, no se rompe.
    let cap = null, sugerencias = [];
    try {
      const dx = entradaDe(ctx, 'business-health-assessment'), dc = dx ? limpiarSalud(dx.contenido) : null;
      cap = dc ? { roja: capacidadRoja(dc), nivel: dc.capacidad } : null;
      if (dc?.restriccion?.funcion) sugerencias.push(`Diagnóstico: ${dc.restriccion.funcion}`);
      const ar = entradaDe(ctx, 'root-cause-explorer'), id = ar ? factorMayorBrecha(factoresDe(limpiarCausas(ar.contenido))) : null;
      if (id) sugerencias.push(`Árbol: ${nombreFactor(id)}`);
    } catch { cap = cap || null; }
    const roja = Boolean(cap?.roja), metaStrategy = String(ctx?.estrategia?.meta || '').trim();

    // ---------- Los campos de una fila: control nativo si se edita, texto si solo se lee ----------
    const ro = (v, sin = SIN_DATOS) => (String(v ?? '').trim() ? html`<span class="bp-ro">${v}</span>` : html`<span class="bp-ro bp-sin">${sin}</span>`);
    const texto = (f, k, { et, ph, max, area = false, lista = '', sin } = {}) => {
      if (!ed) return ro(f[k], sin);
      const mx = raw(` maxlength="${Number(max)}"`);
      return area ? html`<textarea class="in bp-in" rows="2" data-f="${k}" data-id="${f.id}" aria-label="${et}" placeholder="${ph || ''}"${mx}>${f[k]}</textarea>`
        : html`<input class="in bp-in" type="text" data-f="${k}" data-id="${f.id}" aria-label="${et}" placeholder="${ph || ''}" value="${f[k]}"${mx} ${lista ? raw(`list="${lista}"`) : ''}>`;
    };
    const elige = (f, k, lista, { et, sin }) => (ed
      ? html`<select class="in bp-in" data-f="${k}" data-id="${f.id}" aria-label="${et}"><option value="">${sin}</option>${lista.map(([v, n]) => html`<option value="${v}" ${f[k] === v ? raw('selected') : ''}>${n}</option>`)}</select>`
      : ro((lista.find(([v]) => v === f[k]) || [])[1], sin));

    const tarjeta = (f, i) => html`<article class="bp-fila" data-fila="${f.id}" data-fuera="${f.fuera_alcance ? '1' : '0'}" data-tipo="${f.tipo}" data-capacidad="0">
      <header><span class="bp-n">Fila ${i + 1}</span>
        ${ed ? html`<label class="sw-row"><input type="checkbox" class="switch" data-f="fuera_alcance" data-id="${f.id}" ${f.fuera_alcance ? raw('checked') : ''}> Fuera del alcance</label><button type="button" class="btn ghost sm" data-acc="quitar" data-id="${f.id}" aria-label="Quitar la fila ${i + 1}">${ico('x', 14)}</button>`
          : f.fuera_alcance ? html`<span class="chip bp-fuera-chip">Fuera del alcance</span>` : ''}</header>
      <label class="bp-c bp-c-obj"><span class="lbl">Objetivo</span>${texto(f, 'objetivo', { et: `Objetivo de la fila ${i + 1}`, ph: 'Ej. Aumentar las ventas de $1M a $1.5M para el 31/12/2027', max: 240, area: true, sin: `${SIN_DATOS}: falta el objetivo` })}</label>
      <ul class="bp-motivos" data-d="objetivo"></ul>
      <div class="bp-g">
        <label class="bp-c"><span class="lbl">Restricción que ataca</span>${texto(f, 'restriccion_ref', { et: `Restricción de la fila ${i + 1}`, ph: 'Del Diagnóstico o del Árbol', max: 160, lista: ed && sugerencias.length ? 'bp-restricciones' : '', sin: `${SIN_DATOS}: la restricción sale del Diagnóstico o del Árbol` })}</label>
        <label class="bp-c"><span class="lbl">Sistema</span>${elige(f, 'sistema', SISTEMAS_IDS.map((s) => [s, SISTEMAS[s].nombre]), { et: `Sistema de la fila ${i + 1}`, sin: 'Sin sistema' })}</label>
        <label class="bp-c"><span class="lbl">Innovación</span>${elige(f, 'innovacion', INNOVACION.map((x) => [x.id, x.nombre]), { et: `Tipo de innovación de la fila ${i + 1}`, sin: 'Sin tipo' })}</label>
        <label class="bp-c"><span class="lbl">Tipo</span>${elige(f, 'tipo', TIPOS.map((t) => [t, TIPO_TXT[t]]), { et: `Capacidad o demanda en la fila ${i + 1}`, sin: 'Sin marcar' })}</label>
        <label class="bp-c"><span class="lbl">Mes</span>${ed ? html`<select class="in bp-in" data-f="mes" data-id="${f.id}" aria-label="Mes de la fila ${i + 1}">${MESES.map((m) => html`<option value="${m}" ${f.mes === m ? raw('selected') : ''}>Mes ${m}</option>`)}</select>` : ro(`Mes ${f.mes}`)}</label>
        <label class="bp-c"><span class="lbl">Dueño (rol)</span>${texto(f, 'dueno', { et: `Dueño de la fila ${i + 1}`, ph: 'Un rol, no una persona', max: 60, sin: `${SIN_DATOS}: falta el dueño` })}</label>
        <label class="bp-c bp-c-ancho"><span class="lbl">Primer paso</span>${texto(f, 'primer_paso', { et: `Primer paso de la fila ${i + 1}`, ph: 'La primera acción concreta', max: 200, sin: `${SIN_DATOS}: falta el primer paso` })}</label>
        <label class="bp-c"><span class="lbl">Métrica</span>${texto(f, 'metrica', { et: `Métrica de la fila ${i + 1}`, ph: 'El número que dice si funcionó', max: 160, sin: `${SIN_DATOS}: falta la métrica` })}</label>
      </div>
      <p class="bp-nota bp-nota-cap" data-d="capacidad" hidden></p>
      <p class="bp-nota bp-nota-fuera" data-d="fuera" hidden>Fuera del alcance: no se convierte en tarea; se escala al CEO.</p></article>`;

    const columna = (m) => { const filas = c.filas.map((f, i) => [f, i]).filter(([f]) => f.mes === m);
      return html`<section class="bp-mes" data-mes="${m}" aria-label="Mes ${m}">
        <header><h3>Mes ${m}</h3><span class="mut sm" data-d="cuenta-${m}">${plural(filas.length, 'fila', 'filas')}</span>
          ${ed ? html`<button type="button" class="btn ghost sm" data-acc="agregar" data-mes="${m}" ${c.filas.length >= MAX_FILAS ? raw('disabled') : ''}>${ico('plus', 14)} Fila</button>` : ''}</header>
        ${filas.length ? filas.map(([f, i]) => tarjeta(f, i)) : html`<p class="bp-vacio mut sm">Sin filas este mes.</p>`}</section>`; };

    const banda = html`<section class="bp-contexto" aria-label="Contexto de Strategy">
      ${[['1-2', c.horizontes.h12], ['3-5', c.horizontes.h35]].map(([id, t]) => html`<div class="bp-h" data-h="${id}"><span class="lbl">Objetivo a ${PLAZO(id)}</span>${t ? html`<p>${t}</p>` : html`<p class="bp-sin">${SIN_DATOS}: los objetivos a ${PLAZO(id)} los define Strategy</p>`}</div>`)}
      ${metaStrategy ? html`<div class="bp-h" data-h="meta"><span class="lbl">Meta de Strategy</span><p>${metaStrategy}</p></div>` : ''}
      <p class="mut sm bp-contexto-nota">Solo lectura: estos objetivos son de Strategy.</p></section>`;
    const avisoCap = !cap ? html`<p class="bp-capacidad" data-estado="sin-datos">${ico('info', 15)} <span>${SIN_DATOS}: la capacidad sale del Diagnóstico de crecimiento aprobado.</span></p>`
      : roja ? html`<p class="bp-capacidad" data-estado="rojo" role="alert">${ico('alert', 15)} <span><b>Capacidad en rojo en el Diagnóstico.</b> ${MENSAJE_CAPACIDAD} Ninguna fila de demanda antes de una de capacidad.</span></p>`
        : html`<p class="bp-capacidad" data-estado="${cap.nivel || 'sin-datos'}">${ico('info', 15)} <span>${cap.nivel ? `Capacidad en ${CAPACIDAD_TXT[cap.nivel]} en el Diagnóstico.` : `${SIN_DATOS}: el Diagnóstico no marca la capacidad.`} Primero capacidad, después demanda.</span></p>`;

    // ---------- Lo derivado se recalcula sin tocar los campos que se están escribiendo ----------
    const derivar = () => {
      el.querySelectorAll('[data-fila]').forEach((card) => {
        const f = c.filas.find((x) => x.id === card.dataset.fila); if (!f) return;
        const motivos = objetivoMotivos(f), viola = roja && violaCapacidad(c.filas, f), sinTipo = roja && !f.tipo;
        card.dataset.fuera = f.fuera_alcance ? '1' : '0'; card.dataset.tipo = f.tipo; card.dataset.capacidad = viola ? '1' : '0';
        const ul = card.querySelector('[data-d="objetivo"]'); if (ul) mount(ul, f.objetivo ? motivos.map((m) => html`<li>${m}</li>`) : '');
        const marca = (k, mal) => card.querySelector(`[data-f="${k}"]`)?.setAttribute('aria-invalid', String(mal));
        marca('objetivo', motivos.length > 0); marca('dueno', vacioEn(f, 'dueno')); marca('primer_paso', vacioEn(f, 'primer_paso')); marca('metrica', vacioEn(f, 'metrica'));
        const nc = card.querySelector('[data-d="capacidad"]'); if (nc) { nc.hidden = !(viola || sinTipo); nc.textContent = viola ? MENSAJE_CAPACIDAD : sinTipo ? 'Con la capacidad en rojo, marca si esta fila es de capacidad o de demanda.' : ''; }
        const nf = card.querySelector('[data-d="fuera"]'); if (nf) nf.hidden = !f.fuera_alcance;
      });
      MESES.forEach((m) => { const x = el.querySelector(`[data-d="cuenta-${m}"]`); if (x) x.textContent = plural(c.filas.filter((f) => f.mes === m).length, 'fila', 'filas'); });
      const r = el.querySelector('[data-d="resumen"]');
      if (r) { const n = c.filas.filter(conFaltas).length, fuera = c.filas.filter((f) => f.fuera_alcance).length;
        r.textContent = [plural(c.filas.length, 'fila', 'filas'), n ? `${n} con faltas` : '', fuera ? `${fuera} fuera del alcance` : ''].filter(Boolean).join(' · '); }
    };
    const pintarTodo = () => {
      mount(el, html`<div class="bp">${banda}${avisoCap}
        <p class="bp-resumen mut sm" data-d="resumen" aria-live="polite"></p>
        ${ed && sugerencias.length ? html`<datalist id="bp-restricciones">${sugerencias.map((s) => html`<option value="${s}"></option>`)}</datalist>` : ''}
        ${!c.filas.length ? html`<p class="bp-sin bp-fuente">${SIN_DATOS}: las filas salen del Diagnóstico y del Árbol aprobados (una por restricción que se ataca).</p>` : ''}
        <div class="bp-tablero">${MESES.map(columna)}</div></div>`);
      derivar();
    };

    const cambiar = (t) => {
      const k = t.dataset?.f, id = t.dataset?.id; if (!ed || !k || MALAS.has(k)) return;
      const f = c.filas.find((x) => x.id === id); if (!f || !(k in f)) return;
      if (k === 'fuera_alcance') f[k] = t.checked;
      else if (k === 'mes') { f[k] = Number(t.value); avisar(); pintarTodo(); el.querySelector(`[data-id="${id}"][data-f="mes"]`)?.focus(); return; }
      else f[k] = t.value;
      derivar(); avisar();
    };
    el.oninput = (e) => { if (e.target.tagName !== 'SELECT' && e.target.type !== 'checkbox') cambiar(e.target); };
    el.onchange = (e) => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') cambiar(e.target); };
    el.onclick = (e) => {
      const b = e.target.closest?.('[data-acc]'); if (!b || !el.contains(b) || !ed) return;
      if (b.dataset.acc === 'agregar' && c.filas.length < MAX_FILAS) {
        const f = filaVacia(c.filas); f.mes = Number(b.dataset.mes) || 1; c.filas.push(f); avisar(); pintarTodo();
        el.querySelector(`[data-id="${f.id}"][data-f="objetivo"]`)?.focus();
      } else if (b.dataset.acc === 'quitar') {
        const i = c.filas.findIndex((x) => x.id === b.dataset.id); if (i >= 0) { c.filas.splice(i, 1); avisar(); pintarTodo(); }
      }
    };
    pintarTodo();
  },

  // Una línea o chips para el Overview y para la propuesta de la IA.
  resumen(contenido) {
    const c = limpiar(contenido), n = c.filas.filter(conFaltas).length, fuera = c.filas.filter((f) => f.fuera_alcance).length;
    const chips = [plural(c.filas.length, 'fila', 'filas'), ...MESES.map((m) => `Mes ${m}: ${c.filas.filter((f) => f.mes === m).length}`), n ? `${n} con faltas` : '', fuera ? `${fuera} fuera del alcance` : ''].filter(Boolean);
    return html`<span class="bp-res">${chips.map((x) => html`<span class="chip">${x}</span> `)}</span>`;
  },
};
