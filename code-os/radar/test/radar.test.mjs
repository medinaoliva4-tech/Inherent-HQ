import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cargarConfig } from '../config.mjs';
import { clasificarError, crearFuentes, ErrorFuente, normalizarYtdlp, urlCuenta } from '../fuentes.mjs';
import { calcularMetricas } from '../metricas.mjs';
import { detectarQuemado, dhashDeBytes, dhashVideo, hamming, similitudAudio, similitudTexto, similitudVisual } from '../huellas.mjs';
import { elegirSub, ganchoHeuristico, vttATexto } from '../transcribir.mjs';
import { crearIA, leerJson } from '../ia.mjs';
import { correrRadar, leerArgs, leerReferentes } from '../radar.mjs';
import { crearCache, crearRitmo, mediana } from '../util.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'radar-test-'));
const hayFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

// ---------- util ----------
test('mediana y caché con vencimiento', () => {
  assert.equal(mediana([3, 1, 2]), 2);
  assert.equal(mediana([4, 1, 2, 3]), 2.5);
  assert.equal(mediana([null, undefined]), null);
  const c = crearCache(tmp());
  c.escribir('a', { x: 1 }, 1000);
  assert.deepEqual(c.leer('a', Infinity), { x: 1 });
  assert.equal(c.leer('a', 1, 1000 + 2 * 3600e3), undefined);
  assert.equal(c.leer('nada'), undefined);
});

test('ritmo: dos peticiones a la misma plataforma esperan la pausa; plataformas distintas no', async () => {
  let reloj = 0;
  const esperas = [];
  const turno = crearRitmo({ youtube: 1000, tiktok: 500 }, { jitter: 0, ahora: () => reloj, dormir: async (ms) => { esperas.push(ms); reloj += ms; } });
  await turno('youtube');
  await turno('tiktok');
  await turno('youtube');
  assert.deepEqual(esperas, [1000]);
});

// ---------- fuentes ----------
test('urlCuenta y normalización de yt-dlp', () => {
  assert.equal(urlCuenta({ plataforma: 'youtube', usuario: '@Nick' }), 'https://www.youtube.com/@Nick/shorts');
  assert.equal(urlCuenta({ plataforma: 'youtube', usuario: 'Nick', seccion: 'videos' }), 'https://www.youtube.com/@Nick/videos');
  assert.equal(urlCuenta({ plataforma: 'tiktok', usuario: 'nick' }), 'https://www.tiktok.com/@nick');
  assert.throws(() => urlCuenta({ plataforma: 'myspace', usuario: 'x' }), ErrorFuente);
  const p = normalizarYtdlp({ id: 'abc', title: 'T', view_count: 100, like_count: 10, comment_count: 2, duration: 25, upload_date: '20261101', webpage_url: 'https://y/abc', channel_follower_count: 1000 }, { plataforma: 'youtube', usuario: '@Nick', rol: 'icp' });
  assert.equal(p.clave, 'youtube:abc');
  assert.equal(p.cuenta, 'Nick');
  assert.equal(p.fecha, '2026-11-01T00:00:00.000Z');
  assert.equal(p.vistas, 100);
  assert.equal(p.compartidos, null);
});

test('clasificarError: bloqueo/anti-bot se reconoce para parar, no para insistir', () => {
  assert.equal(clasificarError("ERROR: Sign in to confirm you're not a bot"), 'BLOQUEO');
  assert.equal(clasificarError('HTTP Error 429: Too Many Requests'), 'BLOQUEO');
  assert.equal(clasificarError('Unable to extract data'), 'NO_DISPONIBLE');
  assert.equal(clasificarError('algo raro'), 'ERROR');
});

test('fuentes: lista con yt-dlp usa caché y ritmo; Instagram sin token no intenta nada', async () => {
  const cfg = cargarConfig({ HOME: tmp() });
  let llamadas = 0, turnos = 0;
  const ejecutar = async (_bin, args) => {
    llamadas++;
    assert.ok(args.includes('--flat-playlist'));
    return { stdout: JSON.stringify({ channel_follower_count: 500, entries: [{ id: '1', url: 'https://t/1', view_count: 10 }, { id: '2', url: 'https://t/2', view_count: 20 }] }) };
  };
  const f = crearFuentes(cfg, { cache: crearCache(tmp()), turno: async () => { turnos++; }, ejecutar });
  const a = await f.listar({ plataforma: 'tiktok', usuario: 'x' }, 2);
  const b = await f.listar({ plataforma: 'tiktok', usuario: 'x' }, 2);
  assert.equal(a.length, 2);
  assert.equal(a[0].seguidores, 500);
  assert.deepEqual(a, b);
  assert.equal(llamadas, 1);
  assert.equal(turnos, 1);
  await assert.rejects(f.listar({ plataforma: 'instagram', usuario: 'x' }), (e) => e.codigo === 'NO_DISPONIBLE');
});

