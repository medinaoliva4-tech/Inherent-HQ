---
name: mk-calendario
description: >
  Capa 5 de ③ Marketing — arma `calendario.csv`, el encargo que recibe ④ Creatividad. Una fila
  por slot con las 11 columnas, en semanas y nunca en días, porque el día lo fija Creative.
  Verifica que todo slot trace a una MUST BE TRUE, que el total entre en el techo del alcance
  contratado y que no aparezca ninguna de las cinco combinaciones prohibidas. Puede llevar dos
  columnas opcionales: la etapa del embudo (TOF, MOF, BOF) y la receta de captura de los
  «client-getting videos». Úsala cuando pidan
  "armá el calendario", "cuántas piezas y cuándo", "el encargo para creatividad", "distribuí los
  slots". Requiere el plan por canal.
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
         [· etapa · captura]        ← opcionales, al final (§ 1B)
```

**Las reglas duras:**

| Columna | Regla |
|---|---|
| `semana` | **Número, nunca un día.** `1` · `2` · `3` · `4`. El día lo pone ④ Creatividad |
| `funcion` | Solo los 6 valores. **La que su canal tiene asignada en `plan-por-canal.md`** |
| `temperatura` | 4 valores, `Cliente` incluido |
| `awareness` | 5 valores, **escritos literal** |
| `balance` | `Marca` o `Activación` |
| `objetivo_del_slot` | **Específico.** *«Responder la objeción del precio»*, no *«generar awareness»* |
| `traza` | **La letra de una MUST BE TRUE.** Sin esto el slot no existe |

---

## 1B · Dos columnas opcionales — `etapa` y `captura`

**No son obligatorias.** Un calendario sin ellas es válido y sigue siendo de 11 columnas. Cuando se
usan, van **al final** y se llenan con estas reglas.

### `etapa` — dónde está la pieza en el embudo

| Valor | Qué busca | Equivale a |
|---|---|---|
| **`TOF`** | Que alguien **te conozca** | `Frío` · `TOFU` de ④ `cr-brief` |
| **`MOF`** | Que **confíe** | `Tibio` · `MOFU` |
| **`BOF`** | Que **compre o escriba** | `Caliente` · `BOFU` |
| *(vacío)* | ④ Creatividad la deriva de la `funcion`, como hoy | — |

🛑 **Nunca contradice a `temperatura` ni a `funcion`:**

| `funcion` | `etapa` permitida |
|---|---|
| `Hero` | `TOF` |
| `Series` | `TOF` o `MOF` |
| `Utility` · `Proof` | `MOF` |
| `Conversion` | `BOF` |
| `Community` | **vacía** — le habla a quien ya compró, y eso no es embudo |

**El mix sugerido de arranque es 50% `TOF` · 30% `MOF` · 20% `BOF`**, igual en todos los niveles, y
**se ajusta con los datos** de `aprendizaje-de-marketing.md`. El 20% de `BOF` cabe dentro del rango
de `Conversion` de `mk-pilares` (10%-25%).

### `captura` — los «client-getting videos»

**Un client-getting video es un slot de video corto** *(Reel, TikTok, Short)* **que pide una acción
concreta a cambio de la cual el interesado deja su contacto.** No es un pilar ni una función: cruza
`Utility`, `Proof` y `Conversion`.

| Nivel | `captura` admite | % de los slots de video corto del ciclo |
|---|---|---|
| **Brand Growth** | `directo` | El que fije la ficha |
| **Growth Partnership** | La receta de `gr-captura` | El que fije la ficha |

| Valor | Qué es |
|---|---|
| **`directo`** | Escribir al DM o al WhatsApp del cliente. ⑧ Community lo atiende. **Es el único valor en Brand Growth** |
| **`comenta-y-te-mando`** · **`lead-magnet`** | El recurso se entrega por mensaje o formulario. Van en `TOF` o `MOF` |
| **`quiz`** · **`vsl`** · **`low-ticket`** | Piden más decisión. Van en `MOF` o `BOF` |
| *(vacío)* | La pieza no pide contacto |

**Reglas de la columna:**

- 🛑 **Solo con `balance = Activación`** y `funcion ≠ Community`. Una pieza que pide contacto no es de marca pura.
- **La receta la fija ② Growth** en `§ Captura` de `motor-de-crecimiento.md` *(Growth Partnership)*. ③ Marketing no inventa recetas.
  `outbound` no aparece acá: no es una pieza.
- **`objetivo_del_slot` nombra lo que se entrega:** *«Que comenten GUÍA para recibir la lista de precios»*, no *«captar leads»*.
- **No agrega piezas:** el client-getting es una categoría **dentro** del techo de slots de la ficha.
- **El llamado sigue a la etapa** *(`cr-storytelling`)*: no se pide una venta directa en `TOF`.

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
| 1 · Por qué querría verlo | `audiencia profunda` de ① Strategy · el deseo, no la demografía |
| 2 · Qué posicionamiento refuerza | `posicionamiento` de ① Strategy |
| 3 · Qué promesa demuestra | **`promesa` de ① Strategy — es input bloqueante de `mk-encargo`** |
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

**Es lo que ④ Creatividad usa para decidir el contenido concreto. Genérico, no sirve.**

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
| `balance = Marca` + slot que pide CTA de conversión | ④ Creatividad deriva el CTA del balance. Se contradice |
| `funcion = Community` + `temperatura ≠ Cliente` | Community le habla a quien ya compró |
| `awareness = Unaware` + `funcion = Conversion` | Le vende a quien no sabe que tiene el problema |
| Dos canales con la misma `funcion` | Ya se resolvió en la Capa 4. Si reaparece, hay un error |
| `funcion` que el canal no tiene asignada | `plan-por-canal.md` es ley |

> Con las columnas opcionales llenas, además: `etapa` que contradice a `funcion` *(§ 1B)* · `captura` con
> `balance = Marca` o con `funcion = Community`. Se verifican igual, fila por fila.

## 4 · La distribución por semana

| Regla | Por qué |
|---|---|
| **Los `Hero` van en semana 1 o 2** | Necesitan tiempo para rendir dentro del ciclo |
| **Los `Conversion` se concentran**, no se riegan | Una tanda convierte; uno suelto cada semana, no |
| **Los `Series` van parejos** las 4 semanas | Son el hábito |
| **Nada de rodaje en la semana 1** | ⑤ Producción necesita margen desde que sale el calendario |
| **La estacionalidad manda** | Si ① Strategy declaró fechas duras, el calendario se acomoda a ellas |

## 5 · El cierre contra el techo

**Antes de cerrar se verifica contra § El encargo:**

- [ ] Total de slots = el techo del alcance contratado
- [ ] Slots con rodaje ≤ los reels que la ficha incluye
- [ ] Estáticos y carruseles ≤ el techo
- [ ] Stories ≤ el techo
- [ ] El reparto por pilar coincide con los % de la Capa 3

🛑 **Si pasa el techo, se recorta acá y se escribe qué se cayó.** Nunca se manda de más.

## 6 · Qué pasa aguas abajo

| A | Qué hace con esto |
|---|---|
| **④ Creatividad** | Lo convierte en `plan-de-contenido.csv` — hereda `canal`, `formato`, `pilar`, `funcion` **sin cambio** y le agrega el día, el concepto y la mezcla. `etapa` y `captura` pasan a la sección de la pieza: la llamada a la acción apunta a esa receta |
| **⑧ Community** | Los slots con `comenta-y-te-mando` le piden la palabra y la automatización |
| **⑤ Producción** | Cuenta los slots con rodaje para dimensionar jornadas |
| **⑨ Posting** | Sabe en qué cuenta va cada cosa |

## 7 · Checklist

🛑 **Es lo que ④ Creatividad va a producir.** Corregirlo pieza por pieza después es imposible: por eso se
auto-revisa entero, acá, y pasa directo a ④ Creatividad.

- [ ] Las **11 columnas** están completas en todas las filas *(`etapa` y `captura` son opcionales)*
- [ ] Si hay `etapa`: **no contradice** a `funcion`, y el mix se comparó con **50/30/20** *(o se declaró por qué se aparta)*
- [ ] Si hay `captura`: solo con `balance = Activación`, nombra **qué se entrega** y el % de client-getting **no pasa** del que fija la ficha
- [ ] `semana` es un número, **nunca una fecha**
- [ ] **Todo slot traza** a una MUST BE TRUE con su letra
- [ ] Ningún `objetivo_del_slot` es genérico
- [ ] Ninguna de las **cinco combinaciones prohibidas** aparece
- [ ] Cada `funcion` coincide con la que `plan-por-canal.md` le asigna a ese canal
- [ ] El total **entra en el techo** del alcance contratado
- [ ] Lo que se recortó está **escrito**
- [ ] **Cada slot pasó las 5 preguntas de la prueba de alineación**
- [ ] **Ningún slot quedó sin responder la 3** *(qué parte de la promesa demuestra)*
