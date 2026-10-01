---
name: marketing
description: >
  Orquestador del departamento ③ Marketing de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `mk-*` en orden, parando en
  los 2 gates humanos. Úsala SIEMPRE que el pedido tenga que ver con el plan del ciclo, campañas,
  jerarquía de mensaje, pilares de contenido, plan por canal, calendario de slots, cadencia, o
  cerrar el mes de marketing. Se dispara con "armá el plan del mes de X", "qué campaña corremos",
  "cuántas piezas por canal", "el calendario del ciclo", "qué pilares trabajamos", "qué rindió el
  mes pasado". Requiere la estrategia aprobada de ② : si falta, BLOQUEA.
---

# ③ Marketing — el orquestador

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight — se verifica antes de todo

| Input | De | Si falta |
|---|---|---|
| Objetivo del ciclo y MUST BE TRUE | ② Estrategia | 🛑 **BLOQUEADO** |
| Posicionamiento aprobado | ② Estrategia | 🛑 **BLOQUEADO** |
| Capacidad declarada y cuentas que existen | ① Comprensión | 🛑 **BLOQUEADO** |
| Tono, territorio, activos distintivos | ②B Branding | 🛑 **BLOQUEADO** |
| **El plan contratado del cliente** | `clients/<cliente>/` | 🛑 **BLOQUEADO** — define el techo |
| Qué ángulos rindieron en pauta | ⑧B Ads | 🟡 Se sigue sin eso |

🛑 **Sin estrategia aprobada no hay plan.** Armar un calendario sobre una estrategia en borrador
es producir un mes que después se tira.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá el plan del mes»*, *«arrancá el ciclo»* | **Todas, en orden** |
| *«qué campaña corremos»* | `mk-campana` |
| *«qué decimos primero»*, *«el mensaje»* | `mk-mensaje` |
| *«qué pilares»*, *«el sistema de contenido»* | `mk-pilares` |
| *«qué hace cada canal»*, *«dónde publicamos»* | `mk-canales` |
| *«el calendario»*, *«cuántas piezas»* | `mk-calendario` |
| *«qué rindió»*, *«cerrá el mes»* | `mk-loop` |

## 3 · El orden es obligatorio

**Cada capa consume la anterior.** No se arma el calendario sin pilares, ni los pilares sin
campaña. Si falta el input de una capa, **se corre la anterior** — nunca se improvisa el faltante.

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `mk-mensaje` | La campaña y la jerarquía de mensaje |
| **GATE 2** | `mk-calendario` | El calendario completo del ciclo |

**No se sigue sin la aprobación.** El agente propone, no cierra.
