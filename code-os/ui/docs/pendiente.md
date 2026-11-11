# Departamentos (v3): lo que es mock y lo que falta

Pantalla única: chat al centro y panel derecho con **Cliente** (resumen, avisos, hilo), **Agentes** (portal y
pestaña en vivo), **Herramientas** (artefactos) y, en Code, **Código**. Capturas: `docs/capturas/v3/`.

## Endpoints que faltan (la interfaz ya los llama; con 404/501 dice «Falta en el backend: …»)
Se piden a `VITE_HERRAMIENTAS_URL` o, si no está, al puente. Forma acordada; la final va en `code-os/docs/herramientas-api.md`.
- `GET /clientes` · `GET/POST /clientes/:id/nodos` · `GET/PUT /clientes/:id/nodos/:nid` · `GET /clientes/:id/nodos/:nid/dependientes` · `GET /clientes/:id/avisos`.
- `POST /clientes/:id/nodos/:nid/aprobar` con cuerpo `{ version }` = la versión que la persona abrió. El servidor debe responder **409** si no es la actual (la interfaz ya bloquea el botón hasta abrir; falta que el servidor también lo haga cumplir y guarde quién lo leyó).
- `POST /calc/outbound` y `POST /calc/inbound`: si no existen, se calcula en el navegador con la misma fórmula (el caso 913 / 229 / 46 tiene prueba).
- `POST /clientes/:id/calibrar`: tasas reales de Zernio para inbound. Hoy, mock.
- **`contenido` de cada nodo**: la interfaz guarda un objeto con campos por herramienta (`facturacion`, `ticket`… del ICP; `outbound`/`resultado`; `winners`; `jornada`/`shots`/`permisos`/`compras`/`hooks`; `copy`/`resultado`/`ideas`) y `decide` (qué decide, en una línea). Si el backend elige otra forma, se ajusta en un solo lugar por herramienta.

## Mock (se ve, no es real)
- **Clientes y nodos**: «Lumbre Catering (ejemplo)» y «Estudio Norte (ejemplo)» son inventados (`src/data/departamentos.ts`); se guardan en el navegador.
- **Descartar un aviso** («Ya lo revisé») es local; falta `POST …/avisos/:id/visto` o equivalente.
- **Portal del agente**: workflow, habilidades y los trabajos con borde punteado son de ejemplo (`src/lib/agentes.ts`) hasta que el puente exponga los workflows y `agentes/runs`.
- **Sugerencia de conversión** («¿oferta comprobada?»): valores fijos marcados [hipótesis · ejemplo]; falta que el agente la proponga con fuente.
- **Radar**: los winners son de ejemplo; falta el radar automático (alternativa gratuita a Apify).
- **Editor de video**: contenedor vacío; el motor (FilmCraft en prueba) entra en otro PR.

## Real con el puente de hoy
- `@agente` al inicio del mensaje: la sesión se crea con `agents` (subagentes del SDK) y el turno pide usar ese subagente con lo ya hablado. En Chat ese turno va en modo `plan` (la sesión de chat no tiene herramientas). La pestaña del agente muestra en vivo el texto del subagente (eventos con `parentToolUseId`) y su etapa se deduce de la descripción.
- Las preguntas del agente usan `AskUserQuestion`: salen en el chat, nunca en el panel.
- Falta en el puente: etapas reales, aporte obligatorio, «leído» del servidor y trabajos del equipo (§20 de `ceo-os/PLAN-GATEWAY.md`). Las sesiones creadas antes de este cambio no tienen `agents`: hay que abrir un chat nuevo.

# Code dentro del Chat del OS (v3.1)

## Lo que quedó
- **Embebido** (`?embed=1`): solo paneles, con el pase del OS por `postMessage`. Contrato: `docs/embebido.md`.
- **Router por tarea y modo Auto**: `src/lib/cocina.ts` es copia de `ceo-os/public/js/llm/router-code.js` (la prueba compara las dos). El hilo muestra «Sous chef · nivel-alto: interfaz» y el esfuerzo. Si la persona fija un nivel, el router no se mete.
- **Cambios**: comentarios por línea → «Enviar comentarios» (va directo a la sesión), «Revisar» (otro nivel distinto al que construyó) y «Fusionar» (`POST /sessions/:id/merge`, solo en sesiones aisladas). Interruptor «Sesión aislada» al crear una sesión de Code (`isolate: true`).
- **Permisos**: Manual, Plan y Aceptar ediciones. Sin «Saltar permisos».
- **Memoria y skills**: la página del cliente dice qué `CLAUDE.md` y qué skills cargó la sesión; `/` lista las skills del servidor.
- **Terminal**: la real del puente por WebSocket (`?pase=` con el pase del OS; si no, la cookie de `/entrar`).

