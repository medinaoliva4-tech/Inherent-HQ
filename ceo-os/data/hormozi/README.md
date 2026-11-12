# 🧠 Biblioteca de Hormozi (dato del OS)

> **Ya no es una skill.** Desde la reestructura de `agents/` (9 agentes, 31 skills) esta biblioteca vive en
> `ceo-os/data/hormozi/` como **dato del OS**: la empaqueta `ceo-os/scripts/snapshot.mjs` en `api/_data/fuentes.json` y
> la usan las citas de Estrategia (`api/_lib/estrategia.js`) y los marcos de Consulting. Las rutas citables son
> relativas a esta carpeta (`books/…`, `roadmap/…`, `sops/…`, `briefs/…`). Origen: `agents/01-strategy/brain/skills/hormozi-brain/`
> en el historial de git.

> **Fuente, no método.** esta carpeta guarda el material crudo y completo. Lo único agregado es
> metadata para ubicar (fuente, capítulo, página, timestamp). **Toda respuesta sale de ahí, nunca de memoria.**

```
data/hormozi/
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
alcance contratado no incluye se marca `FUERA DEL ALCANCE` y no entra al brief (ver `CLAUDE.md`: la oferta se trabaja en Brand Foundation y en la profundidad completa de Growth Partnership).

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

**3 · Las 3 preguntas** , cada respuesta respaldada con pasajes:
- `MUST BE TRUE` — **"What has to be true for you to be #1?"**
- `UNFAIR` — ¿qué tienen a su ventaja?
- `GO GET` — ¿qué hay que ir a buscar?

**4 · Brief por área.** Copiar la plantilla de `briefs/` (`marketing.md` · `creative.md` ·
`branding.md`). Cada recomendación lleva su pasaje literal y su referencia exacta.

---

## Cómo buscar

| Para encontrar… | Cómo |
|---|---|
| Un tema en todo el material | `rg -n -i "<término>" .` → abrir el archivo y leer el pasaje completo con su contexto |
| Una frase | El texto conserva los saltos de línea del PDF: buscar una palabra distintiva, o `rg -U -i "value\s+equation"` |
| La referencia de un pasaje | El marcador `[… | pág. PDF N]` o la línea `[HH:MM:SS]` más cercana **arriba** del pasaje |
| Lo que estaba en el pizarrón | `rg -n "FRAME \| STAGE 4" roadmap/` · las tablas: `rg -n "TO GRADUATE" roadmap/` |
| Diagramas e imágenes de los PDFs | `rg -n "\[IMAGEN \|" .` |

---

## Reglas de respuesta

- **Solo con base en esta carpeta.** Nunca de memoria. Si no está: «No está en el material».
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
