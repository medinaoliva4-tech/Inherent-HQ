---
name: pr-brief
description: >
  Capa 0 de ⑤ Producción — verifica qué hay que producir antes de gastar un minuto en desglosar.
  Carga los inputs, exige el Excel del ciclo cerrado de ④ Creatividad, filtra las filas con
  `material = video` o `material = foto`, verifica fila por fila que la pieza sea producible, cruza contra el banco de assets
  para no volver a grabar lo que ya existe y declara el techo de realidad: días de rodaje posibles y
  capacidad, con el presupuesto del onboarding como referencia. Escribe la sección § Verificación y
  devoluciones de `plan-de-rodaje.md`.
  Úsala cuando pidan "arrancá el plan de producción de X", "qué vamos a producir este ciclo",
  "esto se puede grabar", "verificá si estas piezas son producibles", "qué ya tenemos grabado",
  "cuánto margen real hay". Bloquea si el Excel del ciclo de ④ Creatividad no está cerrado.
---

# Capa 0 · Brief — qué hay que producir, exactamente

| | |
|---|---|
| **Consume** | **El Excel del ciclo cerrado** —`plan-de-contenido.csv` cerrado y el `ideas-<formato>.md` de cada pieza— de ④ Creatividad (`clients/<cliente>/04-contenido/AAAA-MM/ideas/`) · fechas de campaña y **de preparación** de ③ Marketing · **si existen:** guía de marca y **banco de assets** de ②B Branding · capacidad declarada, presupuesto de referencia y restricciones de ① Strategy |
| **Produce** | La sección **§ Verificación y devoluciones** de `plan-de-rodaje.md` — piezas y escenas recibidas, techo de realidad, tabla de producibilidad, material reutilizable y escenas devueltas a ④ Creatividad |

Contexto del departamento: `agents/05-production/brain/WORKFLOW.md`. Plantilla del entregable:
`agents/05-production/brain/entregables/plan-de-rodaje.md`.

**No decidís nada: leés y verificás.** Nada de lo que escribís acá es una decisión creativa ni una
decisión de producción. Es la verificación de que lo que llegó **se puede producir**.

## 1 · Los inputs

| De | Qué se carga | Si falta |
|---|---|---|
| **④ Creatividad** | **El Excel del ciclo cerrado** —`plan-de-contenido.csv` cerrado—, filtrado a `material = video` o `material = foto`. Del `ideas-<formato>.md` de cada pieza: escenas, encuadres, duraciones, tipo de lugar, estética/mood, concepto, emoción — y de las de foto, la **§ Foto** | 🛑 **BLOQUEADO** |
| **③ Marketing** | Fechas de la campaña y **fechas de preparación** — cuánto margen real hay | 🛑 **BLOQUEADO** |
| **②B Branding** | Guía de marca, dirección visual, paleta, do's & don'ts y el **banco de assets existente** | `⚠️ SIN DATOS` — se usa si existe |
| **① Strategy** | Capacidad de producción declarada · presupuesto de producción del onboarding · restricciones reales | `⚠️ SIN DATOS` — se usa si existe. **El presupuesto es referencia**, no techo ni bloqueo |

🛑 **Sin el Excel del ciclo cerrado no hay rodaje.** No se negocia: producir sobre ideas que todavía
pueden cambiar es gastar dos veces la misma plata.
🛑 **Falta un bloqueante → BLOQUEADO**, y se nombra **el archivo exacto y a quién pedírselo**.

❌ *"Arrancamos con lo que hay y después ajustamos"*
✅ `BLOQUEADO — falta clients/<cliente>/04-contenido/2026-11/ideas/plan-de-contenido.csv cerrado. Se lo pide a ④ Creatividad.`

🛑 **Ningún archivo de otro departamento se copia: se cita su ruta.** Duplicarlo crea una segunda
versión de la verdad, y en dos ciclos no coinciden.

**Después de cargar:** se filtran **solo** las filas con `material = video` o `material = foto` y se
**agrupan por `campana`**. Las de `material = ninguno` no pasan por Producción. El Excel se lee y se revisa por campaña.

## 2 · El pre-flight, antes de tocar nada

