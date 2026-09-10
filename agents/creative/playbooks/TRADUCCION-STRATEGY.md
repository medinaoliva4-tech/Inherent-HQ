# Playbook — Traducción Strategy → Creative

**Qué resuelve.** Los dos departamentos razonan con vocabularios distintos, y ese hueco es el punto
exacto donde la cadena se rompe:

- **Strategy** emite `funcion` + `temperatura` + `awareness` — porque diseña un **sistema**.
- **Creative** necesita una **etapa** — porque la etapa es lo que manda sobre el hook y el CTA.

Sin una traducción fija, cada quien reasigna la etapa a gusto y la pieza deja de servir al slot que
la pidió.

> 🛑 **Regla dura:** Creative **hereda** `funcion`, `temperatura`, `awareness` y `objetivo_del_slot`
> tal cual, y **deriva** el `goal_del_arte` de esta tabla. **No reasigna ninguno de los cuatro.**
> Si un slot parece mal clasificado, se devuelve a Strategy — no se corrige acá.

---

## Los tres ejes que llegan, y qué decide cada uno

| Eje | Qué mide | Qué decide en la pieza |
|---|---|---|
| **`funcion`** | El rol de la pieza en el sistema | El **`goal_del_arte`** — es el eje que manda |
| **`temperatura`** | Relación con **la marca** | La **etapa** y el nivel de fricción del CTA |
| **`awareness`** | Relación con **el problema** | El **ángulo**: qué necesita escuchar esta persona |

> **Awareness ≠ temperatura.** Alguien puede estar `Most aware` del problema y **frío** con nosotros.
> Confundirlos produce piezas que le explican el problema a quien ya lo tiene resuelto.

**De dónde sale cada uno:**

| Campo | Archivo de origen |
|---|---|
| `funcion` · `temperatura` · `pilar` · `formato` · `canal` · `objetivo_del_slot` · `traza_a_must_be_true` · `semana` | `calendario-estrategico.csv` |
| `awareness` | `estrategia-de-contenido.md` §6.6 (especificación de piezas) |
| Función única y **qué NO se hace** por canal | `contenido-por-canal.md` |

---

## La tabla de traducción (obligatoria)

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
La frase entre paréntesis es aclaración, **no el valor**. En el Excel va el valor.

### Cuando la temperatura no es la típica

Es normal: son **dos ejes independientes** (Strategy §6.3 — la función la decide el problema
diagnosticado, la temperatura es otro eje). Un slot `Utility` + `Frío` es válido.

> **Regla:** se conserva el `goal_del_arte` **de la función**, se ajusta la etapa y la fricción del
> CTA según la temperatura real, y se declara `🟡 temperatura atípica — [ajuste aplicado]`.
> Nunca se cambia la función para que encaje en la tabla.

**Cómo se lee una fila del calendario:**

```
Slot:  semana 3 · Instagram · funcion=Proof · pilar=Educativo · temperatura=Tibio · formato=Carrusel
       objetivo_del_slot="Responder objeción #1" · traza=A
       awareness=Solution aware  (de estrategia-de-contenido.md §6.6)
       ↓
Brief: goal_del_arte = confianza · etapa = MOFU
       hook candidato = Curiosity Gap · CTA = tráfico o DM
       ángulo = "por qué esta forma y no otra"  (lo dicta awareness=Solution aware)
       fecha = un día dentro de la semana 3, respetando frecuencia
```

---

## `objetivo_del_slot` y `goal_del_arte` no compiten

El `goal_del_arte` es **grueso** (6 valores, decide hook y CTA). El `objetivo_del_slot` que escribió
Strategy es **específico** (*"Responder objeción #1"*, *"Ocupar el CEP de martes 18-20h"*).

**Los dos van al Excel, y el segundo manda sobre el contenido concreto.**

> 🛑 **Verificación obligatoria:** el `goal_del_arte` derivado **no puede contradecir** el
> `objetivo_del_slot`. Si lo contradice, el slot está mal clasificado: **se devuelve a Strategy**,
> no se elige uno de los dos.

---

## `fecha`: lo único que Creative fija del calendario

El calendario de Strategy trabaja en **semanas** (`semana` + `frecuencia`), no en días.

| | Quién decide |
|---|---|
| La **semana**, el canal, la frecuencia | 🛑 **Strategy.** No se mueven |
| El **día concreto** dentro de esa semana | Creative, respetando la `frecuencia` del slot y la estacionalidad de `ingenieria-inversa.md` §1.2e |

Es la única excepción a *"el calendario es un encargo"*, y existe porque el Excel va a producción y
producción necesita un día. Si el cliente tiene días fijos declarados, se respetan; si no hay
criterio, se distribuye uniforme dentro de la semana.

---

## El ángulo lo dicta el awareness

La etapa decide el **hook y el CTA**. El awareness decide **qué se dice**. Son dos decisiones
distintas y las dos van en el brief.

