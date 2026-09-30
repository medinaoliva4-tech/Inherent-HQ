# Los agentes

**Un agente por etapa del pipeline.** Cada uno tiene la misma anatomía.

```
agents/<área>/
├── README.md              qué hace, qué acciones tiene y qué le falta
└── brain/
    ├── WORKFLOW.md        cómo trabaja el agente, de 0 a 100
    └── skills/
        ├── README.md      cuándo y cómo usa cada skill
        └── <skill>/SKILL.md

agents/_compartido/        lo que usan todos — client-delivery
```

> **`brain/` es el agente.** Todo lo que define cómo piensa y trabaja vive ahí dentro.
> El `README.md` de cada área es la ficha; el `brain/` es el cerebro.

---

## El roster

> **La acción la determina el MCP.** Un agente sin MCP es un documento, no un agente.
> **Cada ficha dice qué puede hacer, con qué y qué le falta.**

| # | Etapa | Agente | Estado | Qué le falta |
|---|---|---|---|---|
| 01 · 02 · ↻ | Comprensión, estrategia y revisión del 20 | [**Strategy**](strategy/) | ✅ **construido** | Correrlo con un cliente real |
| 02B | Branding | [Branding](branding/) | 🟡 el brief existe | El agente |
| 03 | Marketing | [Marketing](marketing/) | ⬜ | Todo |
| 04 | Creatividad | [Creative](creative/) | ⬜ | Todo |
| 05 | Producción | [Production](production/) | ⬜ | Todo |
| 06 | Diseño gráfico | [Design](design/) | ⬜ | Todo |
| **07** | **QA** | [**QA**](qa/) | 🔴 **bloqueador** | **Su MCP — no está definido** |
| 08 | Posting | [Content](content/) | 🟡 tiene acciones | El cerebro |
| 09 | Ads | [Growth](growth/) | 🟡 tiene acciones | El cerebro |
| 10 | Community | [Community](community/) | ⬜ | Todo |

🔴 **QA es el primero a construir**, y **antes de escribirlo hay que decidir con qué revisa.**
A 204 piezas al mes el QA humano no escala.

**La cadena de entrega completa está en `inherent/05-OPERACION.md`.**

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿el agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |

---

## Cómo se construye uno

1. **`README.md` del área** — propósito, las acciones con su MCP, y qué falta.
2. **`brain/WORKFLOW.md`** — el proceso de 0 a 100, con los gates humanos marcados y una sección
   de **lo que este agente NO hace**.
3. **`brain/skills/README.md`** — cuándo se invoca cada skill dentro del workflow.
4. **Una carpeta por skill**, con su `SKILL.md`.
5. **Enlazarla** en `.claude/skills/` para que se pueda invocar por nombre.
6. **Cerrar con `client-delivery`** — todos entregan con el mismo formato.
