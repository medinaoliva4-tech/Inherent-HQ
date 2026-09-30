# Los agentes

**Un agente por etapa del pipeline.** Cada uno tiene la misma anatomía.

```
agents/<área>/
└── brain/
    ├── WORKFLOW.md        cómo trabaja el agente, de 0 a 100
    └── skills/
        ├── README.md      cuándo y cómo usa cada skill
        └── <skill>/
            └── SKILL.md   la lógica de esa skill

agents/_compartido/
└── skills/
    └── client-delivery/   la entrega. La usan todos, con el mismo formato
```

> **`brain/` es el agente.** Todo lo que define cómo piensa y trabaja vive ahí dentro.
> Nada de un agente vive fuera de su carpeta, salvo lo compartido.

---

## El roster — qué puede hacer cada uno

> **La acción la determina el MCP.** Un agente sin MCP es un documento, no un agente.
> **`✅` corrido · `🟡` tiene acciones pero le falta el cerebro · `⬜` sin construir.**

### ✅ Strategy — `agents/strategy/`
**Etapas 01, 02 y la revisión del 20.** Es la columna: hace ingeniería inversa desde la meta
financiera hasta la pieza.

| Qué puede hacer | Con qué |
|---|---|
| Leer cualquier web, oferta o precio | Firecrawl `firecrawl_scrape` |
| Ver qué competidores pautan hoy, verificados | AdWhispr `find_competitors` |
| Sacar los anuncios activos y más longevos de una marca | AdWhispr `get_brand_ads` |
| Encontrar outliers de contenido de la categoría | Eden `eden_search_social_content` |
| Analizar un referente a fondo | Eden `eden_analyze_creator` |
| Documentar y entregar | Notion · Google Drive |

**Sus skills:** `context` · `analysis` · `reverse-engineering` · `methodology`
**Entrega:** la estrategia, la plataforma de marca y un brief por área.

---

### 🟡 Growth — `agents/growth/` · **tiene las acciones, falta el cerebro**
**Etapa 09 — Ads.**

| Qué puede hacer | Con qué |
|---|---|
| Pautar en Meta, TikTok, Google Search y Performance Max | AdWhispr `launch_*` |
| Clonar el anuncio de TikTok de un competidor | AdWhispr `clone_tiktok_ad` |
| Optimizar presupuesto, pausar y reanudar | AdWhispr `update_budget` · `pause/resume_campaign` |
| Investigar keywords propias y del competidor | AdWhispr `research_keywords` |

---

### 🟡 Content — `agents/content/` · **tiene las acciones, falta el cerebro**
**Etapa 08 — Posting.**

| Qué puede hacer | Con qué |
|---|---|
| Programar y publicar en IG, TikTok, YouTube, LinkedIn, X, Threads | Eden `schedule_post` · `publish_post_now` |
| Leer analítica de lo publicado | Eden `eden_get_analytics` |

---

### 🟡 Branding — `agents/branding/` · **brief listo, agente no**
**Etapa 02B.** El brief de marca ya lo produce Strategy en `methodology/brand-brief.md`.

---

### ⬜ Production — `agents/production/`
**Etapa 05.** Es donde está el único techo real del modelo: **el video de grabación.**

| Qué podría hacer | Con qué |
|---|---|
| Generar video | Higgsfield `generate_video` |
| Multiplicar una grabación en variantes | Higgsfield workflow `ad-multiplier` |
| Reencuadrar para cada formato | Higgsfield `reframe` |
| Doblaje y voz sintética | Higgsfield `dubbing` · `create_voice` |

---

### ⬜ Design — `agents/design/`
**Etapa 06.**

| Qué podría hacer | Con qué |
|---|---|
| Generar imagen en lote | Higgsfield `generate_image_batch` |
| Fotos de producto sin sesión | Higgsfield Marketing Studio `product-shot` |
| Quitar fondo · escalar calidad | Higgsfield `remove_background` · `upscale_*` |

---

### ⬜ Creative — `agents/creative/`
**Etapa 04.**

| Qué podría hacer | Con qué |
|---|---|
| Estudiar los títulos y carruseles que ganan | Eden `eden_study_top_titles` · `study_top_carousels` |
| Predecir viralidad antes de publicar | Higgsfield `virality_predictor` |

---

### ⬜ Community — `agents/community/`
**Etapa 10.**

| Qué podría hacer | Con qué |
|---|---|
| Auto-DM y automatización de mensajes | Eden `create_auto_dm_automation` |
| IA propia del cliente, con su conocimiento | Eden `create_custom_ai` |

---

### ⬜ Marketing — `agents/marketing/`
**Etapa 03.** Traduce la estrategia en el plan de canales y el calendario.

---

### 🔴 QA — `agents/qa/` · **el primero a construir**
**Etapa 07.** Revisa cada pieza antes de que salga.

**Por qué bloquea todo:** a **204 piezas al mes** el QA humano es cerca de un minuto por pieza.
**Sin él, el volumen prometido no es entregable y el margen no cierra.**
⚠️ **Todavía no tiene MCP definido — y sin acción no hay agente.**

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿el agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |

---

## Cómo se crea uno nuevo

1. **Carpeta:** `agents/<área>/brain/skills/`
2. **`brain/WORKFLOW.md`** — el proceso de 0 a 100, con los gates humanos marcados y una sección
   de **lo que este agente NO hace**.
3. **`brain/skills/README.md`** — cuándo se invoca cada skill dentro del workflow.
4. **Una carpeta por skill**, con su `SKILL.md`.
5. **Enlazarla** en `.claude/skills/` para que se pueda invocar por nombre.
6. **Cerrar con `client-delivery`** — todos entregan con el mismo formato.
