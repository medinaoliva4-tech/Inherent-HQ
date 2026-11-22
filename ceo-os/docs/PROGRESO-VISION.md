# Progreso de la visión del OS

> **Para retomar si la sesión se corta.** Brief: `docs/OS-IDEAL-MAC-IPHONE.md`. Rama: `fable/os-vision` (sin PR, sin tocar `main`).
> Auditoría: `docs/auditoria-vision.md` y `docs/auditoria-vision/`. Decisiones tomadas por el CEO: `docs/DECISIONES-FABLE.md`.
> Capturas: `node scripts/capturas-vision.mjs <rutas> <prefijo>` (con `npm run dev` corriendo) → `docs/capturas-vision/`.

## Reanudación supervisada · 2026-11-13

- Worktree aislado: `/Users/rodrigomedina/.codex/worktrees/os-vision-integracion/Inherent-HQ`, base `bb8188e`. El checkout principal tiene trabajo ajeno y no se toca.
- Arquitectura inicial: Astra. El CEO pidió continuar con Sol alto para ahorrar créditos; ambos encontraron el límite de gasto de la cuenta. La integración sigue en este worktree sin repetir auditorías.
- Plan ejecutable y criterios: `PAQUETES-VISION.md`. Decisiones §9: `DECISIONES-FABLE.md`. Índice de auditoría: `auditoria-vision.md`.
- Prioridad: cerrar una sola auditoría → Finance/alcance → componentes reutilizados/nodos/Decide → ejecución durable/P0 → resto → nativo/pulido/refactor/video/cierre. No repetir auditorías ni ampliar pruebas sin una razón concreta.
- `npm ci`, `npm test` y `npm run test:ui` de base pasaron, ejecutados por el integrador. Cada entrega añade evidencia propia; la base no certifica la visión.
- Reservados por el integrador: `public/app.css`, `public/js/ui.js`, `public/js/app.js`, `public/js/tema-boot.js`, `public/sw.js`, `public/manifest.webmanifest` (pulido de modales/sidebar/clic y Ola 0).
- A2: `probes/vision-libraries/` + `docs/auditoria-vision/02-*` (librerías y prueba React Flow), revisada.
- A3: `docs/auditoria-vision/03-*` (34 herramientas, módulos, componentes y capas), revisada. S0/S1 cerraron los fallos de seguridad hallados.
- Ninguna función nueva se marca terminada hasta revisar diff, prueba y captura. Las limitaciones de iPhone/Xcode/servicios en vivo quedan separadas de trabajo local pendiente.

## Pedidos del CEO (en orden de llegada)

1. La misión original: Parte I (Olas 0–8), app nativa `ios/`, Parte II (motor Intent-to-Interface, 12 componentes, 34 herramientas, 4 capas), diseño §17, decisiones §9 sin preguntar, informe final.
2. **Voz:** revisar el diálogo de voz para que se use **con el contexto** (marca, pantalla, día del ciclo).
3. **Funciones backend** (capturas de ChatGPT): Job Queue, Durable Workflows, Rate Limit Manager, Approval Engine, Credential Vault, Event Bus, Agent Runtime, Execution Logs, Retry & Recovery, Compliance Layer e **idempotencia**. Y las ideas de ejecución (Outreach Command Center, Sales Agent, Market Intelligence, Content Factory, Cross-Department Orchestrator; Campaign Optimization, Onboarding Autopilot, Meeting-to-Execution, Revenue Recovery): entran como workflows sobre ese motor, **siempre con aprobación humana** para enviar, publicar o gastar.
4. **Laya en el backend:** usar Laya como criterio de las funciones backend y **mostrar qué le está dando Laya** (su «insight») a la vista.
5. **Refactor del código:** hoy trabajar en el repo quema muchos créditos (archivos gigantes, mapa atrasado). Partirlo para que sea barato de leer.
6. **Al terminar: un video** que lo explique todo.

## Paquetes y estado

Estado: ⬜ pendiente · 🟡 en curso · ✅ hecho y verificado · 🔶 hecho, no verificable desde Linux · ⛔ bloqueado (ver nota)

