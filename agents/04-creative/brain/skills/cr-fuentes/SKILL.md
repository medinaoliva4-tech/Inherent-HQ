---
name: cr-fuentes
description: >
  Capa 1 de ④ Creatividad — la skill que CONSIGUE los anuncios. Decide de dónde salen las
  referencias: la investigación se hace **en 5 niveles** y **por plataforma**, en las que usa el cliente según las
  Redes de su plan contratado, con tres actores de Apify —anuncios, Instagram y TikTok— y volumen fijado
  por el plan contratado. Define qué da y qué no da cada fuente, los topes de gasto, en qué países
  se busca —salen del mercado de cada cliente—, y cuáles pasan a lectura profunda; extrae
  id, anunciante, copy, plataformas y fecha de inicio, y calcula la antigüedad. Úsala cuando pidan
  "buscá los anuncios de esta marca", "qué está corriendo la competencia", "de dónde saco
  referencias", "cuántos contenidos investigamos", "de qué países sacamos referencias", "qué
  plataformas investigamos". No lee la imagen (eso es cr-lectura-de-video) ni decide qué entra a la
  bóveda (eso es cr-swipe-file).
---

# Capa 1 · Fuentes — conseguir los anuncios

| | |
|---|---|
| **Consume** | **El bloque 6 «Qué buscar» del brief de comunicación** (`brief-de-comunicacion-AAAA-MM.md`, ① Strategy) · el mercado del cliente *(`clients/<cliente>/00-onboarding/comprension.md` e `inherent/04-MERCADO.md`)* · El hueco calculado en `cr-swipe-file` (qué formato, canal o tipo de hook falta) · los competidores del cliente de ① Strategy · los canales con slot del calendario de ③ Marketing |
| **Produce** | El listado crudo de anuncios: **id de biblioteca · anunciante · copy · plataformas · fecha de inicio · antigüedad calculada · link · URL del creativo**, ordenado por antigüedad · **los 5 niveles con 5 cuentas cada uno** *(25 por cliente)*, subidos a Research del OS · y el registro de fuentes usadas, no disponibles y consumo |

Contexto del departamento: `agents/04-creative/brain/WORKFLOW.md`.

**Consigue. No lee y no juzga.** Leer el video a fondo es `cr-lectura-de-video`; decidir qué entra a
la bóveda, con qué señal y en qué cubeta, es `cr-swipe-file`. Esta skill solo responde *"¿de dónde
salen los anuncios y cuántos días llevan corriendo?"*.

## 🛑 La regla dura: la antigüedad se lee, nunca se pregunta

> 🛑 **Ninguna fecha de antigüedad entra al swipe file si no fue leída directamente de la Ad
> Library** — de la página, o de un MCP que la lea. **NUNCA de un modelo.**

**Por qué.** Se le pidió a un modelo que listara anuncios activos: devolvió 5, con id y fecha.
Verificados uno por uno, **las marcas existían pero las fechas, los estados y las creatividades
estaban inventados**. Un modelo sin acceso a los datos no dice *"no sé"*: rellena.

❌ *"Estos 5 ads están activos desde junio"* (salida de un modelo)
✅ `id 1050002464327310 · 9-sep-2026 · Inactivo` (leído en la página, verificado uno por uno)

## Las 4 necesidades reales del departamento

Lo que se elige se elige contra esto, **no contra el precio ni contra lo que ya está conectado**.

| # | Necesidad | Por qué el método la exige | Sin esto… |
|---|---|---|---|
| **1** | **Longevidad de creativos de pauta** | *Longevidad, no gusto*: un ad con 90 días corriendo es un creativo validado con dinero | El swipe file entra por gusto y el `70·probado` es una mentira |
| **2** | **Outliers orgánicos con su base** | Un post con muchas vistas de una cuenta grande puede ser **el peor** de esa cuenta | No se distingue un outlier de un número absoluto |
| **3** | **El creativo en sí, no solo su texto** | La Capa 5 pide ambientación, luz, encuadre, paleta — y eso necesita el archivo o la transcripción | Se lee el mensaje y se queda ciego sobre la imagen |
| **4** | **Lenguaje literal del comprador** | El copy se escribe con sus palabras, no con las nuestras | El copy suena a marca hablándole a nadie |

