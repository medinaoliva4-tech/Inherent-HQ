import { html, raw, mount, api, col, toast, ico, inline, acts, $, $$ } from './core.js';
import { leerSistema, fuentesUrl, tokensCss, contraste, zonas, roles } from './sistema-visual.js';

// Marca › Diseño › Design system: el sistema visual de la marca a la vista, como un portal de marca (zeroheight, Frontify).
// Cada valor se copia con un clic; a la derecha, una pieza de prueba armada con el mismo sistema, con la grilla y las
// safe zones encima. La fuente es 02-marca/sistema-visual.md del repo: se edita allá (②B Branding, br-sistema).
const REPO = 'https://github.com/medinaoliva4-tech/Inherent-HQ/blob/main/';
const IDX = [['color', 'Color'], ['tipo', 'Tipografía'], ['logo', 'Logo'], ['comp', 'Composición'], ['imagen', 'Imagen'], ['mov', 'Movimiento'], ['no', 'Lo prohibido']];
const md = (s) => raw(inline(s));
const fontsOn = new Set();
function cargarFuentes(url) { if (!url || fontsOn.has(url)) return; fontsOn.add(url); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l); }
const fam = (f) => `'${String(f).replace(/'/g, '')}', Arial, sans-serif`;
const copiar = async (t, msg = 'Copiado') => { try { await navigator.clipboard.writeText(t); toast(msg); } catch { toast('No pude copiar: selecciónalo a mano', true); } };

