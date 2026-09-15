# Plan de Edición — [Cliente] / [Proyecto]

> Fases 2-3 · 🚦 Gate humano · Es el **contrato** de la edición. Lo que no está acá, no se edita.

**Fecha:** · **Goal:** · **Runtime:** · **Plataforma(s):** · **Tono:**

---

## A · Disciplinas elegidas (Fase 2)

| # | Disciplina | Skill | Qué aporta a ESTE video | Tiempo est. |
|---|---|---|---|---|
| | | | | |

### Descartadas y por qué
| Disciplina | Por qué queda afuera |
|---|---|
| | el goal no la requiere / el material no la permite / el runtime no la banca |

---

## B · Story Cutter

### HOOK (0:00-0:03)
| | |
|---|---|
| Tipo | [uno de los 8] |
| Candidato 1 | |
| Candidato 2 | |
| Candidato 3 | |
| **Elegido** | [x] — porque [x] |
| Plano | [TC del material] |
| Promesa explícita | "…" |
| Primer frame (miniatura) | [TC] — qué se ve |

### RETENTION
| Beat | TC objetivo | Función | Herramienta | Qué estímulo cambia |
|---|---|---|---|---|
| | | | open loop / re-hook / escalada / prueba / pausa | plano / sonido / gráfica / ritmo |

| | |
|---|---|
| Open loops abiertos | … → se cierran en TC … |
| Caída prevista en | TC … → re-hook: … |
| Re-hook cada | [3-5s social · 20-30s YouTube] |

### CTA (últimos 3-5s)
| | |
|---|---|
| Acción única | |
| Hablado | "…" |
| En pantalla | "…" |
| Último frame | qué se ve, cuánto dura (≥1.5s, nunca negro) |

**Un solo CTA.** Si hay dos, se elimina uno acá.

---

## C · Estructura de beats

| # | Beat | Función | Duración | Plano (TC fuente) | Qué dice | Qué se ve | Traza al goal |
|---|---|---|---|---|---|---|---|
| 1 | HOOK | | 0:00-0:03 | | | | |
| 2 | | | | | | | |
| n | CTA | | | | | | |

**Total:** [x] seg vs. runtime objetivo [x] seg → ✅ entra / ⚠️ sobra [x] seg

🛑 **Cada beat se traza al goal.** El que no se traza, se elimina acá y no en la timeline.

---

## D · Ritmo objetivo

| | |
|---|---|
| Cortes por minuto objetivo | |
| Duración media de plano | |
| Dónde acelera | |
| Dónde respira | |
| Speed ramps / jump cuts | |
| Sincronía con música | beat cuts en … |

---

## E · Brand guideline aplicado

| Capa | Especificación |
|---|---|
| Color / LUT | |
| Tipografía (familia, pesos, tamaños) | |
| Paleta | |
| Captions (estilo, posición, resaltado) | |
| Logo (dónde, cuándo, cuánto, clear space) | |
| Sonotipo / música | |
| Safe areas | superior 150 / inferior 420 / derecha 150 px (9:16) |

---

## F · Orden de operaciones

| # | Paso | Skill | Estado |
|---|---|---|---|
| 0 | Ingesta y sincronía | — | ⬜ |
| 1 | Corte narrativo → **PICTURE LOCK** | `vd-story-cutter` | ⬜ |
| 2 | Ritmo | `vd-ritmo-social` | ⬜ |
| 3 | B-roll | `vd-broll` | ⬜ |
| 4 | VFX / compositing | `vd-vfx` / `vd-motion` | ⬜ |
| 5 | Color | `vd-color` | ⬜ |
| 6 | Audio (voz → SFX → mezcla) | `vd-audio` | ⬜ |
| 7 | Motion graphics y captions | `vd-motion` / `vd-captions` | ⬜ |
| 8 | Master y export | `vd-entrega` | ⬜ |

**No se altera el orden.** Nunca color antes del picture lock; nunca captions antes del color.

---

## G · Material generado *(si aplica)*

| Plano | Por qué no existe en el material | Cómo se genera | Declarado al cliente |
|---|---|---|---|
| | | Higgsfield / stock / re-filmación | ✅ |

**Nunca se genera una persona real, un testimonio ni una demo de producto.**

---

## H · Riesgos

| Riesgo | Impacto | Plan B |
|---|---|---|
| | | |

**Si el deadline no entra:** se recorta disciplina según `DISCIPLINAS.md § Regla de recorte`.
**Nunca se recorta QC.**

---

## 🚦 GATE 2 — Aprobación del plan

| | |
|---|---|
| Estado | ⬜ Pendiente / ✅ Aprobado / 🔁 Con cambios |
| Aprobó | |
| Fecha | |
| Cambios pedidos | |
