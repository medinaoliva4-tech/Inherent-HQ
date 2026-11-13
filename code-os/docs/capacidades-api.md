# Capacidades, planifica/ejecuta y catálogo de modelos · contrato del puente

Para la interfaz del OS (InherentChat). Todo lleva `Authorization: Bearer <token o pase>` como el resto de la API del puente (`code-os/puente/README.md`). Código: `code-os/puente/src/{capacidades,plan,catalogo-modelos,herramientas-mcp}.ts`.

## Idea

**Un solo chat.** La conversación es una sesión del puente; las capacidades son juegos de herramientas que se encienden y apagan **entre turnos** con `PATCH`. Es el mismo motor y la misma conversación del SDK (`resume`): pasar de chat a Figma no pierde contexto. Sin capacidades, el turno no tiene ninguna herramienta (chat puro).

| id | Qué activa | Pesada | Necesita jaula |
|---|---|---|---|
| `codigo` | Herramientas de archivos y Bash del arnés, dentro de bubblewrap | sí | sí |
| `figwright` | MCP `figwright` del catálogo (seguidor del Figwright de la Mac por túnel) | sí | sí |
| `imagen` | MCP `imagen` (`code-os/imagen/src/mcp.mjs`) con la llave virtual de la persona | sí | sí |
| `radar` | MCP `radar` del catálogo (aún no existe: queda `apagada`) | no | sí |
| `video` | MCP `video` del catálogo (`code-os/video/mcp.mjs`; si se agrega) | no | sí |
| `herramientas` | MCP **dentro del puente**: la API de nodos y calculadoras (`herramientas-api.md`), como la persona dueña | no | no |

Compatibilidad: una sesión **sin** el campo `capacidades` se comporta como antes (`mode` chat/plan/code + `mcp`).

## `GET /capacidades[?refresh=1]`

```json
{ "capacidades": [
  { "id": "figwright", "nombre": "Figma", "descripcion": "…", "pesada": true,
    "estado": "sin_conexion", "motivo": "Tu Mac debe estar encendida, con Figma abierto y el plugin Figwright activo (el túnel hacia el servidor no responde)" }
] }
```

`estado`: `lista` · `sin_conexion` (configurada pero no responde ahora) · `apagada` (no configurada o el servidor no puede correrla). Sondeo real, caché de 10 s por persona (`refresh=1` lo salta):

- `figwright`: `GET http://127.0.0.1:3055/ping` (el túnel). Sin respuesta → «Tu Mac debe estar encendida…». Responde con `plugins: 0` → «abre el plugin Figwright en Figma».
- `imagen`: ¿la llave virtual de la persona ve algún modelo `imagen-*` en LiteLLM?
- `video`/`radar`: entrada en el catálogo y, si trae `x-puente.sondeo`, que responda.
- `codigo` y todo lo que lanza procesos: `apagada` si el servidor no tiene bubblewrap y `PUENTE_REQUIRE_CONFINE=1`.

## Sesiones

`POST /sessions` acepta además:

```json
{ "projectId": "akai", "model": "nivel-alto", "mode": "chat",
  "capacidades": ["figwright", "imagen"],
  "plan_ejecucion": true }
```

`PATCH /sessions/:id` acepta `capacidades` (reemplaza la lista) y `plan_ejecucion` (`null` vuelve a automático), junto con `model`, `mode` y `title`. 409 si hay un turno en curso; 400 si un id no existe; 503 si piden capacidades que necesitan jaula y no hay bubblewrap; 403 si un modelo no es de la persona.

- `mode` sigue valiendo: con capacidades, `chat` y `code` corren igual (permisos desde la interfaz); `plan` es solo lectura y propone un plan.
- La sesión devuelve `capacidades`, `planEjecucion` y `figmaArchivo` (archivo fijado con `use_file`).
- En cada turno, las capacidades que no están `lista` **se omiten** y se le dice al modelo por qué (para que se lo explique a la persona).

`plan_ejecucion`: `true` · `false` · `{ "planifica"?: id, "ejecuta"?: id, "activo"?: boolean }`. Por defecto (sin el campo) se activa cuando hay una capacidad pesada **y** el modelo principal es de nivel alto (`nivel-alto`, `opus`, `cp-kimi-k3.1-pro`, `fr-*`).

