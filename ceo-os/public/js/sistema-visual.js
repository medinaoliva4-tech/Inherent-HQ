// Design system: lee el sistema-visual.md de una marca (02-marca/) y lo vuelve datos que la pantalla pinta.
// Sin imports del DOM: lo usan la pantalla y las pruebas. El archivo manda; si una sección no viene, queda vacía.
// Referencias: zeroheight y Frontify (el portal de marca: cada valor a la vista, copiable y con su regla).

const SIN_EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
export const sinEmoji = (s) => String(s ?? '').replace(SIN_EMOJI, '');
export const limpio = (s) => String(s ?? '').replace(SIN_EMOJI, '').replace(/\s{2,}/g, ' ').trim();
// Texto plano (sin markdown) para comparar y para los valores.
export const plano = (s) => limpio(s).replace(/\*\*?|`/g, '').replace(/\s*\(([^)]*)\)\s*/g, ' ($1) ').replace(/\s{2,}/g, ' ').trim();

// Las secciones «## § Nombre» con su cuerpo.
export function secciones(md) {
  const out = []; let cur = null;
  for (const line of String(md || '').split('\n')) {
    const m = /^##\s+§\s*(.+)$/.exec(line);
    if (m) { cur = { titulo: limpio(m[1]), cuerpo: [] }; out.push(cur); continue; }
    if (/^#\s/.test(line)) { cur = null; continue; }
    if (cur) cur.cuerpo.push(line);
  }
  return out.map((s) => ({ ...s, cuerpo: s.cuerpo.join('\n') }));
}

// Las tablas de un texto: { titulo (el ### de arriba), head, rows }.
export function tablas(txt) {
  const out = []; let t = null, sub = '';
  for (const line of String(txt || '').split('\n')) {
    const h = /^###\s+(.+)$/.exec(line); if (h) { sub = limpio(h[1]); t = null; continue; }
    if (!/^\s*\|/.test(line)) { t = null; continue; }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (!t) { t = { titulo: sub, head: cells.map(plano), rows: [] }; out.push(t); } else t.rows.push(cells);
  }
  return out;
}
const col = (t, re) => t.head.findIndex((h) => re.test(h));
const tabla = (txt, re) => tablas(txt).find((t) => t.head.some((h) => re.test(h)));
// Las viñetas «- …» de un texto.
export const vinetas = (txt) => String(txt || '').split('\n').filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => limpio(l.replace(/^\s*[-*]\s+/, '')));
// Lo que no es tabla ni viñeta ni título: las notas sueltas de una sección.
const notas = (txt) => String(txt || '').split('\n').map((l) => l.trim()).filter((l) => l && !/^[|#>-]|^---$|^\*[^*]+\*$|:\**$/.test(l)).map(limpio).filter(Boolean);

const HEX = /#([0-9a-f]{6}|[0-9a-f]{3})\b/i;
export function colores(txt) {
  const t = tabla(txt, /^hex$/i); if (!t) return [];
  const [r, n, h, si, no] = [col(t, /^rol/i), col(t, /^nombre/i), col(t, /^hex/i), col(t, /d[oó]nde se usa/i), col(t, /d[oó]nde no/i)];
  return t.rows.map((c) => ({ rol: plano(c[r]), nombre: plano(c[n]), hex: (HEX.exec(c[h]) || [])[0]?.toUpperCase() || '', usa: plano(c[si]), no: plano(c[no]).replace(/^—$/, '') })).filter((x) => x.hex);
}
// El color que nombra un texto («Naranja sobre negro mate» → el primero que aparece). El nombre más largo gana.
// También vale la primera palabra del nombre («naranja» → Naranja Cerantola), si no la usa otro color.
export function colorEn(txt, cs) {
  const s = ` ${plano(txt).toLowerCase()} `;
  const alias = cs.flatMap((c) => { const n = c.nombre.toLowerCase(), w = n.split(/\s+/)[0]; return [[n, c], ...(w !== n && !cs.some((d) => d !== c && d.nombre.toLowerCase() === w) ? [[w, c]] : [])]; });
  const xs = alias.map(([a, c]) => ({ a, c, i: s.search(new RegExp(`[^a-záéíóúñ]${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-záéíóúñ])`)) })).filter((x) => x.i >= 0);
  const libres = xs.filter((x) => !xs.some((y) => y !== x && y.a.length > x.a.length && y.i <= x.i && x.i < y.i + y.a.length + 1));
  return libres.sort((a, b) => a.i - b.i || b.a.length - a.a.length)[0]?.c || null;
}
// Texto sobre fondo: «A sobre B».
function par(txt, cs) {
  const [a, b] = plano(txt).split(/\s+sobre\s+/i);
  return { tinta: colorEn(a || '', cs), fondo: colorEn(b || '', cs) };
}
export function contrastes(txt, cs) {
  const t = tabla(txt, /^contraste$/i); if (!t) return [];
  const raw = (s) => String(s || '');
  return t.rows.map((c) => {
    const p = par(c[0], cs), ok = !/❌/.test(raw(c[2])) && !/^\s*(nunca|no)\b/i.test(plano(c[2]));
    return { label: plano(c[0]), ratio: parseFloat(String(c[1]).replace(',', '.')) || null, ok, nota: plano(c[2]) || (ok ? 'Sirve' : 'No'), ...p };
  }).filter((x) => x.tinta && x.fondo);
}

const PESOS = [['thin', 100], ['extralight', 200], ['light', 300], ['regular', 400], ['medium', 500], ['semibold', 600], ['bold', 700], ['black', 900]];
const num = (s) => parseFloat(String(s || '').replace(/[−–]/g, '-').replace(',', '.'));
export function tipografia(txt, cs = []) {
  const fam = tabla(txt, /^familia$/i), esc = tabla(txt, /^nivel$/i), comb = tablas(txt).find((t) => /combinaci/i.test(t.titulo));
  const familias = fam ? fam.rows.map((c) => ({ nombre: plano(c[0]), para: plano(c[1]), pesos: plano(c[2]) })) : [];
  const nombres = [...familias.map((f) => f.nombre)].sort((a, b) => b.length - a.length);
  const escala = esc ? esc.rows.map((c) => {
    const [fi, ti, ei] = [col(esc, /fuente/i), col(esc, /tama/i), col(esc, /espaciado/i)];
    const f = plano(c[fi]), fl = f.toLowerCase().replace(/\s+/g, '');
    const familia = nombres.find((n) => f.toLowerCase().startsWith(n.toLowerCase())) || f.split(/\s+/)[0];
    const peso = [...PESOS].sort((a, b) => b[0].length - a[0].length).find(([k]) => fl.includes(k))?.[1] || 400;
    const [tam, lh] = String(plano(c[ti])).split('/').map((x) => x.trim());
    const size = num(tam), lhN = num(lh);
    const sp = num(plano(c[ei]));
    return { nivel: plano(c[0]), familia, peso, size: Number.isFinite(size) ? size : 16, lh: Number.isFinite(lhN) ? (/%/.test(lh) ? lhN / 100 : lhN) : 1.2,
      tracking: Number.isFinite(sp) ? sp / 100 : 0, mayus: /may[uú]scula/i.test(f), color: colorEn(f.replace(new RegExp(familia, 'i'), ''), cs)?.hex || null, fuente: f, medida: [plano(c[ti]), plano(c[ei])].filter((x) => x && x !== '0').join(' · ') };
  }) : [];
  const combinaciones = comb ? comb.rows.map((c) => ({ n: plano(c[0]), que: plano(c[1]) })) : [];
  return { familias, escala, combinaciones, notas: vinetas(txt) };
}
// Las familias, en la URL de Google Fonts (solo las que tienen nombre de fuente; la que no está ahí cae al sistema).
export function fuentesUrl(familias) {
  const xs = familias.filter((f) => f.nombre && !/arial|helvetica|avant/i.test(f.nombre));
  if (!xs.length) return '';
  const fams = xs.map((f) => { const ws = [...new Set((f.pesos.match(/\d{3}/g) || ['400']).map(Number))].sort((a, b) => a - b); return `family=${encodeURIComponent(f.nombre).replace(/%20/g, '+')}:wght@${ws.join(';')}`; });
  return `https://fonts.googleapis.com/css2?${fams.join('&')}&display=swap`;
}

