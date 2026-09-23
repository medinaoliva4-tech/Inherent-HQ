---
name: co-diagnostico
description: >
  Capa 5 de ① Comprensión — cierra el documento con los problemas actuales y las oportunidades, cada
  uno con la evidencia que lo sostiene y ordenados por lo que pesan en el ingreso. Un problema acá
  lleva evidencia y costo, nunca su solución; una oportunidad es un hecho con lugar libre, nunca una
  idea. Es la última capa antes del gate que desbloquea ② Estrategia. Escribe la sección § Problemas
  y oportunidades de `comprension.md`. Úsala cuando pidan "qué le duele a este negocio", "dónde hay
  lugar", "cerrá el documento de comprensión", "qué oportunidades hay". Requiere las capas 1-4
  hechas: un problema listado sin negocio, cliente y capacidad es una opinión.
---

# Capa 5 · Diagnóstico — qué duele hoy y dónde hay lugar

| | |
|---|---|
| **Consume** | Las secciones **§ El negocio**, **§ El cliente**, **§ El entorno** y **§ La capacidad** de `comprension.md`, ya escritas · `oferta.csv` completo |
| **Produce** | La sección **§ Problemas y oportunidades** de `comprension.md` — cada ítem con su evidencia y su costo, ninguno con su solución |

Contexto del departamento: `agents/comprension/WORKFLOW.md`. Plantilla del entregable:
`agents/comprension/entregables/comprension.md`.

🛑 **Requiere las capas 1-4 hechas.** Un problema listado antes de tener el negocio, el cliente y la
capacidad no es un hallazgo: es una impresión con formato de tabla.

## 1 · La regla que define la capa

| Lleva | No lleva |
|---|---|
| El problema, **en una línea** | La solución propuesta |
| **La evidencia**: qué dato o qué cita lo muestra | Qué campaña habría que hacer |
| **Cuánto cuesta**, en plata o en tiempo | Cuál atacar primero |

> 🛑 **Este es el punto donde más se resbala el departamento entero.** Un problema bien escrito da
> ganas de resolverlo, y ahí es donde aparece la frase que arruina el documento.

| ❌ Se metió en ② | ✅ Es de ① |
|---|---|
| *"Hay que hacer contenido de recetas para educar"* | *"El 70 % pregunta cómo se prepara antes de comprar — 14 DMs, oct-2026"* |
| *"Deberían subir el precio del catering"* | *"El catering es el 25 % del ingreso y no tiene costo cargado — ⚠️ SIN DATOS"* |
| *"El problema real es que no tienen marca"* | *"De 8 competidores, 6 usan las mismas 3 palabras en su bio"* |

**El test rápido:** si la línea se puede discutir sin mirar un dato, no es un problema documentado —
es una opinión.

## 2 · Los problemas

```
| # | El problema, en una línea          | La evidencia               | Cuánto cuesta        |
| 1 | Nadie contacta al que deja de venir| § El negocio — "nadie lo nota" | ⚠️ SIN DATOS de recompra |
| 2 | El producto que más deja pesa 10 % | oferta.csv — margen vs peso    | ~Q6.000/mes sin capturar |
```

**De dónde salen, capa por capa** — no se inventan, se leen:

| Mirando… | Suele aparecer |
|---|---|
| `oferta.csv` | Lo que más deja pesa poco · un canal concentra demasiado · falta el costo de algo grande |
| § El cliente | Una objeción que se repite y nadie responde · quien decide no es a quien le hablamos |
| § El entorno | Todos cobran parecido y nada distingue · hay un rango de precio vacío |
| § La capacidad | Lo que se quiere hacer no entra en lo que se puede · nadie aprueba en tiempo |
| § Qué sabemos y qué falta | Un hueco que lleva semanas abierto **es un problema en sí mismo** |

**El orden es por lo que pesan en el ingreso**, no por lo que molesta más. Si el peso no se puede
calcular, se dice: `⚠️ SIN DATOS — no se puede ordenar por costo`.

## 3 · Las oportunidades

Una oportunidad es **un hecho con lugar libre**, no una idea.

| ❌ Idea | ✅ Hecho con lugar libre |
|---|---|
| *"podríamos abrir más temprano"* | *"nadie en la zona vende desayuno antes de las 7 — 6 apps revisadas"* |
| *"deberíamos hacer más video"* | *"6 de 8 competidores no tienen video vertical propio"* |
| *"hay que fidelizar"* | *"el 40 % vuelve sin que nadie lo contacte — sistema, oct-2026"* |

```
| # | El hecho                     | La evidencia        | Por qué hay lugar          |
| 1 | Nadie vende desayuno <7:00   | 6 apps, oct-2026    | Hay demanda declarada: 4 citas en § El cliente |
```

🛑 **Una oportunidad sin evidencia no entra.** Ni aunque sea obvia: si es obvia y verdadera, hay un
dato que la muestra; si no hay dato, es una corazonada, y las corazonadas se las queda ②.

## 4 · El cierre y el gate

Antes de presentar el gate se verifica la **coherencia hacia atrás**: todo problema y toda
oportunidad tiene que poder señalar la sección de donde salió. Si un ítem no traza a ninguna, **se
elimina** — apareció de la cabeza de quien escribió, no del documento.

🚦 **GATE 2 — el documento.** Se presenta completo a un humano, con:

```
- Datos con fuente verificable: [n] · percepciones sin verificar: [n] · ⚠️ SIN DATOS: [n]
- Confianza: 🟢 / 🟡 / 🔴 — [sobre qué va a construir ② con supuestos]
- Huecos que siguen abiertos: [lista, con a quién se le pidieron y desde cuándo]
```

🛑 **Este gate desbloquea ② Estrategia.** Todo lo que venga después —posicionamiento, campañas,
ideas, rodaje, pauta— se construye sobre este documento. Si la confianza es 🔴, se dice **acá**, no
tres departamentos después.

---

## Control de calidad de la Capa 5

- [ ] Las **capas 1-4 están hechas** — ningún problema se listó antes de tener los datos
- [ ] Cada problema lleva **evidencia citable** y **cuánto cuesta**, o `⚠️ SIN DATOS`
- [ ] 🛑 **Ningún problema trae su solución**; ninguna línea dice *"deberían"*, *"hay que"* o *"conviene"*
- [ ] Cada oportunidad es un **hecho con evidencia**, no una idea
- [ ] Los problemas están **ordenados por peso en el ingreso**, o se declara que no se puede ordenar
- [ ] 🛑 **Todo ítem traza a una sección del documento** — los que no trazan se eliminaron
- [ ] El conteo de datos y la **confianza** están declarados con su motivo
- [ ] Los huecos abiertos están listados con **a quién se le pidieron y desde cuándo**
- [ ] 🚦 **GATE 2** presentado a un humano, con la confianza arriba del todo
