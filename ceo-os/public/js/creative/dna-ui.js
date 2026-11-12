// Vista de Brand DNA Studio (herramienta brand-dna-studio de Creative). NO usa el Tool Shell: su casa es brand_boards.dna (no deliverables).
// 4 bloques (territorio y arquetipo · personalidad con sliders y radar · voz · activos distintivos). «Generar» pide a la IA con
// correrIA() y solo si hay estrategia APROBADA y ficha; cada sección se acepta o se descarta por separado. Guarda con la v leída (409).
// Edita solo quien edita Clientes (canEdit(me,'clients')). Exporta .md y PDF (jsPDF); NO escribe en el repo (decisión 7.2-f).
// Pinta con html`…` (todo se escapa; lo del modelo pasa por limpiar() y nunca por raw()). Lo vacío dice «⚠️ SIN DATOS».
import { html, raw, mount, api, col, ico, toast, acts, skel, $ } from '../core.js';
import { canEdit } from '../roleviews.js';
import { herramientaDe } from '../herramientas.js';
import { armarCtx, correrIA } from '../ia-herramienta.js';
import { SIN_DATOS } from '../consulting/marcos.js';
import { BLOQUE, SECCIONES, EJES, MIN_ACTIVOS, MAX_ACTIVOS, TONO_N, vacio, limpiar, mezclar, seccionLlena, radar, faltas, prompt, leer, aMd } from './dna.js';
import { fallo, vacio as vacioOS } from '../visual.js';

