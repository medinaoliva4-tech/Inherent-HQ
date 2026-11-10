# Inventario de la app de Claude (escritorio): Chat y Code

Fecha: 2026-11-09 · Versión instalada en esta Mac: Claude 4.23118.1 · Propósito: base para decidir qué replica Code OS (interfaz cerrada en el VPS, motor = Claude Code oficial apuntado a LiteLLM).

> Esto es solo investigación. Replicamos **estructura y funciones con marca Inherent**, no el aspecto: Anthropic no permite imitar visualmente Claude Code (arte, ASCII, marca).

## Cómo leer las tablas

**Origen del dato** (de dónde sale lo que se muestra):
- **SDK**: llega como mensaje o evento del Agent SDK (`query()` con `includePartialMessages`, `canUseTool`, hooks, etc.). Lo pintamos tal cual.
- **Interfaz**: lo resuelve solo la pantalla, sin pedirle nada al modelo (atajos, paneles, ajustes locales).
- **Servidor**: lo hace nuestro backend en el VPS (git, `gh`, procesos, archivos, base de datos, cron).
- **No replicable**: depende de la nube de Anthropic o de su cuenta; hay que reemplazarlo o dejarlo fuera.

**Prioridad** para una primera versión: **P0** sin esto no es «Code OS» · **P1** primera mejora · **P2** después o nunca.

**Verif.**: ✅ confirmado en documentación oficial (code.claude.com o support.claude.com, leída hoy) · 🟡 confirmado solo en parte · ❓ **NO verificado** (ver sección final).

**Piezas open-source citadas** (nombres genéricos; no se instaló ni probó ninguna): shadcn/ui, AI Elements (de Vercel; según el encargo pasa a shadcn/ui a fin de nov 2026, **no verificado**), Beautiful UI, xterm.js, CodeMirror 6, `react-diff-view` o `@git-diff-view/react`, `react-markdown` + Shiki, `react-resizable-panels` o `dockview` (paneles), `cmdk` (paleta de comandos y slash), `@dnd-kit` (arrastrar), Radix (menús, diálogos), `node-pty` (terminal real en servidor), Sandpack o iframe con `sandbox` (previsualizar artefactos y apps).

---

## A. Code (pestaña de código)

