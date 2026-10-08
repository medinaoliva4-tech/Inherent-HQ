---
name: hormozi-brain
description: >
  Cerebro consultable con el material de Alex Hormozi guardado COMPLETO y LITERAL: los libros
  ($100M Offers, $100M Leads, $100M Money Models, $100M Lost Chapters y capítulos sueltos), el
  $100M Scaling Roadmap (los videos por etapa transcritos con su pizarrón alineado por timestamp,
  más las guías PDF de cada etapa) y los 5 Scaling Frameworks SOPs de Acquisition.com. Úsala para
  diagnosticar en qué etapa está un negocio, encontrar qué dice Hormozi sobre cualquier tema (oferta,
  precio, leads, anuncios, contenido, upsells, retención, contratación, equipo, finanzas) y armar una
  estrategia o un brief por área respaldado con citas exactas. Se dispara con "¿qué dice Hormozi
  de…?", "¿en qué etapa está este negocio?", "arma la estrategia con el cerebro de Hormozi",
  "respalda esto con Hormozi", "/hormozi-brain".
---

# 🧠 Hormozi Brain

> **Fuente, no método.** `references/` guarda el material crudo y completo. Lo único agregado es
> metadata para ubicar (fuente, capítulo, página, timestamp). **Toda respuesta sale de ahí, nunca de memoria.**

```
references/
├── books/     texto completo · un archivo por capítulo · marcador por página PDF
├── roadmap/   un archivo por etapa: transcript + pizarrón, alineados por timestamp
│   └── guides/   las guías PDF del roadmap, una por etapa, con marcador por página
├── sops/      5 Scaling Frameworks · un archivo por framework
└── briefs/    plantillas de brief: marketing · creative · branding
```

**`INDEX.md` es el mapa:** qué archivo tiene qué capítulo, etapa, página o video.

---

## Workflow con un cliente

**0 · El techo.** Leer `clients/<cliente>/00-onboarding/plan-contratado.md`. Lo que el material recomienda y el
plan no incluye se marca `FUERA DEL PLAN` y no entra al brief (ver `CLAUDE.md`: solo Growth toca la oferta).

**1 · Diagnosticar la ETAPA** — máximo 3 preguntas:
1. ¿Cuánto factura al mes y desde cuándo vende?
2. ¿Cuántas personas trabajan, contando al dueño?
3. ¿Dónde se traba hoy: producto, marketing, ventas, servicio, IT, reclutamiento, RR. HH. o finanzas?

Con las respuestas se ubica la etapa contra las tablas de `roadmap/overview-las-10-etapas.md` y las
secciones «YOUR STAGE» de `roadmap/guides/` (HEADCOUNT · YOUR ROLE · CONSTRAINT · TO GRADUATE · BOTTOM LINE).
Se cita la fila que la ubica. Si no calza clara: se dice entre qué etapas está y qué dato falta.

**2 · Análisis de cliente y competencia.** La data del cliente (`clients/<cliente>/00-onboarding/` y `01-estrategia/`) contra el
material: el constraint de su etapa por función, y lo que dicen los libros del tema que lo traba.
Todo dato del cliente lleva evidencia o etiqueta: `[dice el cliente, sin verificar]` · `⚠️ SIN DATOS`.

**3 · Las 3 preguntas** (las mismas de la skill `analysis`), cada respuesta respaldada con pasajes:
- `MUST BE TRUE` — **"What has to be true for you to be #1?"**
- `UNFAIR` — ¿qué tienen a su ventaja?
- `GO GET` — ¿qué hay que ir a buscar?

**4 · Brief por área.** Copiar la plantilla de `references/briefs/` (`marketing.md` · `creative.md` ·
`branding.md`). Cada recomendación lleva su pasaje literal y su referencia exacta.

---

## Cómo buscar

| Para encontrar… | Cómo |
|---|---|
| Un tema en todo el material | `rg -n -i "<término>" references/` → abrir el archivo y leer el pasaje completo con su contexto |
| Una frase | El texto conserva los saltos de línea del PDF: buscar una palabra distintiva, o `rg -U -i "value\s+equation"` |
| La referencia de un pasaje | El marcador `[… | pág. PDF N]` o la línea `[HH:MM:SS]` más cercana **arriba** del pasaje |
| Lo que estaba en el pizarrón | `rg -n "FRAME \| STAGE 4" references/roadmap/` · las tablas: `rg -n "TO GRADUATE" references/roadmap/` |
| Diagramas e imágenes de los PDFs | `rg -n "\[IMAGEN \|" references/` |

---

## Reglas de respuesta

- **Solo con base en `references/`.** Nunca de memoria. Si no está: «No está en el material».
- **Buscar en el texto completo y leer el pasaje literal con su contexto antes de responder.**
- **Citar SIEMPRE la referencia exacta:**
  `[$100M OFFERS | 6. Value Offer: The Value Equation | pág. PDF 81]` ·
  `[ROADMAP VIDEO | STAGE 2: ADVERTISE | 00:02:47]` (+ frame `stage2_00-02-48.png` si es del pizarrón) ·
  `[100M SCALING ROADMAP PDF | Guía Stage 2: Advertise | Sección Stage 2: Advertise | pág. PDF 28]`
- **Al citar, pegar el pasaje literal** (en inglés, tal cual), no una paráfrasis. La explicación va aparte, en español.
- **Cruzar fuentes** cuando aplique: libro + video + guía.
- Los transcripts de video son **automáticos** (Whisper). Si una palabra clave suena rara, se contrasta con el pizarrón o el PDF.
- `[DESCRIPCIÓN DEL DIBUJO]` es una descripción del dibujo, **no texto de Hormozi**: no se cita como si lo fuera.
  Lo mismo para lo que esté en español entre paréntesis dentro de una «Recreación».
  Lo citable de una imagen es lo que está en «Texto en la imagen / en pantalla (literal)».
- **Cerrar SIEMPRE con un primer paso accionable para HOY.**
- Español, directo, sin relleno.

**Lo que no hace:** no guarda resúmenes ni «frameworks extraídos» en el repo (la síntesis vive solo
en la respuesta) y no reemplaza el `WORKFLOW.md` de ningún departamento: lo alimenta.
