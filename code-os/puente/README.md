# Puente · Code OS

Servicio Node/TypeScript que pone el **Claude Agent SDK** (el arnés de Claude Code) detrás de una API HTTP + SSE para la interfaz de Code OS. El modelo sale por el **Gateway (LiteLLM)**: sin suscripción de Anthropic, solo llaves de API/proxy.

```
interfaz ──HTTP+SSE──▶ puente ──SDK──▶ claude (arnés) ──▶ LiteLLM :4000 ──▶ cp-glm-5.3 · cp-kimi-k3 · …
```

## Arranque

```bash
cd code-os/puente && npm i && npm test      # 15 pruebas, sin red ni modelos reales
npm run build && PUENTE_TOKENS=… LITELLM_KEY=… npm start
```

| Variable | Para qué | Por defecto |
|---|---|---|
| `PUENTE_TOKENS` | Tokens de la plataforma (coma-separados, ≥24 caracteres). **Obligatoria** | — |
| `LITELLM_KEY` | Llave para listar modelos. **Obligatoria** | — |
| `LITELLM_AGENT_KEY` | Llave que recibe el arnés. Usa una llave virtual limitada a `cp-*` | `LITELLM_KEY` |
| `LITELLM_URL` | Gateway | `http://127.0.0.1:4000` |
| `PUENTE_PORT` / `PUENTE_HOST` | Dónde escucha | `4200` / `127.0.0.1` |
| `PUENTE_DEFAULT_MODEL` | Alias por defecto | `cp-glm-5.3` |
| `PUENTE_MODEL_ALLOW` | Prefijos de alias permitidos (p. ej. `cp-`) | todos los de LiteLLM |
| `PUENTE_DATA_DIR` / `PUENTE_WORKSPACES_DIR` | Datos del puente / carpetas de proyectos | `./data` / `<data>/workspaces` |
| `PUENTE_MAX_CONCURRENT` · `PUENTE_MAX_TURNS` | Turnos simultáneos · turnos del agente por mensaje | `3` · `30` |
| `PUENTE_TURN_TIMEOUT_MS` · `PUENTE_PERMISSION_TIMEOUT_MS` | Tope por turno · espera de un permiso | 10 min · 5 min |
| `PUENTE_MCP_CONFIG` | JSON `{ "mcpServers": {…} }` con el catálogo de MCP del servidor | — |
| `PUENTE_ENV_SCRUB` | `1`/`0`; por defecto se activa solo si hay `bwrap` (Linux) | auto |
| `PUENTE_SANDBOX=1` | Sandbox de Bash del SDK (necesita `bwrap`) | apagado |

## API

Todas llevan `Authorization: Bearer <token>` salvo `GET /health`.

| Método y ruta | Qué hace |
|---|---|
| `GET /models` | Alias vigentes leídos de LiteLLM (`/v1/models`) + el por defecto |
| `POST /sessions` `{projectId, model?, mode?, title?, systemPrompt?, agents?, mcp?}` | Crea sesión. Carpeta aislada: `<workspaces>/<projectId>` |
| `GET /sessions?projectId=` · `GET /sessions/:id` | Lista / detalle (totales de tokens, `running`, permisos pendientes) |
| `PATCH /sessions/:id` `{model?, mode?, title?}` | Cambia modelo o modo entre turnos (409 si hay turno en curso) |
| `POST /sessions/:id/messages` `{text}` | Lanza un turno → `202 {turnId}`. 409 si ya hay uno; 429 si el servidor está lleno |
| `GET /sessions/:id/events` | **SSE**. Reconecta con `Last-Event-ID` (o `?after=`); guarda los últimos 2000 eventos |
| `POST /sessions/:id/permissions/:requestId` `{decision, message?, updatedInput?}` | `allow` · `deny` · `allow_all` (sí a todo en esta sesión) |
| `POST /sessions/:id/interrupt` · `DELETE /sessions/:id` | Interrumpe el turno / cierra la sesión viva |

**Reanudar**: las sesiones se guardan en disco; tras reiniciar el puente basta usar el mismo `id` y se retoma la conversación (`resume` del SDK).

**Modos**: `chat` = sin herramientas · `plan` = solo lectura, el agente propone un plan y `ExitPlanMode` llega como permiso (al aprobar, la sesión pasa a `code`) · `code` = herramientas con permiso desde la interfaz.

**Eventos SSE** (`event:` = `type`, `data:` = JSON con `seq` y `ts`): `user_message` · `turn_start` · `text_delta` · `thinking_delta` · `assistant_message` · `tool_call` · `tool_result` · `permission_request` · `permission_resolved` · `usage` · `mode_changed` · `turn_end` (`ok`, `reason`, `turns`, `durationMs`, `usage`, `result`) · `error`. Los eventos de subagentes traen `parentToolUseId`. El costo en USD que reporta el SDK **no se expone**: asume precios de Anthropic y con LiteLLM no significa nada.

## Seguridad

- **Token**: comparación en tiempo constante; el token de la interfaz nunca llega al arnés. El cliente no puede mandar comandos de MCP: solo nombres del catálogo del servidor.
- **Aislamiento**: `cwd` por proyecto; `settingSources: []` (no lee CLAUDE.md ni ajustes del host); `HOME` y `CLAUDE_CONFIG_DIR` propios en `PUENTE_DATA_DIR`; el entorno del arnés es una lista blanca.
- **Guarda de rutas**: Read/Write/Edit/Glob/Grep/NotebookEdit fuera de la carpeta del proyecto (incluidos symlinks) se rechazan sin preguntar, ni siquiera con «sí a todo».
- ⚠️ **Bash no queda confinado a la carpeta** por la guarda; cada comando pasa por permiso (salvo «sí a todo»). Para aislamiento real hace falta `bwrap` + `PUENTE_SANDBOX=1`, o correr el puente como usuario sin privilegios.
- ⚠️ **Fuga de llave medida en el servidor**: sin `bwrap`, un `env` hecho por el modelo ve la llave de LiteLLM (`env | grep -c "LITELLM|ANTHROPIC|PUENTE"` dio 7). Con `bwrap` Claude Code la oculta a los subprocesos (`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`), y sin `bwrap` ni siquiera arranca si se fuerza a `1`. Por eso el puente autodetecta y existe `LITELLM_AGENT_KEY`.

## Pruebas

`npm test` → `test/puente.test.ts` (14, con un «modelo falso» inyectado en lugar del SDK: auth, modelos, proyectos, modos, turno completo, permisos sí/no/a todo, guarda de rutas, plan→code, reanudar, SSE con replay, concurrencia, errores, MCP/subagentes) y `test/integracion.test.ts` (el **binario real** de Claude Code contra un «Anthropic» falso que responde con un guion; verifica que Write solo ocurre si la interfaz aprueba). La segunda se omite si el binario del SDK no está instalado.

Prueba contra modelos reales (necesita un puente arriba): `PUENTE_URL=… PUENTE_TOKEN=… node scripts/e2e-real.mjs cp-glm-5.3 code|chat|plan`. `scripts/prueba-real.mjs` llama al SDK directo, sin puente.
