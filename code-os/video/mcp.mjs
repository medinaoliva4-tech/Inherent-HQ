#!/usr/bin/env node
// Servidor MCP (stdio) para que un agente use el servicio de video. Sin dependencias: JSON-RPC por líneas.
//   claude mcp add video -e VIDEO_URL=http://127.0.0.1:4310 -e VIDEO_TOKEN=… -- node code-os/video/mcp.mjs
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const formato = { type: 'string', enum: ['9:16', '1:1', '16:9'] };
export const HERRAMIENTAS = [
  { name: 'video_derive', title: 'Derivar video', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Encola una derivada con ffmpeg: recorte al formato (sin barras), tramo inicio–fin, subtítulos .srt quemados y música opcional. Devuelve el trabajo; consulta video_trabajo hasta estado «listo».',
    inputSchema: { type: 'object', properties: { videoId: { type: 'string' }, ruta: { type: 'string', description: 'relativa a la carpeta de medios' }, formato, inicio: { type: 'number' }, fin: { type: 'number' }, subtitulos: { type: 'string' }, musica: { type: 'string' } }, required: ['formato'] } },
  { name: 'video_trabajo', title: 'Estado de un trabajo', annotations: { readOnlyHint: true },
    description: 'Estado de un trabajo de video (pendiente, procesando, listo, error), progreso 0–1 y ruta del archivo.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'corte_primer', title: 'Armar primer corte', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Arma el primer corte desde el shot list de Producción y los clips grabados. Cada toma puede traer su receta: texto, fuente, capas y estilos (zoom, color, transicion, animacion-texto, detras-de-persona). Devuelve el corte (JSON de escenas) y las tomas que faltan. El editor humano lo revisa en el tablero de Retoque.',
    inputSchema: { type: 'object', properties: { shotlist: { type: 'object' }, clips: { type: 'array', items: { type: 'object' } } }, required: ['shotlist', 'clips'] } },
  { name: 'corte_leer', title: 'Leer corte', annotations: { readOnlyHint: true },
    description: 'Lee un corte (con las correcciones del editor humano, si las hay).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'corte_guardar', title: 'Guardar corte', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Guarda un corte completo. Pasa `version` (la que leíste) para no pisar la corrección del humano.',
    inputSchema: { type: 'object', properties: { corte: { type: 'object' }, version: { type: 'number' } }, required: ['corte'] } },
  { name: 'video_mascara', title: 'Recortar a la persona', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Genera la máscara de la persona de un clip (MediaPipe, CPU, ~12 cuadros/s en el VPS). Al terminar, el trabajo trae resultado.mascara: ponla en el estilo «detras-de-persona» de la escena.',
    inputSchema: { type: 'object', properties: { clip: { type: 'string' } }, required: ['clip'] } },
  { name: 'corte_render', title: 'Renderizar corte', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Encola el render del corte a MP4 con ffmpeg. Devuelve el trabajo.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
];

export function crearCliente({ base = process.env.VIDEO_URL ?? 'http://127.0.0.1:4310', token = process.env.VIDEO_TOKEN, fetcher = fetch } = {}) {
  const pedir = async (metodo, ruta, cuerpo) => {
    const r = await fetcher(base + ruta, { method: metodo, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
    return j;
  };
  return {
    video_derive: (a) => pedir('POST', '/derive', a),
    video_trabajo: (a) => pedir('GET', `/trabajos/${encodeURIComponent(a.id)}`),
    corte_primer: (a) => pedir('POST', '/cortes/primer', a),
    corte_leer: (a) => pedir('GET', `/cortes/${encodeURIComponent(a.id)}`),
    corte_guardar: (a) => (a.corte?.id ? pedir('PUT', `/cortes/${encodeURIComponent(a.corte.id)}`, a) : pedir('POST', '/cortes', a.corte)),
    video_mascara: (a) => pedir('POST', '/mascaras', a),
    corte_render: (a) => pedir('POST', `/cortes/${encodeURIComponent(a.id)}/render`),
  };
}

export async function responder(msg, cliente) {
  const { id, method, params } = msg;
  if (method === 'initialize') return { jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'code-os-video', version: '0.1.0' } } };
  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
  if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: HERRAMIENTAS } };
  if (method === 'tools/call') {
    const f = cliente[params?.name];
    if (!f) return { jsonrpc: '2.0', id, error: { code: -32602, message: `herramienta desconocida: ${params?.name}` } };
    try { return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(await f(params.arguments ?? {}), null, 2) }] } }; }
    catch (e) { return { jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } }; }
  }
  if (id == null) return null; // notificación
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `método desconocido: ${method}` } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cliente = crearCliente();
  createInterface({ input: process.stdin }).on('line', async (l) => {
    let msg;
    try { msg = JSON.parse(l); } catch { return process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }) + '\n'); }
    const r = await responder(msg, cliente);
    if (r) process.stdout.write(JSON.stringify(r) + '\n');
  });
}
