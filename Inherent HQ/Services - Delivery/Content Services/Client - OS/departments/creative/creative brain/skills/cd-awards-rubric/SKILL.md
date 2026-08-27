---
name: cd-awards-rubric
description: Puntúa un concepto o campaña ya desarrollada contra los criterios reales de Cannes Lions (Idea / Ejecución / Estrategia / Impacto), el estándar de craft de D&AD (nivel Pencil) y la estructura de efectividad de Effie (Challenge → Insight → Idea → Resultados). ÚSALA cuando el usuario quiera saber qué tan ambicioso, premiable o defendible comercialmente es un trabajo, antes de presentarlo a un cliente grande, antes de decidir cuánto invertir en producción, o cuando pregunte directamente "¿esto es lo suficientemente bueno?" / "¿esto ganaría algo?". Es diagnóstica y de benchmarking — nunca aprueba ni rechaza por sí sola; la decisión final es siempre humana.
---

# Benchmark de Ambición Creativa (Cannes / D&AD / Effie)

## Job

Responder, con criterio de industria y no con opinión, la pregunta que todo CEO se hace antes
de invertir presupuesto: **¿esto es bueno de verdad, o solo nos gusta a nosotros?**

Esta skill no reemplaza la crítica de `cd-concept-critique` — se usa después, sobre trabajo que
ya pasó esos gates, para calibrar nivel de ambición.

## Cuándo se activa

- El concepto ya pasó `cd-concept-critique` con veredicto ✅ o 🔧.
- El usuario pregunta directamente por potencial de premios, nivel de craft, o si el caso de
  negocio es defendible.
- Antes de una presentación importante a cliente (Human + Cowork territory).

## Input requerido

- El territorio/concepto ya estructurado (idealmente desde `cd-concept-critique`).
- Si existen, los objetivos medibles del brief (de `cd-strategy-brief`) — necesarios para el eje
  Effie.

## Proceso

### Eje 1 — Cannes Lions (Idea / Ejecución / Estrategia / Impacto)

Puntúa cada eje del 1 al 10, con una razón de una línea por número:

| Eje | Pregunta | Score (1-10) |
|---|---|---|
| **Idea** | ¿Qué tan original y ownable es el concepto central? | |
| **Ejecución** | ¿Qué tan bien está resuelto en craft (visual, copy, producción)? | |
| **Estrategia** | ¿Qué tan sólida y clara es la lógica que conecta insight → idea? | |
| **Impacto** | ¿Qué tan probable es que genere resultado real, no solo aplausos? | |

Identifica cuál eje es el más débil — ese es el que hay que trabajar antes de invertir más.

### Eje 2 — Estándar D&AD (nivel de craft)

No es una puntuación numérica — es una pregunta de calibración honesta:

> "¿Este trabajo llegaría a un nivel Yellow Pencil de craft y originalidad, o es simplemente
> competente?"

D&AD es célebre por **no entregar premios cuando el nivel no se alcanza** — usa ese mismo
estándar de exigencia. Responde con una de estas tres:
- **Competente** — cumple, no destaca.
- **Sobresaliente** — el nivel de craft sería notable en el mercado.
- **Rompedor** — daría de qué hablar más allá del cliente.

### Eje 3 — Caso de Efectividad Effie

Verifica que el trabajo pueda sostener las 4 partes de un caso de efectividad real:

1. **Challenge, Contexto y Objetivos** — ¿están definidos y son medibles?
2. **Insight y Idea Estratégica** — ¿ya está resuelto en `cd-strategy-brief`?
3. **Cómo cobra vida** — ¿la idea se manifiesta en creatividad Y en medios, o solo en creatividad?
4. **Resultados** — ¿existe forma de medir el efecto y aislarlo de otras variables?

Marca cada parte ✅ / ⚠️ / 🛑. Si la parte 4 no tiene forma de medirse, señálalo — es el punto
ciego más común y el que más le cuesta a una agencia frente a un cliente exigente.

## Gate obligatorio (STOP)

🛑 Esta skill **nunca dice "aprobado" o "rechazado"**. Entrega números, un diagnóstico del eje
más débil, y una recomendación de una línea. La decisión de invertir presupuesto o presentar al
cliente queda con el CEO o el Director Creativo humano.

## Formato de salida

```markdown
## Benchmark de Ambición — [Territorio]

### Cannes (1-10 por eje)
- Idea: X/10 — [razón]
- Ejecución: X/10 — [razón]
- Estrategia: X/10 — [razón]
- Impacto: X/10 — [razón]
**Eje más débil:** [...]

### Nivel D&AD
[Competente / Sobresaliente / Rompedor] — [por qué]

### Caso Effie
1. Challenge/Objetivos: [✅/⚠️/🛑]
2. Insight/Idea: [✅/⚠️/🛑]
3. Cómo cobra vida: [✅/⚠️/🛑]
4. Resultados medibles: [✅/⚠️/🛑]

### Recomendación
[1-2 líneas: qué mejorar antes de invertir más, o "listo para presentar"]
```

## QA

- ¿Cada score tiene una razón, no solo un número?
- ¿El eje más débil quedó explícito, no enterrado en el detalle?
- ¿Se evitó dar un veredicto de aprobación/rechazo?

## Handoff

→ Human + Cowork (aprobación final) o de vuelta a `cd-concept-critique` si el diagnóstico revela
que hay que reforzar craft o estrategia antes de avanzar.

## Referencias
Basado en criterios públicos de juzgamiento de Cannes Lions International Festival of Creativity,
la jerarquía de Pencils de D&AD Awards, y la estructura de entrada de Effie Awards.
