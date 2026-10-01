# ③ Marketing — cómo trabaja

> **En una frase:** traduce la estrategia aprobada en **el encargo del ciclo**. Marketing decide
> **qué se dice, dónde y cuándo**; ④ Creatividad decide **cómo se dice**.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 1 · La distinción que define el departamento

**② Estrategia decide el rumbo. ③ Marketing reparte ese rumbo en el tiempo y en los canales.**

| ② Estrategia dice | ③ Marketing reparte | ④ Creatividad resuelve |
|---|---|---|
| *«El cuello es que nadie entiende qué vendemos»* | *«Semana 1 y 3, carrusel en Instagram, función Proof»* | *«El carrusel abre con la factura tachada»* |
| *«Hay que ocupar el momento de "no sé qué cenar"»* | *«Martes 18-20h, Reel, función Utility»* | *«Hook: "Son las 7 y no sabés qué hacer"»* |

🛑 **Marketing no escribe piezas, no inventa hooks y no decide estética.** Si un slot del
calendario trae un copy adentro, se salió del departamento.

🛑 **Y no decide el rumbo.** Si al armar el plan aparece que la estrategia está mal, **se
devuelve a ② Estrategia** — no se corrige acá.

---

## 2 · Qué entrega

| Archivo | Qué es | Quién lo lee |
|---|---|---|
| **`estrategia-de-contenido.md`** | La **idea de campaña** del ciclo, el sistema de contenido, los pilares con su mix y la **jerarquía de mensaje** | ④ Creatividad — **la lee entera antes de idear** |
| **`plan-por-canal.md`** | Una ficha por canal: su **función única** y **qué NO se hace ahí** | ④ Creatividad · ⑨ Posting |
| **`calendario.csv`** | **Los slots del ciclo.** Una fila por pieza a producir, en **semanas** | ④ Creatividad — es su encargo |
| **`aprendizaje-de-marketing.md`** | El cierre: qué función y qué canal rindieron, y qué cambia el próximo ciclo | ③ y ② |

### Las 11 columnas de `calendario.csv`

```
id_slot · semana · canal · formato · pilar · funcion · temperatura
         · awareness · balance · objetivo_del_slot · traza
```

| Columna | Qué lleva | Vocabulario |
|---|---|---|
| `id_slot` | `MK-001`, correlativo del ciclo | — |
| `semana` | **Número de semana del ciclo.** Nunca un día | `1` · `2` · `3` · `4` |
| `canal` | Dónde sale | Instagram · TikTok · YouTube · Email · WhatsApp · Google Business · impresos… |
| `formato` | Qué tipo de pieza | Reel · Carrusel · Estático · Story · Newsletter… |
| `pilar` | Qué pilar de contenido alimenta | Lo define la Capa 3 |
| `funcion` | **Para qué existe la pieza** | `Hero` · `Series` · `Proof` · `Utility` · `Conversion` · `Community` |
| `temperatura` | A quién le habla | `Frío` · `Tibio` · `Caliente` · **`Cliente`** |
| `awareness` | Qué sabe ya | `Unaware` · `Problem aware` · `Solution aware` · `Product aware` · `Most aware` |
| `balance` | Marca o venta | `Marca` · `Activación` |
| `objetivo_del_slot` | **Específico.** *«Responder la objeción del precio»* | Una línea |
| `traza` | La letra de la MUST BE TRUE que mueve | De ② Estrategia |

> 🔑 **El día concreto lo pone ④ Creatividad**, dentro de la semana. Es lo único del calendario
> que Creative sí mueve, porque producción necesita una fecha.

> 🛑 **Todo slot traza a una MUST BE TRUE.** Un slot sin `traza` es contenido porque sí, y
> ④ lo devuelve.

### Las combinaciones que están prohibidas

| Combinación | Por qué se rechaza |
|---|---|
| `balance = Marca` + CTA de conversión | Rompe el slot. El CTA lo deriva ④ del balance |
| `funcion = Community` + `temperatura ≠ Cliente` | Community le habla a quien ya compró |
| `awareness = Unaware` + `funcion = Conversion` | Vender a quien no sabe que tiene el problema |
| Dos canales con la **misma** `funcion` | Si dos canales hacen lo mismo, sobra uno |
| Un canal con una `funcion` que su ficha no le asigna | El plan por canal es ley |

---

## 3 · El techo: el plan contratado

