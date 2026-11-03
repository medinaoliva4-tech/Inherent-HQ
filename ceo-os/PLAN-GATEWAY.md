# PLAN-GATEWAY — el puente entre Inherent OS y los motores de IA

**Estado:** propuesto, pendiente del OK del CEO. Nada de esto está construido todavía.
**Para qué sirve este archivo:** es la fuente de verdad del plan. Antes de trabajar en cualquier cosa del Gateway se lee, y todo cambio de rumbo se anota aquí (sección 11) en vez de resolverse de palabra.

> **Qué es y qué no es.** El Gateway no inventa nada nuevo: **organiza y pone en un solo lugar lo que Inherent ya usa** (el chat con modos, Agent Area, el conector MCP, el repo como conocimiento). No reemplaza el OS ni los workflows; reemplaza **Hermes en la compu de cada persona** por un puente central en el VPS.

---

## 1 · Decisiones tomadas

| # | Decisión | Por qué |
|---|---|---|
| D1 | **Todo corre en un VPS (Contabo)**, no en la compu de cada persona | Un solo lugar para llaves, presupuestos, logs, memoria y colas. Nadie depende de tener su Mac encendida |
| D2 | **Un solo puente (Agent Gateway)**; los motores son enchufables detrás de él | Evita las muchas rutas (Hermes, puente claude.ai, Simulado, chat con Claude Code) |
| D3 | Motor base: **OpenCode** (sustituye a Hermes) | Más consolidado y sencillo; habla con cualquier proveedor. **Sujeto al spike de la Fase 1** |
| D4 | Segundo motor: **Claude Code con Opus 5.5**, para video y diseño | Ya funciona bien en esos flujos; no se cambia lo que funciona por teoría |
| D5 | **LiteLLM** como capa de proveedores | Featherless, NVIDIA, frontier por API; llaves virtuales y presupuesto por persona y por cliente |
| D6 | **La memoria vive en la base de datos del OS**, no en el motor | El contexto de un motor es desechable; el trabajo no se pierde |
| D7 | **El usuario ve un solo hilo por Trabajo**; el Gateway rota las sesiones por debajo | El contexto de Featherless es limitado, pero la experiencia es continua |
| D8 | **MCP por persona, con su propia autenticación** | Cada quien conecta lo que necesita; nadie depende de que el CEO conecte todo |
| D9 | En el VPS, el motor premium usa **API key de la empresa**, no la suscripción de nadie | Términos de uso de los proveedores |
| D10 | Frontend: se mejora el chat actual con **componentes de código abierto** para la UI interactiva, sin rehacerlo | Reusar estructuras ya hechas |

## 2 · La estructura

```
Inherent OS (Vercel)
 chat con modos · Agent Area · conector MCP
          │  una sola API (token + login del OS)
          ▼
AGENT GATEWAY (VPS)
 · cola y candado por Trabajo        · memoria y resúmenes (en la base del OS)
 · permisos por rol y por cliente    · rotación de sesiones
 · regla de la ficha de oferta       · costos por cliente
          │
   ┌──────┴───────┐
   ▼              ▼
 OpenCode     Claude Code (Agent SDK)
 (abiertos,   (video, diseño, tareas
  volumen)     premium)
   └──────┬───────┘
          ▼
       LiteLLM ──► Featherless · NVIDIA · Anthropic · OpenAI · OpenRouter
```

El OS **nunca habla con un motor**: le pide al Gateway «corre esto, en este modo, para este cliente». Cambiar de motor o de modelo no toca el OS.

## 3 · La memoria: tres capas

| Capa | Qué guarda | Dónde | Quién escribe |
|---|---|---|---|
| **Conocimiento de la empresa** | Principios, método, ofertas, fichas, clientes | Repo Inherent-HQ | Solo personas, con PR. Los agentes **leen** |
| **Estado del trabajo** | Trabajos, hilos, resúmenes, decisiones, `agent_runs`, artefactos | Base de datos del OS (Neon) | El Gateway y el OS |
| **Contexto de una corrida** | La sesión del motor | Disco del VPS | El motor. **Desechable** |

**Regla:** si se pierde la capa 3, se reconstruye desde la 2. Nada importante vive solo en una sesión.

