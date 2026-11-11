#!/usr/bin/env node
// Radar con sentido — referentes públicos → publicaciones, métricas, winners, gancho y «quemado».
// Uso:
//   node code-os/radar/radar.mjs <referentes.json> [--out DIR] [--cliente ID] [--max 5]
//        [--sin-video] [--sin-ia] [--presupuesto-usd 0] [--max-ia 30]
// referentes.json: [{ "plataforma": "youtube|tiktok|instagram", "usuario": "@cuenta", "rol": "cliente|icp|competidor" }]
//   o { "cliente": "akai", "referentes": [...] }
// Solo datos públicos, una petición a la vez por plataforma, con pausa; si la plataforma frena, se para.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cargarConfig } from './config.mjs';
import { crearFuentes, ErrorFuente } from './fuentes.mjs';
import { detectarQuemado, dhashVideo, huellaAudio } from './huellas.mjs';
import { crearIA } from './ia.mjs';
import { escribirSalida, nodosRadar } from './informe.mjs';
import { calcularMetricas } from './metricas.mjs';
import { ganchoHeuristico, subtitulos, whisper } from './transcribir.mjs';
import { correr, crearCache, crearRitmo, hayBinario } from './util.mjs';

export function leerArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--sin-video') a.sinVideo = true;
    else if (x === '--sin-ia') a.sinIA = true;
    else if (x.startsWith('--')) a[x.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
    else a._.push(x);
  }
  return a;
}

export function leerReferentes(json) {
  const j = typeof json === 'string' ? JSON.parse(json) : json;
  const lista = Array.isArray(j) ? j : j.referentes ?? [];
  return { cliente: Array.isArray(j) ? null : j.cliente ?? null, referentes: lista.filter((r) => r && r.plataforma && r.usuario) };
}

