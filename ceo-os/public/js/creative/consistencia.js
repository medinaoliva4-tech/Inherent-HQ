// Brand Consistency Checker (herramienta brand-consistency-checker de Creative): el reporte de una pieza contra el sistema visual y la voz de la marca,
// en 6 secciones (Color, Tipografía, Composición y safe zones, Prohibido, Voz, Parecido), regla por regla con pasa / no pasa, su corrección y su fuente.
// Existe para que el pase determinista (sistema-visual.md + el ojo + Laya «suena»), la unión con lo que dice br-guardian, las rondas de la ficha, el historial
// que solo se agrega y el pedido a la IA vivan en un solo módulo puro (sin DOM ni red) que comparten la vista y las pruebas. Lo que no se pudo medir es
// «sin-datos» con su razón, nunca un «pasa» inventado; sin el ojo (CLIP) sale sin Parecido y lo dice. Se guarda en content.cumplimiento.
import { plano, corta, numeroONull, leerHerramienta, contextoPrompt, celda, sinAcentos, SIN_DATOS } from '../consulting/marcos.js';
import { medidasDe, contrasteFino, hexOk, AA } from '../sistema-visual.js';

export const BLOQUE = 'consistencia';
export const SECCIONES = [['color', 'Color'], ['tipografia', 'Tipografía'], ['composicion', 'Composición y safe zones'], ['prohibido', 'Prohibido'], ['voz', 'Voz'], ['parecido', 'Parecido']];
export const SECCION_IDS = SECCIONES.map(([id]) => id);
export const ESTADOS = [['pasa', 'Pasa'], ['no-pasa', 'No pasa'], ['sin-datos', 'Sin datos']];
export const UMBRAL_PARECIDO = 0.6, UMBRAL_VOZ = 0.5;
const MAX_PROMPT = 4900, MAX_HISTORIAL = 200, MAX_REGLAS = 40;
const F_SIS = (sec) => `02-marca/sistema-visual.md · ${sec}`;
export const FUENTE_GUARDIAN = 'br-guardian (revisión de la lámina)', FUENTE_OJO = 'El ojo (CLIP)', FUENTE_LAYA = 'Laya · suena a la marca', FUENTE_PERSONA = 'Revisión a ojo';
export const nombreSeccion = (id) => SECCIONES.find(([k]) => k === id)?.[1] || String(id || '');
const seccionId = (v) => { const k = sinAcentos(v); return SECCION_IDS.find((id) => id === k || sinAcentos(nombreSeccion(id)) === k) || (/safe|composici/.test(k) ? 'composicion' : /tipograf|fuente/.test(k) ? 'tipografia' : /prohib/.test(k) ? 'prohibido' : /voz|tono|copy/.test(k) ? 'voz' : /parecid|ojo|clip/.test(k) ? 'parecido' : /color|acento|contraste|paleta/.test(k) ? 'color' : ''); };
const slugId = (s) => sinAcentos(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const n01 = (v) => numeroONull(v, { min: 0, max: 1 });
const hexN = (h) => { const x = String(h || '').trim().toUpperCase(); return /^#[0-9A-F]{3}$/.test(x) ? `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}` : x; };
const rgb = (h) => { const x = hexN(h).slice(1); return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)); };
const cercano = (h, paleta) => (hexOk(h) ? [...paleta].filter((p) => hexOk(p.hex)).sort((a, b) => dist(rgb(h), rgb(a.hex)) - dist(rgb(h), rgb(b.hex)))[0] || null : null);
const dist = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

// ---------- El contenido ----------
const regla = (id, r, estado, detalle, correccion, fuente) => ({ id, regla: r, estado, detalle: detalle || '', correccion: correccion || '', fuente });
export const vacio = () => ({ secciones: SECCIONES.map(([id]) => ({ id, reglas: [] })), parecido: null, razon_parecido: '', resumen: '' });

