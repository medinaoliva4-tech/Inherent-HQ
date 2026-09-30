---
name: cr-brief
description: >
  Capa 0 de ④ Creatividad — traduce el encargo de ③ Marketing en un brief que se puede idear.
  Carga el contexto de ①②③ y ②B Branding, agrupa los slots del ciclo por campaña, traduce
  funcion + temperatura + awareness a goal del arte y etapa del funnel, fija la fecha de cada slot
  y declara el reparto 70/20/10 previsto. Escribe la sección "El brief del ciclo" dentro de
  brief-del-ciclo.md. Úsala cuando pidan "traducí la estrategia de X a brief", "armá el brief del ciclo",
  "qué pide este slot", "en qué etapa juega esta pieza", "qué goal del arte le toca acá",
  "arrancá el ciclo de contenido de X". Bloquea si falta el posicionamiento aprobado de
  ② Estrategia o el plan de campañas de ③ Marketing.
---

# Capa 0 · Brief — traducir el encargo

| | |
|---|---|
| **Consume** | Entregables de ① Comprensión · ② Estrategia · ③ Marketing · ②B Branding · el calendario con los slots del ciclo · claims ya aprobados de ⑧B Ads *(no bloqueante)* |
| **Produce** | La sección **"El brief del ciclo"** dentro de `brief-del-ciclo.md` · la columna `fecha` de cada fila futura de `plan-de-contenido.csv` |

Contexto del departamento: `agents/creative/WORKFLOW.md`.

**Traducís. Todavía no ideás.** Convertís lo que otros departamentos ya resolvieron en un encargo
que se puede idear sin adivinar. Nada de lo que escribís acá es una decisión creativa.

## 1 · Contexto que se carga

| Archivo | De | ¿Bloqueante? |
|---|---|---|
| Posicionamiento **aprobado** (promesa, mecanismo, enemigo, objeciones) | ② Estrategia | 🛑 Sí |
| Ingeniería inversa (tabla 15×7, mapa de saturación, lenguaje literal del comprador) | ② Estrategia | 🛑 Sí |
| Plan de campañas **aprobado** · sistema de contenido · pilares y su mix | ③ Marketing | 🛑 Sí |
| Plan por canal — **función única y "qué NO se hace acá"** | ③ Marketing | 🛑 Sí |
| Calendario con los slots del ciclo | ③ Marketing | 🛑 Sí |
| Núcleo: audiencia, competencia, producto y **capacidad real de producción** | ① Comprensión | 🛑 Sí |
| Guidelines, tono de voz y **lente de marca** | ②B Branding | 🛑 Sí |
| Qué creativo rinde en pauta + claims ya aprobados | ⑧B Ads | No |

🛑 **Si falta un bloqueante: BLOQUEADO.** Se nombra el archivo exacto y a quién pedírselo.
❌ Reconstruir el posicionamiento leyendo el calendario ✅ Nombrar qué falta y parar.

🛑 **Ningún campo de otro departamento se reescribe: se cita con su ruta y sección.** Reescribirlo
crea una segunda versión de la verdad, y en dos ciclos no coinciden.

## 2 · Los tres ejes que llegan, y qué decide cada uno

| Eje | Qué mide | Qué decide en la pieza |
|---|---|---|
| **`funcion`** | El rol de la pieza en el sistema | El **`goal_del_arte`** — es el eje que manda |
| **`temperatura`** | Relación con **la marca** | La **etapa** y el nivel de fricción del CTA |
| **`awareness`** | Relación con **el problema** | El **ángulo**: qué necesita escuchar esta persona |

> **Awareness ≠ temperatura.** Alguien puede estar `Most aware` del problema y **frío** con nosotros.
> Confundirlos produce piezas que le explican el problema a quien ya lo tiene resuelto.

