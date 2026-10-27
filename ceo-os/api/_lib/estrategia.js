// App 02 · Estrategia (servidor). Un cliente = 5 bloques (Diagnóstico · Oferta · Modelo de dinero · Leads · Roadmap).
// Cada bloque muestra su entregable del repo (el mapa de Intel, public/js/intel-mapa.js) y guarda su estado en la colección
// «strategy» (área «estrategia», alcance por cliente): un documento por cliente y bloque, con el id «<slug>--<bloque>».
//   { slug, bloque, estado: 'aprobado' | '', borrador: { texto, por, en, fuentes }, aprobado: { por, en }, etapa (solo Diagnóstico) }
// El CEO es el candado de la estrategia: solo él aprueba, reabre y confirma la etapa. Nada de esta colección se escribe por
// /api/db/strategy (la ruta genérica responde 404): todo pasa por las rutas de aquí, que aplican esas reglas.
// Las fuentes (hormozi-brain/references) se sirven solo a quien ve Estrategia (el cliente nunca), con la ruta validada
// contra una lista cerrada de carpetas y sin «..».
// Fase 3a: la diana (PUT estrategia/:slug/bullseye) y los espejos de las herramientas de Strategy en «deliverables»:
// Customer Bullseye → sources cfg-<slug>.bullseye · Business X-Ray → la estrategia en vivo · Offer Architect → se aprueba con
// el bloque Oferta/Modelo. api/_lib/entregables.js llama a estas funciones al guardar; aquí está la regla y la escritura.
import fs from 'node:fs';
import * as db from './db.js';
import { guard, scoper, edits, canRead } from './access.js';
import { readFile, listFiles, listDir, repoSource, escribirSeguro, huella } from './gh.js';
import * as intel from './intel.js';
import { body } from './http.js';
import { parsePlanContratado, tables, clean } from './parse.js';
import { BLOQUES, bloqueDe, docId, parseDocId, estadoDe, nivelDe, limiteDe, seccion, etapaDe, extraerCitas, dondeDe, tiempo, etapaDeRespuesta, HORMOZI, COLL } from '../../public/js/estrategia.js';
import { puertasDe, resumen as resumenLaya, GATES_ID } from '../../public/js/laya.js';
import { pathLabel } from '../../public/js/library-tree.js';
import { vivaId, limpiarParche, aplicar } from '../../public/js/estrategia-viva.js';
import { fichaMd, rutaEditable } from '../../public/js/ficha.js';
import { cleanBullseye, guardarDiana } from './content.js';
import * as diana from '../../public/js/strategy/diana.js';
import * as xray from '../../public/js/strategy/xray.js';
import * as oferta from '../../public/js/strategy/oferta.js';
import { herramientaDe } from '../../public/js/herramientas.js';
import { COLL as COLL_ENT, COLL_V, idVersion, cambioDeContenido, limpiarEntregable, canon, faltas as faltasDe } from '../../public/js/entregables.js';

const MAX_BORRADOR = 60_000;
// La Library como contexto del chat: hasta 6 documentos y ~36 mil caracteres en total (el puente acepta 60 mil por mensaje).
const MAX_ADJ = 6, MAX_ADJ_TEXTO = 36_000;
const ahora = () => new Date().toISOString();
const cap = (s, n) => String(s ?? '').slice(0, n);

// ---------- El cliente: nombre, nivel y lo que dice su ficha ----------
export async function ficha(slug) {
  const root = intel.rootOf(slug);
  const f = await readFile(`${root}/00-onboarding/plan-contratado.md`);
  const nombre = (f && /^#\s+.*?[—–-]\s*(.+?)\s*$/m.exec(f.content)?.[1]) || (slug === 'inherent' ? 'Inherent' : slug.toUpperCase());
  if (!f) return { hay: false, nombre, plan: '', nivel: null, linea: '', incluye: [], fuera: '', pipeline: [], redes: '' };
  // «team»: el precio y el costo nunca salen de aquí (la ficha los lleva; Estrategia no los necesita).
  const pc = parsePlanContratado(f.content, 'team');
  const campo = (re) => pc.fields.find((x) => re.test(x.key))?.value || '';
  const plan = pc.plan || campo(/^nivel$/i);
  const inc = tables(f.content).find((t) => /qu[eé] incluye/i.test(t.heading));
  const incluye = (inc?.rows || []).map((r) => ({ k: clean(r[0]), v: clean(r[1]) })).filter((x) => x.k && x.v).slice(0, 12);
  if (!incluye.length && campo(/^[aá]reas$/i)) incluye.push({ k: 'Áreas', v: campo(/^[aá]reas$/i) });
  return { hay: true, nombre, plan, nivel: nivelDe(plan), linea: campo(/^l[ií]nea$/i), incluye, fuera: campo(/^queda fuera$/i), pipeline: (pc.pipeline || []).slice(0, 10), redes: campo(/^redes$/i) };
}

// ---------- Lo del repo (Intel), con un poco de memoria para no leer 40 archivos por cada pantalla ----------
const MEM = new Map();
async function intelDe(slug, costos) {
  const k = `${slug}|${costos ? 1 : 0}`, m = MEM.get(k);
  if (m && Date.now() - m.at < 15_000) return m.v;
  const v = await intel.intelFor(slug, { vista: 'equipo', costos });
  MEM.set(k, { at: Date.now(), v }); if (MEM.size > 60) MEM.delete(MEM.keys().next().value);
  return v;
}
export const olvidar = () => MEM.clear();

// Lo que el bloque necesita de lo que hay en el repo: cada entregable (el más reciente), con la sección que le toca.
function entregablesDe(b, intelRes) {
  const items = intelRes.depts.flatMap((d) => d.items.map((it) => ({ ...it, dept: d.nombre })));
  const faltan = intelRes.depts.flatMap((d) => d.faltan);
  const out = [], falta = [];
  for (const e of b.entregables) {
    const it = items.find((x) => x.id === e.id);
    if (!it) { const f = faltan.find((x) => x.id === e.id); if (f) falta.push({ id: f.id, titulo: f.titulo, sirve: f.sirve, apoyo: Boolean(e.apoyo) }); continue; }
    let contenido = cap(it.contenido, 70_000), sec = null;
    if (e.sec) { const s = seccion(it.contenido, e.sec); sec = s ? { label: e.secLabel, hay: true } : { label: e.secLabel, hay: false }; if (s) contenido = cap(s, 70_000); }
    out.push({ id: it.id, titulo: it.titulo, sirve: it.sirve, mes: it.mes || null, fecha: it.fecha || null, ruta: it.ruta || null, fmt: it.fmt, dept: it.dept, apoyo: Boolean(e.apoyo), sec, contenido });
  }
  return { entregables: out, faltan: falta, hay: out.some((x) => !x.apoyo && (!x.sec || x.sec.hay)) };
}

// ---------- Acceso ----------
// La persona ve Estrategia (área), y el cliente está entre los suyos. Devuelve el usuario o responde y devuelve null.
async function acceso(req, res, slug, { write = false } = {}) {
  const u = await guard(req, res, 'estrategia', { write }); if (!u) return null;
  if (slug !== undefined) {
    if (!(await intel.slugValido(slug))) { res.status(404).json({ error: 'No existe' }); return null; }
    if (slug !== 'inherent') { const sc = await scoper(u); if (sc && !sc.client(slug)) { res.status(404).json({ error: 'Ese cliente no está entre los tuyos' }); return null; } }
  }
  return u;
}
const docsDe = async (slug) => Object.fromEntries((await db.list(COLL)).filter((d) => d.slug === slug).map((d) => [d.bloque, d]));

// Como acceso(), pero también deja pasar la marca personal del CEO: no es una carpeta de clients/ (su diana vive en sources cfg-personal).
async function accesoMarca(req, res, slug, opts) {
  if (slug !== 'personal') return acceso(req, res, slug, opts);
  const u = await guard(req, res, 'estrategia', opts); if (!u) return null;
  if (u.role !== 'ceo') { res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); return null; }
  return u;
}

