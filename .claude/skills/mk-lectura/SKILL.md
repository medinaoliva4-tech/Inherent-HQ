---
name: mk-lectura
description: >
  Fase M7 del método de Marketing — cierra el ciclo. Lee cada campaña contra la función que declaró
  antes de lanzar (marca, demanda, activación o retención), compara la distribución del objetivo
  planificada contra la real supuesto por supuesto, y define qué se itera en el ciclo siguiente
  cambiando una variable por vez. Úsala cuando pidan "funcionó la campaña", "cómo nos fue",
  "lectura del ciclo", "qué ángulo ganó", "revisemos los resultados de marketing". Nunca juzga una
  campaña de marca con ROAS, y nunca reclasifica una campaña después de ver el resultado.
---

# M7 — Lectura comercial

Leé `agents/marketing/METHOD.md` sección **M7**.
Plantilla: `agents/marketing/templates/lectura-comercial.md`
**Input obligatorio:** campañas cerradas + datos disponibles

## La regla que ordena la lectura

> Cada campaña se lee contra **su propia función**, nunca contra una métrica universal.
> **La función se declaró antes de lanzar y no se reinterpreta ahora.**

| Función | Se juzga con | NUNCA con |
|---|---|---|
| **Marca** | Share of search, recordación, asociación a CEP, cobertura | ROAS |
| **Demanda** | Búsquedas de marca, consultas, leads, tráfico calificado | Solo ventas inmediatas |
| **Activación** | Ventas, reservas, ROAS, tasa de cierre | Alcance |
| **Retención** | Recompra, frecuencia, ticket, referidos | Alcance de piezas nuevas |

**Los dos errores simétricos:**
- Juzgar una campaña de marca con ROAS → mata la única inversión que compone
- Llamar "de marca" a una campaña de activación que falló → no se aprende nada

## Lectura de la distribución (vuelve a M2)

```
Fuente · % planificado · % real · supuesto declarado · supuesto real · veredicto
```

Veredictos: `confirmado` · `optimista` · `pesimista` · `⚠️ no medible`

**Esto es lo que convierte la distribución de HIPÓTESIS en PLAN** para el ciclo siguiente.

## Regla de iteración

> **Se cambia una variable por vez:** hook · formato · CTA · audiencia · ángulo · canal · mecánica.
> Cambiar todo a la vez no produce aprendizaje, produce una campaña nueva.

## Salidas

| Hallazgo | Va a |
|---|---|
| Ángulo ganador y lenguaje literal nuevo | **Creative** + **Strategy** (actualiza objeciones) |
| Supuesto de conversión confirmado o roto | **Growth** |
| Fuente que no rinde o promesa que no sostiene | **⟲ RETORNO A ESTRATEGIA** |
| Activo distintivo que funcionó | **Branding** (se refuerza, no se reinventa) |

## Compounding

Cada campaña declara qué dejó: activo, lista, relación, prueba social, biblioteca, IP.
Una campaña sin nada que dejar se marca **no compounding** — el cliente tiene que saber que ese
esfuerzo no se capitaliza.

## Cierre
Correr el bloque **M7** de `agents/marketing/qa/QA-GATES.md`.
El ciclo vuelve a **M2** con la distribución actualizada.
