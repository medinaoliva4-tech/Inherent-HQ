# Playbook — Ingeniería Inversa Conectada con Media

**Qué es.** El proceso propietario de Inherent para extraer, de la media que ya existe y ya funciona,
los patrones que explican *por qué* funciona — y traducirlos a hipótesis propias.

**Qué NO es.** No es "mirar a la competencia". No es copiar. No es una recomendación.

> 🛑 **Regla dura:** este proceso termina en un **patrón observado**. Si el output dice "por lo tanto
> deberíamos…", se salió de su rol. Decidir es de la Capa 2 en adelante.

**Dónde vive:** Capa 1 del método · **Output:** `ingenieria-inversa.md`

---

## Paso 1 — Definir el universo (5 anillos)

El error clásico es estudiar solo competidores directos. La pregunta correcta no es *"¿quién vende
lo mismo?"* sino:

> **¿Quién ya captura la atención de mi comprador en el momento en que decide?**

| Anillo | Qué es | Qué se extrae |
|---|---|---|
| **1. Directos** | Venden lo mismo, al mismo comprador | El default de categoría — de qué hay que despegarse |
| **2. De categoría** | Resuelven la misma necesidad de otra forma | Los sustitutos reales de presupuesto y de atención |
| **3. Sustitutos** | Lo que la gente hace si no compra nada | El competidor invisible: "no hacer nada" |
| **4. Referentes fuera de categoría** | Marcas admiradas en otro rubro con la misma audiencia | Los formatos que todavía no llegaron a esta categoría |
| **5. Creadores** | Quien ya tiene la audiencia que queremos | Distribución prestada + el lenguaje real del comprador |

**Mínimos:** 3 del anillo 1 · 2 del anillo 2 · 1 del anillo 3 · 2 del anillo 4 · 3 del anillo 5.
La ficha del arquetipo dice a quién priorizar.

**Verificación obligatoria:** nunca listar competidores de memoria. Se verifican con MCP
(`AdWhispr find_competitors` devuelve anunciantes **verificados**; los nombres inventados por un
modelo suelen no anunciar en absoluto). Si un nombre no se puede verificar, se marca
`🟡 no verificado`.

---

## Paso 2 — Cosechar media real

No opiniones sobre la marca: **las piezas**.

| Qué cosechar | Dónde | MCP |
|---|---|---|
| Anuncios activos y su antigüedad | Meta/TikTok ad libraries | `AdWhispr get_brand_ads` (`sortBy: longevity`) |
| Posts outliers (rinden muy por encima de su media) | Social | `Eden search_social_content`, `eden_analyze_creator` |
| Títulos y miniaturas que ganan | YouTube / formato largo | `Eden study_top_titles` |
| Carruseles y estáticos que ganan | IG / LinkedIn | `Eden study_top_carousels` |
| Landings y páginas de venta | Web | `Firecrawl` / `WebFetch` |
| Reviews y quejas | Reviews, foros, comentarios | `Firecrawl firecrawl_search`, `WebSearch` |
| Volumen y términos de búsqueda | Search | `AdWhispr research_keywords` |

**Criterio de "ganadora"** — solo estos cuentan, no lo que se ve lindo:
- **Anuncio:** lleva mucho tiempo corriendo (longevidad = está pagando)
- **Orgánico:** rinde muy por encima de la media *de esa cuenta* (outlier, no número absoluto)
- **Página:** existe hace tiempo y sigue igual (no la rehicieron = funciona)

> Una pieza con muchas views de una cuenta enorme puede ser **el peor** contenido de esa cuenta.
> Siempre relativo a su propia base.

---

## Paso 3 — Descomponer en 7 capas

Cada pieza ganadora se abre así. Sin excepción, en este orden.

