# Playbook — MCPs del Agente de Creatividad

Qué herramienta usar, para qué, y en qué orden.

> **Las reglas transversales de uso de MCPs no se repiten acá.** Viven en
> `agents/strategy/playbooks/BUENAS-PRACTICAS-MCP.md` y aplican igual a Creative: verificar antes de
> llamar, presupuesto de 3 intentos, distinguir error de cero, patrón ≠ señal, citar la fuente,
> leer es libre y escribir requiere intención declarada.

---

## ⓪ Lo primero: qué necesita el departamento, y qué hay hoy

Este playbook está partido en dos a propósito. **Arriba, lo que el departamento necesita** según su
método. **Abajo, con qué se cubre hoy.** No es lo mismo, y confundirlo es cómo se termina con un
workflow diseñado alrededor de las herramientas que ya estaban conectadas en vez de alrededor del
trabajo.

### Las 4 necesidades reales de Creative

| # | Necesidad | Por qué el método la exige | Sin esto… |
|---|---|---|---|
| **1** | **Longevidad de creativos de pauta** | Regla dura 5: *longevidad, no gusto*. Un ad con 90 días corriendo es un creativo validado con dinero | El swipe file entra por gusto estético y el `70·probado` es una mentira |
| **2** | **Outliers orgánicos con su base** | Un post con muchas vistas de una cuenta grande puede ser **el peor** de esa cuenta | No se puede distinguir un outlier de un número absoluto |
| **3** | **El creativo en sí, no solo su texto** | Capa 5 pide ambientación, luz, encuadre, paleta. Y la lectura de video necesita el archivo o la transcripción | Se lee el mensaje y se queda ciego sobre la imagen |
| **4** | **Lenguaje literal del comprador** | El copy se escribe con sus palabras, no con las nuestras | El copy suena a marca hablándole a nadie |

Todo lo demás —Notion, Drive, Calendar— es **logística**, no research. Útil, pero no define si el
departamento funciona.

---

## ① Meta y TikTok: qué se puede y qué no, con la evidencia

Esto hay que tenerlo claro antes de pedir integraciones, porque **las fuentes obvias no sirven** para
lo que Creative necesita.

### 🔴 La API oficial de Meta Ad Library no le sirve a Creative

| Límite | Consecuencia para Creative |
|---|---|
| **Solo ads políticos y de temas sociales** — con una excepción: los ads comerciales sí aparecen, pero **únicamente para audiencias de la UE y el Reino Unido**, por obligación del DSA | Para un cliente que pautea fuera de Europa, los ads comerciales **no están** en la API |
| **Devuelve solo texto** (`ad_creative_bodies`, `ad_creative_link_titles`) — **no entrega la imagen ni el video** | Es exactamente lo contrario de lo que pide la Capa 5. Sin el asset no hay ambientación, ni encuadre, ni paleta |
| Requiere verificación de identidad con documento, y el token expira a ~60 días | Fricción alta para un beneficio que no cubre la necesidad |
| ~200 llamadas por hora | Paginar un relevamiento serio consume la cuota del día |

**Conclusión:** la API oficial **no es una opción** para este departamento. No es una limitación de
la integración: es que la API está diseñada para transparencia electoral, no para research creativo.

### 🔴 «Meta Spark» no es una herramienta de research

Meta Spark era **Spark AR Studio**, la plataforma de efectos de realidad aumentada — Meta la
**discontinuó en enero de 2025**. Nunca fue una biblioteca de anuncios ni de creativos.

Si alguien pide «Meta Spark» para el swipe file, lo que está buscando es casi siempre **la Ad
Library** (ver arriba) o una herramienta de ad intelligence de terceros (ver ②).

### 🟡 TikTok Creative Center no tiene API oficial

El **Top Ads** de TikTok Creative Center es público y navegable, y es una fuente legítima de
patrones — pero **no expone una API oficial**. Todo acceso programático hoy pasa por scrapers de
terceros o por herramientas de ad intelligence que ya lo indexan.