export async function designSystemUI(el, { me, b, alive }) {
  el.dataset.island = '1';
  mount(el, html`<p class="loading">Cargando…</p>`);
  if (b.personal) return mount(el, html`<div class="empty"><b>La marca personal no tiene design system todavía</b>Por ahora vive en Identidad.</div>`);
  let d;
  try { d = await api(`repo/client/${encodeURIComponent(b.slug)}/sistema`); } catch (e) { return mount(el, html`<div class="empty"><b>No pude leer el sistema visual</b>${e.message}</div>`); }
  if (!alive()) return;
  if (!d.md) return mount(el, html`<section class="sp-panel dsy-vacio"><span class="soon-ic">${ico('layers', 22)}</span><h2>${b.name} todavía no tiene su sistema visual</h2>
    <p>Lo escribe ②B Branding con <b>br-sistema</b>, en <code>${d.path}</code>: los colores con su hex, las tipografías con sus tamaños, la grilla y las reglas. Cuando esté en el repo, aparece aquí solo.</p>
    <p class="mut sm">Sin sistema visual, ⑥A Diseño gráfico no arranca.</p></section>`);

  const sis = leerSistema(d.md), Z = zonas(sis), R = roles(sis);
  cargarFuentes(fuentesUrl(sis.tipo.familias));
  const board = await col('brand_boards').get(b.slug).catch(() => null);
  if (!alive()) return;
  const foto = (board?.images || []).map((x) => x.url).find((u) => /^https:\/\//.test(u || '')) || '';
  const S = { fmt: 'post', grilla: true, safe: true, foto: Boolean(foto), titulo: b.name, cifra: '+120', on: 'color' };
  const logoSrc = (l) => d.logos[l?.archivo] || '';
  const tit = sis.tipo.escala.find((e) => /t[ií]tulo 1|display/i.test(e.nivel)) || sis.tipo.escala[0];
  const cif = sis.tipo.escala.find((e) => /cifra/i.test(e.nivel));
  const eti = sis.tipo.escala.find((e) => /etiqueta/i.test(e.nivel));
  const principal = sis.logos.find((l) => l.fondo?.hex === R?.fondo.hex) || sis.logos[0];

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

  function pieza() {
    if (!R) return '';
    const st = S.fmt === 'story', m = Z.margen ?? 7; // la pieza mide 1080 px de ancho: cada tamaño se escala al ancho del cuadro (cqw)
    const pad = st ? { t: Z.story.arriba ?? 14, b: Z.story.abajo ?? 22, r: Z.story.derecha ?? m } : { t: m, b: m, r: m };
    const h = st ? 16 / 9 : 5 / 4; // alto / ancho
    const y = (p) => `${p / h}%`; // los % verticales se miden contra el alto
    const t = (e, min) => `max(${min}px, ${Math.round((e?.size || 40) / 10.8 * 100) / 100}cqw)`;
    const cols = Z.columnas || 6;
    const chk = [
      [R.acento ? true : null, R.acento ? 'Un solo acento' : 'El archivo no nombra un acento'],
      [contraste(R.tinta.hex, R.fondo.hex) >= 4.5, `Contraste del título: ${contraste(R.tinta.hex, R.fondo.hex)}`],
      [Z.margen != null, Z.margen != null ? `Dentro de los márgenes de ${Z.margen}%` : 'El archivo no dice los márgenes'],
    ];
    return html`<div class="dsy-pv"><div class="row" style="justify-content:space-between"><b>Pieza de prueba</b><div class="tabs mini" style="margin:0">${[['post', 'Post 4:5'], ['story', 'Story']].map(([v, l]) => html`<button type="button" class="${S.fmt === v ? 'on' : ''}" data-act="fmt" data-v="${v}">${l}</button>`)}</div></div>
      <div class="dsy-frame ${st ? 'st' : ''}" style="background:${R.fondo.hex}">
        ${S.foto && foto ? html`<div class="dsy-ph" style="background-image:url('${foto.replace(/'/g, '%27')}')"></div>` : ''}
        ${S.grilla ? html`<div class="dsy-grid" style="left:${m}%;right:${m}%;grid-template-columns:repeat(${cols},1fr)">${Array.from({ length: cols }, () => html`<i></i>`)}</div>` : ''}
        ${S.safe ? html`<div class="dsy-safe" style="top:${y(pad.t)};bottom:${y(pad.b)};left:${m}%;right:${pad.r}%"></div>` : ''}
        ${eti ? html`<span class="dsy-p" style="top:${y(pad.t)};left:${m}%;font:${eti.peso} ${t(eti, 7)}/${eti.lh} ${fam(eti.familia)};letter-spacing:${eti.tracking}em;${eti.mayus ? 'text-transform:uppercase;' : ''}color:${R.tinta.hex}">${b.sub || 'Etiqueta'}</span>` : ''}
        <div class="dsy-p" contenteditable="true" spellcheck="false" data-ed="titulo" style="left:${m}%;right:${pad.r}%;bottom:${y(pad.b + 14)};font:${tit?.peso || 500} ${t(tit, 16)}/${tit?.lh || 1} ${fam(tit?.familia || 'Inter')};letter-spacing:${tit?.tracking || 0}em;color:${R.tinta.hex}">${S.titulo}</div>
        ${cif ? html`<div class="dsy-p" contenteditable="true" spellcheck="false" data-ed="cifra" style="left:${m}%;bottom:${y(pad.b)};font:${cif.peso} ${t(cif, 14)}/1 ${fam(cif.familia)};letter-spacing:${cif.tracking}em;color:${cif.color || R.acento?.hex || R.tinta.hex}">${S.cifra}</div>` : ''}
        ${logoSrc(principal) ? html`<img class="dsy-p" alt="" src="${logoSrc(principal)}" style="right:${pad.r}%;bottom:${y(pad.b + 0.5)};width:26%">` : ''}
      </div>
      <div class="row" style="gap:6px;flex-wrap:wrap">${[['grilla', 'Grilla'], ['safe', 'Safe zones'], ...(foto ? [['foto', 'Foto']] : [])].map(([k2, l]) => html`<button type="button" class="chip ${S[k2] ? 'dark' : ''}" data-act="tog" data-k="${k2}">${l}</button>`)}</div>
      <div class="dsy-chk">${chk.map(([ok, l]) => html`<div class="${ok === false ? 'bad' : ok ? 'ok' : 'mut'}">${ico(ok === false ? 'alert' : 'check', 13)} ${l}</div>`)}</div>
      <p class="mut sm" style="margin:0">El título y la cifra se pueden escribir encima.${foto ? '' : ' La foto sale del moodboard de Identidad.'}</p></div>`;
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
        ${sis.otras.map((o) => sec('x', o.titulo, '', html`${reglasHtml(o.reglas)}${o.vinetas.length ? html`<ul class="dsy-ul">${o.vinetas.map((n) => html`<li>${md(n)}</li>`)}</ul>` : ''}${o.notas.map((n) => html`<p class="dsy-nota">${md(n)}</p>`)}`))}
      </main>
      <aside class="dsy-rt" id="dsy-pv">${pieza()}
        <div class="dsy-next"><b>Siguiente: el chat de Diseño.</b> Pides una pieza y Claude la arma con este sistema, la guía de marca y los lineamientos de Inherent.</div></aside>
    </div>`);
  }
  const repintarPieza = () => { const box = $('#dsy-pv', el); if (box) { box.firstElementChild.outerHTML = String(pieza()); } };
  paint();
  // Al bajar, el índice marca la sección que está a la vista.
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { S.on = e.target.id.replace('dsy-', ''); $$('.dsy-idx [data-act="ir"]', el).forEach((a) => a.classList.toggle('on', a.dataset.k === S.on)); } }, { rootMargin: '-20% 0px -70% 0px' });
  $$('.dsy-sec', el).forEach((s) => io.observe(s));
  el.addEventListener('input', (e) => { const k = e.target.dataset?.ed; if (k) S[k] = e.target.textContent; });
  acts(el, {
    ir: (b2) => { $(`#dsy-${b2.dataset.k}`, el)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    hex: (b2) => copiar(b2.dataset.v, `${b2.dataset.v} copiado`),
    tokens: () => copiar(tokensCss(sis), 'Tokens CSS copiados'),
    fmt: (b2) => { S.fmt = b2.dataset.v; repintarPieza(); },
    tog: (b2) => { S[b2.dataset.k] = !S[b2.dataset.k]; repintarPieza(); },
  });
}
