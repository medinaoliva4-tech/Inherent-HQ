# Las skills de Research — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `pipelines/contenido/03-research/research/brain/WORKFLOW.md`
dice qué pasa, en qué orden y con qué reglas; acá está el detalle de cada herramienta.

> **Cómo cargan:** cada carpeta de skill se **enlaza** en `.claude/skills/` de la raíz del repo
> (`.claude/skills/rs-winners` → `pipelines/contenido/03-research/research/brain/skills/rs-winners`).
> Es un enlace, no una copia: lo que se edita acá es lo que corre.
>
> **Cómo se invocan:** por su nombre — `/research` es el orquestador, `/rs-winners` una de sus capas.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.** Si arranca en una subcarpeta,
> las skills no aparecen.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`research`** | La puerta de entrada. Verifica plan, Redes y herramientas, y corre las capas en orden. **Ante la duda, es esta.** |

## Las skills, en orden

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **1** | **`rs-audiencia`** | *«qué dice la audiencia»*, *«qué objeciones hay»*, *«a quién le hablamos»* | `audiencia.md` |
| **2** | **`rs-competencia`** | *«quiénes son los competidores»*, *«a quién miramos»*, *«qué referentes hay»* | `competencia-y-referentes.md` |
| **3** | **`rs-winners`** | *«qué está funcionando»*, *«actualizar la biblioteca»*, *«qué anuncios llevan más días»* | `biblioteca-winners.csv` |
| **4** | **`rs-tendencias`** | *«qué se está moviendo»*, *«qué tendencias aplican»* | `tendencias.md` |

## Qué herramientas usa cada una

| Skill | Herramientas |
|---|---|
| `rs-audiencia` | Apify *(comentarios, Google Maps, Google Search)* · `research_keywords` · `WebSearch` · `Read` de los datos del cliente |
| `rs-competencia` | AdWhispr `find_competitors` · `get_brand_ads` · Apify *(perfiles)* · `firecrawl_scrape` |
| `rs-winners` | Apify `apify/facebook-ads-scraper` · `apify/instagram-scraper` · `clockworks/tiktok-scraper` · `easy_scraper/instagram-profile-engagement-analytics` |
| `rs-tendencias` | Apify *(hashtags, Google Search)* · `research_keywords` · `research_tiktok_ads` · `WebSearch` |

## Reglas que valen para todas

- **Describen, miden y proponen hipótesis.** No deciden estrategia ni escriben conceptos, hooks o copy.
- **Rendimiento relativo, nunca absoluto.** Sin la base del creador no hay outlier.
- **Sin fuente: `⚠️ SIN DATOS`.** Un error o un timeout no es un cero.
- **Toda corrida de Apify lleva `resultsLimit` y `maxTotalChargeUsd`.**
- **Todas escriben en** `clients/<cliente>/99-referencias/investigacion/` y se presentan antes.