**Marketing no puede encargar más piezas de las que el plan paga.** Es restricción dura.

| | 🟦 **Ignite** | 🟪 **Accelerate** | 🟨 **Compound** |
|---|---|---|---|
| **Slots por ciclo** | **86** | **145** | **204** |
| **Reels de grabación** | 6 | 10 | 14 |
| **Estáticos y carruseles** | 40 | 70 | 100 |
| **Stories** | 30 | 45 | 60 |
| **Piezas derivadas** | 10 | 20 | 30 |
| **Canales** | Donde esté la audiencia + alianzas | **+ búsqueda en Google** | + canal permanente |
| **Campañas por ciclo** | 1 | 1-2 por ángulo | Sistema de demanda completo |

🛑 **Si el plan del ciclo no entra en el techo, se recorta acá y se declara** — nunca se manda
de más esperando que alguien aguante. Ver `inherent/06-ECONOMIA.md`.

---

## 4 · El flujo, de 0 a 100

```
   0  ENCARGO       qué aprobó ② y qué se puede de verdad     → mk-encargo
        ▼
   1  CAMPAÑA       la idea que une el ciclo                   → mk-campana
        ▼
   2  MENSAJE       la jerarquía: qué se dice primero          → mk-mensaje
        ▼           🚦 GATE 1 — Allan aprueba campaña y mensaje
   3  PILARES       el sistema de contenido y su mix           → mk-pilares
        ▼
   4  CANALES       función única por canal y qué NO va ahí    → mk-canales
        ▼
   5  CALENDARIO    los slots del ciclo, por semana            → mk-calendario
        ▼           🚦 GATE 2 — Allan aprueba el calendario
        ▼           →→→ pasa a ④ Creatividad
   ↻  LOOP          qué rindió, qué cambia                     → mk-loop
```

### 🚦 Los dos gates

| Gate | Qué se aprueba | Por qué para acá |
|---|---|---|
| **1** | La **campaña** y la **jerarquía de mensaje** | Son la ley del ciclo. Cambiarlas después tira todo el calendario |
| **2** | El **calendario completo** | Es lo que ④ va a producir. Aprobarlo pieza por pieza después es imposible |

**El agente propone, Allan cierra.**

---

## 5 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **① Comprensión** | La realidad del negocio, la capacidad declarada, las cuentas que existen | 🛑 BLOQUEADO |
| **② Estrategia** | Objetivo del ciclo, posicionamiento aprobado, **las MUST BE TRUE**, el brief de marketing | 🛑 BLOQUEADO |
| **②B Branding** | Tono, territorio, activos distintivos | 🛑 BLOQUEADO |
| **⑧B Ads** | Qué ángulos ya rindieron en pauta | 🟡 No bloqueante |

🛑 **Ningún archivo de otro departamento se copia: se cita su ruta.**

---

## 6 · A quién entrega

| A | Qué le toca |
|---|---|
| **④ Creatividad** | El calendario completo. **Es su encargo** |
| **⑤ Producción** | Cuántos slots llevan rodaje — para dimensionar jornadas |
| **⑨ Posting** | El plan por canal, para saber en qué cuenta va cada cosa |
| **⑩ Ads** | Qué piezas del ciclo se van a pautar y con qué objetivo |

---

## 7 · Lo que este departamento NO hace

- **No escribe copy, hooks ni conceptos.** Eso es ④
- **No decide estética.** Eso es ②B y ④
- **No publica ni pauta.** Eso es ⑨ y ⑩
- **No cambia la estrategia.** Si está mal, se devuelve a ②
- **No encarga más de lo que el plan contratado paga**
- **No inventa un canal** que el cliente no tiene o no puede sostener

---

## 8 · Antes de cerrar el ciclo

- [ ] La campaña es **una** *(dos si el ciclo lo justifica)*, y está escrita en una frase
- [ ] La **jerarquía de mensaje** está escrita y es la ley del ciclo
- [ ] Cada canal tiene **una función única** y su *«qué NO se hace acá»*
- [ ] Cada slot tiene `traza` a una MUST BE TRUE
- [ ] Ninguna de las **cinco combinaciones prohibidas** aparece en el calendario
- [ ] El total de slots **entra en el techo del plan contratado**
- [ ] Todo lo que viene de otro departamento está **citado con su ruta**
- [ ] **Allan aprobó** los dos gates
