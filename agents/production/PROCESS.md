# Proceso Operativo — Agente de Producción

Cómo se ejecuta un ciclo de producción de punta a punta. Secuencial y con gates. **Ninguna capa
arranca sin el output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Campaña(s): [x] · Capa: [0-7] · Ciclo: [bloque]
④ Creatividad: Excel aprobado (Gate 3) [✅/⬜] · filas a producir: [n]
②B Branding: guidelines [✅/⬜]
③ Marketing: fechas de campaña [✅/⬜] · fechas de preparación [✅/⬜] · días disponibles: [n]
① Comprensión: presupuesto [✅/⬜] · capacidad declarada [✅/⬜] · restricciones [✅/⬜]
Skills: [x] · MCPs disponibles: [x] · Gate humano: [sí/no] · Output: [ruta]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente identificado · no existe la carpeta del cliente · el Excel creativo
**no tiene el Gate 3 aprobado** · falta un input bloqueante · falta el input mínimo de la capa · el
pedido pisa otro departamento.

> 🛑 **Sin Excel creativo aprobado, Producción no desglosa.** Desglosar ideas que todavía pueden
> cambiar es gastar el trabajo dos veces — y si ya se comprometieron recursos, gastar la plata dos
> veces.

> 🔄 Mientras el repo no separe ①②③, esos tres se leen de `agents/strategy/` con el mapeo de
> `agents/creative/CORRELACION.md ⓪.1`.

---

## Modos de entrada

El usuario no siempre pide el ciclo completo. Seis modos:

| Pedido | Qué corre |
|---|---|
| *"Armá la producción de X"* / *"presupuestá este calendario"* | **Completo** — Capas 0 → 6, con 3 gates |
| *"¿Qué hace falta para grabar esto?"* | **Capas 0-1** — entrega `desglose.md` |
| *"¿En cuántos días se graba?"* / *"agrupá esto"* | **Capa 2** — requiere desglose hecho |
| *"¿Cuánto cuesta?"* | **Capas 3-4** — requiere jornadas armadas. Sin consolidar, se niega y se explica por qué |
| *"Armá el call sheet de la jornada N"* | **Capa 5** — requiere presupuesto aprobado (Gate 1) |
| *"¿Cómo nos fue?"* / *"cerrá el ciclo"* | **Capa 7** — requiere `costo_real` cargado |

**Si falta una capa previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

🛑 **Presupuestar sin consolidar se rechaza siempre**, aunque lo pidan directo. Un presupuesto sin
Capa 2 está inflado entre 3 y 5 veces, y si se aprueba, ese número se vuelve la referencia del
cliente para siempre.

---

## El flujo completo

### ▸ Paso 1 — Setup del cliente
```
agents/production/clients/<cliente>/
├── _INPUTS/                       # guidelines, banco de assets, cotizaciones
├── brief-de-produccion.md
├── desglose.md
├── plan-de-jornadas.md
├── recursos.md
├── plan-de-produccion.csv
├── call-sheets/
│   ├── jornada-1.md
│   └── jornada-2.md
├── entrega.md
└── aprendizaje-de-produccion.md
```

Copiar las plantillas de `templates/`. **El nombre de la carpeta es el mismo nombre canónico** que
usan Creatividad y los departamentos de aguas arriba. Nunca se duplica un archivo de otro
departamento dentro de Producción: se cita su ruta.

---

### ▸ Paso 2 — CAPA 0 · Brief de producción
**Input:** Excel creativo aprobado + Branding + fechas de ③ Marketing + techos de ① Comprensión
**Skill:** `pr-brief`
**Output:** `brief-de-produccion.md`

Cargar contexto → filtrar las filas con `handoff = produccion-*` → agrupar por campaña → **verificar
producibilidad fila por fila** → **cruzar contra el banco de assets** para detectar lo que ya existe
→ declarar los tres techos → emitir devoluciones.

Si falta un bloqueante: **BLOQUEADO**, con el nombre exacto del archivo que falta.

---

### ▸ Paso 3 — CAPA 1 · Desglose
**Input:** brief
**Skill:** `pr-desglose` · **Toolkit:** `01-desglose.md`
**Output:** `desglose.md` + filas base del Excel

Cada fila creativa → N escenas → las **8 categorías** por escena → inventario consolidado del ciclo.

🛑 **No se agregan escenas.** Si una escena hace falta y no está en el Excel creativo, se **devuelve**
a ④ Creatividad para que la agregue ella. Agregarla acá rompe la traza: esa escena no tendría
`traza_a_must_be_true`.

---

### ▸ Paso 4 — CAPA 2 · Consolidación
**Input:** desglose
**Skill:** `pr-jornadas` · **Playbook:** `CONSOLIDACION.md`
**Output:** `plan-de-jornadas.md`

Agrupar por los 4 ejes en orden → armar jornadas → ordenar el tiro por costo de cambio → calcular
carga horaria con márgenes → **declarar el factor de consolidación**.

🛑 **Ninguna jornada supera 10 h efectivas.** Si no entra, se reparte — no se comprime.

---

### ▸ Paso 5 — CAPA 3 · Recursos
**Input:** jornadas
**Skill:** `pr-recursos` · **Toolkit:** `02-locaciones.md` · `03-talento.md` · `04-equipo.md`
**Output:** `recursos.md`

Origen de cada ítem → responsable con nombre → fecha de confirmación → semáforo 🟢/🟡/🔴 → riesgo y
plan B por escena con dependencia externa.

---

