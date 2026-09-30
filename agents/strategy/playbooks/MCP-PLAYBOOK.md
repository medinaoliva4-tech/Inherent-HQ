# Playbook — MCPs del Agente de Estrategia

Qué herramienta usar, para qué, y en qué orden. **Verificar disponibilidad antes de usar** — si un
MCP no está conectado en la sesión, se declara la limitación y se busca alternativa; nunca se
inventa el dato que ese MCP hubiera dado.

---

## Mapa rápido: pregunta → herramienta

| Necesito… | Herramienta | Tool principal |
|---|---|---|
| Saber quién anuncia de verdad en mi categoría | **AdWhispr** | `find_competitors` |
| Ver los anuncios que llevan más tiempo corriendo | **AdWhispr** | `get_brand_ads` (`sortBy: longevity`) |
| Dimensionar demanda de búsqueda | **AdWhispr** | `research_keywords`, `research_competitor_keywords` |
| Encontrar posts outliers de una categoría o creador | **Eden** | `eden_search_social_content`, `eden_analyze_creator` |
| Ver qué títulos y miniaturas ganan | **Eden** | `eden_study_top_titles` |
| Ver qué carruseles/estáticos ganan | **Eden** | `eden_study_top_carousels` |
| Encontrar creadores que ya tienen la audiencia | **Eden** | `eden_search_creators`, `eden_resolve_creator` |
| Guardar evidencia en el workspace | **Eden** | `eden_create_board`, `eden_save_posts_to_board` |
| Leer landings, páginas de venta, reviews | **Firecrawl** / **WebFetch** | `firecrawl_search`, `WebFetch` |
| Contexto de industria, prensa, regulación | **Firecrawl** / **WebSearch** | `firecrawl_search`, `WebSearch` |
| Leer/guardar la base de conocimiento | **Notion** | `notion-fetch`, `notion-create-pages` |
| Entregables aprobados al cliente | **Google Drive** | `create_file`, `share_file` |
| Datos internos del sistema Inherent | **Inherent OS** | `list_models`, `list_records` |
| Cualquier app que no tenga MCP propio | **Zapier** | `discover_zapier_actions` |

---

## Los 4 MCPs centrales

### 🔴 AdWhispr — inteligencia de anuncios y demanda
**Para qué sirve en estrategia:** es la fuente de verdad sobre **quién está pagando por atención** y
**qué mensaje están pagando**. Un anuncio que lleva 6 meses corriendo es un mensaje validado con
dinero real.

**Secuencia correcta:**
```
1. get_my_brand / save_my_brand   → dar contexto del cliente al MCP
2. find_competitors               → devuelve anunciantes VERIFICADOS (activos ahora)
3. add_brand (con pageId)         → si una marca verificada no está trackeada
4. get_brand_ads (con brandId, sortBy: longevity) → los ganadores probados
5. research_keywords              → dimensionar la demanda de captura
```

**Trampa crítica — dos tipos de ID que no se mezclan:**
- `brandId` = UUID → lo usan `get_brand_ads`, `get_brand_stats`, `search_ads`
- `pageId` = numérico → **solo** `add_brand`
- Pasar un `pageId` como `brandId` falla la validación.

**Regla dura:** no inventar nombres de competidores. Los nombres que genera un modelo con frecuencia
no anuncian. Si `find_competitors` no devuelve nada y hay que nombrar competidores por criterio
propio, se marcan explícitamente como `🟡 no verificados`.

**Arquetipos donde más rinde:** 04 E-commerce · 02 Local Alto Ticket · 07 Infoproducto · 06 SaaS

---

### 🟣 Eden — inteligencia social y de creadores
**Para qué sirve en estrategia:** es el motor de la ingeniería inversa de contenido orgánico.
Encuentra outliers, descompone qué títulos/formatos ganan, e identifica quién ya tiene la audiencia.

**Secuencia correcta:**
```
1. eden_search_social_content     → búsqueda global por tema/categoría
2. eden_resolve_creator           → resolver handles antes de analizar
3. eden_analyze_creator           → base de rendimiento del creador (para detectar outliers)
4. eden_study_top_titles / eden_study_top_carousels → patrones de formato
5. eden_create_board + eden_save_posts_to_board → archivar la evidencia
```

