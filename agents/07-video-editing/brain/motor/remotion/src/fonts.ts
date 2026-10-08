import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT_FILES } from "./brand";

// Las fuentes de la guía del cliente, desde public/brand/fonts/ (ver FONT_FILES en brand.ts).
export const brandFonts = Promise.all(
  Object.values(FONT_FILES).map((f) =>
    loadFont({
      family: f.family,
      url: staticFile(`brand/fonts/${f.file}`),
      weight: f.weight,
      ...("style" in f ? { style: f.style } : {}),
    }),
  ),
);
