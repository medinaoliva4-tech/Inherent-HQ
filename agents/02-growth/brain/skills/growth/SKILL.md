---
name: growth
description: >
  Orquestador del departamento ② Growth de Inherent — el motor de crecimiento del negocio, no la
  pauta. Es la puerta de entrada: lee el pedido, verifica el pre-flight, decide qué capas correr
  según la división y el plan contratado, y llama a las skills `gr-*` en orden parando en los 2
  gates. Úsala SIEMPRE que el pedido tenga que ver con la oferta, el precio, canales grandes
  (eventos, mayoreo, corporativos, cuentas grandes), upsells, recompra, conversión, closing,
  herramientas a medida o los números del negocio. Se dispara con "mejorá la oferta de X",
  "cómo subimos el ticket", "qué canales grandes hay", "se nos pierden los leads", "cuánto nos
  deja cada producto". Requiere la estrategia aprobada y la división definida: si faltan, BLOQUEA.
---

# ② Growth — el orquestador

**Si no sabés qué skill usar, es esta.**

🛑 **Growth no es pauta.** Si el pedido es sobre presupuesto, campañas o anuncios, es
**⑩ Ads Management**.

## 1 · Pre-flight

| Input | De | Si falta |
|---|---|---|
| Unit economics y cómo se compra | ① Comprensión | 🛑 **BLOQUEADO** |
| Objetivo, MUST BE TRUE y **la división** | ② Estrategia | 🛑 **BLOQUEADO** |
| Qué pilar está roto | ② Estrategia | 🛑 **BLOQUEADO** |
| Tono y cómo se dice | ②B Branding | 🛑 **BLOQUEADO** |
| **El plan contratado** | `clients/<cliente>/` | 🛑 **BLOQUEADO** — define qué pilares se activan |

🛑 **Sin unit economics no se toca la oferta.** Cambiar un precio sin saber el margen es jugar
con el negocio de otro.

## 2 · Qué capas corren según el plan

| | 🔷 Marketing / Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|
| `gr-oferta` | ⛔ | ✅ | ✅ |
| `gr-canales-grandes` | ⛔ | ✅ | ✅ |
| `gr-upsells` | ⛔ | ✅ | ✅ |
| `gr-conversion` | ⛔ | ✅ | ✅ |
| `gr-herramienta` | ⛔ | ✅ 1/trimestre | ✅ 1/mes |

> 🛑 **② Growth no corre en la línea 🔷 Marketing.** Si el encargo llega sobre un plan de
> Marketing o Marketing Pro, **se BLOQUEA y se levanta como excepción a Allan** — es upsell
> a Accelerate, no trabajo a absorber.
| `gr-numeros` | ⬜ | ⬜ | ✅ |

🛑 **Correr una capa que el plan no paga es entregar de más y romper el margen.**
**Y prometerla es peor.**

## 3 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«armá el motor de X»*, onboarding | **Las que el plan activa, en orden** |
| *«la oferta»*, *«el precio»*, *«el empaque»* | `gr-oferta` |
| *«eventos»*, *«mayoreo»*, *«corporativos»*, *«cuentas grandes»* | `gr-canales-grandes` |
| *«subir el ticket»*, *«combos»*, *«membresías»*, *«recompra»* | `gr-upsells` |
| *«se nos pierden los leads»*, *«que sepan cerrar»* | `gr-conversion` |
| *«un CRM»*, *«un panel»*, *«una landing»* | `gr-herramienta` |
| *«cuánto nos deja»*, *«el margen por producto»* | `gr-numeros` |
| *«qué movió el número»*, la revisión del 20 | `gr-loop` |

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba |
|---|---|---|
| **GATE 1** | `gr-oferta` | **Allan y el cliente.** El precio es decisión del cliente |
| **GATE 2** | La última capa activa | Allan aprueba el motor completo |
