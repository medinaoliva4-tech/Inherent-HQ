---
name: st-medicion
description: >
  Capa 8 del método Inherent — define KPIs por altura (negocio, comportamiento, marca, contenido),
  registra baseline y condiciones de invalidación, y evalúa si el movimiento COMPOUNDE. Úsala cuando
  pidan "cómo medimos esto", "qué KPIs", "funcionó la estrategia", "cerremos el ciclo", o al revisar
  resultados de un período. Cierra el bucle: los aprendizajes actualizan las 3 Verdades y arrancan
  el ciclo siguiente.
---

# Capa 8 — Medición y Compounding

Leé `agents/strategy/METHOD.md` sección **CAPA 8**. Plantilla: `templates/medicion.md`

**Input obligatorio:** el objetivo de la Capa 3 + el sistema de la Capa 6.

## 8.1 — KPIs por altura
Se mide contra el **objetivo**, no contra "si el contenido funcionó".

| Altura | Mide | Ejemplos |
|---|---|---|
| **Negocio** | ¿Cambió el resultado? | Revenue, clientes nuevos, ticket, recurrencia, margen |
| **Comportamiento** | ¿Cambió la conducta? | Búsquedas de marca, visitas, reservas, leads, prueba |
| **Marca** | ¿Cambió la memoria? | Awareness, asociación a CEP, preferencia, share of search |
| **Contenido** | ¿Funcionó la pieza? | Retención, guardados, compartidos, CTR |

🛑 **Las métricas de contenido nunca validan una estrategia por sí solas.** Un Reel viral que no
movió ninguna MUST BE TRUE es ruido caro. Declaralo si pasa.

**Métricas que mienten en este arquetipo:** leelas en la ficha `archetypes/NN-*.md` sección 7 y
listalas explícitamente como ignoradas.

## 8.1b — Leading vs lagging
**Leading** (retención, guardados, búsquedas de marca, consultas, SOV) → se leen **semanal**.
**Lagging** (revenue, clientes, share of market, awareness) → se leen **trimestral o más**.

🛑 **El lag mínimo del lagging es el ciclo de compra de la categoría** (de 1.2). Leerlo antes
produce un falso negativo. Si el ciclo es de 4 meses, a las 6 semanas los leading son lo único legible.

## 8.1c — Cadencia de revisión
`semana` leading → formatos y slots · `mes` comportamiento → mix, canal, balance ·
`trimestre` lagging → objetivo, movimiento, renuncias · `6 meses` → se re-corre la Capa 1 entera.

**Las 3 Verdades no se tocan por una semana mala.** Solo se actualizan si: una MBT se cumplió o
estaba mal planteada · apareció/se creó/se cayó una UNFAIR · un GO GET se ejecutó o el contexto cambió.

## 8.2 — Baseline
Sin línea base no hay medición, hay anécdota. Se registra **antes** de empezar.
Si no hay: `⚠️ SIN BASELINE — este ciclo se establece como referencia`.

## 8.3 — Aprendizaje → actualizar las verdades
```
RESULTADOS → APRENDIZAJE → ACTUALIZAR LAS 3 VERDADES
```
Preguntá siempre: **¿el movimiento creó una UNFAIR nueva?** Un evento propio que se vuelve anual y
reconocido dejó de ser un movimiento: es una ventaja.

## 8.4 — ¿DOES IT COMPOUND?
> ¿Esto solo funciona hoy, o hace que mañana sea más fácil ganar?

Dimensiones: `memoria de marca · audiencia propia · credibilidad · relaciones · activos distintivos ·
comunidad · IP · data · biblioteca de contenido · prueba social`

**Se responde siempre, incluso cuando la respuesta es que no acumula.** Un movimiento no-compounding
puede ser válido para un resultado puntual, pero el cliente necesita saber que ese esfuerzo no se
capitaliza.

## Cierre
Correr el bloque **Capa 8** de `qa/QA-GATES.md`.

## Handoff
Los aprendizajes vuelven a `st-tres-verdades` (Capa 2) para el ciclo siguiente.
La Capa 1 se re-corre completa a los 6 meses o si cambia la categoría.
