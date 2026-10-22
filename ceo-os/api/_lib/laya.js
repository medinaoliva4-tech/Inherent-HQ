// Fase 3 · Laya: el juicio como dato (colección «judgments»). Laya corre en la compu de cada persona; aquí solo
// se guardan y se leen sus juicios, se arma el texto que se juzga y se dejan los pendientes para Claude Code.
// Un juicio lo lee quien ve el elemento juzgado (y nadie más): las rutas genéricas db/judgments no existen.
import * as db from './db.js';
import { guard, COLLS, canRead, summaryOf, scoper, inScope, edits } from './access.js';
import * as intel from './intel.js';
import { contextoEtapa } from './estrategia.js';
import { textoAprobados } from './avatares.js';
import { parseDocId } from '../../public/js/estrategia.js';
import * as content from './content.js';
import { body } from './http.js';
import { marcaDe } from '../../public/js/element.js';
import { PUERTAS, GATES_ID, MODELO, ENGINES, ENGINE_LISTO, INSTALAR_MCP, puertaDeDoc, puertasDe, limpiarPuertas, preguntasDe, textoDe, leerRespuesta, resumen } from '../../public/js/laya.js';

export const COLL = 'judgments';
const TARGETS = ['leads', 'invoices', 'content', 'strategy', 'ad_variants'];
const idOk = (s) => /^[\w.@+-]{1,120}$/.test(String(s || ''));
const lc = (x) => String(x || '').toLowerCase();
const pendId = (gate, coll, id) => `pend-${gate}-${coll}-${id}`.toLowerCase().slice(0, 200);
export const etiqueta = (coll, d) => String((coll === 'strategy' ? `${d?.slug || ''} · etapa` : coll === 'leads' ? d?.name : coll === 'invoices' ? [d?.vendor, d?.concept].filter(Boolean).join(' · ') : d?.title || (d?.handle ? '@' + d.handle : '')) || d?.id || '').slice(0, 120);

// El elemento, si esta persona lo ve (la misma regla que la app: área, «resumen», alcance y la marca personal). Si no, null.
export async function verObjetivo(u, coll, id, cache = {}) {
  if (!u || !TARGETS.includes(coll) || !idOk(id)) return null;
  const area = COLLS[coll];
  if (!u.areas?.includes(area) || !canRead(u.role, coll)) return null;
  const k = coll + '/' + id; if (k in cache) return cache[k];
  let d = await db.get(coll, id);
  // Estrategia: el elemento es el bloque Diagnóstico de un cliente (existe aunque todavía no se haya guardado nada).
  if (coll === 'strategy') {
    const p = parseDocId(id); if (!p || p.bloque !== 'diagnostico' || !(await intel.slugValido(p.slug))) return (cache[k] = null);
    if (p.slug !== 'inherent') { const sc = await (cache._sc ??= scoper(u)); if (!inScope(sc, 'strategy', { slug: p.slug })) return (cache[k] = null); }
    return (cache[k] = { ...(d || {}), id, slug: p.slug, bloque: 'diagnostico' });
  }
  const sum = summaryOf(u, coll); if (d && sum) d = sum(d);
  if (d && coll === 'leads') { const sc = await (cache._sc ??= scoper(u)); if (!inScope(sc, 'leads', d)) d = null; }
  if (d && (coll === 'content' || coll === 'ad_variants')) {
    if (d.profile === 'personal' && u.role !== 'ceo') d = null;
    else if (d.profile && d.profile !== 'inherent') { const sc = await (cache._sc ??= scoper(u)); if (sc && !sc.client(d.profile)) d = null; }
  }
  // Un anuncio de Google no tiene texto principal: Laya juzga sus títulos y descripciones.
  if (d && coll === 'ad_variants' && d.plataforma === 'google') d = { ...d, caption: [...(d.google?.titulos || []), ...(d.google?.descripciones || [])].join('\n') };
  return (cache[k] = d || null);
}
// Pedir o guardar un juicio cambia algo del área del elemento: hace falta nivel «edita» ahí.
const puedePedir = (u, coll) => edits(u, COLLS[coll]);

