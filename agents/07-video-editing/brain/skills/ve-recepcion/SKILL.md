---
name: ve-recepcion
description: >
  Capa 0 de ⑥B Video Editing — verifica qué llegó de ⑤ Producción y es realmente editable antes
  de abrir un proyecto. Cruza fila por fila las piezas con rodaje del Excel de ④ contra el
  manifiesto de ⑤, verifica que exista material con selects marcados, que el audio sirva, que la
  cobertura alcance para el guion escrito y que el backup esté. Lo que falta se nombra con de
  quién se espera. Úsala cuando pidan "¿llegó todo?", "qué nos falta para editar", "arrancá el
  ciclo de video", "cruzá el material contra el Excel". Bloquea si falta el Gate 3 de ④ o los
  selects de ⑤.
---

# Capa 0 · Recepción — qué llegó y es editable

| | |
|---|---|
| **Consume** | `plan-de-contenido.csv` con Gate 3 · el manifiesto y el material de ⑤ · `ideas-<formato>.md` |
| **Produce** | Las filas base de **`entregas-video.md`** y la tabla **§ Lo que no se edita este ciclo** |

**No se abre un proyecto todavía: se cruza y se verifica.** Empezar a editar una pieza a la que
le falta cobertura es trabajo tirado que se descubre a mitad del montaje.

## 1 · El filtro: solo las filas con rodaje

**Del Excel de ④ se toman únicamente las filas con `rodaje = si`.** Las demás van directo a
⑥A Diseño gráfico.

🛑 **Una fila sin `rodaje` que llega acá está mal clasificada: se devuelve a ④.**

## 2 · El cruce, fila por fila

**Sin muestreo.** Una fila que no se verificó es una fila que se cae a mitad del ciclo.

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Existe el material** | El manifiesto de ⑤ lo lista y la ruta abre | `⚠️ SIN MATERIAL` — se nombra **de quién se espera y desde cuándo** |
| **Tiene selects marcados** | ⑤ marcó la toma buena | ↩️ **Devuelto a ⑤** |
| **La cobertura alcanza** | Hay planos para todas las escenas del `ideas-<formato>.md` | ↩️ **Devuelto a ⑤** con qué escena falta |
| **El audio sirve** | Se entiende, sin saturar, sin ruido que no se pueda limpiar | ↩️ **Devuelto a ⑤** |
| **El guion es montable** | El hook de ④ se puede armar con lo que hay | ↩️ **Devuelto a ④** — nunca se improvisa otro hook |
| **Hay copy literal** | El `ideas-<formato>.md` tiene el texto escrito, no descrito | ↩️ **Devuelto a ④** |
| **No arrastra claims ⏸️** | La pieza no tiene `⏸️ PENDIENTE APROBACIÓN` | 🛑 **No entra** hasta que ②B valide |

## 3 · Cuando falta material pero la pieza se puede salvar

**Antes de devolver, se verifica si hay otra salida:**

| Salida | Cuándo |
|---|---|
| **Banco de assets** | Si ya existe material de ciclos anteriores que sirve. **Se declara que es reuso** |
| **Generar** | Higgsfield `generate_video`, si la escena lo permite y ②B lo autoriza |
| **Reencuadre de otra pieza** | Si el plano existe en otra toma del mismo ciclo |

🛑 **Si ninguna sirve, se devuelve.** Inventar una solución en el momento es cómo una pieza
termina sin parecerse a lo que ④ dirigió.

## 4 · El techo

**Se verifica contra el plan contratado antes de empezar:**

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| Videos de grabación | 8 | 12 | 18 | 20 |
| Videos con b-roll | 2 | 4 | 2 | 4 |
| **Total** | **10** | **16** | **20** | **24** |

🛑 **Si el Excel pide más, se declara y se devuelve a ③ Marketing.** No se edita de más.

## 5 · Qué escribe

| Bloque | Qué lleva |
|---|---|
| **Las filas base de `entregas-video.md`** | Una por pieza: `id_creativo` · formato · plataformas · estado |
| **§ Lo que no se edita este ciclo** | Tabla con pieza, motivo, de quién se espera, desde cuándo |

## 6 · Checklist

- [ ] Solo entraron filas con **`rodaje = si`**
- [ ] Cada fila se cruzó contra el manifiesto de ⑤ — **sin muestreo**
- [ ] Cada devolución nombra **a quién y qué falta**
- [ ] Ninguna pieza con claim `⏸️` entró al ciclo
- [ ] El total **entra en el techo** del plan contratado
