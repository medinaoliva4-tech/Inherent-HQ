---
name: mk-calendario
description: >
  Capa 5 de ③ Marketing — arma `calendario.csv`, el encargo que recibe ④ Creatividad. Una fila
  por slot con las 11 columnas, en semanas y nunca en días, porque el día lo fija Creative.
  Verifica que todo slot trace a una MUST BE TRUE, que el total entre en el techo del plan
  contratado y que no aparezca ninguna de las cinco combinaciones prohibidas. Úsala cuando pidan
  "armá el calendario", "cuántas piezas y cuándo", "el encargo para creatividad", "distribuí los
  slots". Requiere el plan por canal. Cierra con el GATE 2.
---

# Capa 5 · Calendario — los slots del ciclo

| | |
|---|---|
| **Consume** | `plan-por-canal.md` · § Sistema de contenido · § Jerarquía de mensaje · las MUST BE TRUE |
| **Produce** | **`calendario.csv`** — el encargo de ④ Creatividad |

> 🔑 **Este archivo es el entregable del departamento.** Todo lo anterior existe para poder
> escribirlo bien.

## 1 · Las 11 columnas

```
id_slot · semana · canal · formato · pilar · funcion · temperatura
         · awareness · balance · objetivo_del_slot · traza
```

**Las reglas duras:**

| Columna | Regla |
|---|---|
| `semana` | **Número, nunca un día.** `1` · `2` · `3` · `4`. El día lo pone ④ |
| `funcion` | Solo los 6 valores. **La que su canal tiene asignada en `plan-por-canal.md`** |
| `temperatura` | 4 valores, `Cliente` incluido |
| `awareness` | 5 valores, **escritos literal** |
| `balance` | `Marca` o `Activación` |
| `objetivo_del_slot` | **Específico.** *«Responder la objeción del precio»*, no *«generar awareness»* |
| `traza` | **La letra de una MUST BE TRUE.** Sin esto el slot no existe |

---

## ✅ La prueba de alineación — el gate de cada slot

> **Cinco preguntas. Un slot que no las responde no entra al calendario.**

| # | La pregunta | Si no hay respuesta |
|---|---|---|
| **1** | **¿Por qué esta audiencia querría verlo?** | Es contenido para el algoritmo, no para alguien |
| **2** | **¿Qué parte del posicionamiento refuerza?** | No construye. Suma ruido |
| **3** | **¿Qué parte de la promesa demuestra?** | Promete en la pauta y no lo prueba en el contenido |
| **4** | **¿Qué deseo o conversación activa?** | No va a generar señal, y sin señal no hay alcance |
| **5** | **¿Qué siguiente acción acerca a la compra?** | 🛑 Es la que más se salta |

🔑 **Se corre acá y no antes de publicar.**
**Rechazar un slot cuesta Q0. Rechazar una pieza ya producida cuesta una pieza.**
El gate barato va arriba.

### Cómo se responde — las tres primeras ya están en el encargo

| Pregunta | De dónde sale la respuesta |
|---|---|
| 1 · Por qué querría verlo | `audiencia profunda` de ① · el deseo, no la demografía |
| 2 · Qué posicionamiento refuerza | `posicionamiento aprobado` de ② |
| 3 · Qué promesa demuestra | **`promesa` de ② — es input bloqueante de `mk-encargo`** |
| 4 · Qué deseo activa | Se escribe acá, y es lo que alimenta `objetivo_del_slot` |
| 5 · Qué siguiente acción | Lo da `funcion` + `temperatura` del slot |

⚠️ **La 3 es la que descubre los slots vacíos.** Un slot que no demuestra nada de la promesa
es contenido de relleno aunque se vea bien.

### 🛑 Lo que NO es esta prueba

**No evalúa si la idea es buena** — eso es ④ Creatividad con su filtro
*Distinctiveness / Novelty / Relevance*. **Acá solo se verifica que el slot tenga trabajo
de negocio asignado.**

