# Playbook — MCPs del Agente de Creatividad

Qué herramienta usar, para qué, y en qué orden. **Verificar disponibilidad antes de usar** — si un
MCP no está conectado en la sesión, se declara la limitación y se busca alternativa; nunca se
inventa el dato que ese MCP hubiera dado.

> **Las reglas transversales de uso de MCPs no se repiten acá.** Viven en
> `agents/strategy/playbooks/BUENAS-PRACTICAS-MCP.md` y aplican igual a Creative: verificar antes de
> llamar, presupuesto de 3 intentos, distinguir error de cero, patrón ≠ señal, citar la fuente,
> leer es libre y escribir requiere intención declarada.
>
> *(Nota de arquitectura: ese archivo es transversal al repo, no propio de ③ Marketing. Cuando exista un
> tercer agente conviene moverlo a `playbooks/` en la raíz. No se duplica mientras tanto.)*

---

## Mapa rápido: pregunta → herramienta

| Necesito… | Herramienta | Tool principal |
|---|---|---|
| Los ads que llevan más tiempo corriendo (la señal de longevidad) | **AdWhispr** | `get_brand_ads` (`sortBy: longevity`) |
| Saber quién anuncia de verdad en la categoría del cliente | **AdWhispr** | `find_competitors` |
| Ver creativos de TikTok que están corriendo | **AdWhispr** | `research_tiktok_ads` |
| Buscar un creativo por mensaje o ángulo | **AdWhispr** | `search_ads` |
| Posts outliers de una categoría, tema o creador | **Eden** | `eden_search_social_content` · `eden_analyze_creator` |
| Qué títulos y miniaturas ganan (formato largo) | **Eden** | `eden_study_top_titles` |
| Qué carruseles y estáticos ganan | **Eden** | `eden_study_top_carousels` |
| Leer un post específico en detalle | **Eden** | `eden_read_social_post` |
| Guardar la bóveda de referencias | **Eden** | `eden_create_board` · `eden_save_posts_to_board` |
| Landings, páginas de venta, reviews, prensa | **Firecrawl** / **WebFetch** | `firecrawl_search` · `WebFetch` |
| Leer la Knowledge Base del departamento | **Notion** | `notion-fetch` · `notion-search` |
| Publicar brief o conceptos para el equipo | **Notion** | `notion-create-pages` |
| Entregar el Excel aprobado a ⑤ Producción | **Google Drive** | `create_file` · `share_file` |
| Datos internos del sistema Inherent | **Inherent OS** | `list_models` · `list_records` |
| Cualquier app sin MCP propio | **Zapier** | `discover_zapier_actions` |

---

## Los 3 MCPs centrales de Creative

### 🔴 AdWhispr — la señal de longevidad
**Para qué sirve en Creative:** es el sustituto operativo de la Meta Ad Library. Su valor no es
*"ver anuncios lindos"*: es **ordenar por antigüedad**. Un anuncio que lleva 90 días corriendo es un
creativo validado con dinero real.

**Secuencia correcta:**
```
1. get_my_brand / save_my_brand   → dar contexto del cliente al MCP
2. find_competitors               → anunciantes VERIFICADOS (activos ahora)
3. get_brand_ads (brandId, sortBy: longevity) → los ganadores probados ← el paso que importa
4. research_tiktok_ads            → si el bloque tiene slots de TikTok
5. search_ads                     → si se busca un ángulo o mensaje puntual
```

**Trampa crítica — dos tipos de ID que no se mezclan:**
- `brandId` = UUID → lo usan `get_brand_ads`, `get_brand_stats`, `search_ads`
- `pageId` = numérico → **solo** `add_brand`

**Regla propia de Creative:** el resultado se lee por `sortBy: longevity`, **nunca por
engagement**. Un ad con mucho engagement y poca antigüedad es un test, no un ganador.

**Frontera:** 🛑 Creative **no lanza ni edita campañas**. `launch_*` y `update_budget` están en
`deny` para todo el repo. La compra y optimización de pauta es de ⑧B Ads.

---

### 🟣 Eden — outliers, formatos y la bóveda
**Para qué sirve en Creative:** es el sustituto operativo de Meta Spark. Encuentra outliers orgánicos,
descompone qué títulos y formatos ganan, y **guarda la bóveda** en el workspace.

**Secuencia correcta:**
```
1. eden_search_social_content     → búsqueda por tema, pilar o formato
2. eden_resolve_creator           → resolver handles antes de analizar
3. eden_analyze_creator           → base de rendimiento del creador ← para detectar el OUTLIER
4. eden_study_top_titles / eden_study_top_carousels → patrones de formato
5. eden_read_social_post          → diseccionar la pieza en los 6 elementos
6. eden_create_board + eden_save_posts_to_board → archivar la bóveda  ⚠️ requiere gate
```

**El paso 3 es obligatorio y es el que más se saltea.** Sin la base del creador no se puede saber si
una pieza es outlier — y sin eso la referencia entró por gusto, no por señal.

