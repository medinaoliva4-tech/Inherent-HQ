---
name: cm-envio
description: >
  Capa 4 de ⑧ Community Management — el único paso que escribe afuera. Aplica el gate (qué sale solo,
  qué espera el OK del CEO, qué no sale), respeta el modo borrador, envía por Zernio respetando las
  reglas de cada plataforma, y manda el reporte de la corrida por Gmail con los avisos arriba. Úsala
  al final de cada corrida, o cuando pidan "mandá las respuestas", "¿qué se envió?", "aprobado,
  enviá la de la queja". Acción hacia afuera: en modo borrador no envía nada.
---

# cm-envio — Capa 4

| | |
|---|---|
| **Lee** | Las respuestas de `cm-respuesta` · los avisos de `cm-escalado` · `respuestas.md` → «Modo» y «Avisos» |
| **Produce** | Lo enviado por Zernio · el reporte por Gmail con `entregables/reporte-de-corrida.md` |

## 1 · El gate

| Si la respuesta es… | Modo **borrador** | Modo **activo** |
|---|---|---|
| 🟢 Apoyo, pregunta simple, evento, reserva, lo que viene | Va al reporte, **no se envía** | **Se envía** |
| 🔴 Queja | Va al reporte | Va al reporte. **Sale solo con el OK del CEO** |
| 🔴 Colaboración, fuera de la ficha | Va al reporte | Va al reporte |
| ⚫ Spam, hater | Se reporta | Se oculta si es abuso *(Pro+)* y se reporta |

🛑 **El modo lo cambia solo el CEO**, en la ficha. La corrida nunca lo cambia sola.

## 2 · Cómo se envía

| Qué | Herramienta | Cuidado |
|---|---|---|
| Respuesta pública a un comentario | `comments_reply_to_inbox_post` | Corta, sin link en Instagram |
| El link por DM a quien comentó *(IG y FB)* | `comments_send_private_reply_to_comment` | **Uno solo por comentario y en texto plano.** Un error gasta el único intento: no se reintenta |
| Respuesta a un DM | `messages_send_inbox_message` | Dentro de la ventana de la plataforma (24 h Meta · 48 h y 10 mensajes TikTok) |
| DM en «requests» | `messages_accept_conversation_request` | La respuesta acepta la conversación |
| Ocultar | `comments_hide_inbox_comment` | Solo abuso o spam, desde Pro |

**Cada envío lleva el `account_id` exacto de la ficha.** Si una herramienta devuelve que la cuenta
es ambigua, no se elige a ojo: se reporta.

## 3 · El reporte

Un correo por corrida al correo de «Avisos» de la ficha, con la plantilla
`entregables/reporte-de-corrida.md`:

1. **Arriba:** los avisos 🔴 de `cm-escalado`
2. **Lo que espera OK:** respuestas en borrador, con el mensaje original al lado
3. **Lo enviado:** red, usuario, qué se contestó y a quién se le mandó link
4. **Lo que falló:** con el error

**Asunto:** `⑧ [cliente] · [n] nuevos · [n] 🔴 · [borrador/activo]`. Si no hubo nada nuevo, no se
manda correo.

Sin el MCP de Gmail: `BLOQUEADO — falta Gmail. Instalala: ver INSTALAR.md § Gmail`.

## 4 · Nunca

- Escribirle a alguien que no escribió primero.
- Reenviar una respuesta que falló sin entender por qué.
- Mandar el mismo texto idéntico a muchos usuarios seguidos: se varía.
