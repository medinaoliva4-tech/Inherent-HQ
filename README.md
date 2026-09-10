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

**Traduce intención a idea.** Convierte la estrategia aprobada en ideas concretas y dirigidas, listas
para que otro las ejecute sin adivinar nada. *Creatividad dirige; Production ejecuta.*

```
agents/creative/
├── AGENT.md                  # quién es el agente, qué recibe, qué no hace
├── METHOD.md                 # el método completo — 8 capas
├── PROCESS.md                # el proceso operativo paso a paso, con gates
├── toolkit/                  # 7 taxonomías: técnicas, hooks, arco, CTAs, arte, tomas, canales
├── playbooks/                # swipe file · traducción Strategy→Creative · MCPs
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
| 6 | **`ideas-de-contenido.csv`** | 6 · **el entregable definitivo** — 24 columnas |
| 7 | `aprendizaje-creativo.md` | 7 · Loop |

**Requiere estrategia aprobada.** Sin `posicionamiento.md` (Gate 2) y `calendario-estrategico.csv`,
Creative bloquea: idear sin brief es inventar audiencia y pilares.

---

## Cómo se conectan

```
Strategy  →  plataforma estratégica + calendario macro
              ↓  posicionamiento · sistema de contenido · slots · evidencia
Creative  →  brief completo por pieza (concepto · hook · copy · layout · shot list)
              ↓  ideas-de-contenido.csv
Production / Content  →  ejecutan y arman
```

Cada agente declara **su punto de corte** y **qué no hace, y de quién es**. Lo que produce otro
departamento se **cita con su ruta, nunca se reescribe**.

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Creative | ✅ Operativo |
| Growth / Branding / Production / Content / Analytics | ⬜ Pendiente |
