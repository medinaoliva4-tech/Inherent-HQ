# Inherent HQ

Repositorio de los agentes operativos de **Inherent Global**. Se opera desde Buzz mediante sesiones
de Claude Code.

## Qué hay hoy

Dos departamentos operativos, encadenados: **Strategy** decide dónde y cómo compite la marca.
**Branding** decide cómo se siente, se ve y comunica.

```
Strategy  ──►  posicionamiento.md aprobado  ──►  Branding  ──►  brand-guidelines.md
                                                                       │
                                                  Creative · Production · Content
```

---

### 🧭 Agente de Estrategia

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

| # | Entregable | Capa |
|---|---|---|
| 1 | `nucleo.md` | 0 · Foundation |
| 2 | `ingenieria-inversa.md` | 1 · Evidencia |
| 3 | `posicionamiento.md` | 2-4 · Verdades, decisión y territorio |
| 4 | `estrategia-de-contenido.md` | 5-6 · Movimiento y sistema |
| 5 | `contenido-por-canal.md` | 6 · Rol de cada canal |
| 6 | `calendario-estrategico.csv` | 7 · Distribución y cadencia |

Plus `medicion.md` (Capa 8) cuando hay datos disponibles.

**Cómo se le habla:**
- *"Armá la estrategia de [cliente]"* → método completo desde la Capa 0
- *"Investigá qué está haciendo la competencia de [cliente]"* → Capa 1
- *"¿Cuál es el posicionamiento de [cliente]?"* → Capa 4
- *"Armá el calendario estratégico de [cliente]"* → Capa 7

---

### 🎨 Agente de Branding

Convierte una estrategia aprobada en una identidad percibible y repetible: concepto, personalidad,
tono de voz y sistema visual, hasta una guía que un tercero pueda ejecutar.

```
agents/branding/
├── AGENT.md                  # quién es el agente, qué entrega, qué no hace
├── METHOD.md                 # el método completo — 7 capas B0-B6
├── PROCESS.md                # el proceso operativo, con gates y modo degradado
├── playbooks/                # modos de marca · color · tipografía · composición · auditoría · MCPs
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
| 5 | `sistema-visual.md` | B5 · Sistema visual |
| 6 | `aplicaciones-y-reglas.md` | B6 · Aplicaciones y gobernanza |
| 7 | `brand-guidelines.md` | Consolidado 🚦 |

**Cómo se le habla:**
- *"Armá el branding de [cliente]"* → método completo desde B0
- *"Auditá la marca de [cliente]"* / *"cómo se ve la competencia"* → B1
- *"¿Cuál es el concepto y la personalidad?"* → B2
- *"Definí el tono de voz"* → B3
- *"Necesito la dirección de arte / un moodboard"* → B4
- *"Armá la paleta y las tipografías"* → B5
- *"Armame el manual de marca"* → consolidado

**Las dos reglas del departamento:**
1. **El concepto va antes que la forma.** Sin plataforma de marca no hay paleta.
2. **Prueba del logo tapado.** La pregunta nunca es *¿es bonito?* sino *¿se reconoce sin el logo?*

---

## Cómo se usa

Desde Buzz, hablale al agente en lenguaje natural. Las skills de `.claude/skills/` se activan solas
según el pedido:

| Orquestador | Sub-skills |
|---|---|
| `estrategia` | `st-foundation` · `st-arquetipo` · `st-ingenieria-inversa` · `st-tres-verdades` · `st-posicionamiento` · `st-sistema-contenido` · `st-calendario-macro` · `st-medicion` |
| `branding` | `br-auditoria` · `br-plataforma` · `br-tono-de-voz` · `br-direccion-visual` · `br-sistema-visual` · `br-aplicaciones` |

**Un cliente = una carpeta**, con el **mismo slug en los dos departamentos**:
`agents/strategy/clients/<cliente>/` y `agents/branding/clients/<cliente>/`.

## Estado

| Agente | Estado |
|---|---|
| Strategy | ✅ Operativo |
| Branding | ✅ Operativo |
| Growth / Creative / Production / Content / Analytics | ⬜ Pendiente |