const BB = col('brand_boards');
const enc = encodeURIComponent;
const lineas = (t) => String(t ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const slugArchivo = (s) => String(s || 'marca').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marca';

function descargar(nombre, tipo, contenido) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo })), a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
let pdfLib = null;
async function jsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  pdfLib = pdfLib || new Promise((ok, mal) => { const s = document.createElement('script'); s.src = '/vendor/jspdf.umd.min.js'; s.onload = ok; s.onerror = () => mal(new Error('No pude cargar el generador de PDF')); document.head.append(s); });
  await pdfLib; return window.jspdf.jsPDF;
}
async function exportarPdf(md, nombre) {
  const Doc = await jsPDF(), d = new Doc({ unit: 'pt', format: 'letter' }), W = d.internal.pageSize.getWidth() - 96, H = d.internal.pageSize.getHeight() - 64;
  let y = 56;
  for (const raw0 of md.split('\n')) {
    const t = raw0.replace(/\*\*/g, '').replace(/^\|\s*-+.*$/, ''), h1 = /^# /.test(t), h2 = /^## /.test(t);
    if (!t.trim()) { y += 6; continue; }
    d.setFont('helvetica', h1 || h2 ? 'bold' : 'normal'); d.setFontSize(h1 ? 20 : h2 ? 14 : 10.5);
    for (const l of d.splitTextToSize(t.replace(/^#+ /, '').replace(/^\|\s?|\s?\|$/g, '').replace(/\s\|\s/g, '   ·   '), W)) { if (y > H) { d.addPage(); y = 56; } d.text(l, 48, y); y += h1 ? 26 : h2 ? 20 : 14; }
  }
  d.save(nombre);
}

export async function dnaTool(host, { me, slug, b, alive } = {}) {
  mount(host, skel('pagina'));
  const T = { id: 'brand-dna-studio', ws: 'creative', nombre: 'Brand DNA Studio', ...herramientaDe('brand-dna-studio'), prompt, bloque: BLOQUE };
  const S = { doc: null, nuevo: false, dna: vacio(), base: '', est: null, prop: {}, ocupado: '', ctrl: null, aviso: '' };
  const edit = canEdit(me, 'clients');
  const nombre = b?.name || slug;
  const conFicha = () => Boolean(S.est?.ficha?.hay), aprobada = () => Boolean(S.est?.vivaAprobada);
  const sucio = () => JSON.stringify(limpiar(S.dna)) !== S.base;
  const puedeGenerar = () => edit && conFicha() && aprobada() && !S.ocupado;
  const razonOff = () => (!edit ? 'Tu rol solo puede mirar' : !conFicha() ? 'Sin ficha de oferta: sale de clients/<cliente>/00-onboarding/plan-contratado.md' : !aprobada() ? 'Falta la estrategia aprobada: se aprueba en Strategy' : '');

  async function leerTodo() {
    const [doc, est] = await Promise.all([BB.get(slug).then((d) => ({ d, nuevo: false })).catch((e) => (e.status === 404 ? { d: { id: slug }, nuevo: true } : Promise.reject(e))), api('estrategia/' + enc(slug)).catch(() => null)]);
    S.doc = doc.d; S.nuevo = doc.nuevo; S.est = est; S.dna = limpiar(doc.d.dna); S.base = JSON.stringify(S.dna);
  }
  async function guardar(extra = {}) {
    if (!edit) return false;
    const next = { ...S.doc, dna_validado: null, ...extra, dna: limpiar(S.dna) };
    try { const r = S.nuevo ? await BB.create({ ...next, images: next.images || [] }) : await BB.save(next); S.doc = r; S.nuevo = false; S.dna = limpiar(r.dna); S.base = JSON.stringify(S.dna); toast('Guardado'); return true; }
    catch (e) { toast(e.status === 409 ? 'Alguien más guardó el tablero. Recargo lo último: revisa y vuelve a guardar.' : e.message, true); if (e.status === 409) { const mio = S.dna; await leerTodo().catch(() => {}); S.dna = mio; } return false; }
  }

  // ---------- Pintar ----------
  const lista = (id, v, ph, dis) => html`<textarea data-k="${id}" rows="3" placeholder="${ph}" ${dis ? 'disabled' : ''}>${v.join('\n')}</textarea>`;
  const prop = (id) => (S.prop[id] && seccionLlena(S.prop[id], id) ? html`<div class="dna-prop"><b>${ico('sparkles', 13)} Propuesta de la IA</b><pre>${JSON.stringify(vistaSec(S.prop[id], id), null, 1)}</pre><div class="dna-acts"><button class="btn xs" data-act="aceptar" data-s="${id}">${ico('check', 13)} Aceptar esta sección</button><button class="btn ghost xs" data-act="descartar" data-s="${id}">Descartar</button></div></div>` : '');
  const vistaSec = (c, id) => { const x = limpiar(c); return id === 'personalidad' ? Object.fromEntries(x.personalidad.map((p, i) => [`${EJES[i].izq} ↔ ${EJES[i].der}`, p.valor])) : x[id]; };
  const gen = (id) => html`<button class="btn ghost xs" data-act="gen" data-s="${id}" ${puedeGenerar() ? '' : 'disabled'} title="${razonOff()}">${ico('sparkles', 13)} ${S.ocupado === id ? 'Generando…' : 'Generar'}</button>`;
  const cab = (s, extra = '') => html`<div class="dna-h"><h3>${s.nombre}</h3><span class="sp"></span>${extra}${edit ? gen(s.id) : ''}</div>`;

  function radarSvg(c) {
    const r = radar(c, 100);
    return html`<svg class="dna-radar" viewBox="-135 -125 270 250" role="img" aria-label="Radar de personalidad">
      ${[0.25, 0.5, 0.75, 1].map((k) => html`<polygon points="${r.ejes.map((e) => e.fin.map((n) => Math.round(n * k * 100) / 100).join(',')).join(' ')}" class="g"/>`)}
      ${r.ejes.map((e) => html`<line x1="0" y1="0" x2="${e.fin[0]}" y2="${e.fin[1]}" class="g"/><text x="${e.fin[0] * 1.2}" y="${e.fin[1] * 1.14 + 3}" text-anchor="middle" class="t">${e.der}</text>`)}
      ${r.poligono ? html`<polygon points="${r.poligono}" class="p"/>` : html`<text x="0" y="4" text-anchor="middle" class="t">${SIN_DATOS}: ubica al menos 3 ejes</text>`}</svg>`;
  }
  function pintar() {
    if (!alive()) return;
    const x = limpiar(S.dna), f = faltas(x, { ficha: conFicha(), aprobada: aprobada() }), ro = !edit;
    // Las filas se pintan como se están escribiendo (limpiar() quita las vacías): así una fila en blanco no se corre de lugar.
    const par = (Array.isArray(S.dna.voz?.pares) ? S.dna.voz.pares : []).slice(0, 5).map((p) => ({ bien: String(p?.bien ?? ''), mal: String(p?.mal ?? '') })); while (par.length < 3) par.push({ bien: '', mal: '' });
    const act = (Array.isArray(S.dna.activos) ? S.dna.activos : []).slice(0, MAX_ACTIVOS).map((a) => ({ nombre: String(a?.nombre ?? ''), que: String(a?.que ?? ''), prueba: String(a?.prueba ?? '') })); while (act.length < MIN_ACTIVOS) act.push({ nombre: '', que: '', prueba: '' });
    mount(host, html`<div class="dna" id="dna-raiz">
      <div class="dna-top"><div><h2>Brand DNA Studio</h2><span class="mut sm">${nombre} · el ADN de la marca: territorio, personalidad, voz y activos</span></div><span class="sp"></span>
        <span class="chip ${conFicha() ? '' : 'warn'}">${ico('file-text', 12)} ${conFicha() ? 'Con ficha' : 'Sin ficha'}</span><span class="chip ${aprobada() ? 'lime' : ''}">${ico(aprobada() ? 'check' : 'edit', 12)} ${aprobada() ? 'Estrategia aprobada' : 'Estrategia sin aprobar'}</span>
        ${S.doc?.dna_validado ? html`<span class="chip lime">${ico('check', 12)} Validado</span>` : ''}</div>
      ${razonOff() && edit ? html`<p class="mut sm">${ico('lock', 13)} «Generar» está apagado: ${razonOff()}.</p>` : ''}
      ${!conFicha() ? html`${vacioOS({ icono: 'inbox', titulo: 'Bloqueado: sin ficha de oferta', linea: `${SIN_DATOS}: sale de clients/${slug}/00-onboarding/plan-contratado.md. Completa la ficha en Clientes y vuelve.`, compacto: true })}` : ''}
      <div class="dna-bar">${edit ? html`<button class="btn" data-act="gen" data-s="" ${puedeGenerar() ? '' : 'disabled'} title="${razonOff()}">${ico('sparkles', 14)} ${S.ocupado === 'todo' ? 'Generando…' : 'Generar todo'}</button><button class="btn ghost" data-act="guardar" ${sucio() ? '' : 'disabled'}>Guardar${sucio() ? ' · hay cambios' : ''}</button><button class="btn ghost" data-act="validar" ${f.length || sucio() ? 'disabled' : ''} title="${f.length ? 'Falta: ' + f[0] : sucio() ? 'Guarda primero' : ''}">${ico('check', 14)} Validar</button>` : ''}
        <span class="sp"></span><button class="btn ghost" data-act="md">${ico('download', 14)} .md</button><button class="btn ghost" data-act="pdf">${ico('download', 14)} PDF</button></div>
      <section class="dna-sec">${cab(SECCIONES[0])}${prop('territorio')}
        <label>Territorio<input data-k="territorio.territorio" value="${x.territorio.territorio}" placeholder="El lugar que la marca ocupa en la cabeza de su cliente" ${ro ? 'disabled' : ''}></label>
        <label>Arquetipo<input data-k="territorio.arquetipo" value="${x.territorio.arquetipo}" placeholder="El cuidador, el explorador…" ${ro ? 'disabled' : ''}></label>
        <div class="dna-2"><label>Es (uno por línea)${lista('territorio.es', x.territorio.es, 'cálida, honesta…', ro)}</label><label>No es (uno por línea)${lista('territorio.no_es', x.territorio.no_es, 'gritona, genérica…', ro)}</label></div></section>
      <section class="dna-sec">${cab(SECCIONES[1])}${prop('personalidad')}<div class="dna-pers"><div>
        ${EJES.map((e, i) => { const v = x.personalidad[i].valor; return html`<label class="dna-eje"><span>${e.izq}</span><input type="range" min="0" max="10" step="1" value="${v ?? 5}" data-eje="${i}" ${ro ? 'disabled' : ''}><span>${e.der}</span><b data-val="${i}">${v === null ? '—' : v}</b></label>`; })}
        <p class="mut sm">${x.personalidad.some((p) => p.valor === null) ? `${SIN_DATOS}: mueve cada slider para ubicar el eje (sale de la entrevista y de los avatares)` : '0 es el extremo izquierdo, 10 el derecho'}</p></div><div id="dna-radar">${radarSvg(x)}</div></div></section>
      <section class="dna-sec">${cab(SECCIONES[2])}${prop('voz')}
        <label>Tono en ${TONO_N} palabras (una por línea)${lista('voz.tono', x.voz.tono, 'cercano\nclaro\ndirecto', ro)}</label>
        <div class="dna-pares">${par.map((p, i) => html`<div class="dna-par"><label>Se dice así<input data-k="voz.pares.${i}.bien" value="${p.bien}" ${ro ? 'disabled' : ''}></label><label>No así<input data-k="voz.pares.${i}.mal" value="${p.mal}" ${ro ? 'disabled' : ''}></label></div>`)}</div>
        <div class="dna-2"><label>Palabras sí${lista('voz.si', x.voz.si, 'una por línea', ro)}</label><label>Palabras no${lista('voz.no', x.voz.no, 'una por línea', ro)}</label></div></section>
      <section class="dna-sec">${cab(SECCIONES[3], html`<span class="mut sm">${x.activos.length} de ${MIN_ACTIVOS}–${MAX_ACTIVOS}${x.activos.length < MIN_ACTIVOS ? ' · con menos de 3 no se valida' : ''}</span>`)}${prop('activos')}
        <div class="dna-activos">${act.map((a, i) => html`<div class="dna-activo"><b>${i + 1}</b><label>Activo<input data-k="activos.${i}.nombre" value="${a.nombre}" ${ro ? 'disabled' : ''}></label><label>Qué es<input data-k="activos.${i}.que" value="${a.que}" ${ro ? 'disabled' : ''}></label><label>Su prueba${a.nombre && !a.prueba ? html` <span class="chip warn">${SIN_DATOS}</span>` : ''}<input data-k="activos.${i}.prueba" value="${a.prueba}" placeholder="Dónde se reconoce sin el logo" ${ro ? 'disabled' : ''}></label></div>`)}</div>
        ${edit && x.activos.length < MAX_ACTIVOS ? html`<button class="btn ghost xs" data-act="masact">+ Activo</button>` : ''}</section>
      ${f.length ? html`<section class="dna-sec"><h3>Para validar falta</h3><ul>${f.map((m) => html`<li>${m}</li>`)}</ul></section>` : html`<p class="mut sm">${ico('check', 13)} Todo listo para validar.</p>`}
    </div>`);
  }

  // ---------- Cambios (no repintan el campo donde se escribe) ----------
  const poner = (ruta, v) => {
    const p = ruta.split('.'), d = S.dna; let o = d;
    for (let i = 0; i < p.length - 1; i++) { const k = /^\d+$/.test(p[i]) ? +p[i] : p[i]; if (o[k] == null) o[k] = /^\d+$/.test(p[i + 1]) ? [] : {}; o = o[k]; }
    const u = p[p.length - 1], k = /^\d+$/.test(u) ? +u : u;
    o[k] = ['territorio.es', 'territorio.no_es', 'voz.tono', 'voz.si', 'voz.no'].includes(ruta) ? lineas(v) : v;
  };
  host.addEventListener('change', (e) => {
    const t = e.target; if (!edit || !t.dataset) return;
    if (t.dataset.k) {
      if (/^(voz\.pares|activos)\./.test(t.dataset.k)) { const [c, i] = t.dataset.k.split('.'); const l = S.dna[c] || (S.dna[c] = []); while (l.length <= +i) l.push(c === 'activos' ? { nombre: '', que: '', prueba: '' } : { bien: '', mal: '' }); }
      poner(t.dataset.k, t.value);
      const g = $('[data-act="guardar"]', host); if (g) g.disabled = !sucio(); // sin repintar: la persona sigue escribiendo
    }
  });
  host.addEventListener('input', (e) => {
    const t = e.target; if (!edit || t.dataset?.eje === undefined) return;
    const i = +t.dataset.eje; S.dna.personalidad = EJES.map((ej, n) => ({ eje: ej.id, valor: n === i ? +t.value : (limpiar(S.dna).personalidad[n].valor) }));
    const v = $(`[data-val="${i}"]`, host); if (v) v.textContent = t.value;
    const r = $('#dna-radar', host); if (r) mount(r, radarSvg(S.dna));
  });

  // ---------- Acciones ----------
  async function generar(seccion) {
    if (!puedeGenerar()) return toast(razonOff() || 'Ahora no se puede generar', true);
    S.ocupado = seccion || 'todo'; S.ctrl = new AbortController(); pintar();
    try {
      const base = await armarCtx(me, { tool: T, slug });
      const ctx = { ...base, seccion, dna: seccion ? limpiar(S.dna) : null, aprobada: [base.estrategia?.meta, base.estrategia?.etapa ? `etapa ${base.estrategia.etapa.n}` : '', ...(base.entradas || []).map((e) => e.titulo)].filter(Boolean).join(' · ') || 'Estrategia aprobada (ver Strategy)' };
      const r = await correrIA(me, { tool: T, ctx, signal: S.ctrl.signal });
      const l = leer(r.texto);
      if (!l) toast('La IA no devolvió un bloque dna que se pueda leer. Reintenta.', true);
      else { S.prop = {}; for (const s of SECCIONES) if ((!seccion || seccion === s.id) && seccionLlena(l.contenido, s.id)) S.prop[s.id] = mezclar(vacio(), l.contenido, s.id); toast(Object.keys(S.prop).length ? 'Propuesta lista: revisa y acepta por sección' : 'La IA no trajo nada para esa sección', !Object.keys(S.prop).length); }
    } catch (e) { if (e.name !== 'AbortError') toast(e.message, true); }
    S.ocupado = ''; S.ctrl = null; pintar();
  }
  acts(host, {
    gen: (t) => generar(t.dataset.s || ''),
    aceptar: (t) => { const id = t.dataset.s; S.dna = mezclar(S.dna, S.prop[id], id); delete S.prop[id]; toast('Sección aceptada: falta guardar'); pintar(); },
    descartar: (t) => { delete S.prop[t.dataset.s]; pintar(); },
    guardar: async () => { if (await guardar()) pintar(); },
    validar: async () => { if (await guardar({ dna_validado: { at: new Date().toISOString(), por: me?.role || '' } })) pintar(); },
    masact: () => { S.dna.activos = [...(S.dna.activos || []), { nombre: '', que: '', prueba: '' }].slice(0, MAX_ACTIVOS); pintar(); },
    md: () => descargar(`guia-de-marca-${slugArchivo(slug)}.md`, 'text/markdown;charset=utf-8', aMd(S.dna, { cliente: nombre })),
    pdf: async () => { try { await exportarPdf(aMd(S.dna, { cliente: nombre }), `guia-de-marca-${slugArchivo(slug)}.pdf`); } catch (e) { toast(e.message, true); } },
  });

  try { await leerTodo(); } catch (e) { if (alive()) mount(host, html`${fallo({ titulo: 'No pude leer el ADN de la marca', linea: e.message })}`); return; }
  pintar();
}
