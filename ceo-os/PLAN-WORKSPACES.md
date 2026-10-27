# Plan · InherentOS por workspaces y herramientas

**Para:** el agente que lo implementa (Fable 5.1, multi-agente).
**Dónde:** solo `ceo-os/` del repo `/Users/rodrigomedina/Inherent-HQ`.
**Cómo leerlo:** secciones 1 a 5 = qué construir. Sección 6 = en qué orden, con qué pruebas. Sección 7 = lo que todavía decide el CEO. Sección 8 = lo que no se hace.

El CEO te entrega este plan como el alcance aprobado. Si para cumplirlo necesitas tocar algo que el plan no lista, para y pregunta antes de escribir.

---

## 1 · Objetivo

1. Pasar el OS de **«Marca › Módulo»** a **3 capas: Organización → AI Harness → 5 Workspaces** (Strategy, Marketing, Creative, Consulting, Production).
2. Cada workspace tiene **pestañas** (Overview + 4 etapas de su flujo), un **hero del cliente** y una **grilla de herramientas**.
3. Cada **herramienta** sigue un mismo contrato: Input → AI Workflow → Visual Workspace → Output → Actions → Learning. Guarda un **entregable versionado**, no una conversación.
4. **Una sola inteligencia compartida:** un solo adaptador de IA para todas las herramientas (Hermes / puente / claude.ai), un solo Chat y una sola memoria por cliente.
5. Se crea **Production** (hoy no existe) y **Consulting** pasa de botones que abren el Chat a herramientas reales.

**El principio:** *«una colección de aplicaciones profesionales especializadas sobre un solo sistema de inteligencia. No una colección de prompts.»*
- **Sencillo.** Menos lugares, no más. Si algo nuevo agrega un paso, se justifica o no entra.
- **Se queda el estilo de marca actual:** los tokens del bloque «SISTEMA v2» de `public/app.css`, Inter, los íconos de `iconos.js`. Lo que cambia son las funciones y las herramientas, no el look.
- **Construir vs integrar** (del PDF «InherentOS Arquitectura y Workflows»; el PDF y la imagen del CEO **no están en el repo**: lo que hace falta de ellos está transcrito en este plan, sobre todo en 3.2 y 3.4):
  - **Se construye:** Organización, el harness y la selección de modelo, los workflows de Inherent, skills y memoria, los workspaces y la visualización de entregables, el QA y el aprendizaje.
  - **Se integra (no se reconstruye):** herramientas de diseño y edición (Figma por figwright, el motor Remotion de ⑦), proveedores de LLM, scraping y búsqueda (Apify), APIs de marketing y analítica (Windsor, Zernio), herramientas de video.

**El flujo compartido** (va en el hero de cada workspace, con la etapa de la pestaña resaltada):
`Objective → Research → Plan → Execute → Deliver → Measure → Improve`

**La cadena entre herramientas** (el ejemplo del CEO, debe funcionar de punta a punta al final de la Fase 3):
`Customer Bullseye → Offer Architect → Campaign Architect → Creative Direction Lab → Production Brief Builder`

---

## 2 · Reglas de trabajo

### 2.1 Antes de escribir una línea
1. Lee **`ceo-os/MAPA.md` completo** (sobre todo §2 «Reglas que no se rompen», §3 pantallas, §5 módulos, §8 datos, §9 pruebas).
2. Lee **`CLAUDE.md` de la raíz** (roles, el CEO como candado, la ficha de oferta como techo, «evidencia o etiqueta»).
3. Si algo de este plan contradice el código, **manda el código**: anótalo en el PR y ajusta, no fuerces el plan.

### 2.2 Git y despliegue
- **Nunca `push` a `main`.** Cada push a `main` publica en producción (Vercel) y arma la app de Mac.
- Una **rama por fase**: `os-ws/fase-1-estructura`, `os-ws/fase-2-shell`, `os-ws/fase-3a-strategy`, etc. Sale de `main` actualizado. Si la fase anterior todavía no está fusionada, sale de la rama de esa fase y el PR apunta a ella (dilo en el cuerpo del PR).
- **Un PR por fase** (o por sub-bloque de la Fase 3) con `gh pr create`. Lo fusiona el CEO. En el cuerpo del PR: qué cambió, la lista de archivos, cómo probarlo (rutas) y las pruebas corridas.
- Commits pequeños y con mensaje en español.

### 2.3 Qué se toca
- **Solo `ceo-os/`.** No se tocan `inherent/`, `agents/`, `clients/`, `CLAUDE.md` ni `PENDIENTES.md`. Dentro de `ceo-os/`, tampoco `escritorio/` (la app de Mac). Leer esas carpetas sí se puede.
- **`ceo-os/MAPA.md` se actualiza en el mismo PR** que cambia el código que describe (regla del propio MAPA). Este plan (`PLAN-WORKSPACES.md`) no se vuelve parte del MAPA: al terminar la Fase 4 se puede borrar si el CEO lo pide.
- No crees documentos sueltos (notas, resúmenes, reportes .md). Lo que haya que decir va en el PR.

### 2.4 Correr el OS en local (nunca contra producción)
```bash
cd /Users/rodrigomedina/Inherent-HQ/ceo-os
npm install
node scripts/dev.mjs          # o npm run dev → http://localhost:3000
```
- `dev.mjs` **borra `DATABASE_URL` y `POSTGRES_URL`** y usa PGlite en `ceo-os/.devdb/`. Nunca uses `DEV_BASE_REAL=1`.
- `dev.mjs` pone `DEV_LOGIN=1`: «Entrar en modo prueba» llama `GET /api/auth/dev` (CEO de prueba).
- Para probar otro perfil: `http://localhost:3000/api/auth/dev?email=equipo1@<dominio>` (dominio por defecto `inherentglobal.com`, variable `ALLOWED_DOMAIN`) crea y entra con esa persona (rol `team`). Como CEO, dale perfil y alcance en **Equipo › Vistas por rol** (`#/org/team/vistas`). Necesitas al menos: un CEO, un `team` con alcance **asignados** a un solo cliente, y uno con Contenido en **resumen**.
  - El alcance `asignados` sale de sus tareas (`scoper` en `api/_lib/access.js`): para que «vea» un cliente, asígnale una tarea en un proyecto de ese cliente (o ponlo en `people` del proyecto).
  - Para probar `GET /api/ads/report` esa persona necesita además el perfil de trabajo `ads` (`adsGuard` en `api/index.js` solo deja pasar a ceo, coo y `ads`).
- En local el repo es tu clon (`LOCAL_REPO`): guardar desde Estrategia **cambia archivos de tu disco**. No guardes la ficha ni docs del cliente durante las pruebas; si lo haces, revierte con `git -C /Users/rodrigomedina/Inherent-HQ checkout -- clients/`.

### 2.5 Reglas de MAPA §2 que este trabajo toca (no se rompen)
**Permisos y datos**
- El permiso vive **en el servidor** (`api/_lib/access.js`: `guard`, `guardAny`, `scoper`; `collGuard` en `api/index.js`). La interfaz solo lo refleja con `roleviews.js`.
- **Toda colección nueva de herramientas NO pasa por `/api/db`:** se bloquea en `collGuard` (404) y tiene rutas propias en `api/_lib/<tema>.js` con `rutas(on)`, como `avatars`, `plans`, `ad_variants`, `videos`.
- **Toda ruta nueva que lea datos de clientes aplica `scoper`** (`asignados` / `propio`). La marca `personal` solo la ve el CEO (`personalOk`, en `api/_lib/leer.js`; las rutas de marca usan el mismo chequeo, ver `puedeVer` en `api/_lib/avatares.js`).
- **El rol `client` nunca entra a una herramienta:** ninguna ruta nueva lleva `{ client: true }`. **Única excepción:** Review & Approval Studio (4.3) extiende las rutas del portal que ya existen en `api/_lib/portal.js`, solo con el `client_slug` del cliente. Nunca costos, márgenes, horas, notas internas ni Intel.
- `inherent/06-ECONOMIA.md`, `rates`, `packages`, `bundles`, `payroll`, `cost_recipes`, `/api/repo/economia`: **ninguna herramienta de cliente los lee**, y nada de eso va a un prompt ni a `public/`.
- Cada `PUT` lleva la `v` que se leyó → 409 si cambió. Escribe con `db.create` / `db.update(v)` (quedan en `audit`). **Nunca `db.upsert`** para docs con historial (no escribe en audit).
- **Nada se borra:** se archiva (`archivado: true`). El historial solo se agrega.
- Lo que no tiene dato sale **vacío y dice de dónde va a salir**, nunca en 0. Sin fuente: `⚠️ SIN DATOS` o `[dice el cliente, sin verificar]`.

**El CEO es el candado**
- Estrategia: solo el CEO aprueba/reabre bloques, aprueba la estrategia en vivo y confirma la etapa (`api/_lib/estrategia.js`). Aprobado = cerrado (409) hasta que él reabra.
- Pauta: el OK vive en `accounts.ads.ok` (ese mes, ese monto). Solo el CEO aprueba avatares, variaciones de anuncio, recetas y escribe en el repo.
- **Ninguna herramienta crea un camino de aprobación más débil** que los de hoy. Si la herramienta envuelve un bloque de Estrategia, aprueba con la ruta de Estrategia.
- La secuencia estrategia aprobada → plan → ideas → diseño y **el candado del brief** (423) los cuida el servidor (`api/_lib/plan.js`, `reglasPieza` en `api/index.js`). Las herramientas llaman esas mismas rutas; nunca escriben directo en `content`.
- **Sin ficha de oferta** (`clients/<slug>/00-onboarding/plan-contratado.md`) la herramienta bloquea a ese cliente (409), como Investigación. El alcance contratado es el techo: lo que se pasa se marca **FUERA DEL ALCANCE** y se escala al CEO.

**La web y el puente**
- CSP estricta (`vercel.json`): sin scripts inline; un dominio nuevo va en `connect-src` (y `dev.mjs` lo copia). Todo HTML con `` html`…` ``; `raw()` solo para lo seguro. **La salida de un modelo es dato no confiable:** se limpia con un `limpiar()` puro y nunca entra a `raw()`.
- Escrituras con `api()` de `core.js` (pone `X-CEOOS: 1`).
- **La regla de solo lectura de `public/laya/puente.py` no se toca** (`HERRAMIENTAS`, `BLOQUEADAS`, `--permission-mode dontAsk`, etc.), ni la de su copia `tools/laya-puente/puente.py` (`npm test` exige que las dos sean iguales). Hermes sigue con sus toolsets apagados.
- Vercel nunca habla con Hermes ni con el puente; 60 s por llamada.
- Repo: se escribe solo con `escribirSeguro`, solo el CEO, por la ruta que ya existe `PUT estrategia/:slug/doc` (`api/_lib/estrategia.js`: pide `base`, la huella de lo que se abrió con `GET estrategia/:slug/doc`). `rutaEditable` (`public/js/ficha.js`) ya acepta **cualquier** `.md`/`.csv` dentro de la carpeta del cliente (incluye `02-marca/guia-de-marca.md` y `02-marca/sistema-visual.md`). No cambies `rutaEditable` ni agregues otra ruta que escriba en el repo sin preguntar.

**Estilo y código**
- Estilos solo en `public/app.css` con tokens `--ui-*` (cada color con valor de día y de noche). Íconos solo con `ico()`; el nombre debe existir en `iconos.js` (`test:ui` lo revisa).
- Reglas y parseo en **módulos puros** de `public/js` (sin DOM ni red), compartidos por servidor, conector, interfaz y pruebas. Nombres de dominio en español, como el resto del código.
- Textos de la interfaz: español, de «tú», cortos. Nada de «te traemos / te ayudamos». Roles, no nombres de personas.
- `localStorage` siempre dentro de `try/catch`.

### 2.6 Pruebas que existen (todas puras, sin base ni red, salvo `capturas`)
```bash
npm test            # parser del manual + las dos copias del puente
npm run test:ui     # íconos, día/noche, contraste AA
npm run test:llm    # harness, modos, tarjetas, encargos, áreas (cámbialo si cambias areas.js o modos.js:
                    #   línea ~13 lista los 5 modos, ~17 pide 4 SUGERENCIAS por modo, ~50 cuenta 12 COMANDOS, ~204-212 prueba areas.js)
npm run test:marca  # video, ads, tech
npm run test:fase4  # cliente ideal, candado del brief
npm run test:fase5  # formatos y guiones
npm run test:viva   # estrategia en vivo
npm run test:plan   # plan del mes
npm run test:diseno # chat de Diseño
npm run test:design # design system
npm run test:ventas
npm run test:avisos # si cambian hrefs o reglas de Avisos
npm run capturas    # día/noche, compu (1440) y cel (390), con el OS local corriendo
```
**Regla:** al cerrar cada fase corren **todas** y pasan. La prueba nueva de este plan es `scripts/test-herramientas.mjs` (`npm run test:herramientas`, Fase 1, **crear**).
- `capturas` no es pura: usa el Playwright **global** (`npm root -g`) y hoy no está instalado en esta Mac. Instalarlo baja archivos: pregunta antes. Sin él, haz el recorrido de día/noche, compu y 375 px en el panel del navegador.
- `capturas` solo recorre las rutas de hoy (`org/home`, …, `marcas`, `chat`, `me`). Pásale las nuevas: `npm run capturas -- home,ai,ws/strategy/<slug>/overview,ws/marketing/<slug>/overview,ws/creative/<slug>/overview,ws/consulting/<slug>/overview,ws/production/<slug>/overview`.

### 2.7 Cómo repartir el trabajo entre agentes (ultracode)
- **Un solo dueño por archivo núcleo** en cada fase: `public/js/app.js`, `public/app.css`, `api/index.js`, `api/_lib/access.js`, `MAPA.md`. Los demás agentes le pasan sus cambios a ese dueño o esperan su turno.
- Lo que se puede hacer en paralelo dentro de una fase está marcado con **∥** en la sección 6.
- Antes de fusionar la rama de la fase, un agente revisor corre todas las pruebas y el recorrido en el navegador de esa fase.

---

## 3 · Arquitectura objetivo

### 3.1 Las 3 capas
```
ORGANIZATION   Projects & Tasks · CRM · Deadlines · Library/SOPs · Finances   (lo de Inherent; ya existe en #/org/…)
     │
AI HARNESS     Chat · Agents · Skills · Workflows · Memory · Models · Evaluations · Quality Rules
     │         Quick actions: Deep Research · Create Deliverable · Run Workflow · Analyze Performance
     │         Memory & Context: Organization · Client · Project · Execution history
     ▼
WORKSPACES     Strategy · Marketing · Creative · Consulting · Production
               (cada uno = pestañas + hero del cliente + grilla de herramientas)
```

### 3.2 Navegación final (una sola)
**Se quita:** el dock (dos apps), el interruptor de espacios (Organization / Marcas), el switch de áreas, el dropdown «Workspace», el modo barra-arriba vs barra-lateral, la página de tiles de Marcas como lugar de navegación.
**Queda:** una barra lateral en la compu; en el cel, cajón + barra de abajo.

```
[logo]
[Cliente: AKAI ▾]                 ← selector de contexto (3.3)
Buscar ⌘K · Avisos
Home                              #/home
Organization                      #/org            (se expande)
  Projects                        #/org/operations
  Tasks                           #/org/work  (+ #/org/operations/tasks)
  CRM                             #/org/sales
  Deadlines                       #/org/operations/cal
  Clients                         #/org/clients
  Services                        #/org/services
  Company ▸                       (colapsado)
    Team · Vision · Roadmap · Setup (CEO)
AI Harness                        #/ai             (se expande)
  Chat                            #/chat
  Agents · Skills · Workflows · Memory · Models · Evaluations   #/ai/<página>
WORKSPACES
  Strategy                        #/ws/strategy/<cliente>/<pestaña>
  Marketing                       #/ws/marketing/…
  Creative                        #/ws/creative/…
  Consulting                      #/ws/consulting/…
  Production                      #/ws/production/…
  (el abierto muestra sus pestañas debajo)
Library                           #/org/library
Finances                          #/org/finanzas
— pie —
Cómo se usa · Ask InherentOS · tú (tema, Mi perfil) · ⌘B mini
```
- **Cel:** barra de abajo `Home · Organization · AI · Workspaces (hoja) · Más`; el chip del cliente arriba.
- Library y Finances son ítems de primer nivel pero **siguen en `#/org/…`** para que `role_views` funcione igual.
- **Visibilidad** (solo refleja; el permiso lo pone el servidor):
  - Strategy y Consulting: quien ve `estrategia`.
  - Marketing, Creative, Production: `brandAccess(me).any` / Contenido completo (`brandlist.js`).
  - Organization: las reglas de `TABS` de hoy. Finances: `resumen` para quien no es CEO.
  - El rol `client` sigue entrando solo a `#/portal`.
- **Nombres:** los del CEO (en inglés, como su imagen). Viven en una sola constante `NAV` para cambiarlos en un lugar si el CEO los quiere en español.

