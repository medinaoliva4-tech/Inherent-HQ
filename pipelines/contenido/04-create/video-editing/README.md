# Video Editing

> Convierte el material grabado en **las piezas finales listas para publicar**. Creatividad dirigió, Producción rodó, **Video Editing ensambla y multiplica**. > **Quién ejecuta:** el **editor de video** (una persona) da las instrucciones y aprueba; **Claude Code hace todo el trabajo** con el motor del departamento — `motor/README.md`. Probado de punta a punta en cliente real (AKAI, oct 2026).

| | |
|---|---|
| **Pipeline** | Contenido |
| **Paso** | 04 · Create |
| **Propósito del paso** | Transformar datos y oportunidades en pilares, formatos, hooks, guiones y contenido |
| **Su responsabilidad** | Ensamblar el material grabado en piezas finales y multiplicarlo en derivados |
| **Artifact del equipo** | AI Creative Studio |
| **Entregable al cliente** | La página de aprobación del cliente (día 20) |

## Skills

Playbooks: úsalos en el orden que convenga, no son trámites obligatorios.

| Skill | Para qué |
|---|---|
| [`ve-recepcion`](brain/skills/ve-recepcion/SKILL.md) | Verifica qué llegó de Producción y es realmente editable antes de abrir un proyecto. |
| [`ve-armado`](brain/skills/ve-armado/SKILL.md) | El corte principal. |
| [`ve-marca`](brain/skills/ve-marca/SKILL.md) | Aplica § Movimiento del sistema visual al corte principal: subtítulos con su fuente, tamaño y posición dentro de la safe zone, la entrada de texto en su única forma,… |
| [`ve-derivadas`](brain/skills/ve-derivadas/SKILL.md) | Multiplica el corte principal auto-revisado en todas las piezas que puede dar: cortes más cortos, variantes de hook para pauta, reencuadres por formato y fragmentos… |
| [`ve-export`](brain/skills/ve-export/SKILL.md) | Exporta cada pieza con las specs de su plataforma y la nomenclatura que Posting cruza, y arma el manifiesto que cierra el ciclo. |
| [`ve-loop`](brain/skills/ve-loop/SKILL.md) | Cierra el ciclo con cuatro lecturas: cuántas piezas salieron de cada hora grabada, qué se devolvió y a quién, qué material quedó sin usar y qué spec falló siempre. |

## Herramientas

Figma, Vercel, ffmpeg, Remotion.

## Plantillas y motor

`brain/entregables/`, `brain/motor/`.

---

*El método anterior, más largo, está en el historial de git: `git show d2ebdaf:pipelines/contenido/04-create/video-editing/README.md`.*
