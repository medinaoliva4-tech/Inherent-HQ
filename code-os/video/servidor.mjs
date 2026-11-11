#!/usr/bin/env node
// Servicio de video de Code OS: derivadas con ffmpeg, cortes (JSON de escenas) y el editor Retoque.
//   GET  /salud
//   POST /derive                 {videoId|ruta, formato, inicio, fin, subtitulos?, musica?} → 202 {trabajo}
//   GET  /trabajos · /trabajos/:id · /trabajos/:id/archivo
//   POST /cortes                 corte JSON (lo escribe el agente) → el corte guardado
//   POST /cortes/primer          {shotlist, clips} → primer corte armado por agente + faltantes
//   GET  /cortes/:id · PUT /cortes/:id {corte, version}  (el editor guarda con la versión que leyó)
//   POST /cortes/:id/render      → 202 {trabajo}
//   GET  /medios?ruta=…          sirve un medio de la raíz (con Range, para el reproductor)
//   GET  /medios/musica|imagenes lo que hay en esas carpetas de la raíz
//   GET  /medios/fuentes         tipografías de <raíz>/fuentes con su nombre (el que va en capa.fuente)
//   POST /mascaras               {clip} → 202 {trabajo}; al terminar, resultado.mascara (para «detrás de la persona»)
//   GET  /estilos[?completo=1] · /estilos/:id   catálogo de estilos (recetas en estilos/*.json)
//   POST /cortes/:id/estilo      {estilo, recursos?, version?} → aplica el estilo al corte → {corte, pendientes}
//   GET  /referencias            biblioteca de videos de referencia (semilla del repo + radar + desgloses)
//   POST /desglose               {ruta, referencia?} → 202 {trabajo}; resultado.desglose (escenas, ritmo, plano, texto, efecto)
//   POST /referencias/:id/imitar {corte, recursos?, version?} → desglose → receta → aplicada al corte
//   GET  /editor/                Retoque (el editor del rol de editor)
// Variables: VIDEO_RAIZ (medios, obligatoria), VIDEO_DATOS (./datos), VIDEO_PUERTO (4310), VIDEO_TOKEN,
//            VIDEO_FFMPEG / VIDEO_FFPROBE (binarios), VIDEO_FUENTE_TEXTO (ttf para drawtext).
import { createServer } from 'node:http';
import { createReadStream, statSync, readdirSync, existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCola, ErrorEntrada } from './cola.mjs';
import { ErrorCorte } from './corte.mjs';
import { primerCorte } from './primer-corte.mjs';
import { cargarEstilos, resumen, CATEGORIAS, ErrorEstilo } from './estilos.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TIPOS = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.srt': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const CARPETAS = { musica: /\.(mp3|m4a|wav|aac|ogg)$/i, imagenes: /\.(png|webp|gif|mov|webm)$/i };

function servirArchivo(req, res, ruta) {
  const tam = statSync(ruta).size;
  const tipo = TIPOS[extname(ruta).toLowerCase()] ?? 'application/octet-stream';
  const r = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (r) {
    const ini = r[1] ? Number(r[1]) : tam - Number(r[2]);
    const fin = r[1] && r[2] ? Math.min(Number(r[2]), tam - 1) : tam - 1;
    res.writeHead(206, { 'content-type': tipo, 'content-range': `bytes ${ini}-${fin}/${tam}`, 'accept-ranges': 'bytes', 'content-length': fin - ini + 1 });
    return createReadStream(ruta, { start: ini, end: fin }).pipe(res);
  }
  res.writeHead(200, { 'content-type': tipo, 'accept-ranges': 'bytes', 'content-length': tam });
  createReadStream(ruta).pipe(res);
}

async function leerJson(req, limite = 2e6) {
  let s = '';
  for await (const c of req) { s += c; if (s.length > limite) throw new ErrorEntrada('cuerpo demasiado grande'); }
  try { return s ? JSON.parse(s) : {}; } catch { throw new ErrorEntrada('JSON inválido'); }
}

