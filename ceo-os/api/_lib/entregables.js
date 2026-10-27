// Los entregables de las herramientas del OS (servidor): la colección «deliverables» (y sus versiones, «deliverable_versions»),
// un documento por entregable. Las reglas viven en public/js/entregables.js; aquí está el acceso y la escritura.
//   Borrador → En revisión → Aprobado → Entregado. Aprueba quien dice el registro de herramientas (aprueba: 'ceo' | 'coo').
// Nada de esta colección pasa por /api/db/deliverables (la ruta genérica responde 404). Nada se borra: se archiva.
// Cambiar el contenido crea una versión nueva (<id>--v<n>, solo se crea) y un Aprobado vuelve a Borrador.
// Los costos del cliente (Money Model Lab) solo salen a quien ve costos: a los demás se les quitan al leer y se conservan al guardar.
// Toda escritura pasa la versión que se leyó: la base devuelve null si alguien cambió el doc antes (409). Nunca se hace upsert: no deja huella en audit.
// Strategy (Fase 3a): al guardar una diana o un X-Ray el servidor los deja en su casa (sources cfg-<slug> · la estrategia en vivo); Offer Architect
// no se aprueba aquí (se aprueba con el bloque Oferta, solo el CEO: 409 APRUEBA_BLOQUE) y Brand Growth no le cambia el stack (403).
import * as db from './db.js';
import * as results from './results.js';
import { guard, scoper, edits, levelOf, seesCosts } from './access.js';
import { body } from './http.js';
import { ficha, estrategiaCerrada, dianaASuCasa, xrayAViva, ofertaAprobada, nivelDeOferta, limpiarDe } from './estrategia.js';
import { herramientaDe } from '../../public/js/herramientas.js';
import { alcanceConsulting, consultingAbierto, textoAlcanceConsulting } from '../../public/js/llm/modos.js';
import * as oferta from '../../public/js/strategy/oferta.js';
import { COLL, COLL_V, AREA_DE, pasoPermitido, puedeAprobar, limpiarEntregable, faltas, cambioDeContenido, idVersion, siguienteDe, tareasDeEntregable, canon } from '../../public/js/entregables.js';

// Constantes locales, como en avatares.js y ads-studio.js (el slug es el nombre de la carpeta del cliente: sin «_» al inicio).
const slugOk = (s) => /^[a-z0-9][\w-]{1,59}$/.test(String(s || ''));
const idOk = (s) => /^[\w.-]{1,120}$/.test(String(s || ''));
const MAX_BYTES = 400_000;
const SIN_FICHA = 'Sin ficha de oferta: el alcance contratado es el techo';
const CONFLICTO = 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.';
const ahora = () => new Date().toISOString();
const lc = (x) => String(x || '').toLowerCase();
const hist = (d) => (Array.isArray(d.historial) ? d.historial : []);
const nota = (x) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
const entrada = (u, accion, version, texto = '') => ({ en: ahora(), por: u.email, accion, nota: nota(texto), version });
// La versión que mandó quien edita (la que leyó); sin ella, la de hoy.
const vDe = (b, cur) => (b?.v != null && Number.isInteger(Number(b.v)) ? Number(b.v) : cur.v);
const tiempo = (x) => { const t = new Date(x).getTime(); return Number.isFinite(t) ? t : 0; };
const iso = (x) => { const t = tiempo(x); return t ? new Date(t).toISOString() : ''; };
// La foto de una versión: lo que se compara y se restaura. Lo que cambia después (historial, tareas, resultado) no va.
const versionDe = (d, n) => ({ deliverable_id: d.id, version: n, tool: d.tool, ws: d.ws, pestana: d.pestana, titulo: d.titulo, client_slug: d.client_slug, ciclo: d.ciclo, project_id: d.project_id, estado: d.estado, contenido: d.contenido, criterios: d.criterios, entradas: d.entradas, ia: d.ia });

