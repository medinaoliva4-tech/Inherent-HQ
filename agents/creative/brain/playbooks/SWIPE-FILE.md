# Playbook — Swipe File y Análisis de Piezas Ganadoras

**Qué es.** El proceso de Creative para bajar el riesgo de una pieza **antes** de producirla: leer lo
que el mercado ya validó con tiempo y con dinero, y extraer el patrón que lo explica.

**Qué NO es.** No es investigar la categoría — eso es la ingeniería inversa de **② Estrategia** y ya
está hecha. No es un moodboard. No es copiar. Y no es lo mismo que las **referencias estéticas de
②B Branding**: esas dicen cómo debe *verse* la marca, estas dicen qué *funciona*.

> 🛑 **Regla dura:** de una referencia se extrae el **patrón**. Si lo que se lleva al brief es la
> imagen, la estructura del copy o el creativo, es clonar — y falla el filtro de distintividad.

**Dónde vive:** Capa 1 del método · **Output:** `swipe-file.md` · **Cadencia:** refresco semanal

---

## Paso 0 — Arrancar de lo que ② Estrategia ya hizo

② Estrategia descompuso **15+ piezas ganadoras en 7 capas** (gancho, promesa, mecanismo, prueba,
formato, distribución, oferta) en su tabla 15×7, con sus patrones marcados 🟢/🟡/⚪.

**Eso es el punto de partida.** El primer bloque de `swipe-file.md` es:

```markdown
| # de fila en la 15×7 | Capa | Patrón | Marca | Aplica a qué slot de este bloque |
```

**Después** se calcula el hueco:

```markdown
| Qué falta | Por qué la 15×7 no lo cubre | Dónde lo cosecho |
```

🛑 **Solo se cosecha el hueco.** Repetir el barrido de categoría es duplicar el trabajo de ②
Estrategia y llegar, con menos rigor, a otra conclusión sobre la misma categoría.

El hueco suele ser de tres tipos:
1. **Formato exacto** del slot que la 15×7 no incluyó (carrusel de 5 slides, cover de Reel)
2. **Canal exacto** que la ingeniería inversa no priorizó pero el calendario de ③ Marketing sí tiene
3. **Tipo de hook** que falta para el `goal_del_arte` de este bloque

---

## Paso 1 — Buscar

| Fuente | Por dónde se arranca |
|---|---|
| **Pauta** | **Meta Ad Library** — competidores directos + marcas grandes de la industria. Filtrar a **activos** |
| **Orgánico** | **Meta Spark** + creadores que ya tienen la audiencia (anillo 5) y referentes fuera de categoría (anillo 4) |
| **Landings** | Páginas de venta de los competidores del anillo 1 |
| **Propio en pauta** | Los creativos que ⑧B Ads reporta como rentables — alimentan la cubeta `10` |
| **Propio** | El banco de hooks de `aprendizaje-creativo.md` del ciclo anterior — **empieza por acá** |

**Presupuesto de búsqueda:** máximo **3 búsquedas infructuosas por objetivo**. Después se para y se
le pide al usuario un nombre, un handle o un link de referencia. Seguir probando sinónimos quema
contexto y no encuentra nada.

---

## Paso 2 — Filtrar por señal, no por gusto

**Esta es LA regla del playbook.** No se filtra por *"el que más me gusta"*: se filtra por evidencia
de rendimiento.

| Fuente | Criterio | Marca | Fuerza |
|---|---|---|---|
| **Ad en pauta** | **60-90+ días corriendo** | `⏱️60-90+d` | La más fuerte. Las marcas matan rápido a los perdedores: un ad viejo es un ad que paga |
| **Ad en pauta** | 30-60 días | `⏱️30-60d` | Señal a confirmar |
| **Ad en pauta** | <30 días | — | Descartada. Todavía está en test |
| **Orgánico** | **Outlier contra la media de esa cuenta** | `⏱️outlier` | Fuerte |
| **Orgánico** | Muchas views en cuenta enorme, sin comparar con su base | — | Descartada. No es evidencia |
| **Landing** | Existe hace tiempo y no la rehicieron | `⏱️estable` | Media |

> 🛑 **La escala `⏱️` es la señal de RENDIMIENTO de una referencia. No es 🟢/🟡/⚪.**
> Esas marcan **patrón**, por conteo de fuentes independientes (regla del repo: 3+ = 🟢). Una
> referencia puede ser `⏱️90d` y su patrón seguir siendo 🟡 porque aparece en una sola fuente.
> Mezclarlas hace que un 🟢 no se pueda auditar.

> Una pieza con muchas views de una cuenta enorme puede ser **el peor** contenido de esa cuenta.
> Siempre relativo a su propia base.

🛑 **Sin señal de rendimiento no entra a la bóveda.** Se descarta y se cuenta en el bloque de fuentes.

---

## Paso 3 — Diseccionar: extraer el patrón

De cada ganadora se extrae, en este orden:

| # | Qué se extrae | Pregunta |
|---|---|---|
| 1 | **Tipo de hook** | ¿Con cuál de las 7 cajas entra? |
| 2 | **Ángulo emocional** | ¿Qué emoción activa: miedo, ego, curiosidad, alivio, pertenencia? |
| 3 | **Formato** | Duración, estructura, ritmo, texto en pantalla, sonido |
| 4 | **Estructura** | ¿Cómo reparte HOOK / BODY / PAYOFF? |
| 5 | **Tipo de prueba** | Demo, dato, testimonio, antes/después, autoridad, cantidad |
| 6 | **CTA** | Qué pide, con cuánta fricción, y de qué familia |