test('fuentes: Instagram por la API oficial (simulada) mapea likes y comentarios', async () => {
  const cfg = cargarConfig({ HOME: tmp(), IG_GRAPH_TOKEN: 't', IG_USER_ID: '99' });
  const fetchImpl = async (url) => {
    assert.match(url, /graph\.facebook\.com\/v21\.0\/99\?fields=business_discovery/);
    return { ok: true, status: 200, json: async () => ({ business_discovery: { followers_count: 1000, media: { data: [{ id: 'm1', like_count: 50, comments_count: 5, permalink: 'https://ig/p/m1', timestamp: '2026-11-01T10:00:00+0000', media_product_type: 'REELS' }] } } }) };
  };
  const f = crearFuentes(cfg, { cache: crearCache(tmp()), turno: async () => {}, fetchImpl });
  const [p] = await f.listar({ plataforma: 'instagram', usuario: '@marca' }, 3);
  assert.equal(p.likes, 50);
  assert.equal(p.vistas, null);
  assert.equal(p.seguidores, 1000);
});

// ---------- métricas ----------
test('métricas: winner = rinde frente a SU cuenta, no por tamaño', () => {
  const base = (cuenta, id, vistas, likes) => ({ clave: `youtube:${id}`, id, plataforma: 'youtube', cuenta, vistas, likes, comentarios: 0, compartidos: null, fecha: '2026-10-01T00:00:00Z' });
  const posts = [
    base('grande', 'g1', 1_000_000, 10_000), base('grande', 'g2', 1_100_000, 11_000), base('grande', 'g3', 900_000, 9_000),
    base('chica', 'c1', 1_000, 10), base('chica', 'c2', 1_000, 10), base('chica', 'c3', 5_000, 100),
  ];
  const r = calcularMetricas(posts, { ahora: Date.parse('2026-11-10T00:00:00Z') });
  assert.equal(r[0].id, 'c3');
  assert.equal(r[0].winner, true);
  assert.equal(r[0].metricas.x_cuenta, 5);
  assert.equal(r[0].metricas.engagement, 0.02);
  assert.equal(r.find((p) => p.id === 'g2').winner, false);
  assert.deepEqual(r.map((p) => p.rango), [1, 2, 3, 4, 5, 6]);
});

test('métricas: con menos de 3 publicaciones no se declara winner', () => {
  const r = calcularMetricas([{ clave: 'a', plataforma: 'tiktok', cuenta: 'x', vistas: 10, likes: 1 }, { clave: 'b', plataforma: 'tiktok', cuenta: 'x', vistas: 1000, likes: 1 }]);
  assert.ok(r.every((p) => !p.winner));
});

// ---------- huellas ----------
test('dHash y Hamming', () => {
  const sube = Buffer.from(Array.from({ length: 72 }, (_, i) => i % 9));
  const baja = Buffer.from(Array.from({ length: 72 }, (_, i) => 8 - (i % 9)));
  assert.equal(dhashDeBytes(sube), '0000000000000000');
  assert.equal(dhashDeBytes(baja), 'ffffffffffffffff');
  assert.equal(hamming('00000000000000ff', '0000000000000000'), 8);
});

test('similitud visual: ignora fotogramas planos y tolera recompresión', () => {
  const A = ['0f0f0f0f0f0f0f0f', '3c3c3c3c3c3c3c3c', 'aaaa5555aaaa5555', '1234567890abcdef'];
  const B = ['0f0f0f0f0f0f0f0e', '3c3c3c3c3c3c3c3d', 'aaaa5555aaaa5554', '0000000000000000'];
  assert.equal(similitudVisual(A, B), 1);
  assert.equal(similitudVisual(A, ['f0f0f0f0f0f0f0f0', 'c3c3c3c3c3c3c3c3', '5555aaaa5555aaaa']), 0);
  assert.equal(similitudVisual(['0000000000000000', '0000000000000000', '0000000000000000'], ['0000000000000000', '0000000000000000', '0000000000000000']), 0);
});

test('similitud de audio con desfase y texto por tríos', () => {
  const fa = Array.from({ length: 200 }, (_, i) => (Math.imul(i + 1, 2654435761) >>> 0) | 0);
  const fb = [7, 7, 7, 7, 7, ...fa];
  const otro = Array.from({ length: 200 }, (_, i) => (Math.imul(i + 999, 40503) ^ 0x5bd1e995) | 0);
  assert.equal(similitudAudio(fa, fb), 1);
  assert.ok(similitudAudio(fa, otro) < 0.4);
  assert.ok(similitudTexto('Este es el secreto que nadie te cuenta sobre el pan', 'este es el SECRETO que nadie te cuenta sobre el pan casero') > 0.9);
  assert.equal(similitudTexto('hola mundo cruel y raro', 'nada que ver con esto aquí'), 0);
});