// ---------- El alcance del cliente ----------
// Sin ficha de oferta no hay herramienta (409). Consulting: el nivel y la ficha ponen el techo (alcanceConsulting, el mismo del chat).
// Inherent: si su ficha no existiera se deja pasar (es la casa). La marca «personal» del CEO no tiene ficha: solo Consulting la pide.
const ABIERTO = { abierto: true, code: '', texto: '' };
async function alcanceDe(ws, slug) {
  if (slug === 'personal') return ws === 'consulting' ? { abierto: false, code: 'SIN_FICHA', texto: SIN_FICHA } : ABIERTO;
  const f = await ficha(slug);
  if (!f.hay) return slug === 'inherent' ? ABIERTO : { abierto: false, code: 'SIN_FICHA', texto: SIN_FICHA };
  if (ws !== 'consulting') return ABIERTO;
  const a = alcanceConsulting(f.nivel, f), texto = textoAlcanceConsulting(f.nivel, f);
  if (a === 'sin-ficha') return { abierto: false, code: 'SIN_FICHA', texto: texto || SIN_FICHA };
  if (!consultingAbierto(a)) return { abierto: false, code: 'FUERA_DEL_ALCANCE', texto };
  return { abierto: true, code: '', texto };
}
const TEXTO_APROBADA = 'La estrategia está aprobada: solo lectura hasta que el CEO la reabra';
// Brand Growth solo elige qué oferta empujar y su mensaje: el stack y las variaciones (y la escalera, que es de Partnership) se bloquean aquí,
// no solo en la interfaz. Lo decide el módulo puro (oferta.cambiaBloqueado) con el nivel de la ficha; «A la medida» manda su ficha y no se bloquea.
// Una ficha que existe pero cuyo nivel no se reconoce NO deja pasar nada: se aplica el techo más bajo (Brand Growth). Solo pasan sin nivel
// Inherent y la marca personal, que no tienen ficha (nivelDeOferta devuelve null).
async function ofertaMal(tool, slug, antes, despues) {
  if (tool?.id !== 'offer-architect') return null;
  const n = await nivelDeOferta(slug);
  if (!n || n.id === 'medida') return null;
  const partes = oferta.cambiaBloqueado(antes ?? (typeof oferta.vacio === 'function' ? oferta.vacio() : {}), despues, n.id);
  if (!partes?.length) return null;
  const con = n.supuesto ? 'La ficha no dice el nivel contratado y se aplica el más bajo (Brand Growth). Esto' : `Con ${n.nombre} esto`;
  return { error: `${con} no se cambia: ${partes.join(', ')}. Se escala al CEO.`, code: 'FUERA_DEL_ALCANCE', partes };
}
// La oferta aprobada (el bloque Oferta o el de Modelo de dinero) no se cambia ni se esquiva: ni editando, ni con un Borrador nuevo, ni
// archivando o desarchivando el espejo. Hasta que el CEO reabra el bloque, 409 APROBADO. true = ya respondió.
async function ofertaCerrada(res, slug) {
  const bloques = await ofertaAprobada(slug);
  if (!bloques.length) return false;
  res.status(409).json({ error: `La oferta está aprobada (${bloques.join(' y ')}): el CEO tiene que reabrir ${bloques.length > 1 ? 'esos bloques' : 'ese bloque'} para cambiarla.`, code: 'APROBADO' });
  return true;
}
// Lo que una herramienta de Strategy deja en su casa al guardar (lo hace el servidor, no la interfaz): la diana → sources cfg-<slug>.bullseye;
// el X-Ray → la estrategia en vivo. Devuelve el aviso si no pudo (el entregable ya quedó guardado; guardar otra vez lo repite sin duplicar nada).
async function aSuCasa(u, d) {
  if (d.tool === 'customer-bullseye') return (await dianaASuCasa(d.client_slug, d.contenido, u)).ok ? null : 'La diana cambió en Fuentes justo ahora: vuelve a guardar';
  if (d.tool === 'business-xray') return (await xrayAViva(d.client_slug, d.contenido, u)).ok ? null : 'La estrategia en vivo cambió justo ahora: vuelve a guardar';
  return null;
}