```
PRE-FLIGHT — Cliente: [x] · Capa: 0 · Campañas: [nombres]
④ Creatividad: Excel del ciclo cerrado [✅/⬜] · material=video: [n] · material=foto: [n] · escenas totales: [n]
③ Marketing fechas de preparación [✅/⬜] · ②B Branding [✅/⚠️] · ① Strategy capacidad y presupuesto [✅/⚠️]
Techo: días posibles [n] · capacidad [n piezas] · presupuesto de referencia [monto / ⚠️ SIN DATOS]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

## 3 · Verificación de producibilidad — fila por fila

Se verifica **cada pieza con `material = video` o `material = foto`**, sin muestreo. **Las de foto se
verifican contra su § Foto, no contra Escenas.** Una fila que no se verificó es una fila
que se va a caer en la Capa 1.

| Chequeo | Qué se mira | Si falla → qué se devuelve |
|---|---|---|
| **Shot list íntegro** | Escenas, encuadres y duraciones con el **mismo número de ítems y el mismo orden** | ↩️ **DEVUELTO** a ④ Creatividad — motivo 1, *shot list roto*. No se puede desglosar una escena sin su encuadre |
| **Acción y lugar por escena** | Cada escena dice **qué acción ocurre y en qué tipo de lugar** | ↩️ **DEVUELTO** a ④ Creatividad — motivo 2. Sin acción ni lugar no hay nada que conseguir |
| **Estética/mood y emoción** | La pieza las declara en su `ideas-<formato>.md` | ↩️ **DEVUELTO** a ④ Creatividad — el equipo dirigiría a ciegas: sin mood no hay luz, sin emoción no hay dirección de actor |
| **Coherencia con ②B Branding** *(si existe la guía)* | Lo pedido no contradice la guía, la paleta ni los do's & don'ts | **Se declara y se escala a ④ Creatividad y ②B Branding.** 🛑 **No se resuelve en set** — es un conflicto entre dos departamentos, no una devolución |
| **¿Ya existe material que sirve?** | Cruce contra el banco de assets de ②B Branding | Se marca `reutiliza` y **no se vuelve a grabar**: la escena no entra al desglose |

La tabla se escribe tal cual en `plan-de-rodaje.md`, una fila por pieza, con veredicto:

```
| Pieza  | Shot list | Acción y lugar | Mood y emoción | ¿Reutiliza? | Veredicto |
| CR-001 | ✅        | ✅             | ✅             | ⬜          | producible |
| CR-004 | ❌ 3 escenas / 2 encuadres | ✅ | ✅ | ⬜ | ↩️ DEVUELTO (motivo 1) |
```

🛑 **Ninguna decisión creativa se cambia.** Ni una. Si algo no se puede, **se devuelve con motivo y
dos alternativas** — nunca se reescribe el encuadre, la acción ni la duración por cuenta propia.

## 4 · El techo de realidad — se declara antes de seguir

Los dos techos van **en números**, no en adjetivos — y al lado, la referencia de presupuesto:

```
Días de rodaje posibles:    [n]   ← según fechas de preparación de ③ Marketing
Capacidad:                  [n piezas/ciclo]   ← horas y sesiones de la ficha · la declarada en ① Strategy si es menor
Presupuesto de referencia:  [monto + moneda + fecha / ⚠️ SIN DATOS]   ← onboarding, si existe
```

🔑 **El presupuesto del onboarding es referencia, no techo:** dice por dónde presupuestar. Cada
campaña o sesión puede tener el suyo. Lo que cuesta se cierra en la Capa 4: si pasa la referencia,
se escala al CEO —es precio— y el resto sigue.

**Si el Excel creativo pide más de lo que entra en cualquiera de los dos techos**, el exceso se
declara **en filas concretas** y se devuelve:

| Techo excedido | Cómo se declara | A quién va |
|---|---|---|
| **Días posibles** | *"`CR-003` necesita 2 jornadas y solo queda 1 en la ventana de preparación"* | **③ Marketing** |
| **Capacidad** | *"entran 8 piezas y el Excel pide 12: exceden `CR-009` a `CR-012`"* | **③ Marketing** |

🛑 **Nunca se recorta en silencio.** Sacar filas sin declararlo es la forma más cara de romper una
campaña: se descubre en la edición, cuando ya no hay presupuesto para volver.
🛑 **Producción nunca elige sola qué pieza se cae.** Propone con números; deciden ③ Marketing y
④ Creatividad.

❌ *"No entra todo, armé el plan con las 8 más importantes"*
✅ *"Entran 8 de 12. Exceden `CR-009` a `CR-012`. Decide ③ Marketing."*

## 5 · Verificación de reutilización — la que más plata ahorra

> 🛑 **Antes de desglosar, se cruza contra el banco de assets.** **Media campaña suele estar grabada
> ya.** Es lo que más plata ahorra y lo que menos se hace.

Se cruza **escena por escena** contra el banco de ②B Branding, no pieza por pieza: casi nunca sirve una pieza
entera, casi siempre sirven 2 o 3 escenas.

| Qué se pregunta | Qué se hace |
|---|---|
| ¿Existe material con **la misma acción y un encuadre compatible**? | Se marca `reutiliza`, **no entra al desglose** y se cuentan las escenas ahorradas |
| ¿Existe pero con **otro encuadre o duración**? | Se declara como **parcial**: sirve de b-roll, la escena principal se graba igual |
| ¿Existe pero **fuera de guidelines vigentes**? | No se reutiliza. Se anota el motivo — si no, el próximo ciclo se vuelve a proponer |
| ¿No existe nada? | Se escribe explícito: *"sin material previo"* |

```
| Qué se necesitaba | Qué hay en el banco de assets | Escenas que se ahorran |
| CU del plato, 3s  | <cliente>_<campaña>_E4_video (ruta) | PR-002 · PR-014 → 2 escenas |
```

🛑 **Si esta tabla queda vacía, el cruce no se hizo.** *"Sin material previo"* escrito es un
resultado; una tabla en blanco no.

## 6 · Las devoluciones a ④ Creatividad — los 3 elementos, sin excepción

| Elemento | Por qué es obligatorio |
|---|---|
| **Qué no se puede** | En términos físicos y verificables. *"Es muy complicado"* **no es un motivo** |
| **Por qué importa** | Se cita la **intención** que se rompería: la emoción, el concepto, el objetivo. Demuestra que se leyó la pieza, no solo la escena |
| **Mínimo dos alternativas** | Con su viabilidad de fecha y costo. Una devolución sin alternativa obliga a ④ Creatividad a empezar de cero |

Los motivos válidos en esta capa son **1** (shot list roto), **2** (escena sin acción ni lugar) y
**4** (imposibilidad de calendario). Los motivos 3, 5 y 6 aparecen recién al desglosar y costear.

- Una devolución sin dos alternativas concretas **es un bloqueo, no una devolución**.
- La respuesta de ④ Creatividad a cada devolución se registra **con fecha**.

## 7 · Qué escribe en `plan-de-rodaje.md`

Una sola sección, § Verificación y devoluciones, con estos bloques:

| Bloque | Qué lleva |
|---|---|
| **Piezas recibidas** | `[n]` con `material = video` · `[n]` con `material = foto` · escenas totales `[n]` · agrupadas por `campana` · con la **ruta** del Excel creativo |
| **Techo de realidad** | Días y capacidad + la referencia de presupuesto + el veredicto *¿entra?* ✅ / ⚠️ con el exceso en filas concretas |
| **Verificación de producibilidad** | La tabla fila por fila, con veredicto por pieza |
| **Material que ya existe** | La tabla de reutilización, con escenas ahorradas contadas |
| **Escenas devueltas a ④ Creatividad** | Escena · motivo (de los 6) · intención que se rompería · alternativa 1 · alternativa 2 |

No escribe filas de `plan-de-produccion.csv` ni toca `presupuesto.csv`: eso es Capa 1 y Capa 4.

## QA — Capa 0

- [ ] **El Excel del ciclo de ④ Creatividad está cerrado** — `plan-de-contenido.csv` cerrado — si no, **BLOQUEADO**
- [ ] Las fechas de campaña y **de preparación** de ③ Marketing están cargadas — si no, **BLOQUEADO**
- [ ] La guía y el **banco de assets** de ②B Branding están cargados si existen — si no, `⚠️ SIN DATOS`
- [ ] La capacidad y el presupuesto de referencia de ① Strategy están **cuantificados** si existen — si no, `⚠️ SIN DATOS`
- [ ] Cada input está **citado con su ruta**, ninguno copiado
- [ ] Solo se filtraron las filas con **`material = video`** o **`material = foto`**
- [ ] 🛑 Toda fila con **`material = foto`** tiene su **§ Foto** completa, o está **↩️ DEVUELTA**
- [ ] Las filas están **agrupadas por `campana`**
- [ ] **Producibilidad verificada fila por fila:** escenas, encuadres y duraciones tienen el mismo número de ítems y el mismo orden
- [ ] Cada escena declara **qué acción ocurre y en qué tipo de lugar**
- [ ] Cada pieza tiene **estética/mood y emoción** — sin ellas el equipo dirige a ciegas
- [ ] Las contradicciones con ②B Branding están **declaradas y escaladas**, no resueltas acá
- [ ] **Cruce contra el banco de assets hecho:** lo que ya existe está marcado `reutiliza` y **no entra al desglose**
- [ ] La tabla de reutilización **no está vacía** — si no hay material, dice *"sin material previo"*
- [ ] Los **dos techos** están declarados en números —días de rodaje · capacidad— y el presupuesto de referencia al lado
- [ ] Si el ciclo excede algún techo: el exceso está declarado **en filas concretas**, no en general
- [ ] 🛑 **Nada se recortó en silencio** — el exceso va a ③ Marketing para que decida
- [ ] Las devoluciones ↩️ tienen los **tres elementos** (qué no se puede · por qué importa · dos alternativas)
- [ ] La respuesta de ④ Creatividad a cada devolución queda registrada **con fecha**
- [ ] 🛑 **Ninguna decisión creativa fue cambiada**
- [ ] Todo faltante está marcado `BLOQUEADO` o `⚠️ SIN DATOS`, **ninguno omitido en silencio**

**Handoff →** `pr-desglose` (Capa 1). Lo que se marcó `reutiliza` **no se desglosa**, y lo devuelto a
④ Creatividad no avanza hasta tener respuesta con fecha.
