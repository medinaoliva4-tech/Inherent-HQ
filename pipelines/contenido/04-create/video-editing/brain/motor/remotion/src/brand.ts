import { Easing } from "remotion";
import type { CSSProperties } from "react";

/*
  TOKENS DE MARCA DEL CLIENTE — se llenan antes de armar el primer reel.
  Fuente de verdad: `sistema-visual.md` de Branding (§ Color, § Tipografía, § Movimiento).
  Si la guía vive en Figma, se leen con Figwright (get_styles, get_fonts, get_design_context)
  y los logos/elementos se exportan en SVG con save_screenshots (format: "SVG").
  Nunca se estiman valores a ojo desde una captura.
*/

// Lienzo de Reels / TikTok.
export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const sec = (s: number) => Math.round(s * FPS);

export const BRAND = {
  id: "CLIENTE", // prefijo de las composiciones: CLIENTE-V01
  tagline: "", // frase de cierre de la guía (§ Movimiento → El cierre). Vacía = sin frase
  elementoCierre: "", // archivo en public/brand/elements/ que acompaña el cierre (opcional)
  logos: "logo", // public/brand/logos/<logos>-<variante>.svg · variantes: claro, oscuro, claro-pill, oscuro-pill
};

// Paleta — nombres por ROL, no por color. Hex de § Color.
export const C = {
  oscuro: "#191919", // fondos oscuros, texto sobre claro
  claro: "#FDF7E8", // texto sobre video, fondos claros
  superficie: "#B29166", // la línea del doble cuadro y el fondo del cierre
  acento: "#842A15", // un solo acento (frase del cierre)
  white: "#FFFFFF",
};

// Archivos en public/brand/fonts/ y familias de § Tipografía.
export const FONT_FILES = {
  display: { family: "Display", file: "display.ttf", weight: "400" },
  sans: { family: "Sans", file: "sans-variable.ttf", weight: "300 900" },
  serif: { family: "Serif", file: "serif-italic.woff2", weight: "400", style: "italic" },
};
export const F = {
  display: FONT_FILES.display.family,
  sans: FONT_FILES.sans.family,
  serif: FONT_FILES.serif.family,
};

// Jerarquía para video 1080×1920 (probada en cliente real, oct 2026). Si la guía define su jerarquía, manda la guía.
export const T: Record<string, CSSProperties> = {
  display: { fontFamily: F.display, fontSize: 176, lineHeight: 0.9, letterSpacing: "-0.022em", textTransform: "uppercase" }, // titular
  displayM: { fontFamily: F.display, fontSize: 118, lineHeight: 0.92, letterSpacing: "-0.02em", textTransform: "uppercase" },
  kicker: { fontFamily: F.sans, fontWeight: 700, fontSize: 27, letterSpacing: "0.08em", textTransform: "uppercase" }, // etiqueta sobre el titular
  sub: { fontFamily: F.sans, fontWeight: 400, fontSize: 38, lineHeight: 1.28 },
  serif: { fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, fontSize: 80, lineHeight: 1.02, letterSpacing: "-0.01em" }, // remate
  pill: { fontFamily: F.sans, fontWeight: 700, fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase" }, // nombre de platillo / paso
};

// Zonas seguras de la interfaz de Reels/TikTok (px en 1080×1920).
export const SAFE = { top: 250, bottom: 430, left: 72, right: 150 };

export const EASE = {
  out: Easing.bezier(0.22, 1, 0.36, 1), // entradas
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // cambios de escena y de layout
  in: Easing.bezier(0.5, 0, 0.75, 0), // salidas
};
