import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND, C, EASE, H, SAFE, T, W } from "../brand";
import { Lines, Logo, Soft } from "./type";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Cierre de marca: la superficie sube y deja el logo, la frase de la guía y (opcional) el usuario.
export const EndCard: React.FC<{
  at: number; // frame (local) en que empieza a subir el fondo
  tagline?: string;
  handle?: string;
  surface?: "superficie" | "claro" | "oscuro";
}> = ({ at, tagline = BRAND.tagline, handle = "", surface = "superficie" }) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: EASE.inOut });
  const bg = surface === "superficie" ? C.superficie : surface === "claro" ? C.claro : C.oscuro;
  const ink = surface === "oscuro" ? C.claro : C.oscuro;
  const logo = surface === "oscuro" ? "claro-pill" : "oscuro-pill";
  const accent = surface === "oscuro" ? C.superficie : C.acento;
  const spin = (frame - at) * 0.12;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundColor: bg, transform: `translateY(${(1 - rise) * 100}%)` }}>
        {/* Elemento gráfico de la guía (opcional), recortado en la esquina, apenas visible y girando lento */}
        {BRAND.elementoCierre ? (
          <Img
            src={staticFile(`brand/elements/${BRAND.elementoCierre}`)}
            style={{ position: "absolute", width: 1250, right: -560, top: -300, opacity: 0.32 * rise, transform: `rotate(${spin}deg)` }}
          />
        ) : null}
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 140 }}>
          <Logo variant={logo} width={600} at={at + 12} />
          <div style={{ height: 70 }} />
          {tagline ? <Lines lines={[tagline]} style={{ ...T.serif, fontSize: 74 }} color={accent} at={at + 24} align="center" dur={22} /> : null}
        </AbsoluteFill>
        {handle ? (
          <div style={{ position: "absolute", left: 0, width: W, top: H - SAFE.bottom - 10, display: "flex", justifyContent: "center" }}>
            <Soft at={at + 34} rise={10} blur={6}>
              <div style={{ ...T.kicker, color: ink, opacity: 0.8 }}>{handle.toUpperCase()}</div>
            </Soft>
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
