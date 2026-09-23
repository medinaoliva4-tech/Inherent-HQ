# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

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

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural:

- *"Armá la estrategia de [cliente]"* → corre el método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1, ingeniería inversa
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7

Las skills se activan solas según el pedido. Cada departamento lleva las suyas adentro.

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
├── .claude-plugin/plugin.json  # lo vuelve un plugin cargable
├── WORKFLOW.md                 # cómo trabaja — lo único que hay que leer (377 líneas)
├── skills/                     # 11 skills, una carpeta cada una
│   ├── COMO-LAS-USA.md         # el índice: cuál, cuándo y en qué orden
│   ├── creatividad/            # el orquestador
│   └── cr-*/                   # brief · swipe file · lectura de video · fuentes · big idea ·
│                               # storytelling · hook y copy · arte y video · adaptación · loop
├── entregables/                # plan-de-contenido.csv + brief-del-ciclo.md + ideas-formato.md
└── clients/                    # un cliente = una carpeta
```

**Cómo se usa** — desde Buzz, en lenguaje natural:

- *"Armá las ideas de contenido de [cliente]"* → corre el método completo desde la Capa 0
- *"Buscá referencias de qué está funcionando en [formato]"* → Capa 1, swipe file
- *"Dame conceptos para [cliente]"* → Capas 2-3
- *"Escribí el hook y el copy de esta pieza"* → Capa 4
- *"Adaptalo a los otros canales y armá el Excel"* → Capa 6
- *"¿Qué funcionó el mes pasado?"* → Capa 7, el loop

**Entregables:**

| Archivo | Qué es | Para qué se usa |
|---|---|---|
| **`plan-de-contenido.csv`** | La estructura. Una fila por pieza, **12 columnas** | Se lee de arriba abajo para **aprobar** el ciclo |
| **`brief-del-ciclo.md`** | El brief y las BIG IDEAS del ciclo | Se lee **una vez**, para Gate 1 y Gate 2 |
| **`ideas-<formato>.md`** | El desarrollo, una sección por pieza — un doc por cada formato del ciclo | Se lee de a un formato para **ejecutar** sus piezas |
| `swipe-file.md` | La bóveda de referencias | Trabajo interno |
| `aprendizaje-creativo.md` | El cierre del ciclo | Trabajo interno |

**El puente es el `id` + la columna `formato`.** Ves `CR-007` en el Excel con `formato = Carrusel`,
abrís `ideas-carrusel.md` y buscás `CR-007` ahí. Funciona en Excel, en Sheets y en Drive, sin
fórmulas que se rompan. El Excel solo lleva lo que sirve para decidir —campaña, fecha, canal,
formato, pilar, función, concepto en una línea, mezcla 70/20/10, traza y si necesita rodaje—; todo el
detalle de ejecución vive en los docs, que se leen por formato.

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
├── .claude-plugin/plugin.json  # lo vuelve un plugin cargable
├── WORKFLOW.md                 # cómo trabaja — lo único que hay que leer (462 líneas)
├── skills/                     # 9 skills, una carpeta cada una
│   ├── COMO-LAS-USA.md         # el índice: cuál, cuándo y en qué orden
│   ├── produccion/             # el orquestador
│   └── pr-*/                   # brief · desglose · jornadas · recursos · presupuesto ·
│                               # rodaje · entrega · loop
├── entregables/                # presupuesto.md + plan-de-rodaje.md + los dos CSV internos
└── clients/                    # un cliente = una carpeta
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

| Archivo | Qué es | Para qué se usa |
|---|---|---|
| **`presupuesto.md`** | Para **el cliente**: qué se produce, cuándo, qué necesitamos de él, cuánto cuesta y qué no incluye | Es lo que **se aprueba**, en lenguaje natural y sin jerga |
| **`plan-de-rodaje.md`** | Para **el equipo**: índice de jornadas, una sección por día con su orden de tiro, y lo transversal al final | Es **con lo que se rueda** |
| `plan-de-produccion.csv` | Una fila por **escena**, 16 columnas | Trabajo interno — cruza el manifiesto al cierre |
| `presupuesto.csv` | Categorías cerradas, estimado vs real | Trabajo interno — lo lee la Capa 7 |
| `aprendizaje-de-produccion.md` | Los desvíos reales del ciclo | Trabajo interno |

**El puente con ④ Creatividad es el `id_creativo`.** Una pieza (`CR-007`) se vuelve N escenas
(`PR-014`, `PR-015`, `PR-016`), todas con el mismo `id_creativo`. 🛑 **El plan de rodaje compila lo
que hace falta de ④ para no abrir dos archivos en el set** —acción, encuadre, duración, emoción y el
guion solo si se dice a cámara— **citando la fuente y sin editarla nunca acá**.

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

Los tres que ya están construidos:

```
①②③  (hoy agents/strategy/)  →  posicionamiento · evidencia · plan de campañas · calendario
            ↓  slots · pilares y mix · frecuencia · función y temperatura por canal
