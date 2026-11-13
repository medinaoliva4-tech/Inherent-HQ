# Auditoría 01 · Plataforma: qué existe hoy contra la Parte I del OS ideal

**Qué es esto.** Punto por punto, lo que `ceo-os/` ya tiene contra `docs/OS-IDEAL-MAC-IPHONE.md` § 2–§ 8.
**Rama:** `fable/os-vision`. **Método:** se abrió el código; `MAPA.md` solo sirvió de índice.

**Cómo leerlo**
- ✅ existe · 🟡 parcial · ❌ falta.
- **†** = lo dice `MAPA.md` y el archivo existe, pero no se abrió línea por línea.
- Los % de las olas son estimados a ojo, no medidos.

**Tres avisos antes de empezar**
1. **`MAPA.md` está atrasado respecto al código.** Dice que la barra es «Home · Calendario · Library · Organization · Inherent AI · Áreas · Ajustes»; el código (`app.js:127`, `NAV`) ya dice **Hoy · Agentes · Calendario · Organización · Empresa · Áreas · Biblioteca** y, al pie, Conexiones y Ajustes. Dice que las herramientas están «escondidas, sin ruta»; el código las abre con cliente (`app.js:202`, `#/ws/<ws>/<cliente>/…`) y las lista por «mesas» (`mesas.js`, `area-mesas.js`).
2. **`MAPA.md` § 10 dice que `GET ads/report` sale sin montos para todos.** Ya está corregido: `api/index.js:945` pasa `costos: seesCosts(u)`.
3. **La numeración de departamentos está en dos versiones.** 36 archivos de `public/js` y `api` aún usan ⑩ Ads, ②B, ⑥A (p. ej. `cycle.js` → `DEPTS`, 11 filas). El manual y `llm/departamentos.js` ya usan 9 agentes (⑧ Ads).

---

## § 2 · El OS late con el ciclo

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| Franja del ciclo 1→20 arriba en Hoy y en cada marca | ❌ | El dato existe: `cycle.js` → `CYCLE` (8 fases con día inicio/fin). Solo se pinta en dos lugares sueltos: `production/planner-ui.js` (tira 1-20 con línea roja del 11) y `screens/workspace.js:89` (`diaCiclo`, un chip de texto solo en Production) | Un componente único `franjaCiclo()` (lógico en `visual.js`) montado en `screens/home.js` y en la cabecera de marca. Punto «hoy», hitos 11 y 20 gruesos |
| La franja cambia a ámbar y dice qué y de quién | ❌ | Las reglas ya existen como avisos: `avisos-reglas/clientes-marcas.js` y `clientes-estrategia.js` (día 11, día 20, ficha) | Conectar la franja a `GET /api/avisos` filtrando las reglas del ciclo; hoy solo salen en `#/avisos` |
| El OS se reordena según el día | ❌ | `screens/home.js` ordena «Necesita atención» por peso fijo `w` (`atencion()`, línea 244), no por día del ciclo | Una función pura `prioridadPorDia(dia)` que suba producción (6-11), montaje (12-15), programación (16-19), presentación (20) |
| Tres preguntas en cada pantalla | 🟡 | Home: `hero()` dice «N cosas necesitan tu decisión hoy» (`home.js:277`). El resto de pantallas no sigue el patrón | Patrón de cabecera común (qué pasa · qué sigue · qué decides) |
| Bandeja «Decide» | 🟡 | Dos mitades sin unir: «Necesita atención» en `home.js:281` (solo CEO/COO; pagos por confirmar, cotizaciones, leads, revisiones, onboarding) y `#/avisos` (`screens/avisos.js`, 62 reglas en `avisos-reglas/`, posponer, un botón por aviso). Los entregables «En revisión» y las etapas de agentes en revisión **no** entran a ninguna de las dos de forma unificada | Una sola fuente `GET /api/decide` (o extender `avisos`) que junte: entregables `En revisión` que tu rol aprueba (`entregables.js` → `puedeAprobar`), runs de agentes en `revision`, `accounts.ads.ok` pendiente, estrategia por aprobar. Tarjeta de una frase + 2 botones. Vacío: «Nada espera por ti. Disfruta.» |

---

