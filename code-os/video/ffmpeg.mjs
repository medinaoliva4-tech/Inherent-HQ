// Argumentos de ffmpeg (funciones puras, se prueban sin ejecutar) y el ejecutor con progreso.
import { spawn, execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { FORMATOS } from './corte.mjs';

export const FPS = 30;
const CODEC_V = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS)];
const CODEC_A = ['-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-ac', '2'];
const f3 = (n) => Number(n.toFixed(3));

/** Rutas dentro de un filtro (subtitles='…', textfile='…'): el escape de ffmpeg tiene dos niveles y es frágil,
 *  así que solo se aceptan rutas «limpias» (las del directorio temporal propio). Las del usuario se copian antes. */
export function escFiltro(s) {
  const r = String(s);
  if (/[':\\,;[\]\n]/.test(r)) throw new Error(`ruta no apta para filtro de ffmpeg: ${r}`);
  return r;
}

/** Llenar el cuadro del formato (recorte centrado, sin barras negras). */
export function cubrir(formato) {
  const { ancho: W, alto: H } = FORMATOS[formato];
  return `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${FPS}`;
}

/** Zoom progresivo de `desde` a `hasta` a lo largo de `duracion` s, enfocado en (x,y). Vacío si no hay zoom. */
export function zoom(formato, z, duracion) {
  if (!z || (z.desde === 1 && z.hasta === 1)) return '';
  const { ancho: W, alto: H } = FORMATOS[formato];
  const cuadros = Math.max(1, Math.round(duracion * FPS));
  const expr = `${z.desde}+(${f3(z.hasta - z.desde)})*min(on/${cuadros}\\,1)`;
  // zoompan con d=1 = un cuadro de salida por cada cuadro de entrada (sirve para video, no solo fotos)
  return `zoompan=z='${expr}':x='(iw-iw/zoom)*${z.x}':y='(ih-ih/zoom)*${z.y}':d=1:s=${W}x${H}:fps=${FPS}`;
}

/**
 * Texto como subtítulo ASS (libass): tipografía por nombre, borde, posición por centro y animación de entrada.
 * Se usa libass y no drawtext porque los ffmpeg estáticos (y el de Homebrew) muchas veces vienen sin drawtext.
 * `familia` = nombre de la tipografía tal como lo lee libass (nombre completo del .ttf); `anim` = 'aparecer'|'subir'.
 */
export function assTexto(formato, t, dur, familia, anim) {
  const { ancho: W, alto: H } = FORMATOS[formato];
  const x = Math.round(W * t.x), y = Math.round(H * t.y);
  const bgr = t.color.slice(1).match(/../g).reverse().join('').toUpperCase();
  const tiempo = (s) => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  const mov = anim === 'subir' ? `\\move(${x},${y + Math.round(H * 0.04)},${x},${y},0,500)` : `\\pos(${x},${y})`;
  // ancho útil = 86 % del cuadro (márgenes de 7 %), igual que max-width: 86cqw en el editor; WrapStyle 0 = corte de línea parejo
  // libass mide \fs como alto de línea (ascendente + descendente ≈ 1.2 em); el editor usa font-size = em
  const fs = Math.round(t.tam * H * 1.2);
  // caja: BorderStyle 3 = rectángulo sólido del color del contorno; el «borde» hace de margen interno
  const borde = t.caja ? `\\bord${Math.round(fs * 0.22)}\\3c&H${t.caja.slice(1).match(/../g).reverse().join('').toUpperCase()}&` : '\\bord3\\3c&H111111&';
  const tags = `{\\an5${mov}${anim ? '\\fad(500,0)' : ''}\\fs${fs}\\c&H${bgr}&${borde}\\shad0}`;
  const limpio = t.texto.replace(/\\/g, '\\⁠').replace(/[{}]/g, (c) => (c === '{' ? '(' : ')')).replace(/\r?\n/g, '\\N');
  return ['[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, 'WrapStyle: 0', 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]', 'Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: T,${familia || 'DejaVu Sans'},60,&H00FFFFFF,&H00111111,&H00000000,${familia ? 0 : -1},0,${t.caja ? 3 : 1},3,0,5,${Math.round(W * 0.07)},${Math.round(W * 0.07)},0,1`, '',
    '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    `Dialogue: 0,${tiempo(0)},${tiempo(dur + 1)},T,,0,0,0,,${tags}${limpio}`, ''].join('\n');
}

/** Filtro que quema un .ass; `fontsdir` = carpeta de tipografías propias. */
export const quemarAss = (archivo, fontsdir) => `subtitles='${escFiltro(archivo)}'${fontsdir ? `:fontsdir='${escFiltro(fontsdir)}'` : ''}`;

export const FILTRO_COLOR = {
  calido: 'colorbalance=rs=0.06:gs=0.01:bs=-0.06,eq=saturation=1.08',
  frio: 'colorbalance=rs=-0.05:bs=0.06,eq=saturation=0.95',
  bn: 'hue=s=0,eq=contrast=1.1',
  contraste: 'eq=contrast=1.15:saturation=1.12',
};

const cadena = (...f) => f.filter(Boolean).join(',');

/**
 * Animación de una capa de imagen (la misma fórmula que usa Retoque en la vista previa):
 *   k = avance lineal en 0.6 s desde `retraso`; e = 1-(1-k)^3 (frena al llegar)
 *   aparecer: alfa k · subir: alfa k, baja 8 % del alto → 0 · abanico: como subir (10 %) + gira hasta `angulo`
 *   flotar: oscila ±1.2 % del alto cada 3 s
 * Devuelve el filtro para la imagen y el desplazamiento vertical (expresión de overlay).
 */
export function movimientoCapa(a) {
  if (!a) return { filtro: '', dy: '' };
  const r = a.retraso ?? 0;
  const k = `min(1\\,max(0\\,(t-${r})/0.6))`;
  const e = `(1-pow(1-${k}\\,3))`;
  const fade = `fade=t=in:st=${r}:d=0.6:alpha=1`;
  if (a.animacion === 'aparecer') return { filtro: fade, dy: '' };
  if (a.animacion === 'subir') return { filtro: fade, dy: `+(1-${e})*main_h*0.08` };
  if (a.animacion === 'flotar') return { filtro: '', dy: `+sin(2*PI*t/3+${(a.angulo ?? 0) / 10})*main_h*0.012` };
  // abanico: girar con lienzo fijo (la diagonal) para que el centro no salte
  const rot = a.angulo ? `rotate=a='${a.angulo}*PI/180*${e}':c=none:ow='hypot(iw\\,ih)':oh='hypot(iw\\,ih)'` : '';
  return { filtro: cadena(rot, fade), dy: `+(1-${e})*main_h*0.10` };
}

const EXT_VIDEO = /\.(mp4|mov|webm|mkv|gif)$/i;

/** Derivada directa: recorte de formato + tramo + subtítulos y música opcionales. */
export function argsDerivada({ fuente, salida, formato, inicio = 0, fin, tieneAudio = true, subtitulos, musica }) {
  const dur = fin != null ? fin - inicio : null;
  const args = ['-y', '-hide_banner', '-ss', String(inicio), ...(dur ? ['-t', String(dur)] : []), '-i', fuente];
  if (musica) args.push('-stream_loop', '-1', '-ss', String(musica.inicio ?? 0), '-i', musica.ruta);
  const v = cadena(cubrir(formato), subtitulos ? `subtitles='${escFiltro(subtitulos)}':force_style='Fontsize=14,Alignment=2,MarginV=60'` : '');
  let filtro = `[0:v]${v}[v]`;
  let mapA = tieneAudio ? ['-map', '0:a:0?'] : [];
  if (musica) {
    const vol = musica.volumen ?? 0.25;
    filtro += tieneAudio
      ? `;[1:a]volume=${vol}[m];[0:a]volume=1[o];[o][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`
      : `;[1:a]volume=${vol}[a]`;
    mapA = ['-map', '[a]'];
  }
  args.push('-filter_complex', filtro, '-map', '[v]', ...mapA, ...CODEC_V, ...CODEC_A);
  if (musica) args.push('-shortest');
  args.push('-movflags', '+faststart', salida);
  return args;
}

/**
 * Una escena del corte a un archivo intermedio uniforme (mismo códec, tamaño, fps y audio estéreo).
 * Orden: video (cubrir → color → zoom) → capas de abajo hacia arriba. Con «detrás de la persona», la capa
 * elegida y las de abajo van entre el fondo y la persona recortada con su máscara (misma geometría que el video).
 * rutas: { clip, mascara?, capas: {idCapa: ruta de imagen}, textos: {idCapa: archivo .ass (assTexto)}, fontsdir? }
 */
export function argsEscena({ escena, formato, salida, tieneAudio, rutas }) {
  const { ancho: W } = FORMATOS[formato];
  const dur = escena.fin - escena.inicio;
  const D = String(dur);
  const est = (t) => escena.estilos.find((s) => s.tipo === t);
  const args = ['-y', '-hide_banner', '-ss', String(escena.inicio), '-t', D, '-i', rutas.clip];
  let n = 1;
  const audio = tieneAudio ? '0:a:0' : `${n++}:a:0`;
  if (!tieneAudio) args.push('-f', 'lavfi', '-t', D, '-i', 'anullsrc=r=48000:cl=stereo');
  const detras = est('detras-de-persona');
  const conMascara = detras && rutas.mascara;
  let mascaraIdx = null;
  if (conMascara) { mascaraIdx = n++; args.push('-ss', String(escena.inicio), '-t', D, '-i', rutas.mascara); }
  const imgIdx = {};
  for (const c of escena.capas) {
    if (c.tipo !== 'imagen' || !c.visible) continue;
    imgIdx[c.id] = n++;
    args.push(...(EXT_VIDEO.test(rutas.capas[c.id]) ? ['-stream_loop', '-1'] : ['-loop', '1']), '-t', D, '-i', rutas.capas[c.id]);
  }

  const z = est('zoom');
  const geo = cadena(cubrir(formato), z ? zoom(formato, z, dur) : '');
  const color = est('color') ? FILTRO_COLOR[est('color').preset] : '';
  const g = [];
  let cur = 'base';
  g.push(`[0:v]${cadena(geo, color)}${conMascara ? ',split=2[base][persona0]' : '[base]'}`);
  if (conMascara) {
    g.push(`[${mascaraIdx}:v]${geo},format=gray[mask]`);
    g.push('[persona0][mask]alphamerge[persona]');
  }
  let k = 0;
  const capasVisibles = escena.capas.filter((c) => c.visible);
  const corteDetras = conMascara ? capasVisibles.findIndex((c) => c.id === detras.capa) : -1;
  capasVisibles.forEach((c, i) => {
    const sig = `c${k++}`;
    if (c.tipo === 'imagen') {
      const a = escena.estilos.find((s) => s.tipo === 'animacion-capa' && s.capa === c.id);
      const m = movimientoCapa(a);
      g.push(`[${imgIdx[c.id]}:v]${cadena(`scale=${Math.round(W * c.escala / 2) * 2}:-2`, 'format=rgba', m.filtro)}[img${i}]`);
      g.push(`[${cur}][img${i}]overlay=x='main_w*${c.x}-overlay_w/2':y='main_h*${c.y}-overlay_h/2${m.dy}':shortest=1[${sig}]`);
    } else {
      g.push(`[${cur}]${quemarAss(rutas.textos[c.id], rutas.fontsdir)}[${sig}]`);
    }
    cur = sig;
    if (i === corteDetras) { g.push(`[${cur}][persona]overlay=0:0[pp]`); cur = 'pp'; }
  });
  const tr = est('transicion');
  const fundido = tr?.entrada === 'fundido';
  g.push(`[${cur}]${fundido ? `fade=t=in:st=0:d=${tr.duracion}` : 'null'}[v]`);
  g.push(`[${audio}]aresample=48000${fundido ? `,afade=t=in:st=0:d=${tr.duracion}` : ''}[a]`);
  args.push('-filter_complex', g.join(';'), '-map', '[v]', '-map', '[a]', ...CODEC_V, ...CODEC_A, '-t', D, salida);
  return args;
}

/** Unir las escenas (concat sin recodificar) y, si hace falta, mezclar música y quemar subtítulos. */
export function argsUnir({ lista, salida }) {
  return ['-y', '-hide_banner', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-movflags', '+faststart', salida];
}

export function argsFinal({ entrada, salida, musica, subtitulos }) {
  const args = ['-y', '-hide_banner', '-i', entrada];
  if (musica) args.push('-stream_loop', '-1', '-ss', String(musica.inicio ?? 0), '-i', musica.ruta);
  const partes = [];
  let mapV = ['-map', '0:v'], codV = ['-c:v', 'copy'];
  if (subtitulos) { partes.push(`[0:v]subtitles='${escFiltro(subtitulos)}':force_style='Fontsize=14,Alignment=2,MarginV=60'[v]`); mapV = ['-map', '[v]']; codV = CODEC_V; }
  let mapA = ['-map', '0:a'], codA = ['-c:a', 'copy'];
  if (musica) {
    // ducking: la música baja sola cuando hay voz (sidechaincompress con la voz como llave)
    partes.push(musica.ducking
      ? `[1:a]volume=${musica.volumen ?? 0.25}[m0];[0:a]asplit=2[voz][llave];[m0][llave]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[m];[voz][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`
      : `[1:a]volume=${musica.volumen ?? 0.25}[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]`);
    mapA = ['-map', '[a]']; codA = CODEC_A;
  }
  if (partes.length) args.push('-filter_complex', partes.join(';'));
  args.push(...mapV, ...mapA, ...codV, ...codA);
  if (musica) args.push('-shortest');
  args.push('-movflags', '+faststart', salida);
  return args;
}

/** Ejecuta ffmpeg; `alProgreso(segundosHechos)` con -progress. Rechaza con las últimas líneas de stderr. */
export function correr(args, { binario = process.env.VIDEO_FFMPEG || 'ffmpeg', alProgreso, senal } = {}) {
  return new Promise((ok, mal) => {
    const p = spawn(binario, ['-nostdin', '-progress', 'pipe:1', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'], signal: senal });
    let err = '';
    p.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
    p.stdout.on('data', (d) => {
      const m = String(d).match(/out_time_us=(\d+)/g);
      if (m && alProgreso) alProgreso(Number(m.at(-1).split('=')[1]) / 1e6);
    });
    p.on('error', mal);
    p.on('close', (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg salió con ${c}: ${err.trim().split('\n').slice(-3).join(' | ')}`))));
  });
}

/** Duración y si tiene audio, con ffprobe. */
export function sondear(ruta, binario = process.env.VIDEO_FFPROBE || 'ffprobe') {
  return new Promise((ok, mal) => {
    execFile(binario, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', ruta], (e, out) => {
      if (e) return mal(new Error(`no se pudo leer ${ruta}: ${e.message}`));
      const j = JSON.parse(out);
      ok({ duracion: Number(j.format?.duration ?? 0), tieneAudio: (j.streams ?? []).some((s) => s.codec_type === 'audio') });
    });
  });
}

/** Nombre completo de una tipografía .ttf/.otf (tabla «name», id 4): el que usan libass y el @font-face del editor. */
export function nombreTipografia(ruta) {
  const b = readFileSync(ruta);
  const tablas = b.readUInt16BE(4);
  for (let i = 0; i < tablas; i++) {
    const r = 12 + i * 16;
    if (b.toString('latin1', r, r + 4) !== 'name') continue;
    const t = b.readUInt32BE(r + 8);
    const n = b.readUInt16BE(t + 2), cad = t + b.readUInt16BE(t + 4);
    // preferencia: Windows en inglés (0x409) → Mac en inglés → cualquier Windows/Unicode
    const cand = [];
    for (let j = 0; j < n; j++) {
      const e = t + 6 + j * 12;
      const [plat, , idioma, id, largo, off] = [0, 2, 4, 6, 8, 10].map((k) => b.readUInt16BE(e + k));
      if (id !== 4) continue;
      const crudo = b.subarray(cad + off, cad + off + largo);
      const texto = plat === 1 ? crudo.toString('latin1') : Buffer.from(crudo).swap16().toString('utf16le');
      cand.push({ texto, orden: plat === 3 && idioma === 0x409 ? 0 : plat === 1 && idioma === 0 ? 1 : plat !== 1 ? 2 : 3 });
    }
    if (cand.length) return cand.sort((a, b2) => a.orden - b2.orden)[0].texto;
  }
  return null;
}
