# Los agentes

**Un agente por etapa del pipeline.** Cada uno tiene la misma anatomía.

```
agents/<área>/
└── brain/
    ├── WORKFLOW.md        cómo trabaja el agente, de 0 a 100
    ├── skills/
    │   ├── README.md      cuándo y cómo usa cada skill
    │   └── <skill>/
    │       └── SKILL.md   la lógica de esa skill
    └── …                  referencia propia: METHOD · playbooks · templates · qa · toolkit
```

> **`brain/` es el agente.** Todo lo que define cómo piensa y trabaja vive ahí dentro.
> Nada de un agente vive fuera de su carpeta.

**Los clientes viven en `clients/`, no dentro del agente.** Todos leen y escriben ahí.

🛑 **No hay skill de entrega compartida.** **Cada agente entrega distinto**, y su entrega está
definida en **`brain/WORKFLOW.md` §7**.

---

## Las 9 secciones de un WORKFLOW.md

Todos los agentes responden lo mismo, en el mismo orden:

| § | Qué responde |
|---|---|
| **1 · Propósito** | Su área y su meta |
| **2 · El flujo** | Los bloques, que son también sus skills |
| **3 · El plan contratado** | **Hasta dónde llega según Ignite / Accelerate / Compound** |
| **4 · Cadencia** | Cuándo se corre |
| **5 · Acciones** | Qué puede hacer y con qué MCP — **y qué hueco tiene** |
| **6 · Fuentes** | De dónde saca la información |
| **7 · Entregables** | Qué entrega, dónde y para quién |
| **8 · Correlación** | Dónde entra en el pipeline y qué le pasa a quién |
| **9 · Lo que no hace** | Y de quién es |

---

## 🎚️ El plan contratado — la regla nueva

> **Todo agente pregunta el plan antes de producir nada.** Define la profundidad, no la existencia.
> Fuente: `inherent/03-OFERTA.md` y `inherent/06-ECONOMIA.md`.

```
🟦 IGNITE  mapea        🟪 ACCELERATE  ejecuta        🟨 COMPOUND  sistematiza
```

**El techo duro de volumen, igual para todos:**

| | Ignite | Accelerate | Compound |
|---|---|---|---|
| Reels de grabación | 6 | 10 | 14 |
| Piezas derivadas | 10 | 20 | 30 |
| Estáticos y carruseles | 40 | 70 | 100 |
| Stories | 30 | 45 | 60 |
| **TOTAL piezas/mes** | **86** | **145** | **204** |
| Horas de producción | 2h · 1 sesión | 5h · 2 | 8h · 3 |
| Revisiones por pieza | 2 | 2 | 3 |

🛑 **El plan nunca se infiere.** Sin declarar: `❓ PENDIENTE — plan contratado`.

---

## El roster — qué puede hacer cada uno

> **La acción la determina el MCP.** Un agente sin MCP es un documento, no un agente.
> **`✅` construido y con acciones · `🟡` construido, con huecos de MCP · `⬜` sin construir**

| Etapa | Agente | Carpeta | Skills | Entrega | Estado |
|---|---|---|---|---|---|
| **01 · 02 · ↻20** | **Strategy** | `agents/strategy/` | 4 | `ESTRATEGIA.md` + los briefs por área | ✅ |
| **02B** | **Branding** | `agents/branding/` | 6 + orq. | `MARCA.md` — la guía aplicable | ✅ |
| **03** | **Marketing** | `agents/marketing/` | 7 + orq. | `MARKETING.md` — campañas y frecuencia | ✅ |
| **04** | **Creatividad** | `agents/creative/` | 8 + orq. | `ideas-de-contenido.csv` — 31 columnas | ✅ |
| **05** | **Producción** | `agents/production/` | 8 + orq. | `plan-de-produccion.csv` + material | 🟡 |
| **06A** | **Diseño** | `agents/design/` | 7 + orq. | Piezas estáticas y exports | 🟡 |
| **06B** | **Video** | `agents/video/` | 12 + orq. | Masters por plataforma | 🟡 |
| **07** | **QA** | — | — | Piezas aprobadas + excepciones | 🔴 **el primero a construir** |
| **08** | **Posting** | — | — | Publicado | ⬜ |
| **09** | **Ads** | — | — | Campañas corriendo | ⬜ |
| **10** | **Community** | — | — | Conversación | ⬜ |

🧍 **Entre 07 y 08 hay un paso humano:** organizar el contenido en Drive según el calendario.
**No es un agente. No se automatiza.**

🔴 **QA sigue siendo el bloqueador.** A 204 piezas al mes el QA humano es ~1 minuto por pieza.
Sin él el volumen no es entregable y el margen no cierra.

---

## 🧰 El stack de acciones

| MCP | Para qué | Quién lo usa |
|---|---|---|
| **Firecrawl** `firecrawl_scrape` | Leer cualquier web, sacar screenshot, paleta y campos estructurados | Todos. **Pasa los bloqueos del proxy** |
| **AdWhispr** | Competidores verificados, anuncios por longevidad, keywords, pauta | Strategy · Marketing · Creative · Ads |
| **Figwright** | Construir en Figma: tokens, componentes, variants, export | Diseño |
| **WebSearch** | Reviews, prensa, fechas, "qué dicen de X" | Todos |
| **Notion · Google Drive** | Leer material previo, documentar y entregar | Todos |
| **Google Calendar** | Agendar jornadas de rodaje | Producción |
| **`ffmpeg`** vía Bash | Frames, specs, cortes y exports de video | Video |
| **Vercel · Zapier · Inherent OS** | Herramientas a medida y automatizaciones | Tecnología |

### ⛔ Los tres huecos declarados

| Hueco | Qué se pierde | A quién afecta |
|---|---|---|
| **Investigación social** | Outliers, análisis de creador, títulos y carruseles que ganan | Branding · Creative · Marketing |
| **Generación de media** | Imagen y video generados, variantes, doblaje, fotos de producto sin sesión | Diseño · Video · Producción |
| **Analítica del cliente** | Alcance, guardados, conversión y tráfico propios | Marketing · Creative |

⚠️ **Ninguno se cubre inventando.** Cada `WORKFLOW.md` §5 declara su hueco y cómo se cubre hoy —
casi siempre con trabajo humano de Allan.
⚠️ **Hay líneas publicadas que dependen de estos huecos.** Ver `inherent/03-OFERTA.md` →
«Qué respalda cada línea publicada».

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿el agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |
| **Producir** | ¿está declarado el **plan contratado**? |

---

## Cómo se crea uno nuevo

1. **Carpeta:** `agents/<área>/brain/skills/`
2. **`brain/WORKFLOW.md`** — las 9 secciones de arriba, con los gates marcados, **§3 el plan
   contratado** y **§9 lo que este agente NO hace**.
3. **`brain/skills/README.md`** — cuándo se invoca cada skill dentro del workflow.
4. **Una carpeta por skill**, con su `SKILL.md`. El `name` del frontmatter **es igual al nombre de
   la carpeta**.
5. **Enlazarla** en `.claude/skills/` con un symlink relativo:
   `ln -s ../../agents/<área>/brain/skills/<skill> .claude/skills/<skill>`
6. **Definir su entrega en §7.** Cada agente entrega distinto — no hay formato compartido.
