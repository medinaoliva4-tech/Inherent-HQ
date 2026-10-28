// Content Repurposing Engine (herramienta content-repurposing de Production): la matriz de maestros aprobados × salidas (9:16, 4:5, 1:1, 16:9,
// fragmentos de story, corte de 7 a 15 s y variantes de hook) y el medidor de razón 1:2 (por cada maestro, dos derivadas). Las derivadas son
// fichas de «videos» con derivada_de; las variantes de hook salen a Ads Studio como Borrador. Existe para que la matriz, la razón, el límite
// de caption y la regla «una derivada no agrega assets nuevos» (la usa también el servidor, api/_lib/video.js) vivan en un módulo puro
// (sin DOM ni red). Sin dato no hay cifra: la razón sin maestros es null.
import { plano, corta, numeroONull, leerHerramienta, armarPrompt, celda, SIN_DATOS } from '../consulting/marcos.js';
import { LIMITES } from '../ads-studio.js';

export const BLOQUE = 'repurposing';
export const RAZON_META = 2; // 1 maestro : 2 derivadas
export const CORTE = { min: 7, max: 15 };
export const SALIDAS = [
  { id: '9:16', tipo: 'formato', nombre: 'Vertical 9:16', limite: 2200 },
  { id: '4:5', tipo: 'formato', nombre: 'Feed 4:5', limite: 2200 },
  { id: '1:1', tipo: 'formato', nombre: 'Cuadrado 1:1', limite: 2200 },
  { id: '16:9', tipo: 'formato', nombre: 'Horizontal 16:9', limite: 5000 },
  { id: 'story', tipo: 'fragmento', nombre: 'Fragmentos de story', limite: 125 },
  { id: 'corte', tipo: 'corte', nombre: 'Corte de 7 a 15 s', limite: 150 },
  { id: 'hook', tipo: 'hook', nombre: 'Variantes de hook', limite: LIMITES.meta.texto },
];
export const salidaDe = (id) => SALIDAS.find((s) => s.id === id) || null;
export const ESTADOS = [['pendiente', 'Pendiente'], ['hecha', 'Hecha']];
const MAX_CELDAS = 200, MAX_HOOKS = 10;
const idRef = (v) => (/^[\w-]{1,120}$/.test(String(v ?? '')) ? String(v) : '');

export const vacio = () => ({ celdas: [] });
export const celdaVacia = (maestro = '', salida = '9:16') => ({ maestro, titulo: '', salida, estado: 'pendiente', derivada: '', duracion_s: null, caption: '', hooks: [], nota: '' });

// Solo lo conocido, con su tipo y su tamaño. Una celda por maestro y salida; la salida que no existe se cae.
export function limpiar(c) {
  const o = plano(c) ? c : {}, vistas = new Set(), celdas = [];
  for (const x of (Array.isArray(o.celdas) ? o.celdas : []).filter(plano)) {
    const s = salidaDe(String(x.salida ?? '').trim()), maestro = idRef(x.maestro), k = `${maestro}|${s?.id}`;
    if (!s || !maestro || vistas.has(k) || celdas.length >= MAX_CELDAS) continue; vistas.add(k);
    const dur = numeroONull(x.duracion_s, { min: 0, max: 3600 });
    celdas.push({
      maestro, titulo: corta(x.titulo, 140), salida: s.id, estado: x.estado === 'hecha' ? 'hecha' : 'pendiente', derivada: idRef(x.derivada), duracion_s: dur === null ? null : Math.round(dur * 10) / 10,
      caption: String(x.caption ?? '').replace(/\r\n/g, '\n').trim().slice(0, 5000),
      hooks: (Array.isArray(x.hooks) ? x.hooks : []).filter(plano).slice(0, MAX_HOOKS).map((h) => ({ texto: corta(h.texto, 200), caption: String(h.caption ?? '').replace(/\r\n/g, '\n').trim().slice(0, 600), enviado: h.enviado === true })).filter((h) => h.texto),
      nota: corta(x.nota, 300),
    });
  }
  return { celdas };
}

