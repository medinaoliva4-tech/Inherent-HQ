# Inherent OS · el mapa

**Para quien trabaje en el OS.** Léelo antes de mejorar, cambiar o arreglar algo en `ceo-os/`: dice qué hace cada parte y por qué existe.
Si el mapa y el código no coinciden, manda el código. Corrige el mapa en el mismo cambio.

## Antes de tocar algo

1. **Lee la sección 2** («Reglas que no se rompen»). Casi todo lo delicado vive en el servidor.
2. **Busca tu archivo** en la tabla de abajo y en las secciones 3 a 7.
3. **Corre el OS en local y las pruebas** de lo que tocaste (sección 9). Nunca contra la base de producción.
4. **Como todo el repo:** antes de escribir, presenta qué cambia. Se escribe con el OK del CEO (`CLAUDE.md` de la raíz).

### Si vas a cambiar…

| Si vas a cambiar… | Empieza en |
|---|---|
| Quién ve o edita qué | `public/js/roleviews.js` (la matriz) y `api/_lib/access.js` (el candado) |
| Una ruta de la API | `api/index.js` o el `api/_lib/<tema>.js` que la registra con `rutas(on)` |
| Una pantalla | `public/js/screens/<pantalla>.js` · las rutas `#/…` están en `public/js/app.js` |
| Un módulo de una marca | `public/js/brandlist.js` (la lista) y `public/js/screens/brands.js` (qué monta) |
| El chat de Estrategia o de Diseño | `public/js/screens/strategy.js`, `public/js/diseno-chat.js` y `public/laya/puente.py` |
| El Chat (Inherent LLM) | `public/js/screens/llm.js`, `public/js/llm/modos.js` (el harness de cada modo), `public/js/llm/paneles.js` y `public/js/hermes.js` |
| El dock (las dos apps) | `public/js/dock.js` y `irApp` en `public/js/app.js` |
| El conector MCP | `api/_lib/mcp.js` (herramientas) y `api/_lib/oauth.js` (la conexión) |
| Cómo se arma el trabajo | `public/js/recipes.js` (las recetas de siempre) y `api/_lib/flow.js` |
| Lo que el OS lee del repo | `scripts/snapshot.mjs` (la copia) y `api/_lib/gh.js` (la lectura) |
| La app de Mac | `escritorio/main.js` |
| Estilos | `public/app.css` (uno solo, con variables de color de día y de noche) |

---

## 1 · Qué es y cómo está armado

- **Inherent OS** es la web privada de Inherent. Se entra con Google: cuentas del dominio y correos de afuera que el CEO aprobó.
- **Navegador → Vercel.** El navegador carga `public/` tal cual (JS con módulos ES, sin build). Todo `/api/*` va a **una sola función**: `api/index.js`.
- **Dos fuentes de datos.** **Postgres (Neon)** guarda lo operativo en una tabla de documentos (`docs`). **El repo** guarda el manual y los clientes; en Vercel se lee de una **copia que arma el build** (`scripts/snapshot.mjs` → `api/_data/`).
- **El puente, en la compu de cada persona** (`public/laya/puente.py`, puerto 7357): corre Laya (juicios) y los chats con la IA de esa persona, en solo lectura sobre una copia del repo. El navegador le habla directo a `127.0.0.1`.
- **La app de Mac** (`escritorio/`, Electron): el mismo OS en su ventana, con el puente adentro.
- **El conector MCP** (`/mcp`): la app de IA de cada persona entra al OS con OAuth y ve solo lo que su perfil permite.
- **Servicios de afuera:** Google (login, Drive, Calendar, Sheets, Gmail), Apify (scraping), Windsor (métricas), Zernio (bandeja). Sus llaves van en variables de entorno de Vercel.

```
navegador ──▶ Vercel ── public/ (estático)
   │                └── /api/* → api/index.js ──▶ Postgres: docs · vault · audit
   │                                          ├──▶ copia del repo (api/_data/)
   │                                          └──▶ GitHub (solo para escribir) · Google · Apify · Windsor · Zernio
   └──▶ 127.0.0.1:7357  puente.py ──▶ Laya · chat (Claude Code o Codex) sobre una copia del repo
app de Mac = la misma web en una ventana + el puente adentro
```

---

## 2 · Reglas que no se rompen

**Permisos**
- El permiso se aplica **en el servidor** (`api/_lib/access.js` → `guard`, `guardAny`; `collGuard` en `api/index.js`). La interfaz solo lo refleja.
- **Vistas por rol** (`settings` id `role_views`), por perfil de trabajo: cada sección `oculto · resumen · completo · edita`, el alcance `todos · asignados · propio` y dónde abre. `public/js/roleviews.js` lo comparten servidor, conector e interfaz: un cambio ahí cambia los tres.
- `ADMIN_EMAILS` siempre son CEO. Quien entra por primera vez queda `team`. Para quien no es CEO, Finanzas nunca pasa de `resumen`.
- **Solo el CEO escribe** `team, settings, rates, packages, bundles, finance, payroll, mentors, lead_sources, recipes, invoices, bank_moves, cost_recipes` (`CEO_WRITE`).
- **Solo el CEO lee** `rates, packages, bundles, payroll, lead_sources, bank_moves, cost_recipes` (`CEO_READ`), las facturas por pagar, el baseline de los niveles, el margen objetivo (`settings` `pricing`) y `/api/repo/economia`.

**El CEO es el candado**
- **Estrategia:** solo el CEO aprueba o reabre un bloque, aprueba la estrategia en vivo y confirma la etapa (`api/_lib/estrategia.js`). Aprobado = cerrado hasta que él lo reabra.
- **Pauta:** su OK vive en `accounts.ads.ok` y vale **para ese mes y ese presupuesto**; si cambia el monto, se cae (`PUT /api/ads/accounts/:slug`).
- **También solo él:** aprobar avatares, editar recetas, editar las preguntas de Laya, escribir en el repo, aprobar y lanzar variaciones de anuncio (Marca › Ads), conectar una landing al CRM y encender la web viva.
- `strategy`, `avatars`, `formats`, `scripts`, `plans`, `videos`, `ad_variants`, `tech` y `judgments` **no pasan por `/api/db`** (responde 404): solo por sus rutas, que aplican estas reglas. No abras esa puerta.
- **La secuencia del chat de Diseño** (estrategia aprobada → plan → ideas → diseño) y **el candado del brief** (sin brief del ciclo no hay piezas con fecha de ese mes, salvo que el CEO lo abra) los hace cumplir el servidor: `api/_lib/plan.js` y `reglasPieza` en `api/index.js` (423).

**El alcance por cliente**
- Sin ficha de oferta (`clients/<cliente>/00-onboarding/plan-contratado.md`) la marca no está activa: su Investigación responde 409 y el scraping de los lunes la salta.
- El alcance `asignados` o `propio` (`scoper`) filtra proyectos, tareas, cuentas, leads, cotizaciones, presupuestos, campañas, contenido y estrategia. **Toda ruta nueva que lea datos de clientes lo aplica.**
- La marca personal del CEO (perfil `personal`) solo la ve el CEO.

**Lo que el cliente nunca ve**
- El rol `client` solo pasa por las rutas marcadas `{ client: true }` (su perfil y `/api/portal*`), y solo con su `client_slug`.
- Nunca: costos, márgenes, horas, notas internas, Intel (403 siempre) ni datos de otro cliente. `intel.limpiar` quita líneas de costos; `stripCosts` quita montos de presupuestos.
- `inherent/06-ECONOMIA.md` solo lo lee el servidor: viaja en `api/_data/repo.json` (nunca en `public/`) y sale por `/api/repo/economia` solo al CEO. `/api/repo/precios` lo entrega sin costos, salvo al CEO.

**Datos**
- Cada `PUT` lleva la versión `v` que se leyó: si alguien cambió el doc, 409 y no se pisa. Cada cambio queda en `audit`.
- **CRM** (`api/_lib/leads.js`): un lead abierto exige siguiente paso y fecha · el historial solo se agrega · el responsable es un rol · sin duplicados por WhatsApp, correo o IG.
- **Tareas:** una «Personal» la ve solo quien la creó; con dependencias abiertas no avanza (423), salvo CEO o COO.
- Lo que no tiene dato sale **vacío y dice de dónde va a salir**, nunca en cero (Indicadores, portal, Finanzas, gráficas).
- En Marcas nada se borra: avatares, formatos y guiones se archivan.

