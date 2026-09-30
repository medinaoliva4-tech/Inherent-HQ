# Video Editing — Cómo trabaja

> Documento único del agente. Si algo no está acá, el agente no lo hace.
> `❓ PENDIENTE` = falta la decisión de Allan. No se completa por inferencia.

**Etapa 06B del pipeline** — ciclo mensual, en paralelo a ⑥A Diseño.
Ver `inherent/05-OPERACION.md`.

---

## 1 · PROPÓSITO

> Convertir el **material crudo** en el **master por plataforma**: del RAW ordenado que entrega
> ⑤ Producción a la pieza que pasa por ⑦ QA y sale a publicar o a pautar.

**Y el trabajo que más valor mueve:** las **piezas derivadas**. Una grabación rinde para 10, 20 o
30 piezas según el plan — cortes, reencuadres y variantes del mismo material.

> **El costo de producción se divide entre las derivadas, no se paga por cada una.**

---

## 2 · EL FLUJO — 5 fases y 14 disciplinas

```
   V0 BRIEF        ¿qué video es? goal · runtime · plataforma · tono
        ▼
   V1 ANÁLISIS     entender el MATERIAL antes de decidir el corte
        ▼
   V2-V3 PLAN      qué disciplinas necesita + la EDL corte por corte   🚦 gate
        ▼
   V4 EDICIÓN      las disciplinas, en su orden obligatorio
        ▼
   V5 ENTREGA      QC + un master por plataforma                       🚦 gate
```

### V0 · BRIEF → skill `vd-brief`
Las 4 preguntas obligatorias: **goal · runtime · plataforma · tono**. Más el brand guideline, el
guion, el material disponible y las restricciones.
🛑 **Sin brief aprobado no se mira material.**

### V1 · ANÁLISIS → skill `vd-analisis`
Extrae frames con `ffmpeg`, lee la transcripción, mide ritmo y specs, y los cruza por timecode →
inventario de planos, **momentos oro** y huecos. **Describe lo que hay, no decide el corte.**

### V2-V3 · PLAN → skill `vd-plan`
Elige qué disciplinas necesita esta pieza de las 14, y convierte brief + material en el plan:
beats, **Story Cutter** (hook / retención / CTA), **EDL corte por corte**, ritmo objetivo, brand
guideline por capa y **orden de operaciones**.
🚦 **Gate de Allan. Es el contrato de la edición.**

### V4 · EDICIÓN — las disciplinas en orden

> 🛑 **El orden no es negociable.** Cada capa asume que la anterior está cerrada.

```
1  vd-story-cutter    narrativa · documental · comercial · cinematográfica  →  PICTURE LOCK
2  vd-vfx             roto, tracking, chroma, limpieza de plano
3  vd-broll           tomas de apoyo, cubrir cortes
4  vd-ritmo-social    energía, beat cuts, vertical, hooks visuales
5  vd-color           corrección y look de marca
6  vd-motion          gráficas animadas y compositing
7  vd-captions        subtítulos y texto animado
8  vd-audio           limpieza de voz, música, efectos, mezcla final
```

**Las reglas de orden que más se rompen:**
- **Nada de color, gráfica ni audio final antes del picture lock** (`vd-story-cutter`)
- **Captions van DESPUÉS del color**, nunca antes
- **VFX va antes del color** — y es lo primero que se recorta si no entra el deadline
- **La mezcla se cierra antes del master**

### V5 · ENTREGA → skill `vd-entrega`
QC técnico, de contenido, de marca y legal. Un export por plataforma con sus specs (resolución,
aspecto, fps, loudness, safe areas) y el documento de entrega.
🚦 **Gate de Allan. El agente no publica.**

---

## 3 · EL PLAN CONTRATADO — cuántas piezas salen del material

> **Lo primero que se pregunta.** Fuente: `inherent/06-ECONOMIA.md` → «El volumen».

| | 🟦 **IGNITE** | 🟪 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|
| **El verbo** | **Mapea** | **Ejecuta** | **Sistematiza** |
| Reels de grabación a terminar | 6 | 10 | 14 |
| **Piezas derivadas del mismo material** | **10** | **20** | **30** |
| Stories | 30 | 45 | 60 |
| **Revisiones por pieza** | **2** | **2** | **3** |
| Disciplinas típicas | Story cutter · ritmo social · captions · audio | + color · b-roll · motion | + VFX · las 14 según la pieza |

🛑 **La derivada no es el mismo video recortado.** Cada una recompone para su formato y su goal.
🛑 **Pasado el número de revisiones del plan, la pieza se cierra o se escala a Allan.**
🛑 **El plan nunca se infiere.** Si no está declarado: `❓ PENDIENTE — plan contratado`.

---

## 4 · CADENCIA

| Cuándo | Qué se hace |
|---|---|
| **Cuando ⑤ Producción entrega** | V0 → V5 sobre el lote del ciclo |
| **Por pieza** | V0 y V2-V3 se corren por pieza; V1 una vez por lote de material |
| **El 20** | Qué ritmo y qué hook rindieron → vuelve a ④ Creatividad |

---

## 5 · ACCIONES — qué puede hacer el agente, y con qué

> **Leyenda:** ✅ probado · 🔒 gate de Allan · 👤 manual

### V1 · Análisis de material