// ---------- Strategy en «deliverables»: los espejos y sus reglas ----------
// Lo escribe el servidor (db.update con la v que leyó: si alguien lo cambió, reintenta una vez y si no, avisa). Nada de upsert.
const lc = (x) => String(x || '').toLowerCase();
const tiempoDe = (x) => { const t = new Date(x).getTime(); return Number.isFinite(t) ? t : 0; };
const hist = (d) => (Array.isArray(d.historial) ? d.historial : []);
const entrada = (u, accion, version, texto = '') => ({ en: ahora(), por: u.email, accion, nota: cap(String(texto).replace(/\s+/g, ' ').trim(), 400), version });
// La foto de una versión (la misma de api/_lib/entregables.js): solo se crea, nunca se edita.
const fotoDe = (d, n) => ({ deliverable_id: d.id, version: n, tool: d.tool, ws: d.ws, pestana: d.pestana, titulo: d.titulo, client_slug: d.client_slug, ciclo: d.ciclo, project_id: d.project_id, estado: d.estado, contenido: d.contenido, criterios: d.criterios, entradas: d.entradas, ia: d.ia });
const CONFLICTO = 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.';
// Crear con un id que otro acaba de crear no es un error: es un conflicto (null) y se vuelve a leer.
async function escribe(coll, id, cur, data, who) {
  try { return cur ? await db.update(coll, id, data, cur.v, who) : await db.create(coll, data, who, id); } catch (e) { if (!cur && /duplicate key|unique constraint/i.test(String(e?.message))) return null; throw e; }
}
export const estrategiaCerrada = async (slug) => Boolean((await db.get(COLL, vivaId(slug)).catch(() => null))?.aprobado);
// El último entregable sin archivar de una herramienta para un cliente.
async function ultimoDe(tool, slug) {
  return (await db.list(COLL_ENT)).filter((d) => d.tool === tool && lc(d.client_slug) === lc(slug) && !d.archivado).sort((a, z) => tiempoDe(z._meta?.updated_at) - tiempoDe(a._meta?.updated_at))[0] || null;
}
// El módulo puro de cada herramienta de Strategy que guarda un entregable (diana, X-Ray y oferta).
const MODULO = { 'customer-bullseye': diana, 'business-xray': xray, 'offer-architect': oferta };
// El limpiar() de una herramienta: el del registro y, si el registro aún no lo trae, el de su módulo puro.
export const limpiarDe = (tool) => (typeof tool?.limpiar === 'function' ? tool.limpiar : MODULO[tool?.id]?.limpiar);
// Un entregable «con algo»: su contenido no es el vacío de su herramienta.
function conContenido(d) {
  const limpiar = limpiarDe(herramientaDe(d?.tool)), m = MODULO[d?.tool]; let vacio = {};
  try { vacio = limpiar ? limpiar(typeof m?.vacio === 'function' ? m.vacio() : {}) : {}; } catch { vacio = {}; }
  return canon(d?.contenido ?? {}) !== canon(vacio);
}

