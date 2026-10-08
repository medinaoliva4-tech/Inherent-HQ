---
name: rs-audiencia
description: >
  Capa 1 de Research — Audience Intelligence. Entiende qué consume y qué dice la audiencia a partir
  de comentarios, preguntas, objeciones y conversaciones públicas, los creadores y comunidades
  relevantes, las búsquedas y los temas, y los datos propios del cliente cuando los entrega. Clasifica
  cada oportunidad por audiencia, problema, intención de compra y proximidad al producto, porque una
  audiencia amplia hace viral un video pero una pequeña puede producir ventas de mayor valor. Cita el
  lenguaje literal del comprador. Úsala cuando pidan "qué dice la audiencia", "qué objeciones hay",
  "qué pregunta la gente", "a quién le hablamos", "qué consume mi cliente". No decide a quién le
  habla la marca: eso es Strategy.
---

# Capa 1 · rs-audiencia — qué consume y qué dice la audiencia

| | |
|---|---|
| **Consume** | Las Redes del plan · el arquetipo y la audiencia actual de Strategy · los comentarios de las cuentas del cliente, de los competidores y de los referentes · las preguntas repetidas de `cm-loop` · **si el cliente los entrega:** ventas, CRM y analytics |
| **Produce** | `audiencia.md` — lo observado, las oportunidades clasificadas en cuatro ejes y el lenguaje literal citado |

Contexto del departamento: `pipelines/contenido/03-research/research/brain/WORKFLOW.md`.

**Describe lo observable. No decide a quién se le habla:** esa decisión es de Strategy. Esta capa
entrega la evidencia sobre la que Strategy y Marketing deciden.

## Paso 1 · Juntar lo observable

| Fuente | Qué da | Herramienta |
|---|---|---|
| **Comentarios** de las piezas del cliente, de los competidores y de los referentes | Preguntas, objeciones, deseos, palabras literales | Apify `apify/instagram-post-scraper` · `clockworks/tiktok-scraper` ⬜ |
| **Reseñas de Google Maps** | Qué valoran y qué reclaman quienes ya compraron | Apify, con `platform: google maps` ⬜ |
| **Búsquedas y temas** | Qué buscan, con qué volumen, con qué palabras | `research_keywords` · Apify, con `platform: google search` ⬜ |
| **Conversaciones públicas, prensa y menciones** | Cómo hablan de la categoría fuera de las cuentas de marca | `WebSearch` ✅ |
| **Creadores y comunidades** | Quién les habla hoy a esas personas y dónde se juntan | Apify *(hashtags → perfiles)* ⬜ |
| **Datos propios del cliente** | Qué compran de verdad, cuánto, cada cuánto | 👤 Lo que el cliente entregue |
| **Preguntas repetidas en la bandeja** | Lo que ya le escriben a la marca | `cm-loop` de Community Management |

🛑 **Los datos propios del cliente se leen, nunca se suponen.** Sin ventas ni CRM, la intención de
compra se estima **solo desde señales públicas** y se marca `[señal pública, sin verificar con ventas]`.

## Paso 2 · Clasificar cada oportunidad en cuatro ejes

Una **oportunidad** es un tema, pregunta u objeción que aparece más de una vez y a la que el
contenido puede responder.

| Eje | Valores | Cómo se asigna |
|---|---|---|
| **Audiencia** | Quién es y cuán grande: **amplia** · **intermedia** · **pequeña** | Por quién escribe y cuántas veces aparece |
| **Problema** | El dolor, el deseo o el freno, **en una frase** | Con la cita literal que lo sostiene |
| **Intención de compra** | **Explorando** *(curiosidad)* · **Comparando** *(precio, alternativas)* · **Lista para pedir** *(dónde, cuánto, cómo)* | Por el verbo y el tipo de pregunta |
| **Proximidad al producto** | **Cerca** *(pide lo que ya se vende)* · **Adyacente** · **Lejos** | Contra la oferta que ya existe del cliente |

🔑 **El orden de las oportunidades no lo manda el tamaño de la audiencia.** Una audiencia pequeña con
intención **Lista para pedir** y proximidad **Cerca** vale más que una amplia en **Explorando** y
**Lejos**. Las dos se declaran; no se descarta la amplia, se le pone su rol (alcance) y a la otra el
suyo (venta).

```
| # | Oportunidad | Audiencia | Problema | Intención | Proximidad | Cita literal [fuente] | Veces |
```

## Paso 3 · El lenguaje literal

Una sección aparte con **las palabras del comprador, tal cual**: cómo nombra el problema, cómo nombra
la solución, qué objeción repite, qué compara. Cada cita lleva **plataforma, fecha y enlace**.

🛑 **Se cita, no se parafrasea.** Y nunca se atribuye una cita a una persona identificable fuera de
lo ya público en la pieza.

## Paso 4 · Lo que sugiere tocar la estrategia

Si lo observado contradice la audiencia que Strategy asumió, **se levanta como hallazgo**, con su
evidencia. Research no reescribe la audiencia objetivo.

## 🛑 Bloqueos

- Sin Redes en el plan: no corre.
- Sin ningún comentario ni dato accesible: el archivo existe y dice
  `⚠️ SIN DATOS — [qué fuente faltó]`; **no se rellena con lo que «normalmente» pide la audiencia.**
- Una oportunidad con **una sola aparición** no se declara patrón: va como `⚪ una sola aparición`.

## ✅ Checklist

- [ ] Solo las Redes del plan
- [ ] Cada oportunidad está clasificada en **los cuatro ejes**
- [ ] El orden de las oportunidades considera **intención y proximidad**, no solo el tamaño
- [ ] Toda cita literal trae plataforma, fecha y enlace
- [ ] Los datos propios del cliente se leyeron o se declaró `⚠️ SIN DATOS`
- [ ] Ningún patrón se declaró con una sola aparición
- [ ] Ningún error de herramienta se reportó como «no hay datos»
- [ ] Lo que contradice a Strategy se levantó como hallazgo, no se decidió
- [ ] Entrada completa en `registro-de-research.md`

**Handoff →** `rs-competencia` (a quién se mira para esa audiencia) · Marketing y Strategy
**(la ruta citable)** · Creatividad **(el lenguaje literal)**.
