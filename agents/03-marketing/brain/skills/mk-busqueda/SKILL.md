---
name: mk-busqueda
description: >
  Capa de ③ Marketing — que la marca aparezca cuando la buscan: en Google (contenido guiado por lo
  que la gente busca y el perfil de Google Business) y en las respuestas de asistentes de IA (GEO).
  Respeta la línea del manual: «No hacemos SEO técnico»; no hace auditoría técnica, link building
  ni posicionamiento orgánico prometido. La pauta de búsqueda sigue siendo de ⑩ Ads. Úsala cuando
  pidan "SEO", "GEO", "que nos encuentren en Google", "que ChatGPT nos recomiende", "AI SEO",
  "optimizar la web", "Google Maps", "qué buscan nuestros clientes". Corre solo si la ficha de
  oferta incluye búsqueda o Google como canal.
---

# Capa · Búsqueda — que te encuentren cuando te buscan

| | |
|---|---|
| **Corre en** | ③ Marketing, después de `mk-canales` |
| **Niveles** | **Brand Growth** y **Growth Partnership:** solo si el área 4 de la ficha incluye SEO o Google como canal *(`03-OFERTA.md` área 4: «SEO, email y redes solo si están en el alcance»)* · **Brand Foundation:** ⛔ |
| **Consume** | `posicionamiento.md` y el lenguaje literal del comprador (① Strategy) · `plan-por-canal.md` · las keywords de AdWhispr `research_keywords` *(si ⑩ Ads ya las sacó)* · `LINKS.md` *(acceso a la web y a Google Business)* |
| **Produce** | `plan-de-busqueda.md` en `clients/<cliente>/03-marketing/` |

## 🛑 La línea que no se cruza

> **«No hacemos SEO técnico. Que te encuentren en Google es pauta de búsqueda y contenido pensado
> para lo que la gente busca.»** *(`inherent/07-COMUNICACION.md` § 7)*

| ✅ Entra | ⛔ No entra |
|---|---|
| Contenido guiado por búsquedas | Auditoría técnica, velocidad, código, indexación |
| Perfil de Google Business | Link building |
| Que la marca se describa igual en todos lados *(para la IA)* | Prometer posiciones o tráfico |
| Recomendaciones de texto para la web del cliente | Rehacer la web *(si se pide, es `gr-herramienta` en Growth Partnership o se cotiza)* |
| | Pauta de búsqueda: es de ⑩ Ads *(`ad-estructura` §4)* |

## 1 · Qué busca la gente — la lista

**Se sale de las palabras del comprador, no de las nuestras.**

| Fuente | Qué da |
|---|---|
| Lenguaje literal del brief y de ⑧ Community *(`cm-loop`)* | Cómo pregunta la gente de verdad |
| AdWhispr `research_keywords` · `research_competitor_keywords` | Qué se busca y qué buscan de la competencia |
| Las preguntas que se repiten *(FAQ de `05-comunidad/respuestas.md`)* | Lo que hay que contestar en público |

**Se agrupan en tres tipos:** **quién** *(«[categoría] en [zona]»)* · **cómo** *(problema o duda)* ·
**cuál** *(comparar, precio, opiniones)*. Cada grupo se liga a una etapa: cómo = TOF, quién = MOF, cuál = BOF.

## 2 · Google Business — la vitrina del momento de decisión

Ya es canal de ruta social *(`mk-canales` §4)*. Esta capa dice **qué tiene que tener**:

- Nombre, categoría, zona, horario y contacto **iguales a los de la web y las redes**
- Fotos reales y recientes *(`cr-adaptacion` §2: «foto real + información útil»)*
- Publicaciones que contestan las búsquedas de tipo **quién** y **cuál**
- Las reseñas se responden *(lo opera ⑧ Community si la ficha lo incluye)*

## 3 · GEO — que la IA entienda quién eres

**Los asistentes de IA recomiendan lo que pueden describir con seguridad.** Se trabaja con contenido,
no con trucos:

| Qué | Cómo |
|---|---|
| **Una descripción única** | La misma frase de qué es, qué vende, para quién y dónde — en la web, Google Business, redes y directorios |
| **Preguntas contestadas en público** | Las del grupo **cómo** y **cuál**, con respuesta clara y concreta *(especificidad, `psicologia-de-venta` §1)* |
| **Prueba citable** | Reseñas y casos con fuente *(los claims, validados por ②B Branding)* |
| **Revisión** | Una vez por ciclo se le pregunta a los asistentes por la categoría y la zona, y se anota si aparece la marca y cómo la describen |

🛑 **Lo que dicen los asistentes se anota tal cual, con fecha.** No se presenta como posición ni como promesa.

## 4 · El contenido guiado por búsqueda

**No son piezas extra:** son slots del calendario cuyo tema sale de una búsqueda.

| Formato | Cómo se adapta |
|---|---|
| YouTube Shorts | Título buscable con la keyword *(`cr-adaptacion` §2)* |
| Carrusel | La pregunta en la slide 1 |
| Blog o página de la web | Solo si la ficha lo incluye. Una pregunta por página |
| Google Business | La publicación contesta una búsqueda **quién** o **cuál** |

🛑 **Dentro del techo de slots de la ficha** *(`mk-calendario`)*.

## 5 · Recomendaciones para la web

**Se entregan escritas al dueño de la web**; no se toca código. Por cada página principal:
el título que contesta la búsqueda, la descripción, la pregunta que responde y los datos que deben
coincidir con Google Business.

## 6 · Qué se mide

| Medida | Fuente |
|---|---|
| Vistas y acciones del perfil de Google Business | Google Business *(Windsor si está conectado)* |
| Búsquedas con las que aparece la web | Search Console, **solo si el cliente da acceso** |
| ¿Aparece la marca en los asistentes? | La revisión del §3 |

Sin acceso: `⚠️ SIN DATOS`. **Nunca se estima el tráfico.**

## 7 · Gates

| Situación | Qué pasa |
|---|---|
| La ficha no incluye búsqueda ni Google | ⛔ No corre |
| No hay acceso a Google Business o la web | Se pide; mientras tanto solo corre §1 |
| Se pide SEO técnico | Se escala al CEO: está fuera de lo que vendemos |

## Checklist

- [ ] La ficha incluye **búsqueda o Google** como canal
- [ ] La lista sale del **lenguaje del comprador** y de keywords con fuente
- [ ] Google Business tiene los **datos iguales** a la web y las redes
- [ ] Existe **la descripción única** de la marca y está igual en todos lados
- [ ] Los slots de búsqueda están **dentro del techo**
- [ ] Nada promete **posición, tráfico ni recomendación de la IA**
- [ ] No se hizo **SEO técnico**

**Handoff →** `mk-calendario` *(slots con tema de búsqueda)* · ④ Creatividad · ⑨ Posting *(Google Business)* · ⑩ Ads *(la pauta de búsqueda)*.
