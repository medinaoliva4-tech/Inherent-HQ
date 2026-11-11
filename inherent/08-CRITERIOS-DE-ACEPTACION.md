# Criterios de aceptación — una ficha por entregable

> 🛑 **Un elemento no pasa a «Listo» sin cumplir su ficha.** Cada criterio se responde **sí/no** o
> con **puntaje**. Si no se puede citar una regla, la pieza pasa y la regla que falta se anota
> *(`br-guardian` §1)*. Cada rechazo deja escrito el porqué.

**Quién revisa cada criterio**

| Marca | Quién | Qué puede juzgar |
|---|---|---|
| 🧠 | **Laya** | Texto: sí/no con probabilidad, elegir opción, puntaje |
| 👁️ | **Ojo visual** *(CLIP/SigLIP)* | ¿Se parece a la marca? *(contra moodboard y sistema visual)* · ¿Se ve de calidad? |
| 🔍 | **Claude con visión** | Lo visual que necesita entender la imagen o los fotogramas |
| 🙋 | **Humano** | El visto final y lo que pide criterio de negocio |
| ⚙️ | **Automático** | Medidas, conteos y formatos: se calculan, no se juzgan |

**Esta ficha** en la columna «Fuente» = el criterio vive aquí; no está repetido en una skill.

**Qué ficha revisa cada departamento**

| Ficha | La cumple | Antes de |
|---|---|---|
| 1 · Guion de reel · 2 · Guion de story · 8 · Ficha de referente | ③ Marketing y Creative | Pasar las piezas a aprobación (`mc-campanas-piezas`) |
| 2 · Story compuesta · 3 · Carrusel · 4 · Estático | ⑤ Diseño gráfico | El export (`gd-figma`) |
| 5 · Video editado | ④ Producción (Post) | El export (`pr-post`) |
| 6A · Anuncio de Meta · 6B · Anuncio de Google | ⑧ Ads | El GATE 1 (`ad-plan`) |
| 7 · Brief de comunicación | ① Strategy | Pasarlo a ③ Marketing y Creative |
| 9 · Factura · 10 · Propuesta | Administración *(`inherent/administracion/`)* | Mandarla al CEO para su sí |

---

## 1 · Guion de reel

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | El hook es de **una de las 7 cajas** y está **literal, entre comillas** | 🧠 | `mc-campanas-piezas` |
| 2 | **Sin saludo ni intro:** el segundo 1 es el hook | 🧠 | `mc-campanas-piezas` |
| 3 | El **frame 1 visual** está escrito | 🧠 | `mc-campanas-piezas` |
| 4 | Guion **por tramo y con tiempo**; los tramos suman la duración del canal | 🧠 ⚙️ | `mc-campanas-piezas` |
| 5 | **El héroe es el cliente**, y se ataca el **problema interno** | 🧠 | `mc-campanas-piezas` |
| 6 | **Una idea, un CTA**, y el CTA es de la familia de su etapa (TOF/MOF/BOF) | 🧠 | `mc-campanas-piezas` |
| 7 | Usa el **lenguaje literal del comprador** del brief | 🧠 | `mc-campanas-piezas` |
| 8 | Todo gap o tease **se cierra en la misma pieza** | 🧠 | `mc-campanas-piezas` |
| 9 | Todo claim, precio o promesa va **`⏸️ PENDIENTE APROBACIÓN`** con quién valida | 🧠 | `mc-campanas-piezas` |
| 10 | Sigue la estructura **HOOK → BODY → PAYOFF → CTA** con el tiempo de cada tramo | 🧠 | `mc-campanas-piezas` |
| 11 | **El gancho corresponde al nivel de consciencia declarado** | 🧠 | `mc-campanas-piezas` |

## 2 · Guion de story

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | La secuencia tiene **un objetivo y una acción** | 🧠 | `mc-campanas-piezas` |
| 2 | El **frame 1 engancha solo**, sin depender del anterior | 🧠 | `mc-campanas-piezas` |
| 3 | Lleva **una interacción** nativa *(encuesta, pregunta, quiz, enlace)* donde la pide el esqueleto | 🧠 | `mc-campanas-piezas` · `gd-figma` |
| 4 | **Cada frame** lleva **activo distintivo** | 🔍 👁️ | `gd-figma` · `br-sistema` |
| 5 | **Ningún texto en la zona del dedo** ni bajo la UI | 🔍 | `br-sistema` · `mc-campanas-piezas` |
| 6 | 9:16 y **≤ 15 s por frame** | ⚙️ | `mc-campanas-piezas` |
| 7 | El texto se lee **en el tiempo del frame** | 🧠 ⚙️ | `mc-campanas-piezas` |
| 8 | Cabe en el **techo de stories** de la ficha | ⚙️ | `mc-campanas-piezas` |
| 9 | **El gancho corresponde al nivel de consciencia declarado** | 🧠 | `mc-campanas-piezas` |