---

## 2 · `objetivo_del_slot` — el campo que más se escribe mal

**Es lo que ④ usa para decidir el contenido concreto. Genérico, no sirve.**

| ❌ | ✅ |
|---|---|
| *«Generar awareness»* | *«Que sepan que abrimos los domingos»* |
| *«Engagement»* | *«Que comenten cuál es su favorito, para saber qué producir»* |
| *«Conversión»* | *«Responder la objeción de que es caro, con el costo por uso»* |
| *«Posicionamiento»* | *«Ocupar el momento "no sé qué cenar", martes 18-20h»* |

## 3 · Las cinco combinaciones prohibidas

**Se verifica fila por fila. Sin muestreo.**

| Combinación | Por qué |
|---|---|
| `balance = Marca` + slot que pide CTA de conversión | ④ deriva el CTA del balance. Se contradice |
| `funcion = Community` + `temperatura ≠ Cliente` | Community le habla a quien ya compró |
| `awareness = Unaware` + `funcion = Conversion` | Le vende a quien no sabe que tiene el problema |
| Dos canales con la misma `funcion` | Ya se resolvió en la Capa 4. Si reaparece, hay un error |
| `funcion` que el canal no tiene asignada | `plan-por-canal.md` es ley |

## 4 · La distribución por semana

| Regla | Por qué |
|---|---|
| **Los `Hero` van en semana 1 o 2** | Necesitan tiempo para rendir dentro del ciclo |
| **Los `Conversion` se concentran**, no se riegan | Una tanda convierte; uno suelto cada semana, no |
| **Los `Series` van parejos** las 4 semanas | Son el hábito |
| **Nada de rodaje en la semana 1** | ⑤ Producción necesita margen desde la aprobación |
| **La estacionalidad manda** | Si ① declaró fechas duras, el calendario se acomoda a ellas |

## 5 · El cierre contra el techo

**Antes de cerrar se verifica contra § El encargo:**

- [ ] Total de slots = el techo del plan contratado
- [ ] Slots con rodaje ≤ los reels que el plan incluye
- [ ] Estáticos y carruseles ≤ el techo
- [ ] Stories ≤ el techo
- [ ] El reparto por pilar coincide con los % de la Capa 3

🛑 **Si pasa el techo, se recorta acá y se escribe qué se cayó.** Nunca se manda de más.

## 6 · Qué pasa aguas abajo

| A | Qué hace con esto |
|---|---|
| **④ Creatividad** | Lo convierte en `plan-de-contenido.csv` — hereda `canal`, `formato`, `pilar`, `funcion` **sin cambio** y le agrega el día, el concepto y la mezcla |
| **⑤ Producción** | Cuenta los slots con rodaje para dimensionar jornadas |
| **⑨ Posting** | Sabe en qué cuenta va cada cosa |

## 7 · 🚦 GATE 2

**Allan aprueba el calendario completo.**

🛑 **Es lo que ④ va a producir.** Aprobarlo pieza por pieza después es imposible: por eso se
aprueba entero, acá.

## 8 · Checklist

- [ ] Las **11 columnas** están completas en todas las filas
- [ ] `semana` es un número, **nunca una fecha**
- [ ] **Todo slot traza** a una MUST BE TRUE con su letra
- [ ] Ningún `objetivo_del_slot` es genérico
- [ ] Ninguna de las **cinco combinaciones prohibidas** aparece
- [ ] Cada `funcion` coincide con la que `plan-por-canal.md` le asigna a ese canal
- [ ] El total **entra en el techo** del plan contratado
- [ ] Lo que se recortó está **escrito**
- [ ] **Allan aprobó el GATE 2**
- [ ] **Cada slot pasó las 5 preguntas de la prueba de alineación**
- [ ] **Ningún slot quedó sin responder la 3** *(qué parte de la promesa demuestra)*