## 4 · Contexto limitado y sesiones

Un **Trabajo** es un hilo continuo para el usuario. Por debajo:

1. El Gateway mide cuánto contexto lleva la sesión.
2. Al acercarse al límite del modelo (Featherless: 262k según el catálogo; **por verificar el límite efectivo por modelo**), genera un **resumen de traspaso** (decisiones, pendientes, archivos tocados, estado de cada etapa) y lo guarda en la base.
3. Abre una sesión nueva e inyecta ese resumen.
4. La pantalla muestra un solo hilo, con el historial por segmentos desplegable.

Se usa la compactación automática de OpenCode como primera línea, y el resumen de traspaso del Gateway como red de seguridad. **Por verificar:** los nombres de configuración cambian entre versiones de la documentación de OpenCode; se confirman contra la versión instalada.

## 5 · Que no choquen las llamadas

- **Un candado por Trabajo:** una corrida activa a la vez; el resto, en cola.
- **Una carpeta aislada por workspace y cliente.** Regla del pipeline: *un cliente por sesión, nunca se mezclan dos*.
- **Llaves virtuales de LiteLLM** por persona y por cliente, con presupuesto.
- **Featherless es un cuello de botella** (límite de cambios de modelo por minuto y de concurrencia del plan, ya observados): cada flujo fija un modelo y las corridas entran en cola.
- OpenCode trae una sola credencial para todo el servidor **[por verificar]**, así que **el control de quién puede qué vive en el Gateway y en el OS**, nunca en el motor.

## 6 · MCP

- Se conserva el **conector MCP de Inherent OS** (OAuth por persona, permisos por rol).
- El Gateway entrega a cada corrida **solo los MCP que el perfil permite**; cada persona conecta los suyos.
- **Composio** entra como un MCP más para apps externas, evaluado contra lo que ya hay (Zernio, Apify, Windsor).

## 7 · Figma y video

- **Figwright** es un MCP local (`@figwright/mcp`) que necesita el plugin abierto en Figma. Cualquier motor con MCP puede usarlo. **Pendiente de probar:** cómo se comunica el plugin con el servidor; si es solo local, no llega al VPS y hará falta un túnel o correr esa parte en la Mac del diseñador.
- **Video y diseño** corren por Claude Code (Opus 5.5) detrás del mismo Gateway.

## 8 · Cómo el flujo de trabajo gana eficiencia y revenue

El Gateway es un buen lugar para que **las promesas de inherentglobal.com se cumplan por construcción**, no por disciplina. Propuestas, de mayor a menor impacto:

| # | Conexión | Qué hace | Por qué importa |
|---|---|---|---|
| W1 | **La ficha como contrato ejecutable** | El Gateway rechaza corridas fuera del techo de la ficha (nivel, áreas, volumen, rondas). Hoy cada agente lo respeta por convención | «Entregar de más rompe el margen, de menos rompe la promesa» se vuelve una regla en código |
| W2 | **Costo real por cliente y por ciclo** | Una llave virtual por cliente da el gasto de IA real; se compara con el rubro de Herramientas/IA de `06-ECONOMIA.md` y avisa si el margen se acerca al piso | Margen visible mes a mes, sin hojas de cálculo |
| W3 | **Modelo por etapa** | Modelos baratos para volumen (captions, derivadas, triage de comunidad); fuertes para Strategy, Branding y guiones; Claude Code para video y diseño. Tabla inicial en la sección 9 | Baja el costo sin bajar la calidad donde importa |
| W4 | **El calendario del ciclo como programador** | Días 1–20, con el 11 y el 20 como límites duros: el Gateway agenda las etapas en su ventana y avisa de atrasos (por ejemplo, si a dos días del 11 no hay guiones aprobados) | «Ningún agente corre fuera de su ventana» se cumple solo |
| W5 | **Calidad medible** | Tasa de aprobación a la primera contra `08-CRITERIOS-DE-ACEPTACION` y rondas usadas vs. las de la ficha | Muestra dónde se pierde margen por retrabajo |
| W6 | **Una sola bandeja de gates** | «¿Qué necesita de mí?» de Agent Area, con avisos al celular, para CEO y COO | El CEO solo dirige: ve únicamente lo que requiere su gate |
| W7 | **Señales de subida de nivel** | Con las métricas de la revisión del día 20, Growth propone con evidencia el paso Foundation → Growth → Partnership o módulos aparte (pauta, producción especial) | Revenue desde lo que ya se mide. **Siempre sin prometer resultados garantizados** |
| W8 | **Onboarding automático** | Cliente nuevo → carpeta de cliente, `plan-contratado` desde la propuesta y arranque de la Estrategia guiada (7 etapas) | Activar una cuenta en horas, no días |
| W9 | **`00-account` (WhatsApp) en el mismo Gateway** | Hoy corre aparte en el VPS; compartiría la memoria del cliente y escalaría directo a Agent Area | Un solo cerebro por cliente |

