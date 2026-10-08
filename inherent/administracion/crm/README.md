# CRM de Inherent

> **Los prospectos de Inherent, en tres tablas.** Se abren en Excel. Las mantiene la skill
> `crm-autopilot` *(o cualquiera del equipo a mano)*.

| Tabla | Qué guarda | Regla |
|---|---|---|
| `contactos.csv` | Una fila por persona | `ultimo_contacto` se actualiza con cada actividad |
| `oportunidades.csv` | Una fila por posible cliente | **Toda oportunidad abierta tiene `siguiente_paso` y `fecha_siguiente_paso`** |
| `actividad.csv` | Una fila por mensaje, llamada o reunión | **Solo se agrega, nunca se edita.** Es el historial |

## Oportunidades

| Columna | Valores |
|---|---|
| `plan_de_interes` | Marketing · Marketing Pro · Accelerate · Compound · Tailor Made |
| `valor_mensual_usd` | El precio del plan: 950 · 1450 · 2500 · 4200 · lo cotizado |
| `etapa` | **Nuevo · Propuesta enviada · Ganado · Perdido** — solo cuatro |
| `fuente` | WhatsApp · Instagram · Web · Referido · Evento · Otro |
| `responsable` | El rol: CEO · COO |

## La cola

**Lo que hay que mover hoy:** toda oportunidad en **Nuevo** o **Propuesta enviada** sin
`siguiente_paso`, o con `fecha_siguiente_paso` vencida. Es lo primero que se revisa.

## Actividad

| Columna | Valores |
|---|---|
| `tipo` | WhatsApp · Llamada · Reunión · Email · Nota |
| `resumen` | Tres a cinco líneas: qué pasó y qué se acordó |
| `siguiente_paso_definido` | Sí · No |

🔒 **Datos personales:** solo lo necesario para dar seguimiento. Nada de contraseñas ni datos de
pago.