### A1. Sesiones y espacio de trabajo

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Sesión | Una conversación con su propio historial y su carpeta de proyecto; barra lateral lista todas y corren en paralelo | SDK (`session_id`, reanudar) + Servidor (lista y estado) | shadcn Sidebar | P0 | ✅ |
| Nueva sesión (Cmd+N) | Crea sesión eligiendo entorno, carpeta, modo de permisos y modelo en una fila bajo la caja de texto | Interfaz + Servidor | shadcn Select/Popover | P0 | ✅ |
| Entorno: local, nube, SSH | Elige dónde corre Claude. En Code OS el único «entorno» es el VPS | Servidor | — (fijo) | P0 (fijo) / nube y SSH: no replicable | ✅ |
| Entornos guardados | Receta guardada: carpetas, variables, worktree por defecto | Servidor (DB) | shadcn Form | P2 | ✅ |
| Carpeta de proyecto + agregar carpetas | Elegir carpeta; con la sesión andando, «+ Añadir carpeta» | Servidor (`cwd`, `additionalDirectories`) | Selector de ruta propio sobre árbol del servidor | P0 / añadir carpeta P1 | ✅ |
| Worktree por sesión | Interruptor que corre la sesión en una copia aislada de git (`.claude/worktrees/`), con prefijo de rama, `.worktreeinclude` | Servidor (git) | Switch shadcn | P1 | ✅ |
| Archivar sesión | Oculta la sesión; avisa si el worktree tiene cambios sin guardar; opción de archivar al fusionar PR | Servidor | Menú Radix + diálogo | P1 | ✅ |
| Agrupar, ordenar, filtrar, renombrar | Agrupa por proyecto/estado, pestaña «Archivadas», renombrar desde el título | Interfaz + Servidor | shadcn DropdownMenu | P1 | ✅ |
| Vista dividida | Dos sesiones lado a lado o en ventana aparte | Interfaz | `react-resizable-panels` | P2 | ✅ |
| Paneles reorganizables | Chat, diff, navegador, terminal, archivos, plan, tareas, subagente; se arrastran, se redimensionan, se sacan a ventana, se minimizan | Interfaz | `dockview` o `react-resizable-panels` | P1 (P0: chat + diff + terminal + archivos fijos) | ✅ |
| Panel de detalles de sesión («rail») | Tarjetas: dónde corre, qué cambió (+líneas/−líneas), qué corre, uso de contexto | SDK (`result`, uso) + Servidor | shadcn Card | P1 | ✅ |
| Modos de vista de la transcripción (Ctrl+O) | Normal (herramientas plegadas), Pensamiento, Detallado | Interfaz (filtra mensajes SDK) | AI Elements (Reasoning, Tool) | P1 | ✅ |
| Atajos de teclado (Cmd+/ lista) | Nueva sesión, cambiar, diff, navegador, terminal, chat lateral, menús de modo/modelo/esfuerzo | Interfaz | `react-hotkeys-hook` + `cmdk` | P1 | ✅ |
| Sesiones desde Dispatch (celular) | Enviar tarea desde el teléfono a la sesión del escritorio | No replicable (cuenta de Anthropic) | — (Code OS tendrá su versión móvil/web propia) | P2 | ✅ |
| Continuar en otra superficie / nube / Remote Control | Pasar la sesión a nube, web o móvil | No replicable | — | fuera | ✅ |
| Mostrar/ocultar de otros dispositivos | Controla qué sesiones se sincronizan | No replicable | — | fuera | ✅ |

### A2. Caja de texto y contexto

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Caja de prompt | Enter envía; mientras Claude trabaja, escribir y Enter envía una corrección sin detener; botón de parar interrumpe | SDK (entrada en streaming, `interrupt()`) | AI Elements (Prompt Input) | P0 | ✅ |
| @mencionar archivos | Escribir `@` autocompleta archivos de la carpeta y los añade al contexto | Servidor (listar) + Interfaz | `cmdk` / Combobox | P0 | ✅ |
| Adjuntar imágenes y PDF (+, arrastrar) | Sube capturas, mockups y documentos al mensaje | SDK (bloques de imagen/documento) + Servidor (guardar) | Dropzone + AI Elements Attachments | P0 imágenes / P1 PDF | ✅ (adjuntos); ❓ que el modelo en LiteLLM acepte PDF/imagen |
| Botón «+» | Menú único: archivos, habilidades (skills), conectores, plugins, carpetas | Interfaz | shadcn DropdownMenu | P1 | ✅ |
| Sugerencia de siguiente prompt | Texto gris en la caja vacía tras la respuesta; Tab lo acepta (cuesta una llamada extra al modelo) | SDK (`promptSuggestions`, si el SDK lo expone) | Input con ghost text | P2 | ✅ (función) / ❓ (opción exacta del SDK) |
| Comandos con `/` | Lista de comandos integrados, de skills y personalizados | SDK (`supportedCommands()`, init) | `cmdk` | P0 | ✅ |
| `/compact`, `/context`, `/btw`, `/code-review` | Resumir contexto, desglose por categorías, pregunta lateral, revisión | SDK (comando) | Tarjetas propias | P1 | ✅ |
| Chat lateral (Cmd+;) | Pregunta que usa el contexto sin alterar la sesión; no se guarda | SDK (fork de sesión) | Drawer/Sheet shadcn | P2 | ✅ |
| Voz / dictado en el prompt | Dictado a texto en Code | Interfaz (Web Speech o Whisper en servidor) | `MediaRecorder` + Whisper | P2 | ✅ (existe) |

