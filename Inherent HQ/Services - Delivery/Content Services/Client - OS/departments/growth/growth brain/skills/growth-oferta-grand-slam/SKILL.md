---
name: growth-oferta-grand-slam
description: Construye o audita una Grand Slam Offer usando la Ecuacion de Valor de Hormozi (Dream Outcome x Probabilidad Percibida / Tiempo x Esfuerzo). USA ESTE SKILL SIEMPRE que el usuario pida crear, mejorar, auditar o comparar una oferta, propuesta, pricing, paquete de servicios, "irresistible offer", landing page de oferta, o cualquier documento donde se presente que recibe el cliente a cambio de que precio, incluso si no menciona "Hormozi" o "Value Equation" explicitamente. Es obligatorio correr este skill ANTES de redactar copy de oferta, pagina de ventas, propuesta comercial o pricing para un Client OS.
---

# Oferta Grand Slam (Ecuacion de Valor)

## Cuando se activa
- Crear/editar una oferta, servicio, paquete, bundle o pricing nuevo.
- Auditar una oferta existente que no esta convirtiendo.
- Redactar copy de ventas, landing, propuesta o deck comercial.

## Inputs obligatorios (pedir si faltan, no asumir)
1. Avatar / cliente ideal (dolor #1, resultado sonado en sus palabras)
2. Oferta actual (que se entrega, precio, condiciones) si existe
3. Ofertas de competencia conocidas (si el usuario las tiene)
4. Costo de entrega / margen aproximado (para no romper LTGP:CAC luego)

## Proceso obligatorio

### Paso 1 - Calcular el Valor Percibido actual
Value = (Dream Outcome x Probabilidad Percibida de Lograrlo) / (Tiempo hasta el resultado x Esfuerzo/Sacrificio del cliente)

Para CADA elemento, califica 1-10 y anota el porque:
- Dream Outcome: que tan grande/deseado es el resultado final
- Probabilidad percibida: el prospecto cree que SI le va a funcionar A EL
- Tiempo: cuanto tarda en ver resultado
- Esfuerzo/Sacrificio: cuanto trabajo/friccion le exige al cliente

### Paso 2 - Subir numerador, bajar denominador
Para cada palanca baja, proponer 2-3 mejoras concretas (no genericas):
- Subir Dream Outcome -> especificidad del resultado, prueba social cuantificada
- Subir Probabilidad -> garantias, casos de exito, testimonios, certificacion
- Bajar Tiempo -> hitos rapidos, "quick win" en los primeros 7 dias
- Bajar Esfuerzo -> done-for-you vs done-with-you, menos pasos del cliente

### Paso 3 - Value Stack
Listar: oferta central + bonos que resuelven objeciones especificas (no bonos genericos). Cada bono debe tener valor percibido individual.

### Paso 4 - Garantia (elegir 1, justificar por que)
Incondicional / Condicional / Anti-garantia / Implicita.
Debe eliminar el riesgo real que el avatar teme (nombrarlo).

### Paso 5 - Escasez, urgencia y nombre de la oferta
- Escasez real (cupos, capacidad) - nunca falsa.
- Urgencia real (cohortes, fechas, precio que sube).
- Nombre de la oferta: [Resultado] + [Marco de tiempo] + [Mecanismo unico].

## Output obligatorio (formato)
```
OFERTA: [nombre]
Avatar:
Dream Outcome (1-10, por que):
Probabilidad percibida (1-10, por que):
Tiempo (1-10, por que):
Esfuerzo (1-10, por que):
Value Stack: [lista con valor percibido c/u]
Garantia: [tipo + texto]
Escasez/Urgencia:
Precio y justificacion vs. LTGP:CAC:
```

## QA antes de entregar
- [ ] Un prospecto "se sentiria estupido diciendo que no"? Si no, volver al Paso 2.
- [ ] La garantia elimina el riesgo real (no uno generico)?
- [ ] El precio respeta LTGP:CAC >= 3:1? (consultar growth-money-model-pricing si no se sabe el CAC)

## Handoff
Entregar el bloque de Output a: Ventas (growth-ventas-cierre) para script, y a Contenido/Creative para copy de landing.
