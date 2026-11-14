# Auditoría de la visión del Inherent OS

Base de revisión: `bb8188e`, rama de trabajo de la visión, 2026-11-13. Brief completo: `OS-IDEAL-MAC-IPHONE.md`. La auditoría distingue código existente, comportamiento probado y requisito terminado. Un mock o una entrada en el catálogo no equivalen a funcionalidad.

## Hallazgos que mandan el orden

1. **Finance no tiene todavía un límite duro de CEO.** `public/js/roleviews.js:69` permite `resumen` a otros roles mediante configuración; `api/index.js:685` devuelve la hoja CSV con un guard de área; `api/_lib/access.js:50` no incluye `finance` en CEO_READ. Se debe cerrar antes de ampliar dinero y capacidad.
2. **Existe una base funcional considerable, pero no el producto completo.** Tool Shell, versiones, criterios propios, gates Strategy/Ads, CRM, calendarios, OpenUI, voz y componentes de datos son reutilizables. El nombre de una herramienta antigua no prueba todos los módulos de §14.
3. **Faltan las uniones principales:** nodo común con fuentes/confianza, propagación del hilo, Decide unificado, catálogo de intención con acción final y motor durable compartido. Construir 34 pantallas encima de contratos distintos repetiría trabajo.
4. **Las posibilidades nativas se deben distinguir de contratos.** PWA existente no equivale a captura offline, Face ID, login externo de cápsula ni notificación con acción. El login actual depende de cookies del navegador; abrir Safari sin canje seguro no autentica el WebView.
5. **Hay documentación obsoleta.** La matriz de auditoría anterior contiene porcentajes a ojo y puntos marcados †. Se conservan como investigación inicial, nunca como prueba de cierre. `leer.js:20–22` ya filtra el caché `ads-*-tabla`; no se vuelve a reportar ese fallo como abierto.

## Evidencia y matriz

| Fuente | Cobertura | Límite |
|---|---|---|
| `auditoria-vision/01-plataforma.md` | Parte I, áreas, rituales, olas y riesgos | Inspección inicial estática; los † requieren comprobar código. Los porcentajes no certifican aceptación. |
| `auditoria-vision/01-matriz-plataforma.json` | Requisitos de la tabla de plataforma, con estado y criterio de aceptación | Separa implementación declarada y verificación; ningún requisito se marca probado por heredar un ✅. |
| `auditoria-vision/02-bibliotecas.md` | Cinco librerías §12, React/vanilla, Capacitor/plugins | Versiones y prueba real del navegador; no demuestra iPhone físico. |
| `auditoria-vision/03-producto.md` + `03-matriz-producto.json` | Motor, 34 herramientas/módulos, 12 componentes, ocho departamentos × cuatro capas | Estado del código real; cada hueco mantiene criterio de aceptación. |
| `PAQUETES-VISION.md` | Contratos, dependencias, ownership y prompts | Una propuesta de implementación no cuenta como entrega. |
| `DECISIONES-FABLE.md` | Nueve decisiones §9 y reversión | No inventa tarifas, recompensas, métricas aprobadas ni conexiones. |

## Qué se conserva

- Módulos ES, tokens `--ui-*`, `--fs-*`, `--r-*`, íconos, Zag/Floating UI y diálogos nativos.
- Tool Shell y funciones puras de herramientas: criterios, nulos, versiones, conflictos 409, destinos aprobados y exportaciones.
- Guard/scoper/leer como puerta de servidor, reforzados con invariantes del brief; no duplicar permisos en pantallas.
- Gates de Strategy y Ads y alcance por ficha; el estado `aprobado` recibido del navegador nunca concede permiso.
- OpenUI Lang y catálogo de acciones cerrado; extenderlo conserva una sintaxis de generación.
- CRM y tiempo de respuesta, motores de Avisos, calendarios y mapa de agentes; sus piezas alimentarán Decide y Hoy.
- Electron existente, adaptadores externos y voz con contexto. No reemplazar integraciones que ya funcionan por mocks nuevos.

## Diseño y experiencia

Skills solicitadas: Impeccable, UI Craft, Frontend Design y Liquid Glass Frontend no figuran instaladas en esta sesión. Se leyó `redesign-existing-projects` para el método de auditoría de una interfaz existente. Sus sugerencias estéticas se subordinan a la identidad y a los tokens del OS: no se cambian fuentes/paleta porque lo sugiera una receta genérica.

La revisión visual tiene cuatro condiciones de salida: claro/oscuro × escritorio/teléfono; recorrido de foco/teclado y objetivos táctiles; estados carga/error/vacío/ejecución; preferencias de movimiento/transparencia. Se conserva el fondo y la sidebar flotante redondeada. El pedido pendiente de quitar blur neón en modales y recuperar feedback de clic pertenece al paquete V1, no a un rediseño general.

Deuda confirmada: `primitives.css` mantiene capas históricas de tokens; `ui.js` ya ofrece menús/popovers/tooltip y diálogo con foco/escape. Conviene extender ese contrato, no crear otra familia de modales. Los movimientos heredados `--d-mueve` de 420/620 ms requieren revisión frente al máximo de 300 ms del brief. El refactor de `app.css` queda al final, después de verificar su resultado, para no mezclar mejora funcional y reorganización.

## Validación y límites

- Base: el integrador ejecutó `npm ci`, `npm test` y `npm run test:ui` en el worktree aislado con resultado satisfactorio antes de estos paquetes. Esto valida la base, no las funcionalidades faltantes.
- Cada paquete ejecuta las suites que afecta y `lint:css`; las capturas se guardan en `docs/capturas-vision/`. Las pruebas de seguridad usan PGlite aislada y proveedores simulados, sin base de producción.
- No se abrirá un PR ni se hará merge/deploy. El checkout principal con trabajo de otra sesión no se modifica.
- Lo externo realmente imposible se enumera como no verificado o sin conexión. Lo local aún no construido permanece pendiente; no se maquilla como bloqueo externo.