test('quemado: aparece en 2 otras cuentas = quemado; mismo audio solo = no cuenta como contenido', () => {
  const dh = ['0f0f0f0f0f0f0f0f', '3c3c3c3c3c3c3c3c', 'aaaa5555aaaa5555'];
  const audio = Array.from({ length: 100 }, (_, i) => (i * 2654435761) | 0);
  const yo = { clave: 'tiktok:1', plataforma: 'tiktok', cuenta: 'yo', url: 'u1', huellas: { dhash: dh, audio, texto: '' } };
  const indice = [
    { clave: 'youtube:9', plataforma: 'youtube', cuenta: 'otra', dhash: dh, audio: null, texto: '' },
    { clave: 'tiktok:8', plataforma: 'tiktok', cuenta: 'tercera', dhash: dh, audio: null, texto: '' },
    { clave: 'tiktok:7', plataforma: 'tiktok', cuenta: 'musica', dhash: ['f0f0f0f0f0f0f0f0', 'c3c3c3c3c3c3c3c3', '5555aaaa5555aaaa'], audio, texto: '' },
  ];
  const [r] = detectarQuemado([yo], indice, { visual: 0.6, audio: 0.7, texto: 0.5, cuentasQuemado: 2 });
  assert.equal(r.quemado.estado, 'quemado');
  assert.deepEqual(r.quemado.otras_cuentas.sort(), ['tiktok:tercera', 'youtube:otra']);
  assert.deepEqual(r.quemado.mismo_audio_en, ['tiktok:7']);
  const [solo] = detectarQuemado([yo], [indice[0]], { visual: 0.6, audio: 0.7, texto: 0.5, cuentasQuemado: 2 });
  assert.equal(solo.quemado.estado, 'visto');
  const [fresco] = detectarQuemado([yo], [], { visual: 0.6, audio: 0.7, texto: 0.5, cuentasQuemado: 2 });
  assert.equal(fresco.quemado.estado, 'fresco');
});

test('dHash real con ffmpeg: recompresión = mismo contenido; otro video = distinto', { skip: !hayFfmpeg && 'sin ffmpeg' }, async () => {
  const d = tmp();
  const a = join(d, 'a.mp4'), b = join(d, 'b.mp4'), c = join(d, 'c.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=25:duration=6', '-pix_fmt', 'yuv420p', a]);
  execFileSync('ffmpeg', ['-v', 'error', '-i', a, '-vf', 'scale=320:180,eq=brightness=0.04', '-crf', '38', b]);
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'mandelbrot=size=640x360:rate=25', '-t', '6', '-pix_fmt', 'yuv420p', c]);
  const [ha, hb, hc] = await Promise.all([a, b, c].map((v) => dhashVideo(v)));
  assert.ok(ha.length >= 5);
  assert.ok(similitudVisual(ha, hb) >= 0.8, `recomprimido: ${similitudVisual(ha, hb)}`);
  assert.ok(similitudVisual(ha, hc) < 0.3, `distinto: ${similitudVisual(ha, hc)}`);
});

// ---------- transcripción ----------
test('VTT de subtítulos automáticos (rodados) a texto limpio', () => {
  const vtt = `WEBVTT\nKind: captions\nLanguage: en\n\n00:00:00.000 --> 00:00:01.000 align:start position:0%\nthis is the<00:00:00.500><c> best</c>\n\n00:00:01.000 --> 00:00:01.010\nthis is the best\n\n00:00:01.010 --> 00:00:02.000\nthis is the best\nsteak I ever<00:00:01.500><c> made</c>\n\n00:00:02.000 --> 00:00:02.010\nsteak I ever made\n`;
  assert.equal(vttATexto(vtt), 'this is the best steak I ever made');
  assert.equal(elegirSub(['s.en.vtt', 's.en-orig.vtt', 's.es.vtt']), 's.en-orig.vtt');
  assert.equal(elegirSub(['s.json']), null);
  assert.equal(ganchoHeuristico('¿Sabías que el 90% lo hace mal? Te explico.'), '¿Sabías que el 90% lo hace mal?');
  assert.equal(ganchoHeuristico('', 'Título solo'), 'Título solo');
});

