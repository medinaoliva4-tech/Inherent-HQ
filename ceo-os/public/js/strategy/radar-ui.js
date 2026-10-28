// Vista del Competitor Radar (herramienta competitor-radar de Strategy): una tarjeta por competidor (oferta, precio si se sabe, canales, post con más
// resonancia y su posición con la url que la prueba), los anuncios activos de la competencia (competencia-ui.js), el mapa de posicionamiento de 2 ejes
// en SVG (el punto del cliente se arrastra o se mueve con las flechas) y los huecos. Toda posición, precio o hueco trae su url o dice «⚠️ SIN DATOS»;
// sin ninguna posición con evidencia el mapa no pinta nada. Nada se borra: un competidor o un hueco se archiva.
// Existe para que tool-shell.js pinte el centro con un solo contrato (nuevo, pintar, resumen). Pinta con html`…` (todo se escapa), lee y escribe con
// inputs nativos y avisa cada cambio con el contenido completo y limpio; el mapa y los avisos se recalculan solos sin tocar el campo donde se escribe.
import { html, mount, ico } from '../core.js';
import { competenciaUI } from '../marketing/competencia-ui.js';
import { SIN_DATOS, numeroONull } from '../consulting/marcos.js';
import { CANALES, vacio, limpiar, puntosDelMapa, clienteEnMapa, textoPrecio, activos, huecosDe, huecosConEvidencia } from './radar.js';

const SD = {
  competidores: 'la investigación de la competencia (Apify, sus redes y su sitio)',
  mapa: 'las posiciones de los competidores, cada una con la url que la prueba',
  huecos: 'comparar las posiciones del mapa y los anuncios de la competencia',
};
const W = 400, H = 300, PX = 44, PY = 22, AX = W - 2 * PX - 8, AY = H - 2 * PY - 18;
const px = (x) => PX + (x / 100) * AX, py = (y) => PY + ((100 - y) / 100) * AY;
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const ponerRuta = (obj, ruta, v) => { const p = ruta.split('.'), ultimo = p.pop(); let o = obj; for (const k of p) { o = o?.[k]; if (o == null) return; } o[ultimo] = v; };
const valorDe = (t) => (t.type === 'checkbox' ? t.checked : t.type === 'number' || t.dataset.tipo === 'num' ? numeroONull(t.value) : t.value);
const nuevoId = (lista) => { let i = lista.length + 1; while (lista.some((x) => x.id === `c${i}`)) i++; return `c${i}`; };
const NOMBRE_CANAL = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', web: 'Web', whatsapp: 'WhatsApp', google: 'Google', otro: 'Otro' };

function campos(editable) {
  const ro = (valor, o) => html`<span class="rd-ro" data-vacio="${valor || valor === 0 ? 0 : 1}">${valor || valor === 0 ? valor : o.sd ? `${SIN_DATOS}: sale de ${o.sd}` : '—'}</span>`;
  return {
    txt: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="text" data-c="${ruta}" value="${valor ?? ''}" maxlength="${o.max || 200}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}" autocomplete="off">` : ro(valor, o)),
    num: (ruta, valor, o = {}) => (editable ? html`<input class="in" type="number" data-c="${ruta}" value="${valor ?? ''}" min="${o.min ?? 0}" ${o.max != null ? `max="${o.max}"` : ''} step="any" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">` : ro(valor, o)),
    area: (ruta, valor, o = {}) => (editable ? html`<textarea class="in" data-c="${ruta}" rows="${o.filas || 2}" maxlength="${o.max || 300}" placeholder="${o.ph || ''}" aria-label="${o.label || ''}">${valor ?? ''}</textarea>` : ro(valor, o)),
  };
}

