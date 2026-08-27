---
name: content-brand-system-figma
description: Traduce brand guidelines ya aprobadas en un Design System operativo dentro de Figma (variables de color, tipografía, spacing y componentes) que sirve de fuente de verdad para TODA producción estática y motion del cliente. USA ESTE SKILL SIEMPRE que se apruebe o actualice un brand guideline, cuando se conecte un cliente nuevo a producción vía Figma MCP, o cuando un asset salga "genérico"/fuera de marca y haya que auditar por qué el design system no lo estaba previniendo. Es un requisito BLOQUEANTE de infraestructura: `content-estatico-produccion-figma` y `content-motion-produccion-ae` no deben correr sin que este design system exista y esté actualizado. No usar para crear una pieza de diseño puntual (usa `content-estatico-produccion-figma`) ni para definir el posicionamiento en sí (usa `brand-positioning-cbbe`).
---

# Brand System en Figma

## JOB
Convertir las decisiones de marca ya aprobadas (guidelines, positioning, arquetipo) en variables técnicas de Figma reutilizables por Claude Code vía Figma MCP, de forma que ningún asset (estático o motion) tenga que "adivinar" un color, fuente o efecto.

## Por qué existe este skill
El riesgo documentado de producir con IA a escala es el "AI slop": output que no diferencia la marca porque cada generación reinterpreta la identidad desde cero. La forma de prevenirlo no es revisar al final, es mover el control de marca *upstream* — a la etapa de creación. Este skill es esa etapa upstream: si el design system está bien construido, el MCP hereda la marca automáticamente en cada llamada.

## INPUT requerido
- `brand-guidelines.md` o el documento de Brand Guidelines Builder del Client-OS (si no existe, detente y dilo — no inventes tokens).
- `positioning.md` (arquetipo y tono, para decisiones que no son puramente técnicas: ej. si la tipografía debe sentirse "confiable" vs "disruptiva").
- Archivo Figma actual del cliente (si ya existe una librería previa que haya que migrar/auditar).

**Bloqueante:** si no existe `brand-guidelines.md` aprobado, detente. Recomienda correr primero `brand-guidelines-builder`. No construyas variables sobre supuestos.

## ACTIONS (en este orden)

### 1. Auditar qué existe hoy en el archivo Figma
Lista las variables/estilos ya definidos (color styles, text styles, componentes) vía Figma MCP. No sobrescribas sin comparar contra el guideline.

### 2. Construir/actualizar las variables de color
Crea variables semánticas, no solo literales: `brand/primary`, `brand/accent`, `emotion/urgencia` (si guideline define paleta por objetivo emocional), `neutral/bg`, `neutral/text`. Nunca dejes un color como hex suelto dentro de un componente — todo consume variable.

### 3. Construir/actualizar los estilos tipográficos
Un estilo por jerarquía real de uso (headline, subhead, body, caption, CTA) — no por tamaño arbitrario. Si el guideline define tipografía cinética o experimental para motion, documenta aquí qué familia/peso corresponde a cada caso de uso.

### 4. Construir/actualizar spacing tokens y componentes base
Grid, spacing scale, y componentes reutilizables (botón, tarjeta, lower third, marco de video) que ya usan las variables anteriores.

### 5. Documentar el mapeo emoción→token
Si `content-diseno-emocional-marca` ya generó reglas para este cliente, enlaza aquí qué variable de color/tipografía corresponde a cada objetivo emocional (urgencia, confianza, deseo). Esto es lo que le permite al MCP producir "confianza" o "urgencia" sin que un humano tenga que especificar el hex cada vez.

### 6. Verificar que el MCP puede leer todo sin fallback
Haz una llamada de prueba vía Claude Code + Figma MCP pidiendo un asset simple. Si el resultado usa colores/fuentes que no están en las variables, el design system está incompleto — vuelve al paso correspondiente.

## OUTPUT
- Archivo Figma con variables/estilos/componentes actualizados (fuente de verdad viva, no un documento estático).
- `design-system-map.md` en el Client-OS con esta estructura:

```
# Design System — [Cliente]

## Colores
[variable] → [hex] → [uso/emoción asociada]

## Tipografía
[estilo] → [familia/peso] → [uso]

## Spacing
[token] → [valor]

## Componentes base
[nombre] → [qué variables consume]

## Última auditoría
[fecha] — [qué cambió respecto al guideline]
```

## CONTEXT que debes leer antes de generar
- `brand-guidelines.md` del Client-OS
- `positioning.md` del Client-OS
- Archivo Figma actual (auditoría, no asunción)

## QA
Prueba de fuego: pide a Claude Code + Figma MCP que genere un asset de prueba SOLO con la instrucción de marca + objetivo emocional (sin especificar hex ni fuente). Si el resultado es on-brand, el sistema pasa. Si no, hay tokens faltantes o mal etiquetados.

## HANDOFF
- A `content-estatico-produccion-figma` y `content-motion-produccion-ae` como infraestructura consumida en cada producción.
- Si detectas que el guideline mismo tiene huecos (no cubre un caso), regresa a `brand-guidelines-builder`, no lo resuelvas inventando aquí.

## Nota de entorno (Chat vs Cowork)
- **Cowork/Claude Code:** este skill asume acceso directo al Figma MCP y al repo del Client-OS — léelos antes de preguntar.
- **Chat:** puedes documentar y planear el mapeo de variables en conversación, pero la ejecución real (crear/editar variables en Figma) requiere el entorno con MCP conectado; indícalo explícitamente si estás en Chat puro.
