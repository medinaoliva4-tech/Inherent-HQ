---
name: ve-loop
description: >
  Capa 5 de Video Editing — cierra el ciclo con cuatro lecturas: cuántas piezas salieron de
  cada hora grabada, qué se devolvió y a quién, qué material quedó sin usar y qué spec falló
  siempre. Devuelve como dato a Producción lo que faltó de cobertura y a Creatividad lo que
  dirigió y no se pudo montar. Cuenta las rondas de cambios por pieza y convierte el feedback
  que se repite en reglas escritas. Escribe `aprendizaje-de-video.md`. Úsala cuando pidan "cómo
  nos fue con el video", "cerrá el ciclo", "por qué devolvimos tanto", "cuánto rindió la
  grabación", "qué material no usamos", "¿por qué tantas rondas?".
---

# Capa 5 · Loop — qué rindió cada hora grabada

| | |
|---|---|
| **Consume** | `entregas-video.md` · las devoluciones del ciclo · el manifiesto de Producción · métricas de Posting y Ads · `grading.json` · las notas del guion visual y las respuestas de la página del cliente |
| **Produce** | **`clients/<cliente>/04-contenido/aprendizaje-de-video.md`** — en la raíz del área, no dentro del mes |

**Al cerrar el ciclo, el aprendizaje del ciclo anterior pasa a `_historico/<AAAA-MM>-aprendizaje-de-video.md`.** El vigente siempre vive en la raíz del área.

> 🔑 **Corre el 20 de cada mes.**

## 1 · Las cuatro lecturas

### A · Piezas por hora grabada
**El número que mide si el departamento está haciendo su trabajo.**

```
piezas entregadas ÷ horas que grabó Producción
```

| Plan | Lo esperado |
|---|---|
| 🔷 Marketing | **13 mínimo ÷ 3 h — tope 18** |
| 🔷 Marketing Pro | **18 mínimo ÷ 4 h — tope 24** |
| 🟨 Accelerate | **27 mínimo ÷ 6 h — tope 36** |
| 🟨 Compound | **36 mínimo ÷ 8 h — tope 48** |

**La métrica del departamento son 3 videos planificados por hora grabada** *(20 min c/u)*,
**más los derivados.**

🔴 **Si quedó debajo del mínimo, el loop declara cuál de las dos causas fue:**

| Causa | Qué significa | A quién se devuelve |
|---|---|---|
| **Material muy scripted** | Las escenas tienen guion encima y no se recombinan | Creatividad — pedir más escenas de apoyo limpias |
| **Faltó cobertura** | No hubo suficientes escenas de apoyo que grabar | Producción — el shot list no cubrió |

🔑 **Llegar al tope no es mérito si el ciclo no lo pedía.** Se entrega el mínimo prometido;
el tope solo cuando el material lo permite **y** hay horas de operador.

🔴 **Si el número baja, o faltó cobertura (Producción) o se derivó de menos (acá).** Se distingue cuál.

### B · Qué se devolvió y a quién
| A | Motivo típico | Qué significa |
|---|---|---|
| **Producción** | Falta cobertura, audio, selects | El desglose de Producción no cubrió el shot list de Creatividad |
| **Creatividad** | El guion no se puede montar con lo que hay | Creatividad dirigió algo que Producción no podía rodar |
| **Branding** | Una regla se incumplió | O la regla está mal escrita, o falta en el sistema |

### C · Material grabado que nadie usó
**Se cuenta.** Material sin usar es presupuesto de Producción tirado.

**`grading.json` ya lo tiene:** cuántos clips se descartaron y **por qué** (desenfocado, tiembla,
gente de fondo, toma repetida, cámara en mano sin trípode). El motivo es lo que le sirve a Producción.

> 🔑 **Se devuelve a Creatividad y a Producción como dato:** o se dirigió de más, o se grabó de más.

### D · Qué spec falló siempre
**Si la misma spec falla cada ciclo, el problema no es descuido: es que la spec no está escrita
donde se ejecuta.**

### E · Las rondas de cambios
**Cuántas versiones necesitó cada pieza hasta quedar aprobada, y por qué.** Se cuenta en
`outputs/video/` (cada `<versión>-anterior/` es una ronda) y en las notas del operador y del cliente.

| Pieza | Versiones | Motivos agrupados |
|---|---|---|
| `CR-007` | v5 | texto (2) · color (2) · ritmo (1) |

> 🔑 **El feedback que se repite en dos piezas deja de ser un comentario y se vuelve regla.**
> Se escribe donde se ejecuta: si es de montaje, en `ve-armado`; si es de marca o QA, en
> `ve-marca`; si es de la marca del cliente, se propone a Branding para `sistema-visual.md`.

*Ejemplo real (AKAI, oct 2026, 7 reels, hasta 11 versiones):* «va muy rápido» → escenas de 3 a
4.5 s · «se ve trabado» → estabilizar solo si mide mejor · «se ve azul» → color por toma, original
+ temperatura · «el logo se ve gris» → logo por encima de los velos. Todas quedaron escritas.

## 2 · Qué se decide

| Hallazgo | Decisión |
|---|---|
| Piezas por hora bajando dos ciclos | 🔴 Se escala. **Es el margen del modelo** |
| Producción devolvió lo mismo dos veces | Se devuelve a Producción con el patrón, para su desglose |
| Creatividad dirigió algo irrodable dos veces | Se devuelve a Creatividad con el límite real de producción |
| Material sin usar arriba del 30% | Se declara a Creatividad y a Producción |
| Una spec falla siempre | Se propone a Branding agregarla a `sistema-visual.md` |
| El mismo pedido de cambio en dos piezas | Se escribe como regla en la skill `ve-*` que corresponde |
| Una pieza pasó de 4 versiones | Se revisa si el guion visual se aprobó antes del render |

## 3 · ⚠️ Sin datos no se concluye

Si no hay métricas por pieza de Posting y Ads, **no se declara qué derivada rindió más**: se marca
`⚠️ SIN DATOS` y se nombra a quién se le piden.

## 4 · Qué escribe

| Bloque | Qué lleva |
|---|---|
| **A · Piezas por hora** | El número, contra lo esperado del plan |
| **B · Devoluciones** | Tabla por destino, con el motivo agrupado |
| **C · Material sin usar** | Cuánto, y qué escenas |
| **D · Specs que fallaron** | Cuáles y cuántas veces |
| **E · Rondas de cambios** | Versiones por pieza, motivos agrupados y **qué regla nueva quedó escrita** |
| **F · Qué se devuelve** | A Producción, a Creatividad, a Branding — **como dato, no como reclamo** |
| **G · Los huecos** | `⚠️ SIN DATOS`, con responsable |

## 5 · Checklist

- [ ] **Piezas por hora grabada** está calculado y comparado contra el plan
- [ ] Las devoluciones están **agrupadas por destino y motivo**
- [ ] El material sin usar está **contado**
- [ ] Ninguna conclusión de rendimiento está hecha **sin datos**
- [ ] Lo que se devuelve va **como dato**
- [ ] Las **rondas de cambios** están contadas por pieza
- [ ] Todo feedback repetido quedó **escrito como regla** donde se ejecuta
