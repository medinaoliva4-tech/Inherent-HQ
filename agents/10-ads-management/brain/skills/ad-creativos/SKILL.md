---
name: ad-creativos
description: >
  Capa 2 de ⑩ Ads Management — elige qué piezas del ciclo se pautan y con qué variantes de hook,
  porque la pauta no testea creativos distintos sino hooks distintos sobre el mismo cuerpo.
  Verifica que todo claim esté validado por ②B antes de que salga con dinero detrás y que haya
  suficientes variantes para que el test sirva. Úsala cuando pidan "qué anuncios corremos",
  "cuántas variantes", "este anuncio se quemó", "podemos decir esto en pauta". Cierra con el
  GATE 1, donde Allan aprueba plan y presupuesto.
---

# Capa 2 · Creativos — qué corre y con qué variantes

| | |
|---|---|
| **Consume** | Los entregables de ⑥A y ⑥B · los claims validados de ②B · § La estructura |
| **Produce** | La sección **§ Los creativos** de `plan-de-pauta.md` |

## 1 · Se testean hooks, no creativos

🛑 **El error más caro de la pauta: cambiar todo el anuncio cuando no rinde.** Así nunca se
sabe qué falló.

**⑥B produce variantes de hook sobre el mismo cuerpo.** Eso es lo que se testea.

| | |
|---|---|
| **Qué cambia entre variantes** | Solo los primeros 3 segundos |
| **Qué NO cambia** | El cuerpo, el CTA y la oferta |
| **Cuántas por campaña** | **Mínimo 3.** Con menos, el test no dice nada |

## 2 · El techo de variantes

| 🟦 Ignite | 🟪 Accelerate | 🟨 Compound |
|---|---|---|
| hasta **20** | hasta **35** | hasta **50** |

🛑 **Si hacen falta más, se pide a ⑥B dentro del techo** — no se pauta con menos de 3 por
campaña.

## 3 · 🔴 Todo claim va validado

🛑 **Un claim sin validar, con dinero detrás, es un problema legal y de marca.**

| Antes de pautar | |
|---|---|
| ¿②B lo marcó validado? | Si tiene `⏸️` **no sale** |
| ¿Hay número o comparación? | Necesita fuente |
| ¿Dice *«el mejor»*, *«el único»*? | 🛑 **Rechazado por defecto** |

> ⚠️ **Las plataformas rechazan anuncios por claims.** Un rechazo frena la campaña entera.

## 4 · Clonar lo que funciona en la categoría

**AdWhispr `clone_tiktok_ad`** permite partir de un anuncio que ya rinde.

🛑 **Se clona la estructura, no la pieza.** Copiar el creativo de un competidor es un problema
legal y además nos mete en su código visual — justo lo contrario de lo que ②B construyó.

## 5 · Qué pieza va a qué campaña

| Temperatura | Qué pieza |
|---|---|
| **Frío** | La que explica el problema. `Unaware` · `Problem aware` |
| **Tibio** | La que explica **por qué esta forma y no otra** |
| **Caliente** | La prueba y la oferta |
| **Cliente** | Recompra y comunidad |

🛑 **Es el mismo vocabulario de ③ Marketing.** Si la pieza no trae temperatura, se devuelve.

## 6 · 🚦 GATE 1

**Allan aprueba el plan completo y el presupuesto.**

🛑 **Después de este gate se gasta dinero del cliente.**

## 7 · Qué escribe

`## § Los creativos`:

| Bloque | Qué lleva |
|---|---|
| **A · Qué piezas van** | `id_creativo` · campaña · temperatura |
| **B · Las variantes** | Cuántas por campaña, con su hook |
| **C · Claims** | Cuáles se usan, y quién los validó |
| **D · Qué se pidió a ⑥B** | Si hizo falta más |

## 8 · Checklist

- [ ] **Mínimo 3 variantes de hook** por campaña
- [ ] Las variantes cambian **solo los primeros 3 segundos**
- [ ] **Todo claim está validado por ②B**
- [ ] Ninguna pieza clonó el **creativo** de un competidor
- [ ] Cada pieza va a la campaña de **su temperatura**
- [ ] El total está dentro del **techo del plan**
- [ ] **Allan aprobó el GATE 1**