// ---------- IA ----------
test('IA: sin llave no llama; con llave respeta el tope de llamadas y de dólares', async () => {
  assert.deepEqual(await crearIA(cargarConfig({})).resumirGancho({}), { omitido: 'sin LITELLM_MASTER_KEY' });
  let n = 0;
  const fetchImpl = async (url, opt) => {
    n++;
    assert.match(url, /\/chat\/completions$/);
    assert.equal(JSON.parse(opt.body).model, 'nivel-bajo');
    return { ok: true, json: async () => ({ model: 'nv', usage: { total_tokens: 400 }, choices: [{ message: { content: '```json\n{"gancho":"¿Sabías que…?","tipo":"pregunta","por_que":"abre curiosidad","angulo":"error común"}\n```' } }] }) };
  };
  const cfg = cargarConfig({ LITELLM_MASTER_KEY: 'k', RADAR_MAX_LLAMADAS_IA: '1' });
  const ia = crearIA(cfg, { fetchImpl });
  const r = await ia.resumirGancho({ titulo: 't', transcripcion: 'x', plataforma: 'youtube' });
  assert.equal(r.tipo, 'pregunta');
  assert.deepEqual(await ia.resumirGancho({}), { omitido: 'tope de llamadas' });
  assert.equal(n, 1);
  assert.equal(ia.estado().usd, 0);
  const caro = crearIA(cargarConfig({ LITELLM_MASTER_KEY: 'k', RADAR_USD_POR_MTOK: '1000', RADAR_PRESUPUESTO_USD: '0.0001' }), { fetchImpl });
  assert.deepEqual(await caro.resumirGancho({ titulo: 't' }), { omitido: 'presupuesto' });
  assert.equal(n, 1);
  assert.deepEqual(leerJson('basura {"a":1} más'), { a: 1 });
  assert.equal(leerJson('nada'), null);
});

// ---------- extremo a extremo (sin red) ----------
test('correrRadar: de referentes a radar.md, nodos hipótesis y bloqueo que para la plataforma', async () => {
  const home = tmp(), out = join(tmp(), 'salida');
  const cfg = cargarConfig({ HOME: home, RADAR_CACHE_DIR: join(home, 'c') });
  const posts = (cuenta, vistas) => vistas.map((v, i) => ({ clave: `youtube:${cuenta}${i}`, id: `${cuenta}${i}`, plataforma: 'youtube', cuenta, url: `https://y/${cuenta}${i}`, titulo: `Video ${i}. Segunda frase`, fecha: '2026-10-01T00:00:00Z', vistas: v, likes: v / 10, comentarios: 1, compartidos: null, duracion_s: 30 }));
  const fuentes = {
    listar: async (ref) => {
      if (ref.plataforma === 'tiktok') throw new ErrorFuente('BLOQUEO', 'HTTP Error 429');
      return posts(ref.usuario, [100, 120, 110, 900]);
    },
    detalle: async (p) => ({ post: p }),
  };
  const r = await correrRadar({
    referentes: [{ plataforma: 'youtube', usuario: 'a', rol: 'icp' }, { plataforma: 'tiktok', usuario: 'b' }, { plataforma: 'tiktok', usuario: 'c' }],
    cliente: 'demo', out, cfg, sinVideo: true,
    deps: { fuentes, ia: { resumirGancho: async () => ({ omitido: 'x' }), estado: () => ({ llamadas: 0, tokens: 0, usd: 0, omitidas: 0 }) }, log: () => {} },
  });
  assert.equal(r.posts.length, 4);
  assert.equal(r.posts[0].id, 'a3');
  assert.equal(r.posts[0].winner, true);
  assert.equal(r.posts[0].gancho.metodo, 'heuristico');
  assert.equal(r.posts[0].gancho.gancho, 'Video 3.');
  assert.deepEqual(r.errores.map((e) => e.codigo), ['BLOQUEO', 'OMITIDO']);
  assert.equal(r.estadisticas.referentes_ok, 1);
  assert.equal(r.nodos.length, 1);
  assert.equal(r.nodos[0].estado, 'hipotesis');
  assert.equal(r.nodos[0].tipo, 'radar');
  assert.ok(existsSync(join(out, 'radar.md')));
  assert.match(readFileSync(join(out, 'radar.md'), 'utf8'), /🏆/);
});

test('CLI: argumentos y referentes', () => {
  assert.deepEqual(leerArgs(['r.json', '--max', '3', '--sin-ia', '--presupuesto-usd', '0']), { _: ['r.json'], max: '3', sinIA: true, presupuestoUsd: '0' });
  assert.deepEqual(leerReferentes('[{"plataforma":"youtube","usuario":"x"},{"usuario":"sin plataforma"}]'), { cliente: null, referentes: [{ plataforma: 'youtube', usuario: 'x' }] });
  assert.equal(leerReferentes({ cliente: 'akai', referentes: [] }).cliente, 'akai');
});

test('VTT: entidades HTML y marcas de cambio de hablante', () => {
  assert.equal(vttATexto('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nThe device is flipped &gt;&gt; Got the device.\n'), 'The device is flipped Got the device.');
});
