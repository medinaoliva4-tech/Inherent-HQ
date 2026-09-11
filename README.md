# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

**Agente de Estrategia** — construye una estrategia de posicionamiento y crecimiento completa por
ingeniería inversa conectada con media, adaptada al tipo de empresa del cliente.

**Agente de Video** — convierte material crudo en una pieza terminada que cumple un objetivo
declarado, en la plataforma correcta y con el brand guideline aplicado.

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
agents/video/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── METHOD.md                 # el método completo — 6 fases
├── DISCIPLINAS.md            # las 14 disciplinas de edición → qué skill las cubre
├── PROCESS.md                # el proceso operativo paso a paso, con gates
├── playbooks/                # análisis con ffmpeg · story cutter · specs · MCPs
├── templates/                # brief, análisis, plan, EDL, QC, brand guideline
├── OUTPUTS.md                # mapa completo de outputs
├── qa/                       # gates de calidad
└── projects/                 # un proyecto = una carpeta
```

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural:

- *"Armá la estrategia de [cliente]"* → corre el método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1, ingeniería inversa
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7

Y para video:

- *"Editá este video"* → corre el método completo desde la Fase 0
- *"Analizá esta referencia"* → Fase 1, frames + transcripción + ritmo
- *"Armá el plan de edición"* → Fases 2-3, disciplinas + story cutter + EDL
- *"El hook no funciona / esto no retiene"* → Story Cutter
- *"Pasalo a vertical para Reels"* / *"¿está listo para publicar?"* → Fases 3-5

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

## Entregables del agente de Video

| # | Archivo | Fase |
|---|---|---|
| 1 | `brief-de-video.md` | 0 · Goal, runtime, plataforma, tono |
| 2 | `analisis-de-material.md` | 1 · Qué hay realmente en el material |
| 3 | `plan-de-edicion.md` | 2-3 · Disciplinas, beats, hook/retención/CTA |
| 4 | `edit-decision-list.csv` | 3 · La edición corte por corte |
| 5 | `_EXPORTS/` | 4 · Un master por plataforma |
| 6 | `qc-entrega.md` | 5 · QC técnico, contenido, marca y legal |

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Video | ✅ Operativo |
| Growth / Creative / Branding / Production / Content / Analytics | ⬜ Pendiente |