export async function correrRadar({ referentes, cliente = null, out, cfg = cargarConfig(), sinVideo = false, sinIA = false, deps = {} }) {
  const t0 = Date.now();
  const cache = deps.cache ?? crearCache(cfg.cacheDir);
  const turno = deps.turno ?? crearRitmo(cfg.pausasMs);
  const ejecutar = deps.ejecutar ?? correr;
  const fuentes = deps.fuentes ?? crearFuentes(cfg, { cache, turno, ejecutar });
  const ia = deps.ia ?? crearIA(cfg);
  const log = deps.log ?? ((m) => process.stderr.write(m + '\n'));
  const tiene = { fpcalc: await hayBinario(cfg.bin.fpcalc), ffmpeg: await hayBinario(cfg.bin.ffmpeg) };
  const dirFotos = join(cfg.cacheDir, 'fotogramas');
  mkdirSync(dirFotos, { recursive: true });

  const errores = [];
  const bloqueadas = new Set();
  const tiempos = { listar: 0, detalle: 0, media: 0, ia: 0 };
  let posts = [];

  // 1) Listar y completar métricas
  for (const ref of referentes) {
    if (bloqueadas.has(ref.plataforma)) { errores.push({ ...ref, codigo: 'OMITIDO', mensaje: `${ref.plataforma} nos frenó antes en esta corrida` }); continue; }
    const t = Date.now();
    try {
      const lista = await fuentes.listar(ref, Number(cfg.maxPorCuenta));
      tiempos.listar += Date.now() - t;
      for (const p of lista) {
        const td = Date.now();
        try { posts.push((await fuentes.detalle(p)).post); } catch (e) {
          posts.push(p);
          errores.push({ plataforma: p.plataforma, usuario: p.url, codigo: e.codigo ?? 'ERROR', mensaje: e.message });
          if (e.codigo === 'BLOQUEO') { bloqueadas.add(p.plataforma); break; }
        }
        tiempos.detalle += Date.now() - td;
      }
      log(`· ${ref.plataforma}/${ref.usuario}: ${lista.length} publicaciones`);
    } catch (e) {
      tiempos.listar += Date.now() - t;
      errores.push({ ...ref, codigo: e instanceof ErrorFuente ? e.codigo : 'ERROR', mensaje: e.message });
      if (e.codigo === 'BLOQUEO') bloqueadas.add(ref.plataforma);
      log(`× ${ref.plataforma}/${ref.usuario}: ${e.codigo ?? 'ERROR'} ${e.message}`);
    }
  }

  // 2) Transcripción + huellas (con caché permanente y tope de MB)
  let descargaMB = 0;
  const seg = cfg.presupuesto.segundosAnalisis;
  if (!sinVideo) {
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i];
      if (bloqueadas.has(p.plataforma)) continue;
      const t = Date.now();
      const clave = `media:${p.clave}:${seg}`;
      let media = cache.leer(clave);
      if (!media) {
        media = await procesarMedia(p, { cfg, turno, ejecutar, tiene, dirFotos, restanteMB: cfg.presupuesto.descargaMB - descargaMB, seg });
        descargaMB += media.mb ?? 0;
        if (media.bloqueo) { bloqueadas.add(p.plataforma); errores.push({ plataforma: p.plataforma, usuario: p.url, codigo: 'BLOQUEO', mensaje: media.bloqueo }); }
        else if (!media.incompleto) cache.escribir(clave, media);
      }
      posts[i] = { ...p, transcripcion: media.transcripcion ?? null, fuente_transcripcion: media.fuente ?? null, fotograma: media.fotograma ?? null,
        huellas: { dhash: media.dhash ?? [], audio: media.audio ?? null, texto: (media.transcripcion ?? p.titulo ?? '').slice(0, 500) },
        notas_media: media.notas ?? [] };
      tiempos.media += Date.now() - t;
      log(`  ${p.clave}: ${media.fuente ?? 'sin transcripción'} · ${media.dhash?.length ?? 0} fotogramas · audio ${media.audio ? 'sí' : 'no'}`);
    }
  }

  // 3) Gancho (LiteLLM barato, con caché; respaldo heurístico)
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const t = Date.now();
    let g = null;
    if (!sinIA) {
      const clave = `gancho:${p.clave}:${cfg.litellm.nivelVision || cfg.litellm.nivel}`;
      g = cache.leer(clave);
      if (!g) {
        g = await ia.resumirGancho({ titulo: p.titulo, transcripcion: p.transcripcion, plataforma: p.plataforma, duracion_s: p.duracion_s }, { fotograma: p.fotograma });
        if (g?.gancho) cache.escribir(clave, g);
      }
    }
    if (!g?.gancho) g = { ...(g ?? {}), gancho: ganchoHeuristico(p.transcripcion, p.titulo), tipo: null, metodo: 'heuristico' };
    posts[i] = { ...p, gancho: g };
    tiempos.ia += Date.now() - t;
  }

  // 4) Métricas, ranking y quemado contra todo lo que el radar ya vio
  posts = calcularMetricas(posts, { umbralWinner: cfg.umbrales.winner });
  const rutaIndice = join(cfg.cacheDir, 'indice-huellas.json');
  const indice = existsSync(rutaIndice) ? JSON.parse(readFileSync(rutaIndice, 'utf8')) : [];
  posts = detectarQuemado(posts, indice, cfg.umbrales);
  const nuevo = new Map(indice.map((x) => [x.clave, x]));
  for (const p of posts) if (p.huellas?.dhash?.length || p.huellas?.audio || p.transcripcion) {
    nuevo.set(p.clave, { clave: p.clave, plataforma: p.plataforma, cuenta: p.cuenta, url: p.url, ...p.huellas });
  }
  writeFileSync(rutaIndice, JSON.stringify([...nuevo.values()]));

  // 5) Salida
  const generado = new Date().toISOString();
  const salida = posts.map(({ huellas, ...p }) => ({ ...p, huellas: { fotogramas: huellas?.dhash?.length ?? 0, audio: !!huellas?.audio } }));
  if (out) {
    mkdirSync(join(out, 'fotogramas'), { recursive: true });
    for (const p of salida) if (p.fotograma && existsSync(p.fotograma)) {
      const destino = join(out, 'fotogramas', p.fotograma.split('/').pop());
      copyFileSync(p.fotograma, destino);
      p.fotograma = join('fotogramas', p.fotograma.split('/').pop());
    }
  }
  const est = ia.estado();
  const r = {
    cliente, generado, referentes, umbrales: cfg.umbrales,
    posts: salida,
    errores,
    ia: { nivel: cfg.litellm.nivel, ...est },
    estadisticas: {
      segundos_total: Math.round((Date.now() - t0) / 100) / 10,
      tiempos_s: Object.fromEntries(Object.entries(tiempos).map(([k, v]) => [k, Math.round(v / 100) / 10])),
      publicaciones: salida.length,
      exito_publicaciones: salida.filter((p) => p.vistas !== null || p.likes !== null).length,
      con_transcripcion: salida.filter((p) => p.transcripcion).length,
      con_huella_visual: salida.filter((p) => p.huellas.fotogramas > 0).length,
      con_huella_audio: salida.filter((p) => p.huellas.audio).length,
      descarga_mb: Math.round(descargaMB * 10) / 10,
      referentes_ok: referentes.filter((ref) => !errores.some((e) => e.plataforma === ref.plataforma && e.usuario === ref.usuario)).length,
    },
  };
  r.nodos = nodosRadar(r.posts, { cliente, generado });
  if (out) escribirSalida(out, r);
  return r;
}