## 3 · Carrusel

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | **Slide 1 = hook** y se entiende **sola** | 🧠 🔍 | `mc-campanas-piezas` · `gd-figma` |
| 2 | **Cada slide se sostiene sola** | 🔍 | `gd-figma` |
| 3 | El copy es **literal** al de ③ Marketing y Creative *(no se acortó)* | 🧠 | `gd-figma` |
| 4 | **Un foco visual** y **un solo acento** por slide | 🔍 | `gd-figma` |
| 5 | Jerarquía **título > subtítulo > CTA** se lee en ese orden | 🔍 | `mc-campanas-piezas` · `gd-figma` |
| 6 | La slide 1 lleva **activo distintivo**; **logo tapado, se reconoce la marca** | 👁️ 🔍 | `br-sistema` · `br-guardian` |
| 7 | Medidas del formato, **sRGB**, sin placeholder | ⚙️ | `gd-figma` |
| 8 | Legible **al tamaño del feed** | 🔍 | `gd-figma` |
| 9 | Se ve de calidad *(puntaje estético)* | 👁️ | Esta ficha |

## 4 · Estático

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Se reconoce la marca **sin leer el texto** | 👁️ 🔍 | `br-sistema` |
| 2 | **Una frase que se sostiene sola**; no hay demasiado texto | 🧠 🔍 | `mc-campanas-piezas` · `br-sistema` |
| 3 | **Un foco**, **un acento**, tipografías del sistema con su peso | 🔍 | `gd-figma` |
| 4 | Texto **dentro de safe zones** | 🔍 | `gd-figma` |
| 5 | 4:5 o 1:1, sRGB, peso bajo el límite, sin elementos cortados | ⚙️ | `mc-campanas-piezas` · `gd-figma` |
| 6 | Copy literal y claims validados | 🧠 | `gd-figma` · `br-guardian` |
| 7 | Parecido a la marca *(puntaje contra el sistema visual)* | 👁️ | Esta ficha |

## 5 · Video editado

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | El **frame 1** es el que pidió ③ Marketing y Creative, **con activo**, y **no es negro** | 🔍 | `pr-post` |
| 2 | **Sin intro ni logo animado** antes del hook | 🔍 | `pr-post` |
| 3 | El hook está montado **literal** y se respeta HOOK-BODY-PAYOFF | 🔍 🧠 | `pr-post` · `mc-campanas-piezas` |
| 4 | Subtítulos con la **fuente del sistema**, en safe zone, **revisados** *(sin tildes cortadas)* | 🔍 🧠 | `pr-post` |
| 5 | La voz se entiende **sobre la música**; audio parejo entre piezas | 🙋 ⚙️ | `pr-post` |
| 6 | **Logo tapado, se reconoce** | 👁️ 🔍 | `pr-post` |
| 7 | Sin watermark; un archivo **por plataforma** con sus specs y el id de la pieza en el nombre | ⚙️ 🔍 | `pr-post` |
| 8 | Temblor y color **medidos por toma** | ⚙️ | `pr-post` |
| 9 | Se ve de calidad *(puntaje estético por fotograma clave)* | 👁️ | Esta ficha |

## 6A · Anuncio de Meta

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | **Mínimo 3 variantes de hook** por campaña | ⚙️ | `ad-plan` |
| 2 | Las variantes cambian **solo los primeros 3 segundos** | 🔍 🧠 | `ad-plan` |
| 3 | **Todo claim validado** por ② Branding; nada con `⏸️` | 🧠 | `ad-plan` |
| 4 | **Con subtítulos y edición** *(nada nivel F)* | 🔍 | `ad-plan` |
| 5 | La pieza va a la campaña de **su temperatura** | 🧠 | `ad-plan` |
| 6 | **No clona** el creativo de un competidor | 👁️ 🔍 | `ad-plan` |
| 7 | Texto principal, título y CTA escritos por variante | 🧠 | Esta ficha |
| 8 | Dentro del **techo de la ficha** y con **GATE 1 del CEO** | 🙋 | `ad-plan` |

## 6B · Anuncio de Google *(búsqueda)*

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Hay **cuenta del cliente y conversión medida** antes de gastar | 🙋 | `ad-plan` |
| 2 | Hasta **15 títulos de ≤ 30 caracteres** y **4 descripciones de ≤ 90** | ⚙️ | `ad-plan` *(límites de Google Ads)* |
| 3 | La **keyword** del grupo aparece en al menos un título | 🧠 | `ad-plan` |
| 4 | Los títulos dicen **cosas distintas** *(no la misma frase repetida)* | 🧠 | `ad-plan` |
| 5 | Claims validados; sin «el mejor» ni «el único» | 🧠 | `ad-plan` |
| 6 | Su presupuesto sale **del total aprobado** y pasó el **GATE 1** | 🙋 | `ad-plan` |
| 7 | Es pauta de búsqueda: **no promete posicionamiento orgánico** | 🧠 | `ad-plan` |

