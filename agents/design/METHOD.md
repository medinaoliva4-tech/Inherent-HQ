# Método de Diseño — Inherent Global

8 capas, secuenciales. **Ninguna arranca sin el output de la anterior.**
Si falta el input mínimo de una capa: **BLOQUEADO**. No se improvisa el faltante.

```
TRADUCIR     D0  Sistema visual aplicado                      🚦 GATE 1
INTERPRETAR  D1  Lectura del lote creativo
             D2  Lectura del brief de pieza
RESOLVER     D3  Composición y craft
             D4  Capas gráficas                               🚦 GATE 2 (ruta visual)
CONSTRUIR    D5  Construcción en Figma con Figwright
             D6  Adaptación por formato y canal
             D7  QA visual y entrega                          🚦 GATE 3
```

---

# D0 · Sistema visual aplicado

**Input:** guía de marca de Branding + librería de assets del cliente
**Output:** `sistema-visual.md` + página Figma `00 · Sistema`
**Gate:** 🚦 GATE 1 — humano aprueba el sistema antes de diseñar una sola pieza

Traducís la guía de marca (documento de lectura) a un **sistema operable**: valores concretos,
nombrados, que se usan como tokens en Figma y como reglas en cada decisión posterior.

> **Primero alimentás el contexto, después diseñás.** El sistema se construye y se lee **antes** de
> abrir una pieza. Nunca se arranca por "hagamos algo lindo".

### D0.1 — Tokens
Color, tipografía, espaciado, radios, sombras, bordes. Ver `systems/DESIGN-TOKENS.md`.
Cada token: `nombre · valor · origen · para qué sirve · 🛑 cuándo NO usarlo`.

### D0.2 — Pares de contraste verificados
Matriz de cada combinación fondo/texto de la paleta, con su ratio **medido**.
Cada par sale ✅ (≥4.5:1), ⚠️ (3:1-4.5:1, solo texto grande) o 🛑 (no usar).
**Salida obligatoria:** el "par seguro por defecto" y el "par de emergencia sobre foto".

### D0.3 — Escala tipográfica
Máximo **4 tamaños** por formato (titular, subtítulo, cuerpo, micro). Interlineado y tracking por
tamaño. Máximo **2 familias**. Verificar `ñ`, tildes y signos antes de adoptar una familia.
Ver `systems/TIPOGRAFIA.md`.

### D0.4 — Grillas por formato
Una grilla por cada formato activo: márgenes, columnas, gutter, safe areas.
Ver `systems/FORMATOS-Y-CANALES.md`.

### D0.5 — Inventario de elementos gráficos
Las 5 familias, con qué existe hoy y qué falta:
`ilustraciones · assets PNG recortados · texturas · pinceladas · formas gráficas`
Ver `systems/ELEMENTOS-GRAFICOS.md`.

### D0.6 — Activos distintivos
Qué hace reconocible a la marca al 10% de tamaño, sin leer el logo. Del `posicionamiento.md` de
Strategy (Capa 4) si existe. Sin esto, el lote no tendrá familia.

### D0.7 — Biblioteca de componentes de pieza
**No son componentes de UI. Son piezas gráficas reutilizables de social.** 3-8 que cubran el 80% del
trabajo del cliente: portada de carrusel, slide interna, bloque de cita, etiqueta "Nuevo"/"Tip",
marco de testimonio, bloque de precio, CTA de cierre, sticker de marca.

**Cada componente lleva su ficha legible para IA** — ver `brain/COMPONENTES-SOCIAL.md`:
```
Cuándo usarlo · Qué variantes tiene · Qué contenido acepta · Qué reglas sigue · 🛑 Cuándo NO usarlo
```
Sin la ficha, el agente adivina el diseño. Con la ficha, lo ejecuta.

🛑 **D0 no diseña piezas.** Termina en sistema. Si escribís "esta pieza debería…", te saliste del rol.

---

# D1 · Lectura del lote creativo

**Input:** calendario creativo de Creative (Excel/CSV) + carpeta de contenido producido
**Output:** `lote-de-piezas.csv`

