# QA · 🔴 el primero a construir

**Etapa 07.** Revisa cada pieza antes de que salga.

## Propósito
**Que ninguna pieza llegue al cliente sin pasar por un criterio.** Marca, mensaje, formato,
ortografía y consistencia con la estrategia.

## 🔴 Por qué bloquea todo el modelo

A **204 piezas al mes** en Compound, el QA humano es cerca de **un minuto por pieza**.
**Sin este agente el volumen prometido no es entregable y el margen no cierra.**

## ⛔ El problema a resolver primero

**No tiene MCP definido — y sin acción no hay agente.**
Esa es la regla número uno del repo: *un agente no puede hacer nada que su MCP no permita.*

**Antes de escribir su workflow hay que decidir con qué revisa.**

## Lo que tendría que poder hacer

| Acción | Con qué | |
|---|---|---|
| Leer la pieza generada | por definir | ⛔ |
| Compararla contra la plataforma de marca | Strategy + Notion | ⬜ |
| Analizar video | Higgsfield `video_analysis_create` | ⬜ |
| Predecir viralidad antes de publicar | Higgsfield `virality_predictor` | ⬜ |
| Devolver la pieza a su etapa con la corrección | por definir | ⛔ |
