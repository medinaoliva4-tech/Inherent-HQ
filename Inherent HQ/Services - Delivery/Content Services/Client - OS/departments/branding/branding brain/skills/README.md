# Branding Department — Skills Package (NOW)

Estas 4 skills traducen los frameworks humanos del reporte de estructura de branding
(CBBE, arquetipos, brief creativo, brand guidelines, criterios de "crit") en
ejecución tangible para Claude/Cowork. No reemplazan el juicio del Creative
Director o del CEO — reemplazan el paso de "pensar en abstracto" por el paso
de "producir un artefacto verificable", que luego un humano aprueba.

## Orden de dependencia (no son intercambiables)

```
brand-positioning-cbbe   → produce positioning.md
        ↓
brand-creative-brief     → consume positioning.md, produce brief-[proyecto].md
        ↓
   [ejecución: Creative / Content / Social / Media Buying / Code]
        ↓
brand-consistency-qa     → consume brief + guidelines, produce reporte PASS/FAIL
        ↓
   [HUMAN GATE: aprobación cliente]

brand-guidelines-builder → corre en paralelo, al cerrar proyecto de identidad
                             o al aprobar cambios a logo/paleta/tono
```

## Snippet para pegar en el markdown del Departamento de Branding

```markdown
## SKILLS (obligatorias — no opcionales)

Antes de generar cualquier entregable de Branding, Claude/Cowork DEBE
verificar y ejecutar en este orden:

1. Si no existe `positioning.md` aprobado en el Client-OS →
   correr `brand-positioning-cbbe` ANTES de cualquier otra cosa.
2. Antes de producir cualquier pieza creativa, campaña, rediseño o
   contenido de marca → correr `brand-creative-brief`. Prohibido pasar
   directo a ejecución visual/verbal sin brief aprobado.
3. Antes de marcar cualquier entregable como "listo para cliente" →
   correr `brand-consistency-qa` contra el brief y las guidelines vigentes.
4. Al cerrar un proyecto de identidad o aprobar cambios al sistema de
   marca → correr `brand-guidelines-builder` y actualizar el repo.

## HUMAN GATES
- Positioning: aprueba CEO / Brand Strategist
- Brief: aprueba Creative Director
- QA: aprueba Brand Manager / Account antes de enviar a cliente
- Guidelines: aprueba Brand Manager
```

## LATER (no crear todavía — no son bloqueantes hoy)

- `brand-verbal-identity` — naming, tagline, arquitectura de mensajes.
  Justificación para esperar: hoy cabe como sección dentro del brief;
  se separa solo cuando el volumen de proyectos de naming lo justifique.
- `competitive-brand-audit` — research competitivo estructurado.
  Hoy se cubre como input manual/`web_search` dentro de
  `brand-positioning-cbbe`; se separa si el research se vuelve
  suficientemente recurrente y pesado como para merecer su propio output.
- Identidad visual (logo/paleta ejecutados) — esto sigue siendo trabajo de
  Art Director/Designer humano o herramientas de diseño (Claude Design),
  no una skill de texto. No forzar una skill donde el output real es
  visual-craft, no documento.

## Cómo instalar

Cada carpeta es un `SKILL.md` independiente. Para empaquetarlas como
`.skill` instalable con botón "Save skill", usa el script
`skill-creator/scripts/package_skill.py` sobre cada carpeta, o simplemente
copia cada `SKILL.md` a la ubicación de skills del Client-OS / Cowork.
