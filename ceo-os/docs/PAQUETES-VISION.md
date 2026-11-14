# Paquetes ejecutables de la visión

Fecha: 2026-11-13. Brief: `OS-IDEAL-MAC-IPHONE.md` completo. Estado vivo: `PROGRESO-VISION.md`. Este documento define contratos de entrega, no certifica funcionalidades terminadas.

## Regla de integración

Cada paquete entrega diff completo, pruebas ejecutadas, recorrido real y capturas claras/oscuras en 1440 y 390 px con `deviceScaleFactor: 2`. El revisor abre las capturas y revisa el código antes de aceptar. Las regresiones o requisitos incompletos vuelven al mismo agente con una corrección escrita. No se cuenta un título, enlace, formulario o mock como herramienta funcional.

Un propietario por archivo compartido: `api/index.js`, `public/js/app.js`, `package.json`, `package-lock.json` y `MAPA.md` se integran secuencialmente. Los agentes trabajan en módulos nuevos o zonas asignadas y entregan instrucciones de conexión cuando no son dueños del archivo. No hay PR, merge, deploy ni cambios en producción. No se modifican `CLAUDE.md`, `inherent/`, `agents/` ni `PENDIENTES.md`.

## Contratos comunes

**Nodo de resultado.** `{ id, client_slug, type, tool_id, estado, fuente, confianza, viene_de, version, contenido, criterios, execution }`. Estado de conocimiento: `hipotesis | aprobado`; revisión de descendientes es un campo separado. Cada origen guarda `id` y versión aprobada. `fuente` es una lista con tipo, referencia, fecha y texto verificable; confianza incluye método/limitación, no solo un porcentaje. No se reescriben las versiones aprobadas.

**Interfaz elegida.** `{ intent, catalog_version, component, props, evidence, next_action }`. `component` y `next_action.id` pertenecen a catálogos cerrados. Validación antes de renderizar; HTML, scripts, URL arbitraria y acciones inventadas se rechazan. OpenUI Lang sigue siendo el único lenguaje que genera la IA. El contrato interno no crea una segunda sintaxis para prompts.

**Acción.** `{ id, node_id, expected_version, idempotency_key, params }`. El servidor vuelve a comprobar sesión, rol, alcance/ficha, criterios, dependencias y gate. Aprobar queda unido a hash/versión/alcance exactos. Una edición invalida una aprobación previa. Una repetición no duplica tarea/envío/pago. Cuando una respuesta de proveedor se pierde, el estado es `resultado_desconocido`, no reintento ciego.

**Adaptador externo.** `capability()`, `prepare()`, `execute(approval)`, `reconcile()`; retorna `disconnected | needs_permission | ready` con razón real. Las pruebas inyectan adaptador falso explícito. La UI nunca ofrece «enviado» si solo se preparó un borrador.

**Vacíos y números.** `null` significa dato ausente, no cero. Cada herramienta dice qué sabemos, qué puede hacerse, qué hay que decidir y qué sigue. Pronósticos declaran supuestos/rango; correlaciones y preferencias nunca se llaman causales.

## Orden, propiedad y aceptación

