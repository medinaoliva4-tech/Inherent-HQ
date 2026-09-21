---
name: pr-loop
description: >
  Capa 7 de ⑤ Producción — cierra el ciclo con datos reales y no con impresiones. Hace las cuatro
  lecturas: desvío de costo (`costo_estimado` vs `costo_real`), desvío de tiempo, material grabado
  que nadie usó y factor de consolidación real vs. previsto. Devuelve el material no usado a ④
  Creatividad como dato, propone a ① Comprensión la corrección de la capacidad declarada y sube a
  las skills los tiempos y costos que ya son dato. Escribe
  `aprendizaje-de-produccion.md`. Úsala cuando pidan "cómo nos fue", "cerrá el ciclo", "cuánto nos
  pasamos de presupuesto", "qué grabamos que no se usó", "por qué llevó más jornadas", "qué hacemos
  distinto el próximo ciclo", "actualizá los costos de referencia". Requiere `costo_real` cargado en
  `presupuesto.csv`.
---

# Capa 7 · Loop — ¿qué costó más de lo previsto?

| | |
|---|---|
| **Consume** | `presupuesto.csv` con **`costo_real` cargado en todas las filas** · `plan-de-produccion.csv` completo, con `costo_estimado`, `jornada` y `estado` · de `plan-de-rodaje.md`: los tiempos estimados del orden de tiro (`§2`), el factor de consolidación previsto (`§2`) y el manifiesto de entrega (`§6`) · **qué usó ⑥A y ⑥B en la pieza final** · la capacidad declarada por ① Comprensión |
| **Produce** | **`aprendizaje-de-produccion.md`** — archivo de trabajo interno: no se entrega al cliente pero **sí se guarda** en la carpeta del cliente. Plantilla: `aprendizaje-de-produccion.md`, al lado de esta skill |

Contexto del departamento: `agents/production/WORKFLOW.md`. Cómo encadena con el resto:
`agents/production/skills/COMO-LAS-USA.md`.

**Qué mide: ejecución.** No resultado creativo ni de negocio. Si una pieza no funcionó, eso lo lee
④ Creatividad en su propia Capa 7, con métricas por pieza. Acá se lee **qué costó más, qué llevó más
y qué se grabó al vacío**.

🛑 **Sin datos: `⚠️ SIN DATOS` + a quién pedírselos. Ningún desvío inventado.** Un modelo sin acceso
al número real no dice *"no sé"*: rellena, y ese relleno se vuelve la referencia del próximo ciclo.

---

## 1 · El dato de entrada que no se negocia

🛑 **El `costo_real` se completa siempre, aunque sea igual al estimado.**

Una fila sin `costo_real` no es una fila neutra: es media muestra perdida. Y las que coinciden son
justamente las que confirman que la estimación **ya es dato** y puede subir a las skills. Si se
cargan solo las que se desviaron, el archivo dice que Producción estima mal siempre.

❌ *"Ese ítem salió igual a lo cotizado, lo dejé vacío"*
✅ `equipo · estimado Q1.200 · real Q1.200 · desvío 0 % → la estimación de equipo ya es dato`

Sin `costo_real` completo **esta capa no corre**: se declara `BLOQUEADO` y se nombra quién carga la
columna.

---

## 2 · Las cuatro lecturas

| # | Lectura | La pregunta | De dónde sale |
|---|---|---|---|
| **1** | **Desvío de costo** | ¿Qué ítems se pasaron, y cuánto? | `costo_estimado` vs **`costo_real`** de `presupuesto.csv`, por categoría y por jornada |
| **2** | **Desvío de tiempo** | ¿Qué escenas llevaron más de lo estimado? | Los tiempos del orden de tiro (`plan-de-rodaje.md`, la sección de su jornada) vs. el real de la jornada |
| **3** | **Material no usado** | ¿Qué se grabó y ⑥A o ⑥B nunca usaron? | El manifiesto (`plan-de-rodaje.md` § La entrega) cruzado contra la pieza final |
| **4** | **Consolidación** | ¿El factor fue el previsto? ¿Dónde se perdió? | Factor previsto (`plan-de-rodaje.md`, la sección de su jornada) vs. jornadas realmente usadas |

Las cuatro se escriben **con número**, no con adjetivo. *"Nos pasamos un poco"* no es una lectura:
`talento · Q750 → Q1.100 · +47 % · el comensal externo cobró media jornada extra` sí lo es.

**Los desvíos se leen por ítem y por jornada, nunca en total.** Un total con +3 % puede esconder una
categoría con +60 % compensada por otra que no se gastó, y es exactamente la que hay que corregir.

---

## 3 · El material no usado es el hallazgo más valioso

> **Si un 40 % de lo grabado no se usó, el problema NO está en producción:** está en que el Excel
> creativo pidió cobertura que la pieza final no necesitaba.

Es la única lectura que **baja el costo del ciclo siguiente sin bajar la calidad**, porque no recorta
la pieza: recorta lo que nunca llegó a la pieza.

```
Escenas grabadas: [n]   ·   Escenas efectivamente usadas: [n]
% no usado: [x] %       ·   Costo del material no usado: [monto]
```

| % no usado | Lectura |
|---|---|
| **Hasta ~15 %** | Normal. Es el costo de la cobertura que sí sirve |
| **20-30 %** | Hay un patrón. Se nombra qué tipo de escena se repite en el descarte |
| **> 30-40 %** | 🛑 El shot list está pidiendo más de lo que la pieza usa. **Se devuelve a ④** |