### A3. Permisos y modos

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Selector de modo | Manual (`default`), Aceptar ediciones (`acceptEdits`), Plan (`plan`), Auto (`auto`), Saltar permisos (`bypassPermissions`); cambia durante la sesión (Cmd+Shift+M) | SDK (`permissionMode`, `setPermissionMode()`) | shadcn Select | P0 | ✅ |
| Modo Auto | Un clasificador de fondo revisa cada acción; requiere modelos concretos de Anthropic | SDK, pero **depende del clasificador de Anthropic** | — | No replicable con modelos open-weight (❓ no probado) | ✅ |
| Saltar permisos | Sin avisos salvo acciones que ningún modo aprueba; en la app hay que activarlo en Ajustes | SDK + Interfaz (ajuste) | Interruptor con confirmación | P1 (solo admin) | ✅ |
| Tarjeta de aprobación de herramienta | Pide permiso con el diff o el comando; permitir una vez / siempre / negar; reglas editables | SDK (`canUseTool`, `PermissionRequest`) | AI Elements (Confirmation) | P0 | ✅ |
| Preguntas aclaratorias | Claude hace una pregunta con opciones (herramienta `AskUserQuestion`); respuesta libre posible | SDK (`canUseTool` con esa herramienta) | Tarjeta con radio/checkbox | P0 | ✅ |
| Reglas de permisos y ajustes | `settings.json` con permitir/negar; `/permissions` abre panel solo en terminal (en la app responde «no disponible») | SDK (`settingSources`, `permissions`) + Servidor | Editor de reglas propio | P1 | ✅ |
| Plan mode | Claude explora, propone plan sin editar; al aprobar, pasa a otro modo | SDK (`ExitPlanMode` vía `canUseTool`) | Panel «Plan» con Markdown + botones Aprobar/Rechazar | P0 | ✅ |

