# Las skills de ③ Marketing — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden; acá está el
detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill. Todo el departamento en un solo lugar:
`agents/03-marketing/brain/`.

> **Cómo cargan:** cada carpeta de skill está **enlazada** en `.claude/skills/` de la raíz del
> repo (`.claude/skills/mk-campana` → `agents/03-marketing/brain/skills/mk-campana`). Es un
> enlace, no una copia: lo que se edita acá es lo que corre.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.**

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`marketing`** | La puerta de entrada. Lee el pedido, decide qué capas correr, verifica el pre-flight y llama a las demás en orden. **Si no sabés cuál usar, es esta.** |

## Las 7 capas, en orden del flujo

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`mk-encargo`** | 0 | *«arrancá el ciclo»*, *«cuántas piezas podemos»* | § El encargo — el techo del plan y la capacidad real |
| 2 | **`mk-campana`** | 1 | *«qué campaña corremos»* | § Idea de campaña — una frase que el equipo repite |
| 3 | **`mk-mensaje`** | 2 | *«qué decimos primero»* | § Jerarquía de mensaje · **🚦 GATE 1** |
| 4 | **`mk-pilares`** | 3 | *«qué pilares»*, *«el sistema de contenido»* | § Sistema de contenido — pilares con su peso |
| 5 | **`mk-canales`** | 4 | *«qué hace cada canal»* | `plan-por-canal.md` — función única y qué NO va ahí |
| 6 | **`mk-calendario`** | 5 | *«armá el calendario»* | **`calendario.csv`** · **🚦 GATE 2** |
| 7 | **`mk-loop`** | 6 | *«qué rindió»*, la revisión del 20 | `aprendizaje-de-marketing.md` |

---

## El orden no se salta

**Cada capa consume la anterior.** Si falta el input de una, **se corre la anterior** — nunca se
improvisa el faltante.

## Los dos gates

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `mk-mensaje` | La campaña y la jerarquía de mensaje |
| **GATE 2** | `mk-calendario` | El calendario completo |

**El agente propone, no cierra.**
