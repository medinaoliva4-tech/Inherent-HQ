---
name: cm-triage
description: >
  Capa 1 de ⑧ Community Management — clasifica cada comentario, DM y mención nuevo en una sola
  caja antes de escribir nada: apoyo, pregunta simple, evento, reserva, lo que todavía no existe,
  queja, colaboración, fuera de la ficha, o spam. La caja decide si sale solo, si escala o si se
  ignora. Úsala después de cm-ficha, o cuando peguen un mensaje y pregunten "¿qué es esto?",
  "¿hay que contestarle?", "¿esto es una queja?". Nunca escribe respuestas: solo clasifica.
---

# cm-triage — Capa 1

**Se clasifica antes de escribir.** El valor de cada mensaje no es igual, y la caja decide qué
pasa con él.

## 1 · Las cajas

| Caja | Cómo se reconoce | Sigue a |
|---|---|---|
| 💬 **Apoyo** | Elogio, emoji, etiqueta a un amigo, «qué rico» | `cm-respuesta` · 🟢 |
| 🛍️ **Pregunta simple** | Horario, ubicación, menú, precio, «¿tienen…?», «¿cómo pido?», promociones | `cm-respuesta` · 🟢 |
| 🎉 **Evento** | Cumpleaños, empresa, grupo grande, «¿hacen eventos?», cotización | `cm-respuesta` + `cm-escalado` |
| 📅 **Reserva** | «Quiero reservar», mesa, fecha y hora | `cm-respuesta` + `cm-escalado` |
| ⏳ **Lo que viene** | Pregunta por algo que la ficha marca como «próximamente» | `cm-respuesta` · 🟢 |
| 😠 **Queja** | Mala experiencia, pedido equivocado, demora, trato | `cm-respuesta` (borrador) + `cm-escalado` · 🔴 |
| 🤝 **Colaboración** | Influencer, prensa, proveedor, alianza, empleo | `cm-escalado` · 🔴 |
| ❓ **Fuera de la ficha** | Pregunta razonable cuya respuesta no está en la ficha | `cm-escalado` · 🔴 |
| 🚫 **Spam · hater** | Promoción ajena, link sospechoso, insulto, bait, bots | ⚫ Nada. Ocultar si es abuso *(Pro+)* |

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

Las preguntas que **se repiten** se marcan aparte: son materia de `cm-loop` y de ④.
