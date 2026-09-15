# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

**Agente de Estrategia** — construye una estrategia de posicionamiento y crecimiento completa por
ingeniería inversa conectada con media, adaptada al tipo de empresa del cliente.

**Agente de Diseño Gráfico** — recibe la guía de marca, la **dirección creativa** (goal + texto en
jerarquía) y el contenido producido, y entrega piezas visuales estáticas listas para publicar o
pautar, por formato (feed / story / carrusel) y canal (Instagram / Facebook). Construye en Figma con
**Figwright**.

> **La línea:** Creative define la jerarquía del **mensaje** · Diseño resuelve la jerarquía **visual**.

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

```
agents/design/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── METHOD.md                 # el método completo — 8 capas (D0-D7)
├── PROCESS.md                # el proceso operativo paso a paso, con 3 gates
├── brain/                    # criterio visual · feed y grilla · componentes de social
├── systems/                  # tokens · composición · tipografía · color · elementos · formatos
├── playbooks/                # Figwright · assets y MCPs
├── templates/                # los entregables
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # de dónde viene cada campo
├── qa/                       # gates de calidad
└── clients/                  # un cliente = una carpeta
```

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural:

**Estrategia**
- *"Armá la estrategia de [cliente]"* → corre el método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1, ingeniería inversa
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7

**Diseño**
- *"Diseñá las piezas de [cliente] de [mes]"* → corre el método completo desde D0
- *"Armá el sistema visual de [cliente]"* → D0, tokens y contraste
- *"Adaptá esto a story"* → D6
- *"Revisá estas piezas"* → D7, QA en 3 pasadas

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

## Entregables del agente de Diseño

| # | Archivo | Capa | Gate |
|---|---|---|---|
| 1 | `sistema-visual.md` | D0 · Tokens, contraste, grillas, layouts | 🚦 |
| 2 | `lote-de-piezas.csv` | D1 · Lectura del calendario creativo | — |
| 3 | `briefs/<id_pieza>.md` | D2 · Decisión por pieza | — |
| 4 | `ruta-visual.md` | D3-D4 · Composición y capas gráficas | 🚦 |
| 5 | Archivo Figma (Figwright) | D5-D6 · Construcción y adaptación | — |
| 6 | `entrega.md` + `/exports` | D7 · QA y handoff | 🚦 |

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Design | ✅ Operativo |
| Growth / Creative / Branding / Production / Content / Analytics | ⬜ Pendiente |

## Handoffs entre agentes

```
Strategy   ──► calendario macro, posicionamiento, activos distintivos ──► Creative
Creative   ──► plan de ejecución: formato · goal · texto en jerarquía ──► Design
Branding   ──► guía de marca ───────────────────────────────────────────► Design
Production ──► fotos y assets ──────────────────────────────────────────► Design
Design     ──► exports aprobados ──► Content (publica) · Media Buy (pauta) · Production (motion)
```

## Stack del agente de Diseño

| Para | Herramienta |
|---|---|
| Construir en Figma | **Figwright** — MCP no oficial, corre local con plugin (no es el MCP oficial) |
| Fotos | Jockey MCP · Drive |
| Fuentes | Zapier MCP |
| Texturas, gradientes, PNGs | Generación de imagen, marcada `[asset generado]` + gate |
| Elementos animados de relleno | VisuHaus ⚠️ **acceso limitado desde el 10/10/2026 — verificar** |