// Customer Bullseye → su espejo en deliverables (el último; si no hay, un Borrador nuevo). Cambiar la diana de un Aprobado crea la
// versión nueva y lo vuelve Borrador, como en cualquier entregable. null = alguien lo cambió justo ahora.
export async function espejoDiana(slug, contenido, u) {
  const nuevo = diana.limpiar(contenido);
  for (let i = 0; i < 2; i++) {
    const cur = await ultimoDe('customer-bullseye', slug);
    if (!cur) {
      const limpio = limpiarEntregable({ tool: 'customer-bullseye', titulo: herramientaDe('customer-bullseye')?.nombre, client_slug: slug, contenido: nuevo, ia: { via: 'manual' } }, diana.limpiar);
      const doc = { ...limpio, titulo: limpio.titulo || 'Customer Bullseye', ws: 'strategy', pestana: 'research', owner: u.email, estado: 'Borrador', archivado: false, version: 1, aprobado: null, historial: [entrada(u, 'crear', 1, 'Desde la diana')], tareas: [], resultado: [], siguientes: [] };
      const d = await db.create(COLL_ENT, doc, u.email);
      await db.create(COLL_V, fotoDe(d, 1), u.email, idVersion(d.id, 1));
      return d;
    }
    const cambio = cambioDeContenido(cur, nuevo);
    if (cambio.version === cur.version) return cur;
    const data = { ...cur, contenido: nuevo, version: cambio.version, estado: cambio.estado, aprobado: cambio.aprobado, historial: [...hist(cur), entrada(u, 'editar', cambio.version, cambio.estado !== cur.estado ? `Vuelve a ${cambio.estado}: cambió la diana` : 'Desde la diana')] };
    const d = await db.update(COLL_ENT, cur.id, data, cur.v, u.email);
    if (d) { await db.create(COLL_V, fotoDe(d, cambio.version), u.email, idVersion(d.id, cambio.version)); return d; }
  }
  return null;
}
// Un Customer Bullseye guardado en deliverables (POST/PUT): la diana también va a su casa (sources cfg-<slug>.bullseye, con «audience»).
// Una diana a medias (sin centro o sin los 5 niveles) no se pasa a su casa. { ok:false } = alguien cambió la configuración justo ahora.
export async function dianaASuCasa(slug, contenido, u) {
  if (!cleanBullseye(contenido)) return { ok: true, saltada: true };
  const g = await guardarDiana(slug, contenido, u.email);
  return g.conflicto || g.invalida ? { ok: false } : { ok: true, igual: Boolean(g.igual) };
}

// Business X-Ray guardado → la estrategia en vivo: la conclusión (contexto) y dónde está trabado (análisis). Lo que viene vacío no borra
// lo que ya se concretó en el chat. Con la estrategia aprobada no se toca. { ok:false } = alguien la cambió justo ahora.
export async function xrayAViva(slug, contenido, u) {
  const parche = limpiarParche(xray.aViva(contenido));
  for (const k of ['contexto', 'analisis']) if (parche[k]) { parche[k] = Object.fromEntries(Object.entries(parche[k]).filter(([, v]) => v !== '')); if (!Object.keys(parche[k]).length) delete parche[k]; }
  if (!Object.keys(parche).length) return { ok: true, vacio: true };
  const id = vivaId(slug), sinFecha = ({ actualizado, ...r }) => canon(r);
  for (let i = 0; i < 2; i++) {
    const cur = await db.get(COLL, id);
    if (cur?.aprobado) return { ok: true, cerrada: true };
    const { viva, cambiadas } = aplicar(cur?.viva || {}, parche, ahora());
    if (cur && sinFecha(viva) === sinFecha(cur.viva || {})) return { ok: true, igual: true };
    const d = await escribe(COLL, id, cur, { ...(cur || {}), slug, bloque: 'viva', viva, aprobado: null }, u.email);
    if (d) return { ok: true, cambiadas };
  }
  return { ok: false };
}

// Offer Architect envuelve los bloques Oferta y Modelo de dinero: no hay un segundo botón de aprobar. Al aprobar uno de los dos, su
// entregable espejo (el último sin archivar) queda Aprobado con la versión aprobada, para que «Enviar a…» funcione. Aprobar es tan estricto como
// POST entregables/:id/estado: pide la v que leyó el CEO (400 FALTA_V), la compara con la de ahora (409 CONFLICTO) y corre faltas() (400 FALTAS).
// Un espejo vacío (o sin espejo) no se sella: no hay nada que aprobar en la herramienta. Reabrir regresa a Borrador el espejo que lleva el OK
// (el Aprobado con su aprobado.version, no el más reciente a secas); el servidor solo lo pide cuando ningún bloque de la oferta sigue aprobado.
// Devuelve { ok:true, espejo } o { ok:false, status, code, error, faltas? }.
export const esDeOferta = (bloque) => bloque === 'oferta' || bloque === 'modelo';
const esAprobado = (d) => ['Aprobado', 'Entregado'].includes(d?.estado);
const malSello = (status, code, error, extra = {}) => ({ ok: false, status, code, error, ...extra });
// El nivel que manda en la oferta (bloqueos y faltas): el de la ficha; una ficha sin nivel reconocido cae en el techo más bajo (Brand Growth);
// «A la medida» se rige por su ficha. Sin ficha (Inherent y la marca personal) no hay nivel: null.
// → { id, nombre, supuesto } (supuesto: la ficha no trae nivel y se tomó Brand Growth) o null.
export async function nivelDeOferta(slug) {
  const f = await ficha(slug);
  if (!f.hay) return null;
  return f.nivel ? { id: f.nivel.id, nombre: f.nivel.nombre, supuesto: false } : { id: 'growth', nombre: 'Brand Growth', supuesto: true };
}
async function selladoDe(slug) {
  return (await db.list(COLL_ENT)).filter((d) => d.tool === 'offer-architect' && lc(d.client_slug) === lc(slug) && !d.archivado && esAprobado(d))
    .sort((a, z) => tiempoDe(z.aprobado?.en) - tiempoDe(a.aprobado?.en))[0] || null;
}
export async function sellarOferta(slug, u, aprobar, { v } = {}) {
  if (aprobar) {
    const cur = await ultimoDe('offer-architect', slug);
    if (!cur || !conContenido(cur)) return { ok: true, espejo: null };
    if (esAprobado(cur) && cur.aprobado?.version === cur.version) return { ok: true, espejo: cur.id }; // el otro bloque ya lo selló con esta versión
    if (v == null || v === '' || !Number.isInteger(Number(v))) return malSello(400, 'FALTA_V', 'Esta oferta se aprueba desde Offer Architect: ahí ves la versión que apruebas.');
    if (Number(v) !== cur.v) return malSello(409, 'CONFLICTO', CONFLICTO);
    const f = faltasDe(cur, { nivelId: (await nivelDeOferta(slug))?.id });
    if (f.length) return malSello(400, 'FALTAS', f.join(' · '), { faltas: f });
    const nota = `${cur.estado} → Aprobado · con el bloque Oferta`;
    const d = await db.update(COLL_ENT, cur.id, { ...cur, estado: 'Aprobado', aprobado: { por: u.email, en: ahora(), version: cur.version }, historial: [...hist(cur), entrada(u, 'estado', cur.version, nota)] }, cur.v, u.email);
    return d ? { ok: true, espejo: d.id } : malSello(409, 'CONFLICTO', CONFLICTO);
  }
  for (let i = 0; i < 2; i++) {
    const cur = (await selladoDe(slug)) || (await ultimoDe('offer-architect', slug));
    if (!cur || !esAprobado(cur)) return { ok: true, espejo: cur?.id ?? null };
    const nota = `${cur.estado} → Borrador · el CEO reabrió el bloque`;
    const d = await db.update(COLL_ENT, cur.id, { ...cur, estado: 'Borrador', aprobado: null, historial: [...hist(cur), entrada(u, 'estado', cur.version, nota)] }, cur.v, u.email);
    if (d) return { ok: true, espejo: d.id };
  }
  return malSello(409, 'CONFLICTO', CONFLICTO);
}
// ¿El otro bloque de la oferta (Modelo si es Oferta, Oferta si es Modelo) sigue aprobado?
const otroDeOfertaAprobado = async (slug, bloque) => (await db.get(COLL, docId(slug, bloque === 'oferta' ? 'modelo' : 'oferta')).catch(() => null))?.estado === 'aprobado';
// Qué bloques de la oferta (Oferta, Modelo de dinero) están aprobados: con alguno, la oferta está cerrada hasta que el CEO lo reabra.
export async function ofertaAprobada(slug) {
  const docs = await Promise.all(['oferta', 'modelo'].map((b) => db.get(COLL, docId(slug, b)).catch(() => null)));
  return ['oferta', 'modelo'].filter((b, i) => docs[i]?.estado === 'aprobado').map((b) => bloqueDe(b).nombre);
}

