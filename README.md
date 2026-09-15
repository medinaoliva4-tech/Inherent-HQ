# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

📄 **[`DEPARTAMENTOS.md`](DEPARTAMENTOS.md) es la fuente de verdad del alcance de cada departamento.**
Si el método de un agente y esa especificación no coinciden, manda la especificación.

## Qué hay hoy

**7 departamentos operativos.** Cada uno vive en `agents/<nombre>/` y se activa con las skills de
`.claude/skills/`.

| Departamento | Carpeta | Skills | Qué entrega |
|---|---|---|---|
| ①② **Estrategia** | `agents/strategy/` | `estrategia` + 8 `st-*` | Núcleo, evidencia, posicionamiento, sistema de contenido, calendario macro |
| ②B **Branding** | `agents/branding/` | `branding` + 6 `br-*` | Auditoría visual, plataforma de marca, tono de voz, dirección visual, **la guía de marca aplicable** |
| ③ **Marketing** | `agents/marketing/` | `marketing` + 7 `mk-*` | Research comercial, plan, campañas, calendario comercial, volumen y presupuesto |
| ④ **Creatividad** | `agents/creative/` | `creatividad` + 8 `cr-*` | Swipe file, big idea, storytelling, hook, copy, dirección de arte, el Excel de ideas |
| ⑤ **Producción** | `agents/production/` | `produccion` + 8 `pr-*` | Desglose, jornadas, recursos, presupuesto, call sheets, entrega del material |
| ⑥A **Diseño gráfico** | `agents/design/` | `diseno` + 7 `ds-*` | Sistema visual, briefs, composición, piezas en Figma, exports listos para publicar |
| ⑥B **Video Editing** | `agents/video/` | `video` + 13 `vd-*` | Del material crudo al master por plataforma |

### Agente de Estrategia

Construye una estrategia de posicionamiento y crecimiento completa por ingeniería inversa conectada
con media, adaptada al tipo de empresa del cliente.

```
agents/strategy/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── METHOD.md                 # el método completo — 8 capas
├── PROCESS.md                # el proceso operativo paso a paso, con gates
├── archetypes/               # 8 ejes + 11 arquetipos de empresa
├── playbooks/                # ingeniería inversa, MCPs y buenas prácticas
├── templates/                # los 6 entregables canónicos
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # cómo se encadenan los entregables
├── qa/                       # gates de calidad
└── clients/                  # un cliente = una carpeta
```

### Agente de Branding

**Define cómo debe sentirse, verse y comunicarse la marca.** Recibe el posicionamiento aprobado y
entrega `guia-aplicable.md` — el documento que consumen ⑥A Diseño, ⑤ Producción, ④ Creatividad y
⑦ Posting. *Branding entrega dirección; ⑥A Diseño entrega realidad.*

```
agents/branding/
├── AGENT.md                  # quién es el agente, qué entrega, el límite con ⑥A Diseño
├── METHOD.md                 # el método completo — 7 capas B0-B6
├── PROCESS.md                # el proceso operativo, con 3 gates y modo degradado
├── playbooks/                # modos de marca · color · tipografía · estética · auditoría · MCPs
├── templates/                # los 7 entregables canónicos
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # cómo se encadenan los entregables
├── qa/                       # gates de calidad
└── clients/                  # un cliente = una carpeta
```

| # | Entregable | Capa |
|---|---|---|
| 1 | `auditoria-de-marca.md` | B1 · Auditoría y saturación visual |
| 2 | `plataforma-de-marca.md` | B2 · Concepto y personalidad 🚦 |
| 3 | `tono-de-voz.md` | B3 · Sistema verbal |
| 4 | `direccion-visual.md` | B4 · Dirección visual 🚦 |
| 5 | `lenguaje-visual.md` | B5 · Lenguaje visual |
| 6 | `reglas-de-marca.md` | B6 · Reglas y gobernanza |
| 7 | **`guia-aplicable.md`** | Consolidado 🚦 — **⑥A Diseño corre D0 Modo A con esto** |

**Las dos reglas del departamento:**
1. **El concepto va antes que la forma.** Sin plataforma de marca no hay paleta.
2. **Prueba del logo tapado.** La pregunta nunca es *¿es bonito?* sino *¿se reconoce sin el logo?*

