// Cola de trabajos de video (derivadas y render de cortes) con estado consultable y persistido.
// Concurrencia 1 por defecto: en el VPS (4 núcleos, sin GPU) un ffmpeg ya usa casi toda la CPU.
import { mkdirSync, readFileSync, writeFileSync, existsSync, realpathSync, copyFileSync, rmSync, renameSync, readdirSync } from 'node:fs';
import { join, resolve, sep, extname, dirname } from 'node:path';
import { spawn as spawnProceso } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { argsDerivada, argsEscena, argsUnir, argsFinal, assTexto, nombreTipografia, correr as correrFfmpeg, sondear as sondearFfprobe } from './ffmpeg.mjs';
import { normalizarCorte, duracionCorte, FORMATOS, ErrorCorte } from './corte.mjs';
import { aplicarEstilo as aplicarEstiloACorte } from './estilos.mjs';

export class ErrorEntrada extends Error {}
const AQUI = dirname(fileURLToPath(import.meta.url));

let sec = 0;
const nuevoId = () => `v${Date.now().toString(36)}${(sec++).toString(36)}`;

/** Convierte `videoId` o una ruta en una ruta real DENTRO de la raíz de medios (nunca fuera). */
export function resolverFuente(raiz, ref) {
  if (!ref || typeof ref !== 'string') throw new ErrorEntrada('falta videoId o ruta');
  const base = realpathSync(raiz);
  const candidatos = ref.startsWith('/') ? [ref] : [join(base, ref), ...(extname(ref) ? [] : [join(base, `${ref}.mp4`), join(base, `${ref}.mov`)])];
  for (const c of candidatos) {
    if (!existsSync(c)) continue;
    const real = realpathSync(c);
    if (real !== base && !real.startsWith(base + sep)) throw new ErrorEntrada(`fuera de la carpeta de medios: ${ref}`);
    return real;
  }
  throw new ErrorEntrada(`no existe: ${ref}`);
}

/** Tipografías propias: <raíz>/fuentes/*.ttf|otf → [{ nombre (el que va en capa.fuente), ruta }]. */
export function listarFuentes(raiz) {
  const dir = join(raiz, 'fuentes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.(ttf|otf)$/i.test(f)).sort().flatMap((f) => {
    try { const nombre = nombreTipografia(join(dir, f)); return nombre ? [{ nombre, ruta: `fuentes/${f}` }] : []; } catch { return []; }
  });
}

/** Valida el pedido de video.derive. */
export function validarDerivada(p) {
  if (!p || typeof p !== 'object') throw new ErrorEntrada('pedido vacío');
  const ref = p.videoId ?? p.ruta;
  if (!ref) throw new ErrorEntrada('falta videoId o ruta');
  const formato = p.formato ?? '9:16';
  if (!FORMATOS[formato]) throw new ErrorEntrada(`formato inválido: ${formato}`);
  const inicio = p.inicio ?? 0;
  if (typeof inicio !== 'number' || inicio < 0) throw new ErrorEntrada('inicio debe ser un número ≥ 0');
  if (p.fin != null && !(typeof p.fin === 'number' && p.fin > inicio)) throw new ErrorEntrada('fin debe ser mayor que inicio');
  const musica = typeof p.musica === 'string' ? { ruta: p.musica } : p.musica ?? null;
  if (musica && !musica.ruta) throw new ErrorEntrada('musica necesita ruta');
  return { ref, formato, inicio, fin: p.fin ?? null, subtitulos: p.subtitulos ?? null, musica };
}

