#!/usr/bin/env node
// Motor de render de Inherent · plantilla HTML + tokens del design system + contenido → PNG o PDF.
// Claude no dibuja: la plantilla ya trae el diseño, aquí solo se llena y se exporta con Chrome headless.
// Sin créditos de IA. Salida por stdout: un solo JSON (los avisos van a stderr).
//
//   node render.mjs render  --plantilla P.html --tokens T.json --contenido C.json --variante A \
//                           --id CR-007 --formato estatico --salida ./out [--formato-salida png|pdf]
//   node render.mjs listar  <carpeta-de-plantillas>        catálogo de plantillas (para que Laya elija)
//   node render.mjs hoja    --entrada a.png b.png … --salida hoja.png   hoja de contacto (una imagen, una revisión)
//
// Ayuda completa: node render.mjs --ayuda   ·   Manual: README.md
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const log = (...a) => console.error(...a);
const fallo = (msg, code = 1) => { console.error('ERROR: ' + msg); process.exit(code); };

const AYUDA = `Motor de render de Inherent

  render   Llena una plantilla HTML con los tokens y el contenido y exporta PNG o PDF.
    --plantilla <html>     la plantilla (con su bloque <script id="plantilla"> de metadatos)
    --tokens <json>        los tokens del design system del cliente
    --contenido <json>     el contenido: una pieza ({titulo, …}) o varias ({slides:[…], comun:{…}})
    --variante <A[,B,C]>   una variante = archivo final · varias = candidatas en <salida>/_candidatas
    --id <id_creativo>     por ejemplo CR-007 (va en el nombre del archivo)
    --formato <nombre>     estatico · carrusel · story · presentacion … (va en el nombre)
    --salida <carpeta>     dónde se escribe
    --formato-salida <png|jpg|pdf>   png por defecto; jpg (--calidad 92) si el peso pasa el límite; pdf = un solo archivo de varias páginas
    --escala <n>           1 por defecto (medidas exactas). 2 = el doble de píxeles
    --copy-de <md>         verifica que el copy del contenido esté LITERAL en ese archivo (la sección de ④ Creatividad)
    --estricto             sale con código 3 si hay avisos de medidas (desborde, safe zone, líneas) o de copy
    --permisivo            un campo faltante no frena el render (se avisa)
    --chrome <ruta>        Chrome o Chromium (si no, se busca el del sistema)
    --ancho / --alto       solo si la plantilla no declara sus medidas
  listar <carpeta>         lista las plantillas: id, para qué sirve, medidas, variantes y campos
  hoja                     junta PNG en una hoja de contacto (--entrada a.png b.png --salida hoja.png [--columnas 4])`;

// ---------- argumentos ----------
function leerArgs(argv) {
  const out = { _: [] };
  const BOOL = new Set(['estricto', 'permisivo', 'ayuda', 'no-sandbox']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const [k, v] = a.slice(2).split(/=(.*)/s);
    if (BOOL.has(k)) { out[k] = true; continue; }
    if (v !== undefined) { out[k] = v; continue; }
    const vals = [];
    while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) vals.push(argv[++i]);
    out[k] = k === 'entrada' ? vals : vals.join(' ');
  }
  return out;
}

// ---------- playwright y Chrome ----------
function cargarPlaywright() {
  const raices = [AQUI, process.cwd(), path.resolve(AQUI, '../../../../../ceo-os'), ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)];
  try { raices.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 8000 }).toString().trim()); } catch { /* sin npm */ }
  for (const r of raices) {
    for (const nombre of ['playwright-core', 'playwright']) {
      try {
        const req = createRequire(path.join(r, 'x.js'));
        let p; try { p = req.resolve(nombre); } catch { p = req.resolve(path.join(r, nombre)); }
        const mod = req(p);
        if (mod.chromium) return mod.chromium;
      } catch { /* siguiente */ }
    }
  }
  fallo('No encuentro Playwright. Corre una vez:  cd ' + AQUI + ' && npm install   (solo baja playwright-core, ~2 MB; usa tu Chrome)', 4);
}

