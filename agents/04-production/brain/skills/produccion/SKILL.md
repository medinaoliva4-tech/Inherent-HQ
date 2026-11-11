---
name: produccion
description: >
  Orquestador de ④ Producción de Inherent, con Pre y Post. Pre: jornada, briefs, guiones, shot
  list, permisos, compras, hooks alternos y presupuesto, en una hoja imprimible. Post: el primer
  corte lo hace el agente con el motor, el editor humano solo corrige; después marca, derivadas y
  export. Úsala SIEMPRE que el pedido sea grabar, fotos, locaciones, talento, jornada, call
  sheet, shot list, presupuesto de rodaje, editar, montar, cortar, subtitular, derivadas o
  exportar video. Se dispara con "qué hace falta para grabar", "editá los reels de X",
  "sacá las derivadas", /produccion.
---

# ④ Producción — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/04-production/brain/WORKFLOW.md`.

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*. Necesita nodos `pieza` aprobados por el CEO.

```
PRE-FLIGHT ④ Producción — Cliente: [x] · Nivel: [..] · Ciclo: [AAAA-MM] · Fase: [Pre / Post]
Piezas aprobadas con material [n] · horas de la ficha [n] · Drive del cliente [✅/⛔]
Post: material con selects [✅/⛔] · motor instalado [✅/⛔]
→ PASA | BLOQUEADO: [qué falta]
```

## 2 · El orden

```
Pre:  pr-pre    (días 3-5)  → grabar (6-11)
Post: pr-post   (días 12-15) → br-guardian → ⑦ Posting
```

| El pedido suena a… | Corre |
|---|---|
| *«qué hace falta para grabar»*, *«la jornada»*, *«shot list»*, *«permisos»*, *«presupuesto»* | `pr-pre` |
| *«editá»*, *«primer corte»*, *«derivadas»*, *«exportá»*, *«subtítulos»* | `pr-post` |

## 3 · El handoff

```
Producción (rol) → la hoja de la jornada impresa
Editor de video  → el primer corte para corregir
Branding         → masters y derivadas para br-guardian
Posting          → los archivos aprobados con su id
```
