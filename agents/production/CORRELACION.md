# ⓪ Lo que llega de afuera — el contrato de entrada

**Producción no inventa nada.** Todo lo que produce es o bien heredado del Excel creativo, o bien
logística derivada de él. Esta es la tabla que impide la duplicación: **cada campo se cita, no se
recalcula.**

> 📍 **Este es el único lugar del repo donde viven las rutas de entrada de Producción.**

## ⓪.1 · De dónde sale cada ruta

| Departamento | Ruta | Nota |
|---|---|---|
| **④ Creatividad** | `agents/creative/clients/<c>/ideas-de-contenido.csv` | Estable — Creatividad ya existe en el repo |
| **②B Branding** | `_INPUTS/` del cliente | → `agents/branding/clients/<c>/` cuando exista |
| **③ Marketing** | `agents/strategy/clients/<c>/calendario-estrategico.csv` + plan de campañas | → `agents/marketing/clients/<c>/` cuando exista |
| **① Comprensión** | `agents/strategy/clients/<c>/nucleo.md` §C/D | → `agents/comprension/clients/<c>/` cuando exista |

## ⓪.2 · Campo por campo

| Campo que Producción usa | De quién | Qué hace Producción con él |
|---|---|---|
| **`id`** (fila creativa) | ④ Creatividad | Se copia a `id_creativo`. **Es la traza.** Sin él la escena no existe |
| **`campana`** | ④ Creatividad | Se hereda tal cual. Agrupa el presupuesto por campaña |
| **`escenas`** | ④ Creatividad | Se **parte**: una fila de producción por escena. La acción se copia literal |
| **`encuadres`** | ④ Creatividad | Se hereda tal cual. Define qué cámara, óptica y soporte hacen falta |
| **`duraciones`** | ④ Creatividad | Se hereda tal cual. Alimenta la estimación de tiempo de rodaje |
| **`estetica_mood`** | ④ Creatividad | Define la **luz** y la dirección de arte. No se reinterpreta |
| **`emocion`** | ④ Creatividad | Define la **dirección de actor**. Es lo que se le dice al talento en set |
| **`concepto`** | ④ Creatividad | Contexto: para qué existe la escena. Sirve para proponer alternativas coherentes |
| **`formato`** · **`canal`** | ④ Creatividad | Definen relación de aspecto, resolución y safe zones del rodaje |
| **`elementos_graficos`** | ④ Creatividad | **Solo se lee** para dejar el espacio en cuadro. No se crean acá |
| **`handoff`** | ④ Creatividad | Filtro de entrada: solo `produccion-video` y `produccion-foto` |
| **Guidelines y dirección visual** | ②B Branding | Guardrail de luz, color y arte. **No se define acá** |
| **Banco de assets** | ②B Branding | Cruce de reutilización: lo que ya existe no se vuelve a grabar |
| **Fechas de campaña y de preparación** | ③ Marketing | Techo de calendario. Definen cuántos días de rodaje hay |
| **Presupuesto disponible** | ① Comprensión | Techo de costo |
| **Capacidad de producción** | ① Comprensión | Techo de volumen. **Producción la corrige con dato real en Capa 7** |
| **Restricciones reales** | ① Comprensión | Equipo propio, permisos, legales, velocidad de aprobación |

> **Regla dura:** ninguno de estos campos se reescribe con otras palabras dentro de Producción. Se
> **cita** con su ruta. Y ninguno se **cambia**: si algo no se puede producir como está, se devuelve.

---

# ① `brief-de-produccion.md`

**Consume:** ④ + ②B + ③ + ①. **No consume ningún entregable de Producción.**

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| **A · Contexto cargado** | Existencia de cada archivo | Verificación, no producción. Falta uno → BLOQUEADO |
| **B · Filas a producir** | `ideas-de-contenido.csv` filtrado por `handoff` | Se filtra y se agrupa por `campana`. **Sin editar** |
| **C · Producibilidad** | `escenas` + `encuadres` + `duraciones` + `estetica_mood` + `emocion` | Chequeo de integridad. Falla → ↩️ DEVUELTO |
| **D · Reutilización** | Banco de assets de ②B vs. escenas pedidas | Marca `reutiliza` — esas escenas **no entran al desglose** |
| **E · Techos** | Presupuesto (①) + fechas (③) + capacidad (①) | Se cuantifican los tres, en números |
| **F · Devoluciones** | C + E | Lista de `id_creativo` con motivo y alternativa |

