# Auditoría de producto · §10–18

**Repositorio auditado:** `ceo-os/`. Contraste de implementación en código con `OS-IDEAL-MAC-IPHONE.md`; los nombres/estados del catálogo no cuentan como prueba de software funcional.

**Resultado:** la base es una aplicación web con módulos reales y algunas reglas valiosas; no es aún el producto de 8 departamentos descrito. La matriz contiene **34 herramientas evaluadas módulo por módulo, 12 componentes compartidos, 32 celdas departamento/capa, 4 controles del motor** y 2 excepciones de seguridad/scope: [03-matriz-producto.json](03-matriz-producto.json). No hice cambios de código ni corrí pruebas.

## Cinco hallazgos prioritarios

1. **P0 · Finance no es CEO-only en el servidor.** `finance` no está en `CEO_READ` ([access.js:50](../../api/_lib/access.js:50)); `GET /api/finance/sheet` verifica solo pertenencia al área y devuelve hasta 2 MB del CSV completo ([api/index.js:685](../../api/index.js:685)). La matriz fuerza `finanzas: resumen` para perfiles no CEO ([roleviews.js:67](../../public/js/roleviews.js:67)), pero eso es una vista, no autorización de los endpoints. El perfil de cobros puede acceder al resumen; no debe recibir la hoja financiera completa. **Criterio de cierre:** el servidor niega los datos Finance completos a cualquier rol distinto de CEO, incluso con matrices heredadas o manipuladas.
2. **La estructura de 8 departamentos × 4 capas no está montada.** El producto navega cinco workspaces y comparte modos de Chat; Sales, Intelligence, Operations y Finance están en pantallas tradicionales separadas ([herramientas.js:65](../../public/js/herramientas.js:65), [screens/workspace.js:49](../../public/js/screens/workspace.js:49)). Las celdas del JSON identifican lo reutilizable y lo ausente por departamento/capa.
3. **Los 34 nombres no son 34 herramientas equivalentes.** El registro tiene 42 herramientas de cinco workspaces ([herramientas.js:154](../../public/js/herramientas.js:154)). Varias implementaciones son útiles, pero el estado `lista` solo indica que se monta una vista; no prueba adquisición de datos, cálculos, módulos propios, investigación con fuentes, ejecución ni integraciones del §14. No existe equivalencia directa para Positioning & Messaging Canvas, Sales Playbook, Revenue Forecast, Experiment Lab o Workflow Builder.
4. **Intent-to-Interface es orientación del prompt, no un motor.** OpenUI pide al modelo escoger patrones de presentación ([genui.js:49](../../public/js/llm/genui.js:49)); el Chat renderiza el bloque y limita acciones con un registro cerrado. No hay clasificación explícita de intención → selección de interfaz → contrato de datos/permiso → ejecución. El detalle está separado en I01–I04.
5. **Evidencia y confianza no son contrato común.** Algunas vistas sí exigen fuente o muestran `SIN DATOS`; el catálogo OpenUI define componentes genéricos ([genui.js:13](../../public/js/llm/genui.js:13)), pero no obliga a fuentes/confianza por afirmación ni a un nodo con procedencia/estado en todas las herramientas. Los módulos y propuestas de IA no sustituyen datos verificables o un simulador.

## P0 · orden de trabajo

1. **Cerrar Finance en servidor** (lecturas de colecciones y `finance/sheet`), preservar resumen mínimo solo si la política lo permite; cubrir perfiles heredados. Documentar aparte la excepción del slug `inherent` y decidir su allowlist ([entregables.js:107](../../api/_lib/entregables.js:107)).
2. **Fijar contratos de dato y autorización:** fuente, confianza, hipótesis/aprobado, nulos honestos, cliente/scope, alcance contratado, quién aprueba y qué acción queda auditada. Un formulario o prompt no satisface el módulo que declara.
3. **Completar la cadena comercial P0 de §8:** Business Blueprint → ICP Builder → Acquisition Simulator → Offer & Pricing Builder → Creative Brief Builder → Campaign Builder → Production Planner → Sales Pipeline → Marketing Performance Dashboard, conectados por datos aprobados y alcance real.
4. **Entregar Workflow Engine** con dependencias, autorización humana, reintentos/recuperación y versionado. Debe conectar la cadena, no solo mostrar el FLUJO.
5. **Reutilizar después los 12 componentes y las 8×4 capas** sobre las pantallas existentes. Construir cada componente una vez y demostrar uso común; no convertir etiquetas del registro en aceptación de producto.

## Paquetes independientes para implementar

- **S0 Seguridad Finance:** guard CEO en todas las rutas/lecturas financieras; resumen separado y mínimo para cobros, si se conserva. Prueba con COO, cobros, equipo, cliente y matriz antigua.
- **S0b Scope y datos internos:** confirmar acceso al slug `inherent`; cerrar cualquier excepción que no tenga allowlist explícita. El JSON anota la ruta sin mezclarla con Finance.
- **S1 Contrato de evidencia/decisión:** esquema común fuente/confianza/estado/scope/aprobador; nulidad visible; acciones con confirmación y registro de resultado.
- **S2 Motor de workflow:** entradas y salidas versionadas, dependencias, gates y recuperación; conectar herramientas existentes primero.
- **S3 Cadena P0 de Strategy y Creative:** los primeros seis módulos comerciales, aprovechando módulos puros ya existentes y cerrando brechas por módulo.
- **S4 Ejecución y aprendizaje:** Production Planner, Sales Pipeline, Performance Dashboard y medición; demostrar el cierre del ciclo completo.
- **S5 Capas y componentes:** formalizar ocho departamentos y montar componentes reutilizados por uso real.

## Evidencia y límites

- Cada fila de la matriz incluye estado (`existe`, `parcial` o `falta`), archivo/línea, comportamiento observado, brecha comprobable y criterio de aceptación.
- Se evaluaron los módulos reclamados en §14 contra vistas, modelos y rutas disponibles; cuando el repo solo presenta formulario, prompt, etiqueta o ruta de montaje, se registra como brecha, no como simulador/software.
- La seguridad positiva observada también cuenta: las rutas de entregables verifican área, alcance, ficha, rol y estado de estrategia en servidor ([entregables.js:99](../../api/_lib/entregables.js:99)); OpenUI escapa contenido y valida acciones ([genui.js:3](../../public/js/llm/genui.js:3)). Eso no vuelve universales esas reglas fuera de sus rutas.
