import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { FPS } from "../brand";

// Segmento de sonido natural tomado del clip original, siempre a velocidad real
// (aunque la imagen vaya en cámara lenta) para que el sonido no se deforme.
export type Sfx = {
  src: string; // ruta dentro de public/
  from: number; // segundo de inicio en el clip fuente
  at: number; // frame de la composición en que suena
  dur: number; // frames
  vol?: number; // 0..1
  fadeIn?: number; // frames
  fadeOut?: number; // frames
};

// Tramos de ambiente del rodaje sin voces (verificados con espectrograma).
const CLEAN_ROOM_TONE = [
  { src: "clips/R6_01.mp4", from: 5.0, len: 270 },
  { src: "clips/R6_06.mp4", from: 4.6, len: 240 },
];

// Cama de ambiente continua y baja: evita silencios digitales cuando se quita un segmento con voces.
export const ambience = (total: number, vol = 0.28): Sfx[] => {
  const out: Sfx[] = [];
  let at = 0;
  let i = 0;
  while (at < total) {
    const r = CLEAN_ROOM_TONE[i % CLEAN_ROOM_TONE.length];
    const dur = Math.min(r.len, total - at);
    out.push({ src: r.src, from: r.from, at, dur, vol, fadeIn: i === 0 ? 4 : undefined, fadeOut: 20 });
    at += dur;
    i++;
  }
  return out;
};

// xfade: frames de fundido cruzado entre segmentos contiguos (sin huecos de silencio entre tomas).
// El segmento siguiente arranca `xfade` frames antes, tomando ese margen de su propio clip fuente.
export const SoundBed: React.FC<{ items: Sfx[]; master?: number; xfade?: number }> = ({
  items,
  master = 1,
  xfade = 10,
}) => (
  <>
    {items.map((s, i) => {
      const prev = items[i - 1];
      const next = items[i + 1];
      const joinsPrev = prev !== undefined && prev.at + prev.dur >= s.at - 1;
      const joinsNext = next !== undefined && s.at + s.dur >= next.at - 1;
      const lead = joinsPrev ? Math.min(xfade, Math.round(s.from * FPS)) : 0;
      const at = s.at - lead;
      const dur = s.dur + lead;
      const fi = joinsPrev ? lead : s.fadeIn ?? 6;
      const fo = joinsNext ? xfade : s.fadeOut ?? 8;
      const v = (s.vol ?? 0.7) * master;
      return (
        <Sequence key={i} from={at} durationInFrames={dur} layout="none">
          <Audio
            src={staticFile(s.src)}
            trimBefore={Math.round(s.from * FPS) - lead}
            volume={(f) =>
              v *
              interpolate(f, [0, Math.max(fi, 1), dur - Math.max(fo, 1), dur], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        </Sequence>
      );
    })}
  </>
);
