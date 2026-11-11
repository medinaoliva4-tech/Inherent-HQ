---
name: ads
description: >
  Orquestador de ⑧ Ads de Inherent. Arma el plan de pauta hasta el GATE 1 del CEO (plan y
  presupuesto), lanza, optimiza con el GATE 2 en todo movimiento de presupuesto, y mide la
  atribución. Se apoya en AdWhispr para ejecutar y en el plugin claude-ads para auditar y
  monitorear. Úsala SIEMPRE que el pedido sea pauta, presupuesto de ads, campañas pagas,
  anuncios, públicos, keywords, CPA, ROAS, fatiga o atribución. Se dispara con "lanzá las
  campañas de X", "armá la pauta", "no está rindiendo", /ads.
---

# ⑧ Ads — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/08-ads/brain/WORKFLOW.md`.
> 🔴 **Nada se lanza ni se cambia de presupuesto sin gate del CEO.**

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*.

```
PRE-FLIGHT ⑧ Ads — Cliente: [x] · Nivel: [..] · Canales con pauta: [..]
Objetivo en una métrica [✅/⛔] · presupuesto aprobado por escrito [✅/⛔] · cuentas y acceso [✅/⛔]
Tracking de la ficha [✅/⛔] · piezas para pauta con 3+ hooks [n] · AdWhispr [✅/⛔] · claude-ads [✅/⚠️]
→ PASA | BLOQUEADO: [qué falta]
```

Si el pedido es la oferta, el precio o el canal, es ① Strategy.

## 2 · El orden

```
ad-plan → 🚦 GATE 1 → ad-corrida (lanzar → optimizar con 🚦 GATE 2 → medir)
```

| El pedido suena a… | Corre |
|---|---|
| *«armá la pauta»*, *«qué campañas»*, *«qué anuncios»*, *«keywords»* | `ad-plan` |
| *«lanzá»*, *«no rinde»*, *«subí el presupuesto»*, *«cuánto vendimos»*, *«el reporte»* | `ad-corrida` |

⚠️ **LinkedIn Ads** no se promete ni se vende hasta probar que la herramienta lo ejecuta.
