# Las skills de ⑧ Community Management — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `agents/08-community-management/brain/WORKFLOW.md` dice qué
pasa, en qué orden y con qué reglas; acá está el detalle de cada herramienta.

> **Cómo cargan:** cada carpeta de skill está **enlazada** en `.claude/skills/` de la raíz del repo
> (`.claude/skills/cm-triage` → `agents/08-community-management/brain/skills/cm-triage`). Es un
> enlace, no una copia: lo que se edita acá es lo que corre.
>
> **Cómo se invocan:** por su nombre — `/community` es el orquestador, `/cm-triage` una de sus capas.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.** Si arranca en una subcarpeta,
> las skills no aparecen.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`community`** | La puerta de entrada. Corre las capas en orden para cada cliente. **Si no sabés cuál usar, es esta.** |

## Las skills, en orden de la corrida

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`cm-ficha`** | Empieza la corrida · *"¿está lista la ficha de X?"* | PASS o BLOQUEADO por cliente · la lista de lo nuevo en la bandeja |
| **1** | **`cm-triage`** | Hay mensajes nuevos | Cada mensaje en **una caja** |
| **2** | **`cm-respuesta`** | *"contestá esto"*, *"¿qué le respondemos?"* | La respuesta con cierre, pasada por `humanizar.py` |
| **3** | **`cm-escalado`** | Evento, reserva, queja, colaboración, dato fuera de la ficha | El aviso y la respuesta puente |
| **4** | **`cm-envio`** | Las respuestas están escritas | Lo enviado por Zernio · el reporte por Gmail |
| **↻** | **`cm-loop`** | Una vez por semana · *"¿qué preguntó la gente?"* | `seguimiento/<AAAA-MM>.md` · FAQ nuevas propuestas · ideas para ④ Creatividad |

## Las herramientas de Zernio que se usan

| Para qué | Herramienta |
|---|---|
| Ver cuentas y perfiles | `accounts_list` · `profiles_list` |
| Comentarios de todas las publicaciones | `comments_list_inbox_comments` |
| Comentarios de una publicación | `comments_get_inbox_post_comments` |
| Responder un comentario en público | `comments_reply_to_inbox_post` |
| DM privado a quien comentó *(IG y FB, uno por comentario)* | `comments_send_private_reply_to_comment` |
| Ocultar un comentario | `comments_hide_inbox_comment` |
| Menciones | `mentions_list_inbox_mentions` · `mentions_reply_to_mention` |
| Conversaciones (DMs) | `messages_list_inbox_conversations` |
| Responder un DM | `messages_send_inbox_message` |
| Auto-DM por palabra clave *(🟨)* | `comment_automations_*` |

Lo que no está en la lista se busca con `search_tools`. **Toda herramienta que escribe pasa por
`cm-envio`.**