function buscarChrome(pedido) {
  const cands = [];
  if (pedido) cands.push(pedido);
  if (process.env.CHROME_PATH) cands.push(process.env.CHROME_PATH);
  const p = process.platform, E = process.env;
  if (p === 'darwin') cands.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge');
  else if (p === 'win32') {
    for (const b of [E['PROGRAMFILES'], E['PROGRAMFILES(X86)'], E['LOCALAPPDATA']].filter(Boolean)) cands.push(path.join(b, 'Google/Chrome/Application/chrome.exe'), path.join(b, 'Microsoft/Edge/Application/msedge.exe'));
  } else {
    cands.push('/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium');
    const pw = E.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    try { for (const d of fs.readdirSync(pw).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) cands.push(path.join(pw, d, 'chrome-linux/chrome')); } catch { /* sin carpeta */ }
  }
  for (const c of cands) { try { if (c && fs.statSync(c).isFile()) return c; } catch { /* siguiente */ } }
  return null;
}

async function abrirNavegador(a) {
  const chromium = cargarPlaywright();
  const exe = buscarChrome(a.chrome);
  const args = ['--force-color-profile=srgb', '--hide-scrollbars', '--font-render-hinting=none'];
  if (a['no-sandbox'] || (typeof process.getuid === 'function' && process.getuid() === 0)) args.push('--no-sandbox');
  try { return await chromium.launch({ executablePath: exe || undefined, args }); }
  catch (e) { fallo('No pude abrir Chrome' + (exe ? ` (${exe})` : '') + '. Instala Google Chrome o pasa --chrome <ruta>. ' + String(e.message).split('\n')[0], 5); }
}

// ---------- archivos y datos ----------
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf' };
const extDe = (f) => path.extname(f).slice(1).toLowerCase();
const datoURI = (f) => `data:${MIME[extDe(f)] || 'application/octet-stream'};base64,${fs.readFileSync(f).toString('base64')}`;
const leerJSON = (f, que) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return fallo(`No pude leer ${que} (${f}): ${e.message}`); } };
const esImagen = (s) => typeof s === 'string' && /\.(png|jpe?g|webp|gif|svg)$/i.test(s) && !/^(data:|https?:)/i.test(s);

// Toda ruta de imagen que exista (relativa al JSON o absoluta) se convierte a data URI: la página no toca el disco.
function incrustarImagenes(valor, base, avisos) {
  if (Array.isArray(valor)) return valor.map((v) => incrustarImagenes(v, base, avisos));
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, incrustarImagenes(v, base, avisos)]));
  if (esImagen(valor)) {
    const f = path.resolve(base, valor);
    if (fs.existsSync(f)) return datoURI(f);
    avisos.push(`imagen_no_existe: ${valor}`);
  }
  return valor;
}

function aplanar(obj, prefijo = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (['fuentes', 'assets', 'descripcion'].includes(k) && !prefijo) continue;
    const nombre = (prefijo ? prefijo + '-' : '') + k.replace(/[^a-zA-Z0-9]+/g, '-');
    if (v && typeof v === 'object' && !Array.isArray(v)) aplanar(v, nombre, out);
    else if (['string', 'number'].includes(typeof v)) out[nombre] = String(v);
  }
  return out;
}

function cssTokens(tokens, baseTokens) {
  const vars = aplanar(tokens);
  const assets = {};
  for (const [k, v] of Object.entries(tokens.assets || {})) {
    const f = path.resolve(baseTokens, v);
    if (fs.existsSync(f)) { assets[k] = datoURI(f); vars['asset-' + k] = `url("${assets[k]}")`; } else assets[k] = '';
  }
  let faces = '';
  for (const f of tokens.fuentes || []) {
    if (!f.archivo) continue;
    const ruta = path.resolve(baseTokens, f.archivo);
    if (!fs.existsSync(ruta)) { log(`aviso: la fuente ${f.familia} apunta a ${f.archivo} y no existe`); continue; }
    faces += `@font-face{font-family:"${f.familia}";src:url(${datoURI(ruta)});font-weight:${f.peso || 400};font-style:${f.estilo || 'normal'};font-display:block}\n`;
  }
  const raiz = Object.entries(vars).map(([k, v]) => `--${k}:${v}`).join(';');
  return { css: `${faces}:root{${raiz}}`, assets };
}