// El juicio de Laya sobre la etapa (lo último), para mostrarlo como propuesta.
async function propuestaLaya(slug) {
  const id = docId(slug, 'diagnostico');
  const js = (await db.list('judgments')).filter((j) => j.target?.coll === COLL && j.target?.id === id);
  const puerta = puertasDe(await db.get('settings', GATES_ID).catch(() => null)).etapa;
  const r = resumenLaya(js, puerta);
  const j = r.ultimos?.etapa, e = etapaDeRespuesta(j?.answer);
  return { estado: r.estado, chip: r.chip, n: e?.n ?? null, prob: Number.isFinite(j?.prob) ? j.prob : null, why: j?.why || '', engine: j?.engine || null, at: j?.at || null };
}

// ---------- El texto que se le da a Laya para proponer la etapa ----------
export async function contextoEtapa(slug) {
  const root = intel.rootOf(slug), f = await ficha(slug);
  const leer = async (rel) => { const x = await readFile(`${root}/${rel}`); return x ? intel.limpiar(x.content, 'sin-costos').md : ''; };
  return { nombre: f.nombre, nivel: f.nivel?.nombre || '', comprension: await leer('00-onboarding/comprension.md'), nucleo: await leer('01-estrategia/nucleo.md') };
}

// ---------- Las fuentes: hormozi-brain/references ----------
const BASE = `${HORMOZI}/references`;
const CARPETAS = ['books', 'roadmap', 'sops', 'briefs'];
const RUTA_OK = /^(books|roadmap|sops|briefs)(\/[A-Za-z0-9][A-Za-z0-9._-]*)+\.md$/;
let SNAP;
function fuentesSnap() {
  if (SNAP !== undefined) return SNAP;
  try { SNAP = JSON.parse(fs.readFileSync(new URL('../_data/fuentes.json', import.meta.url), 'utf8')); } catch { SNAP = null; }
  return SNAP;
}
const usaSnap = () => !process.env.LOCAL_REPO && fuentesSnap();
async function leerFuente(rel) {
  if (usaSnap()) return fuentesSnap().files[rel] ?? null;
  const f = await readFile(`${BASE}/${rel}`); return f ? f.content : null;
}
async function listaFuentes() {
  if (usaSnap()) return Object.keys(fuentesSnap().files).filter((r) => RUTA_OK.test(r));
  if (process.env.LOCAL_REPO || repoSource() === 'build') return listFiles(BASE).map((p) => p.slice(BASE.length + 1)).filter((r) => RUTA_OK.test(r));
  const out = [], q = CARPETAS.map((c) => `${BASE}/${c}`);
  while (q.length && out.length < 400) { const d = q.shift(); for (const it of await listDir(d)) { if (it.type === 'dir') q.push(it.path); else if (RUTA_OK.test(it.path.slice(BASE.length + 1))) out.push(it.path.slice(BASE.length + 1)); } }
  return out;
}
const SIN = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
function frontmatter(txt) {
  const m = /^---\n([\s\S]*?)\n---/.exec(String(txt)); const o = {};
  if (m) for (const ln of m[1].split('\n')) { const k = /^([a-z_]+):\s*"?(.*?)"?\s*$/.exec(ln); if (k) o[k[1]] = k[2]; }
  return o;
}
let INDICE = null, INDICE_AT = 0;
// [{ ruta, src, sec, rango:[a,b]|null, titulo }] — de la cabecera de cada archivo (formato_cita, capitulo|guia|etapa, paginas_pdf).
export async function indice() {
  if (INDICE && Date.now() - INDICE_AT < 600_000) return INDICE;
  const out = [];
  for (const ruta of await listaFuentes()) {
    const txt = await leerFuente(ruta); if (txt == null) continue;
    const fm = frontmatter(txt.slice(0, 2500));
    const cita = /^\[([^\]]+)\]/.exec(fm.formato_cita || '')?.[1]?.split('|').map((x) => x.trim()) || [];
    const src = cita[0] || fm.fuente || ruta, sec = fm.capitulo || fm.guia || fm.etapa || cita[1] || '';
    const r = /(\d+)\s*[–-]\s*(\d+)/.exec(fm.paginas_pdf || '');
    out.push({ ruta, src, sec, rango: r ? [+r[1], +r[2]] : null, titulo: [src, sec].filter(Boolean).join(' · ') });
  }
  INDICE = out; INDICE_AT = Date.now(); return out;
}