## Eventos SSE nuevos o ampliados

| Evento | Campos nuevos |
|---|---|
| `turn_start` | `capacidades` (las que corren este turno), `capacidadesOmitidas: [{id, motivo}]`, `planner` (modelo real del principal), `executor` (modelo real del ejecutor, si se reparte), `planEjecucion: boolean`, `planMotivo` (por qué no se repartió, si se pidió) |
| `capacidades_changed` | `capacidades`, `planEjecucion` (tras un PATCH) |
| `figma_archivo` | `archivo` (nombre o sessionId fijado; `null` si se soltó) |
| `permission_request` | `capacidad`, `tipo: 'escritura' \| 'irreversible' \| 'gasto'`, `archivo` (Figma), `requiereAprobadoUsd: true` (imagen), `parentAgentId` (lo pide el ejecutor) |
| `turn_end` | `usageByModel: {modelo: {inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens}}`, `reparto: {planifica, ejecuta}` |
| todos los del subagente | `parentToolUseId` = id de la llamada `Agent` del planificador |

## Permisos por capacidad

- **Lecturas de MCP** (Figma `get_*`, `list_*`, `scan_*`, `search_*`, `ping`, `list_files`, `use_file`, mapas; `imagen_estimar`/`imagen_validar`; lecturas de video; `GET` de herramientas): sin preguntar.
- **Escrituras**: `permission_request` normal; «sí a todo» (`allow_all`) las cubre.
- **Irreversibles** (Figma `delete_*`, `detach_instance`, `flatten_nodes`): preguntan **siempre**, aun con «sí a todo».
- **Gasto** (`imagen_generar`, `imagen_variantes`): preguntan siempre; el `aprobado_usd` que mande el modelo se borra. La interfaz muestra la estimación y responde `POST …/permissions/:requestId {"decision":"allow","aprobado_usd":0.12}`. Sin `aprobado_usd > 0` se niega.
- **Figma sin archivo fijado**: toda escritura se niega con «fija el archivo con list_files y use_file». Cuando `use_file` responde bien, el puente guarda `figmaArchivo` y cada `permission_request` de Figma lo trae en `archivo` para que la persona vea dónde se va a escribir.
- Aprobar nodos del hilo nunca lo hace el agente (la herramienta lo rechaza).

## «Planifica fuerte, ejecuta barato»

El principal planea, delega con la herramienta `Agent` al subagente `ejecutor` y revisa la evidencia. El puente lo impone:

- Hook `PreToolUse`: el hilo principal **no puede** usar herramientas que escriben o generan (se le niega y se le dice que delegue); las lecturas sí, para revisar.
- Cada `Agent` del principal se reescribe: sin `model`, `effort`, `isolation` ni `mode`, y `run_in_background: false` (el planificador espera la evidencia y los permisos del ejecutor llegan dentro del mismo turno).
- El ejecutor no puede lanzar subagentes.

Mapeo de modelos (verificado contra el SDK 0.3.322: el `model` del subagente manda sobre `CLAUDE_CODE_SUBAGENT_MODEL`, salvo que la llamada a Agent traiga otro, que el hook quita):

| Vía | Principal | Ejecutor por defecto | Cómo |
|---|---|---|---|
| Login de Claude (`claude` logueado en el VPS) | `opus` (o lo que pida `planifica`) | `haiku` (`PUENTE_EJECUTOR_CLAUDE`) | alias nativos; un id de LiteLLM se traduce (alto→opus, medio→sonnet, bajo→haiku) |
| LiteLLM | `nivel-alto` | `nivel-medio` (`PUENTE_EJECUTOR_LITELLM`) | el subagente pide el alias de LiteLLM; `ANTHROPIC_DEFAULT_HAIKU_MODEL` y `CLAUDE_CODE_SUBAGENT_MODEL` = ejecutor (llamadas auxiliares también baratas) |

