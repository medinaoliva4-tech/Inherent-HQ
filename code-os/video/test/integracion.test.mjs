// Prueba de punta a punta con ffmpeg real: derivada, primer corte por agente, corrección con versión y render.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearServidor } from '../servidor.mjs';
import { sondear } from '../ffmpeg.mjs';
import { responder, crearCliente } from '../mcp.mjs';

const FF = process.env.VIDEO_FFMPEG || 'ffmpeg';
let hayFfmpeg = true, hayLibass = false;
try { hayLibass = / subtitles /.test(execFileSync(FF, ['-hide_banner', '-filters'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()); } catch { hayFfmpeg = false; }
// los textos se queman con libass (filtro subtitles); el ffmpeg de Homebrew viene sin él: sin libass se prueba el corte sin texto
if (hayFfmpeg && !hayLibass) console.log('# aviso: este ffmpeg no trae libass; el render de textos no se prueba aquí');

const ff = (...a) => execFileSync(FF, ['-y', '-loglevel', 'error', ...a]);

test('servicio de video de punta a punta', { skip: !hayFfmpeg && 'sin ffmpeg' }, async (t) => {
  const raiz = mkdtempSync(join(tmpdir(), 'video-raiz-'));
  const datos = mkdtempSync(join(tmpdir(), 'video-datos-'));
  for (const d of ['crudo', 'musica', 'imagenes']) mkdirSync(join(raiz, d));
  ff('-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:r=30', '-f', 'lavfi', '-i', 'sine=f=440', '-t', '6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', join(raiz, 'crudo/E01.mp4'));
  ff('-f', 'lavfi', '-i', 'mandelbrot=s=1280x720:r=30', '-t', '4', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', join(raiz, 'crudo/E02-sin-audio.mp4'));
  ff('-f', 'lavfi', '-i', 'sine=f=220', '-t', '20', join(raiz, 'musica/pista.m4a'));
  ff('-f', 'lavfi', '-i', 'color=c=orange@0.8:s=300x300,format=rgba', '-frames:v', '1', join(raiz, 'imagenes/sol.png'));
  const fuera = mkdtempSync(join(tmpdir(), 'video-fuera-'));
  symlinkSync(fuera, join(raiz, 'escape'));

  const { servidor, cola } = crearServidor({ raiz, datos, token: 'secreto' });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const api = async (metodo, ruta, cuerpo, token = 'secreto') => {
    const r = await fetch(base + ruta, { method: metodo, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: cuerpo && JSON.stringify(cuerpo) });
    return { estado: r.status, cuerpo: await r.json().catch(() => null) };
  };
  t.after(() => { servidor.close(); rmSync(raiz, { recursive: true, force: true }); rmSync(datos, { recursive: true, force: true }); rmSync(fuera, { recursive: true, force: true }); });

  await t.test('pide token y no sale de la carpeta de medios', async () => {
    assert.equal((await api('POST', '/derive', { videoId: 'crudo/E01', formato: '9:16' }, null)).estado, 401);
    assert.equal((await api('POST', '/derive', { ruta: '../../etc/passwd', formato: '9:16' })).estado, 400);
    assert.equal((await api('POST', '/derive', { ruta: '/etc/hosts', formato: '9:16' })).estado, 400);
    assert.match((await api('POST', '/derive', { ruta: 'escape/x.mp4', formato: '9:16' })).cuerpo.error, /no existe|fuera/);
    assert.equal((await api('POST', '/derive', { videoId: 'crudo/E01', formato: '4:5' })).estado, 400);
  });

  await t.test('video.derive: 9:16 de un tramo con música, estado consultable', async () => {
    const r = await api('POST', '/derive', { videoId: 'crudo/E01', formato: '9:16', inicio: 1, fin: 4, musica: 'musica/pista.m4a' });
    assert.equal(r.estado, 202);
    assert.ok(['pendiente', 'procesando'].includes(r.cuerpo.trabajo.estado));
    await cola.vaciar();
    const { cuerpo } = await api('GET', `/trabajos/${r.cuerpo.trabajo.id}`);
    assert.equal(cuerpo.trabajo.estado, 'listo', cuerpo.trabajo.error);
    assert.equal(cuerpo.trabajo.progreso, 1);
    const salida = cola.trabajo(cuerpo.trabajo.id).salida;
    const info = await sondear(salida);
    assert.ok(Math.abs(info.duracion - 3) < 0.15, `dura ${info.duracion}`);
    const dims = execFileSync(process.env.VIDEO_FFPROBE || 'ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', salida]).toString().trim();
    assert.equal(dims, '1080,1920');
    const arch = await fetch(base + cuerpo.trabajo.archivo + '?t=secreto', { headers: { range: 'bytes=0-99' } });
    assert.equal(arch.status, 206);
  });

  await t.test('primer corte por agente → corrección del humano → render', async () => {
    const shotlist = { titulo: 'Reel prueba', formato: '9:16', musica: { ruta: 'musica/pista.m4a', volumen: 0.2 }, tomas: [
      { id: 'E01', duracion: 2, texto: hayLibass ? 'Sal de la rutina' : null, estilos: [{ tipo: 'zoom', desde: 1, hasta: 1.15 }, { tipo: 'color', preset: 'calido' }, ...(hayLibass ? [{ tipo: 'animacion-texto', capa: 'principal', animacion: 'subir' }] : [])] },
      { id: 'E02', duracion: 1.5, capas: [{ id: 'sol', tipo: 'imagen', ruta: 'imagenes/sol.png', escala: 0.3, y: 0.25 }], estilos: [{ tipo: 'transicion', entrada: 'fundido', duracion: 0.3 }] },
      { id: 'E09', duracion: 2 },
    ] };
    const clips = [{ ruta: 'crudo/E01.mp4', duracion: 6 }, { ruta: 'crudo/E02-sin-audio.mp4', duracion: 4 }];
    const p = await api('POST', '/cortes/primer', { shotlist, clips });
    assert.equal(p.estado, 201, JSON.stringify(p.cuerpo));
    assert.deepEqual(p.cuerpo.faltantes.map((f) => f.toma), ['E09']);
    const corte = p.cuerpo.corte;
    assert.equal(corte.version, 1);

    // el humano corrige: sube el texto, cambia el orden, cambia la fuente → versión 2
    if (hayLibass) corte.escenas[0].capas[0].y = 0.3;
    corte.escenas.reverse();
    const g = await api('PUT', `/cortes/${corte.id}`, { corte, version: 1 });
    assert.equal(g.estado, 200);
    assert.equal(g.cuerpo.corte.version, 2);
    assert.equal(g.cuerpo.corte.escenas[0].id, 'e-E02');
    // guardar con una versión vieja no pisa la corrección
    assert.equal((await api('PUT', `/cortes/${corte.id}`, { corte, version: 1 })).estado, 409);

    const r = await api('POST', `/cortes/${corte.id}/render`);
    assert.equal(r.estado, 202);
    await cola.vaciar();
    const tr = cola.trabajo(r.cuerpo.trabajo.id);
    assert.equal(tr.estado, 'listo', tr.error);
    const info = await sondear(tr.salida);
    assert.ok(Math.abs(info.duracion - 3.5) < 0.2, `dura ${info.duracion}`);
    assert.ok(info.tieneAudio);
    assert.equal(r.cuerpo.trabajo.version, 2);
  });

  await t.test('catálogo: listar, aplicar un estilo con recursos y renderizar', async () => {
    const lista = await api('GET', '/estilos');
    assert.ok(lista.cuerpo.estilos.some((e) => e.id === 'tarjetas-que-flotan'));
    const escenas = [0, 1, 2].map((i) => ({ id: `s${i}`, clip: 'crudo/E01.mp4', inicio: i, fin: i + 1.2, texto: hayLibass ? `Frase ${i + 1}` : null }));
    const c = (await api('POST', '/cortes', { titulo: 'Con estilo', escenas })).cuerpo.corte;
    assert.equal((await api('POST', `/cortes/${c.id}/estilo`, { estilo: 'no-existe' })).estado, 404);
    assert.match((await api('POST', `/cortes/${c.id}/estilo`, { estilo: 'tarjetas-que-flotan' })).cuerpo.error, /2 × tarjetas/);
    assert.equal((await api('POST', `/cortes/${c.id}/estilo`, { estilo: 'tarjetas-que-flotan', recursos: { tarjetas: ['../x.png', 'imagenes/sol.png'] } })).estado, 400);
    const ap = await api('POST', `/cortes/${c.id}/estilo`, { estilo: 'tarjetas-que-flotan', recursos: { tarjetas: ['imagenes/sol.png', 'imagenes/sol.png'] }, version: 1 });
    assert.equal(ap.estado, 200, JSON.stringify(ap.cuerpo));
    assert.equal(ap.cuerpo.corte.version, 2);
    assert.equal(ap.cuerpo.corte.estilo, 'tarjetas-que-flotan');
    const r = await api('POST', `/cortes/${c.id}/render`);
    await cola.vaciar();
    const tr = cola.trabajo(r.cuerpo.trabajo.id);
    assert.equal(tr.estado, 'listo', tr.error);
    assert.ok(Math.abs((await sondear(tr.salida)).duracion - 3.6) < 0.2);
  });

  await t.test('referencias: desglose de un video → se guarda en la referencia → «Imitar este» lo aplica', async () => {
    // video «de referencia» local: 3 tomas (2 s, 1.5 s, 2 s), la última entra con fundido desde negro
    ff('-f', 'lavfi', '-i', 'testsrc2=s=720x1280:r=30:d=2', '-f', 'lavfi', '-i', 'mandelbrot=s=720x1280:r=30', '-f', 'lavfi', '-i', 'color=c=0xe9c79a:s=720x1280:r=30:d=2',
      '-filter_complex', '[1:v]trim=0:1.5,setpts=PTS-STARTPTS[b];[2:v]fade=t=in:st=0:d=0.5[c];[0:v][b][c]concat=n=3:v=1[v]', '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', join(raiz, 'crudo/ref.mp4'));
    const refs = (await api('GET', '/referencias')).cuerpo.referencias;
    assert.ok(refs.length >= 5 && refs.every((r) => r.fuente_url?.startsWith('https://')));
    const d = await api('POST', '/desglose', { ruta: 'crudo/ref.mp4', referencia: 'me-at-the-zoo' });
    assert.equal(d.estado, 202);
    await cola.vaciar();
    const tr = cola.trabajo(d.cuerpo.trabajo.id);
    assert.equal(tr.estado, 'listo', tr.error);
    assert.deepEqual(tr.resultado.desglose.escenas.map((e) => [e.inicio, e.fin, e.rol]), [[0, 2, 'gancho'], [2, 3.5, 'cuerpo'], [3.5, 5.5, 'cierre']]);
    assert.equal(tr.resultado.desglose.escenas[2].fundido_entrada, true);
    assert.equal(tr.resultado.desglose.formato, '9:16');
    assert.ok((await api('GET', '/referencias')).cuerpo.referencias.find((r) => r.id === 'me-at-the-zoo').breakdown, 'el desglose quedó en la referencia');
    const escenas = [0, 1, 2].map((i) => ({ id: `r${i}`, clip: 'crudo/E01.mp4', inicio: 0, fin: 3, texto: hayLibass ? `Frase ${i}` : null }));
    const c = (await api('POST', '/cortes', { titulo: 'Imitando', escenas })).cuerpo.corte;
    const im = await api('POST', '/referencias/me-at-the-zoo/imitar', { corte: c.id });
    assert.equal(im.estado, 200, JSON.stringify(im.cuerpo));
    assert.equal(im.cuerpo.metodo, 'desglose');
    assert.deepEqual(im.cuerpo.corte.escenas.map((e) => +(e.fin - e.inicio).toFixed(2)), [2, 1.5, 2], 'imita el ritmo');
    assert.match(im.cuerpo.corte.escenas[2].referencia, /entra con fundido/);
    assert.ok(im.cuerpo.corte.escenas[2].estilos.some((s) => s.tipo === 'transicion'));
    const sin = await api('POST', '/referencias/simon-sinek-start-with-why/imitar', { corte: c.id });
    assert.equal(sin.cuerpo.metodo, 'estilo-sugerido');
    assert.equal(sin.cuerpo.corte.estilo, 'entrevista-larga');
  });

  await t.test('style menu por marca → video con su marca → cambiar escenas y música → render', async () => {
    mkdirSync(join(raiz, 'marcas', 'akai', 'musica'), { recursive: true });
    ff('-f', 'lavfi', '-i', 'sine=f=330', '-t', '10', join(raiz, 'marcas/akai/musica/tema.m4a'));
    const nueva = await api('POST', '/marcas', { id: 'akai', nombre: 'AKAI', colores: [{ nombre: 'Crema', hex: '#F3EAD8', uso: 'texto' }, { nombre: 'Rojo', hex: '#c0392b', uso: 'caja' }],
      musica: [{ nombre: 'Tema', ruta: 'marcas/akai/musica/tema.m4a' }], guia: 'Cortes rápidos; nada de Halloween.' });
    assert.equal(nueva.estado, 201, JSON.stringify(nueva.cuerpo));
    for (const [seccion, id] of [['transiciones', 'fundido-negro'], ['efectos', 'punch-in'], ['efectos', 'color-calido'], ['estilos', 'caja-subtitulos'], ['transiciones', 'barrido']]) {
      assert.equal((await api('POST', '/marcas/akai/elegir', { seccion, id })).estado, 200);
    }
    const ficha = (await api('GET', '/marcas/akai')).cuerpo;
    assert.deepEqual(ficha.marca.elegidos.transiciones, ['fundido-negro', 'barrido']);
    assert.deepEqual(ficha.archivos.musica.map((x) => x.ruta), ['marcas/akai/musica/tema.m4a'], 've lo que hay en su carpeta');
    const guia = ficha.guia;
    assert.deepEqual(guia.transiciones.map((x) => [x.id, x.render]), [['fundido-negro', true], ['barrido', false]]);
    assert.ok(guia.reglas.some((r) => /Halloween/.test(r)));
    assert.equal(guia.predeterminados.color_texto, '#f3ead8');

    const escenas = [0, 1, 2].map((i) => ({ id: `m${i}`, clip: 'crudo/E01.mp4', inicio: i, fin: i + 1.2, texto: hayLibass ? `Frase ${i}` : null }));
    const v = (await api('POST', '/videos', { titulo: 'Con marca', marca: 'akai', escenas })).cuerpo.video;
    assert.equal(v.marca, 'akai');
    assert.equal(v.musica.ruta, 'marcas/akai/musica/tema.m4a', 'la música de la marca entra sola');
    assert.equal(v.musica.ducking, true);
    const est = await api('POST', `/videos/${v.id}/estilo`, { estilo: 'caja-subtitulos' });
    assert.equal(est.estado, 200, JSON.stringify(est.cuerpo));
    if (hayLibass) assert.equal(est.cuerpo.video.escenas[0].capas[0].caja, '#c0392b', 'la caja toma el color de la marca');
    assert.equal(est.cuerpo.video.escenas[1].estilo, 'caja-subtitulos');
    const tr = await api('POST', `/videos/${v.id}/escenas/2`, { transicion: 'fundido-negro' });
    assert.equal(tr.estado, 200, JSON.stringify(tr.cuerpo));
    assert.deepEqual(tr.cuerpo.video.escenas[1].estilos.find((s) => s.tipo === 'transicion'), { tipo: 'transicion', entrada: 'fundido', duracion: 0.4 });
    assert.match((await api('POST', `/videos/${v.id}/escenas/2`, { transicion: 'barrido' })).cuerpo.error, /todavía no tiene render/);
    const ef = await api('POST', `/videos/${v.id}/escenas/3`, { efecto: 'color-calido' });
    assert.ok(ef.cuerpo.video.escenas[2].estilos.some((s) => s.tipo === 'color' && s.preset === 'calido'));
    const sinEf = await api('POST', `/videos/${v.id}/escenas/3`, { efecto: 'color-calido', quitar: true });
    assert.ok(!sinEf.cuerpo.video.escenas[2].estilos.some((s) => s.tipo === 'color'));
    const mu = await api('PUT', `/videos/${v.id}/musica`, { musica: { ruta: 'musica/pista.m4a', volumen: 0.3, ducking: true } });
    assert.equal(mu.cuerpo.video.musica.ruta, 'musica/pista.m4a');
    assert.equal((await api('PUT', `/videos/${v.id}/musica`, { musica: { ruta: '../fuera.m4a' } })).estado, 400);
    assert.deepEqual((await api('GET', '/videos?marca=akai')).cuerpo.videos.map((x) => x.id), [v.id]);
    const r = await api('POST', `/videos/${v.id}/render`);
    await cola.vaciar();
    const trab = cola.trabajo(r.cuerpo.trabajo.id);
    assert.equal(trab.estado, 'listo', trab.error);
    assert.ok((await sondear(trab.salida)).tieneAudio);
  });

  await t.test('las listas de medios y el MCP', async () => {
    const cliente = crearCliente({ base, token: 'secreto' });
    const lista = await responder({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, cliente);
    assert.deepEqual(lista.result.tools.map((x) => x.name).sort(), ['corte_guardar', 'corte_leer', 'corte_primer', 'corte_render', 'estilos_aplicar', 'estilos_listar', 'marca_guia', 'marcas_listar', 'referencia_imitar', 'referencias_listar', 'video_derive', 'video_desglose', 'video_escena', 'video_mascara', 'video_musica', 'video_trabajo']);
    const d = await responder({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'video_derive', arguments: { videoId: 'crudo/E02-sin-audio', formato: '1:1' } } }, cliente);
    const id = JSON.parse(d.result.content[0].text).trabajo.id;
    await cola.vaciar();
    const e = await responder({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'video_trabajo', arguments: { id } } }, cliente);
    assert.equal(JSON.parse(e.result.content[0].text).trabajo.estado, 'listo');
    const mal = await responder({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'video_derive', arguments: { formato: '9:16' } } }, cliente);
    assert.equal(mal.result.isError, true);
  });
});
