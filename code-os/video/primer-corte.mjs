// Primer corte por agente: del shot list de ⑤ Producción (Pre) + los clips grabados → un corte (JSON de escenas).
// El agente lo arma, el humano lo corrige en Retoque, ffmpeg lo renderiza. No decide estética: ordena,
// recorta a la duración pedida, pone el texto en pantalla del guion y deja anotado lo que falta.
//
// shotlist: { titulo, formato, fuente?, musica?: {ruta, volumen},
//             tomas: [{ id: 'E01', duracion: 3, texto?: 'hook', fuente?, capas?: [...], estilos?: [...], nota? }] }
// clips:    [{ ruta, toma?: 'E01', duracion?: 12.4, inicio?: 2.0 }]   // inicio = dónde empieza lo bueno, si el agente lo sabe

import { normalizarCorte } from './corte.mjs';

const base = (r) => r.split('/').pop().toLowerCase();

/** Busca el clip de una toma: primero por `toma`, después por el id en el nombre del archivo (E01, e01-…). */
export function clipDeToma(toma, clips, usados) {
  const id = String(toma.id).toLowerCase();
  const libre = (c) => !usados.has(c.ruta);
  return clips.find((c) => libre(c) && String(c.toma ?? '').toLowerCase() === id)
    ?? clips.find((c) => libre(c) && new RegExp(`(^|[^a-z0-9])${id}([^a-z0-9]|$)`).test(base(c.ruta)))
    ?? null;
}

export function primerCorte({ shotlist, clips, agente = 'production', id } = {}) {
  if (!shotlist?.tomas?.length) throw new Error('el shot list no tiene tomas');
  const usados = new Set();
  const faltantes = [];
  const escenas = [];
  for (const toma of shotlist.tomas) {
    const clip = clipDeToma(toma, clips ?? [], usados);
    if (!clip) { faltantes.push({ toma: toma.id, motivo: 'no hay clip grabado para esta toma' }); continue; }
    usados.add(clip.ruta);
    const inicio = clip.inicio ?? 0;
    const pedida = toma.duracion ?? 3;
    const disponible = clip.duracion != null ? clip.duracion - inicio : pedida;
    if (disponible < pedida) faltantes.push({ toma: toma.id, motivo: `el clip dura ${disponible.toFixed(1)} s y la toma pide ${pedida} s` });
    // la receta: lo que pidió el guion (toma.estilos) o, si no dijo nada, un zoom lento que no estorba
    const estilos = toma.estilos ?? [{ tipo: 'zoom', desde: 1, hasta: 1.08, x: 0.5, y: 0.45 }];
    escenas.push({
      id: `e-${toma.id}`,
      clip: clip.ruta,
      inicio,
      fin: inicio + Math.max(0.5, Math.min(pedida, disponible)),
      texto: toma.texto ?? null,
      fuente: toma.fuente ?? shotlist.fuente ?? null,
      capas: toma.capas ?? [],
      estilos,
      nota: [toma.id, toma.nota].filter(Boolean).join(' · '),
    });
  }
  if (!escenas.length) throw new Error('ninguna toma tiene clip: no hay primer corte posible');
  const corte = normalizarCorte({
    id, titulo: shotlist.titulo, formato: shotlist.formato ?? '9:16', escenas,
    musica: shotlist.musica ?? null,
    origen: { agente, shotlist: shotlist.titulo ?? null, faltantes },
  });
  return { corte, faltantes };
}