---

# ② `desglose.md`

**Consume:** ①. **Produce las filas base del Excel.**

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| `id` | Operativo | `P-001`, correlativo del ciclo |
| `id_creativo` | ① B | Se copia. **Obligatorio** |
| `campana` | ① B (heredada) | Se copia |
| `escena` | `escenas` de ④ | Índice `E1`, `E2`… respetando el orden original |
| `accion` | `escenas` de ④ | Se copia **literal**. No se parafrasea |
| `encuadre` | `encuadres` de ④ | Se copia literal |
| `duracion_s` | `duraciones` de ④ | Se copia, normalizado a segundos |
| `tipo_de_lugar` | `escenas` de ④ | Lo que Creatividad pidió, como concepto |
| `tipo` | `formato` + `encuadre` | `video` / `foto` / `audio` / `captura` |
| `locacion` | **Decisión de Producción** | El lugar concreto que cumple el `tipo_de_lugar` |
| `talento` | Desglose cat. 2 | Quién aparece, y si habla |
| `producto` | Desglose cat. 3 | Qué producto, cuántas unidades, en qué estado |
| `props` | Desglose cat. 4 | Objetos en cuadro que no son el producto |
| `vestuario` | Desglose cat. 5 | Ropa, calzado, accesorios |
| `arte_ambientacion` | Desglose cat. 6 + `estetica_mood` | Qué se monta o se quita del lugar |
| `equipo` | Desglose cat. 7 + `encuadre` | Cámara · óptica · soporte · luz · audio |
| `permisos` | Desglose cat. 8 | Permiso de locación · cesión de imagen · música · seguros |

---

# ③ `plan-de-jornadas.md`

**Consume:** ②.

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| `jornada` | `locacion` + `talento` + `equipo` + `producto` | Agrupación por los 4 ejes, en orden de peso |
| `orden_en_jornada` | Setup de luz · vestuario · producto destructivo | Orden por **costo de cambio**, no narrativo |
| `tiempo_estimado_min` | `duracion_s` + `encuadre` + número de tomas previstas | Tiempo de rodaje, no duración de la pieza. **Son distintos** |
| **Factor de consolidación** | escenas ÷ jornadas | Métrica declarada del ciclo |
| **Carga horaria** | Σ `tiempo_estimado_min` + márgenes de `METHOD 5.3` | Techo de 10 h efectivas por jornada |

> **El error más común:** usar `duracion_s` como tiempo de rodaje. Una escena de 3 segundos puede
> llevar 45 minutos de set. Son dos columnas distintas por una razón.

---

# ④ `recursos.md`

**Consume:** ② + ③.

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| `origen_del_recurso` | Cada ítem del desglose | Vocabulario cerrado de 5 valores |
| `responsable` | Asignación humana | **Nombre**, no rol genérico |
| **Fecha de confirmación** | `jornada` − margen del origen | `a-producir` y `comprado` necesitan más margen |
| **Semáforo** | Estado del pedido | 🟢 confirmado · 🟡 gestionando · 🔴 en riesgo |
| `riesgo` | Dependencias externas de la escena | Clima · talento · permiso · producto |
| `plan_b` | `riesgo` | **Escrito antes de la jornada.** Un riesgo sin plan B es un 🔴 |

---

# ⑤ `plan-de-produccion.csv` — el entregable definitivo

**Consume:** ①②③④. **No agrega información nueva: la ordena en filas ejecutables y costeadas.**

