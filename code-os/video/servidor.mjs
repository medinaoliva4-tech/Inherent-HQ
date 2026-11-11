#!/usr/bin/env node
// Servicio de video de Code OS. Producir video = prompting: un agente edita con estas herramientas (ffmpeg detrás).
// Aquí no hay editor: hay datos organizados (style menu por marca, referencias, desglose por video) y tres vistas
// para verlos y cambiarlos (code-os/video/vistas/).
//
// Catálogo y marcas
//   GET  /catalogo                       transiciones, efectos, animaciones de texto (catalogo.json) + estilos (estilos/*.json)
//   GET  /marcas · POST /marcas          lista · crear/guardar una marca (su style menu)
//   GET  /marcas/:id                     la marca + los archivos de su carpeta (marcas/<id>/…) + su guía de edición
//   PUT  /marcas/:id                     guardar la marca completa
//   POST /marcas/:id/elegir              {seccion, id, elegido} → marcar/desmarcar algo del catálogo
//   GET  /marcas/:id/guia                guía de edición para el agente (lo que puede usar y cómo)
// Referencias
//   GET  /referencias · POST /referencias            biblioteca (semilla del repo + radar + propias)
//   POST /desglose                       {ruta, referencia?} → 202 {trabajo}; resultado.desglose
//   POST /referencias/:id/imitar         {video, version?} → desglose → receta → aplicada con el style menu de la marca del video
// Videos (el «corte»; /cortes/… funciona igual que /videos/…)
//   GET  /videos[?marca=]                lista
//   POST /videos · POST /videos/primer   crear · primer corte por agente {shotlist, clips, marca?}
//   GET  /videos/:id · PUT /videos/:id   {video|corte, version}
//   POST /videos/:id/estilo              {estilo, recursos?, version?} → receta a todas las escenas
//   POST /videos/:id/escenas/:n          {estilo?|transicion?|efecto?, quitar?, version?} → cambia una escena (n desde 1)
//   PUT  /videos/:id/musica              {musica: {ruta, volumen, ducking} | null, version?}
//   POST /videos/:id/render              → 202 {trabajo} (ffmpeg)
// Producción y medios
//   POST /derive · /mascaras · GET /trabajos · /trabajos/:id · /trabajos/:id/archivo · /medios?ruta= · /medios/fuentes
//   GET  /vistas/<archivo>               las tres vistas (estilo-marca.html, referencias.html, desglose.html)
// Variables: VIDEO_RAIZ (medios, obligatoria), VIDEO_DATOS, VIDEO_PUERTO (4310), VIDEO_TOKEN, VIDEO_FFMPEG/VIDEO_FFPROBE.
import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { join, extname, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crearCola, ErrorEntrada } from './cola.mjs';
import { ErrorCorte } from './corte.mjs';
import { primerCorte } from './primer-corte.mjs';
import { cargarEstilos, resumen, CATEGORIAS, ErrorEstilo } from './estilos.mjs';
import { ErrorReferencia } from './referencias.mjs';
import { crearMarcas, cargarCatalogo, guiaDeEdicion, aplicarMarca, ErrorMarca } from './marcas.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TIPOS = { '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.srt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf' };
const VISTAS = new Set(['estilo-marca.html', 'referencias.html', 'desglose.html', 'comun.mjs', 'comun.css']);

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