`funcion`, `temperatura`, `pilar`, `formato`, `canal`, `objetivo_del_slot`, `traza` y `semana` salen
del **calendario** (`calendario-estrategico.csv`); el `awareness`, de la **Sección 3 · Especificación
de piezas** de `estrategia-de-contenido.md`.
🛑 Creative **hereda los cuatro tal cual y no reasigna ninguno**. Si un slot parece mal clasificado,
**se devuelve a ③ Marketing** — no se corrige acá.

> 🛑 **La `campana` no viene en el calendario.** El `calendario-estrategico.csv` trae `semana` y
> `fase_del_movimiento`, **no una columna de campaña**. El nombre sale de
> `estrategia-de-contenido.md` § *Idea de campaña*: es **una por ciclo** —dos si ③ eligió dos
> movimientos— y su § *Cómo vive en el tiempo* dice a qué fase corresponde cada semana.
> Creative **copia ese nombre; no lo inventa ni lo abrevia**. Si no hay idea de campaña escrita:
> **BLOQUEADO**, y se pide a ③ Marketing. Una campaña inventada acá rompe la aprobación por campaña
> del ciclo y el `TOTAL` por campaña del presupuesto de ⑤.

## 3 · La tabla de traducción (obligatoria)

**La `funcion` decide el `goal_del_arte`.** La `temperatura` ajusta la etapa y la fricción del CTA.

| `funcion` | → `goal_del_arte` | Temperatura **típica** | `awareness` típico | Etapa | Cajas de hook que pesan | Familia de CTA |
|---|---|---|---|---|---|---|
| **Hero** | `alcance` *(ruptura de patrón)* | Frío | Unaware · Problem aware | TOFU | Pattern Interrupt · Bold Claim · Pain | Engagement |
| **Series** | `memoria` *(repetición)* | Frío → Tibio | Problem aware · Solution aware | TOFU → MOFU | List/Number · Story/Tease | Engagement |
| **Utility** | `valor-de-uso` *(enseñar)* | Tibio | Problem aware · Solution aware | MOFU | List/Number · Question | Tráfico |
| **Proof** | `confianza` *(responder objeción)* | Tibio | Solution aware · Product aware | MOFU | Curiosity Gap · Bold Claim con dato | Tráfico o DM |
| **Conversion** | `accion` | Caliente | Product aware · Most aware | BOFU | Pain · Question directa · Bold Claim | Conversión |
| **Community** | `pertenencia` *(recurrencia)* | Cliente | Most aware | Post-compra | Story/Tease · Question | Engagement |

**Los 6 valores de `goal_del_arte` son un vocabulario cerrado:**
`alcance · memoria · valor-de-uso · confianza · accion · pertenencia`
La frase entre paréntesis es aclaración, **no el valor**. En el brief se escribe el valor, tal cual.

**Cuando la temperatura no es la típica** es normal: son dos ejes independientes. Un slot
`Utility` + `Frío` es válido.

> **Regla:** se conserva el `goal_del_arte` **de la función**, se ajusta la etapa y la fricción del
> CTA según la temperatura real, y se declara `🟡 temperatura atípica — [ajuste aplicado]`.
> 🛑 **Nunca se cambia la función para que encaje en la tabla.**

**Cómo se lee una fila del calendario:**

```
Slot:  semana 3 · Instagram · funcion=Proof · temperatura=Tibio · formato=Carrusel
       objetivo_del_slot="Responder objeción #1" · traza=A · awareness=Solution aware
       ↓
Brief: goal_del_arte=confianza · etapa=MOFU · hook=Curiosity Gap · CTA=tráfico o DM
       ángulo="por qué esta forma y no otra" · fecha=un día de la semana 3
```

## 4 · `objetivo_del_slot` y `goal_del_arte` no compiten

El `goal_del_arte` es **grueso** (6 valores, decide hook y CTA). El `objetivo_del_slot` que escribió
③ Marketing es **específico** (*"Responder objeción #1"*, *"Ocupar el CEP de martes 18-20h"*), y
**manda sobre el contenido concreto**.

