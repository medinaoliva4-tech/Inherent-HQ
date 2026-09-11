# Proceso Operativo — Agente de Marketing

Cómo se ejecuta un ciclo de marketing de punta a punta. Secuencial y con gates.
**Ninguna fase arranca sin el input de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x] · Fase: [M0-M7]
Gate de posicionamiento: [pasado / NO pasado] · Skills: [x] · MCPs: [x]
Gate humano de esta fase: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:**
- No hay cliente identificado o no existe su carpeta
- **`posicionamiento.md` no existe o no pasó su gate humano** ← la causa más frecuente
- Falta el input mínimo de la fase
- El pedido pisa a Strategy, Growth, Branding, Creative o Production

---

## Modos de entrada

El usuario rara vez pide el ciclo completo. Seis modos:

| Pedido | Qué corre |
|---|---|
| *"Armá el plan de marketing de X"* | **Completo** — M0 → M6, con 3 gates |
| *"¿Qué está pautando la competencia?"* / *"research comercial"* | **Solo M1** → `research-comercial.md` |
| *"¿De dónde va a salir el número?"* | **M2** — requiere M0-M1 |
| *"Armá las campañas"* / *"qué campañas hacemos"* | **M3-M4** — requiere M2 |
| *"Armá el calendario de campañas"* / *"fechas"* | **M5** — requiere M4 |
| *"¿Cuánto publicamos y cuánto gastamos?"* | **M6** — requiere M4-M5 |
| *"¿Funcionó la campaña?"* | **M7** — requiere campañas cerradas |

**Si falta una fase previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup

```
agents/strategy/clients/<cliente>/        ← la MISMA carpeta que Strategy
├── nucleo.md                  (Strategy · solo lectura)
├── posicionamiento.md         (Strategy · solo lectura)
├── ...
└── marketing/                 ← acá escribe Marketing
    ├── handoff-recibido.md
    ├── research-comercial.md
    ├── plan-de-marketing.md
    ├── campanas.md
    ├── calendario-comercial.csv
    ├── volumen-y-presupuesto.md
    └── lectura-comercial.md
```

Copiar las plantillas de `agents/marketing/templates/`.
🛑 **Marketing nunca edita un archivo de Strategy.** Ver `FRONTERAS.md` §8.

---

### ▸ Paso 2 — M0 · Handoff
**Input:** entregables de Strategy + branding
**Skill:** `mk-handoff` · **Output:** `handoff-recibido.md`

Se verifica entregable por entregable y se extraen los campos críticos.

🛑 **Si `posicionamiento.md` no pasó su gate → BLOQUEADO.** No se infiere el posicionamiento desde
el brief, ni desde la web, ni desde el research.

---

### ▸ Paso 3 — M1 · Terreno comercial
**Input:** handoff + arquetipo
**Skill:** `mk-research-comercial` · **Playbook:** `MCP-PLAYBOOK.md`
**Output:** `research-comercial.md`

Cinco bloques, ninguno opcional:
`1.1 publicidad viva · 1.2 ofertas y promos · 1.3 calendario comercial · 1.4 benchmarks y costos ·
1.5 avatares y sofisticación`

Mínimos: competidores **verificados por MCP** · ads con días corriendo · fechas con fuente y año ·
CAC máximo tolerable calculado · 2-4 avatares con **frase literal** · nivel de sofisticación con
evidencia.

🛑 **Esta fase no decide campañas.** Termina en terreno documentado.

---

### ▸ Paso 4 — M2-M4 · Plan y campañas
**Input:** handoff + research
**Skills:** `mk-plan` → `mk-campanas`
**Output:** `plan-de-marketing.md` + `campanas.md`

```
M2  Distribución del objetivo → fuentes, %, supuestos, test de viabilidad
M3  Mix de marketing → tipos, rol comercial por canal, balance marca/respuesta
M4  Campañas → clasificación, fichas, filtro comercial, loops
```

Si la distribución no cierra con supuestos realistas, o ningún ángulo sostiene la promesa →
**⟲ RETORNO A ESTRATEGIA**. No se maquilla para que cierre.

🚦 **GATE M-2 — Aprobación del plan y de las campañas.** El gate más importante de Marketing.
Todo lo que sigue depende de esto.