| # | Capa | Pregunta | Qué se extrae |
|---|---|---|---|
| 1 | **Gancho** | ¿Cómo detiene el scroll en 2 segundos? | Tensión, contradicción, promesa, cara, movimiento, texto |
| 2 | **Promesa** | ¿Qué está prometiendo, explícita o implícitamente? | El beneficio real que activa |
| 3 | **Mecanismo** | ¿Por qué dice que funciona? | El "cómo" que hace creíble la promesa |
| 4 | **Prueba** | ¿Con qué lo respalda? | Demo, dato, testimonio, antes/después, autoridad, cantidad |
| 5 | **Formato** | ¿Cómo está construido? | Duración, estructura, ritmo, edición, texto en pantalla, sonido |
| 6 | **Distribución** | ¿Cómo llegó? | Orgánico, pago, creador, PR, comunidad — y a qué temperatura |
| 7 | **Oferta / CTA** | ¿Qué pide y con qué fricción? | Acción, incentivo, urgencia, siguiente paso |

**Tabla de salida** (una fila por pieza, mínimo 15 piezas):

```markdown
| # | Fuente | Anillo | Gancho | Promesa | Mecanismo | Prueba | Formato | Distribución | Oferta/CTA | Señal de que funciona |
```

---

## Paso 4 — Patrón vs ruido

Se cuentan repeticiones por capa. No se interpreta todavía.

| Marca | Criterio |
|---|---|
| 🟢 **Patrón** | Aparece en 3+ piezas de **fuentes distintas** |
| 🟡 **Señal** | 1-2 apariciones, o 3+ de la misma fuente |
| ⚪ **Ruido** | Una sola aparición sin repetición |

**Nunca reportar una señal como patrón.** Es la falla más común y la más cara: construye una
estrategia sobre una casualidad.

---

## Paso 5 — Los tres mapas

### 5.1 Mapa de saturación
Qué está haciendo todo el mundo, por capa. Esto es **el default de categoría** — el punto del que
hay que despegarse, no el modelo a seguir.

```markdown
| Capa | Lo que hace todo el mundo | Nivel de saturación |
```

### 5.2 Mapa 2x2 de posicionamiento
Dos ejes **relevantes a esta categoría** — nunca "premium/económico" genérico sin justificar por qué
esos ejes importan acá. Los ejes salen de la evidencia, no de la plantilla.

Sobre el mapa se marca: cada competidor, la marca hoy, y el **white space** (territorio vacío o mal
ocupado). Un white space que no está dibujado en el mapa no existe.

### 5.3 Mapa de objeciones
El regalo del mercado: las reviews y comentarios negativos de los competidores son el mapa de
objeciones de la categoría, ya escrito.

```markdown
| Objeción (en el lenguaje literal del comprador) | Frecuencia | Quién la resuelve hoy | Cómo |
```

---

## Paso 6 — Traducir a hipótesis (no a copia)

El único paso donde se genera algo nuevo. Cada patrón se convierte en una hipótesis, y cada hipótesis
pasa el filtro de distintividad de la Capa 4 antes de sobrevivir.

```markdown
| Patrón observado | Hipótesis para nuestra marca | ¿Apalanca qué UNFAIR? | Distinctive / Novel / Relevant |
```

**Reglas de traducción:**
1. Se puede modelar la **estructura**; nunca se copia la **ejecución**.
2. Un patrón que no apalanca ninguna ventaja propia es un patrón ajeno — se descarta.
3. El white space vale más que el patrón: lo que nadie hace, si es relevante, es la oportunidad.
4. Si la hipótesis podría llevar el logo de un competidor sin que nadie note la diferencia,
   falló **Distinctiveness**. Vuelve atrás.

---

## Checklist de cierre

- [ ] Los 5 anillos tienen fuentes, y los competidores están **verificados por MCP**, no de memoria
- [ ] Mínimo 15 piezas descompuestas en las 7 capas
- [ ] Cada patrón marcado 🟢/🟡/⚪ con su conteo de fuentes
- [ ] El mapa 2x2 tiene ejes justificados y el white space está **dibujado**, no solo mencionado
- [ ] El mapa de objeciones usa el lenguaje literal del comprador
- [ ] Cada hipótesis está atada a una UNFAIR real
- [ ] **Ninguna oración del documento empieza con "deberíamos"**
- [ ] Fecha del relevamiento registrada (la evidencia caduca: se re-corre a los 6 meses o si cambia
      la categoría)
