# Las skills de ⑥A Diseño gráfico — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden; acá está el
detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill: `agents/06-graphic-design/brain/`.

> **Cómo cargan:** cada carpeta está **enlazada** en `.claude/skills/` de la raíz del repo.
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.**

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`graphic-design`** | La puerta de entrada. **Si no sabés cuál usar, es esta.** |

## Las 6 capas, en orden del flujo

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`gd-recepcion`** | 0 | *«¿llegó todo?»*, *«qué nos falta»* | Filas base + la agrupación por formato |
| 2 | **`gd-plantillas`** | 1 | *«las plantillas del mes»*, *«esto no escala»* | El set de plantillas · **🚦 GATE 1** |
| 3 | **`gd-imagen`** | 2 | *«de dónde sacamos la imagen»* | Las imágenes resueltas y verificadas |
| 4 | **`gd-composicion`** | 3 | *«armá este carrusel»*, *«llená las plantillas»* | Las piezas compuestas |
| 5 | **`gd-export`** | 4 | *«exportá el paquete»* | Archivos finales + manifiesto · **🚦 GATE 2** |
| 6 | **`gd-loop`** | 5 | La revisión del 20 | `aprendizaje-de-diseno.md` |

---

## La regla que hace viable el departamento

🛑 **168 piezas no se diseñan una por una.** Se arma el sistema de plantillas, se aprueba el
molde en el GATE 1, y las piezas son ejecución.

**Si una pieza pide una decisión nueva en la Capa 3, la plantilla está mal.**

## Los dos gates

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `gd-plantillas` | **Las plantillas** — no las 168 piezas |
| **GATE 2** | `gd-export` | El paquete completo |