**Qué significa en la práctica:** TikTok se cubre por la vía del MCP de ad intelligence, o
manualmente pegando links. No por integración directa.

### ⚠️ Y el agente no puede bajar el video

Los dominios de TikTok, Instagram y Meta están **fuera de alcance de red** del entorno. El agente no
puede descargar el archivo por su cuenta. Cuando hace falta leer la **imagen** —y no solo el
mensaje— el archivo lo aporta un humano o sale de Drive.

→ El detalle de cómo se lee un video está en `toolkit/09-lectura-de-video.md`.

---

## ② El MCP que falta, y por qué es el correcto

### 🟢 Foreplay — el candidato número uno

**Qué es:** una plataforma de research creativo con MCP oficial. Indexa **200M+ ads** de Meta,
Instagram, TikTok, YouTube y LinkedIn.

**Por qué encaja con las 4 necesidades:**

| Necesidad | Qué aporta Foreplay |
|---|---|
| **1 · Longevidad** | Devuelve **cuánto tiempo lleva corriendo** cada ad y si está activo. Es la señal `⏱️` directa |
| **3 · El creativo** | Devuelve **el creativo**, el copy, el CTA, la landing — y **transcripciones con timestamps** |
| **3 · Filtros del método** | Filtra por formato (video, imagen, carrusel), duración, mercado, idioma y fecha — que es exactamente cómo Creative calcula *el hueco* |
| **Bóveda** | Swipe files y boards propios, consultables desde el MCP: la bóveda deja de vivir en dos lados |

**La transcripción con timestamps es el hallazgo importante.** Resuelve la parte más frágil de la
lectura de video sin depender de transcripción local — que en este entorno **no está disponible**
(el modelo no se puede descargar). Con Foreplay, el guion de una referencia de pauta llega ya leído.

**Plan y costo** *(verificado en sept 2026, contra la página de precios)*: el **MCP viene en los
tres planes**, no está detrás de un tier.

| Plan | Anual | Usuarios | Swipe File · Discovery · Briefs | Spyder | Lens | API |
|---|---|---|---|---|---|---|
| **Basic** ← alcanza | **$49/mes** | 1 *(+$20 c/u)* | ✅ | ❌ | ❌ | 20.000 créditos |
| Workflow | $149/mes | 5 | ✅ | ilimitado | 1 marca | 20.000 créditos |
| Agency | $389/mes | 10 | ✅ | ilimitado | 10 marcas | 20.000 créditos |

### Por qué Basic alcanza para Creative

**Spyder es vigilancia continua; Discovery es búsqueda a demanda.** Spyder carga marcas y junta sus
ads a medida que salen, armando un historial. Discovery busca sobre los 200M+ cuando se le pide.

La regla dura 5 del departamento es **longevidad**: se buscan ads de **60-90+ días corriendo**. Un ad
que lleva 90 días corriendo **está vivo ahora**, así que Discovery lo encuentra. Lo que Spyder aporta
de forma exclusiva son los ads que **arrancaron y murieron** entre dos consultas — y esos son
`⏱️<30d`, que el método ya clasifica como **tests, no ganadores**.

| Lo que se pierde sin Spyder | ¿Afecta a Creative? |
|---|---|
| El refresco semanal pasa de leer un feed armado a salir a buscar | **No.** Más llamadas, y entran sobradas en el presupuesto de créditos |
| Alerta temprana de un competidor lanzando algo nuevo | **No es de Creative.** Es de ② Estrategia (mapa de saturación) y ⑧B Ads (reacción en pauta) |
| Historial de ads de vida corta | **No.** El método los descarta por señal insuficiente |

**Lens tampoco hace falta:** es analítica de rendimiento sobre la cuenta publicitaria propia —
territorio de **⑧B Ads**, no de Creative.

**El único límite real de Basic es 1 usuario** ($20 por adicional). El **agente usa la API key de la
cuenta, no un asiento**; los asientos son para humanos entrando a la web.

