---
name: research
description: >
  Orquestador del departamento Research de Inherent. Es la puerta de entrada: lee el pedido, verifica
  el plan contratado, las Redes del cliente, el mapa de categoría de Strategy y que las herramientas
  estén habilitadas, y corre las skills `rs-*` en orden — audiencia, competencia y referentes,
  winners, tendencias. Úsala SIEMPRE que el pedido tenga que ver con investigar audiencia, comentarios
  y objeciones, competidores, referentes, contenido ganador, la biblioteca de winners, tendencias o
  "qué está funcionando". Se dispara con "investigar a X", "qué dice la audiencia", "actualizar la
  biblioteca", "qué contenido está ganando", "qué anuncios corre la competencia". Requiere el plan
  contratado: si falta, BLOQUEA ese cliente.
---

# research — el orquestador

| | |
|---|---|
| **Consume** | `clients/<cliente>/00-onboarding/plan-contratado.md` · el mapa de categoría y los competidores de `01-estrategia/` y `99-referencias/investigacion/` *(Strategy)* · los datos propios que el cliente haya entregado |
| **Produce** | Las capas corridas, en orden, y el `registro-de-research.md` de la corrida |

Contexto del departamento: `pipelines/contenido/03-research/research/brain/WORKFLOW.md`.

**No investiga por sí misma:** verifica, ordena y llama a las capas. Lo que decide es **qué capas
corren** y **si el cliente puede correr**.

## Paso 0 · Pre-flight — por cliente

| Verifica | Si falta |
|---|---|
| 🛑 **Plan contratado anotado** en `00-onboarding/plan-contratado.md` | `BLOQUEADO — falta el plan contratado` |
| **Las Redes** del cliente, leídas del mismo archivo | `BLOQUEADO — el plan no dice las Redes` |
| **El mapa de categoría de Strategy** | Se corre igual: todo es hueco y se declara `⚠️ SIN DATOS — sin mapa de categoría`. Se avisa a Strategy |
| **Tailor Made:** `Su pipeline` incluye Research | Si no está, Research no corre para ese cliente |
| **Herramientas habilitadas en la sesión** *(Apify, AdWhispr, Firecrawl)* | La capa que la necesita para y dice cuál falta. Instalado no es habilitado |
| **La cuota por Red** del plan *(50 / 50 / 100 / 100)* | Se anota en el registro antes de scrapear |

Un cliente por corrida. **Nunca se mezclan dos clientes.**

## Paso 1 · Qué corre según el pedido

| El pedido es… | Corre |
|---|---|
| **Cliente nuevo**, arranque completo | `rs-audiencia` → `rs-competencia` → `rs-winners` → `rs-tendencias` |
| **Insumo del plan del ciclo** | `rs-audiencia` · `rs-competencia` *(la ruta que Marketing y Strategy citan)* |
| **Refrescar la biblioteca** *(semanal o por cron)* | `rs-winners` |
| **Qué se mueve este ciclo** | `rs-tendencias` |
| **Un solo dato** *(«qué anuncios lleva más días X»)* | La capa que lo contiene, sin las demás |

🔑 **Cada capa se auto-revisa con su checklist y sigue.** No hay gate del CEO en Research.

## Paso 2 · Qué no se mezcla

- **Competencia y referencias** van en secciones separadas, con países distintos.
- **Orgánico y pauta** se miden con criterios distintos y no se promedian.
- **Lo observado y la hipótesis** se marcan distinto: `[hipótesis]` nunca se presenta como dato.

## Paso 3 · El registro de la corrida

Toda corrida cierra con una entrada en `registro-de-research.md`:

```
- Cliente: [nombre] · plan: [plan] · Redes: [lista]
- Capas corridas: [lista]
- Contenidos por Red: [n] de [50 / 100] · competencia [n] · referencias [n]
- Fuentes usadas: [lista] · no disponibles: [lista] → evidencia faltante: [qué]
- Gasto de la corrida: US$[n]
- Modo: automatizado / MCP / 🟡 manual
- Fecha de la corrida: [fecha]   ← la antigüedad se mide a esta fecha
- Hallazgos para Strategy: [lo que sugiere tocar la estrategia u oferta, sin decidirlo]
- Confianza: 🟢 alta / 🟡 parcial / 🔴 insuficiente para dirigir
```

## 🛑 Bloqueos

- Sin plan contratado: no corre.
- Sin Redes en el plan: no corre.
- Herramienta no habilitada: la capa para; las otras siguen.
- Un pedido que es de otro departamento *(escribir un hook, armar el calendario, pautar)*: se
  enruta y no se hace aquí.

## ✅ Checklist

- [ ] Plan y Redes leídos del `plan-contratado.md`
- [ ] Solo se corrieron las capas que el pedido necesita
- [ ] Un solo cliente por corrida
- [ ] El registro de la corrida está completo, con fecha
- [ ] Lo que sugiere tocar la estrategia quedó levantado a Strategy, no decidido