## § 3.1 · Mac — el taller

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| Barra lateral colapsable, lo raro abajo | ✅ | `app.js:127` `NAV` (con `pie: true` en Conexiones y Ajustes), `⌘B` en `app.js:450`, grupos que se abren y recuerdan | — |
| Número solo cuando algo te espera | 🟡 | Solo la campanita (`avisos-ui.js`, `[data-avisos-n]`) | Contadores por ítem de la barra (Tareas, CRM, Agentes) |
| Paleta `⌘K` | 🟡 | `search.js` (`openSearch`) + `app.js:516` (`jumpItems`) + `GET /api/search` (`api/index.js:1206`). Navega y busca clientes, proyectos, tareas, leads, cotizaciones, servicios, paquetes, docs, research, ideas | **No ejecuta acciones** («aprobar» no lista lo que espera tu OK) y **no entiende lenguaje natural**: es coincidencia de texto. Falta un registro de comandos (hay base en `llm/acciones-os.js`) y un intérprete (`orquestador.js` → `pedidoRuta` ya enruta texto a agente y cliente) |
| Panel derecho contextual de chat (`⌘⌥I`) | ❌ | Lo que hay: «Ask InherentOS» **navega** a `#/chat` con borrador (`areas.js` → `abrirEnChat`); `strategy.js` y `diseno-chat.js` tienen chat lateral propio con `divisor.js` | Un panel montable sobre cualquier pantalla con el contexto (ruta, marca, pieza, día). El Chat ya recibe contexto por `os.llm.<correo>` |
| Vista rápida con barra espaciadora | ❌ | — | Todo. El `drawer()` de `core.js` sirve de contenedor |
| Arrastrar y soltar | 🟡 | Kanban (`kanban.js`), leads entre etapas (`sales.js:246`), piezas a otro día (`content.js:350`, `posts.js:169`), notas (`areas.js:338`), archivo del Finder a una tarea (`taskcard.js:57`, `work.js:597`), archivos al Chat (`llm.js:393`), Library (`library-ui.js:41`) | Cruces entre módulos: tarea → calendario, idea → campaña, correo → lead |
| Atajos `A` / `C` / `E` / `J` / `K` / `⌘↩` | ❌ | Solo hay `⌘K`, `⌘B`, `⌘S` en el Tool Shell, Esc y flechas en menús (`ui.js`) | Capa única de atajos + chip visible al pasar el cursor |
| Icono en la barra de menú + mini-panel | ❌ | `escritorio/main.js` (350 líneas): una ventana + ventana de progreso de Laya. No usa `Tray` | `Tray` con día del ciclo, punto de pendiente y mini-panel «Decide» |
| Widgets, Spotlight, Atajos de Apple | ❌ | — | Requiere app nativa firmada (peldaño 2) |
| Touch ID en acciones graves | ❌ | `systemPreferences` ya se importa en `main.js:9`, solo para el micrófono (línea 83). Cero WebAuthn en todo el repo | `systemPreferences.promptTouchID()` expuesto por `preload.js`, o passkeys en web. Ver § 3.4 |
| Ventanas sueltas que se recuerdan | ❌ | Una sola `BrowserWindow` (`main.js:281`); recuerda zoom y tamaño. `agentes-ventana.js` es una pestaña dentro del Chat, no una ventana del sistema | `window.open` controlado por `setWindowOpenHandler` (`main.js:287`) + guardar posiciones en `app-ajustes.json` |
| Modo concentración `⌘⇧F` | ❌ | — | Todo |

---

## § 3.2 · iPhone — el bolsillo

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| Barra inferior de 5 puertas: Hoy · Decide · Chat · Calendario · Más | 🟡 | `app.js:459` `celHtml()`: hoy es **Hoy · Chat · Agentes · Calendario · Más** | Cambiar «Agentes» por «Decide» (cuando exista) y mover Agentes a «Más» |
| Botones primarios abajo | 🟡 | Hojas inferiores `.hoja` (`app.js:476`); `pocket.js` saca del cel lo que pide pantalla grande (`SOLO_COMPU`) | Auditar pantalla por pantalla; no hay regla en CSS que lo garantice |
| Gestos: deslizar para aprobar / pedir cambios, mantener, jalar para actualizar | ❌ | Solo arrastre táctil del Kanban (`kanban.js:113`) | Todo |
| Dynamic Island, Live Activities, widgets, Siri, botón de Acción, hoja de compartir | ❌ | — | Solo con app nativa (peldaños 1-2) |
| Notificaciones push | 🟡 | `sw.js` (push + clic abre la URL), `avisos.js` (cliente), `api/_lib/avisos.js` (`avisos/clave`, `suscribir`, `quitar`, `probar`, `cron/avisos`; `nuevoLead` avisa al entrar un lead). Se activa en Mi perfil (`screens/me.js:21`) | **Sin botones de acción**: `showNotification` no manda `actions` y no hay ruta que apruebe desde el aviso. Sin push por entregable listo |
| PWA instalable | ✅ | `manifest.webmanifest` (`standalone`, 192/512/maskable), `index.html:5-14` (`viewport-fit=cover`, `apple-mobile-web-app-capable`, `apple-touch-icon` 180) | Sin `apple-touch-startup-image` (splash), sin `shortcuts` ni `id` en el manifest, `theme_color` fijo oscuro en el manifest |
| Face ID vía passkeys / WebAuthn | ❌ | Cero referencias a `PublicKeyCredential` o `navigator.credentials` | Rutas `auth/passkey/*`, guardar credenciales por persona (`vault.js`), y un «step-up» antes de aprobar |
| Cámara y voz | 🟡 | Voz: `voz.js`, `voz-viva.js`, `voz-gemini.js`, `recorder.js`, `mic-worklet.js`, dictado en el Chat. Archivos: `<input type=file>` en tareas, moodboard, shot list | Captura directa con cámara (`capture`) ligada a una tarea o toma. Nota de voz → tarea o brief |
| Sin conexión | ❌ | `sw.js:1`: «No guarda páginas en caché». Sin `caches`, sin IndexedDB, sin cola de subida | Cachear el cascarón, lo de hoy y la jornada; cola «pendiente de subir» |
| Haptics | ❌ | Un solo `navigator.vibrate?.(8)` al arrastrar (`kanban.js:113`); iOS Safari lo ignora | Puente nativo (peldaño 1) |

---

## § 3.4 · Llevarlo a Apple: PWA y login con Google

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| Peldaño 0 · web instalable | 🟡 | Ver PWA arriba. El login es una redirección de página completa, así que funciona en Safari y en la PWA instalada | Splash, modo sin conexión mínimo, probarlo en iPhone real y «Añadir al Dock» en Mac |
| Flujo OAuth de hoy | ✅ | `api/index.js:63` `GET auth/google` → cookie `ceoos_state` firmada (`Path=/api/auth`, 10 min) → Google → `GET auth/callback` (`:68`) valida `state`, llama `google.finishLogin` y emite la cookie `ceoos` (`session.js:37`: `HttpOnly; Secure; SameSite=Lax`, 30 días, 14 sin uso). `redirect_uri` fijo: `<APP_URL>/api/auth/callback` (`google.js:20`) | — |
| Login dentro de una cápsula nativa | ❌ | Hoy **todo depende de cookies del mismo navegador**: el `state` y la sesión. Si el login se abre en el navegador del sistema, la cookie queda allá y la cápsula no la ve | Ver la lista de abajo |
| Truco actual en Mac | 🟡 | `escritorio/main.js:29` quita «Electron» del user agent para que Google deje entrar | Es frágil: Google puede bloquearlo. La vía correcta es la misma de la cápsula |
| Carpeta `ios/`, `npm run ios:instalar`, guía de 6 pasos | ❌ | No existe | Todo |
| App de Mac firmada | 🟡 | `escritorio/firmar.js` firma «ad hoc»; se publica por GitHub Releases y se actualiza sola (`api/_lib/escritorio.js`) | Firma y notarización (cuenta de US$99) |

