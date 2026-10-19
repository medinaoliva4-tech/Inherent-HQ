---
name: gr-funnel
description: >
  Capa de ② Growth — el mapa del embudo de punta a punta: de la pieza que atrae (TOF) al cierre y
  la recompra, con la pieza, la página o el mensaje y la métrica de cada paso. Junta en un solo mapa
  lo que hoy está repartido entre mk-calendario (etapa), gr-captura (receta), gr-conversion
  (recorrido y seguimiento) y gr-herramienta (landing). Incluye la secuencia de nutrición por
  correo o WhatsApp. Úsala cuando pidan "el funnel", "el embudo", "cómo llega alguien de un reel a
  comprar", "dónde se cae la gente", "la secuencia de correos", "qué landing necesitamos".
  Requiere Growth Partnership y la oferta de gr-oferta.
---

# Capa · Funnel — un solo mapa, de la primera vista a la venta

| | |
|---|---|
| **Corre en** | ② Growth, después de `gr-captura` y antes de `gr-conversion` |
| **Niveles** | **Growth Partnership:** completo · **Brand Growth:** ⛔ no se construye; la acción es `directo` *(`mk-calendario` § captura)* · **Brand Foundation:** ⛔ |
| **Consume** | § La oferta · § Captura · el recorrido real de `gr-conversion` §2 · el mix TOF/MOF/BOF de `mk-pilares` §6B · cómo se compra, de ① Strategy |
| **Produce** | La sección **§ Funnel** de `motor-de-crecimiento.md`: el mapa y la secuencia de nutrición |

> 🔑 **El funnel no es una herramienta: es el camino.** Primero se dibuja, después se construye
> lo que falta. **«Automatizar un embudo que no se mapeó es automatizar el desorden»** *(`gr-conversion` §2)*.

## 1 · Los pasos del mapa

| Paso | Pregunta | Consciencia que cubre | Quién lo lleva | Qué existe |
|---|---|---|---|---|
| **TOF · Atrae** | ¿Qué pieza lo hace detenerse? | **1-2** · Inconsciente → Consciente del problema | ③ Marketing · ④ Creatividad · ⑩ Ads | Slots `etapa = TOF` · podcast *(`mk-podcast`)* · búsqueda *(`mk-busqueda`)* |
| **MOF · Captura** | ¿Qué deja a cambio de su contacto? | **2-3** · ya nombra el problema, busca cómo resolverlo | ② Growth | La receta de `gr-captura` |
| **MOF · Nutre** | ¿Qué recibe hasta que está listo? | **3-4** · por qué esta forma y por qué tú | ② Growth · ④ Creatividad | La secuencia *(§3)* |
| **BOF · Decide** | ¿Qué le falta saber para comprar? | **4-5** · prueba, objeciones, oferta | ② Growth | Página de venta, prueba, objeciones *(`gr-conversion` §3C)* |
| **BOF · Compra** | ¿Qué fricción tiene el pago o el cierre? | **5** · Listo para comprar | ② Growth · el cliente | Cierre, pago, agenda |
| **Después** | ¿Vuelve y recomienda? | Ya es cliente | ② Growth | `gr-upsells` · `gr-referidos` |

🔑 **Los niveles de consciencia son los de `mk-calendario` § 1A.** Cada paso le habla al nivel que
cubre: el gancho y el mensaje de su pieza, página o mensaje salen de ese nivel *(`cr-hook-copy` § 1B)*.
Es una guía, no una regla rígida.

🛑 **Cada paso tiene una sola métrica.** Sin métrica, el paso no se puede leer y el mapa es un dibujo.

## 2 · La ficha de cada paso

| Campo | Qué lleva |
|---|---|
| **Pieza, página o mensaje** | El `id` de la pieza, la URL o el mensaje exacto |
| **Acción esperada** | Una sola |
| **Métrica** | La que dice si el paso funciona |
| **Dato de hoy** | El número real, o `⚠️ SIN DATOS` |
| **Dónde se cae** | Lo que dice el recorrido de `gr-conversion` §2 |
| **Quién lo opera** | El rol |

## 3 · La secuencia de nutrición

**Lo que recibe un lead entre que deja su contacto y está listo para comprar.**

| Regla | Por qué |
|---|---|
| **Cada mensaje da algo antes de pedir** | Reciprocidad *(`psicologia-de-venta` §6)* |
| **Un mensaje, una acción** | `psicologia-de-venta` §4 |
| **Cuántos toques, cada cuánto y cuándo se deja de insistir** | El mismo estándar de `gr-conversion` §3B |
| **Canal:** correo o WhatsApp, el que el lead dio | Lo opera ⑧ Community o el equipo del cliente |
| **Asunto < 50 caracteres y 1 CTA** *(correo)* | `cr-adaptacion` §2 |
| **Quien pide no recibir más, no recibe más** | `gr-captura` § Outbound |

**Los textos los escribe ④ Creatividad** en la voz de ②B Branding; ② Growth dice qué va en cada toque.

## 4 · La página de cada paso

**Una página, una oferta, un botón** *(`psicologia-de-venta` §4)*.

| Página | Cuándo |
|---|---|
| **Captura** *(formulario, quiz)* | Si la receta lo pide |
| **Venta o VSL** | Si la oferta necesita explicación |
| **Gracias** | Siempre que haya formulario: dice qué pasa ahora y cuándo |

🛑 **Si la página hay que construirla, es `gr-herramienta`** y cuenta dentro de lo que declara la ficha.

## 5 · Cómo se lee

**Se lee de abajo hacia arriba:** el primer paso que se cae es el que se arregla. Si el paso de
compra pierde, más TOF empeora el problema *(«Si la empresa es el estorbo, más demanda empeora el
problema»*, CLAUDE.md*)*.

## 6 · Gates

| Situación | Qué pasa |
|---|---|
| No es Growth Partnership | ⛔ No corre |
| No se mapeó el recorrido real | 🛑 No se construye nada |
| Un mensaje automático dice precio u oferta nueva | Se escala al CEO |
| Lo que habla con el cliente final | Se auto-revisa antes de encenderse *(`gr-conversion` §4)* |

## Checklist

- [ ] El mapa tiene **los seis pasos**, cada uno con **una métrica** y **el nivel de consciencia que cubre**
- [ ] Cada paso tiene su **dato de hoy** o `⚠️ SIN DATOS`
- [ ] La **secuencia de nutrición** tiene toques, frecuencia y final
- [ ] Cada página es **una oferta, un botón**
- [ ] Se marcó **el primer paso que se cae** y es el que se arregla primero
- [ ] Nada automático se encendió sin auto-revisión

**Handoff →** ③ Marketing *(slots por etapa)* · ④ Creatividad *(textos de la secuencia)* ·
⑧ Community *(la opera)* · ⑩ Ads *(destino de cada campaña)* · `gr-loop`.