// Una cita (de extraerCitas) → el archivo que cita, con el pasaje exacto: { ok, raw, ruta, titulo, t, p }.
export async function resolverCita(c) {
  const idx = await indice(), { t, p } = dondeDe(c);
  const base = { raw: c.raw, t, p };
  if (c.etapa != null) { const e = etapaDe(c.etapa); const it = e && idx.find((x) => x.ruta === e.video); return it ? { ok: true, ...base, ruta: it.ruta, titulo: `Roadmap · Etapa ${e.n} (video)` } : { ok: false, ...base }; }
  const sk = SIN(c.src), delSrc = idx.filter((x) => SIN(x.src) === sk);
  const lista = delSrc.length ? delSrc : idx.filter((x) => SIN(x.src).startsWith(sk) || sk.startsWith(SIN(x.src)));
  let hit = null;
  if (c.cap != null) hit = lista.find((x) => new RegExp(`^${c.cap}\\.`).test(x.sec));
  if (!hit && c.sec) { const sc = SIN(c.sec); hit = lista.find((x) => SIN(x.sec) === sc) || lista.find((x) => sc && (SIN(x.sec).includes(sc) || sc.includes(SIN(x.sec))) && SIN(x.sec).length > 3); }
  if (!hit && p != null) hit = lista.find((x) => x.rango && p >= x.rango[0] && p <= x.rango[1]);
  if (!hit) return { ok: false, ...base };
  return { ok: true, ...base, ruta: hit.ruta, titulo: hit.titulo };
}
export async function citasDe(texto) { return Promise.all(extraerCitas(cap(texto, 60_000)).map(resolverCita)); }

// El archivo, listo para mostrar: sin la cabecera ni los comentarios, y con el pasaje (tiempo o página) ubicado.
const MAX_VENTANA = 160_000;
export async function fuenteDe(ruta, { t = null, p = null, completo = false } = {}) {
  if (typeof ruta !== 'string' || ruta.length > 200 || ruta.includes('..') || !RUTA_OK.test(ruta)) return null;
  const raw = await leerFuente(ruta); if (raw == null) return null;
  const fm = frontmatter(raw.slice(0, 2500));
  const lines = raw.replace(/^---\n[\s\S]*?\n---\n?/, '').split('\n').filter((l) => !/^\s*<!--.*-->\s*$/.test(l));
  let ancla = null;
  const tt = tiempo(t);
  if (tt) {
    let last = null;
    for (let i = 0; i < lines.length; i++) { const m = /^\[(\d\d:\d\d:\d\d)\]/.exec(lines[i]); if (m) { if (m[1] <= tt) last = i; else { if (last === null) last = i; break; } } }
    ancla = last;
  } else if (p != null && Number.isFinite(+p)) {
    const re = new RegExp(`^\\[[^\\]]*\\|\\s*pág\\. PDF ${+p}\\]`); const i = lines.findIndex((l) => re.test(l)); ancla = i >= 0 ? i : null;
  }
  const total = lines.length, size = raw.length;
  let desde = 0, hasta = total;
  if (!completo && size > MAX_VENTANA) {
    if (ancla !== null) { desde = Math.max(0, ancla - 80); hasta = Math.min(total, ancla + 320); } else hasta = Math.min(total, 1200);
  }
  const win = lines.slice(desde, hasta);
  return { ruta, titulo: [fm.fuente?.split(' — ')[0], fm.capitulo || fm.guia || fm.etapa].filter(Boolean).join(' · ') || ruta, tipo: ruta.startsWith('roadmap/guides') ? 'guía' : ruta.startsWith('roadmap') ? 'video' : ruta.startsWith('sops') ? 'SOP' : ruta.startsWith('briefs') ? 'plantilla' : 'libro',
    contenido: cap(win.join('\n'), 450_000), ancla: ancla === null ? null : ancla - desde, desde, hasta, total, recortado: desde > 0 || hasta < total };
}

// ---------- Las rutas (api/index.js las registra con estrategia.rutas(on)) ----------
const blocksOf = (docs, hay, etapa) => Object.fromEntries(BLOQUES.map((b) => [b.id, estadoDe(docs[b.id], Boolean(hay[b.id]) || (b.id === 'diagnostico' && Boolean(etapa)))]));

// ---------- La Library como contexto del chat ----------
// Solo documentos de texto (SOPs, playbooks, entrevistas, notas): los archivos de Drive todavía no. Quien no ve la Library no la recibe.
const veLibrary = (u) => u.areas.includes('library') && canRead(u.role, 'docs');
// El texto de un documento: su cuerpo y, si es entrevista, sus respuestas y su diagnóstico.
function textoDoc(d) {
  const partes = [String(d.body || '').trim()];
  const r = Object.entries(d.answers || {}).filter(([, v]) => String(v || '').trim());
  if (r.length) partes.push('Respuestas:\n' + r.map(([k, v]) => `${k}: ${v}`).join('\n'));
  if (d.diagnosis) partes.push('Diagnóstico:\n' + String(d.diagnosis).trim());
  return partes.filter(Boolean).join('\n\n');
}
const carpetaDe = (folders, d) => (d.folder_id ? pathLabel(folders, d.folder_id) : '');

