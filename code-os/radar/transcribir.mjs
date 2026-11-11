// Transcripción barata: 1) subtítulos públicos que ya publica la plataforma (yt-dlp, gratis, sin
// bajar video); 2) si no hay, whisper.cpp en CPU sobre el audio (modelo local, gratis).
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { correr } from './util.mjs';

/** VTT → texto plano. Los subtítulos automáticos repiten cada línea al «rodar»: se deduplican. */
export function vttATexto(vtt = '') {
  const lineas = [];
  for (const cruda of vtt.split(/\r?\n/)) {
    const l = cruda.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
      .replace(/^\s*>>\s*|\s+>>\s+/g, ' ').trim(); // «>>» marca cambio de hablante
    if (!l || l === 'WEBVTT' || /^(Kind|Language|NOTE|STYLE)\b/.test(l) || /-->/.test(l) || /^\d+$/.test(l)) continue;
    if (lineas.slice(-2).includes(l)) continue; // el rodado repite la línea anterior en el siguiente cue
    lineas.push(l);
  }
  // quita una línea si la siguiente la contiene completa al inicio (rodado de auto-subs)
  const out = lineas.filter((l, i) => !(lineas[i + 1] && lineas[i + 1] !== l && lineas[i + 1].startsWith(l)));
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

/** Elige el mejor archivo de subtítulos: el idioma original de la voz primero, luego manuales. */
export function elegirSub(archivos) {
  const vtt = archivos.filter((f) => f.endsWith('.vtt'));
  return vtt.find((f) => /-orig\.vtt$/.test(f)) ?? vtt.find((f) => /\.es[.-]/.test(f) || f.endsWith('.es.vtt')) ?? vtt.find((f) => /\.en[.-]/.test(f) || f.endsWith('.en.vtt')) ?? vtt[0] ?? null;
}

export async function subtitulos(url, { ytdlp = 'yt-dlp', idiomas = '.*-orig,es,en', turno, plataforma, ejecutar = correr } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'radar-subs-'));
  try {
    if (turno) await turno(plataforma);
    await ejecutar(ytdlp, ['--no-update', '--no-warnings', '--ignore-config', '--skip-download', '--write-subs', '--write-auto-subs',
      '--sub-langs', idiomas, '--sub-format', 'vtt', '-o', join(dir, 's.%(ext)s'), url], { timeout: 120_000 }).catch(() => null);
    const f = elegirSub(readdirSync(dir));
    if (!f) return null;
    const texto = vttATexto(readFileSync(join(dir, f), 'utf8'));
    return texto ? { texto, fuente: `subtitulos:${f.replace(/^s\./, '').replace(/\.vtt$/, '')}` } : null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function whisper(video, { ffmpeg = 'ffmpeg', bin = 'whisper-cli', modelo, segundos = 60, ejecutar = correr } = {}) {
  if (!modelo || !existsSync(modelo)) return null;
  const dir = mkdtempSync(join(tmpdir(), 'radar-wh-'));
  try {
    const wav = join(dir, 'a.wav');
    await ejecutar(ffmpeg, ['-v', 'error', '-t', String(segundos), '-i', video, '-vn', '-ar', '16000', '-ac', '1', wav], { timeout: 120_000 });
    await ejecutar(bin, ['-m', modelo, '-f', wav, '-l', 'auto', '-t', '4', '-np', '-nt', '-otxt', '-of', join(dir, 't')], { timeout: 600_000 });
    const t = readFileSync(join(dir, 't.txt'), 'utf8').replace(/\s+/g, ' ').trim();
    return t ? { texto: t, fuente: 'whisper.cpp' } : null;
  } catch {
    return null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Gancho sin IA: la primera frase (máx. 18 palabras). Respaldo cuando no hay LiteLLM o presupuesto. */
export function ganchoHeuristico(texto = '', titulo = '') {
  const base = (texto || titulo || '').trim();
  if (!base) return '';
  const frase = base.split(/(?<=[.!?¿¡])\s+/)[0];
  const w = frase.split(/\s+/);
  return w.length > 18 ? w.slice(0, 18).join(' ') + '…' : frase;
}
