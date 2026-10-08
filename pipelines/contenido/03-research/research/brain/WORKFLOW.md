# Research — cómo trabaja

> **En una frase:** baja a lo micro lo que Strategy ve en lo macro —qué dice la audiencia, qué hacen
> los competidores y los referentes, qué se mueve y qué contenido está ganando— y deja todo en una
> biblioteca viva que Marketing, Creatividad, Ads y Performance usan sin volver a investigar.

## 🎯 Su lugar en el pipeline

| | |
|---|---|
| **Pipeline** | Contenido |
| **Departamento** | 03 · Research |
| **Propósito del paso** | Investigar audiencias, competidores, referentes, tendencias y contenido ganador |
| **Su responsabilidad** | Mantener viva la biblioteca de winners y la lectura de audiencia de cada cliente: lo micro, pieza por pieza |
| **Artifact del equipo** | Creative Intelligence Engine |
| **Entregable al cliente** | Ninguno directo: su valor se ve en lo que sale de Create |

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 📅 Su ventana en el ciclo

> Calendario completo: `inherent/05-OPERACION.md` → «El calendario del ciclo». 🔴 **Día 11:** último
> día para producir · 🔴 **Día 20:** presentación al cliente.

**Research no vive solo en el ciclo del 1 al 20: la biblioteca se mantiene viva todo el mes.**

| Qué | Cuándo | Skill |
|---|---|---|
| **Arranque con un cliente nuevo** | Justo después de que Strategy cierra el mapa de la categoría | `rs-audiencia` → `rs-competencia` → `rs-winners` → `rs-tendencias` |
| **Insumo del plan del ciclo** | **Días 1-3**, junto con Strategy: Marketing y Creatividad necesitan la ruta citada para armar pilares, canales y calendario | `rs-audiencia` · `rs-competencia` |
| **Refresco de la biblioteca de winners** | **Semanal**, por cron cuando exista el servidor; a mano con `/rs-winners` mientras tanto | `rs-winners` |
| **Lectura de tendencias** | Una vez por ciclo, antes del día 3 | `rs-tendencias` |
| **Ganadores propios del ciclo anterior** | **Día 20** → entran al día 1 del ciclo siguiente | `rs-winners` |

🔑 **Lo que Research no alcanza a dejar listo antes del día 3 no frena el ciclo:** sale con lo que hay,
marcado `⚠️ SIN DATOS` donde falte, y se completa en el refresco semanal.

---

## 0 · El plan contratado — qué se prende

**Lo primero de cada corrida: leer el plan del cliente** en
`clients/<cliente>/00-onboarding/plan-contratado.md`. Ahí están las **Redes** del cliente.

- 🛑 **Sin plan anotado, Research no corre para ese cliente:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo.** El volumen por Red es el del plan; si se pasa, se declara y se para.
- 🛑 **Se investigan solo las Redes del cliente.** No se investiga una plataforma donde el cliente no
  publica, por interesante que sea lo que haya ahí.
- ⬜ **Tailor Made: manda Su pipeline** del `plan-contratado.md`, sin cuestionarlo. Si Research no está,
  no corre para ese cliente; si está, usa la cuota que el plan declara.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contenidos a investigar** *(por cada una de las **Redes** de `plan-contratado.md` — mitad competencia GT, mitad referencias)* | **50** | **50** | **100** | **100** |
| **Piezas del ciclo que habilita** | **86** | **145** | **145** | **204** |

**Cómo se lee:**

- **La cuota es por Red.** Un cliente de 🔷 Marketing con tres Redes son 150 contenidos: **25 de
  competencia y 25 de referencias en cada Red.**
- **Esta cuota es de Research.** Strategy la fija al anotar el plan; Research la ejecuta. Strategy y
  Creatividad la citan, no la repiten.
- **Audience Intelligence y la lectura de tendencias corren en los cuatro planes.** La profundidad
  la marca el volumen de la biblioteca, no la existencia de la investigación.