export function rutas(on) {
  // La lista: un cliente por tarjeta, con su nivel, su etapa y el estado de sus 5 bloques.
  on('GET', 'estrategia', async (req, res) => {
    const u = await acceso(req, res); if (!u) return;
    const sc = await scoper(u);
    const slugs = ['inherent', ...(await intel.clientSlugs()).filter((s) => !sc || sc.client(s))];
    const all = await db.list(COLL), costos = u.role === 'ceo';
    const clientes = await Promise.all(slugs.map(async (slug) => {
      const f = await ficha(slug), docs = Object.fromEntries(all.filter((d) => d.slug === slug).map((d) => [d.bloque, d]));
      let hay = {};
      try { const ir = await intelDe(slug, costos); for (const b of BLOQUES) hay[b.id] = entregablesDe(b, ir).hay; } catch { hay = {}; }
      const bloques = blocksOf(docs, hay, docs.diagnostico?.etapa);
      const e = docs.diagnostico?.etapa;
      return { slug, nombre: f.nombre, nivel: f.nivel, plan: f.plan, hayFicha: f.hay, etapa: e ? { n: e.n, confirmada: Boolean(e.confirmada) } : null, bloques, aprobados: Object.values(bloques).filter((x) => x === 'aprobado').length };
    }));
    res.json({ clientes, puede: { editar: edits(u, 'estrategia'), aprobar: u.role === 'ceo' } });
  });

  // Las fuentes: una ruta cerrada (libros, roadmap, sops, briefs). Antes que /:slug, que si no la tomaría por un cliente.
  on('GET', 'estrategia/fuente', async (req, res) => {
    const u = await acceso(req, res); if (!u) return;
    const f = await fuenteDe(String(req.query.ruta || ''), { t: req.query.t || null, p: req.query.p ?? null, completo: req.query.completo === '1' });
    if (!f) return res.status(404).json({ error: 'No existe esa fuente' });
    res.json(f);
  });
  // Las citas de un texto del chat → los archivos que citan (para los links del contexto).
  on('POST', 'estrategia/citas', async (req, res) => {
    const u = await acceso(req, res); if (!u) return;
    res.json({ citas: await citasDe(body(req).texto) });
  });

  // La Library: la lista de documentos de texto, para elegir cuáles adjuntar al chat.
  on('GET', 'estrategia/library', async (req, res) => {
    const u = await acceso(req, res); if (!u) return;
    if (!veLibrary(u)) return res.status(403).json({ error: 'No tienes acceso a la Library' });
    const [docs, folders] = await Promise.all([db.list('docs'), db.list('folders')]);
    const lista = docs.map((d) => ({ d, t: textoDoc(d) })).filter((x) => x.t)
      .map(({ d, t }) => ({ id: d.id, titulo: d.title || 'Sin título', tipo: d.kind || 'Nota', carpeta: carpetaDe(folders, d), folder: d.folder_id || '_', en: d._meta?.updated_at || null, largo: t.length }))
      .sort((a, b) => String(b.en || '').localeCompare(String(a.en || '')));
    res.json({ docs: lista, max: MAX_ADJ });
  });
  // El texto de los documentos adjuntos, recortado para que quepa en el mensaje del chat.
  on('POST', 'estrategia/library/textos', async (req, res) => {
    const u = await acceso(req, res); if (!u) return;
    if (!veLibrary(u)) return res.status(403).json({ error: 'No tienes acceso a la Library' });
    const ids = [...new Set((Array.isArray(body(req).ids) ? body(req).ids : []).map(String))].slice(0, MAX_ADJ);
    const folders = await db.list('folders');
    const docs = (await Promise.all(ids.map((id) => db.get('docs', id)))).filter(Boolean);
    const cada = Math.floor(MAX_ADJ_TEXTO / Math.max(1, docs.length));
    res.json({ docs: docs.map((d) => { const t = textoDoc(d); return { id: d.id, titulo: d.title || 'Sin título', tipo: d.kind || 'Nota', carpeta: carpetaDe(folders, d), folder: d.folder_id || '_', contenido: cap(t, cada), recortado: t.length > cada }; }),
      faltan: ids.filter((id) => !docs.some((d) => d.id === id)) });
  });

  // Un cliente: sus 5 bloques con su entregable del repo, su estado, su límite de nivel y su borrador.
  // La estrategia en vivo (lo que se concreta en el chat): leer va con la pantalla; aquí se guarda y se aprueba.
  // Quien edita Estrategia la llena; solo el CEO la aprueba. Aprobada, queda cerrada hasta que el CEO la reabra.
  // Se escribe con db.update y la v que se leyó (nunca upsert: no deja huella en audit y pisa lo que otro escribió en medio). Si alguien cambió el
  // documento antes (otro editor, el X-Ray, el CEO que aprueba), se lee otra vez y se reaplica el parche; con dos intentos fallidos, 409.
  // El parche nunca toca «aprobado»: eso es solo de viva/aprobar.
  on('PUT', 'estrategia/:slug/viva', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u) return;
    const id = vivaId(slug), parche = limpiarParche(body(req).parche);
    for (let i = 0; i < 2; i++) {
      const cur = await db.get(COLL, id);
      if (cur?.aprobado) return res.status(409).json({ error: 'La estrategia está aprobada: el CEO tiene que reabrirla para cambiarla.', code: 'APROBADO' });
      if (!Object.keys(parche).length) return res.json({ ok: true, viva: cur?.viva || {}, cambiadas: [] });
      const { viva, cambiadas } = aplicar(cur?.viva || {}, parche, ahora());
      const d = await escribe(COLL, id, cur, { ...(cur || {}), slug, bloque: 'viva', viva }, u.email);
      if (d) return res.json({ ok: true, viva: d.viva, cambiadas });
    }
    res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
  });
  // Aprobar mira las filas del documento que va a escribir: si el roadmap cambió en medio, la v ya no coincide y se vuelve a leer.
  on('POST', 'estrategia/:slug/viva/aprobar', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO aprueba la estrategia' });
    const id = vivaId(slug), aprobar = body(req).aprobar !== false;
    for (let i = 0; i < 2; i++) {
      const cur = await db.get(COLL, id), rm = cur?.viva?.roadmap;
      if (aprobar && !(rm?.items?.length || rm?.filas?.length)) return res.status(400).json({ error: 'Sin filas no se aprueba', code: 'SIN_FILAS' });
      if (!cur) return res.json({ ok: true, aprobado: null }); // reabrir lo que nunca se guardó
      const d = await escribe(COLL, id, cur, { ...cur, slug, bloque: 'viva', aprobado: aprobar ? { por: u.email, en: ahora() } : null }, u.email);
      if (d) return res.json({ ok: true, aprobado: d.aprobado });
    }
    res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
  });

  // La diana (Customer Bullseye): sources cfg-<slug>.bullseye (la casa de siempre, que leen Marketing › Audience y la herramienta planner del
  // conector) con «audience» al día, y su espejo en deliverables. Quien edita Estrategia la guarda (la marca personal, solo el CEO).
  // Sin ficha de oferta, 409; con la estrategia aprobada queda en solo lectura (409) hasta que el CEO la reabra.
  on('PUT', 'estrategia/:slug/bullseye', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await accesoMarca(req, res, slug, { write: true }); if (!u) return;
    if (await estrategiaCerrada(slug)) return res.status(409).json({ error: 'La estrategia está aprobada: el CEO tiene que reabrirla para cambiar la diana.', code: 'APROBADO' });
    if (slug !== 'personal' && slug !== 'inherent' && !(await ficha(slug)).hay) return res.status(409).json({ error: 'Sin ficha de oferta: el alcance contratado es el techo', code: 'SIN_FICHA' });
    const x = body(req);
    if (JSON.stringify(x.bullseye ?? null).length > 60_000) return res.status(413).json({ error: 'La diana es demasiado grande', code: 'GRANDE' });
    const contenido = diana.limpiar(x.bullseye);
    const g = await guardarDiana(slug, contenido, u.email, { v: x.v });
    if (g.invalida) return res.status(400).json({ error: 'A la diana le falta el centro o alguno de los 5 niveles' });
    if (g.conflicto) return res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
    const e = await espejoDiana(slug, contenido, u);
    if (!e) return res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
    res.json({ ok: true, bullseye: contenido, v: g.v, entregable: { id: e.id, v: e.v, version: e.version, estado: e.estado } });
  });

  // Escribir en el repo desde el OS: la ficha de oferta (cuando falta) y los documentos de la carpeta del cliente.
  // Solo el CEO: lo que está en el repo ya pasó por él. Cada guardado es un commit; si el archivo cambió desde que se abrió,
  // no se pisa (409) y hay que abrirlo otra vez.
  const soloCeo = (u, res) => { if (u.role === 'ceo') return true; res.status(403).json({ error: 'Solo el CEO escribe en el repo' }); return false; };
  const conflicto = (res) => res.status(409).json({ error: 'Este archivo cambió en el repo desde que lo abriste. Ciérralo y ábrelo otra vez.', code: 'CONFLICTO' });
  on('PUT', 'estrategia/:slug/ficha', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u || !soloCeo(u, res)) return;
    const x = body(req), f = await ficha(slug);
    if (f.hay) return res.status(409).json({ error: 'Este cliente ya tiene ficha: edítala desde sus documentos.', code: 'YA_HAY' });
    const d = Object.fromEntries(Object.entries(x.campos || {}).map(([k, v]) => [k, cap(v, 600)]));
    if (!d.nivel) return res.status(400).json({ error: 'Elige el nivel contratado' });
    const w = await escribirSeguro(`${intel.rootOf(slug)}/00-onboarding/plan-contratado.md`, fichaMd({ ...d, nombre: f.nombre }), null, `ficha de oferta de ${f.nombre}`);
    if (w.conflict) return conflicto(res);
    olvidar(); res.json({ ok: true });
  });
  on('GET', 'estrategia/:slug/doc', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u || !soloCeo(u, res)) return;
    const ruta = String(req.query.ruta || ''); if (!rutaEditable(ruta)) return res.status(400).json({ error: 'Ese archivo no se edita desde aquí' });
    const f = await readFile(`${intel.rootOf(slug)}/${ruta}`); if (!f) return res.status(404).json({ error: 'No encontré ese archivo en el repo' });
    res.json({ ruta, contenido: f.content, base: huella(f.content) });
  });
  on('PUT', 'estrategia/:slug/doc', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u || !soloCeo(u, res)) return;
    const x = body(req), ruta = String(x.ruta || ''), contenido = String(x.contenido ?? '');
    if (!rutaEditable(ruta)) return res.status(400).json({ error: 'Ese archivo no se edita desde aquí' });
    if (!x.base) return res.status(400).json({ error: 'Abre el archivo antes de guardarlo' });
    if (!contenido.trim()) return res.status(400).json({ error: 'El archivo quedaría vacío: no lo guardé' });
    if (contenido.length > 200_000) return res.status(400).json({ error: 'El archivo es muy largo para editarlo aquí' });
    const w = await escribirSeguro(`${intel.rootOf(slug)}/${ruta}`, contenido.replace(/\r\n/g, '\n'), String(x.base), `edita ${ruta}`);
    if (w.conflict) return conflicto(res);
    olvidar(); res.json({ ok: true, base: huella(contenido.replace(/\r\n/g, '\n')) });
  });

  on('GET', 'estrategia/:slug', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug); if (!u) return;
    const [f, docs, viva] = await Promise.all([ficha(slug), docsDe(slug), db.get(COLL, vivaId(slug)).catch(() => null)]);
    const ir = await intelDe(slug, u.role === 'ceo');
    const etapa = docs.diagnostico?.etapa || null;
    const bloques = BLOQUES.map((b) => {
      const e = entregablesDe(b, ir), d = docs[b.id];
      return { id: b.id, n: b.n, nombre: b.nombre, corto: b.corto, pide: b.pide, estado: estadoDe(d, e.hay || (b.id === 'diagnostico' && Boolean(etapa))), limite: f.nivel ? limiteDe(b.id, f.nivel.id) : null,
        borrador: d?.borrador || null, aprobado: d?.aprobado || null, entregables: e.entregables, faltan: e.faltan, hayRepo: e.hay, material: b.material };
    });
    res.json({ slug, nombre: f.nombre, nivel: f.nivel, plan: f.plan, ficha: { hay: f.hay, linea: f.linea, incluye: f.incluye, fuera: f.fuera, pipeline: f.pipeline }, carpeta: intel.rootOf(slug),
      etapa, propuesta: await propuestaLaya(slug), avatar: ir.avatar, bloques, viva: viva?.viva || {}, vivaAprobada: viva?.aprobado || null, puede: { editar: edits(u, 'estrategia'), aprobar: u.role === 'ceo', library: veLibrary(u) } });
  });

  // Guardar el borrador del entregable (lo que sale del chat). No toca el repo: pasarlo al repo es después y con el OK del CEO.
  on('PUT', 'estrategia/:slug/:bloque/borrador', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u) return;
    const b = bloqueDe(req.params.bloque); if (!b) return res.status(404).json({ error: 'Ese bloque no existe' });
    const id = docId(slug, b.id), cur = await db.get(COLL, id), x = body(req);
    if (cur?.estado === 'aprobado') return res.status(409).json({ error: 'Este bloque está aprobado: el CEO tiene que reabrirlo para cambiarlo.', code: 'APROBADO' });
    const texto = String(x.texto ?? '').trim();
    if (texto.length > MAX_BORRADOR) return res.status(413).json({ error: `El borrador pasa de ${MAX_BORRADOR / 1000} KB` });
    const fuentes = (Array.isArray(x.fuentes) ? x.fuentes : []).slice(0, 30).map((s) => ({ ruta: RUTA_OK.test(String(s?.ruta)) ? String(s.ruta) : '', titulo: cap(s?.titulo, 160), t: tiempo(s?.t), p: Number.isFinite(+s?.p) && s?.p != null ? +s.p : null })).filter((s) => s.ruta);
    const d = await db.upsert(COLL, id, { slug, bloque: b.id, estado: '', aprobado: null, borrador: texto ? { texto, por: u.email, en: ahora(), fuentes } : null }, u.email);
    res.json({ ok: true, bloque: b.id, borrador: d.borrador, estado: estadoDe(d, false) });
  });

  // Aprobar (o reabrir) un bloque: solo el CEO.
  on('POST', 'estrategia/:slug/:bloque/aprobar', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO aprueba la estrategia' });
    const b = bloqueDe(req.params.bloque); if (!b) return res.status(404).json({ error: 'Ese bloque no existe' });
    const id = docId(slug, b.id), cur = await db.get(COLL, id), x = body(req), aprobar = x.aprobar !== false;
    if (!aprobar) {
      // Reabrir Oferta o Modelo regresa a Borrador el entregable de Offer Architect (no hay otro botón para abrirlo), pero solo si el otro
      // bloque de la oferta no sigue aprobado: el espejo lleva el OK de los dos.
      if (esDeOferta(b.id) && !(await otroDeOfertaAprobado(slug, b.id))) { const r = await sellarOferta(slug, u, false); if (!r.ok) return res.status(r.status).json({ error: r.error, code: r.code }); }
      const d = await db.upsert(COLL, id, { slug, bloque: b.id, estado: '', aprobado: null }, u.email); return res.json({ ok: true, bloque: b.id, estado: estadoDe(d, true) });
    }
    const hay = entregablesDe(b, await intelDe(slug, true)).hay;
    if (b.id === 'diagnostico' && !cur?.etapa?.confirmada) return res.status(400).json({ error: 'Primero confirma la etapa del negocio.' });
    // El contenido de Oferta y Modelo también puede estar en el entregable de Offer Architect (la herramienta), no solo en el borrador del chat.
    const enHerramienta = esDeOferta(b.id) && conContenido(await ultimoDe('offer-architect', slug));
    if (!cur?.borrador?.texto && !hay && !enHerramienta && b.id !== 'diagnostico') return res.status(400).json({ error: 'No hay nada que aprobar: este bloque está vacío.' });
    // Se aprueba con el bloque: el entregable de Offer Architect queda Aprobado (con su versión) en la misma ruta, con la v que leyó el CEO y sin faltas.
    if (esDeOferta(b.id)) { const r = await sellarOferta(slug, u, true, { v: x.v }); if (!r.ok) return res.status(r.status).json({ error: r.error, code: r.code, ...(r.faltas ? { faltas: r.faltas } : {}) }); }
    const d = await db.upsert(COLL, id, { slug, bloque: b.id, estado: 'aprobado', aprobado: { por: u.email, en: ahora() } }, u.email);
    res.json({ ok: true, bloque: b.id, estado: 'aprobado', aprobado: d.aprobado });
  });

  // La etapa del roadmap (0 a 9). Quien edita Estrategia la propone; solo el CEO la confirma (y la cambia una vez confirmada).
  on('PUT', 'estrategia/:slug/etapa', async (req, res) => {
    const slug = String(req.params.slug || ''), u = await acceso(req, res, slug, { write: true }); if (!u) return;
    const x = body(req), n = Number(x.n);
    if (!Number.isInteger(n) || !etapaDe(n)) return res.status(400).json({ error: 'La etapa va de 0 a 9' });
    const id = docId(slug, 'diagnostico'), cur = await db.get(COLL, id);
    if (cur?.estado === 'aprobado') return res.status(409).json({ error: 'El Diagnóstico está aprobado: el CEO tiene que reabrirlo para cambiar la etapa.', code: 'APROBADO' });
    if (cur?.etapa?.confirmada && u.role !== 'ceo') return res.status(403).json({ error: 'La etapa ya la confirmó el CEO: solo él la cambia.' });
    if (x.confirmar && u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO confirma la etapa.' });
    const etapa = { n, confirmada: Boolean(x.confirmar) && u.role === 'ceo', por: u.email, en: ahora(), fuente: x.fuente === 'laya' ? 'laya' : 'manual' };
    const d = await db.upsert(COLL, id, { slug, bloque: 'diagnostico', etapa }, u.email);
    res.json({ ok: true, etapa: d.etapa, estado: estadoDe(d, true) });
  });
}

