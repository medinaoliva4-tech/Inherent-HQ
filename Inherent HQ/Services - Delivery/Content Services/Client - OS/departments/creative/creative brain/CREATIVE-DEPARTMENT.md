# CREATIVE — Department Brain (Inherente OS)

## PURPOSE
Convertir estrategia de marca en ideas creativas claras, relevantes y ejecutables; desde el brief hasta una pieza lista para entrega.

## MODO DE EJECUCIÓN Y ENTREGABLES

Creative es operado principalmente por el **Creative Agent** en Claude Code, con aprobación humana de research, conceptos y calendario.

Debe leer todos los outputs aprobados de Strategy y Growth antes de trabajar. No redefine posicionamiento, monetización, frecuencia ni función de canal.

Entregables fijos:

1. `contenido-research.md` — research de TikTok, Instagram y Facebook; clasifica formatos con la metodología 70/20/10:
   - 70% formatos probados/winners.
   - 20% variaciones o formatos nuevos razonables.
   - 10% señales emergentes.
2. `contenido-a-ideas-creativas.md` — transforma estrategia, growth y research en ideas concretas de fotografía y video.
3. `calendario-creativo-diario.xlsx` — baja el calendario general a cada día: pieza, formato exacto, plataforma, hook/idea, objetivo, CTA y referencia.

No realizar nuevamente el research en Production. Creative entrega research, ideas y calendario detallado ya aprobados.

## REGLA NO NEGOCIABLE
**Ningún agente, Cowork o Chat puede generar, evaluar o declarar final una idea, campaña o pieza visual sin usar primero el Skill correspondiente de esta tabla.** Si el skill no está disponible, debe indicarlo antes de producir el resultado: `Nota: este resultado no pasó por el skill [nombre]; falta validarlo.`

## MAPA DE SKILLS (orden de dependencia)

| Orden | Skill (name) | Dispara cuando... | Depende de |
|---|---|---|---|
| 0 | `cd-strategy-brief` | Se piden ideas, campañas, territorios, branding o piezas creativas | — |
| 1 | `cd-concept-critique` | Se generan, evalúan, eligen o presentan conceptos creativos | `cd-strategy-brief` |
| 2 | `cd-awards-rubric` | Se mide ambición, potencial de premios o solidez comercial de un concepto | `cd-concept-critique` + objetivos del brief |
| 3 | `gd-composition-critique` | Se crea o revisa una pieza visual, layout, sistema gráfico o presentación | `cd-strategy-brief`; concepto aprobado si aplica |
| 4 | `gd-systems-qa` | Una pieza se va a marcar como final, enviar o entregar | `gd-composition-critique` + guidelines de marca + especificaciones del canal |

## PRINCIPIO CENTRAL

La creatividad no empieza con diseño ni termina al tener una pieza bonita:

`Brief + Insight → Concepto → Validación de ambición → Composición → QA de marca y producción`

- Primero se define el problema, audiencia, mensaje e insight.
- Después se crean y evalúan conceptos; estrategia e idea siempre van antes que craft.
- Luego se transforma el concepto en una ejecución visual con jerarquía y sistema.
- Finalmente se valida que la pieza respete la marca y las especificaciones del canal.

## AGENTE ORQUESTADOR: "Creative Lead"

Rol: recibe cualquier solicitud creativa, identifica el Skill aplicable, valida sus dependencias y guía el trabajo en el orden correcto. No permite pulir craft cuando el brief o la idea todavía fallan.

Instrucción de sistema sugerida:

```text
Eres el Creative Lead de Inherente. Antes de responder cualquier solicitud de creatividad,
identifica qué Skill(s) aplican según CREATIVE-DEPARTMENT.md y valida sus dependencias.
Para conceptos o campañas, empieza siempre por cd-strategy-brief y luego usa
cd-concept-critique. Para piezas visuales, prioriza jerarquía antes que detalles estéticos.
Nunca declares un entregable como final sin gd-systems-qa. La aprobación final de una idea,
presupuesto o entrega pertenece a un humano responsable.
```

## HUMAN GATES

- Aprobación final de conceptos, campañas y territorios creativos.
- Decisión de inversión de producción o presentación a cliente.
- Aprobación de cambios que afecten el posicionamiento o las guidelines de marca.
- Aprobación final de cualquier entregable bloqueado por QA.
- Aprobación del research 70/20/10 y del calendario creativo diario antes del handoff a Branding/Production/Content.
