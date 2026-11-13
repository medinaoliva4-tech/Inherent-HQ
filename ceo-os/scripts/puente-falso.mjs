// PUENTE FALSO (solo para probar el Chat en local): imita el contrato de code-os/puente con capacidades, catálogo,
// planifica/ejecuta, pasos del ejecutor (parentToolUseId) y un permiso con costo. No corre modelos: responde con texto fijo.
//   PUENTE_FALSO_SIN_CONTRATO=1 → se comporta como el puente de hoy (sin /capacidades ni catálogo).
//   Uso: node scripts/puente-falso.mjs  (puerto 4100) y npm run dev con CODEOS_URL=http://localhost:4100 y CODEOS_PASE_SECRET.
import http from 'node:http';

const SIN = process.env.PUENTE_FALSO_SIN_CONTRATO === '1';
const PUERTO = Number(process.env.PORT) || 4100;
const sesiones = new Map(); const colas = new Map();
const CAPS = { capacidades: [
  { id: 'codigo', nombre: 'Código', estado: 'lista' },
  { id: 'figwright', nombre: 'Figwright', estado: process.env.FIGWRIGHT === '0' ? 'sin_conexion' : 'lista', motivo: 'El plugin de Figwright no está abierto en Figma.' },
  { id: 'imagen', nombre: 'Imágenes', estado: 'lista' },
  { id: 'radar', nombre: 'Radar', estado: 'apagada', motivo: 'Apagada por el CEO.' },
  { id: 'video', nombre: 'Video', estado: 'sin_conexion', motivo: 'Falta la llave del servicio de video.' },
  { id: 'herramientas', nombre: 'Herramientas', estado: 'lista' },
] };
const MODELOS = { default: 'sonnet', models: [{ id: 'nivel-medio' }], modelos: [
  { id: 'fable', nombre: 'Fable', nivel: 'alto', roles: ['planifica'], disponible: true, costo_relativo: 5, via: 'claude_login' },
  { id: 'opus-5.5', nombre: 'Opus 5.5', nivel: 'alto', roles: ['planifica', 'ejecuta'], disponible: true, costo_relativo: 4, via: 'claude_login' },
  { id: 'sonnet', nombre: 'Sonnet', nivel: 'medio', roles: ['planifica', 'ejecuta'], disponible: true, costo_relativo: 2, via: 'claude_login' },
  { id: 'nivel-medio', nombre: 'Nivel medio', nivel: 'medio', roles: ['ejecuta'], disponible: true, costo_relativo: 1, via: 'gateway' },
  { id: 'haiku-5.5', nombre: 'Haiku 5.5', nivel: 'bajo', roles: ['ejecuta'], disponible: true, costo_relativo: 1, via: 'claude_login' },
  { id: 'nivel-bajo', nombre: 'Nivel bajo', nivel: 'bajo', roles: ['ejecuta'], disponible: true, costo_relativo: 0, via: 'gateway' },
], presets: [
  { id: 'planifica-fuerte', nombre: 'Planifica fuerte, ejecuta barato', planifica: 'opus-5.5', ejecuta: 'haiku-5.5', nota: 'Opus planea y revisa; Haiku hace los pasos.' },
  { id: 'rapido-gratis', nombre: 'Todo rápido y gratis', planifica: 'nivel-bajo', ejecuta: 'nivel-bajo', nota: 'Preguntas cortas y tareas mecánicas.' },
  { id: 'maxima-calidad', nombre: 'Máxima calidad', planifica: 'fable', ejecuta: 'opus-5.5', nota: 'Lo que sale caro si sale mal.' },
] };
const leer = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch { ok({}); } }); });
const json = (res, s, o) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  res.setHeader('access-control-allow-origin', req.headers.origin || '*');
  res.setHeader('access-control-allow-headers', 'authorization, content-type');
  res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, PUT, DELETE');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  console.log(req.method, p);
  if (p === '/capacidades') return SIN ? json(res, 404, { error: 'No existe' }) : json(res, 200, CAPS);
  if (p === '/models') return json(res, 200, SIN ? { default: 'nivel-medio', models: MODELOS.models } : MODELOS);
  if (req.method === 'POST' && p === '/sessions') { const b = await leer(req); const id = 's' + (sesiones.size + 1); sesiones.set(id, b); console.log('  crea', JSON.stringify({ mode: b.mode, model: b.model, capacidades: b.capacidades, plan_ejecucion: b.plan_ejecucion })); return json(res, 201, { id }); }
  const m = /^\/sessions\/([^/]+)(\/.*)?$/.exec(p); if (!m) return json(res, 404, { error: 'No existe' });
  const [, id, resto = ''] = m; if (!sesiones.has(id)) sesiones.set(id, {}); const s = sesiones.get(id);
  if (req.method === 'PATCH' && !resto) { const b = await leer(req); Object.assign(s, b); console.log('  PATCH', JSON.stringify(b)); return json(res, 200, { id }); }
  if (resto === '/messages') { const b = await leer(req); const turnId = 't' + Date.now(); colas.set(id, { texto: b.text || '', turnId }); return json(res, 200, { turnId }); }
  if (resto.startsWith('/permissions/')) { console.log('  permiso', JSON.stringify(await leer(req))); return json(res, 200, { ok: true }); }
  if (resto === '/interrupt') return json(res, 200, { ok: true });
  if (resto === '/files' || resto === '/diff') return json(res, 200, { archivos: [] });
  if (resto === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
    const { texto = '', turnId = 'x' } = colas.get(id) || {}, caps = s.capacidades || [], plan = s.plan_ejecucion && typeof s.plan_ejecucion === 'object';
    const env = (e) => res.write(`data: ${JSON.stringify(e)}\n\n`), espera = (ms) => new Promise((r) => setTimeout(r, ms));
    env({ type: 'turn_start', turnId, model: s.model, via: 'claude_login', ...(plan ? { planner: nombre(s.plan_ejecucion.planifica), executor: nombre(s.plan_ejecucion.ejecuta) } : {}) });
    await espera(300);
    if (plan) {
      env({ type: 'tool_call', toolUseId: 'plan1', name: 'Task', input: { description: 'Ejecutar el plan' } });
      for (const [k, n, inp] of [['e1', 'get_design_context', { description: 'Leer el archivo de Figma' }], ['e2', 'create_frame', { description: 'Portada 1080×1350' }], ['e3', 'set_text', { description: 'Titular y CTA' }]]) {
        await espera(250); env({ type: 'tool_call', toolUseId: k, name: n, input: inp, parentToolUseId: 'plan1' });
        await espera(150); env({ type: 'tool_result', toolUseId: k, content: 'ok', parentToolUseId: 'plan1' });
      }
      env({ type: 'tool_result', toolUseId: 'plan1', content: 'ok' });
    }
    if (caps.includes('imagen') && /imagen/i.test(texto)) env({ type: 'permission_request', requestId: 'r1', tool: 'generar_imagen', title: 'Generar 1 imagen 1080×1350', description: 'gpt-image · calidad alta', input: { prompt: 'platillo con luz de tarde', aprobado_usd: 0.04 } });
    const resp = `Respuesta del puente falso (modo ${s.mode}${caps.length ? `, capacidades: ${caps.join(', ')}` : ''}). Pediste: «${texto.split('PEDIDO:\n').pop().slice(0, 120)}».`;
    for (let i = 0; i < resp.length; i += 24) { env({ type: 'text_delta', text: resp.slice(i, i + 24) }); await espera(40); }
    env({ type: 'turn_end', turnId, ok: true, result: resp }); return res.end();
  }
  return json(res, 404, { error: 'No existe' });
}).listen(PUERTO, () => console.log(`Puente falso${SIN ? ' (sin contrato)' : ''} → http://localhost:${PUERTO}`));
function nombre(id) { return MODELOS.modelos.find((m) => m.id === id)?.nombre || id; }
