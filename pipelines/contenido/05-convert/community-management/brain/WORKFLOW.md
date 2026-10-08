# Community Management — cómo trabaja

> **En una frase:** lee los comentarios y mensajes que entran a las redes del cliente, contesta lo
> que la ficha permite contestar, **lleva cada conversación a un siguiente paso** —pedir, reservar
> o escribir— y pasa lo que no le toca a la persona correcta.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 📅 Cuándo corre

**Community no vive en el ciclo del 1 al 20: corre todos los días.** Lo publicado desde el día 1 genera
conversación todos los días.

| Qué | Cuándo | Skill |
|---|---|---|
| **La corrida** | Programada **cada 2 horas dentro del horario de atención del cliente**, o a mano con `/community` | `cm-ficha` → `cm-triage` → `cm-respuesta` → `cm-escalado` → `cm-envio` |
| **El cierre de la semana** | Una vez por semana, desde una sesión normal | `cm-loop` |
| **La revisión del 20** | Con el resto del pipeline | `cm-loop` entrega su lectura del mes a Strategy |

🔑 **Una corrida sin mensajes nuevos termina en el primer paso.** No se gasta nada en revisar una
bandeja vacía.

---

## 0 · El plan contratado — qué se prende

**Lo primero de cada corrida: leer el plan del cliente** en
`clients/<cliente>/00-onboarding/plan-contratado.md`.

- 🛑 **Sin plan anotado, Community no corre para ese cliente:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo.** Lo que el plan no incluye no se hace aunque sea fácil.
- ⬜ **Tailor Made: manda Su pipeline** del `plan-contratado.md`, sin cuestionarlo. Si Community no está,
  no corre para ese cliente; si está, prende el nivel que declara —**«Básico» es la columna
  🔷 Marketing**—.

| Qué hace Community | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contesta lo simple** *(horarios, ubicación, menú o catálogo, precios publicados, links)* | ✅ | ✅ | ✅ | ✅ |
| **Pasa lo complejo al WhatsApp del cliente** | ✅ | ✅ | ✅ | ✅ |
| **Redes que atiende** | Las **Redes** del `plan-contratado.md` *(o las del plan por canal de Marketing, si existe)* | **Todas las del cliente, todos los días** | Todas | Todas |
| **Modera** *(oculta spam y abuso)* | — | ✅ | ✅ | ✅ |
| **Seguimiento** *(quién preguntó qué, avisos al COO, `seguimiento/`)* | — | ✅ | ✅ | ✅ |
| **Auto-DM por palabra clave y embudo de WhatsApp** | — | — | ✅ | ✅ |
| **Agente de WhatsApp a medida** | — | — | ✅ *(se construye en `05-comunidad/whatsapp/`)* | ✅ |

**Cómo se lee:**

- **En 🔷 Marketing, un evento, una reserva o una queja = darle al usuario el WhatsApp correcto del
  cliente, y listo.** No se registra ni se avisa: eso es seguimiento, y empieza en Pro.
- **Desde Pro, además se registra y se avisa al COO.**
- **El auto-DM por palabra clave es una automatización de Zernio** que corre sola, sin la corrida.
  Se arma solo en 🟨, cuando Marketing o Creatividad piden una palabra clave para una pieza.

---

## 1 · Las capas de la corrida

| Capa | Skill | Qué hace | Si falla |
|---|---|---|---|
| **0** | **`cm-ficha`** | Verifica plan, ficha y menú vigentes. Revisa si hay algo nuevo en la bandeja | Bloquea ese cliente y lo dice en el reporte |
| **1** | **`cm-triage`** | Clasifica cada comentario y DM en **una sola caja** | — |
| **2** | **`cm-respuesta`** | Escribe la respuesta con la ficha, la voz y **el cierre**. La pasa por `humanizar.py` | Si el dato no está en la ficha, no inventa: escala |
| **3** | **`cm-escalado`** | Eventos, reservas, quejas y lo que no está en la ficha: a quién y cómo | — |
| **4** | **`cm-envio`** | Decide qué sale solo, envía por Zernio, manda el reporte por Gmail | En modo borrador no envía nada |
| **↻** | **`cm-loop`** | Semanal: pasa el seguimiento al repo, propone FAQ nuevas, preguntas que son ideas para Creatividad | — |

---

## 2 · Qué sale solo y qué se escala

| Caja | Qué hace Community | ¿Sale solo? |
|---|---|---|
| 💬 **Apoyo** *(«qué rico», 👏, una etiqueta)* | Agradece corto, con la voz de la marca, y cierra | 🟢 Sí |
| 🛍️ **Pregunta simple** *(menú, horario, ubicación, precio publicado, cómo pedir)* | Contesta **solo con lo que dice la ficha** y cierra | 🟢 Sí |
| 🎉 **Evento** | Contesta, comparte el WhatsApp de eventos y pide el número del usuario | 🟢 La respuesta sí · 📬 **aviso al COO** *(Pro+)* |
| 📅 **Reserva** *(si el cliente reserva)* | Pide los datos que dice la ficha y confirma **que recibió**, nunca que reservó | 🟢 La respuesta sí · 📬 **aviso al COO** *(Pro+)* |
| ⏳ **Lo que todavía no existe** *(un lanzamiento, un taller sin fecha)* | «Viene pronto, ¿te avisamos?» | 🟢 Sí · se anota como interesado *(Pro+)* |
| 😠 **Queja** | Redacta una disculpa con tacto | 🟢 La respuesta sí · 🔴 **se escala al COO** |
| 🤝 **Colaboración · prensa · influencer · empleo** | No contesta | 🔴 **Se escala al COO** |
| ❓ **Algo que no está en la ficha** | No inventa | 🔴 **Se escala al COO** |
| 🚫 **Spam · hater · bait** | No contesta. Oculta si es abuso *(Pro+)* | ⚫ — |

