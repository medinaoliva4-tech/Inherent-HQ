# Los agentes

**Un agente por área, en el orden en que corre el trabajo.** La carpeta lleva el número, así que
el pipeline se lee de arriba abajo. **Cada área = 1 orquestador + 4 skills como máximo**, con un
workflow corto.

```
agents/<NN>-<área>/
├── README.md              qué hace, qué entrega según el nivel
└── brain/
    ├── WORKFLOW.md        cómo trabaja, en pasos cortos, y qué entrega
    └── skills/<skill>/SKILL.md
```

> **`brain/` es el agente.** El `README.md` es la ficha; el `brain/` es el cerebro.

---

## El pipeline

| # | Agente | Qué produce | Orquestador |
|---|---|---|---|
| **00** | [**Account**](00-account/) | La relación con el cliente. **El único que le habla** | — *(vive en WhatsApp)* |
| **01** | [**Strategy**](01-strategy/) | Producto → cliente ideal (ICP) → dolores, deseos e historia → adquisición → brief | `/strategy` |
| **02** | [Branding](02-branding/) | Territorio, voz y sistema visual; valida piezas y claims | `/branding` |
| **03** | [Marketing y Creative](03-marketing-creative/) | Radar, pilares × ángulos, campañas con su copy, ideas y piezas | `/marketing-creative` |
| **04** | [Producción](04-production/) | **Pre:** jornada, guiones, shot list, permisos, compras · **Post:** primer corte y derivadas | `/produccion` |
| **05** | [Diseño gráfico](05-graphic-design/) | Borradores de carruseles, posts y stories en Figma, y los assets que van encima con modelo de imagen | `/graphic-design` |
| **06** | [Community](06-community/) | Comentarios y mensajes atendidos | `/community` |
| **07** | [Posting](07-posting/) | Lo aprobado, programado y publicado | `/posting` |
| **08** | [Ads](08-ads/) | La pauta corriendo y medida | `/ads` |
| ↻ | [Resultados](_comun/skills/resultados/) | Un solo cierre del mes que vuelve a Strategy y al ICP | `/resultados` |

**Por qué Account es 00:** no produce nada del pipeline. Vive antes y alrededor de todo: recibe al
cliente, lo mantiene al día y abre la sesión del agente que toca.

🧭 **La puerta de entrada es `/inherent`** (`agents/_router/`): lee el pedido, imprime el
`ENRUTAMIENTO` y lo pasa al orquestador que toca.

🧩 **Lo común vive en `agents/_comun/`:** `recepcion` *(qué llegó y si alcanza para trabajar; la
corre cada área al empezar)* y `resultados` *(el cierre único del mes)*.

---

## Agente, herramienta, persona

| | Qué hace |
|---|---|
| **Agente** | Trabajo de profundidad o de volumen: investigar, ver cientos de videos, generar variantes, borradores de diseño, primer corte de video |
| **Herramienta** | Donde se ve, se decide y se escribe encima: formularios, calculadoras, tableros, hojas imprimibles. Vive en Inherent OS y se abre como artefacto en el panel del chat |
| **Persona** | Realidad, gusto y aprobación |

**El flujo:** el agente propone → la persona corrige en la herramienta → lo aprobado queda como
dato fijo. **Nada pasa de un agente a otro sin que una persona lo lea** y lo marque `aprobado`.
El CEO solo bloquea en ① Strategy y en ⑧ Ads; en lo demás aprueba el rol dueño del área.

---

## El hilo — la memoria del cliente

**Entre áreas no viajan hojas de cálculo: viajan nodos.** Cada dato importante del cliente
*(producto, icp, dolor, deseo, historia, adquisicion, pilar, angulo, campana, pieza, decision)*
es un nodo con id estable. Cada archivo que entrega un agente abre con su cabecera:

```yaml
---
id: dolor-02
cliente: <cliente>
tipo: dolor
titulo: <una línea>
estado: hipotesis        # hipotesis | aprobado
fuente: <enlace>         # o «hipótesis»
viene_de: [icp-01]
version: 1
actualizado: AAAA-MM-DD
---
```

- **Un archivo puede llevar varios nodos del mismo tipo** *(p. ej. los dolores)*: cada uno con su id
  en su título y su estado.
- **Un nodo nace `hipotesis` y solo una persona lo pasa a `aprobado`.**
- **`viene_de` es lo que conecta todo:** si cambia un nodo, se avisa a todo lo que viene de él.
- **Una pieza sin `viene_de` no se produce:** todo trabajo traza hasta un dolor o un deseo del ICP.
- El hilo vive en Inherent OS; el archivo con cabecera es el mismo nodo cuando se trabaja desde
  Claude Code.

---

## Cada agente sabe qué entrega según el nivel

**El detalle de volumen, formatos, canales y revisiones sale de la ficha de oferta del cliente**
*(`clients/<cliente>/00-onboarding/plan-contratado.md`)*, no de este manual. **La ficha es el
techo, no una sugerencia. Sin ficha, el agente bloquea ese cliente.**

| Nivel | Áreas que pueden correr |
|---|---|
| **Brand Foundation** | ① Strategy y ② Branding como núcleo · ③ Marketing y Creative para la dirección creativa y los ejemplos de aplicación |
| **Brand Growth** | ③ Marketing y Creative · ④ Producción · ⑤ Diseño gráfico · ⑦ Posting · ⑧ Ads, según los canales contratados |
| **Growth Partnership** | Todo Brand Growth, más la adquisición completa de ① Strategy, ⑥ Community y el especialista |

**Un área que la ficha no incluye no corre para ese cliente.** Un alcance a medida declara qué
incluye y su pipeline, y los agentes lo siguen.

📅 **El ciclo corre del día 1 al 20 del mes.** 🔴 **Día 11:** último día para producir ·
🔴 **Día 20:** presentación al cliente. Calendario completo en `inherent/05-OPERACION.md`.

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿El área ya tiene 4? Si sí, se junta con otra o no entra. ¿El agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿Esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿Está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |

## Cómo se construye uno

1. **`README.md`** — propósito, acciones con su MCP y qué entrega según el nivel.
2. **`brain/WORKFLOW.md`** — los pasos, el gate, qué entrega y qué NO hace.
3. **Una carpeta por skill** con su `SKILL.md` *(frontmatter con `name` y `description`)*.
4. **Enlazarla** en `.claude/skills/` para que se pueda invocar por nombre.