- 🛑 **Research no toca la oferta ni la estrategia.** Si lo que encuentra sugiere cambiar qué se
  vende, a qué precio o en qué paquetes, lo **levanta a Strategy como hallazgo**; no lo decide.

---

## 1 · Las capas

| Capa | Skill | Qué hace | Si falla |
|---|---|---|---|
| **—** | **`research`** | El orquestador. Verifica plan, Redes, mapa de categoría y herramientas; corre las capas en orden | Bloquea ese cliente y lo dice en el registro |
| **1** | **`rs-audiencia`** | Audience Intelligence: qué consume y qué dice la audiencia. Clasifica las oportunidades por audiencia, problema, intención de compra y proximidad al producto | Sin comentarios ni datos: `⚠️ SIN DATOS`, no se infiere |
| **2** | **`rs-competencia`** | Los competidores de Guatemala y los referentes de la categoría y de fuera de ella. Fija **a quién** se scrapea | Si el handle es ambiguo, **pregunta**; no adivina |
| **3** | **`rs-winners`** | La biblioteca de winners orgánicos y de pauta. Calcula el rendimiento **relativo** y explica por qué funcionó | Sin base del creador no hay outlier: queda `⚪ sin base` |
| **4** | **`rs-tendencias`** | Qué temas, formatos y búsquedas se mueven ahora, y si aplican al cliente | Una tendencia sin evidencia de volumen no entra |

```
   Strategy: mapa de categoría
        │
   rs-audiencia ──► qué pide, qué teme, qué compra la gente
        │
   rs-competencia ──► a quién se mira: competidores GT y referentes
        │
   rs-winners ──► qué contenido de ellos está ganando, pieza por pieza
        │
   rs-tendencias ──► qué se mueve ahora
        │
   la biblioteca viva ──► Marketing · Creatividad · Strategy · Ads · Performance
```

🔑 **Ninguna capa decide estrategia, escribe conceptos, hooks ni copy.** Research **describe,
mide y propone una hipótesis**; decidir es de Strategy, Marketing y Creatividad.

---

## 2 · Audience Intelligence

**Entender qué consume y qué dice la audiencia, a partir de lo observable.**

| Qué se mira | De dónde sale |
|---|---|
| **Comentarios, preguntas, objeciones y conversaciones públicas** | Comentarios de las cuentas del cliente, de los competidores y de los referentes; reseñas de Google Maps |
| **Creadores y comunidades relevantes** | Quién les habla hoy a esas personas y dónde se juntan |
| **Búsquedas, temas, intereses y comportamiento observable** | Google Search, hashtags, `research_keywords` |
| **Datos propios del cliente** | Ventas y CRM, **cuando él los entrega** |

🔑 **Cada oportunidad se clasifica en cuatro ejes:**

| Eje | Pregunta |
|---|---|
| **Audiencia** | ¿Quién es, y cuán grande o pequeña? |
| **Problema** | ¿Qué le duele, qué quiere, qué le frena? |
| **Intención de compra** | ¿Está mirando, comparando o listo para pedir? |
| **Proximidad al producto** | ¿Qué tan cerca está de lo que el cliente ya vende? |

🔑 **Una audiencia amplia puede hacer viral un video; una más pequeña puede producir ventas de mucho
mayor valor.** Por eso el alcance nunca es el único eje: se ordena por intención de compra y
proximidad, no solo por tamaño.

🛑 **El lenguaje literal del comprador se cita tal cual**, con su fuente. Nunca se parafrasea
como si fuera suyo. Lo que no se pudo observar va `⚠️ SIN DATOS`.

---

## 3 · La biblioteca de winners

**Un repositorio que se actualiza solo y encuentra contenido que está funcionando en las
plataformas de cada cliente — orgánico y de pauta.** Vive en
`clients/<cliente>/99-referencias/investigacion/biblioteca-winners.csv` y se muestra en el
**Creative Intelligence Engine**.

**Cada pieza lleva:**