function reglaLimpia(x) {
  const id = slugId(x.id) || slugId(x.regla), estado = sinAcentos(x.estado).replace(/\s+/g, '-').replace(/^no-?pasa$/, 'no-pasa').replace(/^(sin-?datos|sin-dato)$/, 'sin-datos');
  return { id, regla: corta(x.regla, 160), estado: ['pasa', 'no-pasa', 'sin-datos'].includes(estado) ? estado : 'sin-datos', detalle: corta(x.detalle, 300), correccion: corta(x.correccion, 300), fuente: corta(x.fuente, 160) };
}
// Solo lo conocido. Acepta el reporte armado (secciones) o la lista plana que contesta la IA (reglas con su «seccion»). Las 6 secciones siempre, en orden; ids únicos.
export function limpiar(c) {
  const o = plano(c) ? c : {}, por = Object.fromEntries(SECCION_IDS.map((id) => [id, []])), vistos = new Set(); let total = 0;
  const meter = (sec, x) => {
    if (!plano(x) || !sec || total >= MAX_REGLAS) return;
    const r = reglaLimpia(x); if (!r.regla) return;
    let id = r.id || `${sec}-${por[sec].length + 1}`; while (vistos.has(id)) id += '-b';
    vistos.add(id); por[sec].push({ ...r, id }); total++;
  };
  for (const s of Array.isArray(o.secciones) ? o.secciones : []) { const sec = plano(s) ? seccionId(s.id) : ''; for (const x of Array.isArray(s?.reglas) ? s.reglas : []) meter(sec, x); }
  for (const x of Array.isArray(o.reglas) ? o.reglas : []) meter(plano(x) ? seccionId(x.seccion) : '', x);
  const parecido = n01(o.parecido);
  return { secciones: SECCION_IDS.map((id) => ({ id, reglas: por[id] })), parecido, razon_parecido: corta(o.razon_parecido, 200), resumen: corta(o.resumen, 600) };
}
export const reglasDe = (c) => limpiar(c).secciones.flatMap((s) => s.reglas.map((r) => ({ ...r, seccion: s.id })));
export function conteo(c) { const l = reglasDe(c); return { pasa: l.filter((r) => r.estado === 'pasa').length, noPasa: l.filter((r) => r.estado === 'no-pasa').length, sinDatos: l.filter((r) => r.estado === 'sin-datos').length, total: l.length }; }
// pasa: nada falla y todo lo medible se midió · no-pasa: algo falla (vuelve a Diseño con sus correcciones) · incompleto: falta medir algo. Sin Parecido (sin CLIP) no bloquea.
export function veredicto(c) {
  const l = reglasDe(c); if (!l.length) return 'incompleto';
  if (l.some((r) => r.estado === 'no-pasa')) return 'no-pasa';
  return l.some((r) => r.estado === 'sin-datos' && r.seccion !== 'parecido') ? 'incompleto' : 'pasa';
}

// ---------- El pase determinista ----------
const GUARDIAN = [['color', /color|acento|contraste|paleta/i], ['tipografia', /tipograf|fuente|tama[nñ]o|peso/i], ['prohibido', /prohib|nunca|emoji/i], ['voz', /voz|tono|copy|texto/i]];
// La revisión que dejó Diseño en la lámina ([{ ok, texto }], del bloque ```diseno```) vuelve regla con su fuente; lo que no calza en otra sección va a Composición.
export function reglasDeRevision(revision) {
  return (Array.isArray(revision) ? revision : []).filter((x) => plano(x) && corta(x.texto, 120)).slice(0, 12).map((x, i) => {
    const texto = corta(x.texto, 120), sec = (GUARDIAN.find(([, re]) => re.test(texto)) || ['composicion'])[0];
    return { seccion: sec, ...regla(`revision-${i + 1}`, texto, x.ok === false ? 'no-pasa' : 'pasa', x.ok === false ? 'La revisión de la lámina lo marcó' : 'La revisión de la lámina lo marcó bien', x.ok === false ? 'Corrígelo en la lámina y vuelve a exportarla' : '', FUENTE_GUARDIAN) };
  });
}
const terminos = (v) => [...String(v || '').matchAll(/[«"“']([^»"”']{2,40})[»"”']/g)].map((m) => m[1].trim()).filter(Boolean);