// ---------- Maestros aprobados ----------
// Las fichas de «videos» que son maestro (no son derivada, no están archivadas) y están aprobadas por el cliente o el CEO.
export const esMaestro = (f) => plano(f) && f.kind !== 'kit' && !f.archivado && !f.derivada_de;
export const aprobado = (f) => f?.revision === 'Aprobado' || Boolean(f?.aprobacion?.v);
export const maestrosAprobados = (fichas) => (Array.isArray(fichas) ? fichas : []).filter((f) => esMaestro(f) && aprobado(f));
export const derivadasDe = (fichas, maestro) => (Array.isArray(fichas) ? fichas : []).filter((f) => plano(f) && !f.archivado && f.derivada_de === maestro);

// ---------- Caption y duración ----------
export const limiteDe = (salida) => salidaDe(salida)?.limite ?? 2200;
export const largoCaption = (c) => [...String(c ?? '')].length;
export const pasaLimite = (texto, salida) => largoCaption(texto) > limiteDe(salida);
export const corteOk = (s) => typeof s === 'number' && s >= CORTE.min && s <= CORTE.max;

// ---------- El medidor 1:2 ----------
// Derivadas hechas ÷ maestros en la matriz. Sin maestros: null (no 0). `faltan` = las derivadas que faltan para llegar a 2 por maestro.
export function razon(contenido) {
  const c = limpiar(contenido).celdas, maestros = new Set(c.map((x) => x.maestro)), hechas = c.filter((x) => x.estado === 'hecha' && x.salida !== 'hook').length + c.filter((x) => x.salida === 'hook' && x.hooks.some((h) => h.enviado)).length;
  const n = maestros.size;
  return { maestros: n, derivadas: hechas, razon: n ? Math.round((hechas / n) * 100) / 100 : null, meta: RAZON_META, ok: n > 0 && hechas >= n * RAZON_META, faltan: n ? Math.max(0, n * RAZON_META - hechas) : null };
}

// ---------- La derivada: una ficha de «videos» con derivada_de que no agrega assets nuevos ----------
const llave = (a) => (a?.url ? String(a.url).trim() : `n:${String(a?.nombre || '').trim().toLowerCase()}`);
// Los assets de la derivada que el maestro no tiene (por link; sin link, por nombre). El servidor rechaza si hay alguno.
export function assetsNuevos(assets, assetsMaestro) {
  const tengo = new Set((Array.isArray(assetsMaestro) ? assetsMaestro : []).map(llave));
  return (Array.isArray(assets) ? assets : []).filter((a) => plano(a) && (a.url || a.nombre) && !tengo.has(llave(a)));
}
// El cuerpo para crear la derivada en POST /api/video: copia los assets del maestro tal cual (no suma ninguno).
export function fichaDerivada(maestro, celdaX, { profile } = {}) {
  const s = salidaDe(celdaX?.salida) || SALIDAS[0], m = plano(maestro) ? maestro : {};
  return {
    profile, titulo: corta(`${m.titulo || 'Maestro'} · ${s.nombre}`, 140), formato: s.tipo === 'formato' ? s.id : ['story', 'corte'].includes(s.id) ? '9:16' : m.formato || '9:16',
    duracion: s.id === 'corte' ? celdaX?.duracion_s ?? null : null, derivada_de: idRef(m.id), assets: (Array.isArray(m.assets) ? m.assets : []).map((a) => ({ nombre: a.nombre || '', url: a.url || '' })),
    capa: 'derivadas', estado: 'Por editar', notas: corta(celdaX?.nota, 300),
  };
}

// ---------- Variantes de hook → Ads Studio (Borrador) ----------
// Las variantes que se pueden mandar: con texto, sin mandar antes y con el caption dentro del límite. Las que pasan el límite salen en `bloqueadas`.
export function variantesDeHook(contenido, maestros = []) {
  const por = new Map((Array.isArray(maestros) ? maestros : []).map((m) => [m.id, m])), listas = [], bloqueadas = [];
  for (const x of limpiar(contenido).celdas.filter((y) => y.salida === 'hook')) for (const h of x.hooks) {
    if (h.enviado) continue;
    if (pasaLimite(h.caption, 'hook') || h.texto.length > 200) { bloqueadas.push({ maestro: x.maestro, texto: h.texto }); continue; }
    listas.push({ maestro: x.maestro, hook: h.texto, variante: { title: h.texto, caption: h.caption, plataforma: 'meta', formato: '9:16', madre: { tipo: 'libre', id: '', titulo: corta(por.get(x.maestro)?.titulo || x.titulo, 160) } } });
  }
  return { listas, bloqueadas };
}

