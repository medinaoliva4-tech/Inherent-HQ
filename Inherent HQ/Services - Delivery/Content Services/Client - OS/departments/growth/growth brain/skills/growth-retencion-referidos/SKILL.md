---
name: growth-retencion-referidos
description: Disena tacticas de retencion/reduccion de churn y sistemas de referidos/afiliados (Four Lead Getters) para convertir clientes actuales en motor de crecimiento. USA ESTE SKILL cuando el usuario pida reducir cancelaciones/churn, mejorar onboarding, disenar un programa de referidos o afiliados, o aumentar el valor de vida del cliente (LTV/LTGP).
---

# Retencion y Referidos

## Cuando se activa
Peticion sobre churn, cancelaciones, onboarding, programas de referidos, afiliados, o reactivacion de clientes existentes.

## Dos frentes obligatorios (distinguir cual aplica)

### Frente 1 - Retencion / reduccion de churn
1. Identificar el momento exacto donde el cliente suele cancelar o dejar de usar el servicio (mapa del ciclo de vida).
2. Auditar el onboarding: el cliente llega al "quick win" (primer resultado tangible) en los primeros dias? Si no, ese es el problema raiz, no un descuento de retencion.
3. Definir intervencion especifica en el punto de riesgo identificado (check-in, contenido, ajuste de producto), no generica.

### Frente 2 - Referidos y afiliados (Four Lead Getters: clientes, empleados, agencias, afiliados)
1. Definir el incentivo (para quien refiere y para el referido) y el momento ideal para pedir el referido (tipicamente justo despues de un resultado positivo del cliente, no al azar).
2. Definir el mecanismo de tracking (codigo, link, formulario) — sin tracking no hay programa.
3. Si aplica afiliados/agencias externas: definir comision y materiales que se les entregan (no asumen que van a promocionar sin recursos).

## Output obligatorio
```
FRENTE: [Retencion / Referidos]
(Retencion) Punto de riesgo en el ciclo de vida:
(Retencion) Intervencion especifica:
(Referidos) Incentivo (referente / referido):
(Referidos) Momento de la pedida:
(Referidos) Mecanismo de tracking:
Metrica: % churn mensual / % de clientes que refieren / LTGP resultante
```

## QA antes de entregar
- [ ] La intervencion de retencion ataca el punto de riesgo real, no es un descuento generico?
- [ ] El referido se pide en el momento de mayor satisfaccion del cliente, no al azar?
- [ ] Existe un mecanismo de tracking definido para el programa de referidos?

## Handoff
Resultados de churn/LTV retroalimentan a growth-money-model-pricing (LTGP). Nuevos leads por referido entran a growth-crm-seguimiento.