**Los 5 estados, con las etiquetas exactas de Strategy §1.5** — se copian literales, no se abrevian:

| `awareness` | Qué sabe | El ángulo de la pieza |
|---|---|---|
| **Unaware** | No sabe que tiene el problema | Que el problema existe y le está costando algo |
| **Problem aware** | Sabe el problema, no la solución | Que hay una forma de resolverlo |
| **Solution aware** | Conoce el tipo de solución, no las marcas | **Por qué esta forma y no otra** — acá entra el mecanismo único |
| **Product aware** | Nos conoce, no está convencido | Prueba, diferencia, respuesta a la objeción |
| **Most aware** | Convencido, no compró | La oferta y por qué ahora |

**Regla:** una pieza de `awareness=Unaware` que arranca hablando del producto está desperdiciada,
sin importar cuán bueno sea el hook.

---

## Post-compra: el hueco que TOFU/MOFU/BOFU no cubre

El funnel de adquisición tiene tres etapas; la temperatura de Strategy tiene **cuatro** estados —
`Cliente` incluido. Los slots de función **Community** caen ahí.

| | Tratamiento |
|---|---|
| **Etapa** | `Post-compra` — se escribe así, no se fuerza a BOFU |
| **`goal_del_arte`** | `pertenencia` |
| **CTA** | Engagement (participación), nunca venta |
| **Métrica** | Respuestas, UGC, referidos — no leads |

> Forzar un slot de Community a BOFU produce una pieza que le vende a quien ya compró. Es el error
> más común al mezclar los dos vocabularios.

---

## El balance marca/activación también se hereda

El calendario trae la columna `balance` (Marca / Activación). Creative **no la cambia**, y la
respeta así:

| `balance` | Qué significa para la pieza |
|---|---|
| **Marca** | El objetivo es memoria: pesa el activo distintivo, el hook y la consistencia. CTA suave |
| **Activación** | El objetivo es respuesta: pesa la oferta, la prueba y la fricción baja. CTA directo |

🛑 Una pieza de balance `Marca` con CTA de conversión rompe el slot. Si hace falta activar y el slot
dice Marca, se devuelve a Strategy.

---

## Checklist de traducción (por slot)

- [ ] `funcion`, `temperatura`, `objetivo_del_slot` y `traza_a_must_be_true` **copiados tal cual** del calendario
- [ ] `awareness` copiado de `estrategia-de-contenido.md` §6.6, **con la etiqueta literal de Strategy**
- [ ] `goal_del_arte` **derivado de la función**, del vocabulario cerrado de 6 valores
- [ ] El `goal_del_arte` **no contradice** el `objetivo_del_slot`
- [ ] Si la temperatura no es la típica: `🟡 temperatura atípica` + ajuste declarado
- [ ] Etapa declarada (TOFU / MOFU / BOFU / Post-compra)
- [ ] Caja de hook candidata, de las que pesan en esa fila
- [ ] Familia de CTA declarada
- [ ] Ángulo declarado según el `awareness`
- [ ] `balance` respetado en el nivel de fricción del CTA
- [ ] `fecha` fijada dentro de la semana del slot, respetando la frecuencia
- [ ] La función del canal coincide con `contenido-por-canal.md`, y su **"qué NO se hace acá"** está leído
- [ ] Si algo no encaja: **devuelto a Strategy**, no corregido acá

---

## Qué hacer cuando el slot está incompleto o inconsistente

| Situación | Qué hace Creative |
|---|---|
| Falta `traza_a_must_be_true` | **No produce la fila.** Devuelve el slot a Strategy |
| Falta `awareness` | Lo busca en `estrategia-de-contenido.md` §6.6. Si no está: `⚠️ SIN DATOS` y se declara que el ángulo queda con confianza reducida |
| Falta `funcion` | **BLOQUEADO.** Es la que genera el `goal_del_arte`; sin ella no hay brief |
| Falta `temperatura` | Se usa la típica de la función y se marca `🟡 temperatura asumida` |
| Combinación `funcion` + `temperatura` no listada | Se aplica la fila **de la función** y se declara `🟡 temperatura atípica` |
| Falta `formato` | Se propone desde `contenido-por-canal.md` (y si no está ahí, de `toolkit/07-plataformas.md`) y se marca `🟡 propuesto por Creative` para que Strategy lo confirme |
| El `goal_del_arte` contradice el `objetivo_del_slot` | Se devuelve el slot. **No se elige uno de los dos** |
| **Dos canales distintos con la misma `funcion`** | Devuelve: Strategy define **una función distinta por canal** (§6.4 — *"si dos canales hacen lo mismo, uno sobra"*) |
| **Un canal con una `funcion` que `contenido-por-canal.md` no le asigna** | Devuelve el slot: el calendario contradice el sistema |