🛑 **Se devuelve a ④ Creatividad como DATO, no como reclamo.** Tres cosas, y ninguna es un juicio:

| Qué lleva la devolución | Ejemplo |
|---|---|
| **Qué se grabó y no se usó** | *"las 4 escenas de reacción de `CR-003`, `CR-005`, `CR-007` y `CR-011`"* |
| **Qué patrón se repite** | *"las reacciones de 2 s nunca entran al corte final"* |
| **Qué se propone** | *"grabar una reacción por pieza en vez de por escena — ahorra ~1,5 h por jornada"* |

❌ *"Nos hicieron grabar un montón de cosas al vacío"*
✅ *"El 38 % del material no usado son reacciones. Proponemos una por pieza. Decide ④."*

> Esto **no es una devolución de las 6 de `WORKFLOW.md §9`**: no bloquea nada ni pide reescribir una
> escena. Es un aprendizaje que entra al brief del ciclo siguiente.

---

## 4 · Lo que vuelve a ① Comprensión

**La capacidad de producción declarada en ① es una estimación**, y nadie la corrige nunca. Producción
es el único departamento que sale del ciclo con el dato real: cuántas piezas entraron de verdad,
cuántas jornadas hubo, cuánto costó cada pieza.

| | Declarado en ① | Real este ciclo |
|---|---|---|
| Piezas producidas por ciclo | | |
| Jornadas realmente disponibles | | |
| Costo real por pieza | | |

🛑 **Es la única corrección que Producción hace sobre un documento de otro departamento, y se hace
COMO PROPUESTA — nunca editando su archivo.** Se redacta el texto sugerido, se cita la fuente del
dato y decide ①. Editar el archivo ajeno crea dos versiones de la verdad y en dos ciclos no coinciden.

---

## 5 · Lo que sube a las skills

Los márgenes, tiempos y costos de referencia de las skills `pr-*` se actualizan con el dato real.

> **Un tiempo estimado que falló tres ciclos seguidos deja de ser estimación y pasa a ser dato.**

| Qué se corrige | En qué skill |
|---|---|
| Tiempos de set por tipo de escena | `pr-desglose`, `pr-jornadas` |
| Márgenes de montaje, cambio de setup, traslado y desmontaje | `pr-rodaje` |
| Costos de referencia por categoría y **contingencia por perfil de rodaje** | `pr-presupuesto` |
| Márgenes de confirmación por origen del recurso | `pr-recursos` |

🛑 **Nada sube con un solo ciclo de evidencia.** Un desvío aislado es una anécdota; tres ciclos
seguidos en la misma dirección es el número nuevo. Ese es el mecanismo por el que el departamento
mejora sin que nadie lo decida.

---

## 6 · Reglas duras

1. 🛑 **`costo_real` en todas las filas**, aunque coincida con el estimado.
2. **Los desvíos se leen por ítem y por jornada**, nunca solo en total.
3. **Todo desvío lleva su explicación escrita**, no solo el porcentaje.
4. **El material no usado se devuelve a ④ como dato**, con patrón y propuesta.
5. **La corrección de capacidad va a ① como propuesta.** 🛑 **No se edita el archivo de otro
   departamento.**
6. **Nada sube a las skills sin tres ciclos** en la misma dirección.
7. 🛑 **Ningún desvío inventado.** Sin dato: `⚠️ SIN DATOS` + a quién pedírselo.
8. **Esta capa no juzga la pieza.** Si rindió o no rindió es Capa 7 de ④ Creatividad.

---

## QA — Capa 7

- [ ] 🛑 **`costo_real` cargado en todas las filas** de `presupuesto.csv`, aunque coincida con el estimado
- [ ] Desvío de costo calculado **por categoría y por jornada**, no solo el total
- [ ] Los **3 ítems que más se pasaron** están nombrados, con su explicación escrita
- [ ] **Contingencia consumida** declarada aparte, con qué la consumió
- [ ] Desvío de tiempo calculado **por escena**, con explicación de las que se pasaron
- [ ] **Material no usado identificado**, cruzado contra lo que ⑥A y ⑥B usaron en la pieza final
- [ ] El **% no usado y su costo** están en números, no en adjetivos
- [ ] El material no usado se devuelve a ④ Creatividad **como dato, no como reclamo**, con **patrón y propuesta**
- [ ] Factor de consolidación **real vs. previsto**, con **dónde se perdió**
- [ ] La **corrección de capacidad** para ① Comprensión está redactada **como propuesta**, con la fuente del dato
- [ ] 🛑 **No se editó ningún archivo de otro departamento** — todo citado con su ruta
- [ ] Está declarado **qué tiempo o costo sube a qué skill `pr-*`**, y con **cuántos ciclos** de evidencia
- [ ] Ninguna conclusión sobre **rendimiento de la pieza** — eso es Capa 7 de ④ Creatividad
- [ ] Sin datos: `⚠️ SIN DATOS` + a quién pedírselos. **Ningún desvío inventado**
- [ ] `aprendizaje-de-produccion.md` quedó **guardado en la carpeta del cliente** — es interno, no se entrega

**Handoff →** `pr-jornadas` (Capa 2, el factor real y los tiempos de set) y `pr-presupuesto` (Capa 4,
los costos y la contingencia reales). El loop **cierra el ciclo y abre el siguiente**: si no alimenta
a esas dos capas, no fue un loop, fue un informe.
