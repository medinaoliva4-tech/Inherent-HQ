# Plantillas de Entregables — Diseño

Se copian a `clients/<cliente>/` al iniciar. **No se editan acá.**

| Plantilla | Capa | Gate humano |
|---|---|---|
| `sistema-visual.md` | D0 | ✅ |
| `lote-de-piezas.csv` | D1 | — |
| `brief-de-pieza.md` | D2 | — |
| `ruta-visual.md` | D3-D4 | ✅ |
| `entrega.md` | D7 | ✅ |

## Convenciones de marcado

| Marca | Significado |
|---|---|
| ✅ | Verificado / aprobado / pasa el piso |
| ⚠️ | Alerta que no bloquea, pero se declara |
| 🛑 | No usar / bloquea |
| 🟢 / 🟡 / ⚪ | Patrón confirmado / señal a confirmar / ruido (mismo criterio que Strategy) |
| `⚠️ FUERA DE GUÍA` | No está en la guía de marca. Va como **propuesta**, no como hecho |
| `⚠️ ASSET FALTANTE` | No existe el material. Se pide a Production |
| `⚠️ ASSET INSUFICIENTE` | Existe pero no llega al piso de calidad |
| `[asset generado]` | Producido con IA. Requiere gate humano |
| `🛑 BLOQUEADO — sin jerarquía de mensaje` | Falta un campo del contrato con Creative. Se devuelve |
| `⚠️ OBSERVADO` | Diseño propone un cambio al brief creativo y espera respuesta |
| `BLOQUEADO` | No se puede avanzar. Se nombra qué desbloquea |
| `PENDIENTE` | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.
**Nunca se borra una fila del lote.** Se conserva con su estado y su motivo.

## Columnas del lote

`id_pieza · fecha · canal · formato · dimensiones · goal · pilar · temperatura · nivel_1 · nivel_2 ·
nivel_3 · cta · asset_base · slides · seamless · animado · componente · estado_diseno ·
traza_calendario · link_figma · export`

| Columna | Valores | Quién la llena |
|---|---|---|
| **canal** | Instagram / Facebook | Creative |
| **formato** | feed-4x5 / feed-1x1 / story / carrusel | Creative |
| **goal** | vender · educar · anunciar · autoridad · retargeting · lanzamiento · comunidad | **Creative** |
| **pilar / temperatura** | vienen del calendario estratégico | Strategy → Creative |
| **nivel_1 / nivel_2 / nivel_3** | el texto en jerarquía | **Creative — Diseño no los reordena** |
| **asset_base** | ruta de la foto sugerida | Creative / Production |
| **slides** | cantidad, si es carrusel | Creative |
| **seamless** | sí / no | Diseño |
| **animado** | sí / no — lleva elemento de VisuHaus | Diseño |
| **componente** | el nombre del componente de D0.7 | Diseño |
| **estado_diseno** | BLOQUEADO / PENDIENTE / En brief / En diseño / En QA / Listo / Aprobado | Diseño |
| **traza_calendario** | la fila del calendario creativo que origina la pieza | Diseño |

🛑 **Una fila sin `goal` o sin `nivel_1` está BLOQUEADA y se devuelve a Creative.**
Nunca se completa por inferencia.
