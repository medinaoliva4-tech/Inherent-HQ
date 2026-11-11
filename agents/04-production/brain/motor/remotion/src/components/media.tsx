import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, EASE, FPS, H, W } from "../brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type ClipProps = {
  src: string; // ruta dentro de public/
  from: number; // segundo de inicio en el clip fuente
  rate?: number; // 0.5 = cámara lenta real (fuente 60 fps)
  focusX?: number; // 0..1 — punto de interés horizontal
  focusY?: number; // 0..1 — punto de interés vertical (encuadre en doble cuadro)
  zoom?: number | [number, number]; // escala fija o [inicio, fin] (push-in sutil)
  volume?: number; // 0 = sin sonido
  grade?: string; // filtro CSS por toma (ajuste fino de color)
};

// Una toma: cubre su contenedor (object-fit: cover) y se encuadra con focusX/focusY.
export const Clip: React.FC<ClipProps> = ({
  src,
  from,
  rate = 1,
  focusX = 0.5,
  focusY = 0.5,
  zoom = 1,
  volume = 0,
  grade,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const z = Array.isArray(zoom)
    ? interpolate(frame, [0, durationInFrames], zoom, { ...clamp, easing: EASE.inOut })
    : zoom;
  const origin = `${focusX * 100}% ${focusY * 100}%`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.oscuro }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: origin, filter: grade }}>
        <OffthreadVideo
          src={staticFile(src)}
          trimBefore={Math.round(from * FPS)}
          playbackRate={rate}
          volume={volume}
          muted={volume === 0}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: origin }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export type Transition = "cut" | "fade" | "push-up" | "push-down" | "push-left";

// dur en frames. enter/t permiten cambiar la transición de entrada de una toma puntual.
export type Shot = ClipProps & { dur: number; enter?: Transition; t?: number };

type TrackProps = {
  shots: Shot[];
  transition?: Transition; // transición por defecto entre tomas
  t?: number; // frames de transición por defecto
};

// Pista de tomas dentro de un cuadro. Cada transición se solapa con el final de la toma anterior,
// así que la duración total de la pista es la suma de `dur`.
export const Track: React.FC<TrackProps> = ({ shots, transition = "cut", t = 12 }) => {
  const enterOf = (i: number): Transition => (i === 0 ? "cut" : shots[i].enter ?? transition);
  const tOf = (i: number) => (enterOf(i) === "cut" ? 0 : shots[i].t ?? t);
  let cursor = 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {shots.map((s, i) => {
        const lead = tOf(i);
        const start = cursor - lead;
        const len = s.dur + lead;
        cursor += s.dur;
        const next = i < shots.length - 1 ? i + 1 : -1;
        const { dur, enter, t: _t, ...clip } = s;
        return (
          <Sequence key={i} from={start} durationInFrames={len} layout="none">
            <ShotFrame
              enter={enterOf(i)}
              t={lead}
              len={len}
              exitT={next > 0 ? tOf(next) : 0}
              exitKind={next > 0 ? enterOf(next) : "cut"}
            >
              <Clip {...clip} />
            </ShotFrame>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const trackLength = (shots: Shot[]) => shots.reduce((a, s) => a + s.dur, 0);

const ShotFrame: React.FC<{
  enter: Transition;
  exitKind: Transition;
  t: number;
  exitT: number;
  len: number;
  children: React.ReactNode;
}> = ({ enter, exitKind, t, exitT, len, children }) => {
  const frame = useCurrentFrame();
  const e = t > 0 && enter !== "cut" ? interpolate(frame, [0, t], [0, 1], { ...clamp, easing: EASE.inOut }) : 1;
  const x = exitT > 0 ? interpolate(frame, [len - exitT, len], [0, 1], { ...clamp, easing: EASE.inOut }) : 0;
  let transform = "";
  let opacity = 1;
  if (enter === "fade") opacity = e;
  if (enter === "push-up") transform += ` translateY(${(1 - e) * 100}%)`;
  if (enter === "push-down") transform += ` translateY(${-(1 - e) * 100}%)`;
  if (enter === "push-left") transform += ` translateX(${(1 - e) * 100}%)`;
  // La toma que sale se desplaza menos (parallax) para que el cambio se sienta suave.
  if (exitKind === "push-up") transform += ` translateY(${-x * 32}%)`;
  if (exitKind === "push-down") transform += ` translateY(${x * 32}%)`;
  if (exitKind === "push-left") transform += ` translateX(${-x * 32}%)`;
  return <AbsoluteFill style={{ transform: transform || undefined, opacity }}>{children}</AbsoluteFill>;
};

// Doble cuadro: dos tomas apiladas separadas por una línea en beige.
// open = 0 → el cuadro superior ocupa toda la pantalla; open = 1 → dos mitades.
export const Split: React.FC<{
  open?: number;
  gutter?: number;
  bg?: string;
  top: React.ReactNode;
  bottom: React.ReactNode;
}> = ({ open = 1, gutter = 14, bg = C.superficie, top, bottom }) => {
  const half = (H - gutter) / 2;
  const topH = interpolate(open, [0, 1], [H, half]);
  const bottomTop = interpolate(open, [0, 1], [H + gutter, half + gutter]);
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: topH, overflow: "hidden" }}>{top}</div>
      <div style={{ position: "absolute", left: 0, top: bottomTop, width: W, height: half, overflow: "hidden" }}>
        {bottom}
      </div>
    </AbsoluteFill>
  );
};

// Progreso 0→1 animado a partir de un frame (para abrir/cerrar el doble cuadro).
export const useProgress = (at: number, dur: number, easing = EASE.inOut) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing });
};

// Degradado para legibilidad del texto sobre video (sin sombras paralelas).
export const Scrim: React.FC<{ side: "top" | "bottom"; height?: number; strength?: number }> = ({
  side,
  height = 760,
  strength = 0.62,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        height,
        [side]: 0,
        background: `linear-gradient(${side === "top" ? "180deg" : "0deg"}, rgba(25,25,25,${strength}) 0%, rgba(25,25,25,${
          strength * 0.45
        }) 45%, rgba(25,25,25,0) 100%)`,
      }}
    />
  </AbsoluteFill>
);
