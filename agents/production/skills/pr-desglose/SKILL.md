---
name: pr-desglose
description: >
  Capa 1 de ⑤ Producción — convierte cada escena aprobada en la lista concreta de cosas que alguien
  tiene que conseguir, con las 8 categorías: locación, talento, producto, props, vestuario, arte y
  ambientación, equipo técnico y permisos y legales. Parte cada fila creativa en una fila de
  producción por escena —la unidad que después se agrupa, se cuesta y se graba— y escribe las filas
  base de `plan-de-produccion.csv`. Úsala cuando pidan "desglosá estas escenas", "qué hace falta
  para grabar esto", "qué props necesitamos", "qué permisos hay que sacar", "armá las filas del
  Excel de producción", "cuántas escenas salen de estas piezas". Requiere el brief de Capa 0 hecho.
---

# Capa 1 · Desglose — qué hace falta conseguir

| | |
|---|---|
| **Consume** | La sección `# 1 · El brief` de `plan.md` (de `pr-brief`) · las escenas, encuadres, duraciones y tipo de lugar de `ideas.md` de ④ Creatividad (`agents/creative/clients/<cliente>/`) · las guidelines de ②B Branding |
| **Produce** | Las **filas base de `plan-de-produccion.csv`**: `id`, `id_creativo`, `campana`, `escena`, `accion`, `encuadre`, `duracion_s`, `destino`, `estado` + el desglose de las 8 categorías que alimenta las columnas `locacion`, `talento`, `recursos`, `equipo` |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan.md`.

**Traducís.** Una escena escrita se vuelve una lista de cosas físicas que alguien tiene que
conseguir. Es la traducción central del departamento: todo lo que viene después —jornadas,
presupuesto, call sheets— se apoya en que esta lista esté completa.

## 1 · La regla estructural: una fila creativa = N escenas de producción

```
CR-001 (1 pieza, 3 escenas) → PR-001 · PR-002 · PR-003     (todas con id_creativo = CR-001)
```

**La escena es la unidad** porque es **lo que se graba, lo que se agrupa y lo que se cuesta.** Una
pieza no se graba: se graban sus escenas, en locaciones distintas, con talento distinto y en días
distintos.

- 🛑 **Toda fila lleva `id_creativo`.** Sin él se elimina: una escena sin fila creativa es
  presupuesto sin justificación.
- El vínculo `id_creativo` + `escena` **nunca se rompe**: es lo que permite volver de un archivo
  entregado hasta la MUST BE TRUE que lo justificó.
- 🛑 **No se agrega ninguna escena** que ④ no haya pedido. Si hace falta una, **se devuelve** para
  que la agregue ella.
- Lo que la Capa 0 marcó `reutiliza` **no se desglosa**: ya existe.

❌ Una fila por pieza, con las 3 escenas en la misma celda
✅ Tres filas, `PR-001`/`PR-002`/`PR-003`, cada una con su acción, su encuadre y su duración

## 2 · Lo que se hereda y lo que decide Producción

🛑 **Lo que se hereda no se toca. Lo que se decide es el trabajo de Producción.**

| Se hereda de ④ (no se cambia) | Lo decide Producción |
|---|---|
| La **acción** de cada escena | Cómo se logra esa acción |
| El **tipo de lugar** (*"cocina de día"*) | **Qué** cocina, de quién, con qué permiso |
| El **encuadre** | Qué cámara, qué óptica, qué soporte |
| La **duración** | Cuánto tiempo de rodaje necesita |
| El **mood** y la **emoción** | Qué luz y qué dirección de actor los producen |

`accion`, `encuadre` y `duracion_s` se copian **literales**, no se parafrasean. Parafrasear es
cambiar la intención sin declararlo.

❌ `accion: "plano de comida"` ✅ `accion: "Manos cortando la proteína, vapor visible"`
❌ `locacion: "una cocina de día"` ✅ `locacion: "Restaurante zona 10 — cocina, franja 9-13 h"`

## 3 · Las 8 categorías — ninguna se omite

> 🛑 **Ninguna categoría se omite. Si no aplica, se escribe `N/A`.** Una categoría vacía es
> ambigua —¿no aplica, o nadie la pensó?— y esa ambigüedad se descubre el día del rodaje.

### ① Locación
El lugar **concreto**, no el tipo.

| Sub-ítem | Qué se chequea |
|---|---|
| Interior / exterior | El exterior activa dependencia de clima y **plan B obligatorio** |
| Día / noche | La hora del día define la ventana real de rodaje |
| Acceso | Cómo entra el equipo, si hay ascensor, cuántos viajes |
| Electricidad | Cuántas tomas, de qué amperaje, si hace falta generador |
| Ruido | Tráfico, obra, aire acondicionado. **Mata el audio directo** |
| Permiso | Quién autoriza, por escrito, para qué franja horaria |

### ② Talento
| Tipo | Qué implica |
|---|---|
| **Rostro** | Cesión de imagen obligatoria · dirección de actor · vestuario y maquillaje |
| **Cuerpo sin rostro** | Cesión igual — el cuerpo identifica |
| **Manos / detalle** | Lo más barato y lo más reemplazable. Muchas escenas se pueden reescribir a manos |
| **Voz** | Puede grabarse después, en otro lugar. **No obliga a que esté en la jornada** |

### ③ Producto
Qué producto, **cuántas unidades**, en qué estado, quién lo provee y para cuándo.

🛑 **Lo que se destruye en cuadro necesita respaldo.** Si se corta, se abre, se derrite o se consume:
**mínimo 3 unidades**, y va **último en su bloque**.

### ④ Props
Objetos en cuadro que **no** son el producto. Se listan **uno por uno**.
❌ *"ambientación de oficina"* ✅ *"laptop; taza; 3 carpetas; lámpara de escritorio"*

### ⑤ Vestuario
Ropa, calzado, accesorios. **De quién sale cada prenda y quién la lleva el día.**

🛑 **Sin logos de terceros, sin rayas finas, sin verde si hay croma.** Son las tres que más se
descubren tarde — y se descubren en cámara, no en la lista.

### ⑥ Arte y ambientación
Lo que hay que **montar o quitar** del lugar para que se vea como pide la estética/mood.
**Es la categoría que más tiempo consume y menos se estima:** 30-120 min por espacio.

### ⑦ Equipo técnico
Cámara · óptica · soporte · luz · audio · monitor. **Sale del `encuadre` heredado**, no se elige por
gusto. Un CU frontal fijo y un plano medio en mano no piden el mismo soporte.

### ⑧ Permisos y legales
| Permiso | Cuándo hace falta |
|---|---|
| **Locación** | Siempre que no sea espacio propio del cliente |
| **Cesión de imagen** | Toda persona identificable, **incluidas las de fondo** |
| **Derechos de música** | Si suena música en set o si se usa en la pieza |
| **Seguro** | Equipo alquilado · espacios de terceros · vía pública |

🛑 **El permiso se gestiona primero**, no al final: es lo que más tarda y lo único que puede anular
la jornada entera.

## 4 · Cómo caen las 8 categorías en el Excel

🛑 **La columna `recursos` fusiona cuatro categorías en una sola celda, separadas por `;`**:
producto + props + vestuario + arte y ambientación. **Ya no hay columnas separadas para esas cuatro.**

| Categoría | Columna de `plan-de-produccion.csv` |
|---|---|
| ① Locación | `locacion` |
| ② Talento | `talento` |
| ③ Producto · ④ Props · ⑤ Vestuario · ⑥ Arte y ambientación | **`recursos`** — las cuatro, separadas por `;` |
| ⑦ Equipo técnico | `equipo` |
| ⑧ Permisos y legales | La sección **`# 3 · Los recursos`** de `plan.md` → *Permisos y legales* |

