---
name: gd-systems-qa
description: "Gate final de control de calidad antes de marcar cualquier entregable de diseño como 'listo para enviar' — valida consistencia de marca (logo, color, tipografía, tono) y specs de producción (bleed, resolución, modo de color, formato de archivo) para impresión y digital. ÚSALA SIEMPRE antes de marcar un archivo como final, antes de hacer handoff a Buzz o al cliente, o cuando el usuario pregunte '¿está listo esto?' sobre cualquier pieza de diseño. Bloquea el estado 'final' si cualquier ítem del checklist no está confirmado — nunca asume specs por defecto sin verificarlas explícitamente contra el canal de destino."
---

# QA Final de Marca y Producción

## Job

Esta es la última puerta antes de que algo salga de Inherente. No evalúa si el diseño es
bueno (eso ya lo hizo `gd-composition-critique`) — evalúa si es **correcto y consistente**.
Un diseño brillante con el logo mal usado o sin bleed sigue siendo un error de entrega.

## Cuándo se activa

- Antes de marcar cualquier archivo como "final" o "listo para enviar".
- Antes de handoff a Buzz o entrega directa a cliente.
- El usuario pregunta directamente "¿está listo esto?" o "¿lo mando así?".

## Input requerido

- El/los archivo(s) finales.
- El canal/medio de destino (impresión, o qué plataforma digital específica — cada una tiene
  specs distintas).
- Guía de marca del CLIENT-OS del cliente (si no existe, señalarlo como riesgo, no asumir).

## Proceso

### Checklist 1 — Consistencia de Marca

| Ítem | Verificación |
|---|---|
| **Logo** | Versión correcta, espacio de resguardo respetado, tamaño mínimo cumplido, sin distorsión ni recoloreo no autorizado |
| **Color** | Valores exactos de marca (no aproximados a ojo), modo correcto para el canal, contraste suficiente (mínimo WCAG AA: 4.5:1 texto normal, 3:1 texto grande) |
| **Tipografía** | Familias aprobadas, escala/roles definidos respetados, licencia válida para el medio de uso |
| **Espaciado/layout** | Grid y tokens de espaciado de marca respetados |
| **Imágenes/iconografía** | Tratamiento consistente con el estilo de marca |
| **Voz/tono** | El copy coincide con el carácter de marca definido en el brief |
| **Accesibilidad** | Contraste, tamaños legibles, alt text si es digital |

### Checklist 2 — Producción según el canal

**Si es IMPRESIÓN:**
| Ítem | Spec estándar |
|---|---|
| Bleed | 3mm más allá del corte, en los 4 lados |
| Zona de seguridad | Contenido crítico a 3-5mm del corte, mínimo |
| Resolución | 300 dpi al tamaño final (más para line art) |
| Modo de color | CMYK — verificar negro enriquecido vs. negro de registro |
| Marcas de corte/registro | Incluidas |
| Cobertura de tinta | Dentro de ~300% total |
| Tipografías | Embebidas o convertidas a curvas |
| Formato final | PDF/X listo para imprenta |

**Si es DIGITAL:**
| Ítem | Spec estándar |
|---|---|
| Modo de color | RGB, sRGB para web |
| Densidad de píxeles | @1x/@2x/@3x según necesidad del canal |
| Formato de archivo | SVG (vector/UI), PNG (transparencia), JPG/WebP (fotos), optimizado/comprimido |
| Dimensiones | Exactas al spec de la plataforma de destino (cada red social/canal tiene su propio canvas y zona segura — verificar, no asumir) |

## Gate obligatorio (STOP)

🛑 **Ningún ítem sin confirmar = estado bloqueado.** No existe un "probablemente está bien" en
esta skill. Si no se puede verificar un ítem (por ejemplo, no hay acceso a la guía de marca),
se reporta como `⚠️ NO VERIFICADO` explícitamente — nunca se asume que pasa.

Un entregable con un solo ítem en 🛑 o ⚠️ **no se marca como final**, sin importar cuánta prisa
haya.

## Formato de salida

```markdown
## QA Final — [Pieza / Entregable]
**Canal de destino:** [...]

### Marca
- Logo: [✅ / 🛑 / ⚠️ no verificado — razón]
- Color: [...]
- Tipografía: [...]
- Espaciado: [...]
- Imágenes: [...]
- Tono: [...]
- Accesibilidad: [...]

### Producción ([Impresión / Digital])
- [ítem]: [✅ / 🛑 / ⚠️]
- ...

### Estado final
✅ LISTO PARA ENVIAR — todos los ítems confirmados
🛑 BLOQUEADO — corregir: [lista exacta de ítems]
```

## QA (de la skill misma)

- ¿Cada ítem tiene un estado explícito, no un resumen genérico tipo "se ve bien"?
- ¿Se distinguió entre "falla" y "no verificado"? Son cosas distintas y ambas bloquean.
- ¿El estado final es binario (listo / bloqueado), sin términos intermedios ambiguos?

## Handoff

- ✅ LISTO → Buzz, para coordinación de entrega/handoff al cliente.
- 🛑 BLOQUEADO → de vuelta al Agente o humano responsable de producción, con la lista exacta de
  correcciones — nunca de vuelta a diseño conceptual (`gd-composition-critique`), a menos que el
  bloqueo sea de consistencia de marca y no de producción técnica.

## Referencias
Checklist de marca: práctica estándar de gobernanza de sistemas de diseño y guías de marca.
Checklist de producción: prácticas estándar de pre-prensa (impresión) y de especificación por
canal (digital).
