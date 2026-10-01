---
name: gr-oferta
description: >
  Capa 1 de ② Growth — el Pilar 1, Better your Offer. Trabaja qué se vende, cómo se empaqueta y
  a qué precio, con la profundidad que el plan paga: construirla en Ignite, escalarla en
  Accelerate, sistematizarla en Compound. Compara contra lo que la categoría ofrece y cobra, y
  nunca cambia un precio sin el cliente, porque es su negocio. Úsala cuando pidan "mejorá la
  oferta", "cómo lo empaquetamos", "cuánto deberíamos cobrar", "la gente dice que es caro",
  "qué vendemos exactamente". Cierra con el GATE 1, que aprueban Allan y el cliente.
---

# Capa 1 · Oferta — el Pilar 1

| | |
|---|---|
| **Consume** | § El encargo · lo que la categoría ofrece y cobra |
| **Produce** | La sección **§ La oferta** de `motor-de-crecimiento.md` |

## 1 · La profundidad la da el plan

| 🟦 **Ignite — construirla** | 🟪 **Accelerate — escalarla** | 🟨 **Compound — sistematizarla** |
|---|---|---|
| Qué se vende, claro, para que quien lo lea lo entienda y lo quiera | Que la misma oferta soporte más volumen sin romperse | Que se pueda explicar, cotizar y entregar sin el fundador |
| *High ticket:* empaquetarla | *High ticket:* construir autoridad | *High ticket:* autoridad del sistema |

## 2 · Los cuatro ángulos de una oferta

**No se mejora una oferta subiéndole cosas. Se mejora trabajando estos cuatro:**

| Ángulo | La pregunta |
|---|---|
| **El resultado** | ¿Qué consigue, dicho en lo que le importa a él? |
| **El mecanismo** | **Por qué esta forma y no otra.** Es lo que vuelve incomparable el precio |
| **La fricción** | Qué le cuesta decir que sí: tiempo, riesgo, esfuerzo, incertidumbre |
| **La prueba** | Qué lo hace creíble sin que tenga que confiar |

> 🔑 **La objeción del precio casi nunca es de precio: es de mecanismo o de prueba.**
> Si no entiende por qué esta forma y no otra, cualquier precio es caro.

## 3 · La investigación de categoría

| Qué se mira | Con qué |
|---|---|
| Qué ofrecen y cómo lo empaquetan | Firecrawl `firecrawl_scrape` |
| Qué prometen en su pauta | AdWhispr `get_brand_ads` |
| Qué busca la gente antes de comprar | Apify `google-search-scraper` |
| Qué dicen las reseñas de la categoría | Apify `crawler-google-places` |

🛑 **Se mira para encontrar el hueco, no para copiar.** Una oferta igual a la de todos compite
solo por precio.

## 4 · 🔴 El precio es decisión del cliente

🛑 **Nunca se cambia un precio sin él.** Se propone, con el razonamiento y el impacto en margen.

| | Qué se entrega |
|---|---|
| **La propuesta** | El precio sugerido |
| **Por qué** | El razonamiento, en una línea |
| **Qué pasa con el margen** | Con los unit economics de ① |
| **El riesgo** | Qué pasa si no funciona, y cómo se vuelve atrás |

⚠️ **Si no hay costo por línea, no se propone precio.** Se marca `⚠️ SIN DATOS` y se pide a ①.

## 5 · El límite de lo que podemos prometer

🛑 **La oferta del cliente es suya, pero lo que nosotros aportamos tiene techo.**
**No se promete lo que no está en «Capacidades reales»** de `inherent/06-ECONOMIA.md`.

## 6 · Qué escribe

`## § La oferta`:

| Bloque | Qué lleva |
|---|---|
| **A · Qué se vende hoy** | La oferta actual, tal cual está |
| **B · Los cuatro ángulos** | Resultado · mecanismo · fricción · prueba |
| **C · El hueco de la categoría** | Qué nadie está ofreciendo, con fuente |
| **D · La oferta propuesta** | Cómo queda empaquetada |
| **E · El precio** | Propuesta · por qué · impacto en margen · riesgo |
| **F · Cómo se dice** | En lenguaje de cliente, con el tono de ②B |

## 7 · 🚦 GATE 1

**Allan y el cliente aprueban la oferta — precio incluido.**

🛑 **Es su negocio.** Nosotros proponemos.

## 8 · Checklist

- [ ] La profundidad corresponde al **plan contratado**
- [ ] Los **cuatro ángulos** están trabajados
- [ ] La investigación de categoría tiene **fuente**
- [ ] El precio viene con **razonamiento, margen y riesgo**
- [ ] Sin costo por línea, **no se propuso precio**
- [ ] Nada promete algo fuera de «Capacidades reales»
- [ ] **Allan y el cliente aprobaron el GATE 1**
