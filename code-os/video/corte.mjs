// El «corte»: el proyecto de video como JSON de escenas. Lo escribe el agente (primer corte),
// lo corrige el humano en Retoque y lo renderiza ffmpeg. Un solo formato para los tres.
//
// El «corte» es el VIDEO: { id, titulo, formato, version, marca, imita, musica, subtitulos, notas, escenas[] }
// {
//   id, titulo, formato: '9:16'|'1:1'|'16:9', version,
//   musica: { ruta, volumen: 0.25, inicio: 0 } | null,      // de todo el video
//   subtitulos: 'ruta.srt' | null,
//   origen: { agente, shotlist, faltantes },
//   escenas: [{
//     id, clip, inicio, fin, nota,                            // clip = ruta del video; inicio/fin en segundos del clip
//     referencia,                                             // qué escena de la referencia imita (si se usó «Imitar este»)
//     texto, fuente,                                          // atajo: texto principal y su tipografía (= capa 'principal')
//     capas: [                                                // encima del video, de abajo hacia arriba
//       { id, tipo: 'texto',  texto, fuente, x, y, tam, color, caja, visible },  // x/y = centro (0..1), tam = alto relativo, caja = #hex|null
//       { id, tipo: 'imagen', ruta, x, y, escala, visible },                // escala = ancho relativo al cuadro
//     ],
//     estilos: [                                              // la receta de la escena: lo que se le aplica
//       { tipo: 'zoom', desde: 1, hasta: 1.15, x: 0.5, y: 0.5 },
//       { tipo: 'color', preset: 'calido'|'frio'|'bn'|'contraste' },
//       { tipo: 'transicion', entrada: 'corte'|'fundido', duracion: 0.4 },
//       { tipo: 'animacion-texto', capa: 'principal', animacion: 'aparecer'|'subir' },
//       { tipo: 'animacion-capa', capa: '<id imagen>', animacion: 'aparecer'|'subir'|'flotar'|'abanico', angulo: 0, retraso: 0 },
//       { tipo: 'detras-de-persona', capa: '<id de una capa>', mascara: 'ruta de la máscara' | null },
//     ],
//   }]
// }

