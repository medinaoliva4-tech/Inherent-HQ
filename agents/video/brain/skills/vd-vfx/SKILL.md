---
name: vd-vfx
description: >
  Disciplina 11 — VFX y efectos visuales. Rotoscopía, tracking, pantalla verde (chroma key),
  eliminación de objetos, limpieza de plano y efectos especiales. Úsala cuando pidan "sacá esto del
  plano", "green screen", "cambiá el fondo", "seguí el objeto con el texto", "borrá el logo/cable/
  persona", "estabilizá". Corre antes del color y es lo primero que se recorta si no entra el
  deadline.
---

# VFX y Efectos Visuales

**Requiere:** picture lock + B-roll cerrado. Se hace **antes del color** — el grading va sobre la
imagen ya compuesta.
**Es la disciplina más cara en tiempo por unidad de impacto.** Se recorta primero
(`DISCIPLINAS.md § Regla de recorte`).

## Qué entra acá

| Trabajo | Cuándo | Costo típico |
|---|---|---|
| **Estabilización** | Plano movido que vale la pena salvar | Bajo |
| **Chroma key** | Green screen bien filmado | Bajo-medio |
| **Tracking** | Texto o gráfica que sigue un objeto | Medio |
| **Eliminación de objeto** | Cable, logo de terceros, persona de fondo | Alto |
| **Rotoscopía** | Separar sujeto sin green screen | Muy alto |
| **Efectos** | Partículas, luz, simulación | Variable |

## Antes de aceptar el trabajo

```
1  ¿Se puede resolver reencuadrando? → reencuadrar
2  ¿Se puede tapar con B-roll?       → vd-broll
3  ¿Se puede cortar el plano?        → vd-story-cutter
4  ¿Se puede refilmar?               → escalar a Production
5  Recién ahí: VFX
```

🛑 **VFX es el último recurso, no el primero.** Un problema que se resuelve con un corte no se
resuelve con rotoscopía.

## Reglas de craft

- **Chroma key:** primero el key, después el spill (verde en bordes y piel), después el match de
  color con el fondo nuevo. Un key perfecto con spill verde se ve falso igual.
- **Tracking:** si el punto se pierde, se corrige a mano por frames; nunca se deja patinar.
- **Rotoscopía:** el borde manda. Un borde duro sobre fondo suave delata todo el trabajo.
- **Estabilización:** cuesta resolución (crop). Se verifica que el resultado siga entrando en el
  formato de destino.
- **Consistencia temporal:** el efecto tiene que aguantar plano completo, no solo el frame que se
  revisó.

## Reglas duras

- 🛑 **Nunca se altera un hecho documental.** No se borra a alguien de un testimonio, no se cambia
  lo que se ve en una demo de producto, no se "mejora" un resultado.
- 🛑 **Todo efecto generativo se declara** en la EDL como `[GENERADO — <herramienta>]`.
- 🛑 **No se borran marcas de terceros para simular exclusividad** si eso cambia lo que la pieza
  afirma.
- **Antes del color, siempre.** Gradar y después meter VFX deja la capa desfasada.
- **Si el tiempo no alcanza:** se recorta VFX y se documenta qué queda sin resolver, con `PENDIENTE`.
- **Ningún efecto sobrevive al criterio del brief.** Si el tono es documental sobrio, no hay
  partículas.

## Cierre
Revisar el plano completo frame a frame en los bordes del efecto. Correr los ítems de VFX del
bloque **Fase 4** de `qa/QC-GATES.md`.

## Handoff
→ `vd-color`.