| # | Paquete | Depende de | Estado | Nota |
|---|---|---|---|---|
| A | Auditoría A1/A2/A3 (plataforma, producto, librerías + iOS) | — | ✅ | Matrices 01/03 y prueba React Flow A2 conservadas; V1 tiene revisión visual separada |
| B | Este plan + decisiones §9 | A | ✅ | PAQUETES-VISION.md y DECISIONES-FABLE.md |
| S0 | Finance solo CEO y aislamiento de marcas | A | ✅ | 8 escenarios API/PGlite; revisión de servidor completada |
| S1 | Política común y aprobación exacta de tools externas | S0 | ✅ | 10 escenarios API/PGlite + UI; concurrencia de capacidad se valida en B2/T3 |
| 1 | Kit: los 12 componentes compartidos (`public/js/kit/`) + página de ejemplos + pruebas | A | ✅ | 12 interactivos en demo sintética; DecisionCard en aprobación S1; otras integraciones quedan en T1–T7 |
| 2 | Modelo de nodo y hilo del cliente (API + canvas) | 1 | 🟡 | Servidor y lógica ✅ (`hilo.js`, `GET /api/hilo`, 11 pruebas): nodos = entregables, revisión de descendientes, traza al ICP. Falta pintarlo con el lienzo (kit `VisualCanvas`). |
| 3 | Motor backend: cola, workflows durables, aprobaciones, bus de eventos, bitácora, reintentos, idempotencia, límites, cumplimiento | A | 🟡 | Motor ✅ (`workflow.js` + rutas, 18 pruebas): leases, idempotencia, reintentos seguros, aprobación sobre hash, cumplimiento, límites, bitácora sin secretos, outbox. Falta: Workflow Builder (UI), agendar `avanzar` (cron), Credential Vault y adaptadores reales (Zernio/Meta dicen «sin conexión»). |
| 4 | Laya como criterio del motor + panel «lo que dice Laya» | 3 | ⬜ | |
| 5 | Ola 0: PWA pulida, tema automático, barra inferior de 5 puertas, sin conexión | — | 🟡 | Tema y caché estático (Fable) + **barra de 5 puertas en el teléfono ✅** (D10). Faltan snapshots sin conexión y cola de captura. |
| 6 | Ola 1: «Decide», tarjeta de entregable con Escalar, push con acción *(passkeys/Face ID: quitado por el CEO)* | 1, 3 | 🟡 | «Decide» ✅ (`#/decide`, `GET /api/decide`, 14 pruebas): aprobar/pedir cambios/escalar con versión, criterios bloquean, 1 por vez en el teléfono. Falta **push con acción** (necesita la cuenta de US$99). **Passkeys/Face ID: fuera por decisión del CEO.** |
| 7 | Ola 2: franja del ciclo 1→20, Hoy reordenado, `⌘K` con acciones | 1 | 🟡 | Franja del ciclo ✅ (`ciclo.js`, 11/20 firmes, huso Guatemala), Hoy muestra franja + 3 decisiones ✅. Falta `⌘K` con acciones y reordenar el resto de Hoy por fase. |
| 8 | Motor Intent-to-Interface (clasificador + catálogo + cierre con acción) | 1 | 🟡 | Motor ✅ (`llm/intent.js`, 9 pruebas): entender → elegir del catálogo cerrado → simplificar → cerrar con acción; rechaza inyecciones; prompt en el Chat. Falta enrutar automáticamente la respuesta del modelo por `armar()` (hoy guía el prompt). |
| 9 | 8 departamentos + 34 herramientas (primero las 10 P0) sobre el kit | 1, 2, 8 | ⬜ | |
| 10 | 4 capas por departamento (Portal con SOPs del rol · Tools · Agents · Decisions) | 9 | ⬜ | |
| 11 | Ola 3: modos iPhone (rodaje, captura, cola sin conexión) | 5 | ⬜ | |
| 12 | Ola 4: bandeja única de Community + CRM con anillo de 60 s | 1 | ⬜ | |
| 13 | Ola 5: hilo visual + criterios como lista de verificación | 2 | ⬜ | |
| 14 | Ola 6: portal con enlace firmado de un solo uso + presentación del día 20 | 6 | 🟡 | Enlace de un solo uso ✅ (`portal-aprobaciones.js`, `aprobar.html`, 10 pruebas, validado en navegador): hash, fragmento `#t`, lista permitida, caduca/revoca/cambia de versión. Falta la presentación del día 20. |
| 15 | Ola 7: Finanzas (solo CEO), capacidad y «cuántas cuentas aguanto» | 1 | ⬜ | |
| 16 | Ola 8: «mensajes mínimos», modo concentración, atajos | 7 | ⬜ | |
| 17 | Voz con contexto | 8 | ⬜ | |
| 18 | `ios/`: cápsula nativa + login con Google fuera del WebView + guía de 6 pasos | 6 | 🔶 | `ios/` ✅ Capacitor 8 (SPM, sin CocoaPods), esquema `inherent://`, permisos en español, pantalla sin red, `npm run ios:instalar`, `LEEME.md` de 6 pasos; **login con Google fuera de la web** (código de un uso + PKCE, 10 pruebas). **No verificado:** compilar en Xcode, firma e instalación real, Face ID físico. |
| 19 | Diseño §17: auditoría, Liquid Glass acotado, microinteracciones | 5–16 | 🟡 | modal/sidebar/clic y paleta neutra verificados; faltan flujos de paquetes restantes |
| 20 | Refactor para gastar menos (partir `app.css`, mapa al día, código muerto) | al final | ⬜ | se hace al final para no chocar con los paquetes |
| 21 | Video explicativo | todo | ⬜ | |
| 22 | Informe final + repaso del MD punto por punto | todo | ⬜ | |

## Bitácora

