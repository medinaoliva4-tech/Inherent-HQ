---
name: branding
description: >
  Orquestador del departamento ②B Branding de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `br-*` en orden, parando
  en los 2 gates humanos. Úsala SIEMPRE que el pedido tenga que ver con identidad, territorio de
  marca, personalidad, tono de voz, paleta, tipografía, sistema visual, activos distintivos,
  guía de marca, o validar si una pieza es de marca. Se dispara con "armá la marca de X",
  "cómo se ve esta marca", "el tono de voz", "qué colores", "¿esto es de marca?", "validá estas
  piezas", "la guía de marca". Requiere el brief de branding de ② Estrategia: si falta, BLOQUEA.
---

# ②B Branding — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa, un gate o cambiar el entregable: se dice
> cuál, se ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por Allan»*.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight

```
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · piezas que valida este ciclo: [n] de [techo del plan]
```

| Input | De | Si falta |
|---|---|---|
| **El brief de branding** — los 8 bloques | ② Estrategia · `methodology/brand-brief.md` | 🛑 **BLOQUEADO** |
| El **código saturado** de la categoría | ② Estrategia, bloque 4 | 🛑 **BLOQUEADO** |
| Qué puede sostener el cliente | ① Strategy | 🛑 **BLOQUEADO** |
| Qué ya existe de marca | ① Strategy · `clients/<cliente>/` | 🟡 Se sigue sin eso |
| **El plan contratado** | `clients/<cliente>/data/plan-contratado.md` | 🛑 **BLOQUEADO** — define la profundidad |

🛑 **Sin el código saturado no se puede oponer a nada**, y una marca que no se opone a nada no
se distingue de nada.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá la marca de X»*, onboarding | **Capas 0 a 5, en orden** |
| *«cuál es el territorio»*, *«la personalidad»* | `br-territorio` |
| *«el tono»*, *«cómo hablamos»* | `br-voz` |
| *«qué colores»*, *«la tipografía»*, *«cómo se ve»* | `br-sistema` |
| *«qué nos hace reconocibles»* | `br-activos` |
| *«cómo se ve en un reel»*, *«en carrusel»* | `br-aplicacion` |
| *«¿esto es de marca?»*, *«validá estas piezas»* | `br-guardian` |
| *«qué funcionó»*, la revisión del 20 | `br-loop` |

## 3 · La regla de los ciclos

| Ciclo | Qué corre |
|---|---|
| **El primero** *(onboarding)* | Capas 0 a 5 completas |
| **Los demás** | Solo `br-guardian` y `br-loop` |

🛑 **La marca se evoluciona, no se rehace.** Rehacerla cada ciclo contradice la promesa
publicada de Accelerate: *«escalar lo que ya funciona, sin perderlo»*.

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `br-voz` | Territorio y voz |
| **GATE 2** | `br-aplicacion` | La guía completa |

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Plan:`** completa
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, **todas sus filas tienen número**
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] Los **gates humanos** quedaron registrados con estado — ninguno asumido por silencio