async function procesarMedia(p, { cfg, turno, ejecutar, tiene, dirFotos, restanteMB, seg }) {
  const media = { notas: [], mb: 0 };
  const deYtdlp = p.plataforma !== 'instagram';
  if (deYtdlp) {
    const s = await subtitulos(p.url, { ytdlp: cfg.bin.ytdlp, idiomas: cfg.idiomasSubs, turno, plataforma: p.plataforma, ejecutar });
    if (s) { media.transcripcion = s.texto; media.fuente = s.fuente; }
  }
  if (!tiene.ffmpeg) { media.notas.push('sin ffmpeg: no hay huellas'); return media; }
  const dir = mkdtempSync(join(tmpdir(), 'radar-v-'));
  try {
    let video = null;
    if (deYtdlp) {
      if (restanteMB <= 0) { media.notas.push('tope de descarga alcanzado'); media.incompleto = true; return media; }
      const maxMB = Math.max(1, Math.min(cfg.presupuesto.videoPorPublicacionMB, Math.floor(restanteMB)));
      await turno(p.plataforma);
      try {
        await ejecutar(cfg.bin.ytdlp, ['--no-update', '--no-warnings', '--ignore-config', '-f', '18/b[height<=480]/w', '--max-filesize', `${maxMB}M`,
          '--no-playlist', '-o', join(dir, 'v.%(ext)s'), p.url], { timeout: 300_000 });
      } catch (e) {
        const msg = (e.stderr || e.message || '').split('\n').filter(Boolean).pop() ?? '';
        if (/429|not a bot|sign in|login|captcha/i.test(msg)) { media.bloqueo = msg.slice(0, 200); return media; }
        media.notas.push(`no se pudo bajar: ${msg.slice(0, 160)}`); media.incompleto = true; return media;
      }
      const f = readdirSync(dir).find((x) => x.startsWith('v.') && !x.endsWith('.part'));
      if (!f) { media.notas.push('video más pesado que el tope'); return media; }
      video = join(dir, f);
      media.mb = statSync(video).size / 1048576;
    } else if (p.media_url && /VIDEO|REELS/i.test(p.tipo ?? '')) {
      video = p.media_url; // ffmpeg lee la URL pública que entrega la API oficial
    } else {
      media.notas.push('sin video'); return media;
    }
    media.dhash = await dhashVideo(video, { ffmpeg: cfg.bin.ffmpeg, segundos: seg, ejecutar }).catch(() => []);
    if (tiene.fpcalc) media.audio = await huellaAudio(video, { fpcalc: cfg.bin.fpcalc, segundos: seg, ejecutar }).catch(() => null);
    const foto = join(dirFotos, `${p.plataforma}-${p.id}.jpg`);
    await ejecutar(cfg.bin.ffmpeg, ['-v', 'error', '-y', '-ss', '0.5', '-i', video, '-frames:v', '1', '-vf', 'scale=-2:480', '-q:v', '4', foto]).catch(() => null);
    if (existsSync(foto)) media.fotograma = foto;
    if (!media.transcripcion) {
      const w = await whisper(video, { ffmpeg: cfg.bin.ffmpeg, bin: cfg.bin.whisper, modelo: cfg.whisperModelo, segundos: seg, ejecutar });
      if (w) { media.transcripcion = w.texto; media.fuente = w.fuente; }
      else media.notas.push(cfg.whisperModelo ? 'whisper sin texto' : 'sin subtítulos y sin WHISPER_MODEL');
    }
    return media;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function main() {
  const a = leerArgs(process.argv.slice(2));
  if (!a._[0]) {
    process.stderr.write('Uso: node code-os/radar/radar.mjs <referentes.json> [--out DIR] [--cliente ID] [--max 5] [--sin-video] [--sin-ia] [--presupuesto-usd 0] [--max-ia 30]\n');
    process.exit(2);
  }
  const { cliente, referentes } = leerReferentes(readFileSync(a._[0], 'utf8'));
  const extra = { presupuesto: {} };
  if (a.max) extra.maxPorCuenta = Number(a.max);
  if (a.presupuestoUsd) extra.presupuesto.usd = Number(a.presupuestoUsd);
  if (a.maxIa) extra.presupuesto.llamadasIA = Number(a.maxIa);
  const cfg = cargarConfig(process.env, extra);
  const out = resolve(a.out ?? `radar-${new Date().toISOString().slice(0, 10)}`);
  const r = await correrRadar({ referentes, cliente: a.cliente ?? cliente, out, cfg, sinVideo: !!a.sinVideo, sinIA: !!a.sinIA });
  process.stdout.write(`${join(out, 'radar.md')}\n${JSON.stringify(r.estadisticas)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main().catch((e) => { process.stderr.write(`radar: ${e.stack ?? e}\n`); process.exit(1); });