export function logos(txt, cs) {
  const t = tabla(txt, /^versi[oó]n$/i); if (!t) return [];
  const [v, a, d] = [col(t, /versi/i), col(t, /archivo/i), col(t, /d[oó]nde/i)];
  return t.rows.map((c) => ({ version: plano(c[v]), archivo: plano(c[a]).replace(/[^\w.-]/g, ''), donde: plano(c[d]), ...par(c[v], cs) })).filter((x) => /\.svg$|\.png$/i.test(x.archivo));
}
// Una tabla de dos columnas (clave | valor) → reglas.
export function reglas(txt) {
  return tablas(txt).map((t) => ({ titulo: t.titulo, head: t.head, kv: t.head.length === 2 && !t.head.join('').trim(), rows: t.rows.map((r) => r.map(limpio)) }));
}

// Todo junto. md = el texto de sistema-visual.md.
export function leerSistema(md) {
  const ss = secciones(md), de = (re) => ss.find((s) => re.test(s.titulo))?.cuerpo || '';
  const cs = colores(de(/^color/i));
  const intro = String(md || '').split(/^##\s/m)[0].split('\n').filter((l) => /^>/.test(l)).map((l) => limpio(l.replace(/^>\s?/, ''))).filter(Boolean);
  return {
    intro,
    referentes: (tabla(de(/de d[oó]nde sale/i), /referente/i)?.rows || []).map((c) => ({ quien: plano(c[0]), que: plano(c[1]) })),
    colores: cs,
    colorNotas: notas(de(/^color/i)),
    contrastes: contrastes(de(/^color/i), cs),
    tipo: tipografia(de(/^tipograf/i), cs),
    logos: logos(de(/^logo/i), cs),
    composicion: reglas(de(/^composici/i)),
    imagen: { reglas: reglas(de(/^imagen/i)), notas: notas(de(/^imagen/i)) },
    movimiento: reglas(de(/^movimiento/i)),
    prohibido: vinetas(de(/prohibid/i)),
    otras: ss.filter((s) => !/de d[oó]nde sale|^color|^tipograf|^logo|^composici|^imagen|^movimiento|prohibid/i.test(s.titulo)).map((s) => ({ titulo: s.titulo, reglas: reglas(s.cuerpo), vinetas: vinetas(s.cuerpo), notas: notas(s.cuerpo) })),
  };
}

// El contraste WCAG entre dos hex (para lo que el archivo no trae).
const lum = (hex) => { const h = hex.replace('#', ''), f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0); };
export const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 10) / 10; };

