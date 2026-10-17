---
name: gr-encargo
description: >
  Capa 0 de ② Growth — identifica la división, lee el alcance contratado y declara exactamente qué
  pilares y sistemas se activan en este cliente. Carga los unit economics de ① Strategy, que
  son el piso de cualquier decisión de oferta o precio, y declara qué queda afuera y por qué.
  Úsala cuando pidan "arrancá growth de X", "qué podemos hacer con este alcance", "es low o high
  ticket", "qué pilar está roto". Bloquea si falta la división, los unit economics o la ficha de alcance.
---

# Capa 0 · Encargo — qué se activa y qué no

| | |
|---|---|
| **Consume** | Entregables de ① Strategy · `clients/<cliente>/00-onboarding/plan-contratado.md` · `clients/<cliente>/CLAUDE.md` · `inherent/03-OFERTA.md` |
| **Produce** | La sección **§ El encargo** de `motor-de-crecimiento.md` |

## 1 · La división — no se elige acá

**① Strategy la definió en el contexto.** Se copia, no se discute.

| 🔵 **LOW TICKET** | 🟣 **HIGH TICKET** |
|---|---|
| La compra se decide **rápido y solo** | La compra se decide **despacio y entre varios** |
| Pilares: Oferta · **Big sales** · **Upsells** | Pilares: Oferta · **Cuentas grandes** · **Expansión** |

> 🔑 **El eje es cómo se decide la compra, no quién compra.** Un colchón de $3,000 es B2C y high
> ticket; un SaaS de $30/mes es B2B y low ticket.

🛑 **Si ① Strategy no la definió, se devuelve.** Elegirla acá cambia los tres pilares.

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
| No hay costo por línea | `⚠️ SIN DATOS` · **no se cambia precio** · se pide a ① Strategy |
| El cliente lo estima de memoria | `[dice el cliente, sin verificar]`. **Se usa con esa etiqueta** |

## 3 · Qué activa el alcance

**Se copia del WORKFLOW y se escribe cuál es el caso de este cliente.**

| | Brand Foundation | Brand Growth | Growth Partnership |
|---|---|---|---|
| Pilar 1 · Oferta | ⬜ *(sale en ① Strategy)* | 🟡 **Ligero** — qué ofertas se empujan | ✅ |
| Pilar 2 · Canales grandes | ⬜ | ⛔ | ✅ |
| Pilar 3 · Upsells | ⬜ | ⛔ | ✅ |
| Conversion OS | ⬜ | ⛔ | ✅ |
| Herramienta | ⬜ | ⛔ | Según la ficha |
| Money OS | ⬜ | ⛔ | Según la ficha |

**En Brand Growth, Growth corre ligero:** solo se elige qué ofertas que ya
existen se empujan (`gr-oferta`). **No se cambia qué se vende, en qué paquetes ni a qué precio.**
⬜ **A la medida:** se copia lo que declara su pipeline en `plan-contratado.md`.

---

## 3b · 🔴 ¿El cliente puede pagar su alcance con el resultado del alcance?

**Se cruza la facturación del cliente contra el precio base de su ficha y los factores que lo
aumentan** *(más canales, más producción, más ubicaciones, más integración o más responsabilidad
de ejecución)*. El precio se arma por volumen y complejidad, no por industria.

### Si la facturación no sostiene el alcance

🔴 **Se declara en el encargo y se escala al CEO.** No se calla.

| Qué se escribe | Ejemplo |
|---|---|
| El número real contra el precio del alcance | *«Factura [X]/mes. El precio base de la ficha es [Y].»* |
| Qué significa | *«El alcance cuesta casi lo que factura. No se va a pagar solo.»* |
| La recomendación | *«Reducir el alcance a las áreas necesarias, o declarar que el cliente acepta el riesgo.»* |

⚠️ **No se bloquea el trabajo** — el cliente ya firmó. **Se bloquea el silencio.**
**Un cliente que no puede pagar el alcance con el resultado del alcance se va a ir**, y es mejor
saberlo el mes 1 que el mes 6.

## 4 · Qué queda afuera — y se dice

🛑 **Lo que el alcance no activa se escribe, no se omite.** Es lo que el account manager necesita
para responder sin prometer de más.

**Y se escribe en lenguaje de cliente:**

| ❌ Interno | ✅ Al cliente |
|---|---|
| *«Pilar 3 no se activa en Brand Growth»* | *«Los upsells los trabajamos cuando ya haya gente comprando una vez»* |
| *«Growth no rediseña la oferta en tu alcance»* | *«Tu alcance trabaja que te vean y te entiendan. Rediseñar qué vendes y a qué precio es el siguiente paso»* |
| *«Money OS es de Growth Partnership»* | *«El análisis de margen por producto entra cuando haya suficientes transacciones para que el dato sea real»* |

## 5 · Qué escribe

`## § El encargo`:

| Bloque | Qué lleva |
|---|---|
| **A · La división** | Cuál, copiada de ① Strategy |
| **B · El pilar roto** | Cuál es el cuello, según ① Strategy |
| **C · Unit economics** | Precio, costo y margen por línea · CAC · frecuencia · capacidad |
| **D · Qué activa el alcance** | La tabla, con el caso de este cliente marcado |
| **E · Qué queda afuera** | En lenguaje de cliente |

## 6 · Checklist

- [ ] La división viene de **① Strategy**, no se eligió acá
- [ ] Los unit economics están, o marcados `⚠️ SIN DATOS`
- [ ] Está claro **qué pilares activa el alcance**
- [ ] Lo que queda afuera está **escrito en lenguaje de cliente**
- [ ] Si la capacidad de entrega es el cuello, **está declarado arriba de todo**
