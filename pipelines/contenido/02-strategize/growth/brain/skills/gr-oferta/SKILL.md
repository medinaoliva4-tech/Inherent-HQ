---
name: gr-oferta
description: >
  Capa 1 de Growth — el Pilar 1, Better your Offer. Trabaja qué se vende, cómo se empaqueta y
  a qué precio, con la profundidad que el plan paga: en la línea Marketing corre ligero —elige
  cuáles de las ofertas que ya existen se empujan y con qué objetivo, sin cambiarlas—, se escala
  en Accelerate y se sistematiza en Compound. Compara contra lo que la categoría ofrece y cobra, y
  nunca cambia un precio sin el cliente, porque es su negocio. Úsala cuando pidan "mejorá la
  oferta", "qué oferta empujamos este mes", "cómo lo empaquetamos", "cuánto deberíamos cobrar",
  "la gente dice que es caro", "qué vendemos exactamente". En Accelerate y Compound la oferta
  nueva se escala al CEO antes de llevarla al cliente: es comprometer precio, no una parada.
---

# Capa 1 · Oferta — el Pilar 1

| | |
|---|---|
| **Consume** | § El encargo · lo que la categoría ofrece y cobra |
| **Produce** | 🔷 **`clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md`** · 🟨 la sección **§ La oferta** de `motor-de-crecimiento.md` |

## 1 · La profundidad la da el plan

| 🔷 **Marketing / Pro — LIGERO** | 🟨 **Accelerate — escalarla** | 🟨 **Compound — sistematizarla** |
|---|---|---|
| La oferta llega como está: se elige cuáles se empujan y con qué objetivo | Que la misma oferta soporte más volumen sin romperse | Que se pueda explicar, cotizar y entregar sin el fundador |
| | *High ticket:* empaquetar y construir autoridad | *High ticket:* autoridad del sistema |

> 🔑 **La diferencia entre MENSAJE y OFERTA — es la línea que separa los dos productos.**
> **Mensaje** = cómo se cuenta lo que ya vende → lo hace Marketing con Branding, en los
> cuatro planes.
> **Oferta** = qué vende, en qué paquetes y a qué precio → **solo acá, desde Accelerate.**
> **Confundirlos regala el trabajo caro dentro del plan barato.**

## 1b · 🔷 Ligero — qué ofertas se empujan este ciclo

**En la línea Marketing no se trabaja la oferta: se elige entre lo que ya se vende.**

| Paso | Qué se hace |
|---|---|
| **1 · Lo que se vende hoy** | Las ofertas tal cual están, con su precio — de los unit economics de Strategy |
| **2 · Cuáles se empujan** | Las que este ciclo tienen más con qué: margen, temporada, capacidad de entregar |
| **3 · Con qué objetivo** | Uno por oferta, **en una métrica** — es lo que Ads pauta |
| **4 · Cuáles no, y por qué** | En una línea cada una |

🛑 **No se cambia qué se vende, en qué paquetes ni a qué precio.** Si el cliente lo pide, es upsell
a 🟨 Accelerate. **En modo ligero no corren los ángulos, la investigación ni el precio (§2 a §4),
y no hay nada que escalar:** no se toca el precio y no sale al cliente.

**Escribe `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md`** — plantilla en
`pipelines/contenido/02-strategize/growth/brain/entregables/ofertas-a-empujar.md`. **Lo leen Marketing y Ads.**

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
| **Qué pasa con el margen** | Con los unit economics de Strategy |
| **El riesgo** | Qué pasa si no funciona, y cómo se vuelve atrás |

⚠️ **Si no hay costo por línea, no se propone precio.** Se marca `⚠️ SIN DATOS` y se pide a
Strategy.

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
| **F · Cómo se dice** | En lenguaje de cliente, con el tono de Branding |

## 7 · 🔴 La oferta nueva se escala al CEO — 🟨

**Llevarle al cliente una oferta o un precio nuevo es comprometer precio: se escala al CEO antes de
llevarla.** No es una parada: Growth sigue con las capas que vienen. Después, **el cliente decide.**

🛑 **Es su negocio.** Nosotros proponemos.

## 8 · Checklist

- [ ] La profundidad corresponde al **plan contratado**
- [ ] 🔷 **No se tocó** qué se vende, sus paquetes ni su precio · cada oferta empujada tiene **objetivo en una métrica**
- [ ] 🟨 Los **cuatro ángulos** están trabajados
- [ ] 🟨 La investigación de categoría tiene **fuente**
- [ ] 🟨 El precio viene con **razonamiento, margen y riesgo**
- [ ] 🟨 Sin costo por línea, **no se propuso precio**
- [ ] Nada promete algo fuera de «Capacidades reales»
- [ ] 🟨 La oferta nueva **se escaló al CEO** antes de llegar al cliente
