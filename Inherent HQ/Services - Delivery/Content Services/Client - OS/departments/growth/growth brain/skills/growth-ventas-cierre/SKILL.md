---
name: growth-ventas-cierre
description: Genera scripts de llamadas de venta, manejo de objeciones y estructura setter/closer, con foco obligatorio en show rate, close rate y cash collected (no solo revenue prometido). USA ESTE SKILL cuando el usuario pida un guion de venta, script de llamada, manejo de objeciones, proceso de cierre, o auditoria de por que no se estan cerrando ventas.
---

# Venta y Cierre

## Cuando se activa
Peticion de script de llamada de ventas, secuencia de objeciones, proceso de setter/closer, o diagnostico de tasa de cierre baja.

## Distincion de roles obligatoria
- SETTER: califica y agenda. Metrica propia: show rate (citas que se presentan).
- CLOSER: convierte en la llamada. Metrica propia: close rate y cash collected.
Si el usuario no distingue los roles, preguntar si el flujo tiene ambos o es la misma persona.

## Proceso obligatorio para script de cierre
1. Apertura: contexto + expectativas de la llamada (que van a cubrir, cuanto dura).
2. Descubrimiento: preguntas que hacen que el prospecto articule su propio dolor y costo de no resolverlo (no preguntas de tramite).
3. Presentacion de la oferta: usar el Value Stack de growth-oferta-grand-slam, no improvisar precio/condiciones.
4. Manejo de objeciones: listar las 3-5 objeciones mas frecuentes de este avatar con respuesta especifica cada una (precio, tiempo, "lo pienso", confianza, comparacion con competencia).
5. Cierre: pedir la decision explicitamente, definir el siguiente paso de pago (no dejarlo abierto).

## Output obligatorio
```
SCRIPT DE VENTA: [oferta]
Apertura:
Preguntas de descubrimiento (5):
Presentacion (resumen del value stack):
Objeciones y respuestas (tabla):
Cierre / ask explicito:
Metrica que se mide: show rate / close rate / cash collected
```

## QA antes de entregar
- [ ] El cierre pide la decision explicitamente (no termina en "piensalo y me avisas")?
- [ ] Las objeciones son especificas del avatar, no genericas de cualquier venta?
- [ ] Se distingue cash collected de revenue prometido/facturado?

## Handoff
Cierres van a Delivery/Fulfillment. Metricas de show rate/close rate/cash collected alimentan el scorecard semanal del Growth Lead.
