// Studio · Ideación de contenido (servidor). Lee lo que ya está guardado (el Research de la marca) y arma ideas listas; no escanea nada.
//   POST ideacion/:slug/generar    {temporada?, max?, gananteMin?, conciencia?} → el lote de ideas (o un vacío que explica de dónde saldría)
//   POST ideacion/:slug/al-shotlist {idea, temporada, v?}                       → suma las escenas al shot list de esa temporada (el ciclo AAAA-MM)
// El mismo control de acceso que investigacion.js: guard del área «content», vista «resumen» fuera, alcance por marca (scoper), marca
// personal solo el CEO y la ficha de oferta como techo (sin ficha no hay ideas ni shot list; las redes son las de la ficha).
// Al shot list solo se SUMA (nada se borra), sobre la versión que se leyó (409 si cambió) y sin repetir lo que ya está. Lo externo
// (scraping nuevo) es un adaptador inyectable: aquí solo se lee lo guardado.
import * as db from './db.js';
import * as content from './content.js';
import * as inv from './investigacion.js';
import { guard, scoper, edits } from './access.js';
import { body } from './http.js';
import { ficha as fichaCliente } from './estrategia.js';
import { COLL, COLL_V, cambioDeContenido, idVersion, limpiarEntregable } from '../../public/js/entregables.js';
import { herramientaDe } from '../../public/js/herramientas.js';
import * as shotlist from '../../public/js/production/shotlist.js';
import { limpiar as limpiarDna } from '../../public/js/creative/dna.js';
import { GANADOR } from '../../public/js/referentes.js';
import { loteConResumen, limpiarIdea, sumarAlShotlist, temporadaOk, SD_RADAR } from '../../public/js/studio/ideacion.js';

export const TOOL_SHOTLIST = 'shot-list-builder';
const slugOk = (s) => /^[a-z0-9][\w-]{1,59}$/.test(String(s || ''));
const lc = (x) => String(x || '').toLowerCase();
const ahora = () => new Date().toISOString();
const fail = (status, code, message) => { throw Object.assign(new Error(message), { status, code }); };
const tiempo = (x) => { const t = new Date(x).getTime(); return Number.isFinite(t) ? t : 0; };

// Los adaptadores externos (scraping nuevo, un modelo que redacte): se inyectan; por defecto no hacen nada ni salen a la red.
const adaptadores = { capability: () => ({ scraping: false, redaccion: false }) };
export const inyectar = (a) => Object.assign(adaptadores, a || {});
export const capability = () => adaptadores.capability();

// ---------- quién ve qué ----------
async function abre(req, res, slug, { write = false } = {}) {
  const u = await guard(req, res, 'content', { write }); if (!u) return null;
  if (u.role !== 'ceo' && u.views && u.views.content === 'resumen') { res.status(403).json({ error: 'Tu vista de Contenido es «resumen»: solo el rendimiento', code: 'RESUMEN' }); return null; }
  if (!slugOk(slug) || (slug === 'personal' && u.role !== 'ceo')) { res.status(404).json({ error: 'Esa marca no está entre las tuyas', code: 'MARCA' }); return null; }
  const sc = await scoper(u);
  if (sc && slug !== 'inherent' && !sc.client(slug)) { res.status(404).json({ error: 'Esa marca no está entre las tuyas', code: 'MARCA' }); return null; }
  return u;
}

// ---------- la marca: lo que ya está escrito de ella ----------
// Voz y personalidad del Brand DNA (brand_boards.dna) · pilares y audiencia de su perfil (sources cfg-<slug>) · cliente ideal de la diana.
// El «villano» es lo que la marca NO es (territorio del Brand DNA). Lo que falta queda vacío: el módulo puro lo dice como SIN DATOS.
export async function marcaDe(slug, { conciencia = null } = {}) {
  const [board, cfg] = await Promise.all([db.get('brand_boards', slug).catch(() => null), content.cfg(slug).catch(() => null)]);
  const dna = limpiarDna(board?.dna), bx = cfg?.bullseye;
  const pilares = (cfg?.pillars || []).map((p) => (typeof p === 'string' ? p : p?.name)).filter(Boolean);
  const quien = bx?.center || bx?.rings?.[0]?.label || cfg?.audience?.exacto || '';
  return { nombre: slug.toUpperCase(), voz: dna.voz, personalidad: dna.personalidad, pilares, icp: { quien, dolor: bx?.buyer || '' }, villano: dna.territorio.no_es.join(' · '), conciencia };
}

