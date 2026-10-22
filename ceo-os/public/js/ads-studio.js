// App 01 · Marca › Publicar › Ads: de una pieza que funcionó (o de un guion) salen variaciones por avatar, listas para pautar
// en Meta y en Google. Puro (sin DOM): lo usan el servidor (api/_lib/ads-studio.js), la pantalla (ads-ui.js) y las pruebas.
//   ad_variants { profile, madre: { tipo, id, titulo }, avatar: { id, nombre }, plataforma, formato,
//                 title (el gancho), caption (el texto principal), meta: { titulo, cta }, google: { titulos, descripciones },
//                 estado, aprobada: { por, en }, lanzar: { tarea, presupuesto, por, en }, lanzada: { campana, en }, nota, archivado }
// Pautar gasta dinero del cliente: solo el CEO aprueba y «Lanzar» crea la tarea para ⑩ Ads, que lanza con su gate de siempre.
export const COLL_A = 'ad_variants';
export const ESTADOS_A = ['Borrador', 'Aprobada', 'Lanzada', 'Ganadora', 'Quemada'];
export const ESTADO_AYUDA = { Borrador: 'Se puede cambiar. Falta tu OK.', Aprobada: 'Tiene tu OK: lista para lanzar.', Lanzada: 'Corriendo en la plataforma.', Ganadora: 'Rindió: vuelve a Investigación como contenido ganador.', Quemada: 'Se cansó o no rindió.' };
export const PLATAFORMAS = [['meta', 'Meta'], ['google', 'Google']];
export const FORMATOS_A = { meta: ['9:16', '4:5', '1:1'], google: ['Búsqueda', '1.91:1', '1:1'] };
export const CTAS = ['Más información', 'Enviar mensaje', 'Reservar', 'Comprar', 'Registrarte', 'Contactarnos', 'Ver menú', 'Cotizar'];
// Los límites de cada plataforma: Google los exige; en Meta son lo que se ve completo sin «Ver más».
export const LIMITES = { google: { titulos: 15, titulo: 30, descripciones: 4, descripcion: 90 }, meta: { texto: 125, titulo: 40 } };

const txt = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const largo = (v, n) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, n);
const idOk = (v) => (/^[\w.-]{1,120}$/.test(String(v || '')) ? String(v) : '');

export function limpiarVariante(v = {}) {
  const plataforma = PLATAFORMAS.some(([k]) => k === v.plataforma) ? v.plataforma : 'meta';
  const lista = (a, n, max) => (Array.isArray(a) ? a : String(a || '').split('\n')).map((x) => txt(x, max)).filter(Boolean).slice(0, n);
  const L = LIMITES.google;
  return {
    madre: { tipo: ['pieza', 'guion', 'libre'].includes(v.madre?.tipo) ? v.madre.tipo : 'libre', id: idOk(v.madre?.id), titulo: txt(v.madre?.titulo, 160) },
    avatar: { id: idOk(v.avatar?.id), nombre: txt(v.avatar?.nombre, 80) },
    plataforma,
    formato: FORMATOS_A[plataforma].includes(v.formato) ? v.formato : FORMATOS_A[plataforma][0],
    title: txt(v.title ?? v.gancho, 200),
    caption: largo(v.caption ?? v.texto, 2000),
    meta: plataforma === 'meta' ? { titulo: txt(v.meta?.titulo, 120), cta: CTAS.includes(v.meta?.cta) ? v.meta.cta : 'Más información' } : null,
    // En Google se guarda lo que llegó, aunque se pase del límite: la pantalla lo marca en rojo y no deja aprobarlo así.
    google: plataforma === 'google' ? { titulos: lista(v.google?.titulos, L.titulos, 90), descripciones: lista(v.google?.descripciones, L.descripciones, 180) } : null,
    nota: txt(v.nota, 400),
  };
}

// Lo que impide aprobar una variación (vacío = se puede).
export function faltas(v) {
  const f = [];
  if (!v.title) f.push('Le falta el gancho');
  if (v.plataforma === 'meta' && !v.caption) f.push('Le falta el texto principal');
  if (v.plataforma === 'google') {
    const L = LIMITES.google, g = v.google || { titulos: [], descripciones: [] };
    if (g.titulos.length < 3) f.push('Google pide al menos 3 títulos');
    if (g.descripciones.length < 2) f.push('Google pide al menos 2 descripciones');
    const t = g.titulos.filter((x) => x.length > L.titulo).length, d = g.descripciones.filter((x) => x.length > L.descripcion).length;
    if (t) f.push(`${t} título${t === 1 ? '' : 's'} pasa${t === 1 ? '' : 'n'} de ${L.titulo} caracteres`);
    if (d) f.push(`${d} descripción${d === 1 ? '' : 'es'} pasa${d === 1 ? '' : 'n'} de ${L.descripcion} caracteres`);
  }
  return f;
}

// Los cambios de estado permitidos y quién los hace. ceo: solo el CEO · equipo: quien edita Contenido.
const PASOS = { 'Borrador>Aprobada': 'ceo', 'Aprobada>Borrador': 'ceo', 'Aprobada>Lanzada': 'equipo', 'Lanzada>Ganadora': 'equipo', 'Lanzada>Quemada': 'equipo', 'Ganadora>Quemada': 'equipo', 'Quemada>Ganadora': 'equipo' };
export const pasoPermitido = (de, a) => PASOS[`${de}>${a}`] || null;
export const siguientes = (estado) => Object.keys(PASOS).filter((k) => k.startsWith(estado + '>')).map((k) => k.split('>')[1]);