Un proceso del arnés tiene una sola vía: con login, el ejecutor también va por la suscripción. Si la persona no tiene permitido el ejecutor, no se reparte y `turn_start.planMotivo` lo dice.

**Ahorro esperado** (estimación, no medida con modelos reales): en trabajo con muchas herramientas cada llamada reenvía el contexto. Ejemplo de un diseño en Figma con 40 llamadas y ~25k tokens de contexto medio: sin reparto ≈ 1.0 M tokens de entrada al modelo fuerte. Con reparto ≈ 10 llamadas del planificador × 12k = 120k al fuerte + 40 × 20k = 800k al barato. Si el barato cuesta ~1/5 por token (orden de Haiku frente a Opus; revisar la tarifa vigente), el costo equivalente es ≈ 280k «tokens fuertes»: **~70 % menos**. Por suscripción el ahorro es cupo de Opus; por LiteLLM, cupo de `nivel-alto` que pasa a `nivel-medio` (incluido en Cline Pass). Se mide en cada turno con `turn_end.usageByModel` y `reparto`. Prueba: `test/plan-integracion.test.ts` (arnés real + Anthropic falso) comprueba que el planificador pide `nivel-alto`, el ejecutor `nivel-medio`, que el planificador no escribe directo y que el reparto coincide con el uso por modelo.

## `GET /models`

Conserva `{ default, models: [{id}] }` y agrega:

```json
{ "modelos": [
    { "id": "opus", "nombre": "Claude Opus (tu suscripción)", "nivel": "alto", "roles": ["planifica"], "disponible": true, "costo_relativo": 3, "via": "claude_login", "nota": "…" },
    { "id": "nivel-alto", "nombre": "Nivel alto", "nivel": "alto", "roles": ["planifica"], "disponible": true, "costo_relativo": 2, "via": "litellm", "respaldos": ["cp-kimi-k3.1-pro", "…"] },
    { "id": "nv-mistral-large-4", "nombre": "mistral-large-4 (NVIDIA, gratis)", "nivel": "bajo", "roles": ["ejecuta"], "disponible": true, "costo_relativo": 0, "via": "litellm" } ],
  "presets": [
    { "id": "planifica-fuerte", "nombre": "Planifica fuerte, ejecuta barato", "planifica": "opus", "ejecuta": "haiku", "plan_ejecucion": true, "disponible": true, "nota": "…" },
    { "id": "rapido-gratis", "nombre": "Todo rápido y gratis", "planifica": "nivel-bajo", "ejecuta": "nivel-bajo", "plan_ejecucion": false, … },
    { "id": "maxima-calidad", "nombre": "Máxima calidad", "planifica": "opus", "ejecuta": "opus", "plan_ejecucion": false, … } ] }
```

- `modelos`: los alias de Claude por login (`opus`, `sonnet`, `haiku`; `disponible` = la persona tiene `claude` logueado; sin login caen a `nivel-alto`/`medio`/`bajo`) + todos los alias de LiteLLM que su llave virtual ve. Los de imagen no aparecen (viven en `code-os/imagen`).
- `costo_relativo`: 0 gratis · 1 incluido en una suscripción · 2 cupo alto o pago por token · 3 el más caro.
- `opus`, `sonnet` y `haiku` se aceptan como `model` de sesión y en `plan_ejecucion` (requieren tener el nivel al que caen).
- Aplicar un preset desde la interfaz: `PATCH /sessions/:id { "plan_ejecucion": { "planifica": p.planifica, "ejecuta": p.ejecuta, "activo": p.plan_ejecucion } }`.

## Catálogo MCP del servidor (`PUENTE_MCP_CONFIG`)

Plantilla: `code-os/despliegue/puente-mcp.json`. Claves propias del puente en cada entrada (no llegan al SDK): `x-puente.ro` (carpetas de solo lectura que la jaula monta; nunca la carpeta de datos) y `x-puente.sondeo` (URL de salud). En `command`, `args` y `env` se sustituyen por sesión `${USUARIO_LLAVE_LITELLM}`, `${LITELLM_URL}`, `${PROYECTO}`, `${HOME_USUARIO}`, `${USUARIO}`, `${CUOTAS_URL}`.