// ---------- generar ----------
export async function generar(u, slug, { temporada = '', max = 6, gananteMin = GANADOR, conciencia = null } = {}) {
  const f = await inv.ficha(slug);
  if (!f.activa) fail(409, 'SIN_FICHA', 'Sin ficha de oferta: el alcance contratado es el techo');
  const { items } = await inv.items(slug);
  const posts = items.filter((p) => p.kind === 'research' && (!f.redes || !p.red || f.redes.includes(p.red)));
  const cap = capability();
  if (!posts.length) return { ideas: [], vacio: true, aviso: `${SD_RADAR}: no hay publicaciones de referentes guardadas para esta marca${f.redes ? ` en ${f.redes.join(', ')}` : ''}.`, resumen: { posts: 0, con_dato: 0, ganadores: 0, considerados: 0 }, fuera: [], capacidad: cap };
  const marca = await marcaDe(slug, { conciencia: Number(conciencia) >= 1 && Number(conciencia) <= 5 ? Math.round(Number(conciencia)) : null });
  const r = loteConResumen(posts, marca, { max, temporada: temporadaOk(temporada), gananteMin });
  const sinMarca = !marca.voz.no.length && !marca.voz.si.length && !marca.voz.tono.length && !marca.pilares.length && !marca.icp.quien;
  let aviso = '';
  if (!r.ideas.length) aviso = !r.resumen.con_dato ? `${SD_RADAR}: hay ${r.resumen.posts} publicaciones pero ninguna con resonancia medida (le falta el promedio de su cuenta).`
    : !r.resumen.considerados ? `Hay ${r.resumen.con_dato} publicaciones con dato pero ninguna llega a ×${gananteMin}. Baja el mínimo o corre el radar de nuevo.`
    : sinMarca ? `${SD_RADAR.replace('corre el radar', 'completa la marca')}: la marca no tiene voz, pilares ni cliente ideal escritos; sin eso no se sabe qué puede decir.`
    : 'Lo que más funcionó no encaja con la voz, los pilares o el cliente ideal de esta marca.';
  return { ideas: r.ideas, vacio: !r.ideas.length, aviso, resumen: r.resumen, fuera: r.fuera.slice(0, 20), capacidad: cap };
}

// ---------- al shot list ----------
// El shot list de esa temporada: el entregable de shot-list-builder cuyo ciclo es AAAA-MM (el mismo que usa «Enviar al shot list» de los guiones).
const delCiclo = async (slug, temporada) => (await db.list(COLL)).filter((d) => d.ws === 'production' && d.tool === TOOL_SHOTLIST && lc(d.client_slug) === slug && d.ciclo === temporada && !d.archivado)
  .sort((a, z) => tiempo(z._meta?.updated_at) - tiempo(a._meta?.updated_at))[0] || null;
const entrada = (u, version, nota) => ({ en: ahora(), por: u.email, accion: 'editar', nota, version });
const resumenDe = (d, extra = {}) => ({ id: d.id, titulo: d.titulo, ciclo: d.ciclo, version: d.version, v: d.v, estado: d.estado, escenas: shotlist.limpiar(d.contenido).escenas.length, ...extra });

