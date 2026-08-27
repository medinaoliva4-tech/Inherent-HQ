---
name: growth-media-buying
description: Estructura campanas de ads pagados (Meta, Google, TikTok, LinkedIn) con foco en economia de CPL/CAC y testing de creativos, no solo copy. USA ESTE SKILL cuando el usuario pida planear, auditar o mejorar una campana de pauta paga, presupuesto de ads, o estructura de funnel pago. No usar para contenido organico (eso es growth-contenido-a-leads).
---

# Media Buying / Ads Pagados

## Sistema operativo principal
El plugin de **Claude Ads** en Claude es el brain operativo para Media Buying:

- Contiene la metodología práctica, skills, agentes, flujos y comandos de ejecución.
- No duplicar ni reinstalar sus skills en este brain.
- Para operar, abrir Claude con el plugin activo y ejecutar los flujos desde Claude Ads.

El contexto del cliente, exports, evidencia y entregables viven en `../../inherent-operations-media-buying/`. Ver `../../inherent-operations-media-buying/OPERATING-METHODOLOGY.md`.

## Cuando se activa
Peticion relacionada a presupuesto, estructura o resultados de pauta paga (Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads, etc).

## Precondicion obligatoria
No lanzar pauta paga sin: (1) oferta Grand Slam definida (growth-oferta-grand-slam) y (2) LTGP:CAC minimo estimado (growth-money-model-pricing). Si faltan, senalarlo antes de continuar.

## Proceso obligatorio

### Paso 1 - Objetivo y CPL objetivo
Definir el CPL maximo aceptable en base a LTGP:CAC objetivo (>=3:1), no un numero arbitrario.

### Paso 2 - Estructura de funnel
Definir: creativo -> landing/lead magnet -> captura -> CRM. Cada eslabon debe tener metrica propia (CTR, tasa de opt-in, CPL).

### Paso 3 - Testing de creativos
Plan de testing: minimo 3 angulos de creativo distintos (no 3 variaciones de color del mismo angulo). Cada angulo ataca un dolor/beneficio distinto de la Ecuacion de Valor.

### Paso 4 - Presupuesto y umbral de decision
Presupuesto diario/semanal de testing, y regla clara de cuando matar/escalar un anuncio (ej: matar si CPL > 1.5x objetivo despues de X gasto minimo; escalar si CPL < objetivo con volumen estable).

## Output obligatorio
```
CANAL:
CPL objetivo (basado en LTGP:CAC):
Angulos de creativo a testear (x3 minimo):
Presupuesto de testing:
Regla de matar/escalar:
Landing/lead magnet de destino:
```

## QA antes de entregar
- [ ] El CPL objetivo esta anclado a LTGP:CAC, no inventado?
- [ ] Hay al menos 3 angulos de creativo distintos, no variaciones cosmeticas?
- [ ] Existe una regla explicita de matar/escalar (no "vemos como va")?

## Handoff
Leads capturados van a growth-crm-seguimiento. Resultados de CPL/CAC retroalimentan a growth-money-model-pricing.
