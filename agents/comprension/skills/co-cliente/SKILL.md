---
name: co-cliente
description: >
  Capa 2 de ① Comprensión — quién compra hoy y con qué palabras lo dice. Documenta al comprador real
  (no al ideal) con edad, momento, frecuencia, ticket, disparador de compra, quién decide y quién
  paga, y qué lo frena; y sobre todo extrae el LENGUAJE LITERAL: citas textuales de reseñas, DMs,
  WhatsApp y mostrador, entre comillas y con su origen, que es lo que ④ Creatividad necesita para
  escribir el copy. Escribe la sección § El cliente de `comprension.md`. Úsala cuando pidan "quién
  compra", "quién es el cliente de X", "qué dicen los clientes", "conseguí las reseñas", "con qué
  palabras hablan", "por qué no compran". No define el ICP — eso es de ② Estrategia.
---

# Capa 2 · Cliente — quién compra y cómo habla

| | |
|---|---|
| **Consume** | La § Qué sabemos y qué falta de `comprension.md` · reseñas, DMs, capturas de WhatsApp y exports de métricas del `_INPUTS/` · lo que conteste quien atiende al público |
| **Produce** | La sección **§ El cliente** de `comprension.md`: la ficha del comprador real, la tabla de **lenguaje literal** y los segmentos si hay más de uno |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantilla del entregable:
`agents/comprension/entregables/comprension.md`.

**Documentás quién compra hoy.** Quién *debería* comprar es el ICP, y lo decide ② Estrategia.

## 1 · La distinción que define esta capa

| Se documenta | No se documenta |
|---|---|
| Quién compra **hoy**, con evidencia | El cliente ideal — eso es el ICP de ② |
| Qué dice, **entre comillas** | Qué *"debería"* valorar |
| **Cuándo y por qué** compra, concreto | Por qué *"en realidad"* compra — eso es interpretación |
| Qué lo **frena**, con evidencia | Cómo resolver esa objeción — eso es ② |

> 🛑 **Casi todos los clientes describen al comprador que les gustaría tener.** Cuando la respuesta
> suena a folleto —*"gente que valora la calidad"*— se repregunta por el hecho:
> *"el último que entró hoy, ¿quién era y qué pidió?"*

## 2 · La ficha del comprador real

| Campo | Cómo se pregunta para que salga el hecho |
|---|---|
| **Quién compra hoy** | *"Describime los últimos 5 clientes que atendiste"* |
| **Cuándo y por qué** | *"¿Qué estaba pasando en su día para que entre justo ahí?"* |
| **Cada cuánto** | *"De los de esta semana, ¿cuántos ya habían venido antes?"* |
| **Cuánto gasta** | Del sistema si existe; si no, etiquetado |
| **Quién decide y quién paga** | *"¿Quién elige el lugar y quién pone la tarjeta?"* — casi nunca es la misma persona |
| **Qué lo frena** | *"¿Qué te preguntan justo antes de no comprar?"* |

🛑 **Quién decide ≠ quién paga.** El copy de ④ le habla a **uno solo** de los dos, y si esta fila no
está clara, le habla al equivocado todo el ciclo.

## 3 · El lenguaje literal — la parte que no se puede parafrasear

**Es el output más importante de esta capa.** ④ Creatividad escribe el copy con **las palabras del
comprador**. Si esta tabla llega vacía o parafraseada, ④ devuelve el documento y se pierden semanas.

### De dónde se saca

| Fuente | Qué da | Cómo |
|---|---|---|
| **Reseñas de Google / Maps** | Lo que dicen en público, con el elogio y la queja | Lectura directa, o `mcp__Firecrawl__firecrawl_search` sobre el nombre del negocio |
| **DMs y comentarios** | La pregunta que repiten antes de comprar | Capturas que pase el cliente al `_INPUTS/` |
| **WhatsApp** | La objeción cruda, sin filtro de público | Capturas del cliente |
| **Mostrador** | Lo que se dice en voz alta y nunca se escribe | *"¿Qué frase escuchás todos los días?"* |

🛑 **Lo que no se pudo leer, se declara.** Nunca se escribe una cita que nadie dijo: una cita
inventada en este documento se convierte en el hook de ④ dos semanas después.

### Cómo se escribe

```
| Lo que dice, literal                        | Dónde se dijo      | Cuándo   | Veces |
| "ya no me da tiempo de salir a almorzar"    | 3 reseñas de Google| oct-2026 | 3     |
| "¿hacen factura?"                           | DMs de Instagram   | oct-2026 | 7     |
```

| ❌ Parafraseado | ✅ Literal |
|---|---|
| *"valoran la rapidez"* | *"«ya no me da tiempo de salir a almorzar»"* |
| *"les preocupa el precio"* | *"«y eso ya con todo incluido?»"* |
| *"buscan confianza"* | *"«¿ustedes son los del local de la 5ta?»"* |

**La marca de patrón se aplica igual que en el resto del repo:** 🟢 la frase aparece en **3+ fuentes
distintas** · 🟡 en 1-2, o 3+ de la misma fuente · ⚪ una sola vez, sin repetición.

### Si la tabla queda vacía

Se escribe `⚠️ SIN DATOS`, **se declara en el handoff** y se nombra exactamente qué pedir:

```
⚠️ SIN DATOS — lenguaje literal del comprador.
Pedir a [nombre]: capturas de los últimos 20 DMs y las reseñas de Google del último trimestre.
Sin esto, ④ Creatividad escribe el copy a ciegas y va a devolver el documento.
```

## 4 · Segmentos — solo si hay más de uno de verdad

No se inventan segmentos para llenar la tabla. Hay más de uno cuando **compran distinto**: distinto
disparador, distinta frecuencia o distinto ticket.

```
| Segmento          | Qué lo distingue              | Peso en el ingreso | Fuente  |
| Oficinista mediodía| Viene solo, 30 min, recurrente| 60 %               | sistema |
| Familia fin de semana | Viene en grupo, ticket 3x  | 25 %               | sistema |
```

🛑 **Un segmento sin peso en el ingreso no sirve para decidir.** Si no se sabe: `⚠️ SIN DATOS`.

---

## Control de calidad de la Capa 2

- [ ] La ficha describe a quien compra **hoy**, con evidencia — no al cliente ideal
- [ ] **Quién decide** y **quién paga** están separados
- [ ] 🛑 La tabla de **lenguaje literal** tiene citas **entre comillas, con dónde y cuándo** — o `⚠️ SIN DATOS` con qué pedir y a quién
- [ ] 🛑 **Ninguna cita fue inventada, redondeada ni traducida** a como lo diríamos nosotros
- [ ] Las frases repetidas llevan su marca 🟢/🟡/⚪ según cuántas **fuentes distintas** las traen
- [ ] Los segmentos, si existen, tienen **peso en el ingreso** y fuente
- [ ] 🛑 **Ninguna línea define el ICP, la promesa ni cómo responder la objeción** — eso es de ② Estrategia
