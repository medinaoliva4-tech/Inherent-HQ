---
name: mk-campanas
description: >
  Fase M4 del método de Marketing — el entregable central. Convierte el mix en campañas concretas,
  clasificadas siempre en orgánicas y pautadas, y por función comercial (marca, demanda, activación,
  retención). Produce la ficha de cada campaña: avatar, nivel de consciencia, ángulo, objeción,
  los 7 mensajes base, mecánica, canales, ventana, presupuesto, dueño y métrica. Úsala cuando pidan
  "qué campañas hacemos", "armá las campañas", "campañas orgánicas y pautadas", "influencer
  marketing", "una campaña de temporada", "una campaña de marca". Requiere el plan de marketing
  hecho. Ningún ángulo cambia la promesa, y toda campaña se traza hasta una MUST BE TRUE.
---

# M4 — Arquitectura de campañas

Leé `agents/marketing/METHOD.md` sección **M4** y
`agents/marketing/playbooks/ANGULOS-Y-AVATARES.md` + `TIPOS-DE-MARKETING.md`.
Plantillas: `plan-de-marketing.md` (sección 3) + `campanas.md`
**Input obligatorio:** `plan-de-marketing.md` secciones 1-2

## Qué es una campaña

> Una campaña **no es un tema de contenido**. Es un bloque con objetivo, ventana, presupuesto,
> ángulo y dueño. Sin traza a una MUST BE TRUE, no es campaña: es un antojo.

## Clasificación obligatoria — los dos ejes, siempre

```
NATURALEZA         orgánica · pautada · mixta
FUNCIÓN COMERCIAL  marca · demanda · activación · retención
```

| Función | Se juzga con | NUNCA con |
|---|---|---|
| **Marca** | Share of search, recordación, asociación a CEP, cobertura | ROAS |
| **Demanda** | Búsquedas de marca, consultas, leads, tráfico calificado | Solo ventas inmediatas |
| **Activación** | Ventas, reservas, ROAS, tasa de cierre | Alcance |
| **Retención** | Recompra, frecuencia, ticket, referidos | Alcance de piezas nuevas |

> **La función se declara ANTES de lanzar, nunca después de ver el resultado.**

## La regla del ángulo

```
PROMESA (Strategy, no cambia)  →  AVATAR  →  ÁNGULO  →  MENSAJE  →  pieza (Creative)
```

Un ángulo cambia **la puerta por la que se entra**, nunca la casa. Si un ángulo necesita otra
promesa para funcionar → **⟲ RETORNO A ESTRATEGIA**.

Cada campaña le habla a **un** avatar y a **un** nivel de consciencia. Una campaña que intenta
cubrir los cinco niveles no cubre ninguno — es el diagnóstico más común de una campaña que
"no funcionó sin razón aparente".

## El filtro comercial — el filtro del departamento

| | Pregunta |
|---|---|
| **1** | ¿Esto **va a incrementar ventas**, o solo se ve bien? |
| **2** | Si es de marca: ¿qué mueve exactamente, y cómo lo vamos a ver? |
| **3** | ¿Se apoya en algo **unfair**, o es replicable por cualquiera mañana? |
| **4** | ¿El esfuerzo es proporcional al resultado posible? |

Si falla 1 y 2 a la vez → **la campaña no entra**. No se deja "por si acaso".

## Lo que NO va en una ficha de campaña

`copies` · `guiones` · `conceptos creativos` (→ Creative) · `precio y estructura de oferta`
(→ Growth) · `assets` (→ Production).

Toda **mecánica promocional** sale como propuesta y queda `PENDIENTE` hasta que Growth valide
precio y margen.

## Reglas duras
- Toda campaña: traza a MBT, dueño con nombre y **fecha de fin**.
- El mecanismo y las pruebas se **toman de Strategy**, no se inventan.
- Los **7 mensajes base** completos en cada campaña.
- La suma de `% del objetivo` de todas las campañas = **100%** (coincide con M2).
- Toda campaña respeta las **renuncias** declaradas por Strategy.
- El **loop** de cada campaña se declara, o se marca `no compounding`.

## Cierre
Correr el bloque **M4** de `agents/marketing/qa/QA-GATES.md`.
🚦 **GATE M-2** — el plan y las campañas los aprueba un humano. **El agente propone; no cierra.**
