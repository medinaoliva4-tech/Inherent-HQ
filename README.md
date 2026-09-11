# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

Dos agentes operativos, encadenados: **Strategy decide qué es verdad y qué lugar ocupa la marca.
Marketing convierte eso en campañas, fechas, volumen y presupuesto.**

---

### 1 · Agente de Estrategia — construye una estrategia de posicionamiento y crecimiento completa por
ingeniería inversa conectada con media, adaptada al tipo de empresa del cliente.

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

---

### 2 · Agente de Marketing

Recibe la estrategia aprobada y el branding, y los convierte en **decisiones comerciales**: qué
campañas existen, de qué tipo, en qué canales, en qué fechas, con cuánto contenido y cuánta plata.

```
agents/marketing/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── FRONTERAS.md              # dónde termina Strategy y dónde empieza Marketing
├── METHOD.md                 # el método completo — fases M0-M7
├── PROCESS.md                # el proceso operativo con 4 gates
├── playbooks/                # 12 tipos de marketing · canales · ángulos · calendario · MCPs
├── templates/                # los 7 entregables
├── OUTPUTS.md                # mapa completo de outputs
├── CORRELACION.md            # qué campo de Marketing viene de qué campo de Strategy
├── qa/                       # gates de calidad
└── clients/                  # puntero: los outputs viven en la carpeta del cliente de Strategy
```

**La regla que separa los dos departamentos:**

```
Strategy decide QUÉ es verdad y QUÉ lugar ocupamos.
Marketing decide CÓMO se convierte eso en demanda, CUÁNDO y CON CUÁNTO.
```

---

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural:

- *"Armá la estrategia de [cliente]"* → corre el método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1, ingeniería inversa
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7
- *"Armá el plan de marketing de [cliente]"* → método de Marketing completo, M0 a M6
- *"¿Qué está pautando la competencia de [cliente]?"* → M1, research comercial
- *"¿De dónde va a salir el número?"* → M2, distribución del objetivo
- *"Armá las campañas de [cliente]"* → M4, orgánicas y pautadas
- *"¿Cuántos reels por día durante la campaña?"* → M6, volumen y presupuesto

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

## Entregables del agente de Marketing

Viven en `agents/strategy/clients/<cliente>/marketing/`.

| # | Archivo | Fase | Gate |
|---|---|---|---|
| 1 | `handoff-recibido.md` | M0 · Handoff | — |
| 2 | `research-comercial.md` | M1 · Terreno comercial | — |
| 3 | `plan-de-marketing.md` | M2-M4 · Distribución, mix y arquitectura | 🚦 |
| 4 | `campanas.md` | M4 · Campañas orgánicas y pautadas | 🚦 |
| 5 | `calendario-comercial.csv` | M5 · Fechas y preparación | 🚦 |
| 6 | `volumen-y-presupuesto.md` | M6 · Piezas por día y plata | 🚦 |
| 7 | `lectura-comercial.md` | M7 · Lectura del ciclo | — |

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Marketing | ✅ Operativo |
| Growth / Creative / Branding / Production / Content / Analytics | ⬜ Pendiente |
