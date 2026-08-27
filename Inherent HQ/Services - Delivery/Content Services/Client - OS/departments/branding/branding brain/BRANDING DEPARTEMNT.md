# DEPARTAMENTO: BRANDING

Este documento vive en la carpeta del departamento de Branding y gobierna cómo
Cowork, Chat, Agentes y Code deben operar cada vez que trabajan sobre la marca
de cualquier Client-OS activo. No es un resumen conceptual — es la instrucción
operativa. Si algo aquí contradice lo que estás a punto de generar, esto
manda.

---

## PURPOSE

Construir y mantener la identidad de marca de cada cliente —posicionamiento,
identidad verbal, identidad visual y consistencia— asegurando que ninguna
ejecución creativa se produzca sin una base estratégica aprobada.

El departamento existe para que ningún output de marca se genere "desde el
diseño hacia atrás". Siempre estrategia → creativo → producción → QA.

---

## INPUTS

- Client-OS activo (contexto de marca, research, historial de decisiones)
- Objetivo específico del proyecto (definido por el CEO, cliente, o Buzz)
- Research de mercado/competencia, si existe
- Assets aprobados previamente (logo, paleta, tono), si el cliente ya tiene marca

Si el Client-OS no tiene research base, no se asume — se señala como gap
antes de continuar.

---

## INTERNAL JOBS

Estos son los trabajos que el departamento realiza, no personas ni cargos:

1. **Definir/actualizar posicionamiento** — CBBE + arquetipo de marca
2. **Traducir posicionamiento en dirección de proyecto** — el creative brief
3. **Producir identidad verbal** — tono, mensajes clave (hoy vive dentro del
   brief; se separa como job propio solo si el volumen lo justifica)
4. **Producir identidad visual** — logo, paleta, tipografía (trabajo de
   Art Director/Designer humano o Claude Design; Chat/Cowork no ejecutan
   craft visual, solo documentan y dirigen)
5. **Consolidar el sistema en guidelines** — la única fuente de verdad
6. **Auditar consistencia** — antes de cualquier entrega a cliente

---

## OUTPUTS

- `positioning.md`
- `brief-[proyecto].md`
- `guidelines.docx` (o `.pdf`)
- Reporte de QA (PASS/FAIL con notas accionables)
- Assets visuales/verbales aprobados (producidos fuera de Chat/Cowork cuando
  son craft, documentados dentro del Client-OS)

### Entregables canónicos de este flujo

1. **Moodboard en Milanote** — creado y curado por humano. El repo guarda `moodboard.md` con enlace, owner, fecha, estado y decisiones aprobadas.
2. **Brand Guideline en Figma** — ejecutado por agente en Claude Code mediante **FigWright**, nunca mediante el MCP oficial de Figma. El repo guarda `brand-guideline.md` con enlace a Figma, versión, inputs, QA y export final en Drive.

El moodboard aprobado es input bloqueante del guideline. El guideline no puede inventar códigos visuales ausentes del moodboard, posicionamiento o assets.

---

## CONTEXT

Antes de generar cualquier cosa para este departamento, leer siempre:

- `/branding/positioning.md` del Client-OS activo (si existe)
- `/branding/briefs/` — proyectos anteriores relevantes
- `/branding/guidelines.docx` — si ya existe sistema de marca
- Referencias del sistema de media (Jockey/Twelve Labs) — nunca archivos
  pesados sueltos en GitHub

Nunca operar sobre una marca sin haber leído lo que ya existe. Repetir
research o reinventar posicionamiento ya aprobado es duplicación —
prohibido por la SIMPLICITY RULE.

---

## SKILLS — USO OBLIGATORIO, NO OPCIONAL

Antes de generar cualquier entregable de Branding, verificar y ejecutar en
este orden. Esto es una compuerta (gate), no una sugerencia:

**1. `brand-positioning-cbbe`**
Si no existe `positioning.md` aprobado para el Client-OS activo → correr
esta skill ANTES de cualquier otra cosa. Ningún brief, pieza, o guideline
se genera sobre un posicionamiento inexistente o no documentado.

