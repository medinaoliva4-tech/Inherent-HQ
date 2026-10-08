# 08 · Community Management

**Atiende los comentarios y mensajes de las redes del cliente.** Corre en los cuatro planes; lo
que cambia es la profundidad.

| | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Responder comentarios y mensajes** | ✅ **Básico:** una IA contesta lo simple | ✅ Todos los días, todas las redes | ✅ | ✅ |
| **Pasar al interesado al WhatsApp del cliente** | ✅ | ✅ | ✅ | ✅ |
| **Moderar y dar seguimiento** | — | ✅ | ✅ | ✅ |
| **Auto-DM y embudo de WhatsApp** | — | — | ✅ | ✅ |
| **Agente de WhatsApp a medida** | — | — | ✅ | ✅ |

**Acción:** la bandeja de mensajes de la herramienta de publicación *(slot en
`inherent/05-OPERACION.md`)* + una API de IA.
**Quién lo corre:** el operador de agentes configura el agente una vez al mes con la información
del cliente, y queda atendiendo.
**Lo complejo sube:** lo que no es simple se pasa al WhatsApp del cliente o al plan siguiente.

La escalera completa está en `inherent/03-OFERTA.md` → «Community management».

---

## Las tres capas

```
PROPÓSITO   Cuidar los comentarios y mensajes de cada marca, con su voz, todos los días,
            y llevar cada conversación a un siguiente paso: pedir, reservar o escribir.
ACCIONES    Zernio por MCP → leer y responder comentarios y DMs, DM privado a un comentario,
            ocultar spam, automatizaciones por palabra clave.
            Gmail por MCP → el reporte de cada corrida y los avisos al COO.
LÓGICA      triage → respuesta con la ficha y cierre → escalado → envío → loop.
```

| | |
|---|---|
| **Cómo corre** | Claude Code con el plan de la empresa: programado, o a mano con `/community` |
| **Lo que lee** | `clients/<cliente>/00-onboarding/plan-contratado.md` · `05-comunidad/respuestas.md` · los menús o catálogos en `99-referencias/` |
| **Lo que escribe** | Nada en las corridas programadas: **contesta y manda el reporte por correo.** `cm-loop` pasa el seguimiento a `05-comunidad/seguimiento/<AAAA-MM>.md` desde una sesión normal |

El método completo: `brain/WORKFLOW.md`. Las skills: `brain/skills/README.md`.
