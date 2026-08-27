---
name: brand-positioning-cbbe
description: Construye, revisa o audita la Plataforma de Posicionamiento de una marca aplicando la pirámide CBBE de Keller (Saliencia → Performance/Imagery → Juicios/Sentimientos → Resonancia) y selecciona el arquetipo de marca (Jung / Mark & Pearson) que ancla el territorio emocional y verbal. Usa esta skill SIEMPRE que el usuario pida definir, actualizar, revisar o auditar el posicionamiento, propósito, valores, diferenciador, público objetivo o arquetipo de una marca — o antes de generar un creative brief, brand guideline, naming, tagline o pieza de identidad verbal/visual si el Client-OS aún no tiene un positioning.md documentado. Es un requisito BLOQUEANTE: ninguna otra skill de Branding puede correr sin este output como input.
---

# Brand Positioning (CBBE + Arquetipo)

## JOB
Producir la Plataforma de Posicionamiento de una marca: el documento que todo lo demás (brief, verbal, visual, guidelines) debe expresar. No es una conversación estratégica abierta — es la generación de un artefacto estructurado y verificable.

## INPUT
- Categoría / industria del cliente
- Research disponible (competidores, audiencia, insights) — si no existe, pedirlo o generarlo con `web_search` / `places_search` según aplique
- Client-OS: contexto de marca ya existente (si lo hay)
- Objetivo de negocio explícito del CEO/cliente para este posicionamiento

Si falta el research base, no inventes datos de mercado: pide el research o señálalo como GAP en el documento.

## OUTPUT
Un documento `positioning.md` (o `.docx` si el destino es cliente final — usar skill `docx`) con estas secciones fijas:

1. **Categoría y contexto competitivo** (qué comunican los competidores, dónde hay espacio)
2. **Target** — con psicografía, no solo demografía
3. **Insight** — la tensión o verdad de consumidor que la marca resuelve
4. **Positioning statement** — una sola frase, formato: "Para [target], [marca] es la [categoría] que [diferenciador] porque [razón para creer]"
5. **Mapeo CBBE** — un renglón por nivel, sin saltarse ninguno:
   - Saliencia: ¿en qué categoría/necesidad se piensa primero?
   - Performance: atributos funcionales concretos
   - Imagery: atributos experienciales/simbólicos
   - Juicios: calidad, credibilidad, consideración, superioridad percibidas
   - Sentimientos: qué emoción produce el uso/contacto con la marca
   - Resonancia: nivel de lealtad/conexión buscado
6. **Arquetipo** — cuál de los 12 (Jung/Mark & Pearson) y por qué es el más "ownable" frente a competidores, no solo el más atractivo
7. **Diferenciador (USP)** — una frase, defendible, no genérica
8. **Proof points** — evidencia concreta que sostiene el diferenciador

## ACTIONS
1. Leer research y contexto disponible.
2. Si hay gaps de research, señalarlos explícitamente antes de continuar — no rellenar con suposiciones.
3. Redactar cada sección en orden. El positioning statement se escribe DESPUÉS del insight y el mapeo CBBE, nunca antes (evita "ancla" prematura).
4. Verificar el diferenciador contra el checklist de QA antes de entregar.

## TOOLS
- Chat: respuesta estructurada en el chat o artifact markdown si el documento se va a reutilizar/guardar.
- Cowork: leer/escribir en el repo del Client-OS (`/branding/positioning.md`); usar skill `docx` solo si el entregable es para presentar a cliente externo.
- `web_search` si se necesita research competitivo adicional y no hay MCP de datos conectado.

## CONTEXT
Debe leer, si existen: research previo del cliente, brand context del Client-OS, cualquier positioning anterior (para saber si esto es creación o revisión).

## QA (checklist obligatorio antes de handoff)
- [ ] ¿El diferenciador es específico, no "para todos"?
- [ ] ¿Está anclado en una verdad del negocio, no en una aspiración vacía?
- [ ] ¿Es defendible frente al competidor más cercano nombrado en el research?
- [ ] ¿Los 6 niveles de CBBE están cubiertos, no solo Performance?
- [ ] ¿El arquetipo elegido es diferente al de los competidores directos mapeados?

Si algún ítem falla, no se entrega — se corrige antes.

## HANDOFF
- Guardar como `positioning.md` en el Client-OS (`/branding/`).
- Dispara automáticamente la skill `brand-creative-brief` como siguiente paso si el objetivo original era producir una pieza creativa.
- HUMAN GATE: aprobación del CEO o del Brand Strategist humano antes de que cualquier otra skill lo use como base.
