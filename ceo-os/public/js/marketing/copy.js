// Copywriting Studio (herramienta copywriting-studio de Marketing): el marco de mensajes (consciencia × anillo/avatar: mensaje, prueba,
// objeción) y el tablero de N variantes por activo, con el contador contra el límite del canal. Se guarda como un entregable
// (contenido = { marco, activos }). Existe para que el marco, los límites, lo que falta, lo que se empuja a Ads / caption / landing,
// el pedido a la IA y la lectura de su respuesta vivan en un módulo puro (sin DOM ni red) que comparten la vista, el servidor y las pruebas.
// Los límites son los de ads-studio.js (los de Google los exige; los de Meta son lo que se ve sin «Ver más»). Nada se auto-aprueba:
// empujar a Ads crea un BORRADOR y el copy de anuncio sigue pidiendo el OK del CEO. Lo que falta dice ⚠️ SIN DATOS, nunca 0.
import { LIMITES, CTAS, limpiarVariante, faltas as faltasAds } from '../ads-studio.js';
import { plano, corta, entero, SIN_DATOS, armarPrompt, leerHerramienta, celda } from '../consulting/marcos.js';

export const BLOQUE = 'copy';
export const MAX_ACTIVOS = 12, MAX_VARIANTES = 8, MAX_MARCO = 25;
export const CONSCIENCIAS = ['Inconsciente', 'Consciente del problema', 'Consciente de la solución', 'Consciente del producto', 'Listo para comprar'];
// Los anillos de la diana (strategy/diana.js): el marco habla por anillo o por avatar.
export const ANILLOS = ['Centro · ICP', 'Anillo 1 · Prioritario', 'Anillo 2 · Secundario', 'Anillo 3 · Baja prioridad', 'Anillo 4 · Baja prioridad'];
// Los canales: qué campos tiene cada uno y su límite (null = sin límite que se cuente). Meta/Google vienen de ads-studio.js.
export const CANALES = {
  meta: { nombre: 'Anuncio Meta', ads: true, campos: [['texto', 'Texto principal', LIMITES.meta.texto], ['titulo', 'Título', LIMITES.meta.titulo]] },
  google: { nombre: 'Anuncio Google', ads: true, campos: [['texto', 'Descripción', LIMITES.google.descripcion], ['titulo', 'Título', LIMITES.google.titulo]] },
  caption: { nombre: 'Caption de la pieza', ads: false, campos: [['texto', 'Caption', 2200]] },
  landing: { nombre: 'Landing', ads: false, campos: [['titulo', 'Titular', null], ['texto', 'Texto', null]] },
};
export const CANAL_IDS = Object.keys(CANALES);
export const SD_PRUEBA = 'sale de un caso, número o testimonio real del cliente';

const idOk = (v) => (/^[\w.-]{1,60}$/.test(String(v ?? '')) ? String(v) : '');
const largo = (s, n) => String(s ?? '').replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

export const vacio = () => ({ marco: [], activos: [] });
export function variante(o = {}) {
  const x = plano(o) ? o : {}, e = plano(x.empujada) ? x.empujada : {};
  return { id: idOk(x.id) || `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`, texto: largo(x.texto, 2200), titulo: largo(x.titulo, 200), cta: CTAS.includes(x.cta) ? x.cta : '', elegida: x.elegida === true,
    laya: { puntaje: entero(x.laya?.puntaje, 1, 4), chip: corta(x.laya?.chip, 80) }, empujada: ['ads', 'caption', 'landing'].includes(e.a) ? { a: e.a, ref: corta(e.ref, 120), en: corta(e.en, 30) } : null };
}
export function limpiar(c) {
  const o = plano(c) ? c : {}, vistos = new Set();
  const marco = (Array.isArray(o.marco) ? o.marco : []).filter(plano).map((m) => ({
    consciencia: entero(m.consciencia, 1, 5), anillo: entero(m.anillo, 0, 4), avatar: corta(m.avatar, 80),
    mensaje: corta(m.mensaje, 300), prueba: corta(m.prueba, 300), fuente: corta(m.fuente, 160), objecion: corta(m.objecion, 300),
  })).filter((m) => m.consciencia !== null && (m.mensaje || m.prueba || m.objecion)).slice(0, MAX_MARCO);
  const activos = (Array.isArray(o.activos) ? o.activos : []).filter(plano).map((a) => {
    const ids = new Set();
    return { id: idOk(a.id), nombre: corta(a.nombre, 100), canal: CANAL_IDS.includes(a.canal) ? a.canal : 'meta', avatar: corta(a.avatar, 80), consciencia: entero(a.consciencia, 1, 5),
      pieza: idOk(a.pieza), archivado: a.archivado === true,
      variantes: (Array.isArray(a.variantes) ? a.variantes : []).map(variante).filter((v) => (v.texto || v.titulo) && !ids.has(v.id) && ids.add(v.id)).slice(0, MAX_VARIANTES) };
  }).filter((a) => a.id && a.nombre && !vistos.has(a.id) && vistos.add(a.id)).slice(0, MAX_ACTIVOS);
  // A lo más una elegida por activo (la primera).
  for (const a of activos) { let ya = false; for (const v of a.variantes) { if (v.elegida && ya) v.elegida = false; if (v.elegida) ya = true; } }
  return { marco, activos };
}
export const activosVivos = (c) => (c?.activos || []).filter((a) => !a.archivado);