Notion, Drive y Calendar son **logística**, no research. Útiles, pero no definen si el departamento
funciona.

## Qué da y qué no da cada fuente

| Fuente | Qué da | Qué **no** da |
|---|---|---|
| **Meta Ad Library (web)** | Los ads activos de cualquier página, con **fecha de inicio**, copy, plataformas, id de biblioteca y la **URL del creativo en el DOM** | Una columna de días corriendo. Sin exportación. Hay que abrir cada ad y hacer la resta — o extraer y ordenar nosotros |
| **API oficial de Ad Library** | Consulta programática | 🔴 **No sirve:** solo ads políticos y de temas sociales (los comerciales, solo para audiencias UE/UK por el DSA), **devuelve solo texto** —ni imagen ni video—, verificación con documento, token a ~60 días, ~200 llamadas/hora |
| **TikTok Creative Center** | Top Ads público y navegable: tendencias de **formato** | 🟡 **Sin API oficial.** Y es la **curaduría de TikTok**, no los competidores del cliente: no responde *"qué está haciendo esta marca"* |
| **Apify** *(MCP · la fuente oficial)* — tres actores, uno por plataforma | Anuncios con id, anunciante, fecha de inicio, copy —**incluido el de los DCO**— y la URL del video · orgánico de IG y TikTok con sus métricas. Filtrable por país | **Cobra por contenido.** Sin `resultsLimit` y `maxTotalChargeUsd` un run mal filtrado se dispara. El orgánico se ve **deslogueado**: sirve para comparar entre piezas, no como número absoluto |
| **MCPs de ad intelligence** *(si están habilitados)* | Ads ordenables **por antigüedad**, competidores verificados, búsqueda por ángulo | 🛑 Instalado **no es** habilitado: un MCP sin habilitar en la sesión no tiene sus tools cargadas |

> **Dato verificado:** la Ad Library **solo ordena por "impresiones" o "más recientes"**. **No tiene
> orden por antigüedad.** Por eso hay que **extraer y ordenar nosotros**: es el paso que ninguna
> fuente gratis hace sola, y es exactamente la señal que el método necesita.

> **No se paga por los datos —son públicos—: se paga por el índice.** Tenerlos ordenados por
> longevidad, filtrables por formato, con transcripción, y alcanzables en una sola llamada.

### Corrección registrada · Muse Spark

**Existe y es oficial de Meta.** Muse Spark es el primer modelo de la familia Muse, de Meta
Superintelligence Labs (8-abr-2026; Muse Spark 1.3, 2-sep-2026). Acepta video, imagen y texto de
entrada y devuelve texto. *(Una versión anterior de la documentación del departamento afirmaba que
«Meta Spark» solo se refería a **Spark AR Studio** —la plataforma de efectos de AR que Meta
discontinuó en enero de 2025— y que no existía nada más con ese nombre. **Era incorrecto.**)*

**Y no sirve como fuente de anuncios, por un motivo estructural:**

| Lo que es | Lo que Creative necesita |
|---|---|
| Un **modelo generalista** dentro de las apps de Meta | Un **índice de anuncios** con días corriendo |
| Sin acceso a datos de publicidad, Ad Library ni research de competidores | Exactamente eso |
| Sin API pública ni acceso al modelo | Algo cableable |

🛑 **Un modelo no es una base de datos.** Puede *razonar* sobre un video que se le muestre, y sirve
para transcribir audio o como segunda lectura de ambientación. Lo que **no** puede es decir qué
anuncios corre un competidor y desde cuándo: eso es un índice, y los índices los tiene quien los
construyó.

## La fuente oficial — Apify, un actor por plataforma

**Apify es la fuente oficial del departamento.** Está conectada por MCP y probada contra la Ad
Library real: el run queda registrado en la organización Inherent y las fechas que devuelve
coinciden con las que muestra la página.

🛑 **Sustituye al barrido propio con navegador.** No hay servidor, no hay cron y no hay Chromium
headless: el histórico de esa decisión quedó en `BARRIDO-NOCTURNO.md`, marcado como reemplazado.