**Qué cambiar para que una cápsula abra el login en el navegador del sistema y vuelva con un token**
1. `GET auth/google?app=1&challenge=<PKCE>`: guardar `{ state, app: true, challenge }` en un doc con caducidad (como `mcp_pendientes` en `conectores.js`), no solo en cookie.
2. `GET auth/callback`: si `app`, **no** emitir cookie; crear un código de un solo uso (60 s) y redirigir a un deep link (`inherentos://auth?code=…`) o a un Universal Link.
3. Nueva `POST auth/canje` `{ code, verifier }`: verifica PKCE y emite la sesión **dentro** del web view de la cápsula (`session.issue`).
4. `access.js` → `csrfOk`: aceptar el origen de la cápsula si no carga desde el mismo dominio.
5. **Ya hay código que reusar:** `api/_lib/oauth.js` implementa OAuth 2.1 con PKCE, códigos y tokens con hash en `vault` para el conector MCP. El canje es el mismo patrón.
6. Alternativa sin Google: passkeys (no existe nada; ver § 3.2).

---

## § 4 · Las piezas que se repiten

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| 4.1 Tarjeta de entregable: quién y de dónde viene | 🟡 | `deliverables` con `entradas` (versiones aprobadas de otra herramienta), `ia.via`, historial con autor. `herramientas.js` trae `viene_de` / `va_a` por herramienta | «De dónde viene» es la herramienta, no un nodo del hilo. Solo cubre lo que vive en `deliverables`; piezas (`content`), videos, guiones, avatares y plan tienen cada uno su propio modelo |
| 4.1 Estados | 🟡 | `entregables.js:13` `ESTADOS = Borrador · En revisión · Aprobado · Entregado`; `PASOS` (`:82`) es el único camino; el servidor da 409 `PASO` | El MD pide `Borrador · Para revisar · Aprobado · Cambios pedidos · Publicado`. Falta «Cambios pedidos» como estado (hoy es volver a Borrador con nota) y «Publicado». Decidir un solo vocabulario |
| 4.1 Criterios como lista de verificación | 🟡 | `tool-shell.js:59` `faltasAhora()` junta `criterios.falta` + `tool.faltas()`; el botón Aprobar se apaga y dice por qué; el servidor responde 400 `FALTAS` | Los criterios **no salen de `inherent/08-CRITERIOS-DE-ACEPTACION.md`**: ese archivo solo se cita en el prompt del Chat (`llm/modos.js:45`). Falta parsearlo (`api/_lib/parse.js`) y ligar cada ficha a su tipo de entregable, con check por criterio |
| 4.1 Tres botones: Aprobar · Pedir cambios · Escalar | 🟡 | Tool Shell: Enviar a revisión, Devolver a borrador, Aprobar, Marcar entregado (`tool-shell.js:196-204`). Videos y portal sí tienen Aprobar / Pedir cambios (`video.js` → `revisar`) | **«Escalar» no existe como acción en ninguna parte.** Unificar los tres botones en una sola pieza |
| 4.1 Historial y «ver qué cambió» | 🟡 | `deliverable_versions` (solo se agregan), «Comparar versiones» lado a lado (`tool-shell.js:204`, `:251`). Plan del mes muestra diff por sección (`plan-mes-ui.js`) | Diferencia **visual** resaltada en el shell (hoy son dos columnas) |
| 4.2 «Decide» | 🟡 | Ver § 2 | Ver § 2 |
| 4.3 Hilo del cliente: nodos con estado y origen | ❌ | **No hay modelo de nodos.** Lo más cercano: (a) grafo de herramientas `viene_de`/`va_a` en `herramientas.js`; (b) `strategy` `<slug>--viva` (estrategia en vivo, se aprueba completa); (c) campos de un run de agente con `estado: 'evidencia' | 'hipotesis'` y `fuentes` (`agentes-flujos.js:388`, `:449`); (d) `intel.js` + `intel-mapa.js` leen los entregables del repo del cliente | Colección `nodos` (o campo en `strategy`) con `{ id, tipo, estado: hipotesis|aprobado, viene_de[], cliente }`, propagación «a revisar» hacia abajo y el mapa visual. Es el hueco más grande de la Parte I |
| 4.3 Trazar una pieza hasta el ICP | ❌ | Las piezas llevan `pillar`, slot `MK-xxx` y campaña; no hay enlace a un dolor ni a un avatar | Campo de origen en `content` y validación en `reglasPieza` (`api/index.js`) |
| 4.4 Estados vacíos que enseñan | ✅ | `visual.js:204` `vacio()` y `fallo()`; `vacio-chat.js` («¿Platicamos para crearlo?»); regla «nunca 0» aplicada en Home, Indicadores, KPIs | Barrido de textos «No hay…» que queden |
| 4.5 Selector de marca único | 🟡 | `contexto.js` (`selectorHtml`, `ponerContexto`, `os.ctx.<correo>`). Ya no está en la barra: vive en el Chat y en las mesas de área (`area-mesas.js`) | Volver a ponerlo arriba, global |
| 4.5 Color y monograma por marca | 🟡 | `visual.js:147-170`: `iniciales`, `tonoDe` (6 tonos derivados del nombre), `monograma` | El color es calculado, no de la marca. Guardar color por cliente y usarlo en el selector |
| 4.5 Atajo `⌘1…9` | ❌ | — | Todo |
| 4.6 Chat de cada pantalla con chips | 🟡 | «Ask InherentOS» (barra y Home), `SUGERENCIAS` por modo (`llm/modos.js`), `sugerencia-chat.js` (tarjeta sobre la caja, sale de las reglas de Avisos) | Panel en sitio (ver § 3.1) y chips por pantalla, no por modo |
| 4.7 Semáforo de conexiones | 🟡 | `mcp-directorio.js` + `GET conectores/estado` (por persona: conectado o no, probar, desconectar); `GET /api/status` (Google, base, repo); capacidades del Chat con `lista · sin_conexion · apagada` y motivo (`llm/capacidades.js`) | Tres estados (falta «necesita permiso»), Zernio/Windsor/Apify/Meta en la misma vista, y **qué promesa queda en pausa**. Ojo: `CAPACIDADES_RESPALDO` es un mock marcado mientras el puente no publique `GET /capacidades` |

