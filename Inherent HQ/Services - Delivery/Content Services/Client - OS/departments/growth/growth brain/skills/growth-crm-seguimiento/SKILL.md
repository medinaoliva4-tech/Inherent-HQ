---
name: growth-crm-seguimiento
description: Disena secuencias de seguimiento (nurture) y reactivacion de leads que no compraron o no respondieron, con multiples touchpoints y triggers claros. USA ESTE SKILL cuando el usuario pida secuencias de follow-up, nurture de email/WhatsApp, reactivacion de leads frios, o gestion de pipeline de leads que no avanzan.
---

# CRM y Secuencias de Seguimiento

## Cuando se activa
Peticion de seguimiento a leads que ya existen en el pipeline: no respondieron, no agendaron, agendaron pero no se presentaron, o dijeron que no por ahora.

## Principio obligatorio
La mayoria de las ventas se pierden por falta de seguimiento, no por mal producto. Todo lead debe tener una secuencia definida segun su estado, no seguimiento improvisado.

## Proceso obligatorio

### Paso 1 - Segmentar por estado
- No respondio al primer contacto
- Agendo pero no se presento (no-show)
- Se presento pero no cerro
- Cerro pero esta inactivo (upsell/reactivacion)

### Paso 2 - Secuencia por estado (definir para cada uno)
Numero de touchpoints, canal (email/WhatsApp/llamada), espaciado en dias, y angulo de mensaje distinto en cada touchpoint (no repetir el mismo mensaje).

### Paso 3 - Trigger de salida
Definir cuando un lead sale de la secuencia (respondio, se convirtio, o alcanzo el limite de intentos y pasa a "reactivacion trimestral").

## Output obligatorio
```
ESTADO DEL LEAD: [segmento]
Secuencia (touchpoint / dia / canal / angulo del mensaje):
Trigger de salida:
Metrica: % reactivado / % agendado desde follow-up
```

## QA antes de entregar
- [ ] Cada segmento de lead tiene su propia secuencia (no una unica secuencia para todos)?
- [ ] Los mensajes de la secuencia varian de angulo, no son el mismo texto reenviado?
- [ ] Hay un trigger de salida claro para no perseguir leads indefinidamente?

## Handoff
Leads reactivados/agendados pasan a growth-ventas-cierre. Leads convertidos en clientes pasan a growth-retencion-referidos.