### 3.3 El selector de cliente/marca (contexto)
- Un solo listado: Inherent primero, clientes con ficha, cuentas que vienen de una cotización, `personal` solo para el CEO (unión de `loadBrands` de `brandlist.js` y `loadEstrategia` de `stratlist.js`).
- Se guarda en `localStorage` `os.ctx.<correo>` y se copia al campo `slugs` (`{ <modo>: <slug> }`) del JSON que el Chat guarda en la clave `os.llm.<correo>` (lo lee `screens/llm.js`; `abrirEnChat` ya escribe ahí), para que el Chat abra con el mismo cliente.
- Cambiar de cliente dentro de un workspace mantiene workspace y pestaña.
- Se cierra **al navegar, al hacer clic afuera y con Escape** (un solo manejador a nivel `document`). No copiar el patrón roto del dropdown actual (ver Anexo A).

### 3.4 Home (`#/home`, reescribe el layout de `screens/home.js`; los cargadores de datos se quedan)
1. **Hero:** «Turn business opportunities into real results» + saludo y fecha.
2. **«Ask InherentOS anything»:** al enviar → `abrirEnChat(me.email, { modo, slug: <cliente del contexto>, borrador: texto })`. El modo es el del último workspace usado; si no hay, `organizacion`.
3. **4 KPIs:**
   - **Active projects:** proyectos no terminados → `#/org/operations`.
   - **Tasks due:** tareas abiertas con `due` ≤ fin de semana; las vencidas en rojo → `#/org/work`.
   - **Monthly revenue:** `totales(invoices).cobradoMes`, solo si `dueAccess(me).cobrar`; si no, no se pinta → `#/org/finanzas`.
   - **Active clients:** `repo/clients` con ficha + cuentas `from_quote` → `#/org/clients`.
   - Sin dato: vacío con su fuente, nunca 0.
4. **Recent Activity:** se arma en el navegador con los docs que Home ya carga (tasks, projects, leads, quotes, content), ordenados por `_meta.updated_at` / `updated_by`. **Antes de usarlo, verifica que `/api/db` no le quita `_meta` a quien no es CEO.** No agregues una ruta para leer `audit`.
5. **Quick Access:** 5 tarjetas de workspace (color, subtítulo, último cliente usado).
6. **Debajo, para CEO y COO:** «Necesita atención» + Agenda + Contenido del mes (lo de hoy). **Para el equipo:** KPIs con su alcance + «Mis responsabilidades» (`purposeCard`).

### 3.5 La página de un workspace (`public/js/screens/workspace.js`)
- **Ruta:** `#/ws/<ws>/<cliente>/<pestaña>[/<herramienta>[/<resto>]]`.
  - `<ws>` ∈ `strategy · marketing · creative · consulting · production`.
  - Sin cliente → el selector de contexto en grande.
- **Pestañas:**
  - **Strategy:** Overview · Research · Analysis · Strategy · Roadmap
  - **Marketing:** Overview · Audience · Campaigns · Content · Analytics
  - **Creative:** Overview · Brief · Concepts · Design · Review
  - **Consulting:** Overview · Assessment · Analysis · Solutions · Implementation
  - **Production:** Overview · Pre-production · Production · Post-production · Delivery
- **Hero del cliente:**
  - El monograma, o el moodboard de `brand_boards` si existe.
  - El nivel (de la ficha).
  - La etapa, si aplica (Strategy: etapa 0-9; Production: día del ciclo 1-20).
  - El estado de aprobación.
  - El flujo compartido, con el paso de la pestaña resaltado.
- **Grilla de herramientas de la pestaña:** cada tarjeta muestra nombre, qué produce, estado (Lista / Parcial / Pronto), su último entregable y fecha, y los chips «viene de» / «va a».
- **Overview:** resumen del cliente en ese workspace + las tarjetas de todas sus herramientas + «siguiente acción».
- **Clic en una tarjeta** → monta la herramienta. Una herramienta «Pronto» abre su **ficha**: qué recibe, qué produce, a qué alimenta y prioridad. No es un hueco vacío.

### 3.6 Rutas viejas que siguen funcionando (alias, nunca 404)
Se agregan en `alias()` de `app.js`. El hook de `history.replaceState` (hoy en `app.js` ~línea 621) **canoniza** las rutas viejas que las pantallas siguen escribiendo, para que recargar y la barra queden en sincronía.

| Ruta vieja | Va a |
|---|---|
| `#/marcas` | `#/home` |
| `#/marcas/<marca>` | `#/ws/marketing/<marca>/overview` (pone el contexto = marca) |
| `#/marcas/<marca>/<módulo>[/…]` | `#/ws/<ws>/<marca>/<pestaña>/<herramienta>[/…]` según `LEGACY_MODULO` (abajo); conserva el resto (ej. `plan/2026-10`) |
| `#/marcas/diseno[/<marca>]` | `#/ws/creative/<marca o contexto>/design/design-studio` |
| `#/marcas/personal/…` | igual, con marca `personal` (solo CEO) |
| `#/estrategia` | `#/ws/strategy/<contexto>` |
| `#/estrategia/<cliente>[/<bloque>]` | `#/ws/strategy/<cliente>/<pestaña>`: `diagnostico→analysis`, `roadmap→roadmap`, `oferta·modelo·leads→strategy` |
| `#/consulting[/<cliente>]` | `#/ws/consulting/<cliente>/overview` |
| `#/org/home` | `#/home` (sigue resolviendo) |
| `#/content/<tab>/<perfil>`, `#/mimarca/…`, `#/clients/<slug>/marca`, `#/contenido` | por la cadena de alias que ya existe, terminando en `#/ws/…`. **Excepción:** `#/content/fuentes/<slug>` → `#/ws/strategy/<slug>/research/customer-bullseye`; hoy `CT_MOD` de `app.js` manda `fuentes` a `investigacion`: cámbialo (o trata `fuentes` antes de `CT_MOD`) |
| `#/org/<sección>` y sus alias viejos (`OLD_SECTION`, `MOVED` de `roleviews.js`, `#/org/control`, `#/control-hub/…`) | sin cambio |
| `#/chat[/<sesión>]`, `#/avisos`, `#/me`, `#/portal` | sin cambio |

`LEGACY_MODULO`:
- `inicio→marketing/overview` · `investigacion→marketing/audience/viral-intelligence-lab` · `icp→strategy/research/customer-avatar-studio`
- `brief→creative/brief` · `plan→marketing/content/content-strategy-studio` · `campanas→marketing/campaigns/campaign-architect`
- `ideas→creative/concepts/creative-direction-lab` · `formatos→creative/concepts/creative-direction-lab` · `creacion→production/pre-production/script-storyboard-studio`
- `marca→creative/brief/brand-dna-studio` · `design→creative/design/visual-identity-builder` · `video→production/post-production/post-production-workspace`
- `calendario→marketing/content/content-calendar` · `ads→marketing/campaigns/ads-intelligence` · `tech→marketing/campaigns/funnel-builder` (Tech/landings, ver decisión 7.2-c) · `resultados→marketing/analytics/marketing-performance-center`

**Los aliases son permanentes:** el servidor (`public/js/avisos-reglas/*.js`, `api/index.js`, `api/_lib/mcp.js`), `llm/paneles.js`, `estrategia-viva-ui.js`, `calendario-trabajo.js`, `posts.js`, `investigacion.js`, `formatos-ui.js`, `creacion-ui.js`, `plan-mes-ui.js`, `campanas-ui.js`, `brand-home.js`, `diseno-chat.js`, `primer-dia.js`, `menu-contextual.js` y varias `screens/*.js` siguen emitiendo `#/marcas/…`, `#/estrategia/…` y `#/consulting/…`. La lista completa: `grep -rlE "#/(marcas|estrategia|consulting)" public/js api`.

---

## 4 · El registro de herramientas

### 4.1 Archivo
**`public/js/herramientas.js`** (puro: sin DOM ni red). Exporta:
- `WORKSPACES`: `[{ id, nombre, sub, icono, color, modo, pestanas: [{ id, nombre, paso }] }]`
  - `color` = token `--ui-m-<id>`.
  - `modo` = el modo del Chat: `strategy→estrategia · marketing→marketing · creative→diseno · consulting→consulting · production→produccion`.
  - `paso` = su lugar en `Objective…Improve`.
- `FLUJO`: los 7 pasos compartidos.
- `HERRAMIENTAS`: los 42 registros (abajo).
- `LEGACY_MODULO`, `LEGACY_BLOQUE` (3.6).
- Helpers: `herramientaDe(id)`, `deWorkspace(ws, pestana)`, `wsDeRuta(hash)`, `cadena(id)` (los `va_a` hasta el final).
  - `wsDeRuta(hash)` hace la traducción de la tabla 3.6 (ruta vieja → `#/ws/…`) y la de una ruta `#/ws/…` a `{ ws, slug, pestana, tool, resto }`. `alias()` de `app.js` la usa: así la tabla se prueba sin el DOM.
- **Puro de verdad:** `herramientas.js` no importa `brandlist.js`, `stratlist.js`, `core.js` ni `app.js` (tocan el DOM o la red; `import('./public/js/brandlist.js')` en Node falla con «document is not defined»). Solo puede importar módulos puros (`iconos.js`, `llm/modos.js`, `estrategia.js`, …). `puede(me, b)` decide con `me.role`, `me.areas` y `me.views` (la misma regla que `brandAccess` de `brandlist.js` y `hasEstrategia` de `app.js`, copiada, no importada).

Forma de cada herramienta:
```js
{
  id: 'customer-bullseye',          // kebab, estable (va en la ruta y en deliverables.tool)
  ws: 'strategy', pestana: 'research',
  nombre: 'Customer Bullseye',
  produce: 'La diana: ICP, segmentos por prioridad y un mensaje por anillo',
  estado: 'lista' | 'parcial' | 'pronto',
  prioridad: 'P1' | 'P2' | 'P3',
  icono: 'target',                  // debe existir en iconos.js
  monta: 'bullseye',                // clave de la tabla de montaje en screens/workspace.js; null si 'pronto'
  guarda: { coll: 'sources', nota: 'cfg-<slug>.bullseye + espejo en deliverables' },
  viene_de: ['business-xray', 'viral-intelligence-lab'],
  va_a: ['customer-avatar-studio', 'offer-architect', 'campaign-architect'],
  aprueba: 'ceo' | 'coo',           // quién aprueba su entregable (5.2)
  puede: (me, b) => boolean,        // misma regla que brandAccess/hasEstrategia, sin importarlas (ver «Puro de verdad»); solo refleja
  // desde la Fase 2:
  bloque: 'bullseye',               // el bloque ```bullseye``` que pide a la IA
  prompt: (ctx) => string, leer: (texto) => ({ contenido, criterios }) | null,
  limpiar: (contenido) => contenido, faltas: (contenido) => string[],
}
```

### 4.2 Las 42 herramientas

Estado: **E** existe · **P** parcial · **F** falta. «Monta en Fase 1» = qué módulo existente se monta ya; si dice «Pronto», la tarjeta abre su ficha.

#### Strategy — entender el negocio, encontrar oportunidades, diseñar crecimiento rentable (9)
| # | id · nombre | Pestaña | Est. | Código existente | Qué hacer | Prio |
|---|---|---|---|---|---|---|
| 1 | `customer-bullseye` · Customer Bullseye | Research | P | `bullseye.js`; `screens/content.js` (`fuentes()`, `saveBx`, `#bxHost`); `api/_lib/content.js` (`cleanBullseye`); `api/_lib/mcp.js` (`diana`) | **Hoy es inalcanzable** (Anexo A). F1: montar `bullseye(host,{…})` tal cual. F3: ruta `PUT estrategia/:slug/bullseye`, anillos ICP/Prioritario/Secundario/Bajo, `mensajes` por anillo, IA por `correrIA` en vez de copiar y pegar | P1 |
| 2 | `customer-avatar-studio` · Customer Avatar Studio | Research | P | `avatares.js`, `avatar-ui.js`, `api/_lib/avatares.js` | F1: montar `avatarUI`. F3: `guardAny('content','estrategia')`, Buyer Journey de 5 etapas, tarjeta resumen, IA por `correrIA` | P1 |
| 3 | `competitor-radar` · Competitor Radar | Research | P | `referentes.js`, `investigacion.js`, `api/_lib/investigacion.js`, `api/_lib/ads.js` (`competitors`), `screens/work.js` (`adsComp`), `intel-mapa.js` (`ingenieria-inversa`) | Componente compartido «anuncios de la competencia» sacado de `work.js`; panorama + mapa de posicionamiento + huecos con evidencia | P2 |
| 4 | `business-xray` · Business X-Ray | Analysis | P | `estrategia.js` (`ETAPAS`, `LIMITES`), `estrategia-viva.js`, `estrategia-viva-ui.js`, `api/_lib/estrategia.js` (`etapa`, `ficha()`, `intelDe()`), `screens/strategy.js` (bloque diagnóstico) | F1: montar `strategy.js` en bloque `diagnostico`. F3: tablero de salud de 6 ejes + etapa + MBT/UNFAIR/GO GET | P1 |
| 5 | `commercial-diagnosis` · Commercial Diagnosis | Analysis | P | `estrategia-viva.js` (`inversa`, `cascada()`), `estrategia-viva-ui.js` (embudo `ev-fun`), `editarSupuesto` en `screens/strategy.js` | Score 0-100 calculado, embudo con cuellos de botella, plan de acción → tareas | P2 |
| 6 | `opportunity-map` · Opportunity Map | Strategy | F | `viva.riesgos`, `viva.analisis.goget` | Matriz 2×2 impacto/dificultad + ranking calculado; semillas de X-Ray, Comercial y Radar | P2 |
| 7 | `offer-architect` · Offer Architect | Strategy | P | `estrategia.js` (`BLOQUES` oferta/modelo, `LIMITES`), `viva.metodologia`, `intel-mapa.js` (`ofertas-a-empujar`) | F1: montar `strategy.js` en bloque `oferta` (y `modelo`). F3: canvas de la ecuación de valor + stack + variaciones; Modelo de dinero entra aquí | P1 |
| 8 | `pricing-packages` · Pricing & Packages Builder | Strategy | F | `LIMITES`; `intel-mapa.js` (`numeros`, `costos:true`). **No** `catalogo.js`, `armados.js`, `paquetes.js`, `finscope.js` | Matriz de precios, comparación de paquetes, simulador de margen (calculado, nunca guardado). Oculto para Brand Growth | P2 |
| 9 | `growth-roadmap` · Growth Roadmap Builder | Roadmap | P | `viva.roadmap`, `ev-rm`, `POST estrategia/:slug/viva/aprobar`, `goals.js`, `tareaDeEncargo` | F1: montar `strategy.js` en bloque `roadmap` + panel viva. F3: timeline por área y trimestre, chips del Opportunity Map, convertir a tareas, hitos → `accounts.goals` | P1 |

**Overview de Strategy:** hero + `panelViva` de `estrategia-viva-ui.js` (resumen) + las tarjetas. El bloque **Leads** de hoy sale de Strategy: su contenido se va a Marketing (Campaign Architect / canales). En Strategy solo queda la meta de alcance, dentro de Commercial Diagnosis (en F1 sigue accesible como bloque dentro de Offer Architect hasta la Fase 3).

#### Marketing — generar demanda, construir audiencias, adquirir y optimizar ingresos (10)
| # | id · nombre | Pestaña | Est. | Código existente | Qué hacer | Prio |
|---|---|---|---|---|---|---|
| 10 | `viral-intelligence-lab` · Viral Intelligence Lab | Audience | P | `investigacion.js`, `referentes.js`, `api/_lib/investigacion.js`, `api/_lib/content.js`, `laya.js` | F1: montar Investigación (`content.js` embed `only:['research']`). F3: Trend Radar + Pattern Report + oportunidades | P1 |
| 11 | `hook-laboratory` · Hook Laboratory | Content | F | `formatos.js` (HOOK 0-3 s), `laya.js` (puerta hook/copy), research `why.hook`, `hookLost` en analytics de `screens/content.js` | Biblioteca de hooks (7 cajas × consciencia × pilar) + matriz de pruebas | P2 |
| 12 | `content-strategy-studio` · Content Strategy Studio | Content | P | `plan-mes.js`, `plan-mes-ui.js`, `api/_lib/plan.js`, `llm/modos.js` (bloque ```plan```) | F1: montar `planMesUI`. F3: editor visual (pilares arrastrables a 100%, slots semana×canal, techo de la ficha, propuesta de IA como diff) | P1 |
| 13 | `copywriting-studio` · Copywriting Studio | Content | P | `ads-studio.js` (`limpiarVariante`, límites), `plans.mensaje`, `laya.js` | Marco de mensajes (consciencia × anillo) + tablero de variantes con contador de caracteres | P2 |
| 14 | `content-calendar` · Content Calendar | Content | E | `screens/content.js` (embed `calendario`), `calendario-vistas.js`, `calendario-contenido.js`, `posts.js` | F1: montar tal cual. F3: arrastrar pieza a otro día (respeta `reglasPieza`), bandas de campaña, badge de slot | P1 |
| 15 | `campaign-architect` · Campaign Architect | Campaigns | P | `campanas.js`, `campanas-ui.js`, `api/_lib/campanas.js`; colección `campaigns` de `screens/work.js` | F1: montar `campanasUI`. F3: blueprint + plan de canales × fases + briefs creativos → «Enviar a Creative»; unificar `campaigns` | P1 |
| 16 | `funnel-builder` · Funnel Builder | Campaigns | F | `calendario-contenido.js` (`etapaFunnel`), `tech.js`/`tech-ui.js` (landings), `api/_lib/results.js` | F1: montar `techUI` como «Sitios y landings» dentro de la ficha (decisión 7.2-c). F3: canvas TOF→MOF→captura→cierre→recompra con caídas. Solo Growth Partnership | P2 |
| 17 | `ads-intelligence` · Ads Intelligence | Campaigns | P | `api/_lib/ads.js` (`ads/report`, `ads/competitors`), `ads-ui.js`, `ads-studio.js`, `screens/work.js` (`adsReport`, `adsComp`) | F1: montar `adsUI` (variaciones). F3: dashboard de pauta + recomendaciones con evidencia; **`ads/report` aplica `scoper`** (Fase 1, paso 21) | P1 |
| 18 | `marketing-performance-center` · Marketing Performance Center | Analytics | P | `screens/content.js` (embed `analytics`), `brand-home.js`, `api/_lib/results.js`, `ads.report()` | F1: montar Resultados. F3: dashboard por función/pilar/canal + reporte mensual (día 20) + siguientes acciones | P1 |
| 19 | `growth-experiment-lab` · Growth Experiment Lab | Analytics | F | `bullseye.js` (`calib`), estados Ganadora/Quemada de `ad_variants` | Kanban de experimentos + tracker; migrar `bx.calib` | P3 |