// ---------- Acceso ----------
// guard del área del workspace (sin abrirle la puerta al rol cliente: el cliente no entra) · vista «resumen» → 403 (salvo leer el Performance Center)
// · «personal» solo el CEO · el alcance por cliente (scoper) · al escribir: ficha, alcance de Consulting y la estrategia en vivo.
// cierra: la estrategia en vivo aprobada cierra Strategy de ese cliente (409 APROBADO). Lo que cambia el contenido o abre un
// borrador nuevo la respeta; pasar de estado, convertir en tareas y anotar resultados no.
async function abre(req, res, { ws, slug, write = false, tool = '', cierra = write }) {
  const area = AREA_DE[ws];
  if (!area) { res.status(400).json({ error: 'Ese workspace no existe' }); return null; }
  const u = await guard(req, res, area, { write }); if (!u) return null;
  if (u.role === 'client') { res.status(403).json({ error: 'Sin acceso' }); return null; }
  if (!slugOk(slug)) { res.status(400).json({ error: 'Falta el cliente' }); return null; }
  if (u.role !== 'ceo' && levelOf(u, area) === 'resumen' && !(!write && tool === 'marketing-performance-center')) { res.status(403).json({ error: 'Tu vista de esta área es «resumen»: solo el rendimiento' }); return null; }
  if (slug === 'personal' && u.role !== 'ceo') { res.status(404).json({ error: 'Esa marca no está entre las tuyas' }); return null; }
  const sc = await scoper(u);
  if (sc && slug !== 'inherent' && !sc.client(slug)) { res.status(404).json({ error: 'Ese cliente no está entre los tuyos' }); return null; }
  if (write) {
    const al = await alcanceDe(ws, slug);
    if (!al.abierto) { res.status(al.code === 'SIN_FICHA' ? 409 : 403).json({ error: al.texto, code: al.code }); return null; }
    if (cierra && ws === 'strategy' && (await estrategiaCerrada(slug))) { res.status(409).json({ error: 'La estrategia en vivo de este cliente está aprobada: el CEO tiene que reabrirla para cambiar Strategy.', code: 'APROBADO' }); return null; }
  }
  return u;
}
// Un entregable por su id, con el acceso de su workspace y su cliente. editable: un archivado no se cambia (solo se desarchiva).
async function deDoc(req, res, { write = false, cierra = write, editable = write } = {}) {
  const id = String(req.params.id || ''), cur = idOk(id) ? await db.get(COLL, id) : null;
  if (!cur) { res.status(404).json({ error: 'No existe ese entregable' }); return {}; }
  const u = await abre(req, res, { ws: cur.ws, slug: cur.client_slug, write, tool: cur.tool, cierra }); if (!u) return {};
  if (editable && cur.archivado) { res.status(409).json({ error: 'Está archivado: desarchívalo para cambiarlo.', code: 'ARCHIVADO' }); return {}; }
  return { cur, u };
}
// Un proyecto ligado al entregable tiene que estar en el alcance de quien lo liga (el mismo chequeo de las tareas).
async function proyectoMal(u, id) {
  if (!id) return null;
  const sc = await scoper(u); if (!sc) return null;
  const p = await db.get('projects', String(id));
  return p && sc.projects(p) ? null : 'Ese proyecto no está entre los tuyos';
}
// Las entradas son versiones aprobadas de este mismo cliente: así la cadena no se puede armar con lo que no tiene el OK.
async function entradasMal(entradas, slug) {
  for (const e of entradas) {
    const o = await db.get(COLL, e.deliverable_id);
    if (!o || o.archivado || lc(o.client_slug) !== lc(slug) || !['Aprobado', 'Entregado'].includes(o.estado) || o.aprobado?.version !== e.version) return 'Una entrada no es una versión aprobada de este cliente';
    e.tool = o.tool;
  }
  return null;
}
// Lo que la herramienta necesita saber de otras para decir qué falta. Hoy: el Plan de crecimiento 90 días no recomienda
// demanda mientras el último Diagnóstico aprobado del cliente tenga la capacidad en rojo.
async function extraDe(cur) {
  if (cur.tool !== 'solution-blueprint-builder') return {};
  const d = (await db.list(COLL)).filter((x) => x.tool === 'business-health-assessment' && lc(x.client_slug) === lc(cur.client_slug) && !x.archivado && ['Aprobado', 'Entregado'].includes(x.estado) && x.aprobado)
    .sort((a, z) => tiempo(z.aprobado.en) - tiempo(a.aprobado.en))[0];
  return { capacidadRoja: d?.contenido?.capacidad === 'rojo' };
}
const guardar = async (res, cur, data, b, u) => {
  const d = await db.update(COLL, cur.id, data, vDe(b, cur), u.email);
  if (!d) res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
  return d;
};
// Costos: quien no los ve recibe el entregable sin ellos (con costs_hidden), en toda respuesta que lleve contenido: nunca se toca el doc guardado.
const ocultaCostos = (u, tool) => !seesCosts(u) && typeof tool?.sinCostos === 'function';
const salida = (u, d) => (d && ocultaCostos(u, herramientaDe(d.tool)) ? { ...d, contenido: herramientaDe(d.tool).sinCostos(d.contenido), costs_hidden: true } : d);
// Si lo que el servidor deja en su casa no pudo escribirse, el aviso viaja con el entregable (que ya quedó guardado).
const avisoDe = (a) => (a ? { aviso: a } : {});
const grande = (res, x) => (JSON.stringify(x).length > MAX_BYTES ? (res.status(413).json({ error: 'Demasiado grande', code: 'GRANDE' }), true) : false);

