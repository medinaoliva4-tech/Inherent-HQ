---
name: pr-presupuesto
description: >
  Capa 4 de ⑤ Producción — cuesta el ciclo por jornada (nunca por pieza), separa los cinco bloques
  de costo, declara la contingencia como línea propia según el perfil del rodaje, calcula el costo
  por pieza y verifica si entra en el presupuesto disponible. Si no entra, presenta tres opciones
  con su impacto y decide un humano. Produce `presupuesto.csv` completo y la columna
  `costo_estimado` del plan. Úsala cuando pidan "cuánto cuesta producir esto", "presupuestá el
  ciclo", "armá el presupuesto", "cuánto sale cada pieza", "no nos alcanza, qué recortamos",
  "cuánta contingencia le ponemos". Requiere la Capa 2 hecha: presupuestar sin consolidar se
  rechaza.
---

# Capa 4 · Presupuesto — cuánto cuesta y si entra

| | |
|---|---|
| **Consume** | Las jornadas cerradas de la Capa 2 (columna `jornada` + el factor de consolidación) · los recursos de la Capa 3 con su origen (`propio`/`prestado`/`alquilado`/`comprado`/`a-producir`) · el techo de presupuesto declarado en la Capa 0 · las cotizaciones de `_INPUTS/` |
| **Produce** | `presupuesto.csv` completo — 6 columnas, categorías cerradas, `TOTAL` por campaña y `TOTAL CICLO` · la columna `costo_estimado` de `plan-de-produccion.csv` · el costo por pieza · y, si no entra, las 3 opciones con su impacto |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan.md`.

**Qué es:** poner número al plan que ya está agrupado, y decir con datos si entra o no.
**Qué no es:** no es decidir qué se produce (③ Marketing) ni cambiar el contenido de una escena
(④ Creatividad). No incluye la edición final: eso se presupuesta en ⑥A y ⑥B.

## 🛑 La regla que manda: no se presupuesta sin Capa 2 hecha

> 🛑 **Si las jornadas no están consolidadas, la Capa 4 no corre** — aunque lo pidan directo.

**Por qué.** Un presupuesto sin consolidar está inflado **entre 3 y 5 veces**, porque cada escena
carga sus propios fijos. Y si ese número se aprueba, se vuelve la referencia del cliente para
siempre: el ciclo siguiente se compara contra un presupuesto que nunca fue real.

❌ *"Son 30 escenas × $400 = $12.000"* ✅ *"Son 30 escenas en 3 jornadas: $3.100 de fijos + variables"*

Decílo así y ofrecé correr `pr-jornadas` primero.

## Paso 1 · Los 5 bloques — se cuesta por jornada, no por pieza

> 🛑 **Costear por pieza duplica los fijos.** La locación, el equipo, el traslado y la asistencia se
> pagan una vez por día, no una vez por pieza. Si se cargan por pieza, cada pieza paga el día entero.

| # | Bloque | Qué entra | Se cuesta por |
|---|---|---|---|
| 1 | **Fijos de jornada** | Locación · equipo · traslado · alimentación · asistencia | **Jornada** |
| 2 | **Talento** | Honorarios · cesión de imagen · uso en pauta si aplica | **Jornada por persona** |
| 3 | **Variables por escena** | Props · vestuario · producto consumido · arte y ambientación | **Escena** |
| 4 | **Post base** | Backup doble · descarga · selects · transcodificación | **Jornada** |
| 5 | **Contingencia** | % declarado, **como línea propia** | **Total** |

🛑 **Post base ≠ edición.** Ordenar, respaldar y marcar selects es de Producción y va acá. Montar,
corregir color de entrega, versionar por plataforma y exportar es de ⑥A Diseño y ⑥B Video Editing, y
va en **su** presupuesto. Meterlo acá hace que se presupueste dos veces o ninguna.

🛑 **El talento se paga por jornada, no por toma.** Si alguien aparece en 9 escenas de la misma
jornada, es **una** línea de talento, no nueve.

## Paso 2 · La contingencia — según el perfil del rodaje

| Perfil del rodaje | Contingencia mínima |
|---|---|
| Interior controlado, talento propio, producto disponible | **10 %** |
| Mezcla interior/exterior, **o** talento externo | **15 %** |
| Exterior con clima, permisos pendientes, **o** producto `a-producir` | **20-25 %** |

*(El perfil se lee del plan, no se elige: si hay una sola jornada de exterior con permiso pendiente,
el ciclo entero es del tercer perfil.)*

**Cómo se declara, siempre así:**

```
Subtotal producción      Q3.200
Contingencia (15%)       Q  495     ← línea visible, con su % y su motivo
TOTAL                    Q3.695
```

> 🛑 **La contingencia va como línea propia y nunca repartida dentro de los ítems.** Escondida en los
> ítems **se gasta sin que nadie note que se gastó**, y al cierre no hay forma de saber si el desvío
> fue real o fue contingencia consumida — que es justo lo que la Capa 7 necesita distinguir.

❌ *equipo Q1.380 (con un 15 % adentro)* ✅ *equipo Q1.200 · contingencia Q495, línea aparte*

## Paso 3 · El costo por pieza — se calcula, no se presupuesta

```
costo por pieza = (fijos de su jornada ÷ piezas de esa jornada) + variables propias
```

| Factor de consolidación | Efecto en el costo por pieza |
|---|---|
| **2 escenas/jornada** | Los fijos se reparten entre poco: **costo por pieza alto** |
| **8 escenas/jornada** | Los mismos fijos, mucho más output: **costo por pieza bajo** |

**Esta tabla es el argumento del departamento:** el costo por pieza **no baja negociando
proveedores, baja consolidando.**

Ese número es el que **vuelve en la Capa 7** —contra el costo real— y el que le permite a
③ Marketing **decidir el ciclo siguiente con datos y no con intuición**: cuántas piezas pide, en qué
formato y con qué presupuesto.

## Paso 4 · Escribir `presupuesto.csv`

```
campana · categoria · detalle · costo_estimado · costo_real · nota
```

**Categorías cerradas** — no se inventan, no se renombran:

`locacion` · `talento` · `equipo` · `arte-props` · `vestuario` · `transporte` · `alimentacion` ·
`post-base` · `contingencia`

- Una fila por categoría y por campaña. El `detalle` dice **qué y por cuánto tiempo** (*"Cam A, 2
  ópticas, gimbal, panel LED — 1 jornada"*), no solo *"equipo"*.
- La `nota` lleva el **origen y el estado**: *"prestado — confirmado 12-oct por Ana"*, *"alquilado —
  reserva sin confirmar"*.
- **Se cierra con una fila `TOTAL` por campaña y una `TOTAL CICLO`.** Así el cliente ve cuánto
  cuesta cada campaña y cuánto el ciclo entero, que es la pregunta que siempre hace.
- El `costo_real` queda **vacío acá** y lo completa la Capa 6/7 — **siempre**, aunque sea igual al
  estimado. Sin eso la Capa 7 no existe.

**En `plan-de-produccion.csv` esta capa escribe una sola columna: `costo_estimado`**, con moneda, por
escena (fijos prorrateados de su jornada + sus variables). El `costo_real` **no vive en ese CSV**:
vive en `presupuesto.csv`.

## Paso 5 · Si no entra — las 3 opciones, siempre las tres

Se presentan **con su impacto**, y **decide un humano**:

| Opción | Qué se toca | Qué **NO** se toca | Quién decide |
|---|---|---|---|
| **Reagrupar** | Volver a la Capa 2 y buscar más consolidación: menos locaciones, menos convocatorias, menos setups | **Nada del contenido.** Ni una escena, ni un encuadre | Producción sola puede |
| **Recortar filas** | Se **proponen** las de menor traza a la intención, con su costo al lado | La intención de las filas que quedan | **③ Marketing** |
| **Bajar de especificación** | Locación más simple, menos talento, menos equipo, arte más liviano | **El encuadre, la acción y la duración** — tocar eso vuelve a ④ | **④ Creatividad** si roza encuadre, acción o duración |

> 🛑 **Producción nunca elige sola qué pieza se cae.** Propone, con números; **deciden ③ Marketing y
> ④ Creatividad**. Recortar en silencio es decidir el alcance de la campaña sin mandato.

Un gasto que excede lo aprobado se marca **⏸️ PENDIENTE APROBACIÓN** y **espera**. No se ejecuta
"porque era urgente".

## Moneda y fecha, en todo número

> 🛑 **Un número sin fecha caduca y nadie sabe cuándo.** Todo costo lleva **moneda y fecha de
> cotización**.

❌ *"Equipo: 1200"* ✅ *"Equipo: Q1.200 — cotizado 08-oct-2026, vigencia 30 días"*

Si un costo no se pudo cotizar, se escribe **⚠️ SIN DATOS** con a quién pedírselo. **Ningún número
se estima a ojo sin declararlo como estimación.**

## 🚦 GATE 1 — presupuesto

**El presupuesto lo aprueba un humano antes de comprometer un solo recurso:** ni una reserva, ni una
convocatoria, ni una compra, ni una seña de locación. Se registra con fecha y con quién aprobó.

## QA — Capa 4

- [ ] 🛑 **La Capa 2 está hecha.** Presupuestar sin consolidar se rechaza, aunque lo pidan directo
- [ ] Se costeó **por jornada**, no por pieza
- [ ] Los **5 bloques** están separados: fijos de jornada · talento · variables por escena · post base · contingencia
- [ ] 🛑 **Post base ≠ edición.** El montaje, el color de entrega y el export **no están acá**
- [ ] La **contingencia va como línea propia y visible**, con su % según el perfil del rodaje
- [ ] 🛑 **La contingencia no está repartida dentro de ningún ítem**
- [ ] Todo número lleva **moneda y fecha de cotización**
- [ ] El **costo por pieza está calculado**: fijos prorrateados de su jornada + variables propias
- [ ] `presupuesto.csv` usa **solo las 9 categorías cerradas**, sin inventar ni renombrar
- [ ] `presupuesto.csv` cierra con una fila **`TOTAL` por campaña** y una **`TOTAL CICLO`**
- [ ] La columna `costo_estimado` está completa en **todas** las filas de `plan-de-produccion.csv`
- [ ] El `costo_real` quedó en `presupuesto.csv` para la Capa 6/7 — **no** en el CSV de escenas
- [ ] Si no entra: están **las 3 opciones** con su impacto y con quién decide cada una
- [ ] 🛑 **Producción no eligió sola qué pieza se cae**
- [ ] Todo gasto que excede lo aprobado está marcado **⏸️ PENDIENTE APROBACIÓN**, no ejecutado
- [ ] Lo que no se pudo cotizar está declarado **⚠️ SIN DATOS** con a quién pedírselo
- [ ] 🚦 **GATE 1 registrado.** Nada comprometido antes: ni reserva, ni convocatoria, ni compra

**Handoff →** `pr-rodaje` (Capa 5). Sin GATE 1 aprobado no se convoca a nadie ni se reserva nada: un
call sheet sobre un presupuesto no aprobado es una jornada que se puede caer con todo el equipo ya
citado.
