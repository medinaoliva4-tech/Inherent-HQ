# Figwright Playbook — construcción del lote (D5-D6)

Cómo Inherent construye piezas de social en Figma. **Usamos Figwright, no el MCP oficial de Figma.**

> **Figwright** (`@figwright/mcp`, MIT — `github.com/awdr74100/figwright`) conecta un servidor MCP
> local a un **plugin de Figma** por WebSocket. Corre entero en tu máquina, no necesita asiento de
> Dev Mode ni plan pago, y es **bidireccional**: lee y **escribe** el canvas. Expone ~113 tools.
>
> Consecuencia operativa que cambia todo: **no hay fetch por URL.** Figwright trabaja sobre el
> archivo que el usuario tiene **abierto** con el plugin corriendo.

---

## 0 · Pre-check — siempre primero

```
CHECK FIGWRIGHT — ping: [✅/⬜] · Archivo conectado: [nombre] · Archivos abiertos: [n]
Sistema en el archivo: [✅/⬜] · Ruta visual aprobada: [✅/⬜] · Piezas a construir: [n]
→ PASS | BLOQUEADO: [qué falta]
```

1. Correr **`ping`** para confirmar que el plugin está conectado.
2. Si hay **más de un archivo abierto**, todo resultado trae un bloque
   `MORE THAN ONE FIGMA FILE IS OPEN`. **Reclamá el archivo antes de tocar nada:**
   `list_files` → `use_file({ fileName })`. Si dos archivos comparten nombre (`x (Copy)`),
   `use_file({ sessionId })`.
   🛑 **Si el usuario no dijo cuál es, preguntá.** No adivines por el nombre: sin reclamar, las
   llamadas siguen al archivo que el usuario tocó último — podés leer uno y escribir en otro.

⚠️ **Sin Figwright conectado:** D5 entrega **especificación construible** (brief + tokens +
componente + medidas exactas + orden de capas) marcada `BLOQUEADO — construcción manual pendiente`.
🛑 **Nunca declares una pieza "hecha" sin archivo.**

🛑 **Sin 🚦 GATE 2 aprobado no se construye el lote.** Construir 40 piezas antes del gate es la forma
más cara de equivocarse.

---

## 1 · Entender el entorno, después construir

**La causa número uno de una pieza que "se ve rara" son valores inventados** — padding, tamaños,
radios, colores, tipografías que el modelo se inventó. Antes de crear nada, leé el archivo real:

| Tool | Qué te da | Para qué |
|---|---|---|
| `get_variable_defs` | Variables del archivo (color / spacing / radius / tipografía) con nombre, valor y hex | Los tokens a los que vas a bindear |
| `scan_components` / `get_local_components` | Componentes existentes | Instanciar en vez de redibujar |
| `get_styles` | Paint / text / effect styles compartidos | Aplicar en vez de recrear |
| `get_fonts` | Fuentes disponibles | Verificar que la familia de la guía existe |
| `get_design_context` | Contexto de diseño fiel y deduplicado de una selección | Leer una pieza existente del cliente |

### Orden de prioridad de todo valor
```
1. El sistema del archivo   (variable / estilo / componente ya existente)  ← siempre primero
2. El sistema visual D0     (sistema-visual.md del cliente)
3. Una escala consistente   (8pt: 4·8·12·16·24·32·48·64) ← último recurso, nunca un número suelto
```

🛑 **Nunca inventes un hex o un px cuando el archivo tiene el token.** `get_variable_defs` te dice
cuáles hay.

---

## 2 · Construir la pieza

### 2.1 · El frame de la pieza
```
create_frame        → el lienzo del formato (1080×1350 / 1080×1080 / 1080×1920)
set_position        → dónde cae en el canvas (esto SÍ es absoluto)
set_layout_grids    → la grilla de columnas del formato (D0.4) — NO es lo mismo que auto layout
```

### 2.2 · Los bloques internos
```
create_frame + set_auto_layout(VERTICAL|HORIZONTAL|GRID, padding, itemSpacing, alignment)
```
Todo lo que tiene relación estructural (titular + subtítulo, lista de ítems, bloque de CTA) va en
**auto layout**. `x`/`y` absolutos **solo** para colocar el frame de la pieza en el canvas, o para un
sticker con `layoutPositioning: 'ABSOLUTE'`.

### 2.3 · Tamaños — `set_layout_props`
```
HUG    el contenedor encoge a su contenido   ← lo que casi siempre querés
FILL   el hijo estira hasta llenar al padre  ← appendear PRIMERO, después FILL
FIXED  conserva el tamaño explícito           ← el frame de la pieza
```