// ---------- Regiones derivadas: se recalculan solas y nunca contienen un campo editable ----------
function mapa({ c, editable }) {
  const pts = puntosDelMapa(c), cl = clienteEnMapa(c);
  if (!pts.length || !cl) return html`<p class="rd-sd" role="status">${SIN_DATOS}: el mapa no pinta nada hasta que un competidor tenga posición con evidencia (sale de ${SD.mapa})</p>`;
  const { x: ex, y: ey } = c.ejes;
  return html`<svg class="rd-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de posicionamiento: ${ex.nombre} por ${ey.nombre}">
    <rect class="rd-marco" x="${PX}" y="${PY}" width="${AX}" height="${AY}"></rect>
    <line class="rd-eje" x1="${px(50)}" y1="${PY}" x2="${px(50)}" y2="${PY + AY}"></line><line class="rd-eje" x1="${PX}" y1="${py(50)}" x2="${PX + AX}" y2="${py(50)}"></line>
    <text class="rd-lbl" x="${PX}" y="${H - 6}" text-anchor="start">${ex.bajo}</text><text class="rd-lbl" x="${PX + AX / 2}" y="${H - 6}" text-anchor="middle">${ex.nombre} →</text><text class="rd-lbl" x="${PX + AX}" y="${H - 6}" text-anchor="end">${ex.alto}</text>
    <text class="rd-lbl" x="${PX - 6}" y="${PY + AY}" text-anchor="end">${ey.bajo}</text><text class="rd-lbl" x="${PX - 6}" y="${PY + 10}" text-anchor="end">${ey.alto}</text>
    ${pts.map((p) => html`<g class="rd-pt" data-id="${p.id}"><circle cx="${px(p.x)}" cy="${py(p.y)}" r="7"></circle><text x="${px(p.x) + 10}" y="${py(p.y) + 4}">${p.nombre}</text></g>`)}
    <g class="rd-cli" data-puesto="${cl.puesto ? 1 : 0}" data-editable="${editable ? 1 : 0}" ${editable ? 'tabindex="0" role="slider" aria-label="Posición del cliente: flechas para mover"' : ''}><circle data-cliente="1" cx="${px(cl.x)}" cy="${py(cl.y)}" r="9"></circle><text x="${px(cl.x) + 12}" y="${py(cl.y) + 4}">Cliente${cl.puesto ? '' : ' (sin ubicar)'}</text></g>
  </svg>
  <p class="mut sm">${editable ? 'Arrastra el punto del cliente (o muévelo con las flechas) para ubicarlo.' : ''} Cada punto de la competencia sale de la url de su evidencia.</p>`;
}
// Lo que le falta a una tarjeta: la evidencia de su posición y de su precio.
function aviso({ c, i }) {
  const x = c.competidores[i]; if (!x) return '';
  const a = [];
  if ((x.pos.x !== null || x.pos.y !== null) && !x.pos.url) a.push(`La posición no cuenta sin su url: ${SIN_DATOS}`);
  if (x.precio.monto !== null && !x.precio.url) a.push(`El precio no cuenta sin su url: ${SIN_DATOS}`);
  return a.length ? html`<p class="rd-sd">${a.map((t) => html`<span>${t}</span> `)}</p>` : '';
}
const avisoHueco = ({ c, i }) => (c.huecos[i] && !c.huecos[i].url ? html`<p class="rd-sd">Sin url de evidencia: ${SIN_DATOS}</p>` : '');
const precio = ({ c, i }) => { const x = c.competidores[i]; return x ? html`<span class="rd-precio" data-vacio="${x.precio.monto === null ? 1 : 0}">${textoPrecio(x.precio)}</span>` : ''; };
const REGIONES = { mapa, aviso, aviso_h: avisoHueco, precio };