---

## § 5 · Área por área

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| 5.1 Hoy | 🟡 | `screens/home.js` (369 líneas): hero, «Ask InherentOS», 4 KPIs con fuente, actividad reciente, Importante, «Necesita atención» (CEO/COO), agenda, contenido del mes | Franja, Decide de 3 tarjetas, «lo que se movió solo» por agente, Empezar/Cerrar el día, Posponer en tarjeta (existe solo en Avisos), subpágina Semana, botón «+» de captura, «esto puede esperar» |
| 5.2 Chat | 🟡 | `screens/llm.js` (1,452 líneas) + `llm/*` (18 módulos). Hay: modos por área, `@departamento` (`llm/departamentos.js`, 9), barra de capacidades con estado y motivo (`llm/capacidades.js`), equipo planifica/ejecuta y presets (`llm/modelos-tabla.js`), carpetas/proyectos (`llm/carpetas.js`), modo privado, ramificar, Brújula, dictado, tarjeta de gasto de imágenes (`chat-imagenes.js`, `api/_lib/chat-imagenes.js`), avisos en el chat (`chat-avisos*.js`), UI generada (`llm/genui.js`) | Capacidades reales dependen del puente (hoy mock salvo Código). Cámara como entrada, mantener para hablar, plegar respuestas largas, «continuar en otro dispositivo» (las conversaciones viven en la compu de cada quien). `Ajustes → IA` guarda el uso `chat` pero `llm.js` no lo consume († MAPA) |
| 5.3 Agentes | 🟡 | `screens/agentes.js`, `agentes-ui.js` (lista + vista tablero con `tablero.js`: Encargo · Diagnóstico · Plan · Producción · Revisión · Entrega), `agentes-portal.js` (Resumen · Flujo · Trabajos · Configuración), `agentes-editor.js`, `agentes-run.js`, `api/_lib/agentes.js`. Estados Borrador · Activo · Pausado; revisión por etapa con CEO/COO | La «línea de producción» por las 9 áreas (el tablero es por tipo de etapa). «Bloqueado → ver qué falta» con botón de avisar. Modo borrador/activo de Community y Posting. Voz y cara por agente. Push solo de excepciones |
| 5.4 Calendario | 🟡 | `screens/calendario.js` (Trabajo y Contenido), `calendario-trabajo.js`, `calendario-contenido.js`, `calendario-vistas.js`. Arrastrar pieza a otro día con rechazo 423/409 del servidor; hitos 1, 11 y 20 como eventos; Google Calendar († `api/index.js`) | Pestaña «Ciclo» por marca, pestaña Equipo, overlay 1→20 sobre el mes, barra «cuánto cabe» (el medidor existe solo en `plan-mes-ui.js` y solo en interfaz), exportar semana, vista Agenda en cel |
| 5.5 Proyectos | 🟡 | `screens/operations.js` (Kanban único, calendario, timeline), `project-page.js`, `flow.js` (`POST flow/activate` activa paquete y crea tareas de las recetas) | Tablero por etapas del pipeline × marca, mover solo si cumple criterios, salud por marca en un color con causa, subpágina «Qué falta» (existe `blockersOf` en `cycle.js`, importado por `api/index.js:48`) |
| 5.6 Tareas | 🟡 | `screens/work.js` (723 líneas), `taskcard.js`: tipo, dependencias con candado 423, checklist marcable, SOP ligado, adjuntar arrastrando, perfiles de trabajo | SOP **embebido** como pasos (hoy es un enlace a la Library o `https`), vistas Hoy/Semana/Por marca, `⌘↩` completa, reasignar con razón, deslizar para completar, cámara con shot list |
| 5.7 CRM / Ventas | ✅ | `screens/sales.js` (788 líneas), `ventas-flujo.js`, `ventas-meta.js`, `api/_lib/leads.js`. **El cronómetro de primera respuesta existe:** `first_reply_at`, `waitTone` (verde < 1 min, ámbar < 15, rojo), KPI «Primera respuesta · meta 1 min», bandeja «Sin responder», motivo de pérdida obligatorio, siguiente paso y fecha obligatorios, Fuentes, cotización con PDF, entrada pública `POST /api/intake/<clave>`, push al entrar un lead | Anillo de 60 s (hoy es un contador de texto), botones Llamar / WhatsApp / «Responder con el agente», historial unificado con WhatsApp y correo, «caso en tres líneas». Etapas distintas a las del MD (hoy: Prospecto · Nuevo · Contactado · Reunión · Propuesta · Ganado · Perdido) |
| 5.8 Clientes | 🟡 | `screens/clients.js` (Inicio · Links · Servicio · Presupuestos · Portal y accesos), `client-service.js`, `budgets.js`, onboarding con avance (`flow.js`) | El hilo en la ficha, cuentas conectadas, «Mandar recordatorio» por la secretaria |
| 5.8 Portal del cliente | 🟡 | `screens/portal.js` (Resumen · Contenido · Entregas · Metas), `api/_lib/portal.js` (`decidir`, `rutasVideo`), rutas `GET portal`, `POST portal/content/:id`, `PUT portal/onboarding`, `POST portal/invite` (`api/index.js:829-885`). Aprobar o pedir cambios de piezas y videos con nota; costos fuera (`stripCosts`, `intel.limpiar`); entra solo el rol `client` con su `client_slug` | **No hay enlace firmado de un solo uso:** el cliente entra con Google (cliente OAuth aparte, `GOOGLE_PORTAL_CLIENT_ID`). **No hay aprobación en 10 s sin cuenta.** **No hay presentación del día 20** (solo una fila «presentación» en Entregas). Sin nota de voz. «Revocar acceso» no tiene botón propio (se desactiva en `team`). El reporte del Performance Center no llega al portal († MAPA § 10) |
| 5.9 Servicios y ficha | 🟡 | `screens/services.js` (paquetes · servicios · especialistas · responsabilidades), `catalogo.js`, `servicios-paquetes.js`, `paquetes.js`, `levels.js`, `ficha.js`, `api/_lib/internos.js` (baseline y costos solo CEO), cotizador en `sales.js` | Constructor «alcance primero», «guardar como ficha del cliente» (la ficha la escribe el CEO desde Estrategia con `escribirSeguro`), «subir de nivel» con diagnóstico, calculadora de bolsillo |
| 5.10 Finanzas 🔒 | 🟡 | `screens/finance.js` (Resumen, Facturas, Movimientos, Costos, Rentabilidad, Precios, Pagos), `facturas.js`, `facturas-ui.js`, `finscope.js`, `movimientos-*.js`, `api/_lib/facturas.js`. **Servidor:** `CEO_READ` / `CEO_WRITE` (`access.js:46-50`), `ceoFin` en cada escritura (`api/index.js:701`), `stripInvoice` (por pagar solo CEO), `CAP = { finanzas: 'resumen' }` para quien no es CEO (`roleviews.js:69`) | **El COO por defecto no ve Finanzas** (`ROLE_AREAS.coo` la excluye, `roleviews.js:74`), pero sí ve costos dentro de entregables y jornadas (`seesCosts`, `veMontos`): decide si eso es lo que quieres. Falta: SAT, pronóstico 30/60/90, «cerrar el mes», foto de recibo, «¿cuántas cuentas aguanto?», Face ID. Riesgo: `GET finance/sheet` (`:685`) entrega el CSV completo de la hoja (ingresos **y gastos**) a cualquiera con Finanzas en «resumen» |
| 5.11 Estrategia | 🟡 | `screens/strategy.js`, `estrategia-viva*.js`, `strategy/*` (9 herramientas), `avatar-ui.js`, `bullseye.js`, `api/_lib/estrategia.js`. Gate del CEO en el servidor (bloques, estrategia en vivo, etapa); `SIN_FILAS`; calculadora en `embudo-datos.js` † | Mapa del hilo en el centro, «cada afirmación con su fuente» de forma sistemática, pantalla de aprobación de 1 pantalla para iPhone, nota de voz para devolver |
| 5.12 Marketing | 🟡 | `marketing/*` (Viral Lab, hooks, copy, funnel, ads, rendimiento), `plan-mes*.js`, `campanas*.js`, `investigacion.js`, `referentes.js`, `mesas.js` | Costo de scraping por corrida a la vista, «quemar contenido», feed vertical y deslizar en iPhone, «por qué funciona» con evidencia (parcial en Pattern Report †) |
| 5.13 Branding y diseño | 🟡 | `creative/*` (DNA, moodboard, dirección, consistencia, rendimiento, `criterio-elo.js`), `design-system-ui.js`, `sistema-visual.js`, `diseno-chat.js`, `ojo.js`, `revisor.js` | «Validar claim» como botón, feed de revisión tipo Instagram, **comentar con coordenadas sobre la pieza** (los videos sí comentan al segundo), «Abrir en Figma» exacto |
| 5.14 Producción | 🟡 | `production/*` (brief, shot list con «Grabada», planner con tira 1-20 y medidor de horas, repurposing, review), `creacion-ui.js`, `video-ui.js`, candado 423 `DIA_11` (`reglasShoot`, `api/index.js`) | **No hay modo rodaje:** sin pantalla de set, sin cronómetro, sin captura directa, sin offline, sin barra «¿llegamos?» |
| 5.15 Community y Posting | ❌ | `api/_lib/zernio.js` (un solo `GET`, solo lectura) + `GET community/inbox` (`api/index.js:521`) + una pestaña dentro de `screens/content.js:142` que dice «Se contesta en Zernio». Por marca, no unificada | Bandeja única, clasificación, modo borrador/activo, responder, ocultar spam, ficha de respuestas, cola de Posting, reintentar fallidas, publicar/reprogramar. Zernio hoy no escribe nada desde el OS |
| 5.16 Ads 🔒 | 🟡 | GATE en el servidor: `PUT ads/accounts/:slug` (`api/index.js:893-908`): el OK solo lo da el CEO, vale para ese mes y ese presupuesto, y se cae si cambia el monto. `ads-studio.js` (solo CEO aprueba y «lanza» = crea tarea), `ads.js` (Windsor, solo lectura), `marketing/ads-intel-ui.js`, recomendaciones con evidencia | Pantalla de GATE 2 «Subir de $X a $Y» en iPhone con Face ID, reloj de arena del gasto, atribución con modelo declarado, pausar campaña desde el OS (no hay escritura a plataformas) |
| 5.17 Resultados | 🟡 | `marketing/rendimiento-ui.js` + `reporte.js` (reporte del mes con KPIs y fuente), `creative/criterio-elo.js` (comparación por pares), `api/_lib/results.js` (sin pantalla propia), `marketing-ui.js` (qué escalar y qué parar) | «Cerrar el mes», «Generar la presentación del 20», «Mandar al cliente», «Proponer ajuste de estrategia» que entre al ciclo siguiente |
| 5.18 Consulting | 🟡 | `consulting/*` (8 herramientas con módulo puro + vista), `screens/consulting.js`, alcance en servidor (`alcanceConsulting`, 403 `FUERA_DEL_ALCANCE`), `mentors.js` | Captura de visita (voz y fotos ligadas a un marco), «Pedir mentor» con la regla de $180 |
| 5.19 Equipo | 🟡 | `screens/team.js` (organigrama, perfiles, roles, Vistas por rol con `oculto · resumen · completo · edita`, hechas cumplir en servidor) | Capacidad en horas y «cuántas cuentas aguanta»; directorio con llamar/WhatsApp |
| 5.19 Visión | ✅ | `screens/vision.js` (`settings` `vision`) | Recordarla en momentos clave |
| 5.19 Roadmap | 🟡 | `screens/roadmap.js`: megaproyectos → proyectos → tareas | No lee `PENDIENTES.md`; sin botón «Decidir» |
| 5.19 Laya | 🟡 | `laya.js`, `laya-ui.js`, `api/_lib/laya.js`, `creative/criterio-elo.js` | Juego «¿cuál?» deslizable en iPhone |
| 5.19 Configuración | 🟡 | `screens/setup.js`, `recetas.js`, `recipes.js`, `responsabilidades.js` (solo CEO) | «Cada ajuste dice qué cambia antes de guardar» |
| 5.20 Indicadores | 🟡 | KPIs de Home con fuente y «—» sin dato; `api/_lib/results.js`; `GET marketing/:slug/kpis`; `charts.js`, `cifras.js` | Métrica única de crecimiento por marca (decisión § 9.1); tiempo de respuesta en Home |
| 5.21 Biblioteca | 🟡 | `screens/library.js`, `library-ui.js`, `library-tree.js`, `conocimiento.js` | Búsqueda por significado (hoy es por texto en `GET /api/search`) |
| 5.21 Conexiones | 🟡 | `#/ai/mcps` → `mcp-directorio.js`, `conectores.js`, `api/_lib/conectores.js` (OAuth + PKCE + tokens cifrados) | Ver § 4.7 |
| 5.21 Ajustes | 🟡 | `screens/ajustes.js` (solo IA: proveedores y usos). Día/noche manual (`tema-boot.js`: `os.modo`, **oscuro por defecto, no sigue al sistema**). `prefers-reduced-motion` respetado en CSS (69 reglas) | Automático día/noche, notificaciones por tipo, no molestar, atajos |
| 5.21 Avisos | ✅ | `screens/avisos.js`, `avisos-ui.js`, `avisos-reglas/*` (62 reglas, cada una citando el manual), `api/_lib/avisos.js`, `avisos-datos.js`. Un botón por aviso, posponer con límites | Agrupar por marca; separar lo informativo |
| 5.21 Mi perfil | 🟡 | `screens/me.js`: foto, contacto, conexiones, avisos del dispositivo, primer día, videos vistos | **El modo «Mensajes mínimos» no existe.** Tampoco capacidad ni modo de trabajo |

