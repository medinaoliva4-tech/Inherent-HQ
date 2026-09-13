# Método de Diseño — Inherent Global

8 capas, secuenciales. **Ninguna arranca sin el output de la anterior.**
Si falta el input mínimo de una capa: **BLOQUEADO**. No se improvisa el faltante.

```
TRADUCIR   D0  Sistema visual aplicado                      🚦 GATE 1
RESOLVER   D1  Lectura del lote
           D2  Brief de pieza
           D3  Composición y jerarquía
           D4  Capas gráficas                               🚦 GATE 2 (ruta visual)
CONSTRUIR  D5  Construcción en Figma
           D6  Adaptación por formato y canal
           D7  QA visual y entrega                          🚦 GATE 3
```

---

# D0 · Sistema visual aplicado

**Input:** guía de marca de Branding + librería de assets del cliente
**Output:** `sistema-visual.md` + archivo/página Figma `00 · Sistema`
**Gate:** 🚦 GATE 1 — humano aprueba el sistema antes de diseñar una sola pieza

Traducís la guía de marca (que es un documento de lectura) a un **sistema operable**: valores
concretos, nombrados, que se usan como tokens en Figma y como reglas en cada decisión posterior.

### D0.1 — Tokens
Color, tipografía, espaciado, radios, sombras, bordes. Ver `systems/DESIGN-TOKENS.md`.
Cada token: `nombre · valor · para qué sirve · cuándo NO usarlo`.

### D0.2 — Pares de contraste verificados
Matriz de cada combinación fondo/texto de la paleta, con su ratio **medido**.
Cada par sale ✅ (≥4.5:1), ⚠️ (3:1-4.5:1, solo texto grande) o 🛑 (no usar).
**Salida obligatoria:** el "par seguro por defecto" y el "par de emergencia sobre foto".

### D0.3 — Escala tipográfica
Máximo **4 tamaños** por formato (titular, subtítulo, cuerpo, micro). Nombrados, no ad-hoc.
Interlineado y tracking por tamaño. Ver `systems/TIPOGRAFIA.md`.

### D0.4 — Grillas por formato
Una grilla por cada formato activo del cliente: márgenes, columnas, gutter, safe areas.
Ver `systems/FORMATOS-Y-CANALES.md`.

### D0.5 — Inventario de elementos gráficos
Las 5 familias, con qué existe hoy y qué falta:
`ilustraciones · assets PNG recortados · texturas · pinceladas · formas gráficas`
Ver `systems/ELEMENTOS-GRAFICOS.md`.

### D0.6 — Activos distintivos
Qué hace reconocible a la marca al 10% de tamaño, sin leer el logo. Tomado del posicionamiento
(Strategy, Capa 4) si existe. Sin esto, el lote no tendrá familia.

### D0.7 — Biblioteca de layouts
3-6 layouts base que cubren el 80% de las piezas del cliente. Cada uno con su nombre, para qué
función sirve (Hero/Proof/Utility/Conversion) y en qué formatos existe.

🛑 **D0 no diseña piezas.** Termina en sistema. Si escribís "esta pieza debería…", te saliste del rol.

---

# D1 · Lectura del lote

**Input:** calendario creativo (Excel/CSV) + carpeta de contenido producido
**Output:** `lote-de-piezas.csv`

Convertís el calendario + el material en una **matriz de piezas** con estado de completitud por fila.

### Columnas mínimas
`id_pieza · fecha · canal · formato · dimensiones · funcion · pilar · temperatura · titular ·
copy_en_pieza · cta · asset_base · slides · layout · estado_diseno · traza_calendario · link_figma · export`

### Reglas de ingesta
1. **Mapear, no asumir.** Las columnas del Excel del cliente rara vez se llaman igual. Se declara el
   mapeo usado en una tabla antes de procesar.
2. **Una fila = una pieza entregable.** Un carrusel de 8 slides es **una** fila con `slides=8`, no ocho.
3. **Fila incompleta ≠ fila borrada.** Se conserva con `estado_diseno = BLOQUEADO` y el motivo exacto.

### Bloqueos por fila
| Falta | Resultado |
|---|---|
| Titular y copy | 🛑 `BLOQUEADO — sin contenido` |
| Canal o formato | 🛑 `BLOQUEADO — sin destino` |
| Asset base (foto) | 🟡 `PENDIENTE — resuelve tipográfica` (se puede avanzar) |
| CTA en pieza de función Conversion | 🛑 `BLOQUEADO — Conversion sin CTA` |
| Traza al calendario | 🟡 se marca; si no aparece, se consulta antes de diseñar |

### Salida de cabecera
```
LOTE — Cliente: [x] · Período: [x] · Piezas: [n] · Listas: [n] · Bloqueadas: [n]
Canales: [x] · Formatos: [x] · Assets faltantes: [n]
```

---

# D2 · Brief de pieza

**Input:** una fila del lote + sistema visual + asset base
**Output:** `briefs/<id_pieza>.md` (plantilla en `templates/brief-de-pieza.md`)

