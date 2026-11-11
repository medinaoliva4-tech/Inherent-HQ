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

  await t.test('las listas de medios y el MCP', async () => {
    assert.deepEqual((await api('GET', '/medios/musica')).cuerpo.archivos, ['musica/pista.m4a']);
    assert.deepEqual((await api('GET', '/medios/imagenes')).cuerpo.archivos, ['imagenes/sol.png']);
    const cliente = crearCliente({ base, token: 'secreto' });
    const lista = await responder({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, cliente);
    assert.deepEqual(lista.result.tools.map((x) => x.name).sort(), ['corte_guardar', 'corte_leer', 'corte_primer', 'corte_render', 'video_derive', 'video_mascara', 'video_trabajo']);
    const d = await responder({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'video_derive', arguments: { videoId: 'crudo/E02-sin-audio', formato: '1:1' } } }, cliente);
    const id = JSON.parse(d.result.content[0].text).trabajo.id;
    await cola.vaciar();
    const e = await responder({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'video_trabajo', arguments: { id } } }, cliente);
    assert.equal(JSON.parse(e.result.content[0].text).trabajo.estado, 'listo');
    const mal = await responder({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'video_derive', arguments: { formato: '9:16' } } }, cliente);
    assert.equal(mal.result.isError, true);
  });
});