// El texto que se juzga, armado aquí para que el navegador y Claude Code juzguen exactamente lo mismo.
async function contextoDe(gate, d) {
  if (gate === 'factura') {
    const vend = lc(d.vendor).replace(/\s+/g, ' ').trim(), amt = (+d.amount || 0).toFixed(2);
    const t0 = Date.parse(d.issued || d.due || '') || 0;
    const otras = (await db.list('invoices')).filter((i) => i.kind === 'pagar' && i.id !== d.id && ((vend && lc(i.vendor).replace(/\s+/g, ' ').trim() === vend) || ((+i.amount || 0).toFixed(2) === amt && i.currency === d.currency)))
      .sort((a, z) => Math.abs((Date.parse(a.issued || a.due || '') || 0) - t0) - Math.abs((Date.parse(z.issued || z.due || '') || 0) - t0));
    return { otras: otras.slice(0, 12) };
  }
  if (gate === 'etapa') return await contextoEtapa(d.slug);
  return {};
}
async function marcaPara(gate, d) {
  if (gate !== 'referente' && gate !== 'idea') return null;
  const c = await content.cfg(d.profile || 'inherent').catch(() => null);
  const avatares = await textoAprobados(d.profile || 'inherent').catch(() => []);
  return { name: marcaDe(d.profile || 'inherent'), audience: c?.audience || {}, avatares, pillars: c?.pillars || [] };
}
export async function armar(gate, d, settings) {
  return { texto: textoDe(gate, d, await marcaPara(gate, d), await contextoDe(gate, d)), questions: preguntasDe(gate, settings), model: MODELO };
}
const gatesDoc = () => db.get('settings', GATES_ID).catch(() => null);
// Fase 4 · Investigación: cada post nuevo del scraping queda pendiente de juicio (lo resuelve el puente al abrir
// Investigación, o Claude Code con juicios_pendientes). Uno por elemento: el id del pendiente es fijo.
export async function pedirPendientes(coll, docs, who) {
  let n = 0;
  for (const d of docs || []) {
    const gate = puertaDeDoc(coll, d); if (!gate || !idOk(d?.id)) continue;
    await db.upsert(COLL, pendId(gate, coll, d.id), { target: { coll, id: d.id }, target_label: etiqueta(coll, d), gate, status: 'pendiente', engine: 'laya-mcp', at: new Date().toISOString(), by: who }, who);
    n++;
  }
  return n;
}

// Guarda las respuestas (una por pregunta) y quita el pendiente de ese elemento. Devuelve los juicios creados.
export async function guardar(u, { gate, coll, id, d, resultado, engine, settings }) {
  if (!ENGINES.includes(engine)) throw Object.assign(new Error('Motor desconocido'), { status: 400 });
  if (!ENGINE_LISTO[engine]) throw Object.assign(new Error('El motor «claude» es para el juicio visual de la Fase 6: todavía no está'), { status: 501 });
  const leida = leerRespuesta(resultado, preguntasDe(gate, settings));
  if (!leida.ok) throw Object.assign(new Error(leida.error || 'Respuesta de Laya ilegible'), { status: 400 });
  const at = new Date().toISOString(), label = etiqueta(coll, d), out = [];
  for (const r of leida.respuestas) out.push(await db.create(COLL, { target: { coll, id }, target_label: label, gate, status: 'hecho', ...r, engine, model: leida.model, at, by: u.email }, u.email));
  await db.remove(COLL, pendId(gate, coll, id), u.email).catch(() => false);
  return out;
}

// Los juicios de un elemento (lo último primero) o, sin elemento, los últimos que esta persona puede ver.
async function juiciosDe(u, coll, id) {
  return (await db.list(COLL)).filter((j) => j.target?.coll === coll && j.target?.id === id).sort((a, z) => String(z.at || '').localeCompare(String(a.at || ''))).slice(0, 60);
}
async function ultimos(u, n = 20) {
  const all = (await db.list(COLL)).sort((a, z) => String(z.at || '').localeCompare(String(a.at || ''))), cache = {}, out = [];
  for (const j of all) { if (out.length >= n) break; if (await verObjetivo(u, j.target?.coll, j.target?.id, cache)) out.push(j); }
  return out;
}

