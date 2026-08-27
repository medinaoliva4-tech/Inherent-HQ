---
name: brand-creative-brief
description: Genera el Creative Brief — el documento puente entre el posicionamiento estratégico y cualquier ejecución creativa (campaña, pieza, rediseño, contenido, naming, verbal o visual). Usa esta skill SIEMPRE que el usuario pida crear una campaña, pieza creativa, rediseño de marca, contenido de branding, o cualquier entregable de Creative/Content/Social/Media Buying que dependa de una marca — incluso si el usuario no menciona la palabra "brief". Es un requisito BLOQUEANTE: ninguna ejecución visual o verbal debe producirse sin este documento aprobado primero. Si no existe un positioning.md en el Client-OS, esta skill debe detenerse y disparar primero la skill brand-positioning-cbbe.
---

# Creative Brief Generator

## JOB
Traducir la Plataforma de Posicionamiento en dirección accionable para una pieza/proyecto específico — "decir dónde apuntar, no cómo llegar". Este es el punto donde más fallan los proyectos de branding cuando se salta.

## INPUT
- `positioning.md` del Client-OS (OBLIGATORIO — si no existe, detener y correr `brand-positioning-cbbe` primero)
- Objetivo específico de este proyecto (qué se va a producir y para qué)
- Constraints: canal, deadline, presupuesto, formato
- Referencias visuales/verbales que el cliente haya aprobado o rechazado antes (si existen)

## OUTPUT
Documento `brief-[nombre-proyecto].md` con campos fijos, sin excepción:

1. **Business problem** — qué problema de negocio resuelve esta pieza
2. **Single-minded proposition** — una sola idea, heredada del positioning statement
3. **Target** — heredado del positioning; ajustado si el proyecto tiene un sub-segmento
4. **Objetivo de la pieza** — qué debe lograr específicamente (no genérico tipo "generar awareness")
5. **Tono / Arquetipo heredado** — tomado directo del positioning.md, no reinventado
6. **Mandatorios** — logo, legal, claims obligatorios, restricciones de marca
7. **Criterios de evaluación ("crit")** — 3 a 5 criterios concretos y verificables, acordados ANTES de ver el trabajo (ej.: on-brief, diferenciación, impacto emocional, claridad, viabilidad de producción)
8. **Referencias / no-referencias** — qué imitar y qué evitar explícitamente
9. **Fecha de entrega y siguiente paso**

## ACTIONS
1. Verificar que `positioning.md` existe y está aprobado. Si no, detener.
2. Extraer del positioning: statement, arquetipo, diferenciador — no reinterpretarlos.
3. Redactar los criterios de "crit" ANTES de que exista cualquier ejecución (evita evaluación subjetiva post-hoc).
4. Producir el brief en el formato fijo — nunca en prosa libre.

## TOOLS
- Chat: artifact markdown si el brief se va a reutilizar por otras skills/agentes en la conversación.
- Cowork: escribir en Client-OS (`/branding/briefs/`), referenciar `positioning.md` por lectura directa del repo.

## CONTEXT
Lee obligatoriamente `positioning.md`. Si el proyecto involucra Content, Social o Media Buying, también debe leer cualquier calendario o campaña activa relevante del Client-OS para evitar contradicciones.

## QA
- [ ] ¿Cada campo del brief remite explícitamente al positioning, no a una idea nueva no aprobada?
- [ ] ¿Los criterios de "crit" son verificables (sí/no), no subjetivos ("que se vea bien")?
- [ ] ¿La single-minded proposition es UNA sola idea, no una lista?

## HANDOFF
- HUMAN GATE obligatorio: aprobación del Creative Director antes de pasar a producción (Art Director / Designer / Copywriter / Code).
- El brief aprobado es el input fijo para cualquier ejecución posterior — Creative, Content, Social, Media Buying lo consumen sin reinterpretarlo.
- Al finalizar la ejecución, dispara `brand-consistency-qa` contra este mismo brief antes de marcar el output como listo para cliente.
