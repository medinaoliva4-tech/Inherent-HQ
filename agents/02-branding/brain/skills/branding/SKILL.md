---
name: branding
description: >
  Orquestador de ② Branding de Inherent. Convierte la dirección de ① Strategy en una marca que otro
  puede ejecutar sin preguntar: territorio y voz, sistema visual con activos y aplicación en
  Figma, y el guardián que valida piezas y claims cada ciclo. Úsala SIEMPRE que el pedido tenga
  que ver con identidad, territorio, personalidad, tono de voz, paleta, tipografía, sistema
  visual, activos distintivos, guía de marca, o validar si una pieza es de marca. Se dispara con
  "armá la marca de X", "la guía de marca", "¿esto es de marca?", /branding.
---

# ② Branding — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/02-branding/brain/WORKFLOW.md`.

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*. Necesita los nodos `icp`, `historia` y `brief` aprobados por
el CEO en ① Strategy.

```
PRE-FLIGHT ② Branding — Cliente: [x] · Nivel: [..] · Guía existente: [sí / no]
Estrategia aprobada [✅/⛔] · archivo de Figma del cliente [✅/⛔]
→ PASA | BLOQUEADO: [qué falta]
```

🛑 **Si el cliente llega a Brand Growth sin guía de marca**, no se inventa dentro del ciclo: se
escala al CEO para correrla como Brand Foundation o como módulo.

## 2 · El orden

```
br-territorio-voz → br-sistema        (una vez: la guía de marca)
br-guardian                           (cada ciclo, días 16-19)
```

| El pedido suena a… | Corre |
|---|---|
| *«armá la marca»*, *«la guía»* | `br-territorio-voz` → `br-sistema` |
| *«el tono»*, *«el territorio»* | `br-territorio-voz` |
| *«colores»*, *«activos»*, *«plantillas por formato»* | `br-sistema` |
| *«¿esto es de marca?»*, *«validá»*, *«¿podemos decir esto?»* | `br-guardian` |

## 3 · El handoff

```
Marketing y Creative → voz, palabras propias y prohibidas, claims validados
Diseño gráfico       → sistema visual y plantillas en Figma
Producción           → § Movimiento: subtítulos, ritmo y cierre de video
```
