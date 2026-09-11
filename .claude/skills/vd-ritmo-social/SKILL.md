---
name: vd-ritmo-social
description: >
  Disciplinas 2 y 4 — edición de ritmo y edición para social media. Define la energía de la pieza
  (cortes rápidos, pausas, beat cuts, speed ramps, jump cuts) y la adapta a formato vertical con
  hooks visuales, zooms, cortes constantes y safe areas para Reels, TikTok y Shorts. Úsala cuando
  pidan "más dinámico", "está lento", "cortalo para TikTok", "pasalo a vertical", "hacelo más
  punchy", "sincronizalo con la música", "esto no engancha en el feed". Requiere picture lock.
---

# Ritmo y Edición Social

**Requiere:** picture lock de `vd-story-cutter`. Sin picture lock: **BLOQUEADO** — el ritmo sobre
una estructura que va a cambiar se tira a la basura.

**Specs y safe areas:** `agents/video/playbooks/ESPECIFICACIONES.md`

## Ritmo — objetivo por plataforma

| Plataforma | Duración media de plano | Cortes/min aprox. |
|---|---|---|
| TikTok / Reels / Shorts | 1-2.5s | 25-50 |
| YouTube largo | 3-6s | 10-20 |
| LinkedIn | 2-4s | 15-30 |
| Brand film / cine | 4-10s | 6-15 |

Se mide el corte real contra el objetivo del plan (`ffmpeg` scene detect sobre el propio export).

## Las herramientas de ritmo

| Herramienta | Para qué | Cuidado |
|---|---|---|
| **Beat cut** | Cortar en el golpe de la música | Si la música cambia, se rehace todo |
| **Jump cut** | Sacar respiraciones y muletillas | Se tapa con B-roll o zoom, no se deja crudo sin intención |
| **Speed ramp** | Comprimir tiempo muerto, dar energía | Necesita fps alto en origen; si no, tartamudea |
| **Pausa** | Hacer respirar antes de un beat importante | Nunca en los primeros 5 segundos |
| **Escala progresiva** | Zoom leve que sube tensión | Máx. 10-15% o se pixela |
| **Corte en movimiento** | Corta en medio de una acción | Mantiene continuidad si hay raccord |

## Social — pasar a vertical

1. **Reframe plano por plano.** 🛑 Un crop automático de 16:9 a 9:16 corta cabezas y **no se
   entrega**. Se revisan los frames.
2. **Safe areas 9:16 (1080×1920):** sup 150 · inf 420 · der 150 · izq 60 px. Nada importante afuera.
3. **Se ve sin sonido:** si la información vive solo en el audio → captions obligatorios
   (`vd-captions`).
4. **Cambio de estímulo cada 3-5s**: plano, escala, sonido o gráfica.
5. **Sin tiempo muerto en los primeros 5 segundos.** Ni transición decorativa, ni respiración.
6. **Primer frame elegido** (es la miniatura), último frame con marca + CTA ≥1.5s.

## Reglas duras

- 🛑 **El ritmo no arregla una estructura mala.** Si aburre, el problema está en `vd-story-cutter`.
- 🛑 **Nunca cambies la estructura acá.** Si hace falta, vuelve a `vd-plan`.
- **Velocidad ≠ energía.** Cortar más rápido sin cambio de información cansa, no engancha.
- **La pausa es una herramienta, no un error.** Se usa a propósito y se documenta.
- **Música con licencia.** Una pista de tendencia sirve de referencia de ritmo; no se entrega sin
  licencia (se declara en el QC).
- El ritmo respeta el tono del brief: un documental con cortes cada 1.5s traiciona el brief.

## Cierre
Medir cortes/min reales vs. objetivo. Correr los ítems de ritmo del bloque **Fase 4** de
`qa/QC-GATES.md`.

## Handoff
→ `vd-broll` para tapar los saltos que quedaron abiertos.
