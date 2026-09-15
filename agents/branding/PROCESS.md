# Proceso Operativo — Agente de Branding

Cómo se construye una marca de punta a punta. Secuencial y con gates. **Ninguna capa arranca sin
el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [NN o SIN CLASIFICAR] · Modo de marca: [x] · Capa: [B0-B6]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe `posicionamiento.md` aprobado · falta
el input mínimo de la capa · el pedido pisa otro departamento.

---

## Modo degradado — cuando no hay estrategia

Pasa seguido: el cliente quiere marca y todavía no hay posicionamiento. **No se improvisa la
estrategia.** Tres salidas, en este orden:

| Situación | Qué hacés |
|---|---|
| Existe `posicionamiento.md` **aprobado** | ✅ Corrés el método completo |
| Existe pero **sin gate humano** | ⚠️ Corrés B0-B1 y frenás en B2. Pedís la aprobación |
| **No existe** | 🛑 BLOQUEADO. Ofrecés correr Strategy Capas 0-4 primero |

Si el cliente insiste en avanzar sin estrategia, se puede — pero **declarado en el encabezado de
todos los entregables**:

```
⚠️ BRANDING SIN POSICIONAMIENTO APROBADO
Territorio, enemigo y promesa fueron reconstruidos por Branding desde [fuente].
Esto es una hipótesis, no una decisión estratégica. Todo el sistema queda sujeto a revisión
cuando Strategy cierre la Capa 4.
```

**Nunca se entrega branding sin estrategia sin ese bloque.** Un sistema visual construido sobre una
hipótesis no declarada se convierte en la estrategia por default, y nadie lo revisa nunca.

---

## Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Armá el branding de X"* / cliente nuevo | **Completo** — B0 → B6, con 3 gates |
| *"Auditá la marca de X"* / *"cómo se ve la categoría"* | **Solo B1** → `auditoria-de-marca.md` |
| *"¿Cuál es la personalidad / el concepto de X?"* | **B2** — requiere posicionamiento |
| *"Definí el tono de voz de X"* | **B3** — requiere plataforma |
| *"Necesito la dirección visual / un moodboard"* | **B4** — requiere B1 + B2 |
| *"Armá la paleta y las tipografías"* | **B5** — requiere dirección elegida |
| *"¿Cómo aplico esto en el feed / la web?"* | **B6** — requiere sistema visual |
| *"Armame el manual de marca"* | **Consolidado** — requiere B1-B6 completas |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
agents/branding/clients/<cliente>/
├── _INPUTS/              # assets crudos, referencias, manual viejo, capturas del feed
├── auditoria-de-marca.md
├── plataforma-de-marca.md
├── tono-de-voz.md
├── direccion-visual.md
├── sistema-visual.md
├── aplicaciones-y-reglas.md
└── brand-guidelines.md
```
Copiar las plantillas de `templates/`. **Antes de arrancar de cero:** leer
`agents/strategy/clients/<cliente>/` y buscar material previo en Notion, Drive e Inherent OS.

---

### ▸ Paso 2 — CAPA B0 · Herencia y encuadre
**Input:** `posicionamiento.md` + `nucleo.md` + `ingenieria-inversa.md` + assets y referencias
**Skill:** `branding` (el orquestador lo hace en el pre-flight)
**Output:** bloque `ENCUADRE` declarado en sesión

Verificar los 6 inputs obligatorios, declarar la superficie de marca, el ejecutor real y su
capacidad, y elegir el **modo de marca** (`playbooks/MODOS-DE-MARCA.md`).

---

### ▸ Paso 3 — CAPA B1 · Auditoría y saturación visual
**Input:** encuadre
**Skill:** `br-auditoria` · **Playbook:** `AUDITORIA-VISUAL.md` + `MCP-PLAYBOOK.md`
**Output:** `auditoria-de-marca.md`

Mínimos: inventario completo · prueba del logo tapado sobre 6 piezas propias · **10 marcas**
descompuestas en 8 capas visuales · referencias con URL y su principio extraído · 5-8 hallazgos
marcados 🟢/🟡/⚪.

🛑 **Esta capa no decide.** Termina en mapa.

---

### ▸ Paso 4 — CAPA B2 · Concepto y personalidad
**Input:** posicionamiento + auditoría
**Skill:** `br-plataforma`
**Output:** `plataforma-de-marca.md`

```
Idea madre → Punto de vista → Verdad emocional → Personalidad → Qué NO es → Sensación objetivo
```

Si la idea madre no resuelve decisiones de diseño concretas, **no es una idea madre**. Se vuelve a
escribir.

🚦 **GATE B1 — la plataforma la aprueba un humano.** Nada visual arranca antes.

---

### ▸ Paso 5 — CAPA B3 · Sistema verbal
**Input:** plataforma aprobada
**Skill:** `br-tono-de-voz`
**Output:** `tono-de-voz.md`

Registro · léxico · construcción · mensaje por temperatura · tono por punto de contacto ·
**5+ ejemplos antes/después con texto real del cliente**.

El entregable no está listo hasta que los antes/después existan.

---

### ▸ Paso 6 — CAPA B4 · Dirección visual
**Input:** plataforma + auditoría
**Skill:** `br-direccion-visual`
**Output:** `direccion-visual.md`

6 ejes posicionados y justificados dos veces (concepto + saturación) → **1-2 direcciones** con
moodboard → filtro Distinctiveness/Novelty/Relevance → prueba del logo tapado → elección con
descarte documentado.

Si falla el filtro: **se vuelve a B4.1 y se mueven los ejes. No se fuerza.**

🚦 **GATE B2 — el gate más importante del departamento.**

---

### ▸ Paso 7 — CAPA B5 · Sistema visual
**Input:** dirección aprobada
**Skill:** `br-sistema-visual` · **Playbooks:** `COLOR.md` · `TIPOGRAFIA.md` ·
`COMPOSICION-Y-ESTETICA.md`
**Output:** `sistema-visual.md`

Logo · color · tipografía · composición · fotografía · elementos gráficos · motion · sonido ·
activos distintivos codificados.

**Valores concretos siempre.** Un sistema con *"azul oscuro"* en lugar de `#0B1F3A` no es un
sistema, es una intención.

