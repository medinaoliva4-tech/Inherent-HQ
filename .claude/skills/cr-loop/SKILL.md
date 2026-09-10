---
name: cr-loop
description: >
  Capa 7 del método de Creatividad — loop de iteración creativa. Lee las piezas publicadas por goal
  del arte (no en agregado), da veredicto a cada hipótesis, identifica los 3 patrones ganadores,
  detecta fatiga (CPM sube y CTR baja) y actualiza el swipe file, el banco de hooks y el toolkit
  para la próxima ronda. Úsala cuando pidan "qué funcionó el mes pasado", "cerremos el ciclo",
  "revisemos las piezas publicadas", "por qué esto dejó de funcionar". Es la capa que hace que
  Creatividad aprenda en vez de solo producir.
---

# Capa 7 — Loop de Iteración Creativa

Leé `agents/creative/METHOD.md` sección **CAPA 7**. Plantilla: `templates/aprendizaje-creativo.md`

**Input obligatorio:** las filas publicadas del `ideas-de-contenido.csv` del bloque + sus métricas
por pieza. Sin métricas: `⚠️ SIN DATOS — [qué falta y a quién pedírselo]`.
🛑 **Ningún ganador inventado.**

## 7.1 — Una variable por test
Si cambiás hook + visual + CTA + oferta a la vez y gana, **no sabés por qué ganó** — y no lo podés
repetir. Si el bloque no aisló variables, **se declara que el aprendizaje no es limpio**.

## 7.2 — La métrica la manda el goal
| `goal_del_arte` *(vocabulario cerrado)* | Métrica que lo juzga |
|---|---|
| `alcance` (TOFU) | Retención, guardados, compartidos |
| `memoria` | Alcance repetido, recordación |
| `valor-de-uso` (MOFU) | Guardados, clics |
| `confianza` (MOFU) | Clics, DMs |
| `accion` (BOFU) | DMs, leads, agendas |
| `pertenencia` (post-compra) | Respuestas, UGC, referidos |

🛑 **Nunca "likes" por default.** Un CTR alto con CPA malo es un mal creativo: atrae a la gente
equivocada. Y se lee **a nivel pieza**, nunca en agregado.

## 7.3 — La mayoría de las piezas no gana
En programas maduros solo un **~5-7%** de los creativos probados gana. El trabajo no es *"ser
genial"*: es tener un proceso que encuentre los pocos que sirven.
> Esto **quita la presión de que cada pieza sea un hit.** Fallar rápido es parte del sistema.

## 7.4 — El ganador es el inicio del ciclo siguiente
Un creativo que gana este mes **fatiga en 2-3 meses** a volumen. Señal: **CPM sube + CTR baja**.
```
gana → se remixa (mismo ángulo, nuevo visual) → se refresca ANTES de que la fatiga lo mate
```
🛑 Ni repetirlo idéntico hasta el cansancio, ni abandonarlo. **Se remixa.**

## 7.5 — Qué produce
1. Los **3 patrones ganadores** del período por goal, con evidencia
2. **Veredicto de cada hipótesis**: confirmada / refutada / sin datos
3. Qué **refrescar por fatiga**, con fecha límite
4. **Banco de hooks** actualizado — los ganadores propios entran a la bóveda y van primero
5. Qué **sube al tope de qué ficha** del `toolkit/`
6. **3 hipótesis** para la próxima ronda
7. **Devoluciones a Strategy** — lo que Creative detectó y no le toca arreglar

## Frontera con Analytics y Strategy
| Departamento | Su pregunta |
|---|---|
| **Creative** Capa 7 | *¿Qué patrón creativo ganó y qué entra al próximo brief?* |
| **Strategy** Capa 8 | *¿Se movió la MUST BE TRUE? ¿Compoundea?* |
| **Analytics** | Los dashboards y el reporte de performance |

Tres preguntas distintas sobre los mismos datos. **Ninguna reemplaza a otra, y Creative no escribe
las otras dos.** Una pieza que rindió bien pero no movió nada estratégico se **devuelve a Strategy**;
no se declara victoria desde acá.

## Cierre
Correr el bloque **Capa 7** de `qa/QA-GATES.md`.

## Handoff
Los aprendizajes vuelven a `cr-swipe-file` (Capa 1, el banco de hooks) y a `cr-big-idea` (Capa 2, las
candidatas de concepto). Las fichas del `toolkit/` se revisan **cada 3 meses** con los patrones
acumulados: un tipo de hook que ganó 3+ veces sube al tope de su ficha.
**Nunca se agrega una opción nueva a una taxonomía sin evidencia de 3+ piezas.**
