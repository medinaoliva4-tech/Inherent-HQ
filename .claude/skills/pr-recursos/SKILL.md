---
name: pr-recursos
description: >
  Capa 3 del método de Producción — define de dónde sale cada cosa, quién la consigue y para cuándo.
  Asigna origen (propio, prestado, alquilado, comprado, a-producir), responsable con nombre y fecha
  de confirmación, aplica el semáforo 🟢🟡🔴 y escribe riesgo y plan B para toda escena con
  dependencia externa. Incluye el chequeo de viabilidad de locaciones y la gestión de cesiones de
  imagen y permisos. Úsala cuando pidan "qué tenemos que conseguir", "quién consigue qué", "está
  confirmada la locación", "qué pasa si llueve". Requiere las jornadas de Capa 2 armadas.
---

# Capa 3 — Recursos

Leé `agents/production/METHOD.md` sección **CAPA 3** + `toolkit/02-locaciones.md`,
`toolkit/03-talento.md` y `toolkit/04-equipo.md`. Plantilla: `templates/recursos.md`.

## Qué hacés
Convertís el inventario del desglose en **compromisos con nombre y fecha**.

## La regla central
🛑 **Ningún recurso queda "por conseguir".** Cada ítem lleva:

```
qué · origen · responsable (NOMBRE) · fecha de confirmación · estado 🟢/🟡/🔴
```

Un ítem 🟡 a menos de **48 h** de su jornada pasa automáticamente a 🔴 y **activa su plan B**.

## Márgenes por origen

| Origen | Margen mínimo | Riesgo típico |
|---|---|---|
| `propio` | 2 días | Se asume disponible y ese día está ocupado |
| `prestado` | 5 días | Se cae sin compromiso **escrito** |
| `alquilado` | 5 días | Reserva sin confirmar · recargo por exceso de franja |
| `comprado` | 10 días | El tiempo de entrega es lo que más se subestima |
| `a-producir` | 15 días | Siempre lleva más de lo previsto |

## Locaciones — no se confirma sin chequeo
Visita o **fotos actuales** · franja **por escrito** con nombre de quien autoriza · luz verificada
**a la hora del rodaje** · ruido en ese horario · acceso · electricidad · qué se puede mover.
Una locación sin visita ni fotos actuales es **🔴**, por más que "la conozcamos".

## Talento
- 🛑 **Sin cesión firmada no se graba a esa persona.** Incluye a las de fondo identificables.
- La cesión declara **uso, canales, territorio y vigencia**. Si va a pauta, se declara aparte.
- La `emocion` heredada de ④ **es la instrucción de dirección**. Se dirige con **situación**
  (*"como cuando alguien te dice que también le pasó"*), nunca con adjetivos de resultado
  (*"más natural"*, *"con más energía"*).
- Talento amateur: **+50 %** sobre el tiempo estimado de la escena.

## Riesgo y plan B
Toda escena con dependencia externa lleva su plan B **escrito antes de la jornada**. Un riesgo sin
plan B es un 🔴.

| Dependencia | Plan B mínimo |
|---|---|
| Clima (exterior) | Interior alternativo, o fecha de reemplazo **reservada** |
| Talento | Segundo nombre confirmado, o reescritura a manos **propuesta a ④** |
| Permiso | Locación alternativa, o versión sin fondo identificable |
| Producto | Unidad de respaldo, o la escena se mueve de jornada |

## Reglas duras
- 🛑 **Nada se compromete antes del GATE 1** (fin de Capa 4). Un "aparté la fecha por las dudas" es
  un compromiso.
- Los permisos se gestionan **primero**: son lo único que puede anular la jornada entera el día antes.
- Toda cotización se registra con **moneda y fecha**.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 3**.

## Siguiente
→ `pr-presupuesto` (Capa 4)
