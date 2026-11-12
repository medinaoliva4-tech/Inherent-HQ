import { html, raw, mount, api, col, toast, ico, inline, md as mdDoc, acts, canEdit, $, $$ } from './core.js';
import { leerSistema, fuentesUrl, tokensCss, contraste, sinEmoji, figmaDe, tipoAsset, escribirSistema, huella, contrasteFino, pasaAA, matrizContraste, parContraste, faltasSistema, medidasDe, colorEn, plano, hexOk, sistemaVacio, AA } from './sistema-visual.js';

// Marca › Diseño › Design system (herramienta Visual Identity Builder): el sistema visual de la marca a la vista, como un portal de marca
// (zeroheight, Frontify). Dos pestañas: «Publicado» (lo de siempre: 02-marca/sistema-visual.md del repo, cada valor se copia con un clic)
// y «Editor» (borrador por secciones en brand_boards.sistema_borrador; exporta sistema-visual.md, NO lo publica: eso lo decide el CEO).
const REPO = 'https://github.com/medinaoliva4-tech/Inherent-HQ/blob/main/';
const IDX = [['color', 'Color'], ['tipo', 'Tipografía'], ['logo', 'Logo'], ['comp', 'Composición'], ['imagen', 'Imagen'], ['mov', 'Movimiento'], ['no', 'Lo prohibido'], ['assets', 'Assets'], ['kit', 'Kit de redes']];
const md = (s) => raw(inline(s));
const fontsOn = new Set();
function cargarFuentes(url) { if (!url || fontsOn.has(url)) return; fontsOn.add(url); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l); }
const fam = (f) => `'${String(f).replace(/'/g, '')}', Arial, sans-serif`;
const copiar = async (t, msg = 'Copiado') => { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast('No pude copiar: selecciónalo a mano', true); } };

