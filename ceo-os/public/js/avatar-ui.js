// App 01 · Marca › Entender › Cliente ideal: los avatares de la marca, con su peso, su ficha y el OK del CEO.
//   Arriba: un chip por avatar (su % y su estado), la barra de pesos y «+ Avatar».
//   Izquierda: la ficha, en el orden del método (pago → quién es → intereses → mercado → momento → dolor y deseo →
//   consciencia → dónde está → qué le decimos → señales en el video) y sus ángulos de contenido.
//   Derecha: nombre, peso, estado, «Proponer con Claude» (en tu compu, solo lectura) y los chequeos (regla 10×, mercado).
// Todo se guarda solo, al dejar cada campo.
import { html, raw, mount, api, toast, ico, $, $$, confirmAsk, fdate } from './core.js';
import { SECCIONES, ANGULOS, ANGULO_AYUDA, MERCADO, REGLA_X, vivos, sumaPesos, reglaX, mercado, avance, promptAvatar, leerPropuesta } from './avatares.js';
import { CONSCIENCIA } from './calendario-contenido.js';
import { tokenDe, saludPuente, preguntar } from './puente-chat.js';

const TONOS = ['#5b4433', '#9a7b5f', '#c3a588', '#7d8b5a', '#b0875a', '#6f5a7a'];
const q = (n) => (n == null || n === '' ? '' : 'Q ' + Number(n).toLocaleString('es-GT'));