Antes de abrir Figma, cada pieza se decide por escrito. **Es corto a propósito** — media carilla.

### Los 7 campos del brief
| # | Campo | Qué decide |
|---|---|---|
| 1 | **Mensaje único** | La única cosa que esta pieza tiene que dejar. Una oración. |
| 2 | **Jerarquía 1-2-3** | Qué se lee primero, segundo, tercero. Exactamente tres. |
| 3 | **Layout base** | Cuál de los layouts de D0.7, y por qué ese |
| 4 | **Par de color** | Fondo/texto elegido de la matriz D0.2, con su ratio |
| 5 | **Escala tipográfica** | Qué tamaños de D0.3 entran en juego |
| 6 | **Presupuesto gráfico** | Qué familias de overlay (máx. 3) y con qué rol cada una |
| 7 | **Restricciones del canal** | Safe areas, límite de slides, densidad de texto si es pauta |

### Regla del mensaje único
Si el brief necesita dos oraciones para el mensaje, **son dos piezas**. Se marca y se consulta.

### Regla de jerarquía
Nivel 1 ocupa el peso visual dominante (tamaño, contraste o posición — al menos dos de los tres).
Nivel 3 nunca compite con nivel 1. Si no podés nombrar los tres, el layout está mal elegido.

---

# D3 · Composición y jerarquía

**Input:** brief + grilla del formato
**Output:** composición resuelta (todavía en gris — sin color final, sin overlays)

Se compone **en gris** a propósito: si la pieza no funciona en escala de grises, el color la está
salvando y el color no siempre está disponible (feeds oscuros, compresión, daltonismo).

### Las 6 decisiones de composición
| Decisión | Regla |
|---|---|
| **Grilla** | Todo se alinea a la grilla del formato. Los márgenes no se negocian |
| **Punto focal** | Uno. Tercios o centro óptico, nunca el centro geométrico por default |
| **Peso visual** | El nivel 1 pesa ≥2x el nivel 2 (tamaño × contraste × área) |
| **Aire** | Mínimo 8% del alto del formato en el borde con texto. El aire no es espacio desperdiciado |
| **Dirección de lectura** | Z o F según densidad. Se declara cuál |
| **Contención** | Nada toca el borde salvo que sea deliberado y consistente en todo el lote |

Detalle completo: `systems/COMPOSICION-Y-JERARQUIA.md`.

### Test obligatorio al cierre de D3
```
TEST MINIATURA — reducir al 10%. ¿Se entiende de qué se trata? → SÍ / NO
TEST GRIS — en escala de grises. ¿Sigue habiendo jerarquía? → SÍ / NO
```
Dos NO = volver a D2 y cambiar el layout. No se arregla en D4.

---

# D4 · Capas gráficas

**Input:** composición en gris aprobada
**Output:** pieza con color, overlays y textura + `ruta-visual.md` del lote
**Gate:** 🚦 GATE 2 — humano aprueba la **ruta visual** (1 pieza modelo por formato), no las 40 piezas

Recién acá entran los elementos gráficos. **Su rol es reforzar la jerarquía, nunca crearla.**

### Las 5 familias
| Familia | Qué es | Rol legítimo |
|---|---|---|
| **Ilustraciones** | Dibujos, trazos, iconos ilustrados, doodles | Señalar, humanizar, explicar un concepto abstracto |
| **Assets PNG** | Recortes sin fondo — stickers, sellos, productos | Dar objeto real, romper el plano, marcar prueba |
| **Texturas** | Papel, grano, polvo, tela | Dar materia y temperatura; unificar el lote |
| **Pinceladas / brochas** | Trazos pintados, manchas | Destacar palabra, marcar zona, dar gesto humano |
| **Formas gráficas** | Círculos, líneas, flechas, marcos | Dirigir la mirada, contener, agrupar, separar |

### Presupuesto (regla dura)
**Máximo 3 familias por pieza.** Cada una con **un rol declarado**. Si no podés nombrar el rol,
el elemento se saca.

### Orden de capas (de atrás hacia adelante)
```
1. Fondo / color base
2. Foto o asset base
3. Textura global (opacidad baja, sobre toda la pieza)
4. Scrim / bloque de contención de texto
5. Formas gráficas (contención y dirección)
6. Tipografía
7. Pinceladas de destaque (detrás o encima de una palabra puntual)
8. Assets PNG y stickers (encima de todo, rompiendo el plano)
9. Logo / firma
```

### Test obligatorio al cierre de D4
```
TEST DE SUSTRACCIÓN — sacar cada overlay de a uno. Si la pieza no empeora, ese overlay sobra.
```

Detalle completo: `systems/ELEMENTOS-GRAFICOS.md`.

---

# D5 · Construcción en Figma

**Input:** ruta visual aprobada
**Output:** archivo Figma con el lote construido, sobre el design system del cliente

