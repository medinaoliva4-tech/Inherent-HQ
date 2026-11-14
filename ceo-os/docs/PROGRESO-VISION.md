# Progreso de la visión del OS

> **Para retomar si la sesión se corta.** Brief: `docs/OS-IDEAL-MAC-IPHONE.md`. Rama: `fable/os-vision` (sin PR, sin tocar `main`).
> Auditoría: `docs/auditoria-vision.md` y `docs/auditoria-vision/`. Decisiones tomadas por el CEO: `docs/DECISIONES-FABLE.md`.
> Capturas: `node scripts/capturas-vision.mjs <rutas> <prefijo>` (con `npm run dev` corriendo) → `docs/capturas-vision/`.

## Reanudación supervisada · 2026-11-13

- Worktree aislado: `/Users/rodrigomedina/.codex/worktrees/os-vision-integracion/Inherent-HQ`, base `bb8188e`. El checkout principal tiene trabajo ajeno y no se toca.
- Arquitectura/revisión: Astra. Implementación económica: Luna por paquetes acotados, con revisión antes de integrar. El integrador conserva los archivos compartidos.
- Plan ejecutable y criterios: `PAQUETES-VISION.md`. Decisiones §9: `DECISIONES-FABLE.md`. Índice de auditoría: `auditoria-vision.md`.
- Prioridad: cerrar una sola auditoría → Finance/alcance → componentes reutilizados/nodos/Decide → ejecución durable/P0 → resto → nativo/pulido/refactor/video/cierre. No repetir auditorías ni ampliar pruebas sin una razón concreta.
- `npm ci`, `npm test` y `npm run test:ui` de base pasaron, ejecutados por el integrador. Cada entrega añade evidencia propia; la base no certifica la visión.
- Reservados por el integrador: `public/app.css`, `public/js/ui.js`, `public/js/app.js`, `public/js/tema-boot.js`, `public/sw.js`, `public/manifest.webmanifest` (pulido de modales/sidebar/clic y Ola 0).
- Luna A2: `probes/vision-libraries/` + `docs/auditoria-vision/02-*` (librerías y prueba React Flow).
- Luna A3: `docs/auditoria-vision/03-*` (34 herramientas, módulos, componentes y capas). Después recibe S0, Finance solo CEO.
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
| A | Auditoría (plataforma, herramientas, librerías + iOS, diseño) | — | 🟡 | 01 listo; 02 y 03 en curso |
| B | Este plan + decisiones §9 | A | 🟡 | |
| 1 | Kit: los 12 componentes compartidos (`public/js/kit/`) + página de ejemplos + pruebas | A | ⬜ | |
| 2 | Modelo de nodo y hilo del cliente (API + canvas) | 1 | ⬜ | |
| 3 | Motor backend: cola, workflows durables, aprobaciones, bus de eventos, bitácora, reintentos, idempotencia, límites, cumplimiento | A | ⬜ | |
| 4 | Laya como criterio del motor + panel «lo que dice Laya» | 3 | ⬜ | |
| 5 | Ola 0: PWA pulida, tema automático, barra inferior de 5 puertas, sin conexión | — | ⬜ | |
| 6 | Ola 1: «Decide», tarjeta de entregable con Escalar, passkeys (Face ID / Touch ID), push con acción | 1, 3 | ⬜ | |
| 7 | Ola 2: franja del ciclo 1→20, Hoy reordenado, `⌘K` con acciones | 1 | ⬜ | |
| 8 | Motor Intent-to-Interface (clasificador + catálogo + cierre con acción) | 1 | ⬜ | |
| 9 | 8 departamentos + 34 herramientas (primero las 10 P0) sobre el kit | 1, 2, 8 | ⬜ | |
| 10 | 4 capas por departamento (Portal con SOPs del rol · Tools · Agents · Decisions) | 9 | ⬜ | |
| 11 | Ola 3: modos iPhone (rodaje, captura, cola sin conexión) | 5 | ⬜ | |
| 12 | Ola 4: bandeja única de Community + CRM con anillo de 60 s | 1 | ⬜ | |
| 13 | Ola 5: hilo visual + criterios como lista de verificación | 2 | ⬜ | |
| 14 | Ola 6: portal con enlace firmado de un solo uso + presentación del día 20 | 6 | ⬜ | |
| 15 | Ola 7: Finanzas (solo CEO), capacidad y «cuántas cuentas aguanto» | 1 | ⬜ | |
| 16 | Ola 8: «mensajes mínimos», modo concentración, atajos | 7 | ⬜ | |
| 17 | Voz con contexto | 8 | ⬜ | |
| 18 | `ios/`: cápsula nativa + login con Google fuera del WebView + guía de 6 pasos | 6 | ⬜ | |
| 19 | Diseño §17: auditoría, Liquid Glass acotado, microinteracciones | 5–16 | ⬜ | |
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