// ---------- el llenador de plantillas (mini-mustache, sin dependencias) ----------
//  {{campo}}  texto escapado · {{campo|rico}}  *énfasis* y saltos de línea · {{campo|mayus}}
//  {{#si campo}}…{{/si}}  {{#no campo}}…{{/no}}  {{#cada lista}}…{{.}} {{@i}}…{{/cada}}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const verdad = (v) => v !== undefined && v !== null && v !== false && v !== '' && !(Array.isArray(v) && !v.length);

function parsear(src) {
  const raiz = { hijos: [] }, pila = [raiz];
  const re = /\{\{\s*(#si|#no|#cada|\/si|\/no|\/cada)?\s*([^}]*?)\s*\}\}/g;
  let i = 0, m;
  while ((m = re.exec(src))) {
    if (m.index > i) pila.at(-1).hijos.push({ t: 'txt', v: src.slice(i, m.index) });
    i = re.lastIndex;
    const [, tag, cuerpo] = m;
    if (!tag) { const [ruta, ...filtros] = cuerpo.split('|').map((x) => x.trim()); pila.at(-1).hijos.push({ t: 'var', ruta, filtros }); }
    else if (tag[0] === '#') { const n = { t: tag.slice(1), ruta: cuerpo, hijos: [] }; pila.at(-1).hijos.push(n); pila.push(n); }
    else { const n = pila.pop(); if (!n || n.t !== tag.slice(1)) throw new Error(`la plantilla cierra {{${tag}}} sin abrirlo`); }
  }
  if (i < src.length) pila.at(-1).hijos.push({ t: 'txt', v: src.slice(i) });
  if (pila.length > 1) throw new Error(`la plantilla deja abierto {{#${pila.at(-1).t} ${pila.at(-1).ruta}}}`);
  return raiz;
}

function buscar(pila, ruta) {
  if (ruta === '.') return pila.at(-1).item;
  if (ruta === '@i') return pila.at(-1).i;
  const partes = ruta.split('.');
  for (let k = pila.length - 1; k >= 0; k--) {
    let v = pila[k].item;
    if (v === undefined || v === null || typeof v !== 'object' || !(partes[0] in v)) continue;
    for (const p of partes) { if (v === undefined || v === null) break; v = v[p]; }
    return v;
  }
  return undefined;
}

function llenar(nodo, pila, faltan) {
  let out = '';
  for (const h of nodo.hijos) {
    if (h.t === 'txt') out += h.v;
    else if (h.t === 'var') {
      const v = buscar(pila, h.ruta);
      if (v === undefined || v === null) { faltan.add(h.ruta); continue; }
      let s = String(v);
      if (h.filtros.includes('mayus')) s = s.toUpperCase();
      s = esc(s);
      if (h.filtros.includes('rico')) s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
      out += s;
    } else if (h.t === 'si' || h.t === 'no') {
      if (verdad(buscar(pila, h.ruta)) === (h.t === 'si')) out += llenar(h, pila, faltan);
    } else if (h.t === 'cada') {
      const lista = buscar(pila, h.ruta);
      if (Array.isArray(lista)) lista.forEach((item, i) => { out += llenar(h, [...pila, { item, i: i + 1 }], faltan); });
    }
  }
  return out;
}

// ---------- la plantilla y sus metadatos ----------
function leerPlantilla(ruta) {
  if (!fs.existsSync(ruta)) fallo(`No existe la plantilla ${ruta}`);
  let html = fs.readFileSync(ruta, 'utf8');
  let meta = {};
  const m = html.match(/<script[^>]*id=["']plantilla["'][^>]*>([\s\S]*?)<\/script>/i);
  if (m) {
    try { meta = JSON.parse(m[1]); } catch (e) { fallo(`El bloque <script id="plantilla"> de ${ruta} no es JSON válido: ${e.message}`); }
    html = html.replace(m[0], '');
  }
  if (!/<html[\s>]/i.test(html)) fallo(`${ruta} tiene que ser un HTML completo (con <html> y <head>)`);
  return { html, meta, ruta };
}

function listar(carpeta) {
  if (!carpeta || !fs.existsSync(carpeta)) fallo('Uso: node render.mjs listar <carpeta-de-plantillas>');
  const out = [];
  const visitar = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith('.') && e.name !== 'node_modules') visitar(f); continue; }
      if (!/\.html?$/i.test(e.name)) continue;
      const { meta } = leerPlantilla(f);
      if (!meta.id) continue;
      out.push({ archivo: path.relative(carpeta, f), ...meta });
    }
  };
  visitar(carpeta);
  console.log(JSON.stringify({ ok: true, plantillas: out }, null, 2));
}

// ---------- el render ----------
function medidasDe(meta, a) {
  const w = +(a.ancho || meta.medidas?.[0] || 0), h = +(a.alto || meta.medidas?.[1] || 0);
  if (!w || !h) fallo('La plantilla no declara "medidas": [ancho, alto] y no pasaste --ancho/--alto');
  return [w, h];
}

function armarHTML(pl, ctx, variante, tipo, n, total, cssT, faltan) {
  if (pl.meta.variantes && Object.keys(pl.meta.variantes).length && !(variante in pl.meta.variantes)) {
    fallo(`La plantilla ${pl.meta.id || pl.ruta} no tiene la variante «${variante}». Tiene: ${Object.keys(pl.meta.variantes).join(', ')}`);
  }
  let html;
  try { html = llenar(parsear(pl.html), [{ item: { ...ctx, _n: n, _total: total, _variante: variante } }], faltan); }
  catch (e) { return fallo(`${pl.ruta}: ${e.message}`); }
  html = html.replace(/<html([^>]*)>/i, (_, at) => `<html${at} data-variante="${esc(variante)}" data-tipo="${esc(tipo)}" data-slide="${n}" data-total="${total}">`);
  html = html.replace(/<head([^>]*)>/i, (m) => `${m}<meta charset="utf-8"><style id="__tokens">${cssT.css}</style>`);
  return html;
}

// Corre dentro de la página: todo lo que se puede medir sin juzgar (⚙️ de 08-CRITERIOS).
function medirPagina({ W, H, safe }) {
  const avisos = [], campos = [];
  const quien = (el) => el.dataset?.campo || (el.tagName.toLowerCase() + ':' + (el.textContent || '').trim().slice(0, 24));
  const [st, sr, sb, sl] = safe || [0, 0, 0, 0];
  const cajas = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const tieneTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const max = +el.dataset.maxLineas || 0;
    if (tieneTexto) {
      const r = document.createRange(); r.selectNodeContents(el);
      const b = r.getBoundingClientRect();
      if (b.width && b.height) {
        if (el.dataset.campo) {
          cajas.push({ n: quien(el), b });
          const lh0 = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
          campos.push({ campo: el.dataset.campo, lineas: Math.max(1, Math.round(b.height / lh0)), max_lineas: max || null });
        }
        if (b.left < -0.5 || b.top < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5) avisos.push({ tipo: 'fuera_del_lienzo', donde: quien(el) });
        else if (!el.closest('[data-fuera-safe]') && (b.left < sl - 1 || b.top < st - 1 || b.right > W - sr + 1 || b.bottom > H - sb + 1)) avisos.push({ tipo: 'fuera_de_safe_zone', donde: quien(el) });
        if (max) {
          const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
          const lineas = Math.round(b.height / lh);
          if (lineas > max) avisos.push({ tipo: 'demasiadas_lineas', donde: quien(el), lineas, max });
        }
      }
    }
    if (el.dataset.campo && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && /hidden|clip|auto|scroll/.test(cs.overflow + cs.overflowX + cs.overflowY)) avisos.push({ tipo: 'texto_cortado', donde: quien(el) });
    if (el.tagName === 'IMG' && el.complete && !el.naturalWidth) avisos.push({ tipo: 'imagen_rota', donde: quien(el) });
  }
  for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length; j++) {
    const p = cajas[i].b, q = cajas[j].b;
    const w = Math.min(p.right, q.right) - Math.max(p.left, q.left), h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
    if (w > 2 && h > 2) avisos.push({ tipo: 'texto_solapado', donde: cajas[i].n + ' × ' + cajas[j].n });
  }
  return { avisos, campos };
}