// ---------- La vista ----------
function tarjeta(x, i, f, editable) {
  const r = (k) => html`<div data-r="${k}" data-i="${i}"></div>`;
  return html`<article class="rd-card" data-id="${x.id}">
    <header class="rd-card-h"><h4>${editable ? f.txt(`competidores.${i}.nombre`, x.nombre, { max: 80, label: 'Nombre del competidor', ph: 'Nombre' }) : x.nombre || x.url || 'Competidor'}</h4>
      ${editable ? html`<button type="button" class="btn ghost xs" data-act="archivar" data-i="${i}" aria-label="Archivar competidor">Archivar</button>` : ''}</header>
    <label class="rd-f"><span class="lbl">Sitio o red</span>${f.txt(`competidores.${i}.url`, x.url, { max: 300, label: 'Url del competidor', ph: 'https://…', sd: SD.competidores })}</label>
    <label class="rd-f"><span class="lbl">Qué ofrece</span>${f.area(`competidores.${i}.oferta`, x.oferta, { max: 300, label: 'Oferta del competidor', ph: 'Su oferta en una o dos frases', sd: SD.competidores })}</label>
    <div class="rd-f"><span class="lbl">Precio</span>${editable
      ? html`<div class="rd-fila">${f.num(`competidores.${i}.precio.monto`, x.precio.monto, { label: 'Precio', ph: 'Monto' })}${f.txt(`competidores.${i}.precio.moneda`, x.precio.moneda, { max: 8, label: 'Moneda', ph: 'GTQ' })}${f.txt(`competidores.${i}.precio.url`, x.precio.url, { max: 300, label: 'Url donde se ve el precio', ph: 'https://…' })}</div>`
      : ''}${r('precio')}</div>
    <fieldset class="rd-f rd-canales"><legend class="lbl">Canales</legend>${editable
      ? CANALES.map((k) => html`<label class="rd-op"><input type="checkbox" data-c="@canal.${i}.${k}" ${x.canales.includes(k) ? 'checked' : ''}> ${NOMBRE_CANAL[k]}</label>`)
      : html`<span class="rd-ro" data-vacio="${x.canales.length ? 0 : 1}">${x.canales.length ? x.canales.map((k) => NOMBRE_CANAL[k]).join(', ') : `${SIN_DATOS}: sale de ${SD.competidores}`}</span>`}</fieldset>
    <div class="rd-f"><span class="lbl">Post con más resonancia</span>${f.txt(`competidores.${i}.post.texto`, x.post.texto, { max: 240, label: 'Post con más resonancia', ph: 'De qué trata', sd: 'sus redes: el post que más pasa de su promedio' })}
      ${editable ? html`<div class="rd-fila">${f.txt(`competidores.${i}.post.resonancia`, x.post.resonancia, { max: 80, label: 'Resonancia', ph: '3x su promedio' })}${f.txt(`competidores.${i}.post.url`, x.post.url, { max: 300, label: 'Url del post', ph: 'https://…' })}</div>`
        : x.post.url ? html`<a class="sm" href="${x.post.url}" target="_blank" rel="noopener noreferrer">Ver el post ↗</a>` : ''}</div>
    <div class="rd-f"><span class="lbl">Posición en el mapa (0 a 100)</span>${editable
      ? html`<div class="rd-fila">${f.num(`competidores.${i}.pos.x`, x.pos.x, { max: 100, label: 'Posición en el eje X', ph: 'X' })}${f.num(`competidores.${i}.pos.y`, x.pos.y, { max: 100, label: 'Posición en el eje Y', ph: 'Y' })}${f.txt(`competidores.${i}.pos.url`, x.pos.url, { max: 300, label: 'Url de la evidencia de la posición', ph: 'https://… (la evidencia)' })}</div>`
      : html`<span class="rd-ro" data-vacio="${x.pos.url && x.pos.x !== null ? 0 : 1}">${x.pos.url && x.pos.x !== null && x.pos.y !== null ? `${x.pos.x}, ${x.pos.y}` : `${SIN_DATOS}: sale de ${SD.mapa}`}</span>`}</div>
    ${r('aviso')}</article>`;
}

