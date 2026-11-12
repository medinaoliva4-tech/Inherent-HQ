// Vista del Content Repurposing Engine (herramienta content-repurposing de Production): la matriz de maestros aprobados × salidas (9:16, 4:5,
// 1:1, 16:9, fragmentos de story, corte de 7 a 15 s y variantes de hook), el medidor de razón 1:2 y, por celda, el caption (con su contador:
// no deja pasar el límite), la ficha de video derivada (POST /api/video, copia los assets del maestro y no agrega ninguno) y los hooks que
// salen a Ads Studio como Borrador. Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen).
// Pinta con html`…` (todo se escapa). Los maestros salen de las fichas de «videos» aprobadas; sin ellos dice ⚠️ SIN DATOS y de dónde salen.
import { html, mount, api, ico, toast } from '../core.js';
import { SIN_DATOS, plano } from '../consulting/marcos.js';
import { SALIDAS, ESTADOS, CORTE, RAZON_META, vacio, limpiar, celdaVacia, salidaDe, maestrosAprobados, derivadasDe, razon, limiteDe, largoCaption, pasaLimite, fichaDerivada, variantesDeHook } from './repurposing.js';

const enc = encodeURIComponent;
const base = (c) => limpiar(structuredClone(plano(c) ? c : {}));

export const vista = {
  // El contenido inicial: vacío. Los maestros aprobados salen de las fichas de video, no se inventan.
  nuevo() { return vacio(); },
  resumen(contenido) { const r = razon(contenido); return r.razon === null ? `Sin maestros · ${SIN_DATOS}` : `${r.derivadas} derivadas de ${r.maestros} maestros · razón 1:${RAZON_META} ${r.ok ? 'lista' : `(van ${r.razon})`}`; },

  pintar(el, { contenido, editable, onCambio, slug } = {}) {
    const ed = Boolean(editable), c = base(contenido), S = { fichas: null, error: '', sel: '', ocupado: false };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    const maestros = () => maestrosAprobados(S.fichas || []);
    const celdaDe = (m, s) => c.celdas.find((x) => x.maestro === m && x.salida === s) || null;
    const llave = (m, s) => `${m}|${s}`;
    const elegida = () => { const [m, s] = S.sel.split('|'); const mm = maestros().find((x) => x.id === m); return mm && salidaDe(s) ? { m: mm, s: salidaDe(s), x: celdaDe(m, s) } : null; };

    function matriz() {
      const ms = maestros();
      if (S.fichas === null) return html`<p class="mut">Leyendo los videos…</p>`;
      if (S.error) return html`<p class="rp-sd">${SIN_DATOS}: ${S.error}</p>`;
      if (!ms.length) return html`<p class="rp-sd">${SIN_DATOS}: no hay maestros aprobados. Salen de las fichas de video aprobadas en el Review & Approval Studio; solo se deriva de lo aprobado.</p>`;
      return html`<div class="rp-scroll"><table class="rp-tabla"><thead><tr><th>Maestro</th>${SALIDAS.map((s) => html`<th title="${s.nombre}">${s.id === 'story' ? 'Story' : s.id === 'corte' ? '7-15 s' : s.id === 'hook' ? 'Hooks' : s.id}</th>`)}</tr></thead>
        <tbody>${ms.map((m) => html`<tr><th scope="row"><span class="rp-m">${m.titulo || m.id}</span><span class="mut sm">${m.formato || ''}${m.duracion ? ` · ${m.duracion} s` : ''} · ${derivadasDe(S.fichas, m.id).length} fichas derivadas</span></th>
          ${SALIDAS.map((s) => { const x = celdaDe(m.id, s.id), on = S.sel === llave(m.id, s.id); return html`<td><button type="button" class="rp-celda" data-a="celda" data-m="${m.id}" data-s="${s.id}" data-estado="${x?.estado || ''}" aria-pressed="${on}" aria-label="${s.nombre} de ${m.titulo || m.id}: ${x ? (x.estado === 'hecha' ? 'hecha' : 'pendiente') : 'sin empezar'}">${x ? (x.estado === 'hecha' ? ico('circle-check', 14) : '·') : ''}</button></td>`; })}</tr>`)}</tbody></table></div>`;
    }
    function medidor() {
      const r = razon(c), pct = r.maestros ? Math.min(100, Math.round((r.derivadas / (r.maestros * RAZON_META)) * 100)) : 0;
      return html`<section class="rp-razon" aria-label="Razón 1:${RAZON_META}"><h4>Razón 1:${RAZON_META}</h4>
        ${r.razon === null ? html`<p class="rp-sd">${SIN_DATOS}: sin maestros en la matriz no hay razón. Elige una celda para empezar.</p>`
          : html`<p class="sm"><b>${r.derivadas}</b> derivadas de <b>${r.maestros * RAZON_META}</b> (${r.maestros} ${r.maestros === 1 ? 'maestro' : 'maestros'} × ${RAZON_META}) · ${r.razon} por maestro${r.ok ? ' · meta cumplida' : html` · faltan ${r.faltan}`}</p>
          <div class="rp-bar" data-ok="${r.ok ? 1 : 0}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Derivadas contra la meta 1:${RAZON_META}"><span style="width:${pct}%"></span></div>`}</section>`;
    }
    function hooks(x) {
      return html`<ul class="rp-hooks">${x.hooks.map((h, i) => html`<li data-enviado="${h.enviado ? 1 : 0}"><input class="in" data-h="${i}" data-f="texto" value="${h.texto}" maxlength="200" placeholder="El gancho" aria-label="Gancho ${i + 1}" ${ed && !h.enviado ? '' : 'disabled'}>
        <input class="in" data-h="${i}" data-f="caption" value="${h.caption}" maxlength="${limiteDe('hook')}" placeholder="Caption (hasta ${limiteDe('hook')})" aria-label="Caption del gancho ${i + 1}" ${ed && !h.enviado ? '' : 'disabled'}>
        ${h.enviado ? html`<span class="chip">En Ads Studio</span>` : ''}</li>`)}</ul>${ed ? html`<button type="button" class="btn" data-a="hook-nuevo">${ico('plus', 14)} Gancho</button>` : ''}`;
    }
    function detalle() {
      const e = elegida(); if (!e) return html`<p class="mut sm">Toca una celda de la matriz para trabajar esa salida.</p>`;
      const { m, s } = e, x = e.x || celdaVacia(m.id, s.id), lim = limiteDe(s.id), n = largoCaption(x.caption);
      return html`<section class="rp-det" aria-label="${s.nombre} de ${m.titulo || m.id}"><h4>${s.nombre} <span class="mut sm">de «${m.titulo || m.id}»</span></h4>
        <div class="rp-campos"><label>Estado<select class="in" data-f="estado" ${ed ? '' : 'disabled'}>${ESTADOS.map(([k, n2]) => html`<option value="${k}" ${x.estado === k ? 'selected' : ''}>${n2}</option>`)}</select></label>
          ${s.id === 'corte' ? html`<label>Duración (${CORTE.min} a ${CORTE.max} s)<input class="in" type="number" min="0" step="0.5" data-f="duracion_s" value="${x.duracion_s ?? ''}" placeholder="${SIN_DATOS}" ${ed ? '' : 'disabled'}></label>` : ''}</div>
        ${s.id === 'hook' ? hooks(x) : html`<label class="rp-cap">Caption<textarea class="in" data-f="caption" rows="3" maxlength="${lim}" ${ed ? '' : 'disabled'}>${x.caption}</textarea></label>
          <p class="sm rp-cont" data-pasa="${pasaLimite(x.caption, s.id) ? 1 : 0}">${n} de ${lim} caracteres</p>`}
        <label>Nota<input class="in" data-f="nota" value="${x.nota}" maxlength="300" ${ed ? '' : 'disabled'}></label>
        <div class="rp-acts">${ed && s.id !== 'hook' && !x.derivada ? html`<button type="button" class="btn" data-a="derivar" ${S.ocupado ? 'disabled' : ''}>${ico('plus', 14)} Crear la ficha de video</button>` : ''}
          ${x.derivada ? html`<span class="chip">Ficha ${x.derivada}</span>` : ''}${ed && s.id === 'hook' ? html`<button type="button" class="btn" data-a="ads" ${S.ocupado || !x.hooks.some((h) => !h.enviado) ? 'disabled' : ''}>${ico('sparkles', 14)} Mandar a Ads Studio (Borrador)</button>` : ''}</div>
        ${s.id !== 'hook' && !x.derivada && ed ? html`<p class="mut sm">La ficha copia los assets del maestro y no suma ninguno: el servidor lo exige.</p>` : ''}</section>`;
    }
    function pintar() { mount(el, html`<div class="rp">${medidor()}${matriz()}<div id="rp-det">${detalle()}</div></div>`); }
    const pintarDet = () => { const d = el.querySelector('#rp-det'); if (d) mount(d, detalle()); };
    // La celda elegida, creándola en la matriz la primera vez que se toca algo.
    function aseguraCelda() {
      const [m, s] = S.sel.split('|'); let x = celdaDe(m, s);
      if (!x) { const mm = maestros().find((y) => y.id === m); x = { ...celdaVacia(m, s), titulo: mm?.titulo || '' }; c.celdas.push(x); }
      return x;
    }
    async function leerFichas() {
      try { S.fichas = (await api(`video?profile=${enc(slug)}`)).fichas || []; S.error = ''; } catch (e) { S.fichas = []; S.error = e?.message || 'no pude leer los videos'; }
      pintar();
    }

    el.onclick = (ev) => {
      const t = ev.target.closest?.('[data-a]'); if (!t) return;
      const a = t.dataset.a;
      if (a === 'celda') { S.sel = llave(t.dataset.m, t.dataset.s); return pintar(); }
      const e = elegida(); if (!e || !ed) return;
      if (a === 'hook-nuevo') { const x = aseguraCelda(); if (x.hooks.length < 10) x.hooks.push({ texto: '', caption: '', enviado: false }); return pintarDet(); }
      if (a === 'derivar') {
        if (S.ocupado) return; const x = aseguraCelda();
        if (e.s.id === 'corte' && !(x.duracion_s >= CORTE.min && x.duracion_s <= CORTE.max)) return toast(`El corte dura entre ${CORTE.min} y ${CORTE.max} s: pon la duración`, true);
        if (pasaLimite(x.caption, e.s.id)) return toast('El caption pasa el límite: acórtalo', true);
        S.ocupado = true; pintarDet();
        api('video', { method: 'POST', body: fichaDerivada(e.m, x, { profile: slug }) }).then((f) => { x.derivada = f.id; x.estado = 'hecha'; S.fichas = [...(S.fichas || []), f]; avisar(); toast('Ficha de video creada'); })
          .catch((err) => toast(err?.message || 'No se pudo crear la ficha', true)).finally(() => { S.ocupado = false; pintar(); });
        return;
      }
      if (a === 'ads') {
        const x = aseguraCelda(), { listas, bloqueadas } = variantesDeHook({ celdas: [x] }, maestros());
        if (bloqueadas.length) toast(`${bloqueadas.length} gancho(s) con el caption pasado del límite: no salen`, true);
        if (!listas.length) return;
        S.ocupado = true; pintarDet();
        api('ads-studio', { method: 'POST', body: { profile: slug, variaciones: listas.map((l) => l.variante) } }).then(() => {
          for (const l of listas) { const h = x.hooks.find((y) => y.texto === l.hook && !y.enviado); if (h) h.enviado = true; }
          avisar(); toast(`${listas.length} en Ads Studio como Borrador (el CEO las aprueba allá)`);
        }).catch((err) => toast(err?.message || 'No se pudo mandar a Ads Studio', true)).finally(() => { S.ocupado = false; pintar(); });
      }
    };
    el.onchange = (ev) => {
      const t = ev.target, f = t?.dataset?.f; if (!f || !ed || !S.sel) return;
      const x = aseguraCelda();
      if (t.dataset.h !== undefined) { const h = x.hooks[Number(t.dataset.h)]; if (h && !h.enviado) h[f] = t.value; }
      else if (f === 'duracion_s') { const n = t.value.trim() === '' ? null : Number(t.value); x.duracion_s = Number.isFinite(n) && n >= 0 ? n : null; }
      else if (f === 'caption') x.caption = t.value.slice(0, limiteDe(x.salida));
      else x[f] = t.value;
      avisar(); if (f === 'estado') pintar();
    };
    // El contador del caption se mueve al escribir, sin repintar (no se pierde el foco).
    el.oninput = (ev) => {
      const t = ev.target; if (t?.dataset?.f !== 'caption' || t.dataset.h !== undefined) return;
      const p = el.querySelector('.rp-cont'), [, s] = S.sel.split('|'); if (!p) return;
      p.textContent = `${largoCaption(t.value)} de ${limiteDe(s)} caracteres`; p.dataset.pasa = pasaLimite(t.value, s) ? '1' : '0';
    };
    pintar(); leerFichas();
  },
};