### 🛑 La investigación se hace por plataforma

**Las plataformas son las del cliente** — las **Redes** de
`clients/<cliente>/00-onboarding/plan-contratado.md` *(si existe `plan-por-canal.md` de ③ Marketing,
también sirve)*. No se investiga una plataforma donde el cliente no publica, por interesante que sea
lo que haya ahí.

| Plataforma | Actor | **$/1,000** |
|---|---|---|
| **Meta Ad Library** *(anuncios)* | `apify/facebook-ads-scraper` | **$5.80** |
| **Instagram** *(orgánico)* | `apify/instagram-scraper` | **$2.70** |
| **TikTok** *(orgánico)* | `clockworks/tiktok-scraper` | **$3.70** |

🛑 **Toda corrida lleva `resultsLimit` y `maxTotalChargeUsd`.** Sin excepción, en los tres actores.

### Cuántos contenidos por ciclo

**Por plataforma, y según el plan contratado:**

| | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contenidos a investigar, por plataforma** | **50** | **50** | **100** | **100** |

**Se reparte en partes iguales entre los 5 niveles** *(ver abajo)*: con 50 por plataforma son
**10 por nivel**; con 100, **20 por nivel**. En un cliente de 🔷 Marketing con tres plataformas son
150 contenidos: 10 por nivel en cada plataforma.

### Los 3 aprendizajes de la prueba

| # | Qué se aprendió | Por qué importa |
|---|---|---|
| **1** | **El copy de los DCO está en `snapshot.cards[].body`** — no en el cuerpo del anuncio | Un anuncio con creativo dinámico se lee **vacío** si solo se mira el campo de arriba. El lenguaje literal del comprador está en las cards |
| **2** | **El video se detecta con `cards[].videoSdUrl`** | Separa video de estático sin abrir el anuncio, y es la URL que `cr-lectura-de-video` necesita |
| **3** | **Se busca por página:** `search_type=page` + `view_all_page_id=…` | La búsqueda por keyword devuelve **la categoría**; la búsqueda por página devuelve **esa marca**. Para competencia hace falta la segunda |

*(Los tres son del actor de anuncios. Para IG y TikTok el criterio de corte es otro — ver «ganador» abajo.)*

### El orden de trabajo — descubrir, después scrapear

```
① DESCUBRIR   búsqueda por keyword  →  qué páginas lideran la categoría
② SCRAPEAR    search_type=page & view_all_page_id=…  →  los ads de cada página
```

🛑 **No al revés.** Scrapear por keyword y quedarse ahí mezcla marcas y no deja medir a nadie.

## 🛑 Los 5 niveles de investigación

> **Decisión del CEO.** La investigación tiene cinco niveles, **5 cuentas por nivel: 25 por
> cliente.** Lo que se busca en cada uno lo dicta el bloque 6 del brief de comunicación. **Los
> niveles no se mezclan en una misma lista.**

| # | Nivel | Qué es | Para qué sirve | Quién lo usa |
|---|---|---|---|---|
| **1** | **Competencia local** | Quienes le venden a la misma gente, **en el mercado del cliente** | Saber de qué despegarse: el código saturado de la categoría | ① Strategy |
| **2** | **Referente en mercados parecidos** | Quien ya gana en la misma categoría, **en mercados con poder adquisitivo y cultura comparables** a los del cliente | Estructura y ángulo que ya funcionan en un público como el nuestro | ④ Creatividad |
| **3** | **Referente aspiracional** | El mejor del mundo en la categoría, **en el mercado al que el cliente quiere llegar** | Elevar el estándar: lo que haremos cuando crezcamos | ④ Creatividad · ②B Branding |
| **4** | **Referente de crecimiento y engagement** | Cuentas que **crecen o enganchan más rápido que su categoría**, sean o no de la misma | Mecánicas de crecimiento: formatos, frecuencia, hooks que retienen | ④ Creatividad · ⑨ Posting |
| **5** | **Lo propio** | Las propias cuentas del cliente | Lo que ya le funciona a él, contra su propia mediana | ① Strategy · ④ Creatividad |

