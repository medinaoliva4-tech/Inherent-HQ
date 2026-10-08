# Las skills de Performance — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `pipelines/contenido/06-optimize/performance/brain/WORKFLOW.md`
dice qué pasa, en qué orden y con qué reglas; acá está el detalle de cada herramienta.

> **Cómo cargan:** cada carpeta de skill se enlaza en `.claude/skills/` de la raíz del repo
> (`.claude/skills/pf-kr` → `pipelines/contenido/06-optimize/performance/brain/skills/pf-kr`).
> Es un enlace, no una copia: lo que se edita acá es lo que corre.
>
> **Cómo se invocan:** por su nombre — `/performance` es el orquestador, `/pf-kr` una de sus capas.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.** Si arranca en una subcarpeta,
> las skills no aparecen.

## El orquestador

| Skill | Qué hace |
|---|---|
| **`performance`** | La puerta de entrada. Verifica el pre-flight, decide la profundidad (semanal o del 20) y corre las capas en orden. **Si no se sabe cuál usar, es esta.** |

## Las skills, en orden

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **1** | **`pf-cuentas`** | *"¿cómo crecieron las cuentas?"*, *"¿qué formato rindió?"*, *"trial reels"* | La lectura de cada cuenta, con sus huecos |
| **2** | **`pf-kr`** | *"¿cumplimos los KR?"*, *"semáforo del mes"* | **`lectura-de-kr.md`** |
| **3** | **`pf-ajuste`** | *"¿qué cambia del roadmap?"*, *"a quién se devuelve esto"* | **`aprendizaje-del-ciclo.md`** |

## Las herramientas que se usan

| Para qué | Herramienta | Estado |
|---|---|---|
| Analítica por pieza *(alcance, vistas, guardados, compartidos, clics)* | Zernio `analytics_get_analytics` | ⬜ |
| Métricas diarias por cuenta | Zernio `analytics_get_daily_metrics` | ⬜ |
| Seguidores y su crecimiento | Zernio `accounts_get_follower_stats` | ⬜ |
| Mejores horas para publicar | Zernio `analytics_get_best_time_to_post` | ⬜ |
| KPIs de engagement de un perfil de Instagram | Apify `easy_scraper/instagram-profile-engagement-analytics` | ⬜ |
| Rendimiento de la pauta | AdWhispr `get_account_performance` | ⬜ |
| **Engagement de los trial reels** | Sin herramienta confirmada | ⬜ sin probar |

🔑 **Zernio pide el add-on de Analytics.** Sin él, `pf-cuentas` marca `⚠️ SIN DATOS` y lo dice.
Lo que no está en la lista se busca con `search_tools`. **Performance solo lee: no escribe en
Zernio ni en AdWhispr.**
