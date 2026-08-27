---
name: content-estatico-produccion-figma
description: Produce el asset gráfico estático final (post, ad, carrusel, banner) en Figma vía Claude Code + Figma MCP, aplicando el design system de marca, las reglas de diseño emocional y los fundamentos de jerarquía/contraste/tipografía/espacio negativo. USA ESTE SKILL SIEMPRE que el CEO pida crear una pieza estática de diseño gráfico para redes, ads o cualquier formato no-video, o cuando pida iterar/producir variantes de un formato aprobado. No usar para motion/video (usa `content-motion-produccion-ae`), ni para retoque fotográfico de producto/comida (usa `production-retoque-etico`).
---

# Producción de Diseño Estático (Figma MCP)

## JOB
Ensamblar la pieza gráfica final aplicando en una sola pasada lo que en un equipo humano especializado harían roles separados (dirección de arte, tipografía, composición, color) — sin saltarse ninguno de esos criterios por conveniencia.

## Por qué existe este skill
La teoría de diseño no se volvió obsoleta con la IA — se volvió el filtro de calidad que evita que un asset generado se vea genérico o "de plantilla". Jerarquía, contraste, espacio negativo y tipografía consistente con marca son lo que separa una pieza producida en minutos de una que se ve producida en minutos.

## INPUT requerido (bloqueante si falta)
1. `design-system-map.md` del cliente — si no existe, detente y corre primero `content-brand-system-figma`. No inventes colores/fuentes.
2. Decisión de diseño emocional de `content-diseno-emocional-marca` para esta pieza — si no existe, corre ese skill primero o pregunta el objetivo emocional explícitamente.
3. Copy/mensaje de la pieza (si no viene del brief, pregunta).
4. Formato y dimensiones objetivo (feed, story, carrusel, cuántos slides, plataforma).

## ACTIONS (en este orden)

### 1. Confirmar variables disponibles
Antes de generar, verifica vía Figma MCP que las variables del design system necesarias existen (color, tipografía, spacing). Si falta alguna, no la inventes — repórtalo y detente o pide al CEO que decida.

### 2. Definir jerarquía visual antes de maquetar
¿Qué debe verse primero, segundo, tercero? Escríbelo explícitamente (no lo dejes implícito en el layout). Esto es dirección de arte comprimida en un paso.

### 3. Aplicar composición
Usa los fundamentos: alineación consistente, contraste suficiente entre texto y fondo, espacio negativo intencional (no relleno vacío por accidente), proximidad para agrupar elementos relacionados.

### 4. Aplicar tipografía según la decisión emocional
Usa el estilo tipográfico del design system que corresponde al objetivo emocional de la pieza (paso ya resuelto por `content-diseno-emocional-marca`). No mezcles más de 2 familias tipográficas en una pieza.

### 5. Aplicar color según la decisión emocional
Mismo principio — consume la variable de color ya decidida, no una nueva interpretación.

### 6. Generar vía Figma MCP
Ejecuta la creación/edición en Figma usando Claude Code. Usa componentes del design system cuando existan en vez de crear elementos desde cero.

### 7. Autochequeo de "look genérico"
Antes de entregar, pregúntate: ¿esta pieza podría pertenecer a cualquier marca, o es identificable como esta marca específica sin ver el logo? Si la respuesta es "cualquier marca", revisa tipografía y color — probablemente no se están usando las variables del design system de forma distintiva.

## OUTPUT
- Archivo/frame en Figma con la pieza final, usando exclusivamente variables del design system.
- Nota corta de handoff:
```
# Asset producido — [nombre de la pieza]

## Formato
[dimensiones/plataforma]

## Objetivo emocional aplicado
[referencia a la decisión de content-diseno-emocional-marca]

## Variables de marca usadas
[color, tipografía]

## Estado
[LISTO PARA QA DE MARCA / requiere ajuste — cuál]
```

## CONTEXT que debes leer antes de generar
- `design-system-map.md` del Client-OS
- Output de `content-diseno-emocional-marca` para esta pieza
- Calendario/brief del CEO o Growth

## QA
No es este skill quien da la aprobación final de marca — eso es `brand-consistency-qa`. Este skill solo puede hacer el autochequeo del paso 7 antes de entregar. Marca siempre el estado como "LISTO PARA QA" y no como "aprobado".

## HANDOFF
- Siempre a `brand-consistency-qa` antes de considerarse listo para cliente.
- Si el asset es parte de un video (motion), el handoff es a `content-motion-produccion-ae`, no directo a QA.

## Nota de entorno (Chat vs Cowork)
- **Cowork:** ejecuta directamente vía Claude Code + Figma MCP sobre el archivo real del cliente.
- **Chat:** si no hay MCP conectado en la sesión actual, describe la pieza (layout, jerarquía, variables a usar) como especificación detallada para que se ejecute en Cowork — no simules el resultado visual en texto como si fuera el entregable final.
