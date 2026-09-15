---
name: pr-rodaje
description: >
  Capa 5 del método de Producción — convierte las jornadas aprobadas en call sheets ejecutables: un
  documento por jornada con locación y dirección, horarios, contactos, orden de tiro escena por
  escena, requerimientos, cobertura obligatoria marcada aparte, riesgos del día con su plan B, y la
  nomenclatura de archivos definida antes de grabar. Úsala cuando pidan "armá el call sheet",
  "el plan del jueves", "a qué hora convocamos", "cómo nombramos los archivos". Requiere el
  presupuesto aprobado (GATE 1).
---

# Capa 5 — Plan de rodaje

Leé `agents/production/METHOD.md` sección **CAPA 5** + `toolkit/05-cobertura.md` y
`toolkit/07-entrega.md`. Plantilla: `templates/call-sheet.md`.

## Requisito
🚦 **GATE 1 aprobado.** Sin presupuesto aprobado no se convoca a nadie ni se reserva nada.

## Un call sheet por jornada, con todo esto
Encabezado (cliente · campaña · jornada · fecha · **dirección completa** · clima) · horarios
(llamado · primer tiro · comida · wrap) · **contactos con teléfono** · orden de tiro escena por
escena · requerimientos por escena · **cobertura marcada aparte** · riesgos del día con plan B ·
**nomenclatura**.

## La nomenclatura se define ACÁ
```
<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>
acme_instalacion_C-001_E2_video_t03.mov
```
Minúsculas, sin espacios, sin tildes. `id_creativo` y `escena` **exactos** — son la llave del cruce.
Toma con dos dígitos. Sufijo `_SELECT` en las buenas.

🛑 **Renombrar 400 archivos al final es cuando se pierde material** y cuando ⑥A o ⑥B reciben una
carpeta que no puede cruzar contra el Excel.

## Márgenes reales — sin esto no es un plan, es una lista de deseos

| Concepto | Margen |
|---|---|
| Montaje inicial | 60-90 min antes del primer tiro |
| Cambio de setup de luz | 30-45 min |
| Cambio de locación | 60 min + traslado real |
| Desmontaje | 45 min |

## Cobertura obligatoria — antes de desarmar cada setup
Segunda toma buena · wide de la escena · detalle/inserto · reacción o pausa · ambiente de la
locación (30 s, una vez). **10-15 min por escena.** Una vuelta a locación: una jornada.

🛑 **La cobertura al final del día es cobertura que no se hace.** Cuando el día se atrasa —y se
atrasa— lo último es lo primero que se cae.

## Convocatoria
El llamado del talento es **≥ 30 min antes de su primer tiro**, escalonado por bloque. Nadie espera
horas: llega cansado a su escena.

## 🚦 GATE 2
El plan de rodaje se aprueba **antes de convocar a nadie**.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 5**.

## Siguiente
→ `pr-entrega` (Capa 6)
