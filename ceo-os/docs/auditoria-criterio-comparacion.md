# Auditoría · aprendizaje por comparación en Inherent OS

## Decisión de producto

**Primera función útil:** dentro de *Creative Performance Analyzer*, la persona compara dos piezas publicadas de la misma marca y del mismo mes según «cuál conviene repetir». La decisión, su motivo y fecha se guardan en el entregable versionado por marca y mes. La misma herramienta se abre en Creative y en el panel de herramientas de Chat; no hay un segundo registro.

El ranking es una **hipótesis de preferencia humana**. Los ER y la línea base siguen separados y medidos por el OS. Ni una preferencia ni una correlación de ER prueban incremento causal en ventas, alcance o calidad. No se compara entre marcas. La IA puede proponer notas, pero no crear votos ni aprobar entregables.

## Teorías y uso concreto

| Idea | Qué responde | Aplicación en esta entrega | Límite |
|---|---|---|---|
| Elo / Bradley–Terry | ¿Qué opción se prefiere frente a otra? | Probabilidad `1/(1+10^((Rb-Ra)/400))`, actualización Elo de suma cero con K=24; empate cuenta como 0,5. | Ordena juicios, no resultados de negocio. El orden depende de qué pares se compararon. |
| Bayes | ¿Qué tan apoyada está una preferencia de un par específico? | Beta(1,1) sobre elecciones de ese par; la UI solo muestra el porcentaje posterior después de 3 comparaciones y siempre el tamaño de muestra. | No equivale a Glicko ni a una probabilidad de éxito comercial. |
| Exploración / bandits | ¿Qué conviene probar después? | Se sugiere el par menos comparado; entre empates, el de menos exposición y ratings más cercanos. | Es una regla de cobertura, todavía no un bandit: falta recompensa medida y asignación de exposición. |
| Experimentos A/B | ¿Qué variante causó un cambio? | **Pendiente:** instrumentar variantes, asignación aleatoria, métrica primaria, ventana y guardarraíles antes de mostrar impacto causal. | Sin aleatorización y suficiente muestra, no atribuir resultados. |
| Glicko / incertidumbre | ¿Cuán confiable es el rating global? | **Pendiente:** periodos, desviación de rating y reglas de inactividad; ahora cada opción muestra número de comparaciones y estado «provisional» bajo 5. | No llamar «confianza estadística» al conteo. |

Fuentes primarias: [Bradley y Terry, 1952](https://academic.oup.com/biomet/article-abstract/39/3-4/324/326091); [Glickman, Glicko](https://www.glicko.net/glicko/glicko.pdf); [Auer et al., bandits](https://www2.compute.dtu.dk/pubdb/pubs/2088-full.html); [Kohavi et al., experimentos online](https://www.microsoft.com/en-us/research/publication/online-experimentation-at-microsoft/).

## Auditoría de datos y flujo

- **Fuente:** `content` publicado del perfil activo; el analizador ya filtra por `profile`, estado y mes. Cada comparación solo acepta IDs que existen en ese entregable. Si se relee el mes, votos de piezas que desaparecieron se eliminan al limpiar.
- **Persistencia y permisos:** campo `comparaciones` dentro del contenido de `rendimientoCreativo`. Usa el `ToolShell` y su guardar, historial, permisos y aprobación existentes. El Chat monta ese mismo shell. Máximo 120 votos por entregable; exportación Markdown incluye el ranking, no el portal del cliente.
- **Interacción:** la persona escoge A, B o empate, puede anotar motivo y deshacer el último voto antes de guardar. La UI recomienda pares menos vistos para evitar repetir siempre el líder. No vota automáticamente a partir de ER ni de Laya.
- **Validación:** IDs únicos, opciones distintas, resultado permitido y pertenencia al conjunto de piezas; ratings recalculados desde el historial en cada lectura. Las métricas nunca se reemplazan por Elo.

## Próximo paso para convertirlo en ventaja real

1. Probar el flujo con un mes y una marca reales; observar si las comparaciones cambian decisiones concretas de piezas.
2. Definir una métrica primaria por objetivo (por ejemplo, leads calificados para captación) y registrar variante, audiencia, exposición, costo y fecha. No mezclar ER con ventas en un solo rating.
3. Hacer A/B con asignación aleatoria cuando el canal lo permita. Solo después usar recompensa observada para un bandit contextual que distribuya pruebas; mantener aprobación humana para publicar y gastar.
4. Si hay volumen suficiente, evaluar Glicko o un modelo jerárquico por marca, formato y contexto; calibrarlo contra decisiones y resultados fuera de muestra antes de recomendar automáticamente.