---

### ▸ Paso 5 — M5 · Calendario comercial
**Input:** campañas aprobadas
**Skill:** `mk-calendario-comercial` · **Playbook:** `CALENDARIO-COMERCIAL.md`
**Output:** `calendario-comercial.csv`

Toda fila de lanzamiento lleva `fecha_prep_inicio`, calculada hacia atrás. Toda fila lleva
responsable. Se cruza contra el calendario real del equipo y del cliente.

🚦 **GATE M-3 — Aprobación del calendario.**

---

### ▸ Paso 6 — M6 · Volumen y presupuesto
**Input:** campañas + calendario
**Skill:** `mk-volumen-presupuesto` · **Playbook:** `CANALES.md`
**Output:** `volumen-y-presupuesto.md`

El chequeo de capacidad se hace sobre **el total semanal de todas las campañas activas**, no
campaña por campaña. Si no cabe, se recorta acá y se declara qué se recortó.

🚦 **GATE M-4 — Aprobación del volumen y del presupuesto.**

---

### ▸ Paso 7 — Handoff a otros departamentos

Al cerrar M6, emitir este bloque:

```
HANDOFF — Marketing · Cliente: [x] · Ciclo: [período]

→ CREATIVE
  Campañas y briefs: [lista]
  Por campaña: avatar, nivel de consciencia, ángulo, objeción, 7 mensajes base
  Volumen y formato por día: [tabla de M6.1]
  Lo que Creative decide: concepto, hook, copy, guion

→ GROWTH
  Campañas pautadas: [lista] con objetivo, ventana y presupuesto por bloque
  Mecánicas promocionales propuestas: [lista] — estado PENDIENTE de validación de precio y margen
  Supuestos de conversión que hay que sostener: [de M2]
  Lo que Growth decide: estructura de cuenta, pujas, distribución diaria, escalamiento, precio

→ CONTENT / SOCIAL
  Calendario comercial aprobado + volumen por canal y formato
  Lo que Content hace: programación y publicación

→ PRODUCTION
  Total de piezas por formato y por semana + fechas de preparación

→ ANALYTICS
  Métrica por campaña según su función + supuestos a validar en las primeras 2 semanas
```

---

### ▸ Paso 8 — M7 · Lectura y cierre del ciclo
**Input:** campañas cerradas + datos
**Skill:** `mk-lectura` · **Output:** `lectura-comercial.md`

Se lee cada campaña contra **su propia función**. Se compara la distribución planificada vs real.
Se cambia **una variable por vez** para el ciclo siguiente.

Vuelve a **M2** — y si hay que redecidir algo del nivel marca, **⟲ RETORNO A ESTRATEGIA**.

---

## Los 4 gates humanos

| Gate | Qué se aprueba | Cuándo | Por qué |
|---|---|---|---|
| **Heredado** | `posicionamiento.md` de Strategy | Antes de M0 | Sin esto Marketing no existe |
| 🚦 **M-2** | Plan de marketing + campañas | Fin de M4 | Define en qué se gasta el ciclo entero |
| 🚦 **M-3** | Calendario comercial | Fin de M5 | Compromete fechas y equipo |
| 🚦 **M-4** | Volumen y presupuesto | Fin de M6 | Compromete plata y capacidad de producción |

**El agente propone; no cierra.** Nada se publica, se pauta, se envía al cliente ni se compromete
con un tercero sin gate humano explícito.

---

## Cuándo Marketing dice que no

| Situación | Respuesta |
|---|---|
| Piden campañas sin posicionamiento aprobado | **BLOQUEADO** — se ofrece correr Strategy primero |
| Piden un copy, un guion o un concepto | Es de **Creative** — se ofrece el brief |
| Piden precio, oferta o estructura de funnel | Es de **Growth** — se ofrece la mecánica promocional propuesta |
| Piden paleta, tipografía o sistema de tono | Es de **Branding** |
| Piden publicar, programar o pautar | Es de **Content** / **Growth** — Marketing planifica, no ejecuta |
| Piden "algo viral" sin objetivo | Se pide el objetivo. Sin traza a una MBT no hay campaña |
