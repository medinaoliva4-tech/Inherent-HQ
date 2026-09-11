---
name: pr-jornadas
description: >
  Capa 2 del método de Producción — agrupa las escenas desglosadas en jornadas de rodaje, que es
  donde se gana o se pierde el presupuesto. Agrupa por locación, talento, setup de luz y producto,
  ordena el tiro por costo de cambio, verifica que cada jornada entre en el día y declara el factor
  de consolidación. Úsala cuando pidan "en cuántos días se graba esto", "agrupá estas escenas",
  "armá las jornadas", "por qué cuesta tanto producir este ciclo". Es obligatoria antes de
  presupuestar. Requiere el desglose de Capa 1 hecho.
---

# Capa 2 — Consolidación

Leé `agents/production/METHOD.md` sección **CAPA 2** + `playbooks/CONSOLIDACION.md` **completo**.
Plantilla: `templates/plan-de-jornadas.md`.

## Por qué esta capa existe
Desglosar es mecánico: cualquiera lo hace igual. **Agrupar es donde se decide si el ciclo cuesta X o
4X.** Lo caro de una producción no son las tomas: son los montajes.

## Pasos

1. **Armá la matriz completa** del ciclo — todas las escenas juntas. Los patrones solo aparecen
   mirando todo a la vez, nunca leyendo fila por fila.
2. **Agrupá por los 4 ejes, en este orden:**
   - **Locación** — el costo fijo más grande. Todo lo del mismo lugar, el mismo día
   - **Talento** — se paga por jornada, no por toma
   - **Setup de luz** — rearmar cuesta 30-45 min; cambiar óptica, 5
   - **Producto** — lo destructivo va último en su bloque, con respaldo
3. **Poné las escenas sin rodaje en `J0`** (capturas, placas, composiciones de post). **No cuentan
   para el factor.**
4. **Ordená el tiro por costo de cambio**, no por orden narrativo. La **cobertura** va antes de
   desarmar cada setup, **nunca al final del día**.
5. **Verificá que entre en el día**, con los márgenes de `toolkit/04`: montaje + escenas + cambios de
   setup + comida + desmontaje.
6. **Declará el factor:** `escenas de rodaje ÷ jornadas de rodaje`.

## Umbrales

| Carga de jornada | Qué hacer |
|---|---|
| ≤ 10 h | ✅ viable |
| 10-12 h | ⚠️ se saca la escena de menor traza a otra jornada |
| > 12 h | 🔴 **se parte en dos. No se comprime** |

| Factor | Lectura |
|---|---|
| < 4 | Mal agrupado, o el Excel creativo pide locaciones dispersas |
| 4-10 | Normal |
| > 10 | Muy eficiente — verificar que entre en **horas**, no solo en papel |

## Reglas duras
- 🛑 **Ninguna decisión creativa se cambia para lograr el agrupamiento.**
- Antes de convocar a alguien dos veces: ¿la escena se resuelve como **voz** (otro día, más barato) o
  como **manos**? Se **propone a ④ como devolución**, nunca se cambia solo.
- Si el factor es < 4 por dispersión del Excel creativo, se **devuelve a ④ con números y
  alternativas** (Paso 6 del playbook), no con un "no se puede".
- 🛑 Una jornada de 14 h en papel es una jornada de 10 h en la que la última mitad no se grabó.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 2**.

## Siguiente
→ `pr-recursos` (Capa 3)
