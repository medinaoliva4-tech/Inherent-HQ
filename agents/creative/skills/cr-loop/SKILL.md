---
name: cr-loop
description: >
  Capa 7 de ④ Creatividad — el loop de aprendizaje. Lee las piezas ya publicadas del ciclo pieza por
  pieza (nunca en agregado), le da veredicto a cada hipótesis, identifica los 3 patrones ganadores,
  evalúa la fatiga (CPM sube + CTR baja) y actualiza el swipe file y las hipótesis de la próxima
  ronda. Úsala cuando pidan "qué funcionó el mes pasado", "cerremos el ciclo", "revisemos las piezas
  publicadas", "qué patrón ganó", "por qué esto dejó de funcionar", "esto ya no rinde como antes",
  "qué refrescamos". Es la capa que hace que Creatividad aprenda en vez de solo producir. Sin
  métricas por pieza NO inventa un ganador: marca ⚠️ SIN DATOS y dice a quién pedírselas.
---

# Capa 7 — LOOP

La pregunta de esta capa es una sola: **¿qué patrón creativo ganó, y qué entra al próximo brief?**
No *"cómo nos fue"*. Un resumen de métricas no es aprendizaje: **el aprendizaje es un patrón con
nombre, evidencia y una hipótesis nueva colgada de él.**

## Qué consume · qué produce

| | |
|---|---|
| **Consume** | Las filas ya publicadas de `plan-de-contenido.csv` (con su `funcion`, `mezcla`, `traza` y `concepto`) · la **hipótesis** y el **Objetivo del slot** de cada sección `## CR-007 · <concepto>` de `ideas.md` · las **métricas por pieza**, exportadas a `clients/<cliente>/_INPUTS/` · el `swipe-file.md` vigente |
| **Produce** | **`aprendizaje-creativo.md`** — trabajo interno, no se entrega al cliente pero **sí se guarda** · y el **`swipe-file.md` actualizado** con los ganadores propios arriba |
| **No produce** | Dashboards ni reporte de performance (③ Marketing) · piezas nuevas (eso es el ciclo siguiente, desde Capa 0) · ninguna conclusión estratégica |

El flujo del departamento y sus reglas viven en `agents/creative/WORKFLOW.md`.
Cómo encadena con el resto: `agents/creative/skills/COMO-LAS-USA.md`.

🛑 **Sin métricas por pieza: `⚠️ SIN DATOS — [qué falta exactamente y a quién pedírselo]`.**
**Ningún ganador inventado.** Un modelo sin acceso a los datos no dice *"no sé"*: rellena.

---

## 7.1 · Una variable por test

Si cambiás hook + visual + CTA + oferta a la vez y gana, **no sabés por qué ganó** — y no lo podés
repetir el mes que viene.

```
❌  pieza A: hook nuevo + estética nueva + CTA nuevo   → ganó. ¿por qué? nadie sabe
✅  pieza A vs. pieza B: mismo concepto, mismo CTA, SOLO cambia el hook   → el hook explica la diferencia
```

🛑 **Si el ciclo no aisló variables, se declara que el aprendizaje no es limpio** y se nombra qué
test habría hecho falta. No se atribuye el resultado a la variable que más nos gusta.

---

## 7.2 · La métrica la manda el objetivo

Se elige por el **Objetivo del slot** de cada pieza —derivado de la `funcion` que heredó de
③ Marketing—, nunca por lo que da un número más lindo.

| Objetivo del slot | Métrica que lo juzga |
|---|---|
| **alcance** | Retención · guardados · compartidos |
| **valor-de-uso** | Guardados · clics |
| **confianza** | Clics · DMs |
| **acción** | DMs · leads · agendas |
| **pertenencia** | Respuestas · UGC · referidos |

🛑 **Nunca "likes" por default.** Un CTR alto con CPA malo **es un mal creativo**: atrajo a la gente
equivocada. Y se lee **a nivel pieza**, nunca en agregado: el promedio del ciclo esconde exactamente
lo que esta capa vino a buscar.

---

## 7.3 · La mayoría de las piezas no gana

En programas maduros gana **solo ~5-7 % de los creativos probados**. El trabajo no es que cada pieza
sea un hit: es **tener un proceso que encuentre los pocos que sirven**.

> Esto **quita la presión** de que cada pieza la rompa, y **la pone donde va**: en el volumen de
> hipótesis probadas y en la limpieza de los tests. Fallar rápido es parte del sistema, no una falla
> del sistema.

Consecuencia operativa: **1 o 2 ganadores en un ciclo de 20 filas es el resultado esperado.** Si
el informe declara diez ganadores, la lectura está inflada o la métrica es vanity.

---

## 7.4 · El ganador es el inicio del ciclo siguiente

Un creativo que gana **fatiga en 2-3 meses** a volumen.

**La señal de fatiga es doble y va junta: CPM sube + CTR baja.** Una sola de las dos no alcanza —
el CPM sube solo por subasta o estacionalidad, y el CTR baja solo por cambio de audiencia.

```
gana → se REMIXA (mismo ángulo y misma estructura, nuevo visual) → se refresca ANTES de que la fatiga lo mate
```

🛑 **Ni se repite idéntico hasta el cansancio, ni se abandona. Se remixa.** Repetirlo idéntico quema
el patrón; abandonarlo tira el único activo probado que tiene el cliente.

Todo lo que se marca para refrescar sale **con fecha límite**, no con un *"pronto"*.

---

## 7.5 · Qué produce el loop