### A4. Agente: herramientas, subagentes, skills, hooks, MCP

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Streaming de texto | Palabras en vivo | SDK (`stream_event`: `content_block_delta`) | AI Elements (Message/Response), `react-markdown`+Shiki | P0 | ✅ |
| Pensamiento («thinking») | Bloques de razonamiento visibles según modo de vista; esfuerzo configurable | SDK (bloques `thinking`) | AI Elements (Reasoning) | P1 | ✅ (modelos open-weight: ❓ si emiten el bloque) |
| Tarjetas de herramientas | Cada llamada (Read, Edit, Bash, Grep…) con entrada, estado y salida; plegadas por defecto | SDK (`tool_use`, `tool_result`, `parent_tool_use_id`) | AI Elements (Tool, Code Block) | P0 | ✅ |
| Lista de tareas (todos) | Claude crea una lista y la va marcando | SDK (herramienta `TodoWrite`; ❓ nombre en la versión más nueva) | AI Elements (Task/Queue) + panel Tareas | P1 | ✅ |
| Subagentes | Claude delega en agentes con su propio contexto; panel de subagente muestra su salida | SDK (herramienta `Task`/`Agent`, `parent_tool_use_id`); **sin deltas token a token** de subagentes | Panel secundario | P1 | ✅ |
| Tareas en segundo plano | Panel de subagentes, comandos en background, flujos dinámicos; ver salida o detener | SDK (eventos de tareas) + Servidor (procesos) | shadcn Sheet | P1 | ✅ |
| Flujos dinámicos (workflows) | Varios agentes dentro de una sesión | SDK | — | P2 | 🟡 (solo mención) |
| Equipos de agentes | Líder + compañeros con lista compartida; **no existe en la app**, solo CLI | No replicable en UI de escritorio | — | fuera | ✅ |
| Skills | Carpetas `.claude/skills/` que Claude carga solo o por `/nombre`; menú «+» | SDK (`settingSources`) + Servidor (carpetas) | Lista + visor Markdown | P1 | ✅ |
| Hooks | Scripts en eventos (PreToolUse, PostToolUse, etc.) por `settings.json` | SDK (hooks) + Servidor | Editor JSON (CodeMirror) | P1 | ✅ |
| Slash commands propios | Archivos en `.claude/commands/` | SDK | `cmdk` | P1 | ✅ |
| Plugins | Gestor con UI: instalar y activar paquetes (comandos, skills, hooks, agentes) | SDK (`plugins`) + Servidor | Lista de tarjetas | P2 | ✅ |
| Modos «mods» de interfaz | Plugins que añaden paneles/barras a la app | No replicable (API de la app) | — | fuera | 🟡 |
| MCP / Conectores | Conectar GitHub, Slack, Linear, etc. con una UI de «Conectores» (local y SSH) o `.mcp.json` | SDK (`mcpServers`, estado en init) + Servidor (OAuth, procesos) | Lista + formulario | P1 | ✅ |
| Memoria del proyecto (CLAUDE.md, reglas) | Instrucciones persistentes por carpeta/usuario | SDK (`settingSources`) | Editor Markdown | P0 (que cargue) | ✅ |
| Estilos de salida | Cambia el tono/rol del asistente | SDK (`outputStyle`) | Select | P2 | ✅ |
| Checkpoints y rebobinar | Revertir archivos a un punto anterior (no deshace comandos de shell) | SDK (`enableFileCheckpointing`, `rewindFiles()`) | Botón en cada mensaje | P1 | ✅ |
| Compactación automática | Resume el contexto cuando se llena; mensaje de límite | SDK (`compact_boundary`) | Separador en la transcripción | P1 | ✅ |
| Modelos y esfuerzo | Selector de modelo (Cmd+Shift+I) y de esfuerzo (Cmd+Shift+E); modo rápido | SDK (`model`, `setModel()`; esfuerzo ❓) | shadcn Select; lista fija desde LiteLLM | P0 | ✅ (selector) / ❓ (esfuerzo con modelos no-Anthropic) |
| Uso y contexto | Anillo de contexto, uso del plan, costo | SDK (`result.usage`, `total_cost_usd`) + Servidor (LiteLLM) | Progress + Popover | P1 | ✅ |
| Seguir sesión de otras sesiones | Claude lista, lee y escribe a otras sesiones de la app | SDK + herramientas propias de la app | — | P2 | ✅ |
| Tareas sugeridas | Claude propone tareas fuera de alcance; botones Iniciar / Hacerlo aquí / Iniciar todas | SDK (herramienta propia de la app) | Tarjeta | P2 | ✅ |

### A5. Revisar, ejecutar y entregar

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Vista de diff | Cambios por archivo; comentarios por línea (+) enviados en lote (Cmd+Enter) para que Claude los atienda | Servidor (`git diff`) + SDK (mensaje con comentarios) | `@git-diff-view/react` o `react-diff-view` | P0 | ✅ |
| Revisión de código `/code-review` | Tarjeta con hallazgos por archivo, «Recorrer en el diff», «Arreglar este», «Aplicar arreglos» | SDK (skill) + Interfaz | Tarjeta + el diff | P2 | ✅ |
| Terminal integrada | Pestañas, misma carpeta y entorno que Claude; abrir desde carpeta | Servidor (`node-pty`) + Interfaz | **xterm.js** (+ addon fit/webgl) | P0 | ✅ |
| Panel de archivos | Abrir ruta del chat, editar con guardado automático; avisa si cambió en disco | Servidor (fs) | **CodeMirror 6** | P0 lectura / P1 edición | ✅ |
| Menú contextual de archivo | Adjuntar como contexto, abrir en editor, copiar ruta | Interfaz | Radix ContextMenu | P2 | ✅ |
| Vista previa de la app (navegador) | Claude arranca el servidor de desarrollo, lo abre en un panel, toma capturas, hace clic, rellena formularios | SDK (herramientas de navegador, MCP) + Servidor (procesos, `launch.json`) | `<iframe>` + proxy; Playwright MCP en el servidor | P1 | ✅ |
| Auto-verificar tras cada edición | Claude prueba solo lo que cambió | SDK (prompt/instrucción) | — | P2 | ✅ |
| Navegar sitios externos / seguridad | Lista de sitios permitidos, tarjeta Permitir una vez/Siempre/Negar | SDK + Servidor | — | P2 | ✅ |
| Simulador de iOS, uso del ordenador | Control de pantalla y apps | No replicable (macOS local) | — | fuera | ✅ |
| Crear PR | Empuja rama y abre PR con `gh` | Servidor (`git`, `gh`) | Botón + tarjeta | P1 | ✅ |
| Estado de PR y CI | Tarjeta con checks; **Auto-fix** (arregla CI y comentarios), **Merge when ready** | Servidor (`gh`, GraphQL de GitHub) + SDK | Tarjeta + polling | P1 | ✅ |
| Notificaciones | Aviso del sistema cuando una sesión termina y no la miras | Interfaz (Notification API / web push) | Web Push | P1 | ✅ |
| Tareas programadas | Tareas recurrentes (cron) en Code | Servidor (cron) | Formulario cron | P2 | ✅ |
| Nube y rutinas (routines) | Sesiones en infraestructura de Anthropic | No replicable | — | fuera | ✅ |

