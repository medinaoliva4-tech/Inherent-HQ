# Strategy · ✅ construido

**Etapas 01 · 02 · y la revisión del 20.** Es la columna del pipeline.

## Propósito
**Ingeniería inversa desde la meta financiera hasta la pieza.** Incluye mejorar la oferta y el
posicionamiento. Decide qué se activa de las seis capacidades y con qué profundidad, según el
alcance contratado (la ficha de oferta).

## Acciones — lo que puede hacer

| Acción | MCP | |
|---|---|---|
| Leer cualquier web, oferta o precio | Firecrawl `firecrawl_scrape` | ✅ |
| Ver qué competidores pautan hoy, verificados | AdWhispr `find_competitors` | ✅ |
| Sacar los anuncios activos y más longevos de una marca | AdWhispr `get_brand_ads` | ✅ |
| Encontrar outliers de contenido de la categoría | Apify `apify/instagram-scraper` · `clockworks/tiktok-scraper` | 🟡 |
| Analizar un referente a fondo | Apify `easy_scraper/instagram-profile-engagement-analytics` | 🟡 |
| Títulos y carruseles que ganan | Apify `parseforge/instagram-posts-scraper` *(44 campos)* | 🟡 |
| **Scrapear IG, TikTok, YouTube y LinkedIn** | Apify `instagram-scraper` · `tiktok-scraper` · `youtube-scraper` · `linkedin-post-search` | 🟡 |
| **Biblioteca de anuncios de Facebook** | Apify `facebook-ads-library-scraper` | 🟡 |
| **Competencia local y reseñas** | Apify `crawler-google-places` | 🟡 |
| **Qué busca la gente en Google** | Apify `google-search-scraper` | 🟡 |
| Documentar y entregar | Notion · Google Drive | ✅ |

## Lógica — sus skills

`context` → `analysis` → `reverse-engineering` → `methodology` → `brief-de-comunicacion`

**El proceso completo está en `brain/WORKFLOW.md`. Es la única fuente de cómo trabaja** —
incluida la entrega, que no es una skill: está en su §7.

## Entrega
La estrategia, la plataforma de marca y **un brief por área**: Branding, Marketing, Creative,
Growth, Tecnología y Sistemas. **Y cada ciclo, el brief de comunicación** *(una página: qué se
vende, a quién, qué queremos que haga y sienta, cómo se comunica y qué inspiración buscar)* —
③ Marketing no planea sin él.

## Qué entrega según el nivel

> **El alcance contratado (la ficha de oferta del cliente) es el techo.** Nunca se promete arriba
> de la ficha — ver `inherent/06-ECONOMIA.md`.

| | **BRAND FOUNDATION** | **BRAND GROWTH** | **GROWTH PARTNERSHIP** |
|---|---|---|---|
| **Qué es** | Proyecto con inicio y cierre: **la estrategia ES el proyecto** | Colaboración mensual | Colaboración integrada |
| **Qué hace Strategy** | Diagnóstico · audiencia prioritaria · posicionamiento · estructura de oferta · plan a 90 días | Posicionamiento y mensaje; revisión mensual de resultados y prioridades | Todo lo de Growth + diagnóstico del recorrido y priorización conjunta de problemas de crecimiento |
| **② Growth** | ⬜ No corre como departamento *(la oferta se trabaja dentro del proyecto)* | **Ligero:** elige cuáles de las ofertas que ya existen se empujan | **Profundidad completa:** oferta, canales grandes, upsells, conversión |
| **Briefs que entrega** | Branding · Creative *(dirección creativa y aplicaciones)* · lista priorizada de próximos trabajos | Branding · Marketing · Creative · Growth *(ligero)* · Producción según la ficha | Growth completo · Tecnología · Sistemas según la ficha |
| **Revisión del 20** | n/a *(el proyecto cierra con su entrega)* | ✅ | ✅ |

🔑 **En Brand Growth, Strategy entrega posicionamiento y mensaje — no rediseña la oferta.**
Qué vende, en qué paquetes y a qué precio se trabaja **dentro de Brand Foundation** *(el proyecto
donde se construye)* **y en la profundidad completa de Growth Partnership.**
🔑 **No todos los clientes compran todas las áreas:** la ficha de oferta dice cuáles corren.

---

## Lo que falta
Nunca se ha corrido de punta a punta con un cliente real.
