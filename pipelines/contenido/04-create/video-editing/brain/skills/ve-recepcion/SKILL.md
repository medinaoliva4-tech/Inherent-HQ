---
name: ve-recepcion
description: >
  Capa 0 de Video Editing — verifica qué llegó de Producción y es realmente editable antes de
  abrir un proyecto. Cruza fila por fila las piezas con rodaje del Excel de Creatividad contra el
  manifiesto de Producción, verifica que exista material con selects marcados, que el audio sirva,
  que la cobertura alcance para el guion escrito y que el backup esté. Si Producción no marcó
  selects, los hace acá: califica cada clip con la skill /watch contra una rúbrica escrita y deja
  la lista de posproducción (qué se usa, qué segundos, qué se descarta y por qué). Úsala cuando
  pidan "¿llegó todo?", "qué nos falta para editar", "arrancá el ciclo de video", "cruzá el
  material contra el Excel", "analizá los videos", "calificá el material", "qué tomas sirven".
---

# Capa 0 · Recepción — qué llegó y es editable

| | |
|---|---|
| **Consume** | **El Excel del ciclo cerrado** (`plan-de-contenido.csv` + `ideas-<formato>.md`) · el manifiesto y el material de Producción |
| **Produce** | Las filas base de **`entregas-video.md`** · la tabla **§ Lo que no se edita este ciclo** · si hizo falta, **`post-production-list.md`** (los selects) |
| **Herramientas** | `motor/remotion/scripts/` — `index_clips.py` · `watch_sheet.py` · `grade_add.py` · `merge_grading.py` · skill `/watch` |

**No se abre un proyecto todavía: se cruza y se verifica.** Empezar a editar una pieza a la que
le falta cobertura es trabajo tirado que se descubre a mitad del montaje.

## 1 · El filtro: solo las filas con rodaje

**Del Excel de Creatividad se toman únicamente las filas con `material = video`.** Las demás van directo a
Diseño gráfico.

**Una fila sin `material` que llega acá está mal clasificada: se devuelve a Creatividad.**

## 2 · El cruce, fila por fila

**Sin muestreo.** Una fila que no se verificó es una fila que se cae a mitad del ciclo.

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Existe el material** | El manifiesto de Producción lo lista y la ruta abre | `⚠️ SIN MATERIAL` — se nombra **de quién se espera y desde cuándo** |
| **Tiene selects marcados** | Producción marcó la toma buena | ⚠️ **Se seleccionan acá (§4)** y se anota para Producción en el loop |
| **La cobertura alcanza** | Hay planos para todas las escenas del `ideas-<formato>.md` | ↩️ **Devuelto a Producción** con qué escena falta |
| **El audio sirve** | Se entiende, sin saturar, sin ruido que no se pueda limpiar | ↩️ **Devuelto a Producción** |
| **El guion es montable** | El hook de Creatividad se puede armar con lo que hay | ↩️ **Devuelto a Creatividad** — nunca se improvisa otro hook |
| **Hay copy literal** | El `ideas-<formato>.md` tiene el texto escrito, no descrito | ↩️ **Devuelto a Creatividad** |
| **No arrastra claims ⏸️** | La pieza no tiene `⏸️ PENDIENTE APROBACIÓN` | **No entra** hasta que Branding valide |

## 3 · Cuando falta material pero la pieza se puede salvar

**Antes de devolver, se verifica si hay otra salida:**

| Salida | Cuándo |
|---|---|
| **Banco de assets** | Si ya existe material de ciclos anteriores que sirve. **Se declara que es reuso** |
| **Reencuadre de otra pieza** | Si el plano existe en otra toma del mismo ciclo |

**Si ninguna sirve, se devuelve.** Inventar una solución en el momento es cómo una pieza
termina sin parecerse a lo que Creatividad dirigió.

## 3B · Bajar el material

| Paso | Cómo | Por qué |
|---|---|---|
| **Listar el Drive** | `scripts/drive_listar_carpetas.js` en el navegador integrado, con la carpeta raíz del rodaje abierta | El conector de Drive **no lista** carpetas compartidas por otra cuenta |
| **Proxies** | `scripts/index_clips.py listado.json` → 360p sin audio + `clips_index.json` con un id por clip (`R<n>_<NN>`) | Calificar 100+ clips en 4K es lento; el proxy tiene la misma línea de tiempo |
| **Originales** | `prep.py` / `fetch_all.py`, **solo los que se usan**, después de seleccionar | Un rodaje pesa 10+ GB; se baja lo que entra al corte |

