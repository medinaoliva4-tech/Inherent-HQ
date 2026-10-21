import { html, raw, mount, api, toast, ico, inline, acts, $, $$ } from './core.js';
import { leerSistema, fuentesUrl, tokensCss, contraste } from './sistema-visual.js';

// Marca › Diseño › Design system: el sistema visual de la marca a la vista, como un portal de marca (zeroheight, Frontify).
// Cada valor se copia con un clic. La fuente es 02-marca/sistema-visual.md del repo: se edita allá (②B Branding, br-sistema).
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

  const sis = leerSistema(d.md);
  cargarFuentes(fuentesUrl(sis.tipo.familias));
  const S = { on: 'color' };
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
    </div>`);
  }
  paint();
  // Al bajar, el índice marca la sección que está a la vista.
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { S.on = e.target.id.replace('dsy-', ''); $$('.dsy-idx [data-act="ir"]', el).forEach((a) => a.classList.toggle('on', a.dataset.k === S.on)); } }, { rootMargin: '-20% 0px -70% 0px' });
  $$('.dsy-sec', el).forEach((s) => io.observe(s));
  acts(el, {
    ir: (b2) => { $(`#dsy-${b2.dataset.k}`, el)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    hex: (b2) => copiar(b2.dataset.v, `${b2.dataset.v} copiado`),
    tokens: () => copiar(tokensCss(sis), 'Tokens CSS copiados'),
  });
}