> 🛑 **Verificación obligatoria:** el `goal_del_arte` derivado **no puede contradecir** el
> `objetivo_del_slot`. Si lo contradice, el slot está mal clasificado: **se devuelve a ③ Marketing**.
> ❌ Elegir uno de los dos y seguir · ✅ devolver el slot con la contradicción escrita.

## 5 · La `fecha`: lo único que Creative fija del calendario

El calendario de ③ Marketing trabaja en **semanas**, no en días.

| | Quién decide |
|---|---|
| La **semana**, el canal, la campaña, la cadencia | 🛑 **③ Marketing.** No se mueven |
| El **día concreto** dentro de esa semana | Creative, respetando la `frecuencia` y la estacionalidad |

Es la única excepción a *"el calendario es un encargo"*, y existe porque `plan-de-contenido.csv` va
a producción y producción necesita un día. Si el cliente tiene días fijos declarados se respetan;
si no, se distribuye uniforme dentro de la semana.

## 6 · El ángulo lo dicta el `awareness`

La etapa decide el **hook y el CTA**; el awareness decide **qué se dice**. Las etiquetas se copian
literales de ③ Marketing — abreviarlas es reescribirlas.

| `awareness` | Qué sabe | El ángulo de la pieza |
|---|---|---|
| **Unaware** | No sabe que tiene el problema | Que el problema existe y le está costando algo |
| **Problem aware** | Sabe el problema, no la solución | Que hay una forma de resolverlo |
| **Solution aware** | Conoce el tipo de solución, no las marcas | **Por qué esta forma y no otra** — acá entra el mecanismo único |
| **Product aware** | Nos conoce, no está convencido | Prueba, diferencia, respuesta a la objeción |
| **Most aware** | Convencido, no compró | La oferta y por qué ahora |

Una pieza `Unaware` que arranca hablando del producto está desperdiciada, por bueno que sea el hook.

## 7 · Post-compra — el hueco que TOFU/MOFU/BOFU no cubre

La temperatura de ③ Marketing tiene **cuatro** estados, `Cliente` incluido. Los slots de función
**Community** caen ahí.

| | Tratamiento |
|---|---|
| **Etapa** | `Post-compra` — se escribe así, **no se fuerza a BOFU** |
| **`goal_del_arte`** | `pertenencia` |
| **CTA** | Engagement (participación), nunca venta |
| **Métrica** | Respuestas, UGC, referidos — no leads |

> Forzar un slot de Community a BOFU produce una pieza que le vende a quien ya compró: el error más
> común al mezclar los dos vocabularios.

**El `balance` (Marca / Activación) también se hereda y no se cambia:** `Marca` → pesa el activo
distintivo, CTA suave · `Activación` → pesa la oferta y la prueba, CTA directo. 🛑 Balance `Marca`
con CTA de conversión rompe el slot: se devuelve a ③ Marketing.

## 8 · Qué escribe en `brief-del-ciclo.md`

Una sola sección, `## El brief del ciclo`, con estos bloques:

| Bloque | Qué lleva |
|---|---|
| **A · Contexto cargado** | Checklist con estado y **ruta** de cada archivo de ①②③ y Branding |
| **B · Extracto de estrategia** | Promesa, mecanismo único, enemigo, territorio, activos, CEPs, objeciones + RTB, idea de campaña — **citados con ruta y sección, nunca reescritos** |
| **C · Jerarquía de mensaje** | Copiada tal cual de ③ Marketing. Es la ley del ciclo |
| **D · Avatar** | Dolores, deseo y **lenguaje literal**, declarado **como filtro de ideas**, no re-analizado |
| **E · Slots por campaña** | Las filas del calendario **sin editar**, agrupadas bajo la campaña de `estrategia-de-contenido.md` |
| **F · Traducción** | Por slot: `goal_del_arte` · etapa · caja de hook candidata · familia de CTA · ángulo · `fecha` |
| **G · Función y vetos por canal** | La función única y el **"qué NO se hace acá"** de cada canal, copiados |
| **H · Restricciones** | Capacidad → **cuántas filas caben** · do's & don'ts · claims aprobados · **reparto 70/20/10 previsto** |