export function rutas(on, { cleanTask = (t) => t } = {}) {
  // ---------- Leer ----------
  on('GET', 'entregables', async (req, res) => {
    const ws = String(req.query.ws || ''), slug = lc(req.query.slug), tool = String(req.query.tool || ''), ciclo = String(req.query.ciclo || '');
    const u = await abre(req, res, { ws, slug, tool }); if (!u) return;
    const puede = { editar: edits(u, AREA_DE[ws]), ...(tool ? { aprobar: puedeAprobar(u, herramientaDe(tool)) } : {}) };
    // Fuera del alcance (o sin ficha) la lista sale vacía y dice por qué: la pantalla pinta el aviso en vez de un error.
    const alcance = await alcanceDe(ws, slug);
    if (!alcance.abierto) return res.json({ items: [], puede, alcance });
    const items = (await db.list(COLL)).filter((d) => d.ws === ws && lc(d.client_slug) === slug && (!tool || d.tool === tool) && (!ciclo || d.ciclo === ciclo) && (req.query.archivados === '1' || !d.archivado))
      .sort((a, z) => tiempo(z._meta?.updated_at) - tiempo(a._meta?.updated_at));
    // Con la estrategia en vivo aprobada, Strategy de ese cliente es solo lectura: los items sí salen, con el aviso en el alcance.
    const cerrada = ws === 'strategy' && (await estrategiaCerrada(slug));
    res.json({ items: items.map((d) => salida(u, d)), puede, alcance: cerrada ? { abierto: false, code: 'APROBADO', texto: TEXTO_APROBADA } : alcance });
  });
  on('GET', 'entregables/:id', async (req, res) => {
    const { cur, u } = await deDoc(req, res); if (!u) return;
    res.json(salida(u, cur));
  });
  // Las versiones (la foto de cada una): para comparar y para leer la que se aprobó aunque ya haya otra abierta.
  on('GET', 'entregables/:id/versiones', async (req, res) => {
    const { cur, u } = await deDoc(req, res); if (!u) return;
    const ns = Array.from({ length: Math.min(cur.version || 1, 100) }, (_, i) => (cur.version || 1) - i).reverse();
    const fotos = await Promise.all(ns.map((n) => db.get(COLL_V, idVersion(cur.id, n))));
    res.json({ versiones: fotos.filter(Boolean).map((f) => ({ version: f.version, en: iso(f._meta?.created_at), por: f._meta?.created_by || '' })) });
  });
  on('GET', 'entregables/:id/versiones/:n', async (req, res) => {
    const { cur, u } = await deDoc(req, res); if (!u) return;
    const n = Number(req.params.n), foto = Number.isInteger(n) && n >= 1 && n <= (cur.version || 1) ? await db.get(COLL_V, idVersion(cur.id, n)) : null;
    foto ? res.json(salida(u, foto)) : res.status(404).json({ error: 'Esa versión no existe' });
  });

  // ---------- Crear ----------
  // Siempre entra como Borrador, versión 1. El servidor vuelve a limpiar el contenido con el limpiar() de la herramienta.
  on('POST', 'entregables', async (req, res) => {
    const b = body(req), tool = herramientaDe(String(b.tool || ''));
    if (!tool) return res.status(400).json({ error: 'Esa herramienta no existe' });
    const slug = lc(b.client_slug), u = await abre(req, res, { ws: tool.ws, slug, write: true, tool: tool.id }); if (!u) return;
    if (tool.id === 'offer-architect' && (await ofertaCerrada(res, slug))) return; // un Borrador nuevo no esquiva la oferta aprobada
    if (grande(res, b)) return;
    let limpio;
    try { limpio = limpiarEntregable({ ...b, tool: tool.id, client_slug: slug }, limpiarDe(tool)); } catch { return res.status(400).json({ error: 'El contenido no sirve para esta herramienta' }); }
    if (ocultaCostos(u, tool)) limpio.contenido = tool.conCostos(null, limpio.contenido); // quien no ve costos no los escribe
    if (grande(res, limpio)) return;
    const malO = await ofertaMal(tool, slug, null, limpio.contenido); if (malO) return res.status(403).json(malO);
    const malP = await proyectoMal(u, limpio.project_id); if (malP) return res.status(404).json({ error: malP });
    const malE = await entradasMal(limpio.entradas, slug); if (malE) return res.status(400).json({ error: malE });
    const doc = { ...limpio, titulo: limpio.titulo || tool.nombre, ws: tool.ws, pestana: tool.pestana, owner: u.email, estado: 'Borrador', archivado: false, version: 1, aprobado: null,
      historial: [entrada(u, 'crear', 1)], tareas: [], resultado: [], siguientes: [] };
    const d = await db.create(COLL, doc, u.email);
    await db.create(COLL_V, versionDe(d, 1), u.email, idVersion(d.id, 1));
    res.json({ ...salida(u, d), ...avisoDe(await aSuCasa(u, d)) });
  });

  // ---------- Editar ----------
  // El contenido, el título, el ciclo, el proyecto, los criterios y la IA. Si el contenido cambió: versión nueva, y un Aprobado
  // o Entregado vuelve a Borrador sin su OK. La herramienta, el cliente y las entradas no cambian (se crean otro entregable).
  on('PUT', 'entregables/:id', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true }); if (!u) return;
    const b = body(req), tool = herramientaDe(cur.tool);
    if (grande(res, b)) return;
    let limpio;
    try { limpio = limpiarEntregable({ ...cur, ...b, tool: cur.tool, client_slug: cur.client_slug, entradas: cur.entradas }, limpiarDe(tool)); } catch { return res.status(400).json({ error: 'El contenido no sirve para esta herramienta' }); }
    if (ocultaCostos(u, tool)) limpio.contenido = tool.conCostos(cur.contenido, limpio.contenido); // lo que mandó sin costos no pisa los guardados
    if (grande(res, limpio)) return;
    if ('project_id' in b && limpio.project_id !== cur.project_id) { const malP = await proyectoMal(u, limpio.project_id); if (malP) return res.status(404).json({ error: malP }); }
    const malO = await ofertaMal(tool, cur.client_slug, cur.contenido, limpio.contenido); if (malO) return res.status(403).json(malO);
    const cambio = cambioDeContenido(cur, limpio.contenido);
    // La oferta se aprueba con el bloque (Oferta o Modelo de dinero): aprobada, cambiarla es 409 hasta que el CEO reabra el bloque.
    if (tool?.id === 'offer-architect' && cambio.version !== cur.version && (await ofertaCerrada(res, cur.client_slug))) return;
    const campos = { titulo: limpio.titulo || cur.titulo, ciclo: 'ciclo' in b ? limpio.ciclo : cur.ciclo || '', project_id: 'project_id' in b ? limpio.project_id : cur.project_id || '',
      criterios: 'criterios' in b ? limpio.criterios : cur.criterios, ia: 'ia' in b ? limpio.ia : cur.ia, contenido: limpio.contenido };
    // Sin nada que guardar no se escribe (y no ensucia el historial): pero una versión vieja de quien edita sigue siendo 409.
    if (cambio.version === cur.version && canon({ ...campos }) === canon({ titulo: cur.titulo, ciclo: cur.ciclo || '', project_id: cur.project_id || '', criterios: cur.criterios, ia: cur.ia, contenido: cur.contenido })) {
      return b.v != null && Number(b.v) !== cur.v ? res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' }) : res.json({ ...salida(u, cur), ...avisoDe(await aSuCasa(u, cur)) });
    }
    const data = { ...cur, ...campos, version: cambio.version, estado: cambio.estado, aprobado: cambio.aprobado, historial: [...hist(cur), entrada(u, 'editar', cambio.version, cambio.estado !== cur.estado ? `Vuelve a ${cambio.estado}: cambió el contenido` : '')] };
    const d = await guardar(res, cur, data, b, u); if (!d) return;
    if (cambio.version !== cur.version) await db.create(COLL_V, versionDe(d, cambio.version), u.email, idVersion(d.id, cambio.version));
    res.json({ ...salida(u, d), ...avisoDe(await aSuCasa(u, d)) });
  });

  // ---------- Estado ----------
  on('POST', 'entregables/:id/estado', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    const b = body(req), a = String(b.a || ''), tool = herramientaDe(cur.tool);
    // Offer Architect envuelve los bloques Oferta y Modelo de dinero: no hay otro camino de aprobación, ni para el CEO.
    if (cur.tool === 'offer-architect' && a === 'Aprobado') return res.status(409).json({ error: 'Se aprueba con el bloque Oferta (solo el CEO)', code: 'APRUEBA_BLOQUE' });
    const quien = pasoPermitido(cur.estado, a);
    if (!quien) return res.status(409).json({ error: `De «${cur.estado}» no se pasa a «${a}»`, code: 'PASO' });
    if (quien === 'aprobador' && !puedeAprobar(u, tool)) return res.status(403).json({ error: !tool || tool.aprueba === 'ceo' ? 'Solo el CEO aprueba esto' : 'Solo el CEO o el COO aprueban esto' });
    if (a === 'Aprobado') {
      // Se aprueba lo que se leyó: sin la versión (v) no se aprueba, y si alguien cambió el entregable después, 409.
      if (b.v == null || !Number.isInteger(Number(b.v))) return res.status(400).json({ error: 'Falta la versión que revisaste', code: 'FALTA_V' });
      if (Number(b.v) !== cur.v) return res.status(409).json({ error: CONFLICTO, code: 'CONFLICTO' });
      const f = faltas(cur, await extraDe(cur));
      if (f.length) return res.status(400).json({ error: f.join(' · '), code: 'FALTAS', faltas: f });
    }
    const aprobado = a === 'Aprobado' ? { por: u.email, en: ahora(), version: cur.version } : cur.aprobado ?? null;
    const data = { ...cur, estado: a, aprobado, historial: [...hist(cur), entrada(u, 'estado', cur.version, [`${cur.estado} → ${a}`, nota(b.nota)].filter(Boolean).join(' · '))] };
    const d = await guardar(res, cur, data, b, u); if (!d) return;
    res.json(salida(u, d));
  });

  // ---------- Archivar (nada se borra) ----------
  on('POST', 'entregables/:id/archivar', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true, editable: false }); if (!u) return;
    const b = body(req), si = b.archivado !== false;
    if (Boolean(cur.archivado) === si) return res.json(salida(u, cur));
    if (cur.tool === 'offer-architect' && (await ofertaCerrada(res, cur.client_slug))) return; // archivar el espejo aprobado deja un Borrador nuevo como «el último»
    const d = await guardar(res, cur, { ...cur, archivado: si, historial: [...hist(cur), entrada(u, si ? 'archivar' : 'desarchivar', cur.version)] }, b, u); if (!d) return;
    res.json(salida(u, d));
  });

  // ---------- La cadena: el Borrador de la herramienta que sigue ----------
  // Solo desde un entregable Aprobado y solo a una herramienta de su va_a. Las entradas apuntan a la versión aprobada.
  // Se abre también el workspace de la herramienta destino (con escritura). Si ya hay un Borrador de esa misma versión, se devuelve ese.
  on('POST', 'entregables/:id/siguiente', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    const b = body(req), nuevo = siguienteDe(cur, String(b.tool || ''));
    if (!nuevo) return res.status(400).json({ error: 'Solo un entregable Aprobado se manda a una herramienta que le sigue', code: 'SIGUIENTE' });
    if (!(await abre(req, res, { ws: nuevo.ws, slug: cur.client_slug, write: true, tool: nuevo.tool }))) return;
    const tool = herramientaDe(nuevo.tool), version = nuevo.entradas[0].version;
    for (const s of [...(cur.siguientes || [])].reverse().filter((x) => x.tool === nuevo.tool)) {
      const p = idOk(s.deliverable_id) ? await db.get(COLL, s.deliverable_id) : null;
      if (p && !p.archivado && lc(p.client_slug) === lc(cur.client_slug) && (p.entradas || []).some((e) => e.deliverable_id === cur.id && e.version === version)) return res.json({ doc: salida(u, p), ya: true });
    }
    if (nuevo.tool === 'offer-architect' && (await ofertaCerrada(res, cur.client_slug))) return; // otro Borrador de Offer Architect no esquiva la oferta aprobada
    const nid = db.newId();
    const doc = { ...limpiarEntregable(nuevo, limpiarDe(tool)), ws: tool.ws, pestana: tool.pestana, owner: u.email, estado: 'Borrador', archivado: false, version: 1, aprobado: null,
      historial: [entrada(u, 'crear', 1, `Viene de «${cur.titulo}» v${version}`)], tareas: [], resultado: [], siguientes: [] };
    const data = { ...cur, siguientes: [...(cur.siguientes || []), { tool: nuevo.tool, deliverable_id: nid }], historial: [...hist(cur), entrada(u, 'siguiente', cur.version, `→ ${tool.nombre}`)] };
    // Primero el origen (con su v: si alguien lo cambió, no se crea nada) y luego el Borrador con el id ya reservado.
    const d = await guardar(res, cur, data, b, u); if (!d) return;
    const creado = await db.create(COLL, doc, u.email, nid);
    await db.create(COLL_V, versionDe(creado, 1), u.email, idVersion(nid, 1));
    res.json({ doc: salida(u, creado) });
  });

  // ---------- Convertir en tareas ----------
  // Las crea el servidor (no /api/db/tasks: encargoMal quitaría origen, área y cliente). Una fila ya convertida no se duplica:
  // la clave es el entregable + la fila. Quedan sus ids en el entregable.
  on('POST', 'entregables/:id/tareas', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    const b = body(req), filas = Array.isArray(b.tareas) ? b.tareas : [];
    if (!filas.length) return res.status(400).json({ error: 'No llegó ninguna tarea' });
    if (filas.length > 12) return res.status(400).json({ error: 'Máximo 12 tareas a la vez' });
    const malP = await proyectoMal(u, cur.project_id); if (malP) return res.status(404).json({ error: malP });
    const ya = new Set((await db.list('tasks')).filter((t) => t.deliverable_id === cur.id && t.fila).map((t) => t.fila)), nuevas = [];
    for (const t of tareasDeEntregable(cur, filas, { email: u.email, ws: cur.ws })) {
      if (t.fila && ya.has(t.fila)) continue;
      if (t.fila) ya.add(t.fila);
      nuevas.push(t);
    }
    const saltadas = filas.length - nuevas.length;
    if (!nuevas.length) return res.json({ creadas: [], saltadas });
    // El entregable guarda los ids primero (con su v); si alguien lo cambió, no se crea ninguna tarea.
    const ids = nuevas.map(() => db.newId());
    const d = await guardar(res, cur, { ...cur, tareas: [...(cur.tareas || []), ...ids], historial: [...hist(cur), entrada(u, 'tareas', cur.version, `${ids.length} tarea${ids.length === 1 ? '' : 's'}`)] }, b, u); if (!d) return;
    for (let i = 0; i < nuevas.length; i++) await db.create('tasks', results.stampDone(null, cleanTask(nuevas[i])), u.email, ids[i]);
    res.json({ creadas: ids, saltadas });
  });

  // ---------- Learning: lo que pasó después ----------
  on('POST', 'entregables/:id/resultado', async (req, res) => {
    const { cur, u } = await deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    const b = body(req), txt = (x, n) => String(x ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
    const r = { en: ahora(), por: u.email, metrica: txt(b.metrica, 120), valor: txt(b.valor, 60), nota: txt(b.nota, 500) };
    if (!r.metrica) return res.status(400).json({ error: 'Falta la métrica' });
    const previos = Array.isArray(cur.resultado) ? cur.resultado : [];
    if (previos.length >= 200) return res.status(400).json({ error: 'Ya hay 200 resultados anotados' });
    const d = await guardar(res, cur, { ...cur, resultado: [...previos, r], historial: [...hist(cur), entrada(u, 'resultado', cur.version, r.metrica)] }, b, u); if (!d) return;
    res.json(salida(u, d));
  });
}
