---
name: cr-swipe-file
description: >
  Capa 1 de ④ Creatividad — la bóveda de referencias y el análisis de piezas ganadoras. Arranca de
  la tabla 15×7 que ② Estrategia ya descompuso, cosecha solo el hueco, filtra por señal de
  rendimiento (un ad de 60-90+ días es un ad que paga; un orgánico vale si es outlier contra su
  propia base), extrae el patrón —nunca la imagen—, lo clasifica en 70/20/10 y lo traduce a
  hipótesis verificadas contra el mapa de saturación. Úsala cuando pidan "armá el swipe file",
  "buscá referencias", "qué está funcionando en este formato", "analizá estos ads", "qué hooks
  están ganando", "de dónde sacamos el 70 probado". No re-mapea la categoría: eso ya lo hizo
  ② Estrategia.
---

# Capa 1 · Swipe file — qué ya funciona y por qué

| | |
|---|---|
| **Consume** | El brief del ciclo (de `cr-brief`) · la tabla 15×7 y el mapa de saturación de ② Estrategia · los anuncios que trae `cr-fuentes` · las fichas de referencia que produce `cr-lectura-de-video` · el banco de hooks propio del ciclo anterior |
| **Produce** | `swipe-file.md` — archivo de trabajo interno: referencias con señal, patrones, cubetas e hipótesis atadas a un slot · y la columna `mezcla` de cada fila de `plan-de-contenido.csv` |

Contexto del departamento: `agents/creative/WORKFLOW.md`. Cadencia: **refresco semanal**.

**Qué es:** bajar el riesgo de una pieza **antes** de producirla, leyendo lo que el mercado ya validó
con tiempo y con dinero.
**Qué no es:** no es investigar la categoría (eso es ② Estrategia y ya está hecho), no es un
moodboard, y no son las referencias estéticas de ②B Branding — esas dicen cómo debe *verse* la
marca, estas dicen qué **funciona**.

## 🛑 La regla que manda: la antigüedad se lee, no se pregunta

> 🛑 **Ninguna fecha de antigüedad entra al swipe file si no fue leída directamente de la Ad
> Library** — de la página, o de un MCP que la lea. **NUNCA de un modelo.**

**Por qué.** Se le pidió a un modelo que listara anuncios activos: devolvió 5, con id y fecha.
Verificados uno por uno, **las marcas existían pero las fechas, los estados y las creatividades
estaban inventados**. Un modelo sin acceso a los datos no dice *"no sé"*: rellena.

El 70 % de la mezcla se apoya en evidencia de rendimiento. Si esa evidencia la rellena un modelo, el
70 % es opinión disfrazada de dato.

❌ *"Este ad lleva ~90 días corriendo"* sin fuente ✅ `⏱️60-90+d · leído en Ad Library el 16-sep-2026`

## Paso 0 · Arrancar de la 15×7 y calcular **el hueco**

② Estrategia ya descompuso **15+ piezas ganadoras en 7 capas** (gancho, promesa, mecanismo, prueba,
formato, distribución, oferta), con sus patrones marcados 🟢/🟡/⚪. **Ese es el punto de partida.**

El primer bloque de `swipe-file.md` es lo heredado:

```
| # de fila en la 15×7 | Capa | Patrón | Marca | Aplica a qué slot de este ciclo |
```

Y recién después, el hueco:

```
| Qué falta | Por qué la 15×7 no lo cubre | Dónde lo cosecho |
```

🛑 **Solo se cosecha el hueco.** Repetir el barrido de categoría es duplicar el trabajo de
② Estrategia y llegar, con menos rigor, a otra conclusión sobre la misma categoría. Lo que la 15×7
ya cubre **se cita por número de fila, no se re-investiga**.

El hueco es casi siempre de uno de tres tipos:

1. **Formato exacto** del slot que la 15×7 no incluyó (carrusel de 5 slides, cover de Reel)
2. **Canal exacto** que la ingeniería inversa no priorizó y el calendario de ③ Marketing sí tiene
3. **Tipo de hook** que falta para el `goal_del_arte` de este ciclo

**Antes de salir a buscar:** el banco de hooks propios del ciclo anterior va **primero y arriba**, y
se revisan las fichas de referencia ya existentes — **una referencia leída no se vuelve a leer**.
Conseguir los anuncios es trabajo de `cr-fuentes`; leerlos de verdad, de `cr-lectura-de-video`.

## Paso 1 · Filtrar por señal, no por gusto

**Esta es LA regla del departamento.** No se filtra por *"el que más me gusta"*, se filtra por
evidencia de rendimiento. **En orden de fuerza:**

