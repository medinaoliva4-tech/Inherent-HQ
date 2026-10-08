# Inherent HQ

**El cerebro operativo de Inherent.** Acá vive lo que la empresa sabe, quién lo ejecuta y para
quién. **Se opera directo desde Claude Code**, contra este repo — sin servidores ni hosting.

```
inherent/    qué somos       la empresa: identidad, método, oferta, mercado, operación, economía
pipelines/   quién lo hace   un pipeline; cada paso es un departamento con sus agentes
clients/     para quién      un folder por cliente
```

---

## Qué es un agente acá

**No es un prompt.** Es una unidad de trabajo con tres capas, y las tres tienen que existir para
que el agente sirva. El paso del pipeline donde trabaja le suma una cuarta: el artifact.

```
PROPÓSITO   el panorama y la meta del agente. La de su paso del pipeline.
    │       Strategy: la estrategia. Creative: las ideas.
    ▼
ACCIONES    lo que el agente PUEDE HACER. Las determinan los MCPs.
    │       La CALIDAD del MCP es la CALIDAD de la acción.
    ▼
LÓGICA      CÓMO hace esas cosas. Son las skills.
    │       El razonamiento y el método detrás de cada acción.
    ▼
ARTIFACT    DÓNDE se ve el resultado. La herramienta visual del equipo,
            una por paso del pipeline.
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
| **Un workflow de 0 a 100** | `README.md`. Cada paso, qué lo dispara, qué entrega, dónde está el gate humano |
| **Skills que son método, no instrucciones** | Cada una responde una pregunta del trabajo real y produce un entregable nombrado |
| **Límites declarados** | Lo que el agente **no** hace está escrito, para que no lo intente |
| **Correlación con el resto** | De quién recibe y a quién entrega, en la cadena de doce etapas |
| **Su propia entrega** | Cada agente entrega algo distinto, y su formato vive en su workflow. Lo único igual: **el CEO aprueba antes de que algo salga** |
| **Qué entrega según el plan** | Cada ficha dice qué le toca en Marketing, Marketing Pro, Accelerate y Compound. **El plan es el techo, no una sugerencia** |

> 🔑 **Un agente que pregunta todo no ahorra nada.** Tienen que trabajar entre autónomos y
> dirigidos: **levantan excepciones, no preguntas.**

---

## El pipeline de contenido

**Seis pasos. Cada paso es un departamento, y cada departamento tiene sus agentes.** El mapa
completo está en [`pipelines/contenido/README.md`](pipelines/contenido/README.md).

| Paso | Propósito | Agentes |
|---|---|---|
| **01 · Understand** | Comprender el negocio, sus clientes, sus objetivos y su situación actual | [Strategy](pipelines/contenido/02-strategize/strategy/) |
| **02 · Strategize** | Definir cómo crecer, atraer atención y convertirla en ingresos | [Strategy](pipelines/contenido/02-strategize/strategy/) · [Branding](pipelines/contenido/02-strategize/branding/) · [Growth](pipelines/contenido/02-strategize/growth/) · [Marketing](pipelines/contenido/02-strategize/marketing/) |
| **03 · Research** | Investigar audiencias, competidores, referentes, tendencias y contenido ganador | [Research](pipelines/contenido/03-research/research/) |
| **04 · Create** | Transformar datos y oportunidades en pilares, formatos, hooks, guiones y contenido | [Creative](pipelines/contenido/04-create/creative/) · [Production](pipelines/contenido/04-create/production/) · [Graphic Design](pipelines/contenido/04-create/graphic-design/) · [Video Editing](pipelines/contenido/04-create/video-editing/) |
| **05 · Convert** | Distribuir el contenido y conectar la atención con adquisición y ventas | [Posting](pipelines/contenido/05-convert/posting/) · [Ads Management](pipelines/contenido/05-convert/ads-management/) · [Community Management](pipelines/contenido/05-convert/community-management/) |
| **06 · Optimize** | Medir resultados, aprender, encontrar nuevos ganadores y ajustar el roadmap | [Performance](pipelines/contenido/06-optimize/performance/) |

[**Account Manager**](pipelines/00-account/) vive fuera del pipeline: es la relación con el cliente y
**el único que le habla**.

🔑 **El QA no es un agente aparte:** cada departamento se auto-revisa antes de su gate, y
**Branding valida con `br-guardian`** antes de que nada se publique.

---

## Cómo se arranca una sesión

1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `README.md` completo.** Es la única fuente de cómo trabaja.
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