// sistema = leerSistema(md) | null · pieza = { titulo, texto, formato, revision } · observado (opcional, lo leído de la lámina en Figma) = { colores:[hex], pares:[{ tinta, fondo }],
// fuentes:[nombre], safe:{ arriba, abajo, der } en %, margen en % } · ojo = { parecido 0..1 } | null · laya = { prob, umbral } | null (la respuesta «suena»).
// → un reporte (limpiar). Cada regla trae su fuente; lo que no se pudo medir queda «sin-datos» con su razón.
export function pase({ sistema = null, pieza = {}, observado = {}, ojo = null, laya = null } = {}) {
  const sis = plano(sistema) ? sistema : null, p = plano(pieza) ? pieza : {}, ob = plano(observado) ? observado : {}, R = [];
  const paleta = (sis?.colores || []).filter((x) => hexOk(x.hex)), sinSis = (sec) => `Sin sistema visual: sale de clients/<cliente>/${F_SIS(sec)}`;
  // Color
  const cols = (Array.isArray(ob.colores) ? ob.colores : []).filter(hexOk).map(hexN);
  if (!sis) R.push({ seccion: 'color', ...regla('color-paleta', 'Solo colores de la paleta', 'sin-datos', sinSis('Color'), '', F_SIS('Color')) });
  else if (!cols.length) R.push({ seccion: 'color', ...regla('color-paleta', 'Solo colores de la paleta', 'sin-datos', 'Sin colores leídos de la lámina: salen de Figma (variables y estilos) o de la revisión de Diseño', '', F_SIS('Color')) });
  else {
    const fuera = [...new Set(cols.filter((h) => !paleta.some((x) => hexN(x.hex) === h)))];
    R.push({ seccion: 'color', ...regla('color-paleta', 'Solo colores de la paleta', fuera.length ? 'no-pasa' : 'pasa', fuera.length ? `Usa ${fuera.join(', ')} y no están en la paleta` : `Los ${new Set(cols).size} colores de la lámina están en la paleta`,
      fuera.length ? fuera.map((h) => { const c = cercano(h, paleta); return c ? `Cambia ${h} por ${c.nombre || c.rol} ${c.hex}` : `Cambia ${h} por un color de la paleta`; }).join(' · ') : '', F_SIS('Color')) });
    const acentos = paleta.filter((x) => /acento/i.test(x.rol)).map((x) => hexN(x.hex));
    if (acentos.length) { const usados = [...new Set(cols.filter((h) => acentos.includes(h)))]; R.push({ seccion: 'color', ...regla('color-acento', 'Un solo acento por pieza', usados.length > 1 ? 'no-pasa' : 'pasa', usados.length > 1 ? `Usa ${usados.length} acentos: ${usados.join(', ')}` : usados.length ? 'Un solo acento' : 'Sin acento', usados.length > 1 ? `Deja un solo acento (${usados[0]}) y pasa el otro a un neutro` : '', F_SIS('Color')) }); }
  }
  const pares = (Array.isArray(ob.pares) ? ob.pares : []).filter((x) => plano(x) && hexOk(x.tinta) && hexOk(x.fondo));
  if (!pares.length) R.push({ seccion: 'color', ...regla('color-contraste', `Texto con contraste de ${AA} o más`, 'sin-datos', 'Sin pares de texto y fondo leídos de la lámina: salen de Figma', '', F_SIS('Color')) });
  else {
    const mal = pares.map((x) => ({ ...x, r: contrasteFino(x.tinta, x.fondo) })).filter((x) => x.r === null || x.r < AA);
    const ok = (sis?.contrastes || []).find((x) => x.ok);
    R.push({ seccion: 'color', ...regla('color-contraste', `Texto con contraste de ${AA} o más`, mal.length ? 'no-pasa' : 'pasa', mal.length ? mal.map((x) => `${hexN(x.tinta)} sobre ${hexN(x.fondo)}: ${x.r} a 1`).join(' · ') : `Los ${pares.length} pares llegan a ${AA}`, mal.length ? `Usa un par que sirva${ok ? `, como ${ok.label}` : ''}` : '', F_SIS('Color')) });
  }
  // Tipografía
  const fams = (sis?.tipo?.familias || []).map((f) => f.nombre).filter(Boolean), usadas = (Array.isArray(ob.fuentes) ? ob.fuentes : []).map((f) => corta(f, 60)).filter(Boolean);
  if (!fams.length) R.push({ seccion: 'tipografia', ...regla('tipo-familias', 'Solo las tipografías del sistema', 'sin-datos', sis ? 'El sistema no declara familias tipográficas' : sinSis('Tipografía'), '', F_SIS('Tipografía')) });
  else if (!usadas.length) R.push({ seccion: 'tipografia', ...regla('tipo-familias', 'Solo las tipografías del sistema', 'sin-datos', 'Sin fuentes leídas de la lámina: salen de Figma (estilos de texto)', '', F_SIS('Tipografía')) });
  else { const fuera = usadas.filter((u) => !fams.some((f) => sinAcentos(f) === sinAcentos(u))); R.push({ seccion: 'tipografia', ...regla('tipo-familias', 'Solo las tipografías del sistema', fuera.length ? 'no-pasa' : 'pasa', fuera.length ? `Usa ${fuera.join(', ')}` : `Usa ${usadas.join(', ')}`, fuera.length ? `Cámbialo por ${fams.join(' o ')}` : '', F_SIS('Tipografía')) }); }
  // Composición y safe zones
  const med = sis ? medidasDe(sis.composicion) : { safe: null, margen: null }, safe = plano(ob.safe) ? ob.safe : null;
  const faltaSafe = !med.safe ? (sis ? 'El sistema no declara safe zones' : sinSis('Composición')) : !safe ? 'Sin medidas leídas de la lámina: salen de Figma (los márgenes del texto)' : '';
  if (faltaSafe) R.push({ seccion: 'composicion', ...regla('comp-safe', 'El texto respeta las safe zones', 'sin-datos', faltaSafe, '', F_SIS('Composición')) });
  else { const lados = [['arriba', 'de arriba'], ['abajo', 'de abajo'], ['der', 'a la derecha']].filter(([k]) => numeroONull(safe[k]) !== null && numeroONull(safe[k]) < med.safe[k]);
    R.push({ seccion: 'composicion', ...regla('comp-safe', 'El texto respeta las safe zones', lados.length ? 'no-pasa' : 'pasa', lados.length ? lados.map(([k, t]) => `Deja ${safe[k]}% ${t} y el mínimo es ${med.safe[k]}%`).join(' · ') : 'Respeta los tres márgenes', lados.length ? 'Mueve el texto hacia adentro hasta cumplir los mínimos' : '', F_SIS('Composición')) }); }
  const mg = numeroONull(ob.margen);
  if (med.margen !== null && mg !== null) R.push({ seccion: 'composicion', ...regla('comp-margen', 'Margen del sistema', mg >= med.margen ? 'pasa' : 'no-pasa', `Margen de ${mg}% y el mínimo es ${med.margen}%`, mg >= med.margen ? '' : `Sube el margen a ${med.margen}% o más`, F_SIS('Composición')) });
  // Prohibido
  const texto = [p.titulo, p.texto].map((x) => String(x ?? '')).join(' \n ').toLowerCase();
  (sis?.prohibido || []).slice(0, 12).forEach((v, i) => {
    const ts = terminos(v), hit = ts.filter((t) => texto.includes(t.toLowerCase()));
    R.push({ seccion: 'prohibido', ...(hit.length ? regla(`proh-${i + 1}`, corta(v, 160), 'no-pasa', `El texto dice «${hit[0]}»`, `Quita «${hit[0]}» del texto`, F_SIS('Prohibido'))
      : ts.length && (p.texto || p.titulo) ? regla(`proh-${i + 1}`, corta(v, 160), 'pasa', 'No aparece en el texto de la pieza', '', F_SIS('Prohibido'))
        : regla(`proh-${i + 1}`, corta(v, 160), 'sin-datos', 'Se revisa a ojo sobre la lámina: br-guardian o una persona', '', F_SIS('Prohibido'))) });
  });
  if (!sis) R.push({ seccion: 'prohibido', ...regla('proh-sistema', 'Lo prohibido del sistema', 'sin-datos', sinSis('Prohibido'), '', F_SIS('Prohibido')) });
  // Voz (Laya «suena»)
  const pr = n01(laya?.prob), um = n01(laya?.umbral) ?? UMBRAL_VOZ;
  R.push({ seccion: 'voz', ...(pr === null ? regla('voz-suena', '¿Suena a la marca?', 'sin-datos', 'Laya no ha juzgado esta pieza: se pide en su ficha (pregunta «suena a la marca»)', '', FUENTE_LAYA)
    : regla('voz-suena', '¿Suena a la marca?', pr >= um ? 'pasa' : 'no-pasa', `Laya dice sí ${Math.round(pr * 100)}% (umbral ${Math.round(um * 100)}%)`, pr >= um ? '' : 'Reescribe el hook y el copy con la voz de la marca (Brand DNA › voz) y vuelve a pedir a Laya', FUENTE_LAYA)) });
  // Parecido (el ojo)
  const par = n01(ojo?.parecido);
  R.push({ seccion: 'parecido', ...(par === null ? regla('parecido-ojo', '¿Se parece a la marca?', 'sin-datos', 'Sin CLIP: el ojo no está encendido en esta compu y esta pieza sale sin Parecido', '', FUENTE_OJO)
    : regla('parecido-ojo', '¿Se parece a la marca?', par >= UMBRAL_PARECIDO ? 'pasa' : 'no-pasa', `Parecido ${Math.round(par * 100)}% (mínimo ${Math.round(UMBRAL_PARECIDO * 100)}%)${ojo?.refs ? `, contra ${ojo.refs} imágenes del moodboard` : ''}`, par >= UMBRAL_PARECIDO ? '' : 'Acércala al moodboard: mismo color, luz y encuadre que las imágenes de referencia', FUENTE_OJO)) });
  for (const r of reglasDeRevision(p.revision)) R.push(r);
  const reporte = limpiar({ reglas: R, parecido: par, razon_parecido: par === null ? 'Sin CLIP: sale sin Parecido' : '' });
  return reporte;
}

