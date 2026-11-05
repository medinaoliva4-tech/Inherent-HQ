# PLAN-GATEWAY · el puente entre Inherent OS y los motores de IA

**Estado (2026-11-04):** consolidado. **F0, F1, F2, F3 y F4 cerradas; F4.5 hecha** (ver §10, §14–§20): la web, los MCP por persona, el Chat, la lectura del OS y las escrituras con confirmación corren en el servidor, **Hermes se retiró** (§18) y **cada trabajo del Agent Area se lleva desde su chat de trabajo** (§19). Sigue F5.
**Para qué sirve este archivo:** es la fuente de verdad del plan. Antes de trabajar en el Gateway, en el Agent Area o en el chat de trabajo se lee; todo cambio de rumbo se anota en §11 en vez de resolverse de palabra.
**Dónde está el código hoy:** rama `os-agentes-gateway`, PR medinaoliva4-tech/Inherent-HQ#209 (reemplaza #207 y #208, que siguen abiertos hasta que el CEO los cierre).

> **Qué es y qué no es.** El Gateway no inventa nada: **pone en un solo lugar lo que Inherent ya usa** (el chat con modos, el Agent Area, el conector MCP, el repo como conocimiento) y **reemplaza a Hermes en la compu de cada persona** por un trabajador central en el VPS. El OS sigue siendo la cara; el VPS hace el trabajo pesado.

---

## 1 · Decisiones

| # | Decisión | Por qué |
|---|---|---|
| D1 | **El trabajo pesado corre en el VPS (Contabo)**, no en la compu de cada persona | Llaves, presupuestos, logs y colas en un solo lugar. Nadie depende de tener su Mac encendida |
| D2 | **Un solo Gateway**; los motores se enchufan detrás | Se acaban las muchas rutas (Hermes, puente, claude.ai pegado, Simulado) |
| D3 | **El motor base es un ejecutor determinista** (`gateway/runner.mjs`) que llama a LiteLLM **un paso a la vez**. OpenCode queda solo para tareas cortas con herramientas | En el spike, OpenCode con un bucle largo leyó y no escribió; el ejecutor por pasos corrió Strategy de punta a punta (§14). *Cambia la D3 original* |
| D4 | Segundo motor: **Claude Code con Opus 5.5** para video, diseño y lo premium | Ya funciona en esos flujos |
| D5 | **LiteLLM** como capa de proveedores (Featherless, NVIDIA, frontier por API) | Un adaptador; llaves virtuales y presupuesto por persona y cliente |
| D6 | **La memoria vive en la base del OS (Neon)**, no en el motor | El contexto de un motor es desechable; el trabajo no se pierde |
| D7 | **Un solo hilo visible por Trabajo**; por debajo se rotan sesiones con resumen de traspaso | El contexto real es de 32k (§14): la rotación es obligatoria |
| D8 | **MCP por persona**, con su propia autenticación (ya existe: `api/_lib/conectores.js`, OAuth y token cifrados) | Cada quien conecta lo suyo |
| D9 | **Claude nunca por API.** Al motor premium se le habla por un canal a una sesión de Claude Code encendida (la terminal con la suscripción iniciada), no con una llave de API. *Cambia la D9 original* | Decisión del CEO (2026-11-04). Por verificar: los términos de uso si esa sesión corre en el VPS en lugar de en una compu del equipo |
| D10 | **Los workflows viven en la base del OS** (`agent_workflows`), creados en blanco o importados de una plantilla del repo (`agents/*/brain/WORKFLOW.md`). Importar corta el lazo. *Cambia lo dicho en §13 original («plantillas en el repo»)* | Se editan en el OS sin PR; el repo es fuente de plantillas, no de verdad. `ceo-os/workflows/*.json` queda como prueba del ejecutor |
| D11 | **Modelo por etapa**, elegido en el Flujo (vacío = el del agente; si no, la «IA para Agents» de Ajustes) | Gratis o barato para preparar, fuerte para decidir. Ya construido |
| D12 | **Umbral:** cada paso cabe en ~20k tokens de entrada y ~6k de salida; si no cabe, un modelo gratis condensa antes o el OS avisa (413 `UMBRAL`) | Featherless corta en 32,768 |
| D13 | **El OS no llama al VPS: el VPS saca trabajos de la base.** El OS escribe la etapa a correr como «en cola» en Neon; el trabajador del VPS la toma, la corre y escribe actividad, resultado y costo en la misma fila; la pantalla lee la base | Sin DNS, sin túnel, sin puerto abierto (el firewall solo deja Tailscale) y sin el tope de 300 s de Vercel. *Cierra la pregunta abierta de cómo llega Vercel al VPS* |
| D14 | **La UI sigue a Apple** (Human Interface Guidelines · Foundations): jerarquía clara, profundidad y vidrio translúcido, nada de «AI slop». Patrones de AI Elements (Queue, Sources, Agent, File tree) adaptados, no copiados | Ver §8 |

## 2 · La estructura

```
Inherent OS (Vercel) ── la cara
 Agent Area (lista · portal · Flujo) · chat de trabajo · conector MCP · Ajustes → IA
          │  escribe «etapa en cola» y lee resultados          (nunca llama al VPS)
          ▼
       Neon (base del OS) ── la memoria
 agent_workflows · agent_runs (etapas, actividad, evidencia, costo) · ia_config · mcp_conexiones
          ▲  toma trabajos, escribe avance                      (el VPS sale hacia Neon; nada entra)
          │
AGENT GATEWAY (VPS, solo Tailscale)
 · cola global y candado por Trabajo       · umbral y condensado (D12)
 · permisos por rol y cliente              · rotación de sesiones y resumen de traspaso
 · regla de la ficha de oferta             · costo por cliente
          │
   ┌──────┴───────────────┐
   ▼                      ▼
 Ejecutor por pasos     Claude Code (Agent SDK)
 (runner.mjs)           video, diseño, Figma
   └──────┬───────────────┘
          ▼
       LiteLLM ──► Featherless · NVIDIA · Anthropic · OpenAI · OpenRouter
```

Mientras F2 no exista, el OS sigue corriendo las etapas desde el navegador con la **IA del OS** (`/api/ia/completar` y `/api/ia/agente`, con tope de 300 s) o con Hermes. F2 mueve eso al VPS sin cambiar la pantalla.

## 3 · La memoria: tres capas

| Capa | Qué guarda | Dónde | Quién escribe |
|---|---|---|---|
| **Conocimiento** | Principios, método, ofertas, fichas, plantillas de agentes | Repo Inherent-HQ | Solo personas, con PR. Los agentes leen |
| **Estado del trabajo** | Agentes, trabajos, etapas, actividad, evidencia, resúmenes, costos | Neon (`agent_workflows`, `agent_runs`) | El OS y el Gateway |
| **Contexto de una corrida** | La sesión del motor | Disco del VPS | El motor. Desechable |

**Regla:** si se pierde la capa 3, se reconstruye desde la 2.

## 4 · Contexto limitado y sesiones

El contexto real de Featherless en el plan actual es **32,768 tokens** (no 262k). Por eso:

1. Cada etapa es una llamada acotada: entrada ≤ ~20k, salida ≤ ~6k (D12).
2. Si las entradas no caben, un modelo gratis (NVIDIA MiniMax) las condensa por bloques, empezando por la más grande (`runner.mjs`, ya construido).
3. Un Trabajo largo no es una conversación larga: es una cadena de etapas, cada una con su resumen guardado en la base. La siguiente etapa recibe los resúmenes aprobados, no el historial completo.
4. La pantalla muestra un solo hilo; por debajo cada etapa abre una sesión nueva.

