---
name: vd-plan
description: >
  Fases 2 y 3 del método de Video — elige qué disciplinas de edición necesita esta pieza (de las 14
  del catálogo) y convierte brief + material en un plan de ejecución con beats, Story Cutter
  (hook/retención/CTA), EDL corte por corte, ritmo objetivo, brand guideline por capa y orden de
  operaciones. Úsala cuando pidan "armá el plan de edición", "qué necesita este video", "cómo lo
  editamos", "qué disciplinas aplicamos", o antes de tocar la timeline. Requiere brief aprobado y
  análisis de material hechos. Es el contrato de la edición y tiene gate humano.
---

# Fases 2-3 — Disciplinas y Plan de Edición

**Leé completos antes de empezar:**
- `agents/video/DISCIPLINAS.md` — las 14 disciplinas y qué skill las cubre
- `agents/video/playbooks/STORY-CUTTER.md` — hook, retención y CTA
- `agents/video/METHOD.md § FASE 3` — orden de operaciones

**Plantillas:** `plan-de-edicion.md` + `edit-decision-list.csv`
**Requiere:** `brief-de-video.md` ✅ aprobado + `analisis-de-material.md`. Si falta uno: **BLOQUEADO**.

## Fase 2 — Elegir disciplinas

```
Disciplina elegida = (el goal la requiere) Y (el material la permite) Y (el runtime la banca)
```

| Núcleo (casi siempre) | Según el caso |
|---|---|
| Narrativa · Ritmo · Audio/voz · Color | Captions · B-roll · Motion · Sound design · Social · VFX · Compositing |

Cada elegida con **qué aporta a ESTE video**. Cada descartada **con motivo escrito**.

## Fase 3 — El plan

| Bloque | Qué produce |
|---|---|
| **Story Cutter** | 3 hooks candidatos → 1 elegido · beats de retención · CTA único |
| **Beats** | Nombre · función · duración · plano fuente · qué dice · qué se ve · traza al goal |
| **Ritmo objetivo** | Cortes/min · duración media de plano · dónde acelera y respira |
| **EDL** | Una fila por corte en `edit-decision-list.csv` |
| **Brand guideline** | Color, tipografía, captions, logo, sonido, safe areas |
| **Orden de operaciones** | Los 9 pasos, sin alterar |
| **Tiempos y riesgos** | Estimación por disciplina + plan B |

## Orden de operaciones — no negociable

```
0 ingesta → 1 corte narrativo → PICTURE LOCK → 2 ritmo → 3 b-roll → 4 vfx/compositing
→ 5 color → 6 audio → 7 motion + captions → 8 master
```
Colorear antes del picture lock = rehacer todo. Captions antes del color = texto que no matchea.

## Reglas duras

- 🛑 **Cada beat se traza al goal.** El que no se traza, se elimina **acá**, no en la timeline.
- 🛑 **Un solo CTA.** Si hay dos, se elimina uno en el plan.
- **3 hooks candidatos, uno elegido con motivo.** Nunca uno solo "porque sí".
- **La suma de beats entra en el runtime.** Si sobra, se recorta en el plan.
- **Todo open loop tiene timecode de cierre.**
- **Re-hook en la cadencia de la plataforma:** 3-5s social · 20-30s YouTube.
- **El último frame no es negro.** Marca + CTA, ≥1.5s.
- **Material generado con IA se declara** en la EDL como `[GENERADO — <herramienta>]`, con el
  motivo de por qué no existe el plano real. Nunca se genera una persona, un testimonio ni una demo.
- **Si el deadline no entra:** se recorta disciplina según `DISCIPLINAS.md § Regla de recorte`.
  **Nunca se recorta QC.**

## Cierre

Correr los bloques **Fase 2** y **Fase 3** de `qa/QC-GATES.md`.

🚦 **GATE 2 — Plan aprobado.** El gate más importante: todo lo que sigue cuesta horas de render.

## Handoff
→ `vd-story-cutter` y las skills de craft, en el orden de operaciones.
