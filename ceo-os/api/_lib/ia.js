// IA del OS (Ajustes → IA): las llaves de los proveedores y para qué se usa cada uno. Un solo documento `ia_config/org`.
//   · Las llaves se guardan CIFRADAS (vault.js, AES-256-GCM) y nunca vuelven al navegador: solo sus últimos 4.
//   · Conectan y eligen el CEO y el COO; usar (ia/completar) lo puede todo el equipo, nunca un cliente.
//   · Un solo adaptador: la API compatible con OpenAI (chat/completions y models). Claude y Gemini la ofrecen también.
//   · ia/completar responde en streaming (SSE): {delta} mientras escribe y al final {fin, texto, citas, modelo}.
// Las IAs locales (el puente de Claude) no pasan por aquí: corren en la compu de cada persona.
import * as db from './db.js';
import crypto from 'node:crypto';
import { guard } from './access.js';
import { body } from './http.js';
import { seal, open } from './vault.js';
import { PROVEEDORES, USOS, proveedorDe, baseValida, ultimos4, modelosChat, contextoDe, tokensDe } from '../../public/js/ia-proveedores.js';
import { toolsDe, llamarTool } from './conectores.js';
import { proponerAccion, ejecutarAccion } from './external-actions.js';
import { conectorDe } from '../../public/js/conectores.js';

const COLL = 'ia_config', ID = 'org';
const editor = (u) => u.role === 'ceo' || u.role === 'coo';
const txt = (s, n) => String(s ?? '').trim().slice(0, n);
// El umbral: si el proveedor declara su contexto (Featherless: 32k en el plan actual), el pedido debe dejar espacio para la
// respuesta. Mejor avisar aquí, en lenguaje humano, que dejar que el proveedor responda 500 a media etapa.
const SALIDA = 6000;
function excede(id, sistema, mensaje) {
  const ctx = contextoDe(id); if (!ctx) return '';
  const n = tokensDe(sistema) + tokensDe(mensaje);
  return n + SALIDA > ctx ? `El pedido mide ~${n.toLocaleString('es-MX')} tokens y este modelo acepta ${ctx.toLocaleString('es-MX')} (contando ~${SALIDA} de respuesta). Quita inputs largos o usa para esta etapa un modelo con más contexto.` : '';
}

async function leer() { return (await db.get(COLL, ID)) || null; }
async function escribir(u, cambio) {
  const d = await leer();
  if (!d) return db.create(COLL, { proveedores: {}, usos: {}, ...cambio }, u.email, ID);
  const { id, v, _meta, ...data } = d;
  return (await db.update(COLL, ID, { ...data, ...cambio }, v, u.email)) || escribir(u, cambio);
}
// Lo que ve el navegador: nada de llaves.
function estado(d, u) {
  const ps = d?.proveedores || {};
  return {
    editor: editor(u),
    proveedores: PROVEEDORES.filter((p) => p.forma !== 'local').map((p) => ({ id: p.id, conectado: Boolean(ps[p.id]?.llave || (ps[p.id]?.base && p.forma === 'url')), ultimos4: ps[p.id]?.ultimos4 || '', base: p.forma === 'url' ? ps[p.id]?.base || '' : '', modelos: ps[p.id]?.modelos || [], at: ps[p.id]?.at || '', por: ps[p.id]?.por || '' })),
    usos: d?.usos || {},
  };
}
// La conexión de un proveedor: dirección y llave abierta (solo en el servidor).
function conexion(d, id) {
  const p = proveedorDe(id), c = d?.proveedores?.[id];
  if (!p || p.forma === 'local' || !c) return null;
  const base = p.forma === 'url' ? c.base : p.base;
  let llave = ''; try { llave = c.llave ? open(c.llave) : ''; } catch { return null; }
  return base ? { p, base, llave } : null;
}
const cabeceras = ({ p, llave }) => ({ 'Content-Type': 'application/json', ...(llave ? { Authorization: `Bearer ${llave}` } : {}), ...(p.id === 'anthropic' ? { 'x-api-key': llave, 'anthropic-version': '2023-06-01' } : {}), ...(p.id === 'openrouter' ? { 'HTTP-Referer': process.env.APP_URL || 'https://inherent-work.vercel.app', 'X-Title': 'Inherent OS' } : {}) });