## 9 · Modelo por etapa (borrador, se valida en el spike)

| Etapas | Motor | Modelo inicial | Nota |
|---|---|---|---|
| 01 Strategy · 01.2 Branding · 02 Growth | OpenCode | Kimi K3 o DeepSeek V4 Pro | Razonamiento largo; medir contra Claude |
| 03 Marketing · 04 Creative | OpenCode | Kimi K3 / GLM 5.3 | Comparar calidad de ideas |
| 06 Graphic Design | Claude Code | Opus 5.5 | Con Figma (Figwright), si la prueba funciona |
| 07 Video Editing | Claude Code | Opus 5.5 | Ya funciona hoy |
| 08 Community · 09 Posting | OpenCode | DeepSeek V4 Flash | Volumen alto, tarea acotada |
| 10 Ads | OpenCode | Por definir | Nunca escribe en las plataformas; gate humano |

Esta tabla es una hipótesis, no un resultado medido.

## 10 · Fases

Cada fase termina con algo que se puede probar. No se empieza una sin cerrar la anterior.

| Fase | Qué se hace | Hecho cuando |
|---|---|---|
| **F0 · Piso firme** | Cerrar el PR #207 (Agent Area); filtrar notas y runs por cliente asignado; base de pruebas separada de producción; decidir el OS oficial | Nadie ve datos de clientes que no le tocan, y las pruebas no tocan producción |
| **F1 · Spike (2–3 días)** | OpenCode en el VPS con LiteLLM y Kimi K3; probar un flujo real de Strategy; comparar con Claude Code; probar Figwright desde el VPS | Hay datos medidos de calidad, uso de herramientas y contexto largo; D3 y D4 quedan confirmadas o corregidas |
| **F2 · Gateway mínimo** | API, cola, candados, memoria en la base, rotación de sesiones; un solo motor | Una corrida completa de punta a punta sin intervención manual |
| **F3 · Conectar el OS** | El chat y los modos hablan con el Gateway; apagar Hermes | Todos los modos funcionan sin Hermes |
| **F4 · Agent Area en el Gateway** | Los `agent_runs` corren en el servidor | Una etapa completa se ejecuta con la compu apagada |
| **F5 · Segundo motor y Figma** | Claude Code detrás del Gateway; ruta de Figwright | El flujo de video corre desde el Gateway |
| **F6 · Artefactos y flujo** | Reconectar las herramientas escondidas como artefactos de cada modo; W1–W9 por orden de impacto | El chat y la herramienta muestran lo mismo |
| **F7 · Limpieza** | Actualizar `CLAUDE.md`, `MAPA.md` y este archivo; retirar Hermes del instalador | Las reglas del repo dicen lo que es cierto |

## 11 · Registro de cambios de rumbo

| Fecha | Cambio | Quién |
|---|---|---|
| 2026-11-03 | Primer borrador | CEO + Claude |

## 12 · Por verificar antes de construir

- Límite efectivo de salida y de contexto por modelo en Featherless (hoy: 32,768 de salida para Kimi K3).
- Cómo llega el OS (Vercel) al Gateway: subdominio HTTPS con token y límite de peticiones, o un túnel con control de acceso. Vercel no entra a una red privada.
- Si el VPS de Contabo alcanza: más de un agente a la vez necesita más que 1 vCPU.
- Términos de uso de cada proveedor si alguien conecta su suscripción personal.
- Cuál es el OS oficial entre `inherent-work` y `inherente-os-app`.