export const FORMATOS = {
  '9:16': { ancho: 1080, alto: 1920 },
  '1:1': { ancho: 1080, alto: 1080 },
  '16:9': { ancho: 1920, alto: 1080 },
};
export const COLORES = { calido: 'Cálido', frio: 'Frío', bn: 'Blanco y negro', contraste: 'Contraste' };
export const TIPOS_ESTILO = ['zoom', 'color', 'transicion', 'animacion-texto', 'animacion-capa', 'detras-de-persona'];
export const ANIM_CAPA = { aparecer: 'aparece', subir: 'sube', flotar: 'flota', abanico: 'sube en abanico' };
const REPETIBLES = new Set(['animacion-texto', 'animacion-capa']);
const esColor = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const entre = (v, a, b) => Math.min(b, Math.max(a, v));
let n = 0;
const nuevoId = (p) => `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

export class ErrorCorte extends Error {}

function normalizarCapa(c, i, esc) {
  if (!c || !['texto', 'imagen'].includes(c.tipo)) throw new ErrorCorte(`escena ${esc}: capa ${i + 1} con tipo inválido (${c?.tipo}); usa texto o imagen`);
  const comun = { id: c.id ?? nuevoId(c.tipo[0]), tipo: c.tipo, x: entre(num(c.x, 0.5), 0, 1), y: entre(num(c.y, c.tipo === 'texto' ? 0.8 : 0.3), 0, 1), visible: c.visible !== false };
  if (c.tipo === 'texto') {
    return { ...comun, texto: String(c.texto ?? ''), fuente: c.fuente ?? null, tam: entre(num(c.tam, 0.06), 0.015, 0.25), color: esColor(c.color) ? c.color : '#f3ead8',
      caja: esColor(c.caja) ? c.caja : null }; // caja = fondo sólido detrás del texto (subtítulo en caja)
  }
  if (typeof c.ruta !== 'string' || !c.ruta) throw new ErrorCorte(`escena ${esc}: la capa de imagen ${c.id ?? i + 1} necesita ruta`);
  return { ...comun, ruta: c.ruta, escala: entre(num(c.escala, 0.5), 0.05, 3) };
}

function normalizarEstilo(s, esc, capas) {
  if (!s || !TIPOS_ESTILO.includes(s.tipo)) throw new ErrorCorte(`escena ${esc}: estilo desconocido (${s?.tipo}); usa ${TIPOS_ESTILO.join(', ')}`);
  switch (s.tipo) {
    case 'zoom': {
      const desde = entre(num(s.desde, 1), 1, 4);
      return { tipo: 'zoom', desde, hasta: entre(num(s.hasta, desde), 1, 4), x: entre(num(s.x, 0.5), 0, 1), y: entre(num(s.y, 0.5), 0, 1) };
    }
    case 'color':
      if (!COLORES[s.preset]) throw new ErrorCorte(`escena ${esc}: color «${s.preset}» no existe (${Object.keys(COLORES).join(', ')})`);
      return { tipo: 'color', preset: s.preset };
    case 'transicion':
      return { tipo: 'transicion', entrada: s.entrada === 'fundido' ? 'fundido' : 'corte', duracion: entre(num(s.duracion, 0.4), 0.1, 2) };
    case 'animacion-texto':
      return { tipo: 'animacion-texto', capa: s.capa ?? 'principal', animacion: s.animacion === 'subir' ? 'subir' : 'aparecer' };
    case 'animacion-capa': {
      const c = capas.find((x) => x.id === s.capa);
      if (!c || c.tipo !== 'imagen') throw new ErrorCorte(`escena ${esc}: animacion-capa apunta a ${s.capa}, que no es una capa de imagen`);
      if (!ANIM_CAPA[s.animacion]) throw new ErrorCorte(`escena ${esc}: animación «${s.animacion}» no existe (${Object.keys(ANIM_CAPA).join(', ')})`);
      return { tipo: 'animacion-capa', capa: s.capa, animacion: s.animacion, angulo: entre(num(s.angulo, 0), -45, 45), retraso: entre(num(s.retraso, 0), 0, 3) };
    }
    case 'detras-de-persona':
      if (!capas.some((c) => c.id === s.capa)) throw new ErrorCorte(`escena ${esc}: «detrás de la persona» apunta a la capa ${s.capa}, que no existe`);
      return { tipo: 'detras-de-persona', capa: s.capa, mascara: typeof s.mascara === 'string' && s.mascara ? s.mascara : null };
  }
}

function normalizarEscena(e, i) {
  const esc = i + 1;
  if (!e || typeof e.clip !== 'string' || !e.clip) throw new ErrorCorte(`escena ${esc}: falta clip (la ruta del video)`);
  const inicio = Math.max(0, num(e.inicio, 0));
  const fin = num(e.fin, NaN);
  if (!(fin > inicio)) throw new ErrorCorte(`escena ${esc}: fin (${e.fin}) debe ser mayor que inicio (${inicio})`);
  const capas = (e.capas ?? []).map((c, j) => normalizarCapa(c, j, esc));
  if (capas.filter((c) => c.id).length !== new Set(capas.map((c) => c.id)).size) throw new ErrorCorte(`escena ${esc}: hay capas con el mismo id`);
  // atajo texto/fuente ⇄ capa 'principal': si vienen, mandan (así el agente cambia el texto sin tocar capas)
  let principal = capas.find((c) => c.id === 'principal');
  if (!principal && typeof e.texto === 'string' && e.texto.trim()) {
    principal = normalizarCapa({ id: 'principal', tipo: 'texto', texto: e.texto, fuente: e.fuente ?? null }, capas.length, esc);
    capas.push(principal);
  } else if (principal?.tipo === 'texto') {
    if (typeof e.texto === 'string') principal.texto = e.texto;
    if (e.fuente !== undefined) principal.fuente = e.fuente;
  }
  const estilos = (e.estilos ?? []).map((s) => normalizarEstilo(s, esc, capas));
  for (const t of TIPOS_ESTILO) if (estilos.filter((s) => s.tipo === t).length > 1 && !REPETIBLES.has(t)) throw new ErrorCorte(`escena ${esc}: el estilo ${t} está repetido`);
  return {
    id: e.id ?? nuevoId('e'), clip: e.clip, inicio, fin, nota: e.nota ?? '',
    referencia: typeof e.referencia === 'string' && e.referencia ? e.referencia : null, // la escena de la referencia que imita
    estilo: typeof e.estilo === 'string' && e.estilo ? e.estilo : null, // la receta del catálogo que se le aplicó
    texto: principal?.texto ?? null, fuente: principal?.fuente ?? null,
    capas: capas.filter((c) => c.tipo !== 'texto' || c.texto.trim()),
    estilos,
  };
}

/** Valida y completa un corte. Lanza ErrorCorte con un mensaje que entiende el agente o el humano. */
export function normalizarCorte(c) {
  if (!c || typeof c !== 'object') throw new ErrorCorte('el corte debe ser un objeto');
  const formato = c.formato ?? '9:16';
  if (!FORMATOS[formato]) throw new ErrorCorte(`formato inválido: ${formato} (usa ${Object.keys(FORMATOS).join(', ')})`);
  if (!Array.isArray(c.escenas) || c.escenas.length === 0) throw new ErrorCorte('el corte necesita al menos una escena');
  const escenas = c.escenas.map(normalizarEscena);
  if (new Set(escenas.map((e) => e.id)).size !== escenas.length) throw new ErrorCorte('hay escenas con el mismo id');
  const m = c.musica;
  return {
    id: c.id ?? nuevoId('c'),
    titulo: c.titulo ?? 'Corte sin título',
    formato,
    version: num(c.version, 1),
    musica: m && m.ruta ? { ruta: m.ruta, volumen: entre(num(m.volumen, 0.25), 0, 1), inicio: Math.max(0, num(m.inicio, 0)), ducking: !!m.ducking } : null,
    subtitulos: typeof c.subtitulos === 'string' && c.subtitulos ? c.subtitulos : null,
    estilo: typeof c.estilo === 'string' && c.estilo ? c.estilo : null, // el estilo del catálogo que se aplicó
    marca: typeof c.marca === 'string' && c.marca ? c.marca : null, // su style menu manda en tipografías, colores, música y lo permitido
    imita: typeof c.imita === 'string' && c.imita ? c.imita : null, // id de la referencia que imita
    notas: (Array.isArray(c.notas) ? c.notas : []).filter((x) => x && String(x.texto ?? '').trim()).map((x) => ({ t: Math.max(0, num(x.t, 0)), texto: String(x.texto).slice(0, 500) })), // notas con marca de tiempo para el agente
    origen: c.origen ?? null,
    escenas,
  };
}

export const duracionCorte = (c) => c.escenas.reduce((s, e) => s + (e.fin - e.inicio), 0);
export const estilo = (e, tipo) => e.estilos.find((s) => s.tipo === tipo) ?? null;

/** Lo que se le aplica a una escena, en palabras: lo que muestra la tarjeta del tablero. */
export function receta(e, corte) {
  const r = [];
  for (const s of e.estilos) {
    if (s.tipo === 'zoom') r.push(s.desde === s.hasta ? `Zoom fijo ${Math.round(s.desde * 100)}%` : `Zoom ${s.hasta > s.desde ? 'acercando' : 'alejando'} ${Math.round(s.desde * 100)}→${Math.round(s.hasta * 100)}%`);
    if (s.tipo === 'color') r.push(`Color: ${COLORES[s.preset]}`);
    if (s.tipo === 'transicion') r.push(s.entrada === 'fundido' ? `Entra con fundido ${s.duracion}s` : 'Entra con corte');
    if (s.tipo === 'animacion-texto') r.push(`Texto ${s.animacion === 'subir' ? 'sube' : 'aparece'}`);
    if (s.tipo === 'animacion-capa') r.push(`${s.capa} ${ANIM_CAPA[s.animacion]}${s.retraso ? ` (a los ${s.retraso}s)` : ''}`);
    if (s.tipo === 'detras-de-persona') r.push(`Animación detrás de la persona${s.mascara ? '' : ' (falta máscara)'}`);
  }
  for (const c of e.capas) {
    if (c.tipo === 'texto') r.push(`Texto «${c.texto.length > 28 ? c.texto.slice(0, 27) + '…' : c.texto}»${c.caja ? ' en caja' : ''}${c.fuente ? ` · ${c.fuente}` : ''}${c.visible ? '' : ' (oculto)'}`);
    else r.push(`Imagen ${c.ruta.split('/').pop()}${c.visible ? '' : ' (oculta)'}`);
  }
  if (corte?.musica) r.push(`Música: ${corte.musica.ruta.split('/').pop()} (todo el video)`);
  return r;
}