```
recursos: plato del menu x3; mantel blanco; cubiertos; N/A vestuario propio; mesa vestida con flor
```

El `N/A` de una categoría que no aplica **se escribe dentro de la celda**: así se ve que se pensó.

**Las columnas que esta capa completa:** `id` (correlativo `PR-001`) · `id_creativo` · `campana` ·
`escena` · `accion` · `encuadre` · `duracion_s` · `destino` (se deriva del formato:
`video-editing` / `diseno-grafico` / `posting-directo`) · `estado` = `planificada`.
**Las que quedan vacías todavía:** `jornada` (Capa 2) · `costo_estimado` (Capa 4) · `riesgo` (Capa 3).
`locacion`, `talento`, `recursos` y `equipo` se llenan con el desglose y las confirma la Capa 3.

## 5 · Reglas duras

1. **Se desglosa lo pedido, nunca se agrega.** Una escena agregada acá no traza a ninguna MUST BE TRUE.
2. **El tipo de lugar se hereda; la `locacion` se decide.** Son dos cosas distintas por esa razón.
3. **Todo ítem tiene dueño desde el desglose.** *"Lo vemos después"* es cómo se llega a la jornada
   sin props.
4. **Lo perecedero y lo destructivo se marcan acá**, no en la jornada: cambia el orden de tiro.
5. **Lo marcado `reutiliza` en Capa 0 no se desglosa.** Desglosarlo es volver a grabar lo que existe.
6. **El inventario consolidado del ciclo se arma al cerrar**, sin repetir ítems: es lo que la Capa 3
   sale a conseguir.

