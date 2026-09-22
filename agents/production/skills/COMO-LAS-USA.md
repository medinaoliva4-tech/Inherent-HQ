# Las skills de ⑤ Producción — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `agents/production/WORKFLOW.md` dice qué pasa, en qué orden y
con qué reglas; acá está el detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento en
un solo lugar. El brain es un **plugin**, y por eso no hace falta copiar nada a otra carpeta: un
archivo, un solo lugar, cero copias.

> 🛑 **Un plugin no se carga solo.** El `plugin.json` de `agents/production/.claude-plugin/` describe
> el plugin, pero **no hace que Claude lo encuentre**. Quien lo hace encontrable es
> `.claude-plugin/marketplace.json`, en la raíz del repo, que lista los departamentos; y
> `.claude/settings.json`, que los deja habilitados. Los dos ya están en el repo: al abrir el
> proyecto y confiar en la carpeta, las skills cargan solas.
>
> **Cómo se invocan:** las skills de un plugin llevan el nombre del plugin adelante —
> `produccion:produccion` es el orquestador, `produccion:pr-jornadas` la Capa 2, y así.
>
> **Si estás trabajando en una rama** que todavía no se mergeó a `main`, el marketplace se lee del
> repo publicado, así que hasta el merge hay que registrarlo a mano una vez:
> `/plugin marketplace add .` desde la raíz del repo.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`produccion`** | La puerta de entrada. Lee el pedido, verifica el pre-flight, decide qué capas correr y llama a las demás en orden, parando en los 3 gates. **Si no sabés cuál usar, es esta.** |

## Las 8 skills, en orden del flujo

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`pr-brief`** | Arranca el ciclo · *"esto se puede grabar"*, *"qué vamos a producir"* | La sección **§ Verificación y devoluciones** de `plan-de-rodaje.md`: producibilidad fila por fila, techo de realidad, material reutilizable |
| **1** | **`pr-desglose`** | *"qué hace falta para grabar esto"*, *"desglosá estas escenas"* | Las **filas base** de `plan-de-produccion.csv` — una por escena, con las 8 categorías |
| **2** | **`pr-jornadas`** | *"en cuántos días se graba"*, *"agrupá esto"* | La columna `jornada`, el **factor de consolidación**, el **índice de jornadas** y la sección de cada una |
| **3** | **`pr-recursos`** | *"quién consigue qué"*, *"está confirmada la locación"*, *"qué pasa si llueve"* | Columnas `locacion`, `talento`, `recursos`, `equipo`, `riesgo` + **§ Lo que hay que conseguir**, **§ Permisos** y los riesgos de cada jornada |
| **4** | **`pr-presupuesto`** | *"cuánto cuesta producir esto"* | **`presupuesto.md`** (el que ve el cliente) + `presupuesto.csv` interno + la columna `costo_estimado` |
| **5** | **`pr-rodaje`** | *"armá el call sheet de la jornada 2"* | Los call sheets dentro de **la sección de cada jornada** + la sección **§ Cómo se nombran los archivos** |
| **6** | **`pr-entrega`** | *"cerrá la entrega"*, *"qué quedó grabado"* | La sección **§ La entrega** —manifiesto cruzado— + la columna `estado` |
| **7** | **`pr-loop`** | *"cómo nos fue"*, *"qué se pasó de presupuesto"* | **`aprendizaje-de-produccion.md`** — las 4 lecturas, con el material no usado arriba |

Los entregables son **dos** —`presupuesto.md`, que lee el cliente, y `plan-de-rodaje.md`, con el que
rueda el equipo— más tres archivos internos: `plan-de-produccion.csv` (16 columnas),
`presupuesto.csv` (6 columnas) y `aprendizaje-de-produccion.md`. **Ninguna skill inventa un archivo
nuevo: todas escriben dentro de esos cinco.**

---

## Cómo se encadenan

```
pr-brief ──→ pr-desglose ──→ pr-jornadas ──→ pr-recursos ──→ pr-presupuesto ──→ pr-rodaje ──→ pr-entrega
                                  │                               │                 │             │
                                  │                            GATE 1            GATE 2        GATE 3
                                  │                        (presupuesto)     (plan de rodaje)  (entrega)
                                  │                                                                │
                                  └──────────── pr-loop ←──── costo_real + qué usaron ⑥A y ⑥B ←────┘
                                       │
                                       └──→ propuesta de capacidad a ① Comprensión
```

**Las reglas de encadenado:**

1. **Ninguna skill arranca sin el output de la anterior.** Si falta, se dice qué falta y se ofrece
   correrla. **No se improvisa el faltante.**
2. 🛑 **`pr-jornadas` va antes que `pr-presupuesto`, siempre.** Costear sin consolidar infla el
   presupuesto entre 3 y 5 veces, y ese número se vuelve la referencia del cliente. Presupuestar sin
   Capa 2 **se rechaza**, aunque lo pidan directo.
3. **Los gates son humanos.** `pr-presupuesto` para antes de comprometer un recurso · `pr-rodaje` para
   antes de convocar a nadie · `pr-entrega` para antes de cerrar la jornada. Nadie los salta.
4. **`pr-loop` cierra el ciclo y abre el siguiente:** alimenta a `pr-jornadas` y `pr-presupuesto` con el dato real. Si no vuelve a esas dos capas, no fue un loop: fue un informe.
5. **Cada skill trae su propio control de calidad al final.** El check vive donde se hace el trabajo, no en un archivo aparte que nadie abre.

---

## Las que se confunden

| | Qué hace | Qué NO hace |
|---|---|---|
| **`pr-desglose`** | **Lista** qué hace falta conseguir, escena por escena, en las 8 categorías | No decide de dónde sale ni quién lo consigue |
| **`pr-recursos`** | **Consigue**: origen, responsable con nombre, fecha de confirmación, semáforo y plan B | No agrupa jornadas ni pone precios |
| **`pr-jornadas`** | **Agrupa**: qué se graba junto y en cuántos días entra | No fija fecha, hora ni orden de tiro |
| **`pr-rodaje`** | **Calendariza**: qué día, a qué hora, en qué orden, con qué márgenes | No decide el agrupamiento — lo recibe hecho |

> 🛑 **Agrupar no es calendarizar.** `pr-jornadas` decide que 9 escenas entran en un día; `pr-rodaje`
> decide que ese día empieza 7:00 y que la cobertura va **antes de desarmar**. Saltarse la primera
> hace que la segunda arme un día que no existe.

| | Qué mide | De quién es la otra pregunta |
|---|---|---|
| **`pr-loop`** | **Ejecución**: qué costó más, qué llevó más, qué se grabó y nadie usó | Si la pieza **rindió** o no es Capa 7 de **④ Creatividad** |

---

## Si tenés que agregar o cambiar una skill

1. **¿Es un paso del flujo o es conocimiento?** Si es conocimiento —una tabla de márgenes, una
   nomenclatura, un checklist— **va adentro de la skill que lo usa**, no en un archivo suelto: el
   conocimiento vive donde se usa. Esa fue la razón de la limpieza.
2. **El `name` del encabezado tiene que ser igual al nombre de la carpeta.** Si no, no carga.
3. **Toda skill declara arriba qué consume, qué produce y en qué sección de qué entregable escribe.**
   Esa es la trazabilidad del departamento: no hay un archivo aparte que la lleve.
4. **Toda skill cierra con su bloque de QA**, con los checks de su capa.
5. **Ninguna skill nueva agrega un entregable.** Los cinco archivos están cerrados: una skill nueva escribe dentro de ellos o no va.
6. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.
