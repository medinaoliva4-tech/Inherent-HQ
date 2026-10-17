---
name: cm-escalado
description: >
  Capa 3 de ⑧ Community Management — decide a quién y cómo pasa lo que ⑧ Community no resuelve solo: eventos,
  reservas, quejas, colaboraciones y cualquier pregunta cuya respuesta no está en la ficha. En
  la escalera base escalar es darle al usuario el WhatsApp correcto del cliente; con seguimiento
  (si la ficha lo incluye), además se registra y se avisa al COO. Úsala después de cm-triage cuando una caja escala, o cuando pidan
  "¿a quién le pasamos esto?", "avisame de los eventos", "esta persona se quejó".
---

# cm-escalado — Capa 3

| | |
|---|---|
| **Lee** | La caja de `cm-triage` · la ficha de oferta · `05-comunidad/respuestas.md` → «Eventos», «Reservas», «Avisos» |
| **Produce** | La línea del aviso para el reporte · el dato para `seguimiento/` *(con seguimiento)* |

## 1 · Qué se escala y a quién

| Caja | Escalera base | Con seguimiento *(si la ficha lo incluye)* |
|---|---|---|
| 🎉 **Evento** | El usuario recibe el WhatsApp de eventos de la ficha | + **aviso al COO** con usuario, red, qué pidió y su número si lo dio |
| 📅 **Reserva** | El usuario recibe el WhatsApp de la sede | + **aviso al COO** con los datos de la reserva |
| ⏳ **Lo que viene** | Se le dice que pronto | + se anota en la lista de interesados |
| 😠 **Queja** | El usuario recibe el WhatsApp de la sede | + **aviso 🔴 al COO** con la disculpa que se le contestó |
| 🤝 **Colaboración** | No se contesta | + **aviso al COO** |
| ❓ **Fuera de la ficha** | El usuario recibe el WhatsApp de la sede | + **aviso al COO** con la pregunta, para sumarla a la ficha |

## 2 · El aviso

Va **arriba** del reporte de la corrida, una línea por caso:

```
🔴 [cliente] · [caja] · @usuario · [red] · «[lo que escribió]» · tel: [si lo dio] · → [qué se le contestó]
```

🔑 **El aviso tiene todo lo necesario para actuar sin abrir Instagram.**

## 3 · Reglas

- **Nadie se queda sin respuesta** aunque se escale: siempre recibe al menos el WhatsApp correcto,
  salvo colaboración y spam.
- **El número que deja un usuario es un dato personal:** va en el aviso y en `seguimiento/`, nunca
  en una respuesta pública.
- **Una pregunta fuera de la ficha que se repite** es una FAQ que falta: la toma `cm-loop`.