| Bloque | Campos |
|---|---|
| **Identidad** | Enlace · plataforma · creador · fecha |
| **Rendimiento** | Métricas disponibles · crecimiento temporal · rendimiento relativo |
| **Apertura** | Transcript · hook de apertura |
| **Forma** | Formato narrativo · estructura · estilo visual · edición |
| **Mensaje** | Problema, deseo y audiencia que aborda |
| **Lectura** | Hipótesis de por qué funcionó · cómo adaptarlo al cliente |
| **Origen** | Capa *(competencia GT o referencia)* · tipo *(orgánico o pauta)* · país · fecha de lectura |

### 🛑 La regla del rendimiento relativo

> **Un video con millones de vistas no es necesariamente mejor que uno con 20,000.** El rendimiento
> se calcula **relativo al tamaño del creador, a la antigüedad de la pieza y al objetivo.**

| Tipo | Criterio de ganador | Marca |
|---|---|---|
| **Orgánico** | **2x o más** las vistas o interacciones **del promedio de esa cuenta**, comparado a una antigüedad parecida | `⏱️outlier` |
| **Pauta** | **60-90+ días corriendo**, leído de la biblioteca de anuncios | `⏱️60-90+d` |

*(Son los mismos criterios de `cr-swipe-file`, para que nadie mida con dos reglas.)*

- **Sin la base del creador no hay outlier:** la pieza queda `⚪ sin base` y no entra como ganadora.
- **La antigüedad de un anuncio se lee, nunca se pregunta a un modelo.**
- 🛑 **Los ingresos y las conversiones de un competidor normalmente no son públicos.** Nunca se
  inventan ni se estiman como dato: van `⚠️ SIN DATOS`.
- 🛑 **Una hipótesis no es un dato.** «Por qué funcionó» se marca `[hipótesis]` hasta que
  Performance compare contra lo que ganaba el cliente.

---

## 4 · De dónde recibe

| De | Qué | Para qué |
|---|---|---|
| **Strategy** | El mapa de la categoría, los competidores identificados, el plan contratado y las Redes | Saber **dónde** mirar; Research no re-mapea la categoría |
| **Performance** | Los nuevos ganadores propios del ciclo | Entran a la biblioteca como contenido del propio cliente |
| **Community Management** | Las preguntas que se repiten *(`cm-loop`)* | Alimentan Audience Intelligence |
| **El cliente** | Ventas, CRM, analytics, lo que él entregue | Datos propios; sin ellos, `⚠️ SIN DATOS` |

## 5 · A quién entrega

| A quién | Qué | Cuándo |
|---|---|---|
| **Marketing** | La ruta de Research para justificar pilares y canales: qué audiencia, qué intención, qué canal rinde | Días 1-3, y al refrescar |
| **Creatividad** | La biblioteca de winners como insumo del swipe file *(`cr-swipe-file`)* y el lenguaje literal de la audiencia | Semanal |
| **Strategy** | La ruta citable: audiencia, competidores, referentes y tendencias. Strategy **cita, no re-investiga** | Al arrancar y en la revisión del 20 |
| **Ads** | Los winners de pauta: qué anuncios llevan más días corriendo | Cuando Ads arma el plan |
| **Performance** | Lo que ganaba en el mercado, para compararlo con lo propio | Día 20 |

---

## 6 · Lo que Research NO hace

- 🚫 **Decidir estrategia, oferta, precio ni posicionamiento** → Strategy.
- 🚫 **Escribir BIG IDEA, hooks, guiones ni copy** → Creatividad. Research entrega **el hook de
  apertura de la referencia** como dato, nunca uno nuevo.
- 🚫 **Armar pilares, canales o calendario** → Marketing.
- 🚫 **Publicar, pautar ni lanzar nada** → Posting y Ads.
- 🚫 **Mapear la categoría de cero** → Strategy. Research baja a lo micro lo que Strategy ya mapeó.
- 🚫 **Copiar una pieza.** Lo que cruza la frontera es **la estructura y el ángulo**, nunca el
  creativo.
- 🚫 **Escribirle al cliente.** Research no le entrega nada directo.
- 🚫 **Inventar un dato.** Sin fuente: `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS`.

**Sin gate del CEO:** cada capa se auto-revisa y sigue. Solo bloquean Strategy y Ads.

