# Inherent HQ

**El cerebro operativo de Inherent.** Acá vive lo que la empresa sabe, quién lo ejecuta y para
quién. Se le habla desde **Buzz**, por una sesión de Claude Code.

```
inherent/    qué somos       la empresa: identidad, método, oferta, mercado, operación, economía
agents/      quién lo hace   un agente por etapa del pipeline
clients/     para quién      un folder por cliente
```

---

## Qué es un agente acá

**No es un prompt.** Es una unidad de trabajo con tres capas, y las tres tienen que existir para
que el agente sirva.

```
PROPÓSITO   el panorama y la meta del agente. Su área.
    │       Strategy: la estrategia. Creative: las ideas.
    ▼
ACCIONES    lo que el agente PUEDE HACER. Las determinan los MCPs.
    │       La CALIDAD del MCP es la CALIDAD de la acción.
    ▼
LÓGICA      CÓMO hace esas cosas. Son las skills.
            El razonamiento y el método detrás de cada acción.
```

### Las tres consecuencias

| | |
|---|---|
| **1** | **Un agente no puede hacer nada que su MCP no permita.** Si falta la acción, falta un MCP — no se arregla con mejor prompt |
| **2** | **Un MCP flojo produce acciones flojas**, por más buena que sea la lógica |
| **3** | **Una skill no es una acción, es una lógica.** Define cómo se usa lo que el MCP entrega |

---

## Qué tan profundo va un agente

**Strategy es la referencia — así de completo tiene que quedar cada uno.**

| | |
|---|---|
| **Un workflow de 0 a 100** | `brain/WORKFLOW.md`. Cada paso, qué lo dispara, qué entrega, dónde está el gate humano |
| **Skills que son método, no instrucciones** | Cada una responde una pregunta del trabajo real y produce un entregable nombrado |
| **Límites declarados** | Lo que el agente **no** hace está escrito, para que no lo intente |
| **Correlación con el resto** | De quién recibe y a quién entrega, en la cadena de doce etapas |
| **Su propia entrega** | Cada agente entrega algo distinto, y su formato vive en su workflow. Lo único igual: **Allan aprueba antes de que algo salga** |
| **Qué entrega según el plan** | Cada ficha dice qué le toca en Ignite, Accelerate y Compound. **El plan es el techo, no una sugerencia** |

> 🔑 **Un agente que pregunta todo no ahorra nada.** Tienen que trabajar entre autónomos y
> dirigidos: **levantan excepciones, no preguntas.**

---

## El pipeline

**Doce etapas, de la información cruda a la pieza publicada.** Cada agente es una etapa —
el detalle está en `inherent/05-OPERACION.md`, y el roster con lo que cada uno puede hacer en
`agents/README.md`.

| # | Agente | Ficha | Brain operativo | Estado |
|---|---|---|---|---|
| **01** | Strategy | [`01-strategy/`](agents/01-strategy/) | [`strategy/`](agents/strategy/) ⚠️ dos métodos distintos | 🟡 |
| **01.2** | Branding | [`01.2-branding/`](agents/01.2-branding/) | — | ⬜ |
| **02** | Growth | [`02-growth/`](agents/02-growth/) | — | ⬜ |
| **03** | Marketing | [`03-marketing/`](agents/03-marketing/) | — | ⬜ |
| **04** | Creative | [`04-creative/`](agents/04-creative/) | [`creative/`](agents/creative/) | ✅ |
| **05** | Production | [`05-production/`](agents/05-production/) | [`production/`](agents/production/) | ✅ |
| **06** | Graphic Design | [`06-graphic-design/`](agents/06-graphic-design/) | — | ⬜ |
| **07** | Video Editing | [`07-video-editing/`](agents/07-video-editing/) | — *(en el PR #4)* | 🔵 |
| **08** | Community | [`08-community-management/`](agents/08-community-management/) | — | ⬜ |
| **09** | Posting | [`09-posting/`](agents/09-posting/) | [`posting/`](agents/posting/) | ✅ |
| **10** | Ads Management | [`10-ads-management/`](agents/10-ads-management/) | — | ⬜ |
| **—** | Comprensión | *(sin ficha numerada)* | [`comprension/`](agents/comprension/) | ✅ |
| **—** | **QA** | [`qa/`](agents/qa/) | — | 🔴 |

⚠️ **La columna «Ficha» y la columna «Brain» son dos carpetas distintas para el mismo
departamento.** Las fichas numeradas describen el alcance en una página; los brains tienen el
workflow, las skills y los entregables, y son los únicos que cargan como plugin. **Unificarlas es
trabajo pendiente y lo decide un humano** — ver `CLAUDE.md` § Estructura.

🔴 **QA es el primero a construir.** A 204 piezas al mes son **~612 revisiones** en un solo
cliente Compound. Sin él, el volumen prometido no es entregable.

---

## Cómo se arranca una sesión

1. 🛑 **Abrí la sesión en la raíz del repo, nunca en una subcarpeta.** Los plugins se instalan con
   *project scope* y ese scope queda atado a la carpeta exacta desde la que arrancaste. Comprobalo
   con `pwd`.
2. **Identificá el departamento** que corresponde al pedido e invocá su skill orquestadora
   (`comprension:comprension`, `creatividad:creatividad`, `produccion:produccion`,
   `posting:posting`, o `estrategia` para ②③).
3. **Leé su `WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
4. **Identificá el cliente.** Un cliente = una carpeta, con el mismo nombre canónico en todos los
   departamentos. Nunca mezclar dos.
5. **Declará el pre-flight** antes de producir nada.

**`CLAUDE.md` es la entrada.** Se lee solo al empezar cualquier sesión.

---

## Las reglas que no se rompen

| | |
|---|---|
| **Gate humano** | El agente propone, **no cierra**. Allan decide |
| **Nada destructivo sin autorización** | No publicar, no pautar, no enviar al cliente, no borrar |
| **Evidencia o etiqueta** | Sin fuente va como `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS`. **Nunca inventar** |
| **Sin MCP no hay promesa** | Lo que no está en «Capacidades reales» de `inherent/06-ECONOMIA.md` no se vende |
| **La web manda** | Lo publicado es la promesa. El repo no promete menos, más ni distinto |
