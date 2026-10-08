---
name: rs-winners
description: >
  Capa 3 de Research — la biblioteca de winners orgánicos y de pauta. Mantiene un repositorio que se
  actualiza solo y encuentra contenido que está funcionando en las plataformas de cada cliente. De
  cada pieza guarda enlace, plataforma, creador y fecha, métricas y crecimiento temporal, transcript
  y hook de apertura, formato, estructura, estilo visual y edición, el problema, deseo y audiencia
  que aborda, y una hipótesis de por qué funcionó y cómo adaptarlo. Calcula el rendimiento relativo
  al tamaño del creador, la antigüedad y el objetivo: un video con millones de vistas no es mejor que
  uno con 20,000 por serlo. Úsala cuando pidan "qué está funcionando", "actualizar la biblioteca",
  "qué anuncios llevan más días corriendo", "qué contenido está ganando", "qué winners hay de X". No
  decide qué se produce ni escribe hooks nuevos: eso es Creatividad.
---

# Capa 3 · rs-winners — la biblioteca de winners

| | |
|---|---|
| **Consume** | `competencia-y-referentes.md` *(las cuentas y su mediana)* · `audiencia.md` · las Redes y la cuota del plan · los ganadores propios que trae Performance |
| **Produce** | `biblioteca-winners.csv` — una fila por pieza, orgánica y de pauta · y la entrada del registro de la corrida |

Contexto del departamento: `pipelines/contenido/03-research/research/brain/WORKFLOW.md`.

**Qué es:** el repositorio que cada cliente tiene de lo que ya funciona en sus plataformas, con la
pieza entendida —no solo listada—. Se muestra en el **Creative Intelligence Engine**.
**Qué no es:** no es el swipe file de Creatividad *(que elige y clasifica qué se usa)*, ni el mapa de
categoría de Strategy. Esta capa **alimenta** a las dos.

## Paso 1 · Scrapear dentro de la cuota

La cuota es la del plan **por Red**: **50 / 50 / 100 / 100**, mitad competencia *(Guatemala)* y mitad
referencias.

| Plataforma | Actor | Qué trae |
|---|---|---|
| **Meta Ad Library** *(pauta)* | `apify/facebook-ads-scraper` ✅ | id, anunciante, fecha de inicio, copy —**incluido el de los DCO en `snapshot.cards[].body`**— y la URL del video |
| **Instagram** *(orgánico)* | `apify/instagram-scraper` ⬜ | Posts con métricas y fecha |
| **TikTok** *(orgánico)* | `clockworks/tiktok-scraper` ⬜ | Videos con métricas y fecha |
| **Una cuenta a fondo** | `easy_scraper/instagram-profile-engagement-analytics` ⬜ | La mediana de la cuenta |

- Se scrapea **solo las Redes del cliente** y **solo las cuentas** de `rs-competencia`.
- **La pauta se busca por página** *(`search_type=page` + `view_all_page_id`)*: la búsqueda por
  keyword devuelve la categoría; por página devuelve esa marca. Competencia con `country=GT`.
- 🛑 **Toda corrida lleva `resultsLimit` y `maxTotalChargeUsd`.** El `resultsLimit` se fija
  **por país**, no global.
- 🛑 **Una pieza ya en la biblioteca no se vuelve a pedir:** su fila es la caché. Si cambió, se
  actualizan sus métricas, no se re-lee.
- **La metadata se pide completa, en una sola llamada.**

## 🛑 Paso 2 · El rendimiento relativo

> **Un video con millones de vistas no es necesariamente mejor que uno con 20,000.** Se calcula el
> rendimiento **relativo al tamaño del creador, a la antigüedad de la pieza y al objetivo.**

| Variable | Cómo entra |
|---|---|
| **Tamaño del creador** | Se divide la métrica de la pieza entre **la mediana de esa cuenta** *(`rendimiento_relativo = métrica ÷ mediana`)*. Sin mediana: `⚪ sin base` |
| **Antigüedad** | Una pieza de tres días no se compara con una de tres meses. Se compara a **una antigüedad parecida**, o se usa el crecimiento entre lecturas |
| **Objetivo** | Alcance, interacción y conversión no se mezclan: un winner de alcance no es un winner de venta. Se anota **qué métrica se midió** |

**Criterio de ganador** *(los mismos de `cr-swipe-file`)*:

| Tipo | Entra como winner | Marca |
|---|---|---|
| **Orgánico** | **2x o más** las vistas o interacciones **del promedio de esa cuenta** | `⏱️outlier` |
| **Pauta** | **60-90+ días corriendo**, leídos de la biblioteca de anuncios | `⏱️60-90+d` |
| Pauta de 30-60 días | Señal a confirmar | `⏱️30-60d` |
| Pauta de menos de 30 días | **No entra:** todavía está en test | — |

