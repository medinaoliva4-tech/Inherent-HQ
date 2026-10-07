import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { C, EASE, FPS, H, SAFE, T, W } from "../brand";
import { Scrim, Split, Track, type Shot } from "../components/media";
import { Kicker, Letters, Lines, Logo, Pill, Soft } from "../components/type";
import { EndCard } from "../components/endcard";
import data from "../../edit/reels.resolved.json";

/*
  Reel genérico: arma cualquier video a partir de edit/reels.json (guion aprobado + notas).
  - Tomas estabilizadas y con corrección de color en public/stab/ (scripts/stabilize.py vía edit/stab_shots.py).
  - Doble cuadro: el cuadro se abre/cierra cuando cambia el tipo de escena.
  - Sin audio.
*/

type ShotSpec = { src: string; offset: number; speed: number; focusY: number; zoom?: [number, number] | null };
type TextSpec = {
  style: "titular" | "cursiva" | "pildora" | "pildoras";
  lines: string[];
  pos: "arriba-izq" | "arriba-centro" | "centro" | "linea" | "linea-izq" | "abajo";
  fx: "lineas" | "suave" | "pildora" | "letras";
  kicker?: string | null;
  size?: number | null;
  span?: number | null;
};
type Scene = { layout: "full" | "doble" | "cierre"; shots: ShotSpec[]; text: TextSpec | null; dur: number; enter?: "cut" | "flash" | null };
type ReelData = { id: string; name: string; scenes: Scene[]; duration: number };

export const REELS = data as unknown as ReelData[];
const SPLIT_T = 22;
const LOGO_TOP = 200; // debajo de la barra superior de Instagram/TikTok
const LOGO_W = 300; // frames que tarda en abrir/cerrar el doble cuadro
const END_RISE = 20; // el cierre empieza a subir antes del final de la última escena

const frames = (s: number) => Math.round(s * FPS);
const grade = "contrast(1.03) saturate(1.06)";

export const reelDuration = (r: ReelData) => r.scenes.reduce((a, s) => a + frames(s.dur), 0);