// Une el pase determinista con lo que dijo br-guardian (la IA): lo que el pase no pudo medir (sin-datos) toma la regla de la IA con el mismo id; lo que el pase midió no se pisa;
// las reglas nuevas de la IA se agregan con su fuente. El parecido y su razón son del pase.
export function unir(deterministas, ia) {
  const d = limpiar(deterministas), g = limpiar(ia), delIA = new Map(reglasDe(g).map((r) => [r.id, r])), usadas = new Set();
  const secciones = d.secciones.map((s) => ({ id: s.id, reglas: s.reglas.map((r) => { const x = delIA.get(r.id); if (r.estado === 'sin-datos' && x && x.estado !== 'sin-datos') { usadas.add(x.id); return { ...r, ...x, id: r.id, fuente: x.fuente || FUENTE_GUARDIAN }; } return r; }) }));
  const nuevas = reglasDe(g).filter((r) => !usadas.has(r.id) && !reglasDe(d).some((y) => y.id === r.id));
  for (const r of nuevas) secciones.find((s) => s.id === r.seccion)?.reglas.push({ id: r.id, regla: r.regla, estado: r.estado, detalle: r.detalle, correccion: r.correccion, fuente: r.fuente || FUENTE_GUARDIAN });
  return limpiar({ secciones, parecido: d.parecido, razon_parecido: d.razon_parecido, resumen: g.resumen || d.resumen });
}
// Una persona resuelve a ojo una regla «sin-datos» (o corrige una): queda con la fuente «Revisión a ojo».
export function resolver(reporte, id, estado, correccion = '') {
  const c = limpiar(reporte);
  for (const s of c.secciones) for (const r of s.reglas) if (r.id === id && ['pasa', 'no-pasa'].includes(estado)) { r.estado = estado; r.fuente = FUENTE_PERSONA; r.correccion = estado === 'no-pasa' ? corta(correccion, 300) || r.correccion : ''; r.detalle = r.detalle || 'Revisada a ojo'; }
  return c;
}