**Tabla de salida:**

```markdown
| # | Link | Fuente | Señal ⏱️ | Patrón 🟢/🟡/⚪ | Tipo de hook | Ángulo | Formato | Estructura | Prueba | CTA |
```

🛑 **No se guarda la imagen como entregable.** Se guarda el patrón. El link va a la columna
`referencia_visual` del Excel para que el ejecutor **vea** la referencia — pero lo que se dirige es
el patrón.

---

## Paso 3b — Clasificar en 70 / 20 / 10

Cada patrón que sobrevive al Paso 3 recibe **una** cubeta. No hay patrón sin cubeta.

| Cubeta | Cuándo se aplica | Pregunta que la define |
|---|---|---|
| `70·probado` | El patrón viene de la 15×7 o de la cosecha en Meta Ad Library / Meta Spark, con señal `⏱️` | *¿Alguien afuera ya demostró que esto funciona?* |
| `20·apuesta` | La idea es nuestra y no hay referencia que la respalde | *¿Estoy apostando sin red?* |
| `10·propio` | Sale de `aprendizaje-creativo.md` o de un creativo nuestro que rinde en pauta | *¿Esto ya nos funcionó a nosotros?* |

**Reglas:**
- Una referencia **ajena con señal** nunca es `20`, por más que la adaptación sea original. El `20`
  es ausencia de precedente, no originalidad de la ejecución.
- Un patrón propio que **todavía no se midió** no es `10` — es `20`. El `10` exige resultado.
- La cubeta viaja con el patrón hasta el Excel: se copia a la columna `mezcla` de cada fila.

**Cierre del ciclo:** al terminar el swipe file se cuenta la distribución prevista y se compara con
70 / 20 / 10 (±10 puntos). Si no cierra, se ajusta **acá** —cosechando más o soltando apuestas—, no
al final agregando filas de relleno.

> ⚠️ **Primer ciclo del cliente:** no hay `10` posible. El reparto arranca en **80 / 20** y se
> declara así en el handoff.

---

## Paso 4 — Organizar la bóveda

**Por pilar y por tipo de hook** — no por fecha ni por plataforma, porque así es como la Capa 2 la va
a buscar.

```
swipe-file/
├── por-pilar/
│   ├── educativo/ · entretenimiento/ · promocional/ · inspiracional/ · comunidad/
└── por-hook/
    ├── pattern-interrupt/ · list-number/ · curiosity-gap/ · question/
    ├── pain-frustration/ · bold-claim/ · story-tease/
```

Los pilares son los del cliente (③ sistema de contenido 6.2), no una lista universal.

---

## Paso 5 — Traducir a hipótesis

El único paso donde se genera algo nuevo.

```markdown
| Patrón observado | Señal ⏱️ | Fuentes (→ 🟢/🟡/⚪) | Cubeta | Hipótesis para nuestra marca | Pilar | Caja de hook | ¿Es default de categoría? |
```

**Reglas de traducción:**
1. Se puede modelar la **estructura**; nunca se copia la **ejecución**.
2. La hipótesis se escribe en **nuestra voz**, con el lenguaje literal del comprador de ② Estrategia 1.5.
3. Un patrón que no sirve a ningún slot de este bloque no entra. No se guarda "por si acaso".
4. Si la hipótesis podría llevar el logo de un competidor sin que nadie note la diferencia, **falló
   Distinctiveness**. Vuelve atrás.

---

## Paso 6 — Verificación anti-default (obligatoria)

Cada patrón se cruza contra el **mapa de saturación** de ② Estrategia:

| Resultado del cruce | Qué se hace |
|---|---|
| El patrón **está** en el mapa de saturación (todos lo hacen) | 🛑 **Se descarta.** Adoptar el default de categoría nos vuelve invisibles |
| El patrón está en el mapa, pero **el white space está al lado** | Se conserva la **estructura** y se invierte el contenido |
| El patrón **no está** en el mapa | 🟢 Entra. Es novedad real para esta categoría |

> Esta verificación es la razón por la que Creative arranca de la evidencia de ② Estrategia y no de cero:
> sin el mapa de saturación, no hay forma de saber si un patrón ganador es también un patrón agotado.

---

## Checklist de cierre

- [ ] El bloque heredado de la 15×7 está citado por número de fila
- [ ] El hueco está calculado y **solo se cosechó el hueco**
- [ ] Toda referencia tiene señal de rendimiento en escala `⏱️`, y su patrón marcado 🟢/🟡/⚪ **por conteo de fuentes** — las dos escalas separadas
- [ ] Ninguna referencia entró por gusto estético
- [ ] Cada patrón está descompuesto en los 6 elementos
- [ ] La bóveda está organizada por pilar y por tipo de hook
- [ ] Cada hipótesis está atada a un slot de este bloque
- [ ] **Cada patrón tiene exactamente una cubeta** (`70·probado` / `20·apuesta` / `10·propio`)
- [ ] **El reparto previsto cierra en 70/20/10 ±10 puntos** — o la desviación está declarada con su motivo
- [ ] Si es el primer ciclo del cliente, el reparto se declaró como **80/20** y no como 70/20/10
- [ ] **Cada patrón cruzado contra el mapa de saturación**
- [ ] El banco de hooks propios del ciclo anterior está incorporado y arriba
- [ ] Fecha del relevamiento registrada + MCPs usados y no disponibles
- [ ] **Ninguna referencia se llevó al brief como imagen a replicar**