// ---------- Contadores contra el límite del canal ----------
// → { n, max, pasa, falta } · max null = sin límite que se cuente.
export function contador(canal, campo, texto) {
  const def = CANALES[canal]?.campos.find(([k]) => k === campo), max = def ? def[2] : null, n = [...String(texto ?? '')].length;
  return { n, max, pasa: max !== null && n > max, falta: max === null ? null : max - n };
}
export const contadorTexto = (r) => (r.max === null ? `${r.n}` : `${r.n} / ${r.max}`);
// Los campos que se pasan del límite en las variantes del activo.
export const pasadas = (a) => (a?.variantes || []).flatMap((v) => (CANALES[a.canal]?.campos || []).filter(([k]) => contador(a.canal, k, v[k]).pasa).map(([k, nombre]) => ({ variante: v.id, campo: k, nombre })));
export const elegidaDe = (a) => (a?.variantes || []).find((v) => v.elegida) || null;

// ---------- Marco de mensajes ----------
// Celdas: consciencia × anillo; la celda vacía dice ⚠️ SIN DATOS y de dónde sale.
export const celdaMarco = (c, consciencia, anillo) => (c?.marco || []).find((m) => m.consciencia === consciencia && m.anillo === anillo) || null;
export const sinPrueba = (m) => !m || !m.prueba || /sin datos/i.test(m.prueba);
export const pruebaTexto = (m) => (sinPrueba(m) ? `${SIN_DATOS}: ${SD_PRUEBA}` : m.prueba);

// ---------- Empujar la elegida ----------
// A ad_variants (como Borrador, por POST ads-studio): el gancho = el título, el texto principal = el texto. Nunca trae estado ni aprobación.
export function paraAds(a, v, { perfil, marcaNombre = '' } = {}) {
  if (!CANALES[a?.canal]?.ads) return null;
  const meta = a.canal === 'meta';
  const cuerpo = {
    plataforma: a.canal, title: v.titulo || corta(v.texto, 90), caption: meta ? v.texto : '',
    madre: { tipo: 'libre', id: '', titulo: corta(a.nombre, 160) }, avatar: { id: '', nombre: a.avatar },
    ...(meta ? { meta: { titulo: v.titulo, cta: v.cta || 'Más información' } } : { google: { titulos: v.titulo ? [v.titulo] : [], descripciones: v.texto ? [v.texto] : [] } }),
    nota: corta(`Copywriting Studio${marcaNombre ? ` · ${marcaNombre}` : ''}: falta el OK del CEO`, 400),
  };
  return { ...limpiarVariante(cuerpo), profile: perfil };
}
// Lo que impide empujar: nada vacío ni pasado del límite del canal. Vacío = se puede.
export function faltasEmpujar(a, v) {
  const f = [];
  if (!a || !v) return ['Elige una variante'];
  for (const [k, nombre, max] of CANALES[a.canal].campos) { const r = contador(a.canal, k, v[k]); if (r.pasa) f.push(`${nombre} pasa ${r.n - max} caracteres del límite (${max})`); }
  if (CANALES[a.canal].ads && !v.texto) f.push('Falta el texto');
  return f;
}
// Lo que de verdad le falta al borrador para que el CEO lo pueda aprobar (las reglas de ads-studio.js); el borrador se crea igual.
export const faltasParaAprobar = (a, v, o) => { const p = paraAds(a, v, o); return p ? faltasAds(p) : []; };
export const textoCopiable = (v) => [v?.titulo, v?.texto].filter(Boolean).join('\n\n');

