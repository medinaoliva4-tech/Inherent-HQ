# Proceso Operativo — Agente de Estrategia

Cómo se ejecuta una estrategia de punta a punta. Secuencial. **Ninguna capa arranca sin el input de
la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Arquetipo: [x o SIN CLASIFICAR] · Capa: [0-4]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · falta el input
mínimo de la capa · el pedido pisa otro departamento.

---

## Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Armá la estrategia de X"* | **Completo** — Capas 0 → 4, con gate en Capa 4 |
| *"Levantá el contexto de X"* | **Solo Capa 0** — envía el formulario y arma `nucleo.md` |
| *"Investigá la competencia/demanda de X"* | **Solo Capa 1** — entrega `ingenieria-inversa.md` |
| *"¿Cuál es el objetivo/posicionamiento/la historia de X?"* | **Capas 2-4** — requiere Capas 0-1 hechas |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

**Dónde termina Strategy:** en la Capa 4. El calendario de contenido y la distribución
(owned/paid/earned/borrowed) son de la etapa Contenido/Calendar, no de Strategy.

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
clients/<cliente>/
├── _INPUTS/          # material crudo que dio el cliente
├── nucleo.md
├── ingenieria-inversa.md
├── posicionamiento.md
└── estrategia-de-contenido.md
```
Copiar las plantillas de `templates/`. Verificar si el cliente ya existe en Notion o Inherent OS
antes de arrancar de cero.

---

### ▸ Paso 2 — CAPA 0 · Contexto
**Input:** formulario de cliente + Excel de unit economics + material previo
**Skill:** `st-foundation` → `st-arquetipo`
**Instrumentos:** `templates/formulario-cliente.md` (enviar como Google Form) ·
`templates/unit-economics.csv` (completar con el cliente)
**Output:** `nucleo.md` + arquetipo asignado
**Se usa después en:** el ticket promedio de acá alimenta la ingeniería inversa financiera (Capa 3.2)

Si el input es escaso: **documentá menos, no completes con inferencia.** Marcá los huecos.

🚦 **GATE — Aprobación del núcleo.** Un humano confirma que el retrato de la empresa es correcto
antes de gastar tiempo mirando afuera.

---

### ▸ Paso 3 — CAPA 1 · Evidencia
**Input:** núcleo + arquetipo
**Skill:** `st-ingenieria-inversa`
**Instrumento:** `templates/demanda.csv` (CEPs + volumen, audience behavior, awareness stage)
**Output:** `ingenieria-inversa.md`
**Se usa después en:** el volumen de demanda valida la ingeniería inversa financiera (Capa 3.2) ·
el audience behavior escribe la promesa (Capa 4.2) y la historia (Capa 4.3) · awareness ordena los
pasos (Capa 4.1)

Cuatro bloques, livianos: `1.1 cómo se compra/descubre · 1.2 demanda por crear (+volumen) · 1.3
audience behavior vía seguidores de competidor · 1.4 awareness stages`.

🛑 **Esta capa no recomienda.** Termina en observación.

---

### ▸ Paso 4 — CAPAS 2-4 · Análisis, objetivo y estrategia
**Input:** núcleo + evidencia
**Skills:** `st-tres-verdades` → `st-posicionamiento`
**Output:** `posicionamiento.md` + `estrategia-de-contenido.md`

```
CAPA 2  MUST BE TRUE → UNFAIR → GO GET                        (análisis)
CAPA 3  Objetivo agresivo → ingeniería inversa financiera → renuncias   (decisión)
CAPA 4  Pasos puntuales → promesa/posicionamiento/ICP → historia (héroe/villano/solución)
```

**Chequeo obligatorio en Capa 3:** el volumen de demanda de `demanda.csv` ¿alcanza el volumen que
pide la ingeniería inversa financiera? Si no, el objetivo está mal puesto — se ajusta acá, no en
Capa 4.

🚦 **GATE — Aprobación del objetivo, el posicionamiento y la historia.** El gate más importante del
proceso. Con esto Strategy cierra su parte.

---

## Handoff

Al cerrar, entregá el bloque:

```markdown
## HANDOFF — Strategy → Contenido/Calendar · Growth · Creative
- Cliente: · Arquetipo: · Fecha:
- Entregables: [rutas de los 3]
- Gates aprobados: núcleo [✅/⬜] · objetivo/estrategia [✅/⬜]
- Objetivo del ciclo + volumen/conversión necesarios (ingeniería inversa financiera)
- Renuncias explícitas de este ciclo
- Pasos puntuales con fechas
- Historia: héroe / villano / solución
- Huecos de evidencia abiertos: [⚠️ SIN DATOS pendientes]
- Siguiente: Contenido/Calendar (distribución y cadencia) · Growth (monetización) · Creative
  (piezas concretas, interpreta la historia)
```

---

## Ciclo

Cuando termina un ciclo, se revisa si se cumplió el objetivo y se vuelve a la Capa 2 para el
siguiente — puede aparecer una UNFAIR nueva (un movimiento que funcionó y se repitió) o puede
confirmarse/descartarse una MUST BE TRUE.

La Capa 1 se re-corre si cambia significativamente la categoría, la oferta o el contexto
competitivo.