---

### ▸ Paso 8 — CAPA B6 · Aplicaciones y gobernanza
**Input:** sistema visual
**Skill:** `br-aplicaciones`
**Output:** `aplicaciones-y-reglas.md` → y después el consolidado `brand-guidelines.md`

Punto de contacto por punto de contacto · sistema de portadas · rango de variación permitido ·
reglas duras · **test final de reconocimiento** · gobernanza.

🚦 **GATE B3 — el guidelines aprobado antes del handoff.**

---

## Handoff

Al cerrar, entregá el bloque:

```markdown
## HANDOFF — Branding → Creative / Production / Content
- Cliente: · Arquetipo: NN · Modo de marca: · Fecha:
- Entregables: [rutas de los 7]
- Gates aprobados: plataforma [✅/⬜] · dirección visual [✅/⬜] · guidelines [✅/⬜]
- Idea madre:
- Territorio que sostiene el sistema: [cita de posicionamiento.md]
- Activos distintivos codificados: [lista]
- Reglas duras (los "nunca"): [lista corta]
- Ejecutor previsto y su capacidad:
- Archivos fuente y licencias: [dónde viven]
- Huecos abiertos: [⚠️ SIN DATOS / PENDIENTE]
- Confianza general: 🟢 / 🟡 / 🔴
- Siguiente: Creative (conceptos y piezas) · Production (assets) · Content (armado y QA)
```

---

## Qué devuelve Branding hacia atrás

Branding a veces **encuentra que el posicionamiento no se puede vestir**. Cuando pasa, no se
maquilla: se devuelve.

| Hallazgo | Qué hacés |
|---|---|
| El territorio ya está visualmente ocupado por un competidor fuerte | Lo reportás a Strategy con la evidencia de B1.3 |
| La promesa dice *premium* y las restricciones no lo sostienen | Lo declarás: sin producción, el sistema va a leerse falso |
| No hay ninguna UNFAIR que se pueda mostrar | Lo reportás: el sistema no va a tener qué demostrar |
| El activo distintivo listado ya lo usa la categoría entera | Lo reportás: no es distintivo |

**Devolver a Strategy no es fallar.** Entregar una identidad linda sobre una estrategia rota, sí.