**Overview de Marketing:** `brand-home.js` + resumen del Performance Center + tarjetas. Audience también muestra **en solo lectura** la diana y los avatares aprobados de Strategy (link, no un segundo editor).

#### Creative — convertir la estrategia aprobada en identidad y piezas (7)
| # | id · nombre | Pestaña | Est. | Código existente | Qué hacer | Prio |
|---|---|---|---|---|---|---|
| 20 | `brand-dna-studio` · Brand DNA Studio | Brief | P | `brand-board.js` (tono, no-hacer, personas, marcas), `intel-mapa.js` (`guia-de-marca`), `laya.js` (`suena`) | F1: montar `brandBoard` (en `personal`, `me-brand.js`). F3: territorio/arquetipo, ejes de personalidad, voz do/don't, activos distintivos en `brand_boards.dna` | P1 |
| 21 | `moodboard-studio` · Moodboard Studio | Concepts | P | `brand-board.js` (moodboard, Pinterest, Spotify), `ojo.js`, `api/_lib/ojo.js` | F1: montar `brandBoard` (mismo componente). F3: lienzo por zonas + chip del ojo + 2-3 direcciones | P1 |
| 22 | `creative-direction-lab` · Creative Direction Lab | Concepts | P | `ideas-chat.js`, etapa Ideas de `diseno-chat.js`, `brand-brief.js`, `formatos-ui.js`, `screens/content.js` + `posts.js` (Ideas) | F1: montar Ideas (`content.js` embed `postear`) + Formatos. F3: insight + big idea + 3-5 conceptos comparables + deck; «Convertir en piezas» por las rutas de hoy | P1 |
| 23 | `visual-identity-builder` · Visual Identity Builder | Design | P | `design-system-ui.js`, `sistema-visual.js`, `GET repo/client/:slug/sistema` | F1: montar `designSystemUI`. F3: editor por secciones + `escribirSistema` (inversa de `leerSistema`) + escribir al repo solo el CEO | P1 |
| 24 | `design-studio` · Design Studio | Design | P | `diseno-chat.js` (etapa Diseño), `diseno.js`, `posts.js`, `ojo.js` | F1: montar `diseno-chat.js`. F3: cola + lienzo de láminas con variaciones + panel; sin etapas Plan e Ideas | P1 |
| 25 | `brand-consistency-checker` · Brand Consistency Checker | Review | P | `ojo.js`, `api/_lib/ojo.js`, revisión del bloque ```diseno``` en `diseno.js`, `laya.js` (`suena`), `posts.js` (`por_aprobar`) | Un reporte por pieza: color, tipo, composición, prohibido, voz, parecido; devolver con correcciones | P2 |
| 26 | `creative-performance-analyzer` · Creative Performance Analyzer | Overview | P | analytics de `screens/content.js` (Windsor), `laya.js` | Scorecard por pieza publicada contra la línea base de la marca; 3 patrones ganadores; recomendaciones | P2 |

**Brief de Creative:** la cabecera de la pestaña muestra el **brief del ciclo** (`brand-brief.js`) del mes, con su candado. **Review en F1:** tarjeta con las piezas «En revisión» de la marca + chips del ojo y de Laya (lista simple sobre `content`).

#### Consulting — el backend del crecimiento: que la empresa aguante la demanda y que cada venta deje más (8)
Hoy: `screens/consulting.js` (70 líneas) = lista de clientes + encargos de Estrategia + 12 botones de tema (`CONSULTING` en `llm/modos.js`) que solo llaman `abrirEnChat`. Nada se guarda.

**El lente (no se negocia).** Consulting **no es una consultoría de informe**. Cada herramienta responde una sola pregunta de la web: *¿esto hace a la marca más capaz de convertir la demanda en ingresos, sin romperse y con más utilidad?* Trabaja los sistemas de `inherent/02-METODO.md` que van detrás de Growth OS:
- **Conversion OS**, que la demanda se cobre.
- **Operations OS**, que la empresa lo aguante.
- **Money OS**, que quede utilidad.

Tres reglas mandan sobre todas las herramientas:
1. **La regla que no se rompe:** si la empresa no aguanta más demanda, no se recomienda más demanda. Primero capacidad.
2. **Una sola restricción a la vez**, la que hoy frena el crecimiento. Es el enfoque del $100M Scaling Roadmap de Hormozi: se ubica la etapa y su constraint.
3. **Todo termina en un número de crecimiento:** ventas, margen, CAC, LTV o caja. Nada de diagnósticos sin meta.

**Las fuentes del método.** Las herramientas las leen; no se reescriben ni se copian al OS:
- **Hormozi** (`agents/01-strategy/brain/skills/hormozi-brain/`, la skill `hormozi-brain`):
  - `references/roadmap/overview-las-10-etapas.md` + `references/roadmap/stage-*.md` + `references/roadmap/guides/`: etapa, headcount, rol del fundador, constraint, qué hace falta para graduarse.
  - `references/books/100m-money-models/`: los 4 tipos de oferta (atracción, upsell, downsell, continuidad) y cómo se arma un modelo de dinero.
  - `references/books/100m-offers/`: ecuación de valor y precio.
  - `references/sops/5-scaling-frameworks/`: 5-Star Service, Gametape Review, High-Performance Communication, Monday Hour One y Pay Increase.
- **Inherent** (`inherent/02-METODO.md`): Conversion OS 1-4, Operations OS 1-4 y Money OS 1-4 son las palancas que se puntúan. `inherent/03-OFERTA.md` §10 y §11 marcan el techo de lo que Consulting entrega: no contabilidad, ni impuestos, ni gerencia diaria.
- **Las clases de negocio del CEO.** No están en el repo, así que el agente no las puede abrir. Se codifican como marcos en `public/js/consulting/marcos.js`:
  - Business Model Canvas, los 9 bloques: segmentos, propuesta de valor, canales, relaciones, fuentes de ingreso, recursos, actividades, socios y costos. Utilidad = ingresos − costos.
  - Matriz BCG por línea de producto: crecimiento del mercado × participación (estrella, vaca, interrogante, perro).
  - FODA.
  - Valores como criterios de decisión.
  - Objetivos con la fórmula **verbo en infinitivo + área + de X a Y + fecha**, por horizonte: corto 1-2 años, mediano 3-5, largo 6-10.
  - Las 4 dimensiones de innovación: producto, proceso, modelo de negocio y experiencia del cliente (experiencia = emoción + facilidad + detalle).
  - Las estrategias genéricas de Porter (costos, diferenciación, enfoque).

| # | id · nombre | Pestaña | Est. | Código existente | Qué hacer (lente de crecimiento) | Prio |
|---|---|---|---|---|---|---|
| 27 | `business-health-assessment` · Business Health Assessment → **Diagnóstico de crecimiento** | Assessment | P | `estrategia.js` (`ETAPAS`), `viva.analisis.trabado`, `llm/modos.js` (`alcanceConsulting`), `llm/paneles.js` (`datosEstrategia`), `screens/library-entrevista.js` (patrón de entrevista), `charts.js` | Etapa de Hormozi (0-9) con sus 3 preguntas + **la** restricción por función + scorecard de los 4 sistemas (12 palancas de Conversion/Operations/Money) + medidor capacidad vs demanda + FODA corto. Sale: «qué se arregla primero y por qué» | P1 |
| 28 | `root-cause-explorer` · Root Cause Explorer → **Árbol de la brecha** | Analysis | F | `diagram-model.js`, `diagram-editor.js`, `cascada()` de `estrategia-viva.js` | La raíz es la brecha de la meta (meta − actual). Se abre por la ecuación de ingresos: leads × conversión × ticket × frecuencia × retención. Cada rama baja a sus causas de operación o de dinero y solo se valida con evidencia | P1 |
| 29 | `process-mapper` · Process Mapper → **Mapa del camino del dinero** | Analysis | P | `diagram-model.js` (`TEMPLATES.flujo`), `diagram-editor.js` | El recorrido lead → venta → entrega → recompra, hoy vs optimizado: por paso, dueño por rol, minutos, dónde se pierde gente o dinero y «depende del fundador». Estándar de entrega con 5-Star Service | P1 |
| 30 | `financial-scenario-lab` · Financial Scenario Lab → **Money Model Lab** | Analysis | P | patrón puro de `cascada()` (`estrategia-viva.js`), `intel-mapa.js` (`numeros`). **No** `finscope.js` | Cuatro vistas: (1) BMC con salud por bloque; (2) BCG por línea (cuál empujar, cuál retirar = Money OS 2); (3) modelo de dinero de Hormozi (atracción → upsell → downsell → continuidad) con huecos; (4) 2-4 escenarios (subir precio, agregar upsell, más retención, bajar CAC) con margen, CAC, LTV, LTGP:CAC y caja a 30 días | P1 |
| 31 | `automation-opportunity-finder` · Automation Opportunity Finder | Solutions | F | tema «Qué automatizar» de `CONSULTING` | Matriz impacto en ventas × esfuerzo sobre los pasos manuales del Mapa del camino del dinero. Primero lo que pierde ventas: velocidad de respuesta y seguimiento (Conversion OS 1-2) | P2 |
| 32 | `organization-architect` · Organization Architect → **Equipo para la siguiente etapa** | Solutions | P | `diagram-model.js` (`TEMPLATES.org`), patrón de tabla de `responsabilidades.js` | Organigrama de hoy vs el de la siguiente etapa de Hormozi + «solo el fundador» / «nunca le debería llegar» + valores como criterios escritos + RACI + perfiles + rituales (Monday Hour One, Gametape Review) | P2 |
| 33 | `solution-blueprint-builder` · Solution Blueprint Builder → **Plan de crecimiento 90 días** | Solutions | F | `tareaDeEncargo`/`encargosDe` (`llm/modos.js`), receta `GROWTH` (`recipes.js`) | Cada fila: objetivo con la fórmula (verbo + área + X→Y + fecha) → restricción que ataca → sistema (Conversion/Operations/Money) → tipo de innovación → dueño (rol) → primer paso → métrica. 90 días al frente; horizontes 1-2 y 3-5 años como contexto. Se convierte en tareas; las métricas van a `accounts.goals` | P1 |
| 34 | `impact-tracker` · Impact Tracker | Implementation | P | `goals.js` (`goalsOf`, `pctOf`, `healthOf`), `api/_lib/portal.js` (`metas`), `charts.js` | Antes vs después de la ecuación de ingresos y del scorecard de los 4 sistemas + metas del plan + reporte para el cliente sin internos | P1 |

**La cadena de Consulting:** Diagnóstico de crecimiento → Árbol de la brecha → (Mapa del camino del dinero ∥ Money Model Lab) → Plan de crecimiento 90 días → Impact Tracker. El siguiente Diagnóstico lee lo que aprendió el Impact Tracker.
- Automation Finder sale del Mapa del camino del dinero.
- Equipo para la siguiente etapa sale del Diagnóstico.
- **Con Strategy:** el Diagnóstico **lee** la etapa y `trabado` de Strategy, no los duplica. Lo que el Money Model Lab concluye de precio u oferta **se manda a Strategy** (Offer Architect / Pricing & Packages) como encargo. Consulting no cambia la oferta por su cuenta.

**Overview de Consulting:**
- Hero: el badge de alcance (`alcanceConsulting`), la etapa de Hormozi, **la** restricción actual y el medidor capacidad vs demanda. Si la capacidad está en rojo, se lee: «No subir demanda todavía».
- Abajo: los **encargos de Estrategia** (la lista de hoy), los últimos entregables y las tarjetas de las herramientas.
- Los 12 temas de `CONSULTING` dejan de ser la interfaz. Cada prompt queda como semilla de IA de su herramienta:
  - ¿Dónde se traba? → Diagnóstico de crecimiento.
  - Mapa de procesos y Estándar de calidad → Mapa del camino del dinero.
  - Qué automatizar → Automation Finder.
  - BMC, Margen, Precio, CAC y LTV → Money Model Lab.
  - Quién decide, Perfiles, Onboarding y Estructura corporativa → Equipo para la siguiente etapa.

#### Production — planear, crear, coordinar y entregar producciones audiovisuales (8)
Unidad de datos: **un ciclo por marca y mes** (`<marca>--<AAAA-MM>`, como `plans`). El Overview muestra el día del ciclo (1-3 brief · 4-5 coordinar · 6-10 grabar · **11 último día de grabación** · 12-15 editar · 16-19 cambios · **20 presentar**).
| # | id · nombre | Pestaña | Est. | Código existente | Qué hacer | Prio |
|---|---|---|---|---|---|---|
| 35 | `production-brief` · Production Brief Builder | Pre-production | F | `screens/content.js` (`shotData`, `pieceText`, líneas ~101-137, código muerto), `intel-mapa.js` (`plan-de-rodaje`, `MATERIAL.md`) | Brief del ciclo: piezas video/foto de ④, techo de horas/sesiones de la ficha, devoluciones a ④ | P1 |
| 36 | `script-storyboard-studio` · Script & Storyboard Studio | Pre-production | P | `creacion-ui.js`, `api/_lib/creacion.js`, `formatos.js` (`limpiarGuion`, `promptGuion`), `cuadro()` de `video-ui.js` | F1: montar `creacionUI`. F3: storyboard (frames por tramo) + versiones + enviar al shot list | P1 |
| 37 | `shot-list-builder` · Shot List Builder | Pre-production | P | `shotData()` y `editShoot` (`screens/content.js`) | Tabla/tablero de escenas `PR-xxx` con `id_creativo`; agrupar por locación/talento/setup/producto; export CSV de 16 columnas | P1 |
| 38 | `production-planner` · Production Planner | Production | P | `content` `kind:'shoot'` (`editShoot`), `calendario-trabajo.js`, aviso `pr-dia11-grabacion` (`avisos-reglas/clientes-marcas.js`), `budgets.js` | Jornadas sobre `kind:'shoot'` (sin migrar), orden de tiro, call sheet, bloqueo después del día 11 (423, salvo CEO) | P2 |
| 39 | `ai-video-lab` · AI Video Lab | Production | F | `ojo.js`, `cuadro()` de `video-ui.js` | Solo integra: guarda pedido, links y veredicto del ojo; la generación corre afuera | P3 |
| 40 | `post-production-workspace` · Post-Production Workspace | Post-production | P | `video-ui.js`, `video.js` (`limpiarFicha`, `kitDesdeSistema`, `pedidoVideo`), `api/_lib/video.js` | F1: montar `videoUI`. F3: pipeline por capas ve-*, versiones, checklist QA, link a la pieza (`post`) | P1 |
| 41 | `review-approval-studio` · Review & Approval Studio | Delivery | P | `api/_lib/portal.js` (aprobación), `posts.js` (`por_aprobar`), `screens/portal.js`; externo: `agents/07-video-editing/brain/motor/aprobacion` (no se toca) | Reproductor con comentarios por segundo, versiones, aprobar/pedir cambios, en el portal | P1 |
| 42 | `content-repurposing` · Content Repurposing Engine | Delivery | F | `video.js` (`FORMATOS_V`), `ads-studio.js` | Matriz maestro × salidas; derivadas = fichas con `derivada_de`; medidor 1:2 | P2 |

**Delivery en F1:** tarjeta con el calendario en filtro Programado (`calendario-vistas.js`) + piezas en `por_aprobar`. **Post-production en F1** también muestra el kit de edición (`video-ui.js`, parte kit).

### 4.3 Detalle de cada herramienta (lo que se construye en la Fase 3)
Formato: **Vista** · **Guarda en** · **IA** (bloque que pide) · **Acciones** · **Acepta** (verificable).
«deliverables» = la colección de la sección 5. Las salidas de IA siempre pasan por `correrIA` → `leer()` → el usuario confirma → ruta del servidor.