### 🛑 Los países salen del mercado de cada cliente

**No hay lista fija.** Se deciden por cliente, leyendo **dónde vende** *(`comprension.md`)* y en qué
fase está su mercado *(`inherent/04-MERCADO.md` → «La secuencia»)*.

| Nivel | Cómo se eligen los países |
|---|---|
| **1 · Competencia local** | **El mercado donde el cliente vende hoy** *(el código de país de ese mercado)*. Se barre **por página de cada competidor** |
| **2 · Mercados parecidos** | **De 2 a 4 países** parecidos al del cliente en **poder adquisitivo, cultura, idioma y madurez del canal**. Un cliente de ticket bajo no toma referencias de un mercado de ticket alto: la pieza se ve bien y no vende |
| **3 · Aspiracional** | **El mercado objetivo del cliente** *(el siguiente de su secuencia)* o, si la mejor práctica de la categoría vive en otro, ese |
| **4 · Crecimiento** | **Sin país fijo**; se prefiere el idioma del cliente y se declara el país de cada cuenta |
| **5 · Lo propio** | No aplica país: son sus cuentas |

**Los países elegidos y el motivo se escriben en el registro.** Si el cliente abre un mercado nuevo,
los niveles 2 y 3 se rehacen para ese mercado.

🛑 **Cada nivel va en su sección o archivo.** Competencia *(nivel 1)* alimenta a ① Strategy;
los niveles 2 a 5 alimentan a ④ Creatividad. **Nunca en la misma lista.**

### Cuántas cuentas y cuántos contenidos

**5 cuentas por nivel.** De cada cuenta se leen sus contenidos hasta completar el cupo del nivel
(10 o 20 por plataforma, según el plan). Una cuenta que no publica en una plataforma del cliente
se sustituye por otra del mismo nivel.

### 🔄 Se refresca cada mes

- **Completa al arrancar al cliente**, y **cada mes en los días 1-3 del ciclo**, antes de que
  ④ Creatividad arme las ideas.
- En el refresco se **conservan las cuentas que siguen vigentes**, se **reemplazan las que
  dejaron de rendir** y se **lee de nuevo solo lo reciente**. Lo ya leído no se vuelve a pedir:
  su ficha es la caché.

### Qué es «ganador» — cambia según sea pauta u orgánico

| Tipo | Criterio | Por qué |
|---|---|---|
| **Anuncio** *(Meta Ad Library)* | **60-90+ días corriendo** | Las marcas matan rápido a los perdedores: un ad viejo es un ad que paga |
| **Orgánico** *(Instagram · TikTok)* | **2x o más** las vistas o interacciones **del promedio de esa cuenta** *(se guarda como `multiplicador`)* | Un número absoluto no dice nada. 2x contra su propia base sí |

🛑 **Son los mismos criterios de `cr-swipe-file`**, para que nadie mida con dos reglas.

### 🛑 Se scrapean todos, se leen a fondo 10-15

```
TODOS            →  se scrapean y se filtran por señal de ganador
LOS 10-15 MEJORES →  pasan a cr-lectura-de-video (lectura profunda)
EL RESTO          →  queda en el listado, con su señal, sin leer a fondo
```

**Por qué.** Scrapear es barato; leer a fondo cuesta tiempo de agente y de persona. El valor está
en diseccionar las mejores, no en pasar 150 piezas por el mismo molde.

🛑 **Se adapta, nunca se copia el creativo.** Lo que cruza la frontera es **la estructura y el
ángulo**, pasados a quetzales y a la cultura local. Copiar la pieza nos mete en el código visual de
otro — lo contrario de lo que ②B Branding construyó.

## 📤 El resultado se sube a Research del OS

**Cada contenido que pasa el filtro de ganador se guarda con `guardar_research`** *(conector de
Inherent OS)*, en el perfil del cliente. **Primero `perfiles()` para confirmar el perfil**, y
**`listar_research` para no duplicar** *(si el `url` ya está, se actualiza)*.

