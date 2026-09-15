---
name: pr-brief
description: >
  Capa 0 del método de Producción — verifica qué se aprobó producir antes de gastar un minuto en
  desglosar. Carga el Excel de ④ Creatividad (solo con Gate 3 aprobado), filtra las filas con handoff
  a producción, verifica fila por fila que sea producible, cruza contra el banco de assets para no
  volver a grabar lo que ya existe, y declara los tres techos: presupuesto, días y capacidad. Úsala
  al arrancar cualquier ciclo de producción, o cuando pidan "qué vamos a producir", "esto se puede
  grabar", "qué ya tenemos grabado". Bloquea si el Excel creativo no está aprobado.
---

# Capa 0 — Brief de Producción

Leé `agents/production/METHOD.md` sección **CAPA 0** completa. Plantilla:
`templates/brief-de-produccion.md`.

## Qué hacés
**Verificás.** No producís ni desglosás todavía. Confirmás que lo que llegó se puede producir, y
declarás lo que no.

## Pasos

1. **Cargá el contexto.** Los 4 inputs bloqueantes con ruta y estado. Falta uno → **BLOQUEADO**.
2. **Verificá el Gate 3.** Si el `ideas-de-contenido.csv` no está aprobado → **BLOQUEADO**. No se
   negocia: producir sobre ideas que pueden cambiar es gastar dos veces.
3. **Filtrá.** Solo las filas con `handoff = produccion-video` o `produccion-foto`. Las de
   `diseno-grafico` y `posting-directo` no pasan por Producción.
4. **Agrupá por `campana`.** El Excel se lee y se aprueba por campaña.
5. **Verificá producibilidad, fila por fila:**
   - `escenas`, `encuadres` y `duraciones` con el **mismo número de ítems y el mismo orden**
   - Cada escena declara **qué acción ocurre y en qué tipo de lugar**
   - La fila tiene `estetica_mood` y `emocion`
   Cualquier ❌ → sección F (devolución).
6. **Cruzá contra el banco de assets de ②B Branding.** Lo que ya existe se marca `reutiliza` y **no
   entra al desglose**. Si esta tabla queda vacía, el cruce no se hizo.
7. **Declará los tres techos** en números: presupuesto · días de rodaje · capacidad.
8. **Emití las devoluciones** con los tres elementos de `playbooks/DEVOLUCIONES.md`.

## Reglas duras
- 🛑 **Ninguna decisión creativa se cambia.** Ni una.
- 🛑 Si el ciclo excede un techo, el exceso se declara **en filas concretas**, nunca en general, y
  **nunca se recorta en silencio**.
- Una devolución sin dos alternativas concretas es un bloqueo, no una devolución.
- La respuesta de ④ a cada devolución se registra **con fecha**.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 0**, completo.

## Siguiente
→ `pr-desglose` (Capa 1)
