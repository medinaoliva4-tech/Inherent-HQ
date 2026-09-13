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
| 1 | `sistema-visual.md` | D0 | `ds-sistema-visual` | 🚦 GATE 1 | D1-D7 · Branding · Production |
| 2 | `lote-de-piezas.csv` | D1 | `ds-brief-de-pieza` | — | D2-D7 · Content |
| 3 | `briefs/<id_pieza>.md` | D2 | `ds-brief-de-pieza` | — | D3-D6 |
| 4 | `ruta-visual.md` | D3-D4 | `ds-composicion` + `ds-elementos-graficos` | 🚦 GATE 2 | D5-D7 · Creative |
| 5 | Archivo Figma | D5-D6 | `ds-figma` + `ds-adaptacion` | — | D7 · Production · Content |
| 6 | `entrega.md` + `/exports` | D7 | `ds-qa-visual` | 🚦 GATE 3 | Content · Media Buy |

---

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
| **Biblioteca de layouts** | 3-6 layouts base con nombre, función y formatos disponibles |
| **Huecos** | Lista de `⚠️ FUERA DE GUÍA` con qué falta y a quién pedírselo |

**Restricción:** traduce, no inventa. Todo lo que no está en la guía sale como **propuesta**.

---

## 2 · `lote-de-piezas.csv` — D1

| Sub-output | Qué es |
|---|---|
| **Mapeo de columnas** | Cómo se leyó el Excel del cliente (declarado, no asumido) |
| **Matriz de piezas** | Una fila por pieza entregable, 18 columnas |
| **Cabecera del lote** | Piezas / listas / bloqueadas / assets faltantes |
| **Lista de bloqueos** | Por fila, con el motivo exacto y qué lo desbloquea |

**Restricción:** una fila incompleta **se conserva bloqueada**, nunca se borra.

---

## 3 · `briefs/<id_pieza>.md` — D2

Los 7 campos: `mensaje único · jerarquía 1-2-3 · layout base · par de color · escala tipográfica ·
presupuesto gráfico · restricciones del canal`.

**Restricción:** media carilla. Si crece, la pieza está mal definida.

---

## 4 · `ruta-visual.md` — D3-D4

| Sub-output | Qué es |
|---|---|
| **Pieza modelo por formato** | 1 por cada formato activo del lote |
| **Resultado de los 3 tests** | Miniatura · gris · sustracción, con SÍ/NO por pieza |
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
| **Resultado del QA** | Las 3 pasadas, ítem por ítem |
| **Índice de exports** | Archivo · pieza · canal · formato · fecha de publicación prevista |
| **Piezas marcadas para pauta** | Con la nota de densidad de texto verificada |
| **Assets generados** | Los que llevan `[asset generado]`, listados aparte |
| **Deuda visual** | Qué quedó sin resolver y por qué |
| **Bloque de HANDOFF** | El bloque completo de `METHOD.md` D7 |

---

# B · Outputs de sesión

| Output | Cuándo |
|---|---|
| **Pre-flight** | Siempre, primero |
| **Cabecera del lote** | Al cerrar D1 |
| **Tabla de bloqueos** | Cuando hay filas bloqueadas |
| **Propuesta de gate** | Antes de cada 🚦 |
| **Resumen de QA** | Al cerrar D7 |

---

# C · Outputs externos — solo con gate

| Destino | Qué | Gate |
|---|---|---|
| **Figma** | Archivo del cliente, páginas y frames | Escritura sobre archivo existente: ✅ confirmación previa |
| **Drive** | Exports subidos a la carpeta del cliente | ✅ confirmación previa |
| **Notion / Inherent OS** | Registro del lote entregado | ✅ confirmación previa |

🛑 **Nunca:** publicar, programar, subir a Ads Manager, sobrescribir un archivo aprobado, borrar
assets del cliente.
