// App 01 · Marca › Diseño › Video: el kit de edición de la marca y una ficha por video. Puro (sin DOM): lo usan el servidor
// (api/_lib/video.js), la pantalla (video-ui.js) y las pruebas.
//   videos  kit--<marca>  el kit: subtítulos, colores, transiciones, ritmo, intro y outro, música, safe zones, encuadre
//           <id>          una ficha: { profile, titulo, formato, duracion, estado, assets, cortes, transicion, musica, notas, post, archivado }
// El OS no edita el video: arma el pedido para ⑦ Video Editing, que el editor corre en su compu (ve-armado, ve-marca).
export const COLL_V = 'videos';
export const idKit = (slug) => `kit--${slug}`;
export const ESTADOS_V = ['Por editar', 'En edición', 'En revisión', 'Listo'];
export const FORMATOS_V = [['9:16', 'Vertical 9:16 · Reel, TikTok, Short'], ['4:5', 'Feed 4:5'], ['1:1', 'Cuadrado 1:1'], ['16:9', 'Horizontal 16:9 · YouTube']];
export const TRANSICIONES = ['Corte seco', 'Jump cut', 'Fundido', 'Fundido a negro', 'Zoom', 'Barrido', 'Match cut'];
export const POSICIONES = [['abajo', 'Abajo'], ['centro', 'Centro'], ['arriba', 'Arriba']];