| Columna | Viene de | Skill que la produce |
|---|---|---|
| `id` | Operativo | — |
| `id_creativo` | ① B — la fila creativa (heredada) | `pr-brief` |
| `campana` | ① B (heredada) | `pr-brief` |
| `escena` | ② — índice de `escenas` | `pr-desglose` |
| `accion` | ② (heredada literal) | `pr-desglose` |
| `encuadre` | ② (heredada literal) | `pr-desglose` |
| `duracion_s` | ② (heredada) | `pr-desglose` |
| `tipo` | ② — formato + encuadre | `pr-desglose` |
| `tipo_de_lugar` | ② (heredada) | `pr-desglose` |
| `locacion` | ② cat. 1 — **decisión de Producción** | `pr-desglose` + `pr-recursos` |
| `talento` | ② cat. 2 | `pr-desglose` |
| `producto` | ② cat. 3 | `pr-desglose` |
| `props` | ② cat. 4 | `pr-desglose` |
| `vestuario` | ② cat. 5 | `pr-desglose` |
| `arte_ambientacion` | ② cat. 6 | `pr-desglose` |
| `equipo` | ② cat. 7 | `pr-desglose` |
| `permisos` | ② cat. 8 | `pr-desglose` + `pr-recursos` |
| `jornada` | ③ — agrupación | `pr-jornadas` |
| `orden_en_jornada` | ③ — orden por costo de cambio | `pr-jornadas` |
| `tiempo_estimado_min` | ③ — tiempo de set, no duración de pieza | `pr-jornadas` |
| `origen_del_recurso` | ④ — vocabulario cerrado | `pr-recursos` |
| `responsable` | ④ — nombre + fecha | `pr-recursos` |
| `costo_estimado` | Capa 4 — fijos prorrateados + variables | `pr-presupuesto` |
| `costo_real` | Capa 6-7 — se carga siempre | `pr-loop` |
| `riesgo` | ④ — dependencias externas | `pr-recursos` |
| `plan_b` | ④ — antes de la jornada | `pr-recursos` |
| `archivo_entregado` | Capa 6 — nomenclatura de Capa 5 | `pr-entrega` |
| `destino` | `tipo` del material → `video-editing` (video y audio) · `diseno-grafico` (foto y captura estática) · `posting-directo` | `pr-entrega` |
| `estado` | Operativo | — |

> **Nada nace acá.** Si una columna no se puede llenar desde una capa anterior, falta una capa — o
> falta un input, y entonces la fila va `PENDIENTE`, no inventada.

---

# ⑥ `entrega.md`

**Consume:** ⑤ + el rodaje.

| Campo que produce | Input que lo genera | Transformación |
|---|---|---|
| **Manifiesto** | ⑤ cruzado contra lo grabado | Fila por fila: ¿grabada? ¿archivo? ¿cobertura? |
| `archivo_entregado` | Nomenclatura de Capa 5 | Nombre real del archivo entregado |
| **Selects** | Tomas buenas por escena | Se marcan. **No se elige el frame** |
| **Faltantes** | Filas `Planificada` sin `Entregada` | Motivo escrito, obligatorio |
| **Filas creativas completas** | Agrupación por `id_creativo` | Una fila creativa está completa **solo si todas sus escenas están entregadas** |

---

# ⑦ `aprendizaje-de-produccion.md`

**Consume:** ⑤ con `costo_real` + lo que ⑥A y ⑥B efectivamente usaron en la pieza final.

| Campo que produce | Input que lo genera | A dónde vuelve |
|---|---|---|
| **Desvío de costo** | `costo_estimado` vs `costo_real` | `toolkit/06-presupuesto.md` |
| **Desvío de tiempo** | `tiempo_estimado_min` vs real | `toolkit/04-equipo.md` + Capa 2 |
| **Material no usado** | Cruce con lo publicado | ↩️ **④ Creatividad**, como dato |
| **Factor real** | jornadas reales vs previstas | `playbooks/CONSOLIDACION.md` |
| **Capacidad real** | Piezas producidas ÷ ciclo | **Propuesta a ① Comprensión** — nunca se edita su archivo |

---

# Reglas de correlación

1. **Toda escena traza a una fila creativa.** `id_creativo` vacío = fila eliminada.
2. **Lo que viene de ④ Creatividad se copia, no se parafrasea.** Reescribir la acción con otras
   palabras crea una segunda versión de la intención, y en set se ejecuta la equivocada.
3. **La intención no se cambia: se devuelve.** Toda alternativa se propone, nunca se aplica sola.
4. **`duracion_s` ≠ `tiempo_estimado_min`.** La primera es de la pieza, la segunda del set.
5. **Se consolida antes de costear.** La Capa 4 no corre sin Capa 2.
6. **`costo_real` se carga siempre.** Sin él la Capa 7 no existe.
7. **Una fila creativa incompleta no se declara completa.** Todas sus escenas o ninguna.
