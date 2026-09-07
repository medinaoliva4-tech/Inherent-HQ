# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

**Agente de Estrategia** — construye una estrategia de posicionamiento y crecimiento completa por
ingeniería inversa conectada con media, adaptada al tipo de empresa del cliente.

```
agents/strategy/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── METHOD.md                 # el método completo — 8 capas
├── PROCESS.md                # el proceso operativo paso a paso, con gates
├── archetypes/               # 8 ejes + 11 arquetipos de empresa
├── playbooks/                # ingeniería inversa, MCPs y buenas prácticas
├── templates/                # los 6 entregables canónicos
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

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Growth / Creative / Branding / Production / Content / Analytics | ⬜ Pendiente |
