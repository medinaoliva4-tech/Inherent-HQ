# Outputs — Agente de Video

Qué produce exactamente, y qué no.

---

## Los entregables

| # | Archivo | Fase | Gate | De dónde sale |
|---|---|---|---|---|
| 1 | `brief-de-video.md` | 0 | ✅ | Pedido + Strategy + Creative + Branding |
| 2 | `analisis-de-material.md` | 1 | — | `ffmpeg` sobre el material y las referencias |
| 3 | `plan-de-edicion.md` | 2-3 | ✅ | Brief + análisis + `DISCIPLINAS.md` + Story Cutter |
| 4 | `edit-decision-list.csv` | 3 | — | Los beats del plan, corte por corte |
| 5 | `_EXPORTS/*` (masters por plataforma) | 4 | — | La ejecución de las skills de craft |
| 6 | `qc-entrega.md` | 5 | ✅ | `qa/QC-GATES.md` corrido sobre el master |

Todos obligatorios. Un faltante se marca `BLOQUEADO` o `PENDIENTE` — **nunca se omite en silencio**.

---

## Cómo se encadenan

```
BRIEF          goal · runtime · plataforma · tono · guideline
   ↓           define qué estructura y qué métrica
ANÁLISIS       qué planos existen · momentos oro · huecos
   ↓           define qué es posible
DISCIPLINAS    las que el goal pide Y el material permite Y el runtime banca
   ↓           define qué skills corren
PLAN + EDL     hook · beats · retención · CTA · ritmo · orden de operaciones
   ↓           define qué se edita, corte por corte
EDICIÓN        v01 → v02 picture lock → v03 online → v04 master
   ↓           define qué se entrega
QC + ENTREGA   un export por plataforma + documento de QC + handoff
```

**Cada nivel reduce el espacio de decisión del siguiente.** Saltar del brief a la edición produce
cortes lindos que no cumplen el goal.

---

## Qué campo viene de dónde

| Campo del plan | Origen |
|---|---|
| Goal · runtime · plataforma · tono | Brief (Fase 0, gate humano) |
| Pilar · función · temperatura | **Strategy** — `estrategia-de-contenido.md` |
| Concepto · guion · ángulo | **Creative** |
| Tipografía · paleta · LUT · logo · sonotipo | **Branding** — `brand-guideline-video.md` |
| Planos disponibles · momentos oro · huecos | Análisis (Fase 1) |
| Ritmo objetivo (cortes/min) | Referencias descompuestas + plataforma |
| Hook · retención · CTA | Story Cutter (Fase 3) |
| Specs de export | `playbooks/ESPECIFICACIONES.md` |

Si un campo no tiene origen, **es una invención**. Se marca y se pide.

---

## Qué NO produce

| No produce | De quién es |
|---|---|
| Posicionamiento, pilares, calendario | **Strategy** |
| El concepto creativo o el guion original | **Creative** |
| La identidad visual, la paleta, el logo | **Branding** |
| Rodaje, dirección, casting, shot list de producción | **Production** |
| Publicación, programación, pauta | **Social Media / Media Buy** |
| Precio, oferta, funnel | **Growth** |
| Reporte de performance post-publicación | **Analytics** |

Video Editing llega hasta **master aprobado + versiones por plataforma**.

---

## Lo que vuelve del ciclo

```
Analytics (retención real) → qué hook funcionó · dónde cayó · si el CTA convirtió
   → actualiza el brief del próximo video
```

Un hook validado se reusa. Un hook que falló se registra como descartado para ese cliente.
