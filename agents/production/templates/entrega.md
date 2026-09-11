# Entrega — [Cliente]
**Campaña(s):** [nombres] · **Ciclo:** [bloque] · **Fecha de cierre:** [aaaa-mm-dd]
**Capa 6**

> **La prueba de una buena entrega:** ⑥A o ⑥B abren la carpeta, cruzan contra el Excel creativo y
> encuentra cada escena **sin escribirle a nadie**.

---

## Manifiesto — fila por fila

| `id` | `id_creativo` | escena | ¿Grabada? | Archivo entregado | ¿Cobertura? | Estado |
|---|---|---|---|---|---|---|
| P-002 | C-001 | E2 | ✅ | `acme_instalacion_C-001_E2_video_t03_SELECT.mov` | ✅ | Entregada |
| P-006 | C-003 | E3 | ⬜ | — | — | **No grabada — [motivo]** |

🛑 **Toda escena `Planificada` que no llegó a `Entregada` lleva motivo escrito.** Una escena que
desaparece en silencio es una pieza que ⑥A va a descubrir que no puede armar.

---

## Resumen por pieza creativa

| `id_creativo` | Escenas pedidas | Escenas entregadas | ¿Completa? | Si no: qué falta |
|---|---|---|---|---|
| C-001 | 3 | 3 | ✅ | — |
| C-003 | 3 | 2 | ❌ | E3 — [motivo] |

🛑 **Una fila creativa está completa solo si TODAS sus escenas están entregadas.** Declarar completa
una pieza incompleta hace que ⑥A lo descubra en su mesa, y eso cuesta una jornada de vuelta.

---

## Selects

*(Producción marca las tomas buenas. **El frame exacto lo elige ⑥A; el corte, ⑥B.**)*

| `id_creativo` | Escena | Tomas marcadas `_SELECT` | Nota para ⑥A |
|---|---|---|---|

Marcar de más obliga a ⑥A a revisar todo; marcar de menos le esconde la toma buena.

---

## Estructura entregada

```
[cliente]/
└── [campana]/
    ├── 00_RAW/           ← todo, incluido el descarte, por jornada
    ├── 01_SELECTS/       ← por id_creativo. ES EL PUNTO DE ENTRADA DE ⑥A
    ├── 02_AMBIENTES/     ← por locación
    └── _ENTREGA/
        └── entrega.md
```

**Ruta en Drive:** [link]

| Verificación | Estado |
|---|---|
| Nomenclatura aplicada con `id_creativo` y `escena` exactos | ⬜ / ✅ |
| `01_SELECTS` organizado **por pieza**, no por jornada | ⬜ / ✅ |
| Ambientes de todas las locaciones presentes | ⬜ / ✅ |
| 🛑 **Backup verificado en dos ubicaciones** | ⬜ / ✅ |
| 🛑 **Nada borrado, ni el descarte** | ⬜ / ✅ |
| 🛑 **Ninguna pieza terminada entregada** (eso es de ⑥A) | ⬜ / ✅ |

---

## Faltantes y su impacto

| `id` | `id_creativo` | Qué falta | Motivo | Impacto en la pieza | Qué se propone |
|---|---|---|---|---|---|

---

## Bloque de HANDOFF

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
