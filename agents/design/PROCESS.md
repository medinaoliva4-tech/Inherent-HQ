# Proceso Operativo — Agente de Diseño

Cómo se ejecuta un lote de punta a punta. Secuencial y con gates.
**Ninguna capa arranca sin el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Sistema visual: [✅ aprobado / ⬜ no existe] · Capa: [D0-D7]
Lote: [período · n piezas] · Skills: [x] · MCPs: [Figma ✅/⬜ · Drive ✅/⬜]
Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · no hay guía de
marca · no hay calendario creativo · falta el input mínimo de la capa · el pedido pisa otro
departamento.

---

## Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Diseñá las piezas de [cliente] de [mes]"* | **Completo** — D0 → D7, con 3 gates |
| *"Armá el sistema visual de [cliente]"* | **Solo D0** — entrega `sistema-visual.md` |
| *"Leé el calendario de [cliente]"* | **Solo D1** — entrega `lote-de-piezas.csv` |
| *"Diseñá esta pieza"* (una sola) | **D2 → D7** — requiere D0 hecho |
| *"Adaptá estas piezas a story"* | **Solo D6** — requiere piezas maestras existentes |
| *"Revisá estas piezas"* | **Solo D7** — corre QA sobre material existente |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
clients/<cliente>/
├── _INPUTS/
│   ├── guia-de-marca/       # lo que mandó Branding
│   ├── contenido/           # copies, titulares, CTAs
│   ├── fotos/               # producción de Production
│   ├── assets/              # ilustraciones, PNGs, texturas, brochas
│   └── calendario/          # el Excel/CSV de Creative
├── sistema-visual.md
├── lote-de-piezas.csv
├── briefs/
│   └── <id_pieza>.md
├── ruta-visual.md
├── entrega.md
└── exports/
```
Copiar las plantillas de `templates/`. Antes de arrancar de cero, verificar si el cliente ya existe
en Notion, Drive o Inherent OS — y si Strategy ya produjo `posicionamiento.md` (de ahí salen los
activos distintivos de D0.6).

---

### ▸ Paso 2 — D0 · Sistema visual
**Input:** guía de marca + assets
**Skill:** `ds-sistema-visual`
**Output:** `sistema-visual.md` + página Figma `00 · Sistema`

Si la guía es incompleta: **documentá menos, no completes con gusto propio.** Marcá los huecos como
`⚠️ FUERA DE GUÍA` y proponé el faltante como **propuesta explícita**, no como hecho.

🚦 **GATE 1 — Aprobación del sistema visual.** Un humano confirma tokens, pares de contraste,
escala tipográfica y layouts base antes de que se diseñe una sola pieza.

---

### ▸ Paso 3 — D1 · Lectura del lote
**Input:** calendario creativo + carpeta de contenido
**Skill:** `ds-brief-de-pieza`
**Output:** `lote-de-piezas.csv`

Se declara el **mapeo de columnas** usado antes de procesar. Se reporta la cabecera del lote
(piezas / listas / bloqueadas / assets faltantes) **antes** de seguir.

🛑 Si más del 30% de las filas están bloqueadas: parar y pedir el material faltante. No tiene
sentido diseñar un lote incompleto.

---

### ▸ Paso 4 — D2 · Briefs
**Input:** lote + sistema visual
**Skill:** `ds-brief-de-pieza`
**Output:** `briefs/<id_pieza>.md` — uno por pieza no bloqueada

Media carilla por pieza, 7 campos. Si el mensaje único necesita dos oraciones, son dos piezas: se
marca y se consulta.

---

### ▸ Paso 5 — D3-D4 · Composición y capas gráficas
**Input:** briefs
**Skills:** `ds-composicion` → `ds-elementos-graficos`
**Output:** `ruta-visual.md` + 1 pieza modelo por formato

```
D3  Componer en GRIS → TEST MINIATURA + TEST GRIS
D4  Color + overlays (máx. 3 familias) → TEST DE SUSTRACCIÓN
```

Si falla el test de miniatura o el de gris, **se vuelve a D2 y se cambia el layout.** No se arregla
con overlays.

🚦 **GATE 2 — Aprobación de la ruta visual.** El gate más importante. Se aprueba **una pieza modelo
por formato**, no las 40. Todo lo que sigue se produce sobre esa ruta.

---

### ▸ Paso 6 — D5 · Construcción en Figma
**Input:** ruta visual aprobada
**Skill:** `ds-figma` · **Playbook:** `playbooks/FIGMA-PLAYBOOK.md`
**Output:** archivo Figma con el lote

Componentes antes que copias. Tokens, nunca literales. Se valida con screenshot **por sección**.

⚠️ Sin MCP de Figma: sale como especificación construible, marcada
`BLOQUEADO — construcción manual pendiente`.

---

### ▸ Paso 7 — D6 · Adaptación
**Input:** piezas maestras
**Skill:** `ds-adaptacion`
**Output:** cada pieza en sus formatos/canales

Recomponer, no escalar. Safe areas duras. Ritmo obligatorio en carruseles.

---

### ▸ Paso 8 — D7 · QA y entrega
**Input:** lote adaptado
**Skill:** `ds-qa-visual`
**Output:** `/exports` + `entrega.md`

QA en 3 pasadas (sistema · pieza · miniatura). Checklist completo en `qa/QA-GATES.md`.
Un ítem fallado **se corrige** — no se entrega marcado como "menor".

🚦 **GATE 3 — Aprobación de la entrega.** Antes del handoff a Content / Media Buy.

---

## Gates — resumen

| Gate | Qué se aprueba | Por qué existe |
|---|---|---|
| 🚦 1 · Sistema visual | Tokens, contraste, escala, grillas, layouts base | Si el sistema está mal, las 40 piezas están mal |
| 🚦 2 · Ruta visual | 1 pieza modelo por formato | Corregir 1 pieza cuesta 10 minutos; corregir 40 cuesta el lote |
| 🚦 3 · Entrega | Exports finales + handoff | Nada sale del departamento sin ojo humano |

**El agente propone; no cierra.** Y no publica ni pauta nunca.

---

## Qué hacer cuando falta algo

| Falta | Qué hacés |
|---|---|
| Guía de marca | 🛑 BLOQUEADO. Pedí la guía. Alternativa: correr D0 en **modo provisional** y marcar todo `⚠️ SISTEMA PROVISIONAL — sin aprobar por Branding` |
| Una foto | 🟡 Resolvé la pieza tipográfica y marcá `⚠️ ASSET FALTANTE` en el lote |
| Un copy | 🛑 `BLOQUEADO — sin contenido`. La pieza queda en el CSV, no se borra |
| El calendario | 🛑 BLOQUEADO. Sin lote no hay diseño |
| MCP de Figma | Entregá especificación construible. Nunca declares la pieza hecha |
| Un asset gráfico (textura, sticker) | Proponelo como **pendiente de producción** o generalo marcado `[asset generado]` con gate humano |
