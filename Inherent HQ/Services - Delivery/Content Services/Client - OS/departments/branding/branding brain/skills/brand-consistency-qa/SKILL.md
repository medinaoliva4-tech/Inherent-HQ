---
name: brand-consistency-qa
description: Audita cualquier output creativo (copy, diseño, campaña, contenido, pieza social, material de media buying) contra el creative brief y las brand guidelines vigentes ANTES de entregarlo al cliente o marcarlo como aprobado. Usa esta skill SIEMPRE antes de marcar como "listo para cliente" cualquier entregable de Creative, Content, Social Media, Branding o Media Buying, y siempre que el usuario pida revisar, auditar o dar el visto bueno a una pieza. Es un requisito BLOQUEANTE de calidad — ningún entregable pasa a aprobación de cliente sin pasar por esta skill primero.
---

# Brand Consistency QA

## JOB
Aplicar el mismo criterio crítico que en una agencia humana aplican Creative Director + Brand Manager, pero como verificación explícita y repetible antes de entrega.

## INPUT
- El asset a revisar (texto, imagen, doc, o descripción del asset si no es legible directamente)
- `brief-[proyecto].md` correspondiente (OBLIGATORIO)
- `guidelines.docx` del Client-OS (OBLIGATORIO si existe)

Si falta el brief o las guidelines, la skill no puede auditar "on-brief" de forma confiable — señálalo como bloqueo, no evalúes a ciegas.

## OUTPUT
Reporte de QA con este formato fijo:

```
ASSET: [nombre/descripción]
BRIEF: [referencia]

| Criterio | Pass/Fail | Nota |
|---|---|---|
| On-brief (alineación estratégica) | | |
| Diferenciación | | |
| Impacto emocional / tono-arquetipo | | |
| Claridad del mensaje | | |
| Calidad de ejecución técnica | | |
| Consistencia con guidelines (logo/color/tipografía si aplica) | | |

VEREDICTO: PASS / FAIL
Si FAIL: acción específica requerida antes de re-someter.
```

Los criterios pueden ajustarse si el brief define criterios de "crit" propios — en ese caso, usar los del brief, no una lista genérica.

## ACTIONS
1. Cargar brief y guidelines antes de mirar el asset (evita evaluación sin marco de referencia).
2. Evaluar cada criterio de forma explícita, con nota concreta — no solo pass/fail sin justificación.
3. "On-brief" es el criterio más importante: si falla este, el veredicto general es FAIL aunque el resto pase.

## TOOLS
- `view` para inspeccionar archivos/imágenes directamente.
- Skills `docx`/`pdf`/`pptx` de lectura si el asset viene en esos formatos.
- Cowork: lectura directa del Client-OS para brief y guidelines.

## CONTEXT
Lee obligatoriamente el brief del proyecto y las guidelines vigentes del Client-OS antes de evaluar.

## QA (de la propia skill)
- [ ] ¿Se evaluó contra el brief real, no contra preferencia estética general?
- [ ] ¿Cada Fail tiene una acción correctiva específica, no solo "no me gusta"?

## HANDOFF
- Si FAIL: regresa al rol/agente que produjo el asset (Creative/Content/Social/Media Buying) con las notas específicas.
- Si PASS: pasa a HUMAN GATE (Brand Manager / Account) para aprobación final de cliente.
- No se salta este paso aunque el CEO tenga prisa — es el control que reemplaza al "crit" humano.