---

## B. Chat (pestaña de conversación)

Nota: esta pestaña **no usa Claude Code**; es el producto claude.ai. Casi todo depende de servicios de Anthropic. Para Code OS, «Chat» sería un chat normal sobre LiteLLM; abajo se marca qué se puede replicar y con qué.

| Función | Qué hace | Origen | Pieza sugerida | Prio | Verif. |
|---|---|---|---|---|---|
| Conversación con streaming y Markdown | Mensajes, bloques de código, tablas, citas | Servidor (LiteLLM, SSE) o SDK | AI Elements, `react-markdown` + Shiki | P0 | ✅ |
| Historial y nuevo chat | Lista de chats, buscar, borrar | Servidor (DB) | shadcn Sidebar | P0 | ✅ |
| Editar un mensaje anterior | Crea una rama separada de la conversación con sus propios artefactos | Servidor (árbol de mensajes) | Estado propio | P2 | ✅ |
| Adjuntar archivos | CSV, TSV, imágenes, PDF, hasta 30 MB por archivo | Servidor (guardar) + modelo | Dropzone, AI Elements Attachments | P0 | ✅ |
| Artefactos | Documentos, código, páginas web, diagramas, tableros, herramientas pequeñas; panel a la derecha; edición directa en documentos; «Editar con Claude» sobre texto marcado; «intentar arreglar» ante errores | SDK/servidor (archivo generado) + Interfaz (visor) | AI Elements (Artifact), iframe `sandbox`, Sandpack | P0 (Markdown, HTML, código) | ✅ |
| Plantillas de artefacto (Documentos, Presentaciones, Diseño, Tableros, Movimiento) | Editores especializados; exportan a Word, PDF, PowerPoint, HTML, ZIP, MP4 | **No replicable** como tal | pptxgenjs / docx / Puppeteer en servidor | P2 | ✅ |
| Artefactos con IA y conectores | El artefacto llama a Claude o a conectores con los permisos del usuario | No replicable (usa cuota del usuario en Anthropic); se puede rehacer vía LiteLLM | — | P2 | ✅ |
| Almacenamiento de artefactos | Privado o compartido, solo texto, 20 MB | Servidor (DB) | — | P2 | ✅ |
| Publicar/compartir artefactos | Enlace con permisos | Servidor | Enlace firmado | P1 | 🟡 (los artefactos legacy ya no se crean desde 16-sep-2026) |
| Proyectos | Espacio con instrucciones propias y base de conocimiento (archivos), chats dentro; RAG automático en planes de pago; compartir con permisos «ver/editar» en equipos | Servidor (DB + vectores) | shadcn + pgvector | P1 | ✅ |
| Memoria | Guarda temas durante el chat; «recuerda esto»; ver/editar/borrar; pausar; reiniciar; exportar/importar; memoria por proyecto aislable | Servidor (DB) + SDK-like (herramienta) | Tabla `memorias` + UI de edición | P1 | ✅ |
| Búsqueda en chats | Claude busca conversaciones pasadas (alcance: fuera de proyectos o dentro de uno); cita con enlace | Servidor (herramienta propia sobre la DB) | Herramienta MCP interna | P2 | ✅ |
| Incógnito | Chat que no entra al historial, a la memoria ni a la búsqueda (ícono de fantasma) | Interfaz + Servidor (no guardar) | Interruptor | P1 | ✅ |
| Estilos | Preajustes y estilos personalizados de tono y formato | Servidor (prompt de sistema) | Select + editor | P2 | ❓ (la página oficial consultada no existía; función conocida, no leída hoy) |
| Voz | Modo voz bidireccional (manos libres o «pulsar para hablar»), voces predefinidas, audio no se guarda, transcripción queda en el historial; **dictado** aparte | Interfaz + Servidor (STT/TTS) | Whisper + un TTS abierto, VAD en navegador | P2 | ✅ (voz en Chat; en Code solo dictado) |
| Búsqueda web | Consulta a internet con citas | Servidor (herramienta) | SearXNG / Tavily vía MCP | P1 | ❓ (función conocida; página oficial no leída hoy) |
| Investigación (Research) | Búsqueda larga multi-paso con informe | Servidor (agente) | Agente propio | P2 | ❓ |
| Pensamiento extendido | Interruptor de razonamiento largo | Modelo | Switch | P2 | ❓ |
| Conectores (MCP remoto) | Conectores del directorio y personalizados; autenticación «ahora / cuando haga falta / ninguna»; menú «Búsqueda y herramientas» para apagar herramientas; «Permitir siempre» | Servidor (cliente MCP) | Lista + OAuth | P1 | ✅ |
| Apps interactivas (MCP UI) | Conectores dibujan tarjetas o pantallas completas dentro del chat | Interfaz | iframe `sandbox` con protocolo MCP UI | P2 | ✅ |
| Extensiones de escritorio y MCP local | Servidores locales en `claude_desktop_config.json` | No replicable (es de la app instalada) | — | fuera | ✅ |
| Creación de archivos | Claude ejecuta código en un contenedor aislado y entrega `.xlsx`, `.pptx`, `.docx`, `.pdf`, `.csv`, `.md`, `.html`, PNG; se descargan o se guardan en Drive; límite 30 MB | Servidor (sandbox de código) | Contenedor aislado por usuario (gVisor/Firecracker/Docker), enlaces de descarga firmados | P0 (entrega por descarga) | ✅ |
| Compartir chat | Enlace de solo lectura de una conversación | Servidor | Ruta pública con token | P2 | ❓ (página oficial no leída) |
| Cowork / Dispatch / Proyectos con memoria nueva | Tareas largas con archivos locales; envío desde móvil | No replicable | — | fuera | 🟡 |

