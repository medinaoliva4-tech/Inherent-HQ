import test from 'node:test';
import assert from 'node:assert/strict';
import { argsDerivada, argsEscena, argsFinal, cubrir, zoom, escFiltro, assTexto } from '../ffmpeg.mjs';
import { normalizarCorte } from '../corte.mjs';

const filtro = (args) => args[args.indexOf('-filter_complex') + 1];

test('cubrir llena el cuadro de cada formato sin barras', () => {
  assert.match(cubrir('9:16'), /scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920/);
  assert.match(cubrir('1:1'), /crop=1080:1080/);
  assert.match(cubrir('16:9'), /crop=1920:1080/);
});

test('zoom: vacío sin zoom; zoompan cuadro a cuadro con punto de enfoque', () => {
  assert.equal(zoom('9:16', { desde: 1, hasta: 1, x: 0.5, y: 0.5 }, 3), '');
  const z = zoom('9:16', { desde: 1, hasta: 1.2, x: 0.3, y: 0.4 }, 2);
  assert.match(z, /zoompan=z='1\+\(0\.2\)\*min\(on\/60\\,1\)'/);
  assert.match(z, /x='\(iw-iw\/zoom\)\*0\.3'/);
  assert.match(z, /d=1:s=1080x1920/);
});

test('derivada: tramo, formato, subtítulos y música mezclada', () => {
  const a = argsDerivada({ fuente: '/m/a.mp4', salida: '/o.mp4', formato: '1:1', inicio: 2, fin: 7, tieneAudio: true, subtitulos: '/tmp/x/subs.srt', musica: { ruta: '/m/p.mp3', volumen: 0.3 } });
  assert.deepEqual(a.slice(2, 8), ['-ss', '2', '-t', '5', '-i', '/m/a.mp4']);
  assert.match(filtro(a), /crop=1080:1080/);
  assert.match(filtro(a), /subtitles='\/tmp\/x\/subs.srt'/);
  assert.match(filtro(a), /\[1:a\]volume=0.3\[m\];\[0:a\]volume=1\[o\];\[o\]\[m\]amix/);
  assert.ok(a.includes('-shortest'));
  const sinAudio = argsDerivada({ fuente: '/m/a.mp4', salida: '/o.mp4', formato: '9:16', tieneAudio: false });
  assert.ok(!sinAudio.includes('0:a:0?'));
});

test('escena: color, zoom, capas en orden, animación, fundido y audio silencioso si falta', () => {
  const c = normalizarCorte({ escenas: [{ clip: 'a.mp4', inicio: 1, fin: 3, texto: 'Hola',
    capas: [{ id: 'logo', tipo: 'imagen', ruta: 'imagenes/logo.png', escala: 0.3, x: 0.5, y: 0.2 }],
    estilos: [{ tipo: 'color', preset: 'calido' }, { tipo: 'zoom', desde: 1, hasta: 1.1 }, { tipo: 'transicion', entrada: 'fundido', duracion: 0.4 },
      { tipo: 'animacion-texto', capa: 'principal', animacion: 'subir' }] }] });
  const e = c.escenas[0];
  const a = argsEscena({ escena: e, formato: '9:16', salida: '/t/e.mp4', tieneAudio: false,
    rutas: { clip: '/m/a.mp4', capas: { logo: '/m/imagenes/logo.png' }, textos: { principal: '/t/t0.ass' }, fontsdir: '/m/fuentes' } });
  const f = filtro(a);
  assert.ok(a.includes('anullsrc=r=48000:cl=stereo'));
  assert.ok(a.join(' ').includes('-loop 1 -t 2 -i /m/imagenes/logo.png'));
  assert.ok(f.indexOf('colorbalance') > f.indexOf('crop=1080:1920') && f.indexOf('zoompan') < f.indexOf('colorbalance'), 'cubrir → zoom → color');
  assert.ok(f.indexOf("overlay=x='main_w*0.5") < f.indexOf('subtitles='), 'la imagen (capa 1) va debajo del texto (capa 2)');
  assert.match(f, /subtitles='\/t\/t0.ass':fontsdir='\/m\/fuentes'/);
  assert.match(f, /fade=t=in:st=0:d=0.4/);
  assert.match(f, /\[1:a:0\]aresample=48000,afade=t=in:st=0:d=0.4\[a\]/);
});

