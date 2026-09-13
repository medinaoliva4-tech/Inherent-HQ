# Figma Playbook — construcción del lote (D5-D6)

Cómo se construye un lote en Figma sobre el design system del cliente, usando el MCP de Figma.

> Base metodológica: el workflow de `figma-use` + `figma-generate-design` del repo público
> `thedesignproject/agent-skills` (MIT), adaptado a piezas estáticas de social.

---

## 0 · Antes de tocar Figma

```
CHECK FIGMA — MCP: [✅/⬜] · Archivo destino: [url o key] · Sistema en archivo: [✅/⬜]
Ruta visual aprobada: [✅/⬜] · Piezas a construir: [n]
→ PASS | BLOQUEADO: [qué falta]
```

⚠️ **Sin MCP de Figma:** D5 sale como **especificación construible** — brief + tokens + layout +
medidas exactas + orden de capas — marcada `BLOQUEADO — construcción manual pendiente`.
**Nunca declares una pieza "hecha" sin archivo.**

🛑 **Sin ruta visual aprobada (🚦 GATE 2) no se construye el lote.** Construir 40 piezas antes del
gate es la forma más cara de equivocarse.

---

## 1 · Cargar las herramientas

Si las herramientas de Figma aparecen como deferred, cargalas **todas en una sola llamada**:

```
ToolSearch query="select:use_figma,get_screenshot,get_metadata,get_libraries,search_design_system,create_new_file"
```
Una ida y vuelta, no seis.

---

## 2 · Descubrir el design system — en este orden

**Nunca dibujes una caja con un hex si el sistema ya tiene el componente o la variable.**

| Paso | Qué hacés | Cuándo saltear |
|---|---|---|
| **2a** | Inspeccionar una pieza existente del cliente en el archivo — te da el mapa exacto de componentes, variables y estilos que ya usa | Si el archivo está vacío → `N/A` documentado |
| **2b** | `get_libraries` sobre el archivo, para ver qué librerías tiene enlazadas | Nunca |
| **2c** | `search_design_system` con `includeComponents`, `includeVariables`, `includeStyles` | Solo si 2a no resolvió todo |

### Trampa de variables (importante)
`figma.variables.getLocalVariableCollectionsAsync()` devuelve **solo variables locales del archivo**.
Si vuelve vacío, **no significa que no haya variables** — las de librería publicada son invisibles
para esa API.

🛑 **Nunca concluyas "no hay variables" sin haber corrido también `search_design_system` con
`includeVariables: true`.**

### Cómo buscar variables
Consultas **cortas y múltiples en paralelo**, no una compuesta:
- Color primitivo: `gray`, `black`, `white`, `brand`
- Color semántico: `background`, `text`, `foreground`, `surface`
- Espaciado: `space`, `gap`, `padding`, `radius`

Las librerías varían ("grey"/"gray", "space"/"spacing"). Si no aparece nada, probá fragmentos más
cortos antes de decidir crear las tuyas.

---

## 3 · Reglas duras del API (las que rompen el script)

| # | Regla |
|---|---|
| 1 | **Colores en rango 0–1**, no 0–255. `{r:1,g:0,b:0}` = rojo |
| 2 | **Cargar la fuente antes de tocar texto**: `await figma.loadFontAsync(...)` → mutar → devolver IDs. Sin esto: `Cannot write to node with unloaded font`. Aplica a *cualquier* operación sobre nodos de texto, no solo a `characters` |
| 3 | Al mutar texto existente, cargar **sus** fuentes actuales vía `getStyledTextSegments(['fontName'])`, no una por default |
| 4 | **`return` es el canal de salida.** `console.log()` no vuelve. `figma.notify()` tira error |
| 5 | Fills y strokes son **arrays de solo lectura**: clonar → modificar → reasignar |
| 6 | `setBoundVariableForPaint` **devuelve un paint nuevo** — hay que capturarlo y reasignarlo |
| 7 | `layoutSizingHorizontal/Vertical`: **appendear primero, después** setear `HUG`/`FILL`. `FIXED` siempre funciona |
| 8 | **`await` a toda promesa.** Una promesa sin await = fallo silencioso |
| 9 | Nodos nuevos a nivel de página caen en (0,0) — **posicionarlos lejos** del contenido existente |
| 10 | **Devolver todos los IDs** creados y mutados. Sin IDs no se corrige: se reconstruye |
| 11 | `figma.currentPage` **se resetea** en cada llamada. Usar `await figma.setCurrentPageAsync(page)`, el setter sincrónico tira error |
| 12 | Una sola llamada a `setCurrentPageAsync` por script. Trabajo multi-página → N llamadas en paralelo, en un solo mensaje |
| 13 | **En error: PARAR.** Los scripts fallados son atómicos — no se escribió nada. Leer el error, corregir, reintentar. Nunca reintentar igual |
| 14 | Al crear variables, **setear `scopes` explícitamente**. El default `ALL_SCOPES` contamina todos los pickers |

---

## 4 · Estructura del archivo

```
00 · Sistema       tokens, escala tipográfica, matriz de contraste, scrims
01 · Layouts       los layouts de D0.7 como COMPONENT SET con VARIANTS por formato
02 · Lote [mes]    las piezas, agrupadas por formato
03 · Assets        ilustraciones · PNGs · texturas · brochas · formas
99 · Exports       frames marcados para export
```

**Nomenclatura de frames:** `<id_pieza>__<canal>__<formato>` → `P012__IG__story`
**Carrusel:** `P012__IG__carrusel__s01`, `__s02`…

---

## 5 · Construcción — orden obligatorio

### 5.1 · Crear el contenedor primero
🛑 **No construyas secciones sueltas en la página para reparentarlas después.** Mover nodos entre
llamadas con `appendChild()` falla en silencio y deja frames huérfanos.