## 6 · Tiempos de referencia — para estimar, no para adivinar

| Actividad | Tiempo típico |
|---|---|
| Montaje inicial de jornada | 60-90 min |
| Cambio de setup de luz | 30-45 min |
| Cambio de vestuario | 15-20 min |
| **Ambientación de un espacio** | 30-120 min — **la que más se subestima** |
| Escena simple, talento cómodo | 20-30 min |
| Escena con producto destructivo | 40-60 min (incluye reset entre tomas) |
| Desmontaje | 45 min |

*(La Capa 7 corrige estos números con el dato real de cada ciclo. Estimar arte en 15 min es
optimismo, no estimación.)*

## QA — Capa 1

- [ ] Cada fila creativa se partió en **una fila de producción por escena**
- [ ] **Toda fila tiene `id_creativo`** — sin él se elimina
- [ ] `accion`, `encuadre` y `duracion_s` están **copiados literales**, no parafraseados
- [ ] El **tipo de lugar heredado** está respetado — `locacion` lo concreta, no lo cambia
- [ ] Las **8 categorías** están completas en cada escena — las que no aplican dicen `N/A`, no vacío
- [ ] `recursos` trae las **cuatro categorías** (producto · props · vestuario · arte) en una celda separada por `;`
- [ ] `locacion` es un lugar **concreto**, no el tipo de lugar heredado
- [ ] Los props están listados **uno por uno** — *"ambientación de oficina"* no es un prop
- [ ] El producto declara **cuántas unidades**; lo destructivo tiene **mínimo 3**
- [ ] El vestuario está verificado: **sin logos de terceros, sin rayas finas, sin verde si hay croma**
- [ ] El arte y ambientación de cada escena está **estimado en tiempo**, con el rango de la tabla
- [ ] Los permisos están identificados, incluidas **cesiones de imagen de personas de fondo**
- [ ] El `equipo` se **derivó del `encuadre`**, no se eligió por gusto
- [ ] `destino` derivado del formato · `estado` = `planificada` en todas las filas
- [ ] Lo marcado **`reutiliza` en Capa 0 no se desglosó**
- [ ] 🛑 **No se agregó ninguna escena** que el Excel creativo no pidió
- [ ] 🛑 **Ninguna decisión creativa fue cambiada** — lo que no se podía, se devolvió a ④
- [ ] El **inventario consolidado del ciclo** está armado, sin repetir ítems
- [ ] Todo faltante está marcado `⚠️ SIN DATOS` + a quién pedírselo, **ninguno omitido en silencio**

**Handoff →** `pr-jornadas` (Capa 2). 🛑 **Se agrupa antes de presupuestar:** presupuestar fila por
fila sin consolidar infla el costo entre 3 y 5 veces.
