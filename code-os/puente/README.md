# Puente · Code OS

Servicio Node/TypeScript que pone el **Claude Agent SDK** (el arnés de Claude Code) detrás de una API HTTP + SSE para la interfaz de Code OS. El modelo sale por el **Gateway (LiteLLM)**: sin suscripción de Anthropic, solo llaves de API/proxy.

```
interfaz ──HTTP+SSE──▶ puente ──SDK──▶ claude (arnés) ──▶ LiteLLM :4000 ──▶ cp-glm-5.3 · cp-kimi-k3 · …
```

## Arranque

```bash
cd code-os/puente && npm i && npm test      # sin red ni modelos reales (las pruebas reales de bwrap se omiten si no hay bwrap)
npm run build && PUENTE_USERS_FILE=… npm start
```

El puente **no tiene llaves propias**: lee `users.json` (modo 600) con una entrada por persona. La crea el asistente (`code-os/asistente`): `asistente.sh usuario <id>` genera la **llave virtual de LiteLLM** de esa persona (con tope en USD, niveles y modelos limitados) y su **token del puente** (se muestra una vez; en el archivo solo queda su sha256).

| Variable | Para qué | Por defecto |
|---|---|---|
| `PUENTE_USERS_FILE` | Usuarios (token hash + llave virtual + niveles). Se rechaza si no es 600 | `<data>/users.json` |
| `PUENTE_HOST` / `PUENTE_PORT` | **Solo loopback** (`127.0.0.1`/`::1`); otro valor aborta el arranque | `127.0.0.1` / `4300` |
| `LITELLM_URL` | Gateway | `http://127.0.0.1:4000` |
| `PUENTE_DEFAULT_MODEL` | Nivel por defecto | `nivel-medio` |
| `PUENTE_CLAUDE_MODEL` | Alias de Claude cuando el nivel alto corre con la suscripción | `opus` |
| `PUENTE_CLAUDE_PATH` | Cliente `claude` (login y arnés). Vacío = el del PATH / el del SDK | — |
| `PUENTE_CONFINE` | `auto` (bwrap si funciona) · `bwrap` (obligatorio) · `none` | `auto` |
| `PUENTE_REQUIRE_CONFINE` | `1`: sin confinamiento, Code y Plan se rechazan con 503 (Chat sigue) | `1` |
| `CUOTAS_URL` / `CUOTAS_TOKEN` | Medidor de cuotas (lectura de `/cuotas`; registro de `claude_login`) | `http://127.0.0.1:4200` |
| `PUENTE_UI_DIR` / `PUENTE_FLAG_FILE` | Compilación de la interfaz que se sirve sin token; si hay flag, solo mientras exista el archivo (lo crea el asistente) | — |
| `PUENTE_DATA_DIR` / `PUENTE_WORKSPACES_DIR` | Datos / proyectos: `<workspaces>/<usuario>/<proyecto>` | `./data` / `<data>/workspaces` |
| `PUENTE_MAX_CONCURRENT` · `PUENTE_MAX_TURNS` | Turnos simultáneos · turnos del agente por mensaje | `3` · `30` |
| `PUENTE_TURN_TIMEOUT_MS` · `PUENTE_PERMISSION_TIMEOUT_MS` | Tope por turno · espera de un permiso | 10 min · 5 min |
| `PUENTE_MCP_CONFIG` | JSON `{ "mcpServers": {…} }` con el catálogo de MCP del servidor | — |

`LITELLM_MASTER_KEY` / `LITELLM_KEY` en el entorno del puente **abortan el arranque**: el puente nunca debe ver la master.

## API

Todas llevan `Authorization: Bearer <token de la persona>`. Sin token solo responden `GET /health` (vivo) y la interfaz estática.

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | `{ok}`; con token válido añade `claude:{activa, instalada}` de esa persona |
| `GET /me[?refresh=1]` | `{user, levels, modelPrefixes, defaultModel, claude:{installed, active, hint}, confinamiento:{activo, modo, code}}`. `claude.active` = su `claude` está logueado en el servidor; `hint` dice qué correr si no |
| `GET /cuotas` | Proxy de **solo lectura** al medidor (`/cuotas` en 127.0.0.1:4200). 503 si no responde |
| `GET /models` | Niveles y alias que **esa persona** puede usar (vía su llave virtual) + el por defecto |
| `POST /sessions` `{projectId, model?, mode?, title?, systemPrompt?, agents?, mcp?}` | Crea sesión. Carpeta: `<workspaces>/<usuario>/<projectId>`. 403 si el modelo/nivel no es suyo; 503 si pide Code/Plan sin confinamiento |
| `GET /sessions?projectId=` · `GET /sessions/:id` | Lista / detalle (solo las tuyas; las ajenas dan 404) |
| `PATCH /sessions/:id` `{model?, mode?, title?}` | Cambia modelo o modo entre turnos (409 si hay turno en curso) |
| `POST /sessions/:id/messages` `{text}` | Lanza un turno → `202 {turnId}`. 409 si ya hay uno; 429 si el servidor está lleno |
| `GET /sessions/:id/events` | **SSE**. Reconecta con `Last-Event-ID` (o `?after=`); guarda los últimos 2000 eventos |
| `POST /sessions/:id/permissions/:requestId` `{decision, message?, updatedInput?}` | `allow` · `deny` · `allow_all` |
| `POST /sessions/:id/interrupt` · `DELETE /sessions/:id` | Interrumpe el turno / cierra la sesión viva |
| `GET /sessions/:id/files` | `{archivos: NodoArchivo[]}` (sin `.git`, `node_modules`, …; máx. 2000 nodos) |
| `GET /sessions/:id/files/<ruta>` · `PUT …` `{contenido}` | Leer (≤1 MB, texto) / escribir (≤2 MB). `ruta` URL-encoded. 403 si sale de la carpeta (`..`, absoluta, symlink que escapa, `.git`) |
| `GET/PUT /sessions/:id/files?path=<ruta>` | Igual que la forma con ruta en el path, pero con `?path=` |
| `GET /mcp` · `GET /skills` | Catálogo MCP del servidor `[{nombre, descripcion, estado}]` · skills de `PUENTE_SKILLS_DIR` (`<nombre>/SKILL.md`) `[{nombre, descripcion, contenido}]` |
| `GET /sessions/:id/history[?after=]` | Eventos en memoria de la sesión (últimos 2000) |
| `POST …/messages` con `queue:true` | Si hay turno en curso, encola el mensaje (`202 {turnId, queued:true}`) en vez de 409; corre al terminar el turno |
| `GET /sessions/:id/diff` | `{archivos: [{ruta, anterior?, nuevo?, diff, mas, menos}]}` contra la foto inicial de la sesión (git endurecido: sin hooks, fsmonitor ni programas externos) |