// ---------- Faltas ----------
// extra = { maestros: [ids aprobados] } (opcional): una celda de un maestro que no está aprobado es una falta.
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido).celdas, f = [], ok = Array.isArray(extra?.maestros) ? new Set(extra.maestros) : null;
  if (!c.length) f.push('La matriz está vacía: elige un maestro aprobado y sus salidas');
  for (const x of c) {
    const n = x.titulo || x.maestro, s = salidaDe(x.salida);
    if (ok && !ok.has(x.maestro)) f.push(`«${n}» no es un maestro aprobado: solo se deriva de lo aprobado`);
    if (x.salida === 'corte' && x.estado === 'hecha' && !corteOk(x.duracion_s)) f.push(`El corte de «${n}» tiene que durar entre ${CORTE.min} y ${CORTE.max} s`);
    if (pasaLimite(x.caption, x.salida)) f.push(`El caption de ${s.nombre} de «${n}» pasa el límite de ${s.limite} caracteres`);
    if (x.salida === 'hook') { for (const h of x.hooks) if (pasaLimite(h.caption, 'hook')) f.push(`Un hook de «${n}» pasa el límite de ${s.limite} caracteres en el caption`); }
    else if (x.estado === 'hecha' && !x.derivada) f.push(`${s.nombre} de «${n}» está hecha pero no tiene su ficha de video (derivada)`);
  }
  const r = razon({ celdas: c }); if (r.maestros && !r.ok) f.push(`Razón 1:${RAZON_META}: van ${r.derivadas} derivadas de ${r.maestros * RAZON_META}`);
  return f;
}

// ---------- Pedido a la IA ----------
// ctx.maestros (opcional) = [{ id, titulo, formato, duracion }] aprobados; sin ellos la IA no inventa maestros.
export function prompt(ctx) {
  const ms = (Array.isArray(ctx?.maestros) ? ctx.maestros : []).filter(plano).slice(0, 12);
  const F = '```';
  const cuerpo = [
    ms.length ? `Maestros aprobados (solo de estos se deriva):\n${ms.map((m) => `- ${m.id} · ${corta(m.titulo, 100)} · ${corta(m.formato, 10)}${m.duracion ? ` · ${m.duracion} s` : ''}`).join('\n')}` : 'No llegaron maestros aprobados: no inventes ninguno; devuelve celdas vacías y di qué falta.',
    `Salidas posibles: ${SALIDAS.map((s) => `${s.id} (${s.nombre})`).join(', ')}.`,
    `1) La meta es de 1 maestro a ${RAZON_META} derivadas como mínimo; propón las salidas que más sirven a esta marca.`,
    `2) El corte dura entre ${CORTE.min} y ${CORTE.max} s (pon duracion_s). Los fragmentos de story van cortos.`,
    '3) La salida «hook» lleva hasta 3 variantes de gancho (texto corto, caption corto): son pruebas para Ads, nunca copia lista para pautar.',
    '4) Respeta el límite de caption de cada salida. No pidas assets nuevos: la derivada usa solo lo del maestro. Estado siempre «pendiente».',
  ];
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"celdas":[{"maestro":"<id>","titulo":"…","salida":"9:16","estado":"pendiente","duracion_s":null,"caption":"…","hooks":[],"nota":"…"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Matriz de derivadas","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ];
  return armarPrompt({ intro: `Eres Production de Inherent. Arma la MATRIZ DE DERIVADAS de «${corta(ctx?.cliente?.nombre, 80) || 'el cliente'}»: qué salidas salen de cada maestro aprobado.`, cuerpo, salida }, ctx);
}
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

export function aMd(contenido) {
  const c = limpiar(contenido), r = razon(c), L = ['# Matriz de derivadas', '', r.razon === null ? `Razón 1:${RAZON_META}: ${SIN_DATOS} (sin maestros)` : `Razón 1:${RAZON_META}: ${r.derivadas} derivadas de ${r.maestros} maestros (${r.razon} por maestro)`, ''];
  L.push('| Maestro | Salida | Estado | Derivada | Seg | Caption |', '|---|---|---|---|---|---|');
  for (const x of c.celdas) L.push(`| ${celda(x.titulo || x.maestro)} | ${salidaDe(x.salida).nombre} | ${x.estado} | ${x.derivada || ''} | ${x.duracion_s ?? ''} | ${celda(x.caption).slice(0, 80)} |`);
  return L.join('\n').trim() + '\n';
}