---

## § 6 · Rituales

| Punto del MD (§) | Estado | Dónde | Qué falta exactamente |
|---|---|---|---|
| 6.1 Día 1 · la sala de la reunión | 🟡 | `meetings.js`, `library-entrevista.js`, `recorder.js` (grabación), onboarding en `flow.js` | Sala armada sola (ficha + hilo + guion), transcripción en vivo, proponer nodos como hipótesis |
| 6.2 Aprobar la estrategia y que el ciclo arranque solo | 🟡 | Aprobación: `POST estrategia/:slug/viva/aprobar`. Tareas del ciclo: `cycle.js` → `tasksFor` + `flow.js` | Encadenar una cosa con la otra: hoy aprobar no crea tareas ni avisa a los roles |
| 6.3 Día 6-11 · producir | 🟡 | Candado `DIA_11` y avisos del día 11 | Modo rodaje; la franja que pregunta desde el día 9 |
| 6.4 Día 12-19 · feed de revisión y programar con un botón | ❌ | Review de video existe; no hay feed ni cola de Posting | Feed de revisión; `POST` a Zernio para programar (no existe escritura) |
| 6.5 Día 20 · «Presentar» | ❌ | Solo el evento en el calendario y la fila en Entregas del portal | Armado de la presentación con piezas reales + modo presentar |
| 6.6 Lunes · resumen | 🟡 | `cron/avisos` manda cada mañana lo urgente por push (`api/_lib/avisos.js:125`) | Resumen semanal de «tres cosas» a la hora elegida |
| 6.7 «Cerrar por hoy» | ❌ | — | Todo |