### ▸ Paso 6 — CAPA 4 · Presupuesto
**Input:** jornadas + recursos
**Skill:** `pr-presupuesto` · **Toolkit:** `06-presupuesto.md`
**Output:** `plan-de-produccion.csv` completo

Costear **por jornada** → variables por escena → contingencia según perfil → costo por pieza
calculado → verificar contra el disponible.

Si no entra: **las 3 opciones de METHOD 4.4**, con impacto, y **decide un humano**.

🚦 **GATE 1 — Aprobación del presupuesto.** Nada se compromete antes: ni una reserva, ni una
convocatoria, ni una compra.

---

### ▸ Paso 7 — CAPA 5 · Plan de rodaje
**Input:** presupuesto aprobado
**Skill:** `pr-rodaje` · **Toolkit:** `05-cobertura.md` · `07-entrega.md`
**Output:** `call-sheets/jornada-N.md`

Un call sheet por jornada → orden de tiro → requerimientos por escena → cobertura obligatoria
marcada aparte → riesgos del día → **nomenclatura definida antes de grabar**.

🚦 **GATE 2 — Aprobación del plan de rodaje.** No se convoca a nadie antes.

---

### ▸ Paso 8 — CAPA 6 · Rodaje y entrega
**Input:** call sheets aprobados
**Skill:** `pr-entrega`
**Output:** `entrega.md` + material en Drive

Checklist de cierre por locación → **backup doble antes de salir** → selects marcados → manifiesto
cruzado contra el Excel → faltantes con motivo escrito.

🚦 **GATE 3 — Confirmación de entrega.** Ninguna jornada se cierra sin manifiesto.

---

### ▸ Paso 9 — CAPA 7 · Loop
**Input:** `costo_real` cargado + qué usaron ⑥A y ⑥B en la pieza final
**Skill:** `pr-loop`
**Output:** `aprendizaje-de-produccion.md`

Desvío de costo → desvío de tiempo → material no usado → factor real → corrección de capacidad para
① Comprensión → actualizaciones del toolkit.

---

## HANDOFF — Producción → ⑥B Video Editing / ⑥A Diseño gráfico

Al cerrar la entrega, entregá:

```markdown
## HANDOFF — Producción → ⑥B Video Editing / ⑥A Diseño gráfico
- Cliente: · Campaña(s): · Ciclo: · Fecha:
- Entregables: [rutas de los 7 + aprendizaje-de-produccion.md]
- Gates aprobados: presupuesto [✅/⬜] · plan de rodaje [✅/⬜] · entrega [✅/⬜]
- Escenas planificadas: [n] · grabadas: [n] · entregadas: [n]
- Filas creativas cubiertas por completo: [lista de id_creativo]
- Filas creativas INCOMPLETAS: [id_creativo + qué escena falta + por qué]
- Jornadas: [n] · factor de consolidación: [real]
- Presupuesto: aprobado [monto] · real [monto] · desvío [%]
- Ruta del material: [Drive]
- Nomenclatura aplicada: [patrón]
- Backup verificado: [✅/⬜] en [dos ubicaciones]
- Escenas devueltas a ④ Creatividad: [n + motivos]
- Confianza general: 🟢 / 🟡 / 🔴
- Siguiente: ⑥B Video Editing (montaje y masters) · ⑥A Diseño gráfico (composición y export)
```

**Reglas del handoff:**
- Una fila creativa **incompleta no se declara completa**. ⑥A ni ⑥B pueden armar una pieza a la
  que le falta una escena, y descubrirlo en su mesa cuesta una jornada entera de vuelta.
- El material **es la interfaz**. Si ⑥A tiene que renombrar archivos o adivinar qué toma sirve, la
  entrega estaba incompleta — y eso se corrige en la entrega, no por chat.

---

## Devoluciones a ④ Creatividad

Producción no corrige ideas, pero **sí las devuelve** cuando no son producibles. Se declara y se
escala; no se resuelve en set:

| Lo que Producción detecta | Qué hace |
|---|---|
| `escenas`, `encuadres` y `duraciones` con distinto número de ítems | ↩️ Devuelve la fila: el shot list está roto |
| Una escena sin acción declarada, o sin tipo de lugar | ↩️ Devuelve: no se puede desglosar |
| Una escena físicamente imposible en el margen de fechas | ↩️ Devuelve **con alternativa concreta** (otro lugar, otra forma de lograr la misma acción) |
| Una escena que cuesta desproporcionadamente para su función | ↩️ Devuelve con el costo y **dos alternativas más baratas con la misma intención** |
| Una fila que pide algo que contradice las guidelines de ②B Branding | Declara la contradicción a ④ y ②B. **No la resuelve** |
| Cobertura que en el ciclo anterior nunca se usó | Devuelve **como dato** en la Capa 7, no como reclamo |
| El ciclo completo no entra en el presupuesto | Propone las 3 opciones. **③ Marketing decide qué se cae** |
| Las fechas de preparación no alcanzan para producir | ↩️ Devuelve a **③ Marketing** con el mínimo de días que hace falta |

🛑 **Nunca se cambia la intención para que entre.** Una escena que se resolvió distinto en set
aparece en la edición sin que nadie lo haya decidido, y ahí ya no hay presupuesto para rehacerla.

---

## Ciclo

```
Excel creativo aprobado → brief → desglose → jornadas → recursos → presupuesto 🚦
    → call sheets 🚦 → rodaje → entrega 🚦 → aprendizaje
                                                    ↓
                        vuelve a la consolidación del ciclo siguiente
                        y corrige la capacidad declarada en ① Comprensión
```