| ID | Paquete / archivos propios | Depende | Aceptación medible |
|---|---|---|---|
| A1 | Auditoría plataforma actualizada / `docs/auditoria-vision/01-*`, matriz plataforma | — | Todos los puntos Parte I tienen evidencia de código y prueba pendiente o aprobada; se eliminan porcentajes estimados como criterio de cierre. |
| A2 | Bibliotecas + prueba React / `probes/vision-libraries/`, `docs/auditoria-vision/02-*` | — | Versiones/licencias/actividad de las cinco librerías §12 + Capacitor/plugins con fuentes oficiales y fecha; React Flow real en navegador, evento hacia vanilla, CSP y tamaño documentados. |
| A3 | Producto / `docs/auditoria-vision/03-*` | — | 34 herramientas con cada módulo, 12 componentes, 32 celdas departamento/capa y motor auditados contra código, sin confundir nombres con implementación. |
| S0 | Seguridad base / `api/_lib/access.js`, `leer.js`, `public/js/roleviews.js`, rutas puntuales secuenciales | A1 | CEO permitido; COO/team/client denegados en TODAS las superficies Finance aun con matriz adulterada. Aislamiento de marcas/area_notes; no filtrar gastos desde sources. Pruebas API en PGlite con roles adversarios. |
| S1 | Candados comunes / módulo puro de reglas y adaptadores de `mcp.js`, `ia.js` | S0 | Crear pieza/agendar desde UI, API genérica y MCP aplica misma ficha, origen, brief y día 11. Tools/call peligroso exige aprobación exacta; tool desconocida no corre. |
| K1 | Kit único / `public/js/kit/`, `public/kit.css`, página de prueba | A2,A3 | Doce componentes exportados y usados; Simulator cambia resultados vivos; Research muestra fuentes/confianza; Decision/Approval actúan por callbacks; Workflow/Canvas muestran dependencias; Compare/Explorer conservan nulos; Timeline, Assistant, History, Execution tienen estados reales. Teclado, 44 px, reducido movimiento/transparencia, foco, sin overflow. |
| B1 | Modelo de nodos e hilo / `api/_lib/nodos*.js`, `public/js/nodos*.js` | S0,K1 | CRUD no destructivo, control de versión 409, mismo cliente en cada arista, DAG sin ciclos, solo entrada aprobada; editar ancestro marca todos los descendientes, no otras marcas. Trazado pieza→ICP visible. |
| B2 | Motor durable / `api/_lib/workflow-*.js`, `gateway/workflows*.mjs` | S1,B1 | Cola persistente + leases, recuperación al reiniciar, versiones de workflow, dependencias, bus/outbox, logs sin secretos, límites por proveedor, cancelación, aprobación ligada a versión, reintentos solo seguros, idempotencia. Pruebas de carrera con dos workers y caída entre efecto y confirmación. |
| B3 | Criterio Laya / adaptador `workflow-criterio*.js`, panel propio | B2 | Laya propone evidencia/criterio y se ve su insight; ausencia = sin conexión. Nunca concede aprobación, cambia permisos ni sustituye criterios deterministas. |
| P0 | PWA / `sw.js`, `manifest.webmanifest`, `tema-boot.js`, preferencias pequeñas | S0 | Cascarón instalable, tema automático sin flash, cache solo estáticos versionados y snapshots autorizados por usuario. Logout purga datos; cuenta B no ve A. Sin red se muestra qué es copia y pendiente de subir. |
| P1 | Decide + entregables / `api/_lib/decide*.js`, `public/js/decide*.js`, `screens/decide.js` | K1,B1,B2 | Fuente única por rol; 3 decisiones en Hoy/1 móvil; prioridad 11/20; Aprobar/Cambios/Escalar revalida servidor; criterios del manual bloquean Listo; 409 no pisa cambios; vacío humano. |
| P2 | Passkeys y login externo / `api/_lib/auth-native*.js`, `api/_lib/passkeys*.js`, integración secuencial auth | S0 | Challenge corto, origen/RP verificados por librería mantenida, vínculo de usuario, contador cuando aplica, anti-replay. Google abre navegador sistema; código de un uso + PKCE canjeado dentro del WebView, nunca token en URL/log. Pruebas sesión equivocada, expiración y replay. |
| P3 | Hoy/ciclo/comandos / `ciclo-pulso.js`, `screens/home.js`, `search.js`, integración shell | K1,P1 | Día local correcto 1–31, 11/20 firmes; orden de 6/12/19/20 probado; ⌘K encuentra marca+acción sin ejecutar sin permiso. Contexto de marca se limpia al cambiar; ⌘1…9 y chat contextual conservan marca/pieza/día. |
| I1 | Intent-to-Interface / `llm/intent*.js`, catálogo, puente específico | K1,B1,B2 | Ejemplos de explorar/decidir/producir/revisar/aprobar/medir seleccionan catálogo cerrado; resultado validado y acción final real. Inyección y componente/acción ajenos se rechazan. Evidencia e incertidumbre visibles. Respuesta se pliega con mensajes mínimos. |
| T1 | P0 Strategy: Blueprint/ICP/Acquisition/Offer / módulos `strategy/` asignados | I1 | Reutiliza funciones existentes; simuladores vivos, puntaje reproducible, escenarios y evidencia; Growth no altera oferta; reparto aprobado a otros departamentos preserva versiones y gates. |
| T2 | P0 Creative/Marketing: Brief/Campaign/Performance / módulos distintos | I1 | Brief traza a ICP/oferta; campaña estima rangos y capacidad; dashboard solo métricas reales con fuente/modelo atribución; pasa aprobado a Production; publicar/pauta no ejecutan solos. |
| T3 | P0 Production/Sales/Operations: Planner/Pipeline/Workflow / módulos distintos | I1,B2 | Planner bloquea exceso/día 11, pipeline tiene siguiente paso/cronómetro/forecast con rango; editor de workflow crea y ejecuta una definición persistente con aprobación y recuperación. |
| T4 | Strategy restante + Creative restante | T1,T2 | Market sizing explícito, canvas de mensajes, matriz puntuable, guion/escenas/versiones, Figma estado real, anotación coordenada y aprobación. Todos los módulos de §14 #3,6,8–11; no solo prompts. |
| T5 | Marketing restante + Production restante | T2,T3 | Radar filtros/evidencia; Calendar techo/autorizar; Paid Media gates; Shot List set; edición cortar/timeline/audio/captions/export local o adaptador real con estado; repurposing variantes reales; assets derechos/versiones. §14 #12,14,15,18–21. |
| T6 | Sales restante + Intelligence | T1,T3 | Matching/puntajes explicables; secuencias borrador con envío aprobado; playbook/objecciones; forecast rangos; BI definiciones; A/B aleatorio e incertidumbre; insights trazables a métricas. §14 #22,23,25–29. |
| T7 | Operations restante + Finance | T3,S0 | Proyectos/dependencias/hitos; capacidad por rol sin inventar tarifas; cashflow/escenarios y rentabilidad solo CEO. §14 #31–34. |
| D1 | Ocho departamentos × cuatro capas / catálogo y shell departamental | T1–T7 | Portal objetivos/progreso/SOP solo rol, Tools funcionales, Agents con acciones conectadas, Decisions filtradas y workflow encima. 32 celdas con recorrido y autorización comprobados. |
| M1 | Rodaje/captura / `screens/rodaje.js`, `production/rodaje*.js`, cola IndexedDB propia | P0,P3 | Cronómetro pausa/reanuda estable; toma buena/repetir; cámara ligada a escena; offline+reinicio conserva captura; reconnect reconcilia sin duplicar ni cruzar cuenta/marca; medidor de cobertura y horas. |
| M2 | Community/CRM / `community-*.js`, adaptador proveedor, `ventas-respuesta.js` | B2,P1 | Bandeja por permiso/marca, clasifica y propone desde ficha; envíos humanos. Cronómetro de 60 s con hora servidor y primera respuesta persistida. Sin integración: borrador/sin conexión, nunca enviado. |
| M3 | Portal/presentación / `api/_lib/portal-aprobaciones*.js`, `portal-presentacion*.js` | P1,P2,B1 | Token hash de un uso/versión/recurso/caducidad, revocable; replay y cruce cliente 403/410; allowlist sin costos/horas/notas; dos acciones sin login; día 20 con piezas reales y métricas limpias. |
| M4 | Mensajes mínimos/concentración/voz/rituales | P3,I1 | Preferencia persistida, conclusión breve, una acción; ⌘⇧F entra/sale y devuelve foco; hablar usa marca/pieza/día/hilo; cierre y lunes respetan DND sin enviar nada en pruebas. |
| N1 | Cápsula Apple / `ios/`, script `ios:instalar` | A2,P2,M1 | Proyecto listo, carga URL permitida, ASWebAuthenticationSession/PKCE, puentes necesarios y contratos honestos, secretos fuera, guía exacta de 6 pasos; lint/typecheck/sync y pruebas posibles. Xcode/Face ID físico/firma/APNs se declaran sin probar cuando corresponda. |
| V1 | Pulido integral / cambios visuales asignados por archivo | paquetes visuales | Modales sólidos sin neón, sidebar flotante redondeada y fondo conservados; clic visible; cards/chat sin pérdida de foco ni salto; AA/44px; 4 capturas por flujo + movimiento/transparencia reducidos. |
| R1 | Refactor económico + mapa | todos | Dividir archivos enormes sin cambiar comportamiento; mantener importaciones/rutas; actualizar MAPA con realidad; tests de áreas afectadas. No reorganizar antes de integrar para evitar conflictos. |
| C1 | Video + cierre | todos | Video local recorre versión final sin secretos; informe abre con pendientes reales, ≤10 líneas de acciones del CEO, pruebas/capturas, no verificable/mock, decisiones reversibles, riesgos. Matriz sin requisito falso aprobado. |