// El pedido de variaciones para Claude (por el puente de la compu o pegado en Claude Code). Responde con un bloque ```variaciones```.
export function promptVariaciones({ marca, carpeta, madre, avatares = [], plataformas = ['meta', 'google'], n = 3 }) {
  const av = avatares.length ? avatares.map((a) => `- ${a.nombre}${a.resumen ? `: ${a.resumen}` : ''}`).join('\n') : '- (sin avatares aprobados: escribe para el cliente ideal del brief)';
  return [
    `Eres ⑩ Ads con la skill ad-creativos. Escribe variaciones de anuncio para ${marca} a partir de esta pieza madre.`,
    `Lee primero la voz de la marca en ${carpeta}/02-marca/ (voz, territorio y lo prohibido) y el brief más reciente en ${carpeta}/04-contenido/. Solo lee: no escribas archivos.`,
    '',
    `## La pieza madre (${madre.tipo === 'guion' ? 'un guion' : madre.tipo === 'pieza' ? 'una pieza que funcionó' : 'lo que pidió el equipo'})`,
    `${madre.titulo || ''}`,
    madre.texto ? `\n${madre.texto}` : '',
    '',
    '## Los avatares (una variación por avatar y plataforma: sus señales, dichas y mostradas, para que la IA de la plataforma la lleve a esa persona)',
    av,
    '',
    `## Qué entregas: ${n} variaciones por avatar en ${plataformas.map((p) => (p === 'meta' ? 'Meta' : 'Google')).join(' y ')}`,
    `- Meta: «gancho» (la primera línea o los primeros 3 s del video), «texto» (máximo ${LIMITES.meta.texto} caracteres), «titulo» (máximo ${LIMITES.meta.titulo}), «cta» (una de: ${CTAS.join(', ')}), «formato» (9:16, 4:5 o 1:1).`,
    `- Google (búsqueda): «gancho», «titulos» (de 3 a ${LIMITES.google.titulos}, cada uno de máximo ${LIMITES.google.titulo} caracteres) y «descripciones» (de 2 a ${LIMITES.google.descripciones}, máximo ${LIMITES.google.descripcion}). Cuenta los caracteres.`,
    '- Nada que la marca no pueda probar: si un claim no está en la investigación o en el brief, no va.',
    '',
    'Contesta con una línea de resumen y después SOLO este bloque (JSON válido):',
    '```variaciones',
    '[{ "avatar": "nombre del avatar", "plataforma": "meta", "formato": "9:16", "gancho": "…", "texto": "…", "titulo": "…", "cta": "Más información" },',
    ' { "avatar": "nombre del avatar", "plataforma": "google", "formato": "Búsqueda", "gancho": "…", "titulos": ["…"], "descripciones": ["…"] }]',
    '```',
  ].filter((l) => l !== null).join('\n');
}

// Lee lo que contestó Claude: el bloque ```variaciones``` (o el primer arreglo JSON que encuentre).
export function leerVariaciones(texto, avatares = []) {
  const s = String(texto || '');
  const bloque = /```(?:variaciones|json)?\s*(\[[\s\S]*?\])\s*```/.exec(s)?.[1] || /\[[\s\S]*\]/.exec(s)?.[0];
  if (!bloque) return [];
  let arr; try { arr = JSON.parse(bloque); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  const av = (nombre) => avatares.find((a) => String(a.nombre || '').toLowerCase() === String(nombre || '').toLowerCase().trim());
  return arr.slice(0, 40).map((x) => {
    const a = av(x?.avatar);
    return limpiarVariante({ plataforma: x?.plataforma, formato: x?.formato, gancho: x?.gancho, texto: x?.texto,
      meta: { titulo: x?.titulo, cta: x?.cta }, google: { titulos: x?.titulos, descripciones: x?.descripciones },
      avatar: { id: a?.id || '', nombre: a?.nombre || x?.avatar || '' } });
  }).filter((v) => v.title);
}

// La tarea para ⑩ Ads cuando el CEO lanza: lo aprobado, el presupuesto y el gate ya dado. ⑩ lanza con ad-lanzamiento.
export function tareaLanzar({ marca, variantes, presupuesto, fechas, por, en }) {
  const lineas = variantes.map((v, i) => `${i + 1}. [${v.plataforma === 'meta' ? 'Meta' : 'Google'} · ${v.formato}${v.avatar?.nombre ? ` · ${v.avatar.nombre}` : ''}] ${v.title}`);
  return {
    title: `Lanzar pauta de ${marca}: ${variantes.length} variaci${variantes.length === 1 ? 'ón' : 'ones'} aprobada${variantes.length === 1 ? '' : 's'}`,
    description: [
      `El CEO aprobó estas variaciones y el presupuesto (GATE 1 de ⑩ Ads) el ${String(en).slice(0, 10)}.`,
      `Presupuesto: ${presupuesto}${fechas ? ` · Fechas: ${fechas}` : ''}`,
      '',
      ...lineas,
      '',
      'Lánzalas con /ads (capa ad-lanzamiento): revisa tracking, presupuesto diario y destino antes de lanzar. Cualquier cambio de presupuesto vuelve al CEO.',
      'Al lanzar, marca cada variación como «Lanzada» en Inherent OS (Marca › Ads) con el link de la campaña.',
      `Aprobado por ${por}.`,
    ].join('\n'),
  };
}