> **Cuándo sí conviene subir a Workflow:** cuando existan ② Estrategia y ⑧B Ads como agentes y
> necesiten vigilancia continua de competidores — no por Creative.

### 💳 Presupuesto de créditos — la regla que importa

**1 ad = 1 crédito, incluyendo TODA la metadata de ese ad.** Verificado en la documentación: 100
transcripciones solas cuestan 100 créditos; 100 transcripciones **+ video + copy + landing** cuestan
también 100.

🛑 **Consecuencia operativa: se pide la metadata completa en UNA sola llamada.** Pedir el copy
primero y las transcripciones después, sobre los mismos ads, **paga dos veces por lo mismo**.

**Consumo estimado del método:**

| Concepto | Ads |
|---|---|
| Barrido de 5-8 competidores, ~20-25 ads cada uno | 150-200 |
| 2-3 búsquedas del hueco, ~25-50 resultados | 50-150 |
| Transcripciones de las que pasan el filtro | **0 extra** |
| **Por cliente, por semana** | **~200-350** |
| **Por cliente, por mes** | **~800-1.400** |

Con 20.000 créditos/mes eso son **14-25 clientes**. Con 5 clientes se usa la cuarta parte.

Los créditos del plan anual son **20.000 por mes entregados por adelantado para el año** (240.000
totales), así que un mes pesado se compensa con uno liviano. Hay paquetes extra de 100k/250k/500k.

**🛑 Techos duros por corrida** — el riesgo no es el volumen, es la indisciplina. Ocho marcas × tres
búsquedas × 500 resultados son 12.000 créditos en un solo barrido:

| Regla | Límite |
|---|---|
| Resultados por búsqueda | **máximo 50.** Se ordena por longevidad y se lee la primera página |
| Ads por marca en el barrido de competidores | **máximo 25** |
| Techo por cliente por semana | **400 ads.** Si se pasa, se declara y se para |
| Paginar más allá de la primera página | Solo si la primera trajo señal y falta cubrir el hueco |
| Volver a pedir un ad ya leído | 🛑 **Nunca.** Está en su `ficha-de-referencia` — la ficha es la caché |
| Metadata | **Completa, en una llamada.** Nunca en dos pasadas |

Todo entregable declara el consumo: `créditos usados: [n] · techo del cliente: 400/semana`.

### Otras opciones, por si Foreplay no entra

| Herramienta | Qué cubre | Contra |
|---|---|---|
| **Atria / Motion** | Ad intelligence con analítica de creativos | Orientadas a performance de cuenta propia más que a research de categoría |
| **Apify** (actores de TikTok Creative Center) | Top Ads de TikTok vía scraper | Se paga por corrida, se rompe cuando TikTok cambia el DOM, y no hay MCP oficial |
| **AdLibrary.com Business** | Agrega ads comerciales de varias plataformas | Costo mensual alto, y hay que evaluar si cubre la señal de longevidad |

---

## ③ Con qué se cubre hoy

Estado real de los MCPs de la organización. **Verificar disponibilidad antes de usar**: instalado no
es lo mismo que habilitado en la sesión.

| MCP | Cubre | Estado | Nota |
|---|---|---|---|
| **AdWhispr** | Necesidades 1 y 2, parcialmente la 3 | Instalado · **no habilitado en la sesión** | Es el sustituto operativo de la Ad Library. Hay que habilitarlo por chat |
| **Eden** | Necesidad 2 | Instalado · **no habilitado en la sesión** | Outliers orgánicos con base del creador |
| **Firecrawl** | Necesidad 4 | ✅ Conectado y habilitado | Landings, reviews, lenguaje literal |
| **Zapier** | Comodín | ✅ Conectado y habilitado | Para apps sin MCP propio |
| **Notion · Drive · Gmail · Calendar** | Logística | Instalados · no habilitados | No son research |
| **Inherent O.S** | Histórico del cliente | Instalado · no habilitado | |
| **Higgsfield** | Generación de media | Instalado | 🛑 **Fuera del alcance de Creative** — genera ⑤ Producción |
| **Foreplay** | Necesidades 1 y 3, con transcripción | ⬜ **No instalado** | El pedido de esta revisión. **Plan Basic anual, $49/mes** — alcanza |

