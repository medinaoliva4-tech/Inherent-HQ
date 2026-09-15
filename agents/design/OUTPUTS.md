# Mapa de Outputs — Agente de Diseño

Todo lo que el agente produce, dónde vive y quién lo consume.
**Si algo no está en este mapa, el agente no lo produce.**

---

## Resumen

| Tipo | Cantidad | Dónde vive |
|---|---|---|
| **A · Entregables de archivo** | 6 | `clients/<cliente>/` |
| **B · Outputs de sesión** | 5 | En la conversación (Buzz) |
| **C · Outputs externos** | 3 | Figma · Drive · Notion — solo con gate |

---

# A · Entregables de archivo

| # | Archivo | Capa | Skill | Gate | Lo consume |
|---|---|---|---|---|---|
| 0 | `guia-aplicable.md` *(Modo B)* | D0 | `ds-sistema-visual` | 🚦 GATE 1 reforzado | **Diseño · Production · Content** |
| 1 | `sistema-visual.md` | D0 | `ds-sistema-visual` | 🚦 GATE 1 | D1-D7 · Branding · Production |
| 2 | `lote-de-piezas.csv` | D1 | `ds-brief-de-pieza` | — | D2-D7 · Content |
| 3 | `briefs/<id_pieza>.md` | D2 | `ds-brief-de-pieza` | — | D3-D6 |
| 4 | `ruta-visual.md` | D3-D4 | `ds-composicion` + `ds-elementos-graficos` | 🚦 GATE 2 | D5-D7 · Creative |
| 5 | Archivo Figma (Figwright) | D5-D6 | `ds-figma` + `ds-adaptacion` | — | D7 · Production · Content |
| 6 | `entrega.md` + `/exports` | D7 | `ds-qa-visual` | 🚦 GATE 3 | Content · Media Buy |

---

## 0 · `guia-aplicable.md` — D0, solo Modo B

> Se produce cuando Branding entregó **intel** y no un manual formal.

| Sub-output | Qué es |
|---|---|
| **El intel recibido** | Trazabilidad: qué dijo Branding, palabra por palabra |
| **Dirección** | Cómo debe verse · cómo debe sentirse · **qué NO es** |
| **Referencias** | Qué se toma de cada una y qué **no** |
| **Color** | Roles con su porqué + chequeo de "¿nos vemos igual que la categoría?" |
| **Tipografía** | Familias con rol + verificación de `ñ`, pesos y licencia |
| **Tratamiento fotográfico** | → **Production**: luz, encuadre, paleta, post |
| **Lenguaje gráfico** | → **Diseño**: qué familias aplican y con qué carácter |
| **Voz visual** | → **Content**: densidad, tono del CTA, palabras que sí y que no |
| **Activos distintivos** | Qué reconoce la marca al 10% sin logo |
| **Uso del logo** | Versiones, mínimo, resguardo, y dónde **no** va |
| **Qué decidió Diseño** | 🚦 Lo que no venía en el intel, con su porqué y qué lo invalidaría |
| **Aplicación por departamento** | Qué sección toma cada uno |

**Restricción:** todo sale como **propuesta** hasta el gate. Nada que no se rastree al intel puede
faltar en "Qué decidió Diseño".

## 1 · `sistema-visual.md` — D0

| Sub-output | Qué es |
|---|---|
| **Tokens de color** | Nombre · valor · uso · cuándo NO usarlo |
| **Matriz de contraste** | Cada par fondo/texto con ratio **medido** + ✅/⚠️/🛑 |
| **Par seguro por defecto** | El par que se usa cuando no hay una razón para otro |
| **Par de emergencia sobre foto** | Qué se usa cuando el fondo es fotográfico e impredecible |
| **Escala tipográfica** | Máx. 4 tamaños por formato, con interlineado y tracking |
| **Grillas por formato** | Márgenes, columnas, gutter y safe areas de cada formato activo |
| **Inventario de elementos gráficos** | Las 5 familias: qué existe, qué falta, qué se propone |
| **Activos distintivos** | Qué hace reconocible la marca al 10%, sin logo |
| **Componentes de pieza** | 3-8 componentes de social, cada uno con su **ficha**: cuándo usarlo · variantes · qué acepta · reglas · 🛑 cuándo NO |
| **Huecos** | Lista de `⚠️ FUERA DE GUÍA` con qué falta y a quién pedírselo |

