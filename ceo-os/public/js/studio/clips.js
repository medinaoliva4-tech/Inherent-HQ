// Inherent Media: de una transcripción larga (podcast, reunión grabada) a los MEJORES clips cortos (puro: sin DOM ni red).
// Cada candidato se analiza como si fuera un video propio con el motor de retención (retencion.js), así que el ranking usa la MISMA curva:
//   puntaje = 0.6 · retención media predicha del clip + 0.4 · fuerza de su gancho propio (el primer renglón tiene que sostenerse solo).
// Candidatos: empiezan donde empieza una frase y terminan donde termina otra, entre `minS` y `maxS`. Sin solaparse; por orden de puntaje.
import { analizar, puntuarGancho } from './retencion.js';

const MAX_CANDIDATOS = 600;
const fraseCierra = (t) => /[.!?…]\s*$/.test(String(t || '').trim());

// entrada = { segmentos:[{t0,t1,texto}] } (de SRT/VTT o de lineaDeTiempoDesdeTexto). → [{ t0, t1, duracion, puntaje, gancho, retencion_media, texto, porQue:[...] }]
export function mejoresMomentos(entrada, { minS = 20, maxS = 55, n = 5, cortes = [] } = {}, opciones) {
  const seg = (entrada?.segmentos || []).filter((s) => Number.isFinite(s.t0) && Number.isFinite(s.t1) && s.t1 > s.t0 && String(s.texto || '').trim());
  if (seg.length < 2) return { clips: [], advertencias: ['⚠️ SIN DATOS · falta la transcripción con tiempos'] };
  const cand = [];
  for (let i = 0; i < seg.length && cand.length < MAX_CANDIDATOS; i++) {
    // el inicio tiene que poder sostenerse solo: un gancho mínimo (si no, ni se calcula el resto)
    const g0 = puntuarGancho(seg[i].texto).puntos; if (g0 < 0.15) continue;
    let fin = i; let dur = 0;
    for (let j = i; j < seg.length; j++) {
      dur = seg[j].t1 - seg[i].t0; if (dur > maxS) break;
      if (dur >= minS && fraseCierra(seg[j].texto)) { fin = j; cand.push({ i, j: fin, dur }); if (cand.length >= MAX_CANDIDATOS) break; }
    }
  }
  const puntuados = cand.map(({ i, j }) => {
    const t0 = seg[i].t0, t1 = seg[j].t1, partes = seg.slice(i, j + 1).map((s) => ({ ...s, t0: s.t0 - t0, t1: s.t1 - t0 })), cs = (cortes || []).filter((c) => c >= t0 && c < t1).map((c) => c - t0);
    const r = analizar({ segmentos: partes, duracion: t1 - t0, ...(cortes && cortes.length ? { cortes: cs } : {}) }, opciones);
    if (!r.resumen) return null;
    const puntaje = 0.6 * r.resumen.retencion_media + 0.4 * Math.min(1, r.resumen.gancho * 1.4);
    return { t0: Math.round(t0 * 10) / 10, t1: Math.round(t1 * 10) / 10, duracion: Math.round((t1 - t0) * 10) / 10, puntaje: Math.round(puntaje * 1000) / 1000, gancho: r.resumen.gancho, retencion_media: r.resumen.retencion_media,
      texto: partes.map((s) => s.texto).join(' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400), porQue: [...r.resumen.ganchoRazones.map((x) => `Gancho: ${x}`), ...(r.caidas.length ? [`${r.caidas.length} posible(s) caída(s): ${r.caidas[0].accion}`] : ['Sin caídas marcadas'])] };
  }).filter(Boolean).sort((a, z) => z.puntaje - a.puntaje || a.t0 - z.t0);
  const elegidos = [];
  for (const c of puntuados) { if (elegidos.length >= n) break; if (elegidos.every((e) => c.t1 <= e.t0 || c.t0 >= e.t1)) elegidos.push(c); }
  return { clips: elegidos, advertencias: [...(cortes && cortes.length ? [] : ['Sin cortes de video: el ranking usa solo palabras y ritmo de habla.']), 'Ranking de un modelo sin calibrar (ver retencion.js): sirve para elegir entre clips del mismo episodio.'] };
}