export const Reel: React.FC<{ id: string }> = ({ id }) => {
  const reel = REELS.find((r) => r.id === id)!;
  const frame = useCurrentFrame();
  const starts: number[] = [];
  let acc = 0;
  for (const s of reel.scenes) {
    starts.push(acc);
    acc += frames(s.dur);
  }
  // un texto puede durar varias escenas seguidas (span)
  const spanFrames = (i: number) =>
    reel.scenes.slice(i, i + Math.max(1, reel.scenes[i].text?.span ?? 1)).reduce((a, x) => a + frames(x.dur), 0);
  const body = reel.scenes.filter((s) => s.layout !== "cierre");
  const endIdx = reel.scenes.findIndex((s) => s.layout === "cierre");
  const endAt = endIdx >= 0 ? starts[endIdx] : acc;

  // Apertura del doble cuadro: 1 en escenas dobles, 0 en pantalla completa; transición al cambiar de tipo.
  let open = body[0]?.layout === "doble" ? 1 : 0;
  for (let i = 1; i < body.length; i++) {
    const target = body[i].layout === "doble" ? 1 : 0;
    const prev = body[i - 1].layout === "doble" ? 1 : 0;
    if (target !== prev && frame >= starts[i]) {
      open = interpolate(frame, [starts[i], starts[i] + SPLIT_T], [prev, target], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE.inOut,
      });
    } else if (frame >= starts[i]) {
      open = target;
    }
  }

  const mk = (s: Scene, k: number, i: number): Shot => {
    const sh = s.shots[Math.min(k, s.shots.length - 1)];
    const prevLayout = i > 0 ? body[i - 1].layout : s.layout;
    return {
      src: sh.src,
      from: sh.offset,
      rate: sh.speed,
      focusY: sh.focusY,
      zoom: sh.zoom ?? 1,
      dur: frames(s.dur),
      grade,
      // Cuando cambia el tipo de escena, la apertura/cierre del cuadro es la transición: corte limpio.
      enter: prevLayout !== s.layout || s.enter ? "cut" : "push-up",
      t: 14,
    };
  };
  const top = body.map((s, i) => mk(s, 0, i));
  const bottom = body.map((s, i) => mk(s, 1, i));

  return (
    <AbsoluteFill style={{ backgroundColor: C.oscuro }}>
      <Split open={open} top={<Track shots={top} transition="push-up" t={14} />} bottom={<Track shots={bottom} transition="push-up" t={14} />} />


      {reel.scenes.map((s, i) =>
        s.text ? (
          <Sequence key={i} from={starts[i]} durationInFrames={spanFrames(i)}>
            <SceneText text={s.text} dur={spanFrames(i)} layout={s.layout} first={i === 0} />
          </Sequence>
        ) : null,
      )}

      {/* Logo centrado arriba, opacidad completa, dentro de la zona segura del reel */}
      <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: LOGO_TOP }}>
          <Logo variant="claro-pill" width={LOGO_W} at={0} out={frames(reel.scenes[0].dur) - 14} crisp />
        </div>
      </AbsoluteFill>

      {/* Destello suave (rice) que esconde el corte en las escenas "desaparece" */}
      {reel.scenes.map((s, i) =>
        s.enter === "flash" ? (
          <Sequence key={`fl${i}`} from={starts[i] - 5} durationInFrames={16}>
            <Flash />
          </Sequence>
        ) : null,
      )}

      {endIdx >= 0 ? (
        <Sequence from={endAt - END_RISE}>
          <EndCard at={0} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

const half = (H - 14) / 2;

const SceneText: React.FC<{ text: TextSpec; dur: number; layout: Scene["layout"]; first: boolean }> = ({ text, dur, layout, first }) => {
  const at = first ? 4 : 10;
  const out = dur - 16;
  const center = text.pos === "arriba-centro" || text.pos === "centro" || text.pos === "linea";
  const align = center ? "center" : "left";

  if (text.style === "pildoras" || text.style === "pildora") {
    const [a, b] = text.style === "pildoras" ? text.lines : [text.lines[0], ""];
    if (text.pos === "arriba-centro" || text.pos === "arriba-izq") {
      return (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: SAFE.top + 70 }}>
            <Pill text={a} at={at} out={out} />
          </div>
        </AbsoluteFill>
      );
    }
    if (text.pos === "linea" || layout !== "doble") {
      return (
        <AbsoluteFill style={{ alignItems: "center" }}>
          <div style={{ position: "absolute", top: half - 26 }}>
            <Pill text={a} at={at} out={out} />
          </div>
        </AbsoluteFill>
      );
    }
    return (
      <>
        {a ? (
          <div style={{ position: "absolute", left: SAFE.left, top: half - 34 - 66 }}>
            <Pill text={a} at={at} out={out} />
          </div>
        ) : null}
        {b ? (
          <div style={{ position: "absolute", left: SAFE.left, top: half + 14 + 34 }}>
            <Pill text={b} at={at + 5} out={out + 3} />
          </div>
        ) : null}
      </>
    );
  }

  const isTitle = text.style === "titular";
  const style: React.CSSProperties = isTitle
    ? { ...T.display, ...(text.size ? { fontSize: text.size } : {}) }
    : { ...T.serif, fontSize: text.size ?? 92, lineHeight: 1.04 };

  const content =
    text.fx === "letras" ? (
      <Letters lines={text.lines} style={style} at={at + 4} out={out} align={align} />
    ) : text.fx === "suave" ? (
      <Soft at={at + 2} out={out} dur={22}>
        <div style={{ textAlign: align }}>
          {text.lines.map((l, i) => (
            <div key={i} style={{ ...style, color: C.claro }}>
              {l}
            </div>
          ))}
        </div>
      </Soft>
    ) : (
      <Lines lines={text.lines} style={style} at={at + 2} dur={16} out={out} align={align} />
    );

  const kicker = text.kicker ? (
    <div style={{ display: "flex", justifyContent: center ? "center" : "flex-start", marginBottom: 34 }}>
      <Kicker text={text.kicker} at={at} out={out} rule={!center} />
    </div>
  ) : null;

  const box: React.CSSProperties = { position: "absolute", left: SAFE.left, right: center ? SAFE.left : SAFE.right };
  let scrim: React.ReactNode = null;
  if (text.pos === "arriba-izq" || text.pos === "arriba-centro") {
    box.top = first ? LOGO_TOP + 230 : SAFE.top + 40;
    scrim = <Scrim side="top" height={900} strength={0.55} />;
  } else if (text.pos === "abajo") {
    box.bottom = SAFE.bottom + 40;
    scrim = <Scrim side="bottom" height={900} strength={0.55} />;
  } else {
    // centro / sobre la línea: bloque centrado verticalmente con un velo suave detrás
    box.top = 0;
    box.bottom = 0;
    box.display = "flex";
    box.flexDirection = "column";
    box.justifyContent = "center";
    scrim = <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 30% at 50% 50%, rgba(25,25,25,0.62), rgba(25,25,25,0))" }} />;
  }
  return (
    <>
      <FadeScrim dur={dur}>{scrim}</FadeScrim>
      <div style={box}>
        {kicker}
        {content}
      </div>
    </>
  );
};

const Flash: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 5, 7, 16], [0, 0.92, 0.92, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  return <AbsoluteFill style={{ backgroundColor: C.claro, opacity: o }} />;
};

// El velo entra y sale junto con el texto, así no queda una franja oscura fija.
const FadeScrim: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, dur - 14, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>{children}</AbsoluteFill>;
};

export { W };
