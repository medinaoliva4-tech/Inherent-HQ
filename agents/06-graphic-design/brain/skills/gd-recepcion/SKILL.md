---
name: gd-recepcion
description: >
  Capa 0 de ⑥A Diseño gráfico — verifica qué llegó de ④ Creatividad y es realmente componible
  antes de abrir un archivo. Filtra las filas sin rodaje, cruza fila por fila que cada pieza
  tenga copy literal y no descrito, que el layout esté definido, que el formato exista en el
  sistema visual y que no arrastre claims pendientes. Agrupa las piezas por formato, que es como
  se van a producir. Úsala cuando pidan "¿llegó todo?", "qué nos falta para diseñar", "arrancá
  el ciclo de diseño". Bloquea si falta el Gate 3 de ④ o el sistema visual de ②B.
---

# Capa 0 · Recepción — qué llegó y es componible

| | |
|---|---|
| **Consume** | `plan-de-contenido.csv` con Gate 3 · los `ideas-<formato>.md` · `sistema-visual.md` |
| **Produce** | Las filas base de **`entregas-diseno.md`** y la tabla **§ Lo que no se diseña este ciclo** |

## 1 · El filtro: las filas sin rodaje

**Del Excel de ④ se toman las filas con `rodaje = no`.** Las de `rodaje = si` van a
⑥B Video Editing.

> ⚠️ **Excepción:** una pieza con `rodaje = si` puede necesitar también un estático —una portada,
> un frame para feed—. Eso lo declara ④ en el `ideas-<formato>.md`, no se asume acá.

## 2 · La agrupación — así se produce el volumen

**Las piezas se agrupan por formato, no por fecha.**

| | Por qué |
|---|---|
| **Todos los carruseles juntos** | Comparten plantilla y ritmo de trabajo |
| **Todos los estáticos de feed juntos** | Mismo molde, misma sesión |
| **Todas las stories juntas** | Mismo formato, misma safe zone |

🛑 **Producir en orden de calendario obliga a cambiar de molde en cada pieza.** Es la diferencia
entre 160 piezas y 160 decisiones.

## 3 · El cruce, fila por fila

**Sin muestreo.**

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Tiene copy literal** | El texto está **escrito**, no descrito | ↩️ **Devuelto a ④**. *«Un título de curiosidad»* no es copy |
| **Tiene layout** | `cr-arte-video` definió dónde va cada texto | ↩️ **Devuelto a ④** |
| **El formato existe en el sistema** | `sistema-visual.md` § Aplicación lo cubre | ↩️ **Devuelto a ②B** — falta la regla |
| **El copy entra** | El largo cabe en el formato sin romper la jerarquía | ↩️ **Devuelto a ④** con el máximo que entra |
| **Hay imagen o se puede generar** | Existe la fuente, o la Capa 2 la resuelve | `⚠️ SIN IMAGEN` — se nombra de quién se espera |
| **No arrastra claims ⏸️** | Sin `⏸️ PENDIENTE APROBACIÓN` | 🛑 **No entra** hasta que ②B valide |

## 4 · El techo

| | 🟦 Ignite | 🟪 Accelerate | 🟨 Compound |
|---|---|---|---|
| Estáticos y carruseles | 40 | 70 | 100 |
| Stories | 30 | 45 | 60 |

🛑 **Si el Excel pide más, se declara y se devuelve a ③ Marketing.**

## 5 · Qué escribe

| Bloque | Qué lleva |
|---|---|
| **Las filas base de `entregas-diseno.md`** | Una por pieza: `id_creativo` · formato · estado |
| **§ Agrupación del ciclo** | Cuántas piezas por formato — **el plan de producción del departamento** |
| **§ Lo que no se diseña este ciclo** | Pieza, motivo, de quién se espera |

## 6 · Checklist

- [ ] Solo entraron filas con **`rodaje = no`** *(más las excepciones que ④ declaró)*
- [ ] Las piezas están **agrupadas por formato**
- [ ] Cada fila se cruzó — **sin muestreo**
- [ ] Ninguna pieza entró con copy **descrito** en vez de escrito
- [ ] Ninguna pieza con claim `⏸️` entró
- [ ] El total **entra en el techo** del plan