## 7 · Brief de comunicación

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Cabe en **una página** con los **siete bloques** | ⚙️ 🧠 | `strategy` |
| 2 | **Una** oferta, **una** persona, **una** acción, **una** emoción | 🧠 | ídem |
| 3 | La oferta está **citada** de lo que existe; en Brand Growth no se tocó | 🧠 | ídem |
| 4 | La persona trae **lenguaje literal** *(o `⚠️ SIN DATOS`)* y **los 3 dolores del ciclo** con su cita | 🧠 | ídem |
| 5 | Palabras, visual e ideas traen **ejemplo**, no adjetivos | 🧠 | ídem |
| 6 | **Máximo dos principios** de psicología de venta, nombrados | 🧠 | ídem |
| 7 | **Máximo cinco búsquedas**, cada una ligada a una decisión del bloque 5 | 🧠 | ídem |
| 8 | Nada contradice `plan-contratado.md` ni `03-OFERTA.md` | 🧠 🙋 | ídem |

## 8 · Ficha de referente

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Trae **nivel (1-5)** y **país**, y no mezcla competencia con referencias | 🧠 | `mc-radar` |
| 2 | **Señal de ganador:** pauta 60-90+ días **leídos de la Ad Library**; orgánico **2x su mediana** | ⚙️ | `mc-radar` |
| 3 | **Fecha de lectura** registrada | ⚙️ | `mc-radar` |
| 4 | **Hook literal** y **caja** marcados | 🧠 | `ficha-de-referencia.md` §E |
| 5 | **Patrón de 7 capas** extraído *(el patrón, nunca la ejecución)* | 🧠 | ídem §H |
| 6 | **Hipótesis** para la marca con qué la confirmaría; pasa la **prueba del logo** | 🧠 | ídem §I |
| 7 | Lo que no se pudo leer está **declarado** *(`⚠️ SIN ARCHIVO`)* | 🧠 | ídem §J |
| 8 | **Resonancia con el ICP** puntuada sobre los comentarios | 🧠 | `mc-radar` |
| 9 | Parecido visual a la dirección del brief *(para niveles 2 y 3)* | 👁️ | Esta ficha |

## 9 · Factura

**Por cobrar**

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Sale de una **cotización aceptada** o del nivel del cliente en `clients/` | ⚙️ 🧠 | `CLAUDE.md` «se leen, nunca se suponen» |
| 2 | **Moneda y país declarados** *(GTQ por defecto; USD solo si el documento es en USD)* | ⚙️ | `administracion/shared/currency-and-locale.md` |
| 3 | Los **costos de terceros** van en línea aparte, no absorbidos | 🧠 | `CLAUDE.md` · `03-OFERTA.md` |
| 4 | **Nada se envía sin el sí del CEO**; no se le cobra a quien pagó en los últimos 14 días | 🙋 ⚙️ | `invoice-chase` § What not to do |
| 5 | La FEL la emite el contador | 🙋 | Esta ficha |

**Por pagar**

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 6 | Proveedor, NIT, monto y vencimiento leídos; **lo ilegible queda vacío y se nombra** | 🧠 🔍 | `ap-processor` |
| 7 | Asignada a **categoría y a cliente/proyecto** | 🧠 | Esta ficha |
| 8 | **¿Duplicada? ¿Monto raro?** *(contra el historial del proveedor)* | 🧠 ⚙️ | `ap-processor` |
| 9 | Si cambian los **datos bancarios** o pide pago urgente: **se verifica por teléfono**, no se paga | 🧠 🙋 | `ap-processor` · `administracion/shared/untrusted-content.md` |
| 10 | **Nada se paga sin el sí del CEO** | 🙋 | `ap-processor` · `administracion/README.md` |

## 10 · Propuesta / cotización

| # | Criterio | Revisa | Fuente |
|---|---|---|---|
| 1 | Trae los **10 campos de la ficha de oferta** *(resultado, entregables, volumen, revisiones, qué aporta el cliente, qué queda fuera, plazo, responsables, métricas, precio y qué lo aumenta)* | 🧠 | `03-OFERTA.md` § La ficha |
| 2 | **Qué queda fuera está escrito**, no sobreentendido | 🧠 | ídem |
| 3 | El precio se justifica por **alcance** *(áreas y profundidad)*, no por piezas sueltas | 🧠 | `CLAUDE.md` «La economía» |
| 4 | El precio **no queda bajo el baseline** del nivel; **ninguna tarifa inventada** *(si falta, queda en blanco para el CEO)* | 🙋 ⚙️ | `CLAUDE.md` · `proposal-builder` Step 2 |
| 5 | **Ninguna frase garantiza un resultado** — tampoco un número de leads | 🧠 | `07-COMUNICACION.md` checklist · `03-OFERTA.md` «Los leads» |
| 6 | Costos de terceros **aparte** *(pauta, producción especial, talento, viajes, licencias)* | 🧠 | `03-OFERTA.md` |
| 7 | Performance fee **solo en Growth Partnership** y solo con atribución limpia | 🧠 | `CLAUDE.md` |
| 8 | En área 7 dice si Inherent **diseña, capacita o también cierra**; en área 12, **quién, cuántas horas y qué entrega** | 🧠 | `03-OFERTA.md` áreas 7 y 12 |
| 9 | Las notas de riesgo y margen **no aparecen** en lo que ve el cliente | 🧠 | `proposal-builder` Step 5 |
| 10 | **No sale sin el sí del CEO** | 🙋 | `proposal-builder` Step 6 |
