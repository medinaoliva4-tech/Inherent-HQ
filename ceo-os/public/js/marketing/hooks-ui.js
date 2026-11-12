// Vista del Hook Laboratory (herramienta hook-laboratory de Marketing): la grilla de hooks (7 cajas × consciencia, con filtro por pilar,
// fuente, multiplicador y puntaje de Laya) y la matriz de pruebas (hooks × variantes, con la métrica real o ⚠️ SIN DATOS y su fuente).
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Los hooks se traen de la Investigación
// SIN reescribirlos; sin el puente de Laya el puntaje dice «pendiente». Pinta con html`…` (todo se escapa; nada de modelo entra a raw()).
import { html, mount, api, ico, toast } from '../core.js';
import { puenteEstado } from '../laya-ui.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { CAJAS, CONSCIENCIAS, FUENTES, METRICAS, SD_METRICA, vacio, limpiar, hookNuevo, desdeResearch, grilla, vivos, layaTexto, multTexto, celdaPrueba, celdaTexto, ganadorDe, cajaDe, reescrito, MAX_VARIANTES } from './hooks.js';
import { vacio as vacioOS } from '../visual.js';

const enc = encodeURIComponent;
const fuenteNombre = (k) => FUENTES.find(([x]) => x === k)?.[1] || k;
const vNuevo = (c) => { let n = c.variantes.length + 1; while (c.variantes.some((v) => v.id === `v${n}`)) n++; return `v${n}`; };

