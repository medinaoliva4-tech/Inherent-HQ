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
| `BLOQUEADO` | No se puede avanzar. Se nombra qué desbloquea |
| `PENDIENTE` | Se puede avanzar, falta completar |

**Nunca se borra una sección de la plantilla.** Si no aplica, se marca `N/A — [por qué]`.
**Nunca se borra una fila del lote.** Se conserva con su estado y su motivo.

## Columnas del lote

`id_pieza · fecha · canal · formato · dimensiones · funcion · pilar · temperatura · titular ·
copy_en_pieza · cta · asset_base · slides · layout · estado_diseno · traza_calendario · link_figma · export`

- **canal:** Instagram / Facebook
- **formato:** feed-4x5 / feed-1x1 / story / carrusel
- **funcion:** Hero / Series / Proof / Utility / Conversion / Community *(viene de Strategy)*
- **temperatura:** Frío / Tibio / Caliente / Cliente *(viene de Strategy)*
- **layout:** el nombre del layout de la biblioteca D0.7
- **estado_diseno:** BLOQUEADO / PENDIENTE / En brief / En diseño / En QA / Listo / Aprobado
- **traza_calendario:** la fila del calendario creativo que origina esta pieza. Sin traza se consulta
