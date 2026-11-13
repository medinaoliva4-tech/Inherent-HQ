# Inherent HQ

**El cerebro operativo de Inherent.** Acá vive lo que la empresa sabe, quién lo ejecuta y para
quién. **Se opera directo desde Claude Code**, contra este repo — sin servidores ni hosting.

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
| **Su propia entrega** | Cada agente entrega algo distinto, y su formato vive en su workflow. Lo único igual: **el CEO aprueba antes de que algo salga** |
| **Qué entrega según el nivel** | Cada ficha dice qué le toca en Brand Foundation, Brand Growth y Growth Partnership. **El alcance contratado (la ficha de oferta) es el techo, no una sugerencia** |

> 🔑 **Un agente que pregunta todo no ahorra nada.** Tienen que trabajar entre autónomos y
> dirigidos: **levantan excepciones, no preguntas.**

---

## El pipeline

**Nueve áreas, de la información cruda a la pieza publicada.** Cada agente es una etapa —
el detalle está en `inherent/05-OPERACION.md`, y el roster con lo que cada uno puede hacer en
`agents/README.md`.

| # | Agente | Qué produce | Orquestador |
|---|---|---|---|
| **00** | [**Account**](agents/00-account/) | La relación con el cliente. **El único que le habla** | — *(vive en WhatsApp)* |
| **01** | [**Strategy**](agents/01-strategy/) | Producto → cliente ideal (ICP) → dolores, deseos e historia → adquisición → brief | `/strategy` |
| **02** | [Branding](agents/02-branding/) | Territorio, voz y sistema visual; valida piezas y claims | `/branding` |
| **03** | [Marketing y Creative](agents/03-marketing-creative/) | Radar, pilares × ángulos, campañas con su copy, ideas y piezas | `/marketing-creative` |
| **04** | [Producción](agents/04-production/) | Pre: jornada, guiones, shot list, permisos, compras · Post: primer corte y derivadas | `/produccion` |
| **05** | [Diseño gráfico](agents/05-graphic-design/) | Borradores de carruseles, posts y stories en Figma, y sus assets | `/graphic-design` |
| **06** | [Community](agents/06-community/) | Comentarios y mensajes atendidos | `/community` |
| **07** | [Posting](agents/07-posting/) | Lo aprobado, programado y publicado | `/posting` |
| **08** | [Ads](agents/08-ads/) | La pauta corriendo y medida | `/ads` |
| ↻ | [Resultados](agents/_comun/skills/resultados/) | El cierre del mes que vuelve a Strategy y al ICP | `/resultados` |

🧭 **La puerta de entrada es `/inherent`** (`agents/_router/`): lee el pedido y lo pasa al orquestador que toca.

🔑 **El QA no es un agente aparte:** cada departamento se auto-revisa antes de su gate, y
**② Branding valida con `br-guardian`** antes de que nada se publique.

---

## Cómo se arranca una sesión

1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `brain/WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
3. **Identificá el cliente.** Un cliente = un folder en `clients/`, con su `CLAUDE.md` como router. Nunca mezclar dos.
4. Seguí el workflow. Las skills se invocan donde el workflow lo indica.

**`CLAUDE.md` es la entrada.** Se lee solo al empezar cualquier sesión.

---

## Las reglas que no se rompen

| | |
|---|---|
| **Gate humano** | El agente propone, **no cierra**. El CEO decide |
| **Nada destructivo sin autorización** | No publicar, no pautar, no enviar al cliente, no borrar |
| **Evidencia o etiqueta** | Sin fuente va como `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS`. **Nunca inventar** |
| **Sin MCP no hay promesa** | Lo que no está en «Capacidades reales» de `inherent/06-ECONOMIA.md` no se vende |
| **La web manda** | Lo publicado es la promesa. El repo no promete menos, más ni distinto |
