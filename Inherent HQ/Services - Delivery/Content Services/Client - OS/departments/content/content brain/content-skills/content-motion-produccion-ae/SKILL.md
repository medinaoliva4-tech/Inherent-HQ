---
name: content-motion-produccion-ae
description: Produce el video motion/gráfico final integrando assets on-brand generados en Figma, b-roll y transiciones de IA generativa (Higgsfield u otra), y ensamblaje en After Effects/Premiere — aplicando timing, ritmo emocional y consistencia de marca para evitar el look genérico de IA. USA ESTE SKILL SIEMPRE que haya que producir el video final después de tener un plan de assets de `content-breakdown-video-ganador` y un concepto validado de `content-preproduccion-concepto`. No usar para diseño estático (usa `content-estatico-produccion-figma`), ni como sustituto del breakdown o la validación de concepto — este skill asume que ambos ya ocurrieron.
---

# Producción de Motion/Video (Figma → IA generativa → After Effects)

## JOB
Ensamblar el video final tratando el output de herramientas de IA generativa (Higgsfield u otras) como material crudo que debe integrarse a marca — nunca como pieza terminada lista para usar tal cual.

## Por qué existe este skill
El output de IA generativa se ve genérico cuando se usa directo, sin recomposición. La diferencia entre un video producido en horas que "se ve producido en horas" y uno que se ve profesional está en: (1) que los assets gráficos (tipografía, marcos, lower thirds) se hayan producido primero en Figma con las variables de marca, y (2) que el b-roll/transiciones de IA se retimen, recoloreen y recompongan dentro de After Effects para que coincidan con el lenguaje visual del resto de la pieza — no que se peguen crudos.

## INPUT requerido (bloqueante si falta)
1. Plan de assets de `content-breakdown-video-ganador` — si no existe, corre ese skill primero. No empieces a producir a ciegas.
2. Concepto validado por `content-preproduccion-concepto` (si es formato experimental/nuevo) — si el estado del concepto es "BLOQUEADO", detente y repórtalo.
3. Decisión de diseño emocional de `content-diseno-emocional-marca` (ritmo/timing objetivo).
4. `design-system-map.md` del cliente.

## ACTIONS (en este orden)

### 1. Producir primero los assets gráficos en Figma
Todo elemento gráfico identificado en el plan de breakdown (tipografía en pantalla, marcos, lower thirds, gráficos de datos) se produce primero en Figma usando las variables del design system — nunca directo en After Effects con fuentes/colores por defecto. Este orden no es negociable: es lo que preserva la identidad de marca.

### 2. Generar el material de IA según el plan
Para cada elemento marcado como "Generar con Higgsfield" en el breakdown, generarlo — con instrucciones que referencien explícitamente el estilo visual objetivo (no un prompt genérico).

### 3. Importar y recomponer en After Effects — nunca pegar crudo
Para cada asset de IA:
- Retimear para que el timing coincida con el ritmo objetivo definido en la decisión emocional (corte rápido para urgencia, respiración para confianza).
- Recolorear/gradear para que coincida con la paleta de marca, no con el grading por defecto de la herramienta generativa.
- Recomponer capas: superponer los gráficos de Figma (tipografía, marcos) sobre el material generado, no dejarlo aislado.

### 4. Aplicar principios de animación al ensamblaje
Aplica timing y spacing (ease in/out, no cortes robóticos salvo que la emoción objetivo sea urgencia extrema), arcs en movimiento de elementos gráficos, anticipación en transiciones clave. El objetivo es que el movimiento se sienta intencional, no plantilla.

### 5. Color grading final de toda la pieza
Un solo pase de color que unifique el material generado por IA, el footage real (si lo hay) y los gráficos de Figma bajo una misma paleta — el paso que hace que la pieza se vea de una sola marca y no un collage de fuentes distintas.

### 6. Sonido
Música/SFX consistentes con el ritmo emocional objetivo — timing sincronizado a los cortes clave, no solo música de fondo genérica.

### 7. Autochequeo de "look genérico" (igual que en estático, aplicado a motion)
¿Esta pieza podría pertenecer a cualquier marca que use las mismas herramientas de IA, o es identificable como esta marca específica? Si el material de IA se nota "crudo" o sin recomponer, vuelve al paso 3.

## OUTPUT
- Video final exportado en el formato/plataforma objetivo.
- Nota corta de handoff:
```
# Motion producido — [nombre de la pieza]

## Referencia de breakdown
[link/nombre del breakdown usado]

## Objetivo emocional y ritmo aplicado
[referencia a la decisión de content-diseno-emocional-marca]

## Elementos generados con IA vs. producidos en Figma vs. footage real
[lista corta]

## Estado
[LISTO PARA QA DE MARCA / requiere ajuste — cuál]
```

## CONTEXT que debes leer antes de generar
- Plan de assets de `content-breakdown-video-ganador`
- Estado del concepto de `content-preproduccion-concepto`
- Decisión de diseño emocional
- `design-system-map.md` del Client-OS

## QA
No es este skill quien da la aprobación final — eso es `brand-consistency-qa`. Marca siempre el estado como "LISTO PARA QA", nunca como aprobado.

## HANDOFF
Siempre a `brand-consistency-qa` antes de considerarse listo para cliente/publicación.

## Nota de entorno (Chat vs Cowork)
Este skill asume un entorno Cowork/Claude Code con acceso a Figma MCP, la herramienta de generación de video IA y After Effects/Premiere (vía automatización o instrucciones operativas para quien ejecuta AE). En Chat puro, este skill no puede ejecutar la producción real — puede generar el plan de ensamblaje detallado (assets, timing, orden de capas) para que se ejecute en Cowork o por un editor humano.