**No armás el lote: lo leés y lo validás.** El calendario creativo es el plan de ejecución que
produce Creative a partir de su research. Tu trabajo acá es convertirlo en una matriz con estado de
ejecutabilidad por fila, y **devolver lo que no es ejecutable**.

### Columnas mínimas
`id_pieza · fecha · canal · formato · dimensiones · goal · pilar · temperatura · nivel_1 · nivel_2 ·
nivel_3 · cta · asset_base · slides · componente · estado_diseno · traza_calendario · link_figma · export`

`nivel_1 / nivel_2 / nivel_3` **vienen de Creative** — es el "texto en jerarquía" del plan de
ejecución. Diseño no los reordena.

### Reglas de ingesta
1. **Mapear, no asumir.** Las columnas del Excel del cliente rara vez se llaman igual. Se declara el
   mapeo usado en una tabla antes de procesar.
2. **Una fila = una pieza entregable.** Un carrusel de 8 slides es **una** fila con `slides=8`.
3. **Fila incompleta ≠ fila borrada.** Se conserva con `estado_diseno = BLOQUEADO` y el motivo exacto.

### Bloqueos por fila — el contrato con Creative
| Falta | Resultado |
|---|---|
| Canal o formato | 🛑 `BLOQUEADO — sin destino` |
| Goal del arte final | 🛑 `BLOQUEADO — sin goal` |
| Texto en jerarquía (nivel 1 como mínimo) | 🛑 `BLOQUEADO — sin jerarquía de mensaje` |
| CTA en pieza de goal `vender` / `conversión` | 🛑 `BLOQUEADO — conversión sin CTA` |
| Asset base (foto) | 🟡 `PENDIENTE — resuelve tipográfica` (se puede avanzar) |
| Traza al calendario | 🟡 se marca; si no aparece, se consulta |

🛑 **Nunca completes un campo bloqueante por inferencia.** Se devuelve a Creative con la pregunta.

### Salida de cabecera
```
LOTE — Cliente: [x] · Período: [x] · Piezas: [n] · Ejecutables: [n] · Bloqueadas: [n]
Canales: [x] · Formatos: [x] · Assets faltantes: [n] · Devoluciones a Creative: [n]
```

🛑 Si más del 30% de las filas está bloqueado: **parar** y devolver el lote a Creative.

---

# D2 · Lectura del brief de pieza

**Input:** una fila del lote + sistema visual + asset base
**Output:** `briefs/<id_pieza>.md` (plantilla en `templates/brief-de-pieza.md`)

Antes de abrir Figma, cada pieza se decide por escrito. **Media carilla.**
Los campos 1-3 **se leen del brief creativo**. Los campos 4-8 **los resuelve Diseño**.

### Los 8 campos
| # | Campo | Quién decide |
|---|---|---|
| 1 | **Goal de la pieza** | Creative |
| 2 | **Mensaje único** — una oración | Creative |
| 3 | **Jerarquía del mensaje 1-2-3** | Creative |
| 4 | **Componente / layout base** — de la biblioteca D0.7, y por qué | Diseño |
| 5 | **Cómo se logra visualmente la jerarquía** — tamaño, contraste, área, posición | Diseño |
| 6 | **Par de color** — de la matriz D0.2, con ratio medido | Diseño |
| 7 | **Presupuesto gráfico** — máx. 3 familias, cada una con rol | Diseño |
| 8 | **Restricciones del canal** — safe areas, slides, densidad si es pauta | Diseño |

### Regla del mensaje único
Si el brief creativo trae dos ideas en una pieza, **son dos piezas**. Se marca y se devuelve.

### Regla de jerarquía visual
Un elemento pesa por **tamaño × contraste × área × posición**. El nivel 1 tiene que ganar en
**al menos dos** de los cuatro. Ganar solo en tamaño no alcanza.

### Si el brief creativo no es ejecutable
| Situación | Qué hacés |
|---|---|
| El nivel 1 tiene 14 palabras y el formato es story | Proponés el corte a ≤8 y **preguntás** |
| La foto sugerida no existe o no llega al piso de calidad | `⚠️ ASSET INSUFICIENTE` → Production |
| El goal pide CTA y no hay CTA | 🛑 devolución a Creative |
| La idea no cabe en el formato asignado | Proponés otro formato **con el motivo**, no lo cambiás solo |

