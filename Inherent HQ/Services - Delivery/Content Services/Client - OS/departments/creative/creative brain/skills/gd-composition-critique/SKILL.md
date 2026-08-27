---
name: gd-composition-critique
description: "Evalúa o guía la creación de cualquier pieza de diseño gráfico (layout, publicación social, pieza de campaña, presentación, sistema visual) contra jerarquía visual, CRAP (Contraste/Repetición/Alineación/Proximidad), principios Gestalt, sistema tipográfico, sistema de grid y los 10 principios de Dieter Rams. ÚSALA SIEMPRE que el usuario pida crear, revisar o dar feedback sobre una pieza visual, diseño, layout, deck o sistema gráfico — incluso si solo pide '¿qué te parece este diseño?' o 'hazlo más lindo'. Corrige jerarquía primero, nunca da notas de pulido estético si el punto focal no está claro (squint test falla)."
---

# Crítica y Guía de Composición Visual

## Job

Convertir "no sé, algo se siente raro" en un diagnóstico específico y accionable sobre por qué
un diseño funciona o no funciona — y en qué orden arreglarlo.

## Cuándo se activa

- Se va a crear una pieza visual desde cero (usar como checklist de construcción).
- Se va a dar feedback sobre una pieza ya hecha.
- El usuario dice "hazlo más lindo/profesional/limpio" sin más especificación — ese pedido vago
  es justamente la señal de activar esta skill para encontrar el problema real.

## Input requerido

- El objetivo del diseño y la audiencia (si viene de `cd-strategy-brief`, úsalo).
- La pieza en sí (imagen, descripción, o el archivo).
- Sistema de marca del CLIENT-OS si existe (para no repetir trabajo que hace `gd-systems-qa`).

## Proceso — en este orden, sin saltar pasos

### Paso 1 — Enmarca antes de criticar

Antes de decir una sola palabra sobre el diseño, responde:
- ¿Cuál es el objetivo de esta pieza?
- ¿Quién la va a ver y en qué contexto (feed scrolleando, valla a 60km/h, PDF leído con calma)?
- ¿En qué etapa está (boceto, casi final, final)?

Sin esto, cualquier crítica es sobre gusto personal, no sobre si la pieza cumple su función.

### Paso 2 — Jerarquía visual (el gate más importante)

- **Squint test**: si desenfocás la pieza (entrecerrando los ojos), ¿el elemento más importante
  sigue dominando?
- **Test de 5 segundos**: ¿qué es lo primero que se entiende al verla una vez, rápido?
- Verifica que la jerarquía se construya con tamaño, peso, color/contraste, posición y espacio
  en blanco — no solo con "ponerlo más grande".

🛑 **Si la jerarquía falla, ese es el único problema que reportás primero.** No des notas de
tipografía, color o alineación todavía — un diseño con jerarquía rota no se arregla puliendo
detalles, se arregla rehaciendo qué elemento manda.

### Paso 3 — CRAP (una vez que la jerarquía pasa)

| Principio | Pregunta de diagnóstico |
|---|---|
| **Contraste** | ¿Los elementos que son distintos, se ven MUY distintos? (evitar la zona tibia de "casi iguales") |
| **Repetición** | ¿Se repiten color, forma, tipografía o espaciado para unificar la pieza? |
| **Alineación** | ¿Cada elemento tiene una conexión visual con algo más, o hay cosas "flotando" sin razón? |
| **Proximidad** | ¿Los elementos relacionados están agrupados como una sola unidad visual? |

### Paso 4 — Principios Gestalt (para explicar el "por qué")

Usa estos para justificar el diagnóstico de Paso 3, no como lista separada:
**Proximidad, Similitud, Cierre, Continuidad, Figura/Fondo, Simplicidad (Prägnanz).**
Ejemplo de uso: "el logo se pierde porque falla figura/fondo, no porque sea muy chico."

### Paso 5 — Sistema tipográfico

- ¿Hay una base y una escala consistente (no tamaños arbitrarios)?
- ¿Máximo 2-3 familias tipográficas?
- ¿Los roles están definidos (display, títulos, cuerpo, caption) con tamaño/peso consistente?
- Cuerpo de texto: interlineado ~1.4-1.6x el tamaño de fuente, medida de línea ~45-75 caracteres.

### Paso 6 — Grid y composición

- ¿Los elementos calzan en un grid definido (columnas, márgenes, gutters consistentes)?
- ¿Los puntos focales usan proporciones intencionales (regla de tercios, proporción áurea)?
- ¿El espacio en blanco es una decisión activa, o es "lo que sobró"?

### Paso 7 — Filtro Rams (restricción final)

Antes de cerrar, pregunta con los principios de Dieter Rams más aplicables a diseño de campaña:
- ¿Es entendible de un vistazo? (*makes it understandable*)
- ¿No estorba al mensaje? (*unobtrusive*)
- ¿Está cuidado hasta el último detalle? (*thorough to the last detail*)
- ¿Tiene el mínimo diseño necesario, sin decoración de más? (*as little design as possible*)

## Formato de salida

Usa el formato observación → interpretación → sugerencia, priorizando lo más grave primero:

```markdown
## Crítica de Diseño — [Pieza]

**Objetivo/audiencia confirmado:** [...]

### 🛑 Prioridad 1 — Jerarquía
Observo: [...]
Interpreto: [...]
Sugiero: [...]

### ⚠️ Prioridad 2 — CRAP / Gestalt
[Solo si Prioridad 1 pasa]

### Prioridad 3 — Tipografía / Grid
[Solo si 1 y 2 pasan]

### Filtro Rams
[Una línea: pasa / qué sobra]
```

## QA

- ¿Se reportó jerarquía antes que cualquier otra cosa?
- ¿Cada nota tiene observación + interpretación + sugerencia, no solo "esto no me gusta"?
- ¿Se evitaron notas de pulido si la jerarquía todavía está rota?

## Handoff

Una vez que la pieza pasa composición → `gd-systems-qa` para el chequeo final de marca y
producción antes de marcarla como entregable.

## Referencias
CRAP: Robin Williams, *The Non-Designer's Design Book*. Gestalt: psicología de la percepción
aplicada a diseño. Grid: Josef Müller-Brockmann, *Grid Systems in Graphic Design*.
Principios: Dieter Rams (Braun / Vitsœ).
