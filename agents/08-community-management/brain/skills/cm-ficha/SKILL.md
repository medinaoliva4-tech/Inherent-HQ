---
name: cm-ficha
description: >
  Capa 0 de ⑧ Community Management — antes de leer un solo mensaje, verifica que el cliente tenga
  plan contratado, ficha `05-comunidad/respuestas.md` completa y menú o catálogo vigente, lee qué
  prende la escalera de su plan, y revisa si hay algo nuevo en la bandeja de Zernio. Si no hay nada
  nuevo, la corrida termina acá sin gastar más. Úsala al empezar cada corrida, o cuando pidan
  "¿está lista la ficha de X?", "¿qué le falta a community de X?", "¿hay mensajes nuevos?".
  Bloquea el cliente si falta el plan o la ficha.
---

# cm-ficha — Capa 0

| | |
|---|---|
| **Lee** | `clients/<cliente>/00-onboarding/plan-contratado.md` · `05-comunidad/respuestas.md` · `99-referencias/` · Zernio |
| **Produce** | El PRE-FLIGHT del cliente · la lista de comentarios, DMs y menciones nuevos |

## 1 · El plan

Se lee el plan y se anota **qué prende** según la tabla de `WORKFLOW.md` → «0 · El plan
contratado». **Sin plan: BLOQUEADO.** No se asume Marketing «por mientras».

**⬜ Tailor Made:** prende lo que declara **Su pipeline** → ⑧ Community *(«Básico» = 🔷 Marketing)*. Si ⑧ Community no
está en su pipeline, no corre para ese cliente.

## 2 · La ficha — qué tiene que tener

| Bloque de `respuestas.md` | Si falta |
|---|---|
| **Cuentas** que atiende ⑧ Community y su ID de Zernio | ⛔ Bloquea |
| **Modo** (borrador / activo) y **avisos** (correo) | ⛔ Bloquea |
| **Voz** | ⛔ Bloquea. Si ②B Branding ya tiene guía, manda la guía |
| **Sedes:** horario, ubicación, WhatsApp, teléfono, cómo pedir | ⛔ Bloquea |
| **Menú o catálogo** (link al archivo de `99-referencias/`) | ⛔ Bloquea preguntas de producto; lo demás corre |
| **Promociones** con sus reglas | Se contesta «te confirmo» y se escala |
| **Eventos, reservas, lo que viene** | Se escala |
| **Lo que nunca se dice** | Se usa la lista base de `WORKFLOW.md` |

🔑 **Una ficha con fecha de hace más de un mes se marca ⚠️ en el reporte.** Horarios y precios
cambian; una respuesta con un precio viejo es peor que no contestar.

## 3 · ¿Hay algo nuevo?

Sin el MCP de Zernio: `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio`.

1. `accounts_list` → confirma que las cuentas de la ficha siguen conectadas.
2. Por cuenta: `comments_list_inbox_comments` · `messages_list_inbox_conversations` (inbox **y**
   `folder: requests`) · `mentions_list_inbox_mentions`.
3. **Nuevo = sin respuesta de la cuenta** después del último mensaje del usuario.

**Si no hay nada nuevo en ningún cliente, la corrida termina** con `SIN NADA NUEVO`.

## 4 · Cuidado

- 🛑 **No se lee la bandeja de un cliente con la ficha de otro.** Una corrida trabaja un cliente a la
  vez, aunque compartan perfil en Zernio: el ID de la cuenta decide de quién es cada mensaje.
- **Un DM en «requests»** es de alguien que no sigue la cuenta: se trata igual, pero la respuesta
  lo acepta (`messages_accept_conversation_request`).
