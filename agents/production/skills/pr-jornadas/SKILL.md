---
name: pr-jornadas
description: >
  Capa 2 de ⑤ Producción — la consolidación: convierte N escenas dispersas en M jornadas
  ejecutables, al menor costo posible y sin tocar una sola decisión creativa. Es la capa donde se
  gana o se pierde el presupuesto: desglosar es mecánico, agrupar es lo que hace que 30 escenas se
  graben en 2 jornadas y no en 11. Arma la matriz completa del ciclo, agrupa por los 4 ejes en
  orden (locación, talento, setup de luz/cámara, producto), ordena el tiro por costo de cambio,
  verifica con márgenes reales que cada jornada entre en 10 h efectivas y declara el factor de
  consolidación. Úsala cuando pidan "en cuántos días se graba esto", "agrupá estas escenas", "armá
  las jornadas", "¿entra en dos días?", "cuál es el orden de tiro", "por qué cuesta tanto producir
  este ciclo", "¿cuántas jornadas son?". Es obligatoria antes de presupuestar y requiere el desglose
  de Capa 1 hecho.
---

# Capa 2 · Consolidación — qué se graba junto

| | |
|---|---|
| **Consume** | Las filas base de `plan-de-produccion.csv` que dejó `pr-desglose` (Capa 1), con `locacion`, `talento`, `recursos` y `equipo` ya identificados · la sección **§ Verificación y devoluciones** de `plan-de-rodaje.md` con el techo de días posibles · las fechas de preparación de ③ Marketing |
| **Produce** | La columna **`jornada`** de `plan-de-produccion.csv` (`J0`, `J1`, `J2`…) · la sección de cada jornada de `plan-de-rodaje.md`: factor de consolidación, ficha y orden de tiro de cada jornada, y la cobertura obligatoria de cada locación |

Contexto del departamento: `agents/production/WORKFLOW.md`. Plantilla del entregable:
`agents/production/entregables/plan-de-rodaje.md`.

**Qué es:** decidir **qué se graba junto y en qué orden**, para que el ciclo cueste X y no 4X.
**Qué no es:** no es el call sheet (eso es Capa 5: horarios, contactos, convocatoria), no es
presupuestar (Capa 4, y va **después** — costear sin consolidar infla el costo entre 3 y 5 veces),
y **no es reescribir escenas** para que entren.

## 🛑 El principio: lo caro no son las tomas, son los montajes

> Cada cambio de locación, cada convocatoria de talento y cada esquema de luz nuevo cuesta **tiempo
> muerto que se paga igual**. Treinta escenas pueden ser **once jornadas o dos**, y la diferencia
> **no está en el contenido**: está en cómo se agruparon.

**Por qué esta capa es la más importante del departamento.** Desglosar es mecánico: cualquiera lo
hace igual. **Agrupar es donde se decide si el ciclo cuesta X o 4X.**

🛑 **Ninguna decisión creativa se cambia para lograr el agrupamiento.** Si la dispersión no se puede
resolver, se **devuelve a ④ con números y alternativas** (Paso 6). Nunca se reagrupa cambiando una
acción, un encuadre o una duración.

## Paso 1 · Armar la matriz completa

Antes de agrupar nada, se mira **todo el ciclo junto**:

```
| id | id_creativo | escena | locacion | talento | setup de luz | producto | duracion_s | tiempo de set (min) |
```

🛑 **No se agrupa leyendo el CSV fila por fila.** Los patrones solo aparecen cuando se ve la matriz
completa.

**`duracion_s` no es tiempo de set.** El tiempo de set es lo que se suma para armar la jornada:

| Escena | `duracion_s` | Tiempo de set | Por qué |
|---|---|---|---|
| CU hablante, 3 s | 3 | **45 min** | Montaje de audio, 4-6 tomas, revisión |
| Inserto de producto, 2 s | 2 | **25 min** | Luz rasante + reset entre tomas |
| Wide de contexto, 5 s | 5 | **15 min** | Una toma, dos de seguridad |

Estimación inicial: `tiempo de set ≈ setup + (tomas previstas × 4 min)`, **mínimo 15 min por
escena**. Talento amateur: **+50 %**. La Capa 7 corrige el número real.

❌ Estimar la jornada con `duracion_s` ✅ Estimar con tiempo de set, que incluye montaje y tomas

## Paso 2 · Agrupar por los 4 ejes, **en este orden**

