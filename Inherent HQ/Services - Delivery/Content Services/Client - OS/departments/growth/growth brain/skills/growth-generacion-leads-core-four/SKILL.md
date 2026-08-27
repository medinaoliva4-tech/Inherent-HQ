---
name: growth-generacion-leads-core-four
description: Diagnostica y planifica generacion de leads usando el marco "Core Four" de Hormozi (Warm Outreach, Contenido gratis, Cold Outreach, Ads pagados) mas la "Regla de 100". USA ESTE SKILL cuando el usuario pida un plan de generacion de leads, diagnostico de por que no hay suficientes leads, distribucion de canales, o cualquier pregunta tipo "como consigo mas clientes/leads/prospectos". Es el punto de entrada obligatorio antes de activar cualquier skill especifico de canal (outreach, contenido, media buying).
---

# Generacion de Leads - Core Four

## Cuando se activa
- Plan de adquisicion de leads nuevo o para un Client OS.
- Diagnostico de "no tenemos suficientes leads / ventas".
- Decidir en que canal invertir tiempo/presupuesto.

## Marco obligatorio: Core Four (lo que TU haces)
| Canal | Tipo | Cuando priorizarlo |
|---|---|---|
| Warm Outreach | 1 a 1, gente que ya te conoce | Fase temprana, sin presupuesto de ads, ciclo de venta consultivo |
| Contenido gratis | 1 a muchos, organico | Construir autoridad/marca a mediano plazo, activo compuesto |
| Cold Outreach | 1 a 1, desconocidos | Oferta clara + ICP definido, ciclo de venta B2B |
| Ads pagados | 1 a muchos, pago | Oferta ya validada organicamente, capital disponible para CAC |

## Marco de apalancamiento: Four Lead Getters (lo que OTROS hacen por ti)
1. Clientes actuales (referidos)
2. Empleados
3. Agencias
4. Afiliados
No se activa este nivel hasta tener Core Four funcionando con datos.

## Proceso obligatorio

### Paso 1 - Diagnostico
Preguntar/confirmar: oferta ya definida (correr growth-oferta-grand-slam si no existe), presupuesto disponible, capacidad del equipo (horas/semana), ciclo de venta (dias).

### Paso 2 - Seleccion de canal primario
Elegir 1 canal primario (no 4 a la vez). Justificar con la tabla de arriba segun presupuesto y madurez de marca.

### Paso 3 - Regla de 100
Definir la accion diaria de volumen del canal elegido (ej: 100 mensajes de outreach/dia, o presupuesto diario fijo en ads, o 1 pieza de contenido/dia) y el periodo minimo de sostenimiento (30-90 dias) antes de evaluar.

### Paso 4 - Metrica de entrada
Definir el Costo Por Lead (CPL) esperado o el Contact Rate esperado ANTES de lanzar, para poder medir desviacion.

## Output obligatorio
```
CANAL PRIMARIO: [Core Four elegido]
Justificacion:
Regla de 100 (accion diaria):
Duracion del sprint:
CPL objetivo / Contact rate objetivo:
Canal secundario (para cuando el primario escale):
```

## QA antes de entregar
- [ ] Hay una oferta Grand Slam definida antes de generar leads para ella?
- [ ] La accion diaria es especifica y medible (no "publicar contenido" sino "1 reel/dia")?
- [ ] Se definio umbral de CPL/contact rate para decidir seguir o pivotar?

## Handoff
Segun canal elegido, delegar a: growth-outreach-warm-cold, growth-contenido-a-leads, o growth-media-buying. Todo lead generado entra a growth-crm-seguimiento.
