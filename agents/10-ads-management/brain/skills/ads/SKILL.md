---
name: ads
description: >
  Orquestador del departamento ⑩ Ads Management de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `ad-*` en orden,
  parando en los 2 gates. Se apoya en AdWhispr para ejecutar y en el plugin claude-ads para
  auditar, planear y monitorear. Úsala SIEMPRE que el pedido tenga que ver con pauta,
  presupuesto, campañas, anuncios, públicos, CPA, ROAS, fatiga de creativo o atribución. Se
  dispara con "lanzá las campañas de X", "cuánto presupuesto", "no está rindiendo la pauta",
  "pausá esto", "qué ángulo funciona", "cuánto vendimos por pauta". Pautar es acción
  destructiva: nada sale sin gate de Allan.
---

# ⑩ Ads Management — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa, un gate o cambiar el entregable: se dice
> cuál, se ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por Allan»*.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

🛑 **Si el pedido es sobre la oferta, el precio o los canales grandes, es ② Growth.**

## 1 · 🔴 La regla que está antes de todo

**Pautar gasta dinero del cliente y es irreversible.**

🛑 **Nada se lanza, se pausa ni se cambia de presupuesto sin gate de Allan.**

## 2 · Pre-flight

```
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · variantes por campaña: [n] de [techo] · presupuesto aprobado: [monto]
```

| Input | De | Si falta |
|---|---|---|
| La oferta, el precio y el objetivo | ② Growth | 🛑 **BLOQUEADO** |
| Qué piezas se pautan y con qué objetivo | ③ Marketing | 🛑 **BLOQUEADO** |
| Los creativos **con variantes de hook** | ⑥A y ⑥B | 🛑 **BLOQUEADO** |
| Qué claims están **validados** | ②B Branding | 🛑 **BLOQUEADO** |
| Las cuentas publicitarias y **quién tiene el acceso** | `clients/<cliente>/00-onboarding/LINKS.md` | 🛑 **BLOQUEADO** |
| **El presupuesto, aprobado por el cliente** | 00 Account · Allan | 🛑 **BLOQUEADO** |
| **El plan contratado** | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define canales y variantes |

🛑 **Sin presupuesto aprobado por escrito no se toca una cuenta.**

## 3 · Las dos herramientas

| | **AdWhispr** | **`claude-ads`** |
|---|---|---|
| **Ejecuta** | ✅ | ❌ — corre en `--draft` |
| **Audita y monitorea** | ❌ | ✅ |

**El plugin propone, AdWhispr ejecuta, Allan aprueba en el medio.**

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

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `ad-creativos` | El plan y **el presupuesto** |
| **GATE 2** | Cada cambio de `ad-optimizacion` | **Todo movimiento de presupuesto** |

## 6 · ⚠️ LinkedIn Ads

`claude-ads` lo lista. **Nosotros lo tenemos declarado como que no lo hacemos.**
🛑 **No se promete ni se vende hasta probar que el plugin lo ejecuta de verdad.**

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Plan:`** completa
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, **todas sus filas tienen número**
- [ ] 🛑 **La inversión publicitaria la pone el cliente**, y el presupuesto está **aprobado por escrito** antes de tocar la cuenta
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] Los **gates humanos** quedaron registrados con estado — ninguno asumido por silencio