export async function avatarUI(el, { me, b, alive }) {
  const S = { lista: [], puede: {}, sel: null, guardando: 0, claude: null, nuevo: false, pedido: '' };
  const carpeta = b.slug === 'inherent' ? 'inherent/inherent-social-media' : b.slug === 'personal' ? 'inherent/personal' : `clients/${b.slug}`;
  mount(el, html`<p class="loading">Cargando…</p>`);
  try { const r = await api(`avatares?profile=${encodeURIComponent(b.slug)}`); S.lista = r.avatares; S.puede = r.puede; }
  catch (e) { if (alive()) mount(el, html`<div class="empty"><b>No pude abrir el cliente ideal</b>${e.message}</div>`); return; }
  if (!alive()) return;
  S.sel = S.lista[0]?.id || null;
  const cur = () => S.lista.find((a) => a.id === S.sel) || null;
  const edita = () => Boolean(S.puede.editar);

  function paint() {
    if (!alive()) return;
    const a = cur();
    mount(el, html`<div class="avt"><div id="av-topw">${top()}</div>${a ? html`<div class="av-body"><div class="av-ficha" id="av-ficha">${ficha(a)}</div><aside class="av-side" id="av-side">${lado(a)}</aside></div>` : vacio()}</div>`);
  }

  // ---------- Arriba: los avatares y sus pesos ----------
  function top() {
    const l = vivos(S.lista), suma = sumaPesos(S.lista);
    return html`<header class="av-top"><div class="av-chips" role="tablist" aria-label="Avatares">${l.map((a, i) => html`<button role="tab" type="button" class="av-chip ${a.id === S.sel ? 'on' : ''}" aria-selected="${a.id === S.sel ? 'true' : 'false'}" data-av="sel" data-id="${a.id}">
        <i style="background:${TONOS[i % TONOS.length]}"></i><b>${a.nombre}</b><span>${a.peso || 0}%</span>${a.estado === 'aprobado' ? html`<span class="av-ok" title="Aprobado por el CEO">${ico('check', 12)}</span>` : ''}</button>`)}
        ${edita() ? (S.nuevo ? html`<form class="av-new" data-av="crear"><input class="in" name="n" placeholder="Nombre del avatar (ej. Dueña de restaurante)" maxlength="80" autocomplete="off" required><button class="btn xs" type="submit">Crear</button><button class="btn ghost xs" type="button" data-av="cancelar">Cancelar</button></form>` : html`<button type="button" class="btn ghost xs av-add" data-av="nuevo">${ico('plus', 13)} Avatar</button>`) : ''}</div>
      ${l.length ? html`<div class="av-pesos"><div class="av-bar" role="img" aria-label="Pesos: ${l.map((a) => `${a.nombre} ${a.peso || 0}%`).join(', ')}">${l.map((a, i) => (a.peso ? html`<i style="flex:${a.peso};background:${TONOS[i % TONOS.length]}" title="${a.nombre} · ${a.peso}%"></i>` : ''))}${suma < 100 ? html`<i class="libre" style="flex:${100 - suma}"></i>` : ''}</div>
        <span class="av-suma ${suma === 100 ? 'ok' : 'warn'}">${suma === 100 ? html`${ico('check', 12)} Suman 100%` : suma < 100 ? `Suman ${suma}%: falta repartir ${100 - suma}%` : `Suman ${suma}%: sobran ${suma - 100}%`}</span>
        <span class="mut sm">El principal recibe más contenido y más pauta (regla práctica: 50 a 70%).</span></div>` : ''}</header>`;
  }
  function vacio() {
    return html`<section class="av-empty"><span class="av-empty-i">${ico('target', 26)}</span><h2>Todavía no hay cliente ideal</h2>
      <p>Empieza por el precio de la oferta: con tu regla, el avatar gana unas ${REGLA_X} veces eso. De ahí sale a qué se dedica, dónde vive y qué le pasa en la vida.</p>
      ${edita() ? html`<button class="btn" data-av="nuevo">${ico('plus', 15)} Crear el primer avatar</button>` : html`<p class="mut sm">Tu perfil puede verlo, pero no editarlo.</p>`}</section>`;
  }

  // ---------- La ficha ----------
  function campo(a, [k, l, t, ayuda]) {
    const c = a.campos || {}, v = c[k], dis = edita() ? '' : raw('disabled');
    let input;
    if (t === 'num') input = html`<div class="av-num"><span>Q</span><input class="in" type="number" min="0" step="1" data-k="${k}" value="${v ?? ''}" ${dis}></div>`;
    else if (t === 'score') input = html`<div class="av-score" role="radiogroup" aria-label="${l}">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" role="radio" aria-checked="${v === n ? 'true' : 'false'}" class="${v >= n ? 'on' : ''}" data-av="score" data-k="${k}" data-n="${n}" ${dis}>${n}</button>`)}</div>`;
    else if (t === 'nivel') input = html`<select class="in" data-k="${k}" ${dis}><option value="">Sin definir</option>${CONSCIENCIA.map((n, i) => html`<option value="${i + 1}" ${v === i + 1 ? raw('selected') : ''}>${i + 1} · ${n}</option>`)}</select>`;
    else if (t === 'lista') input = html`<textarea class="in" rows="${Math.min(8, Math.max(3, (v?.length || 0) + 1))}" data-k="${k}" data-lista="1" placeholder="Una por línea" ${dis}>${(v || []).join('\n')}</textarea>`;
    else if (t === 'area') input = html`<textarea class="in" rows="3" data-k="${k}" ${dis}>${v || ''}</textarea>`;
    else input = html`<input class="in" data-k="${k}" value="${v || ''}" placeholder="${ayuda || ''}" ${dis}>`;
    const extra = k === 'ingreso' && c.precio > 0 && !(v > 0) && edita() ? html`<button type="button" class="av-sug" data-av="sugerido">Con tu regla: ${q(c.precio * REGLA_X)} · Usar</button>` : '';
    return html`<label class="av-f ${t === 'area' || t === 'lista' ? 'w' : ''} ${t === 'score' ? 'sc' : ''}"><span class="av-l">${l}${t === 'score' && ayuda ? html` <i class="mut">· ${ayuda}</i>` : ''}</span>${input}${extra}</label>`;
  }
  function ficha(a) {
    return html`${SECCIONES.map(([id, nombre, ayuda, campos], i) => html`<section class="av-sec" id="av-${id}"><header><span class="av-n">${i + 1}</span><div><h3>${nombre}</h3><p>${ayuda}</p></div></header><div class="av-fields">${campos.map((c) => campo(a, c))}</div></section>`)}
      <section class="av-sec" id="av-angulos"><header><span class="av-n">${SECCIONES.length + 1}</span><div><h3>Ángulos de contenido</h3><p>Distintas formas de presentar la misma oferta a este avatar. Cada pieza del calendario puede llevar su ángulo.</p></div></header>
        <div class="av-angs">${(a.angulos || []).map((g, i) => html`<div class="av-ang"><select class="in" data-ang="tipo" data-i="${i}" ${edita() ? '' : raw('disabled')} title="${ANGULO_AYUDA[g.tipo] || ''}">${ANGULOS.map((t) => html`<option ${t === g.tipo ? raw('selected') : ''}>${t}</option>`)}</select><input class="in" data-ang="texto" data-i="${i}" value="${g.texto}" ${edita() ? '' : raw('disabled')}>${edita() ? html`<button type="button" class="av-x" data-av="ang-quitar" data-i="${i}" aria-label="Quitar ángulo">×</button>` : ''}</div>`)}
          ${edita() ? html`<button type="button" class="btn ghost xs" data-av="ang-mas">${ico('plus', 13)} Ángulo</button>` : ''}${!(a.angulos || []).length ? html`<p class="mut sm">${ANGULOS.map((t) => `${t}: ${ANGULO_AYUDA[t]}`).join(' · ')}</p>` : ''}</div></section>`;
  }

  // ---------- Al lado: estado, peso, Claude y chequeos ----------
  function lado(a) {
    const c = a.campos || {}, rx = reglaX(c), m = mercado(c), pct = avance(a), C = S.claude;
    return html`<div class="av-card"><div class="av-row"><span class="chip ${a.estado === 'aprobado' ? 'av-st-ok' : ''}">${a.estado === 'aprobado' ? html`${ico('check', 12)} Aprobado` : 'Borrador'}</span><span class="mut sm" id="av-save">${S.guardando ? 'Guardando…' : 'Guardado'}</span></div>
        ${a.estado === 'aprobado' && a.aprobado?.en ? html`<p class="mut sm">Lo aprobó el CEO el ${fdate(String(a.aprobado.en).slice(0, 10))}. Si cambias la ficha, vuelve a borrador.</p>` : ''}
        <label class="av-f"><span class="av-l">Nombre</span><input class="in" data-top="nombre" value="${a.nombre}" ${edita() ? '' : raw('disabled')}></label>
        <label class="av-f"><span class="av-l">Peso</span><div class="av-peso"><input type="range" min="0" max="100" step="5" data-top="peso" value="${a.peso || 0}" ${edita() ? '' : raw('disabled')} aria-label="Peso del avatar"><b>${a.peso || 0}%</b></div></label>
        <div class="av-av"><span class="mut sm">Ficha completa al ${pct}%</span><div class="av-av-b"><i style="width:${pct}%"></i></div></div>
        ${S.puede.aprobar ? (a.estado === 'aprobado' ? html`<button class="btn ghost xs" data-av="reabrir">Reabrir</button>` : html`<button class="btn xs" data-av="aprobar" ${pct < 30 ? raw('disabled title="Completa más la ficha antes de aprobar"') : ''}>${ico('check', 13)} Aprobar</button>`) : html`<p class="mut sm">El CEO lo aprueba.</p>`}</div>
      <div class="av-card"><span class="lbl">Chequeos</span>
        <div class="av-chk ${rx ? (rx.ok ? 'ok' : 'warn') : ''}">${ico(rx ? (rx.ok ? 'check' : 'alert') : 'dot', 14)}<div><b>Regla ${REGLA_X}×</b><span class="mut sm">${rx ? `Gana ${rx.x}× el precio${rx.ok ? '' : `: con tu regla debería ganar ${q(rx.sugerido)}`}` : 'Falta el precio o el ingreso'}</span></div></div>
        <div class="av-chk ${m ? (m.suma / m.de >= 0.7 ? 'ok' : 'warn') : ''}">${ico(m ? (m.suma / m.de >= 0.7 ? 'check' : 'alert') : 'dot', 14)}<div><b>Mercado ${m ? `${m.suma} de ${m.de}` : ''}</b><span class="mut sm">${m ? MERCADO.map(([k, l]) => `${l} ${c[k] || '—'}`).join(' · ') : 'Falta el puntaje de Hormozi'}</span></div></div>
        <div class="av-chk ${(c.decir?.length || c.mostrar?.length) ? 'ok' : ''}">${ico((c.decir?.length || c.mostrar?.length) ? 'check' : 'dot', 14)}<div><b>Señales en el video</b><span class="mut sm">${(c.decir?.length || 0) + (c.mostrar?.length || 0)} señales para que Meta lo lleve a esta persona</span></div></div></div>
      ${edita() ? html`<div class="av-card"><span class="lbl">Claude, en tu compu</span>
        ${!C || C.fase === 'listo' ? html`<p class="mut sm">Lee la carpeta del cliente y propone la ficha con tu método. Solo lectura: tú decides qué se queda.</p>
          <textarea class="in" rows="2" data-av-pedido placeholder="Opcional: qué quieres que mire (ej. «enfócate en dueños de restaurante en zona 10»)">${S.pedido}</textarea>
          <button class="btn xs" data-av="claude">${ico('spark', 13)} Proponer con Claude</button>` : ''}
        ${C?.fase === 'pensando' ? html`<p class="av-think"><span class="es-dots-t"><i></i><i></i><i></i></span> ${C.tool || 'Pensando…'}</p><button class="btn ghost xs" data-av="claude-parar">Detener</button>` : ''}
        ${C?.fase === 'propuesta' ? html`<p class="sm"><b>Claude propone ${Object.keys(C.prop.campos).length} campos y ${C.prop.angulos.length} ángulos.</b></p><div class="av-row"><button class="btn xs" data-av="usar-todo">Usar todo</button><button class="btn ghost xs" data-av="usar-vacio">Solo lo vacío</button><button class="btn ghost xs" data-av="descartar">Descartar</button></div>` : ''}
        ${C?.fase === 'error' ? html`<p class="es-err">${C.error}</p><button class="btn ghost xs" data-av="descartar">Entendido</button>` : ''}
        ${C?.texto && C.fase !== 'error' ? html`<details class="av-resp"><summary>Lo que respondió</summary><div class="sm">${C.texto.replace(/```json[\s\S]*?```/g, '').trim().slice(0, 1500)}</div></details>` : ''}</div>` : ''}
      ${edita() ? html`<button class="av-arch" data-av="archivar">Archivar este avatar</button>` : ''}`;
  }

  // ---------- Guardar ----------
  let timer = null, pend = {};
  function guardar(patch, ya = false) {
    const a = cur(); if (!a) return;
    if (patch.campos) pend.campos = { ...(pend.campos || {}), ...patch.campos };
    for (const k of ['nombre', 'peso', 'angulos']) if (k in patch) pend[k] = patch[k];
    S.guardando++; const s = $('#av-save', el); if (s) s.textContent = 'Guardando…';
    clearTimeout(timer); timer = setTimeout(enviar, ya ? 0 : 600);
  }
  async function enviar() {
    const a = cur(), body = pend; pend = {}; if (!a || !Object.keys(body).length) { S.guardando = 0; return; }
    try { const d = await api(`avatares/${a.id}`, { method: 'PUT', body }); S.lista = S.lista.map((x) => (x.id === d.id ? d : x)); }
    catch (e) { toast(e.message, true); }
    S.guardando = 0;
    if (!alive()) return;
    // Solo se repinta lo que no está en uso (el campo con el foco no se pierde).
    const side = $('#av-side', el); if (side) mount(side, lado(cur()));
    const tp = $('#av-topw', el); if (tp) mount(tp, top());
  }

  // ---------- Claude ----------
  let ctrl = null;
  async function proponer() {
    const a = cur(); if (!a) return;
    const tok = tokenDe(me), s = await saludPuente();
    if (!s.on) { S.claude = { fase: 'error', error: 'El puente de Laya no está encendido en esta compu. Enciéndelo desde Estrategia (un comando, una vez).' }; return paint(); }
    if (!s.listo) { S.claude = { fase: 'error', error: 'El puente está encendido pero falta conectar el chat (el repo o Claude Code). Revísalo en Estrategia.' }; return paint(); }
    if (!tok) { S.claude = { fase: 'error', error: 'Falta emparejar esta compu. Hazlo una vez en Estrategia › cualquier cliente › Chat.' }; return paint(); }
    S.claude = { fase: 'pensando', texto: '', tool: '' }; paint();
    ctrl = new AbortController();
    try {
      const texto = await preguntar({ prompt: promptAvatar({ marca: b.name, carpeta, avatar: a, otros: vivos(S.lista).filter((x) => x.id !== a.id), pedido: S.pedido }), token: tok, signal: ctrl.signal,
        onDelta: (t) => { S.claude.texto = t; }, onTool: (t) => { S.claude.tool = t; const side = $('#av-side', el); if (side) mount(side, lado(cur())); } });
      const prop = leerPropuesta(texto);
      S.claude = prop ? { fase: 'propuesta', prop, texto } : { fase: 'error', error: 'Claude respondió, pero sin el bloque de datos. Intenta de nuevo.', texto };
    } catch (e) { S.claude = { fase: 'error', error: e.name === 'AbortError' ? 'Detenido.' : e.status === 401 ? 'El puente no reconoció tu token: vuelve a emparejar en Estrategia.' : e.message }; }
    ctrl = null; paint();
  }
  function usar(soloVacio) {
    const a = cur(), P = S.claude?.prop; if (!a || !P) return;
    const c = a.campos || {}, vacio = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
    const campos = Object.fromEntries(Object.entries(P.campos).filter(([k]) => !soloVacio || vacio(c[k])));
    const angulos = soloVacio && (a.angulos || []).length ? a.angulos : [...(soloVacio ? [] : []), ...P.angulos];
    a.campos = { ...c, ...campos }; a.angulos = angulos; S.claude = null;
    guardar({ campos, angulos }, true); paint();
  }

  // ---------- Eventos ----------
  el.onclick = async (e) => {
    const t = e.target.closest('[data-av]'); if (!t) return;
    const act = t.dataset.av, a = cur();
    if (act === 'sel') { S.sel = t.dataset.id; S.claude = null; return paint(); }
    if (act === 'nuevo') { S.nuevo = true; paint(); return $('.av-new input', el)?.focus(); }
    if (act === 'cancelar') { S.nuevo = false; return paint(); }
    if (act === 'score') { const n = +t.dataset.n, k = t.dataset.k; a.campos = { ...(a.campos || {}), [k]: a.campos?.[k] === n ? null : n }; guardar({ campos: { [k]: a.campos[k] } }); return paint(); }
    if (act === 'sugerido') { const v = a.campos.precio * REGLA_X; a.campos = { ...a.campos, ingreso: v }; guardar({ campos: { ingreso: v } }); return paint(); }
    if (act === 'ang-mas') { a.angulos = [...(a.angulos || []), { tipo: ANGULOS[0], texto: '' }]; paint(); return $$('[data-ang="texto"]', el).at(-1)?.focus(); }
    if (act === 'ang-quitar') { a.angulos = (a.angulos || []).filter((_, i) => i !== +t.dataset.i); guardar({ angulos: a.angulos.filter((g) => g.texto) }); return paint(); }
    if (act === 'aprobar' || act === 'reabrir') { try { const d = await api(`avatares/${a.id}/aprobar`, { method: 'POST', body: { aprobar: act === 'aprobar' } }); S.lista = S.lista.map((x) => (x.id === d.id ? d : x)); toast(act === 'aprobar' ? 'Avatar aprobado: Laya ya lo usa' : 'Reabierto'); } catch (err) { toast(err.message, true); } return paint(); }
    if (act === 'archivar') { if (!(await confirmAsk(`¿Archivar «${a.nombre}»? No se borra: deja de contar para los pesos.`))) return; try { await api(`avatares/${a.id}/archivar`, { method: 'POST', body: {} }); S.lista = S.lista.filter((x) => x.id !== a.id); S.sel = vivos(S.lista)[0]?.id || null; } catch (err) { toast(err.message, true); } return paint(); }
    if (act === 'claude') return proponer();
    if (act === 'claude-parar') { try { ctrl?.abort(); } catch {} return; }
    if (act === 'usar-todo') return usar(false);
    if (act === 'usar-vacio') return usar(true);
    if (act === 'descartar') { S.claude = null; return paint(); }
  };
  el.onsubmit = async (e) => {
    if (e.target.dataset.av !== 'crear') return; e.preventDefault();
    const nombre = new FormData(e.target).get('n')?.toString().trim(); if (!nombre) return;
    try { const d = await api('avatares', { method: 'POST', body: { profile: b.slug, nombre } }); S.lista = [...S.lista, d]; S.sel = d.id; S.nuevo = false; paint(); }
    catch (err) { toast(err.message, true); }
  };
  el.onchange = (e) => {
    const t = e.target, a = cur(); if (!a) return;
    if (t.dataset.k) {
      const k = t.dataset.k, v = t.dataset.lista ? t.value.split('\n').map((x) => x.trim()).filter(Boolean) : t.tagName === 'SELECT' || t.type === 'number' ? (t.value === '' ? null : +t.value) : t.value;
      a.campos = { ...(a.campos || {}), [k]: v }; guardar({ campos: { [k]: v } });
      if (k === 'precio' || k === 'ingreso') setTimeout(() => { const f = $('#av-ficha', el), y = f ? window.scrollY : 0; if (!alive()) return; mount($('#av-ficha', el), ficha(cur())); window.scrollTo(0, y); }, 0);
      return;
    }
    if (t.dataset.ang) { const i = +t.dataset.i; a.angulos = (a.angulos || []).map((g, j) => (j === i ? { ...g, [t.dataset.ang]: t.value } : g)); return guardar({ angulos: a.angulos.filter((g) => g.texto.trim()) }); }
    if (t.dataset.top === 'nombre') { a.nombre = t.value.trim() || a.nombre; return guardar({ nombre: a.nombre }); }
    if (t.dataset.top === 'peso') { a.peso = +t.value; return guardar({ peso: a.peso }); }
  };
  el.oninput = (e) => {
    if (e.target.dataset.top === 'peso') { const bx = e.target.parentElement.querySelector('b'); if (bx) bx.textContent = e.target.value + '%'; }
    if (e.target.hasAttribute('data-av-pedido')) S.pedido = e.target.value;
  };
  paint();
}