async function publicadoUI(el, { me, b, alive }) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  if (b.personal) return mount(el, html`<div class="empty"><b>La marca personal no tiene design system todavía</b>Por ahora vive en Identidad.</div>`);
  let d;
  try { d = await api(`repo/client/${encodeURIComponent(b.slug)}/sistema`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el sistema visual</b>${e.message}</div>`); }
  if (!alive()) return;
  if (!d.md) return mount(el, html`<section class="sp-panel dsy-vacio"><span class="soon-ic">${ico('layers', 22)}</span><h2>${b.name} todavía no tiene su sistema visual</h2>
    <p>Lo escribe ②B Branding con <b>br-sistema</b>, en <code>${d.path}</code>: los colores con su hex, las tipografías con sus tamaños, la grilla y las reglas. Cuando esté en el repo, aparece aquí solo.</p>
    <p class="mut sm">Sin sistema visual, ⑥A Diseño gráfico no arranca.</p></section>`);

  const sis = leerSistema(d.md);
  cargarFuentes(fuentesUrl(sis.tipo.familias));
  const S = { on: 'color' };
  // Los assets (íconos, texturas, fotos) viven en la carpeta «01 Assets de marca» del Drive del cliente.
  const acc = await col('accounts').get('acc-' + b.slug).catch(() => null);
  if (!alive()) return;
  const A = { folder: acc?.assets || acc?.drive_dirs?.['01 Assets de marca'] || '', files: null, error: '' };
  const kitFigma = figmaDe(d.kit);
  const logoSrc = (l) => d.logos[l?.archivo] || '';

  const sw = (c) => html`<div class="dsy-sw"><div class="dsy-swc" style="background:${c.hex}"><em style="color:${contraste(c.hex, '#FFFFFF') >= 3 ? '#fff' : '#262523'}">${c.rol}</em></div>
    <div class="dsy-swt"><b>${c.nombre}</b><button type="button" class="dsy-hex" data-act="hex" data-v="${c.hex}" title="Copiar">${c.hex} <span>copiar</span></button>${c.usa ? html`<small>${c.usa}</small>` : ''}${c.no ? html`<small class="dsy-nousa">No: ${c.no}</small>` : ''}</div></div>`;
  const cb = (x) => html`<div class="dsy-cb" style="background:${x.fondo.hex};color:${x.tinta.hex}"><b style="font-family:${fam(sis.tipo.familias[0]?.nombre || 'Inter')}">Aa</b><span>${x.label}</span><span>${x.ratio ?? contraste(x.tinta.hex, x.fondo.hex)}</span><i class="${x.ok ? '' : 'no'}">${x.nota}</i></div>`;
  const tr = (e) => html`<div class="dsy-tr"><span class="dsy-tn"><b>${e.nivel}</b>${e.fuente}</span>
    <span class="dsy-ts" style="font-family:${fam(e.familia)};font-weight:${e.peso};font-size:${Math.min(e.size, 64)}px;line-height:${e.lh};letter-spacing:${e.tracking}em;${e.mayus ? 'text-transform:uppercase;' : ''}${e.color ? `color:${e.color}` : ''}">${e.size >= 30 ? b.name : 'Así se lee el texto de la marca en una pieza.'}</span>
    <span class="dsy-tm">${e.medida}</span></div>`;
  const reglasHtml = (ts) => ts.map((t) => html`${t.titulo ? html`<span class="lbl">${t.titulo}</span>` : ''}${t.kv
    ? html`<div class="dsy-rules">${t.rows.map((r) => html`<div class="dsy-rl"><span class="lbl">${raw(inline(r[0]).replace(/<\/?b>/g, ''))}</span><div>${md(r[1])}</div></div>`)}</div>`
    : html`<div class="dsy-tbl"><table><thead><tr>${t.head.map((h) => html`<th>${h}</th>`)}</tr></thead><tbody>${t.rows.map((r) => html`<tr>${r.map((c) => html`<td>${md(c)}</td>`)}</tr>`)}</tbody></table></div>`}`);
  const sec = (k, titulo, sub, cuerpo) => html`<section class="dsy-sec" id="dsy-${k}"><h2>${titulo}</h2>${sub ? html`<p class="dsy-sub">${sub}</p>` : ''}${cuerpo}</section>`;

  function assetsHtml() {
    if (!A.folder) return html`<p class="mut sm" style="margin:0">Esta marca todavía no tiene su carpeta de Drive. Créala en Clientes › la marca › Ajustes › Drive, y sube ahí los íconos, las texturas y las fotos.</p>`;
    const abrir = html`<a class="btn ghost xs" href="${A.folder}" target="_blank" rel="noopener">${ico('drive', 12)} Abrir la carpeta</a>`;
    if (A.error) return html`<div class="row" style="gap:10px"><span class="mut sm">${A.error}</span>${abrir}</div>`;
    if (!A.files) return html`<p class="mut sm" style="margin:0">Leyendo la carpeta…</p>`;
    if (!A.files.length) return html`<div class="row" style="gap:10px"><span class="mut sm">La carpeta está vacía.</span>${abrir}</div>`;
    const grupos = {}; for (const f of A.files) (grupos[tipoAsset(f)] ||= []).push(f);
    return html`<div class="row" style="justify-content:flex-end">${abrir}</div>${Object.entries(grupos).map(([g, fs]) => html`<span class="lbl">${g} · ${fs.length}</span><div class="dsy-as">${fs.map((f) => html`<a class="dsy-a" href="${f.link}" target="_blank" rel="noopener" title="${f.name}">
      <span class="dsy-ai">${/^image\//.test(f.mime) ? html`<img alt="" loading="lazy" src="https://drive.google.com/thumbnail?id=${encodeURIComponent(f.id)}&sz=w400">` : ico(/folder/.test(f.mime) ? 'folder' : 'doc', 22)}</span><small>${f.name}</small></a>`)}</div>`)}`;
  }
  async function cargarAssets() {
    if (!A.folder) return;
    try { A.files = (await api(`google/drive?folder=${encodeURIComponent(A.folder)}`)).files || []; }
    catch (e) { A.error = e.status === 403 ? 'Tu perfil no puede leer Drive desde el OS.' : e.code === 'NO_GOOGLE' || /google/i.test(e.message) ? 'Conecta tu Google para ver los assets aquí.' : e.message; }
    if (alive()) { const box = $('#dsy-af', el); if (box) mount(box, assetsHtml()); }
  }

  function paint() {
    const T = sis.tipo;
    mount(el, html`<div class="dsy">
      <nav class="dsy-idx">${IDX.map(([k, l]) => html`<button type="button" class="${S.on === k ? 'on' : ''}" data-act="ir" data-k="${k}"><i></i>${l}</button>`)}
        <div class="dsy-src"><span class="lbl" style="margin:0">De dónde sale</span><span><b>sistema-visual.md</b> · el que abren ⑥A Diseño gráfico y ⑦ Video para ejecutar</span>
          <a href="${REPO + d.path}" target="_blank" rel="noopener">${ico('link', 12)} Ver el archivo</a>
          <button type="button" class="btn ghost xs" data-act="tokens">${ico('copy', 12)} Copiar tokens CSS</button></div>
        ${sis.referentes.length ? html`<div class="dsy-src"><span class="lbl" style="margin:0">Referentes</span>${sis.referentes.map((r) => html`<span><b>${r.quien}</b> · ${r.que}</span>`)}</div>` : ''}</nav>
      <main class="dsy-main">
        ${sec('color', 'Color', sis.colores.length ? `${sis.colores.length} colores${sis.colores.some((c) => /acento/i.test(c.rol)) ? ' · un solo acento' : ''}. Clic en un hex para copiarlo.` : 'El archivo no trae la tabla de color.', html`
          <div class="dsy-sws">${sis.colores.map(sw)}</div>
          ${sis.colorNotas.map((n) => html`<p class="dsy-nota">${md(n)}</p>`)}
          ${sis.contrastes.length ? html`<span class="lbl">Contraste verificado</span><div class="dsy-cbs">${sis.contrastes.map(cb)}</div>` : ''}`)}
        ${sec('tipo', 'Tipografía', T.familias.map((f) => `${f.nombre} para ${f.para.toLowerCase()}`).join(' · ') || 'El archivo no trae las familias.', html`
          ${T.familias.length ? html`<div class="dsy-fams">${T.familias.map((f) => html`<div class="dsy-fam"><b style="font-family:${fam(f.nombre)};font-weight:500">${f.nombre}</b><small>${f.para} · ${f.pesos}</small></div>`)}</div>` : ''}
          <div class="dsy-ty">${T.escala.map(tr)}</div>
          ${T.combinaciones.length ? html`<span class="lbl">Las combinaciones</span><div class="dsy-rules">${T.combinaciones.map((c) => html`<div class="dsy-rl"><span class="lbl">${c.n}</span><div>${c.que}</div></div>`)}</div>` : ''}
          ${T.notas.length ? html`<ul class="dsy-ul">${T.notas.map((n) => html`<li>${md(n)}</li>`)}</ul>` : ''}`)}
        ${sec('logo', 'Logo', sis.logos.length ? `${sis.logos.length} versiones, cada una con su fondo. Clic para descargar.` : 'El archivo no trae la tabla de logos.', html`
          <div class="dsy-lgs">${sis.logos.map((l) => html`<div><a class="dsy-lg" style="background:${l.fondo?.hex || '#fff'}" ${logoSrc(l) ? raw(`href="${logoSrc(l)}" download="${l.archivo}"`) : ''}>${logoSrc(l) ? html`<img alt="${l.version}" src="${logoSrc(l)}">` : html`<span class="mut sm">Falta ${l.archivo}</span>`}</a><small><b>${l.version}</b>${l.donde ? ` · ${l.donde}` : ''}</small></div>`)}</div>`)}
        ${sec('comp', 'Composición', '', reglasHtml(sis.composicion))}
        ${sec('imagen', 'Imagen', '', html`${reglasHtml(sis.imagen.reglas)}${sis.imagen.notas.map((n) => html`<p class="dsy-nota">${md(n)}</p>`)}`)}
        ${sec('mov', 'Movimiento', 'Para ⑦ Video Editing', reglasHtml(sis.movimiento))}
        ${sec('no', 'Lo prohibido', '', sis.prohibido.length ? html`<ul class="dsy-no">${sis.prohibido.map((n) => html`<li>${md(n.replace(/\.$/, ''))}</li>`)}</ul>` : html`<p class="mut sm">El archivo no trae la lista.</p>`)}
        ${sec('assets', 'Assets', 'Íconos, texturas, fotos y lo demás que se usa en las piezas. Viven en la carpeta «01 Assets de marca» de Drive.', html`<div id="dsy-af">${assetsHtml()}</div>`)}
        ${sec('kit', 'Kit de redes', d.kit ? 'Cómo se aplica el sistema en redes. Los componentes viven en Figma.' : '', d.kit ? html`${kitFigma ? html`<div class="row" style="gap:8px"><a class="btn" href="${kitFigma}" target="_blank" rel="noopener">${ico('link', 13)} Abrir el kit en Figma</a>${d.kitPath ? html`<a class="btn ghost" href="${REPO + d.kitPath}" target="_blank" rel="noopener">Ver el archivo</a>` : ''}</div>` : ''}<div class="dsy-kit">${mdDoc(sinEmoji(d.kit.replace(/^#\s.*\n/, '').replace(/^>.*\n/gm, '').replace(/^(#+)\s*§\s*/gm, '$1 ')))}</div>` : html`<p class="mut sm" style="margin:0">Esta marca todavía no tiene su kit de redes. Lo arma ②B Branding en <code>02-marca/kit-de-redes/kit.md</code>, con el link a su página de Figma.</p>`)}
        ${sis.otras.map((o) => sec('x', o.titulo, '', html`${reglasHtml(o.reglas)}${o.vinetas.length ? html`<ul class="dsy-ul">${o.vinetas.map((n) => html`<li>${md(n)}</li>`)}</ul>` : ''}${o.notas.map((n) => html`<p class="dsy-nota">${md(n)}</p>`)}`))}
      </main>
    </div>`);
  }
  paint();
  cargarAssets();
  // Al bajar, el índice marca la sección que está a la vista.
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { S.on = e.target.id.replace('dsy-', ''); $$('.dsy-idx [data-act="ir"]', el).forEach((a) => a.classList.toggle('on', a.dataset.k === S.on)); } }, { rootMargin: '-20% 0px -70% 0px' });
  $$('.dsy-sec', el).forEach((s) => io.observe(s));
  acts(el, {
    ir: (b2) => { $(`#dsy-${b2.dataset.k}`, el)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    hex: (b2) => copiar(b2.dataset.v, `${b2.dataset.v} copiado`),
    tokens: () => copiar(tokensCss(sis), 'Tokens CSS copiados'),
  });
}


// ======================= Visual Identity Builder: la pestaña «Editor» =======================
const SECS = [['paleta', 'Paleta', 'palette'], ['tipo', 'Tipografía', 'file-text'], ['logos', 'Logos', 'image'], ['grilla', 'Grilla y safe zones', 'layers'], ['no', 'Prohibido', 'x'], ['mock', 'Maquetas', 'smartphone'], ['export', 'Exportar', 'download']];
const PESOS = [[300, 'Light 300'], [400, 'Regular 400'], [500, 'Medium 500'], [600, 'SemiBold 600'], [700, 'Bold 700'], [900, 'Black 900']];
const SIN = (de) => `⚠️ SIN DATOS: ${de}`;
const NIVEL_EXTIENDE = /brand growth|partnership/i;
const seg = (s) => String(s ?? '').replace(/[^\w \-]/g, '');
const hx = (h, o = '#888888') => (hexOk(h) ? h.trim() : o);
const lineas = (t) => String(t ?? '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
const llave = new Set(['__proto__', 'constructor', 'prototype']);
function ponerRuta(obj, ruta, v) { const p = ruta.split('.'); if (p.some((k) => llave.has(k))) return false; const ult = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null || typeof o !== 'object') return false; } o[ult] = v; return true; }
const clon = (x) => JSON.parse(JSON.stringify(x));
// Los pares y los logos apuntan a los objetos de la paleta (si cambias un hex, todo se recalcula).
function enlazar(sis) {
  const por = (c) => sis.colores.find((x) => x.nombre === c?.nombre) || null;
  sis.contrastes = (sis.contrastes || []).map((x) => ({ ...x, tinta: por(x.tinta), fondo: por(x.fondo) })).filter((x) => x.tinta && x.fondo);
  for (const l of sis.logos || []) { const [a, b2] = plano(l.version).split(/\s+sobre\s+/i); l.tinta = colorEn(a || '', sis.colores); l.fondo = colorEn(b2 || '', sis.colores); }
  return sis;
}
const refrescarPares = (sis) => { let bajo = 0; for (const x of sis.contrastes) { x.label = `${x.tinta.nombre} sobre ${x.fondo.nombre}`; x.ratio = contraste(x.tinta.hex, x.fondo.hex); if (x.ok && !pasaAA(x.tinta.hex, x.fondo.hex)) { x.ok = false; bajo++; } } return bajo; };

async function editorUI(host, { me, b, alive }) {
  host.dataset.island = '1';
  mount(host, html`<p class="loading">Cargando el editor…</p>`);
  const BB = col('brand_boards'), puede = canEdit(me, 'clients'), extiende = NIVEL_EXTIENDE.test(b.nivel?.nombre || '');
  let d, doc = null, isNew = false;
  try { d = await api(`repo/client/${encodeURIComponent(b.slug)}/sistema`); } catch (e) { return mount(host, html`<div class="empty"><b>No pude leer el sistema visual</b>${e.message}</div>`); }
  try { doc = await BB.get(b.slug); } catch (e) { if (e.status === 404) isNew = true; else return mount(host, html`<div class="empty"><b>No pude leer el borrador</b>${e.message}</div>`); }
  if (!alive()) return;
  const base = d.md ? leerSistema(d.md) : null, hAhora = huella(d.md || '');
  const S = { sec: 'paleta', sucio: false, conflicto: false, fondo: 0, formato: '' };
  let E;
  const desdeArchivo = () => enlazar(d.md ? clon(leerSistema(d.md)) : sistemaVacio());
  const cargar = () => { const bz = doc?.sistema_borrador; E = bz?.datos ? { datos: enlazar(clon(bz.datos)), huella: bz.huella || '', at: bz.at || '' } : { datos: desdeArchivo(), huella: hAhora, at: '' }; };
  cargar();
  const D = () => E.datos, desfasado = () => Boolean(E.at) && E.huella !== hAhora;
  const esBase = (lista, k, v) => extiende && Boolean(base?.[lista]?.some?.((x) => x[k] === v));
  const fam = (f) => `'${seg(f) || 'Inter'}', Arial, sans-serif`;
  const estiloE = (e, esc = 1) => `font-family:${fam(e.familia)};font-weight:${Number(e.peso) || 400};font-size:${Math.max(8, Math.min((Number(e.size) || 16) * esc, 56))}px;line-height:${Number(e.lh) || 1.2};letter-spacing:${Number(e.tracking) || 0}em;${e.mayus ? 'text-transform:uppercase;' : ''}${hexOk(e.color) ? `color:${e.color.trim()}` : ''}`;
  const logoSrc = (l) => d.logos?.[l?.archivo] || '';

  // ---- Regiones vivas: se recalculan mientras escribes, sin tocar el campo donde estás ----
  const faltas = () => faltasSistema(D());
  const barra = () => { const f = faltas(); return html`<div class="dse-bar"><span class="dse-est" data-sucio="${S.sucio ? 1 : 0}">${S.sucio ? 'Cambios sin guardar' : E.at ? `Borrador guardado · ${String(E.at).slice(0, 10)}` : 'Sin borrador guardado: lo que ves sale del archivo'}</span>
    ${f.length ? html`<ul class="dse-faltas" role="status">${f.map((x) => html`<li>${ico('triangle-alert', 13)} ${x}</li>`)}</ul>` : html`<span class="dse-ok">${ico('check', 13)} Sin faltas: se puede exportar</span>`}</div>`; };
  const matriz = () => {
    const sis = D(), mx = matrizContraste(sis.colores), cs = sis.colores.filter((c) => hexOk(c.hex));
    if (cs.length < 2) return html`<p class="mut sm">${SIN('agrega al menos dos colores con hex para ver la matriz de contraste')}</p>`;
    const cel = (c) => c.ratio === null ? html`<td class="dse-mx-x">—</td>` : html`<td class="dse-mx-c" data-nivel="${c.ratio >= AA ? 'aa' : c.ratio >= 3 ? 'grande' : 'no'}">${c.ratio}</td>`;
    return html`<div class="dse-mx"><table><thead><tr><th>Tinta ↓ · Fondo →</th>${cs.map((c) => html`<th><i style="background:${hx(c.hex)}"></i>${c.nombre}</th>`)}</tr></thead>
      <tbody>${mx.map((r, i) => html`<tr><th><i style="background:${hx(r.tinta.hex)}"></i>${r.tinta.nombre}</th>${r.fila.map(cel)}</tr>`)}</tbody></table>
      <p class="mut sm">${AA} o más: sirve en texto normal. De 3 a ${AA}: solo texto grande. Debajo de 3: no sirve.</p></div>
      <span class="lbl">Pares verificados</span>
      ${sis.contrastes.length ? html`<div class="dse-pares">${sis.contrastes.map((x, i) => { const r = contrasteFino(x.tinta.hex, x.fondo.hex), pasa = pasaAA(x.tinta.hex, x.fondo.hex); return html`<div class="dse-par" data-pasa="${pasa ? 1 : 0}">
        <span class="dse-par-m" style="background:${hx(x.fondo.hex)};color:${hx(x.tinta.hex)}">Aa</span><b>${x.label}</b><span class="dse-par-r">${r ?? '—'}</span>
        <label class="dse-chk"><input type="checkbox" data-p="contrastes.${i}.ok" ${x.ok ? raw('checked') : ''} ${!puede || (!pasa && !x.ok) ? raw('disabled') : ''}> ok</label>
        <input class="in" type="text" data-p="contrastes.${i}.nota" value="${x.nota}" maxlength="120" aria-label="Nota del par" ${puede ? '' : raw('disabled')}>
        ${!pasa ? html`<small class="dse-par-no">${x.ok ? `Está en ok con ${r ?? 'sin dato'}: quítale el ok` : r !== null && r >= 3 ? 'Solo texto grande: no puede ir en ok' : 'No sirve: no puede ir en ok'}</small>` : ''}
        ${puede ? html`<button type="button" class="btn ghost xs" data-act="par-x" data-i="${i}" title="Quitar el par">${ico('x', 12)}</button>` : ''}</div>`; })}</div>` : html`<p class="mut sm">Aún no hay pares. Toca una celda de la matriz para agregarlo.</p>`}`;
  };
  const maquetas = () => {
    const sis = D(), M = medidasDe(sis.composicion), cs = sis.colores.filter((c) => hexOk(c.hex));
    if (!cs.length) return html`<p class="mut sm">${SIN('la paleta (el fondo y la tinta de la maqueta salen de ahí)')}</p>`;
    const fondo = cs[Math.min(S.fondo, cs.length - 1)], tinta = cs.find((c) => c !== fondo && pasaAA(c.hex, fondo.hex)) || null, acento = sis.colores.find((c) => /acento/i.test(c.rol) && hexOk(c.hex));
    const tit = sis.tipo.escala.find((e) => /display|t[ií]tulo 1/i.test(e.nivel)) || sis.tipo.escala[0], eti = sis.tipo.escala.find((e) => /etiqueta/i.test(e.nivel));
    const logo = sis.logos[0], logoImg = logo ? logoSrc(logo) : '';
    const mk = (nombre, W, H, safe) => {
      const k = W / 1080, corto = Math.min(W, H), m = M.margen == null ? null : (M.margen / 100) * corto, n = M.columnas && M.columnas > 0 && M.columnas <= 24 ? Math.round(M.columnas) : null, gut = M.canaleta == null ? 0 : (M.canaleta / 100) * Math.max(W, H);
      return html`<figure class="dse-mkw"><div class="dse-mk" style="width:${W}px;height:${H}px;background:${hx(fondo.hex)}">
        ${m != null && n ? html`<div class="dse-mk-g" style="left:${m}px;right:${m}px;top:${m}px;bottom:${m}px;grid-template-columns:repeat(${n},1fr);gap:${gut}px">${Array.from({ length: n }, () => html`<span></span>`)}</div>` : ''}
        ${m != null ? html`<div class="dse-mk-m" style="left:${m}px;right:${m}px;top:${m}px;bottom:${m}px"></div>` : ''}
        ${safe && M.safe ? html`<div class="dse-mk-s" style="top:0;height:${M.safe.arriba}%"></div><div class="dse-mk-s" style="bottom:0;height:${M.safe.abajo}%"></div><div class="dse-mk-s" style="top:${M.safe.arriba}%;bottom:${M.safe.abajo}%;right:0;width:${M.safe.der}%"></div>` : ''}
        <div class="dse-mk-c" style="left:${m ?? W * 0.07}px;right:${m ?? W * 0.07}px;top:${(safe && M.safe ? M.safe.arriba / 100 * H : 0) + (m ?? W * 0.07)}px;${tinta ? `color:${hx(tinta.hex)}` : 'color:#888'}">
          ${logoImg ? html`<img class="dse-mk-logo" alt="${b.name}" src="${logoImg}" style="height:${Math.round(34 * k * 1.6)}px">` : html`<b class="dse-mk-nom" style="font-size:${Math.round(22 * k * 1.6)}px">${b.name}</b>`}
          ${eti ? html`<p style="${estiloE(eti, k * 1.6)}">Etiqueta de ejemplo</p>` : ''}
          ${tit ? html`<p style="${estiloE({ ...tit, color: null }, k * 1.6)}">Un titular que se lee de lejos</p>` : html`<p class="dse-mk-sd">${SIN('la escala tipográfica')}</p>`}
          ${acento ? html`<i class="dse-mk-ac" style="background:${hx(acento.hex)};width:${Math.round(60 * k * 1.6)}px"></i>` : ''}</div></div>
        <figcaption>${nombre}${safe && !M.safe ? html`<br><small class="dse-sd">${SIN('la fila «Safe zones» de Grilla y safe zones')}</small>` : ''}${m == null ? html`<br><small class="dse-sd">${SIN('la fila «Márgenes»')}</small>` : ''}</figcaption></figure>`;
    };
    return html`<div class="dse-mkc"><label class="dse-chk">Fondo <select class="in" data-act="fondo">${cs.map((c, i) => html`<option value="${i}" ${c === fondo ? raw('selected') : ''}>${c.nombre}</option>`)}</select></label>
      ${!tinta ? html`<span class="dse-sd">Ningún color de la paleta pasa ${AA} sobre este fondo: el texto no se pinta.</span>` : ''}</div>
      <div class="dse-mks">${mk('Post 4:5 (1080 × 1350)', 216, 270, false)}${mk('Reel y story 9:16 (1080 × 1920)', 162, 288, true)}</div>
      <p class="mut sm">Las líneas muestran los márgenes y la grilla; las franjas rojas son las safe zones de 9:16. Todo sale de Grilla y safe zones.</p>`;
  };
  function vivo(que = ['barra', 'matriz', 'mock']) {
    if (que.includes('barra')) { const x = $('#dse-barra', host); if (x) mount(x, barra()); }
    if (que.includes('matriz')) { const x = $('#dse-matriz', host); if (x) mount(x, matriz()); }
    if (que.includes('mock')) { const x = $('#dse-mock', host); if (x) mount(x, maquetas()); }
    cargarFuentes(fuentesUrl(D().tipo.familias));
    $$('.dse-smp[data-i]', host).forEach((n) => { const e = D().tipo.escala[Number(n.dataset.i)]; if (e) n.style.cssText = estiloE(e); });
  }

  // ---- Las secciones ----
  const dis = puede ? '' : raw('disabled');
  const inp = (ruta, v, o = {}) => html`<input class="in" type="${o.t || 'text'}" data-p="${ruta}" ${o.n ? raw(`data-n="${o.n}"`) : ''} value="${v ?? ''}" maxlength="${o.max || 160}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" ${o.bloq || !puede ? raw('disabled') : ''} ${o.step ? raw(`step="${o.step}"`) : ''} autocomplete="off">`;
  const aviso = () => html`${!puede ? html`<p class="dse-aviso">Tu perfil solo puede ver el borrador.</p>` : ''}
    ${extiende ? html`<p class="dse-aviso">${ico('triangle-alert', 14)} En ${b.nivel.nombre} el sistema visual ya viene de Brand Foundation: aquí solo lo extiendes. Lo que ya está en el archivo no se quita ni se renombra.</p>` : ''}
    ${desfasado() ? html`<p class="dse-aviso dse-aviso-no">${ico('triangle-alert', 14)} El archivo del repo cambió desde que empezaste este borrador. ${puede && !extiende ? html`<button type="button" class="btn ghost xs" data-act="reiniciar">Empezar de nuevo desde el archivo</button>` : ''}</p>` : ''}
    ${S.conflicto ? html`<p class="dse-aviso dse-aviso-no">Alguien más guardó el borrador. <button type="button" class="btn ghost xs" data-act="recargar">Traer la última versión</button> (se pierden tus cambios sin guardar).</p>` : ''}`;
  const sPaleta = () => { const sis = D(); return html`
    <p class="dse-sub">Cada color con su hex, dónde se usa y dónde no. Un solo acento.</p>
    <div class="dse-rows">${sis.colores.map((c, i) => { const bloq = esBase('colores', 'nombre', c.nombre); return html`<div class="dse-row dse-row-c">
      <span class="dse-chip" style="background:${hx(c.hex)}"></span>
      ${inp(`colores.${i}.rol`, c.rol, { label: 'Rol', ph: 'Rol', max: 40 })}${inp(`colores.${i}.nombre`, c.nombre, { label: 'Nombre', ph: 'Nombre', max: 40, bloq })}${inp(`colores.${i}.hex`, c.hex, { label: 'Hex', ph: '#RRGGBB', max: 7, bloq })}
      ${inp(`colores.${i}.usa`, c.usa, { label: 'Dónde se usa', ph: 'Dónde se usa', max: 140 })}${inp(`colores.${i}.no`, c.no, { label: 'Dónde no', ph: 'Dónde no', max: 140 })}
      ${puede && !bloq ? html`<button type="button" class="btn ghost xs" data-act="color-x" data-i="${i}" title="Quitar">${ico('x', 12)}</button>` : ''}</div>`; })}
      ${!sis.colores.length ? html`<p class="mut sm">${SIN('sale de la guía de marca y del brief')}</p>` : ''}</div>
    ${puede ? html`<button type="button" class="btn ghost xs" data-act="color-mas">${ico('plus', 12)} Agregar color</button>` : ''}
    <span class="lbl">Notas de color (una por línea)</span><textarea class="in" rows="2" data-lineas="colorNotas" ${dis} aria-label="Notas de color">${sis.colorNotas.join('\n')}</textarea>
    <span class="lbl">Matriz de contraste</span><div id="dse-matriz">${matriz()}</div>`; };
  const sTipo = () => { const sis = D(), T = sis.tipo, fams = T.familias.map((f) => f.nombre).filter(Boolean); return html`
    <p class="dse-sub">Las familias y la escala. Cada nivel se ve con su estilo mientras lo cambias.</p>
    <span class="lbl">Familias</span>
    <div class="dse-rows">${T.familias.map((f, i) => html`<div class="dse-row dse-row-f">${inp(`tipo.familias.${i}.nombre`, f.nombre, { label: 'Familia', ph: 'Familia', max: 40, bloq: extiende && base?.tipo.familias.some((x) => x.nombre === f.nombre) })}${inp(`tipo.familias.${i}.para`, f.para, { label: 'Para qué', ph: 'Para qué', max: 80 })}${inp(`tipo.familias.${i}.pesos`, f.pesos, { label: 'Pesos', ph: 'Medium 500 · Regular 400', max: 80 })}
      ${puede && !(extiende && base?.tipo.familias.some((x) => x.nombre === f.nombre)) ? html`<button type="button" class="btn ghost xs" data-act="fam-x" data-i="${i}" title="Quitar">${ico('x', 12)}</button>` : ''}</div>`)}
      ${!T.familias.length ? html`<p class="mut sm">${SIN('sale de la guía de marca')}</p>` : ''}</div>
    ${puede ? html`<button type="button" class="btn ghost xs" data-act="fam-mas">${ico('plus', 12)} Agregar familia</button>` : ''}
    <span class="lbl">Escala</span>
    <div class="dse-rows">${T.escala.map((e, i) => { const bloq = extiende && base?.tipo.escala.some((x) => x.nivel === e.nivel); return html`<div class="dse-row dse-row-e">
      ${inp(`tipo.escala.${i}.nivel`, e.nivel, { label: 'Nivel', ph: 'Nivel', max: 30, bloq })}
      <select class="in" data-p="tipo.escala.${i}.familia" aria-label="Familia" ${dis}>${[...new Set([...fams, e.familia])].filter(Boolean).map((f) => html`<option value="${f}" ${f === e.familia ? raw('selected') : ''}>${f}</option>`)}</select>
      <select class="in" data-p="tipo.escala.${i}.peso" data-n="1" aria-label="Peso" ${dis}>${PESOS.map(([v, l]) => html`<option value="${v}" ${Number(e.peso) === v ? raw('selected') : ''}>${l}</option>`)}</select>
      ${inp(`tipo.escala.${i}.size`, e.size, { t: 'number', n: 1, label: 'Tamaño en px', max: 4, step: 1 })}
      <input class="in" type="number" step="5" data-p="tipo.escala.${i}.lh" data-n="1" data-k="100" value="${Math.round((Number(e.lh) || 0) * 100)}" aria-label="Interlineado en %" ${dis}>
      <input class="in" type="number" step="0.5" data-p="tipo.escala.${i}.tracking" data-n="1" data-k="100" value="${+((Number(e.tracking) || 0) * 100).toFixed(2)}" aria-label="Espaciado entre letras en %" ${dis}>
      <label class="sw-row"><input type="checkbox" class="switch" data-p="tipo.escala.${i}.mayus" ${e.mayus ? raw('checked') : ''} ${dis}> MAYÚS</label>
      <select class="in" data-p="tipo.escala.${i}.color" aria-label="Color" ${dis}><option value="">Color: el de la pieza</option>${sis.colores.filter((c) => hexOk(c.hex)).map((c) => html`<option value="${c.hex}" ${c.hex === e.color ? raw('selected') : ''}>${c.nombre}</option>`)}</select>
      ${puede && !bloq ? html`<button type="button" class="btn ghost xs" data-act="esc-x" data-i="${i}" title="Quitar">${ico('x', 12)}</button>` : ''}
      <div class="dse-smp" data-i="${i}" style="${estiloE(e)}">${e.size >= 30 ? b.name : 'Así se lee el texto de la marca en una pieza.'}</div></div>`; })}
      ${!T.escala.length ? html`<p class="mut sm">${SIN('sale de la guía de marca y del kit de redes')}</p>` : ''}</div>
    ${puede ? html`<button type="button" class="btn ghost xs" data-act="esc-mas">${ico('plus', 12)} Agregar nivel</button>` : ''}
    <span class="lbl">Combinaciones</span>
    <div class="dse-rows">${T.combinaciones.map((c, i) => html`<div class="dse-row dse-row-k">${inp(`tipo.combinaciones.${i}.n`, c.n, { label: 'Nombre', ph: '01 · Titular + texto', max: 60 })}${inp(`tipo.combinaciones.${i}.que`, c.que, { label: 'Combinación', ph: 'Inter Tight Medium 56 + Inter Light 18', max: 160 })}
      ${puede ? html`<button type="button" class="btn ghost xs" data-act="comb-x" data-i="${i}" title="Quitar">${ico('x', 12)}</button>` : ''}</div>`)}</div>
    ${puede ? html`<button type="button" class="btn ghost xs" data-act="comb-mas">${ico('plus', 12)} Agregar combinación</button>` : ''}
    <span class="lbl">Notas de tipografía (una por línea)</span><textarea class="in" rows="2" data-lineas="tipo.notas" ${dis} aria-label="Notas de tipografía">${T.notas.join('\n')}</textarea>`; };
  const sLogos = () => { const sis = D(); return html`
    <p class="dse-sub">Cada versión con su fondo. El nombre lleva «A sobre B» con colores de la paleta; el archivo vive en <code>02-marca/logos/</code>.</p>
    <div class="dse-rows">${sis.logos.map((l, i) => { const bloq = extiende && base?.logos.some((x) => x.archivo === l.archivo && x.version === l.version); return html`<div class="dse-row dse-row-l">
      <span class="dse-lgv" style="background:${hx(l.fondo?.hex, '#ffffff')}">${logoSrc(l) ? html`<img alt="${l.version}" src="${logoSrc(l)}">` : html`<small>${l.archivo || 'sin archivo'}</small>`}</span>
      ${inp(`logos.${i}.version`, l.version, { label: 'Versión', ph: 'Blanco sobre Negro mate', max: 100, bloq })}${inp(`logos.${i}.archivo`, l.archivo, { label: 'Archivo', ph: 'logo-blanco.svg', max: 60, bloq })}${inp(`logos.${i}.donde`, l.donde, { label: 'Dónde', ph: 'Dónde se usa', max: 120 })}
      ${!l.fondo || !l.tinta ? html`<small class="dse-sd">La versión no nombra dos colores de la paleta.</small>` : ''}
      ${puede && !bloq ? html`<button type="button" class="btn ghost xs" data-act="logo-x" data-i="${i}" title="Quitar">${ico('x', 12)}</button>` : ''}</div>`; })}
      ${!sis.logos.length ? html`<p class="mut sm">${SIN('los archivos del logo vienen del cliente (02-marca/logos/)')}</p>` : ''}</div>
    ${puede ? html`<button type="button" class="btn ghost xs" data-act="logo-mas">${ico('plus', 12)} Agregar versión</button>` : ''}`; };
  const sGrilla = () => { const sis = D(), M = medidasDe(sis.composicion); return html`
    <p class="dse-sub">Grilla, márgenes y safe zones: de aquí salen las maquetas. Las filas se escriben como en el archivo.</p>
    <div class="dse-medidas"><span>Márgenes <b>${M.margen == null ? SIN('fila «Márgenes»') : `${M.margen}% del lado corto`}</b></span><span>Columnas <b>${M.columnas ?? SIN('fila «Grilla»')}</b></span>
      <span>Safe zones 9:16 <b>${M.safe ? `${M.safe.arriba}% arriba · ${M.safe.abajo}% abajo · ${M.safe.der}% derecha` : SIN('fila «Safe zones»')}</b></span></div>
    ${sis.composicion.map((t, ti) => html`${t.titulo ? html`<span class="lbl">${t.titulo}</span>` : ''}<div class="dse-rows">${t.rows.map((r, ri) => html`<div class="dse-row dse-row-g">${r.map((c, ci) => inp(`composicion.${ti}.rows.${ri}.${ci}`, c, { label: t.head[ci] || (ci ? 'Valor' : 'Regla'), max: 400 }))}
      ${puede ? html`<button type="button" class="btn ghost xs" data-act="regla-x" data-t="${ti}" data-i="${ri}" title="Quitar">${ico('x', 12)}</button>` : ''}</div>`)}</div>
      ${puede ? html`<button type="button" class="btn ghost xs" data-act="regla-mas" data-t="${ti}">${ico('plus', 12)} Agregar fila</button>` : ''}`)}
    ${!sis.composicion.length ? html`<p class="mut sm">${SIN('sale de la guía de marca')}</p>${puede ? html`<button type="button" class="btn ghost xs" data-act="comp-nueva">${ico('plus', 12)} Empezar con Grilla, Márgenes y Safe zones</button>` : ''}` : ''}`; };
  const sNo = () => html`<p class="dse-sub">Lo que nunca va. Una regla por línea, escrita como valor, no como adjetivo.</p>
    <textarea class="in" rows="8" data-lineas="prohibido" ${dis} aria-label="Lo prohibido">${D().prohibido.join('\n')}</textarea>
    ${!D().prohibido.length ? html`<p class="mut sm">${SIN('sale de la guía de marca y de lo que el cliente rechazó')}</p>` : ''}`;
  const sMock = () => html`<p class="dse-sub">Cómo se aplica el sistema: lo que cambias en las otras secciones se ve aquí al instante.</p><div id="dse-mock">${maquetas()}</div>`;
  const sExport = () => { const f = faltas(), md = escribirSistema(D(), { nombre: b.name }); return html`
    <p class="dse-sub">Se descarga como <b>sistema-visual.md</b>, igual que el archivo del repo. Aquí no se publica nada.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-act="exportar" ${f.length ? raw('disabled') : ''}>${ico('download', 13)} Exportar sistema-visual.md</button>
      <button type="button" class="btn ghost" data-act="tokens-b">${ico('copy', 13)} Copiar tokens CSS</button>${puede ? html`<button type="button" class="btn ghost" data-act="guardar">${ico('check', 13)} Guardar borrador</button>` : ''}</div>
    ${f.length ? html`<ul class="dse-faltas">${f.map((x) => html`<li>${ico('triangle-alert', 13)} ${x}</li>`)}</ul>` : ''}
    <p class="dse-pub">${ico('link', 13)} Publicar al repo lo decide el CEO.</p>
    <span class="lbl">Vista previa del archivo</span><pre class="dse-pre">${md}</pre>`; };
  const CUERPO = { paleta: sPaleta, tipo: sTipo, logos: sLogos, grilla: sGrilla, no: sNo, mock: sMock, export: sExport };

  function paint() {
    mount(host, html`<div class="dse">
      <div class="dse-top"><nav class="dse-tabs" aria-label="Secciones del editor">${SECS.map(([k, l, ic]) => html`<button type="button" class="${S.sec === k ? 'on' : ''}" data-act="sec" data-k="${k}">${ico(ic, 13)} ${l}</button>`)}</nav>
        ${puede ? html`<button type="button" class="btn xs" data-act="guardar">${ico('check', 12)} Guardar borrador</button>` : ''}</div>
      ${aviso()}<div id="dse-barra">${barra()}</div>
      <section class="dse-cuerpo">${CUERPO[S.sec]()}</section></div>`);
    vivo(['mock']);
  }
  const marcar = () => { S.sucio = true; vivo(['barra']); };

  // ---- Cambios de los campos ----
  host.addEventListener('input', (e) => {
    const t = e.target; if (!puede) return;
    if (t.dataset.lineas) { const ls = lineas(t.value); if (t.dataset.lineas === 'tipo.notas') D().tipo.notas = ls; else D()[t.dataset.lineas] = ls; return marcar(); }
    const p = t.dataset.p; if (!p || t.matches('select[data-act]')) return;
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.n) { if (v === '') return; v = Number(v); if (!Number.isFinite(v)) return; if (t.dataset.k) v /= Number(t.dataset.k); }
    if (p.endsWith('.hex')) { v = String(v).trim(); if (v && !v.startsWith('#')) v = '#' + v; v = v.toUpperCase(); }
    const par = /^contrastes\.(\d+)\.ok$/.exec(p);
    if (par && v) { const x = D().contrastes[Number(par[1])]; if (!x || !pasaAA(x.tinta.hex, x.fondo.hex)) { t.checked = false; return toast(`Bajo ${AA} no puede ir en ok`, true); } }
    if (!ponerRuta(D(), p, v)) return;
    const m = /^tipo\.escala\.(\d+)\./.exec(p); if (m) { const r = D().tipo.escala[Number(m[1])]; r.fuente = ''; r.medida = ''; }
    if (/^tipo\.escala\.\d+\.color$/.test(p) && !v) D().tipo.escala[Number(m[1])].color = null;
    if (/^logos\.\d+\.version$/.test(p)) enlazar(D());
    let que = ['barra'];
    if (/^colores\./.test(p)) { const bajo = refrescarPares(D()); if (bajo) toast(`${bajo} par${bajo === 1 ? '' : 'es'} dejó${bajo === 1 ? '' : 'ron'} de pasar ${AA} y perdió su ok`, true); que = ['barra', 'matriz', 'mock']; }
    else if (/^contrastes\./.test(p)) que = ['barra'];
    else if (/^(composicion|tipo|logos)\./.test(p)) que = ['barra', 'mock'];
    S.sucio = true; vivo(que);
  });
  host.addEventListener('change', (e) => { const t = e.target; if (t.matches('select[data-act="fondo"]')) { S.fondo = Number(t.value) || 0; vivo(['mock']); } });

  // ---- Acciones ----
  const nuevoColor = () => ({ rol: 'Apoyo', nombre: `Color ${D().colores.length + 1}`, hex: '#808080', usa: '', no: '' });
  const quitaColor = (i) => { const c = D().colores[i]; D().colores.splice(i, 1); D().contrastes = D().contrastes.filter((x) => x.tinta !== c && x.fondo !== c); enlazar(D()); };
  async function guardar() {
    if (!puede) return;
    const bz = { datos: clon(D()), huella: E.huella || hAhora, at: new Date().toISOString() };
    try { const r = isNew ? await BB.create({ id: b.slug, sistema_borrador: bz }) : await BB.save({ ...doc, sistema_borrador: bz }); doc = r; isNew = false; E.at = bz.at; E.huella = bz.huella; S.sucio = false; S.conflicto = false; toast('Borrador guardado'); paint(); }
    catch (e) { if (e.status === 409) { S.conflicto = true; paint(); } toast(e.message, true); }
  }
  async function recargar() { try { doc = await BB.get(b.slug); isNew = false; cargar(); S.sucio = false; S.conflicto = false; paint(); } catch (e) { toast(e.message, true); } }
  function exportar() {
    const f = faltas(); if (f.length) return toast(f[0], true);
    const md = escribirSistema(D(), { nombre: b.name }), nombre = `sistema-visual-${b.slug}.md`.replace(/[^a-z0-9._-]/gi, '-');
    try { const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`Descargué ${nombre}`); }
    catch { copiar(md, 'No pude descargar: lo copié'); }
  }
  acts(host, {
    sec: (x) => { S.sec = x.dataset.k; paint(); },
    guardar,
    recargar,
    reiniciar: () => { E = { datos: desdeArchivo(), huella: hAhora, at: '' }; S.sucio = true; paint(); },
    exportar,
    'tokens-b': () => copiar(tokensCss(D()), 'Tokens CSS copiados'),
    'color-mas': () => { D().colores.push(nuevoColor()); marcar(); paint(); },
    'color-x': (x) => { quitaColor(Number(x.dataset.i)); marcar(); paint(); },
    'par-x': (x) => { D().contrastes.splice(Number(x.dataset.i), 1); marcar(); vivo(['matriz']); },
    'fam-mas': () => { D().tipo.familias.push({ nombre: '', para: '', pesos: 'Regular 400' }); marcar(); paint(); },
    'fam-x': (x) => { D().tipo.familias.splice(Number(x.dataset.i), 1); marcar(); paint(); },
    'esc-mas': () => { D().tipo.escala.push({ nivel: `Nivel ${D().tipo.escala.length + 1}`, familia: D().tipo.familias[0]?.nombre || 'Inter', peso: 400, size: 16, lh: 1.4, tracking: 0, mayus: false, color: null, fuente: '', medida: '' }); marcar(); paint(); },
    'esc-x': (x) => { D().tipo.escala.splice(Number(x.dataset.i), 1); marcar(); paint(); },
    'comb-mas': () => { D().tipo.combinaciones.push({ n: `${String(D().tipo.combinaciones.length + 1).padStart(2, '0')} · `, que: '' }); marcar(); paint(); },
    'comb-x': (x) => { D().tipo.combinaciones.splice(Number(x.dataset.i), 1); marcar(); paint(); },
    'logo-mas': () => { const c = D().colores; D().logos.push({ version: c.length > 1 ? `${c[1].nombre} sobre ${c[0].nombre}` : '', archivo: 'logo.svg', donde: '', tinta: null, fondo: null }); enlazar(D()); marcar(); paint(); },
    'logo-x': (x) => { D().logos.splice(Number(x.dataset.i), 1); marcar(); paint(); },
    'regla-mas': (x) => { const t = D().composicion[Number(x.dataset.t)]; t.rows.push(t.head.map(() => '')); marcar(); paint(); },
    'regla-x': (x) => { D().composicion[Number(x.dataset.t)].rows.splice(Number(x.dataset.i), 1); marcar(); paint(); },
    'comp-nueva': () => { D().composicion = [{ titulo: '', head: ['', ''], kv: true, rows: [['Grilla', ''], ['Márgenes', ''], ['Safe zones', '']] }]; marcar(); paint(); },
  });
  // Tocar una celda de la matriz agrega ese par (sin duplicar); ok solo si pasa 4.5.
  host.addEventListener('click', (e) => {
    const td = e.target.closest('.dse-mx-c'); if (!td || !puede) return;
    const cs = D().colores.filter((c) => hexOk(c.hex)), tr = td.parentElement, i = [...tr.parentElement.children].indexOf(tr), j = [...tr.children].indexOf(td) - 1;
    const t = cs[i], f = cs[j]; if (!t || !f || t === f) return;
    if (D().contrastes.some((x) => x.tinta === t && x.fondo === f)) return toast('Ese par ya está');
    D().contrastes.push(parContraste(t, f)); marcar(); vivo(['matriz']);
  });
  paint();
}

// La herramienta Visual Identity Builder (monta 'design'): «Publicado» es el portal de siempre; «Editor» es el borrador por secciones.
export async function designSystemUI(el, ctx) {
  el.dataset.island = '1';
  const { me, b, alive } = ctx;
  if (b.personal) return publicadoUI(el, ctx);
  let on = 'pub';
  mount(el, html`<div class="dse-vistas" role="tablist"><button type="button" role="tab" class="on" data-act="vista" data-k="pub">Publicado</button><button type="button" role="tab" data-act="vista" data-k="edit">Editor</button></div><div class="dse-host"></div>`);
  const host = () => $('.dse-host', el);
  const abrir = (k) => {
    on = k; $$('.dse-vistas [data-k]', el).forEach((x) => { const s = x.dataset.k === k; x.classList.toggle('on', s); x.setAttribute('aria-selected', String(s)); });
    const h = host(), nuevo = h.cloneNode(false); h.replaceWith(nuevo);
    (k === 'pub' ? publicadoUI : editorUI)(nuevo, { me, b, alive: () => alive() && on === k });
  };
  if (el._dseVista) el.removeEventListener('click', el._dseVista);
  el._dseVista = (e) => { const t = e.target.closest('.dse-vistas [data-act="vista"]'); if (t && t.dataset.k !== on) abrir(t.dataset.k); };
  el.addEventListener('click', el._dseVista);
  abrir('pub');
}