const txt = (v, n = 300) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const largo = (v, n = 2000) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, n);
const hex = (v) => (/^#[0-9a-f]{6}$/i.test(String(v || '').trim()) ? String(v).trim().toUpperCase() : '');
const num = (v, min, max) => { if (v === '' || v === null || v === undefined) return null; const n = +v; return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 10) / 10)) : null; };
const https = (v) => (/^https:\/\/[^\s"'<>]+$/.test(String(v || '').trim()) ? String(v).trim().slice(0, 600) : '');
// Un tiempo «0:12», «12» o «1:05.5» → segundos.
export const seg = (v) => { const s = String(v ?? '').trim(); if (!s) return null; const p = s.split(':').map(Number); if (p.some((x) => !Number.isFinite(x))) return null; return p.length === 2 ? p[0] * 60 + p[1] : p[0]; };
export const reloj = (s) => { if (s == null) return ''; const r = Math.round((s % 60) * 10) / 10; return `${Math.floor(s / 60)}:${r < 10 ? '0' : ''}${r}`; };

export function limpiarKit(k = {}) {
  const s = k.subtitulos || {}, sf = k.safe || {};
  return {
    subtitulos: { fuente: txt(s.fuente, 60), tamano: num(s.tamano, 16, 160) ?? 56, color: hex(s.color) || '#FFFFFF', fondo: hex(s.fondo), posicion: POSICIONES.some(([p]) => p === s.posicion) ? s.posicion : 'abajo', mayusculas: Boolean(s.mayusculas), nota: txt(s.nota, 300) },
    colores: (Array.isArray(k.colores) ? k.colores : []).map(hex).filter(Boolean).slice(0, 8),
    transiciones: (Array.isArray(k.transiciones) ? k.transiciones : []).map((t) => txt(t, 40)).filter(Boolean).slice(0, 10),
    ritmo: txt(k.ritmo, 300), animacion: txt(k.animacion, 300), intro: txt(k.intro, 300), outro: txt(k.outro, 300), musica: txt(k.musica, 300),
    safe: { arriba: num(sf.arriba, 0, 40) ?? 14, abajo: num(sf.abajo, 0, 40) ?? 20, lados: num(sf.lados, 0, 30) ?? 6 }, // % del cuadro
    encuadre: txt(k.encuadre, 500), prohibido: txt(k.prohibido, 500),
  };
}

// Lo que el kit puede llenar solo desde el design system de la marca (sistema-visual.md leído con leerSistema).
// Movimiento trae ritmo, subtítulos, cierre y cómo entra el texto; Composición, la safe zone. Nada se inventa.
export function kitDesdeSistema(sis) {
  if (!sis) return limpiarKit({});
  const filas = (rs) => (rs || []).flatMap((r) => (r.kv ? r.rows : [])).map(([k, v]) => [String(k || '').replace(/\*/g, '').trim(), String(v || '').replace(/\*/g, '').trim()]);
  const mov = filas(sis.movimiento), comp = filas(sis.composicion);
  const de = (rows, re) => rows.find(([k]) => re.test(k))?.[1] || '';
  const sub = de(mov, /subt[ií]tulo/i);
  // La fuente de los subtítulos: la familia del sistema que nombra la fila, o lo que dice antes de la coma sin el peso.
  const familias = (sis.tipo?.familias || []).map((f) => f.nombre).filter(Boolean).sort((a, b) => b.length - a.length);
  const fuente = familias.find((n) => sub.toLowerCase().includes(n.toLowerCase())) || sub.split(',')[0].replace(/\b(regular|bold|medium|light|semibold|black|italic|\d{3})\b/gi, '').trim() || familias[familias.length - 1] || '';
  const tam = /(\d{2,3})\s*px/i.exec(sub)?.[1];
  return limpiarKit({
    subtitulos: { fuente, tamano: tam ? +tam : null, color: /blanco/i.test(sub) ? '#FFFFFF' : '', posicion: /centrad|centro/i.test(sub) && !/abajo/i.test(sub) ? 'centro' : 'abajo', nota: sub },
    colores: (sis.colores || []).map((c) => c.hex),
    transiciones: [de(mov, /transici/i)].filter(Boolean), animacion: de(mov, /entra el texto|animaci/i),
    ritmo: de(mov, /ritmo/i), intro: de(mov, /intro|apertura|arranque/i), outro: de(mov, /cierre|outro|final/i), musica: de(mov, /m[uú]sica|audio/i),
    encuadre: de(comp, /safe|encuadre|m[aá]rgen/i), prohibido: (sis.prohibido || []).slice(0, 5).join(' · '),
  });
}

export function limpiarFicha(f = {}) {
  return {
    titulo: txt(f.titulo, 140),
    formato: FORMATOS_V.some(([k]) => k === f.formato) ? f.formato : '9:16',
    duracion: num(f.duracion, 1, 3600),
    estado: ESTADOS_V.includes(f.estado) ? f.estado : 'Por editar',
    assets: (Array.isArray(f.assets) ? f.assets : []).map((a) => ({ nombre: txt(a?.nombre, 120), url: https(a?.url) })).filter((a) => a.nombre || a.url).slice(0, 40),
    cortes: (Array.isArray(f.cortes) ? f.cortes : []).map((c) => ({ desde: num(seg(c?.desde) ?? c?.desde, 0, 3600), hasta: num(seg(c?.hasta) ?? c?.hasta, 0, 3600), toma: txt(c?.toma, 200), texto: txt(c?.texto, 200), nota: txt(c?.nota, 200) }))
      .filter((c) => c.toma || c.texto || c.nota || c.desde != null).slice(0, 80),
    transicion: txt(f.transicion, 40), musica: txt(f.musica, 300), notas: largo(f.notas, 2000),
    post: idRef(f.post),
    // Post-Production: la capa del pipeline, las versiones (solo se agregan), las escenas, el checklist QA y de qué master sale.
    capa: CAPAS.some(([k]) => k === f.capa) ? f.capa : 'recepcion',
    versiones: limpiarVersiones(f.versiones),
    version: Math.max(1, Math.round(+f.version || 1), ...limpiarVersiones(f.versiones).map((x) => x.v)),
    escenas: (Array.isArray(f.escenas) ? f.escenas : []).map((c) => ({ id: txt(c?.id, 30), desde: num(seg(c?.desde) ?? c?.desde, 0, 3600), hasta: num(seg(c?.hasta) ?? c?.hasta, 0, 3600), toma: txt(c?.toma, 200), texto: txt(c?.texto, 200) }))
      .filter((c) => c.id || c.toma || c.texto || c.desde != null).slice(0, 80),
    qa: limpiarQA(f.qa),
    derivada_de: idRef(f.derivada_de),
  };
}

// ---------- Post-Production: capas, versiones, QA y revisión (puro) ----------
const idRef = (v) => (/^[\w-]{1,120}$/.test(String(v || '')) ? String(v) : '');
export const CAPAS = [['recepcion', 'Recepción'], ['armado', 'Armado'], ['marca-qa', 'Marca y QA'], ['derivadas', 'Derivadas'], ['export', 'Export']];
export const QA_ITEMS = [['formato', 'Formato y resolución correctos'], ['duracion', 'Duración dentro de lo pedido'], ['safe_zones', 'Texto dentro de las safe zones'], ['audio', 'Audio limpio y a buen nivel'], ['sin_marca_agua', 'Sin marca de agua ni logos ajenos']];
export const REVISION = ['', 'Pendiente', 'Cambios', 'Aprobado'];

export function limpiarQA(q = {}) {
  const o = {}; for (const [k] of QA_ITEMS) o[k] = q?.[k] === true;
  return { ...o, motivo: txt(q?.motivo, 300) };
}
// Qué casillas del QA siguen sin marcarse (por su nombre).
export const qaFaltas = (qa) => QA_ITEMS.filter(([k]) => !qa?.[k]).map(([, l]) => l);
// «Enviar a revisión» pide el QA completo o un motivo por escrito. '' = puede.
export function puedeEnviar(f) {
  const qa = limpiarQA(f?.qa), n = qaFaltas(qa).length;
  return n && !qa.motivo ? `Falta el QA (${n} de ${QA_ITEMS.length} casillas): márcalas o escribe el motivo de enviarlo así` : '';
}
export function limpiarVersiones(vs) {
  const vistas = new Set();
  return (Array.isArray(vs) ? vs : []).map((x) => ({ v: Math.round(+x?.v), link: https(x?.link), nota: txt(x?.nota, 300), por: txt(x?.por, 40), en: /^\d{4}-\d\d-\d\d/.test(String(x?.en || '')) ? String(x.en).slice(0, 30) : '', capa: CAPAS.some(([k]) => k === x?.capa) ? x.capa : '' }))
    .filter((x) => x.v >= 1 && x.v <= 999 && !vistas.has(x.v) && vistas.add(x.v)).sort((a, z) => a.v - z.v).slice(0, 60);
}
// Las versiones se agregan, nunca se pisan: las que ya estaban se quedan tal cual y solo entran las que traen un número nuevo.
export function fusionarVersiones(actuales, nuevas) {
  const ya = limpiarVersiones(actuales), tengo = new Set(ya.map((x) => x.v));
  return limpiarVersiones([...ya, ...limpiarVersiones(nuevas).filter((x) => !tengo.has(x.v))]);
}
export const siguienteVersion = (f) => { const vs = limpiarVersiones(f?.versiones); return vs.length ? Math.max(...vs.map((x) => x.v)) + 1 : 1; };

export function limpiarComentario(c = {}) {
  return { id: txt(c.id, 40), seg: num(seg(c.seg) ?? c.seg, 0, 36000), texto: txt(c.texto, 1000), interno: c.interno === true, por: txt(c.por, 40), en: txt(c.en, 30), version: Math.round(+c.version) || 1 };
}
export const limpiarComentarios = (cs) => (Array.isArray(cs) ? cs : []).map(limpiarComentario).filter((c) => c.texto).slice(-300);
// El cliente solo ve los comentarios que no son internos.
export const comentariosVisibles = (f, cliente) => limpiarComentarios(f?.comentarios).filter((c) => !cliente || !c.interno);

// Aprobar o pedir cambios sobre una versión: devuelve { error, status } o { patch } (lo que cambia en la ficha).
// Pedir cambios exige una nota o al menos un comentario de esa versión; aprobar solo vale sobre la versión vigente.
export function decidirRevision(f, { accion, version, nota } = {}, quien = {}) {
  if (accion !== 'aprobar' && accion !== 'cambios') return { status: 400, error: 'La acción es «aprobar» o «cambios»' };
  if (f.estado !== 'En revisión' && f.revision !== 'Pendiente') return { status: 400, error: 'Este video todavía no está en revisión' };
  const vigente = Math.max(+f.version || 1, ...limpiarVersiones(f.versiones).map((x) => x.v)), v = Math.round(+version || vigente);
  const n = txt(nota, 1000), en = quien.en || new Date().toISOString();
  if (accion === 'cambios') {
    if (!n && !limpiarComentarios(f.comentarios).some((c) => c.version === v)) return { status: 400, error: 'Para pedir cambios deja una nota o un comentario' };
    return { patch: { revision: 'Cambios', estado: 'En edición', aprobacion: null, revision_nota: n } };
  }
  if (v !== vigente) return { status: 409, error: `Esa es la v${v}; la vigente es la v${vigente}` };
  return { patch: { revision: 'Aprobado', estado: 'Listo', aprobacion: { v, por: txt(quien.por, 40), en }, revision_nota: n } };
}

// El tablero: las fichas vivas agrupadas por capa, y de cada una el QA marcado y las versiones.
export function tablero(fichas = []) {
  const vivas = fichas.filter((f) => !f.archivado), por = Object.fromEntries(CAPAS.map(([k]) => [k, []]));
  for (const f of vivas) (por[f.capa] || por.recepcion).push(f);
  return CAPAS.map(([k, label]) => ({ k, label, fichas: por[k] }));
}
export const qaHechas = (qa) => QA_ITEMS.filter(([k]) => qa?.[k]).length;

// Cuánto dura lo que hay en la línea de tiempo (el último «hasta», o la suma de los cortes).
export function duracionCortes(cortes = []) {
  const fin = Math.max(0, ...cortes.map((c) => c.hasta ?? 0));
  return fin || cortes.reduce((a, c) => a + (c.hasta != null && c.desde != null ? Math.max(0, c.hasta - c.desde) : 0), 0);
}

// El pedido para ⑦ Video Editing: la ficha + el kit de la marca, listo para correr en Claude Code.
export function pedidoVideo(f, kit, marca, carpeta) {
  const k = kit || limpiarKit({}), s = k.subtitulos;
  const lineaCorte = (c, i) => `${i + 1}. ${reloj(c.desde)}–${reloj(c.hasta)} · ${c.toma || 'toma sin nombre'}${c.texto ? ` · texto en pantalla: «${c.texto}»` : ''}${c.nota ? ` · ${c.nota}` : ''}`;
  return [
    `/video-editing Arma el video «${f.titulo || 'sin título'}» de ${marca} con su kit de edición. Sigue el WORKFLOW de ⑦ Video Editing (ve-armado → ve-marca → ve-export).`,
    '',
    `## La ficha`,
    `- Formato: ${f.formato}${f.duracion ? ` · duración objetivo ${f.duracion} s` : ''}`,
    f.musica ? `- Música: ${f.musica}` : null,
    f.transicion ? `- Transición de este video: ${f.transicion}` : null,
    f.notas ? `- Notas: ${f.notas}` : null,
    '',
    `## Los cortes, en orden`,
    ...(f.cortes?.length ? f.cortes.map(lineaCorte) : ['(sin cortes todavía: propónlos tú desde el guion y los assets)']),
    '',
    `## Los assets`,
    ...(f.assets?.length ? f.assets.map((a) => `- ${a.nombre || 'asset'}${a.url ? `: ${a.url}` : ''}`) : ['(sin assets: pídelos a ⑤ Producción)']),
    '',
    `## El kit de la marca (no se negocia)`,
    `- Subtítulos: ${[s.fuente, s.tamano ? `${s.tamano} px` : '', s.color, s.fondo ? `fondo ${s.fondo}` : '', s.posicion, s.mayusculas ? 'en mayúsculas' : ''].filter(Boolean).join(' · ')}${s.nota ? ` (${s.nota})` : ''}`,
    k.colores.length ? `- Colores: ${k.colores.join(' · ')}` : null,
    k.transiciones.length ? `- Transiciones permitidas: ${k.transiciones.join(' · ')}` : null,
    k.animacion ? `- Cómo entra el texto: ${k.animacion}` : null,
    k.ritmo ? `- Ritmo: ${k.ritmo}` : null, k.intro ? `- Intro: ${k.intro}` : null, k.outro ? `- Cierre: ${k.outro}` : null, k.musica ? `- Música y voz: ${k.musica}` : null,
    `- Safe zones: ${k.safe.arriba}% arriba · ${k.safe.abajo}% abajo · ${k.safe.lados}% a los lados${k.encuadre ? ` · ${k.encuadre}` : ''}`,
    k.prohibido ? `- Prohibido: ${k.prohibido}` : null,
    '',
    `El design system completo está en ${carpeta}/02-marca/sistema-visual.md. Al terminar, sube el corte a revisión y pasa la ficha a «En revisión» en Inherent OS (Marca › Video).`,
  ].filter((l) => l !== null).join('\n');
}