### 2.4 · Texto
```
create_text / set_text          → el contenido
set_text_properties             → familia, peso, tamaño, interlineado, tracking, paragraphSpacing
set_text_range                  → énfasis dentro del mismo bloque (una palabra en bold o color)
```

### 2.5 · Componentes de pieza
```
scan_components                 → qué hay
get_component_api               → el contrato exacto de propiedades (con las keys verbatim)
create_instance                 → una instancia por pieza
set_instance_properties         → variantes y overrides con esas keys exactas
```
VARIANT va por nombre pelado (`"Formato": "story"`); BOOLEAN / TEXT / INSTANCE_SWAP llevan sufijo
`#id` (`"Titular#2:0": "…"`).

### 2.6 · Color, trazo y efectos
```
set_fills → bind_variable_to_paint      ← el binding de color vive en el PAINT, no en el nodo
set_strokes → bind_variable_to_paint
set_effects                              ← sombras de stickers
apply_style_to_node                      ← estilos compartidos (una sombra, un paso del ramp)
bind_variable_to_node                    ← escalares: padding, itemSpacing, radios, width/height
```

### 2.7 · Imágenes y vectores
```
import_image   → fotos (raster)
import_svg     → logo, marca, vector que no está como componente
create_instance → un ícono que YA existe como componente  ← nunca import_svg en ese caso
```
Recolorear un vector monocromo en el lugar de uso: `set_fills` / `bind_variable_to_paint`.

### 2.8 · Muchas ediciones de una
`batch` aplica muchas operaciones en una sola llamada atómica. Úsalo para las 8 slides de un
carrusel, no 8 llamadas.

---

## 3 · Los 10 errores que rompen la pieza

| # | Error | Qué pasa | Cómo se evita |
|---|---|---|---|
| 1 | Texto en Inter | Todo `TEXT` nuevo nace en **Inter**, no en la fuente de la marca | `set_text_properties` **siempre** después de crear texto |
| 2 | Frame de 100×100 | Un `create_frame` sin width+height queda en 100×100 con eje contrario FIXED | `set_layout_props` con `HUG` |
| 3 | `FILL` antes de appendear | Un hijo no puede llenar un layout en el que todavía no está | Appendear primero, después `FILL` |
| 4 | Bindear color al nodo | Figma guarda el binding de color en el **paint** | `set_fills` primero, después `bind_variable_to_paint` |
| 5 | Partir un énfasis en otro nodo | Rompe el reflow y se lee como texto separado | Un solo `TEXT` + `set_text_range` |
| 6 | Un nodo por párrafo | Convierte un texto en N cajas sin relación | Un `TEXT` con `\n` + `paragraphSpacing` |
| 7 | Confundir grilla con auto layout | `set_layout_grids` overlaya la grilla del frame; `set_auto_layout` ordena a sus hijos | Son ortogonales. Los dos se usan |
| 8 | `resize_nodes` para tamaño de contenido | Fuerza FIXED y trae de vuelta las peleas de 100×100 | `set_layout_props` con HUG/FILL |
| 9 | Hijos con `x`/`y` a mano | Se ve bien hasta que cambia el texto | Auto layout |
| 10 | Escribir sin reclamar el archivo | Leés uno y escribís en otro, y reportás éxito | `list_files` + `use_file` |

---

## 4 · Carrusel seamless — la técnica del lienzo largo

Para un carrusel continuo (una imagen larga partida en slides), **no diseñes N piezas separadas**:

```
1. Crear UN frame largo:  ancho = 1080 × N   ·   alto = 1080 (o 1350)
   Ej. 6 slides 1:1 → 6480 × 1080
2. Marcar las divisiones con guías verticales en 0, 1080, 2160, 3240, 4320, 5400
3. Diseñar la composición completa, dejando que formas e imágenes CRUCEN las guías
   ← eso es lo que produce la sensación de seamless y de swipe
4. Convertir el frame largo en COMPONENT (create_component)
5. Crear N frames de 1080 × 1080, uno por slide
6. En cada frame, create_instance del componente largo, y set_position en X:
   slide 1 → X = 0        slide 4 → X = -3240
   slide 2 → X = -1080    slide 5 → X = -4320
   slide 3 → X = -2160    slide 6 → X = -5400
7. Exportar los N frames — NUNCA el componente largo
```

**Por qué componente:** editás la composición larga una vez y los N recortes se actualizan solos.

⚠️ **Verificá el signo del offset con un `get_screenshot`** antes de replicar a las 6 slides: lo que
importa es que cada frame muestre su porción, no la fórmula.