export function crearCola({ datos, raiz, concurrencia = 1, ffmpeg = correrFfmpeg, sondear = sondearFfprobe, ahora = () => new Date().toISOString() }) {
  mkdirSync(join(datos, 'salidas'), { recursive: true });
  mkdirSync(join(datos, 'cortes'), { recursive: true });
  mkdirSync(join(datos, 'tmp'), { recursive: true });
  const archivo = join(datos, 'trabajos.json');
  const trabajos = new Map();
  if (existsSync(archivo)) {
    for (const t of JSON.parse(readFileSync(archivo, 'utf8'))) {
      // lo que quedó a medias cuando se apagó el servicio vuelve a la cola
      if (t.estado === 'procesando') Object.assign(t, { estado: 'pendiente', progreso: 0 });
      trabajos.set(t.id, t);
    }
  }
  const guardar = () => {
    const tmp = `${archivo}.tmp`;
    writeFileSync(tmp, JSON.stringify([...trabajos.values()].slice(-500), null, 1));
    renameSync(tmp, archivo);
  };
  let activos = 0;
  const esperando = new Set();

  const fuente = (ref) => resolverFuente(raiz, ref);
  const fuenteLimpia = (ruta, dir, nombre) => { const d = join(dir, nombre + extname(ruta)); copyFileSync(ruta, d); return d; };

  async function hacerDerivada(t, dir) {
    const p = t.pedido;
    const ruta = fuente(p.ref);
    const info = await sondear(ruta);
    const fin = p.fin ?? info.duracion;
    const total = fin - p.inicio;
    const subtitulos = p.subtitulos ? fuenteLimpia(fuente(p.subtitulos), dir, 'subs') : null;
    const musica = p.musica ? { ...p.musica, ruta: fuente(p.musica.ruta) } : null;
    await ffmpeg(argsDerivada({ fuente: ruta, salida: t.salida, formato: p.formato, inicio: p.inicio, fin, tieneAudio: info.tieneAudio, subtitulos, musica }),
      { alProgreso: (s) => avance(t, s / total) });
  }

  async function hacerCorte(t, dir) {
    const corte = normalizarCorte(t.pedido.corte);
    const total = duracionCorte(corte);
    const fontsdir = existsSync(join(raiz, 'fuentes')) ? realpathSync(join(raiz, 'fuentes')) : null;
    let hecho = 0;
    const partes = [];
    for (const [i, e] of corte.escenas.entries()) {
      const clip = fuente(e.clip);
      const info = await sondear(clip);
      const rutas = { clip, capas: {}, textos: {}, fontsdir };
      for (const [j, c] of e.capas.entries()) {
        if (c.tipo === 'imagen') { rutas.capas[c.id] = fuente(c.ruta); continue; }
        const anim = e.estilos.find((s) => s.tipo === 'animacion-texto' && s.capa === c.id)?.animacion;
        rutas.textos[c.id] = join(dir, `t${i}-${j}.ass`);
        writeFileSync(rutas.textos[c.id], assTexto(corte.formato, c, e.fin - e.inicio, c.fuente, anim));
      }
      const detras = e.estilos.find((s) => s.tipo === 'detras-de-persona');
      if (detras?.mascara) rutas.mascara = fuente(detras.mascara);
      const salida = join(dir, `e${String(i).padStart(3, '0')}.mp4`);
      await ffmpeg(argsEscena({ escena: e, formato: corte.formato, salida, tieneAudio: info.tieneAudio, rutas }),
        { alProgreso: (s) => avance(t, (hecho + s) / total * 0.9) });
      hecho += e.fin - e.inicio;
      partes.push(salida);
    }
    const lista = join(dir, 'lista.txt');
    writeFileSync(lista, partes.map((p) => `file '${p}'`).join('\n'));
    const unido = join(dir, 'unido.mp4');
    await ffmpeg(argsUnir({ lista, salida: unido }));
    const musica = corte.musica ? { ...corte.musica, ruta: fuente(corte.musica.ruta) } : null;
    const subtitulos = corte.subtitulos ? fuenteLimpia(fuente(corte.subtitulos), dir, 'subs') : null;
    if (musica || subtitulos) await ffmpeg(argsFinal({ entrada: unido, salida: t.salida, musica, subtitulos }), { alProgreso: (s) => avance(t, 0.9 + 0.1 * s / total) });
    else renameSync(unido, t.salida);
  }

  // máscara de persona (para «detrás de la persona»): python + MediaPipe; queda en <raíz>/mascaras/ para que el corte la cite
  async function hacerMascara(t) {
    const clip = fuente(t.pedido.clip);
    const python = process.env.VIDEO_PYTHON || 'python3';
    const modelo = process.env.VIDEO_MODELO_MASCARA;
    if (!modelo) throw new Error('falta VIDEO_MODELO_MASCARA (selfie_segmenter.tflite)');
    mkdirSync(join(raiz, 'mascaras'), { recursive: true });
    const nombre = `mascaras/${t.pedido.clip.replace(/[^\w.-]+/g, '_').replace(/\.\w+$/, '')}.mp4`;
    await new Promise((ok, mal) => {
      const p = spawnProceso(python, [join(AQUI, 'mascara.py'), clip, join(raiz, nombre), '--modelo', modelo, '--ffmpeg', process.env.VIDEO_FFMPEG || 'ffmpeg'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let err = ''; p.stderr.on('data', (d) => { err = (err + d).slice(-2000); });
      p.on('error', mal);
      p.on('close', (c) => (c === 0 ? ok() : mal(new Error(`mascara.py salió con ${c}: ${err.trim().split('\n').at(-1)}`))));
    });
    t.resultado = { mascara: nombre };
  }

  function avance(t, fr) {
    const p = Math.max(0, Math.min(0.99, fr));
    if (p - t.progreso >= 0.02) { t.progreso = Number(p.toFixed(2)); guardar(); }
  }

  async function ejecutar(t) {
    activos++;
    const dir = join(datos, 'tmp', t.id);
    mkdirSync(dir, { recursive: true });
    Object.assign(t, { estado: 'procesando', iniciado: ahora(), progreso: 0, error: null });
    guardar();
    const t0 = Date.now();
    try {
      await (t.tipo === 'corte' ? hacerCorte(t, dir) : t.tipo === 'mascara' ? hacerMascara(t) : hacerDerivada(t, dir));
      Object.assign(t, { estado: 'listo', progreso: 1, terminado: ahora(), segundos: Number(((Date.now() - t0) / 1000).toFixed(1)) });
    } catch (e) {
      Object.assign(t, { estado: 'error', error: String(e.message ?? e), terminado: ahora() });
    } finally {
      rmSync(dir, { recursive: true, force: true });
      activos--;
      guardar();
      for (const r of esperando) r();
      siguiente();
    }
  }

  function siguiente() {
    while (activos < concurrencia) {
      const t = [...trabajos.values()].find((x) => x.estado === 'pendiente');
      if (!t) return;
      ejecutar(t);
    }
  }

  function encolar(tipo, pedido) {
    const id = nuevoId();
    const t = { id, tipo, estado: 'pendiente', progreso: 0, creado: ahora(), pedido, salida: resolve(datos, 'salidas', `${id}.mp4`), error: null };
    trabajos.set(id, t);
    guardar();
    queueMicrotask(siguiente);
    return t;
  }

  // ── cortes (el JSON de escenas que escribe el agente y corrige el humano) ──
  const rutaCorte = (id) => {
    if (!/^[\w-]+$/.test(id)) throw new ErrorEntrada('id de corte inválido');
    return join(datos, 'cortes', `${id}.json`);
  };
  const cortes = {
    guardar(c, { esperaVersion } = {}) {
      const n = normalizarCorte(c);
      const r = rutaCorte(n.id);
      if (existsSync(r)) {
        const prev = JSON.parse(readFileSync(r, 'utf8'));
        // evita pisar la corrección del humano con una versión vieja (o al revés)
        if (esperaVersion != null && prev.version !== esperaVersion) throw new ErrorEntrada(`conflicto: el corte va en la versión ${prev.version}`);
        n.version = prev.version + 1;
      }
      n.actualizado = ahora();
      writeFileSync(r, JSON.stringify(n, null, 2));
      return n;
    },
    leer(id) { const r = rutaCorte(id); if (!existsSync(r)) throw new ErrorEntrada(`no existe el corte ${id}`); return JSON.parse(readFileSync(r, 'utf8')); },
  };

  queueMicrotask(siguiente);
  return {
    derivar: (pedido) => {
      const p = validarDerivada(pedido);
      fuente(p.ref); if (p.musica) fuente(p.musica.ruta); if (p.subtitulos) fuente(p.subtitulos); // falla ya, no en la cola
      return encolar('derivada', p);
    },
    fuentes: () => listarFuentes(raiz),
    /** Aplica un estilo del catálogo al corte guardado; los recursos (rutas) tienen que existir en la raíz. */
    aplicarEstilo(idCorte, estilo, recursos = {}, esperaVersion) {
      for (const lista of Object.values(recursos ?? {})) for (const r of [].concat(lista)) fuente(r);
      const { corte, pendientes } = aplicarEstiloACorte(cortes.leer(idCorte), estilo, recursos);
      return { corte: cortes.guardar(corte, { esperaVersion }), pendientes };
    },
    mascara: (clip) => { fuente(clip); return encolar('mascara', { clip }); },
    renderizar: (idCorte) => { const c = cortes.leer(idCorte); return encolar('corte', { corte: c, idCorte, version: c.version }); },
    trabajo: (id) => trabajos.get(id) ?? null,
    lista: () => [...trabajos.values()].reverse(),
    cortes,
    fuente,
    /** Para pruebas: espera a que no quede nada pendiente ni procesando. */
    async vaciar() {
      while ([...trabajos.values()].some((t) => t.estado === 'pendiente' || t.estado === 'procesando')) {
        await new Promise((r) => { esperando.add(r); setTimeout(r, 200); });
        esperando.clear();
      }
    },
  };
}

export { ErrorCorte };
