---
name: cd-strategy-brief
description: Construye y valida la base estratégica de cualquier trabajo creativo antes de generar conceptos. Extrae los 6 campos del brief (objetivo, audiencia, SMP, RTB, respuesta deseada, tono) y construye la cadena Verdad Humana → Tensión → Insight. ÚSALA SIEMPRE antes de generar un concepto, campaña, territorio creativo, idea publicitaria o pieza de branding — incluso si el usuario no pide explícitamente "un brief" o "una estrategia", y aunque solo pida "dame ideas para X". Si el brief está incompleto, esta skill DETIENE el proceso y señala exactamente qué falta en vez de inventarlo. Es el gate obligatorio de entrada antes de usar cd-concept-critique.
---

# Fundamento Estratégico (Brief + Insight)

## Job

Antes de que exista una sola idea creativa, tiene que existir un problema bien definido.
Esta skill no genera ideas — genera el terreno sobre el cual una idea puede evaluarse como
correcta o incorrecta. Sin esto, cualquier crítica creativa es solo opinión.

**No se salta este paso nunca**, aunque el usuario tenga prisa o solo pida "dame 5 ideas para
Instagram". Si no hay fundamento, el fundamento se construye primero — aunque sea en 60 segundos
con lo que ya se sabe del CLIENT-OS.

## Cuándo se activa

- El CEO o un departamento pide conceptos, campañas, ideas, territorios o ganchos creativos.
- Se va a evaluar un concepto ya generado (por Claude, por un humano, o por un tercero).
- Un Agente de Creative o Content necesita contexto antes de producir.

## Input requerido

Busca esta información en el orden siguiente:
1. **CLIENT-OS del cliente activo** (si estás en Cowork con acceso a repositorio): contexto de marca,
   briefs anteriores, posicionamiento ya definido.
2. **Lo que el usuario escribió en el mensaje actual.**
3. **Lo que falta**: pregúntalo explícitamente. No lo inventes ni lo asumas en silencio.

## Proceso

### Paso 1 — Completa los 6 campos del Brief

| Campo | Pregunta que responde | Regla |
|---|---|---|
| **Objetivo** | ¿Qué tiene que cambiar? (awareness, percepción, comportamiento, venta) | Debe ser medible o al menos observable |
| **Audiencia** | ¿A quién le hablamos? | Descrita como persona, no como demografía ("madres que vuelven a trabajar tras la licencia", no "mujeres 25-40") |
| **SMP (Single-Minded Proposition)** | ¿Cuál es LA única cosa que comunicamos? | Si necesitas "y" para describirla, no es una SMP — es dos |
| **RTB (Reason to Believe)** | ¿Por qué deberían creerlo? | Tiene que ser específico y verificable, no una afirmación vacía |
| **Respuesta deseada** | ¿Qué debe pensar/sentir/hacer la audiencia después? | Una acción o cambio de percepción concreto |
| **Tono / carácter de marca** | ¿Cómo suena la marca? | 3-4 adjetivos máximo, con guardrails ("seguro pero no arrogante") |

**Regla dura:** si un campo no se puede completar con lo que existe, se marca como
`⚠️ FALTA — [campo]` y se le pregunta al usuario. No se avanza a Paso 2 con más de un campo
crítico faltante (SMP y Audiencia son los dos no-negociables).

### Paso 2 — Construye la Cadena de Insight

```
Verdad Humana → Tensión → Insight → (la Idea viene después, en cd-concept-critique)
```

- **Verdad Humana**: una observación innegable sobre cómo la gente realmente piensa o se comporta
  (no un dato de categoría — un dato humano).
- **Tensión**: el conflicto dentro de esa verdad. Lo que la gente quiere vs. lo que se lo impide.
- **Insight**: una articulación fresca y útil de esa tensión que la marca puede resolver.

**Test del Insight — debe pasar los 3:**
1. ¿Se siente "obvio pero nunca dicho"? (si ya se dijo mil veces, no es insight, es cliché)
2. ¿Es incómodo o genuinamente cierto? (si es cómodo, probablemente es superficial)
3. ¿Solo esta marca puede resolverlo creíblemente? (si cualquier competidor podría decir lo mismo,
   no está anclado a la marca)

Si el insight falla 2 de los 3 tests, **no avances** — vuelve a la Verdad Humana y repite.

## Gate obligatorio (STOP)

🛑 **No pases a generar conceptos (cd-concept-critique) si:**
- Falta la SMP o la Audiencia.
- La SMP contiene más de una propuesta.
- El Insight no pasó el test de 3 criterios.

Cuando el gate bloquea, el output es una lista clara de qué falta y una pregunta directa al
usuario — nunca un concepto "de todos modos".

## Formato de salida

Usa siempre esta plantilla exacta:

```markdown
## Fundamento Estratégico — [Cliente / Proyecto]

**Objetivo:** [...]
**Audiencia:** [...]
**SMP:** [...]
**RTB:** [...]
**Respuesta deseada:** [...]
**Tono:** [...]

### Cadena de Insight
- **Verdad Humana:** [...]
- **Tensión:** [...]
- **Insight:** [...]
- ✅ Pasa test de insight (obvio-no-dicho / incómodo-cierto / solo-esta-marca)

### Estado
✅ Listo para concepting → continuar con cd-concept-critique
🛑 Bloqueado → falta: [lista de campos]
```

## QA

- ¿Cada campo del brief tiene una sola idea, no dos mezcladas?
- ¿El insight es una frase, no un párrafo? (si necesita más de 25 palabras, no está destilado)
- ¿Se puede repetir el insight de memoria después de leerlo una vez?

## Handoff

El resultado de esta skill es el **input obligatorio** de `cd-concept-critique`. Ningún
concepto se evalúa ni se presenta sin este documento adjunto. Si el proyecto vive en un
CLIENT-OS, este documento se guarda ahí como referencia para trabajo futuro del mismo cliente.

## Referencias
Basado en la estructura clásica de brief de account planning (Jon Steel, *Truth, Lies and
Advertising*) y en el modelo de insight por tensión usado en planning de agencia.