function plantilla({ c, editable }, f) {
  const act = c.competidores.map((x, i) => [x, i]).filter(([x]) => !x.archivado), hs = c.huecos.map((h, i) => [h, i]).filter(([h]) => !h.archivado);
  return html`<div class="rd" data-editable="${editable ? 1 : 0}">
    <section class="rd-sec" aria-label="Competidores"><h3 class="rd-t">${ico('radar', 16)} Competidores <span class="mut sm">oferta, precio, canales y su mejor post</span></h3>
      ${act.length ? html`<div class="rd-cards">${act.map(([x, i]) => tarjeta(x, i, f, editable))}</div>` : html`<p class="rd-sd">${SIN_DATOS}: sale de ${SD.competidores}</p>`}
      ${editable ? html`<button type="button" class="btn xs" data-act="agregar">${ico('plus', 13)} Agregar competidor</button>` : ''}</section>
    <section class="rd-sec" aria-label="Anuncios activos"><h3 class="rd-t">${ico('megaphone', 16)} Anuncios activos <span class="mut sm">lo que tienen corriendo en Meta ahora</span></h3><div data-ads></div></section>
    <section class="rd-sec" aria-label="Mapa de posicionamiento"><h3 class="rd-t">${ico('target', 16)} Mapa de posicionamiento <span class="mut sm">2 ejes, solo con evidencia</span></h3>
      ${editable ? html`<div class="rd-fila rd-ejes"><label class="rd-f"><span class="lbl">Eje X</span>${f.txt('ejes.x.nombre', c.ejes.x.nombre, { max: 40, label: 'Nombre del eje X' })}</label>${f.txt('ejes.x.bajo', c.ejes.x.bajo, { max: 40, label: 'Extremo bajo del eje X' })}${f.txt('ejes.x.alto', c.ejes.x.alto, { max: 40, label: 'Extremo alto del eje X' })}</div>
        <div class="rd-fila rd-ejes"><label class="rd-f"><span class="lbl">Eje Y</span>${f.txt('ejes.y.nombre', c.ejes.y.nombre, { max: 40, label: 'Nombre del eje Y' })}</label>${f.txt('ejes.y.bajo', c.ejes.y.bajo, { max: 40, label: 'Extremo bajo del eje Y' })}${f.txt('ejes.y.alto', c.ejes.y.alto, { max: 40, label: 'Extremo alto del eje Y' })}</div>` : ''}
      <div class="rd-mapa" data-r="mapa"></div></section>
    <section class="rd-sec" aria-label="Huecos"><h3 class="rd-t">${ico('compass', 16)} Huecos <span class="mut sm">lo que nadie ocupa, con la url que lo muestra</span></h3>
      ${hs.length ? html`<ul class="rd-huecos">${hs.map(([h, i]) => html`<li class="rd-hueco"><div class="rd-fila">${f.txt(`huecos.${i}.texto`, h.texto, { max: 300, label: 'Hueco', ph: 'Qué espacio queda libre', sd: SD.huecos })}${f.txt(`huecos.${i}.url`, h.url, { max: 300, label: 'Url de la evidencia del hueco', ph: 'https://…', sd: SD.huecos })}${editable ? html`<button type="button" class="btn ghost xs" data-act="archivar-hueco" data-i="${i}" aria-label="Archivar hueco">Archivar</button>` : ''}</div><div data-r="aviso_h" data-i="${i}"></div></li>`)}</ul>`
        : html`<p class="rd-sd">${SIN_DATOS}: sale de ${SD.huecos}</p>`}
      ${editable ? html`<button type="button" class="btn xs" data-act="agregar-hueco">${ico('plus', 13)} Agregar hueco</button>` : ''}</section>
  </div>`;
}