**2. `brand-creative-brief`**
Antes de producir cualquier pieza creativa, campaña, rediseño, o contenido
de marca (incluso si lo pide Content, Social o Media Buying, no solo
Branding) → correr esta skill. Prohibido saltar directo a ejecución
visual/verbal sin un brief aprobado. Si el usuario pide "hazme un post" o
"diseña esto" y no hay brief para ese proyecto, generarlo primero — no
preguntar si quiere saltárselo, generar el brief y presentarlo para
aprobación.

**3. `brand-consistency-qa`**
Antes de marcar cualquier entregable como "listo para cliente" → correr
esta skill contra el brief del proyecto y las guidelines vigentes. Si no
hay brief o guidelines disponibles, señalarlo como bloqueo — no evaluar a
ciegas ni aprobar por default.

**4. `brand-guidelines-builder`**
Al cerrar un proyecto de identidad de marca, o cuando se apruebe un cambio
a logo, paleta, tipografía o tono de voz → correr esta skill y actualizar
el repo del Client-OS. No dejar cambios de sistema sin documentar.

**Regla de bloqueo:** si el CEO o un agente piden un entregable de marca y
falta el eslabón anterior de la cadena (positioning → brief → ejecución →
QA), el siguiente paso correcto es generar ese eslabón faltante, no
improvisar el entregable final. Señalarlo explícitamente: "esto requiere
[skill] primero porque no existe [output]" y proceder a generarlo.

---

## HUMAN GATES

Ningún output de este departamento se considera final sin aprobación humana:

| Output | Aprueba |
|---|---|
| Positioning | CEO / Brand Strategist |
| Creative Brief | Creative Director |
| Ejecución (visual/verbal) | Creative Director |
| Reporte QA → envío a cliente | Brand Manager / Account |
| Brand Guidelines | Brand Manager |

Claude nunca aprueba su propio trabajo. `brand-consistency-qa` es una
verificación técnica, no un reemplazo de la aprobación humana final.

---

## AGENT WORK

Un agente (Buzz) puede, sin intervención humana en el momento:

- Verificar si existe positioning/brief/guidelines antes de aceptar una
  tarea, y señalar el gap
- Generar borradores de brief o reportes de QA para revisión
- Correr QA recurrente sobre entregables ya producidos
- Actualizar el repo del Client-OS con outputs ya aprobados

Un agente NO puede, sin humano:

- Aprobar un positioning, brief o guideline como definitivo
- Marcar un asset como "listo para cliente" sin pasar por `brand-consistency-qa`
- Modificar logo, paleta o tono de voz ya aprobados sin HUMAN GATE

---

## CODE EXECUTION

Usar Code (Claude Code) cuando el trabajo de Branding requiera:

- Generación o transformación de assets en lote
- Exportar guidelines a múltiples formatos/plataformas
- Automatizar la actualización del repo del Client-OS al aprobarse cambios
- Integraciones con el sistema de media (indexado, referencias)

No usar Code para decisiones de posicionamiento, tono o dirección creativa
— eso es Chat/Cowork con juicio humano en el loop.

---

## QA

La capa de calidad del departamento es la skill `brand-consistency-qa`,
aplicada contra:

1. On-brief (alineación con el brief del proyecto) — criterio bloqueante
2. Diferenciación
3. Impacto emocional / coherencia con el arquetipo
4. Claridad del mensaje
5. Calidad de ejecución técnica
6. Consistencia con guidelines vigentes

Un FAIL en "on-brief" invalida el resultado aunque el resto pase.

---

## HANDOFF

- Todo output final se guarda en `/branding/` del Client-OS correspondiente.
- Status y coordinación de estos entregables se comunican vía Buzz.
- La entrega a cliente final siempre pasa por Brand Manager/Account como
  último HUMAN GATE, nunca sale directo de Chat/Cowork/Agente.

---

## LATER (no implementado todavía — no bloquea la operación actual)

- Skill separada de identidad verbal (naming/tagline como output propio)
- Skill de research competitivo estructurado
- Automatización de indexado en el sistema de media vía Code

No construir estas hasta que el volumen de trabajo lo justifique. Ver
SIMPLICITY RULE.