**El repo**
- **Se escribe solo con `escribirSeguro`** (`api/_lib/gh.js`): compara la huella de lo que se abrió; si el archivo cambió, 409. Nunca `writeFile` directo desde una ruta.
- Hoy escribe solo Estrategia: la ficha que falta y los `.md`/`.csv` de la carpeta del cliente (`rutaEditable` en `public/js/ficha.js`). Solo el CEO.

**Local**
- `scripts/dev.mjs` **borra `DATABASE_URL` y `POSTGRES_URL`** salvo con `DEV_BASE_REAL=1`: en local se usa PGlite en `.devdb/`. Esa regla no se quita.
- `/api/auth/dev` (entrar sin Google) solo existe fuera de Vercel y con `DEV_LOGIN=1`.

**La web**
- CSP estricta en `vercel.json`: sin scripts inline y `connect-src` cerrado. Un dominio externo nuevo se agrega ahí (`dev.mjs` copia esos mismos encabezados).
- Todo HTML se arma con `` html`…` `` (escapa lo interpolado). `raw()` solo para lo que ya es seguro.
- Toda escritura lleva `X-CEOOS: 1` y el Origin propio (`csrfOk`). `api()` de `core.js` ya lo pone.
- Los crons (`/api/cron/*`) piden `Bearer CRON_SECRET`. El webhook de Apify va firmado por marca y su cuerpo no se cree: se le vuelve a preguntar a Apify.
- La entrada pública de leads (`POST /api/intake/<clave>`): clave por fuente, honeypot, 12 envíos cada 10 min por IP y clave, 20 KB máximo.
- La web viva (`GET /api/publico/<marca>/publicado`): sin sesión, solo si el CEO la encendió, solo lo publicado y nunca links de Drive ni de Figma (`piezaPublica` en `public/js/tech.js`).

**El puente**
- **La regla de solo lectura del chat de Estrategia en `puente.py` no se quita:** `HERRAMIENTAS` (Read, Grep, Glob), `BLOQUEADAS`, `--permission-mode dontAsk`, `--strict-mcp-config`, `--restricted`, `REGLA_CHAT`; con Codex, `sandbox_mode="read-only"`. Diseño suma solo figwright (Figma); el repo sigue cerrado.
- Escucha solo en `127.0.0.1`, acepta solo los orígenes del OS, rechaza otro Host y exige el token en `/chat`.

---

## 3 · Las pantallas

Las rutas están en `public/js/app.js` (`SCREENS`, `TABS`, `resolve`). **Dos apps unidas por el dock** (`dock.js`: una barrita a la izquierda en la compu; en el cel, un atajo en cada app): **Organización** y **Chat**. Organización tiene dos espacios con un interruptor arriba: **Organization** y **Marcas**. Estrategia ya no va en el interruptor: su pantalla sigue en `#/estrategia` (el tablero y el chat por el puente) y se abre desde el panel del Chat o con ⌘K. Cada app vuelve a donde estabas (`last.<espacio>`, `space.os`). Las rutas viejas siguen funcionando como alias.

**Chat** (todo el equipo; el cliente nunca)
- `#/chat[/<sesión>]` · `screens/llm.js` — el Inherent LLM, a pantalla completa (la barra de Organización se esconde): la barra de conversaciones (nueva · modos · recientes por fecha · tú y el estado de Hermes), la conversación (pasos de las herramientas, permisos, tarjetas de criterios y de pregunta, copiar y reintentar) y el panel del modo. Un solo chat con tres modos: **Estrategia** (pide cliente; el panel es la estrategia en vivo y lo que Strategy concreta se guarda en ella si se puede editar y no está aprobada), **Organización** (tu día: tareas y leads) y **Diseño** (pide marca; las piezas del mes). La caja: modo, cliente o marca, **Privado** (responde un modelo que corre en la compu: Ollama, LM Studio, llama.cpp, vLLM; si no hay, dice cómo bajar uno), el modelo y **cuánto piensa** (Rápido · Normal · A fondo → `model_options.reasoning_effort`), dictar y los comandos «/» (`/estrategia`, `/organizacion`, `/diseno`, `/nuevo`, `/modelo`, `/privado`, `/ramificar`, `/skill`, `/terminal`). **Ramificar** (en la cabecera y en la última respuesta) sigue la conversación en una nueva con todo lo hablado (`POST /api/sessions/{id}/fork`; Hermes da por cerrada la original). En pantallas chicas el panel va encima del chat: empieza cerrado. Responde Hermes en la compu de cada persona; sin Hermes, la pantalla dice qué falta (encenderlo, la llave) y deja a la vista los chats de siempre.

**Organization** (`#/org/…`)
- `#/org/home` · `screens/home.js` — Hoy: al CEO y al COO, el pulso del mes, lo que necesita atención, la agenda y el contenido; al equipo, sus responsabilidades.
- `#/org/work` · `screens/work.js` — Mis tareas: el Workspace por perfil de trabajo (ceo, coo, content, video, ads, ventas, finance, cobros), kanban y entregar a revisión.
- `#/org/clients[/<slug>/<pestaña>]` · `screens/clients.js` — la lista de clientes y la página de cada uno: Inicio · Links · Servicio · Presupuestos · Portal y accesos.
- `#/org/operations` (`tasks · cal · time`) · `screens/operations.js` — Proyectos: el Kanban único, el calendario de trabajo y el timeline.
- `#/org/operations/p/<id>/<vista>` · `project-page.js` — la página de un proyecto.
- `#/org/portal/<slug>` · `screens/portal.js` — así ve el cliente su portal (CEO y COO).
- `#/org/sales` (`crm · pros · quotes · src`) · `screens/sales.js` — Ventas: CRM con flujo de atención y meta, Prospectos y Buscar leads, Cotizaciones, Fuentes (solo CEO).
- `#/org/services` (`paquetes · servicios · especialistas · responsabilidades`) · `screens/services.js` — lo que se vende y cómo se entrega.
- `#/org/finanzas` · `screens/finance.js` — Resumen, Facturas, Movimientos, Costos, Rentabilidad, Precios, Pagos por servicio. Para quien no es CEO: Movimientos y Facturas por cobrar.
- `#/org/vision` · `screens/vision.js` — Visión y misión (`settings` `vision`): la escribe el CEO, la lee todo el equipo.
- `#/org/team` (`org · people · roles · vistas`) · `screens/team.js` — Equipo: organigrama, perfiles, quién cubre cada rol y Vistas por rol (CEO).
- `#/org/team/laya` · `laya-ui.js` — instalar el puente, las preguntas de Laya y los últimos juicios (CEO).
- `#/org/roadmap` · `screens/roadmap.js` — los megaproyectos de Inherent, con sus proyectos y tareas.
- `#/org/library[/<carpeta>/<doc>]` · `screens/library.js` (+ `library-entrevista.js`) — SOPs, playbooks, videos, notas, entrevistas y diagramas en carpetas; una carpeta se puede ligar a Drive.
- `#/org/setup` · `screens/setup.js` — Arranque (CEO): equipo, clientes y ciclo, tareas y Library base, con lo que dice el repo.

**Estrategia** (CEO y quien él habilite en Vistas por rol; el cliente nunca)
- `#/estrategia[/<cliente>/<bloque>]` · `screens/strategy.js` — 5 bloques (Diagnóstico · Oferta · Modelo de dinero · Leads · Roadmap): el contexto a la izquierda, el chat a la derecha, la estrategia en vivo, aprobar (CEO) y editar en el repo la ficha y los documentos del cliente (CEO).