> 🛑 **Un MCP instalado pero no habilitado en el chat no tiene sus tools cargadas.** No es un error
> del agente: hay que prenderlo en la configuración de conectores de esa conversación. Si el
> departamento va a correr en sesiones nuevas, conviene dejarlos habilitados por defecto.

---

## ④ Mapa rápido: pregunta → herramienta

| Necesito… | Herramienta | Tool principal |
|---|---|---|
| Ads ordenados por **antigüedad** (la señal que importa) | **AdWhispr** *(o Foreplay)* | `get_brand_ads` con `sortBy: longevity` |
| Quién anuncia de verdad en la categoría | **AdWhispr** | `find_competitors` |
| Creativos de TikTok que están corriendo | **AdWhispr** *(o Foreplay)* | `research_tiktok_ads` |
| Buscar un creativo por mensaje o ángulo | **AdWhispr** *(o Foreplay)* | `search_ads` |
| **La transcripción de un ad de video** | **Foreplay** ⬜ | — *(hoy: OCR del texto en pantalla)* |
| Posts outliers, con la base del creador | **Eden** | `eden_search_social_content` → `eden_resolve_creator` → `eden_analyze_creator` |
| Qué títulos, miniaturas y carruseles ganan | **Eden** | `eden_study_top_titles` · `eden_study_top_carousels` |
| **Leer un video a fondo** (ritmo, ambientación, paleta) | **Pipeline local** | `toolkit/leer-video.py` |
| Landings, reviews, objeciones, lenguaje literal | **Firecrawl** | `firecrawl_search` · `WebFetch` |
| Guardar la bóveda | **Eden** *(o Foreplay boards)* | `eden_create_board` ⚠️ requiere gate |
| Leer la Knowledge Base | **Notion** | `notion-search` · `notion-fetch` |
| Entregar el Excel a ⑤ Producción | **Google Drive** | `create_file` — **solo post-GATE 3** |

---

## ⑤ Los MCPs centrales, en detalle

### 🔴 AdWhispr — la señal de longevidad

**Para qué sirve:** su valor no es *ver anuncios lindos* — es **ordenar por antigüedad**.

```
1. get_my_brand / save_my_brand   → contexto del cliente
2. find_competitors               → anunciantes verificados, activos ahora
3. get_brand_ads(brandId, sortBy: longevity)  ← el paso que importa
4. research_tiktok_ads            → si el bloque tiene slots de TikTok
5. search_ads                     → si se busca un ángulo puntual
```

**Trampa crítica — dos IDs que no se mezclan:**
- `brandId` = UUID → lo usan `get_brand_ads`, `get_brand_stats`, `search_ads`
- `pageId` = numérico → **solo** `add_brand`

**Regla propia de Creative:** se lee por `sortBy: longevity`, **nunca por engagement**. Un ad con
mucho engagement y poca antigüedad es un test, no un ganador.

**Frontera:** 🛑 `launch_*` y `update_budget` están en `deny` para todo el repo. La compra y
optimización de pauta es de ⑧B Ads.

### 🟣 Eden — outliers y bóveda

```
1. eden_search_social_content     → por tema, pilar o formato
2. eden_resolve_creator           → resolver handles antes de analizar
3. eden_analyze_creator           → LA BASE del creador  ← el paso que más se saltea
4. eden_study_top_titles / eden_study_top_carousels
5. eden_read_social_post          → diseccionar
6. eden_create_board              → archivar  ⚠️ requiere gate
```

**El paso 3 es obligatorio.** Sin la base del creador no se puede saber si una pieza es outlier — y
sin eso, la referencia entró por gusto.

**Reglas propias:** si `eden_resolve_creator` devuelve ambiguo, **se pregunta cuál**. Cero
resultados describe **solo esos términos y filtros**, nunca *"no hay contenido de esto"*. Un error o
timeout **no es** un cero.

