# Proceso Operativo — Agente de Estrategia

Cómo se ejecuta una estrategia de punta a punta. Secuencial y con gates. **Ninguna capa arranca sin
el input de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR] · Capa: [0-8]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · falta el input
mínimo de la capa · el pedido pisa otro departamento.

---

## Modos de entrada

El usuario no siempre pide el proceso completo. Tres modos:

| Pedido | Qué corre |
|---|---|
| *"Armá la estrategia de X"* | **Completo** — Capas 0 → 7, con 3 gates |
| *"Investigá la competencia de X"* | **Solo Capa 1** — entrega `ingenieria-inversa.md` |
| *"¿Cuál es el posicionamiento de X?"* | **Capas 2-4** — requiere Capas 0-1 hechas |
| *"Armá el calendario de X"* | **Capas 6-7** — requiere Capas 0-5 hechas |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
clients/<cliente>/
├── _INPUTS/          # material crudo que dio el cliente
├── nucleo.md
├── ingenieria-inversa.md
├── posicionamiento.md
├── estrategia-de-contenido.md
├── contenido-por-canal.md
├── calendario-estrategico.csv
└── medicion.md
```
Copiar las plantillas de `templates/`. Verificar si el cliente ya existe en Notion o Inherent OS
antes de arrancar de cero.

---

### ▸ Paso 2 — CAPA 0 · Foundation
**Input:** brief, sitio, redes, material previo, conversación con el cliente
**Skill:** `st-foundation` → `st-arquetipo`
**Output:** `nucleo.md` secciones A-B + arquetipo asignado

Si el input es escaso: **documentá menos, no completes con inferencia.** Marcá los huecos.

**Cierre obligatorio:** clasificar por los 8 ejes y asignar arquetipo (dominante + modificador si
es híbrido). Leer la ficha completa antes de seguir.

🚦 **GATE 1 — Aprobación del núcleo.** Un humano confirma que el retrato de la empresa es correcto
antes de gastar tiempo mirando afuera.

---

### ▸ Paso 3 — CAPA 1 · Evidencia e ingeniería inversa
**Input:** núcleo + arquetipo
**Skill:** `st-ingenieria-inversa` · **Playbooks:** `INGENIERIA-INVERSA.md` + `MCP-PLAYBOOK.md`
**Output:** `ingenieria-inversa.md`

Cinco bloques, ninguno opcional:
`1.1 categoría · 1.2 demanda y CEPs · 1.3 ingeniería inversa de media · 1.4 cultura · 1.5 audiencia`

Mínimos: 5 anillos con fuentes · 15 piezas descompuestas en 7 capas · 3 mapas (saturación, 2x2,
objeciones) · todo marcado 🟢/🟡/⚪.

🛑 **Esta capa no recomienda.** Termina en patrón observado.

---

### ▸ Paso 4 — CAPAS 2-4 · Verdades, decisión y posicionamiento
**Input:** núcleo + evidencia
**Skills:** `st-tres-verdades` → `st-posicionamiento`
**Output:** `posicionamiento.md`

```
CAPA 2  WHAT MUST BE TRUE → WHAT IS UNFAIR → WHAT CAN WE GO GET   (diagnóstico)
CAPA 3  Objetivo · Comportamiento · Problema · Renuncias · Recursos · Riesgos   (decisión)
CAPA 4  Territorio · CEPs a poseer · Promesa/RTB/Objeciones · Distintividad · Activos
```

Si el territorio falla el filtro de distintividad (Distinctive / Novel / Relevant), **se vuelve a la
Capa 2 y se elige otro camino.** No se fuerza.

🚦 **GATE 2 — Aprobación del posicionamiento y del movimiento elegido.** El gate más importante del
proceso. Todo lo que sigue depende de esto.

---

### ▸ Paso 5 — CAPAS 5-6 · Movimiento y sistema
**Input:** posicionamiento aprobado
**Skill:** `st-sistema-contenido`
**Output:** `estrategia-de-contenido.md` + `contenido-por-canal.md`

```
CAPA 5  Movimiento elegido (1-2) → Trabajo estratégico → Mecanismo → Idea de campaña
CAPA 6  Funciones → Pilares (mix del arquetipo) → Temperatura → Rol por canal → Especificación
```

**Verificación de trazabilidad:** cada tipo de pieza especificado tiene que poder trazarse hasta
una MUST BE TRUE. Si no, se elimina.

---

### ▸ Paso 6 — CAPA 7 · Distribución y calendario macro
**Input:** sistema de contenido
**Skill:** `st-calendario-macro`
**Output:** `calendario-estrategico.csv`

Owned / Paid / Earned / Borrowed + frecuencia, función, pilar, temperatura y balance
marca/activación por slot.

**No incluye:** ideas concretas, copies ni guiones. Eso es de Creative.

🚦 **GATE 3 — Aprobación del calendario.** Antes del handoff.

---

### ▸ Paso 7 — CAPA 8 · Medición
**Input:** objetivo + sistema
**Skill:** `st-medicion`
**Output:** `medicion.md`

KPIs por altura (negocio / comportamiento / marca / contenido) + baseline + condiciones de
invalidación + evaluación de compounding.

Sin baseline: `⚠️ SIN BASELINE — este ciclo se establece como referencia`.

---

## Handoff

Al cerrar, entregá el bloque:

```markdown
## HANDOFF — Strategy → Growth / Creative
- Cliente: · Arquetipo: · Fecha:
- Entregables: [rutas de los 6 + medicion.md]
- Gates aprobados: núcleo [✅/⬜] · posicionamiento [✅/⬜] · calendario [✅/⬜]
- Movimiento elegido: [uno o dos]
- MUST BE TRUE que se está moviendo este ciclo:
- Renuncias explícitas de este ciclo:
- Huecos de evidencia abiertos: [⚠️ SIN DATOS pendientes]
- Confianza general: 🟢 / 🟡 / 🔴
- Siguiente: Growth (monetización) · Creative (el brief de cada pieza)
```

---

## Ciclo

```
CAPA 8 → aprendizaje → actualizar LAS 3 VERDADES (Capa 2) → nuevo ciclo
```

La Capa 1 se re-corre completa a los **6 meses**, o antes si cambia significativamente la categoría,
la oferta o el contexto competitivo.
