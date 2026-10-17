---
name: growth
description: >
  Orquestador del departamento ② Growth de Inherent — el motor de crecimiento del negocio, no la
  pauta. Es la puerta de entrada: lee el pedido, verifica el pre-flight, decide qué capas correr
  según la división y el alcance contratado, y llama a las skills `gr-*` en orden. Corre ligero en
  Brand Growth (elige qué ofertas que ya existen se empujan) y con su profundidad completa en
  Growth Partnership; en Brand Foundation no corre como departamento (la estructura de oferta sale
  de la estrategia de ① Strategy). No para: la oferta nueva se escala al CEO antes de llevarla al cliente.
  Úsala SIEMPRE que el pedido tenga que ver con la oferta, el precio, qué oferta se empuja, canales
  grandes (eventos, mayoreo, corporativos, cuentas grandes), captura de leads (comenta-y-te-mando,
  quiz, lead magnet, VSL, low ticket, outbound), upsells, recompra, conversión, closing,
  herramientas a medida o los números del negocio. Se dispara con "mejorá la oferta de X", "qué
  oferta empujamos este mes", "cómo conseguimos leads", "cómo subimos el ticket", "qué canales
  grandes hay", "se nos pierden los leads", "cuánto nos deja cada producto". Requiere que la estrategia exista y la
  división definida: si faltan, BLOQUEA.
---

# ② Growth — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se dice
> cuál, se ofrece correrla y **se sigue el workflow**, salvo que el pipeline del alcance ⬜ a la medida del
> cliente lo declare o el pedido diga *«excepción aprobada por el CEO»*.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

🛑 **Growth no es pauta.** Si el pedido es sobre presupuesto, campañas o anuncios, es
**⑩ Ads Management**.

## 0 · Lo primero: ¿a qué profundidad corre Growth en este alcance?

| El nivel contratado | ② Growth |
|---|---|
| **Brand Foundation** | ⬜ **No corre como departamento.** La estructura de oferta *(productos o servicios, propuesta de valor, mensajes)* sale de la estrategia de ① Strategy |
| **Brand Growth** | 🟡 **Ligero** — elige **cuáles de las ofertas que ya existen** se empujan y con qué objetivo. Escribe `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` |
| **Growth Partnership** | ✅ **Profundidad completa** — trabaja la oferta y corre los pilares y las áreas que la ficha incluye |
| ⬜ **A la medida** | **Lo que diga su pipeline** en `plan-contratado.md`. Si ② Growth no está, no corre |

🛑 **En Brand Growth no se cambia qué se vende, en qué paquetes ni a qué precio.** Si el cliente lo pide,
**es la profundidad de Growth Partnership o un proyecto de Brand Foundation, no trabajo a absorber.**

**Al cliente se le dice:** *«Tu alcance trabaja que te vean y te entiendan. Rediseñar qué vendes
y a qué precio es el siguiente paso.»*

**Los slots de «client-getting» de ③ Marketing apuntan a `directo`** *(el DM o el WhatsApp del
cliente, que ⑧ Community atiende cuando la ficha lo incluye)*. **Las recetas de captura son de Growth Partnership.**

---

## 1 · Pre-flight

```
Nivel: [Brand Foundation / Brand Growth / Growth Partnership / ⬜ a la medida] · ② Growth: [⬜ no corre / 🟡 ligero / ✅ completo / ⬜ según su pipeline]
```

| Input | De | Si falta |
|---|---|---|
| **El alcance contratado** — el nivel y, si es ⬜, su pipeline | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define la profundidad y qué pilares se activan |
| Unit economics y cómo se compra | ① Strategy | 🛑 **BLOQUEADO** |
| Objetivo, MUST BE TRUE y **la división** | ① Strategy | 🛑 **BLOQUEADO** |
| Qué pilar está roto | ① Strategy | 🛑 **BLOQUEADO** |
| Tono y cómo se dice | ②B Branding | 🟡 Se usa si existe |

🛑 **Sin unit economics no se toca la oferta.** Cambiar un precio sin saber el margen es jugar
con el negocio de otro.

## 2 · Qué capas corren según el alcance

| | Brand Foundation | Brand Growth | Growth Partnership |
|---|---|---|---|
| `gr-oferta` | ⬜ *(sale en ① Strategy)* | 🟡 **Ligero** — qué ofertas se empujan | ✅ |
| `gr-captura` | ⬜ | ⛔ | ✅ |
| `gr-canales-grandes` | ⬜ | ⛔ | ✅ |
| `gr-upsells` | ⬜ | ⛔ | ✅ |
| `gr-conversion` | ⬜ | ⛔ | ✅ |
| `gr-herramienta` | ⬜ | ⛔ | ✅ según la ficha |
| `gr-numeros` | ⬜ | ⬜ | ✅ según la ficha |

⬜ **A la medida:** corren las capas que declare su pipeline, al nivel que declare.

🛑 **Correr una capa que el alcance contratado no incluye es entregar de más y romper el margen.**
**Y prometerla es peor.**

## 3 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá el motor de X»*, onboarding | **Las que el alcance activa, en orden** |
| *«la oferta»*, *«el precio»*, *«el empaque»*, *«qué oferta empujamos»* | `gr-oferta` |
| *«cómo conseguimos leads»*, *«comenta y te mando»*, *«un quiz»*, *«un lead magnet»*, *«una VSL»*, *«prospectar»*, *«outbound»* | `gr-captura` |
| *«eventos»*, *«mayoreo»*, *«corporativos»*, *«cuentas grandes»* | `gr-canales-grandes` |
| *«subir el ticket»*, *«combos»*, *«membresías»*, *«recompra»* | `gr-upsells` |
| *«se nos pierden los leads»*, *«que sepan cerrar»* | `gr-conversion` |
| *«un CRM»*, *«un panel»*, *«una landing»* | `gr-herramienta` |
| *«cuánto nos deja»*, *«el margen por producto»* | `gr-numeros` |
| *«qué movió el número»*, la revisión del 20 | `gr-loop` |

## 4 · No para — qué se escala

| 🔴 | Después de | A quién |
|---|---|---|
| **La oferta nueva** — Growth Partnership | `gr-oferta` | **Se escala al CEO antes de llevarla al cliente** — es comprometer precio. Después, **el precio lo decide el cliente** |

**Escalar no frena.** Cada capa se auto-revisa con su checklist y sigue. En Brand Growth, ligero, no hay nada
que escalar: elegir qué ofertas se empujan no cambia el precio ni sale al cliente.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Nivel:`** completa
- [ ] El ciclo **cabe en el alcance contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ a la medida, **sigue su pipeline**
- [ ] Growth Partnership: la captura tiene **una receta principal** y su objetivo de leads es **interno**: no se prometió al cliente
- [ ] Si el nivel es Brand Growth, corrió **ligero**: no se tocó qué se vende, sus paquetes ni su precio
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