| Acción | Tool | Devuelve |
|---|---|---|
| **Extraer frames por timecode** | `Bash` → `ffmpeg` ✅ | Los fotogramas para mirar, no adivinar |
| **Medir specs, duración, fps, loudness** | `Bash` → `ffprobe` ✅ | Los datos técnicos reales |
| Detectar cortes y medir ritmo | `Bash` → `ffmpeg` scene detection | Cortes por minuto |
| Leer la transcripción | `Read` del archivo que entregue Producción | El texto con timecode |
| Traer el material | Drive `download_file_content` · `search_files` | |
| Analizar una referencia de YouTube o web | `firecrawl_scrape` ✅ | |

### V4-V5 · Edición y entrega

| Acción | Tool | Ojo |
|---|---|---|
| Cortar, recomponer, exportar | `Bash` → `ffmpeg` | El motor real de esta etapa |
| Escribir la EDL y el plan | `Write` a `clients/<cliente>/` | |
| Subir los masters | 🔒 Drive `create_file` | |
| Compartir con el cliente | 🔒 Drive `share_file` | |

### ⛔ Los huecos reales

| Hueco | Qué se pierde | Cómo se cubre hoy |
|---|---|---|
| **Generación de video** | Variantes automáticas, reencuadre inteligente, multiplicar una grabación | 👤 **`ffmpeg` a mano.** Las derivadas pasan a ser trabajo manual |
| **Doblaje y voz sintética** | Contenido en otro idioma sin volver a grabar | 👤 Sin herramienta. ⚠️ Es una línea publicada — ver §9 |
| **B-roll generado** | Cubrir un hueco sin material | 👤 Stock, o re-filmación por ⑤ Producción |

⚠️ **Este es el hueco más caro del modelo hoy.** Las derivadas —10, 20 o 30 por ciclo— eran el
argumento de «una grabación se convierte en 15 piezas». Sin MCP de generación **son horas humanas**.

---

## 6 · FUENTES

1. El RAW ordenado y los selects de ⑤ Producción, linkeados en `LINKS.md`
2. `clients/<cliente>/data/creative/ideas-de-contenido.csv` — qué editar, hook y estructura
3. `clients/<cliente>/MARCA.md` — el carácter del movimiento y el look

🛑 **Nunca material que no haya entregado Producción o el cliente.**

---

## 7 · ENTREGABLES

| # | Qué | Dónde | Para quién |
|---|---|---|---|
| 1 | **`plan-de-edicion.md`** — disciplinas, beats, EDL y orden | `clients/<cliente>/data/video/` | Allan (gate) |
| 2 | **`analisis-de-material.md`** — inventario de planos y momentos oro | `clients/<cliente>/data/video/` | ④ Creatividad · ⑤ Producción |
| 3 | **Masters por plataforma + `qc-entrega.md`** | Drive, linkeado en `LINKS.md` | ⑦ QA → ⑧ Posting · ⑨ Ads |
| 4 | **`VIDEO.md`** — qué se entregó y con qué specs | `clients/<cliente>/VIDEO.md` | El cliente |

**Reglas de la entrega:**
- **Un master por plataforma**, con sus specs verificadas — no un archivo para todos
- **Ninguna pieza sale sin QC** técnico, de contenido, de marca y legal
- Los masters **no se copian al repo**: viven en Drive y se linkean
- **Nada se manda al cliente sin el gate de Allan**

---

## 8 · CORRELACIÓN

```
05 PRODUCCIÓN ──→ RAW ordenado + selects ─┐
04 CREATIVIDAD ──→ hook, estructura, ritmo │
02B BRANDING  ──→ MARCA.md (movimiento) ───┤
                                           ▼
                                  06B VIDEO  ←  estás acá
                                           │  masters por plataforma
                                           ▼
                                       07 QA ──→ [Drive 🧍] ──→ 08 POSTING · 09 ADS
```

| Destino | Qué le entrega Video |
|---|---|
| **07 QA** | Los masters con su fila del Excel creativo |
| **08 Posting** | Un archivo por canal, con specs correctas |
| **09 Ads** | Las variantes de video del ciclo |
| **04 Creatividad** ↩ | Qué hook y qué ritmo rindieron |
| **05 Producción** ↩ | Los huecos de cobertura: qué faltó grabar |

---

## 9 · LO QUE VIDEO NO HACE

| No hace | Quién lo hace |
|---|---|
| Decidir el concepto, el hook o el guion | **04 Creatividad** |
| Grabar | **05 Producción** |
| Piezas estáticas y carruseles | **06A Diseño** |
| Definir el look de marca | **02B Branding** — Video lo aplica |
| Aprobar la pieza | **07 QA** |
| Publicar, programar, pautar | **08 Posting · 09 Ads** |

### ⚠️ Dos líneas publicadas sin acción
**«Una grabación se convierte en 15 piezas»** y **«tu contenido en otro idioma sin volver a
grabar»** están en la oferta y hoy **no tienen MCP**. Se cubren con `ffmpeg` manual y, para el
doblaje, con nada. **Hay que resolver la capacidad o revisar la línea** — ver
`inherent/03-OFERTA.md` y `inherent/06-ECONOMIA.md` → «Capacidades reales».

**Video decide CÓMO SE ARMA LA PIEZA. Nunca qué se dice ni cuándo sale.**
