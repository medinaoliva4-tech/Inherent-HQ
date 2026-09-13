---
name: ds-figma
description: >
  Capa D5 del método de Diseño — construye el lote en Figma sobre el design system del cliente vía
  el MCP de Figma: descubre componentes, variables y estilos publicados, arma los layouts como
  COMPONENT SET con VARIANTS por formato, instancia las piezas con overrides, enlaza tokens en vez
  de hardcodear, y valida con screenshot bloque por bloque. Úsala cuando pidan "construilo en
  Figma", "pasá esto a Figma", "armá el archivo", "creá los componentes", "actualizá la pieza en
  Figma", o al bajar una ruta visual aprobada a archivo. Requiere ruta visual aprobada (GATE 2).
  Sin MCP de Figma entrega especificación construible, nunca declara la pieza hecha.
---

# D5 · Construcción en Figma

Leé `agents/design/playbooks/FIGMA-PLAYBOOK.md` **completo** antes de la primera llamada.
Requiere `ruta-visual.md` aprobada (🚦 GATE 2).

## Pre-check

```
CHECK FIGMA — MCP: [✅/⬜] · Archivo destino: [url/key] · Sistema en archivo: [✅/⬜]
Ruta visual aprobada: [✅/⬜] · Piezas a construir: [n]
→ PASS | BLOQUEADO: [qué falta]
```

⚠️ **Sin MCP de Figma:** entregá **especificación construible** (brief + tokens + layout + medidas
exactas + orden de capas) marcada `BLOQUEADO — construcción manual pendiente`.
🛑 **Nunca declares una pieza "hecha" sin archivo.**

🛑 **Sin GATE 2 aprobado no se construye el lote.** Construir 40 piezas antes del gate es la forma
más cara de equivocarse.

## Cargar herramientas — una sola llamada

```
ToolSearch query="select:use_figma,get_screenshot,get_metadata,get_libraries,search_design_system,create_new_file"
```

## Descubrir antes de construir — en orden

1. **Inspeccionar una pieza existente** del cliente en el archivo → mapa exacto de componentes,
   variables y estilos ya en uso
2. **`get_libraries`** sobre el archivo
3. **`search_design_system`** con `includeComponents` / `includeVariables` / `includeStyles` — solo
   si quedó algo sin resolver

🛑 **Trampa crítica:** `getLocalVariableCollectionsAsync()` devuelve **solo variables locales**.
Si vuelve vacío **no significa que no haya variables** — las de librería publicada son invisibles
para esa API. **Nunca concluyas "no hay variables" sin correr `search_design_system` con
`includeVariables: true`.**

Buscá con consultas **cortas y múltiples en paralelo** (`gray`, `background`, `space`, `radius`),
no una compuesta. Las librerías varían en nomenclatura.

## Las reglas que rompen el script

| # | Regla |
|---|---|
| 1 | Colores en **0–1**, no 0–255 |
| 2 | **Cargar la fuente antes de tocar texto** (`loadFontAsync`) → mutar → devolver IDs |
| 3 | Al mutar texto existente, cargar **sus** fuentes vía `getStyledTextSegments(['fontName'])` |
| 4 | `return` es el canal de salida. `console.log` no vuelve. `figma.notify()` tira error |
| 5 | Fills/strokes son **read-only**: clonar → modificar → reasignar |
| 6 | `setBoundVariableForPaint` **devuelve un paint nuevo** — capturarlo y reasignarlo |
| 7 | **Appendear primero**, después setear `HUG`/`FILL` |
| 8 | **`await` a toda promesa** |
| 9 | Posicionar nodos nuevos lejos de (0,0) |
| 10 | **Devolver todos los IDs** creados y mutados |
| 11 | `currentPage` se resetea por llamada → `await setCurrentPageAsync(page)` |
| 12 | Una sola llamada a `setCurrentPageAsync` por script; multi-página → N llamadas en paralelo |
| 13 | **En error: PARAR.** Los scripts fallados son atómicos. Leer, corregir, reintentar |
| 14 | Al crear variables, setear `scopes` explícitamente |

## Construcción

| Regla | Por qué |
|---|---|
| **Contenedor primero, en su propia llamada** | Reparentar entre llamadas falla en silencio |
| **Layouts como `COMPONENT SET` con `VARIANTS` por formato** | Un cambio de sistema actualiza 40 piezas, no 0 |
| **Piezas como `INSTANCE` con overrides** | Copiar y pegar mata el sistema |
| **Auto layout en todo lo estructural** | x/y absolutos se rompen con cualquier cambio de texto |
| **Tokens, nunca literales** | Color por variable, spacing/radio por variable, tipo por `TEXT STYLE`, sombra por `EFFECT STYLE` |
| **Un bloque por llamada + `get_screenshot`** | El error queda acotado; lo construido sigue intacto |
| **`setProperties()` para overrides de texto** | Más confiable que `node.characters` directo |

**Nomenclatura:** `<id_pieza>__<canal>__<formato>` · carrusel: `__s01`, `__s02`…

**Qué buscar en cada screenshot:** texto cortado por line-height · elementos superpuestos ·
placeholders sin reemplazar · variante equivocada del componente.

## Imágenes — la limitación

El Plugin API **no puede bajar imágenes de una URL externa**. Solo copia `imageHash` de nodos ya
presentes en el archivo. Si la pieza lleva imagen y no está en el archivo, **resolvelo primero** —
si no, los frames quedan en blanco.

## Estructura del archivo

```
00 · Sistema · 01 · Layouts · 02 · Lote [mes] · 03 · Assets · 99 · Exports
```

## Cierre

Corré el bloque D5 de `qa/QA-GATES.md`. Siguiente: `ds-adaptacion` (D6).