export function crearServidor({ raiz, datos, token, cola = crearCola({ raiz, datos }), dirEstilos, rutaCatalogo }) {
  // catálogo y recetas se releen en cada pedido: editar catalogo.json o agregar un .json no pide reiniciar
  const estilos = () => cargarEstilos(dirEstilos);
  const catalogo = () => cargarCatalogo(rutaCatalogo);
  const marcas = crearMarcas({ datos, raiz });
  const marcaDe = (video) => (video?.marca ? marcas.leer(video.marca) : null);
  // el video también va como «corte» (nombre que usan las herramientas del agente)
  const vid = (x, extra = {}) => ({ video: x, corte: x, ...extra });
  const publico = (t) => t && { id: t.id, tipo: t.tipo, estado: t.estado, progreso: t.progreso, creado: t.creado, iniciado: t.iniciado, terminado: t.terminado, segundos: t.segundos, error: t.error, resultado: t.resultado ?? null, video: t.pedido?.idCorte, version: t.pedido?.version, archivo: t.estado === 'listo' && !['mascara', 'desglose'].includes(t.tipo) ? `/trabajos/${t.id}/archivo` : null };

  const servidor = createServer(async (req, res) => {
    const json = (c, o) => { res.writeHead(c, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(o)); };
    const url = new URL(req.url, 'http://x');
    const ruta = url.pathname.replace(/^\/cortes(\/|$)/, '/videos$1'); // /cortes es el nombre viejo: mismo recurso
    const M = req.method;
    try {
      if (ruta === '/salud') return json(200, { ok: true });
      const v = ruta.match(/^\/vistas\/([\w.-]+)$/);
      if (v && VISTAS.has(v[1])) return servirArchivo(req, res, join(AQUI, 'vistas', basename(v[1])));
      // el token va en la cabecera; <video>/<img>/<audio> no pueden mandarla, así que también se acepta ?t=
      if (token && req.headers.authorization !== `Bearer ${token}` && url.searchParams.get('t') !== token) return json(401, { error: 'no autorizado' });
      let m;

      // ── catálogo y marcas ──
      if (M === 'GET' && ruta === '/catalogo') return json(200, { ...catalogo(), categorias: CATEGORIAS, estilos: estilos() });
      if (M === 'GET' && ruta === '/estilos') return json(200, { categorias: CATEGORIAS, estilos: url.searchParams.get('completo') ? estilos() : estilos().map(resumen) });
      if (M === 'GET' && (m = ruta.match(/^\/estilos\/([\w-]+)$/))) { const e = estilos().find((x) => x.id === m[1]); return e ? json(200, { estilo: e }) : json(404, { error: `no existe el estilo ${m[1]}` }); }
      if (M === 'GET' && ruta === '/marcas') return json(200, { marcas: marcas.lista() });
      if (M === 'POST' && ruta === '/marcas') return json(201, { marca: marcas.guardar(await leerJson(req)) });
      if ((m = ruta.match(/^\/marcas\/([\w-]+)(\/guia|\/elegir)?$/))) {
        if (M === 'GET' && !m[2]) { const marca = marcas.leer(m[1]); return json(200, { marca, archivos: marcas.archivos(m[1]), guia: guiaDeEdicion(marca, catalogo(), estilos()) }); }
        if (M === 'GET' && m[2] === '/guia') return json(200, { guia: guiaDeEdicion(marcas.leer(m[1]), catalogo(), estilos()) });
        if (M === 'PUT' && !m[2]) return json(200, { marca: marcas.guardar({ ...(await leerJson(req)), id: m[1] }) });
        if (M === 'POST' && m[2] === '/elegir') { const b = await leerJson(req); return json(200, { marca: marcas.elegir(m[1], b.seccion, b.id, b.elegido !== false) }); }
      }

      // ── referencias y desglose ──
      if (M === 'GET' && ruta === '/referencias') return json(200, { referencias: cola.referencias() });
      if (M === 'POST' && ruta === '/referencias') return json(201, { referencia: cola.agregarReferencia(await leerJson(req)) });
      if (M === 'POST' && ruta === '/desglose') { const b = await leerJson(req); return json(202, { trabajo: publico(cola.desglose(b.ruta, b.referencia ?? null)) }); }
      if (M === 'POST' && (m = ruta.match(/^\/referencias\/([\w-]+)\/imitar$/))) {
        const b = await leerJson(req); const id = b.video ?? b.corte;
        const r = cola.imitar(m[1], id, { estilos: estilos(), recursos: b.recursos, version: b.version, marca: marcaDe(cola.cortes.leer(id)) });
        return json(200, { ...r, video: r.corte });
      }

      // ── videos ──
      if (M === 'GET' && ruta === '/videos') {
        const marca = url.searchParams.get('marca');
        return json(200, { videos: cola.cortes.lista().filter((x) => !marca || x.marca === marca).map((x) => ({ id: x.id, titulo: x.titulo, formato: x.formato, marca: x.marca, imita: x.imita, version: x.version, escenas: x.escenas.length, duracion: +x.escenas.reduce((s, e) => s + e.fin - e.inicio, 0).toFixed(2), actualizado: x.actualizado })) });
      }
      if (M === 'POST' && ruta === '/videos') { const b = await leerJson(req); const marca = marcaDe(b); return json(201, vid(cola.cortes.guardar(marca ? aplicarMarca(b, marca) : b))); }
      if (M === 'POST' && ruta === '/videos/primer') {
        const { shotlist, clips, agente, marca: idMarca } = await leerJson(req);
        const { corte, faltantes } = primerCorte({ shotlist, clips, agente });
        const marca = idMarca ? marcas.leer(idMarca) : null;
        return json(201, vid(cola.cortes.guardar(marca ? aplicarMarca(corte, marca) : corte), { faltantes }));
      }
      if ((m = ruta.match(/^\/videos\/([\w-]+)$/))) {
        if (M === 'GET') return json(200, vid(cola.cortes.leer(m[1])));
        if (M === 'PUT') { const b = await leerJson(req); return json(200, vid(cola.cortes.guardar({ ...(b.video ?? b.corte), id: m[1] }, { esperaVersion: b.version }))); }
      }
      if (M === 'POST' && (m = ruta.match(/^\/videos\/([\w-]+)\/render$/))) return json(202, { trabajo: publico(cola.renderizar(m[1])) });
      if (M === 'POST' && (m = ruta.match(/^\/videos\/([\w-]+)\/estilo$/))) {
        const { estilo: id, recursos, version } = await leerJson(req);
        const e = estilos().find((x) => x.id === id);
        if (!e) return json(404, { error: `no existe el estilo ${id}; usa GET /catalogo` });
        { const r = cola.aplicarEstilo(m[1], e, recursos, version, { marca: marcaDe(cola.cortes.leer(m[1])) }); return json(200, { ...r, video: r.corte }); }
      }
      if (M === 'POST' && (m = ruta.match(/^\/videos\/([\w-]+)\/escenas\/(\d+)$/))) {
        const b = await leerJson(req); const cat = catalogo();
        const buscar = (lista, id, que) => { if (!id) return null; const x = lista.find((y) => y.id === id); if (!x) throw new ErrorEntrada(`no existe ${que} «${id}» en el catálogo`); return x; };
        const cambio = {
          estilo: buscar(estilos(), b.estilo, 'el estilo'),
          transicion: buscar(cat.transiciones, b.transicion, 'la transición'),
          efecto: buscar([...cat.efectos, ...cat.animaciones_texto], b.efecto, 'el efecto'),
          quitar: !!b.quitar, recursos: b.recursos,
        };
        return json(200, vid(cola.cambiarEscena(m[1], Number(m[2]) - 1, cambio, b.version, { marca: marcaDe(cola.cortes.leer(m[1])) })));
      }
      if (M === 'PUT' && (m = ruta.match(/^\/videos\/([\w-]+)\/musica$/))) { const b = await leerJson(req); return json(200, vid(cola.cambiarMusica(m[1], b.musica ?? null, b.version))); }

      // ── producción y medios ──
      if (M === 'POST' && ruta === '/derive') return json(202, { trabajo: publico(cola.derivar(await leerJson(req))) });
      if (M === 'POST' && ruta === '/mascaras') return json(202, { trabajo: publico(cola.mascara((await leerJson(req)).clip)) });
      if (M === 'GET' && ruta === '/trabajos') return json(200, { trabajos: cola.lista().slice(0, 100).map(publico) });
      if (M === 'GET' && (m = ruta.match(/^\/trabajos\/([\w-]+)(\/archivo)?$/))) {
        const t = cola.trabajo(m[1]);
        if (!t) return json(404, { error: 'no existe ese trabajo' });
        if (!m[2]) return json(200, { trabajo: publico(t) });
        if (t.estado !== 'listo' || !existsSync(t.salida)) return json(409, { error: `el trabajo está ${t.estado}` });
        return servirArchivo(req, res, t.salida);
      }
      if (M === 'GET' && ruta === '/medios/fuentes') return json(200, { fuentes: cola.fuentes() });
      if (M === 'GET' && ruta === '/medios') return servirArchivo(req, res, cola.fuente(url.searchParams.get('ruta')));
      return json(404, { error: 'no existe' });
    } catch (e) {
      const usuario = [ErrorReferencia, ErrorEntrada, ErrorCorte, ErrorEstilo, ErrorMarca].some((C) => e instanceof C) || /shot list|toma|clip/.test(e.message);
      if (!usuario) console.error(e);
      return json(usuario ? (/conflicto/.test(e.message) ? 409 : /^no existe (el|la|ese) /.test(e.message) ? 404 : 400) : 500, { error: e.message });
    }
  });
  return { servidor, cola, marcas };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = process.env.VIDEO_RAIZ;
  if (!raiz) { console.error('falta VIDEO_RAIZ (carpeta de medios)'); process.exit(2); }
  const puerto = Number(process.env.VIDEO_PUERTO ?? 4310);
  const { servidor } = crearServidor({ raiz, datos: process.env.VIDEO_DATOS ?? join(AQUI, 'datos'), token: process.env.VIDEO_TOKEN });
  servidor.listen(puerto, '127.0.0.1', () => console.log(`video escuchando en 127.0.0.1:${puerto}`));
}
