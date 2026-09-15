# Proceso Operativo — Agente de Diseño

Cómo se ejecuta un lote de punta a punta. Secuencial y con gates.
**Ninguna capa arranca sin el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Sistema visual: [✅ aprobado / ⬜ no existe] · Capa: [D0-D7]
Lote: [período · n piezas] · Figwright: [✅ plugin conectado / ⬜ sin plugin — según `ping`]
Skills: [x] · MCPs: [Drive ✅/⬜ · Jockey ✅/⬜] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

🛑 **El campo `Figwright` se llena con `ping`, no por deducción.** Si la capa es D5-D7 y `ping`
devuelve `plugin: null`: BLOQUEADO. Decílo en una línea y ofrecé entregar la especificación
construible para que una sesión con el plugin conectado la ejecute. Ver abajo.

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · no hay guía de
marca · no hay calendario creativo · falta el input mínimo de la capa · el pedido pisa otro
departamento.


---

## Dónde ejecuta la sesión

**Figwright es local por diseño.** El plugin API de Figma solo existe dentro de Figma, y la cadena
entera vive en **una sola máquina**:

```
Claude Code  →  @figwright/mcp  →  WebSocket 127.0.0.1:3055  →  plugin  →  canvas
└──────────────────────── todo en la MISMA máquina ────────────────────────┘
```

### La interfaz no es el lugar de ejecución

🛑 **No confundas desde dónde hablás con dónde corre la sesión.** Buzz es la interfaz: puede manejar
una sesión que ejecuta en la nube **o** una que ejecuta en el CLI de la máquina del diseñador.

| Dónde ejecuta la sesión | Figwright | Capas que puede correr |
|---|---|---|
| 💻 **En la máquina que tiene Figma abierto** (CLI local, manejado desde donde sea) | ✅ conecta | **D0-D7 completo** |
| ☁️ **En un contenedor remoto** | 🛑 nunca conecta | D0-D4 · y D5-D7 solo como especificación |

Cuando la sesión ejecuta en la nube, el servidor arranca **en su contenedor** mientras el plugin
busca `127.0.0.1:3055` **en la laptop**. El panel queda en `Reconnecting` y `ping` devuelve
`hop: "server-only"` con `plugin: null`.

🛑 **No se arregla con configuración ni con un túnel** — el relay rechaza a propósito todo lo que no
sea loopback.

### La regla: no lo asumas, corré `ping`

**Nunca deduzcas dónde ejecutás por la interfaz.** El único dato válido es la respuesta de `ping`:

```
plugin: {...}  → sesión local con plugin conectado  → D5-D7 corren normal
plugin: null   → sin plugin                          → D5-D7 salen como especificación
```

### Si tocó una sesión remota, el repo es el puente
```
☁️  Remota  →  D0-D4  →  commit de sistema-visual.md · lote-de-piezas.csv · briefs/ · ruta-visual.md
💻  Local   →  git pull  →  D5-D7  →  export  →  Drive
```

Sin Figwright conectado, D5 **no falla**: entrega la especificación construible y la marca
`BLOQUEADO — construcción manual pendiente`. Eso es lo que hace que el lote se pueda partir cuando
hace falta — **no que haya que partirlo siempre**.

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

### ▸ Paso 2 — D0 · Guía aplicable y sistema visual
**Input:** intel de marca + assets + `posicionamiento.md` si existe · **Skill:** `ds-sistema-visual`
**Output:** `guia-aplicable.md` *(Modo B)* + `sistema-visual.md` + página Figma `00 · Sistema`

> **Primero alimentás el contexto, después diseñás.** El sistema se construye y se lee antes de abrir
> una pieza.

**Elegí el modo primero:**

| Modo | Cuándo | Qué producís |
|---|---|---|
| **A · Traducción** | Existe manual de marca formal | `sistema-visual.md` |
| **B · Construcción** | Solo hay **intel** de Branding | `guia-aplicable.md` + `sistema-visual.md` |

🛑 **Lo único que no se inventa es la dirección** (cómo debe verse y cómo debe sentirse). Sin eso:
`BLOQUEADO`. Con intel — referencias, fuentes, material existente — **alcanza para construir**.

En Modo B todo sale como **propuesta**, con la sección obligatoria **"Qué decidió Diseño"**.

🚦 **GATE 1 — Aprobación.** En Modo A: tokens, contraste, escala, grillas y componentes.
En **Modo B es reforzado**: lo aprueba quien tenga la voz de la marca — el cliente, o Branding
cuando exista.

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
| Manual de marca formal | No bloquea: si hay **intel**, corré D0 en **Modo B** y construí `guia-aplicable.md` |
| La **dirección** (cómo debe verse y sentirse) | 🛑 BLOQUEADO. Es lo único que Branding tiene que poner sí o sí |
| Una foto | 🟡 Resolvé tipográfica y marcá `⚠️ ASSET FALTANTE` |
| El calendario creativo | 🛑 BLOQUEADO. Sin plan de ejecución no hay diseño |
| Figwright | Especificación construible. Nunca declares la pieza hecha |
| Un asset gráfico | Proponelo pendiente de producción, o generalo marcado `[asset generado]` con gate |
| Un elemento animado | ⚠️ Verificá VisuHaus (plan Pro/Max + la alerta de plataforma). Si no, la pieza va estática |
