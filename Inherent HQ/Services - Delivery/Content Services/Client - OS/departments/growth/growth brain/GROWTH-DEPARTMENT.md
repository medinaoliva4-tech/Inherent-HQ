# GROWTH — Department Brain (Inherente OS)

> Inspirado en la metodologia de Alex & Leila Hormozi ($100M Offers, $100M Leads, $100M Money Models).
> Este documento va en `INHERENTE-OS/departments/growth/GROWTH-DEPARTMENT.md`.
> Cada skill referenciado abajo vive en `INHERENTE-OS/skills/growth/<skill-name>/SKILL.md`.

## PURPOSE
Generar crecimiento medible y repetible (mas clientes, mayor valor promedio, mayor frecuencia, mayor margen/retencion) usando un sistema de Skills obligatorios en vez de intuicion suelta.

## MODO DE EJECUCIÓN Y ENTREGABLES

El trabajo estratégico de Growth se realiza en **Human + Cowork**, con apoyo del Growth Lead para cálculos, auditoría y estructuración. Ningún agente aprueba pricing, economía o inversión por sí solo.

Inputs obligatorios de Strategy:

- `núcleo.md`
- `ingeniería-inversa.md`
- `estrategia-de-contenido.md`
- `posicionamiento.md`
- `contenido-por-canal.md`
- `calendario-estratégico.xlsx`

Entregables fijos:

1. `posicionamiento-a-monetización.md` — traduce posicionamiento, oferta, audiencia y valor en una lógica comercial medible.
2. `estrategia-de-growth.md` — adquisición, captura, CRM, cierre, retención, referidos, KPIs y umbrales.
3. `calendario-final-de-contenido.xlsx` — une Strategy + Growth. Define frecuencia, canal, formato general, pilar, objetivo y función dentro del funnel. No define todavía cada idea diaria ni el craft final.

Handoff: los tres outputs, junto con los seis de Strategy, pasan a Creative.

## REGLA NO NEGOCIABLE
**Ningun agente, Cowork o Chat puede generar una oferta, campana, script de ventas, pricing o pieza de contenido de adquisicion sin correr primero el Skill correspondiente de esta tabla.** Si el skill no esta cargado/disponible en el entorno, el agente debe indicarlo explicitamente antes de producir el output ("Nota: este resultado no paso por el skill growth-X, falta validarlo").

## MAPA DE SKILLS (orden de dependencia)

| Orden | Skill (name) | Dispara cuando... | Depende de |
|---|---|---|---|
| 0 | `growth-money-model-pricing` | Se va a aprobar gasto, pricing o presupuesto | — (es el control de entrada) |
| 1 | `growth-oferta-grand-slam` | Se crea/audita una oferta | growth-money-model-pricing (precio vs LTGP:CAC) |
| 2 | `growth-generacion-leads-core-four` | Se planea adquisicion de leads | growth-oferta-grand-slam |
| 3a | `growth-lead-magnet` | Canal elegido usa captura organica | growth-generacion-leads-core-four |
| 3b | `growth-outreach-warm-cold` | Canal elegido es outreach 1 a 1 | growth-generacion-leads-core-four |
| 3c | `growth-contenido-a-leads` | Canal elegido es contenido organico | growth-generacion-leads-core-four |
| 3d | `growth-media-buying` | Canal elegido es pauta paga | growth-generacion-leads-core-four + growth-money-model-pricing |
| 4 | `growth-crm-seguimiento` | Hay leads en pipeline sin cerrar | cualquier canal de 3a-3d |
| 5 | `growth-ventas-cierre` | Hay una cita/llamada agendada | growth-oferta-grand-slam |
| 6 | `growth-retencion-referidos` | Ya hay clientes activos | growth-ventas-cierre |

## LA UNICA METRICA MAESTRA
**LTGP:CAC ≥ 3:1** (Lifetime Gross Profit ÷ Customer Acquisition Cost).
- El agente/skill `growth-money-model-pricing` es dueno de este numero.
- Ningun otro skill puede aprobar gasto de adquisicion si este numero esta en rojo (<3:1); debe redirigir a corregir oferta, margen o retencion primero.

## SCORECARD SEMANAL OBLIGATORIO (cascada de KPIs por rol)
| Rol / Skill dueno | Metrica que posee |
|---|---|
| Leads (Core Four / contenido / outreach / ads) | Costo por lead (CPL), volumen de leads |
| CRM / Seguimiento | Contact rate, % reactivacion |
| Ventas / Cierre | Show rate, close rate, cash collected |
| Money Model / Pricing | LTGP:CAC (metrica maestra) |
| Retencion / Referidos | % churn mensual, % clientes que refieren |

Cada agente que produzca un resultado dentro de estas areas debe reportar su metrica en este formato al Growth Lead (humano o agente orquestador) — no solo entregar el output creativo.

## AGENTE ORQUESTADOR: "Growth Lead"
Rol: recibe cualquier peticion de crecimiento, identifica en que fila del Mapa de Skills cae, verifica dependencias cumplidas (ej. no permite media buying sin oferta y sin LTGP:CAC calculado), invoca el/los skill(s) correspondientes en orden, y consolida el scorecard.

Instruccion de sistema sugerida para este agente (pegar en su prompt/config):
```
Eres el Growth Lead de Inherente. Antes de responder cualquier peticion de crecimiento
(oferta, leads, ventas, retencion, pricing), identifica que Skill(s) de
INHERENTE-OS/skills/growth/ aplican segun GROWTH-DEPARTMENT.md, valida que las
dependencias previas esten resueltas, y ejecuta los skills en el orden indicado.
Nunca generes copy de oferta, campana o script de ventas sin haber corrido el skill
correspondiente. Reporta siempre la metrica que ese skill posee en el Scorecard.
Si LTGP:CAC no esta calculado o esta por debajo de 3:1, bloquea cualquier aprobacion
de gasto de adquisicion y redirige a corregir oferta/margen/retencion primero.
```

## HUMAN GATES (donde SI o SI decide el CEO/humano, no el agente)
- Aprobacion final de pricing cuando LTGP:CAC esta en zona gris (2.5-3.5:1).
- Aprobacion de presupuesto de ads por encima de un umbral definido por el CEO.
- Aprobacion de garantias tipo "incondicional" (riesgo legal/financiero).
- Decisiones de branding/posicionamiento que toquen la oferta central.

## NEXT (no construir aun, solo mapa a futuro)
- Skill de "Four Lead Getters" avanzado (programa de afiliados/agencias como canal propio, no solo tactica dentro de retencion).
- Integracion directa del scorecard con el CRM real (hoy es reporte manual del agente).