🛑 **La capacidad de producción es techo duro.** Si el calendario pide más de lo que el cliente
puede producir, **se declara y se devuelve a ③ Marketing** — no se recorta en silencio.

## 9 · Cuando el slot llega incompleto o inconsistente

| Situación | Qué hace Creative |
|---|---|
| Falta `funcion` | **BLOQUEADO.** Es la que genera el `goal_del_arte` |
| No hay **idea de campaña** en `estrategia-de-contenido.md` | **BLOQUEADO.** Sin campaña el ciclo no se puede aprobar ni presupuestar. Se pide a ③ Marketing |
| Falta `traza` a MUST BE TRUE | **No produce la fila.** Devuelve el slot |
| Falta `awareness` | Lo busca en la especificación de tipos de pieza; si no está, `⚠️ SIN DATOS` y ángulo con confianza reducida |
| Falta `temperatura` | Se usa la típica de la función + `🟡 temperatura asumida` |
| Falta `formato` | Se propone del plan por canal + `🟡 propuesto por Creative`, para que ③ lo confirme |
| `goal_del_arte` contradice el `objetivo_del_slot` · dos canales con la misma `funcion` · un canal con una `funcion` que el plan no le asigna | **Se devuelve el slot a ③ Marketing** |

## QA — Capa 0

- [ ] Los entregables de **①②③ y Branding** existen y están **citados con su ruta**
- [ ] El **posicionamiento de ② Estrategia está aprobado** — si no, **BLOQUEADO**
- [ ] El **plan de campañas de ③ Marketing está aprobado** — si no, **BLOQUEADO**
- [ ] Guidelines y **lente de marca** cargados — si no, **BLOQUEADO**
- [ ] Promesa, mecanismo único, enemigo y activos distintivos **citados, no reescritos**
- [ ] La **jerarquía de mensaje** de ③ Marketing está copiada tal cual
- [ ] El avatar está declarado **como filtro de ideas**, no re-analizado
- [ ] Los slots del ciclo están copiados del calendario **sin editar** y **agrupados por campaña**
- [ ] **Cada slot quedó bajo una `campana`** copiada de `estrategia-de-contenido.md` § *Idea de campaña* — ninguna fila cuelga de la nada, y ninguna campaña fue inventada acá
- [ ] El **reparto 70/20/10 previsto** está declarado
- [ ] Cada slot tiene su `goal_del_arte` **derivado de la función**, del vocabulario cerrado de 6
- [ ] El `goal_del_arte` **no contradice** el `objetivo_del_slot` heredado
- [ ] Si la temperatura no es la típica: `🟡 temperatura atípica` + ajuste declarado
- [ ] La `fecha` está fijada **dentro de la semana** del slot, respetando la frecuencia
- [ ] Cada slot tiene etapa declarada (TOFU / MOFU / BOFU / **Post-compra**)
- [ ] Cada slot tiene `traza` a MUST BE TRUE — los que no, **devueltos a ③ Marketing**
- [ ] El `awareness` está con la **etiqueta literal** (`Unaware` / `Problem aware` / `Solution aware` / `Product aware` / `Most aware`), o `⚠️ SIN DATOS` con confianza reducida
- [ ] La **función única y el "qué NO se hace acá"** de cada canal están copiados
- [ ] La capacidad de producción está cuantificada: **cuántas filas caben**
- [ ] Los claims ya aprobados por ⑧B Ads están listados
- [ ] Ningún campo de estrategia fue reescrito con otras palabras

🚦 **GATE 1** — un humano confirma que el brief refleja la estrategia **antes** de gastar tiempo
ideando sobre una lectura equivocada.

**Handoff →** `cr-swipe-file` (Capa 1).
