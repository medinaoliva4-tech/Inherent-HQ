---
name: pr-loop
description: >
  Capa 7 del método de Producción — cierra el ciclo con datos reales: desvío de costo, desvío de
  tiempo, material grabado que nadie usó, factor de consolidación real vs. previsto, y la corrección
  de la capacidad declarada en ① Comprensión. Actualiza los tiempos y costos de referencia del
  toolkit para que el próximo ciclo se estime con dato y no a ojo. Úsala cuando pidan "cómo nos fue",
  "cerrá el ciclo", "cuánto nos pasamos", "qué grabamos que no se usó". Requiere costo_real cargado.
---

# Capa 7 — Loop

Leé `agents/production/METHOD.md` sección **CAPA 7**. Plantilla:
`templates/aprendizaje-de-produccion.md`.

## Qué mide
**Ejecución**, no resultado creativo ni de negocio. Si una pieza no funcionó, eso lo lee ④
Creatividad en su propia Capa 7.

## Las cuatro lecturas

| Lectura | Pregunta | De dónde sale |
|---|---|---|
| **Desvío de costo** | ¿Qué ítems se pasaron, y cuánto? | `costo_estimado` vs `costo_real` |
| **Desvío de tiempo** | ¿Qué escenas llevaron más de lo estimado? | `tiempo_estimado_min` vs real |
| **Material no usado** | ¿Qué se grabó y ⑥A nunca usó? | Cruce con lo publicado |
| **Consolidación** | ¿El factor fue el previsto? ¿Dónde se perdió? | `plan-de-jornadas.md` vs real |

🛑 **`costo_real` tiene que estar cargado en todas las filas**, aunque coincida con el estimado. Sin
eso se pierde la mitad de la muestra y el próximo ciclo se estima a ojo otra vez.

## El material no usado es el hallazgo más valioso
Si más del 30 % de lo grabado no se usó, el problema **no está en producción**: el Excel creativo
pidió cobertura que la pieza final no necesitaba.

Se devuelve a ④ Creatividad **como dato, no como reclamo**: qué se grabó y no se usó · qué patrón se
repite · qué se propone para el próximo ciclo. En dos ciclos baja el costo sin bajar la calidad.

## La corrección de capacidad → ① Comprensión
La capacidad declarada en ① es una **estimación que nadie corrige nunca**. Producción es el único
departamento con el dato real.

🛑 **Se redacta como propuesta.** Producción **nunca edita el archivo de otro departamento**.

## Lo que sube al toolkit
Los márgenes, tiempos y costos reales actualizan las tablas de `toolkit/`. **Un tiempo estimado que
falló tres ciclos seguidos deja de ser estimación y pasa a ser dato.** Ese es el mecanismo por el que
el departamento mejora sin que nadie lo decida.

## Sin datos
`⚠️ SIN DATOS` + a quién pedírselos. 🛑 **Ningún desvío inventado.**

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 7** + **Coherencia global**.
