---
name: cm-triage
description: >
  Paso 1 de ⑥ Community — clasifica cada comentario, DM y mención nuevo en una sola caja antes de
  escribir nada (apoyo, pregunta simple, evento, reserva, lo que todavía no existe, queja,
  colaboración, fuera de la ficha, spam) y decide qué se escala y a quién. Úsala en cada corrida,
  o cuando peguen un mensaje y pregunten "¿qué es esto?", "¿hay que contestarle?", "¿esto es una
  queja?", "¿a quién le pasamos esto?". Nunca escribe respuestas: clasifica y escala.
---

# cm-triage — clasificar y escalar

**Se clasifica antes de escribir.** El valor de cada mensaje no es igual, y la caja decide qué
pasa con él.

## 1 · Las cajas

| Caja | Cómo se reconoce | Sigue a |
|---|---|---|
| 💬 **Apoyo** | Elogio, emoji, etiqueta a un amigo, «qué rico» | `cm-respuesta` · 🟢 |
| 🛍️ **Pregunta simple** | Horario, ubicación, menú, precio, «¿tienen…?», «¿cómo pido?», promociones | `cm-respuesta` · 🟢 |
| 🎉 **Evento** | Cumpleaños, empresa, grupo grande, «¿hacen eventos?», cotización | `cm-respuesta` + escalado (§3) |
| 📅 **Reserva** | «Quiero reservar», mesa, fecha y hora | `cm-respuesta` + escalado (§3) |
| ⏳ **Lo que viene** | Pregunta por algo que la ficha marca como «próximamente» | `cm-respuesta` · 🟢 |
| 😠 **Queja** | Mala experiencia, pedido equivocado, demora, trato | `cm-respuesta` + escalado (§3) · 🔴 |
| 🤝 **Colaboración** | Influencer, prensa, proveedor, alianza, empleo | escalado (§3) · 🔴 |
| ❓ **Fuera de la ficha** | Pregunta razonable cuya respuesta no está en la ficha | escalado (§3) · 🔴 |
| 🚫 **Spam · hater** | Promoción ajena, link sospechoso, insulto, bait, bots | ⚫ Nada. Ocultar si es abuso *(con seguimiento)* |

## 2 · Reglas

- **Una sola caja por mensaje.** Si trae dos cosas («qué rico, ¿abren el domingo?»), manda la de
  mayor valor: **pregunta simple**.
- **Queja gana a todo.** Si hay una queja, es queja aunque también pregunte algo.
- **Una crítica no es un hater.** Quien critica con un argumento recibe respuesta con tacto; quien
  solo insulta, no.
- **La duda va a «fuera de la ficha»**, nunca a la caja que permite contestar solo.

## 3 · La salida

Una tabla por cliente: `id`, red, tipo (comentario / DM / mención), usuario, texto, **caja**, y si
es comentario, la publicación donde cayó.

Las preguntas que **se repiten** se marcan aparte: son FAQ que faltan en la ficha e ideas para
③ Marketing y Creative. Las junta `resultados` cada mes.

## 4 · El escalado — a quién y cómo

| Caja | Escalera base | Con seguimiento *(si la ficha lo incluye)* |
|---|---|---|
| 🎉 **Evento** | El usuario recibe el WhatsApp de eventos de la ficha | + aviso al COO con usuario, red, qué pidió y su número si lo dio |
| 📅 **Reserva** | El usuario recibe el WhatsApp de la sede | + aviso al COO con los datos de la reserva |
| ⏳ **Lo que viene** | Se le dice que pronto | + se anota en la lista de interesados |
| 😠 **Queja** | El usuario recibe el WhatsApp de la sede | + aviso 🔴 al COO con la disculpa que se le contestó |
| 🤝 **Colaboración** | No se contesta | + aviso al COO |
| ❓ **Fuera de la ficha** | El usuario recibe el WhatsApp de la sede | + aviso al COO con la pregunta, para sumarla a la ficha |

El aviso va **arriba** del reporte, una línea por caso, con todo lo necesario para actuar sin abrir
la red:

```
🔴 [cliente] · [caja] · @usuario · [red] · «[lo que escribió]» · tel: [si lo dio] · → [qué se le contestó]
```

- **Nadie se queda sin respuesta** aunque se escale, salvo colaboración y spam.
- **El número que deja un usuario es un dato personal:** va en el aviso, nunca en una respuesta pública.