| Fuente | Criterio | Marca | Fuerza |
|---|---|---|---|
| **Ad en pauta** | **60-90+ días corriendo** | `⏱️60-90+d` | **La más fuerte.** Las marcas matan rápido a los perdedores: un ad viejo es un ad que paga |
| **Ad en pauta** | 30-60 días | `⏱️30-60d` | Señal a confirmar |
| **Ad en pauta** | <30 días | — | Descartada. Todavía está en test |
| **Orgánico** | **Outlier contra la media de esa cuenta** | `⏱️outlier` | Fuerte |
| **Orgánico** | Muchas views en cuenta enorme, sin comparar con su base | — | Descartada. No es evidencia |
| **Landing** | Existe hace tiempo y no la rehicieron | `⏱️estable` | Media |

> Una pieza con muchas views de una cuenta enorme puede ser **el peor** contenido de esa cuenta.
> *"Ganadora"* es siempre **relativo a su propia base**.

🛑 **Sin señal de rendimiento no entra a la bóveda.** Se descarta y se cuenta en el bloque de fuentes.
🛑 **Nunca se guarda una referencia por gusto estético.** *"Me gusta"* no es evidencia.
🛑 **Leer no es validar.** Una referencia impecablemente leída sin señal `⏱️` sigue siendo `⚪ ruido`.

### Las dos escalas no se mezclan

| Escala | Qué mide | Cómo se asigna |
|---|---|---|
| `⏱️` | El **rendimiento de UNA referencia** | Días corriendo, outlier vs. su base, estabilidad. **Escala propia** |
| 🟢 / 🟡 / ⚪ | El **patrón**, por conteo de fuentes | 🟢 = **3+ fuentes independientes** · 🟡 = 1-2, o 3+ de la misma fuente · ⚪ = una sola aparición |

🛑 Un ad `⏱️60-90+d` visto en **una sola** fuente da un patrón **🟡**, no 🟢. Mezclar las dos escalas
hace que un 🟢 no se pueda auditar.

## Paso 2 · Diseccionar: extraer el patrón

De cada ganadora, en este orden:

| # | Qué se extrae | Pregunta |
|---|---|---|
| 1 | **Tipo de hook** | ¿Con cuál de las 7 cajas entra? |
| 2 | **Ángulo emocional** | ¿Miedo, ego, curiosidad, alivio, pertenencia? |
| 3 | **Formato** | Duración, estructura, ritmo, texto en pantalla, sonido |
| 4 | **Estructura** | ¿Cómo reparte HOOK / BODY / PAYOFF? |
| 5 | **Tipo de prueba** | Demo, dato, testimonio, antes/después, autoridad, cantidad |
| 6 | **CTA** | Qué pide, con cuánta fricción, y de qué familia |

```
| # | Link | Fuente | Señal ⏱️ | Patrón 🟢/🟡/⚪ | Hook | Ángulo | Formato | Estructura | Prueba | CTA |
```

🛑 **Patrón, no pieza.** El link va a la referencia visual de `ideas.md` para que el ejecutor **vea**
la referencia, pero lo que se dirige es el patrón. Si lo que se lleva al brief es la imagen, la
estructura del copy o el creativo, es clonar — y falla el filtro de distintividad.

## Paso 3 · Clasificar en 70 / 20 / 10

Cada patrón que sobrevive recibe **exactamente una** cubeta. No hay patrón sin cubeta.

| Cubeta | De dónde sale | Pregunta que la define |
|---|---|---|
| `70·probado` | La 15×7, o la cosecha del hueco **con señal `⏱️`** | *¿Alguien afuera ya demostró que esto funciona?* |
| `20·apuesta` | Idea nuestra, sin referencia que la respalde | *¿Estoy apostando sin red?* |
| `10·propio` | El aprendizaje del ciclo anterior, o un creativo nuestro que **rinde medido** en pauta | *¿Esto ya nos funcionó a nosotros?* |

- Una referencia **ajena con señal** nunca es `20`, por original que sea la adaptación. El `20` es
  **ausencia de precedente**, no originalidad de la ejecución.
- Un patrón propio que **todavía no se midió** no es `10`, es `20`. El `10` exige resultado.
- La cubeta viaja con el patrón: se copia a la columna `mezcla` de cada fila.

**Cierre:** se cuenta la distribución prevista y se compara con 70/20/10, **tolerancia ±10 puntos**.
Si no cierra, se ajusta **acá** —cosechando más o soltando apuestas—, no al final agregando filas de
relleno.
⚠️ **Primer ciclo del cliente:** no hay `10` posible. El reparto **arranca en 80/20** y se declara así.