---

## 7 · ⚙️ Las acciones — qué puede hacer el agente, y con qué

> **Un agente no puede hacer nada que su MCP no permita.** Si falta la herramienta, la capa para y lo
> dice: `BLOQUEADO — falta <herramienta>. Ver INSTALAR.md § <herramienta>`.

**Leyenda:** ✅ probado contra una cuenta real · ⬜ la herramienta existe, sin probar para esta
acción · 👤 lo hace una persona

| Acción | Tool | |
|---|---|---|
| Competidores verificados que pautan hoy | AdWhispr `find_competitors` | ✅ |
| Anuncios activos y más longevos de una marca | AdWhispr `get_brand_ads` `sortBy: longevity` | ✅ |
| Comparar marcas | AdWhispr `compare_brands` · `get_brand_stats` | ⬜ |
| **Anuncios de una marca en Meta, con días corriendo y el copy de los DCO** | Apify `apify/facebook-ads-scraper` | ✅ |
| Orgánico de Instagram con métricas y fecha | Apify `apify/instagram-scraper` | ⬜ |
| Resolver un handle antes de analizar | Apify `apify/instagram-profile-scraper` | ⬜ |
| Estudiar un referente: perfil, mediana y mejores posts | Apify `easy_scraper/instagram-profile-engagement-analytics` | ⬜ |
| Outliers de la categoría por hashtag | Apify `apify/instagram-hashtag-scraper` + cálculo propio | ⬜ |
| Posts, portadas, carruseles y estáticos | Apify `parseforge/instagram-posts-scraper` | ⬜ |
| Leer una pieza completa, con sus comentarios | Apify `apify/instagram-post-scraper` | ⬜ |
| Orgánico de TikTok | Apify `clockworks/tiktok-scraper` | ⬜ |
| YouTube · LinkedIn · Google Maps · Google Search | Apify, con `platform` o `platforms` | ⬜ |
| Demanda de búsqueda, propia y del competidor | AdWhispr `research_keywords` · `research_competitor_keywords` | ⬜ |
| Anuncios de TikTok | AdWhispr `research_tiktok_ads` | ⬜ |
| Leer cualquier web, oferta o precio | Firecrawl `firecrawl_scrape` | ✅ |
| Reseñas, prensa y menciones | `WebSearch` | ✅ |
| Ver las imágenes reales de cada pieza | Las URLs de `mediaMirror` que vienen en cada resultado | ⬜ |
| Transcribir y leer un video a fondo | `cr-lectura-de-video` *(Creatividad)* | ⬜ |
| Datos propios del cliente | Lo que él entregue por export o acceso | 👤 |
| **Refresco automático de la biblioteca (cron)** | El servidor del equipo + el MCP de Apify conectado | ⬜ |
| **Mostrar todos los clientes en una página** | Artifact **Creative Intelligence Engine** | ⬜ |
| Guardar la investigación | `Write` a `clients/<cliente>/99-referencias/investigacion/` | ✅ |

🛑 **Un MCP declarado no es un MCP conectado.** Antes de correr una capa se verifica que su
herramienta esté habilitada en la sesión. Lo que está en `⬜` se ofrece avisando que es primera
implementación; nunca se promete como probado.

### Los techos de disciplina de consulta

Son los mismos de `cr-fuentes`; Research los respeta para que ningún departamento gaste dos veces
por lo mismo.

| Regla | Límite |
|---|---|
| **Volumen por cliente por ciclo** | El del plan contratado, **por Red** *(50 / 50 / 100 / 100)*, mitad y mitad |
| **Toda corrida de Apify** | Lleva **`resultsLimit`** y **`maxTotalChargeUsd`**, sin excepción |
| **`resultsLimit`** | Se fija **por país**, nunca global |
| **Resultados por búsqueda** | Máximo **50** |
| **Anuncios por marca** | Máximo **25** |
| **Tope de gasto por cliente** | El tope de seguridad de `cr-fuentes` |
| **Una pieza ya leída** | **Nunca se vuelve a pedir:** su ficha es la caché |
| **Búsquedas infructuosas** | Máximo **3** por objetivo; después se pide un nombre, un handle o un link |
| **Orden de trabajo** | **Descubrir, después scrapear:** por keyword para ver qué cuentas lideran; por página para medirlas |

