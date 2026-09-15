# Playbook — MCPs del Agente de Branding

Qué herramienta usar, para qué, y en qué orden. **Verificar disponibilidad antes de usar** — si un
MCP no está conectado en la sesión, se declara la limitación y se busca alternativa; nunca se
inventa el dato que ese MCP hubiera dado.

> Las reglas transversales (presupuesto de intentos, paginación, error ≠ cero, cómo citar) están en
> `agents/strategy/playbooks/BUENAS-PRACTICAS-MCP.md`. **Aplican igual acá.** Este playbook solo
> cubre lo específico de Branding.

---

## Mapa rápido: pregunta → herramienta

| Necesito… | Herramienta | Tool principal |
|---|---|---|
| Ver cómo se ve el feed de una marca o referencia de IG | **Eden** | `eden_resolve_creator`, `eden_analyze_creator` |
| Descomponer las portadas y estáticos que ganan en la categoría | **Eden** | `eden_study_top_carousels`, `eden_study_top_titles` |
| Encontrar piezas concretas para el mapa de saturación | **Eden** | `eden_search_social_content`, `eden_read_social_post` |
| Guardar el moodboard y las referencias con fuente | **Eden** | `eden_create_board`, `eden_save_posts_to_board` |
| Ver el sistema visual que una marca paga por sostener | **AdWhispr** | `get_brand_ads` (`sortBy: longevity`) |
| Leer una web y sacar su sistema visual y verbal | **Firecrawl** / **WebFetch** | `firecrawl_search`, `WebFetch` |
| Buscar tipografías, licencias, referencias de diseño | **Firecrawl** / **WebSearch** | `firecrawl_search`, `WebSearch` |
| Leer la knowledge base de branding de Inherent | **Notion** | `notion-fetch`, `notion-search` |
| Buscar los assets y manuales viejos del cliente | **Google Drive** | `search_files`, `read_file_content` |
| Generar texturas, gradientes o elementos de moodboard | **Higgsfield** | `generate_image` |
| Datos internos del cliente | **Inherent OS** | `list_records`, `get_record` |

---

## Los MCPs centrales para Branding

### 🟣 Eden — la herramienta #1 del departamento

**Para qué sirve:** Branding vive de referencias visuales verificables. Eden es la única forma de
mirar **el feed real de una cuenta** y **qué formato visual rinde en una categoría** sin inventar.

**Secuencia para el mapa de saturación (B1.3):**
```
1. eden_resolve_creator        → resolver cada handle que dio el cliente o que salió de ② Estrategia
2. eden_analyze_creator        → leer el perfil: qué publica, en qué formato, con qué frecuencia
3. eden_study_top_carousels    → descomponer los estáticos y carruseles que ganan
4. eden_study_top_titles       → el registro verbal: cómo titulan
5. eden_search_social_content  → piezas puntuales para completar las 8 capas visuales
6. eden_create_board + eden_save_posts_to_board → dejar la evidencia guardada con su fuente
```

**Trampas:**
- Si `eden_resolve_creator` devuelve **ambiguo**, se para y se pregunta cuál handle es. **No se
  adivina** por handle parecido — terminás auditando la cuenta equivocada.
- Presupuesto: **3 búsquedas infructuosas en total**. Después se pide un handle o un link concreto.
- Guardar posts en un board **es una escritura** → va bajo `ask` en `settings.json`. Se pide
  confirmación.

---

### 🔴 AdWhispr — el sistema visual que alguien paga por sostener

**Para qué sirve en Branding:** un anuncio que lleva 6 meses corriendo es un **sistema visual
validado con dinero**. Ordenar por `longevity` muestra qué códigos visuales de la categoría
efectivamente convierten, no cuáles se ven lindos.

```
find_competitors → add_brand (con pageId) → get_brand_ads (brandId, sortBy: longevity)
```

**Recordá los dos IDs:** `brandId` es UUID (para `get_brand_ads`), `pageId` es numérico (**solo**
para `add_brand`). Mezclarlos falla la validación.

**Qué mirás en un anuncio para B1.3:** color dominante · tipografía y tracking · densidad de texto ·
si hay persona o producto · tratamiento de la foto · cuánto ocupa el logo.

---

### 🔵 Firecrawl / WebFetch — web, tipografías y referencias

- **Web del competidor:** sacá paleta, jerarquía, familia tipográfica y registro verbal. La web es
  donde el sistema visual está más completo.
- **Tipografías:** verificar que exista, quién la vende, qué licencia tiene y **si tiene set latino
  extendido con `ñ` y tildes**. Esto se verifica, no se asume.
- **Referencias fuera de categoría:** la fuente principal cuando la categoría está saturada.

Toda referencia se guarda con **URL + fecha de consulta**.

---

### 📓 Notion — la knowledge base de branding

`Brand Dept. Knowledge Base` y `Graphic Design Dept. Knowledge Base` (dentro de
*Plantilla de Departamentos — Inherent Global*) contienen las skills de referencia del
departamento: brand identity, aesthetics, tipografía, color, composición, feed strategist y
branding relevante hoy.

Se consultan cuando hace falta profundizar un criterio. **No reemplazan a `METHOD.md`** — si
contradicen el método, gana el método y se anota la contradicción para revisarla.

---

### 🟡 Higgsfield — generación para moodboard

**Solo para B4.2**, y **solo para el moodboard**: texturas, gradientes, elementos gráficos de
exploración.

**Reglas duras:**
- Todo asset generado se marca **`[generado]`** en el moodboard. Nunca se presenta como referencia
  real de otra marca.
- **No se genera un logo.** El logo se diseña.
- No reemplaza fotografía real del cliente. Sirve para mostrar una dirección, no para producir el
  activo final — eso es de **Production**.
- Es una acción generativa → va bajo `ask`. Se pide confirmación.

---

### 📁 Google Drive — los assets del cliente

Antes de pedirle nada al cliente: `search_files` por su nombre. Casi siempre ya hay un manual viejo,
un logo en vectores o un banco de fotos que nadie recordaba.

---

## MCPs que el departamento querría y hoy no están

Se declaran para que nadie los invente ni los prometa:

| Herramienta | Para qué sería | Estado |
|---|---|---|
| **FigWright** (Figma MCP) | Maquetar piezas reales aplicando el guideline | ⚠️ No disponible en esta sesión |
| **VisuHaus** | Motion graphics sobre estáticos | ⚠️ No disponible |
| **Jockey** | Banco de assets finales del cliente | ⚠️ No disponible |

Mientras no estén: el sistema visual se entrega **especificado en texto con valores exactos**, y la
maquetación real la ejecuta Production. Eso hace que la especificación tenga que ser más precisa,
no menos.

---

## Cómo se cita una referencia visual

Nunca "vi una marca que hacía esto". Siempre:

```
[Marca] — @handle o URL — consultado el DD-MM-AAAA — vía [Eden / AdWhispr / WebFetch]
Qué se observó: [descripción de las capas visuales relevantes]
Principio extraído: [el porqué, no la forma]
```

Sin fuente, el hallazgo va como `⚠️ SIN VERIFICAR` o no va.
