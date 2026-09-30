---
name: vd-captions
description: >
  Disciplina 3 — captions y texto animado. Subtítulos dinámicos, palabras resaltadas, kinetic
  typography, títulos y frases clave. Úsala cuando pidan "ponele subtítulos", "captions", "texto en
  pantalla", "resaltá las palabras clave", "que se entienda sin sonido", "un título animado". Corre
  DESPUÉS del color — nunca antes.
---

# Captions y Texto Animado

**Requiere:** color cerrado. 🛑 **Captions antes del color = texto que no matchea el look final.**
**Referencia de marca:** `templates/brand-guideline-video.md` § Captions y Tipografía.

## Por qué existen

La mayoría ve **sin sonido**. Si la información vive solo en el audio, para esa mayoría no existe.
En vertical los captions no son accesibilidad: son el canal principal.

## Especificación

| Parámetro | Vertical (1080×1920) | Horizontal (1920×1080) |
|---|---|---|
| Tamaño mínimo | ≥ 42 px | ≥ 32 px |
| Palabras por bloque | 3-5 | 6-10 |
| Posición | Centro-bajo, **dentro del safe area** (inf. 420 px) | Tercio inferior |
| Contraste | Contorno o fondo: legible sobre cualquier plano | Igual |
| Sincronía | Aparece con la palabra, no después | Igual |

## Tipos de texto en pantalla

| Tipo | Para qué | Regla |
|---|---|---|
| **Caption de voz** | Todo lo que se dice | Literal. No se parafrasea |
| **Palabra resaltada** | 1-2 por frase, la que carga el significado | Si resaltás todo, no resaltás nada |
| **Título / frase clave** | Hook, secciones, remate | Máx. 6 palabras, respira solo |
| **Kinetic typography** | Cuando el texto ES la pieza | Necesita ritmo musical, no se improvisa |
| **Dato / cifra** | Prueba, números, precios | Verificado contra el brief |

## Reglas duras

- 🛑 **Nada de texto fuera del safe area.** Un caption tapado por la UI de TikTok es un QC fallado.
- 🛑 **Cero errores de ortografía.** Un error en pantalla cuesta más que un corte feo.
- 🛑 **Tipografía del guideline.** Sin guideline: `⚠️ SIN GUIDELINE — tipografía asumida: [cuál]`.
- **El caption dice lo que se dijo.** No se corrige lo que la persona dijo mal, salvo muletillas.
- **Un bloque por idea.** Captions que cambian a mitad de palabra distraen.
- **El CTA va hablado Y en pantalla.**
- **Sin animación gratuita**: si el texto rebota en cada palabra, compite con el contenido.
- **Los números se revisan dos veces.** Precios, fechas, porcentajes, nombres propios.

## Comando de referencia

```bash
ffmpeg -i in.mp4 -vf "subtitles=subs.srt:force_style='FontName=<marca>,FontSize=20,\
PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3,MarginV=460'" -c:a copy out.mp4
```
`MarginV` mantiene el texto sobre el safe area inferior. Para captions con palabra resaltada o
kinetic, el quemado con `ffmpeg` no alcanza: se hace en el editor y se documenta el estilo.

## Cierre
Ver la pieza **en mudo de punta a punta**: si no se entiende, los captions no están cumpliendo.
Correr los ítems de captions del bloque **Fase 4** de `qa/QC-GATES.md`.

## Handoff
→ `vd-entrega`.
