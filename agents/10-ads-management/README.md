# 10 · Ads Management · 🟡 tiene las acciones, falta el cerebro

## Propósito
**Que la pauta compre resultado, no alcance.** Lleva el presupuesto, los ángulos y la
optimización.

## Acciones — ya las tiene

| Acción | MCP | |
|---|---|---|
| Pautar en Meta | AdWhispr `launch_meta_ad` | ⬜ |
| Pautar en TikTok | AdWhispr `launch_tiktok_campaign` | ⬜ |
| Google Search y Performance Max | AdWhispr `launch_search_campaign` · `launch_pmax_campaign` | ⬜ |
| Clonar el anuncio de TikTok de un competidor | AdWhispr `clone_tiktok_ad` | ⬜ |
| Optimizar presupuesto, pausar, reanudar | AdWhispr `update_budget` · `pause/resume_campaign` | ⬜ |
| Keywords propias y del competidor | AdWhispr `research_keywords` | ⬜ |

## 🔌 Plugin a evaluar — `claude-ads`

**https://github.com/AgriciDaniel/claude-ads** `[fuente: el repo público, sin probar]`

Plugin de Claude Code con comandos `/ads`: `setup` · `audit` · `plan` · `create` ·
`launch --draft` · `monitor` · `optimize --draft` · `experiment` · `report`.

| Qué agregaría | |
|---|---|
| **Auditoría de cuentas con evidencia fechada** y nivel de confianza explícito | 🟢 no lo tenemos |
| **Monitoreo de pacing, fatiga de creativo, tracking y políticas** | 🟢 no lo tenemos |
| **Experimentos controlados** con lectura de resultado | 🟢 no lo tenemos |
| Plataformas que AdWhispr no cubre: **LinkedIn**, Microsoft, Reddit, Snapchat, X, Apple, Amazon, Pinterest | 🟡 ver abajo |

> ⚠️ **Ojo con LinkedIn Ads.** Hoy está declarado como *«no tenemos la acción»* en
> `inherent/01-IDENTIDAD.md` y `inherent/06-ECONOMIA.md`. **Si este plugin realmente lo ejecuta,
> eso cambia y hay que actualizar los tres archivos.** Si solo lo audita y planifica,
> **la restricción se queda como está.**

> ⚠️ **`launch` y `optimize` corren en `--draft` por defecto: proponen, no aplican.**
> Eso encaja con la regla del repo —el agente propone, Allan cierra— pero significa que
> **la ejecución sigue siendo de AdWhispr.**

**❓ Decisión de Allan:** instalarlo y probar qué ejecuta de verdad, antes de prometer nada.

## Qué entrega según el plan

> **El plan contratado es el techo.** Nunca se promete arriba de esta tabla —
> ver `inherent/06-ECONOMIA.md`.

| | 🟦 **Ignite** | 🟪 **Accelerate** | 🟨 **Compound** |
|---|---|---|---|
| **Meta y TikTok** | ✅ | ✅ | ✅ |
| **Google Search y Performance Max** | ⬜ | ✅ | ✅ |
| **Variantes de creativo por campaña** | hasta 20 | hasta 35 | hasta 50 |
| **Optimización** | Mensual | Por ángulo, continua | Continua + presupuesto sistematizado |
| **Atribución para el performance fee** | 🟡 Opcional | ✅ | ✅ |

⚠️ **La inversión publicitaria la pone el cliente, siempre, aparte.**

## Lo que falta
**`brain/WORKFLOW.md` y sus skills.**