### Estructura del archivo
```
00 · Sistema       tokens, escala tipográfica, matriz de contraste, componentes base
01 · Layouts       los 3-6 layouts base de D0.7, como COMPONENT SET con VARIANTS
02 · Lote [mes]    las piezas, agrupadas por formato
03 · Assets        ilustraciones, PNGs, texturas, brochas, formas
99 · Exports       frames marcados para export
```

### Reglas duras de construcción
1. **Componentes antes que copias.** Un layout se construye una vez como `COMPONENT SET` con
   `VARIANTS` por formato. Cada pieza es una `INSTANCE` con overrides de texto e imagen.
2. **Auto layout para todo lo que tiene relación estructural.** Texto apilado, bloques con gap,
   listas. Nunca posicionar con `x`/`y` absolutos lo que es una relación.
3. **Tokens, nunca literales.** Color por variable enlazada, spacing y radios por variable, tipo por
   `TEXT STYLE`, sombras por `EFFECT STYLE`.
4. **Nomenclatura fija.** `<id_pieza>__<canal>__<formato>` — ej: `P012__IG__story`.
5. **Se valida por sección, no al final.** Screenshot después de cada bloque construido.
6. **Todo ID creado se devuelve.** Para poder corregir sin reconstruir.

Workflow operativo completo con el MCP de Figma: `playbooks/FIGMA-PLAYBOOK.md`.

⚠️ **Si el MCP de Figma no está disponible:** D5 sale como **especificación construible**
(`briefs/` + tokens + layout + medidas exactas) marcada `BLOQUEADO — construcción manual pendiente`.
Nunca se declara una pieza "hecha" sin archivo.

---

# D6 · Adaptación por formato y canal

**Input:** pieza maestra construida
**Output:** la pieza recompuesta en cada formato/canal del lote

**Adaptar es recomponer, no escalar.** Cada formato tiene su grilla, su safe area y su jerarquía.

### Qué cambia al adaptar
| Cambia | No cambia |
|---|---|
| Grilla y márgenes | El mensaje único |
| Posición y tamaño relativo de los 3 niveles | La jerarquía 1-2-3 |
| Cantidad de texto en pieza (menos en story) | El par de color |
| Recorte de la foto (nuevo encuadre, no estiramiento) | Los activos distintivos |
| Qué overlays entran (menos en formatos chicos) | El sistema tipográfico |

### Reglas por formato
- **Story (9:16):** nada crítico en el safe area superior ni inferior. Menos texto que en feed.
  El CTA vive arriba del safe inferior o va como sticker nativo.
- **Carrusel:** ritmo obligatorio — `portada (gancho) → desarrollo → quiebre → cierre/CTA`.
  La portada carga sola el 80% del trabajo. Continuidad visual entre slides (un elemento que cruza).
- **Feed 4:5 vs 1:1:** el 4:5 ocupa más pantalla; se prioriza si el canal lo permite.
- **Pauta:** menor densidad de texto en imagen, CTA inequívoco, sin elementos que imiten UI nativa.

Specs y safe areas: `systems/FORMATOS-Y-CANALES.md`.

---

# D7 · QA visual y entrega

**Input:** lote completo adaptado
**Output:** exports + `entrega.md`
**Gate:** 🚦 GATE 3 — humano aprueba antes del handoff

### QA en 3 pasadas
```
PASADA 1 — Sistema   ¿usa tokens? ¿respeta grilla y escala? ¿el lote se lee como familia?
PASADA 2 — Pieza     ¿jerarquía 1-2-3? ¿contraste medido? ¿safe areas? ¿copy sin erratas?
PASADA 3 — Miniatura ¿se entiende al 10%? ¿en modo oscuro? ¿comprimida?
```
Checklist completo: `qa/QA-GATES.md`.

### Export
| Regla | Valor |
|---|---|
| Formato | PNG para piezas con texto y planos sólidos; JPG calidad alta para fotografía dominante |
| Escala | 1x sobre el frame en px reales del formato (no 2x sobre un frame a la mitad) |
| Perfil de color | sRGB |
| Nombre | `<cliente>_<AAAAMMDD>_<id_pieza>_<canal>_<formato>.<ext>` |
| Carrusel | Un archivo por slide, sufijo `_s01`, `_s02`… en orden de publicación |

### Bloque de handoff
```markdown
## HANDOFF — Diseño → Content / Media Buy
- Cliente: · Período: · Fecha:
- Piezas entregadas: [n] · Bloqueadas: [n] · Assets faltantes: [n]
- Gates aprobados: sistema [✅/⬜] · ruta visual [✅/⬜] · entrega [✅/⬜]
- Ruta de exports:
- Archivo Figma:
- Piezas marcadas para pauta: [ids]
- Piezas con asset generado `[asset generado]`: [ids]
- Deuda visual abierta: [qué falta resolver y por qué]
- Siguiente: Content (publicación) · Media Buy (pauta)
```

---

## Ciclo

```
D7 → qué piezas rindieron (Analytics) → actualizar layouts de D0.7 y ruta visual → próximo lote
```

El sistema visual (D0) se revisa **cada 3 lotes** o cuando Branding actualiza la guía.
