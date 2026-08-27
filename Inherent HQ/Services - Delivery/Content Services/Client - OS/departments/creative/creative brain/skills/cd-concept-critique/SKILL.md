---
name: cd-concept-critique
description: Estructura cualquier concepto o territorio creativo en formato estándar de agencia y lo somete a los gates de crítica creativa en el orden correcto — estrategia e idea SIEMPRE antes que craft. ÚSALA SIEMPRE que el usuario pida generar, evaluar, elegir entre, o presentar conceptos creativos, campañas, territorios, "big ideas", ganchos o rutas creativas. Requiere el documento de cd-strategy-brief como input — si no existe, se genera primero. Nunca aprueba craft en un concepto que falla estrategia o idea, y nunca mezcla los dos tipos de feedback en el mismo párrafo.
---

# Crítica y Estructuración de Conceptos Creativos

## Job

Convertir ideas sueltas en **territorios evaluables** y decidir, con criterio explícito, cuáles
sobreviven. Esta skill es el filtro entre "tuvimos una idea" y "esto se puede presentar".

## Cuándo se activa

- Después de `cd-strategy-brief` (siempre requiere su output como input).
- El usuario pide "dame opciones/conceptos/rutas para..."
- El usuario pega un concepto ya hecho y pregunta "¿esto sirve?" o "¿cuál elegimos?"

## Input requerido

- El documento de Fundamento Estratégico (`cd-strategy-brief`). Si no existe, actívala primero.
- El o los conceptos crudos a evaluar (pueden venir del usuario, de un Agente de Creative, o
  generarse en esta misma skill a partir del Insight).

## Proceso

### Paso 1 — Estructura cada concepto como Territorio

```markdown
## Territorio: [Nombre]
**Insight del que parte:** [debe coincidir con el de cd-strategy-brief]
**La idea en una frase:** [...]
**Tono / mundo visual:** [...]
**2-3 ejecuciones de ejemplo:** [across channels]
**Por qué es ownable:** [¿un competidor podría correr esto?]
**Cómo escala:** [¿funciona en más canales? ¿en el tiempo?]
```

### Paso 2 — Test de la Gran Idea (antes de cualquier otra cosa)

Responde explícitamente, sin saltarte ninguna:
1. **¿Es una idea o es solo un anuncio?** — ¿podés nombrar 5 ejecuciones más que salgan de la
   misma idea? Si no, es una ejecución disfrazada de idea.
2. **¿Sobrevive sin el texto?** — tapá el logo y el copy. ¿Todavía se entiende de qué se trata?
3. **¿Es una sola cosa?** — si el territorio comunica dos mensajes, falla.

Si falla 1, marca el territorio como **EJECUCIÓN, NO IDEA** y no continúes con los gates de abajo
hasta convertirlo en algo escalable (o descártalo).

### Paso 3 — Los 8 Gates, en este orden exacto

**No evalúes craft (gates 5-8) si el concepto no pasó estrategia e idea (gates 1-2).**
Esto no es una sugerencia — es la regla que separa una crítica útil de un halago vacío.

| # | Gate | Pregunta | Si falla |
|---|---|---|---|
| 1 | **Estrategia** | ¿Resuelve el único problema del brief? | 🛑 KILL — vuelve a cd-strategy-brief |
| 2 | **Idea** | ¿Pasó el test de la Gran Idea del Paso 2? | 🛑 KILL o reescribir |
| 3 | **Frescura** | ¿Ya lo vimos? ¿Es cliché de categoría? | ⚠️ Nota, no mata solo |
| 4 | **Verdad de marca** | ¿Solo esta marca podría decir esto? | ⚠️ Nota, no mata solo |
| 5 | **Simplicidad** | ¿Se entiende al instante, un solo mensaje? | ⚠️ Nota |
| 6 | **Craft** | ¿Está hecho brillantemente? (dirección de arte, copy) | Nota de mejora |
| 7 | **Atención cultural** | ¿Se va a comentar? ¿Tiene gravedad cultural? | Nota |
| 8 | **Piernas** | ¿Es campaña o es una sola pieza? ¿Escala en el tiempo? | Nota |

Solo se marcan gates 3-8 si 1 y 2 pasaron. Si 1 o 2 fallan, el output se detiene ahí con el
diagnóstico y una sugerencia de cómo arreglarlo — no se sigue evaluando craft de algo que no
tiene base.

### Paso 4 — Veredicto

Cada territorio termina en uno de tres estados:

- ✅ **PRESENTAR** — pasó los 8 gates, listo para cliente/CEO.
- 🔧 **DESARROLLAR** — pasó estrategia + idea, necesita trabajo en craft/frescura.
- 🛑 **DESCARTAR** — falló estrategia o idea.

## Gate obligatorio (STOP)

🛑 **Nunca marques un territorio como "PRESENTAR" sin que un humano lo haya aprobado.**
Esta skill produce el análisis y la recomendación — la aprobación final de creatividad es una
decisión de juicio alto (Human + Cowork), no una automatización. El output siempre incluye una
pregunta explícita de decisión al usuario cuando hay más de un territorio en estado ✅ o 🔧.

## Formato de salida

```markdown
## Territorios evaluados — [Proyecto]

### Territorio 1: [Nombre] — [✅ / 🔧 / 🛑]
[Estructura completa + gates 1-2 detallados + resto si aplica]

### Territorio 2: [Nombre] — [...]
...

### Recomendación
[Cuál llevarías a presentación y por qué, en 2 líneas]

### Decisión necesaria
¿Cuál territorio aprobás para pasar a craft final?
```

## QA

- ¿Cada gate tiene una respuesta explícita, no un "parece que sí"?
- ¿Ningún territorio con gate 1 o 2 en rojo tiene notas de craft?
- ¿La recomendación cabe en 2 líneas?

## Handoff

- Territorios ✅ o 🔧 → `cd-awards-rubric` (opcional, para benchmarking de ambición) y luego a
  aprobación humana.
- Una vez aprobado y con piezas reales → `gd-composition-critique` para la ejecución visual.

## Referencias
Framework de crítica inspirado en prácticas de revisión creativa de agencias como Wieden+Kennedy,
Droga5 y BBDO; test de la Gran Idea basado en Luke Sullivan, *Hey Whipple, Squeeze This*.
