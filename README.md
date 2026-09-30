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
| **Entrega estándar** | Todos cierran con la misma skill compartida: documento al cliente + folder expandido |

> 🔑 **Un agente que pregunta todo no ahorra nada.** Tienen que trabajar entre autónomos y
> dirigidos: **levantan excepciones, no preguntas.**

---

## El pipeline

**Doce etapas, de la información cruda a la pieza publicada.** Cada agente es una etapa —
el detalle está en `inherent/05-OPERACION.md`, y el roster con lo que cada uno puede hacer en
`agents/README.md`.

| # | Etapa | Agente | Estado |
|---|---|---|---|
| 01 · 02 | Comprensión y estrategia | **Strategy** | ✅ |
| 02B | Branding | Branding | 🟡 brief listo |
| 03 | Marketing | Marketing | ⬜ |
| 04 | Creatividad | Creative | ⬜ |
| 05 | Producción | Production | ⬜ |
| 06 | Diseño gráfico | Design | ⬜ |
| **07** | **QA** | **QA** | 🔴 **bloqueador** |
| 08 | Posting | Content | 🟡 tools sí |
| 09 | Ads | Growth | 🟡 tools sí |
| 10 | Community | Community | ⬜ |
| ↻ | Revisión del 20 | **Strategy** | ✅ |

🔴 **QA es el primero a construir.** A 204 piezas al mes el QA humano no escala, y sin él el
volumen prometido no es entregable.

---

## Cómo se arranca una sesión

1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `brain/WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
3. **Identificá el cliente.** Un cliente = un folder en `clients/`. Nunca mezclar dos.
4. Seguí el workflow. Las skills se invocan donde el workflow lo indica.

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