**Y tres reglas de lectura de resultados:**

- **Un error o un timeout no es un cero.** Nunca se reporta un fallo como «no hay datos».
- **Cero resultados describe esos términos y filtros**, nunca «no hay contenido de esto».
- **Si una fuente no está disponible:** `⚠️ SIN [fuente] — [qué evidencia falta y qué confianza
  pierde la lectura]`, y se sigue con el resto.

🟡 **El modo manual es legítimo y se declara:** si Apify no está disponible, una persona navega,
pega los links o suelta el archivo, y el agente lee. Se dice: `🟡 recolección manual — [n]
piezas · sin barrido a escala`.

⚠️ **El agente no puede bajar el video** de TikTok, Instagram ni Meta: esos dominios están fuera de
alcance de red del entorno. Apify entrega **la URL**, no el archivo; el archivo lo aporta una persona
o sale de Drive.

---

## 8 · Los entregables

Todos viven en `clients/<cliente>/99-referencias/investigacion/` —ahí ya viven la ingeniería
inversa y el swipe file—.

| Archivo | Qué lleva | Quién lo escribe |
|---|---|---|
| **`audiencia.md`** | Qué consume y qué dice la audiencia; oportunidades clasificadas en los cuatro ejes; lenguaje literal citado | `rs-audiencia` |
| **`competencia-y-referentes.md`** | Competidores GT y referentes, **en secciones separadas**, con su base de rendimiento | `rs-competencia` |
| **`biblioteca-winners.csv`** | Una fila por pieza, con todos los campos de §3 | `rs-winners` |
| **`tendencias.md`** | Temas, formatos y búsquedas que se mueven, y si aplican al cliente | `rs-tendencias` |
| **`registro-de-research.md`** | Una entrada por corrida: fuentes, Redes, volumen, gasto, modo, fecha y confianza | Todas las capas |

🔑 **Competencia y referencias no se mezclan.** Son dos barridos, con países distintos y para
departamentos distintos: competencia **solo Guatemala** *(para Strategy y para despegarse)*;
referencias de la **lista fija de países** *(para Creatividad y para adaptar estructura)*. La lista
de países y su orden están en `cr-fuentes`; Research la aplica sin cambiarla.

**Todo lo que se escribe en `clients/` se presenta antes** y se escribe con el OK del CEO en ese mismo
turno, como en el resto del repo.

---

## 9 · ✅ Checklist del departamento

- [ ] **El plan contratado está leído** y las **Redes** salen de `plan-contratado.md`
- [ ] Se investigaron **solo las Redes del cliente**
- [ ] El volumen por Red es el del plan *(50 / 50 / 100 / 100)*, **mitad y mitad**
- [ ] El mapa de categoría de Strategy se **citó**, no se rehízo
- [ ] Las oportunidades de audiencia están clasificadas en **los cuatro ejes**
- [ ] El lenguaje literal de la audiencia está **citado con fuente**
- [ ] **Competencia y referencias** están en secciones separadas
- [ ] Todo ganador tiene su **rendimiento relativo** (vs. la base del creador, la antigüedad y el objetivo)
- [ ] Ninguna fecha de antigüedad de un anuncio viene de un modelo
- [ ] Ningún ingreso ni conversión de un competidor aparece sin fuente: va `⚠️ SIN DATOS`
- [ ] Toda hipótesis está marcada `[hipótesis]`
- [ ] Ninguna pieza trae hook, concepto o copy **nuevos**: solo el de la referencia
- [ ] Toda corrida de Apify llevó **`resultsLimit`** y **`maxTotalChargeUsd`**
- [ ] Ningún error se reportó como cero
- [ ] Lo no probado está marcado `⬜` y el **modo** está declarado
- [ ] El registro de la corrida está completo, con **fecha**
