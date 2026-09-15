# Plantillas de Entregables — Marketing

Se copian a `agents/strategy/clients/<cliente>/marketing/` al iniciar. **No se editan acá.**

| Plantilla | Fase | Gate humano |
|---|---|---|
| `handoff-recibido.md` | M0 | — |
| `research-comercial.md` | M1 | — |
| `plan-de-marketing.md` | M2-M4 | 🚦 GATE M-2 |
| `campanas.md` | M4 | 🚦 GATE M-2 |
| `calendario-comercial.csv` | M5 | 🚦 GATE M-3 |
| `volumen-y-presupuesto.md` | M6 | 🚦 GATE M-4 |
| `lectura-comercial.md` | M7 | — |

## Convenciones de marcado

*(las mismas que Strategy — un solo sistema en todo el repo)*

| Marca | Significado |
|---|---|
| 🟢 | Patrón confirmado — 3+ fuentes independientes |
| 🟡 | Señal a confirmar — 1-2 fuentes |
| ⚪ | Ruido — una aparición sin repetición |
| ⚠️ SIN DATOS | Falta el dato. Se nombra qué falta y cómo conseguirlo |
| `[estimado, no verificado]` | Cifra asumida para planificar, no medida |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |
| PENDIENTE | Se puede avanzar, falta completar o falta un visto bueno |
| ⟲ RETORNO A ESTRATEGIA | Algo del nivel marca hay que redecidir en Strategy |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.

## Columnas del calendario comercial

`campana · fase · fecha_inicio · fecha_fin · hito · fecha_prep_inicio · dependencia ·
responsable · canal · naturaleza · funcion · estado`

- **fase:** `preparacion` / `expectativa` / `lanzamiento` / `sostenimiento` / `cierre`
- **naturaleza:** `organica` / `pautada` / `mixta`
- **funcion:** `marca` / `demanda` / `activacion` / `retencion`
- **estado:** `propuesto` / `aprobado` / `en curso` / `cerrado` / `BLOQUEADO`
- **fecha_prep_inicio:** obligatoria en toda fila de lanzamiento. Se calcula hacia atrás.
