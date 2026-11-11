// "Anthropic" falso para probar la interfaz contra el puente REAL sin gastar cupo: responde con un guion
// (texto + Write con permiso + texto final). Uso en code-os/ui/README.md → «Probar contra el puente».
import { createServer } from 'node:http';
const sse = (res, evs) => { res.writeHead(200, { 'content-type': 'text/event-stream' }); for (const [e, d] of evs) res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`); res.end(); };
const msg = (id, blocks, stop) => [
  ['message_start', { type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'cp-glm-5.3', content: [], stop_reason: null, usage: { input_tokens: 1200, output_tokens: 1 } } }],
  ...blocks.flatMap((b, i) => [
    ['content_block_start', { type: 'content_block_start', index: i, content_block: b.kind === 'tool' ? { type: 'tool_use', id: b.id, name: b.name, input: {} } : { type: 'text', text: '' } }],
    ...(b.kind === 'tool' ? [['content_block_delta', { type: 'content_block_delta', index: i, delta: { type: 'input_json_delta', partial_json: JSON.stringify(b.input) } }]] : b.text.split(/(?<= )/).map((t) => ['content_block_delta', { type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: t } }])),
    ['content_block_stop', { type: 'content_block_stop', index: i }],
  ]),
  ['message_delta', { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 42 } }],
  ['message_stop', { type: 'message_stop' }],
];
let n = 0;
createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  // Como LiteLLM con una llave virtual: las rutas de administrador dicen 403 (el puente lo comprueba al arrancar).
  if (req.url?.startsWith('/user/')) { res.writeHead(403); return res.end(); }
  if (req.url?.startsWith('/v1/models')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ data: ['nivel-alto','nivel-medio','nivel-bajo','cp-glm-5.3','cp-kimi-k3'].map((id) => ({ id })) })); }
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  if (body.stream === false) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: 'm', type: 'message', role: 'assistant', model: 'x', content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } })); }
  const hasResult = JSON.stringify(body.messages ?? []).includes('tool_result');
  const tools = Array.isArray(body.tools) ? body.tools.map((t) => t.name) : [];
  n++;
  if (tools.includes('Write') && !hasResult) return sse(res, msg('m' + n, [{ kind: 'text', text: 'Voy a crear un archivo de prueba en la carpeta del proyecto. ' }, { kind: 'tool', id: 'toolu_' + n, name: 'Write', input: { file_path: 'hola.txt', content: 'hola desde Code OS\n' } }], 'tool_use'));
  return sse(res, msg('m' + n, [{ kind: 'text', text: hasResult ? 'Listo: revisé el resultado de la herramienta. **Todo en orden.**' : 'Hola, te respondo desde el **puente real** con un modelo de prueba.' }], 'end_turn'));
}).listen(4199, '127.0.0.1', () => console.log('fake en 4199'));