export function crearServidor({ raiz, datos, token, cola = crearCola({ raiz, datos }), dirEstilos }) {
  // el catálogo se relee en cada pedido: agregar un .json en estilos/ no pide reiniciar
  const estilos = () => cargarEstilos(dirEstilos);
  const publico = (t) => t && { id: t.id, tipo: t.tipo, estado: t.estado, progreso: t.progreso, creado: t.creado, iniciado: t.iniciado, terminado: t.terminado, segundos: t.segundos, error: t.error, resultado: t.resultado ?? null, corte: t.pedido?.idCorte, version: t.pedido?.version, archivo: t.estado === 'listo' && t.tipo !== 'mascara' ? `/trabajos/${t.id}/archivo` : null };
  const servidor = createServer(async (req, res) => {
    const json = (c, o) => { res.writeHead(c, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
    const url = new URL(req.url, 'http://x');
    const ruta = url.pathname;
    try {
      if (ruta === '/salud') return json(200, { ok: true });
      if (ruta === '/editor' ) { res.writeHead(302, { location: `/editor/${url.search}` }); return res.end(); }
      if (ruta === '/editor/') return servirArchivo(req, res, join(AQUI, 'editor', 'index.html'));
      // el token va en la cabecera; el reproductor (<video src>) no puede mandarla, así que también se acepta ?t=
      if (token && req.headers.authorization !== `Bearer ${token}` && url.searchParams.get('t') !== token) return json(401, { error: 'no autorizado' });

      if (req.method === 'POST' && ruta === '/derive') return json(202, { trabajo: publico(cola.derivar(await leerJson(req))) });
      if (req.method === 'GET' && ruta === '/trabajos') return json(200, { trabajos: cola.lista().slice(0, 100).map(publico) });
      let m = ruta.match(/^\/trabajos\/([\w-]+)(\/archivo)?$/);
      if (m && req.method === 'GET') {
        const t = cola.trabajo(m[1]);
        if (!t) return json(404, { error: 'no existe ese trabajo' });
        if (!m[2]) return json(200, { trabajo: publico(t) });
        if (t.estado !== 'listo' || !existsSync(t.salida)) return json(409, { error: `el trabajo está ${t.estado}` });
        return servirArchivo(req, res, t.salida);
      }

      if (req.method === 'POST' && ruta === '/cortes') return json(201, { corte: cola.cortes.guardar(await leerJson(req)) });
      if (req.method === 'POST' && ruta === '/cortes/primer') {
        const { shotlist, clips, agente } = await leerJson(req);
        const { corte, faltantes } = primerCorte({ shotlist, clips, agente });
        return json(201, { corte: cola.cortes.guardar(corte), faltantes });
      }
      m = ruta.match(/^\/cortes\/([\w-]+)(\/render)?$/);
      if (m) {
        if (m[2] && req.method === 'POST') return json(202, { trabajo: publico(cola.renderizar(m[1])) });
        if (req.method === 'GET') return json(200, { corte: cola.cortes.leer(m[1]) });
        if (req.method === 'PUT') {
          const { corte, version } = await leerJson(req);
          return json(200, { corte: cola.cortes.guardar({ ...corte, id: m[1] }, { esperaVersion: version }) });
        }
      }

      if (req.method === 'GET' && ruta === '/estilos') return json(200, { categorias: CATEGORIAS, estilos: (url.searchParams.get('completo') ? estilos() : estilos().map(resumen)) });
      m = ruta.match(/^\/estilos\/([\w-]+)$/);
      if (req.method === 'GET' && m) { const e = estilos().find((x) => x.id === m[1]); return e ? json(200, { estilo: e }) : json(404, { error: `no existe el estilo ${m[1]}` }); }
      m = ruta.match(/^\/cortes\/([\w-]+)\/estilo$/);
      if (req.method === 'POST' && m) {
        const { estilo: id, recursos, version } = await leerJson(req);
        const e = estilos().find((x) => x.id === id);
        if (!e) return json(404, { error: `no existe el estilo ${id}; usa GET /estilos` });
        return json(200, cola.aplicarEstilo(m[1], e, recursos, version));
      }
      if (req.method === 'GET' && ruta === '/referencias') return json(200, { referencias: cola.referencias() });
      if (req.method === 'POST' && ruta === '/desglose') { const b = await leerJson(req); return json(202, { trabajo: publico(cola.desglose(b.ruta, b.referencia ?? null)) }); }
      m = ruta.match(/^\/referencias\/([\w-]+)\/imitar$/);
      if (req.method === 'POST' && m) { const b = await leerJson(req); return json(200, cola.imitar(m[1], b.corte, { estilos: estilos(), recursos: b.recursos, version: b.version })); }
      if (req.method === 'POST' && ruta === '/mascaras') return json(202, { trabajo: publico(cola.mascara((await leerJson(req)).clip)) });
      if (req.method === 'GET' && ruta === '/medios/fuentes') return json(200, { fuentes: cola.fuentes() });
      m = ruta.match(/^\/medios\/(musica|imagenes)$/);
      if (req.method === 'GET' && m) {
        const dir = join(raiz, m[1]);
        const ok = CARPETAS[m[1]];
        const archivos = existsSync(dir) ? readdirSync(dir).filter((f) => ok.test(f)).sort().map((f) => `${m[1]}/${f}`) : [];
        return json(200, { archivos });
      }
      if (req.method === 'GET' && ruta === '/medios') return servirArchivo(req, res, cola.fuente(url.searchParams.get('ruta')));
      return json(404, { error: 'no existe' });
    } catch (e) {
      const usuario = e instanceof ErrorEntrada || e instanceof ErrorCorte || e instanceof ErrorEstilo || /shot list|toma|clip/.test(e.message);
      if (!usuario) console.error(e);
      return json(usuario ? (/conflicto/.test(e.message) ? 409 : 400) : 500, { error: e.message });
    }
  });
  return { servidor, cola };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = process.env.VIDEO_RAIZ;
  if (!raiz) { console.error('falta VIDEO_RAIZ (carpeta de medios)'); process.exit(2); }
  const puerto = Number(process.env.VIDEO_PUERTO ?? 4310);
  const { servidor } = crearServidor({ raiz, datos: process.env.VIDEO_DATOS ?? join(AQUI, 'datos'), token: process.env.VIDEO_TOKEN });
  servidor.listen(puerto, '127.0.0.1', () => console.log(`video escuchando en 127.0.0.1:${puerto}`));
}
