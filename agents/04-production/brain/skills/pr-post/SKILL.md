---
name: pr-post
description: >
  Post de ④ Producción — edición y multiplicar. El agente hace el primer corte de cada reel con el
  motor (Remotion + ffmpeg) a partir del material grabado y la pieza aprobada; el editor humano
  solo corrige. Aplica la marca (subtítulos, cierre), mide temblor y color, saca las derivadas
  (cortes cortos, hooks alternos para pauta, reencuadres, fragmentos para story) y exporta con la
  página de aprobación del cliente. Úsala cuando pidan "editá", "el primer corte", "montá el
  reel", "subtítulos", "sacá las derivadas", "multiplicá esto", "exportá", "la página de
  aprobación".
---

# Post — primer corte por agente, el editor corrige

> 🔑 **El primer corte lo hace el agente.** El editor de video da instrucciones, corrige y aprueba;
> casi no edita. El cómo se corre cada comando está en `brain/motor/README.md`.

| | |
|---|---|
| **Consume** | Nodos `pieza` aprobados · el material con selects en el Drive · § Movimiento del sistema visual de ② Branding |
| **Produce** | Masters, derivadas y previews en el Drive *(`04 Por postear`)* · nodo `tipo: pieza` actualizado con el link y la versión · la página de aprobación |

## 1 · Recepción del material

Se indexan los clips y se califican contra la rúbrica *(`motor/remotion/edit/RUBRIC.md`)*. Falta
de cobertura o audio que no sirve **vuelve a Pre** como dato. Si nadie marcó selects, el agente los
propone.

## 2 · El primer corte

1. **Guion visual:** el fotograma real de cada escena con su texto literal, para que el editor
   confirme posición y estilo **antes de renderizar** *(`motor/guion-visual/`)*.
2. **Montaje** con `build_reels.py` y Remotion: **el hook literal en el primer frame**, sin intro
   ni logo antes, HOOK-BODY-PAYOFF con los tiempos de la pieza, al ritmo que pide la marca.

## 3 · Marca y QA medido

Subtítulos con la fuente del sistema, dentro de la safe zone y revisados *(sin tildes cortadas)* ·
una sola forma de entrada de texto · el cierre de marca · temblor y color **medidos por toma** · la
voz se entiende sobre la música. **Logo tapado, se reconoce.**

## 4 · Multiplicar

| Derivada | Con qué |
|---|---|
| Cortes más cortos, reencuadres, fragmentos para story | **ffmpeg directo** *(la mayoría)* |
| Variantes con texto animado | El motor |
| Hooks alternos para pauta | Solo cambian los primeros 3 s; el cuerpo es el mismo |

**Cada derivada sale del mismo material y del mismo costo fijo.** Es donde se gana volumen.

## 5 · Export y aprobación

Un archivo **por plataforma** con sus specs, sin watermark y con el id de la pieza en el nombre.
Previews livianos y **la página de aprobación** *(`motor/aprobacion/vercel/`)* donde el cliente
califica o pide cambios — se publica solo con el checklist completo. Cumple la ficha 5 de
`inherent/08-CRITERIOS-DE-ACEPTACION.md`.

## 6 · Lo que no hace

No genera video ni dobla: edita material real · no publica *(⑦ Posting)* · no reescribe el copy
*(vuelve a ③)*.