## Prompt base para agentes económicos

> Trabaja solo en `[REPO]`, paquete `[ID]`, archivos `[OWNERSHIP]`. Lee los cimientos y las secciones `[BRIEF]`; inspecciona el código, no confíes en MAPA como prueba. Usa lo existente y los contratos de `PAQUETES-VISION.md`. Implementa todos los criterios `[ACCEPTANCE]`, con estados vacío/error/espera/éxito, nulos honestos y permisos de servidor. No hagas PR/push/merge/deploy, no uses producción, no envíes/publiques/gastes, no toques archivos protegidos ni ajenos. Antes de sumar librería verifica versión/licencia/mantenimiento. No escribas un catálogo decorativo: demuestra una interacción real y salida utilizable. Entrega diff completo, archivos, comandos con resultados, capturas 2x de claro/oscuro 1440/390, limitaciones y cómo se integra. Si algo falta, continúa lo independiente y registra el contrato como mock/sin conexión. No declares completo hasta pasar cada criterio. Vuelve a mí para revisión.

## Corrección y aceptación

1. Revisor compara cada criterio con código, API y UI; no acepta solo tests que repitan implementación.
2. Corrección concreta: `[criterio] → [observación reproducible] → [cambio requerido] → [prueba que debe pasar]`.
3. El agente corrige en su zona; revisor lee diff incremental y repite solo el recorrido afectado.
4. Se actualiza matriz, progreso y MAPA. `hecho` exige evidencia; `mock`, `pendiente` y `no verificable` son estados distintos.