**Strategy**
- **Customer Bullseye.**
  - Vista: el SVG actual con anillos relabelados (Centro=ICP · 1=Prioritario · 2=Secundario · 3-4=Baja prioridad) + un panel de segmentos con un mensaje y un ángulo por anillo (ángulos de `ANGULOS` en `avatares.js`).
  - Guarda en: igual que hoy (`sources` `cfg-<slug>.bullseye`; `audience` y la `diana` del MCP siguen leyendo lo mismo), a través de la ruta nueva `PUT estrategia/:slug/bullseye` (guard `estrategia` + scoper; `personal` solo CEO). Más un espejo en deliverables (`tool:'customer-bullseye'`).
  - IA: ```bullseye``` validado con `cleanBullseye`; una pregunta a la vez (reglas de `bullseyePrompt`).
  - Acciones: Rehacer, «Enviar el centro a Avatar Studio», «Enviar a Offer Architect», exportar. Los lotes `calib` se quedan como aprendizaje.
  - Acepta: se llega desde `#/ws/strategy/<slug>/research/customer-bullseye` y en solo lectura desde Marketing › Audience · la herramienta `planner` del conector MCP (`api/_lib/mcp.js`, campo `diana: c.bullseye`) devuelve la misma forma · ya no hay paso de copiar y pegar.
- **Customer Avatar Studio.**
  - Vista: `avatarUI` + una franja de Buyer Journey (descubre · considera · decide · compra · vuelve: piensa, siente, hace, canal, objeción, contenido) + una tarjeta resumen que voltea a la ficha.
  - Guarda en: `avatars` (sin colección nueva). El guard del servidor pasa a `guardAny` de `content` o `estrategia`, con scoper.
  - IA: ```avatar``` parseado con `leerPropuesta`; las frases literales citan su fuente o van como `[dice el cliente, sin verificar]`.
  - Acciones: aprobar (solo CEO), archivar, pesos que suman 100 (`sumaPesos`), «Enviar a Offer Architect», exportar.
  - Acepta: el mismo avatar abre desde Strategy y desde Marketing · editar uno aprobado lo regresa a borrador · `PUT avatares/:id` con `v` (409) · `/api/db/avatars` sigue en 404.
- **Business X-Ray.**
  - Vista: el badge de etapa (confirmada o propuesta, con el selector + la propuesta de Laya + la confirmación del CEO de hoy) + la conclusión en una línea + 6 tiles de salud (Oferta, Modelo de dinero, Leads/demanda, Conversión, Capacidad, Marca/atención), cada uno con estado ok/riesgo/falta y su evidencia + «dónde está trabado» (`oferta|modelo|leads|capacidad`) + MBT/UNFAIR/GO GET (las tarjetas `ev-g3`, sacadas como componente).
  - Guarda en: deliverables (`tool:'business-xray'`, contenido `{ salud:[{eje,estado,evidencia,fuente}], conclusion, trabado, porque, etapa_ref }`). Se refleja en `viva.contexto/analisis` para no romper lo que lee la estrategia en vivo.
  - IA: ```xray``` con la ficha + `comprension.md`/`nucleo.md` (`intelDe`) + Library + Investigación.
  - Acciones: editar un tile, marcar revisado, «Enviar huecos al Opportunity Map», exportar md.
  - Acepta: la pestaña Analysis lo muestra sin abrir ningún chat · confirmar la etapa sigue siendo solo del CEO (403) · un tile sin evidencia dice `⚠️ SIN DATOS` y su fuente · sin ficha queda bloqueado · con la estrategia aprobada es solo lectura (409).
- **Commercial Diagnosis.**
  - Vista: un score 0-100 que se calcula y nunca se guarda (cobertura de `cascada()`, supuestos presentes, riesgos) + el embudo `ev-fun` con cuellos de botella (tasa que falta o hueco de alcance > 20%) + un plan de 3-5 acciones con área y fecha.
  - Guarda en: `viva.comercial { bottlenecks, acciones }`, extendiendo `limpiarParche`.
  - IA: ```estrategia {"comercial":…}```. Los números solo vienen del cliente, del CRM o de Windsor.
  - Acciones: convertir acciones en tareas (con `tareaDeEncargo`), mandar cuellos al Opportunity Map.
  - Acepta: el embudo se recalcula al editar un supuesto · el score es reproducible (prueba pura) · nada de costos ni márgenes para quien no es CEO.
- **Opportunity Map.**
  - Vista: un 2×2 impacto vs dificultad (burbuja = costo, color = confianza) + una lista ordenada por `impacto×confianza/(dificultad×costo×tiempo)` con pesos visibles.
  - Guarda en: deliverables (`items:[{id,titulo,origen,impacto,dificultad,costo,tiempo,confianza,evidencia,estado,fuera_alcance}]`).
  - IA: ```oportunidades```: puntajes con su razón; marca FUERA DEL ALCANCE contra la ficha.
  - Acciones: arrastrar para re-puntuar, elegir o descartar, comparar, enviar al Roadmap, convertir en tareas.
  - Acepta: cambiar un puntaje reordena al instante · lo FUERA DEL ALCANCE no se puede enviar al roadmap · cada ítem guarda su origen.
- **Offer Architect.**
  - Vista: 4 columnas de la ecuación de valor (sueño, probabilidad, tiempo, esfuerzo) con sliders y evidencia + el stack Grand Slam (problemas → soluciones → vehículos, bonos, garantía, escasez, nombre) + la propuesta de valor + 2-3 variaciones lado a lado + la escalera (atracción, upsell, downsell, continuidad).
  - Guarda en: deliverables (`tool:'offer-architect'`). **La aprobación sigue siendo la del bloque** `strategy` id `<slug>--oferta` (y `<slug>--modelo`; `docId` en `public/js/estrategia.js`) por `POST estrategia/:slug/:bloque/aprobar` (CEO). Al aprobar el bloque, el servidor pone el entregable espejo en `Aprobado` (con `aprobado.version`) en la misma ruta, para que `POST entregables/:id/siguiente` funcione; reabrir el bloque lo regresa a `Borrador`. No hay un segundo botón de aprobar. `viva.metodologia` queda como el resumen que leen los demás.
  - IA: ```oferta``` con hormozi-brain (cita resolvible por `estrategia/citas` o «No está en el material»).
  - Acciones: comparar, aprobar (CEO), enviar a Pricing y a Campaign Architect.
  - Acepta: **Brand Growth** solo puede elegir qué oferta empujar y su mensaje; el stack y el precio están bloqueados en la interfaz **y** en el servidor (403/409) · la escalera solo en Partnership · editar después de aprobar da 409.
- **Pricing & Packages Builder.**
  - Vista: una matriz (paquetes × features) + 2-4 tarjetas con la recomendada resaltada + un simulador de margen (precio, costo unitario, CAC, volumen → margen %, LTV:CAC, punto de equilibrio, con función pura).
  - Guarda en: deliverables (los costos del cliente van etiquetados; los resultados no se guardan).
  - IA: ```precios``` desde las variaciones de Offer Architect + los precios del Radar. Todo precio es propuesta: «escalar al CEO».
  - Acepta: no aparece y el servidor rechaza escrituras para Brand Growth · el simulador con costos reales solo en Partnership con Finanzas en la ficha · costos y márgenes solo para CEO/COO · cero lecturas de datos internos de Inherent (prueba estática).
- **Competitor Radar.**
  - Vista: tarjetas por competidor (oferta, precio si se sabe, canales, anuncios activos, post con más resonancia) + un mapa de posicionamiento de 2 ejes con SVG de `charts.js` (el punto del cliente se arrastra) + huecos.
  - Guarda en: deliverables.
  - IA: ```radar```: posiciones y huecos citando urls.
  - Acciones: agregar competidor (escribe `competencia` por la ruta de content que ya existe), «Actualizar ahora» (CEO/COO, con los topes de Apify), enviar huecos al Opportunity Map.
  - Acepta: toda posición o hueco tiene url de evidencia o dice `⚠️ SIN DATOS` · sin datos el mapa no pinta nada · sin ficha da 409.
- **Growth Roadmap Builder.**
  - Vista: la grilla `ev-rm` como timeline (filas por área: Strategy, Marketing, Creative, Production, Ads, Consulting; columnas por trimestre) con un toggle al plan de 90 días (`graduar` de la etapa) + chips arrastrables del Opportunity Map + una fila de hitos.
  - Guarda en: `viva.roadmap`, extendido con `items:[{id,oportunidad_id,area,trimestre,titulo,tareas:[…]}]` en `limpiarParche`.
  - IA: ```estrategia {"roadmap":…}```.
  - Acciones: aprobar y reabrir (CEO, la ruta de hoy), convertir en tareas (`tareaDeEncargo`), «Enviar a Plan del mes» (solo después de aprobar), hitos → `accounts.goals`.
  - Acepta: sin filas no se aprueba (400) · después de aprobar, **todas** las herramientas de Strategy de ese cliente quedan en solo lectura · las tareas con dependencias abiertas siguen en 423 · Brand Growth nunca promete un % de crecimiento.

**Marketing**
- **Viral Intelligence Lab.**
  - Vista: Library (Investigación de hoy) + Trend Radar (momentum vs saturación por patrón, con un slider de semana) + Pattern Report (ejemplos, multiplicador mediano, redes, por qué funciona) + oportunidades (momentum alto y saturación baja, cruzadas con la diana y los pilares).
  - Guarda en: deliverables (`tool:'viral-intelligence-lab'`, un doc por patrón). Los items `research` y `sources/cfg` siguen igual.
  - IA: ```patrones``` agrupa research nuevo; Laya califica el encaje.
  - Integra: Apify sigue siendo el scraper; Eden, solo si el CEO lo aprueba y siempre del lado del servidor (decisión 7.2-d).
  - Acepta: cada patrón liga ≥ 2 items reales · una oportunidad llega prellenada a Hook Lab y a Content Strategy Studio · sin ficha da 409 · «Actualizar ahora» sigue siendo CEO/COO.
- **Hook Laboratory.**
  - Vista: una grilla de hooks (las 7 cajas de cr-hook-copy × consciencia × pilar, con fuente, multiplicador y puntaje de Laya) + una matriz de pruebas (hooks × variantes, con métrica real).
  - Guarda en: deliverables.
  - IA: ```hooks```; valida la puerta hook/copy de Laya.
  - Acepta: los hooks salen del research sin reescribirlos · sin puente, Laya dice «pendiente» · una celda sin métrica nombra su fuente.
- **Content Strategy Studio.**
  - Vista: `planMesUI` editable en el tablero: campaña y mensaje por consciencia, pilares como barras arrastrables que suman 100, slots semana × canal con avisos de `revisarSlots`, y un medidor del techo de la ficha.
  - Guarda en: `plans` por `/api/plan` (con `v`).
  - IA: ```plan``` → **diff por sección**: nada se escribe hasta aceptar.
  - Acepta: sin estrategia aprobada aparece el candado y el servidor rechaza (409) · los slots sobre el techo o con combinación prohibida se marcan antes de «Pasar a Ideas».
- **Copywriting Studio.**
  - Vista: un marco de mensajes (consciencia × anillo/avatar: mensaje, prueba, objeción) + un tablero de N variantes por activo, con contador contra el límite del canal y chips de Laya.
  - Guarda en: deliverables.
  - Acciones: empujar la elegida a `ad_variants` (como Borrador), al caption de la pieza o a la landing.
  - Acepta: nada se auto-aprueba; el copy de anuncio sigue pidiendo el OK del CEO.
- **Content Calendar.** No se reconstruye.
  - Se agrega: arrastrar a otro día (PUT con `v`; `reglasPieza` y el candado del brief aplican), bandas de campaña (`mk_campaigns`), badge de slot, y las métricas de la pieza cuando está Publicado.
  - Acepta: arrastrar a un mes sin brief lo rechaza el servidor (423) salvo que el CEO haya abierto el mes.
- **Campaign Architect.**
  - Vista: un blueprint (frase, MBT, se_nota, no_es, ancla y hasta + la anticipación como Gantt) + un plan de canales (Primer aviso / Recordatorio / Último empujón × IG, TikTok, Pauta, WhatsApp, Email, Evento; los montos solo para quien ve presupuestos) + un brief creativo por celda.
  - Guarda en: `mk_campaigns` extendido (`canales`, `briefs`, `resultados`).
  - Se unifica la colección `campaigns` (pauta, `screens/work.js`) como el canal Pauta, ligada por id.
  - IA: ```campana``` (ya existe) + canales/briefs.
  - Acciones: «Enviar a Creative» crea el entregable de Creative Direction Lab con `entradas` = esta campaña.
  - Acepta: una campaña con blueprint, canales y ≥ 1 brief guardados con scoper · se archivan, no se borran · una sola entidad de campaña.
- **Funnel Builder.**
  - Vista: un canvas de etapas con sus activos (piezas por etapa con `etapaFunnel`, landings de `tech`, etapa del CRM) y su métrica (Windsor, `results.js`) + barras de caída + un plan de mejoras.
  - Guarda en: deliverables.
  - Acepta: oculto, con la razón, si el nivel no es Growth Partnership · los leads respetan el scope · una mejora se convierte en tarea.
- **Ads Intelligence.**
  - Vista: un dashboard (gasto vs presupuesto aprobado `accounts.ads.ok`, CTR, CPA, ROAS, gasto diario; tabla por campaña/ad set/ad extendiendo `windsor()` y cacheado) + recomendaciones con su evidencia y la regla de ad-optimizacion + la sub-vista Variaciones (`adsUI`) + anuncios de la competencia (el componente compartido).
  - Guarda en: deliverables (`tool:'ads-intelligence'`, una rec por doc: `{tipo, evidencia:{metrica,valor,umbral,periodo}, accion, requiere_ceo, estado}`).
  - **Nunca escribe a una plataforma de anuncios:** solo crea una tarea para ⑩ Ads o pide el OK del CEO.
  - Acepta: se llega desde Marketing, no solo desde Mis tareas · `ads/report` con scoper · una rec sin números no se muestra.
- **Marketing Performance Center.**
  - Vista: KPIs (alcance, views, ER, leads por fuente, gasto vs presupuesto, CPA, ROAS, publicadas vs planeadas), cada número con su fuente + una tabla por función/pilar/canal + la franja del embudo + un reporte mensual (día 20) editable y exportable + 3-5 siguientes acciones.
  - Guarda en: deliverables (`tool:'marketing-performance-center'`, uno por mes).
  - IA: ```reporte``` con mk-loop; cada afirmación cita un KPI.
  - Acepta: nunca 0 por un dato que falta · el reporte al portal va sin costos ni márgenes · quien tiene Contenido en `resumen` solo ve esta herramienta.
- **Growth Experiment Lab (P3, Pronto).** Ficha: kanban Backlog → Corriendo → Leyendo → Decidido; no se decide sin la muestra mínima.

**Creative**
- **Brand DNA Studio.**
  - Vista: 4 bloques: territorio y arquetipo (es / no es) · ejes de personalidad con sliders y radar · voz (tono en 3 palabras, pares bien/mal, palabras sí/no) · 3-5 activos distintivos, cada uno con su prueba.
  - Guarda en: `brand_boards.dna` (sin colección nueva).
  - IA: ```dna``` (br-territorio → br-voz → br-activos); lee la estrategia **aprobada** por las rutas de Estrategia, los avatares aprobados y la diana. Se acepta sección por sección.
  - Salida: exportar `02-marca/guia-de-marca.md` (solo CEO, por `PUT estrategia/:slug/doc` con `escribirSeguro`; `rutaEditable` ya acepta esa ruta, pero publicar al repo desde Creative es la decisión 7.2-f: **pregunta antes**) y PDF (jsPDF de `public/vendor/jspdf.umd.min.js`).
  - Acepta: sin ficha da 409 · sin estrategia aprobada, «generar» queda apagado · con < 3 activos no se valida · vacío dice de dónde va a salir.
- **Moodboard Studio.**
  - Vista: un masonry por zonas (Color, Textura, Foto, Tipografía, Personas, Referentes) con nota y chip del ojo por imagen + 2-3 direcciones arriba.
  - Guarda en: `brand_boards.images` extendido (`zona, nota, fuente, ref_id, ojo, fijada`) + `brand_boards.direcciones`. El ojo sigue leyendo las mismas refs.
  - Acepta: solo links `https` · sin CLIP no hay chip (nunca 0%) · las direcciones citan índices reales · 403 fuera del alcance.
- **Creative Direction Lab.**
  - Vista: insight + big idea arriba; 3-5 conceptos lado a lado (nombre, idea, hook, técnica, 2-3 imágenes del moodboard, formato, chip de Laya); el brief del ciclo a la izquierda; modo Deck 16:9 → PDF.
  - Guarda en: deliverables (`tool:'creative-direction-lab'`, uno por marca y mes, con `entradas` = la campaña).
  - IA: ```direccion``` (cr-brief → cr-big-idea → cr-storytelling).
  - Acciones: elegir, descartar (archiva), «Convertir en piezas» (por las mismas rutas que «Enviar a Ideas» de hoy), «Enviar a Design Studio / Production Brief».
  - Acepta: sin plan pasado a Creatividad no genera · sin brief no crea piezas con fecha (423) · convertir no duplica piezas del slot · el deck no lleva costos ni notas internas.