export const vista = {
  nuevo() { return vacio(); },

  pintar(el, { contenido, editable, onCambio, me, slug } = {}) {
    const ed = Boolean(editable), c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), E = { c, editable: ed };
    let root = null;
    const cache = new WeakMap();
    const poner = (nodo, h) => { const s = String(h); if (cache.get(nodo) !== s) { cache.set(nodo, s); mount(nodo, h); } };
    const refrescar = () => { for (const nodo of root.querySelectorAll('[data-r]')) { const g = REGIONES[nodo.dataset.r]; if (g) poner(nodo, g({ ...E, c: limpiar(structuredClone(c)), i: Number(nodo.dataset.i) })); } };
    const avisar = () => { if (typeof onCambio === 'function') onCambio(limpiar(structuredClone(c))); };
    // El trabajo local conserva las filas en blanco (competidores y huecos nuevos) hasta que se llenan; lo que sale es siempre limpio.
    function pintarTodo() {
      mount(el, plantilla(E, campos(ed)));
      root = el.firstElementChild; refrescar();
      const ads = root.querySelector('[data-ads]');
      if (ads && slug) competenciaUI(ads, { me, slugs: [slug], alive: () => el.isConnected }); else if (ads) mount(ads, html`<p class="rd-sd">${SIN_DATOS}: elige un cliente para ver sus anuncios activos</p>`);
    }
    pintarTodo();
    if (!ed) return;

    const alCambiar = (e) => {
      const t = e.target, k = t?.dataset?.c;
      if (!k || !root?.contains(t)) return;
      if (k.startsWith('@canal.')) {
        const [, i, canal] = k.split('.'), x = c.competidores[Number(i)]; if (!x) return;
        x.canales = t.checked ? [...new Set([...x.canales, canal])] : x.canales.filter((y) => y !== canal);
      } else ponerRuta(c, k, valorDe(t));
      avisar(); refrescar();
    };
    root.addEventListener('input', alCambiar); root.addEventListener('change', alCambiar);
    // Agregar y archivar cambian la lista: se pinta otra vez (nada se borra, solo se archiva).
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b || !root.contains(b)) return;
      const i = Number(b.dataset.i), a = b.dataset.act;
      if (a === 'agregar') c.competidores.push({ id: nuevoId(c.competidores), nombre: '', url: '', oferta: '', precio: { monto: null, moneda: '', url: '' }, canales: [], post: { texto: '', url: '', resonancia: '' }, pos: { x: null, y: null, url: '' }, archivado: false });
      else if (a === 'archivar' && c.competidores[i]) c.competidores[i].archivado = true;
      else if (a === 'agregar-hueco') c.huecos.push({ texto: '', url: '', archivado: false });
      else if (a === 'archivar-hueco' && c.huecos[i]) c.huecos[i].archivado = true;
      else return;
      avisar(); pintarTodo(); root.addEventListener('input', alCambiar); root.addEventListener('change', alCambiar);
    });

    // El punto del cliente: se arrastra (puntero) o se mueve con las flechas; al soltar se avisa con el contenido limpio.
    const mover = (x, y) => {
      c.cliente = { x: clamp(x), y: clamp(y) };
      const g = root.querySelector('.rd-cli'); if (!g) return;
      const dot = g.querySelector('circle'), tx = g.querySelector('text');
      dot.setAttribute('cx', px(c.cliente.x)); dot.setAttribute('cy', py(c.cliente.y)); tx.setAttribute('x', px(c.cliente.x) + 12); tx.setAttribute('y', py(c.cliente.y) + 4);
    };
    const enSvg = (svg, ev) => { const r = svg.getBoundingClientRect(); return { x: (((ev.clientX - r.left) / r.width) * W - PX) / AX * 100, y: 100 - ((((ev.clientY - r.top) / r.height) * H - PY) / AY) * 100 }; };
    let arrastra = false;
    root.addEventListener('pointerdown', (ev) => {
      const dot = ev.target.closest?.('[data-cliente]'); if (!dot) return;
      arrastra = true; dot.setPointerCapture?.(ev.pointerId); ev.preventDefault();
    });
    root.addEventListener('pointermove', (ev) => { if (!arrastra) return; const svg = root.querySelector('.rd-svg'); if (svg) { const p = enSvg(svg, ev); mover(p.x, p.y); } });
    const soltar = () => { if (!arrastra) return; arrastra = false; avisar(); refrescar(); };
    root.addEventListener('pointerup', soltar); root.addEventListener('pointercancel', soltar);
    root.addEventListener('keydown', (ev) => {
      const g = ev.target.closest?.('.rd-cli'); if (!g) return;
      const d = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, 2], ArrowDown: [0, -2] }[ev.key]; if (!d) return;
      ev.preventDefault();
      const cl = clienteEnMapa(limpiar(structuredClone(c))) || { x: 50, y: 50 };
      mover((c.cliente.x ?? cl.x) + d[0], (c.cliente.y ?? cl.y) + d[1]); avisar();
      // El mapa se vuelve a pintar (por el aviso de «ubicado»): el foco vuelve al punto.
      refrescar(); root.querySelector('.rd-cli')?.focus();
    });
  },

  // Una línea para el Overview: cuántos competidores, cuántos con posición y cuántos huecos con evidencia.
  resumen(contenido) {
    const c = limpiar(structuredClone(contenido && typeof contenido === 'object' ? contenido : {})), n = activos(c).length, p = puntosDelMapa(c).length, h = huecosConEvidencia(c).length, t = huecosDe(c).length;
    return html`<span class="rd-res"><span class="chip">${n ? `${n} competidor${n === 1 ? '' : 'es'}` : `Competidores: ${SIN_DATOS}`}</span><span class="chip">${p ? `${p} en el mapa` : `Mapa: ${SIN_DATOS}`}</span><span class="chip">${t ? `${h} de ${t} huecos con evidencia` : `Huecos: ${SIN_DATOS}`}</span></span>`;
  },
};
