# Proceso Operativo — Agente de Video

Cómo se edita una pieza de punta a punta. Secuencial y con gates. **Ninguna fase arranca sin el
output de la anterior.**

---

## Antes de todo — Pre-flight

```
PRE-FLIGHT — Cliente: [x] · Proyecto: [x] · Goal: [inspirar/explicar/convertir/documentar]
Runtime: [x] · Plataforma: [x] · Tono: [x] · Fase: [0-5]
Brand guideline: [ruta o ⚠️ SIN GUIDELINE] · ffmpeg: [ok/falta] · Gate humano: [sí/no]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** falta cualquiera de las 4 preguntas · no hay material ni referencia · no existe
la carpeta del proyecto · no hay brand guideline ni declaración de su ausencia · el pedido pisa
otro departamento.

### Verificación de herramientas
```bash
ffmpeg -version && ffprobe -version
```
Sin `ffmpeg` no se puede analizar material local → **BLOQUEADO**: pedir instalación o pedir el
análisis/transcripción ya hechos. Los MCPs de video son complemento, no reemplazo
(ver `playbooks/MCP-PLAYBOOK.md`).

---

## Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Editá este video"* / material crudo nuevo | **Completo** — Fases 0 → 5, con 3 gates |
| *"Analizá esta referencia"* | **Solo Fase 1** — entrega `analisis-de-material.md` |
| *"Armá el plan de edición"* | **Fases 2-3** — requiere brief y análisis hechos |
| *"Pasá esto a vertical para Reels"* | **Fases 3-5** — requiere master previo |
| *"Ponele captions"* / disciplina puntual | **Fase 4 parcial** — requiere picture lock |
| *"¿Está listo para publicar?"* | **Fase 5** — QC sobre master existente |

**Si falta una fase previa:** se dice qué falta y se ofrece correrla. **No se improvisa el faltante.**

---

## El flujo completo

### ▸ Paso 1 — Setup del proyecto
```
projects/<cliente>/<proyecto>/
├── _INPUTS/              # material crudo, referencias, assets, guion
├── _EXPORTS/             # versiones exportadas
├── brief-de-video.md
├── analisis-de-material.md
├── plan-de-edicion.md
├── edit-decision-list.csv
└── qc-entrega.md
```
Copiar las plantillas de `templates/`. Buscar brand guideline, guion y estrategia previa en
`agents/strategy/clients/<cliente>/`, Notion, Drive o Inherent OS **antes de arrancar de cero**.

---

### ▸ Paso 2 — FASE 0 · Brief
**Input:** pedido, guion o concepto, referencias, material
**Skill:** `vd-brief` · **Output:** `brief-de-video.md`

Las 4 preguntas respondidas + brand guideline identificado + deadline + quién aprueba.
Si el input es escaso: **preguntá, no infieras.** El goal mal asumido invalida toda la edición.

🚦 **GATE 1 — Brief aprobado.** Antes de gastar tiempo mirando material.

---

### ▸ Paso 3 — FASE 1 · Análisis de material
**Input:** brief + material en `_INPUTS/`
**Skill:** `vd-analisis` · **Playbook:** `ANALISIS-DE-MATERIAL.md`
**Output:** `analisis-de-material.md`

Frames + transcripción + técnico + assets, **cruzados por timecode**. Si hay referencia: los 7
planos de descomposición.

Mínimos: inventario completo de planos con timecode · 3-8 momentos oro · huecos marcados
`⚠️ FALTA MATERIAL` · problemas técnicos listados.

🛑 **Esta fase no decide.** Describe lo que hay.

---

### ▸ Paso 4 — FASES 2-3 · Disciplinas y plan
**Input:** brief + análisis
**Skill:** `vd-plan` · **Catálogo:** `DISCIPLINAS.md` · **Playbook:** `STORY-CUTTER.md`
**Outputs:** `plan-de-edicion.md` + `edit-decision-list.csv`

```
FASE 2  Elegir disciplinas de las 14 + justificar las que quedan afuera
FASE 3  Beats → Story Cutter (hook/retención/CTA) → EDL → orden de operaciones → tiempos
```

**Verificación de trazabilidad:** cada beat se traza al goal del brief. Si no se puede, se elimina.

🚦 **GATE 2 — Plan aprobado.** El gate más importante. Todo lo que sigue cuesta horas.

---

### ▸ Paso 5 — FASE 4 · Edición
**Input:** plan aprobado
**Skills:** `vd-story-cutter` → `vd-ritmo-social` → `vd-broll` → `vd-vfx` → `vd-color` →
`vd-audio` → `vd-motion` / `vd-captions`
**Output:** versiones `v01_roughcut` → `v04_master`

Se respeta el **orden de operaciones** de `METHOD.md § 3.4`. Nunca se saltea el picture lock.

Brand guideline aplicado en cada capa visible. Cada versión es un archivo nuevo —
**nunca se sobrescribe**.

---

### ▸ Paso 6 — FASE 5 · QC y entrega
**Input:** master
**Skill:** `vd-entrega` · **Playbook:** `ESPECIFICACIONES.md`
**Output:** `qc-entrega.md` + exports por plataforma en `_EXPORTS/`

QC técnico + QC de contenido + un export por plataforma de destino.

🚦 **GATE 3 — Master aprobado.** El agente **no publica**. Handoff a Content / Social Media.

---

## Revisiones

| Regla | Detalle |
|---|---|
| Feedback con timecode | Sin `MM:SS` se devuelve pidiendo timecode |
| Rondas declaradas | El máximo de rondas se fija en el brief |
| Cambio de estructura tras picture lock | Vuelve a Fase 3 y re-aprueba. No se parchea |
| Cambio de goal | Vuelve a Fase 0. Es un video nuevo |

---

## Handoff

```markdown
## HANDOFF — Video → Content / Social Media
- Cliente: · Proyecto: · Fecha:
- Goal: · Runtime: · Plataformas:
- Masters: [rutas]
- Gates: brief [✅/⬜] · plan [✅/⬜] · master [✅/⬜]
- Disciplinas aplicadas: · Disciplinas descartadas y por qué:
- Brand guideline: ✅ aplicado / ⚠️ SIN GUIDELINE
- Música y assets con licencia: ✅ / ⚠️
- Huecos abiertos: [⚠️ FALTA MATERIAL]
- Siguiente: Content (QA final) · Social Media (publicación)
```

---

## Ciclo

```
FASE 5 → performance real (Analytics) → qué hook/ritmo/CTA funcionó → actualizar el brief del próximo
```

El aprendizaje de retención vuelve a la Fase 0 del siguiente video. Un hook validado se reusa;
uno que falló se marca como descartado para ese cliente.
