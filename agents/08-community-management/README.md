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

La escalera completa está en `inherent/03-OFERTA.md` → «Community management».

---

## Las tres capas

```
PROPÓSITO   Cuidar los comentarios y mensajes de cada marca, con su voz, todos los días,
            y llevar cada conversación a un siguiente paso: pedir, reservar o escribir.
ACCIONES    Zernio por MCP → leer y responder comentarios y DMs, DM privado a un comentario,
            ocultar spam, automatizaciones por palabra clave.
            Gmail por MCP → el reporte de cada corrida y los avisos al CEO.
LÓGICA      triage → respuesta con la ficha y cierre → escalado → envío con gate → loop.
```

| | |
|---|---|
| **Acción** | La bandeja de mensajes de Zernio *(slot «Publicación y bandeja de mensajes» en `inherent/05-OPERACION.md`)* + Claude Code con el plan de la empresa |
| **Quién lo corre** | El operador de agentes deja lista la ficha del cliente una vez al mes. Las corridas van solas, programadas, o a mano con `/community` |
| **Lo que lee** | `clients/<cliente>/00-onboarding/plan-contratado.md` · `05-comunidad/respuestas.md` · los menús o catálogos en `99-referencias/` |
| **Lo que escribe** | Nada en las corridas programadas: **contesta y manda el reporte por correo.** `cm-loop` pasa el seguimiento a `05-comunidad/seguimiento/<AAAA-MM>.md` desde una sesión normal |
| **Lo complejo sube** | Lo que no es simple se pasa al WhatsApp del cliente, al CEO o al plan siguiente |

El método completo: `brain/WORKFLOW.md`. Las skills: `brain/skills/README.md`.
