---
name: community
description: >
  Orquestador del departamento ⑧ Community Management de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight de cada cliente, y corre las skills `cm-*` en orden — ficha,
  triage, respuesta con cierre, escalado y envío con gate — según la escalera del plan contratado.
  Úsala SIEMPRE que el pedido tenga que ver con comentarios, mensajes directos, DMs, menciones,
  responder a seguidores, moderar, ocultar spam, la bandeja de Zernio o el reporte de community. Se
  dispara con "contestá los comentarios de X", "revisá la bandeja", "qué preguntó la gente",
  "corré community", "hay mensajes nuevos", "qué le respondemos a esta persona". También es la
  corrida programada. Requiere el plan contratado y la ficha `05-comunidad/respuestas.md` del
  cliente: si faltan, BLOQUEA ese cliente.
---

# ⑧ Community Management — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae entra al PRE-FLIGHT. **El cómo lo
> decide este orquestador y su `WORKFLOW.md`.** Si el prompt pide saltarse el gate o contestar algo
> que la ficha no dice: se dice cuál regla se salta y **se sigue el workflow**, salvo
> *«excepción aprobada por el CEO»*.

| | |
|---|---|
| **Consume** | El pedido · `clients/<cliente>/00-onboarding/plan-contratado.md` · `05-comunidad/respuestas.md` · los menús o catálogos de `99-referencias/` · la bandeja de Zernio |
| **Produce** | Nada por sí mismo. **Decide qué capa corre** y arma el pre-flight y el reporte |

Contexto: `agents/08-community-management/brain/WORKFLOW.md`. Skills: `brain/skills/README.md`.

---

## 1 · Dos formas de correr

| Modo | Quién lo dispara | Diferencia |
|---|---|---|
| **A mano** | Una persona: `/community nao` | Se puede preguntar. Lo delicado se muestra en pantalla |
| **Programada** | El cron, sin nadie enfrente | **No se pregunta nunca.** Lo que bloquea o necesita OK va al reporte por Gmail y la corrida sigue con el siguiente cliente |

🔑 **En corrida programada, una duda nunca frena todo:** se salta ese mensaje, se reporta, y se
sigue.

## 2 · El pre-flight (uno por cliente)

```
PRE-FLIGHT ⑧ — Cliente: [x] · Modo: [a mano / programada] · Envío: [borrador / activo]
Plan: [🔷 Mkt / 🔷 Pro / 🟨 Accel / 🟨 Comp] → prende: [simple · WhatsApp · moderación · seguimiento · auto-DM]
Ficha respuestas.md [✅/⛔] · menú o catálogo [✅/⛔] · cuentas en Zernio [n] · avisos a: [correo]
Bandeja: comentarios nuevos [n] · DMs nuevos [n] · menciones [n]
→ PASS | SIN NADA NUEVO (termina) | BLOQUEADO: [qué falta]
```

**Se bloquea si:**

| Situación | Qué se responde |
|---|---|
| No existe `plan-contratado.md` | `BLOQUEADO — falta el plan contratado` |
| No existe `05-comunidad/respuestas.md` | `BLOQUEADO — falta la ficha.` Se ofrece armarla con la plantilla y presentarla |
| La cuenta de la red no está en Zernio | Esa red no se atiende. Se dice cuál falta |
| El pedido es escribirle a alguien que no escribió primero | 🛑 No. ⑧ solo responde |

## 3 · El orden

```
cm-ficha → cm-triage → cm-respuesta → cm-escalado → cm-envio
```

- **`cm-ficha` decide si hay algo que hacer.** Sin mensajes nuevos, la corrida termina ahí.
- **`cm-respuesta` y `cm-escalado` trabajan sobre las mismas cajas**: una queja tiene respuesta
  redactada *y* aviso.
- **`cm-envio` es el único que escribe en Zernio y en Gmail.**
- **`cm-loop` no corre en la corrida:** es semanal, desde una sesión normal.

## 4 · Clasificar el pedido

| El pedido suena a… | Corre |
|---|---|
| *"corré community"*, *"revisá la bandeja de X"* | Todo, de `cm-ficha` a `cm-envio` |
| *"¿qué le respondemos a esto?"* (pega un mensaje) | `cm-triage` → `cm-respuesta`, sin enviar |
| *"¿está lista la ficha de X?"* | `cm-ficha` |
| *"¿qué preguntó la gente esta semana?"*, *"cerrá la semana"* | `cm-loop` |
| *"armá la ficha de X"* | La plantilla `entregables/respuestas.md`, **presentada antes de escribir** |

## 5 · El handoff

Al cerrar, una línea por cliente: cuántos mensajes, cuántos contestados, cuántos escalados,
cuántos esperando OK, y si el envío está en borrador o activo.