---

# D3 · Composición y craft

**Input:** brief + grilla del formato
**Output:** composición resuelta (todavía en gris — sin color final, sin overlays)

**Creative dijo qué se lee primero. Acá lo hacés cierto.**

Se compone **en gris** a propósito: si la pieza no funciona en escala de grises, el color la está
salvando — y el color no siempre está disponible (feeds oscuros, compresión, daltonismo).

### Las 6 decisiones de composición
| Decisión | Regla |
|---|---|
| **Grilla** | Todo se alinea. Los márgenes no se negocian pieza por pieza |
| **Punto focal** | Uno. Tercios o centro óptico, nunca el centro geométrico por default |
| **Peso visual** | El nivel 1 pesa ≥2x el nivel 2 (tamaño × contraste × área × posición) |
| **Aire** | Mínimo 8% del alto del formato en el borde con texto. El aire no es espacio desperdiciado |
| **Dirección de lectura** | Z o F según densidad. **Se declara** cuál |
| **Contención** | Nada toca el borde salvo decisión del sistema, consistente en todo el lote |

Detalle completo: `systems/COMPOSICION-Y-JERARQUIA.md`. Criterio: `brain/CRITERIO-VISUAL.md`.

### Las 3 preguntas de craft (reemplazan a "¿se ve bien?")
```
¿A dónde va la atención primero?
¿Qué se nota en segundo lugar?
¿Qué se pierde completamente?
```
Si la respuesta a la primera no es el nivel 1 de Creative, la composición está mal.

### Tests obligatorios al cierre de D3
```
TEST MINIATURA — reducir al 10%. ¿Se entiende de qué se trata? → SÍ / NO
TEST GRIS      — en escala de grises. ¿Sigue habiendo jerarquía? → SÍ / NO
TEST ATENCIÓN  — ¿lo primero que se ve es el nivel 1 del brief?  → SÍ / NO
```
Un NO = volver a D2 y cambiar el componente/layout. **No se arregla en D4.**

---

# D4 · Capas gráficas

**Input:** composición en gris aprobada
**Output:** pieza con color, overlays y textura + `ruta-visual.md` del lote
**Gate:** 🚦 GATE 2 — humano aprueba la **ruta visual** (1 pieza modelo por formato + la secuencia
del feed), no las 40 piezas

Recién acá entran los elementos gráficos. **Su rol es reforzar la jerarquía, nunca crearla.**

### Las 5 familias
| Familia | Qué es | Rol legítimo |
|---|---|---|
| **Ilustraciones** | Dibujos, trazos, iconos ilustrados, doodles | Señalar, humanizar, explicar lo abstracto |
| **Assets PNG** | Recortes sin fondo — stickers, sellos, productos | Dar objeto real, romper el plano, marcar prueba |
| **Texturas** | Papel, grano, polvo, tela | Dar materia y temperatura; unificar el lote |
| **Pinceladas / brochas** | Trazos pintados, manchas | Destacar palabra, marcar zona, dar gesto humano |
| **Formas gráficas** | Círculos, líneas, flechas, marcos | Dirigir, contener, agrupar, separar |

### Presupuesto (regla dura)
**Máximo 3 familias por pieza.** Cada una con **un rol declarado**. Si no podés nombrar el rol,
el elemento se saca. El presupuesto es **del lote**, no de la pieza.

### Orden de capas (de atrás hacia adelante)
```
1. Fondo / color base
2. Foto o asset base
3. Textura global (5-20% de opacidad, sobre toda la pieza)
4. Scrim / bloque de contención de texto
5. Formas gráficas (contención y dirección)
6. Tipografía
7. Pinceladas de destaque (detrás o encima de una palabra puntual)
8. Assets PNG y stickers (encima de todo, rompiendo el plano)
9. Logo / firma
```