- **Visual Identity Builder.**
  - Vista: `designSystemUI` como «Publicado» + un editor por secciones (paleta con matriz de contraste en vivo usando `contraste()`, tipografía con escala, logos, grilla y safe zones, prohibido, maquetas 4:5 y 9:16).
  - Guarda en: el borrador en `brand_boards.sistema_borrador` (+ la huella del archivo). Publicar = `02-marca/sistema-visual.md` en el repo (solo CEO, por `PUT estrategia/:slug/doc` con `escribirSeguro`; `rutaEditable` ya la acepta; publicar desde Creative es la decisión 7.2-f: **pregunta antes**).
  - Escribe `escribirSistema()` (la inversa de `leerSistema`).
  - Acepta: `leerSistema(escribirSistema(x))` da lo mismo (prueba) · ningún par marcado ok tiene contraste < 4.5 · en Brand Growth y Partnership solo extiende, no rehace.
- **Design Studio.**
  - Vista: 3 columnas: la cola de piezas del mes (`textoCalendario`) · el lienzo de láminas con variaciones A/B/C y toggle de formato · el panel (concepto, copy, checklist de la revisión, chip del ojo). Sin etapa Plan (es de Marketing) ni Ideas (es del Lab).
  - Guarda en: `content.diseno` + `variaciones[]` y `elegida`.
  - Motor: el puente modo `diseno` con figwright (decisión 7.1).
  - Acepta: en el cel dice «Disponible solo en tu compu» · sin puente muestra cómo emparejar · guardar deja la pieza Listo con `diseno.figma` y láminas · las variaciones no elegidas no se borran.
- **Brand Consistency Checker.**
  - Vista: la pieza grande + un reporte por sección (Color, Tipografía, Composición y safe zones, Prohibido, Voz, Parecido), regla por regla con pasa/no pasa y su corrección + ronda N de M de la ficha.
  - Guarda en: `content.cumplimiento` (con `historial` que solo se agrega).
  - Fuentes: un pase determinista con `leerSistema` + ojo + Laya `suena` + br-guardian.
  - Acepta: cada regla cita su fuente · sin CLIP sale sin Parecido y lo dice · si pasa las rondas de la ficha, escala al CEO · nunca se ve en el portal.
- **Creative Performance Analyzer.**
  - Vista: scorecards por pieza publicada (métricas vs la línea base de la misma marca, Laya antes vs resultado, veredicto) + 3 patrones ganadores + fatiga (solo con datos de pauta).
  - Guarda en: `content.resultado` + un deliverable de aprendizaje por marca y mes.
  - Acepta: sin Windsor dice «conecta Windsor» · nada llega al portal.

**Consulting** (todas: gate `alcanceConsulting` en el **servidor**; sin Partnership o ficha a la medida → banner FUERA DEL ALCANCE y sin botón de generar). Todas aplican el lente y las fuentes de 4.2.
- **Marcos compartidos** (`public/js/consulting/marcos.js`, **crear**, puro): las constantes que usan las vistas y los prompts:
  - `ETAPAS_HORMOZI`: 0-9, con nombre y la ruta de su archivo en `hormozi-brain`.
  - `FUNCIONES`: producto, marketing, ventas, servicio, IT, reclutamiento, RR. HH. y finanzas.
  - `SISTEMAS`: Conversion, Operations y Money, cada uno con sus 4 palancas de `02-METODO.md`, en texto corto.
  - `ECUACION`: leads × conversión × ticket × frecuencia × retención.
  - `BMC`: los 9 bloques.
  - `BCG`: los 4 cuadrantes.
  - `TIPOS_OFERTA`: atracción, upsell, downsell y continuidad.
  - `INNOVACION`: producto, proceso, modelo y experiencia.
  - `HORIZONTES`: 90 días, 1-2, 3-5 y 6-10 años.
  - `objetivoBien(o)`: valida la fórmula verbo + área + X→Y + fecha.

  Los prompts nombran las rutas de `hormozi-brain` que la IA debe leer y exigen citas con referencia exacta, como hace la skill.
- **Business Health Assessment → Diagnóstico de crecimiento.**
  - Vista, de arriba abajo:
    1. **Etapa**: una barra 0-9 con la etapa marcada y la fila del roadmap que la ubica (cita). Se ubica con las 3 preguntas de la skill: cuánto factura al mes y desde cuándo, cuántas personas trabajan, dónde se traba. Si no calza clara, dice entre qué etapas está y qué dato falta.
    2. **La restricción**: una sola tarjeta grande (función + por qué + cita).
    3. **Medidor capacidad vs demanda**: verde, ámbar o rojo. En rojo, todas las recomendaciones de demanda se bloquean.
    4. **Scorecard de los 4 sistemas**: Growth solo se lee de Strategy. Conversion, Operations y Money con 4 palancas cada uno, puntaje 1-5, chip de evidencia y semáforo; se ve como un radar, como el pentágono de la imagen.
    5. **FODA** corto.
    6. **Diagnóstico**: qué se arregla primero, segundo y tercero, cada uno con el número de crecimiento que mueve.
  - IA: ```diagnostico```.
  - Contexto: la etapa y `trabado` de Strategy se leen, no se duplican.
  - Acepta:
    - 12 palancas; una palanca sin fuente dice `⚠️ SIN DATOS`, nunca 0.
    - Exactamente 1 restricción.
    - Con la capacidad en rojo, el diagnóstico no recomienda pauta ni más volumen.
    - `v`/409.
    - Aprueba solo el CEO.
    - «Enviar a Árbol de la brecha» prellena la meta y la restricción.
    - Fuera del alcance: 403 o vacío.
- **Root Cause Explorer → Árbol de la brecha.**
  - Vista: un árbol LR con `diagram-editor.js`.
    - Raíz: «Meta − actual» en dinero, leída de la meta de Strategy (`cascada()`).
    - Primer nivel: los 5 factores de la ecuación. Cada uno muestra su número actual, el que hace falta y `⚠️ SIN DATOS` si no hay.
    - Abajo: las causas. Hipótesis = `arena`, validada = `salvia`, descartada = `lino`.
    - Panel por nodo: evidencia, dato que falta, prueba y sistema al que pertenece.
    - Arriba: el factor con más brecha.
  - IA: ```causas```.
  - Acepta:
    - No se valida un nodo sin evidencia.
    - Las pruebas se convierten en tareas `area:'consulting'`.
    - El factor que más brecha aporta se calcula, no se escribe a mano.
    - No aparece en la Library.
- **Process Mapper → Mapa del camino del dinero.**
  - Vista: el recorrido lead → primer contacto → venta → entrega → recompra/referido, hoy vs optimizado lado a lado, con diff. Cada paso lleva: rol, minutos, manual o automático, % que se pierde ahí (o `⚠️ SIN DATOS`), dolor y «depende del fundador».
  - Agrega a `diagram-model.js` un campo opcional `lane` (carriles por rol).
  - Un panel «Estándar de entrega» con 5-Star Service (`references/sops/5-scaling-frameworks/02-5-star-service-framework.md`).
  - IA: ```procesos```.
  - Acepta:
    - La ida y vuelta del JSON del diagrama es idéntica.
    - Un paso sin rol se resalta antes de aprobar.
    - Los pasos manuales se envían al Automation Finder.
    - Los pasos «depende del fundador» se envían a Equipo para la siguiente etapa.
- **Financial Scenario Lab → Money Model Lab** (aprueba el CEO: Money OS lo lleva él).
  - Vista en 4 pestañas internas:
    1. **Modelo de negocio**: el BMC de 9 bloques editable, cada bloque con semáforo y una nota de dónde frena el crecimiento; arriba, utilidad = ingresos − costos.
    2. **Cartera**: la matriz BCG con cada línea como burbuja (tamaño = ventas, color = margen) + tabla «empujar · sostener · revisar · retirar».
    3. **Modelo de dinero**: la escalera atracción → upsell → downsell → continuidad, con lo que el cliente tiene hoy en cada escalón y los huecos marcados, con cita del libro.
    4. **Escenarios**: un modelo tipo hoja (precio, costo, volumen, CAC por canal, retención) + 2-4 columnas de escenario + gráfica `charts.js` de margen, LTV, CAC, LTGP:CAC y caja a 30 días.
  - Módulo puro nuevo `public/js/consulting/escenarios.js`, con el contrato «null si falta» de `cascada()`.
  - Lee `07-oferta-y-ventas/numeros.md` por la ruta Intel de hoy (`GET repo/client/:slug/intel`). Ojo: en `intel-mapa.js` lleva `costos: true`, así que la ruta **solo lo entrega a quien ve costos** (`managesAccesos`: CEO, COO y quien edita Clientes). A los demás les sale vacío con su fuente.
  - IA: ```escenarios```; recomienda «modo privado» al pegar números.
  - Acepta:
    - Un insumo que falta da null, no 0 (con prueba).
    - LTGP:CAC y caja a 30 días se calculan, no se escriben.
    - Un cambio de precio u oferta no se guarda aquí: «Mandar a Strategy» crea un encargo para Offer Architect / Pricing.
    - No llama a `/api/repo/economia`, `rates` ni `cost_recipes`.
    - Las columnas de costo se quitan del lado del servidor a quien no debe verlas.
- **Organization Architect → Equipo para la siguiente etapa (P2).**
  - Vista:
    - Organigrama de hoy vs el que pide la siguiente etapa de Hormozi (headcount y rol del fundador, con cita) usando `TEMPLATES.org`.
    - Columnas «Solo el fundador» / «Nunca le debería llegar».
    - **Valores escritos como criterios de decisión** (cómo decide el equipo sin preguntar).
    - Matriz RACI.
    - Perfiles de puesto.
    - Rituales: Monday Hour One y Gametape Review, de `references/sops/5-scaling-frameworks/`.
  - Nunca lee `team` ni `recipes` (son de Inherent).
  - IA: ```organizacion```.
  - Acepta:
    - Cada fila tiene exactamente una A.
    - Cada decisión que hoy toma el fundador tiene destino (se queda, se delega con criterio o se elimina).
    - «Estructura corporativa» sale como lista de preguntas para el especialista, no como estructura legal.
- **Automation Opportunity Finder (P2).**
  - Ficha: matriz impacto en ventas × esfuerzo sobre los pasos manuales del Mapa del camino del dinero.
  - Ordena primero los pasos que pierden leads o ventas (respuesta, seguimiento, cobro).
  - Las horas vienen del cliente o dicen `⚠️ SIN DATOS`.
  - Cada fila elegida se manda al Plan de 90 días.
- **Solution Blueprint Builder → Plan de crecimiento 90 días.**
  - Vista: un tablero de filas. Cada fila lleva:
    - **objetivo** (verbo + área + X→Y + fecha, validado con `objetivoBien`)
    - restricción que ataca (link al Diagnóstico o al Árbol)
    - sistema (Conversion, Operations o Money)
    - tipo de innovación
    - dueño (rol)
    - primer paso
    - métrica
  - Fases arrastrables por mes (1, 2 y 3) + un check de alcance por fila + una banda de contexto con los objetivos a 1-2 y 3-5 años (solo lectura, de Strategy).
  - Las tareas se cuelgan del proyecto de la receta `GROWTH` del cliente (Kanban de hoy).
  - Acepta:
    - Un objetivo que no cumple la fórmula, o una fila sin rol, primer paso o métrica, bloquea la aprobación.
    - Con la capacidad en rojo en el Diagnóstico, no se aceptan filas de más demanda antes de las de capacidad.
    - «Convertir en tareas» crea tareas `area:'consulting'`, `client_slug`, `deliverable_id`, sin duplicar con un segundo clic (clave estable `deliverable_id + fila`).
    - «Enviar a Impact Tracker» escribe `accounts.goals`.
    - Las filas fuera del alcance no se convierten: escalan al CEO.
- **Impact Tracker.**
  - Vista:
    - Tiles: metas en camino, en riesgo y off; % de tareas hechas; horas ahorradas; delta de margen.
    - **La ecuación de ingresos antes → ahora → meta**, factor por factor.
    - Radar antes/después de los 4 sistemas (solo con 2 diagnósticos aprobados).
    - «Generar reporte».
  - Guarda en: las metas en `accounts.goals` (con `origen:'consulting'`, `blueprint_ref`; **sin almacén paralelo**) y el reporte como deliverable.
  - Quién escribe las metas: por la ruta que ya existe, `PUT /api/db/accounts/<id>` con `v` (área `clients`, escribe quien edita Clientes). Si la persona no edita Clientes, el botón no aparece y se escala al COO/CEO: **no** abras un camino nuevo para escribir `accounts` desde `entregables.js`.
  - Acepta:
    - El portal sigue viendo solo las metas.
    - La versión cliente quita costos, márgenes, horas y notas.
    - Los `aprendizajes` aparecen como contexto en el siguiente Diagnóstico.

**Production**
- **Production Brief Builder.**
  - Vista: izquierda, las piezas a producir (filas de ④ con `material=video|foto`: id_creativo, formato, fecha, producible sí/no/ajuste); derecha, el techo de realidad (horas y sesiones de la ficha, videos × 20 min, una barra que se pone roja al pasarse) + «devueltas a ④» con motivo y 2 alternativas.
  - Guarda en: deliverables (`tool:'production-brief'`, `ciclo:'AAAA-MM'`).
  - `shotData()` y `pieceText()` salen de `screens/content.js` a un módulo puro nuevo `public/js/produccion.js`.
  - IA: ```produccion``` (modo `produccion`).
  - Acepta: sin ficha da 409 · lista exactamente las filas video/foto del mes · con la capacidad pasada, «Cerrar brief» queda deshabilitado · nunca tarifas ni costos a quien no es CEO · una devolución se convierte en tarea para ④ Creatividad.
- **Script & Storyboard Studio.**
  - Vista: `creacionUI` + una tira de frames por tramo (`cuadro()` con safe zones y subtítulos; imagen por Drive con `uploadToDrive`, plano, movimiento, segundos, texto en pantalla, VO).
  - Guarda en: `scripts` extendido con `frames[]` (validados en `limpiarGuion`) y `versiones[]`. Sigue por sus rutas; se archiva, no se borra.
  - La IA pasa del puente a `correrIA`.
  - Acepta: `#/marcas/<m>/creacion/<id>` abre el mismo guion · un frame de más contra la duración avisa antes de «Listo para grabar» · «Enviar al shot list» no duplica escenas.
- **Shot List Builder.**
  - Vista: tabla ↔ tablero de escenas `PR-001…` (id_creativo, pieza, acción, plano, duración, lugar, talento, setup, producto, material, jornada, estado) + chips para agrupar por locación/talento/setup/producto; se arrastra una escena a una jornada; una casilla «Grabada» de un toque en el cel.
  - Guarda en: deliverables (`tool:'shot-list-builder'`, `ciclo`).
  - Export: CSV idéntico a la plantilla `agents/05-production/brain/entregables/plan-de-produccion.csv` (16 columnas: `id,id_creativo,campana,escena,accion,encuadre,duracion_s,locacion,talento,recursos,equipo,jornada,costo_estimado,riesgo,destino,estado`). `agents/` no entra a la copia del build: las columnas van escritas en `public/js/produccion.js`. `costo_estimado` sale vacío para quien no ve costos (`seesCosts` de `api/_lib/access.js`).
  - Acepta: sin `id_creativo` da 400 · el CSV se re-importa sin pérdida · a 375 px marcar Grabada toma un toque.
- **Production Planner.**
  - Vista: una tira de días 1-20 con la línea roja del día 11 + jornadas (call time, locación, crew, talento, equipo, orden de tiro con márgenes de montaje, luz y traslado) + recursos + un medidor contra la ficha + call sheet imprimible.
  - Guarda en: `content` `kind:'shoot'` + campos `produccion`, `escenas`, `orden`, `margenes`, `horas_estimadas`, `horas_reales`, `archivado`. **Cambiar el borrado duro de hoy por archivar.**
  - El candado del día 11 vive en el **servidor**: los shoots se escriben por `/api/db/content`, así que la regla va junto a `reglasPieza` en `api/index.js` (hoy solo revisa `kind:'post'`), no solo en la interfaz.
  - Acepta: una jornada después del día 11 da 423 salvo CEO · los shoots de hoy aparecen sin migrar · el aviso del día 11 sigue funcionando · montos solo CEO/COO.
- **AI Video Lab (P3, Pronto).** Ficha: solo integra; guarda prompt, links `https` y el veredicto del ojo; ninguna generación desde Vercel.
- **Post-Production Workspace.**
  - Vista: `videoUI` + un tablero por capas (Recepción · Armado · Marca/QA · Derivadas · Export) + versiones por ficha + un checklist de QA (formato, duración, safe zones, audio, sin marca de agua).
  - Guarda en: `videos` extendido (`capa`, `version`, `versiones[]`, `escenas[]`, `qa`, `derivada_de`, y `post` por fin se setea).
  - La edición sigue en la Mac del editor (`pedidoVideo`).
  - Acepta: `#/marcas/<m>/video` abre las mismas fichas · una versión nueva se agrega, no pisa · «Enviar a revisión» pide el QA completo o un motivo · `test:marca` pasa.