| Nivel | `tipo` |
|---|---|
| 1 · Competencia local | `competencia` |
| 2 · Mercados parecidos | `referente-similar` |
| 3 · Aspiracional | `referente-aspiracional` |
| 4 · Crecimiento y engagement | `referente-crecimiento` |
| 5 · Lo propio | `propia` |

| Campo | Qué lleva |
|---|---|
| `creador`, `red`, `formato`, `url`, `fecha` | De la fuente |
| `metricas` | Vistas, likes, comentarios y **`multiplicador`** *(veces su mediana)* |
| `tags` | **`nivel-1`…`nivel-5`**, el **país**, el pilar, la etapa del embudo *(si se usa)* y «resonancia alta\|media\|baja» |
| `por_que_funciono` | Solo en los 10-15 que pasaron a lectura profunda |

🛑 **Se suben los ganadores, no todo lo scrapeado.** El resto queda en el registro de la corrida.

## 🟡 El modo manual es legítimo y se declara

Cuando Apify no está disponible, o cuando hace falta TikTok, un humano navega la Ad Library o el
Creative Center, pega los links o suelta el archivo de video, y el agente lo lee con
`cr-lectura-de-video`. **El departamento funciona.** Lo que se pierde es el barrido a escala, el
orden por antigüedad y el copy de los DCO — o sea, el trabajo pasa de la herramienta a una persona.
Cuando se corre así, el entregable lo dice:
`🟡 recolección manual — [n] anuncios · sin barrido a escala`.

⚠️ **El agente no puede bajar el video** de TikTok, Instagram ni Meta: esos dominios están fuera de
alcance de red del entorno. Apify entrega **la URL** (`cards[].videoSdUrl`), no el archivo. Cuando
hace falta leer la **imagen** y no solo el mensaje, el archivo lo aporta un humano o sale de Drive.

## 🛑 Techos de disciplina de consulta

El riesgo no es el volumen: es la indisciplina. Ocho marcas × tres búsquedas × 500 resultados es un
barrido sin control.

| Regla | Límite |
|---|---|
| Resultados por búsqueda | **máximo 50.** Se ordena por antigüedad y se lee la primera página |
| Ads por marca en el barrido de competidores | **máximo 25** |
| Volumen por cliente por ciclo | **El del plan contratado, por plataforma** *(50 / 50 / 100 / 100)*. Si se pasa, **se declara y se para** |
| Tope de gasto por cliente | **US$5 al mes.** No es el presupuesto esperado —el real es menos de US$1,30— sino **el límite de seguridad**: si se acerca, algo se está pidiendo mal |
| Paginar más allá de la primera página | Solo si la primera trajo señal y falta cubrir el hueco |
| Volver a pedir un ad ya leído | 🛑 **Nunca.** Está en su ficha de referencia — la ficha es la caché |
| Metadata | **Completa, en una sola llamada.** Nunca en dos pasadas: se paga dos veces por lo mismo |
| Búsquedas infructuosas | **máximo 3 por objetivo.** Después se pide al usuario un nombre, un handle o un link |
| `resultsLimit` | **Se fija por país, nunca global.** Un límite global se gasta entero en el primer país de la lista y los demás vuelven vacíos |
| `maxTotalChargeUsd` | **Siempre puesto, en los tres actores.** Es el freno duro: sin él un run mal filtrado se come el tope del cliente antes de que nadie lo vea |
| Lectura profunda | **10-15 contenidos por ciclo.** El resto queda listado con su señal |

**Y tres reglas de lectura de resultados:**

- **Un error o un timeout no es un cero.** Nunca se reporta un fallo como *"no hay datos"*.
- **Cero resultados describe esos términos y filtros**, nunca *"no hay contenido de esto"*.
- **Si una fuente no está disponible:** `⚠️ SIN [fuente] — [qué evidencia falta y qué confianza
  pierde el concepto]`, y se sigue con el resto. 🛑 **Nunca se rellena el hueco con inferencia
  presentada como dato.**

## Registro obligatorio

Todo relevamiento cierra con:

```
- Fuentes usadas: [lista] · no disponibles: [lista] → evidencia faltante: [qué]
- Plataformas investigadas: [lista, de las Redes del `plan-contratado.md`] · plan del cliente: [plan]
- Países por nivel: nivel 1 [país] · nivel 2 [países] · nivel 3 [país] · nivel 4 [países] · motivo: [mercado del cliente]
- Contenidos por plataforma: [n] de [50 / 100] · por nivel: [n·n·n·n·n] · cuentas por nivel: [5·5·5·5·5]
- Subidos a Research (`guardar_research`): [n] · duplicados evitados: [n]
- Pasaron a lectura profunda: [n] de 10-15
- Gasto de la corrida: US$[n] · tope de seguridad: US$5/mes
- Modo: automatizado / MCP / 🟡 manual
- Fecha del relevamiento: [fecha]   ← la antigüedad se mide a esta fecha
- Confianza: 🟢 alta / 🟡 parcial / 🔴 insuficiente para dirigir
```

**Por qué importa:** la longevidad de un ad se mide **al momento de la consulta**. Un relevamiento
sin fecha es un relevamiento muerto. Refresco **mensual**, en los días 1-3 del ciclo.

## QA — Capa 1

Lo que le toca a las fuentes. El bloque completo de la capa lo cierra `cr-swipe-file`.

- [ ] 🛑 **Ninguna fecha de antigüedad viene de un modelo** — todas leídas de la Ad Library (página o MCP que la lea), con **fecha de lectura** registrada
- [ ] El **hueco** está calculado antes de salir a buscar, y **solo se cosechó el hueco**
- [ ] Cada anuncio trae **id de biblioteca, anunciante, fecha de inicio y antigüedad calculada**
- [ ] El listado está **ordenado por antigüedad**, no por impresiones ni por engagement
- [ ] Para orgánico: **la base del creador se midió** antes de declarar un outlier
- [ ] Ninguna referencia se pidió dos veces — se buscó su ficha antes de volver a consultar
- [ ] Se investigaron **solo las plataformas del cliente**, según las **Redes** del `plan-contratado.md` *(o `plan-por-canal.md` de ③ Marketing, si existe)*
- [ ] El **volumen por plataforma** es el del plan contratado *(50 / 50 / 100 / 100)*, **repartido en partes iguales entre los 5 niveles**
- [ ] Hay **5 cuentas por nivel** *(25 por cliente)* y la búsqueda siguió el **bloque 6 del brief de comunicación**
- [ ] Los **techos** se respetaron: 50 por búsqueda · 25 por marca · US$5/mes de tope de seguridad
- [ ] Toda corrida de Apify llevó **`resultsLimit`** y **`maxTotalChargeUsd`** — en los tres actores
- [ ] Los anuncios se filtraron por **60-90+ días**; el orgánico por **2x el promedio de su cuenta**
- [ ] Solo **10-15 contenidos** pasaron a lectura profunda; el resto quedó listado con su señal
- [ ] El copy se leyó de **`snapshot.cards[].body`**, no solo del cuerpo del anuncio
- [ ] La competencia local se barrió **con el país del mercado del cliente** y **por página** (`search_type=page`)
- [ ] Los **países de los niveles 2 y 3 salieron del mercado del cliente** y quedaron escritos con su motivo — no de una lista fija
- [ ] **Cada nivel quedó en su sección o archivo**; la competencia no se mezcló con las referencias
- [ ] Los ganadores se subieron a Research con **`guardar_research`**, con el `tipo` de su nivel, tras `listar_research`
- [ ] La investigación se **refrescó este mes** (días 1-3 del ciclo)
- [ ] La metadata se pidió **completa en una sola llamada**
- [ ] Máximo **3 búsquedas infructuosas** por objetivo; después se pidió un nombre, handle o link
- [ ] Ningún error ni timeout se reportó como cero; ningún cero se describió como *"no existe"*
- [ ] Las fuentes no disponibles están declaradas con **qué evidencia falta**
- [ ] Lo que no se pudo bajar está declarado: `⚠️ SIN ARCHIVO`
- [ ] El **modo** está declarado (automatizado / MCP / 🟡 manual) y el **registro** está completo

**Handoff →** `cr-lectura-de-video` (leer lo que llegó) y `cr-swipe-file` (filtrar por señal,
diseccionar y clasificar en 70/20/10).