**El límite con ⑥A Diseño:** Branding fija la paleta base, las familias tipográficas, el logo, la
estética y el tratamiento fotográfico. Diseño resuelve escalas, grillas, márgenes, safe areas,
scrims, tokens y layout. *¿La decisión vale igual en una story, un cartel y un packaging? Es de
Branding. ¿Cambia según el formato? Es de Diseño.*

---

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural:

- *"Armá la estrategia de [cliente]"* → corre el método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1, ingeniería inversa
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7
- *"Armá el branding / la guía de marca de [cliente]"* → Branding, B0 a B6
- *"Auditá cómo se ve la competencia de [cliente]"* → Branding, B1
- *"Definí el tono de voz de [cliente]"* → Branding, B3
- *"Armá el plan de marketing de [cliente]"* → Marketing, fase M0
- *"Dame conceptos para [cliente]"* → Creatividad, Capa 2
- *"Cuánto cuesta producir este calendario"* → Producción, Capa 4
- *"Diseñá las piezas de [cliente] de [mes]"* → Diseño, D0 a D7
- *"Editá este reel"* → Video, fase 0

Las skills de `.claude/skills/` se activan solas según el pedido.

## Entregables del agente de Estrategia

| # | Archivo | Capa |
|---|---|---|
| 1 | `nucleo.md` | 0 · Foundation |
| 2 | `ingenieria-inversa.md` | 1 · Evidencia |
| 3 | `posicionamiento.md` | 2-4 · Verdades, decisión y territorio |
| 4 | `estrategia-de-contenido.md` | 5-6 · Movimiento y sistema |
| 5 | `contenido-por-canal.md` | 6 · Rol de cada canal |
| 6 | `calendario-estrategico.csv` | 7 · Distribución y cadencia |

Plus `medicion.md` (Capa 8) cuando hay datos disponibles.

---

### Agente de Creatividad

**Traduce intención a idea.** Convierte el plan de campañas aprobado en ideas concretas y dirigidas,
listas para que otro las ejecute sin adivinar nada. *Creatividad dirige; Producción, Diseño y Posting
ejecutan.*

```
agents/creative/
├── AGENT.md                  # quién es el agente, qué recibe, qué no hace
├── METHOD.md                 # el método completo — 8 capas
├── PROCESS.md                # el proceso operativo paso a paso, con gates
├── toolkit/                  # 8 taxonomías: técnicas, hooks, arco, CTAs, arte, tomas, canales, gráficos
├── playbooks/                # swipe file · traducción del slot a idea · 70/20/10 · MCPs
├── templates/                # los 7 entregables canónicos
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # qué columna del Excel viene de dónde
├── qa/                       # gates de calidad
└── clients/                  # un cliente = una carpeta
```

**Cómo se usa** — desde Buzz, en lenguaje natural:

- *"Armá las ideas de contenido de [cliente]"* → corre el método completo desde la Capa 0
- *"Buscá referencias de qué está funcionando en [formato]"* → Capa 1, swipe file
- *"Dame conceptos para [cliente]"* → Capas 2-3
- *"Escribí el hook y el copy de esta pieza"* → Capa 4
- *"Adaptalo a los otros canales y armá el Excel"* → Capa 6
- *"¿Qué funcionó el mes pasado?"* → Capa 7, el loop

**Entregables:**

| # | Archivo | Capa |
|---|---|---|
| 1 | `brief-creativo.md` | 0 · Brief |
| 2 | `swipe-file.md` | 1 · Referencia |
| 3 | `conceptos.md` | 2-3 · BIG IDEA e historia |
| 4 | `direccion-creativa.md` | 4-5 · Gancho, palabra y forma |
| 5 | `adaptacion-por-canal.md` | 6 · Specs por canal |
| 6 | **`ideas-de-contenido.csv`** | 6 · **el entregable definitivo** — 31 columnas |
| 7 | `aprendizaje-creativo.md` | 7 · Loop |

**Requiere plan aprobado.** Sin el posicionamiento de ② Estrategia y el plan de campañas y calendario
de ③ Marketing, Creative bloquea: idear sin brief es inventar audiencia y pilares.