- **Review & Approval Studio.**
  - Vista: el reproductor (preview de Drive con `embedUrl`) + comentarios con pin al segundo + selector de versión y comparación + Aprobar / Pedir cambios + el caption.
  - Interno (COO/CEO) ve notas internas; el cliente solo ve las suyas.
  - Guarda en: la ficha de `videos` (`revision`, `comentarios[]`, `aprobacion`), espejada en la pieza ligada para que el portal y el calendario de hoy sigan funcionando.
  - La ruta del cliente se extiende en `api/_lib/portal.js` (`{client:true}`, solo su `client_slug`).
  - Acepta: el comentario reaparece en su segundo · el cliente nunca ve lo interno (403) · aprobar v2 pone la pieza en Listo con `aprobacion.v='v2'` · pedir cambios exige nota o comentario (400) · pasar las rondas de la ficha crea un Aviso al CEO.
  - **No retires** la app externa `agents/07-video-editing/brain/motor/aprobacion` (está fuera de `ceo-os/`); deja anotado en el PR que puede retirarse.
- **Content Repurposing Engine.**
  - Vista: una matriz de maestros aprobados × salidas (9:16, 4:5, 1:1, 16:9, fragmentos de story, corte de 7-15 s, variantes de hook) + un medidor de razón 1:2.
  - Las derivadas son fichas de `videos` con `derivada_de`. Las variantes de hook van a Ads Studio como Borrador.
  - Acepta: solo de maestros aprobados · una derivada no agrega assets nuevos (el servidor rechaza) · los captions que pasan el límite se bloquean.

---

## 5 · El Tool Shell, la colección `deliverables` y el adaptador de IA

### 5.1 El Tool Shell (`public/js/tool-shell.js`)
Un marco común para toda herramienta montada. La herramienta solo pinta su Visual Workspace en el centro.
```
┌ cabecera: nombre · cliente · estado (Borrador/En revisión/Aprobado/Entregado) · v<n> · dueño (rol) ┐
├ Input (izq., plegable): de dónde vienen los datos — cliente (ficha, nivel), proyecto, Library,     │
│   entregables de arriba (solo versiones aprobadas) — cada uno con link o «⚠️ SIN DATOS: sale de …»│
├ Visual Workspace (centro): el componente de la herramienta                                        │
├ Acciones (barra): Generar con IA · Editar · Comparar versiones · Enviar a revisión · Aprobar      │
│   (solo quien aprueba) · Convertir en tareas · Enviar a <siguiente> · Exportar                    │
├ Criterios: ```criterios``` cumple/falta (bloquea aprobar si hay «falta»)                          │
└ Learning (pie): resultados registrados · historial (solo se agrega)                              ┘
```
- Las herramientas que hoy son un módulo existente (Fase 1) se montan **sin** el shell. Pasan al shell en la Fase 3, cuando tienen entregable.
- «Continuar en el Chat» = `abrirEnChat` con el modo del workspace y el cliente. Las herramientas **no** abren chats propios.

### 5.2 La colección `deliverables`
**Regla de casa:** si el dato ya tiene casa (`strategy`, `avatars`, `plans`, `mk_campaigns`, `videos`, `scripts`, `content`, `brand_boards`, `accounts.goals`, `sources`), **se queda en su casa**. Lo nuevo va a `deliverables`. Así no se migra nada y no se abren colecciones de más.
- `content`, `brand_boards`, `accounts` y `sources` se escriben hoy por `/api/db/<coll>`. Toda regla nueva sobre ellos que este plan pida (historial que solo se agrega en `content.cumplimiento`, el candado del día 11, «nunca se borra») se pone en el **servidor**, en `api/index.js` junto a `reglasPieza`/`outOfScope`, nunca solo en la interfaz.

**Servidor**
- `api/_lib/access.js`: `COLLS.deliverables = 'content'` y `COLLS.deliverable_versions = 'content'` (área nominal; el permiso real lo pone la ruta). En `scoper`: `deliverables: d => lc(d.client_slug) === 'inherent' || slugs.has(lc(d.client_slug))`. No va en `CEO_WRITE`.
- `api/index.js` `collGuard`: `deliverables` y `deliverable_versions` → 404 «Los entregables están en /api/entregables», junto a las líneas de `avatars`/`plans`.
- Nuevo `api/_lib/entregables.js` (**crear**) con `rutas(on)`, registrado en `api/index.js` junto a `avatares.rutas(on)` (~línea 1141). Usa el módulo puro `public/js/entregables.js` (**crear**: `COLL`, `ESTADOS`, `pasoPermitido`, `limpiarEntregable`, `faltas`, `tareasDeEntregable`, `siguienteDe`), como `api/_lib/avatares.js` usa `public/js/avatares.js` y `api/_lib/ads-studio.js` usa `public/js/ads-studio.js` (que ya tiene su propio `pasoPermitido` y `faltas`: es el mejor modelo a copiar).

**Forma del doc**
```js
{
  tool, ws, pestana, titulo,
  client_slug,            // 'inherent' | slug; 'personal' solo CEO
  ciclo?,                 // 'AAAA-MM' (Production, Marketing mensual)
  project_id?, owner,     // correo; por defecto quien lo crea
  estado,                 // 'Borrador' | 'En revisión' | 'Aprobado' | 'Entregado'
  archivado: false,
  version: n,
  contenido: {…},         // propio de la herramienta, limpio con su limpiar()
  criterios: { cumple: [], falta: [] },
  entradas: [{ deliverable_id, version, tool }],   // solo versiones aprobadas
  siguientes: [{ tool, deliverable_id }],
  aprobado: { por, en, version } | null,
  historial: [{ en, por, accion, nota, version }], // solo se agrega; lo sella el servidor
  tareas: [taskId],
  resultado: [{ en, por, metrica, valor, nota }],  // Learning
  ia: { via: 'hermes'|'puente'|'claude-web'|'manual'|'servidor', modelo }
}
```
- Tope ~400 KB (413, como `/api/db`). `idOk` como en `api/_lib/ads-studio.js` y `slugOk` como en `api/_lib/avatares.js` (son constantes locales de cada archivo: cópialas).
- **Versiones:** cada cambio de `contenido` crea `deliverable_versions` `<id>--v<n>` (solo se crea, nunca se edita). `GET entregables/:id/versiones/:n` para comparar. Restaurar = una versión nueva que copia una vieja.

**Estados y quién aprueba** (en `pasoPermitido(de, a)` → `'edita' | 'aprobador' | null`)
- Borrador → En revisión → Aprobado → Entregado.
- `aprueba` sale del registro:
  - `'ceo'`: todo Strategy, todo lo que toca gasto o precio (Pricing, recs de Ads con presupuesto, Offer Architect) y las herramientas de Consulting que 4.3 marca «aprobar solo el CEO» (Diagnóstico de crecimiento y Money Model Lab; Consulting cuelga de Estrategia y Money OS lo lleva el CEO, ver el comentario de `areas.js` e `inherent/02-METODO.md`).
  - `'coo'` (CEO o COO): lo demás. El COO hace el QA final.
  - **Creative no agrega aprobaciones del CEO** (`CLAUDE.md`: el CEO solo bloquea en Strategy y Ads).
- Aprobar con `criterios.falta` no vacío → 400.
- Editar el `contenido` de un Aprobado → versión n+1, vuelve a Borrador y `aprobado = null` (como `avatares`).
- **Strategy:** si la estrategia en vivo del cliente está aprobada, todo entregable de Strategy de ese cliente responde 409 `APROBADO` hasta que el CEO reabra.
- Cada escritura: `db.update(COLL, id, data, b.v ?? cur.v, u.email)`. Si devuelve null → 409 «Alguien lo cambió justo ahora. Recarga…».

**Acceso** (`abre(req, res, ws, slug, write)` en la ruta, nunca en la interfaz)
- `guard(req, res, AREA_DE[ws], { write })` con `AREA_DE = { strategy:'estrategia', consulting:'estrategia', marketing:'content', creative:'content', production:'content' }` (Consulting = «quien ve Estrategia», MAPA §3; ver decisión 7.2-b).
- Nunca `{ client: true }` · Contenido en `resumen` → 403 (salvo lectura del Performance Center) · `personalOk` · `scoper`: fuera de alcance → 404 · listar filtra con el mismo predicado.
- **Ficha y nivel:** sin `plan-contratado.md` → 409. Consulting: `alcanceConsulting` (puro, en `llm/modos.js`) del lado del servidor; fuera del alcance → 403 con `code:'FUERA_DEL_ALCANCE'` en las escrituras y lista vacía en las lecturas. Pricing y Funnel: nivel (mismo 403).

**Rutas**
- `GET entregables?ws=&slug=&tool=&ciclo=`
- `GET entregables/:id`
- `POST entregables` (crear Borrador)
- `PUT entregables/:id` (con `v`)
- `POST entregables/:id/estado { a }`
- `GET entregables/:id/versiones[/:n]`
- `POST entregables/:id/siguiente { tool }`: solo si está Aprobado y `tool ∈ va_a`. Crea un Borrador en la siguiente herramienta con `entradas=[{deliverable_id, version: aprobado.version, tool}]`, el mismo `client_slug` y `project_id`, y `owner` = quien llama. Actualiza `siguientes` e `historial` en los dos docs (dos `db.update` con `v`).
- `POST entregables/:id/tareas { tareas:[{title, due, assignee, dept}] }`, máx. 12:
  - Crea las tareas **en el servidor** con `db.create('tasks', …)` + `cleanTask` + `results.stampDone` (como ya lo hace `api/_lib/ads-studio.js` ~línea 72 al lanzar). **No** por `/api/db/tasks`: `encargoMal` quita `origen/area/cliente/client_slug` a quien no ve Estrategia.
  - `cleanTask`, `TASK_TIPOS`, `outOfScope` y `encargoMal` son **locales** de `api/index.js` (no se exportan, y `api/_lib/` no puede importar `api/index.js` sin ciclo). Pásalos a `entregables.rutas(on, { cleanTask, outOfScope })` o muévelos a un módulo de `api/_lib/`; `TASK_TIPOS` también vive en `public/js/recipes.js`.
  - Forma (copia de `tareaDeEncargo`): `{ title, description: '<por qué> · Entregable «<titulo>» v<n>', status:'Por empezar', tipo:'Delivery', dept, due, assignee, visibility:'all' (Strategy: 'private', como los encargos), project_id, client_slug, cliente, area: ws, origen:'entregable', deliverable_id }`.
  - Con `project_id`: el mismo chequeo de alcance que `outOfScope`. Se respetan las dependencias (423).
  - Reconvertir pide confirmación en la interfaz (no se deduplica en silencio, salvo las herramientas que el plan pide «sin duplicar»: clave `deliverable_id + fila`).
- `POST entregables/:id/resultado { metrica, valor, nota }` (Learning, con texto acotado).

**Conector MCP:** si después se agregan herramientas que escriban entregables, llaman a las funciones de `entregables.js`, nunca a `db` directo (MAPA §10).

### 5.3 El adaptador único de IA (`public/js/ia-herramienta.js`)
```js
export async function correrIA(me, { tool, ctx, signal, onDelta, onTool, preferir })
  → { texto, via, modelo }
```
1. **Arma el prompt (puro):** `sistema = sistemaDe(tool.modo, ctx)` (el harness de `llm/modos.js`: `REGLAS_COMUNES` + `HARNESS[modo]` + `PROTOCOLO`), y `mensaje = tool.prompt(ctx)`, que termina pidiendo ```<tool.bloque>``` y ```criterios```.
2. **Elige el camino**, en este orden (salvo `preferir` o `motorDe(me)`):
   - **Hermes:** `hermesDe(me)` y `(await saludHermes(me)).auth` → `chatHermes(me, { sesion: idSesion(tool.modo, ctx.slug), sistema, mensaje, modelo, signal, onDelta, onTool })`.
   - **Puente:** `(await saludPuente(4000)).listo` y `tokenDe(me)` → `preguntar({ prompt: sistema + '\n\n' + mensaje, token, signal, onDelta, onTool })` (solo lectura).
   - **claude.ai:** `claudeJSON(tool.nombre, sistema + '\n\n' + mensaje)`; el JSON pegado se vuelve a envolver como bloque (como `ads-ui.js`).
   - **⟵ PUNTO DE CAMBIO (decisión 7.1):** aquí entra la rama `via:'servidor'`.
3. **Quien llama:** `const out = tool.leer(texto)` (puro, con `leerTarjetas` para criterios) → la persona revisa → `api('entregables', { method:'POST', body:{ tool: tool.id, client_slug, contenido: out.contenido, criterios: out.criterios, ia:{ via, modelo } } })`. El servidor vuelve a limpiar con el mismo `limpiar()`.

**`ctx` se arma con rutas que ya existen:**
- cliente: `repo/client/:slug`, `estrategia/:slug` (nivel, ficha)
- proyecto: `db/projects`
- Library: `estrategia/library` o `db/docs`
- arriba: `entregables/:id`, solo la versión aprobada

**Nunca** costos ni precios de Inherent, ni `06-ECONOMIA`. Los prompts viven en `public/`, que se sirve sin login: ahí no va nada interno.

**Modo nuevo del Chat:** `produccion` en `llm/modos.js`:
- Harness de ⑤ Producción · ⑦ Video Editing, con criterios de guion y video de `inherent/08-CRITERIOS-DE-ACEPTACION.md` resumidos en el harness (sin leer el archivo: no está en la copia).
- El comando `/produccion`.
- Los ids de modo que ya existen **no cambian** (`estrategia, organizacion, marketing, diseno, consulting`), porque las sesiones de Hermes se llaman `inh-<modo>-…`; solo cambian las etiquetas.

---

## 6 · Fases

Cada fase: rama propia → PR → el CEO fusiona. Al cerrar: **todas** las pruebas de 2.6 + `test:herramientas` + el recorrido en el navegador de la fase, de día y de noche, en compu y a 375 px (`npm run capturas` con las rutas nuevas, o a mano si no hay Playwright: ver 2.6).

### Fase 1 · Estructura (rama `os-ws/fase-1-estructura`)
**Meta:** el OS ya se ve y se navega como el árbol de 3.2 y el Home de 3.4 (la imagen del CEO no está en el repo), con lo que existe hoy montado como herramientas, sin perder ninguna función ni ruta.

**Orden y paralelismo**
1. **∥** `public/js/herramientas.js` (**crear**; puro, ver 4.1: WORKSPACES, FLUJO, las 42 herramientas con `estado`, `monta`, `viene_de`, `va_a`, `prioridad`, `aprueba`; LEGACY_*) + `scripts/test-herramientas.mjs` (**crear**) + `"test:herramientas": "node scripts/test-herramientas.mjs"` en `package.json`.
2. **∥** `public/js/contexto.js` (**crear**; no es puro: importa `brandlist.js` y `stratlist.js`):
   - la lista única de clientes (unión de `brandlist.loadBrands` + `stratlist`)
   - `contextoActual(me)` / `ponerContexto(me, slug)` en `os.ctx.<correo>`, con sincronía a los slugs del Chat y el evento `contexto`
   - el HTML del selector y su popover (cierra al navegar, clic afuera, Escape)
3. **∥** `public/js/iconos.js`:
   - íconos `nav-home, nav-organization, nav-ai, nav-strategy, nav-marketing, nav-creative, nav-consulting, nav-production, nav-library, nav-finances`
   - los de harness (`agents, skills, workflows, memory, models, evals`)
   - los íconos de las 42 herramientas
   - primero como **alias** a íconos que ya existen (el mapa de alias de `iconos.js`, como `'nav-hoy': 'house'`; `nav-consulting` ya existe). `lucide-static` **no** está en `node_modules`: un trazo nuevo se copia de su `icon-nodes.json` (como dice la cabecera de `iconos.js`); bajarlo es descargar un archivo: pregunta antes, o usa un alias
4. **(dueño único) `public/js/app.js`:**
   - `SCREENS`: `ai → harness`, `ws → workspace` (`home` ya existe y apunta a `screens/home.js`).
   - `resolve()`: `#/home`, `#/ai[/<pág>]`, `#/ws/<ws>[/<cliente>/<pestaña>[/<tool>/…]]`.
   - `alias()` con la tabla 3.6. El hook de `replaceState` canoniza las rutas viejas que escriben `strategy.js` (`#/estrategia/<slug>/<bloque>`, ~línea 71), los `base` de `content.js`, `sales` y `finance`.
   - **Una sola barra** (`latHtml`/`paintLat` desde la constante `NAV`), el selector en `#lat-ctx`, y en el cel la barra de abajo + el chip del cliente.
   - `landing()`: la última ruta (`lsSet('last.route', …)`, que queda en `os.last.route.<correo>`) o `me.start` → `home`/`org`/`ws`.
   - `jumpItems()` (⌘K): Home, Organization, páginas del Harness, cada workspace + pestaña, cada cliente.
   - `preguntarAlChat()`: modo por workspace + cliente del contexto.
   - `render()`: cierra todo popover abierto al empezar (arreglo del dropdown, Anexo A).
   - `seccionGuia()`: mapea herramientas a las claves de `guia-secciones.js`.
   - **Se borra:** el dock (`pintarDock`, `quitarDock`, `irApp`, `data-app`; **`icoApp` de `dock.js` se sigue usando** en `app.js` ~476, ~511, ~529 y en `screens/llm.js` ~115: cámbialo por `ico('chat-ia', 20)` / `ico('os', 20)` de `core.js`, los mismos íconos de `iconos.js`), el modelo de espacios (`space`, `spacesFor`, `showSwitch`, `switchHtml`, `moveSwitch`, `spaceHome`, claves `space`, `space.os`, `last.<espacio>`, `last.a.<área>`), el modelo de áreas (`areasTablero`, `appsTablero`, `tieneOrg`, `abiertoEn`, `orgBtnHtml`, `wsSelHtml`, `menuWs`, `irArea`, `areaDeRuta`, `primerModulo`, `ABRE_EN`), el modo barra-arriba, la subnav de dos filas de marca (`paintSub`) y los comentarios de cabecera (líneas ~15-33) que describen espacios y dock.
