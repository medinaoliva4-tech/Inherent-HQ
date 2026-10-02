---
name: gr-encargo
description: >
  Capa 0 de ② Growth — identifica la división, lee el plan contratado y declara exactamente qué
  pilares y sistemas se activan en este cliente. Carga los unit economics de ① Comprensión, que
  son el piso de cualquier decisión de oferta o precio, y declara qué queda afuera y por qué.
  Úsala cuando pidan "arrancá growth de X", "qué podemos hacer con este plan", "es low o high
  ticket", "qué pilar está roto". Bloquea si falta la división, los unit economics o el plan.
---

# Capa 0 · Encargo — qué se activa y qué no

| | |
|---|---|
| **Consume** | Entregables de ① y ② · `clients/<cliente>/` · `inherent/03-OFERTA.md` |
| **Produce** | La sección **§ El encargo** de `motor-de-crecimiento.md` |

## 1 · La división — no se elige acá

**② Estrategia la definió en el contexto.** Se copia, no se discute.

| 🔵 **LOW TICKET** | 🟣 **HIGH TICKET** |
|---|---|
| La compra se decide **rápido y solo** | La compra se decide **despacio y entre varios** |
| Pilares: Oferta · **Big sales** · **Upsells** | Pilares: Oferta · **Cuentas grandes** · **Expansión** |

> 🔑 **El eje es cómo se decide la compra, no quién compra.** Un colchón de $3,000 es B2C y high
> ticket; un SaaS de $30/mes es B2B y low ticket.

🛑 **Si ② no la definió, se devuelve.** Elegirla acá cambia los tres pilares.

## 2 · Los unit economics — el piso de todo

**Sin esto no se toca el precio.**

| Dato | Para qué |
|---|---|
| **Precio y costo de cada línea** | Sin margen por línea, subir el ticket puede bajar la utilidad |
| **Cuánto cuesta traer un cliente** | Define si el canal grande vale la pena |
| **Cada cuánto recompra** | Define si el Pilar 3 tiene con qué |
| **Capacidad de entrega** | ⚠️ **Si la empresa es el estorbo, más demanda empeora el problema** |

| Si falta | Qué se hace |
|---|---|
| No hay costo por línea | `⚠️ SIN DATOS` · **no se cambia precio** · se pide a ① |
| El cliente lo estima de memoria | `[dice el cliente, sin verificar]`. **Se usa con esa etiqueta** |

## 3 · Qué activa el plan

**Se copia del WORKFLOW y se escribe cuál es el caso de este cliente.**

| | 🔷 Marketing / Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|
| Pilar 1 · Oferta | ⛔ | ✅ | ✅ |
| Pilar 2 · Canales grandes | ⛔ | ✅ | ✅ |
| Pilar 3 · Upsells | ⛔ | ✅ | ✅ |
| Conversion OS | ⛔ | ✅ | ✅ |
| Herramienta | ⛔ | 1/trimestre | 1/mes |
| Money OS | ⛔ | ⬜ | ✅ |

🛑 **Sobre un plan de la línea 🔷 Marketing, esta skill BLOQUEA.**

---

## 3b · 🔴 ¿El cliente califica para su plan?

**Se cruza la facturación del cliente contra el piso desde el que su plan tiene sentido.**

| Plan | Factura al menos |
|---|---|
| 🔷 Marketing | **Q98,000** / mes |
| 🔷 Marketing Pro | **Q149,000** |
| 🟨 Accelerate | **Q257,000** |
| 🟨 Compound | **Q431,000** |

*Supuesto: margen del cliente 30%, el plan se paga con 25% de crecimiento.
Ver `inherent/03-OFERTA.md` → «Desde qué facturación tiene sentido cada plan».*

### Si factura menos que el piso

🔴 **Se declara en el encargo y se levanta como excepción a Allan.** No se calla.

| Qué se escribe | Ejemplo |
|---|---|
| El número real contra el piso | *«Factura Q21,600/mes. El piso de Accelerate es Q257,000.»* |
| Qué significa | *«El plan cuesta casi lo que factura. No se va a pagar solo.»* |
| La recomendación | *«Bajar a Marketing Pro, o declarar que el cliente acepta el riesgo.»* |

⚠️ **No se bloquea el trabajo** — el cliente ya firmó. **Se bloquea el silencio.**
**Un cliente que no puede pagar el plan con el resultado del plan se va a ir**, y es mejor
saberlo el mes 1 que el mes 6.
| Money OS | ⬜ | ⬜ | ✅ |

## 4 · Qué queda afuera — y se dice

🛑 **Lo que el plan no activa se escribe, no se omite.** Es lo que el account manager necesita
para responder sin prometer de más.

**Y se escribe en lenguaje de cliente:**

| ❌ Interno | ✅ Al cliente |
|---|---|
| *«Pilar 3 no se activa en la línea Marketing»* | *«Los upsells los trabajamos cuando ya haya gente comprando una vez»* |
| *«Growth no corre en tu plan»* | *«Tu plan trabaja que te vean y te entiendan. Rediseñar qué vendes y a qué precio es el siguiente paso»* |
| *«Money OS es Compound»* | *«El análisis de margen por producto entra cuando haya suficientes transacciones para que el dato sea real»* |

## 5 · Qué escribe

`## § El encargo`:

| Bloque | Qué lleva |
|---|---|
| **A · La división** | Cuál, copiada de ② |
| **B · El pilar roto** | Cuál es el cuello, según ② |
| **C · Unit economics** | Precio, costo y margen por línea · CAC · frecuencia · capacidad |
| **D · Qué activa el plan** | La tabla, con el caso de este cliente marcado |
| **E · Qué queda afuera** | En lenguaje de cliente |

## 6 · Checklist

- [ ] La división viene de **② Estrategia**, no se eligió acá
- [ ] Los unit economics están, o marcados `⚠️ SIN DATOS`
- [ ] Está claro **qué pilares activa el plan**
- [ ] Lo que queda afuera está **escrito en lenguaje de cliente**
- [ ] Si la capacidad de entrega es el cuello, **está declarado arriba de todo**