### Tests obligatorios al cierre de D4
```
TEST DE SUSTRACCIÓN — sacar cada overlay de a uno. Si la pieza no empeora, ese overlay sobra.
TEST ANTI-SLOP      — brain/CRITERIO-VISUAL.md. ¿Podés explicar por qué existe cada elemento?
TEST DE SECUENCIA   — brain/FEED-Y-GRILLA.md. ¿Las piezas del lote se ven distintas entre sí?
```

Detalle completo: `systems/ELEMENTOS-GRAFICOS.md`.

---

# D5 · Construcción en Figma con Figwright

**Input:** ruta visual aprobada
**Output:** archivo Figma con el lote construido, sobre el sistema del cliente

**Herramienta: Figwright** — el MCP no oficial de Figma que usa Inherent. No es el MCP oficial ni
Dev Mode. Corre local, se conecta a un plugin en Figma desktop, y **escribe sobre el archivo que el
usuario tenga abierto** — no hay fetch por URL.

Workflow operativo completo: **`playbooks/FIGWRIGHT-PLAYBOOK.md`**.

### Estructura del archivo
```
00 · Sistema       tokens, escala tipográfica, matriz de contraste, scrims
01 · Componentes   los componentes de pieza de D0.7, con VARIANTS por formato
02 · Lote [mes]    las piezas, agrupadas por formato
03 · Assets        ilustraciones, PNGs, texturas, brochas, formas
99 · Exports       frames marcados para export
```

### Las 6 reglas duras de construcción
1. **Entender el entorno, después construir.** `get_variable_defs` + `scan_components` +
   `get_styles` + `get_fonts` **antes** de crear nada. Un diseño que se ve raro casi siempre viene de
   **valores inventados**.
2. **Reusar gana a regenerar.** `create_instance` de un componente existente antes que dibujarlo.
3. **Tokens, nunca literales.** Color con `bind_variable_to_paint`, escalares con
   `bind_variable_to_node`, estilos compartidos con `apply_style_to_node`.
4. **Auto layout para lo que tiene relación estructural.** `x`/`y` absolutos solo para colocar el
   frame de la pieza en el canvas.
5. **Un bloque por paso, y screenshot.** `get_screenshot` después de cada bloque construido.
6. **Fuente real, no Inter.** Todo `TEXT` nuevo nace en Inter. `set_text_properties` siempre.

### Nomenclatura
`<id_pieza>__<canal>__<formato>` → `P012__IG__story` · carrusel: `__s01`, `__s02`…

⚠️ **Si Figwright no está conectado:** D5 sale como **especificación construible**
(`briefs/` + tokens + componente + medidas exactas + orden de capas) marcada
`BLOQUEADO — construcción manual pendiente`. **Nunca se declara una pieza "hecha" sin archivo.**

---

# D6 · Adaptación por formato y canal

**Input:** pieza maestra construida
**Output:** la pieza recompuesta en cada formato/canal del lote

**Adaptar es recomponer, no escalar.**

### Qué cambia al adaptar
| Cambia | No cambia |
|---|---|
| Grilla y márgenes | El goal y el mensaje único |
| Posición y tamaño relativo de los 3 niveles | La jerarquía 1-2-3 que definió Creative |
| Cantidad de texto en pieza (menos en story) | El par de color |
| Recorte de la foto (nuevo encuadre, no estiramiento) | Los activos distintivos |
| Qué overlays entran (menos en formatos chicos) | El sistema tipográfico |

### Reglas por formato
- **Story (9:16):** nada crítico en el safe area superior ni inferior. Menos texto que en feed.
  El CTA vive arriba del safe inferior o va como sticker nativo.
- **Carrusel:** ritmo obligatorio — `portada (hook) → desarrollo → quiebre → cierre/CTA`.
  La portada carga sola el 80%. Continuidad visual entre slides.
- **Carrusel seamless:** técnica de lienzo largo — ver `FORMATOS-Y-CANALES.md`.
- **Feed 4:5 vs 1:1:** el 4:5 ocupa más pantalla; se prioriza si el canal lo permite.
- **Pauta:** menor densidad de texto, CTA inequívoco, nada que imite UI nativa.