async function pedirModelos(c) {
  if (c.p.modelos) return c.p.modelos;
  const r = await fetch(`${c.base}/models`, { headers: cabeceras(c), signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw Object.assign(new Error(r.status === 401 || r.status === 403 ? 'La llave no sirve: revisa que esté completa y activa' : `El proveedor respondió ${r.status}`), { status: 400 });
  const j = await r.json().catch(() => ({}));
  return modelosChat((j.data || j.models || []).map((m) => (typeof m === 'string' ? m : m.id || m.name || '').replace(/^models\//, '')));
}
// Perplexity no tiene /models: se prueba con una respuesta de una palabra.
async function probar(c) {
  if (!c.p.modelos) return pedirModelos(c);
  const r = await fetch(`${c.base}/chat/completions`, { method: 'POST', headers: cabeceras(c), body: JSON.stringify({ model: c.p.modelos[0], max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }), signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw Object.assign(new Error(r.status === 401 || r.status === 403 ? 'La llave no sirve: revisa que esté completa y activa' : `El proveedor respondió ${r.status}`), { status: 400 });
  return c.p.modelos;
}

// Una respuesta en streaming del proveedor → onDelta(texto acumulado). Devuelve { texto, citas }.
export async function completar(c, { modelo, sistema, mensaje, buscar = false, onDelta = () => {}, signal }) {
  const model = c.p.id === 'openrouter' && buscar && !/:online$/.test(modelo) ? `${modelo}:online` : modelo;
  const r = await fetch(`${c.base}/chat/completions`, { method: 'POST', headers: cabeceras(c), signal, body: JSON.stringify({ model, stream: true, ...(contextoDe(c.p.id) ? { max_tokens: SALIDA } : {}), messages: [...(sistema ? [{ role: 'system', content: sistema }] : []), { role: 'user', content: mensaje }] }) });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error(`${c.p.nombre} respondió ${r.status}${t ? `: ${t.slice(0, 200)}` : ''}`), { status: 502 }); }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', texto = ''; const citas = new Map();
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n')) >= 0) {
      const l = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
      if (!l.startsWith('data:')) continue;
      const crudo = l.slice(5).trim(); if (!crudo || crudo === '[DONE]') continue;
      let d; try { d = JSON.parse(crudo); } catch { continue; }
      for (const u of d.citations || []) if (typeof u === 'string') citas.set(u, { url: u, titulo: u.replace(/^https?:\/\//, '').slice(0, 80) });
      for (const s of d.search_results || []) if (s?.url) citas.set(s.url, { url: s.url, titulo: txt(s.title || s.url, 160) });
      const delta = d.choices?.[0]?.delta || {};
      for (const a of delta.annotations || []) { const u = a.url_citation || a; if (u?.url) citas.set(u.url, { url: u.url, titulo: txt(u.title || u.url, 160), extracto: txt(u.content, 300) }); }
      if (delta.content) { texto += delta.content; onDelta(texto); }
      if (d.error) throw Object.assign(new Error(d.error.message || 'El proveedor no pudo responder'), { status: 502 });
    }
  }
  return { texto, citas: [...citas.values()].slice(0, 30) };
}

// Una respuesta corta del modelo configurado para un uso (Ajustes → IA), sin streaming. La usa el enrutador del
// orquestador (modelo barato, el de «IA para Agents»). Devuelve { texto, proveedor, modelo } o lanza un error humano.
export async function completarUso(uso, { sistema, mensaje, signal }) {
  const d = await leer(), u = d?.usos?.[uso] || {};
  const id = u.proveedor, modelo = u.modelo || d?.proveedores?.[id]?.modelos?.[0];
  const c = id ? conexion(d, id) : null;
  if (!c || !modelo) throw Object.assign(new Error('No hay IA conectada para esto: conéctala en Ajustes → IA'), { status: 400, code: 'SIN_IA' });
  const out = await completar(c, { modelo, sistema, mensaje, signal });
  return { texto: out.texto, proveedor: id, modelo };
}

export function rutas(on) {
  on('POST', 'ia/acciones/:id/aprobar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    try { res.json(await ejecutarAccion(u, req.params.id, body(req), { catalogo: toolsDe, ejecutar: llamarTool })); }
    catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'No se pudo completar la acción', code: e.code }); }
  });

  on('GET', 'ia/estado', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    res.json(estado(await leer(), u));
  });

  on('POST', 'ia/conectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Conectan IAs el CEO o el COO' });
    const b = body(req), p = proveedorDe(b.proveedor);
    if (!p || p.forma === 'local') return res.status(400).json({ error: 'Esa IA no se conecta aquí' });
    const llave = txt(b.llave, 400), base = p.forma === 'url' ? baseValida(b.base) : p.base;
    if (p.forma === 'url' && !base) return res.status(400).json({ error: 'La dirección tiene que empezar con https://' });
    if (p.forma === 'llave' && llave.length < 10) return res.status(400).json({ error: 'Pega la llave completa' });
    let modelos;
    try { modelos = await probar({ p, base, llave }); }
    catch (e) { return res.status(e.status || 400).json({ error: e.name === 'TimeoutError' ? 'El proveedor no respondió a tiempo' : e.message }); }
    const d = await leer();
    const proveedores = { ...(d?.proveedores || {}), [p.id]: { llave: llave ? seal(llave) : '', ultimos4: ultimos4(llave), base: p.forma === 'url' ? base : '', modelos, at: new Date().toISOString(), por: u.email } };
    // El primero que se conecta queda como la IA de cada uso que todavía no tiene una.
    const usos = { ...(d?.usos || {}) };
    for (const x of USOS) if (!usos[x.id]?.proveedor && (x.id !== 'investigacion' || p.busca)) usos[x.id] = { proveedor: p.id, modelo: x.id === 'investigacion' && p.id === 'perplexity' ? 'sonar-pro' : modelos[0] || '' };
    res.json(estado(await escribir(u, { proveedores, usos }), u));
  });

  on('POST', 'ia/desconectar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Desconectan IAs el CEO o el COO' });
    const id = txt(body(req).proveedor, 40), d = await leer();
    const proveedores = { ...(d?.proveedores || {}) }; delete proveedores[id];
    const usos = Object.fromEntries(Object.entries(d?.usos || {}).filter(([, x]) => x?.proveedor !== id));
    res.json(estado(await escribir(u, { proveedores, usos }), u));
  });

  on('POST', 'ia/uso', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Lo eligen el CEO o el COO' });
    const b = body(req);
    if (!USOS.some((x) => x.id === b.uso)) return res.status(400).json({ error: 'Ese uso no existe' });
    const d = await leer(), usos = { ...(d?.usos || {}) };
    if (b.uso === 'chat') usos.chat = { proveedor: txt(b.proveedor, 40), modelo: txt(b.modelo, 120), todos: b.todos !== false };
    else usos[b.uso] = { proveedor: txt(b.proveedor, 40), modelo: txt(b.modelo, 120) };
    if (usos[b.uso].proveedor && !d?.proveedores?.[usos[b.uso].proveedor]) return res.status(400).json({ error: 'Primero conecta esa IA' });
    res.json(estado(await escribir(u, { usos }), u));
  });

  on('POST', 'ia/modelos', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (!editor(u)) return res.status(403).json({ error: 'Solo el CEO o el COO' });
    const id = txt(body(req).proveedor, 40), d = await leer(), c = conexion(d, id);
    if (!c) return res.status(400).json({ error: 'Esa IA no está conectada' });
    try { const modelos = await pedirModelos(c); const proveedores = { ...d.proveedores, [id]: { ...d.proveedores[id], modelos } }; res.json(estado(await escribir(u, { proveedores }), u)); }
    catch (e) { res.status(e.status || 400).json({ error: e.message }); }
  });

  // Correr un pedido con la IA del OS. { uso, proveedor?, modelo?, sistema, mensaje, buscar? } → SSE.
  on('POST', 'ia/completar', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), d = await leer();
    const uso = d?.usos?.[b.uso] || {};
    const id = txt(b.proveedor, 40) || uso.proveedor, modelo = txt(b.modelo, 120) || (id === uso.proveedor ? uso.modelo : '') || d?.proveedores?.[id]?.modelos?.[0];
    const c = conexion(d, id);
    if (!c || !modelo) return res.status(400).json({ error: 'No hay IA conectada para esto: conéctala en Ajustes → IA', code: 'SIN_IA' });
    const mensaje = txt(b.mensaje, 120000); if (!mensaje) return res.status(400).json({ error: 'Pedido vacío' });
    { const m = excede(id, b.sistema, mensaje); if (m) return res.status(413).json({ error: m, code: 'UMBRAL' }); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    const enviar = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
    let ultimo = 0;
    try {
      const out = await completar(c, { modelo, sistema: txt(b.sistema, 40000), mensaje, buscar: Boolean(b.buscar) || b.uso === 'investigacion', onDelta: (t) => { if (t.length - ultimo > 40) { enviar({ delta: t.slice(ultimo) }); ultimo = t.length; } } });
      if (out.texto.length > ultimo) enviar({ delta: out.texto.slice(ultimo) });
      enviar({ fin: true, texto: out.texto, citas: out.citas, proveedor: id, modelo: `${c.p.nombre} · ${modelo}` });
    } catch (e) { enviar({ error: e.message || 'La IA no pudo responder' }); }
    res.end();
  });

  // Un agente con herramientas: la IA del OS + los conectores MCP de quien lo corre. Hasta 8 vueltas de
  // «la IA pide una herramienta → el OS la llama en el servicio → le devuelve el resultado». SSE: {paso} por cada
  // herramienta y al final {fin, texto, modelo, usadas}.
  on('POST', 'ia/agente', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const b = body(req), d = await leer(), uso = d?.usos?.[b.uso || 'agents'] || {};
    const id = txt(b.proveedor, 40) || uso.proveedor, modelo = txt(b.modelo, 120) || (id === uso.proveedor ? uso.modelo : '') || d?.proveedores?.[id]?.modelos?.[0];
    const c = conexion(d, id);
    if (!c || !modelo) return res.status(400).json({ error: 'No hay IA conectada para esto: conéctala en Ajustes → IA', code: 'SIN_IA' });
    { const m = excede(id, b.sistema, b.mensaje); if (m) return res.status(413).json({ error: m, code: 'UMBRAL' }); }
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    const enviar = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
    try {
      const disponibles = await toolsDe(u.email, (Array.isArray(b.conectores) ? b.conectores : []).map(String));
      const mapa = new Map(), tools = disponibles.map((t, k) => { const n = `${t.conector}__${t.tool.name}`.replace(/[^\w-]/g, '_').slice(0, 60) + `_${k}`; mapa.set(n, t); return { type: 'function', function: { name: n, description: `[${conectorDe(t.conector)?.nombre || t.conector}] ${String(t.tool.description || '').slice(0, 500)}`, parameters: t.tool.inputSchema && typeof t.tool.inputSchema === 'object' ? t.tool.inputSchema : { type: 'object', properties: {} } } }; });
      if (disponibles.length) enviar({ paso: `${new Set(disponibles.map((t) => t.conector)).size} conector(es) listos · ${tools.length} herramientas` });
      const messages = [...(b.sistema ? [{ role: 'system', content: txt(b.sistema, 40000) }] : []), { role: 'user', content: txt(b.mensaje, 120000) }];
      const usadas = [], runKey = crypto.randomUUID();
      for (let vuelta = 0; vuelta < 8; vuelta++) {
        const r = await fetch(`${c.base}/chat/completions`, { method: 'POST', headers: cabeceras(c), body: JSON.stringify({ model: modelo, messages, ...(tools.length ? { tools, tool_choice: 'auto' } : {}) }) });
        if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`${c.p.nombre} respondió ${r.status}${t ? `: ${t.slice(0, 200)}` : ''}`); }
        const j = await r.json(), m = j.choices?.[0]?.message || {};
        if (!m.tool_calls?.length) { enviar({ fin: true, texto: m.content || '', modelo: `${c.p.nombre} · ${modelo}`, usadas }); return res.end(); }
        messages.push({ role: 'assistant', content: m.content || null, tool_calls: m.tool_calls });
        for (const call of m.tool_calls.slice(0, 5)) {
          const t = mapa.get(call.function?.name);
          if (!t) throw new Error('Herramienta desconocida: no se ejecutó ninguna acción');
          let salida = 'Herramienta desconocida';
          if (t) {
            const nombre = `${conectorDe(t.conector)?.nombre || t.conector} · ${t.tool.name}`;
            let args; try { args = JSON.parse(call.function.arguments || '{}'); } catch { throw new Error('La herramienta recibió parámetros inválidos'); }
            const accion = await proponerAccion(u, t, args, { scope: txt(b.client_slug, 60), key: `${runKey}:${call.id}` });
            enviar({ fin: true, texto: `Revisa y aprueba «${nombre}» para ejecutarla.`, modelo: `${c.p.nombre} · ${modelo}`, usadas, aprobaciones: [accion] });
            return res.end();
          }
          messages.push({ role: 'tool', tool_call_id: call.id, content: salida.slice(0, 12000) });
        }
      }
      enviar({ error: 'El agente dio demasiadas vueltas sin terminar. Prueba con una etapa más concreta.' });
    } catch (e) { enviar({ error: e.message || 'La IA no pudo responder' }); }
    res.end();
  });
}
