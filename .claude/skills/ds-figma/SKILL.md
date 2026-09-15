---
name: ds-figma
description: >
  Capa D5 del método de Diseño — construye el lote de piezas de social en Figma usando **Figwright**,
  el MCP no oficial de Figma que usa Inherent (no el MCP oficial ni Dev Mode). Corre `ping`, reclama
  el archivo conectado, descubre variables, componentes, estilos y fuentes del archivo real, arma los
  componentes de pieza con VARIANTS por formato, instancia con overrides, bindea tokens en vez de
  hardcodear, y valida con screenshot bloque por bloque. Incluye la técnica del carrusel seamless por
  lienzo largo. Úsala cuando pidan "construilo en Figma", "pasá esto a Figma", "armá el archivo",
  "creá los componentes", "actualizá la pieza en Figma". Requiere ruta visual aprobada (GATE 2).
  Sin Figwright conectado entrega especificación construible, nunca declara la pieza hecha.
model: sonnet
effort: medium
---

# D5 · Construcción con Figwright

Leé `agents/design/playbooks/FIGWRIGHT-PLAYBOOK.md` **completo** antes de la primera llamada.
Requiere `ruta-visual.md` aprobada (🚦 GATE 2).

## Qué es Figwright — y por qué cambia el flujo

`@figwright/mcp` conecta un servidor MCP local a un **plugin de Figma** por WebSocket. Corre entero
en la máquina, no necesita Dev Mode ni plan pago, y es **bidireccional** (~113 tools).

🛑 **No hay fetch por URL.** Figwright trabaja sobre el archivo que el usuario tiene **abierto** con
el plugin corriendo. Esa es la diferencia operativa más importante con el MCP oficial.

## Pre-check — siempre

```
CHECK FIGWRIGHT — ping: [✅/⬜] · Archivo conectado: [nombre] · Archivos abiertos: [n]
Sistema en el archivo: [✅/⬜] · Ruta visual aprobada: [✅/⬜] · Piezas: [n]
→ PASS | BLOQUEADO: [qué falta]
```

1. **`ping`** — confirmar el plugin conectado.
2. Si hay más de un archivo abierto, los resultados traen `MORE THAN ONE FIGMA FILE IS OPEN`.
   **Reclamá antes de tocar nada:** `list_files` → `use_file({ fileName })`.
   🛑 Si el usuario no dijo cuál, **preguntá**. Sin reclamar podés leer uno y escribir en otro.

⚠️ Sin Figwright: **especificación construible** marcada `BLOQUEADO — construcción manual pendiente`.
🛑 **Nunca declares una pieza hecha sin archivo.**
🛑 **Sin GATE 2 no se construye el lote.**

## Entender el entorno, después construir

**La causa número uno de una pieza que se ve rara son valores inventados.**

| Tool | Para qué |
|---|---|
| `get_variable_defs` | Los tokens a los que vas a bindear |
| `scan_components` / `get_local_components` | Componentes a instanciar en vez de redibujar |
| `get_styles` | Paint / text / effect styles compartidos |
| `get_fonts` | Verificar que la familia de la guía existe |
| `get_design_context` | Leer una pieza existente del cliente |

**Prioridad de todo valor:** sistema del archivo → sistema visual D0 → escala de 8pt. Nunca un
número suelto.

## Construir

```
create_frame + set_position + set_layout_grids       → el lienzo de la pieza
create_frame + set_auto_layout                        → los bloques internos
set_layout_props (HUG / FILL / FIXED)                 → tamaños
create_text + set_text_properties + set_text_range    → texto
scan_components → get_component_api → create_instance → set_instance_properties
set_fills → bind_variable_to_paint                    → color (el binding vive en el PAINT)
bind_variable_to_node                                 → escalares: padding, gap, radios
apply_style_to_node                                   → estilos compartidos
import_image / import_svg                             → fotos y vectores
batch                                                 → muchas ediciones de una (ej: 8 slides)
get_screenshot                                        → después de CADA bloque
```

## Los 10 errores que rompen la pieza

| # | Error | Cómo se evita |
|---|---|---|
| 1 | Texto queda en **Inter** | `set_text_properties` **siempre** tras crear texto |
| 2 | Frame de **100×100** | `set_layout_props` con `HUG` |
| 3 | `FILL` antes de appendear | Appendear primero, después `FILL` |
| 4 | Bindear color al nodo | `set_fills` primero, después `bind_variable_to_paint` |
| 5 | Partir un énfasis en otro nodo | Un solo `TEXT` + `set_text_range` |
| 6 | Un nodo por párrafo | Un `TEXT` con `\n` + `paragraphSpacing` |
| 7 | Confundir `set_layout_grids` con `set_auto_layout` | Son ortogonales; los dos se usan |
| 8 | `resize_nodes` para tamaño de contenido | `set_layout_props` con HUG/FILL |
| 9 | Hijos con `x`/`y` a mano | Auto layout |
| 10 | Escribir sin reclamar el archivo | `list_files` + `use_file` |

## Carrusel seamless — lienzo largo

```
1. create_frame de (1080 × N) × alto        ej. 6 slides 1:1 → 6480 × 1080
2. Diseñar la composición completa, dejando que formas e imágenes CRUCEN las guías
3. create_component del frame largo
4. N frames de 1080 × 1080
5. create_instance + set_position en X: 0, -1080, -2160, -3240, -4320, -5400
6. Exportar los N frames — NUNCA el componente largo
```
⚠️ Verificá el signo del offset con un `get_screenshot` antes de replicar a todas las slides.
🛑 No cortes elementos justo sobre la guía: se pierde el seamless.

## Verificar

`get_screenshot` **por bloque**. Buscá: texto cortado · superposiciones · placeholders · variante
equivocada · bordes desalineados · espaciado inconsistente · jerarquía de tipo plana.
⚠️ **`empty: true` = el nodo no renderizó nada** (oculto, fuera del canvas, o vacío).

## Errores

**PARAR → leer el error → `get_node`/`get_screenshot` si no está claro → corregir → reintentar.**
Nunca reintentar igual.

## Motion — dónde está el límite

| Qué | De quién |
|---|---|
| Elemento animado de relleno dentro de la pieza | **Diseño** — con VisuHaus, como asset |
| Animar el estático completo | **Production / Post** |

🛑 **No uses Figma Motion** (`apply_animation_style`, `export_video`) para animar la pieza.

## Cierre

Corré el bloque D5 de `qa/QA-GATES.md`. Nomenclatura: `<id_pieza>__<canal>__<formato>`.
Siguiente: `ds-adaptacion` (D6).