---

## C. Qué viaja realmente del motor a la pantalla (resumen técnico)

El motor es Claude Code oficial; la interfaz solo habla con él por el Agent SDK. Lo que la pantalla debe entender:

1. **`system` (init)**: modelo, herramientas, comandos `/`, servidores MCP, modo de permisos, `session_id`.
2. **`stream_event`**: deltas de texto, de pensamiento y de entrada de herramientas (con `includePartialMessages`). Solo de la sesión principal; los subagentes llegan como mensajes completos.
3. **`assistant`**: un mensaje por cada bloque terminado (texto, `tool_use`). Lleva `parent_tool_use_id` para agrupar bajo un subagente.
4. **`user`** con `tool_result`: la salida de cada herramienta.
5. **`system` compact_boundary**: cuando se resumió el contexto.
6. **`result`**: fin del turno, costo, duración, uso de tokens, errores.
7. **Entradas hacia el motor**: mensajes de usuario (con imágenes), `interrupt()`, `setPermissionMode()`, `setModel()`, respuesta a `canUseTool` (permitir/negar/editar entrada; `AskUserQuestion`; `ExitPlanMode`), `rewindFiles()`.
8. **Hooks y `settingSources`**: leen `.claude/` del VPS; no son eventos de pantalla, pero la interfaz edita esos archivos.