5. **∥** `public/js/screens/workspace.js`: pestañas, hero, grilla de tarjetas, ficha «Pronto». La **tabla de montaje** se mueve de `screens/brands.js` (líneas ~92-110) a este archivo (`meBrand` es el `render` de `screens/me-brand.js`, importado con ese nombre):
   - `brandHome`, `avatarUI`, `brandBrief`, `formatosUI`, `creacionUI`, `designSystemUI`, `planMesUI`, `campanasUI`, `videoUI`, `adsUI`, `techUI`
   - los embeds de `content.js` (research, postear, calendario, analytics)
   - `brandBoard`/`meBrand`, `disenoChat`, `strategy.js` (por bloque), `consulting.js`, `bullseye`
   - Los embeds de `content.js` reciben `base` = la ruta nueva.
6. **∥** `screens/content.js`: exportar `bullseyeTool(host, { slug, me })`, que monta `bullseye.js` + `saveBx` sin depender del tab `fuentes`. Actualizar los dos links `#/content/fuentes/<slug>` (~líneas 91 y 177) y `CT_MOD.fuentes` en `app.js` (3.6). **Bullseye queda alcanzable.**
7. **∥** `screens/strategy.js` y `screens/consulting.js`: aceptar montarse como herramienta (cliente y bloque desde la ruta); sus links internos a rutas `#/ws/…` (los alias cubren el resto).
8. **∥** `screens/home.js`: el layout de 3.4.
9. **∥** `public/js/screens/harness.js`: la portada `#/ai` (quick actions con `abrirEnChat` + las tarjetas de Memory & Context); las sub-páginas como «Pronto» hasta la Fase 4.
10. **∥** `screens/llm.js`:
    - quitar el switch de áreas de la barra de conversaciones (~línea 110) y su teclado (~676)
    - quitar el salto `ir-os` del dock (~671), el botón «Tablero» que lo dispara (~115) y el import de `dock.js` (su `icoApp`, ver paso 4)
    - pintarse dentro del shell (la barra visible); el modo y el cliente llegan por `abrirEnChat` o el contexto
11. **∥** `llm/modos.js`: el modo `produccion` (5.3) con sus 4 `SUGERENCIAS` y el comando `/produccion`, y las etiquetas Strategy/Marketing/Creative/Consulting/Production (ids iguales). Esto cambia `test:llm` (paso 22).
12. **∥** `areas.js`:
    - **se queda:** `abrirEnChat` y lo que necesite `llm.js` de los modos (`AREAS`, `areaDe`, `areaDeModo`, `areaGuardada`/`guardarArea`, que el Chat usa para recordar su modo; `abrirEnChat` llama `guardarArea`)
    - **se borra:** `switchHtml`, `areaConFlecha`, `barraLateral`, `ponerBarra`, `areasDe`, `areaDeEspacio` (importadores hoy: `app.js`, `screens/me.js`, `screens/llm.js`, `scripts/test-llm.mjs`)
    - la tabla de áreas se reemplaza por `WORKSPACES` de `herramientas.js` (re-exportar lo que importen otros). Ojo: `WORKSPACES` no tiene `organizacion`, y el Chat sí tiene ese modo: `areaDeModo('organizacion')` tiene que seguir resolviendo
13. **∥** `brandlist.js`: se quedan `loadBrands`, `brandsNow`, `brandAccess`, `modulesFor`. `MODULES`/`AREAS`/`FLUJO` dejan de manejar la navegación (re-exports finos mientras algo los importe).
14. **∥** `roleviews.js`:
    - borrar `SPACES` (solo lo usa `app.js`)
    - mantener `GROUPS` (lo usa Vistas por rol) con etiquetas de la nueva Organization
    - mantener `MOVED`/`movedRoute`
    - **no cambiar la matriz** (decisión 7.2-b)
15. **∥** `screens/me.js`: quitar el toggle de barra (~líneas 60, 77) y «Volver a la barra de arriba» del menú de usuario.
16. **∥** `stratlist.js`: su lista pasa a `contexto.js`; se deja `loadEstrategia`/`estrategiaNow` como re-export.
17. **∥** `menu-contextual.js`: los destinos a rutas `#/ws/…`.
18. **∥** `guia-secciones.js`: claves `home`, `ai/*`, `ws/<id>`; las claves de herramientas = nombres de módulo de hoy (los videos siguen calzando).
19. **(dueño único) `public/app.css`:**
    - **Se borran solo estos selectores** (no los bloques enteros: «ÁREAS Y BARRA LATERAL» ~4699-4980 también trae los estilos de `.lat`, `--lat-w`, `--ui-m-marketing`, `--ui-m-consulting` y `--ia-*`, que se quedan):
      - `.asw*`, `.org-btn`, `.ws-sel`, `.ws-menu*`, `.top-areas` (bloques ~4699-4980 y «Organización y los workspaces» ~4980-5024)
      - `.space-sw`/`.space-ind` (~2182-2189)
      - `html.con-dock …` (~4133, ~4151, ~4740, ~4743: el desplazamiento de 60 px del dock)
      - `.dock` del bloque Chat (~4128)
    - **Se agrega:** `.lat-ctx`, `.lat-grp` (grupos que se expanden), `.ws-tabs`, `.ws-hero`, `.ws-grid`, `.tool-card`, `.tool-ficha`, `.home-ask`, `.home-kpis`, `.home-act`, `.home-quick`.
    - **Tokens:** `--ui-m-production` (día en `:root` ~4702 y noche en `:root[data-theme="dark"]` ~4703) junto a `--ui-m-marketing`/`--ui-m-consulting` + alias `--ui-m-strategy → --ui-m-estrategia`, `--ui-m-creative → --ui-m-diseno`, `--ui-m-organization → --ui-m-organizacion`.
20. **Borrar `public/js/dock.js`** cuando ya nada lo importe (`grep -rn "dock.js" public/js scripts`; hoy lo importan `app.js` y `screens/llm.js`).
21. **Arreglo de seguridad:** `GET ads/report` (`adsGuard` en `api/index.js` ~911-916 + `report()` en `api/_lib/ads.js`) aplica `scoper`. Hoy devuelve todos los clientes con cuenta de anuncios a cualquiera con perfil `ads` (o COO).
22. `scripts/test-llm.mjs`: actualizar o quitar las aserciones de `areas.js` (import ~7 y ~204-212: `AREAS`, `areasDe`, `areaDeEspacio`, `switchHtml`, `areaConFlecha`) y las que cambian con el modo `produccion` (~13: la lista de 5 modos; ~17: 4 `SUGERENCIAS` por modo; ~50: `COMANDOS.length === 12`).
23. **(dueño único) `MAPA.md`:** §3 (pantallas: Home, Organization, AI Harness, Workspaces, selector, alias), §5 núcleo (`app.js`, `herramientas.js`, `contexto.js`, `screens/workspace.js`, `screens/harness.js`; sin `dock.js`; `areas.js` reducido), la tabla «Si vas a cambiar…», §9 (`test:herramientas`).

**`test:herramientas` (Fase 1)**
- Ids únicos; 42 en total (9 · 10 · 7 · 8 · 8).
- `ws` válido; `pestana` existe en ese workspace.
- `prioridad` y `estado` válidos; `aprueba ∈ {ceo, coo}`.
- Todo `viene_de`/`va_a` existe y el grafo de `va_a` no tiene ciclos.
- La cadena `customer-bullseye → offer-architect → campaign-architect → creative-direction-lab → production-brief` es alcanzable.
- Todo `icono` existe (`tieneIco` de `iconos.js`, como `test-ui.mjs`).
- Toda herramienta con `estado !== 'pronto'` tiene `monta`.
- `LEGACY_MODULO` cubre los 16 módulos de `MODULES` de `brandlist.js`. `brandlist.js` importa el DOM: léelo como texto, como `scripts/test-plan.mjs` (~línea 49).
- `wsDeRuta` resuelve cada fila de la tabla de alias de 3.6 (con los ejemplos de la lista «Alias» de abajo).

**Cómo se verifica en el navegador** (`http://localhost:3000`, CEO de prueba, luego un `team` con alcance `asignados`)
- `#/home`: hero, Ask (al enviar abre `#/chat` con el borrador), 4 KPIs (sin datos: vacío con fuente), actividad reciente, 5 accesos.
- La barra lateral: el árbol de 3.2; ningún switch de áreas ni dock; ⌘B mini; a 375 px la barra de abajo y el chip del cliente.
- Selector: cambiar de cliente dentro de `#/ws/marketing/<a>/content` → `#/ws/marketing/<b>/content`; se cierra con Escape, con clic afuera y al navegar con ⌘K y «atrás».
- **El dropdown ya no existe** y ningún popover queda abierto después de navegar.
- Para cada workspace, cada pestaña muestra su hero y su grilla:
  - `#/ws/strategy/<slug>/research/customer-bullseye` pinta la diana y guarda (antes inalcanzable).
  - `#/ws/strategy/<slug>/analysis/business-xray`, `.../strategy/offer-architect` y `.../roadmap/growth-roadmap` montan `strategy.js` en su bloque; aprobar sigue siendo solo del CEO.
  - `#/ws/marketing/<slug>/content/content-strategy-studio`, `.../content-calendar`, `.../campaigns/campaign-architect`, `.../campaigns/ads-intelligence`, `.../analytics/marketing-performance-center`, `.../audience/viral-intelligence-lab`.
  - `#/ws/creative/<slug>/brief/brand-dna-studio`, `.../concepts/creative-direction-lab`, `.../design/visual-identity-builder`, `.../design/design-studio`.
  - `#/ws/consulting/<slug>/overview`: encargos + tarjetas (la mayoría Pronto, con ficha).
  - `#/ws/production/<slug>/pre-production/script-storyboard-studio`, `.../post-production/post-production-workspace`.
  - Una tarjeta Pronto abre su ficha (recibe / produce / alimenta / prioridad).
- **Alias** (cada uno aterriza en la herramienta correcta, con la barra resaltada): `#/marcas`, `#/marcas/akai`, `#/marcas/akai/plan/2026-10`, `#/marcas/akai/video`, `#/marcas/akai/creacion`, `#/marcas/diseno/akai`, `#/estrategia/akai/roadmap`, `#/consulting/akai`, `#/content/fuentes/akai`, `#/org/home`, `#/mimarca`. Recargar en cada una mantiene la ruta canónica.
- `#/chat` se ve dentro del shell; el modo y el cliente llegan desde «Ask InherentOS».
- Como `team` con alcance `asignados`: no ve clientes ajenos en el selector, `GET /api/ads/report` solo trae sus clientes y no ve workspaces que su perfil no abre.
- Como `personal`: solo el CEO la ve en el selector.

**Pruebas:** todas las de 2.6 + `test:herramientas`. `test:llm` actualizado.

### Fase 2 · Tool Shell + deliverables + Consulting real (rama `os-ws/fase-2-shell`)
**Meta:** existe el contrato de herramienta de punta a punta, y Consulting deja de ser botones.

**Archivos**
- **Nuevos:**
  - `public/js/entregables.js` (puro)
  - `api/_lib/entregables.js` (rutas)
  - `public/js/tool-shell.js`
  - `public/js/ia-herramienta.js` (`correrIA`)
  - `public/js/consulting/` con `marcos.js` (los marcos compartidos, 4.3) y un archivo **puro** por herramienta: `salud.js`, `causas.js`, `procesos.js`, `escenarios.js`, `blueprint.js`, `impacto.js` (`prompt`, `leer`, `limpiar`, `faltas`; sin DOM ni red, para que los importen `test-herramientas.mjs` y `api/`) + su vista aparte (`salud-ui.js`, …), como `avatares.js` / `avatar-ui.js`
- **Cambian:**
  - `api/_lib/access.js` (`COLLS`, `scoper`)
  - `api/index.js` (`collGuard` y registrar `entregables.rutas(on)`; pasarle `cleanTask`/`outOfScope` o moverlos, ver 5.2)
  - `public/js/herramientas.js` (bloque, prompt, leer, limpiar de las herramientas de Consulting)
  - `screens/consulting.js` (pasa a Overview: hero + encargos + entregables recientes)
  - `llm/modos.js` (los `CONSULTING` quedan como semillas; `SUGERENCIAS.consulting` → «Correr herramienta»)
  - `llm/paneles.js` (`panelConsulting` enlaza a las herramientas)
  - `diagram-model.js` (campo opcional `lane`)
  - `goals.js` (aceptar `origen`, `blueprint_ref` sin romper el wizard)
  - `app.css` (shell, scorecard, árbol)
  - `MAPA.md` (§2 la regla de deliverables, §4 `entregables.js`, §8 la colección)

**Herramientas reales en esta fase (Consulting P1, en el orden de su cadena):** Diagnóstico de crecimiento → Árbol de la brecha → Mapa del camino del dinero → Money Model Lab → Plan de crecimiento 90 días → Impact Tracker (4.2 y 4.3). Automation Finder y Equipo para la siguiente etapa quedan para la Fase 3 (P2). El gate `alcanceConsulting` pasa al **servidor** dentro de `abre()`.

**Se borra:** la grilla de 12 botones de tema como interfaz principal de Consulting (los prompts se quedan como semillas).

**Pruebas nuevas (en `test-herramientas.mjs`)**
- `pasoPermitido`: Borrador→En revisión = `edita` · En revisión→Aprobado = `aprobador` · Aprobado→Borrador solo por versión nueva · archivado bloquea.
- `faltas()` bloquea aprobar.
- `marcos.js`: `objetivoBien` acepta «Aumentar las ventas de $1M a $1.5M para el 31/12/2027» y rechaza uno sin X→Y o sin fecha · cada `ETAPAS_HORMOZI[i].ruta` existe en `agents/01-strategy/brain/skills/hormozi-brain/references/roadmap/` (leer el disco en la prueba) · el Diagnóstico con capacidad en rojo no deja aprobar una recomendación de demanda.
- Una versión nueva sobre un Aprobado pone `aprobado=null` y sube la versión.
- `siguienteDe()` solo desde Aprobado y solo a una herramienta permitida, con `entradas` de la versión aprobada.
- `tareasDeEntregable()`: `tipo ∈ TASK_TIPOS`, `status 'Por empezar'`, `origen 'entregable'`, `deliverable_id`, `client_slug`, `area`; nada que `cleanTask` tire.
- Cada `prompt(ctx)` de Consulting incluye las reglas comunes («Evidencia o etiqueta», alcance), pide su bloque y ```criterios```, no contiene `06-ECONOMIA` ni costos, y mide < 5 000 caracteres.
- `leer()` lee un bloque bien formado, ignora uno a medias y da null con basura. `limpiar()` quita llaves desconocidas, `id`, `v` y `_meta`, y deja el HTML como texto.
- **Estáticas** (leer archivos como texto):
  - `collGuard` tiene el 404 de `deliverables` y `deliverable_versions`.
  - `COLLS` y `scoper` tienen `deliverables`.
  - `api/_lib/entregables.js` no llama `db.upsert` y todo `db.update` pasa `v`.
  - `api/index.js` registra `entregables.rutas(on)`.
  - Ninguna ruta de `entregables.js` usa `{ client: true }`.

**Navegador**
- `#/ws/consulting/<slug-partnership>/assessment/business-health-assessment`:
  - generar (Hermes o puente; si no hay, claude.ai pegando) → 8 filas → guardar → recargar sigue igual.
  - Editar en dos pestañas → la segunda recibe 409.
- Con un cliente Brand Growth: banner FUERA DEL ALCANCE, sin «Generar», y `POST /api/entregables` responde 403 (`FUERA_DEL_ALCANCE`). Con un cliente sin ficha: 409.
- Aprobar: como COO → el botón no está y la API da 403 para `aprueba:'ceo'`. Como CEO → Aprobado y solo lectura.
- «Enviar a Root Cause Explorer» → Borrador con los problemas prellenados y `entradas` a la v aprobada.
- Solution Blueprint → «Convertir en tareas» → las tareas aparecen en `#/org/work` con `area:'consulting'` y `client_slug`. Un segundo clic no duplica. «Enviar a Impact Tracker» → la meta aparece en `#/org/clients/<slug>` y en el portal (`#/org/portal/<slug>`) solo como meta.
- Como `team` asignado a otro cliente: `GET /api/entregables?slug=<ajeno>` da lista vacía o 404. `GET /api/db/deliverables` da 404.
- `#/org/library` no muestra árboles ni mapas de cliente.

**Pruebas:** todas las de 2.6 + `test:herramientas`.

### Fase 3 · Herramientas nuevas P1 y P2, en orden de la cadena
Un PR por sub-bloque. Todas usan Tool Shell + `correrIA` + deliverables (o su casa existente, 5.2). Al terminar cada sub-bloque, se marca `estado: 'lista'` en `herramientas.js`.

