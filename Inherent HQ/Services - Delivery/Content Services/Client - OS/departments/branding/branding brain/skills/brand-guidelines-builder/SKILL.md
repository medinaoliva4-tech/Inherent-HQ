---
name: brand-guidelines-builder
description: Compila el sistema de identidad de marca ya aprobado (verbal + visual) en un documento formal de Brand Guidelines que sirve como única fuente de verdad para consistencia. Usa esta skill cuando el usuario pida crear, actualizar o formalizar un manual de marca, brand book, style guide, o sistema de guidelines — o al cerrar cualquier proyecto de identidad de marca, o cuando se apruebe un cambio a logo, paleta, tipografía o tono de voz que deba propagarse a todo el Client-OS. No uses esta skill para decidir el posicionamiento (usa brand-positioning-cbbe) ni para revisar una pieza puntual (usa brand-consistency-qa) — esta skill solo documenta y consolida lo ya aprobado.
---

# Brand Guidelines Builder

## JOB
Consolidar en un solo documento formal todo lo que ya fue decidido y aprobado sobre la marca, para que sea la referencia obligatoria de cualquier ejecución futura — humana o de agente.

## INPUT
- `positioning.md` aprobado
- Identidad verbal aprobada (tono de voz, mensajes clave)
- Assets visuales aprobados: logo, paleta, tipografía (referencias al sistema de media — Jockey/Twelve Labs — no archivos pesados sueltos en GitHub)
- Reglas de uso ya validadas (clearspace, do's/don'ts, aplicaciones)

Si algún insumo no está aprobado todavía, no lo incluyas como definitivo — márcalo como "pendiente de aprobación" en el documento.

## OUTPUT
Documento de Brand Guidelines (`.docx` o `.pdf` vía skill correspondiente) con secciones estándar de la industria:

1. Brand story / positioning resumido
2. Logo — versiones, clearspace, tamaño mínimo, usos incorrectos
3. Paleta de color — HEX / RGB / CMYK / Pantone
4. Tipografía — primaria, secundaria, jerarquía
5. Tono de voz — con ejemplos de "sí" y "no"
6. Arquetipo y personalidad de marca
7. Aplicaciones — ejemplos reales en canales relevantes del cliente
8. Referencias a media system para assets pesados (no incrustar archivos grandes)

## ACTIONS
1. Verificar que cada insumo esté aprobado; si no, marcarlo pendiente en vez de inventar o asumir.
2. Estructurar el documento con las secciones fijas — no reordenar ni omitir.
3. Producir el archivo con la skill `docx` (o `pdf` si el destino lo requiere).
4. Vincular, no incrustar, cualquier asset pesado (video, alta resolución) desde el sistema de media aprobado.

## TOOLS
- Skill `docx` o `pdf` de Anthropic para la producción del documento final.
- Cowork: lectura del Client-OS completo (`/branding/`) para consolidar todas las fuentes.
- Sistema de media (Jockey/Twelve Labs) solo como referencia/link, nunca como archivo embebido pesado en GitHub.

## CONTEXT
Lee todo `/branding/` del Client-OS: positioning, briefs aprobados, identidad verbal, decisiones visuales previas.

## QA
- [ ] ¿Cada elemento del documento tiene trazabilidad a una decisión aprobada (no una idea nueva sin aprobar)?
- [ ] ¿No hay archivos pesados embebidos que debieran vivir en el sistema de media?
- [ ] ¿Es usable como referencia por un tercero (agente, freelancer, cliente) sin contexto adicional?

## HANDOFF
- Guardar en Client-OS (`/branding/guidelines.docx`).
- HUMAN GATE: aprobación final del Brand Manager antes de distribuir.
- Se convierte en input obligatorio de `brand-consistency-qa` para todas las revisiones futuras.
