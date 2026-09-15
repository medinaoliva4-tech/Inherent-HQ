---
name: ds-brief-de-pieza
description: >
  Capas D1 y D2 del método de Diseño — lee y VALIDA el calendario creativo (el plan de ejecución que
  produce Creative: formato, tamaño, foto sugerida, texto en jerarquía y goal del arte final por
  canal), lo convierte en la matriz `lote-de-piezas.csv` con estado de ejecutabilidad por fila, y
  produce un brief por pieza. Los campos de goal, mensaje y jerarquía se LEEN de Creative — no se
  inventan; lo que falta se devuelve. Úsala cuando pidan "leé el calendario de X", "qué piezas hay
  que diseñar", "armá el lote de este mes", "brief de esta pieza", "esto es diseñable?", o antes de
  abrir Figma para cualquier pieza. Requiere el sistema visual (D0) hecho.
model: sonnet
effort: medium
---

# D1-D2 · Lote y Briefs

Leé `agents/design/METHOD.md` → D1 y D2. Requiere `sistema-visual.md` aprobado.
Plantillas: `templates/lote-de-piezas.csv` y `templates/brief-de-pieza.md`.

## Regla madre

**No armás el lote: lo leés y lo validás.** El calendario creativo es el plan de ejecución que
produce Creative a partir de su research.

```
Creative define el goal y la jerarquía del MENSAJE.
Diseño valida que sea ejecutable y resuelve la jerarquía VISUAL.
```

🛑 **Nunca completes un campo bloqueante por inferencia.** Se devuelve con la pregunta exacta.

---

## D1 · Lectura del lote

### Regla 1 — Mapear, no asumir
Las columnas del Excel del cliente rara vez se llaman igual. **Declará el mapeo antes de procesar:**
```
MAPEO — "Fecha publicación"→fecha · "Red"→canal · "Tipo"→formato · "Objetivo"→goal ·
        "Texto principal"→nivel_1 · "Bajada"→nivel_2 · "Foto"→asset_base …
Columnas del origen sin destino: [x] · Columnas nuestras sin origen: [x]
```

### Regla 2 — Una fila = una pieza entregable
Un carrusel de 8 slides es **una** fila con `slides=8`. No ocho.

### Regla 3 — Fila incompleta ≠ fila borrada
Se conserva con `estado_diseno` y el motivo exacto.

### El contrato con Creative
| Falta | Estado |
|---|---|
| Canal o formato | 🛑 `BLOQUEADO — sin destino` |
| **Goal del arte final** | 🛑 `BLOQUEADO — sin goal` |
| **nivel_1** (texto en jerarquía) | 🛑 `BLOQUEADO — sin jerarquía de mensaje` |
| CTA en pieza de goal `vender` / conversión | 🛑 `BLOQUEADO — conversión sin CTA` |
| Asset base (foto) | 🟡 `PENDIENTE — resuelve tipográfica` — se puede avanzar |
| Traza al calendario | 🟡 se marca y se consulta |

### Cabecera obligatoria — se reporta antes de seguir
```
LOTE — Cliente: [x] · Período: [x] · Piezas: [n] · Ejecutables: [n] · Bloqueadas: [n]
Canales: [x] · Formatos: [x] · Assets faltantes: [n] · Devoluciones a Creative: [n]
```

🛑 **Si más del 30% está bloqueado: parar y devolver el lote a Creative.**

---

## D2 · Brief de pieza

Uno por pieza ejecutable. **Media carilla.**

| # | Campo | Quién decide |
|---|---|---|
| 1 | **Goal de la pieza** | Creative |
| 2 | **Mensaje único** — una oración | Creative |
| 3 | **Jerarquía del mensaje 1-2-3** | Creative |
| 4 | **Componente / layout base** — de D0.7, con porqué y descartados | Diseño |
| 5 | **Cómo se logra visualmente la jerarquía** — ≥2 de: tamaño, contraste, área, posición | Diseño |
| 6 | **Par de color** — de la matriz D0.2, **con el ratio escrito** | Diseño |
| 7 | **Presupuesto gráfico** — máx. 3 familias, cada una con rol (un animado cuenta como una) | Diseño |
| 8 | **Restricciones del canal** — safe areas, slides, seamless, densidad si es pauta | Diseño |

### Reglas duras
- **Mensaje único de una oración.** Si el brief trae dos ideas, **son dos piezas** → se devuelve.
- 🛑 **Diseño no reordena los niveles.** Si no entran en el formato, se marca `⚠️ OBSERVADO` con la
  propuesta y se pregunta.
- **Máximo 1 color de acento**, marcando **una** cosa.
- **Cortes de línea del titular escritos**, por unidad de sentido.

### Si el brief creativo no es ejecutable
| Situación | Qué hacés |
|---|---|
| El nivel 1 tiene 14 palabras y el formato es story | Proponés el corte a ≤8 y **preguntás** |
| La foto sugerida no existe o no llega al piso | `⚠️ ASSET INSUFICIENTE` → Production |
| El goal pide CTA y no hay CTA | 🛑 devolución a Creative |
| La idea no cabe en el formato asignado | Proponés otro formato **con el motivo** |

### Estado del brief creativo — se declara siempre
```
✅ Ejecutable  ·  🛑 BLOQUEADO — [qué falta]  ·  ⚠️ OBSERVADO — [qué propongo y por qué]
```

---

## Cierre

Corré los bloques D1 y D2 de `qa/QA-GATES.md`. Siguiente: `ds-composicion` (D3).