④ Creatividad                 →  brief completo por pieza
            ↓  plan-de-contenido.csv (estructura) + brief-del-ciclo.md (brief y BIG IDEAS) +
            ↓  ideas-<formato>.md (concepto · emoción · hook · copy · guion · escenas · encuadres ·
            ↓  duraciones · elementos gráficos a pedir, uno por formato)
⑤ Producción                  →  material base entregado y nombrado
            ↓  presupuesto.md (cliente) + plan-de-rodaje.md (equipo) + RAW y selects en Drive
⑥A Diseño (estático) · ⑥B Video (montaje y masters)  →  arman la pieza
            ↓
⑦ Posting / ⑧B Ads            →  publican y pautan
```

Cada agente declara **su punto de corte** y **qué no hace, y de quién es**. Tres reglas los sostienen:

1. Lo que produce otro departamento se **cita con su ruta, nunca se reescribe ni se edita**.
2. **La intención no se cambia aguas abajo: se devuelve**, con motivo y al menos dos alternativas.
3. Nada se compromete afuera —publicar, reservar, convocar, comprar— **antes de su gate humano**.

> 🔄 **Transición.** Hoy `agents/strategy/` cubre ①, ② y ③ juntos. Creatividad y Producción ya están
> escritos contra los departamentos separados, con el mapeo capa→departamento declarado en
> `agents/creative/WORKFLOW.md` §2. Cuando se separen, cambian **las rutas**, no los métodos.

## Estado

| # | Departamento | Carpeta | Estado |
|---|---|---|---|
| ① | Comprensión | `agents/strategy/` Capa 0 | 🟡 Dentro de Strategy |
| ② | Estrategia | `agents/strategy/` Capas 1-4 | 🟡 Dentro de Strategy |
| ②B | Branding | — | ⬜ Pendiente |
| ③ | Marketing | `agents/strategy/` Capas 5-7 | 🟡 Dentro de Strategy |
| ④ | **Creatividad** | `agents/creative/` | ✅ Operativo |
| ⑤ | **Producción** | `agents/production/` | ✅ Operativo |
| ⑥A | Diseño gráfico | — | ⬜ Pendiente |
| ⑥B | Video Editing | `agents/video/` | 🔵 En el PR #4 |
| ⑦ | Posting | — | ⬜ Pendiente |
| ⑧B | Ads | — | ⬜ Pendiente |

**Huecos conocidos del flujo**, anotados y sin decidir: **⑧A Orgánico** (implícito en el "8B" de Ads)
y **medición / aprendizaje de negocio** (ningún departamento cierra el círculo hacia ① y ②).

El tercer hueco, **⑥B Edición de video**, lo cubre el PR #4. ⑤ Producción ya está escrito contra él:
entrega RAW ordenado y selects marcados, y el montaje, el color de entrega y las versiones por
plataforma son de ⑥B. El corte coincide con lo que ese agente declara por su cuenta —
*"Production: pre y rodaje; la post es de Video"*.