**Marcas**
- `#/marcas` · `screens/brands.js` — una tile por marca: Inherent, clientes con ficha, los que vienen de una cotización, perfiles de contenido y la marca personal (solo CEO).
- `#/marcas/<marca>/<módulo>` · `screens/brands.js` — monta el módulo (la lista está en `brandlist.js` → `MODULES` y `AREAS`):
  - `inicio` → `brand-home.js` · `investigacion` → `screens/content.js` + `investigacion.js` · `icp` → `avatar-ui.js` · `brief` → `brand-brief.js`
  - `plan` → `plan-mes-ui.js` · `formatos` → `formatos-ui.js` · `ideas` → `screens/content.js` + `posts.js` · `creacion` → `creacion-ui.js`
  - `marca` → `brand-board.js` (en la marca personal, `screens/me-brand.js`) · `design` → `design-system-ui.js`
  - `calendario` → `screens/content.js` + `calendario-vistas.js` · `resultados` → `screens/content.js` (Analytics)
  - `video` → `video-ui.js` (el kit de edición y las fichas) · `ads` → `ads-ui.js` (variaciones con el OK del CEO) · `tech` → `tech-ui.js` (sitios, landing al CRM, web viva y SEO)
- `#/marcas/diseno[/<marca>]` · `diseno-chat.js` — el chat de Diseño gráfico: Plan del mes → Ideas → Diseño en Figma. Ya no va en la barra de Marcas (su lugar es el modo Diseño del Chat); se abre desde el panel del Chat y con ⌘K.

**Fuera de los espacios**
- `#/me` · `screens/me.js` — Mi perfil: foto, cumpleaños, contacto, conexiones (Google y el conector MCP) y salir.
- `#/portal` · `screens/portal.js` — el portal del rol `client`: Resumen · Contenido (aprobar o pedir cambios) · Entregas · Metas.
- `/?connect=<id>` · `connectai.js` — la pantalla «Permitir» cuando una app de IA se conecta por MCP.
- `/diagnostico` · `public/diagnostico.html` + `diagnostico.js` — el quiz público, sin login, que manda leads a la fuente tipo quiz.

**Archivos de pantalla sin ruta**
- `screens/control.js`, `screens/results.js`, `screens/control-hub.js` y `screens/soon.js`: sus rutas llevan a Hoy o no existen.
- `screens/content.js` y `screens/me-brand.js` no tienen ruta propia: se montan dentro de Marcas.

---

## 4 · El servidor

- `api/index.js` — la única función serverless: el router (`on(método, patrón, fn)`) y las rutas de auth, `me`, `status`, documentos (`db/:coll[/:id]` con `collGuard`), repo, contenido, crons, Drive, Calendar, Finanzas, portal, pauta, Indicadores, flujo comercial, MCP y OAuth, intake y buscador · un solo punto de entrada para que todo pase por los mismos candados.
- `middleware.js` — manda a `/mcp` lo que le habla a la raíz como servidor MCP · el navegador sigue viendo la web.
- `vercel.json` — el build (`snapshot.mjs`), los rewrites (`/api/*`, `/mcp`, `/.well-known/*`, `/diagnostico`), los encabezados de seguridad, 60 s por llamada y 3 crons: scraping los lunes, recoger lo que quedó corriendo cada día, recurrentes cada día.