## Paso 4 · Organizar la bóveda

**Por pilar y por tipo de hook** — no por fecha ni por plataforma, porque así es como la Capa 2 la va
a buscar. Los pilares son los del cliente, definidos por ③ Marketing, no una lista universal.

```
por-pilar/   educativo · entretenimiento · promocional · inspiracional · comunidad
por-hook/    pattern-interrupt · list-number · curiosity-gap · question · pain · bold-claim · story-tease
```

## Paso 5 · Traducir a hipótesis

El único paso donde se genera algo nuevo.

```
| Patrón | Señal ⏱️ | Fuentes (→ 🟢/🟡/⚪) | Cubeta | Hipótesis para nuestra marca | Pilar | Caja de hook |
```

1. Se modela la **estructura**; nunca se copia la **ejecución**.
2. La hipótesis se escribe en **nuestra voz**, con el lenguaje literal del comprador de ② Estrategia.
3. Un patrón que no sirve a ningún slot de este ciclo **no entra**. Nada se guarda "por si acaso".
4. Si la hipótesis podría llevar el logo de un competidor sin que nadie note la diferencia, **falló
   distintividad**. Se vuelve atrás.

## Paso 6 · Verificación anti-default (obligatoria)

Cada patrón se cruza contra el **mapa de saturación** de ② Estrategia:

| Resultado del cruce | Qué se hace |
|---|---|
| El patrón **está** en el mapa (todos lo hacen) | 🛑 **Se descarta.** Adoptar el default de categoría nos vuelve invisibles |
| Está en el mapa, pero **el white space está al lado** | Se conserva la **estructura** y se invierte el contenido |
| **No está** en el mapa | Entra. Es novedad real para esta categoría |

> Esta verificación es la razón por la que Creative arranca de la evidencia de ② Estrategia y no de
> cero: sin el mapa de saturación no hay forma de saber si un patrón ganador es también un patrón
> **agotado**.

## QA — Capa 1

- [ ] El bloque heredado de la **tabla 15×7** está citado **por número de fila**
- [ ] El **hueco** está calculado, y **solo se cosechó el hueco**
- [ ] 🛑 **Ninguna fecha de antigüedad viene de un modelo** — todas leídas de la Ad Library, con fecha de lectura
- [ ] Toda referencia tiene señal de rendimiento en escala `⏱️` (`⏱️60-90+d` / `⏱️30-60d` / `⏱️outlier` / `⏱️estable`), **sin mezclar con 🟢/🟡/⚪**, que marcan patrón por conteo de fuentes
- [ ] **Ninguna referencia entró por gusto estético**
- [ ] Para orgánico: **la base del creador se midió** antes de declarar un outlier
- [ ] Toda referencia de video leída a fondo tiene su **ficha de referencia** con fecha de lectura
- [ ] Ninguna referencia se leyó dos veces — se buscó la ficha antes de leer
- [ ] Lo que no se pudo leer está declarado: `⚠️ SIN ARCHIVO` / `⚠️ SIN TRANSCRIPCIÓN`
- [ ] 🛑 **Ningún plano descrito que no se vio, ningún audio descrito sin transcripción**
- [ ] Las fichas con lectura de imagen traen **ritmo** (duración media de plano) y **setups distintos**
- [ ] Cada patrón descompuesto en los **6 elementos** (hook, ángulo, formato, estructura, prueba, CTA)
- [ ] La bóveda está organizada **por pilar y por tipo de hook**
- [ ] Cada hipótesis está atada a **un slot de este ciclo**
- [ ] **Cada patrón tiene exactamente una cubeta**: `70·probado` / `20·apuesta` / `10·propio`
- [ ] El **reparto previsto cierra en 70/20/10 ±10 puntos** — o la desviación está declarada con su motivo
- [ ] Si es el **primer ciclo** del cliente, el reparto se declaró como **80/20**
- [ ] **Cada patrón cruzado contra el mapa de saturación** — los defaults de categoría descartados
- [ ] El banco de hooks propios del ciclo anterior está incorporado y **arriba**
- [ ] Fecha del relevamiento + fuentes usadas y no disponibles + confianza 🟢/🟡/🔴
- [ ] 🛑 **Ninguna referencia se llevó al brief como imagen a replicar**

**Handoff →** `cr-big-idea` (Capa 2). Un swipe file sin fecha es un swipe file muerto: la longevidad
se mide al momento de la consulta y un ganador de hace seis meses probablemente ya fatigó.
