---
name: vd-color
description: >
  Disciplina 7 (y el look de la 14) — color grading. Corrige luz y color y aplica el look definido
  por el brand guideline: cinematográfico, cálido, frío, natural, luxury o documental. Úsala cuando
  pidan "hacele color", "que se vea cinematográfico", "está muy plano", "emparejá los planos", "se
  ve amarillo", "aplicá el LUT de la marca". Corre DESPUÉS del picture lock y ANTES de la gráfica y
  los captions.
---

# Color Grading

**Requiere:** picture lock + B-roll cerrado. 🛑 **Nunca colorear antes del picture lock** — si
cambia un corte, se rehace todo.
**Referencia de marca:** `templates/brand-guideline-video.md` (look y LUT aprobados).

## El orden dentro del grading

```
1  CORRECCIÓN     Exposición, balance de blancos, contraste → cada plano a un punto neutro
2  MATCHING       Todos los planos de una escena coinciden entre sí
3  LOOK           Se aplica el LUT o la curva de la marca
4  SECUNDARIOS    Pieles, cielo, producto, zonas puntuales
5  ACABADO        Viñeta, grano, halación — al final y con moderación
```

**Nunca se salta el matching.** Un look sobre planos desparejos deja los planos desparejos.

## Looks

| Look | Características |
|---|---|
| **Cinematográfico** | Contraste alto, negros levantados, verdes en sombras, latitud amplia |
| **Cálido** | Temperatura alta, pieles doradas, saturación media-alta |
| **Frío** | Azules en sombras, pieles neutras, sensación clínica o nocturna |
| **Natural** | Corrección sin look — fiel a lo que el ojo vio |
| **Luxury** | Contraste medio, saturación baja, negros profundos, paleta reducida |
| **Documental** | Corrección honesta, poco look, sin estilización que distraiga |

## Reglas duras

- 🛑 **Los tonos de piel mandan sobre el look.** Si el look ensucia la piel, gana la piel.
- 🛑 **Nunca colorear antes del picture lock.**
- 🛑 **Nunca aplicar un LUT sobre material ya corregido de otra manera** — se apilan errores.
- **El LUT no es el grading.** Es el último 20%, no el trabajo.
- **Respetar el rango legal** de broadcast/web: sin blancos quemados ni negros aplastados.
- **Si el material viene log o flat, se declara** — el pipeline cambia.
- **Coherencia con la marca**: el look sale del guideline, no del gusto del editor. Sin guideline:
  `⚠️ SIN GUIDELINE — look asumido: [cuál]`.
- **Revisá en móvil.** Un grading que solo funciona en un monitor calibrado no sirve para social.

## Casos frecuentes

| Problema | Fix |
|---|---|
| Planos desparejos entre cámaras | Matching antes del look, usando un plano de referencia |
| Ventana quemada | Recuperar en highlights o reencuadrar; si no hay información, se declara 🟡 |
| Piel verdosa (luz fluorescente) | Secundario sobre el rango de piel, no corrección global |
| Material 8-bit que banda al gradar | Grading suave + grano leve; no forzar curvas |

## Cierre
Verificar en móvil y en escritorio. Correr los ítems de color del bloque **Fase 4** de
`qa/QC-GATES.md`.

## Handoff
→ `vd-audio`. La gráfica y los captions van **después** del color.