// Los tokens en CSS, para copiar (Figma, la web o una pieza de código).
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function tokensCss(sis) {
  const L = [':root {'];
  for (const c of sis.colores) L.push(`  --color-${slug(c.nombre)}: ${c.hex};${c.rol ? ` /* ${c.rol} */` : ''}`);
  for (const f of sis.tipo.familias) L.push(`  --font-${slug(f.para.split(/\s+y\s+|,/)[0]) || slug(f.nombre)}: '${f.nombre}', Arial, sans-serif;`);
  for (const e of sis.tipo.escala) L.push(`  --type-${slug(e.nivel)}: ${e.peso} ${e.size}px/${e.lh} '${e.familia}';${e.tracking ? ` /* tracking ${e.tracking}em */` : ''}`);
  L.push('}');
  return L.join('\n');
}


// El primer link de Figma de un texto (el kit de redes lo trae en su tabla).
export const figmaDe = (txt) => (/https:\/\/(?:www\.)?figma\.com\/[^\s)>\]]+/.exec(String(txt || '')) || [])[0] || '';
// El grupo de un archivo de la carpeta de assets, por su nombre o su tipo.
export function tipoAsset(f) {
  const n = String(f.name || '').toLowerCase(), m = String(f.mime || '');
  if (/folder/.test(m)) return 'Carpetas';
  if (/[ií]cono|icon/.test(n)) return 'Íconos';
  if (/textur|pattern|patr[oó]n|trama/.test(n)) return 'Texturas';
  if (/logo/.test(n)) return 'Logos';
  if (/font|fuente|\.(ttf|otf|woff2?)$/.test(n)) return 'Fuentes';
  if (/^image\//.test(m)) return 'Fotos e imágenes';
  if (/^video\//.test(m)) return 'Video';
  return 'Otros';
}

// ---------- La inversa: datos → sistema-visual.md (Visual Identity Builder) ----------
// escribirSistema(leerSistema(md)) devuelve un md que se lee igual: lo que el editor guarda y exporta.
const celda = (s) => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '/').trim();
const filaMd = (cs) => `| ${cs.map(celda).join(' | ')} |`;
const tablaMd = (head, rows) => [filaMd(head), `|${head.map(() => '---').join('|')}|`, ...rows.map(filaMd)];
const mdReglas = (rs) => { const L = []; let prev = ''; for (const t of rs || []) { if (t.titulo && t.titulo !== prev) { L.push(`### ${t.titulo}`, ''); prev = t.titulo; } L.push(...tablaMd(t.head || ['', ''], t.rows || []), ''); } return L; };
const mdNotas = (ns) => (ns || []).flatMap((n) => [n, '']);
const mdVinetas = (vs) => ((vs || []).length ? [...vs.map((v) => `- ${v}`), ''] : []);
const NOMBRE_PESO = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 900: 'Black' };
const pct = (n) => `${+(n * 100).toFixed(2)}%`;
// El texto «Fuente» de una fila de la escala si no trae el original (familia + peso, mayúsculas y color).
export const fuenteDe = (e, cs = []) => {
  const nom = cs.find((c) => c.hex === e.color)?.nombre;
  return [`${e.familia} ${NOMBRE_PESO[e.peso] || 'Regular'}`.trim(), e.mayus ? 'mayúsculas' : '', nom || ''].filter(Boolean).join(', ');
};
const medidaDe = (e) => {
  if (e.medida) { const p = String(e.medida).split(' · '); return [p[0], p[1] || '0']; }
  return [`${e.size} / ${pct(e.lh)}`, e.tracking ? `${e.tracking > 0 ? '+' : '−'}${pct(Math.abs(e.tracking))}` : '0'];
};
export function escribirSistema(sis, { nombre = '' } = {}) {
  const s = sis || {}, tipo = s.tipo || {}, cs = s.colores || [];
  const L = [`# Sistema visual${nombre ? ` — ${nombre}` : ''}`, ''];
  for (const l of s.intro || []) L.push(`> ${l}`);
  if ((s.intro || []).length) L.push('');
  const sec = (titulo, cuerpo) => { if (cuerpo.some((x) => x !== '')) L.push('---', '', `## § ${titulo}`, '', ...cuerpo); };
  sec('De dónde sale', (s.referentes || []).length ? [...tablaMd(['Referente', 'Qué se toma'], s.referentes.map((r) => [`**${r.quien}**`, r.que])), ''] : []);
  const color = [];
  if (cs.length) color.push(...tablaMd(['Rol', 'Nombre', 'Hex', 'Dónde se usa', 'Dónde NO'], cs.map((c) => [`**${c.rol}**`, `**${c.nombre}**`, `\`${c.hex}\``, c.usa, c.no || '—'])), '');
  color.push(...mdNotas(s.colorNotas));
  if ((s.contrastes || []).length) color.push('**Contraste verificado:**', '', ...tablaMd(['', 'Contraste', ''], s.contrastes.map((x) => [x.label, x.ratio ?? '', `${x.ok ? '✅' : '❌'} ${x.nota}`])), '');
  sec('Color', color);
  const ty = [];
  if ((tipo.familias || []).length) ty.push(...tablaMd(['Familia', 'Para qué', 'Pesos'], tipo.familias.map((f) => [`**${f.nombre}**`, f.para, f.pesos])), '');
  if ((tipo.escala || []).length) ty.push('### La escala', '', ...tablaMd(['Nivel', 'Fuente', 'Tamaño', 'Espaciado'], tipo.escala.map((e) => { const [tam, esp] = medidaDe(e); return [`**${e.nivel}**`, e.fuente || fuenteDe(e, cs), tam, esp]; })), '');
  if ((tipo.combinaciones || []).length) ty.push('### Las combinaciones', '', ...tablaMd(['', 'Combinación'], tipo.combinaciones.map((c) => [`**${c.n}**`, c.que])), '');
  ty.push(...mdVinetas(tipo.notas));
  sec('Tipografía', ty);
  sec('Logo', (s.logos || []).length ? [...tablaMd(['Versión', 'Archivo', 'Dónde'], s.logos.map((l) => [l.version, `\`${l.archivo}\``, l.donde])), ''] : []);
  sec('Composición', mdReglas(s.composicion));
  sec('Imagen', [...mdReglas(s.imagen?.reglas), ...mdNotas(s.imagen?.notas)]);
  sec('Movimiento', mdReglas(s.movimiento));
  sec('Qué está prohibido', mdVinetas(s.prohibido));
  for (const o of s.otras || []) sec(o.titulo, [...mdReglas(o.reglas), ...mdVinetas(o.vinetas), ...mdNotas(o.notas)]);
  return `${L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}
export const aMd = escribirSistema;

// La huella de un texto (FNV-1a): para saber si el archivo del repo cambió desde que se abrió el borrador.
export const huella = (txt) => { let h = 0x811c9dc5; const s = String(txt ?? ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };

// ---------- Contraste: la matriz y la regla de los 4.5 ----------
export const AA = 4.5;
export const hexOk = (h) => /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(String(h || '').trim());
// El mismo cálculo que contraste(), con 2 decimales hacia abajo: 4.46 nunca se muestra ni pasa como 4.5.
export const contrasteFino = (a, b) => { if (!hexOk(a) || !hexOk(b)) return null; const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.floor(((x + 0.05) / (y + 0.05)) * 100 + 1e-9) / 100; };
export const pasaAA = (a, b) => { const r = contrasteFino(a, b); return r !== null && r >= AA; };
// Todos los pares tinta/fondo de la paleta (la matriz del editor).
export const matrizContraste = (cs) => cs.filter((c) => hexOk(c.hex)).map((t) => ({ tinta: t, fila: cs.filter((c) => hexOk(c.hex)).map((f) => ({ fondo: f, ratio: t === f ? null : contrasteFino(t.hex, f.hex) })) }));
// Un par nuevo con su verdad: ok solo si pasa 4.5.
export function parContraste(t, f, nota = '') {
  const ratio = contraste(t.hex, f.hex), ok = pasaAA(t.hex, f.hex);
  return { label: `${t.nombre} sobre ${f.nombre}`, ratio, ok, nota: nota || (ok ? 'Sirve' : 'No sirve en texto chico'), tinta: t, fondo: f };
}
// Las faltas del sistema: lo que impide exportarlo. Nunca un par «ok» bajo 4.5, ni hex inválidos, ni dos acentos.
export function faltasSistema(sis) {
  const out = [], cs = sis?.colores || [];
  for (const c of cs) if (!hexOk(c.hex)) out.push(`El color «${c.nombre || 'sin nombre'}» no tiene un hex válido.`);
  if (!cs.length) out.push('Falta la paleta: ⚠️ SIN DATOS, sale de la guía de marca y del brief.');
  if (cs.filter((c) => /acento/i.test(c.rol)).length > 1) out.push('Hay más de un acento: el sistema lleva uno solo.');
  for (const x of sis?.contrastes || []) { const r = contrasteFino(x.tinta?.hex, x.fondo?.hex); if (x.ok && (r === null || r < AA)) out.push(`«${x.label}» está marcado ok con ${r ?? 'sin dato'}: bajo ${AA} no puede ir en ok.`); }
  return out;
}

// ---------- Medidas de la composición, para las maquetas ----------
const n1 = (m) => (m ? parseFloat(m[1].replace(',', '.')) : null);
export function medidasDe(comp) {
  const filas = (comp || []).flatMap((t) => t.rows || []), de = (re) => filas.find((r) => re.test(plano(r[0])))?.[1] || '';
  const safeTxt = String(de(/safe/i)).split('·')[0], grilla = de(/grilla/i);
  const arriba = n1(/(\d+(?:[.,]\d+)?)\s*%\s*de\s*arriba/i.exec(safeTxt)), abajo = n1(/(\d+(?:[.,]\d+)?)\s*%\s*de\s*abajo/i.exec(safeTxt)), der = n1(/(\d+(?:[.,]\d+)?)\s*%\s*(?:derecho|de la derecha|a la derecha)/i.exec(safeTxt));
  return {
    margen: n1(/(\d+(?:[.,]\d+)?)\s*%/.exec(de(/m[aá]rgenes/i))),
    safe: arriba !== null && abajo !== null && der !== null ? { arriba, abajo, der } : null,
    columnas: n1(/(\d+)\s*columnas?\s*en\s*redes/i.exec(grilla)) ?? n1(/(\d+)\s*columnas?/i.exec(grilla)),
    canaleta: n1(/canaleta\s*de\s*(\d+(?:[.,]\d+)?)\s*%/i.exec(grilla)),
  };
}

// Un sistema vacío para empezar de cero (⚠️ SIN DATOS: nada inventado).
export const sistemaVacio = () => leerSistema('');