**Reglas propias del MCP (respetarlas):**
- **Presupuesto de descubrimiento: máximo 3 búsquedas infructuosas.** Después se para y se pide al
  usuario 1-2 nombres, handles o posts de referencia.
- Si `eden_resolve_creator` devuelve ambiguo, **se pregunta cuál**. No se adivina por handle plausible.
- Cero resultados describe **solo esos términos y filtros** — nunca *"no hay contenido de esto"*.
- Un error o timeout **no es** un cero.

**Frontera:** 🛑 `eden_publish_post_now` y `eden_schedule_post` están en `deny`. Creative no publica
ni programa.

---

### 🟡 Firecrawl — landings, reviews y objeciones
**Para qué sirve en Creative:** el lenguaje literal y las objeciones. Las páginas de venta de los
competidores son la ingeniería inversa de sus objeciones — **el orden de los argumentos revela qué
objeción consideran más grave**.

Y las reviews negativas dan el **problema interno** del arco narrativo, escrito con las palabras del
comprador.

**Cuándo cada tool:**
- `firecrawl_search` → reviews, comentarios, prensa, referencias de categoría
- `WebFetch` → cuando ya se tiene la URL exacta de una landing y se quiere una lectura dirigida

**Nota:** ③ Marketing ya construyó el **mapa de objeciones** en ② ingeniería inversa. Creative arranca
de ahí. Firecrawl se usa para el **hueco**: la objeción específica del formato o del ángulo de este
bloque.

---

## MCPs de apoyo

| MCP | Rol en Creative | Precaución |
|---|---|---|
| **Notion** | Leer la Knowledge Base del departamento; publicar brief y conceptos | `ask` antes de escribir. El repo es la fuente de verdad del método |
| **Google Drive / Sheets** | Entregar el Excel aprobado a ⑤ Producción | **Solo post-GATE 3.** Nunca un Excel con filas `PENDIENTE` |
| **Inherent OS** | Histórico del cliente, piezas anteriores | Leer libremente; escribir solo con intención declarada |
| **Higgsfield** y generadores de media | **Fuera del alcance de Creative** | Creative **dirige**; la generación de media es de ⑤ Producción |
| **Figma y herramientas de diseño** | **Fuera del alcance de Creative** | Creative especifica el layout; el archivo lo arma ⑤ Producción |
| **Zapier** | Comodín para apps sin MCP propio | `discover` → `inspect` → `execute`. Nunca escritura sin gate |
| **Gmail / Calendar** | Coordinación, no creatividad | Nunca enviar sin autorización explícita |

---

## Secuencia estándar de la Capa 1 (swipe file completo)

```
0.  Leer ingenieria-inversa.md 1.3b (la tabla 15×7)   → qué ya está resuelto
0b. Leer el banco de hooks de aprendizaje-creativo.md → los ganadores propios van primero
1.  Calcular el HUECO                                 → qué formato/canal/hook falta cosechar
2.  AdWhispr  find_competitors + get_brand_ads(longevity) → ads que pagan
3.  AdWhispr  research_tiktok_ads                     → si hay slots de TikTok
4.  Eden      search_social_content → resolve_creator → analyze_creator  → OUTLIERS reales
5.  Eden      study_top_titles / study_top_carousels  → patrones de formato del canal
6.  Firecrawl landings + reviews                      → objeciones y lenguaje literal del hueco
7.  Diseccionar en los 6 elementos → marcar 🟢/🟡/⚪ → tabla de hipótesis
8.  Cruzar cada patrón contra el MAPA DE SATURACIÓN de ③ Marketing → descartar defaults
9.  (con gate) Eden create_board → archivar la bóveda
```

**Si un MCP no está disponible:** se declara en el output —
`⚠️ SIN [MCP] — [qué evidencia falta y qué confianza pierde el concepto]` — y se sigue con el resto.
Nunca se rellena el hueco con inferencia presentada como dato.

---

## Regla de escritura y acciones con efecto

| Acción | Requisito |
|---|---|
| Buscar, leer, analizar, diseccionar | Libre |
| Guardar en board, crear página de Notion, crear registro | Decir qué y dónde antes de hacerlo |
| Exportar el Excel a Drive / Sheets | **Post-GATE 3** y sin filas `PENDIENTE` |
| Publicar, programar, pautar, gastar | 🛑 **No lo hace Creative. Nunca** |
| Borrar o sobrescribir un aprobado | 🛑 **Gate humano explícito. Sin excepción** |

---

## Registro

Todo entregable que use MCPs cierra con:

```markdown
---
**Fuentes y herramientas**
- MCPs usados: [lista]
- Fecha del relevamiento: [fecha]
- MCPs no disponibles: [lista] → evidencia faltante: [qué]
- Referencias con señal 🟢: [n] · 🟡: [n] · descartadas ⚪: [n]
- Confianza general: 🟢 alta / 🟡 parcial / 🔴 insuficiente para dirigir
```

**Por qué importa:** un swipe file sin fecha es un swipe file muerto. La longevidad de un ad se mide
al momento de la consulta, y un ganador de hace seis meses probablemente ya fatigó.
Refresco **semanal**.
