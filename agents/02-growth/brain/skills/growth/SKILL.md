---
name: growth
description: >
  Orquestador del departamento ② Growth de Inherent — el motor de crecimiento del negocio, no la
  pauta. Es la puerta de entrada: lee el pedido, verifica el pre-flight, decide qué capas correr
  según la división y el plan contratado, y llama a las skills `gr-*` en orden. Corre en todos los
  planes: ligero en la línea Marketing (elige qué ofertas que ya existen se empujan), completo en
  Accelerate y Compound. Solo para en el gate de la oferta, antes de llevarla al cliente. Úsala
  SIEMPRE que el pedido tenga que ver con la oferta, el precio, qué oferta se empuja, canales
  grandes (eventos, mayoreo, corporativos, cuentas grandes), upsells, recompra, conversión,
  closing, herramientas a medida o los números del negocio. Se dispara con "mejorá la oferta de
  X", "qué oferta empujamos este mes", "cómo subimos el ticket", "qué canales grandes hay", "se
  nos pierden los leads", "cuánto nos deja cada producto". Requiere que la estrategia exista y la
  división definida: si faltan, BLOQUEA.
---

# ② Growth — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa, un gate o cambiar el entregable: se dice
> cuál, se ofrece correrla y **se sigue el workflow**, salvo que el pipeline del ⬜ Tailor Made del
> cliente lo declare o el pedido diga *«excepción aprobada por el CEO»*.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

🛑 **Growth no es pauta.** Si el pedido es sobre presupuesto, campañas o anuncios, es
**⑩ Ads Management**.

## 0 · Lo primero: ¿a qué profundidad corre Growth en este plan?

| La línea contratada | ② Growth |
|---|---|
| 🔷 **Marketing** · 🔷 **Marketing Pro** | 🟡 **Ligero** — elige **cuáles de las ofertas que ya existen** se empujan y con qué objetivo. Escribe `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` |
| 🟨 **Accelerate** · 🟨 **Compound** | ✅ **Completo** — diseña la oferta y corre los pilares que el plan paga |
| ⬜ **Tailor Made** | **Lo que diga su pipeline** en `plan-contratado.md`. Si ② no está, no corre |

🛑 **En 🔷 no se cambia qué se vende, en qué paquetes ni a qué precio.** Si el cliente lo pide,
**es upsell a Accelerate, no trabajo a absorber.**

**Al cliente se le dice:** *«Tu plan trabaja que te vean y te entiendan. Rediseñar qué vendes
y a qué precio es el siguiente paso.»*

---

## 1 · Pre-flight

```
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · ② Growth: [🟡 ligero / ✅ completo / ⬜ según su pipeline]
```

| Input | De | Si falta |
|---|---|---|
| **El plan contratado** — la línea y, si es ⬜, su pipeline | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define la profundidad y qué pilares se activan |
| Unit economics y cómo se compra | ① Strategy | 🛑 **BLOQUEADO** |
| Objetivo, MUST BE TRUE y **la división** | ② Estrategia | 🛑 **BLOQUEADO** |
| Qué pilar está roto | ② Estrategia | 🛑 **BLOQUEADO** |
| Tono y cómo se dice | ②B Branding | 🟡 Se usa si existe |

🛑 **Sin unit economics no se toca la oferta.** Cambiar un precio sin saber el margen es jugar
con el negocio de otro.

## 2 · Qué capas corren según el plan

| | 🔷 Marketing / Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|
| `gr-oferta` | 🟡 **Ligero** — qué ofertas se empujan | ✅ | ✅ |
| `gr-canales-grandes` | ⛔ | ✅ | ✅ |
| `gr-upsells` | ⛔ | ✅ | ✅ |
| `gr-conversion` | ⛔ | ✅ | ✅ |
| `gr-herramienta` | ⛔ | ✅ 1/trimestre | ✅ 1/mes |
| `gr-numeros` | ⬜ | ⬜ | ✅ |

⬜ **Tailor Made:** corren las capas que declare su pipeline, al nivel que declare.

🛑 **Correr una capa que el plan no paga es entregar de más y romper el margen.**
**Y prometerla es peor.**

## 3 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá el motor de X»*, onboarding | **Las que el plan activa, en orden** |
| *«la oferta»*, *«el precio»*, *«el empaque»*, *«qué oferta empujamos»* | `gr-oferta` |
| *«eventos»*, *«mayoreo»*, *«corporativos»*, *«cuentas grandes»* | `gr-canales-grandes` |
| *«subir el ticket»*, *«combos»*, *«membresías»*, *«recompra»* | `gr-upsells` |
| *«se nos pierden los leads»*, *«que sepan cerrar»* | `gr-conversion` |
| *«un CRM»*, *«un panel»*, *«una landing»* | `gr-herramienta` |
| *«cuánto nos deja»*, *«el margen por producto»* | `gr-numeros` |
| *«qué movió el número»*, la revisión del 20 | `gr-loop` |

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba |
|---|---|---|
| **GATE 1** — 🟨 | `gr-oferta` | **El CEO, antes de llevar la oferta al cliente** — es comprometer precio. Después, **el precio lo decide el cliente** |

**Nada más para.** Cada capa se auto-revisa con su checklist y sigue. En 🔷 ligero no hay gate:
elegir qué ofertas se empujan no cambia el precio ni sale al cliente.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Plan:`** completa
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, **sigue su pipeline**
- [ ] 🔷 Si el plan es Marketing o Marketing Pro, corrió **ligero**: no se tocó qué se vende, sus paquetes ni su precio
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