// ---------- Las rondas de la ficha ----------
const PALABRAS = { una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
// Cuántas rondas de revisión incluye la ficha (ctx.ficha.incluye → «Rondas de revisión»); null si la ficha no lo dice.
export function rondasMax(ficha) {
  const f = (Array.isArray(ficha?.incluye) ? ficha.incluye : []).find((x) => plano(x) && /ronda|revisi/i.test(String(x.k ?? '')));
  if (!f) return null;
  const t = sinAcentos(f.v), n = /(\d+)/.exec(t);
  if (n) return Math.min(20, +n[1]) || null;
  const w = Object.keys(PALABRAS).find((k) => new RegExp(`\\b${k}\\b`).test(t));
  return w ? PALABRAS[w] : null;
}
// historial = content.cumplimiento.historial · max = rondasMax(ficha). Ronda N de M, y si ya se pasaron: escala al CEO.
export function estadoRondas({ historial = [], max = null } = {}) {
  const h = Array.isArray(historial) ? historial.filter(plano) : [], hechas = h.length, ultimo = h[hechas - 1];
  const m = Number.isInteger(max) && max > 0 ? max : null, escala = m !== null && hechas >= m && ultimo?.veredicto !== 'pasa';
  return { hechas, max: m, siguiente: hechas + 1, escala,
    texto: m === null ? `${SIN_DATOS}: las rondas de revisión salen de la ficha de oferta (Rondas de revisión)` : escala ? `Rondas agotadas (${hechas} de ${m}): lo decide el CEO` : `Ronda ${Math.min(hechas + 1, m)} de ${m}` };
}

// ---------- content.cumplimiento: el historial solo se agrega ----------
export function limpiarCumplimiento(c) {
  const o = plano(c) ? c : {};
  const historial = (Array.isArray(o.historial) ? o.historial : []).filter(plano).slice(0, MAX_HISTORIAL).map((h) => ({
    en: corta(h.en, 40), por: corta(h.por, 60), ronda: numeroONull(h.ronda, { min: 1, max: 99 }), veredicto: ['pasa', 'no-pasa', 'incompleto'].includes(h.veredicto) ? h.veredicto : 'incompleto',
    no_pasa: numeroONull(h.no_pasa, { min: 0 }) ?? 0, sin_datos: numeroONull(h.sin_datos, { min: 0 }) ?? 0, parecido: n01(h.parecido),
    fallas: (Array.isArray(h.fallas) ? h.fallas : []).filter(plano).slice(0, 20).map((f) => ({ seccion: seccionId(f.seccion), regla: corta(f.regla, 160), correccion: corta(f.correccion, 300) })) }));
  const esc = plano(o.escalado) ? { en: corta(o.escalado.en, 40), ronda: numeroONull(o.escalado.ronda, { min: 1, max: 99 }) } : null;
  return { ultimo: plano(o.ultimo) ? limpiar(o.ultimo) : null, veredicto: ['pasa', 'no-pasa', 'incompleto'].includes(o.veredicto) ? o.veredicto : '', ronda: historial.length, escalado: esc, historial };
}
// El cumplimiento que queda al guardar un reporte: lo anterior intacto + una entrada nueva al final. por = rol (no nombre); en = fecha ISO.
export function conReporte(actual, reporte, { por = '', en = '', max = null } = {}) {
  const a = limpiarCumplimiento(actual), r = limpiar(reporte), v = veredicto(r), k = conteo(r);
  const entrada = { en: corta(en, 40), por: corta(por, 60), ronda: a.historial.length + 1, veredicto: v, no_pasa: k.noPasa, sin_datos: k.sinDatos, parecido: r.parecido,
    fallas: reglasDe(r).filter((x) => x.estado === 'no-pasa').slice(0, 20).map((x) => ({ seccion: x.seccion, regla: x.regla, correccion: x.correccion })) };
  const historial = [...a.historial, entrada], est = estadoRondas({ historial, max });
  return { ultimo: r, veredicto: v, ronda: historial.length, escalado: a.escalado || (est.escala ? { en: entrada.en, ronda: entrada.ronda } : null), historial };
}
// ¿Lo que se quiere guardar solo agrega? (la regla que el servidor cuida: el historial anterior queda igual, en su orden, y no se acorta.)
export function soloSeAgrega(antes, despues) {
  const a = limpiarCumplimiento(antes).historial, d = limpiarCumplimiento(despues).historial;
  return d.length >= a.length && a.every((x, i) => JSON.stringify(x) === JSON.stringify(d[i]));
}

// ---------- Lo que falta (bloquea mandar la pieza a revisión) ----------
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [];
  for (const s of c.secciones) if (!s.reglas.length) f.push(`La sección «${nombreSeccion(s.id)}» no tiene ninguna regla revisada`);
  for (const r of reglasDe(c)) {
    if (!r.fuente) f.push(`La regla «${r.regla}» no cita su fuente`);
    if (r.estado === 'no-pasa' && !r.correccion) f.push(`La regla «${r.regla}» no pasa y no dice cómo corregirla`);
  }
  return f;
}

