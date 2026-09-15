# Proceso Operativo — Agente de Diseño

Cómo se ejecuta un lote de punta a punta. Secuencial y con gates.
**Ninguna capa arranca sin el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Sistema visual: [✅ aprobado / ⬜ no existe] · Capa: [D0-D7]
Lote: [período · n piezas] · Sesión: [☁️ remota / 💻 local] · Figwright: [✅ conectado / ⬜ sin plugin]
Skills: [x] · MCPs: [Drive ✅/⬜ · Jockey ✅/⬜] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

🛑 **Si la capa es D5-D7 y la sesión es remota: BLOQUEADO.** Decílo en una línea y ofrecé entregar
la especificación construible para que una sesión local la ejecute. Ver abajo.

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · no hay guía de
marca · no hay calendario creativo · falta el input mínimo de la capa · el pedido pisa otro
departamento.


---

## Dónde corre cada capa — remoto vs local

**Figwright es local por diseño.** El plugin API de Figma solo existe dentro de Figma, y la cadena
entera vive en **una sola máquina**:

```
Claude Code  →  @figwright/mcp  →  WebSocket 127.0.0.1:3055  →  plugin  →  canvas
└──────────────────────── todo en la MISMA máquina ────────────────────────┘
```

Una sesión en la nube (Buzz / Claude Code web) corre el servidor **en su contenedor**, mientras el
plugin busca `127.0.0.1:3055` **en la laptop**. Nunca conectan. El panel del plugin queda en
`Reconnecting` y `ping` devuelve `hop: "server-only"` con `plugin: null`.

🛑 **No se arregla con configuración ni con un túnel** — el relay rechaza a propósito todo lo que no
sea loopback.

| Capas | Sesión | Por qué |
|---|---|---|
| **D0-D4** · sistema visual, lote, briefs, composición, ruta visual | ☁️ **cualquiera**, incluida Buzz | Es trabajo de criterio y archivos del repo |
| **D5-D6** · construir y adaptar en Figma | 💻 **local**, con Figma abierto | Necesita Figwright conectado |
| **D7** · QA y export | 💻 **local** | Los exports se escriben en el disco de esa máquina |

### El repo es el puente
```
☁️  Buzz    →  D0-D4  →  commit de sistema-visual.md · lote-de-piezas.csv · briefs/ · ruta-visual.md
💻  Local   →  git pull  →  D5-D7  →  export  →  Drive
```

Sin Figwright conectado, D5 **no falla**: entrega la especificación construible y la marca
`BLOQUEADO — construcción manual pendiente`. Eso es lo que hace que el split funcione.

---

## Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Diseñá las piezas de [cliente] de [mes]"* | **Completo** — D0 → D7, con 3 gates |
| *"Armá el sistema visual de [cliente]"* | **Solo D0** — entrega `sistema-visual.md` |
| *"Leé el calendario de [cliente]"* | **Solo D1** — entrega `lote-de-piezas.csv` |
| *"Diseñá esta pieza"* (una sola) | **D2 → D7** — requiere D0 hecho |
| *"Adaptá estas piezas a story"* | **Solo D6** — requiere piezas maestras existentes |
| *"Armá el carrusel seamless de X"* | **D2 → D6** — técnica del lienzo largo |
| *"Revisá estas piezas"* | **Solo D7** — corre QA sobre material existente |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
clients/<cliente>/
├── _INPUTS/
│   ├── guia-de-marca/       # de Branding
│   ├── contenido/           # copies, titulares, CTAs
│   ├── calendario/          # el Excel/CSV de Creative — el plan de ejecución
│   ├── fotos/
│   │   ├── originales/
│   │   └── recortes/
│   └── assets/
│       ├── ilustraciones/ · texturas/ · pinceladas/ · fuentes/
│       ├── animados/        # exports de VisuHaus
│       └── generados/       # todo lo marcado [asset generado]
├── sistema-visual.md
├── lote-de-piezas.csv
├── briefs/<id_pieza>.md
├── ruta-visual.md
├── entrega.md
└── exports/
```
Copiar las plantillas de `templates/`. Antes de arrancar de cero: verificar si el cliente ya existe
en Notion, Drive o Inherent OS, y si Strategy produjo `posicionamiento.md` (de ahí salen los activos
distintivos de D0.6).

---

### ▸ Paso 2 — D0 · Sistema visual
**Input:** guía de marca + assets · **Skill:** `ds-sistema-visual`
**Output:** `sistema-visual.md` + página Figma `00 · Sistema`

> **Primero alimentás el contexto, después diseñás.** El sistema se construye y se lee antes de abrir
> una pieza.

Si la guía es incompleta: **documentá menos, no completes con gusto propio.** Marcá los huecos como
`⚠️ FUERA DE GUÍA` y proponé el faltante como **propuesta explícita**.

🚦 **GATE 1 — Aprobación del sistema visual.** Tokens, pares de contraste, escala tipográfica,
grillas y **componentes de pieza con su ficha** — antes de que se diseñe una sola pieza.

---

### ▸ Paso 3 — D1 · Lectura del lote creativo
**Input:** calendario creativo + contenido · **Skill:** `ds-brief-de-pieza`
**Output:** `lote-de-piezas.csv`

**No armás el lote: lo leés y lo validás contra el contrato con Creative.**

```
Canal · Formato · Goal · Texto en jerarquía  →  bloqueantes
Foto sugerida                                →  no bloqueante
```

Se declara el **mapeo de columnas** antes de procesar. Se reporta la cabecera del lote **antes** de
seguir.

🛑 Si más del 30% de las filas está bloqueado: **parar y devolver el lote a Creative.**

---

### ▸ Paso 4 — D2 · Briefs
**Input:** lote + sistema visual · **Skill:** `ds-brief-de-pieza`
**Output:** `briefs/<id_pieza>.md` — uno por pieza ejecutable

Media carilla. Campos 1-3 se **leen** de Creative; 4-8 los resuelve Diseño.
Si el brief creativo no es ejecutable, se marca `⚠️ OBSERVADO` con la propuesta — **no se cambia solo.**

---

### ▸ Paso 5 — D3-D4 · Composición y capas gráficas
**Input:** briefs · **Skills:** `ds-composicion` → `ds-elementos-graficos`
**Output:** `ruta-visual.md` + 1 pieza modelo por formato + la secuencia del feed

```
D3  Componer en GRIS → TEST MINIATURA · TEST GRIS · TEST ATENCIÓN
D4  Color + overlays (máx. 3 familias) → TEST SUSTRACCIÓN · ANTI-SLOP · SECUENCIA
```

Si falla un test de D3, **se vuelve a D2 y se cambia el componente.** No se arregla con overlays.

🚦 **GATE 2 — Aprobación de la ruta visual.** El gate más importante. Se aprueba **una pieza modelo
por formato + la secuencia del feed**, no las 40 piezas.

---

### ▸ Paso 6 — D5 · Construcción con Figwright
**Input:** ruta visual aprobada · **Skill:** `ds-figma` · **Playbook:** `playbooks/FIGWRIGHT-PLAYBOOK.md`
**Output:** archivo Figma con el lote

```
ping → (list_files + use_file si hay varios) → leer el entorno → construir bloque a bloque → screenshot
```

**Entender el entorno antes de construir.** Reusar gana a regenerar. Tokens, nunca literales.
Fuente real, nunca Inter.

⚠️ Sin Figwright conectado: especificación construible, marcada
`BLOQUEADO — construcción manual pendiente`.

---

### ▸ Paso 7 — D6 · Adaptación
**Input:** piezas maestras · **Skill:** `ds-adaptacion`
**Output:** cada pieza en sus formatos/canales

Recomponer, no escalar. Safe areas duras. Ritmo obligatorio en carruseles.
Seamless: lienzo largo → componente → recortes → exportar los **frames**, nunca el componente.

---

### ▸ Paso 8 — D7 · QA y entrega
**Input:** lote adaptado · **Skill:** `ds-qa-visual`
**Output:** `/exports` + `entrega.md`

QA en **4 pasadas** (sistema · pieza · miniatura · **secuencia**). Un ítem fallado **se corrige**.

🚦 **GATE 3 — Aprobación de la entrega.** Antes del handoff a Content / Media Buy / Production.

---

## Gates — resumen

| Gate | Qué se aprueba | Por qué existe |
|---|---|---|
| 🚦 1 · Sistema visual | Tokens, contraste, escala, grillas, componentes con ficha | Si el sistema está mal, las 40 piezas están mal |
| 🚦 2 · Ruta visual | 1 pieza modelo por formato + la secuencia del feed | Corregir 1 pieza cuesta 10 min; corregir 40 cuesta el lote |
| 🚦 3 · Entrega | Exports finales + handoff | Nada sale del departamento sin ojo humano |

**El agente propone; no cierra.** Y no publica, no programa y no pauta.

---

## Qué hacer cuando falta algo

| Falta | Qué hacés |
|---|---|
| **Goal** o **texto en jerarquía** en el calendario | 🛑 `BLOQUEADO` → **devolución a Creative** con la pregunta exacta. Nunca lo inventes |
| La dirección de Creative no entra en el formato | `⚠️ OBSERVADO` + tu propuesta. **No la cambies en silencio** |
| Guía de marca | 🛑 BLOQUEADO. Alternativa: D0 en **modo provisional**, todo marcado `⚠️ SISTEMA PROVISIONAL` |
| Una foto | 🟡 Resolvé tipográfica y marcá `⚠️ ASSET FALTANTE` |
| El calendario creativo | 🛑 BLOQUEADO. Sin plan de ejecución no hay diseño |
| Figwright | Especificación construible. Nunca declares la pieza hecha |
| Un asset gráfico | Proponelo pendiente de producción, o generalo marcado `[asset generado]` con gate |
| Un elemento animado | ⚠️ Verificá VisuHaus (plan Pro/Max + la alerta de plataforma). Si no, la pieza va estática |