Observación sobre LiteLLM: Claude Code habla el protocolo de mensajes de Anthropic. Un gateway que lo traduzca a modelos open-weight puede perder: herramientas en paralelo, bloques de pensamiento, caché de contexto, imágenes/PDF, y clasificador del modo Auto. **No probado aquí** (la sesión hermana `puente-sdk` es la indicada para verificarlo).

Observación sobre el gateway oficial: Anthropic documenta un «Claude apps gateway» (viene dentro del binario `claude`, con inicio de sesión corporativo por SSO) pensado para Bedrock, Google Cloud y Foundry. No es un reemplazo de LiteLLM para modelos abiertos; solo se anota por si sirve de referencia para login y límites de gasto.

---

## D. Propuesta de recorte para la primera versión (P0)

**Code**: sesiones en barra lateral · caja de prompt con `@` y `/` · imágenes adjuntas · streaming de texto y tarjetas de herramientas · aprobación de permisos y preguntas aclaratorias · selector de modo (Manual, Aceptar ediciones, Plan) · panel de plan · selector de modelo · diff · terminal (xterm.js) · panel de archivos (lectura) · CLAUDE.md cargado.

**Chat**: conversación con Markdown · historial · adjuntos · artefactos (Markdown, HTML, código) en panel lateral · entrega de archivos por descarga.

**Después (P1)**: worktrees, PR/CI, tareas y subagentes en panel, skills/hooks/MCP editables, checkpoints, proyectos y memoria, incógnito, notificaciones, búsqueda web.

---

## E. Lo que NO pude verificar (claro y sin rodeos)

- **La app real no se abrió ni se capturó.** Solo confirmé la versión instalada (4.23118.1) leyendo el archivo de la app. La sesión actual corre dentro de esa misma app y manejar su pantalla era circular y arriesgado. Por eso **nada de «cómo se ve» está comprobado visualmente**; todo viene de la documentación escrita. La app puede tener cambios más nuevos que la documentación.
- **Pestaña Chat**: leí hoy artefactos, proyectos, memoria/búsqueda/incógnito, voz, creación de archivos y conectores en la ayuda oficial. **No leí**: estilos (la página consultada devolvió 404), compartir chats, búsqueda web, Research, pensamiento extendido, Cowork. Aparecen como ❓ o 🟡.
- **Nombres exactos del SDK**: los de la tabla C salen de la documentación leída, pero no ejecuté el SDK. Dudas puntuales: nombre actual de la herramienta de tareas (`TodoWrite`), opción de sugerencias de prompt, forma de fijar el esfuerzo.
- **Funciones con modelos que no son de Anthropic** (pensamiento, imágenes/PDF, modo Auto, herramientas en paralelo, esfuerzo): no se probaron.
- **AI Elements → shadcn/ui a fin de noviembre 2026**: viene del encargo; no lo comprobé. Ninguna librería sugerida fue instalada ni probada; son candidatas.
- **Planes y cuotas** (qué función sale en Free/Pro/Team): no se recoge a propósito; no aplica a Code OS.
- No se leyó el registro de cambios ni las páginas «what's new» (existen en `code.claude.com/docs/en/whats-new/` y `changelog.md`); el inventario puede omitir funciones muy recientes.

## F. Fuentes

- Documentación oficial de Claude Code: `desktop.md`, `permission-modes.md`, `agent-sdk/streaming-output.md`, `agent-sdk/user-input.md`, `agent-sdk/file-checkpointing.md`, `agent-sdk/claude-code-features.md`, `claude-apps-gateway.md` (índice: `https://code.claude.com/docs/llms.txt`).
- Centro de ayuda de Claude (support.claude.com): artefactos, proyectos, búsqueda y memoria, voz, creación de archivos, conectores personalizados.