Creá el frame de la pieza en su propia llamada, posicionado en espacio libre, y **devolvé su ID**.

### 5.2 · Layouts como COMPONENT SET
Un layout se construye **una vez**, con `VARIANTS` por formato (`formato=feed-4x5`,
`formato=story`, `formato=carrusel`). Cada pieza es una `INSTANCE` con overrides.

**Ventaja real:** cuando cambia el sistema, cambian las 40 piezas. Si copiaste y pegaste, cambian 0.

### 5.3 · Auto layout para todo lo estructural
Texto apilado, bloques con gap, listas, bloque de titular+subtítulo → `createAutoLayout()`.
Coordenadas absolutas solo para **dónde está el contenedor en el canvas**, nunca para la relación
entre hijos.

### 5.4 · Tokens, nunca literales
| Propiedad | Cómo |
|---|---|
| Color | `setBoundVariableForPaint` — capturar el paint devuelto |
| Spacing / radio | `setBoundVariable("paddingLeft", var)` etc. |
| Tipografía | `node.textStyleId = style.id` (importar con `importStyleByKeyAsync`) |
| Sombra | `node.effectStyleId = style.id` |

### 5.5 · Una sección por llamada, y validar
Construí **un bloque por llamada** (fondo → foto → scrim → texto → overlays). Después de cada uno:
`get_screenshot` sobre ese nodo.

**Qué buscar en el screenshot** (lo que más se escapa):
- Texto cortado por line-height o por frame chico
- Elementos superpuestos por sizing mal resuelto
- Texto placeholder sin reemplazar ("Título", "Heading")
- Variante equivocada del componente

### 5.6 · Override de texto en instancias
Usar `setProperties()` con las claves de propiedad del componente, no `node.characters` directo.
Para instancias anidadas, llamar `setProperties()` sobre la instancia anidada.
`node.characters` solo para texto que no está gobernado por ninguna propiedad.

---

## 6 · Imágenes — la limitación importante

**El Plugin API no puede bajar imágenes de una URL externa.** Solo puede setear fills de imagen
copiando un `imageHash` de un nodo que ya esté en el archivo.

| Situación | Qué hacés |
|---|---|
| Las fotos ya están en el archivo Figma | Copiar el `imageHash` del nodo existente |
| Las fotos están en Drive / local | **El humano las sube al archivo** (o se usa la vía de captura), y recién ahí se copian los hashes |
| Se saltea este paso | Los frames de imagen quedan **en blanco** |

Antes de construir, chequeá si la pieza lleva imagen. Si lleva y no está en el archivo, **resolvelo
primero** — no lo dejes para el final.

---

## 7 · Adaptación (D6) en Figma

| Qué | Cómo |
|---|---|
| Cambiar de formato | `swapComponent` a la variante del formato destino, o instancia nueva del variant |
| Reencuadrar la foto | Cambiar el `scaleMode` y el crop del fill — **nunca estirar el frame** |
| Menos overlays en story | Sacar capas, no reducirlas de tamaño |
| Validar | `get_screenshot` de cada formato, y comparar el lote junto |

---

## 8 · Export (D7)

| Regla | Valor |
|---|---|
| Escala | **1x sobre el frame en px reales**. No 2x sobre un frame a la mitad |
| Formato | PNG con texto y planos sólidos · JPG alta calidad con fotografía dominante |
| Perfil | sRGB |
| Fondo | Siempre opaco. 🛑 Nunca transparente |
| Nombre | `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>` |

---

## 9 · Recuperación de errores

```
1. PARAR. No reintentar igual
2. Leer el error — dice qué pasó
3. Si no está claro: get_metadata o get_screenshot para ver el estado real
4. Corregir el script
5. Reintentar
```

Los scripts fallados **no escriben nada**. Como se construye bloque por bloque, el error queda
acotado a un bloque: lo ya construido sigue intacto.

---

## 10 · Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Dibujar cajas con hex en vez de usar el sistema | La pieza queda desconectada; no se actualiza nunca | Descubrir primero (paso 2), construir después |
| Copiar y pegar el layout 40 veces | Un cambio de sistema = 40 ediciones a mano | `COMPONENT SET` + `INSTANCE` |
| Construir todo en una llamada | Un error tira todo; no hay dónde validar | Un bloque por llamada + screenshot |
| Concluir "no hay variables" con la API local | Las de librería son invisibles para esa API | `search_design_system` con `includeVariables` |
| Posicionar hijos con x/y absolutos | Se rompe con cualquier cambio de texto | Auto layout |
| Construir el lote antes del 🚦 GATE 2 | 40 piezas a corregir en vez de 1 | Ruta visual primero |
| Declarar la pieza hecha sin archivo | No existe | Especificación marcada `BLOQUEADO` |

---

## 11 · Permisos del MCP de Figma — pendiente

⚠️ **El MCP de Figma todavía no está conectado en este repo.** Cuando se conecte, hay que agregar
sus herramientas a `.claude/settings.json` para evitar un prompt de permiso por cada llamada.

| Sección | Herramientas |
|---|---|
| `allow` (lectura) | `get_metadata` · `get_screenshot` · `get_libraries` · `search_design_system` |
| `ask` (escritura) | `use_figma` · `create_new_file` · `generate_figma_design` |

El prefijo real depende del nombre con el que se registre el servidor
(`mcp__<servidor>__<herramienta>`). **Verificar el nombre exacto antes de escribir las reglas** —
una entrada con el prefijo equivocado no falla: simplemente nunca aplica.

🛑 **`use_figma` va en `ask`, no en `allow`.** Escribe sobre el archivo del cliente.