## 5 · Que no choquen las llamadas

- **Cola global por proveedor** (ya en `runner.mjs`): Featherless da 4 unidades; Kimi K3 y DeepSeek V4 Pro cuestan 4 (una a la vez en toda la cuenta), DeepSeek V4 Flash 2. Los costos del resto están por medir (`gateway/limits.json`).
- **Un candado por Trabajo:** una etapa activa a la vez; el resto espera.
- **Un cliente por sesión**, nunca dos mezclados.
- **Llaves virtuales de LiteLLM** por persona y por cliente, con presupuesto (F2).

## 6 · MCP

- Ya existe la **conexión directa** de MCPs desde el OS (OAuth por persona, cifrado, con logos en Inherent AI → MCPs) y la IA del OS los usa en `/api/ia/agente` (hasta 8 vueltas de herramientas).
- El Gateway entrega a cada etapa **solo los MCP que esa etapa pide y que la persona tiene conectados**.
- **Composio** entra como un MCP más, evaluado contra Zernio, Apify y Windsor.

## 7 · Figma y video

- **Figwright** es un MCP local que necesita el plugin abierto en Figma. **Probado (2026-11-04): sí llega al VPS** con un túnel que abre la Mac del diseñador (§14). Mientras la Mac esté encendida y Figma abierto, el servidor puede leer y escribir en el archivo.
- **Video y diseño** corren por Claude Code (Opus 5.5) detrás del mismo Gateway.

## 8 · La interfaz

