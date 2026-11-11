---
name: graphic-design
description: >
  Orquestador de ⑤ Diseño gráfico de Inherent. El agente hace los borradores de carruseles,
  posts, estáticos y stories en Figma (Figwright) sobre las plantillas del cliente; una persona
  los corrige y aprueba. Úsala SIEMPRE que el pedido tenga que ver con estáticos, carruseles,
  stories, plantillas, composición o el paquete de diseño de un ciclo. Se dispara con "diseñá el
  ciclo de X", "armá los carruseles", "los borradores en Figma", /graphic-design.
---

# ⑤ Diseño gráfico — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/05-graphic-design/brain/WORKFLOW.md`.

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*.

```
PRE-FLIGHT ⑤ Diseño gráfico — Cliente: [x] · Nivel: [..] · Ciclo: [AAAA-MM]
Piezas aprobadas sin video [n] · techo de la ficha [n] · Figma del cliente con plantillas [✅/⛔] · Figwright [✅/⛔]
→ PASA | BLOQUEADO: [qué falta]
```

**Sin plantillas en Figma no se diseña:** se pide a ② Branding (`br-sistema` §3).

## 2 · El orden

```
gd-figma (borradores) → gd-assets (lo que va encima, si hace falta) → la persona corrige y aprueba
→ gd-figma (export) → br-guardian → ⑦ Posting
```

| El pedido suena a… | Corre |
|---|---|
| *«armá los carruseles»*, *«los borradores»*, *«exportá»* | `gd-figma` |
| *«una textura»*, *«un recorte»*, *«un fondo»*, *«algo detrás de la cabeza»*, *«esto no sale en Figma»* | `gd-assets` — muestra el costo y pide OK antes de generar |