// ---------- El pedido a la IA (br-guardian, < 5 000 caracteres) ----------
const F = '```';
// ctx.pieza = { titulo, formato, texto, revision }, ctx.sistema = leerSistema(md) | null, ctx.pase = el reporte determinista (para no repetirlo).
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, cli = plano(c.cliente) ? c.cliente : {}, p = plano(c.pieza) ? c.pieza : {}, sis = plano(c.sistema) ? c.sistema : null;
  const nombre = corta(cli.nombre, 80) || 'el cliente';
  const paleta = (sis?.colores || []).slice(0, 10).map((x) => `${corta(x.nombre || x.rol, 30)} ${x.hex}${x.rol ? ` (${corta(x.rol, 20)})` : ''}`).join(', ');
  const fams = (sis?.tipo?.familias || []).slice(0, 4).map((f) => corta(f.nombre, 30)).join(', ');
  const m = sis ? medidasDe(sis.composicion) : { safe: null };
  const proh = (sis?.prohibido || []).slice(0, 8).map((v, i) => `proh-${i + 1}: ${corta(v, 110)}`).join('\n');
  const pendientes = reglasDe(c.pase).filter((r) => r.estado === 'sin-datos').map((r) => r.id).join(', ');
  const intro = `Eres br-guardian de Inherent. Revisa UNA pieza de «${nombre}» contra su sistema visual y dime, regla por regla, si pasa o no y cómo se corrige.`;
  const reglas = [
    'REGLAS (no se negocian):',
    '- Solo juzgas lo que ves en la lámina o lees en el texto. Lo que no puedes ver va estado «sin-datos» con su razón: nunca un «pasa» por falta de ojo.',
    '- Cada regla cita su fuente (02-marca/sistema-visual.md y su sección, o br-guardian). No inventes hex, tipografías ni medidas: usa solo las del sistema.',
    '- Todo «no-pasa» trae su corrección, concreta y corta (qué cambiar y por qué valor). Una pieza que no pasa vuelve a Diseño: tú no la rediseñas.',
    '- Nunca leas ni cites inherent/06-ECONOMIA.md, costos de Inherent ni datos de otro cliente. Roles, no nombres de personas. Español de «tú», corto y humano.',
  ].join('\n');
  const datos = [
    `PIEZA: ${corta(p.titulo, 100) || SIN_DATOS} · ${corta(p.formato, 30) || 'formato sin definir'}`, `Texto de la pieza: ${corta(p.texto, 500) || SIN_DATOS}`,
    sis ? `SISTEMA VISUAL (lo que se ejecuta): colores ${paleta || SIN_DATOS}. Tipografías ${fams || SIN_DATOS}. Safe zones ${m.safe ? `${m.safe.arriba}% arriba, ${m.safe.abajo}% abajo, ${m.safe.der}% a la derecha` : SIN_DATOS}.` : `SISTEMA VISUAL: ${SIN_DATOS}: sale de clients/<cliente>/02-marca/sistema-visual.md`,
    proh ? `PROHIBIDO (ids para citar):\n${proh}` : '', pendientes ? `Reglas que el pase automático no pudo medir y te tocan: ${pendientes}` : '',
    `Secciones (id): ${SECCION_IDS.join(', ')}.`,
  ].filter(Boolean).join('\n');
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"resumen":"1 o 2 frases","reglas":[{"seccion":"prohibido","id":"proh-1","regla":"…","estado":"pasa|no-pasa|sin-datos","detalle":"…","correccion":"…","fuente":"br-guardian"}]}',
    F, `${F}criterios`, '{"entregable":"Reporte de consistencia","cumple":["…"],"falta":["… — por qué"]}', F,
  ].join('\n');
  const fijo = [intro, '', reglas, '', datos, '', salida].join('\n');
  return [intro, '', reglas, '', contextoPrompt(c, Math.max(120, MAX_PROMPT - fijo.length - 2)), '', datos, '', salida].join('\n');
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
const MARCA = { pasa: 'Pasa', 'no-pasa': 'No pasa', 'sin-datos': SIN_DATOS };
export function aMd(contenido, { titulo = '' } = {}) {
  const c = limpiar(contenido), k = conteo(c), v = veredicto(c);
  const L = [`# Consistencia de marca${titulo ? ` · ${corta(titulo, 100)}` : ''}`, '', `**${v === 'pasa' ? 'Pasa' : v === 'no-pasa' ? 'No pasa' : 'Incompleto'}** · ${k.pasa} pasan, ${k.noPasa} no pasan, ${k.sinDatos} sin datos`, ''];
  if (c.resumen) L.push(c.resumen, '');
  for (const s of c.secciones) {
    L.push(`## ${nombreSeccion(s.id)}`, '');
    if (!s.reglas.length) { L.push(`${SIN_DATOS}: sin reglas revisadas.`, ''); continue; }
    L.push('| Regla | Resultado | Detalle | Corrección | Fuente |', '|---|---|---|---|---|', ...s.reglas.map((r) => `| ${celda(r.regla)} | ${MARCA[r.estado]} | ${celda(r.detalle) || '—'} | ${celda(r.correccion) || '—'} | ${celda(r.fuente) || '—'} |`), '');
  }
  if (c.parecido === null) L.push('Esta pieza sale sin Parecido: el ojo (CLIP) no estaba encendido.');
  return L.join('\n');
}