---

## § 8 · Las olas: cuánto existe

| Ola | % aprox. | Ya existe | Falta exactamente |
|---|---|---|---|
| **0** · web instalable + login fuera de la web embebida | **60 %** | Manifest, iconos, metas de Apple, service worker, push, login por redirección que funciona en Safari y PWA | Splash; caché mínimo; flujo `auth/google?app=1` + código de un solo uso + `auth/canje`; probar en iPhone real |
| **1** · Decide + tarjeta de entregable + Face ID + notificaciones con acción | **35 %** | Modelo de entregables sólido en servidor (estados, versiones, quién aprueba, `FALTAS`, alcance); Tool Shell; «Necesita atención»; Avisos con 62 reglas; push | Unir todo en «Decide»; tres botones únicos con «Escalar»; biometría (0 %); `actions` en el push y ruta para aprobar sin abrir |
| **2** · franja + Hoy + ⌘K | **40 %** | `CYCLE`, tira del planner, Home con KPIs reales, ⌘K que navega y busca | Franja como componente; reordenar por día; ⌘K con acciones y lenguaje natural |
| **3** · iPhone nativo | **5 %** | `pocket.js`, barra inferior, hojas, voz | Carpeta `ios/`, modo rodaje, captura, offline, hoja de compartir, widgets, Live Activities |
| **4** · bandeja de Community + CRM en un minuto | **40 %** | CRM casi completo con cronómetro, candados y push de lead nuevo | Community casi entero (hoy solo lectura por marca); anillo de 60 s; responder con el agente |
| **5** · hilo visual + criterios como checklist | **20 %** | `viene_de`/`va_a` entre herramientas, `entradas` aprobadas, `evidencia|hipotesis` en runs de agentes, `cumple/falta` en entregables | Modelo de nodos, propagación, mapa; parsear `08-CRITERIOS-DE-ACEPTACION.md` |
| **6** · portal con aprobación en 10 s + presentación del 20 | **35 %** | Portal con 4 pestañas, aprobar piezas y videos, costos fuera en servidor | Enlace firmado de un solo uso, presentación, reporte al portal |
| **7** · Finanzas, capacidad, «cuántas cuentas aguanto» | **45 %** | Facturas, banco, cruce, costos por alcance (`finscope.js`), rentabilidad, candados de CEO en servidor | Capacidad por rol, pronóstico, SAT, cierre de mes |
| **8** · mensajes mínimos, Spotlight, Atajos, concentración | **0 %** | — | Todo |