**Reglas propias del MCP (respetarlas):**
- **Presupuesto de descubrimiento: máximo 3 búsquedas infructuosas en total.** Después de la
  tercera, se para y se pide al usuario 1-2 nombres, handles o posts de referencia. No seguir
  intentando variantes.
- Si `eden_resolve_creator` devuelve ambiguo, **se pregunta cuál**. No se adivina por handle plausible.
- Cero resultados describe **solo esos términos y filtros** — nunca se concluye que el tema no
  existe o que no hay audiencia.
- Un error o timeout **no es** un cero. Se cambia de fuente o se pide referencia; no se repite la
  misma búsqueda con sinónimos.

**Arquetipos donde más rinde:** 11 Media/IP · 03 Marca Personal · 07 Infoproducto · 09 Hospitalidad

---

### 🟡 Firecrawl — evidencia web, categoría e industria
**Para qué sirve en estrategia:** todo lo que vive fuera de las redes — landings, páginas de venta,
reviews, prensa, informes, regulación, documentación técnica.

**Cuándo cada tool:**
- `firecrawl_search` → evidencia general de categoría, prensa, reviews
- `firecrawl_search` con `categories: ["research"]` → informes y fuentes académicas
- `firecrawl_developer_search` → solo para clientes de software (docs, repos, issues)
- `WebFetch` → cuando ya se tiene la URL exacta y se quiere una lectura dirigida

**Uso estratégico específico:** las páginas de venta de competidores son la ingeniería inversa de
sus objeciones — **el orden de los argumentos revela qué objeción consideran más grave**.

**Arquetipos donde más rinde:** 05 B2B · 06 SaaS · 10 Institución · 08 Marketplace

---

### ⚫ Notion — base de conocimiento y memoria
**Para qué sirve en estrategia:** leer la metodología y las skills de la Knowledge Base, y devolver
ahí los outputs que el equipo va a consultar y mantener.

- `notion-fetch` con la URL → leer una página o base
- `notion-ai-search` / `notion-search` → encontrar material previo del cliente antes de empezar
- `notion-create-pages` → publicar el entregable cuando el usuario lo pida

**Regla:** el repositorio es la fuente de verdad del **método**; Notion es la fuente de verdad del
**conocimiento crudo y las decisiones del equipo**. No duplicar el método en Notion.

---

## MCPs de apoyo

| MCP | Rol en estrategia | Precaución |
|---|---|---|
| **Google Drive** | Exportar entregables aprobados para el cliente | Solo después del gate humano |
| **Gmail / Calendar** | Coordinación, no estrategia | Nunca enviar sin autorización explícita |
| **Inherent OS** | Datos propios: clientes, registros, histórico | Leer libremente; escribir solo con intención declarada |
| **Higgsfield** | Generación de media | **Fuera del alcance de Strategy.** Es de **Production** — Creative dirige, no genera |
| **Zapier** | Comodín para apps sin MCP propio | `discover` → `inspect` → `execute`. Nunca ejecutar escritura sin gate |
| **GitHub / Vercel** | Infraestructura del repo | No es herramienta de estrategia |

---

## Secuencia estándar de la Capa 1 (ingeniería inversa completa)

```
0.  Leer la ficha del arquetipo → saber a quién estudiar y con qué MCP
1.  AdWhispr  save_my_brand + find_competitors     → universo verificado (anillo 1)
2.  AdWhispr  get_brand_ads sortBy:longevity       → anuncios ganadores
3.  Eden      search_social_content + analyze_creator → outliers orgánicos (anillos 4-5)
4.  Eden      study_top_titles / top_carousels     → patrones de formato
5.  Firecrawl landings + reviews + prensa          → promesa declarada y objeciones
6.  AdWhispr  research_keywords                    → dimensión de demanda de captura
7.  Descomponer en las 7 capas → marcar 🟢/🟡/⚪ → los 3 mapas
8.  (opcional) Eden create_board → archivar la evidencia en el workspace
```

**Si un MCP no está disponible:** se declara en el output —
`⚠️ SIN [MCP] — [qué evidencia falta y qué confianza pierde la conclusión]` — y se sigue con el resto.
Nunca se rellena el hueco con inferencia presentada como dato.