🛑 **No cortes elementos justo sobre la guía.** Si todo termina exactamente en el corte, se pierde el
seamless y el carrusel se lee como 6 piezas sueltas.

---

## 5 · Verificar — cerrar el bucle

`get_screenshot` **después de cada bloque**, no solo al final.

### Qué buscar
- **Texto cortado** — line-height o frame chico comiéndose descendentes o líneas enteras
- **Superposiciones** por sizing mal resuelto
- **Placeholders** sin reemplazar ("Título", "Heading")
- **Variante equivocada** del componente
- **Bordes desalineados** por unos px
- **Espaciado inconsistente** — gaps de una sola escala, no un número distinto cada vez
- **Jerarquía de tipo plana** — titular, cuerpo y micro tienen que diferenciarse de verdad

⚠️ **`empty: true` en un export significa que el nodo no renderizó nada** — está oculto, fuera del
canvas, o vacío. No es un screenshot en blanco: es un nodo roto.

---

## 6 · Errores del servidor

```
1. PARAR. No reintentar igual
2. Leer el error — dice qué pasó
3. Si no está claro: get_node o get_screenshot para ver el estado real
4. Corregir
5. Reintentar
```

Como se construye bloque por bloque, el error queda acotado: lo ya construido sigue intacto.

---

## 7 · Motion — dónde está el límite

Figwright puede escribir animaciones de Figma Motion (`apply_animation_style`,
`apply_manual_keyframe_track`, `set_timeline_duration`, `export_video`).

| Qué | De quién | Con qué |
|---|---|---|
| **Elemento animado de relleno** dentro de una pieza (loop de fondo, forma en movimiento) | **Diseño** | **VisuHaus** — ver `ASSETS-Y-MCP.md` ⚠️ |
| **Animar el estático completo** (motion graphic del arte) | **Production / Post** | — |

🛑 **No uses Figma Motion para animar la pieza.** El estático se construye con las capas separadas y
nombradas para que se pueda animar después; el elemento animado de relleno viene de VisuHaus como
asset, no se autoriza acá.

Lo que sí hacés: marcar en `entrega.md` qué piezas llevan animado y cuáles son **candidatas a motion**
para Production.

---

## 8 · Permisos — configurar antes del primer lote

Agregar a `.claude/settings.json`. El prefijo depende del nombre con el que se registre el servidor
(típicamente `mcp__figwright__<tool>`). **Verificá el nombre exacto en tu cliente antes de escribir
las reglas** — una entrada con prefijo equivocado no falla: simplemente nunca aplica.

| Sección | Tools |
|---|---|
| `allow` — solo lectura | `ping` · `list_files` · `get_node` · `get_variable_defs` · `get_styles` · `get_fonts` · `scan_components` · `get_local_components` · `get_component_api` · `get_screenshot` · `get_design_context` · `search_nodes` · `design_diff` |
| `ask` — escritura sobre el archivo del cliente | `use_file` · `create_frame` · `create_text` · `create_instance` · `create_component` · `set_*` · `bind_*` · `apply_*` · `import_*` · `batch` · `move_nodes` · `resize_nodes` |
| `deny` — el motion de la pieza no es de Diseño | `apply_animation_style` · `apply_manual_keyframe_track` · `set_timeline_duration` · `export_video` |

🛑 **Ninguna tool de escritura va en `allow`.** Figwright escribe sobre el archivo real del cliente y
sus tools de export escriben archivos en rutas que elige el agente. La aprobación del cliente MCP es
el límite que importa.

---

## 9 · Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Dibujar cajas con hex sin leer el archivo | La pieza queda desconectada y no se actualiza nunca | `get_variable_defs` + `scan_components` primero |
| Copiar y pegar el layout 40 veces | Un cambio de sistema = 40 ediciones a mano | `create_component` + `create_instance` |
| Construir todo en una llamada | Un error tira todo; no hay dónde validar | Un bloque por paso + screenshot |
| Dejar los titulares en Inter | El lote entero pierde la marca | `set_text_properties` siempre |
| Escribir sin `ping` ni `use_file` | Escribís en el archivo equivocado y reportás éxito | Pre-check del paso 0 |
| Diseñar 6 slides sueltas para un seamless | No hay continuidad; editar es imposible | Lienzo largo + componente + recortes |
| Construir el lote antes del 🚦 GATE 2 | 40 piezas a corregir en vez de 1 | Ruta visual primero |
| Declarar la pieza hecha sin archivo | No existe | Especificación marcada `BLOQUEADO` |