async function fuentesNoDisponibles(page, tokens) {
  const familias = new Set();
  for (const v of Object.values(aplanar(tokens))) for (const f of [...String(v).matchAll(/["']([^"']+)["']\s*,/g)]) familias.add(f[1]);
  for (const f of tokens.fuentes || []) familias.add(f.familia);
  return page.evaluate((fams) => {
    const c = document.createElement('canvas').getContext('2d');
    const ancho = (f) => { c.font = `40px ${f}`; return c.measureText('Hamburgefonstiv 0123 áéíóúñ').width; };
    return fams.filter((f) => ancho(`"${f}", monospace`) === ancho('monospace') && ancho(`"${f}", serif`) === ancho('serif'));
  }, [...familias]);
}

const pngDims = (buf) => ({ ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) });
const dos = (n) => String(n).padStart(2, '0');

async function render(a) {
  for (const k of ['plantilla', 'tokens', 'contenido', 'salida']) if (!a[k]) fallo(`Falta --${k}. Mira: node render.mjs --ayuda`);
  const formatoSalida = (a['formato-salida'] || 'png').toLowerCase();
  if (!['png', 'jpg', 'pdf'].includes(formatoSalida)) fallo('--formato-salida es png, jpg o pdf');
  const escala = +(a.escala || 1) || 1;
  const baseTok = path.dirname(path.resolve(a.tokens)), baseCont = path.dirname(path.resolve(a.contenido));
  const tokens = leerJSON(a.tokens, 'los tokens'), contenidoCrudo = leerJSON(a.contenido, 'el contenido');
  const avisosGlobales = [];
  const { css: cssBase, assets } = cssTokens(tokens, baseTok);
  const cssT = { css: cssBase };
  const contenido = incrustarImagenes(contenidoCrudo, baseCont, avisosGlobales);
  const tokensCtx = { ...tokens, assets };

  const piezas = Array.isArray(contenido.slides) ? contenido.slides : [contenido];
  const comun = Array.isArray(contenido.slides) ? contenido.comun || {} : {};
  const total = piezas.length;
  const plantillaBase = leerPlantilla(path.resolve(a.plantilla));
  const cache = new Map([[path.resolve(a.plantilla), plantillaBase]]);
  const cargar = (p) => { const r = path.resolve(baseCont, p); if (!cache.has(r)) cache.set(r, leerPlantilla(r)); return cache.get(r); };

  const id = a.id || 'pieza', formato = a.formato || plantillaBase.meta.formato || 'pieza';
  const variantes = String(a.variante || plantillaBase.meta.variante_defecto || Object.keys(plantillaBase.meta.variantes || { A: 1 })[0]).split(',').map((s) => s.trim()).filter(Boolean);
  const candidatas = variantes.length > 1;
  const carpeta = path.resolve(a.salida, candidatas ? '_candidatas' : '.');
  fs.mkdirSync(carpeta, { recursive: true });

  const navegador = await abrirNavegador(a);
  const avisosCopy = [];
  if (a['copy-de']) {
    const limpio = (x) => String(x).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, ' ').trim();
    if (!fs.existsSync(a['copy-de'])) fallo(`No existe ${a['copy-de']} (--copy-de)`);
    const fuente = limpio(fs.readFileSync(a['copy-de'], 'utf8'));
    const citas = new Set([...fuente.matchAll(/"([^"]+)"/g)].map((m) => m[1].trim())); // el copy va entre comillas
    piezas.forEach((sl, i) => {
      const meta = (sl.plantilla ? cargar(sl.plantilla) : plantillaBase).meta;
      for (const [k, v] of Object.entries({ ...comun, ...sl })) {
        if (['tipo', 'variante', 'plantilla'].includes(k) || meta.campos?.[k]?.auxiliar) continue;
        for (const t of Array.isArray(v) ? v : [v]) {
          if (typeof t !== 'string' || !t.trim() || t.startsWith('data:')) continue;
          const lt = limpio(t);
          if (citas.has(lt)) continue;
          avisosCopy.push({ pieza: i + 1, tipo: fuente.includes(lt) ? 'copy_acortado_o_sin_comillas' : 'copy_no_literal', campo: k, texto: t.slice(0, 60) });
        }
      }
    });
  }
  const resultado = { ok: true, id, formato, plantilla: plantillaBase.meta.id || path.basename(a.plantilla), candidatas: candidatas ? [] : undefined, archivos: [], avisos: [...avisosGlobales.map((x) => ({ tipo: x })), ...avisosCopy] };
  try {
    for (const variante of variantes) {
      const faltan = new Set();
      const htmls = [], medidasSlides = [];
      const ctxPage = await navegador.newContext({ deviceScaleFactor: escala, viewport: { width: 100, height: 100 } });
      const page = await ctxPage.newPage();
      const archivosVar = [], avisosVar = [], camposVar = [];
      for (let i = 0; i < total; i++) {
        const slide = piezas[i];
        const pl = slide.plantilla ? cargar(slide.plantilla) : plantillaBase;
        const [W, H] = medidasDe(pl.meta, a);
        const varSlide = slide.variante && variantes.length === 1 ? slide.variante : variante;
        const ctx = { ...comun, ...slide, tokens: tokensCtx };
        const html = armarHTML(pl, ctx, varSlide, slide.tipo || 'unica', i + 1, total, cssT, faltan);
        if (faltan.size && !a.permisivo) fallo(`Faltan campos en el contenido para la plantilla ${pl.meta.id || pl.ruta} (pieza ${i + 1}): ${[...faltan].join(', ')}. Complétalos o márcalos opcionales con {{#si campo}}.`, 2);
        await page.setViewportSize({ width: W, height: H });
        await page.setContent(html, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => Promise.all([...document.images].map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; })))));
        const { avisos: av, campos } = await page.evaluate(medirPagina, { W, H, safe: pl.meta.safe || [0, 0, 0, 0] });
        for (const x of av) avisosVar.push({ pieza: i + 1, ...x });
        camposVar.push({ pieza: i + 1, plantilla: pl.meta.id || null, variante: varSlide, campos });
        if (i === 0) for (const f of await fuentesNoDisponibles(page, tokens)) avisosVar.push({ tipo: 'fuente_no_disponible', donde: f });
        htmls.push({ html, W, H });
        if (formatoSalida !== 'pdf') {
          const nombre = [id, formato].join('_') + (total > 1 ? '_' + dos(i + 1) : '') + (candidatas ? '__' + variante : '') + '.' + formatoSalida;
          const buf = await page.screenshot(formatoSalida === 'png' ? { type: 'png', clip: { x: 0, y: 0, width: W, height: H } } : { type: 'jpeg', quality: +(a.calidad || 92), clip: { x: 0, y: 0, width: W, height: H } });
          const d = formatoSalida === 'png' ? pngDims(buf) : { ancho: W * escala, alto: H * escala };
          if (d.ancho !== W * escala || d.alto !== H * escala) avisosVar.push({ pieza: i + 1, tipo: 'medidas_no_exactas', esperado: `${W * escala}x${H * escala}`, real: `${d.ancho}x${d.alto}` });
          fs.writeFileSync(path.join(carpeta, nombre), buf);
          archivosVar.push({ archivo: path.join(carpeta, nombre), ...d, kb: Math.round(buf.length / 1024) });
        }
        medidasSlides.push([W, H]);
      }
      if (formatoSalida === 'pdf') {
        const [W, H] = medidasSlides[0];
        if (medidasSlides.some(([w, h]) => w !== W || h !== H)) fallo('En un PDF todas las páginas tienen que medir lo mismo');
        const envoltorio = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${W}px ${H}px;margin:0}html,body{margin:0;padding:0;background:#fff}iframe{display:block;width:${W}px;height:${H}px;border:0;break-after:page;page-break-after:always}iframe:last-child{break-after:auto;page-break-after:auto}</style></head><body>${htmls.map((h) => `<iframe scrolling="no" srcdoc="${esc(h.html)}"></iframe>`).join('')}</body></html>`;
        await page.setViewportSize({ width: W, height: H });
        await page.setContent(envoltorio, { waitUntil: 'load' });
        await page.evaluate(() => Promise.all([...document.querySelectorAll('iframe')].map((f) => new Promise((r) => { const listo = () => Promise.resolve(f.contentDocument?.fonts?.ready).then(r, r); f.contentDocument?.readyState === 'complete' ? listo() : f.addEventListener('load', listo); }))));
        const nombre = [id, formato].join('_') + (candidatas ? '__' + variante : '') + '.pdf';
        const buf = await page.pdf({ width: `${W}px`, height: `${H}px`, printBackground: true, preferCSSPageSize: true });
        fs.writeFileSync(path.join(carpeta, nombre), buf);
        const paginas = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        if (paginas !== total) avisosVar.push({ tipo: 'paginas_no_coinciden', esperado: total, real: paginas });
        archivosVar.push({ archivo: path.join(carpeta, nombre), ancho: W, alto: H, paginas, kb: Math.round(buf.length / 1024) });
      }
      await ctxPage.close();
      if (candidatas) resultado.candidatas.push({ variante, archivos: archivosVar, avisos: avisosVar, medidas: camposVar });
      else { resultado.archivos.push(...archivosVar); resultado.avisos.push(...avisosVar); resultado.variante = variante; resultado.medidas = camposVar; }
    }
  } finally { await navegador.close(); }

  const hayAvisos = (resultado.avisos.length + (candidatas ? resultado.candidatas.flatMap((c) => c.avisos).length : 0)) > 0;
  console.log(JSON.stringify(resultado, null, 2));
  if (hayAvisos && a.estricto) process.exit(3);
}