El orden importa: cada eje se aplica **dentro** de los grupos que armó el anterior.

| # | Eje | Regla |
|---|---|---|
| 1 | **Locación** | El costo fijo más grande. **Todo lo que ocurre en la misma locación se graba el mismo día.** Sin excepciones evitables |
| 2 | **Talento** | Se paga **por jornada, no por toma**. Si alguien aparece en 9 escenas, las 9 se agrupan en sus jornadas |
| 3 | **Setup de luz / cámara** | Rearmar una luz cuesta **30-45 min**; cambiar de óptica, **5**. Se ordena por setup, **no por número de pieza** |
| 4 | **Producto** | Lo que **se destruye en cuadro va último** en su bloque, y con unidades de respaldo |

### Eje 1 · Locación — y la convención `J0`

```
Oficina sala norte  → PR-002, PR-005, PR-006        → candidatos a J1
Cocina del local    → PR-010, PR-011                → candidatos a J2
Sin locación        → PR-001, PR-003, PR-004        → J0 (no es jornada de rodaje)
```

**`J0` es una convención útil:** las escenas que **no requieren rodaje** —capturas de pantalla,
placas, composiciones de post— se agrupan aparte para que **no inflen el conteo de jornadas ni el
factor**.

### Eje 2 · Talento — antes de convocar dos veces

Si una persona aparece en 9 escenas repartidas en 3 locaciones, hay dos caminos:

| Camino | Cuándo conviene |
|---|---|
| Traer las 3 locaciones al mismo día | Si están cerca y el día alcanza |
| Convocar a la persona 2 días | Si las locaciones son incompatibles |

🛑 **Antes de convocar a alguien dos veces, se revisa si su escena se resuelve como voz** —que se
graba otro día, en otro lugar, más barato— **o como manos**, que es reemplazable. Es la palanca más
barata para descomprimir un día cargado y casi nunca se usa. **Se propone a ④ Creatividad como
devolución — nunca se cambia solo.**

### Ejes 3 y 4 · Lo que ordena el interior del día

- **Setup de luz:** dentro de una jornada se agrupa por **esquema de luz antes que por pieza**. Es
  el cambio más caro del día.
- **Producto destructivo:** va **al final de su bloque**, con una toma completa —wide y detalle—
  **antes** de destruirlo. Después no hay forma de recuperarlo.

## Paso 3 · Ordenar el tiro — por costo de cambio, no por orden narrativo

```
1. Mismo setup, mismo talento        → juntas y seguidas
2. Cambios de vestuario              → agrupados, NUNCA alternados
3. Escenas con producto destructivo  → al final de su bloque
4. Cobertura de cada escena          → antes de desarmar su setup, NUNCA al final del día
```

🛑 **La cobertura al final del día es cobertura que no se hace.** Cuando el día se atrasa —y se
atrasa— lo último es lo primero que se cae. Y volver a una locación cuesta más que todas las tomas
extra juntas.

❌ *"La cobertura la hacemos si sobra tiempo"* ✅ *"Cobertura de PR-005 antes de mover la luz"*

**La cobertura de cada locación se escribe en su jornada**, aparte del orden de tiro: segunda toma
buena · wide de la escena · detalle o inserto · reacción o pausa · **ambiente de 30 s, una vez por
locación**. Son **10-15 min por escena**; una vuelta a locación es una jornada.

🛑 **La cobertura no es una escena nueva:** no entra como fila al CSV, es parte del tiempo de set de
su escena.

## Paso 4 · Verificar que entre en el día — con márgenes reales

```
Carga de la jornada = montaje inicial (60-90 min)
                    + Σ tiempo de set de sus escenas
                    + Σ cambios de setup (30-45 min cada uno)
                    + comida (60 min)
                    + desmontaje (45 min)
```

**Los márgenes reales** — sin ellos no es un plan, es una lista de deseos:

| Margen | Tiempo |
|---|---|
| **Montaje inicial** completo | **60-90 min** |
| **Cambio de setup** de luz | **30-45 min** |
| Cambio de óptica · reubicar cámara con la misma luz | 5 · 10-15 min |
| **Cambio de locación** | **60 min + traslado real** (30 min si es el mismo edificio) |
| **Desmontaje** | **45 min** |