export const vista = {
  nuevo() { return vacio(); },
  resumen(contenido) { const c = limpiar(contenido), L = vivos(c); return `${L.length} hook${L.length === 1 ? '' : 's'} · ${c.variantes.length} variante${c.variantes.length === 1 ? '' : 's'} de prueba`; },

  pintar(el, { contenido, editable, onCambio, slug } = {}) {
    const ed = Boolean(editable), S = { c: limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), tab: 'grilla', pilar: '', research: null, laya: null };
    const cambio = () => { S.c = limpiar(S.c); if (typeof onCambio === 'function') onCambio(structuredClone(S.c)); pinta(); };

    const chip = (h) => html`<li class="hk-chip" data-caja="${h.caja}" data-fuente="${h.fuente}" title="${h.texto}"><span class="hk-t">${h.texto}</span> <span class="hk-m">${h.multiplicador == null ? '' : multTexto(h)}</span> <span class="hk-l" data-pend="${h.laya.puntaje ? 0 : 1}">Laya ${layaTexto(h)}</span></li>`;

    const tablaGrilla = () => {
      const g = grilla(S.c, { pilar: S.pilar });
      return html`<div class="hk-wrap"><table class="hk-grid"><thead><tr><th scope="col">Caja</th>${CONSCIENCIAS.map((n, i) => html`<th scope="col">${i + 1} · ${n}</th>`)}<th scope="col">Sin nivel</th></tr></thead>
        <tbody>${g.celdas.map((f) => html`<tr><th scope="row">${cajaDe(f.caja).nombre}<small class="mut">${cajaDe(f.caja).activa}</small></th>${f.niveles.slice(1).concat([f.niveles[0]]).map((l) => html`<td>${l.length ? html`<ul class="hk-cel">${l.map(chip)}</ul>` : html`<span class="mut sm">—</span>`}</td>`)}</tr>`)}</tbody></table></div>
        ${g.sinCaja.length ? html`<p class="sm mut">Sin caja (elige una abajo):</p><ul class="hk-cel">${g.sinCaja.map(chip)}</ul>` : ''}`;
    };

    const fila = (h) => {
      const caja = cajaDe(h.caja), rw = reescrito(h, S.research);
      return html`<li class="hk-fila" data-id="${h.id}"><div class="hk-f1">
          ${ed && h.fuente !== 'research' ? html`<input class="in" data-k="texto" value="${h.texto}" maxlength="240" aria-label="Hook" autocomplete="off">` : html`<b class="hk-texto">${h.texto}</b>`}
          ${ed ? html`<button class="btn" type="button" data-a="archivar" title="Se archiva, no se borra">${ico('inbox', 14)} Archivar</button>` : ''}</div>
        <div class="hk-f2">
          ${ed ? html`<select class="in" data-k="caja" aria-label="Caja"><option value="">Caja…</option>${CAJAS.map((k) => html`<option value="${k.id}" ${h.caja === k.id ? 'selected' : ''}>${k.nombre}</option>`)}</select>
            <select class="in" data-k="consciencia" aria-label="Consciencia"><option value="">Consciencia…</option>${CONSCIENCIAS.map((n, i) => html`<option value="${i + 1}" ${h.consciencia === i + 1 ? 'selected' : ''}>${i + 1} · ${n}</option>`)}</select>
            <input class="in" data-k="pilar" value="${h.pilar}" maxlength="60" placeholder="Pilar" aria-label="Pilar" autocomplete="off">`
          : html`<span>${caja?.nombre || SIN_DATOS}</span><span>${h.consciencia ? CONSCIENCIAS[h.consciencia - 1] : SIN_DATOS}</span><span>${h.pilar || SIN_DATOS}</span>`}
          <span class="hk-fuente">${fuenteNombre(h.fuente)}${h.origen ? ` · ${h.origen}` : ''}</span><span class="hk-mult" data-sd="${h.multiplicador == null ? 1 : 0}">${multTexto(h)}</span>
          <span class="hk-laya" data-pend="${h.laya.puntaje ? 0 : 1}">Laya: ${layaTexto(h)}</span></div>
        ${rw ? html`<p class="hk-aviso" role="status">${ico('triangle-alert', 14)} Está reescrito: un hook de la Investigación va igual que el post.</p>` : ''}
        ${caja?.cierre ? html`<label class="hk-f3"><span class="mut sm">Cierre (${caja.nombre}: va en el mismo brief)</span>${ed ? html`<input class="in" data-k="cierre" value="${h.cierre}" maxlength="240" autocomplete="off">` : html`<span>${h.cierre || SIN_DATOS}</span>`}</label>` : ''}
        ${h.caja === 'pattern-interrupt' ? html`<label class="hk-f3"><span class="mut sm">Frame 1 (qué se ve antes del texto)</span>${ed ? html`<input class="in" data-k="frame1" value="${h.frame1}" maxlength="240" autocomplete="off">` : html`<span>${h.frame1 || SIN_DATOS}</span>`}</label>` : ''}
        ${h.caja === 'bold-claim' && /\d/.test(h.texto) ? html`<label class="hk-f3"><span class="mut sm">OK de Branding o Ads (lleva un dato o promesa)</span>${ed ? html`<input class="in" data-k="aprobacion" value="${h.aprobacion}" maxlength="120" autocomplete="off">` : html`<span>${h.aprobacion || SIN_DATOS}</span>`}</label>` : ''}</li>`;
    };

    const pestanaGrilla = () => html`
      <div class="hk-barra">
        <label class="sm">Pilar <select class="in" data-f="pilar" aria-label="Filtrar por pilar"><option value="">Todos</option>${grilla(S.c).pilares.map((p) => html`<option value="${p}" ${S.pilar === p ? 'selected' : ''}>${p}</option>`)}</select></label>
        <span class="sp"></span>
        ${ed ? html`<button class="btn" type="button" data-a="research">${ico('book-open', 15)} Traer del research</button><button class="btn" type="button" data-a="nuevo">${ico('plus', 15)} Hook nuevo</button><button class="btn" type="button" data-a="laya">${ico('sparkles', 15)} Calificar con Laya</button>` : ''}</div>
      ${S.research === null && ed ? html`<p class="mut sm">Leyendo la Investigación…</p>` : ''}
      ${vivos(S.c).length ? html`${tablaGrilla()}<ul class="hk-lista">${vivos(S.c).filter((h) => !S.pilar || h.pilar === S.pilar).map(fila)}</ul>`
        : html`${vacioOS({ icono: 'inbox', titulo: 'Aún no hay hooks', linea: `${SIN_DATOS}: salen de la Investigación de la marca (su gancho y su multiplicador). Usa «Traer del research».` , boton: { texto: 'Armarlo en el Chat', chat: { modo: 'marketing', borrador: 'Armemos los hooks de esta marca.' } }})}`}`;

    const pestanaMatriz = () => {
      const c = S.c, L = vivos(c);
      if (!L.length) return html`${vacioOS({ icono: 'inbox', titulo: 'La matriz necesita hooks', linea: 'Primero trae o escribe hooks en la grilla.' })}`;
      return html`<div class="hk-barra"><span class="mut sm">Cada celda es una métrica real (de los analytics de la pieza o de Ads). Sin métrica, dice de dónde sale.</span><span class="sp"></span>
        ${ed ? html`<button class="btn" type="button" data-a="variante" ${c.variantes.length >= MAX_VARIANTES ? 'disabled' : ''}>${ico('plus', 15)} Variante de prueba</button>` : ''}</div>
        ${c.variantes.length ? html`<div class="hk-wrap"><table class="hk-matriz"><thead><tr><th scope="col">Hook</th>${c.variantes.map((v) => html`<th scope="col">${ed ? html`<input class="in" data-vn="${v.id}" value="${v.nombre}" maxlength="60" aria-label="Nombre de la variante" autocomplete="off">` : v.nombre}${ganadorDe(c, v.id) ? html`<small class="hk-gana">hay ganador</small>` : ''}</th>`)}</tr></thead>
          <tbody>${L.map((h) => html`<tr data-h="${h.id}"><th scope="row">${h.texto}</th>${c.variantes.map((v) => { const p = celdaPrueba(c, h.id, v.id); return html`<td data-v="${v.id}" data-ganador="${ganadorDe(c, v.id) === h.id ? 1 : 0}">
            ${ed ? html`<input class="in" data-p="valor" type="number" step="any" min="0" value="${p?.valor ?? ''}" placeholder="valor" aria-label="Valor de la métrica">
              <select class="in" data-p="metrica" aria-label="Métrica"><option value="">Métrica…</option>${METRICAS.map(([k, n]) => html`<option value="${k}" ${p?.metrica === k ? 'selected' : ''}>${n}</option>`)}</select>
              <input class="in" data-p="fuente" value="${p?.fuente || ''}" maxlength="160" placeholder="${SD_METRICA}" aria-label="Fuente de la métrica" autocomplete="off">` : ''}
            <span class="hk-celda" data-sd="${p && p.valor !== null ? 0 : 1}">${celdaTexto(p)}</span></td>`; })}</tr>`)}</tbody></table></div>`
        : html`${vacioOS({ icono: 'inbox', titulo: 'Sin variantes de prueba', linea: `${SIN_DATOS}: agrega la primera variante (por ejemplo «con texto en pantalla»).` })}`}`;
    };

    function pinta() {
      mount(el, html`<div class="hk">
        <nav class="hk-tabs" role="tablist" aria-label="Grilla o matriz"><button type="button" role="tab" class="${S.tab === 'grilla' ? 'on' : ''}" aria-selected="${S.tab === 'grilla'}" data-t="grilla">${ico('zap', 15)} Grilla de hooks</button>
          <button type="button" role="tab" class="${S.tab === 'matriz' ? 'on' : ''}" aria-selected="${S.tab === 'matriz'}" data-t="matriz">${ico('layout-grid', 15)} Matriz de pruebas</button>
          <span class="sp"></span><span class="mut sm">${S.laya === null ? '' : S.laya ? 'Laya lista en tu compu' : 'Sin puente: Laya queda «pendiente»'}</span></nav>
        ${S.tab === 'grilla' ? pestanaGrilla() : pestanaMatriz()}</div>`);
    }

    // ---------- Eventos (una sola vez por pintado del host) ----------
    const por = (id) => S.c.hooks.find((h) => h.id === id);
    el.onclick = async (e) => {
      const t = e.target.closest('[data-t],[data-a]'); if (!t || !el.contains(t)) return;
      if (t.dataset.t) { S.tab = t.dataset.t; return pinta(); }
      if (!ed) return;
      const a = t.dataset.a;
      if (a === 'archivar') { const h = por(t.closest('[data-id]')?.dataset.id); if (h) { h.archivado = true; cambio(); } }
      else if (a === 'nuevo') { S.c.hooks.push(hookNuevo({ texto: 'Escribe el hook', fuente: 'nuevo' })); cambio(); }
      else if (a === 'variante') { S.c.variantes.push({ id: vNuevo(S.c), nombre: `Variante ${S.c.variantes.length + 1}` }); cambio(); }
      else if (a === 'research') {
        if (!S.research) return toast('La Investigación todavía no carga', true);
        const nuevos = desdeResearch(S.research, S.c.hooks);
        if (!nuevos.length) return toast('No hay posts nuevos con gancho en la Investigación');
        S.c.hooks.push(...nuevos); cambio(); toast(`${nuevos.length} hook${nuevos.length === 1 ? '' : 's'} del research, tal cual`);
      } else if (a === 'laya') await calificar();
    };
    el.onchange = (e) => {
      const t = e.target; if (!ed || !el.contains(t)) return;
      if (t.dataset.f === 'pilar') { S.pilar = t.value; return pinta(); }
      const fila = t.closest('[data-id]'), cel = t.closest('td[data-v]');
      if (cel && t.dataset.p) {
        const hid = cel.closest('[data-h]').dataset.h, vid = cel.dataset.v, nodos = Object.fromEntries([...cel.querySelectorAll('[data-p]')].map((x) => [x.dataset.p, x.value]));
        S.c.pruebas = S.c.pruebas.filter((p) => !(p.hook === hid && p.variante === vid));
        if (nodos.valor !== '' || nodos.metrica || nodos.fuente) S.c.pruebas.push({ hook: hid, variante: vid, metrica: nodos.metrica, valor: nodos.valor === '' ? null : Number(nodos.valor), fuente: nodos.fuente });
        return cambio();
      }
      if (t.dataset.vn) { const v = S.c.variantes.find((x) => x.id === t.dataset.vn); if (v) { v.nombre = t.value; cambio(); } return; }
      const h = fila && por(fila.dataset.id); if (!h || !t.dataset.k) return;
      h[t.dataset.k] = t.dataset.k === 'consciencia' ? (t.value === '' ? null : Number(t.value)) : t.value;
      cambio();
    };

    // Laya: solo con el puente de la compu. Si algo no se puede leer, el puntaje se queda «pendiente» (no se inventa).
    async function calificar() {
      const st = await puenteEstado(true).catch(() => null); S.laya = Boolean(st?.listo);
      if (!S.laya) { pinta(); return toast('Laya no está lista en esta compu: los puntajes quedan pendientes', true); }
      let n = 0;
      try {
        const { juzgarLocal } = await import('../laya-ui.js'), { PUERTAS } = await import('../laya.js');
        for (const h of vivos(S.c).filter((x) => !x.laya.puntaje)) {
          const r = await juzgarLocal({ texto: h.texto, questions: PUERTAS.idea.preguntas, model: undefined });
          const lista = r?.juicios || r?.judgments || r?.resultado || (Array.isArray(r) ? r : []), j = (Array.isArray(lista) ? lista : []).find((x) => x?.question_id === 'engancha'), p = Math.round(Number(j?.answer));
          if (p >= 1 && p <= 4) { const x = por(h.id); x.laya = { puntaje: p, chip: String(j.why || '').slice(0, 80) }; n++; }
        }
      } catch (e) { toast(e.message || 'Laya no respondió', true); }
      cambio(); toast(n ? `Laya calificó ${n}` : 'Laya no devolvió puntajes legibles: siguen pendientes');
    }

    pinta();
    // La Investigación (los posts reales) se lee una vez; sin ella, «Traer del research» avisa.
    if (slug) api(`investigacion?profile=${enc(slug)}`).then((r) => { S.research = Array.isArray(r?.items) ? r.items : []; if (el.isConnected) pinta(); }).catch(() => { S.research = []; });
    puenteEstado().then((s) => { S.laya = Boolean(s?.listo); if (el.isConnected) pinta(); }).catch(() => {});
  },
};
