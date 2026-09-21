---
name: pr-rodaje
description: >
  Capa 5 de ⑤ Producción — convierte las jornadas presupuestadas en call sheets ejecutables: uno por
  jornada, con encabezado y dirección, horarios, contactos con teléfono, orden de tiro por costo de
  cambio, requerimientos por escena, la cobertura obligatoria marcada aparte, los riesgos del día
  con su plan B y la nomenclatura definida antes de grabar. Escribe los call sheets dentro de la
  sección de cada jornada y la sección de nomenclatura de `plan-de-rodaje.md`. Úsala cuando pidan "armá el call
  sheet", "el plan del jueves", "a qué hora convocamos", "en qué orden grabamos", "cómo nombramos
  los archivos", "qué tomas de seguridad hay que hacer". Requiere el presupuesto aprobado (GATE 1).
---

# Capa 5 · Plan de rodaje — qué día, a qué hora, en qué orden

| | |
|---|---|
| **Consume** | Las jornadas de la Capa 2 (columna `jornada` + el orden por costo de cambio) · los recursos confirmados de la Capa 3 con responsable, fecha y semáforo 🟢/🟡/🔴 · el presupuesto **aprobado en GATE 1** · las escenas de `plan-de-produccion.csv` con `accion`, `encuadre`, `duracion_s`, `locacion`, `talento`, `recursos`, `equipo` |
| **Produce** | Un **call sheet por jornada** como subsección dentro de **`plan-de-rodaje.md`, la sección de cada jornada** · la sección **`plan-de-rodaje.md` § Cómo se nombran los archivos Nomenclatura** · los riesgos del día enlazados a **§4 Riesgos y planes B** |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan-de-rodaje.md`.

**Qué es:** volver el plan un **día que sucede** — con horas, nombres, teléfonos y orden.
**Qué no es:** no es agrupar (eso ya lo hizo la Capa 2), no es conseguir recursos (Capa 3) y no es
cambiar qué se graba. Una escena que no está en el CSV **no entra al call sheet**.

## 🛑 Requisito: GATE 1 aprobado

> 🛑 **Sin presupuesto aprobado no se convoca a nadie ni se reserva nada.** Un call sheet emitido
> sobre un presupuesto sin aprobar es una jornada que se cae con el equipo ya citado — y se paga
> igual.

## Paso 1 · Los 8 bloques obligatorios del call sheet

Ninguno se omite. Si un bloque no aplica, dice `N/A` con el motivo.

| # | Bloque | Qué lleva |
|---|---|---|
| 1 | **Encabezado** | Cliente · campaña · jornada (`J1`) · fecha · locación con **dirección completa** · clima previsto si hay exterior |
| 2 | **Horarios** | Llamado · primer tiro · comida · wrap previsto · **horas efectivas** del día (máximo 10) |
| 3 | **Contactos** | Nombre, rol y **teléfono** de cada convocado. Sin teléfono no está convocado |
| 4 | **Orden de tiro** | Escena por escena, con `id`, acción, encuadre, duración, setup y **tiempo estimado de set** |
| 5 | **Por escena** | Talento · producto (con unidades) · props · vestuario · equipo específico de esa escena |
| 6 | **Cobertura** | Las tomas de seguridad, **marcadas aparte del orden de tiro** (Paso 4) |
| 7 | **Riesgos del día** | Los 🟡/🔴 activos de esa jornada, **cada uno con su plan B** |
| 8 | **Entrega** | Nomenclatura · destino del material · dónde va cada backup |

🛑 **El orden de tiro no es el orden narrativo.** Se ordena por **costo de cambio**: mismo setup y
mismo talento juntos → cambios de vestuario agrupados, no alternados → producto destructivo al final
de su bloque → **cobertura antes de desarmar**.

🛑 **El llamado del talento es ≥ 30 min antes de su primer tiro, escalonado por bloque.** Nadie
espera tres horas: llega cansado justo a su escena.

## Paso 2 · Dónde se escribe — una sección por jornada en `plan-de-rodaje.md`

El call sheet **no es un archivo aparte**: es la sección de su jornada, con este molde —uno por
jornada— respetando la plantilla `agents/production/entregables/plan-de-rodaje.md`:

```markdown
# Jornada 1 — [día y fecha] · [locación]
### Datos del día          → dirección completa · horarios · clima · escenas
**Quiénes están**          → nombre · rol · teléfono
### Las piezas de esta jornada   → compilado de ④ (ver Paso 2b)
### Orden de tiro          → por bloque de setup: # · id · qué se graba · encuadre · dur. · tiempo · qué necesitás a mano
### Lo que se dice en cámara     → solo lo hablado a cámara (ver Paso 2b)
### Cobertura obligatoria  → 🛑 antes de desarmar
### Riesgos del día        → cada uno con su plan B
```

- Los **tiempos y el orden de tiro viven acá** — el CSV de escenas **ya no tiene**
  `tiempo_estimado_min` ni `orden_en_jornada`.
- 🛑 **El tiempo de set no es la duración de la pieza.** Un CU de 3 s se rueda en 45 min. Si el call
  sheet suma `duracion_s`, el día se cae antes de la comida.

## Paso 2b · Compilar lo de ④ Creatividad — no copiarlo

El equipo rueda con **un solo documento**: tener que abrir el de Producción y el de Creative a la vez,
en el set, es como se pierden tomas. Por eso la información creativa que hace falta para ejecutar
**se trae acá**.

> 🛑 **Se compila, no se reescribe.** El original sigue siendo
> `agents/creative/clients/<cliente>/ideas-<formato>.md`, y esta sección **lo cita como fuente**. Si
> ④ cambia algo, se vuelve a compilar — nunca se edita acá. Un campo reescrito con otras palabras
> crea una segunda versión de la verdad, y en dos ciclos las dos no coinciden.

**El filtro es una sola pregunta: ¿lo necesita alguien parado en el set, con la cámara en la mano?**

| Sí entra | No entra |
|---|---|
| La **acción** y el **encuadre** de cada escena, literales | La BIG IDEA, el insight y el filtro D/N/R |
| La **duración** y el **tipo de lugar** | La hipótesis y la cubeta 70/20/10 |
| La **emoción** y la **estética/mood** de cada pieza | El **copy** — el texto en pantalla lo pone ⑥B en edición |
| El **guion, solo si se dice frente a cámara** | La **voz en off** — se graba otro día, en un lugar silencioso |

- La emoción y el mood van **una vez por pieza**, en *Las piezas de esta jornada* — no se repiten escena por escena.
- El **copy** puede aparecer como *nota de encuadre* (*"dejar aire arriba, ahí va el título"*), nunca como texto a producir en el set.
- Con **talento no profesional** —un cliente real, alguien del equipo— no se entrega un guion para leer: se entregan **los puntos a tocar** y una indicación de dirección **por situación**. ❌ *"hacelo más natural"* ✅ *"contámelo como si se lo contaras a una amiga"*.

## Paso 3 · Los márgenes reales

| Concepto | Margen |
|---|---|
| **Montaje inicial completo** | **60-90 min** antes del primer tiro |
| Cambio de óptica | 5 min |
| Reubicar cámara, mismo esquema de luz | 10-15 min |
| **Cambio de setup de luz** | **30-45 min** |
| Montar gimbal y equilibrar | 20-30 min |
| Cambio de locación (mismo edificio) | 30 min |
| **Cambio de locación (traslado)** | **60 min + el traslado real** |
| **Desmontaje** | **45 min** |

> 🛑 **Sin estos márgenes no es un plan: es una lista de deseos.** Un call sheet sin montaje, sin
> cambios de setup y sin desmontaje **se cae en la segunda hora**, y lo que se cae es la última
> mitad del día: justo la cobertura y las escenas que nadie alcanzó a rodar.

La comida y el desmontaje se escriben como bloques del día, no se asumen.

## Paso 4 · La cobertura — las tomas de seguridad

> **El principio:** volver a una locación cuesta **más que todas las tomas extra juntas**. La
> cobertura es el seguro más barato del departamento.

**Por cada escena con talento o producto, antes de desarmar su setup:**

| # | Toma | Para qué sirve | Costo |
|---|---|---|---|
| 1 | **Segunda toma buena** | La primera siempre tiene algo: un parpadeo, un ruido, un foco | 2-3 min |
| 2 | **Wide de la escena** | Permite cortar sin salto y da contexto si la pieza cambia de formato | 3-5 min |
| 3 | **Detalle / inserto** | Tapa cualquier corte y salva el ritmo en la edición | 3-5 min |
| 4 | **Reacción o pausa** | El segundo de respiro que ⑥A necesita para el final | 2 min |
| 5 | **Ambiente de la locación (30 s)** | Sincronizar y rellenar. **Una vez por locación**, no por escena | 1 min |

**Total: 10-15 min por escena.** Una vuelta a locación: **una jornada entera.**

### Cobertura extra por situación

| Situación | Qué se agrega |
|---|---|
| **Producto destructivo** | Una toma completa **antes** de destruirlo, en wide y en detalle |
| **Exterior** | Una versión de la escena con el cielo cubierto, si el clima puede cambiar |
| **Talento que no vuelve** | Una toma extra de rostro neutro, sin acción — sirve para cualquier pieza futura |
| **Pieza que se adapta a varios formatos** | Cuadro con aire arriba y abajo, para recorte vertical y horizontal |
| **Escena con pantalla** | Una pasada con la pantalla apagada, para reemplazar el contenido en post |

### Las reglas de la cobertura

> 🛑 **No se sale de una locación sin las tomas de seguridad.**
> 🛑 **Se hacen ANTES de desarmar cada setup, nunca al final del día.**

**Por qué el final del día no sirve.** Cuando el día se atrasa —y se atrasa— lo primero que se
sacrifica es lo que quedó al final. Y es justo lo que salva la edición. **Volver a una locación
cuesta más que las tomas extra**, así que la cobertura se rueda cuando la luz y el set todavía están
armados.

- 🛑 **Nunca se sale con una sola toma buena** de una escena.
- **La cobertura no es una escena nueva:** no entra como fila de `plan-de-produccion.csv`. Su tiempo
  está **incluido en el "tiempo est." de su escena** en el orden de tiro de `plan-de-rodaje.md`, la sección de su jornada.
- Si no se pudo hacer, **se declara** en `plan-de-rodaje.md` § La entrega con motivo. **No se omite.**

❌ *"Cobertura general: al final del día, si da el tiempo"*
✅ *"PR-002 · cobertura antes de desarmar: 2ª toma + wide + inserto + reacción — 12 min"*

## Paso 5 · Nomenclatura — `plan-de-rodaje.md` § Cómo se nombran los archivos

```
<cliente>_<campana>_<id_creativo>_<escena>_<tipo>_<take>.<ext>
acme_menuejecutivo_CR-007_E2_video_t03.mov
```

- Minúsculas, **sin espacios y sin tildes**. Toma con **dos dígitos** (`t03`).
- `id_creativo` y `escena` **exactos**: son la llave del cruce contra el Excel.
- Sufijo `_SELECT` en las tomas buenas. Nada se borra: el descarte **se marca**.
- Se declara también el **destino del material** y la estructura de carpetas.

> 🛑 **La nomenclatura se define ACÁ, antes de grabar — no al entregar.** Renombrar 400 archivos al
> final **es cuando se pierde material**, y es cuando ⑥A y ⑥B reciben una carpeta que no puede
> cruzarse contra el Excel.

## 🚦 GATE 2 — plan de rodaje

**El plan de rodaje se aprueba antes de convocar a nadie.** Se registra con fecha y con quién
aprobó. Después del GATE 2 se emiten los llamados; no antes.

## QA — Capa 5

- [ ] Un call sheet **por jornada**, como sección propia de **`plan-de-rodaje.md`**, y el **índice de jornadas** al principio del doc
- [ ] Encabezado completo: cliente · campaña · jornada · fecha · **dirección** · clima previsto
- [ ] **Lo de ④ está compilado, no reescrito:** cada jornada trae *Las piezas de esta jornada* (concepto, emoción, mood) y la fuente citada
- [ ] 🛑 **Pasó el filtro:** no entró la BIG IDEA, ni el insight, ni la hipótesis, ni el copy de pantalla, ni la voz en off
- [ ] El **guion aparece solo donde alguien habla a cámara**, y la voz en off está declarada como *"se graba aparte"*
- [ ] Horarios: llamado · primer tiro · comida · wrap previsto, con **horas efectivas ≤ 10**
- [ ] **Contactos con teléfono** de cada convocado
- [ ] Orden de tiro escena por escena, con `id`, acción, encuadre, duración y **tiempo de set**
- [ ] El orden es por **costo de cambio**, no narrativo; vestuario agrupado y producto destructivo al final de su bloque
- [ ] Requerimientos por escena: talento · producto · props · vestuario · equipo específico
- [ ] La **cobertura obligatoria está marcada aparte** del orden de tiro, y **antes de desarmar**
- [ ] Las **5 tomas de seguridad** están previstas por escena con talento o producto, más la extra por situación que aplique
- [ ] El **ambiente de la locación (30 s)** está previsto una vez por locación
- [ ] Los riesgos 🟡/🔴 del día están listados **con su plan B**, citados de `plan-de-rodaje.md` § Riesgos del día
- [ ] 🛑 **La nomenclatura está definida acá**, en `plan-de-rodaje.md` § Cómo se nombran los archivos — no al entregar
- [ ] Los **márgenes están incluidos**: montaje 60-90 min · setup de luz 30-45 min · locación 60 min + traslado · desmontaje 45 min
- [ ] El llamado del talento es **≥ 30 min antes** de su primer tiro, escalonado por bloque
- [ ] Ninguna escena del call sheet falta en `plan-de-produccion.csv` — **si no está en el Excel, no se graba**
- [ ] 🚦 **GATE 2 registrado.** Nadie convocado antes

**Handoff →** `pr-entrega` (Capa 6). El call sheet es el documento con el que se rueda: si hay que
preguntar algo por chat el día del rodaje, faltaba un bloque.