**Restricción:** traduce, no inventa. Todo lo que no está en la guía sale como **propuesta**.

---

## 2 · `lote-de-piezas.csv` — D1

| Sub-output | Qué es |
|---|---|
| **Mapeo de columnas** | Cómo se leyó el Excel de Creative (declarado, no asumido) |
| **Matriz de piezas** | Una fila por pieza entregable, 21 columnas |
| **Cabecera del lote** | Piezas / ejecutables / bloqueadas / devoluciones a Creative |
| **Lista de bloqueos** | Por fila, con el motivo exacto y qué lo desbloquea |
| **Devoluciones a Creative** | Qué campo del contrato falta, por pieza |

**Restricción:** una fila incompleta **se conserva bloqueada**, nunca se borra.
🛑 **Ningún campo bloqueante se completa por inferencia.**

---

## 3 · `briefs/<id_pieza>.md` — D2

Los 8 campos:
`goal · mensaje único · jerarquía del mensaje` **(de Creative)** ·
`componente base · cómo se logra la jerarquía visual · par de color · presupuesto gráfico ·
restricciones del canal` **(de Diseño)**.

**Restricción:** media carilla. Si crece, la pieza está mal definida.
🛑 Diseño no reordena los niveles del brief: propone y pregunta (`⚠️ OBSERVADO`).

---

## 4 · `ruta-visual.md` — D3-D4

| Sub-output | Qué es |
|---|---|
| **Pieza modelo por formato** | 1 por cada formato activo del lote |
| **Secuencia del feed** | El lote en orden de publicación, con las 5 variables de ritmo |
| **Resultado de los tests** | Miniatura · gris · atención · sustracción · anti-slop · secuencia |
| **Reglas del lote** | Qué se repite en todas las piezas para que se lean como familia |
| **Presupuesto gráfico del lote** | Qué familias de overlay se usan y con qué rol |
| **Decisiones y descartes** | Qué layout se eligió y por qué se descartaron los otros |

---

## 5 · Archivo Figma — D5-D6

```
00 · Sistema · 01 · Layouts · 02 · Lote [mes] · 03 · Assets · 99 · Exports
```
Nomenclatura de frames: `<id_pieza>__<canal>__<formato>`.

---

## 6 · `entrega.md` + `/exports` — D7

| Sub-output | Qué es |
|---|---|
| **Resultado del QA** | Las 4 pasadas, ítem por ítem |
| **Índice de exports** | Archivo · pieza · canal · formato · fecha de publicación prevista |
| **Piezas marcadas para pauta** | Con la nota de densidad de texto verificada |
| **Piezas con elemento animado** | Con su formato de entrega (MP4 en vez de PNG) |
| **Piezas candidatas a motion** | Con capas separadas y nombradas, para Production |
| **Devoluciones a Creative** | Qué faltaba o qué se observó, y su estado |
| **Assets generados** | Los que llevan `[asset generado]`, listados aparte |
| **Deuda visual** | Qué quedó sin resolver y por qué |
| **Bloque de HANDOFF** | El bloque completo de `METHOD.md` D7 |

---

# B · Outputs de sesión

| Output | Cuándo |
|---|---|
| **Pre-flight** | Siempre, primero |
| **Cabecera del lote** | Al cerrar D1 |
| **Tabla de bloqueos y devoluciones** | Cuando hay filas bloqueadas o brief no ejecutable |
| **Propuesta de gate** | Antes de cada 🚦 |
| **Resumen de QA** | Al cerrar D7 |

---

# C · Outputs externos — solo con gate

| Destino | Qué | Gate |
|---|---|---|
| **Figma (Figwright)** | Archivo del cliente, páginas y frames | Escritura sobre el archivo real: ✅ confirmación previa + `use_file` reclamado |
| **Drive** | Exports subidos a la carpeta del cliente | ✅ confirmación previa |
| **Notion / Inherent OS** | Registro del lote entregado | ✅ confirmación previa |

🛑 **Nunca:** publicar, programar, subir a Ads Manager, sobrescribir un archivo aprobado, borrar
assets del cliente.
