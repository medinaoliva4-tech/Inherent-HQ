---
name: co-capacidad
description: >
  Capa 4 de ① Comprensión — el techo real de ejecución, en números y nunca en adjetivos. Declara
  presupuesto disponible con moneda y período, capacidad de producción en jornadas por mes con quién
  graba y con qué, capacidad de gestión (quién aprueba, en cuánto tiempo, quién publica) y las
  restricciones duras con su motivo. Es la sección que ⑤ Producción consume como input bloqueante y
  que ③ Marketing no puede exceder. Recibe además la corrección de capacidad real que propone
  `pr-loop` al cerrar un ciclo. Escribe la sección § La capacidad de `comprension.md`. Úsala cuando
  pidan "cuánto puede producir X", "cuánto presupuesto hay", "quién aprueba", "qué no se puede
  hacer", "actualizá la capacidad con lo del rodaje".
---

# Capa 4 · Capacidad — qué puede ejecutar de verdad

| | |
|---|---|
| **Consume** | Lo que contesten quien decide y quien ejecuta · contratos y restricciones del `_INPUTS/` · **la capacidad real medida que propone `pr-loop` de ⑤ Producción** |
| **Produce** | La sección **§ La capacidad** de `comprension.md`: los tres techos en números, la tabla de restricciones y el **historial de capacidad declarada** |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantilla del entregable:
`agents/comprension/entregables/comprension.md`.

**Es la capa que más lejos llega.** ⑤ Producción presupuesta contra este número y ③ Marketing no
puede pasarse de él. Un error acá no se descubre en esta capa: se descubre en la semana 3 del ciclo,
cuando el calendario se cae y nadie sabe por qué.

## 1 · Los tres techos, en números

```
Presupuesto disponible:  [monto + moneda + período + fecha de referencia]
Capacidad de producción: [n jornadas o medias jornadas / mes] · [quién graba] · [con qué equipo]
Capacidad de gestión:    [quién aprueba] · [en cuánto tiempo] · [quién publica]
```

| ❌ Adjetivo | ✅ Número |
|---|---|
| *"poca capacidad de producción"* | *"1 media jornada al mes · la dueña · con celular"* |
| *"presupuesto ajustado"* | *"Q4.000/mes para producción · al 2026-10"* |
| *"el cliente aprueba rápido"* | *"aprueba Ana · 24-48 h hábiles"* |

> 🛑 **Un adjetivo no se puede presupuestar.** Si la respuesta vino en adjetivos, se repregunta hasta
> que sea un número: *"el mes pasado, ¿cuántas veces grabaron algo?"*

### Capacidad de gestión — la que más se olvida

No es solo quién graba. Es **quién aprueba y en cuánto tiempo**, porque eso define el calendario
entero de ③:

| Pregunta | Por qué importa |
|---|---|
| *"¿Quién aprueba de su lado?"* | Si son tres personas, el ciclo se traba |
| *"¿En cuánto tiempo suelen contestar?"* | Un cliente que tarda 2 semanas necesita otro calendario |
| *"¿Quién tiene las claves de las cuentas?"* | ⑦ Posting no puede publicar sin eso |
| *"¿Hay alguien que pueda contestar comentarios?"* | Si no hay nadie, ⑧A no existe y hay que decirlo |

## 2 · Las restricciones duras

Lo que **no se puede**, con su motivo y si es negociable:

```
| Restricción                            | Por qué        | ¿Negociable? |
| No se puede mostrar la cocina          | contractual    | no           |
| No se puede grabar viernes ni sábado   | de agenda      | sí           |
| No se puede nombrar el precio en pauta | legal          | no           |
```

| Tipo | Ejemplos de dónde salen |
|---|---|
| `legal` | Rubro regulado, claims prohibidos, uso de imagen |
| `contractual` | Franquicia, exclusividad, acuerdo con un proveedor |
| `de agenda` | Días en que el local no para, temporada alta |
| `de local` | No hay luz natural, no se puede cerrar, no hay dónde montar |
| `de persona` | Quien tiene que salir en cámara no quiere |

🛑 **Una restricción que aparece tarde cuesta un ciclo.** ④ propone algo que el cliente no puede
publicar, ⑤ lo presupuesta, y se cae después de haber gastado. Se pregunta siempre, aunque el cliente
diga que no hay ninguna: *"¿hay algo que no podamos mostrar o decir?"*

## 3 · El historial — no se pisa el número, se agrega una fila

🛑 **La capacidad declarada es una estimación hasta que un ciclo la mide.** Cuando `pr-loop` de
⑤ Producción propone el número real, **no se sobrescribe el anterior**: se agrega una fila.

```
| Fecha   | Capacidad declarada | Real medida | Quién la corrigió       |
| 2026-09 | 3 jornadas/mes      | —           | declarada por Ana       |
| 2026-10 | 3 jornadas/mes      | 1,5         | pr-loop, ciclo oct-2026 |
```

**El desvío entre declarada y real es el dato**, no un error de nadie. Un cliente que dice 3 y hace
1,5 no está mintiendo: está describiendo el mes bueno.

| Después de la corrección | Qué se usa |
|---|---|
| Hay medición real | 🛑 **Se usa la real.** La declarada queda en el historial |
| Hay dos o más mediciones | Se usa la **más baja de las recientes**, no el promedio |

> **Se usa la más baja porque un calendario que no entra se cae entero**, no a la mitad. Sobrar
> capacidad un mes no cuesta nada; faltar cuesta el ciclo.

🛑 **Esta corrección es la única que otro departamento propone sobre este documento** — y llega como
propuesta, nunca editando el archivo. Se aplica acá, con su fuente y su fecha.

---

## Control de calidad de la Capa 4

- [ ] Los **tres techos** están en números, con moneda, período y fecha de referencia — ningún adjetivo
- [ ] La capacidad de producción dice **cuántas jornadas, quién graba y con qué**
- [ ] La capacidad de gestión dice **quién aprueba, en cuánto tiempo y quién publica**
- [ ] Se preguntó **quién tiene las claves de las cuentas** — ⑦ Posting no puede trabajar sin eso
- [ ] Se preguntó explícitamente por **restricciones**, aunque el cliente dijera que no hay
- [ ] Cada restricción tiene **tipo** y si es **negociable**
- [ ] 🛑 **El historial no se pisó**: la corrección de `pr-loop` se agregó como fila nueva
- [ ] Si hay medición real, **se está usando la real** — y la más baja de las recientes si hay varias
- [ ] 🛑 **Ninguna línea dice cuánto contenido conviene hacer** — eso lo decide ③ Marketing contra este techo