---

## Lo que se conserva

- **Los candados del servidor.** `api/_lib/access.js` (`guard`, `scoper`, `CEO_READ/WRITE`, `stripCosts`), `api/_lib/leer.js` (una sola definición de qué ve cada quien) y `roleviews.js` (matriz compartida por servidor, conector e interfaz).
- **El modelo de entregables.** `public/js/entregables.js` + `api/_lib/entregables.js`: estados, versiones que solo se agregan, `v` con 409, alcance por ficha, quién aprueba.
- **El Tool Shell** (`tool-shell.js`) como base de la tarjeta de entregable.
- **El motor de Avisos** (`avisos-reglas/*` + `api/_lib/avisos.js`): es el 80 % de «Decide» y de la franja ámbar.
- **El CRM** (`sales.js`, `ventas-flujo.js`, `leads.js`) con su cronómetro.
- **El gate de pauta** (`PUT ads/accounts/:slug`) y el de estrategia (`estrategia.js`).
- **El OAuth con PKCE** de `api/_lib/oauth.js` y `conectores.js`: sirve de molde para el login de la cápsula.
- **Las 40 herramientas** con módulo puro + vista (`strategy/`, `marketing/`, `creative/`, `production/`, `consulting/`) y sus pruebas.
- **`visual.js`** (vacíos, monogramas, anillos, cuenta regresiva) y los tokens `--ui-*`.
- **La app de Mac** (`escritorio/`) con actualización propia.
- **El Chat** con capacidades, departamentos `@` y tarjeta de gasto.

## Lo roto o duplicado

- **`MAPA.md` no coincide con el código** (barra, herramientas «escondidas», nota de `ads/report`). Su propia regla dice que se corrige en el mismo cambio.
- **Dos numeraciones de departamentos** (9 agentes vs ①-⑩ con ②B y ⑥A) en 36 archivos; `cycle.js` → `DEPTS` y `recipes.js` son el origen.
- **Tres vocabularios de estado:** entregables (`Borrador · En revisión · Aprobado · Entregado`), piezas (`estadoDe` en `element.js`: Idea · En proceso · Listo · Publicado) y videos (En edición · En revisión · Listo). El MD pide uno.
- **Tres lugares dicen «qué te toca»:** «Necesita atención» (`home.js`), `#/avisos` y el tablero de Agentes. Ninguno incluye los entregables en revisión.
- **Dos sistemas de navegación de herramientas:** workspaces con pestañas (`herramientas.js`, `screens/workspace.js`) y mesas (`mesas.js`, `area-mesas.js`), más las notas de área (`screens/areas.js`).
- **Tres caminos de chat:** `screens/llm.js` (Hermes/puente), `screens/strategy.js` (chat por el puente con panel) y `diseno-chat.js`; más `ia-os.js` (servidor) que el Chat principal no usa.
- **Archivos gigantes:** `public/app.css` (10,229 líneas, **908 KB**, un solo archivo sin build), `screens/llm.js` (1,452 líneas), `api/index.js` (1,223 líneas, rutas y reglas mezcladas), `puente.py` (1,086), `sales.js` (788), `app.js` (778), `work.js` (723).
- **Código con ruta dudosa:** `screens/content.js` → `bullseyeTool` (nadie lo monta †), `screens/me-brand.js` y `screens/consulting.js` solo viven dentro de workspaces; `api/_lib/results.js` no tiene pantalla; planes viejos en la raíz (`PLAN-GATEWAY.md`, `PLAN-OS.md`, `PLAN-WORKSPACES.md`, `CONTINUAR-KIMI.md`).
- **Mock a la vista:** `llm/capacidades.js` → `CAPACIDADES_RESPALDO` muestra 5 capacidades «sin conexión» porque el puente no publica `GET /capacidades`.
- **Tema:** oscuro por defecto y manual; el MD pide automático.