**3a · Strategy P1** (rama `os-ws/fase-3a-strategy`): Customer Bullseye (ruta `PUT estrategia/:slug/bullseye`) → Business X-Ray → Customer Avatar Studio (`guardAny`) → Offer Architect (con Modelo de dinero adentro) → Growth Roadmap Builder.
- **Se mueve:**
  - El panel monolítico «Estrategia en vivo» (`panelViva`) se parte: contexto/análisis → X-Ray, metodología → Offer Architect, roadmap → Roadmap. El Overview sigue mostrando un resumen.
  - Los 5 bloques dejan de ser navegación (solo quedan como unidad de aprobación dentro de su herramienta).
  - **El bloque Leads sale a Marketing** (su contenido entra al plan de canales de Campaign Architect en 3b).
- **El chat propio de `strategy.js` (~400 líneas: puente/Hermes, `CHATS`, `menuMotor`) NO se borra todavía** (decisión 7.1). Las herramientas usan `correrIA`; el chat queda como «Continuar en el Chat».
- **Navegador:**
  - recorrer las 5 herramientas en un cliente con ficha
  - aprobar la estrategia (CEO) → todas en solo lectura
  - Brand Growth: Offer Architect bloquea precio y stack (UI y API)
  - la herramienta `planner` del conector MCP sigue devolviendo `diana`

**3b · Marketing P1** (rama `os-ws/fase-3b-marketing`): Campaign Architect (unifica `campaigns`, recibe Leads, «Enviar a Creative») → Content Strategy Studio → Ads Intelligence (mueve `adsReport`/`adsComp` de `screens/work.js`; Mis tareas deja solo un link) → Marketing Performance Center → Viral Intelligence Lab → mejoras de Content Calendar.
- **Navegador:**
  - Offer Architect aprobado → «Enviar a Campaign Architect» crea el Borrador con `entradas`
  - el plan sin estrategia aprobada da 409
  - Ads: ninguna llamada a escritura de Windsor/AdWhispr (revisa la red)
  - `resumen` solo ve el Performance Center

**3c · Creative P1** (rama `os-ws/fase-3c-creative`): Creative Direction Lab → Design Studio → Brand DNA Studio → Moodboard Studio → Visual Identity Builder.
- **Se mueve:**
  - `brand-board.js` se parte (DNA / Moodboard); el componente sigue para `me-brand.js`
  - `diseno-chat.js` pierde las etapas Plan e Ideas (su ruta `#/marcas/diseno` sigue como alias)
- **Se quita** «Retocar fotos con IA» de `SUGERENCIAS` en `diseno.js` (contradice gd-imagen).
- **Permisos:** `brand_boards` hoy es área `clients` (`canEdit(me,'clients')`); un diseñador con solo `content` no puede editar. **Es decisión 7.2-a: no cambies `COLLS` ni la matriz sin la respuesta del CEO.** Mientras tanto, el botón se muestra solo a quien edita Clientes.
- **Navegador:**
  - «Enviar a Creative» desde una campaña → concepto → «Convertir en piezas» crea las piezas del slot (sin brief: 423)
  - Design Studio en el cel dice «solo en tu compu»
  - `leerSistema(escribirSistema(x))` en prueba

**3d · Production P1** (rama `os-ws/fase-3d-production`): Production Brief Builder (`public/js/produccion.js` con `shotData`/`pieceText`) → Script & Storyboard Studio → Shot List Builder → Post-Production Workspace → Review & Approval Studio (en el portal).
- **Se mueve:** el código muerto de shot list sale de `screens/content.js`; `work.js` «Kit por cliente» enlaza a Post-production.
- **Navegador:**
  - **la cadena completa:** Bullseye (aprobado) → Offer Architect → Campaign Architect → Creative Direction Lab → «Enviar a Production Brief», con un Borrador cuyas `entradas` llegan hasta el Bullseye
  - en `#/portal` (rol `client`, login del portal o la vista `#/org/portal/<slug>`): comentar en un segundo, pedir cambios, aprobar v2 → la pieza pasa a Listo

**3e · P2** (rama `os-ws/fase-3e-p2`), en este orden:
1. Commercial Diagnosis
2. Opportunity Map
3. Competitor Radar (componente de anuncios compartido)
4. Pricing & Packages
5. Organization Architect → Equipo para la siguiente etapa
6. Automation Opportunity Finder
7. Hook Laboratory
8. Copywriting Studio
9. Funnel Builder
10. Brand Consistency Checker
11. Creative Performance Analyzer
12. Production Planner (shoot sin borrado duro)
13. Content Repurposing Engine
- **Las P3 se quedan «Pronto» con su ficha:** Growth Experiment Lab, AI Video Lab.
- **Navegador:** por cada herramienta, su lista «Acepta» de 4.3, en un cliente con ficha y en uno sin ficha (409), como CEO y como `team` `asignados`.

**Pruebas de la Fase 3:**
- Por cada herramienta: su `prompt`, `leer`, `limpiar` y `faltas` en `test-herramientas.mjs` (mismo patrón de la Fase 2).
- Las funciones de cálculo puras (score comercial, ranking de oportunidades, simulador de margen, escenarios, ratio 1:2) con casos de «falta dato → null».
- `escribirSistema` ida y vuelta.
- `test:viva` si cambia `limpiarParche`; `test:plan` (Content Strategy Studio); `test:fase4` (avatares); `test:fase5` (guiones); `test:marca` (video, ads); `test:diseno`; `test:avisos` si se toca un aviso.

### Fase 4 · AI Harness (rama `os-ws/fase-4-harness`)
**Meta:** que se vea la «inteligencia compartida». Primera versión **de solo lectura** con lo que ya existe, sin backend nuevo.

`public/js/screens/harness.js`, rutas `#/ai/<página>`:
- **`#/ai` (overview):**
  - Quick actions: **Deep Research** (Investigación o `abrirEnChat` modo estrategia con el cliente) · **Create Deliverable** (elige herramienta → abre su shell) · **Run Workflow** (recetas y cadenas) · **Analyze Performance** (Performance Center del cliente).
  - Memory & Context en 4 tarjetas.
- **Agents:** los modos del Chat desde `HARNESS` de `llm/modos.js` (rol, cómo trabaja, herramientas, criterios), como «Cómo trabaja este modo» de `llm/paneles.js`. Los 12 agentes del repo, como **lista estática** en un módulo puro (sin leer `agents/`, que no está en la copia del build).
- **Skills:** `skillsHermes(me)` por compu (si Hermes no está, decir cómo encenderlo) + las fuentes de hormozi-brain (`estrategia/fuente`).
- **Workflows:** las recetas (`recipes.js`: `CICLO_DEPTS`, `GROWTH`, `MEET` + las del CEO en `db/recipes`), el flujo lead → cotización → cliente → proyecto (`api/_lib/flow.js`), la secuencia de Diseño y las cadenas `va_a` de `herramientas.js` dibujadas sobre el flujo compartido.
- **Memory:**
  - Organization: Library, `settings` `vision`.
  - Client: `accounts`, `repo/client/:slug` + intel, `estrategia/:slug`, avatares, `brand_boards`, sistema visual, `content/cfg`, deliverables del cliente.
  - Project: `db/projects` + `db/tasks`.
  - Execution history: tareas con `done_at`, sesiones de Hermes, juicios de Laya, `historial` de deliverables.
- **Models:** `llm/ias.js` (`IAS`, `LOCALES`, `iasListas`), `modelosHermes(me)`, `MOTORES` y `CLAUDE_MODELOS` de `motor-ui.js`, `ESFUERZOS`, los puntos de estado `saludHermes`/`saludPuente`, y qué camino usaría hoy `correrIA` para esta persona.
- **Evaluations y Quality Rules:** puertas de Laya (`GET laya/puertas`) y juicios (`GET laya/juicios`), los `criterios` guardados en deliverables, `REGLAS_COMUNES`/`PROTOCOLO`/criterios por modo, `alcanceConsulting`. `08-CRITERIOS-DE-ACEPTACION.md` no está en la copia: solo se nombra.

**No se construye aquí:** un router de modelos del servidor, evaluaciones persistidas nuevas, una ruta para leer `audit` ni listar agentes desde Vercel (son backend: preguntar).

**Navegador:**
- cada `#/ai/<página>` carga sin errores con y sin Hermes encendido
- las quick actions abren la herramienta o el Chat con el cliente del contexto
- quien no es CEO no ve nada de costos

**Pruebas:** todas + `test:ui` (íconos nuevos).

---

## 7 · Lo que decide el CEO

### 7.1 La decisión grande: ¿el harness corre en cada Mac (Hermes) o en el servidor?
**El plan no se bloquea por esto.** Las Fases 1 a 4 usan `correrIA` con lo que hay hoy (Hermes → puente → claude.ai pegando).

Dónde cambia si el CEO elige **servidor**:
1. `public/js/ia-herramienta.js`, en el **PUNTO DE CAMBIO** (5.3): la rama `via:'servidor'` → `api('ia/correr', { method:'POST', body:{ tool, client_slug, entradas } })`. El servidor **arma `ctx` él mismo** (nunca confía en el del navegador), corre el proveedor con llaves en variables de Vercel y guarda el entregable en la misma llamada. **Ninguna herramienta cambia**: `prompt`, `leer` y `limpiar` ya son puros e importables desde `api/`.
2. Nuevo `api/_lib/ia.js` + llaves de proveedor en Vercel. Ojo con los **60 s por llamada**: necesita streaming o trabajo en dos tiempos (como el scraping).
3. `vercel.json`: no cambia `connect-src` (es el servidor el que llama).
4. **Se podría** entonces retirar los chats de `strategy.js` y `diseno-chat.js` y quedarse con un solo Chat.

Si elige **local (Hermes en cada Mac)**: se quita el chat de `strategy.js` cuando todo el equipo tenga Hermes instalado (Avisos ya revisa la compu), y Design Studio pasa a Hermes con figwright. **Hasta que el CEO decida, no se borra ningún chat que hoy funciona.**

### 7.2 Decisiones menores (el plan trae un valor por defecto; pregunta antes de pasar del defecto)
- **a) Quién edita Identidad y Moodboard.** Hoy `brand_boards` es área `clients`. Defecto: no se cambia; el diseñador ve y no edita. Cambiarlo toca `access.js` + `roleviews.js` (servidor, conector e interfaz a la vez).
- **b) Consulting con su propia sección en Vistas por rol.** Defecto: sigue colgado de `estrategia` (`hasEstrategia`). Necesario si el CEO quiere abrir Consulting a un especialista externo sin abrirle Strategy.
- **c) Dónde vive Tech (sitios, landing al CRM, web viva, SEO).** Defecto: dentro de Marketing › Campaigns (Funnel Builder lee sus landings). Alternativa: Production › Delivery u Organization.
- **d) Eden u otra fuente nueva de social/ads.** Defecto: no. Si sí, del lado del servidor, con llave en Vercel y el mismo patrón de dos tiempos que Apify.
- **e) Nombres del menú en inglés (como su imagen) o en español.** Defecto: inglés. Cambian en una sola constante (`NAV`).
- **f) Publicar al repo desde Creative** (`02-marca/guia-de-marca.md`, `02-marca/sistema-visual.md`): `rutaEditable` ya acepta esas rutas y la escritura sería del CEO por `PUT estrategia/:slug/doc`. Defecto: Creative solo exporta (md/PDF) y no escribe en el repo hasta su OK.

---

## 8 · Fuera de alcance · no hacer

- **No** tocar `inherent/`, `agents/`, `clients/`, `CLAUDE.md`, `PENDIENTES.md`, `escritorio/` ni la app externa `agents/07-video-editing/brain/motor/aprobacion`.
- **No** `push` a `main` ni fusionar PRs; **no** correr contra la base de producción (`DEV_BASE_REAL`).
- **No** cambiar el look: ni paleta, ni tipografía, ni radios. Solo componentes nuevos con los tokens de «SISTEMA v2».
- **No** reconstruir lo que se integra:
  - un editor de diseño (es Figma)
  - un editor de video (es el motor de ⑦)
  - un scraper (es Apify)
  - un scheduler o publicador (Zernio y ⑨ Posting)
  - un generador de video/imagen
  - **escribir en plataformas de anuncios** (Windsor/AdWhispr: solo lectura; los cambios son tareas o el OK del CEO)
- **No** abrir colecciones nuevas por `/api/db`, ni rutas con `{ client: true }` fuera del portal, ni lecturas de `06-ECONOMIA`, `rates`, `packages`, `bundles`, `payroll`, `cost_recipes`, `finscope.js`, `catalogo.js`, `armados.js` o `paquetes.js` desde herramientas de cliente.
- **No** quitar la regla de solo lectura de `puente.py` ni los toolsets apagados de Hermes.
- **No** agregar aprobaciones del CEO fuera de Strategy (con Consulting, que cuelga de ella: 5.2), gasto/precio y lo que hoy ya es suyo.
- **No** borrar datos: archivar. **No** migrar destructivamente (la diana, los shoots, las campañas y los avatares se quedan donde están).
- **No** retirar los chats de Estrategia y Diseño hasta la decisión 7.1.
- **No** construir las P3 (Growth Experiment Lab, AI Video Lab): quedan como «Pronto» con su ficha.
- **No** agregar ruta para leer `audit`, ni un router de modelos del servidor, ni listar `agents/` desde Vercel sin preguntar.
- **No** cambiar los ids de los modos del Chat (`inh-<modo>-…`).
- **No** escribir documentos de resumen o reportes: lo que haya que decir va en el PR.

---

## Anexo A · Diagnóstico verificado (para no redescubrirlo)

- **Navegación brand-first:** cierto. `#/marcas/<marca>/<módulo>`, área inferida del grupo del módulo (`brandlist.js` `AREAS`, 6.º campo; `areaDeRuta` en `app.js`).
- **Customer Bullseye inalcanzable** (peor que «enterrado»): `bullseye()` solo se monta en `fuentes()` de `screens/content.js` (`#bxHost`, ~líneas 393/424); `'fuentes'` no está en `TABS` (`screens/content.js` ~línea 15) ni en `FIXED_TABS` (`screens/content.js` ~38); todos los montajes de `content.js` son embeds con `only:[research|postear|calendario|analytics]`; `CT_MOD` en `app.js` manda `#/content/fuentes/<slug>` a `investigacion`.
- **Guiones y Video** están en Diseño (grupos `crear`/`diseno`); **Production no existe**.
- **Consulting** = botones de tema que llaman `abrirEnChat` (`screens/consulting.js`); nada se guarda. Su acceso cuelga de `hasEstrategia()` (`app.js` ~112, 131, 198, 217).
- **Strategy** = un doc vivo con 5 bloques + chat.
- **Tres chats:** `strategy.js` (puente/Hermes), `diseno-chat.js` (puente + Figma), `llm.js` (Hermes). Sin pantallas de AI Harness.
- **El dropdown «Workspace» se queda abierto** (`app.js`):
  - Qué hace hoy: `menuWs()` (~145-165) agrega `.ws-menu` a `<body>` y solo cierra con: clic en una opción · Escape/Tab con el foco **dentro** del menú (~159-164) · un `pointerdown` en el documento que ignora clics dentro del **botón original** (~156).
  - Por qué falla: `paintLat()` (~417-431) y `paintNav()` (~313-330) vuelven a montar el botón en cada `markNav` (render, `loadBrands`/`loadEstrategia` ~555-557, evento `navsync`, cada `replaceState` por el hook ~627), así que el menú guarda un botón viejo. Al hacer clic en el nuevo: `pointerdown` cierra → `click` no encuentra `.ws-menu` → **lo reabre**. Navegar por link, ⌘K, atrás o hashchange nunca lo cierra (`render()` no limpia). El Escape de `.lat` (~494) solo quita `.lat-menu`, y `.top` no tiene Escape.
  - El arreglo, que vale para cualquier popover nuevo (el selector de contexto): cerrar todos los popovers al empezar `render()` y en `hashchange` · un solo Escape a nivel `document` · decidir abrir/cerrar con `document.querySelector('.ws-menu')` · clic afuera con `e.target.closest('[data-ws-menu]')`, no con la referencia al botón.
- **`GET ads/report` no aplica `scoper`:** `adsGuard` en `api/index.js` revisa el rol (ceo, coo, ads), pero `ads.report()` devuelve todos los clientes con cuenta de anuncios. Se arregla en la Fase 1 (paso 21).
- **Dos «campañas»:** `mk_campaigns` (`campanas.js`, área content) y `campaigns` (pauta, creadas en `screens/work.js`, área operations). Se unifican en 3b.
- **`content` `kind:'shoot'`** se borra en duro desde el calendario (`C.remove` / opción `__del`): pasa a archivar en 3e.
- **La ficha de video** tiene el campo `post`, pero la interfaz nunca lo pone: aprobar un video hoy no mueve la pieza a Listo (se arregla en 3d).
- **`agents/*/brain` no entra a la copia del build** (`scripts/snapshot.mjs`), salvo las referencias de hormozi-brain (`api/_data/fuentes.json`). `inherent/08-CRITERIOS-DE-ACEPTACION.md` tampoco.
- **Solo un cliente tiene `sistema-visual.md` y `guia-de-marca.md`**: casi todas las marcas abren Creative en estado vacío. Es correcto: «vacío y dice de dónde sale».