| Carga resultante | Qué hacer |
|---|---|
| **≤ 10 h** | ✅ Jornada viable |
| **10-12 h** | ⚠️ Se pasa la escena de menor traza a otra jornada |
| **> 12 h** | 🔴 **Se parte en dos jornadas. No se comprime** |

🛑 **Una jornada no pasa de 10 horas de trabajo efectivo.** Una jornada de 14 h en papel es una
jornada de 10 h en la que **la última mitad no se grabó**. Comprimir no ahorra: mueve el costo a una
jornada de recuperación que además es peor.

## Paso 5 · Declarar el factor de consolidación

```
Factor de consolidación = escenas de rodaje ÷ jornadas de rodaje
```

*(Las escenas de `J0` no cuentan: no se graban.)*

| Factor | Lectura | Qué hacer |
|---|---|---|
| **< 4** | **Mal agrupado**, o el Excel creativo pide locaciones muy dispersas | Volver al Paso 2. Si la dispersión es real, **devolver a ④ con el costo** |
| **4-10** | **Normal** | Seguir a Capa 3 |
| **> 10** | Muy eficiente | **Verificar que entre en horas**, no solo en papel |

🛑 **Un factor alto que no entra en el día no está consolidado: está sobrecargado.** El factor se
lee siempre **junto con la carga horaria**, nunca solo.

**El factor es el argumento del departamento.** Cuando ③ Marketing pregunta por qué un ciclo cuesta
más que el anterior, la respuesta casi nunca es *"subieron los precios"*: es que **el factor bajó**.

## Paso 6 · Cuando la dispersión es del Excel creativo

A veces no se puede consolidar porque ④ pidió 12 lugares distintos para 12 piezas. Eso **no se
resuelve acá**: se devuelve, **con números**.

```
↩️ DEVUELTO — dispersión de locaciones
12 piezas piden 12 locaciones distintas → factor 1.0 → 12 jornadas
Costo estimado: [monto + moneda]. Presupuesto disponible: [monto].

Alternativas, sin cambiar la intención de ninguna pieza:
A) 4 locaciones sirven para 9 de las 12 → factor 3.0 → 4 jornadas
   (CR-004, CR-007 y CR-011 mantienen locación propia por su concepto)
B) 8 piezas se resuelven en 2 locaciones si se acepta otro tipo de lugar
   equivalente → requiere confirmación de ④ Creatividad
```

🛑 **Se devuelve con alternativas concretas, no con un "no se puede".** Una devolución sin
alternativa es un bloqueo, y bloquear sin proponer es lo que hace que el resto del equipo resuelva
por su cuenta.

## QA — Capa 2

- [ ] La **matriz completa** del ciclo está armada **antes** de agrupar — ninguna escena afuera
- [ ] Agrupado por los **4 ejes en orden**: locación → talento → setup de luz → producto
- [ ] Las escenas sin rodaje (capturas, placas, composiciones de post) están en **`J0`** y **no cuentan para el factor**
- [ ] El **orden de tiro** de cada jornada está escrito en la sección de cada jornada de `plan-de-rodaje.md`, **por costo de cambio, no narrativo**
- [ ] Los cambios de vestuario están **agrupados, no alternados**
- [ ] El producto destructivo está **al final de su bloque**, con toma completa antes de destruirlo
- [ ] La **cobertura** está ubicada **antes de desarmar cada setup**, 🛑 **nunca al final del día**, y listada por jornada
- [ ] El tiempo estimado es **tiempo de set**, no `duracion_s` de la pieza
- [ ] La carga de cada jornada incluye **montaje, cambios de setup, comida y desmontaje** con los márgenes reales
- [ ] 🛑 **Ninguna jornada supera 10 h efectivas** — si no entra, **se parte, no se comprime**
- [ ] El **factor de consolidación** está declarado con su lectura, junto a las horas de cada jornada
- [ ] Si el factor es **< 4**: está explicado por qué, y devuelto a ④ **con números y dos alternativas** si la dispersión es del Excel creativo
- [ ] Si el factor es **> 10**: está verificado que entra en horas
- [ ] Toda fila del CSV tiene su **columna `jornada`** cargada — ninguna vacía
- [ ] 🛑 **Ninguna decisión creativa fue cambiada para lograr el agrupamiento**

**Handoff →** `pr-recursos` (Capa 3). Sin las jornadas cerradas no se puede asignar responsables ni
fechas de confirmación: **el margen de cada recurso se cuenta hacia atrás desde su jornada.**
