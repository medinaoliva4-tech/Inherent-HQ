# Las skills de Producción — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `pipelines/contenido/04-create/production/brain/WORKFLOW.md` dice qué pasa, en qué orden y
con qué reglas; acá está el detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento
en un solo lugar: `pipelines/contenido/04-create/production/brain/`.

> **Cómo cargan:** cada carpeta de skill está **enlazada** en `.claude/skills/` de la raíz del repo
> (`.claude/skills/pr-jornadas` → `pipelines/contenido/04-create/production/brain/skills/pr-jornadas`), igual que las de Strategy. Es un enlace,
> no una copia: lo que se edita acá es lo que corre, y no hay nada que instalar ni actualizar
> después de un `git pull`.
>
> **Cómo se invocan:** por su nombre, sin prefijo — `/produccion` es el orquestador, `/pr-jornadas` una de
> sus capas, y así.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.** Los enlaces viven en
> `.claude/skills/` de la raíz: si la sesión arranca en una subcarpeta, las skills no aparecen.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`produccion`** | La puerta de entrada. Lee el pedido, verifica el pre-flight, decide qué capas correr y llama a las demás en orden, sin paradas: si el presupuesto pasa la referencia del onboarding, lo escala al CEO y sigue. **Si no sabés cuál usar, es esta.** |

## Las 8 skills, en orden del flujo

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`pr-brief`** | Arranca el ciclo · *"esto se puede grabar"*, *"qué vamos a producir"* | La sección **§ Verificación y devoluciones** de `plan-de-rodaje.md`: producibilidad fila por fila, techo de realidad, material reutilizable |
| **1** | **`pr-desglose`** | *"qué hace falta para grabar esto"*, *"desglosá estas escenas"* | Las **filas base** de `plan-de-produccion.csv` — una por escena, con las 8 categorías — y las de **`plan-de-fotos.csv`**, una por foto *(WORKFLOW § 2B)* |
| **2** | **`pr-jornadas`** | *"en cuántos días se graba"*, *"agrupá esto"* | La columna `jornada`, el **factor de consolidación**, el **índice de jornadas** y la sección de cada una — y el agrupado de fotos por `setup` |
| **3** | **`pr-recursos`** | *"quién consigue qué"*, *"está confirmada la locación"*, *"qué pasa si llueve"* | Columnas `locacion`, `talento`, `recursos`, `equipo`, `riesgo` + **§ Lo que hay que conseguir**, **§ Permisos** y los riesgos de cada jornada |
| **4** | **`pr-presupuesto`** | *"cuánto cuesta producir esto"* | **`presupuesto.md`** (el que ve el cliente) + `presupuesto.csv` interno + la columna `costo_estimado` |
| **5** | **`pr-rodaje`** | *"armá el call sheet de la jornada 2"* | Los call sheets dentro de **la sección de cada jornada** + la sección **§ Cómo se nombran los archivos** |
| **6** | **`pr-entrega`** | *"cerrá la entrega"*, *"qué quedó grabado"* | La sección **§ La entrega** —manifiesto cruzado— + la columna `estado` |
| **7** | **`pr-loop`** | *"cómo nos fue"*, *"qué se pasó de presupuesto"* | **`aprendizaje-de-produccion.md`** — las 4 lecturas, con el material no usado arriba |

Los entregables son **dos** —`presupuesto.md`, que lee el cliente, y `plan-de-rodaje.md`, con el que
rueda el equipo— más cuatro archivos internos: `plan-de-produccion.csv` (16 columnas),
**`plan-de-fotos.csv` (11 columnas)**, `presupuesto.csv` (6 columnas) y
`aprendizaje-de-produccion.md`. **Ninguna skill inventa un archivo nuevo: todas escriben dentro de
esos seis.**

---

## Cómo se encadenan

```
pr-brief ──→ pr-desglose ──→ pr-jornadas ──→ pr-recursos ──→ pr-presupuesto ──→ pr-rodaje ──→ pr-entrega
                                  │                               │                 │             │
                                  │                         auto-revisión     auto-revisión  auto-revisión
                                  │                        (presupuesto)     (plan de rodaje)  (entrega)
                                  │                                                                │
                                  └───── pr-loop ←──── costo_real + qué usaron Diseño y Video ←────┘
                                       │
                                       └──→ propuesta de capacidad a Strategy
```

**Las reglas de encadenado:**

1. **Ninguna skill arranca sin el output de la anterior.** Si falta, se dice qué falta y se ofrece
   correrla. **No se improvisa el faltante.**
2. 🛑 **`pr-jornadas` va antes que `pr-presupuesto`, siempre.** Costear sin consolidar infla el
   presupuesto entre 3 y 5 veces, y ese número se vuelve la referencia del cliente. Presupuestar sin
   Capa 2 **se rechaza**, aunque lo pidan directo.
3. **Sin paradas: cada capa se auto-revisa con su QA y sigue.** Nada se compromete antes de cerrar
   `pr-presupuesto`; si el presupuesto pasa la referencia del onboarding, **se escala al CEO —es
   precio—** y solo ese gasto espera su respuesta. Nadie se convoca sin el presupuesto cerrado y el
   call sheet completo, y ninguna jornada se cierra sin manifiesto.
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
| **`pr-loop`** | **Ejecución**: qué costó más, qué llevó más, qué se grabó y nadie usó | Si la pieza **rindió** o no es Capa 7 de **Creatividad** |

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
6. **Enlazala en `.claude/skills/`** de la raíz (`ln -s ../../pipelines/contenido/04-create/production/brain/skills/<skill> .claude/skills/<skill>`), o no se puede invocar por nombre.
7. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.