**Reanudar**: las sesiones se guardan en disco; tras reiniciar el puente basta usar el mismo `id` y se retoma la conversación (`resume` del SDK).

**Modos**: `chat` = sin herramientas · `plan` = solo lectura, el agente propone un plan y `ExitPlanMode` llega como permiso (al aprobar, la sesión pasa a `code`) · `code` = herramientas con permiso desde la interfaz.

**Eventos SSE** (`event:` = `type`, `data:` = JSON con `seq` y `ts`): `user_message` · `turn_start` (`model` = lo que corre de verdad, `requestedModel` = lo que pidió la persona, `via` = `claude_login` | `litellm`) · `route_fallback` (`from`, `to`, `reason`: la suscripción llegó a su límite y el turno se rehízo por LiteLLM) · `text_delta` · `thinking_delta` · `assistant_message` · `tool_call` · `tool_result` · `permission_request` · `permission_resolved` · `usage` · `mode_changed` · `turn_end` (`ok`, `reason`, `turns`, `durationMs`, `usage`, `result`) · `error`. Los eventos de subagentes traen `parentToolUseId`. El costo en USD que reporta el SDK **no se expone**: asume precios de Anthropic y con LiteLLM no significa nada.

## Seguridad

- **Quién entra**: un token por persona (comparación de sha256 en tiempo constante). Cada sesión pertenece a su dueño: las ajenas dan 404. Escucha solo en loopback; el acceso remoto es por Tailscale (ver `docs/despliegue-code-os.md`).
- **Llaves**: cada persona tiene su **llave virtual de LiteLLM** (tope en USD por periodo, niveles y modelos limitados, respaldos incluidos). Es la única que recibe el arnés. El puente nunca tiene la master: aborta si la ve en su entorno y, al arrancar, comprueba que ninguna llave de usuario pueda llamar a rutas de administrador de LiteLLM.
- **Confinamiento (bubblewrap)**: el arnés entero corre dentro de `bwrap` (`spawnClaudeCodeProcess`): raíz vacía, `/usr` de solo lectura, `/tmp` privado, y solo **dos carpetas escribibles**: el proyecto de esa sesión y el HOME de la persona. No existen para el proceso `/home/deploy`, el `.env` de LiteLLM, otros proyectos ni otros usuarios; el entorno va limpio (`--clearenv`). Esto cubre Bash **y** Read/Write/Edit. Se conserva la red del host (el arnés necesita LiteLLM en 127.0.0.1). Sin `bwrap` funcional, **Code y Plan se rechazan** (Chat no usa herramientas).
- **Guarda de rutas** de respaldo: Read/Write/Edit/Glob/Grep fuera del proyecto (incluidos symlinks) se rechazan sin preguntar, aun con «sí a todo».
- **Modo suscripción**: si la persona tiene su `claude` logueado (cada quien con su cuenta, en su HOME propio), `nivel-alto` corre con esa sesión y el arnés no recibe ninguna llave; el medidor lo cuenta como `claude_login`. Si no hay sesión, o llega al límite antes de empezar, cae a `nivel-alto` de LiteLLM (Cline Pass top). El puente solo pregunta `claude auth status`: nunca lee el token.
- ⚠️ Límite conocido: el login de Claude de la persona vive en su HOME, que el arnés puede leer dentro de su propio jaula (es el mismo acceso que tiene Claude Code en cualquier máquina). No se comparte entre usuarios.
- **Interfaz estática**: se sirve sin token (hace falta para cargar la pantalla de entrada); la protege la red (Tailscale), no el puente.

## Pruebas

`npm test` → `test/puente.test.ts` (flujo del puente con un «modelo falso»), `test/seguridad.test.ts` (auth por usuario, master key, niveles, confinamiento, suscripción/respaldo, `/me`, `/cuotas`, archivos, diff, interfaz) y `test/integracion.test.ts` (el **binario real** de Claude Code contra un «Anthropic» falso). Las 3 pruebas de **escape real con bwrap** se omiten donde bwrap no funciona; en el VPS se corrieron en un contenedor (`docker run --cap-add SYS_ADMIN --security-opt seccomp=unconfined --security-opt apparmor=unconfined node:22-bookworm`, instalando `bubblewrap`).

Contra modelos reales (necesita un puente arriba): `PUENTE_URL=… PUENTE_TOKEN=… node scripts/e2e-real.mjs nivel-medio code|chat|plan`.
