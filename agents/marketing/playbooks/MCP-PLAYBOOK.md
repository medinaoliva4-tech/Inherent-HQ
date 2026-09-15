# Playbook — MCPs del Agente de Marketing

Qué herramienta usar para el **research comercial (M1)** y para la operación. **Verificar
disponibilidad antes de usar** — si un MCP no está conectado, se declara la limitación y se busca
alternativa. **Nunca se inventa el dato que ese MCP hubiera dado.**

> Este playbook es distinto al de Strategy. Strategy busca **qué se dice y qué contenido funciona**.
> Marketing busca **qué se vende, cuándo, y a qué costo**.

---

## Mapa rápido: pregunta → herramienta

| Necesito… | Herramienta | Tool principal |
|---|---|---|
| Quién está **pautando de verdad** en la categoría | **AdWhispr** | `find_competitors` |
| Los ads que llevan **más tiempo corriendo** (= ganadores) | **AdWhispr** | `get_brand_ads` (`sortBy: longevity`) |
| Ofertas y promos visibles en los ads | **AdWhispr** | `get_brand_ads`, `search_ads` |
| Volumen y costo de búsqueda para search ads | **AdWhispr** | `research_keywords`, `research_competitor_keywords` |
| Qué términos compra la competencia | **AdWhispr** | `research_competitor_keywords` |
| Segmentaciones disponibles en la plataforma | **AdWhispr** | `search_ad_targeting` |
| Rendimiento de las cuentas propias | **AdWhispr** | `get_account_performance`, `list_campaigns` |
| Ads guardados y comparación de marcas | **Eden** | `eden_get_brand_ads`, `eden_search_ads` |
| Encontrar y evaluar **creadores** | **Eden** | `eden_search_creators`, `eden_analyze_creator` |
| Qué formatos rinden (títulos, carruseles) | **Eden** | `eden_study_top_titles`, `eden_study_top_carousels` |
| Guardar el research en el workspace | **Eden** | `eden_create_board`, `eden_save_ads_to_board` |
| Programar y ver lo publicado | **Eden** | `eden_list_scheduled_posts`, `eden_get_analytics` |
| Fechas comerciales, temporadas, eventos del rubro | **Firecrawl** / **WebSearch** | `firecrawl_search` |
| Leer landings, promos y páginas de oferta | **Firecrawl** / **WebFetch** | `firecrawl_search`, `WebFetch` |
| Base de conocimiento del departamento | **Notion** | `notion-fetch`, `notion-search` |
| Fechas y bloqueos del equipo | **Google Calendar** | `list_events`, `create_event` |
| Entregables al cliente | **Google Drive** | `create_file`, `share_file` |
| Datos internos del sistema Inherent | **Inherent OS** | `list_models`, `list_records` |
| App sin MCP propio | **Zapier** | `discover_zapier_actions` |

---

## 🔴 AdWhispr — el MCP central de Marketing

Es la fuente de verdad sobre **qué mensaje está respaldado con dinero real**. Un ad que lleva seis
meses corriendo es un ángulo validado por el mercado, no una opinión.

**Secuencia para M1.1 (publicidad viva):**
```
1. get_my_brand / save_my_brand        → darle contexto del cliente al MCP
2. find_competitors                    → anunciantes VERIFICADOS (corriendo ads ahora)
3. add_brand (con pageId)              → si una marca verificada no está trackeada
4. get_brand_ads (brandId, sortBy: longevity)  → los ganadores probados
5. research_keywords                   → dimensionar demanda de captura y costo
```

**Trampa crítica — dos IDs que no se mezclan:**
- `brandId` = UUID → `get_brand_ads`, `get_brand_stats`, `search_ads`
- `pageId` = numérico → **solo** `add_brand`

**Regla dura:** no inventar nombres de competidores. Los nombres generados por un modelo con
frecuencia **no anuncian**. Si `find_competitors` no devuelve nada y hay que nombrarlos por criterio
propio, se marcan `🟡 no verificados`.

**Qué extraer de cada ad ganador** (va a la tabla de M1.1):
```
marca · plataforma · días corriendo · formato · ángulo · promesa · oferta visible · CTA
```

---

## 🟣 Eden — creadores, formatos y operación social

**Para M1.4 (tarifas y creadores):** `eden_search_creators` → `eden_resolve_creator` →
`eden_analyze_creator`. Si la resolución devuelve ambiguo, **se pregunta**; no se adivina el handle.

**Para M1.1 (complemento de ads):** `eden_get_brand_ads`, `eden_save_ads_to_board` para dejar la
evidencia guardada y compartible.

**Para M7 (lectura):** `eden_get_analytics`, `eden_list_analytics_posts` sobre las cuentas propias.

**Límite de búsqueda:** máximo **tres** intentos fallidos de descubrimiento en total. Después del
tercero se para y se pide al usuario 1-2 nombres, handles o ejemplos. No se sigue buscando a ciegas.

---

## 🟠 Firecrawl / WebSearch — fechas y contexto comercial

El único camino confiable para **M1.3 (calendario comercial)**: feriados del mercado, temporadas
del rubro, ferias y eventos de industria, fechas regulatorias.

**Regla:** toda fecha se guarda con **fuente y año de referencia**. Una fecha de 2023 sin confirmar
para este año va como `⚠️ a confirmar`.

---

## 🔵 Google Calendar — la capa de realidad

Antes de cerrar el `calendario-comercial.csv`, se cruza contra el calendario real del equipo y del
cliente: vacaciones, feriados locales, bloqueos. Un calendario perfecto sobre un equipo ausente
no sirve.

---

## Reglas duras de uso

1. **Verificar disponibilidad primero.** Si el MCP no está conectado, se declara y se busca
   alternativa. Nunca se rellena el hueco con memoria del modelo.
2. **Todo dato lleva fuente + fecha + herramienta.** El bloque de fuentes de
   `research-comercial.md` es obligatorio.
3. **Benchmarks de costo: fuente o `⚠️ SIN DATOS`.** Un CPM inventado desalinea todo el presupuesto
   de M6 y no se nota hasta la semana 3.
4. **Competidores: verificados o marcados.** `🟢 verificado por MCP` / `🟡 no verificado`.
5. **Nada destructivo sin autorización.** No publicar, no programar, no pausar campañas, no enviar
   al cliente, no escribir en cuentas del cliente sin gate humano explícito.
6. **Los MCP de generación (Higgsfield, etc.) no son de Marketing.** Producir piezas es de Creative
   y Production. Marketing especifica volumen y formato, no genera assets.

---

## Bloque de fuentes obligatorio

Todo `research-comercial.md` cierra con:

```
FUENTES
· MCPs usados: [lista + qué se obtuvo de cada uno]
· MCPs no disponibles: [lista + qué dato quedó sin cubrir]
· Fecha del relevamiento: [YYYY-MM-DD]
· Confianza general: 🟢 alta / 🟡 media / 🔴 baja
· Re-correr el research: [fecha sugerida]
```