🛑 **La antigüedad de un anuncio se lee de la biblioteca, nunca se pregunta a un modelo.**
🛑 **Sin señal de rendimiento no entra a la biblioteca.** «Me gusta» no es evidencia.
🛑 **Los ingresos o conversiones de un competidor normalmente no son públicos:** la columna dice
`⚠️ SIN DATOS`; **nunca se estiman.**

### El crecimiento temporal

La biblioteca guarda **cada lectura con su fecha**. El crecimiento de una pieza es la diferencia
entre lecturas; una pieza que **todavía crece** pesa distinto que una que se estancó.
**Con una sola lectura no hay crecimiento:** la columna dice `una sola lectura`.

## Paso 3 · Entender la pieza

Para **todas** las piezas se llenan los campos que la herramienta entrega. Para las **10-15 mejores**
del ciclo se hace lectura a fondo con `cr-lectura-de-video`; si la ficha ya existe, **se enlaza, no
se relee**.

| Bloque | Campos | Cómo se llena |
|---|---|---|
| **Identidad** | `enlace` · `plataforma` · `creador` · `fecha` | Del scraper |
| **Rendimiento** | `metricas` · `crecimiento_temporal` · `rendimiento_relativo` · `señal` | Del scraper y del cálculo de arriba |
| **Apertura** | `transcript` · `hook_de_apertura` | Del scraper o de la lectura. **Se copia el de la referencia; no se escribe uno nuevo.** Sin transcript: `⚠️ SIN DATOS` |
| **Forma** | `formato_narrativo` · `estructura` · `estilo_visual` · `edicion` | De la lectura de la pieza |
| **Mensaje** | `problema` · `deseo` · `audiencia` | Se cruza con las oportunidades de `rs-audiencia` |
| **Lectura** | `hipotesis_por_que_funciono` · `como_adaptarlo` | **Hipótesis**, marcada `[hipótesis]` |
| **Origen** | `capa` *(competencia / referencia)* · `tipo` *(orgánico / pauta)* · `pais` · `fecha_de_lectura` | Del registro |

🔑 **«Cómo adaptarlo» dice qué estructura y qué ángulo cruzan al cliente**, pasados a su audiencia y
su mercado. **No escribe el concepto, el hook ni el copy:** eso es de Creatividad. Y **nunca se
copia el creativo.**

## Paso 4 · El refresco

| Cuándo | Qué |
|---|---|
| **Semanal** | Se actualizan las métricas de lo que ya está y se suma lo nuevo, dentro de la cuota |
| **Por cron** | Cuando el servidor del equipo y el MCP de Apify estén conectados, el refresco corre solo y el **Creative Intelligence Engine** muestra los videos nuevos de todos los clientes. ⬜ |
| **Día 20** | Entran los ganadores propios del ciclo que trae Performance |

🟡 **Sin cron, el refresco se corre a mano con `/rs-winners` y se declara:**
`🟡 refresco manual`.

## 🛑 Bloqueos

- Sin la lista de cuentas de `rs-competencia`: se corre esa capa primero.
- Sin Apify habilitado: **pauta de Meta** puede salir de AdWhispr `get_brand_ads` ✅; el orgánico
  pasa a `🟡 recolección manual` o `⚠️ SIN DATOS`.
- Si el volumen llega al tope de la cuota: **se declara y se para.**
- Un error o un timeout no es un cero.

## ✅ Checklist

- [ ] Solo las Redes del plan; volumen por Red = cuota del plan, mitad y mitad
- [ ] Toda corrida de Apify con **`resultsLimit` y `maxTotalChargeUsd`**
- [ ] Cada winner trae su **rendimiento relativo** y la métrica que se midió
- [ ] Ningún outlier sin la **mediana** de su cuenta
- [ ] Orgánico y pauta con sus propios criterios, sin promediarse
- [ ] Ninguna fecha de anuncio viene de un modelo; cada fila trae su **fecha de lectura**
- [ ] El copy de los DCO se leyó de `snapshot.cards[].body`
- [ ] Ningún ingreso ni conversión sin fuente: `⚠️ SIN DATOS`
- [ ] El hook de apertura es **el de la referencia**, no uno nuevo
- [ ] Toda hipótesis marcada `[hipótesis]`
- [ ] Ninguna pieza se pidió dos veces
- [ ] El modo *(automatizado / MCP / 🟡 manual)* está declarado
- [ ] Entrada completa en `registro-de-research.md`

**Handoff →** Creatividad *(`cr-swipe-file` toma la biblioteca como insumo)* · Ads **(winners de
pauta)** · Performance **(contra qué comparar)** · Strategy **(cita)**.