// ---------- las rutas (api/index.js las registra con laya.rutas(on)) ----------
export function rutas(on) {
  // Las puertas y sus preguntas. Las lee todo el equipo; solo el CEO las cambia.
  on('GET', 'laya/puertas', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const doc = await gatesDoc();
    res.json({ puertas: puertasDe(doc), guardadas: doc?.gates || {}, fabrica: PUERTAS, v: doc?.v || null });
  });
  on('PUT', 'laya/puertas', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role !== 'ceo') return res.status(403).json({ error: 'Solo el CEO cambia las preguntas de Laya' });
    let clean; try { clean = limpiarPuertas(body(req)); } catch (e) { return res.status(400).json({ error: e.message }); }
    const d = await db.upsert('settings', GATES_ID, clean, u.email);
    res.json({ puertas: puertasDe(d), guardadas: d.gates || {}, v: d.v });
  });
  // El texto y las preguntas listos para Laya (el navegador se los pasa al puente local).
  on('GET', 'laya/texto', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const coll = String(req.query.coll || ''), id = String(req.query.id || '');
    const d = await verObjetivo(u, coll, id); if (!d) return res.status(404).json({ error: 'No existe' });
    const gate = puertaDeDoc(coll, d); if (!gate) return res.status(400).json({ error: 'Laya no juzga este elemento' });
    res.json({ gate, ...(await armar(gate, d, await gatesDoc())) });
  });
  // Con coll + id: los juicios de ese elemento y su puerta. Sin nada: los últimos 20 que esta persona puede ver.
  on('GET', 'laya/juicios', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const coll = String(req.query.coll || ''), id = String(req.query.id || '');
    if (!coll && !id) return res.json({ items: await ultimos(u, Math.min(50, Math.max(1, +req.query.n || 20))), puertas: puertasDe(await gatesDoc()) });
    const d = await verObjetivo(u, coll, id); if (!d) return res.status(404).json({ error: 'No existe' });
    const gate = puertaDeDoc(coll, d); if (!gate) return res.status(400).json({ error: 'Laya no juzga este elemento' });
    const puerta = puertasDe(await gatesDoc())[gate], items = await juiciosDe(u, coll, id);
    res.json({ gate, puerta, items, resumen: resumen(items, puerta), puede: puedePedir(u, coll) });
  });
  // Pedir un juicio. { coll, id, pendiente:true } lo deja para Claude Code (laya-mcp);
  // { coll, id, engine:'laya-local', resultado } guarda lo que contestó el puente local.
  on('POST', 'laya/juicios', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const b = body(req), coll = String(b.coll || b.target?.coll || ''), id = String(b.id || b.target?.id || '');
    const d = await verObjetivo(u, coll, id); if (!d) return res.status(404).json({ error: 'No existe' });
    const gate = puertaDeDoc(coll, d); if (!gate) return res.status(400).json({ error: 'Laya no juzga este elemento' });
    if (b.gate && b.gate !== gate) return res.status(400).json({ error: 'Esa puerta no es la de este elemento' });
    if (!puedePedir(u, coll)) return res.status(403).json({ error: 'Tu perfil solo puede ver esto, no pedirle juicios a Laya' });
    const settings = await gatesDoc(), puerta = puertasDe(settings)[gate];
    if (b.pendiente) {
      const p = await db.upsert(COLL, pendId(gate, coll, id), { target: { coll, id }, target_label: etiqueta(coll, d), gate, status: 'pendiente', engine: 'laya-mcp', at: new Date().toISOString(), by: u.email }, u.email);
      const items = await juiciosDe(u, coll, id);
      return res.json({ pendiente: p, items, resumen: resumen(items, puerta) });
    }
    if (b.engine === 'laya-mcp') return res.status(400).json({ error: 'laya-mcp lo guarda Claude Code con guardar_juicio' });
    try { await guardar(u, { gate, coll, id, d, resultado: b.resultado, engine: b.engine || 'laya-local', settings }); }
    catch (e) { return res.status(e.status || 500).json({ error: e.message }); }
    const items = await juiciosDe(u, coll, id);
    res.json({ items, resumen: resumen(items, puerta) });
  });
}

