---
name: ads
description: >
  Orquestador del departamento Ads Management de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `ad-*` en orden,
  parando en los 2 gates. Se apoya en AdWhispr para ejecutar y en el plugin claude-ads para
  auditar, planear y monitorear. Úsala SIEMPRE que el pedido tenga que ver con pauta,
  presupuesto, campañas, anuncios, públicos, CPA, ROAS, fatiga de creativo o atribución. Se
  dispara con "lanzá las campañas de X", "cuánto presupuesto", "no está rindiendo la pauta",
  "pausá esto", "qué ángulo funciona", "cuánto vendimos por pauta". Pautar es acción
  destructiva: nada sale sin gate del CEO.
---

# Ads Management — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa, un gate o cambiar el entregable: se dice
> cuál, se ofrece correrla y **se sigue el workflow**, salvo que el pipeline del ⬜ Tailor Made del
> cliente lo declare o el pedido diga *«excepción aprobada por el CEO»*.
> Entrada normal: el router `/inherent`. Ver `pipelines/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

🛑 **Si el pedido es sobre la oferta, el precio o los canales grandes, es Growth.**

## 1 · 🔴 La regla que está antes de todo

**Pautar gasta dinero del cliente y es irreversible.**

🛑 **Nada se lanza ni se cambia de presupuesto sin gate del CEO.** Pausar lo que gasta mal se
hace y se avisa: detener una pérdida no es gastar.

## 2 · Pre-flight

```
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · variantes por campaña: [n] de [techo] · presupuesto aprobado: [monto]
```

| Input | De | Si falta |
|---|---|---|
| Qué ofertas se pautan, su precio y el objetivo | Growth — 🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` · ⬜ lo que entregue según su pipeline | 🛑 **BLOQUEADO** |
| Qué piezas se pautan y con qué objetivo | Marketing | 🛑 **BLOQUEADO** |
| Los creativos **con variantes de hook** | Diseño gráfico y Video Editing | 🛑 **BLOQUEADO** |
| Qué claims están **validados** | Branding | 🟡 Se usa si existe — un claim `⏸️` no sale |
| Las cuentas publicitarias y **quién tiene el acceso** | `clients/<cliente>/00-onboarding/LINKS.md` | 🛑 **BLOQUEADO** |
| **El presupuesto, aprobado por el cliente** | 00 Account (Secretaria) · el CEO | 🛑 **BLOQUEADO** |
| **El plan contratado** | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define canales y variantes |

🛑 **Sin presupuesto aprobado por escrito no se toca una cuenta.**

## 3 · Las dos herramientas

| | **AdWhispr** | **`claude-ads`** |
|---|---|---|
| **Ejecuta** | ✅ | ❌ — corre en `--draft` |
| **Audita y monitorea** | ❌ | ✅ |

**El plugin propone, AdWhispr ejecuta, el CEO aprueba en el medio.**

🛑 **Si falta una, lo que depende de ella no corre:**
`BLOQUEADO — falta AdWhispr. Instalala: ver INSTALAR.md § AdWhispr` ·
`BLOQUEADO — falta el plugin claude-ads. Instalala: ver INSTALAR.md § Plugin claude-ads`

## 4 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá la pauta del mes»* | **Todas, en orden** |
| *«cuánto presupuesto»*, *«qué objetivo»* | `ad-encargo` |
| *«cómo armamos las campañas»*, *«a quién le pegamos»* | `ad-estructura` |
| *«qué anuncios corremos»* | `ad-creativos` |
| *«lanzá»* | `ad-lanzamiento` 🔒 |
| *«no está rindiendo»*, *«pausá»*, *«subí el presupuesto»* | `ad-optimizacion` 🔒 |
| *«cuánto vendimos por pauta»* | `ad-atribucion` |
| *«qué ángulo ganó»*, la revisión del 20 | `ad-loop` |

## 5 · Dónde para

| 🚦 | Después de | Qué aprueba el CEO |
|---|---|---|
| **GATE 1** | `ad-creativos` | El plan y **el presupuesto** |
| **GATE 2** | Cada cambio de `ad-optimizacion` | **Todo movimiento de presupuesto** |

## 6 · ⚠️ LinkedIn Ads

`claude-ads` lo lista. **Nosotros lo tenemos declarado como que no lo hacemos.**
🛑 **No se promete ni se vende hasta probar que el plugin lo ejecuta de verdad.**

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Plan:`** completa
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, **sigue su pipeline**
- [ ] 🛑 **La inversión publicitaria la pone el cliente**, y el presupuesto está **aprobado por escrito** antes de tocar la cuenta
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] 🔒 **Nada se lanzó ni se movió de presupuesto sin el OK del CEO** — GATE 1 y GATE 2
