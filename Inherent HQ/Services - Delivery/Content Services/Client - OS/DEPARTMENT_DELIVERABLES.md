# Client-OS — mapa maestro de entregables

Este archivo define qué produce cada departamento, quién lo ejecuta y qué necesita antes de comenzar. La coordinación ocurre en Buzz; el trabajo vive en este Client-OS; los entregables aprobados para cliente se exportan a Drive.

## Modos de ejecución

- **Human + Cowork:** trabajo de juicio alto, dirección, factibilidad y aprobación.
- **Agente:** ejecución autónoma en Codex o Claude Code, siempre dentro del repo del cliente.
- **Híbrido:** el humano fija dirección o aprueba; el agente estructura, produce o automatiza.

## Flujo

```text
Strategy → Growth → Creative → Branding → Production → Content
                                             └──────→ Adobe/Postproduction
Todos los finales → Drive
Aprendizajes → Analytics → Strategy + Growth
```

## Matriz

| Departamento | Entregables canónicos | Ejecución principal | Gate humano |
|---|---|---|---|
| Strategy | `núcleo.md`, `ingeniería-inversa.md`, `estrategia-de-contenido.md`, `posicionamiento.md`, `contenido-por-canal.md`, `calendario-estratégico.xlsx` | Human + Cowork | Aprobación del núcleo, posicionamiento y calendario |
| Growth | `posicionamiento-a-monetización.md`, `estrategia-de-growth.md`, `calendario-final-de-contenido.xlsx` | Human + Cowork con soporte del Growth Lead | Pricing, economía, frecuencia y mezcla de growth |
| Creative | `contenido-research.md`, `contenido-a-ideas-creativas.md`, `calendario-creativo-diario.xlsx` | Agente Creative | Aprobación de research, conceptos y calendario diario |
| Branding | Moodboard en Milanote + `moodboard.md`; guideline en Figma + `brand-guideline.md` | Moodboard: humano. Guideline: agente Claude Code + FigWright | Moodboard y guideline final |
| Production | `validación-de-viabilidad.md`, `preproducción-shot-list.xlsx`, `production.html`, `post-production-list.md`, `adobe-edit-plan.md`, `final-assets-manifest.md` | Híbrido | Viabilidad, shot list, captura, selección y finales |
| Content | `static-content-plan.md`, tablero Figma y `static-content-manifest.md` | Agente + FigWright | QA de marca y aprobación de exports |

## Regla de no duplicación

- Creative hace el research 70/20/10 de formatos. Production no repite ese research.
- Production recibe ideas de video aprobadas y las convierte en producción ejecutable.
- Growth no crea el calendario diario: fija frecuencia, canal, formato general y objetivo.
- Creative convierte ese calendario general en piezas concretas día por día.
- Content no redefine estrategia ni ideas: convierte el calendario creativo aprobado en piezas estáticas.
- HQ conserva SOPs, skills y coordinación; ningún output de cliente se guarda en HQ.

## Handoff mínimo

Cada departamento entrega: archivo o link, versión, owner, skills usadas, estado QA, aprobación pendiente y siguiente departamento.