**Riesgos de seguridad por rol**
1. **`POST ia/agente`** ejecuta `tools/call` de los MCP personales sin validar run ni etapa y sin aprobación por llamada (`api/_lib/ia.js` †, confirmado: solo `guard` de sesión). Choca con «nada destructivo sin OK».
2. **El conector MCP salta candados:** `agendar` y las herramientas que crean piezas escriben directo en la base, sin `reglasPieza` ni `DIA_11` (`api/_lib/mcp.js:524`).
3. **`GET finance/sheet`** da el CSV completo (con gastos) a quien tenga Finanzas en «resumen».
4. **`area_notes`** las ve todo el que ve Library, de todos los clientes, sin `scoper` (`access.js:40`).
5. **`sources` `ads-<slug>-tabla`** lleva gasto y se lee por `/api/db/sources` sin filtro de costos (†).
6. **`avatares.js`** ignora la `v` que manda la pantalla: no hay 409 (†).
7. **Límite de la entrada pública de leads** en memoria por instancia (†).

**Pruebas que faltan**
- `/api/entregables` no se prueba contra una base: `test:herramientas` y `test:strategy` leen el código como texto.
- `npm test` corre solo 4 scripts (parser, lint de CSS, comportamiento de UI); los otros ~60 se corren uno por uno. No hay un `test:todo`.
- Sin pruebas de permisos por rol de punta a punta (CEO, COO, team, client contra cada ruta).
- Sin pruebas de `auth/*`, `portal/*`, `sw.js` ni de la app de Mac.

---

## Trabajo priorizado por ola

**Ola 0 · instalable y login**
1. `api/index.js` (`auth/google`, `auth/callback`) + nueva `auth/canje`; reusar `api/_lib/oauth.js`.
2. `api/_lib/access.js` (`csrfOk`) para el origen de la cápsula.
3. `public/manifest.webmanifest` (`id`, `shortcuts`), `public/index.html` (splash), `public/js/tema-boot.js` (seguir al sistema).
4. `public/sw.js`: caché del cascarón.
5. Corregir `MAPA.md` y unificar la numeración de departamentos (`cycle.js`, `recipes.js`).

**Ola 1 · Decide y entregable**
1. Nueva ruta `GET decide` en `api/_lib/avisos.js` (o módulo nuevo) que lea `deliverables`, `agent_runs`, `accounts.ads`, `strategy`, `quotes`, `videos`.
2. Componente único de tarjeta + tres botones: extraer de `tool-shell.js`; usarlo en `home.js`, `screens/avisos.js`, `production/review-ui.js`, `screens/portal.js`.
3. Acción «Escalar» en `api/_lib/entregables.js` (precio/alcance/fechas → CEO; resto → COO).
4. Biometría: `escritorio/main.js` + `preload.js` (Touch ID) y passkeys en `api/index.js`.
5. `public/sw.js` (`actions`) + ruta de aprobación con token corto.
6. Cerrar el riesgo 1 (`api/_lib/ia.js`) y el 2 (`api/_lib/mcp.js`).

**Ola 2 · franja, Hoy, ⌘K**
1. `visual.js` → `franjaCiclo()`; `cycle.js` → `diaDelCiclo()` y `prioridadPorDia()`.
2. `screens/home.js`: franja, Decide, «se movió solo», Empezar/Cerrar el día.
3. `search.js` + `app.js` (`jumpItems`): comandos con `llm/acciones-os.js` y `orquestador.js`.
4. `contexto.js`: selector global, color por marca, `⌘1…9`. Barra inferior en `app.js` (`celHtml`).

**Ola 3 · iPhone nativo**
1. Carpeta `ios/` (cápsula) + `package.json` (`ios:instalar`).
2. Pantalla nueva `screens/rodaje.js` sobre `production/shotlist.js` y `planner.js`.
3. `public/sw.js` + cola offline; captura en `taskcard.js`.

**Ola 4 · Community y CRM**
1. `api/_lib/zernio.js`: escritura (responder, ocultar, programar) con modo borrador/activo.
2. Pantalla nueva de bandeja única; sacar la pestaña de `screens/content.js`.
3. `sales.js`: anillo de 60 s, Llamar / WhatsApp, «Responder con el agente».

**Ola 5 · hilo y criterios**
1. Modelo de nodos en `api/_lib/estrategia.js` (o colección nueva) + `access.js` (`COLLS`).
2. `api/_lib/parse.js`: parsear `08-CRITERIOS-DE-ACEPTACION.md`; `entregables.js` → `faltas()`.
3. Vista del mapa (hay base en `diagram-editor.js` / `diagram-model.js`).
4. Origen obligatorio en `content` (`reglasPieza`, `api/index.js`).

**Ola 6 · portal**
1. `api/_lib/portal.js` + `api/index.js`: enlace firmado de un solo uso (reusar `session.sign`).
2. `screens/portal.js`: vista de una pieza con dos botones; modo presentación.
3. Publicar `versionCliente` del reporte (`marketing/reporte.js`).

**Ola 7 · Finanzas y capacidad**
1. `finscope.js` + `screens/team.js`: capacidad por rol y «cuántas cuentas aguanto».
2. `screens/finance.js`: tres cifras, pronóstico, cierre de mes.
3. Acotar `GET finance/sheet`.

**Ola 8 · adaptarse al CEO**
1. `screens/me.js` + `api/index.js` (`me`): preferencia «mensajes mínimos» y atributo global en `<html>`.
2. `app.js`: modo concentración y capa de atajos.
3. Spotlight y Atajos: dependen del peldaño 2.
