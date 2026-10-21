// Design system: lee el sistema-visual.md de una marca (02-marca/) y lo vuelve datos que la pantalla pinta.
// Sin imports del DOM: lo usan la pantalla y las pruebas. El archivo manda; si una sección no viene, queda vacía.
// Referencias: zeroheight y Frontify (el portal de marca: cada valor a la vista, copiable y con su regla).

const SIN_EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
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

