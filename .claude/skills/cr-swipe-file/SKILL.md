---
name: cr-swipe-file
description: >
  Capa 1 del método de Creatividad — investigación de referencias y análisis de piezas ganadoras.
  Arranca de la tabla 15x7 que Strategy ya descompuso, cosecha solo el hueco, filtra por longevidad
  (un ad de 60-90+ días es un ad que paga) y outliers contra su propia base, extrae el patrón —
  nunca la imagen — y lo traduce a hipótesis verificadas contra el mapa de saturación. Úsala cuando
  pidan "buscá referencias", "qué está funcionando en este formato", "analizá estos ads",
  "armá el swipe file", "qué hooks están ganando". No re-mapea la categoría: eso es Capa 1 de
  Strategy y ya está hecha.
---

# Capa 1 — Swipe File

**Leé completos antes de empezar:**
- `agents/creative/playbooks/SWIPE-FILE.md` — los 6 pasos del proceso
- `agents/creative/playbooks/MCP-PLAYBOOK.md` — qué herramienta para qué
- `agents/strategy/playbooks/BUENAS-PRACTICAS-MCP.md` — reglas transversales de MCPs
- `agents/creative/toolkit/02-hooks.md` — las 7 cajas, para clasificar lo que encontrás

**Plantilla:** `templates/swipe-file.md`

## Los 6 pasos

| | Paso | Qué produce |
|---|---|---|
| **0** | Arrancar de la tabla **15×7** de Strategy | Qué ya está resuelto, citado por # de fila |
| **1** | Calcular **el hueco** | Qué formato / canal / tipo de hook falta cosechar |
| **2** | Filtrar por **señal** | Escala `⏱️`: `⏱️60-90+d` · `⏱️30-60d` · `⏱️outlier` · `⏱️estable` · <30d se descarta |
| **3** | Diseccionar | hook · ángulo · formato · estructura · prueba · CTA |
| **4** | Organizar la bóveda | Por **pilar** y por **tipo de hook** |
| **5** | Traducir a hipótesis | Patrón → hipótesis nuestra, atada a un slot |
| **6** | **Verificar anti-default** | Cruce contra el **mapa de saturación** de Strategy |

## Secuencia de MCPs
```
0. ingenieria-inversa.md §1.3b + banco de hooks del ciclo anterior  → los propios van primero
1. AdWhispr  find_competitors + get_brand_ads (sortBy: longevity)   → ads que PAGAN
2. AdWhispr  research_tiktok_ads                                    → si hay slots de TikTok
3. Eden      search_social_content → resolve_creator → analyze_creator → OUTLIERS reales
4. Eden      study_top_titles / study_top_carousels                 → patrones de formato
5. Firecrawl landings + reviews                                     → objeciones y lenguaje literal
6. Cruzar cada patrón contra el MAPA DE SATURACIÓN                  → descartar defaults
```

**El paso 3 completo es obligatorio.** Sin `analyze_creator` no se puede saber si una pieza es
outlier — y sin eso la referencia entró por gusto, no por señal.

## Reglas duras
- 🛑 **Longevidad, no gusto.** Sin señal de rendimiento no entra a la bóveda.
- 🛑 **Dos escalas separadas.** `⏱️` = rendimiento de **una referencia**. 🟢/🟡/⚪ = **patrón**, por
  conteo de fuentes independientes (3+ = 🟢). Un ad `⏱️90d` de una sola fuente sigue siendo 🟡.
- 🛑 **Patrón, no imagen.** Se extrae la estructura. El link va a `referencia_visual` para que el
  ejecutor **vea** la referencia, pero lo que se dirige es el patrón.
- 🛑 **No re-mapees la categoría.** Strategy ya lo hizo. Solo se cosecha el hueco.
- 🛑 **Verificá contra el mapa de saturación.** Un patrón ganador que además es el default de
  categoría nos vuelve invisibles al adoptarlo.
- **"Ganadora" es relativo a su propia base.** Un post con muchas views de una cuenta enorme puede
  ser su peor contenido.
- **Máximo 3 búsquedas infructuosas por objetivo.** Después se pide al usuario un nombre, handle o link.
- **Un error o timeout no es un cero.** Nunca reportes un fallo como "no hay datos".
- **Cero resultados describe la búsqueda, no el mundo.**
- Si falta un MCP: `⚠️ SIN [MCP] — [qué evidencia falta]`. No rellenar con inferencia.
- **Cada hipótesis se ata a un slot de este bloque.** Nada se guarda "por si acaso".

## Cierre
Correr el bloque **Capa 1** de `qa/QA-GATES.md`. Registrar fecha del relevamiento, MCPs usados y no
disponibles, conteo `⏱️` de referencias, conteo 🟢/🟡/⚪ de patrones y confianza general.

## Handoff
→ `cr-big-idea` (Capa 2). El swipe file se refresca **semanal**: la longevidad se mide al momento de
la consulta y un ganador de hace seis meses probablemente ya fatigó.