// ---------- Lo que falta para aprobar ----------
export function faltas(contenido) {
  const c = limpiar(contenido), f = [];
  if (!c.marco.length) f.push('Falta el marco de mensajes: al menos una celda de consciencia × anillo');
  for (const m of c.marco) if (sinPrueba(m)) f.push(`«${CONSCIENCIAS[m.consciencia - 1]}» no tiene prueba: sin prueba va ${SIN_DATOS}, no se inventa`);
  const A = activosVivos(c);
  if (!A.length) f.push('Falta un activo con sus variantes');
  for (const a of A) {
    if (a.variantes.length < 2) f.push(`«${a.nombre}» tiene ${a.variantes.length} variante${a.variantes.length === 1 ? '' : 's'}: pide al menos 2 para poder elegir`);
    const p = pasadas(a); if (p.length) f.push(`«${a.nombre}» tiene ${p.length} campo${p.length === 1 ? '' : 's'} sobre el límite del canal`);
    if (a.variantes.length && !elegidaDe(a)) f.push(`«${a.nombre}» no tiene variante elegida`);
  }
  return f;
}
export function resumen(contenido) {
  const c = limpiar(contenido), A = activosVivos(c), n = A.reduce((s, a) => s + a.variantes.length, 0);
  return `${c.marco.length} mensaje${c.marco.length === 1 ? '' : 's'} · ${A.length} activo${A.length === 1 ? '' : 's'} · ${n} variante${n === 1 ? '' : 's'}`;
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
export function prompt(ctx) {
  const lim = `Meta: texto ${LIMITES.meta.texto}, título ${LIMITES.meta.titulo} · Google: título ${LIMITES.google.titulo}, descripción ${LIMITES.google.descripcion} · caption 2200`;
  const cuerpo = [
    'MÉTODO',
    'Lee agents/04-creative/brain/skills/cr-hook-copy/SKILL.md (copy y consciencia) y, si existe, el mensaje del plan del mes (plans.mensaje).',
    '1) MARCO: una fila por consciencia (1 a 5) × anillo de la diana (0 a 4) o avatar: mensaje, prueba (con fuente; sin prueba real va vacía = ⚠️ SIN DATOS, no la inventes) y la objeción.',
    `2) ACTIVOS: cada uno con su canal (${CANAL_IDS.join(', ')}) y de 3 a 5 variantes que respeten el límite (${lim}). Cuenta los caracteres.`,
    '3) Sin promesas, precios ni garantías que no estén en la ficha. El copy de anuncio no se aprueba aquí: queda Borrador y lo aprueba el CEO. No elijas ganadora: la elige la persona.',
    '4) Laya califica cada variante con la puerta «Hook o copy»; no pongas puntaje.',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"marco":[{"consciencia":2,"anillo":0,"avatar":"","mensaje":"…","prueba":"","fuente":"","objecion":"…"}],"activos":[{"id":"a1","nombre":"Anuncio de apertura","canal":"meta","avatar":"","consciencia":2,"variantes":[{"id":"v1","titulo":"…","texto":"…","cta":"Más información"}]}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Copy de la marca","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Marketing de Inherent. Arma el MARCO DE MENSAJES y las VARIANTES DE COPY de «${corta(ctx?.cliente?.nombre, 80) || 'la marca'}».`, cuerpo, salida }, ctx);
}
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), L = ['# Copy', '', '## Marco de mensajes', '', '| Consciencia | Anillo | Mensaje | Prueba | Objeción |', '|---|---|---|---|---|'];
  for (const m of c.marco) L.push(`| ${CONSCIENCIAS[m.consciencia - 1]} | ${m.avatar ? celda(m.avatar) : m.anillo === null ? SIN_DATOS : ANILLOS[m.anillo]} | ${celda(m.mensaje) || SIN_DATOS} | ${celda(pruebaTexto(m))} | ${celda(m.objecion) || SIN_DATOS} |`);
  if (!c.marco.length) L.push(`| ${SIN_DATOS} | | | | |`);
  for (const a of activosVivos(c)) {
    L.push('', `## ${a.nombre} · ${CANALES[a.canal].nombre}`, '');
    a.variantes.forEach((v, i) => L.push(`${i + 1}. ${v.elegida ? '**(elegida)** ' : ''}${[v.titulo && `«${celda(v.titulo)}»`, celda(v.texto)].filter(Boolean).join(' — ')} _(${CANALES[a.canal].campos.map(([k, n]) => `${n.toLowerCase()} ${contadorTexto(contador(a.canal, k, v[k]))}`).join(' · ')})_`));
  }
  return L.join('\n');
}