test('detrás de la persona: la capa va entre el fondo y la persona recortada con su máscara', () => {
  const c = normalizarCorte({ escenas: [{ clip: 'a.mp4', inicio: 0, fin: 2, texto: 'Arriba',
    capas: [{ id: 'sol', tipo: 'imagen', ruta: 'imagenes/sol.mov' }],
    estilos: [{ tipo: 'detras-de-persona', capa: 'sol', mascara: 'mascaras/a.mp4' }] }] });
  // la capa principal (texto) se agregó al final: queda arriba de la persona
  const a = argsEscena({ escena: c.escenas[0], formato: '9:16', salida: '/t/e.mp4', tieneAudio: true,
    rutas: { clip: '/m/a.mp4', mascara: '/m/mascaras/a.mp4', capas: { sol: '/m/imagenes/sol.mov' }, textos: { principal: '/t/t.ass' } } });
  const f = filtro(a);
  assert.ok(a.join(' ').includes('-stream_loop -1 -t 2 -i /m/imagenes/sol.mov'), 'animación en bucle');
  assert.match(f, /split=2\[base\]\[persona0\]/);
  assert.match(f, /\[1:v\].*format=gray\[mask\]/);
  assert.match(f, /\[persona0\]\[mask\]alphamerge\[persona\]/);
  const iSol = f.indexOf('[2:v]scale'), iPersona = f.indexOf('[persona]overlay'), iTexto = f.indexOf('subtitles=');
  assert.ok(iSol < iPersona && iPersona < iTexto, 'sol → persona → texto');
});

test('final: copia si no hay nada que mezclar; mezcla música y quema subtítulos si los hay', () => {
  const solo = argsFinal({ entrada: '/u.mp4', salida: '/o.mp4' });
  assert.ok(!solo.includes('-filter_complex'));
  assert.deepEqual(solo.slice(solo.indexOf('-c:v'), solo.indexOf('-c:v') + 2), ['-c:v', 'copy']);
  const todo = argsFinal({ entrada: '/u.mp4', salida: '/o.mp4', musica: { ruta: '/p.mp3', volumen: 0.2 }, subtitulos: '/tmp/s.srt' });
  assert.match(filtro(todo), /subtitles=/);
  assert.match(filtro(todo), /amix/);
});

test('rutas peligrosas no entran a un filtro', () => {
  assert.throws(() => escFiltro("/tmp/a'b.srt"));
  assert.throws(() => escFiltro('/tmp/a:b.srt'));
  assert.throws(() => escFiltro('/tmp/a,b.srt'));
  assert.equal(escFiltro('/tmp/a b/c.srt'), '/tmp/a b/c.srt');
});

test('texto ASS: centro, tamaño, color, tipografía, animación y escapes', () => {
  const a = assTexto('9:16', { texto: 'Hola {mundo}\nabajo', x: 0.5, y: 0.25, tam: 0.05, color: '#F3EAD8' }, 2, 'Inter Bold', 'subir');
  assert.match(a, /PlayResX: 1080\nPlayResY: 1920/);
  assert.match(a, /Style: T,Inter Bold,/);
  assert.match(a, /Dialogue: 0,0:00:00.00,0:00:03.00,T,/);
  assert.match(a, /\\an5\\move\(540,557,540,480,0,500\)\\fad\(500,0\)\\fs115\\c&HD8EAF3&/);
  assert.match(a, /Hola \(mundo\)\\Nabajo/);
  assert.match(assTexto('1:1', { texto: 'x', x: 0.1, y: 0.9, tam: 0.1, color: '#000000' }, 1, null), /\\pos\(108,972\)\\fs130/);
});