**Base:** Apple HIG · Foundations (https://developer.apple.com/design/human-interface-guidelines/foundations): jerarquía, profundidad, materiales translúcidos, movimiento con propósito. Paleta de referencia: negros y grises profundos, blanco hueso, gris medio y crema; textura de puntos tenue; vidrio semitransparente con borde de luz. Más integral y en capas (3D), menos tarjetas planas.

**Agent Area (hecho, PR #209):**
- **Lista:** búsqueda y filtros en chips; qué hace cada agente, sus etapas como puntos de color, lo que espera aprobación.
- **Portal:** Resumen (qué hace, Por aprobar / En curso / Completados, etapas numeradas, ficha), Flujo, Trabajos (filtros y avance), Configuración (secciones con su explicación; se guarda sola).
- **Flujo (estilo Kargul):** lienzo con rejilla, zoom y ajustar, pantalla completa (F / Esc), tarjetas por tipo con su modelo, «+» entre etapas, Acciones e inspector flotantes.

**Chat de trabajo (hecho, F4 · §19):** cuando un Trabajo entra a su fase, se trabaja como en Claude: una conversación que **se guarda** (el valor queda en la base, no en la sesión). Piezas, inspiradas en AI Elements:

| Pieza | Para qué |
|---|---|
| **Agent** | La cabecera: qué agente, qué modelo, qué conexiones, en qué etapa va |
| **Queue** | Las etapas y tareas pendientes en cola, con la activa marcada; se aprueban desde ahí |
| **Sources** | Las fuentes que usó cada respuesta, con verificar / quitar |
| **File tree** | Los archivos del cliente y los artefactos que el trabajo produce |

Esto es lo básico; encima van funciones propias de cada workspace (Strategy, Marketing, Creative, Production).

**Mejoras del Flujo para que sea menos manual (backlog, por orden):**
1. **Generar el flujo desde una descripción**: «quiero un agente que audite la marca y entregue un brief» → el planificador (§13) propone las etapas y la persona las ajusta.
2. Arrastrar etapas para reordenarlas y arrastrar desde Acciones al lugar exacto.
3. Atajos (duplicar, borrar, mover) y un mini mapa para flujos largos.
4. «Probar esta etapa» desde el inspector, con un trabajo de prueba.

## 9 · Modelo por etapa

| Uso | Modelo | Estado |
|---|---|---|
| Preparar, condensar, títulos, triage | NVIDIA MiniMax M3.1 Flash (gratis, ~15 tok/s, razona en oculto) | Medido |
| Redactar etapas de volumen y revisar | DeepSeek V4 Flash (~25 tok/s, sin razonamiento oculto) | Medido |
| Análisis y decisiones (Strategy, Branding, Growth) | DeepSeek V4 Pro (~13 tok/s) | Medido y comparado con Claude: mismo nivel (§14) |
| Kimi K3 / GLM 5.3 | Solo con presupuesto de razonamiento explícito | Por medir |
| Diseño, video y segundo revisor premium | Claude Code · Opus 5.5, por la sesión encendida (D9) | Ya funciona |
| Revisor | Otro modelo que el que escribió | Hoy Flash revisa lo de Flash: corregir cuando haya un tercer modelo útil |

## 10 · Fases

| Fase | Qué se hace | Estado |
|---|---|---|
| **F0 · Piso firme** | Agent Area recuperado y unido (PR #209); filtros por cliente (`scoper`); base de pruebas separada; OS oficial | **Cerrada (2026-11-04).** OS oficial: `inherent-work.vercel.app`. Base de pruebas: la rama `ceo-os-staging` de Neon (endpoint `ep-sweet-wind`, vacía, separada de `main`); conexión en `~/.config/inherent/neon-staging.env` (Mac) y `~/gateway/neon-staging.env` (VPS); en local se usa con la configuración `ceo-os-staging`. PR #209 unido a `main`; #207 y #208 cerrados |
| **F1 · Spike** | VPS con LiteLLM y OpenCode; flujo real de Strategy; límites reales; calidad contra Claude; Figwright | **Cerrada (2026-11-04)** (§14): la calidad de DeepSeek V4 Pro alcanza para Strategy; Figwright funciona desde el VPS con un túnel que abre la Mac |
| **F2 · Gateway mínimo** | Trabajador en el VPS que toma etapas en cola desde Neon (D13), las corre con el motor (umbral, condensado, cola por proveedor), escribe actividad, resultado y costo; servicio `systemd` | **Hecha y conectada a producción** (§15). Falta que el merge del #209 lleve la pantalla a `inherent-work` |
| **F3 · Conectar el OS** | «Servidor» por defecto en los trabajos (hecho en F2); **web en el servidor (hecho, §16)**; **MCP por persona desde el servidor (hecho, §16)**; **el Chat y sus modos en el servidor (hecho, §17)**; **Hermes retirado (§18)** | ✅ Cerrada |
| **F4 · Chat de trabajo** | La interfaz de §8 (Agent, Queue, Sources, File tree), con la conversación guardada | ✅ Cerrada (§19): un trabajo se lleva de punta a punta desde el chat |
| **F4.5 · El Chat como centro** | Un solo chat; `@agente` corre su flujo con el contexto del Chat; ventana de agentes; preguntas y aporte humano; leer antes de aprobar; OpenUI (§20) | ✅ Las 3 entregas hechas (§20) |
| **F4.6 · El agente sabe y se revisa** | Conocimiento, «El equipo hoy», calidad sin fricción, supervisor, memoria y mejora, tablero (§21) | En curso |
| **F5 · Segundo motor y Figma** | Claude Code detrás del Gateway; ruta de Figwright | El flujo de video corre desde el Gateway |
| **F6 · Orquestador y flujo** | De un prompt al workflow (§13); generar flujos desde una descripción; W1–W9 por impacto | «Arma el mes de AKAI» crea y corre el trabajo correcto |
| **F7 · Limpieza** | `CLAUDE.md`, `MAPA.md` y este archivo al día (Hermes ya salió del código y de la app en §18) | Las reglas del repo dicen lo que es cierto |

## 11 · Registro de cambios de rumbo

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-11-03 | Primer borrador | CEO + Claude |
| 2026-11-04 | Contexto real de Featherless: 32k (no 262k). Concurrencia: 4 unidades | Spike |
| 2026-11-04 | D3: el motor base es un ejecutor por pasos, no un agente de bucle largo | Spike |
| 2026-11-04 | D10: los workflows viven en la base del OS (Agent Area), no como JSON del repo | CEO |
| 2026-11-04 | Se recuperó el Agent Area perdido en `os-agentes` (editor de flujo, MCPs con logos, IA del OS) y se rediseñó al estilo Kargul | CEO + Claude |
| 2026-11-04 | D13: el VPS saca trabajos de Neon; el OS no llama al VPS | Claude, para aprobar |
| 2026-11-04 | D14: la interfaz sigue a Apple HIG, con vidrio y profundidad | CEO |
| 2026-11-04 | D13 aprobada y F2 construida: `gateway/worker.mjs` como servicio `gw-worker` en el VPS | CEO + Claude |
| 2026-11-04 | En el servidor (sin web ni MCP) la evidencia se limita a los inputs: el modelo inventó una fuente de Statista en la primera prueba | Prueba de F2 |
| 2026-11-04 | D9: Claude nunca por API; se le habla por un canal a una sesión de Claude Code encendida | CEO |
| 2026-11-04 | F0 y F1 cerradas: base de pruebas `ceo-os-staging`, #209 a `main`, comparación contra Claude, Figwright desde el VPS | CEO + Claude |
| 2026-11-04 | F3 · web: SearXNG propio en el VPS y lectura de páginas en el trabajador | CEO + Claude |
| 2026-11-04 | F3 · MCP por persona a través del OS con `GATEWAY_TOKEN`; el VPS nunca recibe `SESSION_SECRET` | CEO + Claude |
| 2026-11-04 | F3 · el Chat en el servidor: conversaciones guardadas en el OS, respondidas por el VPS en vivo; Hermes queda como opción en Ajustes | CEO + Claude |
| 2026-11-04 | F3 · el Chat del servidor con herramientas: web y MCP de la persona | CEO + Claude |
| 2026-11-04 | F3 · el MCP del propio OS desde el servidor, como la persona y solo lectura | CEO + Claude |
| 2026-11-04 | F3 · escrituras en el OS desde el Chat solo como propuestas que la persona aprueba | CEO + Claude |
| 2026-11-04 | F3 · Hermes retirado: el Chat, Strategy, las herramientas y el Agent Area corren en el servidor | CEO + Claude |
| 2026-11-04 | F4 · chat de trabajo: cada trabajo abre en su chat (una conversación por persona y trabajo, guardada en el OS); la vista por etapas queda en `/etapas` | CEO + Claude |
| 2026-11-04 | F4.5 · el Chat como centro: no hay otros chats; los agentes se llaman con `@` desde el Chat y su avance se ve en la ventana de agentes; el portal sirve para configurar, ver el flujo y los trabajos (§20). El chat de trabajo de F4 se retira | CEO |
| 2026-11-04 | F4.6 · después de leer Mastra: la conciencia pasa a pocas decisiones claras; las etapas intermedias se aprueban con una decisión corta y la lectura completa queda en la entrega final y al pasar a otro agente (§21) | CEO |
| 2026-11-04 | La base «staging» era producción: el servidor queda conectado a producción (`~/gateway/neon-prod.env`) y la prueba de F2 dejó un trabajo y un usuario de prueba ahí (limpiado: trabajo archivado, usuario borrado) | CEO + Claude |

## 12 · Por verificar

- Si la sesión de Claude Code para lo premium (D9) puede vivir en el VPS o tiene que ser la compu de alguien del equipo (términos de uso).
- Que el VPS alcance con varios trabajos a la vez (4 vCPU, 7.8 GB: suficiente para el ejecutor; Claude Code puede pedir más).
- Costo en unidades de Featherless de cada modelo que no es Kimi K3.
- Higiene: revocar las llaves de Featherless que se pegaron en el chat y rotar la contraseña de Neon que también se pegó.

## 13 · El orquestador: de un prompt a un workflow multimodelo

**Lo que promete la web (inherentglobal.com, leída el 2026-11-04):** cuatro pilares (Growth, Conversion, Operations, Money System) y tres planes (Brand Foundation, Brand Growth, Growth Partnership) que entregan *marca, plan y ejecución*. Promesas concretas: nada se publica sin el OK del cliente, piezas a tiempo, revisión mensual y presentación el día 20, metas medibles y un portal con los mismos números para cliente y equipo. El OS es la fábrica que cumple eso.

**Principio:** el LLM decide *qué* workflow y escribe *el contenido* de cada paso; **un ejecutor determinista lleva el flujo**.

```
Prompt («arma el mes de AKAI», «lanza la campaña de X»)
  → 1. ENRUTADOR (modelo barato): intención + cliente + ficha → qué agente (workflow del OS)
  → 2. PLANIFICADOR (modelo fuerte): llena el trabajo (objetivo, entradas, fechas)
  → 3. EJECUTOR (código): corre cada etapa con su modelo, sus MCP y su umbral, en cola
  → 4. REVISOR (otro modelo): contra 08-CRITERIOS-DE-ACEPTACION
  → 5. GATE humano (CEO/COO/cliente) → seguir, ajustar o devolver
```

- Los workflows son los agentes del OS (D10). El LLM los elige y los llena; no los inventa.
- Una etapa = una llamada acotada: una skill, un modelo, pocas herramientas.
- Toda etapa escribe salida, evidencia y costo en `agent_runs`: el Agent Area, el costo por cliente y el portal salen de ahí.

**Cómo el flujo gana eficiencia y revenue (W1–W9):**

| # | Conexión | Qué hace |
|---|---|---|
| W1 | La ficha como contrato ejecutable | El Gateway rechaza trabajos fuera del techo de la ficha |
| W2 | Costo real por cliente y ciclo | Llave virtual por cliente contra el rubro de IA de `06-ECONOMIA.md` |
| W3 | Modelo por etapa | §9 |
| W4 | El calendario del ciclo como programador | Días 1–20, con el 11 y el 20 como límites duros |
| W5 | Calidad medible | Aprobación a la primera y rondas usadas contra la ficha |
| W6 | Una sola bandeja de gates | «¿Qué necesita de mí?» con avisos al celular |
| W7 | Señales de subida de nivel | Growth propone el siguiente plan con evidencia, sin prometer resultados |
| W8 | Onboarding automático | Cliente nuevo → carpeta, plan contratado y Estrategia guiada |
| W9 | `00-account` (WhatsApp) en el mismo Gateway | Un solo cerebro por cliente |

## 14 · Hallazgos del spike (2026-11-04)

| Hallazgo | Consecuencia |
|---|---|
| Servidor: 4 vCPU, 7.8 GB, 94 GB libres. Hermes y LiteLLM viejos retirados (respaldo en el servidor). LiteLLM nuevo como servicio en `127.0.0.1:4000` | Alcanza para F2 |
| Featherless `feather_pro_plus`: 4 unidades; Kimi K3 cuesta 4 → una petición de Kimi a la vez en toda la cuenta | La cola global es obligatoria |
| Featherless limita el contexto a 32,768 tokens en este plan («prompt de 32,922 excede 32,768») | Umbral por paso y rotación de sesiones obligatorios |
| Kimi K3, GLM 5.3 y MiniMax razonan en oculto y eso cuenta contra `max_tokens` (Kimi gastó 4,500 pensando y devolvió 0 caracteres). DeepSeek V4 Flash y Pro no | Los pasos de redacción usan DeepSeek |
| Strategy (método → contexto → análisis → revisión → gate) corrió de punta a punta con el ejecutor: ~7 min, ~25k tokens, se detuvo en el gate. El revisor detectó una inconsistencia real en la ficha de prueba (2,990 × $145 = $433k ≠ $330k) | Valida §13 |
| OpenCode + Kimi K3: tareas cortas con herramientas, bien; la tarea larga leyó y cerró sin escribir; arranques colgados por IPv6 (corregido con `gai.conf`) | D3 corregida: no usar bucle largo |
| NVIDIA gratis: solo MiniMax M3.1 Flash responde | Sirve para preparar, no como motor base |
| Claude Code CLI de la terminal sin sesión («Not logged in» en `claude -p`); la app de escritorio sí tiene sesión | El canal a Claude (D9) necesita un `claude /login` una vez en la terminal o máquina que lo atienda |
| **Calidad (Strategy · Análisis, mismo pedido y mismas entradas):** DeepSeek V4 Pro (~329 s) contra Claude Opus por la sesión encendida. Mismo nivel. DeepSeek es más operativo (GO GET con acción y métrica, tabla de entrega a cada departamento) y detectó la misma inconsistencia de números; un desliz: afirmó que el negocio es «rentable» sin dato. Claude es más preciso con los números (abre con la inconsistencia y calcula la meta según cuál dato sea el falso) y más corto, con GO GET menos accionables | DeepSeek V4 Pro queda como modelo de Strategy. Claude para lo premium y como segundo revisor en entregables de alto riesgo (D4, D9) |
| **Figwright desde el VPS:** el servidor de Figwright de la Mac escucha solo en `127.0.0.1:3055`; el VPS no llega directo. Con un túnel que **abre la Mac hacia el VPS** (`ssh -R 127.0.0.1:3055:127.0.0.1:3055 inherent-gw`), un Figwright «seguidor» en el VPS hizo `ping` de punta a punta y leyó el archivo real «akai - brand world». El VPS nunca recibe acceso a la Mac | Funciona. Para F5: dejar ese túnel como servicio en la Mac del diseñador (se cae si la Mac se apaga o Figma se cierra) |
| Firewall activo (solo Tailscale), login root y por contraseña cerrados | Servidor endurecido; compatible con D13 (el VPS solo sale) |

## 15 · F2 · lo que quedó construido (2026-11-04)

**Cómo funciona:**
1. En la pantalla de un trabajo, «Con qué corre» ofrece **Servidor · siempre encendido** con los modelos del VPS (aparece solo si el latido tiene menos de 90 s). Es la opción por defecto cuando está en línea.
2. «Ejecutar» deja la etapa **en cola** (`POST agentes/runs/:id/etapa/:n/encolar`). Mientras siga en cola se puede **cancelar**.
3. El trabajador del VPS (`gateway/worker.mjs`, servicio `gw-worker`) revisa la base cada 3 s, toma la etapa con la versión del documento (nadie la toma dos veces), arma el pedido dentro del umbral (condensa con el modelo gratis si no cabe) y la corre en la cola por proveedor.
4. Mientras trabaja escribe su avance en la misma etapa (tomada, esperando turno, pensando, redactando N caracteres). La pantalla relee cada 2.5 s; se puede cerrar o apagar la compu.
5. Al terminar guarda el resultado con las mismas reglas que el OS (`aplicarResultado`), con su costo (tokens de entrada, de salida y segundos), y la etapa queda **Esperando aprobación**. Si falla, vuelve a como estaba, con el error a la vista. Si una etapa queda colgada 25 min, se retoma.
6. Nunca aprueba, nunca publica y nunca toca otra etapa que la que tomó.

**Piezas:** `gateway/motor.mjs` (cola, llamada en vivo, condensado; lo comparten el CLI y el trabajador) · `gateway/worker.mjs` · rutas `agentes/gateway`, `encolar` y `cancelar` en `api/_lib/agentes.js` · `aplicarResultado`, `soloEvidenciaDeInputs` y `enServidor` en `agentes-flujos.js` · la pantalla en `agentes-run.js`. En el VPS: `~/gateway/gw/ceo-os/` (copia de esos archivos) y `/etc/systemd/system/gw-worker.service`.

**Probado (en la base de producción, que se creía de pruebas):** «Estrategia guiada», etapas 1 y 2 con DeepSeek V4 Flash: 77 s y 81 s, ~800–1,400 tokens de entrada y ~2,000 de salida; el pedido desde la pantalla, el avance en vivo, la cancelación y el resultado en revisión. 14 pruebas puras, 22 de Inherent AI y la prueba de navegador del Agent Area pasan.

**Hallazgo:** sin herramientas, el modelo **inventó una fuente** (una página de Statista con cifras). Ahora el pedido le dice que no tiene internet y toda fuente que no venga de los inputs pasa a «Falta evidencia», su campo baja a hipótesis y la confianza a 40% como máximo. Las etapas que necesitan investigar afuera esperan a que el servidor tenga web y MCP (F3), o se corren con la IA del OS.

**Conexión:** el servicio lee `~/gateway/.env` (llaves de LiteLLM) y `~/gateway/neon-prod.env` (la base de producción, 600). Para pruebas hará falta una rama `staging` de Neon y otro archivo.

**Falta:**
- Que el PR #209 llegue a `main`, para que la pantalla con «Servidor» esté en `inherent-work`.
- Web y MCP dentro del servidor (búsqueda y conectores por persona), para que las etapas de investigación no dependan de la compu.
- Actualizar el código del VPS hoy es copiar los archivos (`scp`); conviene un `git pull` de la rama con una llave de solo lectura.

## 16 · F3 · web en el servidor (2026-11-04)

**Cómo funciona:** si una etapa tiene «Búsqueda web» en sus conexiones, antes de escribir el trabajador:
1. pide a DeepSeek V4 Flash 3 búsquedas concretas (con el nombre, el lugar y el rubro que dan los inputs);
2. las corre en **SearXNG propio** (Docker en el VPS, solo en `127.0.0.1:8888`, sin llaves de nadie);
3. lee las mejores páginas como texto plano (sin scripts ni menús; salta redes que piden login) hasta 4–8 fuentes según las «fuentes mínimas» de la etapa;
4. se las pasa al modelo como inputs citables `w1, w2…` con su URL. La evidencia sigue limitada a los inputs, así que **solo cuentan las URLs que de verdad se leyeron**.

**Seguridad:** el servidor nunca lee direcciones internas (localhost, redes privadas, Tailscale `100.64/10`, metadatos de la nube, IPv6 local), solo `http(s)` en los puertos 80 y 443, y revisa cada redirección. Lo que dice una página es dato, no instrucción: el modelo no tiene herramientas que ejecutar.

**Probado (en la base de pruebas `ceo-os-staging`):** Strategy · «Contexto» para una cafetería en San Pedro Garza García: 4 páginas reales leídas (Restaurant Guru, Wanderlog, Beany, Cafés de México), 87 s, ~5k tokens de entrada. El resultado cita esas cuatro URLs y marca como hipótesis lo que no encontró (precios, perfil del cliente). Se verificó contra la fuente un dato al azar (175 cafeterías registradas, 59 con sitio web).

**MCP por persona (hecho):** los permisos de los MCP se cifran con una llave derivada de `SESSION_SECRET`, la misma que firma los logins del OS, y **no se copia al VPS**. En cambio:
1. el trabajador pregunta al OS qué herramientas tiene la etapa (`POST /api/agentes/gateway/mcp`, `accion: listar`);
2. le da esas herramientas al modelo (llamadas nativas; DeepSeek V4 Flash y Pro las soportan por LiteLLM) durante hasta 8 vueltas;
3. cada llamada vuelve a pasar por el OS (`accion: llamar`), que la hace con la conexión guardada de la persona;
4. cada resultado llega al modelo como fuente citable `m1, m2…` y una URL cuenta como evidencia si aparece tal cual en ese resultado.

**Candados de la ruta:** solo con el token del Gateway (`GATEWAY_TOKEN`, comparado en tiempo constante; en Vercel solo en producción y en el VPS en `~/gateway/.env`); solo para una etapa que el servidor está trabajando en ese momento; solo los conectores que esa etapa pide, y con las conexiones de quien la encargó. Si el contexto se acerca a los 32k, se le quitan las herramientas y se le pide cerrar con lo que tiene.

**Probado (staging, con el MCP público de documentación de Cloudflare):** el servidor listó 2 herramientas, el modelo buscó dos veces en la documentación y entregó la etapa en 138 s con 7 páginas oficiales como evidencia. La primera vuelta descartó por error esas URLs (venían dentro del resultado de la herramienta); se corrigió y hay una prueba para eso. Para probar en local hay un token aparte (`~/.config/inherent/gateway-staging.env`) y la configuración `ceo-os-staging` lo carga.

**En producción desde el 2026-11-04** (merge del #210): verificado que la ruta rechaza llamadas sin token o con token falso y que, con el token real, solo atiende etapas que el servidor está trabajando. Nadie tiene MCP conectados todavía en producción: se conectan en Inherent AI → MCPs.

## 17 · F3 · el Chat en el servidor (2026-11-04)

**Qué cambia para el equipo:** en el Chat (#/chat), Ajustes → «Dónde corre el Chat» corre en el **Servidor · siempre encendido** (Hermes se retiró, §18). Con el servidor:
- las conversaciones **se guardan en el OS** (`chat_sesiones`, una por persona; nadie más las ve) y se abren desde cualquier compu;
- responde el VPS aunque la compu esté apagada; la respuesta se ve escribir (la pantalla relee cada ~0.7 s);
- «Detener» corta la respuesta y deja lo que alcanzó a escribir; ramificar copia la conversación; quitar una conversación la archiva (no se borra);
- el modelo por defecto es DeepSeek V4 Flash; se puede elegir otro de los del servidor.

**Cómo funciona (D13):** el OS guarda el mensaje y deja el turno «en cola»; el trabajador del VPS lo toma (consulta solo los ids pendientes, no lee todas las conversaciones), arma la conversación dentro del contexto y escribe la respuesta en vivo en la misma conversación. **Rotación (D7):** si la conversación ya no cabe en 32k, lo viejo se resume por bloques (sin descartar nada, copiando literal códigos, cifras, nombres y fechas) y se guarda; la siguiente vez ya no se manda entero. Al modelo se le indica que diga cuando algo no está ni en el resumen ni en los mensajes.

**Piezas:** `api/_lib/chat.js` (rutas `chat/servidor`, `chat/sesiones…`: listar, crear, leer, turno, detener, ramificar, archivar) · `public/js/chat-gateway.js` (las mismas funciones que la pantalla usa con Hermes) · `screens/llm.js` elige el motor en un solo punto · `worker.mjs` (f3-3) toma los turnos del Chat.

**Probado (staging):** respuesta en 9 s guardada; el segundo turno recordó el primero; «Detener» cortó en 749 caracteres y no siguió; una conversación de ~54k tokens se resumió y el turno corrió con ~7k. **Hallazgo:** la primera versión del resumen tiraba el principio de lo viejo cuando era enorme y el modelo inventó un dato que no tenía; se corrigió (resumen por bloques y aviso de no inventar) y la prueba repetida recordó el dato exacto.

**Herramientas (hecho, 2026-11-04):** el Chat en el servidor tiene `buscar_web` (SearXNG del VPS) y `leer_pagina` (con las protecciones de §16), y las conexiones MCP que el dueño de la conversación tiene conectadas (hasta 4, por la misma ruta del OS con `GATEWAY_TOKEN`; la ruta acepta `{ chat }` solo para una conversación que el servidor está respondiendo). El modelo decide cuándo usarlas (hasta 6 vueltas) y la respuesta se sigue viendo escribir: el motor arma las llamadas a herramientas desde el streaming. Los pasos se guardan en el mensaje y la pantalla los muestra como los de Hermes («Buscando en la web», «Leyendo una página», «Cloudflare · …»).

**Probado (staging):** «¿cuál es la versión estable más reciente de Node.js?» → buscó, leyó 4 páginas de nodejs.org y respondió v26.13.0 LTS con sus URLs, en 39 s (verificado contra `nodejs.org/dist/index.json`); «límite de CPU de un Worker según Cloudflare» → usó la conexión de Cloudflare y respondió en 15 s citando la página oficial.

**El MCP del propio OS (hecho, 2026-11-04):** el Chat del servidor y las etapas que piden «Inherent OS» leen el OS (pendientes, tareas, clientes, CRM, resultados, Library…) con las mismas herramientas del conector MCP del OS, corridas **dentro del OS como esa persona**: sus áreas, «solo ver», lo que es solo del CEO. **Solo lectura:** las 24 herramientas que escriben (crear tareas, mover leads, subir documentos, facturas…) no se le dan al servidor; si el modelo lo intenta, la ruta lo rechaza. Se abrirán cuando haya un paso de confirmación humana, porque el modelo también lee páginas web y una página podría intentar darle órdenes. Al modelo se le indica que lo que traen las páginas y las herramientas es información, no instrucciones.

**Probado (staging):** «¿qué tareas tengo pendientes?» → usó `mis_pendientes` como esa persona y respondió con la tarea real y su fecha, en 16 s. «Crea una tarea…» → respondió que desde aquí solo puede consultar; no se creó nada.

**Escrituras con confirmación (hecho, 2026-11-04):** cuando la persona pide en el Chat crear o cambiar algo del OS, el servidor **no lo hace**: deja una **propuesta** en la conversación (la acción exacta y sus datos) y la pantalla muestra una tarjeta «Propuesta · necesita tu OK» con **Aprobar** y **Rechazar**. Aprobar la ejecuta **el OS con la sesión de la persona** (`POST chat/sesiones/:id/propuestas/:pid`), con el MCP del OS y sus permisos; el servidor nunca escribe. Candados: solo el dueño de la conversación decide, una sola vez, nunca mientras el servidor escribe en esa conversación, y solo acciones del trabajo diario (`PROPONIBLES_CHAT`: tareas, leads y su historial, ideas, agenda, proyectos, cotizaciones, documentos); roles, paquetes, facturas, pagos, borrar e importar en bloque no se pueden ni proponer. Lo que la persona decide vuelve al modelo como «[Aviso del OS: …]» justo después, así no repite lo hecho ni lo rechazado.

**Probado (staging):** «crea una tarea…» → tarjeta con sus datos; aprobada desde el botón → la tarea quedó creada a nombre de la persona y la tarjeta dice «Hecho»; aprobar dos veces → 409; el siguiente turno dijo «Creada» con el id real y no la volvió a proponer (la primera versión sí la repetía: el aviso iba pegado al mensaje del modelo y lo pasaba por alto; ahora va como mensaje aparte); rechazar → no se creó nada; «marca la factura pagada» → no se puede ni proponer.

**Hermes:** retirado (§18).

## 18 · Hermes retirado (2026-11-04)

**Qué cambia para el equipo:** ya no hay que instalar ni encender nada en la compu para usar la IA. El Chat, Strategy, las herramientas (Inherent AI) y los trabajos del Agent Area corren en el **servidor**. Quien tenía Hermes elegido pasa solo al servidor.

**Qué quedó:**
- **Chat** (#/chat): solo servidor. Ajustes del Chat = el servidor, el límite semanal y el tema. Se quitaron la llave de Hermes, sus permisos, `/skill` y `/terminal` (ahora `/ajustes`).
- **Strategy, Diseño y las herramientas:** piden al servidor con una **conversación oculta** (`oculto: true`, no sale en la lista del Chat) para que recuerde lo hablado. Orden: servidor → puente de Claude → claude.ai a mano.
- **Inherent AI** (#/ai): portada con Chat · Agentes · MCPs y la página de MCPs (directorio + conectar Inherent OS a Claude/ChatGPT).
- **Conectores** que antes iban por Hermes: ahora «Próximamente».
- **App de Mac:** ya no instala Hermes ni pasa su llave (hay que sacar una versión nueva).
- **Borrado:** `hermes.js`, `mcp-hermes.js` y su prueba, `laya/hermes/` (instalador y `SOUL.md`), los comandos de Terminal de Hermes. Las ayudas de pantalla quedaron en `public/js/ia-pasos.js`.
- Los trabajos viejos con vía «hermes» se siguen leyendo (como «Hermes (retirado)»).

**Probado (staging):** el Chat responde por el servidor; una conversación oculta de Strategy responde y no aparece en la lista; la portada de Inherent AI lee el servidor, los trabajos y las conexiones; todas las pruebas pasan.

## 19 · F4 · el chat de trabajo (2026-11-04)

**Qué cambia para el equipo:** al abrir un trabajo del Agent Area se abre su **chat**. Se conversa con el agente como en Claude, se ejecuta la etapa, llega el resultado en una tarjeta y se aprueba o se pide un ajuste ahí mismo. La vista de tres columnas sigue en «Vista por etapas» (ahí siguen las otras IAs y el simulado).

**Las piezas (§8):**
- **Agent** (cabecera): el agente, el trabajo, el cliente, la etapa en curso, sus conexiones, el modelo del servidor y el avance.
- **Hilo:** tus mensajes, los del agente (con los pasos que usó: web, MCP) y lo que pasa en el trabajo (etapa enviada, resultado listo, aprobada, ajuste, falla). El resultado vigente de cada etapa sale como **tarjeta** con su confianza, lo que faltó y los botones. Mientras el servidor trabaja una etapa se ve su actividad en vivo; se puede seguir conversando o cerrar la pantalla.
- **Queue:** las etapas en orden, la activa marcada; se ejecutan, se sacan de la cola y se aprueban desde ahí.
- **Sources:** las fuentes que usó cada etapa; se **verifican** o se **quitan** (quitar no borra: la marca `quitada` queda en la base con quién lo hizo).
- **File tree:** **Inputs** (lo que dio el equipo; «+» agrega uno) y **Producido** (un `.md` por etapa con resultado: se abre, se descarga y se corrige).

**Cómo funciona:**
- La conversación es de `chat_sesiones`, **oculta** y **una por persona y trabajo**, con id fijo `inh-<modo>-t<trabajo>-<huella del correo>` (el correo no queda en la base): la misma persona la retoma desde cualquier compu. Las etapas, aprobaciones y fuentes son del trabajo y las ve todo el equipo.
- En cada mensaje la pantalla relee el trabajo y le manda al servidor el **contexto al día** (etapa activa, resultado en revisión, inputs, lo aprobado), recortado para caber en los 32k (§4).
- El agente **no ejecuta ni aprueba**: propone y redacta; la persona decide con los botones. «Pedirlo como ajuste» convierte una respuesta del agente en el ajuste de la etapa y la re-ejecuta en el servidor.
- El VPS no cambió (sigue `f3-7`): todo sale de lo que ya existía (D13).

**Archivos:** `public/js/agentes-chat.js` (pantalla), `public/js/agentes-chat-datos.js` (lo puro: id, contexto, hilo, fuentes, archivos; lo prueba `npm run test:agentes`). Ruta: `#/ai/agentes/<agente>/trabajos/<trabajo>` (chat) y `…/etapas` (vista por etapas).

**Probado (staging):** un trabajo nuevo de Strategy: conversación con el servidor, input agregado, la etapa Contexto ejecutada en el servidor con su actividad en vivo, el resultado en tarjeta, la conversación sobre el resultado y la aprobación desde el chat.

## 20 · F4.5 · El Chat como centro (2026-11-04)

### Por qué
La IA que trabaja por un prompt suelto hace lo que quiere. Inherent quiere **trabajo real con el proceso correcto**: el flujo manda, la persona pone su parte **con conciencia** (lee, aporta, decide) y nada pasa de un agente a otro sin que alguien lo lea. Y **un solo chat**: los chats sueltos parten el contexto.

### Metas
1. **Un solo chat** (el de `#/chat`, con sus **modos por rol**: Strategy, Organización, Ads…; el modo no limita, da lineamientos). Otras pantallas pueden *abrir* el Chat; no tienen chat propio.
2. **`@agente` en el Chat** arranca el flujo de ese agente **con lo que ya se habló**. Varios agentes pueden estar activos en la misma conversación.
3. **Ventana de agentes** a la derecha (como el navegador de Claude): una pestaña por agente activo con su avance y **el documento que se va armando en vivo, con sus fuentes enlazadas adentro**.
4. **Las preguntas del agente van en el Chat**, nunca en el panel ni en el portal.
5. **Aporte humano**: el flujo puede pedir, en los pasos clave, tu punto de vista o un dato que solo tú sabes; sin eso el agente no avanza.
6. **Leer antes de aprobar**: el OK se activa cuando abriste el documento (lo hace cumplir el servidor).
7. **Pasar a otro agente es un gate**: el resultado entra a otro trabajo (o a la estrategia) solo con el OK de una persona que lo leyó.
8. **OpenUI** dibuja las tarjetas en todo lo que tenga chat.
9. **El portal del agente** sirve para **modificar el agente, ver su flujo y sus trabajos**. No se activa desde ahí.

### No metas
- Que el agente decida sus propios pasos (el flujo los decide).
- Cambiar el motor, los modelos o el VPS más allá de lo que piden las preguntas, el aporte y el borrador en vivo.
- Mover el chat de Design Studio (diseña en Figma desde la compu): entra al Chat en F5, con Figwright en el servidor.

### Anti-metas (si pasa esto, salió mal aunque funcione)
- Aprobar sin abrir el documento, o un «aprobar todo».
- Un agente que avanza sin la respuesta o el aporte que pidió.
- Dos conversaciones del mismo trabajo (una en el Chat y otra en otro lado).
- Que se pierda algo de la base al retirar el chat de F4.

### Buenas prácticas de un agente real (con qué se cumplen aquí)
| Práctica | Fuente | Aquí |
|---|---|---|
| El sistema es dueño del flujo: pasos, paradas, reintentos y presupuesto | 12-factor agents (F8) | El workflow del Agent Area; el trabajador corre una etapa a la vez, máximo 2 reintentos |
| Hablar con la persona es una acción estructurada | 12-factor agents (F7) | Bloque `pregunta` → la etapa queda «Esperando tu respuesta» y sigue sola al recibirla |
| Contexto chico y útil, traído cuando hace falta | Anthropic · context engineering | El contexto del Chat entra resumido como input; lo aprobado recortado; web y MCP bajo demanda |
| Parar y escalar ante riesgo, acciones irreversibles o fallas repetidas | Guía de OpenAI | Escrituras solo como propuestas; a la 2.ª falla la etapa se detiene y avisa en el Chat |
| Evidencia o etiqueta | Reglas de Inherent | Cada dato con su fuente enlazada o marcado como hipótesis |

### Enfoque elegido (A) y descartados
- **A · El Chat como centro** (elegido por el CEO): el Chat principal recibe `@agente`, la ventana de agentes y las tarjetas; el servidor aprende a preguntar y a pedir aporte.
- **B · Solo el @ que abre el chat de F4 al lado**: más rápido, pero deja dos conversaciones; el agente no vería lo hablado. Rompe «un solo chat».
- **C · Que el agente decida sus pasos**: es justo lo que se quiere evitar.

### Cómo funciona
**1 · Llamar a un agente.** En el Chat, al escribir `@` sale la lista de agentes activos (los workflows con estado «activo»; nombre, área y qué entrega). Al enviar `@investigación revisa la competencia de AKAI`:
- El OS crea el trabajo (`POST agentes/runs`) con: el workflow, el cliente/marca del modo del Chat (si el modo pide uno), `objetivo` = el texto del mensaje, y `chat: { sesion, owner }`.
- Agrega un input `i-chat` «Lo hablado en el Chat»: los últimos mensajes (o el resumen que ya guarda la conversación, §17) recortados a ~6,000 caracteres, marcado como fuente interna.
- Encola la etapa 1 en el servidor con el modelo del Chat. Si la etapa 1 pide aporte humano, primero aparece la tarjeta de aporte (paso 4).
- Un mensaje sin `@` sigue siendo del modo del Chat, como hoy.
- La conversación guarda qué trabajos nacieron de ella: `chat_sesiones.agentes: [{ run, flujo, at }]`.

**2 · El hilo.** Entre los mensajes aparecen los eventos de cada trabajo ligado (mismo criterio que F4: etapa enviada, resultado listo, aprobada, ajuste, falla), **con el nombre y el color de su agente**. El resultado vigente de cada etapa sale como tarjeta con «Abrir documento» · «Pedir ajuste» · «Aprobar».

**3 · Preguntas del agente (servidor).** El pedido de la etapa permite responder con un bloque ```` ```pregunta {"texto","por_que","opciones":[…]} ```` en vez del resultado **cuando falta un dato que solo la persona tiene**. El trabajador deja la etapa en estado nuevo **`pregunta`** con `e.pregunta`. En el Chat sale una tarjeta con el agente, la pregunta, el porqué y las opciones (o un campo de texto). Responder (`POST agentes/runs/:id/etapa/:n/responder { texto }`) agrega el input `i-resp-N` y re-encola la etapa sola. Máximo **3 preguntas por etapa**; a la 4.ª, el pedido le prohíbe preguntar y lo que falte va a «faltantes».

**4 · Aporte humano.** Una etapa del workflow puede llevar `aporte: { pregunta, obligatorio: true }` (se edita en el portal → Flujo → inspector de la etapa). Antes de encolarla, el Chat muestra la tarjeta «Tu aporte para <etapa>»; se guarda como input `i-aporte-N` (fuente interna, con quién lo dio) y recién ahí se encola. El servidor rechaza encolar una etapa con aporte obligatorio sin su input.

**5 · El documento en vivo y sus fuentes.** Mientras trabaja una etapa, el trabajador escribe cada ~2 s el texto parcial en `e.borrador` (hoy solo escribe «escribiendo N caracteres»). La pestaña del agente muestra **el documento del trabajo**: las secciones de las etapas aprobadas, la etapa en revisión y la que se está escribiendo. Las citas (`[w1]`, `[i-…]`, `[m2]`) se pintan como enlaces a su fuente; al pasar el puntero, **verificar / quitar**. Al final del documento, la lista de fuentes por etapa.

**6 · Leer antes de aprobar.** Abrir el documento de una etapa en revisión llama a `POST …/etapa/:n/leida` (guarda `leida_por: [{ email, at }]`). `aprobar` responde 409 si quien aprueba no lo leyó después del último resultado. En pantalla el botón dice «Abre el documento para aprobar» hasta entonces.

**7 · Pasar a otro agente (gate).** En la tarjeta de un trabajo completo (o de una etapa aprobada), «Usar en…» ofrece: otro trabajo activo de esta conversación (entra como input citable con su procedencia) o **la conversación misma** (entra al contexto del Chat, para que el modo Strategy lo convierta en la estrategia en vivo con su flujo de siempre). Solo con el documento leído. Queda en el historial de ambos.

**8 · La ventana de agentes.** El panel derecho del Chat (`llm-panel`, hoy uno por modo) pasa a tener pestañas: **«<Modo>»** (el panel de hoy) + **una por agente activo** en la conversación. Cada pestaña: agente, etapa x/y, modelo, la cola de etapas, el documento en vivo y los archivos (inputs y producido). Se cierra una pestaña sin cerrar el trabajo. En el cel, la ventana es una hoja que se abre desde el agente en el hilo.

**9 · Lo que se retira o cambia.**
- **Chat de trabajo de F4** (`agentes-chat.js`): se retira. `#/ai/agentes/<agente>/trabajos/<id>` abre el Chat con ese trabajo en su pestaña: la conversación ligada (`run.chat`) si es tuya; si no, una conversación nueva del modo del agente con el trabajo adjunto. Las conversaciones ocultas que creó F4 (`inh-*-t<trabajo>-*`) se muestran en el Chat como historial de ese trabajo; no se borran.
- **Portal del agente:** Resumen, Flujo, Trabajos y Configuración siguen. «Nuevo trabajo» abre el Chat con `@<agente> ` escrito. Los trabajos se abren en el Chat.
- **Vista por etapas (`/etapas`):** queda como historial y detalle (solo lectura: sin Ejecutar ni selector de IA).
- **Chat de la pantalla de Strategy:** se cambia por «Abrir en el Chat» (modo Strategy con ese cliente; el panel del modo ya muestra la estrategia en vivo). Entrega 3.

**10 · OpenUI.** Se usa **`@openuidev/lang-core`** (MIT, sin React), copiado en `public/vendor/` con su versión fija, para dos cosas: generar del catálogo de componentes la parte del `sistema` que le enseña al modelo a dibujar, y leer en streaming lo que escribe. El dibujo lo hace **un render propio** (`public/js/genui.js`) con los componentes y el vidrio del OS: Card, Stack, Steps, Table, Metric, List, Question (las opciones responden en el Chat) y Action (solo **propone**: pasa por la aprobación de siempre; nunca ejecuta). El modelo lo usa cuando ayuda (una tabla, un resumen de etapa, opciones); lo demás sigue en texto. Los bloques viejos (`pregunta`, `criterios`, `meta`, `encargo`…) se siguen leyendo. Las tarjetas de los trabajos en el hilo usan los mismos componentes.

**11 · El flujo avanza solo y elige bien (decidido por el CEO).**
- **Primero se platica el plan.** Al llamar a `@agente`, antes de empezar, sale en el Chat la tarjeta **«Así lo voy a trabajar»**: las etapas, qué entrega cada una, con qué modelo y dónde pedirá tu aporte. La persona la confirma (puede decir «hasta aquí» en una etapa). Queda guardado en `run.plan_ok = { hasta, por, at }`.
- **Al aprobar, la siguiente etapa se encola sola solo si está dentro de lo platicado** (`hasta`). Lo hace la ruta `aprobar`, sea quien sea quien aprueba. Si esa etapa pide aporte, espera su tarjeta en el Chat. Una etapa **fuera de lo platicado** (más allá de `hasta`, o una que se agregó al flujo después) no arranca sola: el Chat muestra de nuevo la tarjeta del plan para lo que sigue.
- La conciencia está en tres momentos: platicar el plan, leer antes de aprobar y dar el aporte. No en empujar con clics.
- **Cada etapa trae su modelo** según el flujo: `etapa.modelo` si el workflow lo fija; si no, por su tipo, con la tabla de §9 (análisis y decisiones → DeepSeek V4 Pro; redactar y revisar → V4 Flash; preparar y condensar → MiniMax). El selector de modelo del Chat solo cambia los mensajes del Chat, no las etapas. En el portal (Flujo → inspector) se ve y se cambia el modelo de cada etapa.

### Entregas (cada una con su PR, probada en staging)
1. ✅ **El Chat como centro:** `@agente`, trabajos ligados a la conversación, eventos en el hilo, ventana de agentes con pestañas (cola, documento, archivos, fuentes con verificar/quitar), leer antes de aprobar, retiro del chat de F4, portal y `/etapas` como se dice arriba.
2. ✅ **El agente que pregunta y pide aporte:** trabajador `f4-5`: estado `pregunta` y `responder` (máximo 3 por etapa, solo en trabajos del Chat), aporte obligatorio (`aporte.pregunta` en el inspector → Reglas), `e.borrador` en vivo (cada ~3 s, también con herramientas), contexto `i-chat-<n>` renovado por etapa, 1 reintento y estado `detenida` a la 2.ª falla, «Usar en…» (otro trabajo o la conversación, con el documento leído). Resultados completos: el documento va primero en el JSON, los campos ya no lo repiten, si se corta el agente sigue donde iba (hasta 2 veces) y lo escrito se rescata. Los ajustes ahora sí llegan al servidor, con el resultado anterior.
3. ✅ **OpenUI y un solo chat:** el lector de lang-core en `public/vendor` (se carga la primera vez que un mensaje trae un bloque ```ui) y `public/js/llm/genui.js` con Card, Metric, Table, Steps, List, Question y Pedir. El chat de la pantalla de Strategy ya no se llegaba a abrir (las rutas `#/ws/…` llevan a la página del área); si esa pantalla vuelve, abre el modo Strategy del Chat con ese cliente. Las tarjetas de los trabajos conservan su diseño propio (`.lres`, `.lpr`). Falta borrar el código viejo de `screens/strategy.js` (F7).

### Decisiones del builder (Claude), para revisar
- El contexto del Chat entra como **input** del trabajo (citable, recortado) y no como historial completo: cabe en 32k y deja rastro de qué vio el agente.
- `@` solo ofrece agentes **activos**; uno en borrador o en pausa no se puede llamar.
- La conversación sigue siendo de una persona; los trabajos y sus aprobaciones son del equipo (como hoy).
- **Control del CEO y del COO (decidido por el CEO):** desde la pestaña de un trabajo (o el portal → Trabajos) pueden abrir **la conversación ligada en solo lectura**, con una franja arriba que dice de quién es, qué cliente y qué proyecto. No escriben ahí: si quieren aportar, lo hacen desde su Chat con `@agente`. Esas conversaciones **no aparecen en su lista del Chat** (para que no haya bulla); solo se llega desde el trabajo. Ruta nueva `GET chat/sesiones/:id/lectura` (solo CEO/COO, solo si la sesión está ligada a un trabajo que pueden ver con `ver()`); cada lectura queda en el registro.
- Quién aprueba no cambia (CEO o COO; gates 🚦 solo el CEO).
- **Si el modo del Chat no tiene cliente y el workflow lo pide**, `@agente` muestra una tarjeta «¿Para qué cliente?» con los del alcance de la persona (`scoper`); nunca se adivina del texto.
- **El contexto `i-chat` se renueva en cada etapa** al encolarla (lo último hablado, recortado); cada versión queda en el input con su fecha, para saber qué vio cada etapa.
- **Fallas:** 1 reintento automático; a la 2.ª falla seguida la etapa se detiene (estado `detenida`, contador `fallas`) y avisa en el Chat con «Reintentar».
- **Las conversaciones viejas del chat de F4** se ven dentro de la pestaña del trabajo como «Conversación anterior» (solo lectura). No son una segunda conversación viva.
- **Orden de despliegue:** primero la pantalla y después el trabajador. El trabajador `f4-5` solo pregunta o pide aporte en trabajos con `run.chat` (los que nacen en el Chat, que solo existen con la Entrega 1). Así, un trabajo viejo nunca queda en `pregunta` sin dónde responder. Se prueba con el trabajador temporal de staging (§15).

## 21 · F4.6 · El agente sabe y se revisa (2026-11-04)

Sale de comparar lo construido con Mastra. **El principio (del CEO):** todo debe tener poca fricción y cumplir calidad y conciencia. Si el proceso pesa o no se entiende, la gente lo deja y se lo entrega a la inteligencia.

### Decisiones
1. **Lo revisa primero una máquina.** Un revisor separado evalúa cada entrega contra sus criterios (rúbrica) y la regresa al agente con lo que faltó. La persona no recibe lo que no pasó.
2. **La conciencia es decidir poco, pero de verdad.** Las etapas intermedias se aprueban con una decisión corta en el Chat: qué propone, la alternativa, qué asumió. Se puede elegir, corregir o abrir el documento.
3. **La lectura completa sigue obligatoria** en la entrega final y al pasar el trabajo a otro agente. Esto cambia §20.6 solo para las etapas intermedias, y entra con la Entrega 2.
4. **Las skills se aplican como están.** Tienen método, pero se revisarán a conciencia en una parte del proceso (`PENDIENTES.md`).
5. **El supervisor planea el trabajo:** propone quién trabaja, en qué orden y de qué forma (secuencia, paralelo o council) en la tarjeta «Así lo voy a trabajar». La persona la cambia o la confirma y cada paso entre agentes sigue siendo un gate. El council queda para decisiones importantes.
6. **La mejora sale de lo que hace el equipo:** ajustes, rechazos y correcciones. Un proceso encuentra patrones, propone el cambio, lo prueba contra casos anteriores y una persona lo aprueba. Nada cambia solo.

### Entregas (cada una con su PR, probada en staging)
1. **El agente sabe:** cada etapa recibe los principios y la skill que declara, y el Chat y las etapas saben qué trabaja el equipo.
2. **Calidad sin fricción:** revisor con rúbrica y tarjetas de decisión.
3. **Supervisor:** plan con varios agentes, handoff, paralelo y council.
4. **Memoria y ciclo de mejora.**
5. **Tablero** estilo Factory: Encargo → Diagnóstico → Plan → Producción → Revisión → Entrega.

### Entrega 1 · reglas
- **Skills bajo demanda:** solo entra la skill que la etapa declara en `metodo` (máximo 2 y 12,000 caracteres cada una), nunca todas. El trabajador se la pide al OS al tomar la etapa (D13: el OS sigue sin llamar al VPS) y la skill no se guarda en el trabajo.
- **Conocimiento:** además entra `inherent/00-PRINCIPIOS.md`. Es una lista cerrada: `06-ECONOMIA.md` nunca entra.
- **«El equipo hoy» en el Chat:** el OS lo agrega al turno con lo que esa persona puede ver (`ver`, `scoper`, `seesTask`).
- **«El equipo hoy» en una etapa:** solo trabajos y tareas de proyecto del mismo cliente. Sin cliente, solo trabajos sin cliente. Lo personal nunca entra. Es un dato, no una instrucción.
- Si el OS no responde, la etapa sigue y avisa: el conocimiento ayuda, pero no detiene el trabajo.