🔒 **Nunca:** comprometer precio, fecha, disponibilidad o alcance que no estén en la ficha ·
mencionar a otro cliente · hablar de costos de Inherent · escribirle a alguien que no escribió
primero · discutir con un hater.

### 🧪 Modo borrador

**Todo cliente nuevo arranca en modo borrador:** la corrida redacta todo y **no envía nada.** El
reporte llega con las respuestas propuestas. **El COO decide cuándo se prende o se apaga el envío**, y
queda anotado en `05-comunidad/respuestas.md` → «Modo».

---

## 3 · 🎯 La regla de cierre

> **Toda respuesta termina en un siguiente paso concreto: pedir, reservar o escribir.** Persuasiva,
> inteligente y humana. **Nunca una respuesta que solo informa.**

| Si preguntan… | Responde y **cierra con** |
|---|---|
| **Horario** | El horario + la invitación a venir o a pedir |
| **Producto, menú o precio** | El dato + **el link de WhatsApp de la sede** y la app de pedidos, si existe |
| **Promoción** | Cómo funciona + el link para usarla |
| **Reserva** | Los datos que hacen falta + «te confirmamos en un momento» |
| **Evento** | «¡Con mucho gusto!» + el WhatsApp de eventos + su número |
| **Algo que viene** | «¿Te avisamos primero?» |

**Los links de WhatsApp llevan mensaje precargado** con el origen:
`wa.me/<número>?text=Hola, vengo de Instagram y quiero…`. **El cliente sabe de dónde llegó cada
conversación.** Los números y los textos viven en la ficha.

---

## 4 · Las reglas de cada plataforma

| Plataforma | Regla | Qué hace Community |
|---|---|---|
| **Instagram · comentarios** | Los links **no se pueden tocar** | Contesta corto en público y **manda el link por DM privado** |
| **Instagram · DM privado a un comentario** | **Uno solo por comentario**, dentro de 7 días. A quien no sigue la cuenta, IG **rechaza botones** y el intento gasta el DM | El primer DM va **en texto plano**, con el link escrito |
| **Instagram y Facebook · DMs** | Ventana de 24 h desde el último mensaje del usuario | Se contesta dentro de la ventana o no se contesta |
| **TikTok · comentarios** | Leer, responder, ocultar | Igual que IG, sin DM privado |
| **TikTok · DMs** | Solo cuentas Business. **Solo responde**: hasta 10 mensajes en 48 h desde el último del usuario | Nunca se abre una conversación |
| **LinkedIn · comentarios** | Leer y responder | Tono del cliente B2B |

---

## 5 · 📬 Los avisos

| Qué | A quién | Cómo |
|---|---|---|
| **El reporte de cada corrida** | El COO | Gmail, al correo que dice `05-comunidad/respuestas.md` → «Avisos». Plantilla: `entregables/reporte-de-corrida.md` |
| **Evento, reserva, queja, colaboración** | El COO | En el mismo correo, **arriba**, marcado 🔴 |
| **El evento al encargado del cliente** | El usuario le escribe directo | Por el link de WhatsApp de eventos de la ficha |

🔑 **Las corridas programadas no escriben en el repo.** Todo lo que entra al repo
(`seguimiento/`, FAQ nuevas) lo pasa `cm-loop` desde una sesión normal, y se presenta antes.

---

## 6 · Las entregas a otros departamentos

| A quién | Qué | Cuándo |
|---|---|---|
| **Creatividad** | Las preguntas que se repiten: **son reels con el hook ya escrito** | `cm-loop`, semanal |
| **Marketing** | Qué se pregunta por canal y qué objeciones aparecen | `cm-loop`, para el plan del ciclo |
| **Strategy** | La lectura del mes | La revisión del 20 |
| **El cliente** | Quejas repetidas y lo que la ficha no cubre | Por el COO |

---

## 7 · Los entregables

| Archivo | Dónde | Quién lo escribe |
|---|---|---|
| **`respuestas.md`** — la ficha | `clients/<cliente>/05-comunidad/` | El operador de agentes, con la plantilla `entregables/respuestas.md`. **Se presenta antes de escribirla** |
| **El reporte de cada corrida** | El correo del COO | `cm-envio` |
| **`seguimiento/<AAAA-MM>.md`** | `clients/<cliente>/05-comunidad/` | `cm-loop` *(Pro+)* |
