import React from "react";
import type { CSSProperties } from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND, C, EASE, T } from "../brand";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Timing = {
  at: number; // frame de entrada
  out?: number; // frame de salida (opcional)
};

// Revelado por máscara, línea por línea: cada línea sube desde su propia caja recortada.
export const Lines: React.FC<
  Timing & {
    lines: string[];
    style: CSSProperties;
    color?: string;
    stagger?: number;
    dur?: number;
    outDur?: number;
    align?: "left" | "center" | "right";
  }
> = ({ lines, style, color = C.claro, at, out, stagger = 4, dur = 20, outDur = 14, align = "left" }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}>
      {lines.map((line, i) => {
        const e = interpolate(frame, [at + i * stagger, at + i * stagger + dur], [0, 1], { ...clamp, easing: EASE.out });
        const x =
          out === undefined
            ? 0
            : interpolate(frame, [out + i * Math.round(stagger * 0.6), out + i * Math.round(stagger * 0.6) + outDur], [0, 1], {
                ...clamp,
                easing: EASE.inOut,
              });
        // Recorrido en em (no en %): con el margen para tildes, 1.45em garantiza que la línea
        // —tilde incluida— quede fuera de la máscara antes de entrar y después de salir.
        const y = (1 - e) * 1.45 - x * 1.45;
        return (
          // padding vertical para no recortar acentos (Í, Ó) ni descendentes; el padding usa el font-size de la línea
          <div
            key={i}
            style={{
              overflow: "hidden",
              fontSize: style.fontSize,
              paddingTop: "0.34em",
              marginTop: "-0.34em",
              paddingBottom: "0.06em",
              marginBottom: "-0.06em",
            }}
          >
            <div style={{ ...style, color, transform: `translateY(${y}em)`, whiteSpace: "pre", textAlign: align }}>{line}</div>
          </div>
        );
      })}
    </div>
  );
};

// Entrada suave: opacidad + desenfoque + leve subida. Para serif, kicker y subtítulos.
export const Soft: React.FC<
  Timing & { children: React.ReactNode; style?: CSSProperties; dur?: number; outDur?: number; rise?: number; blur?: number }
> = ({ children, style, at, out, dur = 18, outDur = 12, rise = 16, blur = 10 }) => {
  const frame = useCurrentFrame();
  const e = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: EASE.out });
  const x = out === undefined ? 0 : interpolate(frame, [out, out + outDur], [0, 1], { ...clamp, easing: EASE.in });
  const o = e * (1 - x);
  return (
    <div
      style={{
        ...style,
        opacity: o,
        filter: `blur(${(1 - e) * blur + x * blur * 0.6}px)`,
        transform: `translateY(${(1 - e) * rise - x * rise * 0.6}px)`,
      }}
    >
      {children}
    </div>
  );
};

// Kicker con filete: "— HECHO AL MOMENTO"
export const Kicker: React.FC<Timing & { text: string; color?: string; rule?: boolean }> = ({
  text,
  color = C.claro,
  rule = true,
  at,
  out,
}) => {
  const frame = useCurrentFrame();
  const r = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: EASE.out });
  const x = out === undefined ? 0 : interpolate(frame, [out, out + 12], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: 1 - x }}>
      {rule ? <div style={{ width: 54 * r, height: 3, backgroundColor: color, opacity: 0.9 }} /> : null}
      <Soft at={at + 5} dur={16} rise={8} blur={6}>
        <div style={{ ...T.kicker, color }}>{text}</div>
      </Soft>
    </div>
  );
};

// Píldora de confianza (como la del kit social): se abre de izquierda a derecha.
export const Pill: React.FC<Timing & { text: string; bg?: string; color?: string; style?: CSSProperties }> = ({
  text,
  bg = C.claro,
  color = C.oscuro,
  at,
  out,
  style,
}) => {
  const frame = useCurrentFrame();
  const e = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: EASE.out });
  const t = interpolate(frame, [at + 6, at + 20], [0, 1], { ...clamp, easing: EASE.out });
  const x = out === undefined ? 0 : interpolate(frame, [out, out + 12], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <div
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        padding: "18px 32px 17px",
        borderRadius: 999,
        backgroundColor: bg,
        clipPath: `inset(0 ${(1 - e) * 100}% 0 0 round 999px)`,
        opacity: 1 - x,
      }}
    >
      <span style={{ ...T.pill, color, opacity: t }}>{text}</span>
    </div>
  );
};

export type LogoVariant = "claro-pill" | "oscuro-pill" | "claro" | "oscuro";

// Logo oficial (SVG exportado de Figma). Entra con fundido y desenfoque, sin sombras ni rotación.
export const Logo: React.FC<Timing & { variant: LogoVariant; width: number; style?: CSSProperties; crisp?: boolean }> = ({
  variant,
  width,
  at,
  out,
  style,
  crisp = false,
}) => {
  const frame = useCurrentFrame();
  // crisp: entra rápido y queda al 100 %, sin desenfoque (logo sobre video)
  const e = interpolate(frame, [at, at + (crisp ? 10 : 22)], [0, 1], { ...clamp, easing: EASE.out });
  const x = out === undefined ? 0 : interpolate(frame, [out, out + 14], [0, 1], { ...clamp, easing: EASE.in });
  return (
    <Img
      src={staticFile(`brand/logos/${BRAND.logos}-${variant}.svg`)}
      style={{
        ...style,
        width,
        opacity: (crisp ? Math.min(1, e * 1.6) : e) * (1 - x),
        filter: crisp ? undefined : `blur(${(1 - e) * 8}px)`,
        transform: `scale(${0.965 + 0.035 * e})`,
      }}
    />
  );
};

// Letra por letra: cada carácter aparece con un fundido corto, en orden, línea tras línea.
export const Letters: React.FC<
  Timing & { lines: string[]; style: CSSProperties; color?: string; perChar?: number; align?: "left" | "center" | "right" }
> = ({ lines, style, color = C.claro, at, out, perChar = 1.4, align = "left" }) => {
  const frame = useCurrentFrame();
  const x = out === undefined ? 0 : interpolate(frame, [out, out + 14], [0, 1], { ...clamp, easing: EASE.in });
  let k = 0;
  return (
    <div style={{ opacity: 1 - x, transform: `translateY(${-x * 10}px)`, textAlign: align }}>
      {lines.map((line, li) => (
        <div key={li} style={{ ...style, color, whiteSpace: "pre" }}>
          {Array.from(line).map((ch, ci) => {
            const start = at + k++ * perChar;
            const e = interpolate(frame, [start, start + 8], [0, 1], { ...clamp, easing: EASE.out });
            return (
              <span key={ci} style={{ opacity: e, display: "inline-block", transform: `translateY(${(1 - e) * 6}px)`, filter: `blur(${(1 - e) * 4}px)` }}>
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