export async function alShotlist(u, slug, { idea, temporada, v = null }) {
  const t = temporadaOk(temporada); if (!t) fail(400, 'TEMPORADA', 'La temporada va como AAAA-MM (el ciclo del shot list)');
  // Con ficha o sin ella: igual que entregables.js — Inherent y la marca personal no la tienen; los demás la necesitan.
  if (slug !== 'personal' && slug !== 'inherent' && !(await fichaCliente(slug)).hay) fail(409, 'SIN_FICHA', 'Sin ficha de oferta: el alcance contratado es el techo');
  const limpia = limpiarIdea(idea);
  if (!limpia.guion.length) fail(400, 'IDEA', 'La idea no tiene escenas: escribe al menos una');
  for (let intento = 0; intento < 2; intento++) {
    const cur = await delCiclo(slug, t);
    if (cur) {
      if (v !== null && v !== undefined && Number(v) !== cur.v) fail(409, 'CONFLICTO', 'Alguien cambió el shot list justo ahora. Recarga y vuelve a intentar.');
      const s = sumarAlShotlist(cur.contenido, limpia); if (s.error) fail(409, 'TOPE', s.error);
      if (!s.agregadas) return { ok: true, agregadas: 0, yaEstaban: s.yaEstaban, shotlist: resumenDe(cur) }; // idempotente: no escribe ni sube de versión
      const cambio = cambioDeContenido(cur, s.contenido);
      const data = { ...cur, contenido: s.contenido, version: cambio.version, estado: cambio.estado, aprobado: cambio.aprobado,
        historial: [...(Array.isArray(cur.historial) ? cur.historial : []), entrada(u, cambio.version, `Ideación: +${s.agregadas} escena${s.agregadas === 1 ? '' : 's'} de «${limpia.gancho.slice(0, 60)}»${cambio.estado !== cur.estado ? ` · vuelve a ${cambio.estado}` : ''}`)] };
      const d = await db.update(COLL, cur.id, data, cur.v, u.email); // la versión que se leyó: si alguien cambió antes, null
      if (!d) fail(409, 'CONFLICTO', 'Alguien cambió el shot list justo ahora. Recarga y vuelve a intentar.');
      await db.create(COLL_V, versionDe(d, cambio.version), u.email, idVersion(d.id, cambio.version));
      return { ok: true, agregadas: s.agregadas, yaEstaban: s.yaEstaban, shotlist: resumenDe(d) };
    }
    const s = sumarAlShotlist({ escenas: [] }, limpia); if (s.error) fail(409, 'TOPE', s.error);
    const tool = herramientaDe(TOOL_SHOTLIST);
    const limpio = limpiarEntregable({ tool: TOOL_SHOTLIST, client_slug: slug, ciclo: t, titulo: `Shot list · ${t}`, contenido: s.contenido, ia: { via: 'servidor', modelo: '' } }, tool.limpiar);
    const doc = { ...limpio, titulo: limpio.titulo || tool.nombre, ws: tool.ws, pestana: tool.pestana, owner: u.email, estado: 'Borrador', archivado: false, version: 1, aprobado: null,
      historial: [{ en: ahora(), por: u.email, accion: 'crear', nota: `Ideación: ${s.agregadas} escenas`, version: 1 }], tareas: [], resultado: [], siguientes: [] };
    try {
      const d = await db.create(COLL, doc, u.email, `sl-${slug}-${t}`); // id fijo: dos toques a la vez no crean dos shot lists
      await db.create(COLL_V, versionDe(d, 1), u.email, idVersion(d.id, 1));
      return { ok: true, agregadas: s.agregadas, yaEstaban: s.yaEstaban, shotlist: resumenDe(d), creado: true };
    } catch (e) { if (intento === 1) throw e; /* ya lo creó otro: se vuelve a leer y se suma */ }
  }
  fail(409, 'CONFLICTO', 'Alguien cambió el shot list justo ahora. Recarga y vuelve a intentar.');
}
const versionDe = (d, n) => ({ deliverable_id: d.id, version: n, tool: d.tool, ws: d.ws, pestana: d.pestana, titulo: d.titulo, client_slug: d.client_slug, ciclo: d.ciclo, project_id: d.project_id, estado: d.estado, contenido: d.contenido, criterios: d.criterios, entradas: d.entradas, ia: d.ia });

// ---------- las rutas (api/index.js las registra con ideacion.rutas(on)) ----------
const err = (res, e) => res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar. Vuelve a intentar.', code: e.code || 'SERVIDOR' });
export function rutas(on) {
  on('POST', 'ideacion/:slug/generar', async (req, res) => {
    const slug = lc(req.params.slug), u = await abre(req, res, slug); if (!u) return;
    const b = body(req);
    try { res.json(await generar(u, slug, { temporada: b.temporada, max: b.max, gananteMin: b.gananteMin ?? GANADOR, conciencia: b.conciencia })); } catch (e) { err(res, e); }
  });
  on('POST', 'ideacion/:slug/al-shotlist', async (req, res) => {
    const slug = lc(req.params.slug), u = await abre(req, res, slug, { write: true }); if (!u) return;
    if (!edits(u, 'content')) return res.status(403).json({ error: 'Tu perfil solo puede ver esto, no cambiarlo' });
    const b = body(req);
    try { res.json(await alShotlist(u, slug, { idea: b.idea, temporada: b.temporada, v: b.v })); } catch (e) { err(res, e); }
  });
}
