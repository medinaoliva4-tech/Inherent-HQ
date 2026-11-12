#!/usr/bin/env node
// Servidor MCP (stdio): producir video = prompting. El agente lee la guía de la marca, arma el video, le aplica
// estilos o imita una referencia, cambia escenas y música, y renderiza con ffmpeg. Sin dependencias: JSON-RPC por líneas.
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
    description: 'Arma el primer corte (el video) desde el shot list de Producción y los clips grabados. Con `marca`, aplica sus tipografías, colores y música. Cada toma puede traer su receta: texto, fuente, capas y estilos (zoom, color, transicion, animacion-texto, detras-de-persona). Devuelve el corte (JSON de escenas) y las tomas que faltan. El editor humano lo revisa en el tablero de Retoque.',
    inputSchema: { type: 'object', properties: { shotlist: { type: 'object' }, clips: { type: 'array', items: { type: 'object' } }, marca: { type: 'string' } }, required: ['shotlist', 'clips'] } },
  { name: 'corte_leer', title: 'Leer corte', annotations: { readOnlyHint: true },
    description: 'Lee un corte (con las correcciones del editor humano, si las hay).',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'corte_guardar', title: 'Guardar corte', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Guarda un corte completo. Pasa `version` (la que leíste) para no pisar la corrección del humano.',
    inputSchema: { type: 'object', properties: { corte: { type: 'object' }, version: { type: 'number' } }, required: ['corte'] } },
  { name: 'marcas_listar', title: 'Marcas', annotations: { readOnlyHint: true },
    description: 'Lista las marcas con style menu (id y nombre).',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'marca_guia', title: 'Guía de edición de la marca', annotations: { readOnlyHint: true },
    description: 'El style menu de la marca como guía para editar: transiciones, efectos, animaciones de texto y estilos que eligió (con su receta y si tienen render), tipografías, colores, música, sonidos, assets y reglas. Léela ANTES de editar un video de esa marca y usa solo lo que trae.',
    inputSchema: { type: 'object', properties: { marca: { type: 'string' } }, required: ['marca'] } },
  { name: 'video_escena', title: 'Cambiar una escena', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Cambia una escena del video (n desde 1): otra receta (estilo), otra transición o poner/quitar un efecto del catálogo (ids de GET /catalogo o de marca_guia).',
    inputSchema: { type: 'object', properties: { video: { type: 'string' }, n: { type: 'number' }, estilo: { type: 'string' }, transicion: { type: 'string' }, efecto: { type: 'string' }, quitar: { type: 'boolean' }, version: { type: 'number' } }, required: ['video', 'n'] } },
  { name: 'video_musica', title: 'Cambiar la música', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Pone, cambia o quita la música del video: {ruta, volumen 0–1, ducking (baja sola bajo la voz)}. Usa la música de la marca (marca_guia).',
    inputSchema: { type: 'object', properties: { video: { type: 'string' }, musica: { type: ['object', 'null'] }, version: { type: 'number' } }, required: ['video'] } },
  { name: 'estilos_listar', title: 'Catálogo de estilos', annotations: { readOnlyHint: true },
    description: 'Lista los estilos de edición del catálogo (id, nombre, categoría, descripción, formato, recursos que pide). Úsalo para elegir cómo editar un video.',
    inputSchema: { type: 'object', properties: { categoria: { type: 'string', enum: ['cortos', 'largos', 'tarjetas', 'ctas', 'posts'] } } } },
  { name: 'estilos_aplicar', title: 'Aplicar estilo', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Aplica un estilo del catálogo (de preferencia uno que la marca eligió) a un video guardado; si el video tiene marca, sus tipografías, colores y música mandan. cada escena conserva clip, tramo y texto, y recibe capas y estilos de la receta (gancho, cuerpo, cierre). Devuelve el corte y lo pendiente (p. ej. máscaras para «detrás de la persona»). Si el estilo pide recursos (reels, tarjetas), pásalos como rutas.',
    inputSchema: { type: 'object', properties: { corte: { type: 'string', description: 'id del corte' }, estilo: { type: 'string' }, recursos: { type: 'object', description: 'p. ej. {"reels": ["imagenes/r1.png", …]}' }, version: { type: 'number' } }, required: ['corte', 'estilo'] } },
  { name: 'referencias_listar', title: 'Videos de referencia', annotations: { readOnlyHint: true },
    description: 'Biblioteca de videos de referencia (curados, winners del radar y propios): enlace, por qué funciona, estilo sugerido y si ya tiene desglose.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'video_desglose', title: 'Desglosar un video', annotations: { readOnlyHint: false, destructiveHint: false },
    description: 'Desglosa un video local por escena (tiempos, gancho/cuerpo/cierre, ritmo, tipo de plano, texto en pantalla, efecto). Con `referencia`, guarda el desglose en esa referencia para poder imitarla.',
    inputSchema: { type: 'object', properties: { ruta: { type: 'string' }, referencia: { type: 'string' } }, required: ['ruta'] } },
  { name: 'referencia_imitar', title: 'Imitar una referencia', annotations: { readOnlyHint: false, destructiveHint: false },
    description: '«Imitar este»: convierte el desglose de la referencia en receta (mismo orden y ritmo de escenas) y la aplica al corte. Sin desglose usa el estilo sugerido.',
    inputSchema: { type: 'object', properties: { referencia: { type: 'string' }, corte: { type: 'string' }, recursos: { type: 'object' }, version: { type: 'number' } }, required: ['referencia', 'corte'] } },
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
    referencias_listar: async () => { const r = await pedir('GET', '/referencias'); return { referencias: r.referencias.map(({ breakdown, ...x }) => ({ ...x, con_desglose: !!breakdown })) }; },
    video_desglose: (a) => pedir('POST', '/desglose', a),
    referencia_imitar: (a) => pedir('POST', `/referencias/${encodeURIComponent(a.referencia)}/imitar`, { corte: a.corte, recursos: a.recursos, version: a.version }),
    marcas_listar: async () => ({ marcas: (await pedir('GET', '/marcas')).marcas.map((m) => ({ id: m.id, nombre: m.nombre })) }),
    marca_guia: (a) => pedir('GET', `/marcas/${encodeURIComponent(a.marca)}/guia`),
    video_escena: (a) => pedir('POST', `/videos/${encodeURIComponent(a.video)}/escenas/${a.n}`, a),
    video_musica: (a) => pedir('PUT', `/videos/${encodeURIComponent(a.video)}/musica`, { musica: a.musica ?? null, version: a.version }),
    estilos_listar: async (a) => { const r = await pedir('GET', '/estilos'); return a.categoria ? { ...r, estilos: r.estilos.filter((e) => e.categoria === a.categoria) } : r; },
    estilos_aplicar: (a) => pedir('POST', `/cortes/${encodeURIComponent(a.corte)}/estilo`, { estilo: a.estilo, recursos: a.recursos, version: a.version }),
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
