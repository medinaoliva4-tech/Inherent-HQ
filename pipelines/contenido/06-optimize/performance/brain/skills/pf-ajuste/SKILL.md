---
name: pf-ajuste
description: >
  Capa 3 de Performance — cruza los `aprendizaje-de-*.md` de todos los agentes con la lectura de
  los KR, encuentra los ganadores propios nuevos (los manda a Research para la biblioteca) y
  propone qué cambia del roadmap y a quién se devuelve: Strategy, Marketing, Creatividad, Ads o
  Research. Propone, no cambia la estrategia: eso lo decide Strategy. Escribe
  `aprendizaje-del-ciclo.md`. Úsala cuando pidan "qué cambia del roadmap", "qué ajustamos",
  "a quién le devolvemos esto", "qué ganó este ciclo", "la revisión del 20" o la revisión
  trimestral. Requiere `lectura-de-kr.md`.
---

# Capa 3 · Ajuste — qué cambia y a quién se devuelve

| | |
|---|---|
| **Consume** | `lectura-de-kr.md` · todos los `aprendizaje-de-*.md` vigentes, desde la raíz de cada área |
| **Produce** | **`clients/<cliente>/01-estrategia/revisiones-del-20/<AAAA-MM>/aprendizaje-del-ciclo.md`** — trabajo interno, no se entrega al cliente pero **sí se guarda** |

**Performance propone; Strategy decide.** Esta capa no cambia el roadmap, la oferta ni el plan
del ciclo: entrega la propuesta con su evidencia.

## 1 · Los aprendizajes que se cruzan

| Archivo | Dónde | Lo escribe |
|---|---|---|
| `aprendizaje-de-marketing.md` | Raíz del área de marketing | Marketing |
| `aprendizaje-creativo.md` | `04-contenido/` | Creatividad |
| `aprendizaje-de-diseno.md` · `aprendizaje-de-video.md` | `04-contenido/` | Diseño gráfico · Video Editing |
| `aprendizaje-de-produccion.md` · `aprendizaje-de-posting.md` | Su carpeta de ciclo | Producción · Posting |
| `aprendizaje-de-pauta.md` | `06-pauta/` | Ads |
| `aprendizaje-de-branding.md` | `02-marca/` | Branding |
| `aprendizaje-de-growth.md` | Su carpeta | Growth *(línea Growth)* |
| `seguimiento/<AAAA-MM>.md` y la lectura del mes | `05-comunidad/` | Community |

**Los que no existen se listan como hueco y se dice a qué agente se le piden.** No se reconstruyen.

## 2 · El cruce

Por cada KR 🟡 o 🔴 de `lectura-de-kr.md`, se busca qué dicen los aprendizajes:

| Pregunta | Dónde se busca |
|---|---|
| ¿Se publicó lo que el plan decía? | `aprendizaje-de-posting.md` · `aprendizaje-de-produccion.md` |
| ¿El mensaje o el pilar mueve algo? | `aprendizaje-de-marketing.md` |
| ¿Qué patrón creativo ganó o fatigó? | `aprendizaje-creativo.md` · `aprendizaje-de-video.md` |
| ¿La pauta trajo a quien era? | `aprendizaje-de-pauta.md` |
| ¿Llega gente y no compra? | `aprendizaje-de-growth.md` · el seguimiento de Community |
| ¿Qué pregunta la gente? | Community |

🔑 **Cuando el KR falló y un loop ya dio la causa, se cita ese loop.** Performance no repite el
diagnóstico del dueño: lo conecta con el KR.

## 3 · Los ganadores propios

| Regla | Qué dice |
|---|---|
| **Qué es** | Una pieza, formato u hora que supera la mediana de **su propia cuenta** con la métrica del objetivo de su slot |
| **Evidencia mínima** | Pieza identificada · métrica · mediana de la cuenta · período |
| **Una sola pieza** | Es una pista, no un patrón: se marca «a repetir con una variante» |
| **A dónde van** | A **Research**, para la biblioteca de referencias del cliente |
| **Sin métricas** | `⚠️ SIN DATOS`. **Ningún ganador inventado** |

## 4 · Qué se propone y a quién se devuelve

| Hallazgo | Se propone | Va a |
|---|---|---|
| Un KR depende de algo que el roadmap no tiene | Agregar, quitar o mover un KR | **Strategy** |
| Un KR no se puede medir con las herramientas | Reformular el KR o declararlo fuera de alcance del plan | **Strategy** |
| Un pilar o canal no mueve su KR dos ciclos seguidos | Subir, bajar o cortar su peso | **Marketing** *(con Strategy)* |
| Un patrón de hook o formato ganó | Que arranque el próximo brief de ahí | **Creatividad** |
| Una pieza o formato superó la mediana | Entra a la biblioteca de referencias | **Research** |
| Un KR depende de pauta y la lectura de AdWhispr lo sostiene o lo contradice | Que Ads revise el plan por su gate | **Ads** *(cualquier cambio de presupuesto lo aprueba el CEO)* |
| Llega gente y no compra | Que Growth revise la oferta *(línea Growth)* | **Strategy → Growth** |
| Mejores horas distintas a las programadas | Que Marketing ajuste los slots | **Marketing** |
| Un KR se cumplió con holgura | Subir la meta del siguiente trimestre | **Strategy** |

**No se propone lo que no tiene evidencia nombrada.** Cada fila de la propuesta cita el KR, el
dato y el aprendizaje que la sostiene.

**Se separa oferta de pauta.** Si llega la misma gente y compra menos, el problema probable es
la oferta; si llega menos gente y convierte igual, es la pauta. Se devuelve a quien corresponde,
nunca al revés.

## 4.1 · En la revisión trimestral

Se leen los tres ciclos juntos y se propone el roadmap del trimestre siguiente: qué KR se
mantienen, cuáles suben, cuáles salen y qué KR faltan. **Strategy lo aprueba.**

## 5 · Qué escribe

`aprendizaje-del-ciclo.md`:

| Bloque | Qué lleva |
|---|---|
| **A · Lo que decía el roadmap** | Resumen del semáforo de `lectura-de-kr.md` |
| **B · El cruce** | Por cada KR 🟡 o 🔴: qué dicen los loops, con cita |
| **C · Ganadores propios** | Con su evidencia y marcados «para Research» |
| **D · Qué se propone cambiar** | Tabla: cambio · KR · evidencia · a quién va |
| **E · Lo que se devuelve** | Strategy · Marketing · Creatividad · Ads · Research |
| **F · Los huecos** | `⚠️ SIN DATOS` y aprendizajes que faltan, con responsable |

## 6 · Checklist

- [ ] Se leyeron **todos** los `aprendizaje-de-*.md` que existen; los que faltan están listados
- [ ] Cada KR 🟡 o 🔴 tiene su cruce con la causa que dio un loop, o dice que no hay causa
- [ ] Cada ganador tiene evidencia contra **la mediana de su cuenta** y va marcado para Research
- [ ] Cada cambio propuesto cita **KR, dato y aprendizaje**
- [ ] Ninguna propuesta cambia estrategia, oferta ni presupuesto: **solo propone y devuelve**
- [ ] Lo que va a Ads quedó sujeto a **sus gates**
- [ ] Oferta y pauta están **separadas** en el diagnóstico
- [ ] Sin datos: `⚠️ SIN DATOS` y responsable
- [ ] Se presentó antes de escribir el archivo