- 2026-11-13 · Rama creada. Pruebas base (`npm test`) pasan. OS local corre. Script de capturas listo. Auditoría 01 (plataforma) escrita.
- 2026-11-13 · Dos subagentes se cortaron por el límite de gasto de la cuenta; reanudados cuando el CEO avisó «listo ya».
- 2026-11-14 · S0 implementado y probado en API: `roleviews` impide habilitar Finance fuera del CEO; `guard`/`guardAny` y `CEO_READ` rechazan rutas Finance y sus colecciones incluso con matriz adulterada. `finance_sheet`/`pricing` privados, caché `sources/ads-*-tabla` solo CEO, `area_notes` y escrituras/traslados de contenido respetan marca y ocultan personal. Evidencia: `node scripts/test-vision-seguridad.mjs` → 7 escenarios con PGlite efímero y API real, CEO/COO/team/client, sin red. Revisión visual de navegación pendiente del integrador; no se considera avance de herramientas ni de Finance funcional.
- 2026-11-14 · S1: política única `content-reglas.js` + adaptador `content-policy.js` conectados al guardado UI genérico, API, MCP y paso Plan→Ideas. Ficha obligatoria; para agendar/producir, origen de versión aprobada con cadena hasta ICP de la misma marca; brief revalidado aun dentro del mes; día 11 y techo de piezas. UI permite elegir el origen. Se conserva la idea sin fecha como hipótesis (no producción). La validación del techo de un lote sucede antes de crear ninguna pieza; la serialización entre productores concurrentes queda para B2/T3 y no está certificada aquí.
- 2026-11-14 · S1: `ia/agente` prepara una propuesta cifrada, ligada a actor/alcance/catálogo/parámetros/hash/versión y caducidad. Confirmación humana explícita antes de `tools/call`; CAS impide doble ejecución; respuesta perdida = `resultado_desconocido`, sin reintento ciego. Catálogo desconectado/cambiado y tool desconocida se rechazan. No se usaron servicios reales. Evidencia: `node scripts/test-vision-candados.mjs` → 9 escenarios API/PGlite con adaptadores falsos explícitos, incluido recorrido real propuesta→aprobación API→tool falsa y carrera de aprobaciones; S0 sigue 7/7. `npm test`, `test-produccion-p2.mjs` (15), `test-marketing-cal.mjs` (19) y `test-herramientas.mjs` (50) pasan.
- 2026-11-14 · S1 UI: `node scripts/test-vision-candados-browser.mjs` → selector de origen y revisión de acción funcionan en navegador real con HTTP falso explícito; 8 capturas `s1-{origen,aprobacion}-{dia,noche}-{1440,390}.png`, 2x, movimiento reducido, sin errores de página. No certifica integración en vivo. Enter del wizard ya no salta pasos al enfocar una card; probado en los cuatro casos y por el integrador. La auditoría completa de las herramientas y los paquetes K1/B1/B2 siguen pendientes.
- 2026-11-14 · Revisión S0/S1: `guardAny` usa el mismo predicado para área y profundidad; leer Clients no presta permiso de escritura de Finance heredado. La política nueva de contenido y las acciones externas ya no exceptúan `inherent`: con alcance asignado hace falta asignación explícita. Pruebas adversarias añadidas: S0 8/8, S1 10/10.
- 2026-11-22 · Retomado sin Fable (límite de gasto). B1 (hilo), P1 (Decide), P3 (franja en Hoy), I1 (Intent-to-Interface), N1+P2 (cápsula iOS + login nativo), B2 (motor de workflows) y M3 (aprobación por enlace). Pruebas: `npm test`, `test:ui`, `test:herramientas`, `test:llm`, `test:openui`, `test:capacidades` y las `test:vision-*` pasan. D10: vuelve la barra inferior del teléfono.
- 2026-11-14 · K1: 12 componentes separados, lienzo React Flow cargado bajo demanda con lista alternativa, página `/kit.html` con datos sintéticos explícitos. `DecisionCard` reutilizada en la aprobación real de acciones externas con versión/hash exactos. `node scripts/test-kit-browser.mjs`: cuatro combinaciones día/noche y 1440/390, teclado/44 px/nulos/espera/error/CSP, ocho capturas 2x. `node scripts/test-vision-candados-browser.mjs` sigue pasando. Esto no certifica las 34 herramientas.
- 2026-11-14 · Se eliminaron cafés remanentes de tarjetas de portada, diana de audiencias, visualizaciones de contenido, enlaces/íconos y variables oscuras. Capturas `neutral-final-home-{dia,noche}-{1440,390}.png`; `npm test` y `npm run test:ui` pasan. Se conserva el fondo oscuro y la barra flotante.
- 2026-11-22 · Revenue (búsqueda por frase + lote visual), Agentes (catálogo + constructor con límites), Hoy (tablero en una vista), Studio dentro de Áreas, ideación, contexto vivo, canales y Lead Engine integrados; UI pulida por un agente Opus con `DISENO-REFERENCIAS.md`. Suite completa verde. Pendiente: pantallas de Sala del cliente, Canales y Workflow Builder; conexiones reales (correo, redactor, scraping, modelo de agentes).
