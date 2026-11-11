---
name: community
description: >
  Orquestador de ⑥ Community de Inherent. Lee el pedido, verifica la ficha de oferta y la ficha
  de respuestas del cliente, revisa si hay algo nuevo en la bandeja de Zernio y corre
  cm-triage → cm-respuesta según la escalera de la ficha. Úsala SIEMPRE que el pedido tenga que
  ver con comentarios, mensajes directos, DMs, menciones, responder a seguidores, moderar, ocultar
  spam, la bandeja de Zernio o el reporte de community. Se dispara con "contestá los comentarios
  de X", "revisá la bandeja", "corré community", "qué le respondemos a esta persona", /community.
  También es la corrida programada. Sin ficha de oferta o sin `05-comunidad/respuestas.md`,
  BLOQUEA ese cliente.
---

# ⑥ Community — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/06-community/brain/WORKFLOW.md`.
> Si el pedido pide enviar lo que no sale solo o contestar algo que la ficha no dice, se dice cuál
> regla se salta y se sigue el workflow, salvo «excepción aprobada por el CEO».

## 1 · Dos formas de correr

| Modo | Quién | Diferencia |
|---|---|---|
| **A mano** | Una persona: `/community nao` | Se puede preguntar. Lo delicado se muestra en pantalla |
| **Programada** | El cron, sin nadie enfrente | **No se pregunta nunca.** Lo que bloquea o se escala va al reporte y la corrida sigue con el siguiente cliente |

## 2 · Pre-flight — uno por cliente

| Qué se verifica | Si falta |
|---|---|
| `clients/<cliente>/00-onboarding/plan-contratado.md` y que ⑥ esté en la ficha | `BLOQUEADO — falta la ficha de oferta` · o no corre para ese cliente |
| `05-comunidad/respuestas.md` con cuentas e ID de Zernio, modo, avisos, voz y sedes | `BLOQUEADO — falta la ficha.` Se ofrece armarla con `entregables/respuestas.md` y presentarla |
| Menú o catálogo en `99-referencias/` | Bloquea solo las preguntas de producto |
| Zernio y Gmail conectados | `BLOQUEADO — falta Zernio / Gmail. Ver INSTALAR.md` |

🔑 **Una ficha de hace más de un mes se marca ⚠️ en el reporte:** un precio viejo es peor que no
contestar.

**¿Hay algo nuevo?** `accounts_list` → por cuenta: `comments_list_inbox_comments` ·
`messages_list_inbox_conversations` *(inbox y `folder: requests`)* · `mentions_list_inbox_mentions`.
Nuevo = sin respuesta de la cuenta después del último mensaje del usuario. **Si no hay nada nuevo, la
corrida termina aquí.** Una corrida trabaja un cliente a la vez: el ID de la cuenta decide de quién es
cada mensaje.

```
PRE-FLIGHT ⑥ Community — Cliente: [x] · Modo: [a mano / programada] · Envío: [borrador / activo]
Nivel: [..] → prende: [base · seguimiento · automatización]
Ficha [✅/⛔] · menú [✅/⛔] · cuentas en Zernio [n] · avisos a: [correo]
Bandeja: comentarios [n] · DMs [n] · menciones [n]
→ PASA | SIN NADA NUEVO | BLOQUEADO: [qué falta]
```

## 3 · El orden

```
pre-flight → cm-triage (clasifica y escala) → cm-respuesta (escribe, humaniza y envía)
```

| El pedido suena a… | Corre |
|---|---|
| *«corré community»*, *«revisá la bandeja»* | Todo |
| *«¿qué le respondemos a esto?»* | `cm-triage` → `cm-respuesta`, sin enviar |
| *«¿está lista la ficha de X?»* | Solo el pre-flight |
| *«armá la ficha de X»* | `entregables/respuestas.md`, presentada antes de escribir |

## 4 · El handoff

Una línea por cliente: mensajes nuevos, contestados, escalados, en borrador, y el modo de envío.