Specs y safe areas: `systems/FORMATOS-Y-CANALES.md`.

---

# D7 · QA visual y entrega

**Input:** lote completo adaptado
**Output:** exports + `entrega.md`
**Gate:** 🚦 GATE 3 — humano aprueba antes del handoff

### QA en 4 pasadas
```
PASADA 1 — Sistema    ¿usa tokens? ¿respeta grilla y escala? ¿el lote se lee como familia?
PASADA 2 — Pieza      ¿jerarquía del brief respetada? ¿contraste medido? ¿safe areas? ¿copy exacto?
PASADA 3 — Miniatura  ¿se entiende al 10%? ¿en modo oscuro? ¿comprimida?
PASADA 4 — Secuencia  ¿cómo se ve el lote en orden de publicación? ¿hay ritmo visual?
```
Checklist completo: `qa/QA-GATES.md`.

### Export — con Figwright

```
save_screenshots({ nodeIds: [...], outDir: "clients/<cliente>/exports", format: "PNG", scale: 1 })
```

| Regla | Valor |
|---|---|
| Formato | **PNG** para piezas con texto y planos sólidos · **JPG** con fotografía dominante |
| Escala | `scale: 1` sobre el frame en px reales del formato (no 2x sobre un frame a la mitad) |
| Perfil de color | **sRGB** — el diseño de social es digital, nunca CMYK |
| Fondo | Siempre opaco. 🛑 Nunca transparente |
| Nombre | `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>` |
| Carrusel | Un archivo por slide, sufijo `_s01`, `_s02`… en orden de publicación |

🛑 **`save_screenshots` nombra los archivos por node id.** El renombrado al esquema de Inherent es un
**paso obligatorio** después de exportar — si no, Content recibe `1234-5678.png`.

### Los dos flags que hay que leer en la respuesta

| Flag | Qué significa | Qué hacés |
|---|---|---|
| `recovered: true` | El nodo estaba clipeado o fuera del canvas y se recuperó en sus bounds reales | ✅ Normal en los recortes de un **carrusel seamless**. Verificá el PNG igual |
| `empty: true` | El nodo **no renderiza nada** — oculto, sin contenido, o fuera de lugar | 🛑 No es un export válido. Volvé a D5 y arreglá el nodo |

### Otras tools de salida
| Tool | Para qué | 🛑 |
|---|---|---|
| `save_image_fills` | Sacar la **foto original** de una pieza, sin máscara ni recorte | No sirve para exportar la pieza |
| `export_pdf` | Vector, una página por nodo | **No se usa en social** |

### Entrega a Drive

Una vez aprobado el 🚦 GATE 3:
```
1. save_screenshots → exports en disco de la máquina local
2. Renombrar al esquema de Inherent
3. Subir a la carpeta del cliente en Drive  (mcp__Google_Drive__create_file)
4. Registrar la ruta y el link en entrega.md
```
🛑 **Subir a Drive requiere confirmación explícita** — está en `ask` a propósito. Y se sube
**después** del gate, nunca antes.

### Bloque de handoff
```markdown
## HANDOFF — Diseño → Content / Media Buy
- Cliente: · Período: · Fecha:
- Piezas entregadas: [n] · Bloqueadas: [n] · Devueltas a Creative: [n] · Assets faltantes: [n]
- Gates aprobados: sistema [✅/⬜] · ruta visual [✅/⬜] · entrega [✅/⬜]
- Ruta de exports: · Carpeta de Drive: · Archivo Figma:
- Piezas marcadas para pauta: [ids]
- Piezas candidatas a motion (VisuHaus): [ids]
- Piezas con asset generado `[asset generado]`: [ids]
- Deuda visual abierta:
- Siguiente: Content (publicación) · Media Buy (pauta) · Production (motion)
```

---

## Ciclo

```
D7 → qué piezas rindieron (Analytics) → actualizar la biblioteca de componentes (D0.7) → próximo lote
```

El sistema visual (D0) se revisa **cada 3 lotes** o cuando Branding actualiza la guía.