// ---------- la hoja de contacto: una imagen, una sola revisión visual ----------
async function hoja(a) {
  const ent = a.entrada || [];
  if (!ent.length || !a.salida) fallo('Uso: node render.mjs hoja --entrada a.png b.png … --salida hoja.png [--columnas 4]');
  const cols = Math.min(+(a.columnas || 4) || 4, ent.length), celda = +(a.celda || 360);
  const imgs = ent.map((f) => ({ f, uri: datoURI(f), nombre: path.basename(f, path.extname(f)) }));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#d9d9d9;font:12px/1.2 system-ui,sans-serif}
.g{display:grid;grid-template-columns:repeat(${cols},${celda}px);gap:12px;padding:12px;width:max-content}
.c{background:#fff;padding:6px}.c img{display:block;width:${celda - 12}px;height:auto}.c b{display:block;margin-top:4px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style></head>
<body><div class="g">${imgs.map((i) => `<div class="c"><img src="${i.uri}"><b>${esc(i.nombre)}</b></div>`).join('')}</div></body></html>`;
  const navegador = await abrirNavegador(a);
  try {
    const page = await navegador.newPage({ viewport: { width: cols * (celda + 12) + 12, height: 800 } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => Promise.all([...document.images].map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = im.onerror = r; })))));
    fs.mkdirSync(path.dirname(path.resolve(a.salida)), { recursive: true });
    await page.screenshot({ path: a.salida, fullPage: true, type: 'png' });
  } finally { await navegador.close(); }
  console.log(JSON.stringify({ ok: true, hoja: path.resolve(a.salida), piezas: imgs.length }));
}

// ---------- entrada ----------
const a = leerArgs(process.argv.slice(2));
const orden = ['render', 'listar', 'hoja'].includes(a._[0]) ? a._.shift() : 'render';
if (a.ayuda || process.argv.length <= 2) { console.log(AYUDA); process.exit(0); }
try {
  if (orden === 'listar') listar(a._[0] || a.carpeta);
  else if (orden === 'hoja') await hoja(a);
  else await render(a);
} catch (e) { fallo(e.stack || e.message, 1); }