**`api/_lib/`**
- `access.js` — quién entra a qué: `COLLS` (colección → área), `CEO_WRITE`, `CEO_READ`, `SCOPED`, `guard`/`guardAny`, anti-CSRF, alcance (`scoper`) y lo que se recorta (`stripAccesos`, `stripCosts`, `stripInvoice`, `summaryOf`) · el candado de todo.
- `ads.js` — el tablero de pauta por cliente (Windsor) y los anuncios activos de la competencia (Apify, biblioteca de Meta) en `sources/ads-<slug>` · rutas `ads/report`, `ads/competitors/:slug`.
- `ads-studio.js` — Marca › Ads sobre `ad_variants`: variaciones en Borrador, solo el CEO aprueba o reabre, «Lanzar» (CEO, con presupuesto) crea la tarea para ⑩ Ads y no toca ninguna cuenta de anuncios · rutas `ads-studio*`.
- `avatares.js` — Cliente ideal sobre `avatars`: edita quien edita Contenido, aprueba solo el CEO, se archiva · rutas `avatares*`.
- `buscar.js` — Buscar leads: Apify (Google Maps o Instagram) deja prospectos sin duplicar; cada búsqueda en `lead_searches`, con tope de ítems y de gasto · rutas `leads/buscar*`.
- `content.js` — perfiles de contenido, su configuración (`sources/cfg-`), el scraping con Apify en dos tiempos (arranca; recoge el webhook, la página abierta o el cron) y el tope de Apify por marca · lo usan Contenido e Investigación.
- `creacion.js` — Formatos y Guiones (`formats`, `scripts`); «Pasar a Ideas» crea o pone al día la pieza del calendario · rutas `formatos*`, `guiones*`.
- `escritorio.js` — la app de Mac pregunta aquí si hay versión nueva y pide el link del `.zip`: el repo es privado, así que el OS lee las versiones de GitHub Releases con `GITHUB_TOKEN` y la app pregunta con la sesión de quien la usa · rutas `escritorio/version`, `escritorio/descarga`.
- `db.js` — Postgres (Neon) o PGlite en local; crea `docs`, `vault` y `audit`; `list · get · create · update(v) · upsert · remove` · la única puerta a la base.
- `estrategia.js` — los 5 bloques, la estrategia en vivo, la etapa, las fuentes de hormozi-brain, la Library como contexto del chat y escribir en el repo (CEO) · rutas `estrategia*`.
- `facturas.js` — cobros del mes sin duplicar, registrar, marcar pagada (crea el ingreso o el gasto y los costos del cliente), estado de cuenta y cruce · solo el CEO.
- `flow.js` — lead → cotización → pago → cliente y proyecto con las tareas de las recetas; activar paquete o plan; rol → persona; portal y onboarding del cliente · rutas `flow/*`.
- `gh.js` — el repo: lee del disco (local), de la copia del build (Vercel) o de GitHub; escribe con `escribirSeguro`; `ghApi` para otras llamadas a GitHub (las versiones de la app) · la única puerta al repo.
- `google.js` — login con Google (equipo y portal), el token de cada persona (sellado en `vault`), llamadas a Google y correo por Gmail.
- `http.js` — `body()` y `fail()`: cada error conocido a su código y un mensaje claro.
- `internos.js` — lo interno que no puede ir en el código público: los paquetes por industria y sus reglas de costo, el baseline de los niveles y el mapa inicial de especialistas (`datos/paquetes-industria.js`) · rutas `internos/*`, casi todas solo CEO.
- `intel.js` — los entregables de los agentes en la carpeta del cliente (según `intel-mapa.js`), limpios de costos, y el avatar · ruta `repo/client/:slug/intel` (al cliente, 403).
- `investigacion.js` — referentes por marca, «Actualizar ahora» (CEO y COO), webhook de Apify, crons, posts nuevos a Research con su juicio de Laya por hacer · rutas `investigacion*`.
- `ojo.js` — el contexto del ojo visual por marca (el moodboard y una frase de la marca) · ruta `ojo/contexto`.
- `avisos.js` — los avisos al celular (web push, con `web-push`): `avisos/clave`, `avisos/suscribir`, `avisos/quitar`, `avisos/probar` y el cron `cron/avisos` (la mañana: tus tareas de hoy y los leads sin responder). `nuevoLead` avisa a quien ve Ventas cuando entra un lead. Claves en `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.
- `guia.js` — el primer día y los videos «Cómo se usa»: `guia` (los documentos de la Library marcados con `guia = <sección>`), `guia/visto` (qué vio cada quien, en `team.<email>.vistos`), `me/primer-dia` (el recorrido: paso, hechos, pausado, terminado; la prueba final se detecta por lo que creó la persona).
- `laya.js` — los juicios (`judgments`), las preguntas (`settings` `laya_gates`, solo el CEO), los que esperan juicio y las herramientas MCP `juicios_pendientes` y `guardar_juicio` · rutas `laya/*`.
- `leads.js` — las reglas del CRM (etapas, candado, duplicados, historial), las fuentes y la entrada pública.
- `mail.js` — correos al cliente (bienvenida e invitación) desde el Gmail de quien confirma; sin permiso de Gmail, un link con el correo escrito.
- `mcp.js` — el conector MCP: las herramientas con su área, cuáles escriben, cuáles oculta «resumen» y cuáles son solo del CEO.
- `oauth.js` — OAuth 2.1 con PKCE para el conector: registro, «Permitir», códigos y tokens (solo su hash, en `vault`), revocar.
- `parse.js` — lee las tablas del manual (`06-ECONOMIA`, `05-OPERACION`, la ficha de oferta) · si cambia el formato del manual, `npm test` avisa.
- `plan.js` — Plan del mes (`plans`, id `<marca>--<AAAA-MM>`): guardar, poner las ideas, pasar a Creatividad sin duplicar · rutas `plan/:slug/:mes*`.
- `portal.js` — lo que calcula `/api/portal` (Instagram por Windsor, piezas, metas, entregas, resumen) y la aprobación del cliente.
- `recipes.js` — las recetas en uso: las de siempre más lo que editó el CEO.
- `recurring.js` — las tareas de las responsabilidades recurrentes, sin duplicar (una clave por periodo).
- `refs.js` — Referencias por pilar: videos que pega el equipo → Apify busca lo que más rindió de esos creadores (`sources/refs-<slug>`).
- `results.js` — los Indicadores reales (comercial, entregas a tiempo, ingresos del mes, metas) y el `done_at` de cada tarea.
- `session.js` — la cookie firmada: 30 días máximo, 14 sin uso, se renueva al usarse.
- `tech.js` — Marca › Tech sobre `tech`: sitios, conectar una landing al CRM (el CEO crea su fuente de leads), la web viva (la enciende el CEO) y las auditorías de SEO · rutas `tech*` y la pública `publico/:marca/publicado`.
- `vault.js` — cifra con AES-256-GCM, con una clave que sale de `SESSION_SECRET`.
- `video.js` — Marca › Video sobre `videos`: el kit de edición (`kit--<marca>`) y las fichas de video, que se archivan · rutas `video*`.
- `zernio.js` — la bandeja de comentarios y DMs de las cuentas propias, solo lectura.

**`api/_data/`** — lo genera el build y está en `.gitignore`: `repo.json` (la copia del repo que lee el OS) y `fuentes.json` (hormozi-brain para Estrategia).

---

## 5 · Los módulos del navegador

Todos en `public/js/`. «Puro» = sin DOM ni red: lo comparten servidor, conector, interfaz y pruebas.

**Núcleo**
- `public/index.html` — la única página: carga Inter, `app.css` y `js/app.js` · todo vive en `#root`.
- `public/app.css` — todos los estilos, con variables de color de día y de noche.
- `app.js` — login, las dos apps y sus espacios, la barra y las pestañas, el router y sus alias, y el arranque · la entrada del navegador.
- `dock.js` — el dock: Organización y Chat, la app activa y el salto a la otra (`pintarDock`, `quitarDock`, `icoApp`).
- `core.js` — `html`/`raw`/`mount`, `api()` y `col()`, toast, drawer, `ask`, íconos, markdown, Mermaid, CSV, `openClaude`/`claudeJSON` · lo que usan todas las pantallas.
- `roleviews.js` — la matriz de Vistas por rol, secciones, espacios, rutas mudadas y el «para qué» de cada puesto · compartido con el servidor.
- `levels.js` — los 3 niveles y la traducción de nombres viejos; el baseline (solo CEO) · un solo lugar para los niveles.
- `element.js` — el modelo de elemento: estados (Idea · En proceso · Listo · Publicado), nombre automático y archivado · puro.
- `search.js` — el buscador ⌘K: «Ir a» más `/api/search`.
- `menu-contextual.js` — clic derecho en tareas, proyectos, clientes, leads y respuestas del chat.
- `brandlist.js` — las marcas, sus módulos y áreas, y qué ve cada perfil dentro de una marca.
- `stratlist.js` — los clientes del espacio Estrategia.
- `purpose.js` — la tarjeta «Tu puesto».
- `charts.js` — gráficas SVG sin librerías; si todo está en cero, no pintan nada.
- `divisor.js` — el divisor que se arrastra entre el chat y su panel.

**Chats, puente y Laya**
- `laya.js` — la dirección del puente (`PUENTE`), los comandos de instalación, las puertas de Laya y sus preguntas, cómo se lee un juicio · puro.
- `laya-ui.js` — el chip del juicio en cada ficha y la vista Inherent → Laya; primero el puente, si no responde, el juicio queda en espera.
- `ojo.js` — el ojo visual: el estado del puente, `verImagen` (url o base64) y el chip «Se ve de la marca · 82%».
- `puente-chat.js` — `/health` y `/chat` del puente, en solo lectura, para pantallas fuera de Estrategia; las dos fallas típicas con sus pasos.
- `motor-ui.js` — elegir el motor del chat (`claude`, `chatgpt` o `local`) y qué le falta a la compu · se guarda por persona.
- `hermes.js` — Hermes Agent en la compu de cada persona (el harness de los chats): la conexión (`hermesDe`: la app de Mac la entrega sola o se pega la llave una vez), `saludHermes`, `modelosHermes` (los proveedores y modelos que esa compu tiene conectados) y `chatHermes` (streaming por su API compatible con OpenAI, una sesión por chat del OS). · la API de sesiones del Inherent LLM: `sesionesHermes`, `crearSesion`, `mensajesSesion`, `borrarSesion`, `skillsHermes`, `turnoSesion` (SSE: pasos, deltas, permisos y el texto final) y `responderAprobacion`.
- `llm/modos.js` — el Inherent LLM sin pantalla: los 3 modos, las reglas comunes, el harness de cada modo (rol, cómo trabaja, herramientas y criterios de aceptación), `sistemaDe` (el system prompt de cada turno), los comandos «/», los comandos de la Terminal, las tarjetas (`leerTarjetas`: ```criterios``` y ```pregunta```) y el id de cada sesión (`inh-<modo>-<cliente>-…`) · puro.
- `llm/paneles.js` — el panel de la derecha del Chat según el modo (`panelDe`) y los datos de Estrategia de un cliente (`datosEstrategia`, con caché que se olvida después de cada respuesta).
- `avisos.js` — activar, quitar y probar los avisos en este dispositivo (registra `public/sw.js`, pide permiso y guarda la suscripción). En iPhone solo funciona con el OS agregado a la pantalla de inicio.
- `guia.js` — «Cómo se usa»: el botón de la barra (`#guiabtn`, lo prende `app.js` según la sección), la ventanita flotante del video (`.guia-pip`: sigue contigo al navegar, se minimiza, cambia de lado) y la lista de videos vistos.
- `guia-secciones.js` — las secciones que pueden tener video y qué videos le tocan a cada puesto · puro (lo usa también el servidor).
- `primer-dia.js` — el recorrido del primer día: 6 pasos con check (quién eres · la app · Claude · Laya · Google · una prueba), se comprueba solo contra el puente y la cuenta, se pausa y se retoma desde el chip de la barra (`#pdchip`).
- `artifact.js` — el panel derecho de los chats y sus íconos.
- `voz.js` — dictar en la caja del chat.
- `diseno-chat.js` — el chat de Diseño gráfico (Plan → Ideas → Diseño), su área de trabajo y el emparejamiento.
- `diseno.js` — el pedido de la etapa Diseño y cómo se lee la respuesta (la pieza queda Lista) · puro.
- `ideas-chat.js` — el pedido de la etapa Ideas y cómo se leen las ideas · puro.
- `connectai.js` — conectar el OS a la IA de cada persona por MCP y la pantalla «Permitir».

**Estrategia**
- `estrategia.js` — los 5 bloques, el límite por nivel y las etapas del roadmap, tomados de los WORKFLOW y de hormozi-brain · puro.
- `estrategia-viva.js` — la estrategia en vivo (`<slug>--viva`): los parches que manda el chat y la cascada calculada · puro.
- `estrategia-viva-ui.js` — el panel visual de la estrategia en vivo.
- `ficha.js` — la ficha de oferta escrita desde el OS (lo vacío queda «⚠️ SIN DATOS») y qué rutas del repo se pueden editar · puro.
- `intel-mapa.js` — el mapa de entregables por departamento y si los ve el cliente · lo usan el build, el servidor y la interfaz.
- `intel-ui.js` — la pestaña «Entregables» de un proyecto.

**Marcas · entender**
- `investigacion.js` — la página de Investigación: estado, «Lo que funciona», la biblioteca y los referentes.
- `referentes.js` — categorías de referentes, cuentas, clave de post sin duplicados y resonancia · puro.
- `avatares.js` — el método del Cliente ideal (campos, pesos, regla 10×) · compartido con el servidor.
- `avatar-ui.js` — la pantalla del Cliente ideal.
- `brand-brief.js` — el brief del ciclo (sale del repo) y su candado sobre el calendario.
- `brand-home.js` — el Inicio de una marca.
- `bullseye.js` — la diana de audiencia.

**Marcas · crear y diseñar**
- `plan-mes.js` — el Plan del mes de ③ Marketing (slots) · puro.
- `plan-mes-ui.js` — la herramienta del Plan del mes y su panel.
- `formatos.js` — las plantillas base de reel y story y la forma de un guion · compartido con el servidor.
- `formatos-ui.js` — la pantalla de Formatos.
- `creacion-ui.js` — el editor de guiones.
- `posts.js` — las piezas de la idea a publicado, su tablero, la conexión a Drive y los archivos de cada pieza (`assets`: foto, video o lámina subidos a Drive, con miniatura).
- `brand-board.js` — Identidad: moodboard, música, personas, marcas y tono.
- `sistema-visual.js` — lee `02-marca/sistema-visual.md` y lo vuelve datos · puro.
- `design-system-ui.js` — el Design system a la vista, cada valor copiable.

**Marcas · video, anuncios y web**
- `video.js` — el kit de edición (sale del design system con `kitDesdeSistema`), la ficha de video y el pedido para ⑦ Video Editing · puro.
- `video-ui.js` — la pantalla de Video: el kit con su vista previa 9:16, las fichas con su línea de tiempo y «Armar con Claude».
- `ads-studio.js` — las variaciones (Meta y Google, con sus límites de caracteres), sus estados y quién los cambia, el pedido a Claude y la tarea para ⑩ · puro.
- `ads-ui.js` — la pantalla de Ads: crear variaciones (por el puente o pegando la respuesta), Laya las califica, aprobar (CEO) y lanzar (CEO).
- `tech.js` — los sitios, el formulario de la landing, el pedido de auditoría de SEO y lo que la web viva puede compartir · puro.
- `tech-ui.js` — la pantalla de Tech.

**Calendarios**
- `calendario-contenido.js` — el calendario de contenido de una marca: mezcla del mes, filtros y candado del brief.
- `calendario-trabajo.js` — el calendario de trabajo único: reuniones, producción, entregas, ventas, facturas y los días 1, 11 y 20 del ciclo.
- `calendario-vistas.js` — el calendario de una marca con 3 filtros: Operativo, Planificación, Programado.
- El Archivo (lo publicado hace más de 30 días o marcado «Archivado») se ve en Ideas y en el calendario de la marca, y una pieza se recupera como Listo (`archivoHtml` en `screens/content.js`).

**Proyectos y tareas**
- `project-page.js` — la página de un proyecto: Tareas, Resumen, Timeline, Calendario, Archivos, Equipo.
- `kanban.js` — el Kanban único de tareas (Proyectos, un proyecto, el Workspace).
- `taskcard.js` — entregar una tarea (link o archivo a Drive → En revisión).
- `tasktype.js` — tipo de tarea y SOP.
- `create.js` — crear proyectos y tareas con preguntas.
- `cycle.js` — el ciclo del 1 al 20, fases, departamentos, horas y precio por nivel de servicio.
- `meetings.js` — las reuniones de cada proyecto y agendarlas en el calendario de Inherent.
- `rolemap.js` — quién cubre cada rol en un proyecto.
- `recipes.js` — las recetas de siempre (ciclo, growth, proyecto, custom, servicio, paquete, interna) · compartido con el servidor.
- `recetas.js` — la pantalla para editar recetas (CEO).
- `responsabilidades.js` — la tabla por paquete o servicio (Servicios → Responsabilidades).

**Ventas**
- `ventas-flujo.js` — el flujo de atención y cierre (responder en un minuto) y los nombres de las etapas · puro.
- `ventas-meta.js` — la meta del mes hacia atrás, el pronóstico y lo estancado · puro.
- `flowui.js` — subir un pago, ver el comprobante y arrancar el proyecto.
- `quotes-short.js` — la tabla corta de cotizaciones.
- `diagnostico.js` — el quiz público.

**Servicios y precios**
- `catalogo.js` — el catálogo de servicios y su editor (el costo, solo CEO).
- `armados.js` — paquetes armados con servicios del catálogo (solo CEO).
- `servicios-paquetes.js` — Servicios → Paquetes por nivel.
- `paquetes.js` — los paquetes por industria (los entrega `/api/internos/paquetes` más los ajustes en `packages`), solo CEO.
- `mentors.js` — la red de especialistas.

**Clientes**
- `client-service.js` — la pestaña Servicio del cliente.
- `budgets.js` — los Presupuestos del cliente.
- `goals.js` — las metas del cliente (`accounts.goals`).

**Finanzas**
- `facturas.js` — la forma de una factura (es un contrato: otras pantallas la leen), estados, cobros del mes, el CSV del banco y el cruce · compartido con servidor y conector.
- `facturas-ui.js` — Finanzas → Facturas.
- `finscope.js` — la rentabilidad por alcance: costo de los módulos contra lo que entra.

**Library**
- `library-tree.js` — carpetas anidadas · puro.
- `library-ui.js` — menú contextual, arrastrar y soltar, «Mover a…».
- `diagram-model.js` — el modelo de diagramas y la ida y vuelta con Mermaid · puro.
- `diagram-editor.js` — el editor visual de diagramas.
- `recorder.js` — grabar pantalla con cámara; sube a Drive y entra a la Library.

**Lo demás de `public/`**
- `public/diagnostico.html` — la página pública del quiz.
- `public/vendor/` — Mermaid, jsPDF y html2canvas (el PDF de las cotizaciones), con sus licencias.
- `public/brand/` y `public/manifest.webmanifest` — logos, íconos y la instalación como app.
- `public/laya/` — `puente.py`, `instalar.sh` e `instalar.ps1` (sección 6).

---

## 6 · Los chats y el puente

**Cómo habla el OS con la compu**
- El navegador llama directo a `http://127.0.0.1:7357` (`PUENTE` en `laya.js`); la CSP lo permite. Vercel nunca habla con el puente.
- **Cómo se ve un chat** (Estrategia y Diseño comparten las clases `es-*` y `ch-*` de `app.css`): la barra de pasos arriba (`barraChat` en `artifact.js`), la conversación centrada (`.es-msgs`), el mensaje propio en burbuja suave con la hora al pasar (`.es-m.u`, `.es-hora`), la respuesta con avatar y sin burbuja (`.es-m.a`, `.es-av`, `.es-tx`) y sus acciones al pasar (`.ch-acts`: copiar, reintentar, guardar como borrador), el vacío con título y tarjetas (`.es-hint h1`, `.ch-cards`), la flecha para bajar al final (`.ch-abajo`), la caja (`.es-box`) con su franja (`bandeja`) y el aviso de abajo (`.ch-aviso`). No hay historial de chats: uno por parte del proceso.
- **Emparejar:** el puente crea un token la primera vez (`~/.inherent/laya/chat-token`, permisos 0600). La persona lo pega una vez y queda en `localStorage` (`os.estrategia.token.<correo>`). En la app de Mac llega solo (`window.inherentEscritorio.token`).
- `puente.py --token` muestra el token · `--nuevo-token` lo cambia · 8 tokens malos en un minuto frenan los intentos.
- **Endpoints:** `GET /health` (Laya, chat, motores y el ojo visual) · `POST /juzgar` (Laya) · `POST /ver` (el ojo visual) · `GET /chat/estado` (probar el token) · `POST /chat` (respuesta en SSE: `inicio · delta · herramienta · fin · error`, más `imagen` en Diseño) · `POST /chat/sincronizar` (con el token: pone al día la copia del repo y borra cualquier cambio local; el Chat lo llama antes de cada turno de Hermes).
- **Cuerpo de `/chat`:** `prompt` (hasta 60 000 caracteres), `resume` (para seguir la conversación), `modo`, `motor` y `modelo`.
- **Un chat a la vez** por compu; 240 s por respuesta (`INHERENT_CHAT_SEGUNDOS`), 600 s en Diseño.

**Los modos**
- `estrategia` (el de siempre): solo leer el repo, sin MCP. Lo usan Estrategia, Cliente ideal, Guiones, Investigación y las etapas Plan e Ideas del chat de Diseño.
- `diseno`: el mismo candado sobre el repo más un único MCP, figwright (Figma). Solo la etapa Diseño. Las capturas de Figma vuelven al OS.

**Los motores** (los elige cada persona en `motor-ui.js`)
- `claude` → Claude Code (`claude -p`); los alias de modelo permitidos están en `CLAUDE_MODELOS` (`puente.py` y `motor-ui.js`).
- `chatgpt` → Codex (`codex exec`), en sandbox de solo lectura y sin la configuración de la persona.
- `local` → Codex con Ollama; los modelos locales no diseñan en Figma.

**La copia del repo**
- El puente mantiene su propia copia en `~/.inherent/laya/repo` y la pone al día con `main` antes de cada chat (como mucho, una vez por minuto). Nadie la edita.
- Con `INHERENT_REPO` (variable o línea en el archivo `config` junto al puente) usa el clon que digas.

**Laya**
- Motor de decisiones de código abierto que corre en la compu: responde preguntas fijas sobre un texto (una opción, un puntaje, sí o no). Solo lee texto.
- **Flujo:** el navegador pide el texto a `/api/laya/texto` → lo juzga en `127.0.0.1:7357/juzgar` → lo guarda en `/api/laya/juicios`.
- **Sin puente,** el juicio queda en espera; lo resuelve una sesión de Claude Code con Laya por MCP, con `juicios_pendientes` y `guardar_juicio` del conector.
- **Las puertas** (`PUERTAS` en `laya.js`, editables por el CEO): lead, factura por pagar, referente de Investigación, hook o copy, etapa del negocio.

**Hermes, el harness** (`public/laya/hermes/instalar.sh`, `public/laya/hermes/SOUL.md`, `public/js/hermes.js`, `motor-ui.js`)
- Hermes Agent (Nous Research, código abierto) corre en la compu de cada persona con el perfil «inherent»: su identidad es `SOUL.md`, su carpeta de trabajo es la copia del repo del puente (`~/.inherent/laya/repo`, así lee `CLAUDE.md` y el manual), tiene el conector de Inherent OS por MCP (OAuth) y su API local en `127.0.0.1:8642`, solo para el OS, con una llave en `~/.inherent/hermes/api-key` que la app de Mac lee sola.
- La instala la app (menú Puente › Instalar Hermes) o un comando (`curl -fsSL …/laya/hermes/instalar.sh | bash`). El modelo lo elige cada quien en Hermes (`inherent model`: ChatGPT con su cuenta, Claude, OpenRouter, Nous, o uno local) y el selector del chat lista lo que esa compu tiene conectado (sección «Hermes»).
- **El Chat (`#/chat`) corre todo por Hermes:** cada conversación es una sesión de Hermes (`inh-<modo>-…`, la lista y el historial viven en Hermes) y cada turno manda el harness del modo como `system_message` (`llm/modos.js` → `sistemaDe`), encima de `SOUL.md` y del `CLAUDE.md` que Hermes lee de su carpeta. El chat de Estrategia de siempre también responde por Hermes cuando se elige uno de sus modelos; el de Diseño sigue por el puente. Laya y el ojo visual no cambian.
- **Solo lectura:** el perfil «inherent» trae apagadas las herramientas `terminal`, `code_execution`, `browser`, `computer_use` y `cronjob` (`agent.disabled_toolsets`), y antes de cada turno el puente pone al día y limpia la copia del repo (`/chat/sincronizar`). Lo que se guarda en el OS va por el conector, con lo que el perfil de la persona permite.
- **Modelo local:** Hermes necesita al menos 64K de contexto en el modelo local (`inherent config set model.ollama_num_ctx 65536`); los pasos están en `INSTALAR.md` y en Ajustes del Chat.
- **CORS de Hermes:** solo `GET`, `POST` y `DELETE` y las cabeceras `Authorization`, `Content-Type`, `Idempotency-Key` y `X-Hermes-Session-Id`. Una cabecera de más rompe la llamada desde el navegador.
- Vercel nunca habla con Hermes. El CSP permite `connect-src http://127.0.0.1:8642`.

**El ojo visual** (`Ojo` en `puente.py`, `public/js/ojo.js`, `api/_lib/ojo.js`)
- ¿Esta imagen se parece a la marca? Lo decide el puente con CLIP (`openai/clip-vit-base-patch32`, ~600 MB que baja la primera vez que arranca), comparando la imagen con el moodboard de la marca (`brand_boards.images`) y con una frase de la marca (colores del design system, tono). Solo parecido, nunca calidad.
- `POST /ver { url | imagen (base64), refs, texto }` → `{ parecido 0..1, refs }`. Sin `transformers` + `Pillow` en la compu, responde 503 y el OS no muestra el chip.
- El contexto lo arma el servidor en `GET /api/ojo/contexto?profile=`. El chip sale en Investigación (cada referente con imagen, guardado en `ojo`), en las láminas del chat de Diseño (la captura de Figma) y en la ficha de una pieza (su primera imagen).

**El instalador** (`public/laya/instalar.sh` para Mac y Linux, `instalar.ps1` para Windows)
- Sin permisos de administrador, todo en `~/.inherent/laya`: `uv`, un Python 3.12 propio, `laya[serve]` y Pillow, el puente y el modelo de Laya (el del ojo visual lo baja el puente al arrancar).
- Lo deja siempre encendido: LaunchAgent `global.inherent.laya` (Mac), servicio de usuario `inherent-laya` (Linux), tarea programada «Inherent Laya» (Windows).
- Prepara la copia del repo (`puente.py --sincronizar`); si GitHub pide sesión, usa `gh auth login`.
- Opciones: `--modelo-local` (Ollama y un modelo pequeño) · `--solo-modelo-local` · `--desinstalar`. Correrlo otra vez actualiza.
- Registros: `~/.inherent/laya/log/` (`puente.log`, `instalar.log`).

**Las dos copias del puente**
- `public/laya/puente.py` es el que baja el instalador y el que trae la app de Mac.
- `tools/laya-puente/puente.py` (con su `README.md`) es la copia para correrlo a mano. Deben ser idénticas: si cambias una, copia la otra (`npm test` avisa si no).

**El otro camino a la IA**
- `openClaude` y `claudeJSON` (`core.js`) abren la IA de la persona en una pestaña nueva con el prompt listo; la persona pega la respuesta. Lo usan Contenido, Investigación, la diana, la Library, el Workspace y los paquetes por industria.

---

**Los avisos al celular** (`public/sw.js`, `public/js/avisos.js`, `api/_lib/avisos.js`)
- El OS se instala como app (manifest) y, con los avisos activados desde Mi perfil, recibe: un aviso cuando entra un lead (a quien ve Ventas, para responder en un minuto) y, de lunes a viernes a las 7:30 de Guatemala (`cron/avisos`), lo que necesita atención hoy. El service worker solo recibe avisos: no guarda páginas.
- La suscripción de cada dispositivo vive en `team.<email>.push` (hasta 5); las muertas se olvidan solas. Sin las claves VAPID en Vercel, el botón dice que faltan y nada se rompe.

**Las facturas de proveedores desde Gmail** (`public/js/facturas-ui.js` → `desdeGmail`)
- En Finanzas › Facturas, «Registrar desde Gmail» abre Claude con el pedido: correr `ap-processor` sobre la etiqueta «Facturas» del Gmail del CEO y registrar cada factura con `registrar_factura` del conector (tipo pagar), sin duplicar y sin pagar nada. La etiqueta la crea el CEO en Gmail.

**El primer día y «Cómo se usa»** (`public/js/primer-dia.js`, `public/js/guia.js`, `api/_lib/guia.js`)
- La primera vez que alguien del equipo entra, se abre el recorrido de 6 pasos. Cada paso se comprueba solo: la app (el puente responde o `window.inherentEscritorio`), Claude (`chat.claude` del `/health`), Laya (`listo`), Google (Drive y Calendar en `me.google`), la prueba (algo creado con su cuenta en content, tasks, leads o projects). Los pasos de la app, Claude y Laya se pueden saltar («mi puesto no usa esto»).
- «Seguir después» lo pausa: queda el chip «Tu primer día · n de 6» en la barra; Mi perfil también lo reabre. Se guarda en `team.<email>.primer_dia`.
- Un video «Cómo se usa» es un documento de la Library (tipo Video, con link) al que el CEO o el COO le ponen la sección (`guia`), el orden y los perfiles. El botón de la barra aparece en esa sección; con varios videos sale un menú. Al abrirlo queda anotado en `team.<email>.vistos`; Mi perfil lista los de su puesto y Equipo dice cuántos vio cada quien.
- Pendiente para después: las marcas de tiempo que resaltan botones de la pantalla mientras corre el video.

## 7 · La app de Mac

- `escritorio/main.js` — el OS en su propia ventana (Electron), con el puente adentro:
  - **Al abrir:** usa el puente que ya corre (el del instalador; si hay LaunchAgent, lo espera unos segundos). Si no hay, prende el `puente.py` que trae, con el Python del instalador, de Homebrew o de la Mac.
  - **Token:** se lo pasa al OS, así no hay que emparejar. **Al cerrar** apaga solo el puente que prendió.
  - **Laya:** si no está, ofrece instalarla una vez con el `instalar.sh` que trae, con una ventana de progreso. «Ahora no» queda guardado en `~/.inherent/laya/app-sin-laya`. Si faltan las herramientas de Apple, ofrece instalarlas.
  - **Ventana:** solo navega dentro del OS y de Google (el login); lo demás se abre en el navegador. Quita «Electron» del user agent para que Google deje entrar.
  - **Se actualiza sola:** al abrir (cuando el OS carga con sesión) y cada 6 horas pregunta a `/api/escritorio/version`. Si hay una versión más nueva, avisa; «Actualizar» baja el `.zip` del link firmado de GitHub, lo abre con `ditto`, y un script (`CAMBIAR`) espera a que la app cierre, la cambia por la nueva y la vuelve a abrir. Si macOS no deja cambiarla, muestra la nueva en el Finder para arrastrarla a Aplicaciones. «Después» no vuelve a preguntar por esa versión hasta reabrir.
  - **Tamaño:** arranca al 85% y recuerda el que elijas (⌘ − / ⌘ + / ⌘ 0 y el gesto de pellizcar) en `~/.inherent/laya/app-ajustes.json`.
  - **Una sola instancia.** Menú «Inherent OS»: Buscar actualizaciones… · Menú «Ver»: Tamaño normal, Acercar, Alejar · Menú «Puente»: Reiniciar el puente · Instalar Laya · Abrir la carpeta de registros (`~/.inherent/laya/logs`). `INHERENT_OS_URL` apunta la app a otro OS.
- `escritorio/preload.js` — lo único que ve el OS: `window.inherentEscritorio = { token, plataforma }`. El token solo se entrega a páginas del dominio del OS.
- `escritorio/firmar.js` — firma «ad hoc» la app después de empacar (`afterPack`) · sin ninguna firma, una Mac con chip de Apple no la abre.
- `escritorio/package.json` — Electron y electron-builder; empaca `main.js` y `preload.js`, y como recursos `public/laya/puente.py` e `instalar.sh`. `npm start` la abre; `npm run mac` arma los `.dmg` (para instalar) y los `.zip` (los baja la actualización), para chip de Apple e Intel. **Cada cambio de la app sube la versión aquí:** la actualización solo avisa si la versión publicada es mayor.
- `escritorio/build/icon.png` — el ícono.
- `.github/workflows/escritorio.yml` — arma la app en una Mac de GitHub con push a `main` o a `escritorio-*` (si cambió `escritorio/`, `puente.py`, `instalar.sh` o el workflow) o a mano, y la publica en GitHub Releases (`escritorio-v<versión>-<n>`, con los `.dmg` y los `.zip`): desde `main` como la última, desde otra rama como prueba. Si falla, deja el registro en `escritorio-registro-<n>`.
- El OS ofrece la descarga con el link de la última versión (`APP_MAC` en `laya.js`). `.vercelignore` deja `/escritorio/` fuera de Vercel.

---

## 8 · Datos

**Las tablas** (las crea `db.js` al conectar)
- `docs` — `(coll, id)` → `data` (JSON), `v` (versión), `created_at`, `updated_at`, `created_by`, `updated_by` · todo lo operativo.
- `vault` — `k` → `val`: los tokens de Google de cada persona (sellados) y lo del OAuth del conector (solo hashes).
- `audit` — quién, qué (`create · update · delete`), colección, doc y cuándo.

**Las colecciones de `docs`** (el área sale de `COLLS` en `access.js`)

| Colección | Área | Qué guarda |
|---|---|---|
| `team` | team | Personas (id = correo): rol, perfiles de trabajo, activo, cliente del portal, permisos de Google, conector MCP |
| `settings` | home | Ajustes con id fijo (abajo). Los lee el equipo; los escribe el CEO |
| `accounts` | clients | La cuenta de cada cliente (`acc-<slug>`): contacto, metas, accesos, onboarding, cuentas de pauta y el OK del CEO |
| `brand_boards` | clients | Identidad de la marca (id = slug o `personal`) |
| `budgets` | clients | Presupuestos de photo shoot, pauta y eventos; los montos solo para CEO, COO y quien edita Clientes |
| `projects` | operations | Proyectos: tipo, ciclo, fases, reuniones, `roles_map`, personas |
| `tasks` | operations | Tareas: tipo, SOP, dependencias, visibilidad, `done_at`, historial |
| `recipes` | operations | Las recetas que editó el CEO (encima de las de `recipes.js`) |
| `campaigns` | operations | Campañas de pauta por cliente |
| `checks` | work | El checklist del ciclo por perfil y mes |
| `leads` | sales | El CRM |
| `lead_sources` | sales | Fuentes con la clave de su puerta y su registro (solo CEO) |
| `quotes` | sales | Cotizaciones: renglones, estado y pago |
| `services` | sales | El catálogo de servicios |
| `mentors` | sales | La red de especialistas |
| `rates` · `packages` · `bundles` · `payroll` | finanzas | Costo por hora · paquetes por industria · paquetes armados · pagos por servicio (solo CEO) |
| `finance` | finanzas | Movimientos agregados en la app y los que crea marcar una factura pagada |
| `invoices` | finanzas | Facturas por cobrar y por pagar |
| `bank_moves` · `cost_recipes` | finanzas | Estado de cuenta del banco · receta de costos por cliente (solo CEO) |
| `content` | content | Piezas (`kind: post`), Research (`kind: research`) y grabaciones (`kind: shoot`) |
| `sources` | content | Por perfil: `cfg-`, `scrape-`, `analytics-`, `ideas-`, `refs-`, `ads-<perfil>` |
| `avatars` · `formats` · `scripts` · `plans` | content | Cliente ideal · formatos · guiones · Plan del mes |
| `videos` · `ad_variants` · `tech` | content | Kit y fichas de video · variaciones de anuncio · sitios, web viva y auditorías de SEO (solo por sus rutas) |
| `strategy` | estrategia | `<slug>--<bloque>` (estado y borrador) y `<slug>--viva` (estrategia en vivo) |
| `judgments` | work | Los juicios de Laya y los que esperan juicio |
| `folders` · `docs` | library | Carpetas y documentos de la Library |
| `roadmap` | roadmap | Los megaproyectos de Inherent |

**Fuera de `COLLS`** (no se tocan por `/api/db`): `proofs` (comprobantes de pago, por `flow.js`), `lead_searches` (por `buscar.js`) y `media` (imágenes que guarda el conector, servidas en `/api/media/:id`).

**Los ids fijos de `settings`:** `role_views` (la matriz) · `levels` (los 3 niveles) · `laya_gates` · `vision` · `finance_sheet` (solo quien ve Finanzas) · `pricing` (solo CEO) · `reparto` · `ventas_meta` · `calendar` (el calendario de Inherent) · `drive` (la carpeta de entregas) · `brief_open` (meses abiertos sin brief) · `cron_scrape` (cómo salió el scraping del lunes).

**Lo que vive en el repo** (lectura por la copia del build)
- `inherent/06-ECONOMIA.md` (solo el servidor; los costos, solo al CEO) y `inherent/05-OPERACION.md` (roles y slots).
- De cada cliente y de `inherent/inherent-social-media/`: `00-onboarding/plan-contratado.md`, `00-onboarding/LINKS.md`, `99-referencias/investigacion/`, `04-contenido/`, `02-marca/sistema-visual.md`, `02-marca/logos/*.svg` y los entregables del mapa de Intel.
- `agents/01-strategy/brain/skills/hormozi-brain/references/` → `api/_data/fuentes.json` (las citas de Estrategia).

**Lo que el OS escribe en el repo:** solo `PUT /api/estrategia/:slug/ficha` y `PUT /api/estrategia/:slug/doc`. CEO, `escribirSeguro`, un commit por guardado.

**Lo que vive en Google**
- **Drive:** las entregas (en la carpeta de la empresa de `settings` `drive`, o en «Inherent OS · Entregas» de cada persona), las carpetas de cada cliente (`00 Onboarding` a `06 Reportes`), las carpetas ligadas de la Library y las grabaciones.
- **Calendar:** el de cada persona y el de Inherent. **Sheets:** la hoja de movimientos de Finanzas. **Gmail:** los correos al cliente.

**Variables de entorno** (los valores viven en Vercel o en la compu, nunca en el repo)
- **Vercel:** `DATABASE_URL` / `POSTGRES_URL` · `SESSION_SECRET` · `APP_URL` · `PUBLIC_URL` · `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `GOOGLE_PORTAL_CLIENT_ID` · `GOOGLE_PORTAL_CLIENT_SECRET` · `ADMIN_EMAILS` · `ALLOWED_DOMAIN` · `GITHUB_TOKEN` · `GITHUB_REPO` · `GITHUB_BRANCH` · `APIFY_TOKEN` · `APIFY_TOPE_TOTAL` · `APIFY_ACTOR_<RED>` · `WINDSOR_API_KEY` · `ZERNIO_API_KEY` · `CRON_SECRET` · `TIMEZONE` · `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `VAPID_SUBJECT`.
- **Local:** `LOCAL_REPO` · `LOCAL_DB` · `DEV_LOGIN` · `DEV_BASE_REAL`.
- **Puente:** `LAYA_OJO` (0 apaga el ojo visual) · `LAYA_OJO_MODELO` · `LAYA_PUENTE_PUERTO` · `LAYA_PUENTE_ORIGENES` · `LAYA_PUENTE_MODELO` · `LAYA_PUENTE_LOG` · `LAYA_PUENTE_DATOS` · `INHERENT_REPO` · `INHERENT_REPO_URL` · `INHERENT_CLAUDE` · `INHERENT_CHAT_SEGUNDOS` · `OLLAMA_HOST` · `HF_HOME`.
- **Instalador:** `LAYA_HOME` · `LAYA_PYTHON` · `LAYA_BASE_URL` · `LAYA_MODELO_LOCAL` · `LAYA_DESDE_APP` (lo pone la app: el instalador espera a que la app apague su puente). **App de Mac:** `INHERENT_OS_URL`.

---

## 9 · Cómo correrlo y probarlo

```bash
cd ceo-os
npm install
npm run dev          # http://localhost:3000 → «Entrar en modo prueba»
npm test             # el parser contra el manual real del repo y las dos copias del puente
npm run test:fase4   # Cliente ideal, candado del brief, mezcla del mes, errores de Apify
npm run test:fase5   # Formatos y Guiones
npm run test:viva    # Estrategia en vivo
npm run test:plan    # Plan del mes
npm run test:diseno  # chat de Diseño
npm run test:design  # Design system (sistema-visual.md)
npm run test:ventas  # la meta de Ventas
npm run test:marca   # Marca › Video, Ads y Tech
npm run test:llm     # el Inherent LLM: harness, comandos, tarjetas y sesiones
```

- **El servidor local** (`scripts/dev.mjs`) sirve `public/` y la API en el puerto 3000, con la base PGlite en `ceo-os/.devdb/`, login de prueba, un CEO de prueba, los mismos encabezados de `vercel.json` y `/diagnostico`.
- **En local el repo es tu clon** (`LOCAL_REPO` = la raíz del repo): guardar un documento desde Estrategia cambia el archivo en tu disco.
- **Las pruebas son puras:** no usan base ni red. `test-parse` lee el manual del repo.
- **El puente a mano:** `pip install "laya[serve]"` y `python ceo-os/tools/laya-puente/puente.py`. Por defecto acepta `localhost`, así que sirve con el OS local.
- **La app de Mac en local:** `cd ceo-os/escritorio && npm ci && npm start` (con `INHERENT_OS_URL` apunta a otro OS).
- **Publicar:** cada push a `main` hace que Vercel arme la copia del repo y publique. La app de Mac se arma sola con su workflow.
- **Sin `CRON_SECRET` y una URL pública** (`PUBLIC_URL` o `APP_URL`) no hay webhook de Apify: lo recoge la página de Investigación abierta o el cron diario.

---

## 10 · Límites conocidos

**El puente y los chats**
- Los chats y Laya dependen de la compu de cada persona: sin el puente encendido, el chat no corre y los juicios quedan en espera.
- Un chat a la vez por compu, con tope de tiempo y de tamaño (sección 6).
- Las conversaciones viven en el `localStorage` del navegador de cada persona (Estrategia guarda las últimas 40, Diseño las últimas 30): no se comparten ni pasan a otra compu.

**Reglas de las piezas**
- La secuencia del chat de Diseño y el candado del brief los cuida el servidor en `/api/plan` y en `/api/db/content` (`reglasPieza` en `api/index.js`). Las herramientas del conector MCP que crean piezas escriben directo en la base y no pasan por ese candado.

**El repo**
- Vercel lee la copia del último build: lo que cambia en el repo se ve en el OS después de publicar.
- Lo que el OS escribe se ve al instante solo en la instancia que lo escribió, hasta la siguiente publicación.
- Escribir en el repo pide `GITHUB_TOKEN` con permiso de escritura y hace commit directo a `GITHUB_BRANCH`.

**Seguridad y configuración**
- Todo `public/` se sirve sin login: ahí va solo código y textos públicos. **Precios, costos, baseline y datos de clientes nunca van en `public/`:** van en el servidor y salen por una ruta con sesión (`api/_lib/internos.js`, `api/_lib/datos/`). Los datos de la base pasan por los permisos.
- Cambiar `SESSION_SECRET` cierra todas las sesiones y deja ilegibles los tokens de Google de `vault`: cada persona vuelve a entrar con Google.
- El dominio de producción está escrito en `puente.py` (orígenes), `instalar.sh`, `instalar.ps1`, `laya.js` (`INSTALADOR`) y `escritorio/main.js`: cambiar de dominio es tocarlos todos.
- El límite de la entrada pública de leads se cuenta en memoria, por instancia.
- `/api/publico/<marca>/publicado` responde sin sesión solo si el CEO encendió la web viva de esa marca, y solo con lo publicado (título, texto, fecha, formato y el link si es de una red pública).

**Alcance del producto**
- Marca › Video no edita: arma el pedido para ⑦, que corre en la compu del editor. Marca › Ads no lanza: crea la tarea para ⑩ Ads, que lanza con su gate.
- Zernio y Windsor son de solo lectura: se responde en Zernio o con ⑧ Community Management.
- Apify reparte su tope mensual entre las marcas; sin crédito, el scraping se corta y queda el aviso en Investigación.
- Cada llamada a la API tiene 60 s: por eso el scraping arranca y se recoge en dos tiempos.
- El cruce con el banco lee el estado de cuenta de un solo banco (BAC).
- La app de Mac no tiene firma de Apple (solo «ad hoc») y es solo para Mac: la primera vez macOS la bloquea y se abre desde Ajustes del Sistema › Privacidad y seguridad › «Abrir de todos modos». Las actualizaciones no pasan por ese paso. Sus registros del puente van a `~/.inherent/laya/logs`; los del instalador, a `~/.inherent/laya/log`.

**Documentación y pruebas**
- `npm test` corre el parser del manual y revisa que las dos copias del puente sean iguales; las demás pruebas se corren una por una.
- El manual de economía de hoy no trae costos por plan: `parseEconomia` devuelve los rubros, las herramientas, el piso y el tipo de cambio, y `plans` vacío.