**Frontera:** 🛑 `eden_publish_post_now` y `eden_schedule_post` en `deny`. Creative no publica.

### 🟡 Firecrawl — lenguaje literal y objeciones

Las páginas de venta de los competidores son la ingeniería inversa de sus objeciones: **el orden de
los argumentos revela qué objeción consideran más grave**. Y las reviews negativas dan el **problema
interno** del arco, escrito con las palabras del comprador.

- `firecrawl_search` → reviews, comentarios, prensa
- `WebFetch` → cuando ya se tiene la URL exacta

**Nota:** ② Estrategia ya construyó el mapa de objeciones. Firecrawl se usa para **el hueco**: la
objeción específica del formato o del ángulo de este bloque.

### 🟢 El pipeline local — no es un MCP, y es el que lee la imagen

`toolkit/leer-video.py` no consulta nada: convierte un archivo de video en una hoja de contacto, un
ritmo, un OCR por plano y una paleta. Es lo que hace que Creative pueda leer **ambientación, luz,
encuadre y ritmo** — nada de eso viene de un MCP.

→ Protocolo en `toolkit/09-lectura-de-video.md` · skill `cr-lectura-de-video`.

---

## ⑥ Secuencia estándar de la Capa 1

```
0.  Leer la tabla 15×7 de ② Estrategia        → qué ya está resuelto
0b. Leer el banco de hooks propio del ciclo anterior → los ganadores propios primero
0c. Buscar fichas-de-referencia ya existentes  → lo leído no se relee
1.  Calcular el HUECO                          → qué formato/canal/hook falta
2.  AdWhispr  find_competitors + get_brand_ads(longevity)
3.  AdWhispr  research_tiktok_ads              → si hay slots de TikTok
4.  Eden      search → resolve_creator → analyze_creator   → OUTLIERS reales
5.  Eden      study_top_titles / study_top_carousels
6.  LEER las que pasaron el filtro             → pipeline local si hay que leer la imagen
7.  Firecrawl landings + reviews               → objeciones y lenguaje literal
8.  Diseccionar en los 7 elementos → marcar 🟢/🟡/⚪ y ⏱️ → clasificar en 70/20/10
9.  Cruzar contra el MAPA DE SATURACIÓN        → descartar defaults
10. (con gate) archivar la bóveda
```

**Si un MCP no está disponible:** se declara en el output —
`⚠️ SIN [MCP] — [qué evidencia falta y qué confianza pierde el concepto]` — y se sigue con el resto.
**Nunca se rellena el hueco con inferencia presentada como dato.**

---

## ⑦ Regla de escritura y acciones con efecto

| Acción | Requisito |
|---|---|
| Buscar, leer, analizar, diseccionar, correr el pipeline de video | Libre |
| Guardar en board, crear página de Notion, crear registro | Decir qué y dónde antes de hacerlo |
| Exportar el Excel a Drive / Sheets | **Post-GATE 3** y sin filas `PENDIENTE` |
| Publicar, programar, pautar, gastar | 🛑 **No lo hace Creative. Nunca** |
| Borrar o sobrescribir un aprobado | 🛑 **Gate humano explícito. Sin excepción** |

---

## ⑧ Registro

Todo entregable que use MCPs cierra con:

```markdown
---
**Fuentes y herramientas**
- MCPs usados: [lista]
- MCPs no disponibles: [lista] → evidencia faltante: [qué]
- Videos leídos: [n] → por MCP: [n] · por pipeline: [n] · sin archivo: [n]
- Fecha del relevamiento: [fecha]
- Referencias con señal 🟢: [n] · 🟡: [n] · descartadas ⚪: [n]
- Reparto 70/20/10 del ciclo: [n / n / n]
- Confianza general: 🟢 alta / 🟡 parcial / 🔴 insuficiente para dirigir
```

**Por qué importa:** un swipe file sin fecha es un swipe file muerto. La longevidad de un ad se mide
al momento de la consulta, y un ganador de hace seis meses probablemente ya fatigó.
Refresco **semanal**.
