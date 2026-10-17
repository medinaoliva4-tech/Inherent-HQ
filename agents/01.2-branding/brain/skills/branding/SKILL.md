---
name: branding
description: >
  Orquestador del departamento ②B Branding de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `br-*` en orden, con la
  auto-revisión de cada capa. Úsala SIEMPRE que el pedido tenga que ver con identidad, territorio de
  marca, personalidad, tono de voz, paleta, tipografía, sistema visual, activos distintivos,
  guía de marca, o validar si una pieza es de marca. Se dispara con "armá la marca de X",
  "cómo se ve esta marca", "el tono de voz", "qué colores", "¿esto es de marca?", "validá estas
  piezas", "la guía de marca". Requiere la estrategia de ① Strategy: si no existe, BLOQUEA.
---

# ②B Branding — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se dice cuál, se
> ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* — o que el
> pipeline de un alcance ⬜ a la medida ya lo declare en `plan-contratado.md`.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight

```
Nivel: [Brand Foundation / Brand Growth / Growth Partnership / ⬜ a la medida] · piezas que valida este ciclo: [n] de [volumen de la ficha]
```

| Input | De | Si falta |
|---|---|---|
| **El brief de branding** — los 8 bloques | ① Strategy · `clients/<cliente>/01-estrategia/` | 🛑 **BLOQUEADO** si la estrategia no existe |
| El **código saturado** de la categoría | ① Strategy · `99-referencias/investigacion/ingenieria-inversa.md` § El mapa de saturación | 🛑 **BLOQUEADO** |
| Qué puede sostener el cliente | ① Strategy | 🛑 **BLOQUEADO** |
| Qué ya existe de marca | ① Strategy · `clients/<cliente>/02-marca/` | 🟡 Se sigue sin eso. **Si existe, vale y no se rehace** |
| **El alcance contratado** | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define la profundidad, y sus **Redes** los formatos |

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
publicada de Brand Growth: *«hacer más cool la marca que ya está»*. **En Brand Foundation sí corren las capas 0 a 5 completas:** ahí se crea la identidad.

## 4 · No para entre capas

**Cada capa se auto-revisa con su checklist y sigue.** El control de calidad lo hace el CEO en
persona. **El CEO solo para el flujo en ① Strategy y ⑩ Ads.** Precio, alcance y fechas se
escalan al CEO; todo lo demás, al COO. Escalar avisa y sigue: no frena el flujo.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Nivel:`** completa
- [ ] El ciclo **cabe en el alcance contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ a la medida, **se sigue Su pipeline**
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