// ---------- el conector MCP: juicios_pendientes y guardar_juicio ----------
export const TOOLS = [
  ['juicios_pendientes', 'work', `Los juicios de Laya que alguien pidió y nadie ha resuelto (leads, facturas por pagar, referentes, hooks). Cada uno trae «state» y «questions» listos: resuélvelos con la herramienta laya_predict del servidor MCP de Laya (${INSTALAR_MCP}) pasando state, questions y model «${MODELO}». Luego guarda cada uno con guardar_juicio (el id y el «answers» que devolvió). Laya solo lee texto: no inventes respuestas sin correrlo.`, { limite: { type: 'number', description: 'cuántos (por defecto 10, máx. 25)' } }],
  ['guardar_juicio', 'work', 'Guarda lo que contestó Laya para un juicio pendiente (sale de juicios_pendientes). «respuestas» es el objeto «answers» que devolvió laya_predict (o el resultado completo). Queda con motor laya-mcp y el pendiente se cierra.', { id: { type: 'string', description: 'el id del pendiente' }, respuestas: { type: 'object', description: 'el «answers» de laya_predict' }, modelo: { type: 'string', description: 'el checkpoint que contestó (routing.model), ej. multilingual' } }, ['id', 'respuestas']],
];
export async function mcp(u, name, a = {}) {
  const settings = await gatesDoc();
  if (name === 'juicios_pendientes') {
    const n = Math.min(25, Math.max(1, +a.limite || 10)), cache = {}, out = [];
    const pend = (await db.list(COLL)).filter((j) => j.status === 'pendiente').sort((x, z) => String(x.at || '').localeCompare(String(z.at || '')));
    for (const p of pend) {
      if (out.length >= n) break;
      const d = await verObjetivo(u, p.target?.coll, p.target?.id, cache); if (!d) continue;
      const gate = puertaDeDoc(p.target.coll, d); if (!gate || gate !== p.gate) continue;
      const { texto, questions, model } = await armar(gate, d, settings);
      out.push({ id: p.id, puerta: PUERTAS[gate].label, elemento: { coll: p.target.coll, id: p.target.id, titulo: etiqueta(p.target.coll, d) }, state: { texto }, questions, model, pedido_por: p.by, pedido_el: p.at });
    }
    return { como: out.length ? `Para cada uno: laya_predict(state, questions, model:"${MODELO}") y luego guardar_juicio(id, respuestas = su answers).` : 'No hay juicios pendientes.', total: out.length, pendientes: out };
  }
  if (name === 'guardar_juicio') {
    const p = idOk(a.id) ? await db.get(COLL, String(a.id)) : null;
    if (!p || p.status !== 'pendiente') throw new Error('Ese pendiente no existe o ya se resolvió (ver juicios_pendientes)');
    const d = await verObjetivo(u, p.target?.coll, p.target?.id); if (!d) throw new Error('Ese elemento no existe o no está entre los tuyos');
    if (!puedePedir(u, p.target.coll)) throw new Error('Tu perfil solo puede ver esto, no guardar juicios');
    const gate = puertaDeDoc(p.target.coll, d); if (!gate) throw new Error('Laya no juzga este elemento');
    const r = a.respuestas && typeof a.respuestas === 'object' && !a.respuestas.answers && a.modelo ? { answers: a.respuestas, routing: { model: String(a.modelo) } } : a.respuestas;
    const hechos = await guardar(u, { gate, coll: p.target.coll, id: p.target.id, d, resultado: r, engine: 'laya-mcp', settings });
    const items = await juiciosDe(u, p.target.coll, p.target.id);
    return { ok: true, guardadas: hechos.length, chip: resumen(items, puertasDe(settings)[gate]).chip, elemento: etiqueta(p.target.coll, d) };
  }
  throw new Error('Herramienta desconocida');
}