> ⚠️ **Drive a veces no ha procesado un video** («formato no disponible»): se marca `SIN ARCHIVO`,
> se reintenta al día siguiente y, si sigue, se pide a Producción que lo vuelva a subir.

## 4 · La selección — cuando Producción no marcó selects

**Ver de verdad cada clip, no adivinar por el nombre.** Es lo que más subió la calidad de los
reels en cliente real: se descartaron 25 de 123 clips antes de abrir el motor.

| Paso | Qué se hace |
|---|---|
| **1 · La rúbrica** | Se copia `motor/remotion/edit/RUBRIC.md` a `production/grading/` y se completa con la dirección de Creatividad y § Imagen de Branding *(si existe)* |
| **2 · Ver cada clip** | `watch_sheet.py R1_01 …` — hoja con un fotograma por segundo y **el tiempo real quemado** (skill `/watch` en modo `--timestamps`) |
| **3 · Afinar los cortes** | `watch_sheet.py R1_30:2.5-6.0 --step 0.25` en cada punto de corte y en cada momento protagonista |
| **4 · Calificar** | Nota 0–10, veredicto (`USAR COMPLETO` · `USAR CON RECORTES` · `DESCARTADO` · `SIN ARCHIVO`), segundos a conservar y a cortar con motivo, momento protagonista, si cabe en doble cuadro |
| **5 · Guardar al momento** | Cada clip calificado se agrega a un `.jsonl` (`grade_add.py`). Una sesión cortada no pierde nada |
| **6 · La lista** | `merge_grading.py` → `grading.json` + **`post-production-list.md`**: tabla por carpeta, descartados con su motivo, momentos protagonistas |

| Regla | Por qué |
|---|---|
| **Las etiquetas `t=` de la pasada uniforme de `/watch` vienen adelantadas ~0.4 s** | Cortar con ellas deja medio segundo de basura. Los tiempos de corte salen **siempre** de la hoja de tiempos exactos |
| **Tomas repetidas: se quedan las 2–3 mejores** | El resto `DESCARTADO` con `duplicate_of`. Diez tomas del mismo gesto no son diez opciones |
| **Distractores que descartan una toma** | Mano sin guante, cables, impresora, basura, trapos de color, gente que cruza, cámara que se cae al final |
| **Más de ~40 clips: subagentes en paralelo** | Un grupo de clips por subagente con `edit/AGENT_BRIEF.md`; cada uno escribe su `.jsonl`. Grupos chicos (8–12 clips) para que no se corten |
| **Se marca `hero`** | Los segundos más apetitosos de cada clip: son los ganchos y los finales del armado |

🔑 **La lista de posproducción es la fuente de los segundos** que usan el guion visual y el guion de
montaje. Ningún tiempo se escribe de memoria.

## 5 · El techo

**Se verifica contra el plan contratado antes de empezar:**

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| Horas de grabación | 3h | 4h | 6h | 8h |
| Videos planificados *(20 min c/u)* | 9 | 12 | 18 | 24 |
| Derivados — **mínimo** *(1:2)* | 4 | 6 | 9 | 12 |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| *Derivados — tope (1:1)* | *9* | *12* | *18* | *24* |
| **Total** | **10** | **16** | **20** | **24** |

⬜ **Tailor Made:** el techo son los videos planificados y derivados que declara **Su pipeline** en
`plan-contratado.md`.

**Si el Excel pide más, se declara y se devuelve a Marketing.** No se edita de más.

## 6 · Qué escribe

| Bloque | Qué lleva |
|---|---|
| **Las filas base de `entregas-video.md`** | Una por pieza: `id_creativo` · formato · plataformas · estado |
| **§ Lo que no se edita este ciclo** | Tabla con pieza, motivo, de quién se espera, desde cuándo |
| **`post-production-list.md`** | Si no hubo selects de Producción: la calificación de cada clip (§4) |

## 7 · Checklist

- [ ] Solo entraron filas con **`material = video`**
- [ ] Cada fila se cruzó contra el manifiesto de Producción — **sin muestreo**
- [ ] Cada devolución nombra **a quién y qué falta**
- [ ] Ninguna pieza con claim `⏸️` entró al ciclo
- [ ] Si no hubo selects de Producción: **todos** los clips se calificaron con `/watch`, con tiempos exactos, y existe `post-production-list.md`
- [ ] Los descartados tienen **motivo** y las tomas repetidas apuntan a la mejor
- [ ] El total **entra en el techo** del plan contratado
