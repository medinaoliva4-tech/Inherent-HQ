# Proceso Operativo — Agente de Branding

Cómo se construye una marca de punta a punta. Secuencial y con gates. **Ninguna capa arranca sin
el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Agente: branding · Cliente: [x] · Arquetipo: [NN o SIN CLASIFICAR]
Modo de marca: [x] · Capa: [B0-B6] · Skills: [x] · MCPs: [x]
Inputs de departamentos previos: [posicionamiento ✅/⬜ · nucleo ✅/⬜] · Gate humano: [sí/no]
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
| **No existe** | 🛑 BLOQUEADO. Ofrecés correr ② Estrategia Capas 0-4 primero (skill `estrategia`) |

Si el cliente insiste en avanzar sin estrategia, se puede — pero **declarado en el encabezado de
todos los entregables**:

```
⚠️ BRANDING SIN POSICIONAMIENTO APROBADO
Territorio, enemigo y promesa fueron reconstruidos por Branding desde [fuente].
Esto es una hipótesis, no una decisión estratégica. Todo el sistema queda sujeto a revisión
cuando ② Estrategia cierre la Capa 4.
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
| *"¿Qué es obligatorio y qué nunca?"* | **B6** — requiere lenguaje visual |
| *"Armame el manual / la guía de marca"* | **Consolidado** — requiere B1-B6 completas |
| *"Diseñá las piezas"* | 🛑 Es **⑥A Diseño** — skill `diseno`. Le pasás `guia-aplicable.md` |

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
├── lenguaje-visual.md
├── reglas-de-marca.md
└── guia-aplicable.md
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

### ▸ Paso 7 — CAPA B5 · Lenguaje visual
**Input:** dirección aprobada
**Skill:** `br-lenguaje-visual` · **Playbooks:** `COLOR.md` · `TIPOGRAFIA.md` · `ESTETICA.md`
**Output:** `lenguaje-visual.md`

Logo · color · tipografía · principios de composición · tratamiento fotográfico · lenguaje gráfico ·
motion · sonido · activos distintivos codificados.

**Valores de identidad concretos.** Un lenguaje con *"azul oscuro"* en lugar de `#0B1F3A` no es un
lenguaje, es una intención.

🛑 **Valores de ejecución, no.** Escala, grillas, márgenes, safe areas, scrim y tokens son de
**⑥A Diseño**. Ver `AGENT.md` → *El límite con ⑥A Diseño*.

---

### ▸ Paso 8 — CAPA B6 · Reglas y gobernanza
**Input:** lenguaje visual
**Skill:** `br-guia-aplicable`
**Output:** `reglas-de-marca.md` → y después el consolidado `guia-aplicable.md`

Rol de marca por punto de contacto · voz visual · rango de variación permitido · reglas duras ·
**test de reconocimiento** · gobernanza. Después se consolida la guía.

🛑 La guía **replica la estructura de `agents/design/templates/guia-aplicable.md`**, para que
⑥A Diseño corra en **D0 Modo A** y la traduzca a tokens en vez de reconstruirla.

🚦 **GATE B3 — la guía aplicable aprobada antes del handoff.**

---

## Handoff

Al cerrar, entregá el bloque:

```markdown
## HANDOFF — ②B Branding → ③ Marketing / ④ Creatividad / ⑤ Producción / ⑥A Diseño / ⑦ Posting
- Cliente: · Arquetipo: NN · Modo de marca: · Fecha:
- Guía aplicable: agents/branding/clients/<cliente>/guia-aplicable.md
- Entregables: [rutas de los 7]
- Gates aprobados: plataforma [✅/⬜] · dirección visual [✅/⬜] · guía [✅/⬜]
- Idea madre:
- Dirección — cómo debe verse / cómo debe sentirse:
- Territorio que la sostiene: [cita con ruta y §]
- Activos distintivos codificados: [lista]
- Reglas duras (los "nunca"): [lista corta]
- Archivos fuente y licencias: [dónde viven]
- ⑥A Diseño puede correr en D0 Modo A (traducción): sí / no
- Huecos abiertos: [⚠️ SIN DATOS / PENDIENTE]
- Devoluciones a ② Estrategia: [o N/A]
- Confianza general: 🟢 / 🟡 / 🔴
```

---

## Qué devuelve Branding hacia atrás

Branding a veces **encuentra que el posicionamiento no se puede vestir**. Cuando pasa, no se
maquilla: se devuelve a ② Estrategia **con motivo y al menos dos alternativas concretas**.

| Hallazgo | Qué hacés |
|---|---|
| El territorio ya está visualmente ocupado por un competidor fuerte | Lo devolvés a ② Estrategia con la evidencia de B1.3 |
| La promesa dice *premium* y las restricciones no lo sostienen | Lo declarás: sin producción, el sistema va a leerse falso |
| No hay ninguna UNFAIR que se pueda mostrar | Lo reportás: el sistema no va a tener qué demostrar |
| El activo distintivo listado ya lo usa la categoría entera | Lo reportás: no es distintivo |

**Devolver a ② Estrategia no es fallar.** Entregar una identidad linda sobre una estrategia rota, sí.
