// Fase 3 · Laya en la interfaz: el chip del juicio en cada ficha (lead, factura por pagar, referente, idea)
// y la sub-vista Inherent → Laya (el paso a paso para instalar el puente, las puertas y los últimos juicios).
// El motor se intercambia: primero el puente local (instantáneo); si no responde, el juicio queda «pendiente»
// y Claude Code lo resuelve con juicios_pendientes / guardar_juicio. «claude» queda para la Fase 6.
import { html, raw, mount, api, toast, fdate, ico } from './core.js';
import { PUENTE, INSTALAR_MAC, INSTALAR_WIN, OLLAMA, MODELO_LOCAL, INSTALAR_MODELO_MAC, INSTALAR_MODELO_WIN, sistemaDe, MODELO, INSTALAR_MCP, ENGINE_LABEL, TIPOS, TIPO_LABEL, PUERTAS, GATES, cumple, umbralTexto, corto } from './laya.js';

// ---------- el puente local ----------
let est = { at: 0, v: null };
async function conTiempo(url, opts = {}, ms = 4000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...opts, signal: c.signal, credentials: 'omit', cache: 'no-store', targetAddressSpace: 'loopback' }); } finally { clearTimeout(t); }
}
// { on, listo, cargando, modelo, error } — se recuerda 15 s para no tocar el puente en cada ficha.
export async function puenteEstado(force = false) {
  if (!force && est.v && Date.now() - est.at < 15000) return est.v;
  let v = { on: false };
  try { const r = await conTiempo(PUENTE + '/health'); if (r.ok) { const j = await r.json(); v = { on: j.status === 'ok', listo: Boolean(j.listo), cargando: Boolean(j.cargando), modelo: j.modelo || '', error: j.error || null, laya: j.laya || '' }; } } catch { /* apagado */ }
  est = { at: Date.now(), v }; return v;
}
// El modelo local (Ollama, opcional): { on, tiene } — on = responde en 127.0.0.1:11434 · tiene = ya bajó el modelo
// (null si el navegador no deja leer la lista). Primero lee /api/tags; si el navegador no lo deja, basta con que conteste.
let estM = { at: 0, v: null };
export async function modeloLocalEstado(force = false) {
  if (!force && estM.v && Date.now() - estM.at < 15000) return estM.v;
  let v = { on: false, tiene: false };
  try {
    const r = await conTiempo(OLLAMA + '/api/tags');
    if (r.ok) { const j = await r.json(); v = { on: true, tiene: (j.models || []).some((m) => m.name === MODELO_LOCAL) }; }
  } catch {
    try { await conTiempo(OLLAMA + '/api/tags', { mode: 'no-cors' }); v = { on: true, tiene: null }; } catch { /* apagado */ }
  }
  estM = { at: Date.now(), v }; return v;
}
export async function juzgarLocal(t) { // Fase 4: Investigación lo usa para juzgar en lote
  const r = await conTiempo(PUENTE + '/juzgar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: t.texto, questions: t.questions, model: t.model }) }, 180000);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `El puente respondió ${r.status}`);
  return j;
}
async function copiar(text, msg = 'Copiado') { try { await navigator.clipboard.writeText(text); toast(msg); } catch { toast('Selecciona y copia el texto', true); } }

// ---------- el chip en una ficha ----------
const tono = (q, j) => { const c = cumple(q, j); return c === true ? 'ok' : c === false ? 'warn' : ''; };
const linea = (q, j) => `${q?.chip || j.question_id}: ${corto(j.answer)}${j.why ? ` (${j.why})` : ''}${q && umbralTexto(q) ? ` · ${umbralTexto(q)}` : ''}`;
// el: dónde va · coll + id: el elemento juzgado · compact: una línea (el detalle en el tooltip).
export async function layaBox(el, { coll, id, compact = false } = {}) {
  if (!el || !coll || !id) return;
  el.classList.add('ly-box'); if (compact) el.classList.add('compact');
  mount(el, html`<span class="mut sm">Laya…</span>`);
  let data;
  try { data = await api(`laya/juicios?coll=${encodeURIComponent(coll)}&id=${encodeURIComponent(id)}`); }
  catch (e) { if (el.isConnected) mount(el, html`<span class="chip ly-chip off" title="${e.message}">Laya · sin acceso</span>`); return; }
  const paint = () => {
    if (!el.isConnected) return;
    const { puerta, resumen: r, puede } = data, qs = puerta?.preguntas || [], first = qs.find((q) => r.ultimos[q.id]);
    const det = qs.filter((q) => r.ultimos[q.id]).map((q) => ({ q, j: r.ultimos[q.id] }));
    const tip = [...det.map(({ q, j }) => linea(q, j)), r.at ? `${ENGINE_LABEL[det[0]?.j.engine] || ''} · ${fdate(String(r.at).slice(0, 10))}` : ''].filter(Boolean).join('\n');
    const chips = html`<span class="chip ly-chip ${r.estado} ${first && r.estado === 'listo' ? tono(first, r.ultimos[first.id]) : ''}" title="${tip || 'Todavía sin juicio de Laya'}">${r.chip}</span>
      ${r.extra.map((x, k) => { const q = det[k + (r.estado === 'pendiente' ? 0 : 1)]?.q; return html`<span class="chip ly-chip sub ${q ? tono(q, r.ultimos[q.id]) : ''}">${x}</span>`; })}`;
    const btn = puede ? html`<button class="btn xs ghost ly-ask" type="button" data-ly="ask">${r.estado === 'vacio' ? 'Pedir a Laya' : 'Otra vez'}</button>` : '';
    mount(el, compact ? html`<span class="ly-chips">${chips}</span>${btn}`
      : html`<div class="ly-head"><b class="sm">Laya</b><span class="ly-chips">${chips}</span><span class="sp"></span>${btn}</div>
        ${r.estado === 'pendiente' ? html`<div class="mut sm ly-note">Pendiente: sin el puente encendido, lo resuelve Claude Code (juicios_pendientes).</div>` : ''}
        ${det.length ? html`<ul class="ly-list">${det.map(({ q, j }) => html`<li><span class="mut">${q.chip}</span> <b>${corto(j.answer)}</b>${j.why ? html` <span class="mut sm">· ${j.why}</span>` : ''}${umbralTexto(q) ? html` <span class="mut sm">· ${umbralTexto(q)}</span>` : ''}</li>`)}</ul>
          <div class="mut sm">${ENGINE_LABEL[det[0].j.engine] || det[0].j.engine}${det[0].j.model ? ` · ${det[0].j.model}` : ''} · ${fdate(String(det[0].j.at || '').slice(0, 10))}</div>` : ''}`);
  };
  el.onclick = async (e) => {
    const b = e.target.closest('[data-ly="ask"]'); if (!b) return;
    e.stopPropagation(); b.disabled = true; b.textContent = 'Laya está pensando…';
    try {
      const st = await puenteEstado(true);
      if (st.on && !st.error) {
        try {
          const t = await api(`laya/texto?coll=${encodeURIComponent(coll)}&id=${encodeURIComponent(id)}`);
          if (st.cargando) toast('Laya está cargando el modelo: la primera vez tarda un poco');
          const resultado = await juzgarLocal(t);
          data = { ...data, ...(await api('laya/juicios', { method: 'POST', body: { coll, id, engine: 'laya-local', resultado } })) };
          toast('Laya juzgó'); return paint();
        } catch (err) { toast(`El puente no pudo: ${err.message}. Queda pendiente.`, true); }
      }
      data = { ...data, ...(await api('laya/juicios', { method: 'POST', body: { coll, id, pendiente: true } })) };
      if (!st.on) toast('Sin el puente de Laya encendido: quedó pendiente para Claude Code');
      paint();
    } catch (err) { toast(err.message, true); paint(); }
  };
  paint();
}

// ---------- Inherent → Laya ----------
const opcionesTexto = (q) => (q.tipo === 'choice' ? Object.entries(q.opciones || {}).map(([k, v]) => (v && v !== k ? `${k}: ${v}` : k)).join('\n') : q.tipo === 'score' ? (q.niveles || []).join('\n') : '');
const leerOpciones = (tipo, txt) => {
  const ls = String(txt || '').split('\n').map((x) => x.trim()).filter(Boolean);
  if (tipo === 'score') return { niveles: ls };
  if (tipo === 'choice') return { opciones: Object.fromEntries(ls.map((l) => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, l]; })) };
  return {};
};
export async function layaView(el, { me } = {}) {
  const ceo = me?.role === 'ceo';
  mount(el, html`<p class="loading">Cargando…</p>`);
  let P, J;
  try { [P, J] = await Promise.all([api('laya/puertas'), api('laya/juicios?n=20')]); }
  catch (e) { return mount(el, html`<div class="warnbox">No pude leer Laya: ${e.message}</div>`); }
  let puertas = P.puertas, guardadas = { ...(P.guardadas || {}) }, st = await puenteEstado(true), md = await modeloLocalEstado(true);

  // ---- el puente: un paso a paso con check que se pone verde solo (polling a /health cada 3 s) ----
  const sis0 = sistemaDe(globalThis.navigator?.userAgent || '');
  let sis = sis0, copiado = false, abierto = false;
  const cmd = () => (sis === 'win' ? INSTALAR_WIN : INSTALAR_MAC);
  const cmdModelo = () => (sis === 'win' ? INSTALAR_MODELO_WIN : INSTALAR_MODELO_MAC);
  const TERMINAL = {
    mac: html`Abre la Terminal: <b>⌘ Espacio</b> → escribe «Terminal» → Enter. Pega con <b>⌘ V</b> y dale Enter.`,
    linux: html`Abre la Terminal (<b>Ctrl Alt T</b>). Pega con <b>Ctrl Shift V</b> y dale Enter.`,
    win: html`Abre PowerShell: tecla <b>Windows</b> → escribe «PowerShell» → Enter. Pega con <b>Ctrl V</b> y dale Enter.`,
  };
  const num = (hecho, n) => html`<span class="ly-num">${hecho ? ico('check', 13) : n}</span>`;
  const estadoTexto = () => (!st.on ? 'Esperando a Laya… el punto se pone verde solo.' : st.listo ? `Laya corriendo · modelo ${st.modelo || MODELO}`
    : st.error ? `Laya encendió, pero el modelo no cargó: ${st.error}` : 'Laya encendió · cargando el modelo…');
  // El paso opcional: el modelo local. Punto verde si http://127.0.0.1:11434/api/tags responde.
  const mdTexto = () => (md.on ? (md.tiene === false ? `Ollama corriendo, pero falta bajar ${MODELO_LOCAL}: vuelve a correr el comando.` : `Modelo local corriendo · ${MODELO_LOCAL}`) : 'Opcional. Sin él, el texto repetitivo lo escribe Claude.');
  const modeloOpcional = (compacto) => compacto
    ? html`<div class="card ly-card ly-run" style="margin-top:8px"><span class="dot ${md.on ? 'ly-on' : 'ly-off'}"></span><b>Modelo local (opcional)</b><span class="mut">· ${mdTexto()}</span>
        <span class="sp"></span>${md.on && md.tiene !== false ? '' : html`<button class="btn xs ghost" data-l="copiarm">Copiar comando</button>`}</div>`
    : html`<li class="${md.on ? 'hecho' : ''}">${num(md.on, 4)}<div><b>Modelo local (opcional)</b>
          <div class="mut sm">Para variantes de caption, alt text y títulos cortos sin gastar créditos de Claude. Baja ${MODELO_LOCAL} (~3.4 GB).</div>
          <div class="aiurl"><code>${cmdModelo()}</code><button class="btn xs ghost" data-l="copiarm">Copiar</button></div>
          <div class="ly-estado"><span class="dot ${md.on ? 'ly-on' : 'ly-off'}"></span><span class="sm">${mdTexto()}</span></div></div></li>`;
  function puenteCard() {
    if (st.on && st.listo && !abierto) {
      return html`<div class="card ly-card ly-run"><span class="dot ly-on"></span><b>Laya corriendo</b><span class="mut">· modelo ${st.modelo || MODELO}</span>
        <span class="sp"></span><button class="btn xs ghost" data-l="abrir" title="Vuelve a correr el comando para actualizar Laya">Actualizar</button></div>
        ${modeloOpcional(true)}`;
    }
    const h1 = copiado || st.on, h2 = st.on, h3 = st.on && st.listo;
    return html`<div class="card ly-card ly-inst"><b>Deja Laya corriendo en tu compu</b><span class="mut sm"> · una sola vez; después arranca solo, también al reiniciar</span>
      <ol class="ly-pasos">
        <li class="${h1 ? 'hecho' : ''}">${num(h1, 1)}<div><b>Copia este comando</b>
          <div class="aiurl"><code>${cmd()}</code><button class="btn xs" data-l="copiar">Copiar</button></div>
          <button class="ly-lnk mut sm" type="button" data-l="sis">${sis === 'win' ? '¿Usas Mac o Linux?' : '¿Usas Windows?'}</button></div></li>
        <li class="${h2 ? 'hecho' : ''}">${num(h2, 2)}<div><b>${sis === 'win' ? 'Pégalo en PowerShell y espera' : 'Pégalo en la Terminal y espera'}</b>
          <div class="mut sm">${TERMINAL[sis]}</div>
          <div class="mut sm">La primera vez tarda de 5 a 15 minutos (baja ~650 MB). Termina con «Laya está corriendo».</div></div></li>
        <li class="${h3 ? 'hecho' : ''}">${num(h3, 3)}<div><b>Listo</b>
          <div class="ly-estado"><span class="dot ${st.on ? 'ly-on' : 'ly-off ly-pulse'}"></span><span class="sm">${estadoTexto()}</span></div></div></li>
        ${modeloOpcional(false)}
      </ol>
      <div class="mut sm ly-permiso">Chrome te va a preguntar si dejas que Inherent OS hable con tu compu: dale <b>Permitir</b>.</div>
      ${abierto ? html`<button class="btn xs ghost" data-l="cerrar" style="margin-top:10px">Cerrar</button>` : ''}</div>`;
  }
  const pintarPuente = () => { const b = el.querySelector?.('[data-ly-puente]'); if (b) mount(b, puenteCard()); };
  const firma = (v) => [v.on, v.listo, v.cargando, v.error, v.modelo].join('|');
  const firmaM = (v) => [v.on, v.tiene].join('|');
  const gen = (el._lyGen = (el._lyGen || 0) + 1); // una sola vigilancia por pantalla abierta
  async function vigilar() {
    const b = el.querySelector?.('[data-ly-puente]');
    if (el._lyGen !== gen || !b || b.isConnected === false) return; // se salió de Inherent → Laya
    if (!globalThis.document?.hidden) {
      const n = await puenteEstado(true);
      if (el._lyGen !== gen) return;
      const m = await modeloLocalEstado(true);
      if (el._lyGen !== gen) return;
      if (firma(n) !== firma(st) || firmaM(m) !== firmaM(md)) { const antes = st.listo, antesM = md.on; st = n; md = m; pintarPuente(); if (n.listo && !antes) toast('Laya está corriendo'); else if (m.on && !antesM) toast('El modelo local está corriendo'); }
    }
    setTimeout(vigilar, 3000);
  }
  setTimeout(vigilar, 3000);

  const draft = Object.fromEntries(GATES.map((g) => [g, puertas[g].preguntas.map((q) => ({ ...q }))]));

  const qForm = (g, q, k) => html`<div class="ly-qf card" data-g="${g}" data-k="${k}">
    <div class="ly-qrow"><input class="in" data-f="chip" value="${q.chip}" placeholder="Palabra del chip" aria-label="Palabra del chip">
      <select class="in" data-f="tipo" aria-label="Tipo">${TIPOS.map((t) => html`<option value="${t}" ${t === q.tipo ? raw('selected') : ''}>${TIPO_LABEL[t]}</option>`)}</select>
      ${q.tipo !== 'choice' ? html`<input class="in" data-f="umbral" type="number" min="0" max="1" step="0.05" value="${q.umbral ?? ''}" placeholder="sin umbral" title="De 0 a 1. Vacío = sin umbral" aria-label="Umbral">` : html`<span class="mut sm">sin umbral</span>`}
      <button class="arrow light" type="button" data-q="del" title="Quitar la pregunta" aria-label="Quitar la pregunta">${ico('trash', 15)}</button></div>
    <textarea class="in" data-f="texto" rows="2" placeholder="La pregunta">${q.texto}</textarea>
    ${q.tipo === 'noul' ? html`<div class="two"><input class="in" data-f="si" value="${q.si || ''}" placeholder="Qué cuenta como sí (opcional)"><input class="in" data-f="no" value="${q.no || ''}" placeholder="Qué cuenta como no (opcional)"></div>`
      : html`<textarea class="in" data-f="opciones" rows="${Math.min(8, 2 + (q.tipo === 'choice' ? Object.keys(q.opciones || {}).length : (q.niveles || []).length))}" placeholder="${q.tipo === 'score' ? 'Un nivel por línea, de menor a mayor («corto: descripción»)' : 'Una opción por línea («etiqueta: descripción»)'}">${opcionesTexto(q)}</textarea>`}</div>`;
  const leerPuerta = (g) => [...el.querySelectorAll(`.ly-qf[data-g="${g}"]`)].map((f) => {
    const v = (k) => f.querySelector(`[data-f="${k}"]`)?.value ?? '';
    const tipo = v('tipo'), base = { id: draft[g][+f.dataset.k]?.id, chip: v('chip').trim(), tipo, texto: v('texto').trim() };
    const um = v('umbral'); if (tipo !== 'choice') base.umbral = um === '' ? null : +um;
    if (tipo === 'noul') { base.si = v('si').trim(); base.no = v('no').trim(); } else Object.assign(base, leerOpciones(tipo, v('opciones')));
    return base;
  });

  function paint() {
    mount(el, html`<div class="hello sp-hero" style="margin-top:0"><h1>Laya</h1><p>El motor de decisiones que <em>corre en tu compu</em>.</p></div>
      <div data-ly-puente>${puenteCard()}</div>
      <details class="ly-mcp mut sm"><summary>Sin Laya en tu compu, «Pedir a Laya» deja el juicio pendiente: así lo resuelve Claude Code</summary>
        <div class="aiurl"><code>${INSTALAR_MCP}</code><button class="btn xs ghost" data-l="copymcp">Copiar</button></div></details>
      <div class="sec-title" style="margin:26px 0 10px"><h2 style="font-size:19px">Puertas y preguntas</h2><span class="mut sm">${ceo ? 'Las cambia el CEO. Umbral de 0 a 1; vacío = sin umbral.' : 'Solo el CEO las cambia.'}</span></div>
      ${GATES.map((g) => html`<section class="ly-gate"><div class="row"><b>${PUERTAS[g].label}</b><span class="mut sm">· ${PUERTAS[g].donde}</span>${guardadas[g] ? html`<span class="chip sm2">editada</span>` : html`<span class="chip sm2 off">de fábrica</span>`}<span class="sp"></span>
          ${ceo ? html`<button class="btn xs ghost" data-l="add" data-g="${g}">+ Pregunta</button>${guardadas[g] ? html`<button class="btn xs ghost" data-l="reset" data-g="${g}">De fábrica</button>` : ''}<button class="btn xs" data-l="save" data-g="${g}">Guardar</button>` : ''}</div>
        ${ceo ? draft[g].map((q, k) => qForm(g, q, k)) : html`<ul class="ly-list">${draft[g].map((q) => html`<li><b>${q.chip}</b> <span class="mut sm">· ${TIPO_LABEL[q.tipo]}${umbralTexto(q) ? ` · ${umbralTexto(q)}` : ''}</span><br>${q.texto}</li>`)}</ul>`}</section>`)}
      <div class="sec-title" style="margin:26px 0 10px"><h2 style="font-size:19px">Últimos juicios</h2><span class="mut sm">${J.items.length || ''}</span></div>
      ${J.items.length ? html`<div class="card"><table><thead><tr><th>Fecha</th><th>Elemento</th><th>Pregunta</th><th>Respuesta</th><th>Motor</th></tr></thead><tbody>
        ${J.items.map((j) => { const q = (puertas[j.gate]?.preguntas || []).find((x) => x.id === j.question_id); return html`<tr><td class="mut">${fdate(String(j.at || '').slice(0, 10))}</td><td><b style="font-weight:500">${j.target_label || j.target?.id}</b><div class="mut sm">${PUERTAS[j.gate]?.label || j.gate}</div></td>
          <td>${j.status === 'pendiente' ? html`<span class="chip ly-chip pendiente">pendiente</span>` : q?.chip || j.question_id}</td><td>${j.status === 'pendiente' ? '—' : html`${j.tipo === 'noul' ? `${j.answer} · ${Math.round((j.prob || 0) * 100)}% sí` : corto(j.answer)}${j.why ? html`<div class="mut sm">${j.why}</div>` : ''}`}</td><td class="sm">${ENGINE_LABEL[j.engine] || j.engine || '—'}</td></tr>`; })}
      </tbody></table></div>` : html`<div class="empty"><b>Todavía no hay juicios</b>Pídele uno a Laya desde la ficha de un lead, una factura por pagar, un referente o una idea.</div>`}`);
  }
  async function guardar(g, gates, msg) {
    try { const r = await api('laya/puertas', { method: 'PUT', body: { gates } }); puertas = r.puertas; guardadas = { ...(r.guardadas || {}) }; for (const k of GATES) draft[k] = puertas[k].preguntas.map((q) => ({ ...q })); toast(msg); paint(); }
    catch (e) { toast(e.message, true); }
  }
  el.onclick = async (e) => {
    const t = e.target.closest('[data-l],[data-q]'); if (!t || !el.contains(t)) return;
    if (t.dataset.l === 'copiar') { copiado = true; pintarPuente(); return copiar(cmd(), sis === 'win' ? 'Copiado · pégalo en PowerShell' : 'Copiado · pégalo en la Terminal'); }
    if (t.dataset.l === 'copiarm') return copiar(cmdModelo(), sis === 'win' ? 'Copiado · pégalo en PowerShell' : 'Copiado · pégalo en la Terminal');
    if (t.dataset.l === 'sis') { sis = sis !== 'win' ? 'win' : sis0 === 'win' ? 'mac' : sis0; copiado = false; return pintarPuente(); }
    if (t.dataset.l === 'abrir' || t.dataset.l === 'cerrar') { abierto = t.dataset.l === 'abrir'; return pintarPuente(); }
    if (t.dataset.l === 'copymcp') return copiar(INSTALAR_MCP, 'Copiado · pégalo en tu terminal');
    if (!ceo) return;
    const g = t.dataset.g || t.closest('.ly-qf')?.dataset.g;
    if (t.dataset.q === 'del') { draft[g] = leerPuerta(g).filter((_, k) => k !== +t.closest('.ly-qf').dataset.k); return paint(); }
    if (t.dataset.l === 'add') { draft[g] = [...leerPuerta(g), { id: '', chip: '', tipo: 'noul', texto: '', umbral: null }]; return paint(); }
    if (t.dataset.l === 'reset') { const { [g]: _, ...rest } = guardadas; return guardar(g, rest, `${PUERTAS[g].label}: de fábrica`); }
    if (t.dataset.l === 'save') return guardar(g, { ...guardadas, [g]: { preguntas: leerPuerta(g) } }, `${PUERTAS[g].label}: guardada`);
  };
  // Cambiar el tipo cambia los campos de la pregunta: se repinta sin perder lo escrito.
  el.onchange = (e) => { const s = e.target.closest('[data-f="tipo"]'); if (!s) return; const g = s.closest('.ly-qf').dataset.g; draft[g] = leerPuerta(g).map((q) => ({ ...q, ...(q.tipo === 'choice' && !q.opciones ? { opciones: {} } : {}), ...(q.tipo === 'score' && !q.niveles ? { niveles: [] } : {}) })); paint(); };
  paint();
}