| # | Qué | Cómo se declara |
|---|---|---|
| **1** | Los **3 patrones ganadores** del período | Uno por línea, con **su evidencia**: qué piezas, qué métrica, qué objetivo del slot |
| **2** | Qué **refrescar por fatiga**, **con fecha** | `CR-007 · CPM +38 % / CTR −22 % · remix antes del 15-11` |
| **3** | El **`swipe-file.md` actualizado** | Los ganadores propios entran a la bóveda como cubeta `10·propio` y van **primero** |
| **4** | **3 hipótesis** para la próxima ronda | Cada una atada a un objetivo de slot y con qué la confirmaría |

**Y además, en el mismo archivo:** el **veredicto de cada hipótesis** del ciclo
(`confirmada` / `refutada` / `⚠️ SIN DATOS`) · qué **patrón sube al tope de su skill** en la revisión
trimestral · las **devoluciones aguas arriba** (lo que Creative detectó y no le toca arreglar).

🛑 **Ninguna opción nueva se agrega a una taxonomía de skill sin evidencia de 3+ piezas.**

---

## 7.6 · La frontera con ③ Marketing

| Departamento | Su pregunta | Quién la responde |
|---|---|---|
| **④ Creative** — Capa 7 | *¿Qué **patrón creativo** ganó y qué entra al próximo brief?* | 🟢 Esta skill |
| **③ Marketing** | *¿Se movió la **MUST BE TRUE**? ¿Compoundea?* | 🛑 **No es de Creative** |
| **③ Marketing** | Los dashboards y el reporte de performance | 🛑 **No es de Creative** |

Son **preguntas distintas sobre los mismos datos**, y ninguna reemplaza a otra.

🛑 **Creative no responde la segunda: la devuelve.** Una pieza que rindió bien pero no movió nada
estratégico se declara y **se devuelve a ③ Marketing** — desde acá no se declara victoria
estratégica, y tampoco se declara derrota. Lo mismo al revés: un patrón que ganó sigue siendo un
hallazgo válido aunque ③ todavía no vea el movimiento.

---

## Reglas duras

1. **Se lee pieza por pieza.** El agregado esconde el ganador y el perdedor en el mismo promedio.
2. **Una variable por test**, o el aprendizaje se declara sucio.
3. **La métrica la manda el objetivo del slot.** Nunca likes por default.
4. **Todo patrón ganador lleva evidencia nombrada:** qué piezas y qué números lo sostienen.
5. **Toda hipótesis del ciclo recibe veredicto.** Dejarla sin responder es perder el ciclo entero.
6. **Fatiga = CPM sube + CTR baja**, las dos juntas, y sale con fecha de refresco.
7. **El ganador se remixa**, ni se clona ni se tira.
8. 🛑 **Sin datos: `⚠️ SIN DATOS`.** Nunca se infiere un ganador de lo que "se siente" que funcionó.
9. **No se reescribe nada de otro departamento.** Lo que no es de Creative se devuelve, no se corrige.

---

## Anti-patterns

| Error | Por qué falla |
|---|---|
| *"El mes fue bien, el engagement subió"* | No es un patrón. No se puede volver a usar ni enseñar |
| Leer el ciclo en agregado | El promedio de 20 filas no dice cuál de las 20 ganó |
| Declarar ganador por likes o views | Vanity: mide exposición, no el objetivo del slot |
| Diez ganadores en un ciclo | Con ~5-7 % de tasa real, es lectura inflada o métrica equivocada |
| Repetir idéntico el creativo que ganó | Lo quema en semanas. **Se remixa** |
| Abandonar el ganador al primer bajón | Se tira el único activo probado. Primero se verifica la señal doble |
| Atribuir el resultado a una variable que no se aisló | Aprendizaje falso, que contamina los 3 ciclos siguientes |
| Concluir que la estrategia funciona o no funciona | Esa pregunta es de ③ Marketing. **Se devuelve** |

---

## QA

**Capa 7 no se entrega sin este bloque completo.**

- [ ] Las métricas se leyeron **a nivel pieza**, por **Objetivo del slot**, **nunca en agregado**
- [ ] La métrica usada es la del objetivo, **no vanity** — 🛑 nunca *"likes"* por default
- [ ] Hay **3 patrones ganadores** identificados, cada uno **con su evidencia nombrada**
- [ ] Cada **hipótesis** del ciclo tiene veredicto: `confirmada` / `refutada` / `⚠️ SIN DATOS`
- [ ] Se probó **una variable a la vez** — si no, **está declarado que el aprendizaje no es limpio**
- [ ] La **fatiga** está evaluada con la **señal doble** (CPM sube **+** CTR baja), con **qué refrescar y fecha límite**
- [ ] Lo que se refresca dice **remix**, no *"repetir"* ni *"bajar"*
- [ ] Los **ganadores propios entraron a `swipe-file.md`**, con cubeta `10·propio` y ubicados **arriba**
- [ ] Está declarado **qué patrón sube al tope de qué skill** en la revisión trimestral
- [ ] Hay **3 hipótesis nuevas**, cada una atada a un objetivo de slot y con qué la confirmaría
- [ ] 🛑 Sin métricas: `⚠️ SIN DATOS` + **a quién pedírselas**. **Ningún ganador inventado**
- [ ] **Ninguna conclusión estratégica emitida** — lo que le toca a ③ Marketing **está devuelto, no respondido**
- [ ] Las **devoluciones aguas arriba** están listadas: lo que Creative detectó y no le toca arreglar
- [ ] `aprendizaje-creativo.md` quedó **guardado en la carpeta del cliente** — es interno, no se entrega

**Handoff** → `cr-swipe-file` (Capa 1, los ganadores propios y el banco de hooks) y `cr-big-idea`
(Capa 2, las candidatas de concepto del próximo ciclo). El loop **cierra el ciclo y abre el
siguiente**: si no alimenta a esas dos capas, no fue un loop, fue un informe.