**Regla 70/20/10.** Cada ciclo se reparte en 70 % patrón ya probado afuera (Meta Ad Library, Meta
Spark), 20 % apuesta nueva propia y 10 % re-explotación de lo que ya nos funcionó. Se verifica sobre
el total de filas del ciclo. *(El primer ciclo de un cliente arranca en 80/20: todavía no hay
aprendizaje propio.)*

---

### Agente de Producción

**Hace que la idea exista.** Convierte el Excel de ideas aprobado en material real —fotos, videos y
assets base— dentro de un presupuesto y una agenda que él mismo construye. *Creatividad entrega la
intención; Producción resuelve la logística; ⑥A y ⑥B arman la pieza.*

```
agents/production/
├── AGENT.md                  # quién es el agente, qué recibe, qué no hace
├── METHOD.md                 # el método completo — 8 capas
├── PROCESS.md                # el proceso operativo paso a paso, con 3 gates
├── toolkit/                  # 7 taxonomías: desglose, locaciones, talento, equipo,
│                             #   cobertura, presupuesto, entrega
├── playbooks/                # consolidación · devoluciones a Creative · MCPs
├── templates/                # los 8 entregables canónicos
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # qué columna del Excel viene de dónde
├── qa/                       # gates de calidad
└── clients/                  # un cliente = una carpeta
```

**Cómo se usa** — desde Buzz, en lenguaje natural:

- *"Armá la producción de [cliente]"* → corre el método completo desde la Capa 0
- *"¿Qué hace falta para grabar esto?"* → Capas 0-1, el desglose
- *"¿En cuántos días se graba?"* → Capa 2, la consolidación
- *"¿Cuánto cuesta?"* → Capas 3-4, recursos y presupuesto
- *"Armá el call sheet de la jornada 2"* → Capa 5
- *"Cerrá la entrega"* → Capa 6
- *"¿Cómo nos fue con el presupuesto?"* → Capa 7, el loop

**Entregables:**

| # | Archivo | Capa |
|---|---|---|
| 1 | `brief-de-produccion.md` | 0 · Qué se aprobó producir |
| 2 | `desglose.md` | 1 · Las 8 categorías por escena |
| 3 | `plan-de-jornadas.md` | 2 · Agrupación y factor |
| 4 | `recursos.md` | 3 · Origen, responsable, riesgo y plan B |
| 5 | **`plan-de-produccion.csv`** | 1-4 · **el entregable definitivo** — 29 columnas |
| 6 | `call-sheets/jornada-N.md` | 5 · Uno por jornada |
| 7 | `entrega.md` | 6 · El manifiesto cruzado |
| 8 | `aprendizaje-de-produccion.md` | 7 · Desvíos reales |

**Dos cosas que definen el método:**

**Una fila = una escena, no una pieza.** Una pieza de Creatividad con 3 escenas son 3 filas acá,
porque la escena es la unidad que se agrupa, se cuesta y se graba. Es lo que permite ver que dos
piezas distintas comparten locación y talento.

**La consolidación va antes del presupuesto.** Lo caro de una producción no son las tomas: son los
montajes. Agrupar las escenas por locación, talento, setup de luz y producto puede convertir 12
jornadas en 4, con el mismo contenido. Por eso el agente **se niega a presupuestar sin consolidar**,
aunque se lo pidan directo.

**Requiere el Excel creativo aprobado.** Sin el Gate 3 de Creatividad, Producción bloquea: desglosar
ideas que todavía pueden cambiar es gastar el trabajo —y la plata— dos veces.

---

## Cómo se conectan

El flujo completo de Inherent tiene **8 departamentos**:

```
① Comprensión → ② Estrategia → ③ Marketing → ④ Creatividad → ⑤ Producción →  ⑥A Diseño  → ⑦ Posting → ⑧B Ads
                      ↓                ↑                                    ⑥B Video ↗
                 ②B Branding ──────────┘
```

Los que ya están construidos:

```
①②   (hoy agents/strategy/)   →  posicionamiento · evidencia · plan de campañas · calendario
            ↓  territorio · enemigo · promesa · activos distintivos
②B Branding                   →  guia-aplicable.md  (dirección, color, tipografía, foto, activos)
            ↓  slots · pilares y mix · frecuencia · función y temperatura por canal
④ Creatividad                 →  brief completo por pieza
            ↓  ideas-de-contenido.csv — concepto · emoción · hook · copy · guion · escenas ·
            ↓  encuadres · duraciones · elementos gráficos a pedir
⑤ Producción                  →  material base entregado y nombrado
            ↓  plan-de-produccion.csv + RAW ordenado + selects marcados
⑥A Diseño (estático) · ⑥B Video (montaje y masters)  →  arman la pieza
            ↓
⑦ Posting / ⑧B Ads            →  publican y pautan
```

Cada agente declara **su punto de corte** y **qué no hace, y de quién es**. Tres reglas los sostienen:

1. Lo que produce otro departamento se **cita con su ruta, nunca se reescribe ni se edita**.
2. **La intención no se cambia aguas abajo: se devuelve**, con motivo y al menos dos alternativas.
3. Nada se compromete afuera —publicar, reservar, convocar, comprar— **antes de su gate humano**.

> 🔄 **Transición.** Hoy `agents/strategy/` cubre ①, ② y ③ juntos. Creatividad y Producción ya están
> escritos contra los departamentos separados, con el mapeo capa→departamento centralizado en
> `agents/creative/CORRELACION.md ⓪.1`. Cuando se separen, cambian **las rutas**, no los métodos.

## Estado

| # | Departamento | Carpeta | Estado |
|---|---|---|---|
| ① | Comprensión | `agents/strategy/` Capa 0 | 🟡 Dentro de Strategy |
| ② | Estrategia | `agents/strategy/` Capas 1-4 | 🟡 Dentro de Strategy |
| ②B | **Branding** | `agents/branding/` | ✅ Operativo |
| ③ | **Marketing** | `agents/marketing/` | ✅ Operativo |
| ④ | **Creatividad** | `agents/creative/` | ✅ Operativo |
| ⑤ | **Producción** | `agents/production/` | ✅ Operativo |
| ⑥A | **Diseño gráfico** | `agents/design/` | 🟡 Listo, sin estrenar |
| ⑥B | **Video Editing** | `agents/video/` | ✅ Operativo |
| 🧍 | *Organizar contenido en Drive* | — | **paso humano, no se automatiza** |
| ⑦ | Posting | — | ⬜ Pendiente |
| ⑧B | Ads | — | ⬜ Pendiente |
| ⑨ | Community management | — | ⬜ Pendiente |

### Fronteras resueltas

`DEPARTAMENTOS.md` cierra tres, y la integración de Branding cierra la cuarta:

- **El layout es de ⑥A Diseño.** Creative especifica *qué* elementos gráficos pedir y el concepto;
  Diseño resuelve composición, jerarquía visual, layout, tipografía, color y contraste.
- **La frecuencia de contenido es de ③ Marketing** — cuántos reels, historias y carruseles diarios
  por campaña.
- **No existe ⑧A Orgánico.** Lo orgánico vive dentro de ③ Marketing; la conversación es
  **⑨ Community management**.
- **②B Branding entrega dirección; ⑥A Diseño entrega realidad.** Branding fija paleta base,
  familias tipográficas, logo, estética y tratamiento fotográfico. Diseño resuelve escalas, grillas,
  márgenes, safe areas, scrims, tokens y layout. Con Branding integrado, **Diseño corre en D0 Modo A**
  (traducción) en vez de Modo B (construcción).

### Lo que queda abierto

1. **Strategy todavía carga las Capas 5-8** (sistema de contenido, calendario macro, medición), que
   según la especificación son de ③ Marketing y ④ Creatividad.
2. **Medición / aprendizaje de negocio**: ningún departamento cierra el círculo hacia ① y ②.
3. **⑦ Posting, ⑧B Ads y ⑨ Community** todavía no tienen agente.

### Ramas sin integrar

| Rama | Trae | Estado |
|---|---|---|
| `claude/sharp-ride-4lo8a0` (`PR #2`) | Skill `presentacion` **+ recorte de Strategy de 9 capas a 5**, quitando `st-calendario-macro`, `st-medicion` y `st-sistema-contenido` | **Ahora alineado con la especificación**: esas capas son de ③ Marketing y ④ Creatividad. Requiere verificar que Marketing y Creatividad las absorban por completo antes de mergear |
