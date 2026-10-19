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

## Las 9 capas, en orden del flujo

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`mk-encargo`** | 0 | *«arrancá el ciclo»*, *«cuántas piezas podemos»* | § El encargo — el techo de la ficha y la capacidad real |
| 2 | **`mk-campana`** | 1 | *«qué campaña corremos»* | § Idea de campaña — una frase que el equipo repite |
| 3 | **`mk-mensaje`** | 2 | *«qué decimos primero»* | § Jerarquía de mensaje |
| 4 | **`mk-pilares`** | 3 | *«qué pilares»*, *«el sistema de contenido»* | § Sistema de contenido — pilares con su peso |
| 5 | **`mk-canales`** | 4 | *«qué hace cada canal»* | `plan-por-canal.md` — función única y qué NO va ahí |
| 5B | **`mk-busqueda`** | 4B | *«SEO»*, *«GEO»*, *«que nos encuentren en Google»*, *«Google Business»* — **solo si el área 4 de la ficha incluye búsqueda o Google** · Brand Growth y Growth Partnership | `plan-de-busqueda.md` — qué busca la gente, Google Business, GEO y slots con tema de búsqueda. **Sin SEO técnico** |
| 5C | **`mk-podcast`** | 4C | *«hagamos un podcast»*, *«clips del podcast»* — **solo si la ficha lo incluye** · Brand Growth y Growth Partnership | La ficha del canal podcast en `plan-por-canal.md` · el episodio *(MOF)* y sus clips *(TOF)* como slots |
| 6 | **`mk-calendario`** | 5 | *«armá el calendario»* | **`calendario.csv`** |
| 7 | **`mk-loop`** | 6 | *«qué rindió»*, la revisión del 20 | `aprendizaje-de-marketing.md` |

---

## El orden no se salta

**Cada capa consume la anterior.** Si falta el input de una, **se corre la anterior** — nunca se
improvisa el faltante.

## Sin paradas entre capas

**Cada capa cierra con su checklist y sigue.** No hay gates entre capas: el control de calidad lo
hace el CEO en persona. Ver `../WORKFLOW.md` §4.