## Lo que necesita el puente
- **Modelos de Claude por cocinero**: el orden del CEO (chef = Fable/Astra, sous = Sonnet, línea = Opus, prep = Haiku) está en `MODELOS_CLAUDE` de `src/lib/cocina.ts`, pero sin `id`: hoy se manda el nivel (`nivel-alto`…) y el puente usa tu Claude primero si está activo. Cuando el puente exponga un alias por modelo de Claude, se pone su `id` ahí y listo.
- **«Aceptar ediciones» nativo**: hoy viaja como `code` y la interfaz aprueba sola `Edit`, `MultiEdit`, `Write` y `NotebookEdit` (lo demás sigue pidiendo permiso). Mejor: que el puente acepte `mode: "acceptEdits"` (el SDK lo tiene).
- **Esfuerzo** (máximo, alto, medio, bajo): se muestra como información; el puente aún no recibe esfuerzo por turno.
- **Memoria del cliente (mock)**: falta `GET /clientes/:id/memoria` (o en la sesión) que diga qué `clients/<slug>/CLAUDE.md` cargó. Hoy lo dice el mock.
- **Skills de `agents/`**: `GET /skills` lee `PUENTE_SKILLS_DIR`; falta apuntarlo (o sincronizar) a las skills de `agents/` del repo. `/nombre` se manda como texto al motor.
- **Primera carga embebida sin pase en la URL**: `/entrar?pase=…&volver=/?embed=1`.
- **Cabecera `frame-ancestors`** en el Caddy de `code.` (ver `docs/embebido.md`).

## Lo que necesita el OS
- Montar el iframe (`?embed=1&pase=`) en el panel del Chat en modo Code, escuchar `codeos:listo` / `codeos:pedir-pase` / `codeos:al-chat` y mandar `codeos:pase` y `codeos:contexto` (cliente, sesión del puente, rol, tema, nivel, aislada).
- Crear sesiones aisladas desde su Chat (`isolate: true`) si la persona lo pide, y avisar `aislada: true` en el contexto.
- Usar el mismo router (`router-code.js`) cuando `codeos:al-chat` traiga `modelo` (Revisar).

# Lo que no entró en la v2 de la interfaz

Funciones del inventario (`code-os/docs/inventario-claude.md`) que quedaron fuera, con la razón en una línea.
**Mock** = se ve en la interfaz con datos de ejemplo, pero falta el endpoint del puente para que sea real.

## Faltan endpoints o eventos del puente (la pantalla ya existe o está a medias)
- **Ya reales con el puente de `main`** (antes mock): archivos (`GET/PUT /sessions/:id/files`), cambios (`GET /sessions/:id/diff`), fusionar (`POST /sessions/:id/merge`), terminal por WebSocket, `GET /mcp`, `GET /skills`, `GET /me`, `GET /cuotas`.
- **@ mencionar archivos**: solo autocompleta con el árbol de archivos de la sesión.
- **Imágenes y PDF al modelo**: el puente solo acepta `{text}`; hoy los archivos de texto se pegan dentro del mensaje.
- **Corregir mientras trabaja** (mandar otro mensaje sin detener): el puente ya acepta `queue: true`; falta usarlo en la interfaz.
- **Reglas de permisos editables**: falta `GET/PUT` de reglas permitir/negar.
- **«Saltar permisos»**: fuera a propósito (decisión del CEO).
- **Checkpoints y rebobinar**: el puente no expone `rewindFiles()`.
- **Separador de compactación**: el puente no emite `compact_boundary`.
- **Historial en el servidor**: hoy se guarda en el navegador (localStorage); falta leer los mensajes de una sesión (`GET /sessions/:id/history` existe: falta usarlo).
- **Vista previa del servidor de desarrollo del VPS**: falta un proxy por puerto en el puente (hoy solo URLs alcanzables).
- **Panel de detalles de sesión (+líneas, qué corre)**: solo se muestra el contexto; falta el dato del puente.

## Fuera por tamaño o para no volver la interfaz un caos
- **Paneles arrastrables, vista dividida, sacar a ventana**: un panel lateral redimensionable cubre lo diario.
- **Worktree por sesión, entornos guardados, añadir carpetas**: dependen de git y carpetas en el servidor.
- **Crear PR, estado de CI, auto-fix**: necesitan `gh` en el servidor; va después del diff real.
- **Tarjeta de `/code-review` con «Arreglar este»**: hoy `/review` va como texto al motor.
- **Editar un mensaje anterior (ramas)**: necesita árbol de mensajes en el servidor.
- **Chat lateral (`/btw`) y sugerencia de siguiente prompt**: necesitan bifurcar sesión o una llamada extra al modelo.
- **Hooks, plugins y estilos de salida**: P2 del inventario; se editan en el servidor.
- **Esfuerzo (effort)**: no verificado con modelos que no son de Anthropic.
- **Voz y dictado**: P2; necesita voz a texto en el servidor.
- **Tareas programadas**: P2; cron en el servidor.
- **Menú contextual de archivo**: quedó en botones (mencionar, copiar ruta) dentro del visor.

## Dependen del servidor o no se replican
- **Proyectos con base de conocimiento (archivos + búsqueda)**: necesita almacenamiento y vectores en el servidor.
- **Búsqueda web, Research, pensamiento extendido**: son herramientas del servidor, no de la interfaz.
- **Conectores con OAuth, apps MCP UI**: el login y los procesos viven en el servidor.
- **Creación de archivos en contenedor y compartir chats o artefactos**: necesitan almacenamiento con enlaces firmados.
- **Plantillas de artefacto (Docs, Slides…) y artefactos que llaman a Claude**: no replicables como en claude.ai.
- **Modo Auto, Dispatch, nube, Remote Control, seguir otras sesiones, tareas sugeridas**: dependen de Anthropic o de la app de escritorio.
- **Login con la suscripción de Claude**: se hace en el servidor a propósito; la interfaz solo muestra el estado.
