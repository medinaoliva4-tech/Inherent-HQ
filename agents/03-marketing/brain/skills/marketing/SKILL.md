---
name: marketing
description: >
  Orquestador del departamento ③ Marketing de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `mk-*` en orden, con la
  auto-revisión de cada capa. Úsala SIEMPRE que el pedido tenga que ver con el plan del ciclo, campañas,
  jerarquía de mensaje, pilares de contenido, plan por canal, calendario de slots, cadencia, o
  cerrar el mes de marketing. Se dispara con "armá el plan del mes de X", "qué campaña corremos",
  "cuántas piezas por canal", "el calendario del ciclo", "qué pilares trabajamos", "qué rindió el
  mes pasado". Requiere que exista la estrategia de ① Strategy: si no existe, BLOQUEA.
---

# ③ Marketing — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se dice cuál, se
> ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* — o que el
> pipeline de un alcance ⬜ a la medida ya lo declare en `plan-contratado.md`.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight — se verifica antes de todo

```
Nivel: [Brand Growth / Growth Partnership / ⬜ a la medida] · slots: [n] de [techo de la ficha] · campañas: [n] de [techo]
```

| Input | De | Si falta |
|---|---|---|
| Objetivo del ciclo y MUST BE TRUE | ① Strategy | 🛑 **BLOQUEADO** |
| Posicionamiento | ① Strategy | 🛑 **BLOQUEADO** |
| Capacidad declarada y cuentas que existen | ① Strategy | 🛑 **BLOQUEADO** |
| Tono, territorio, activos distintivos | ②B Branding | 🟡 Se usan si existen. No bloquea |
| Qué ofertas se empujan este ciclo | ② Growth · `07-oferta-y-ventas/ofertas-a-empujar.md` | 🟡 Se usa si existe. No bloquea |
| **El alcance contratado del cliente** *(la ficha)* | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define el techo |
| Qué ángulos rindieron en pauta | ⑩ Ads | 🟡 Se sigue sin eso |

🛑 **Sin estrategia no hay plan.** Lo que está en `clients/<cliente>/01-estrategia/` es la
estrategia vigente: **un archivo que existe se toma como aprobado.**

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

## 4 · No para entre capas

**Cada capa se auto-revisa con su checklist y sigue;** el calendario pasa directo a ④ Creatividad. El
control de calidad lo hace el CEO en persona. El CEO solo frena el flujo en ① Strategy y en ⑩ Ads.
**Escalar no es parar:** precio, alcance y fechas → el CEO · lo demás → el COO.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Nivel:`** completa
- [ ] El ciclo **cabe en el alcance contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ a la medida, **se sigue Su pipeline**
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
