---
name: cm-respuesta
description: >
  Capa 2 de ⑧ Community Management — escribe la respuesta de cada comentario o DM con los datos de
  la ficha, la voz de la marca y un cierre que lleva a pedir, reservar o escribir. Persuasiva,
  inteligente y humana; nunca una respuesta que solo informa. Si el dato no está en la ficha, no lo
  inventa. Pasa todo por `humanizar.py` antes de entregarlo. Úsala cuando pidan "contestá esto",
  "¿qué le respondemos?", "escribí la respuesta", o después de cm-triage en cada corrida.
---

# cm-respuesta — Capa 2

| | |
|---|---|
| **Lee** | La caja de `cm-triage` · `05-comunidad/respuestas.md` (voz, sedes, links, promociones) · el menú o catálogo |
| **Produce** | La respuesta pública y, si hace falta, el DM privado — ya humanizados |

## 1 · 🎯 La regla de cierre

> **Toda respuesta termina en un siguiente paso concreto: pedir, reservar o escribir.**

| La respuesta… | ❌ Solo informa | ✅ Cierra |
|---|---|---|
| Horario | «Abrimos de 12 a 9.» | «Hoy te esperamos de 12 a 9 🍣 ¿Te lo llevamos a casa? Te dejo el link por DM.» |
| Producto | «Sí, tenemos ramen.» | «¡Sí! El de la casa es el favorito. Pídelo directo aquí 👉 [link]» |
| Apoyo | «¡Gracias!» | «¡Gracias, nos alegra mucho! ¿Cuándo vuelves por el siguiente? 😉» |

**El cierre va con el link de la ficha**, nunca inventado: el WhatsApp de la sede con su mensaje
precargado, la app de pedidos, o el WhatsApp de eventos.

## 2 · Cómo se escribe

| Regla | Por qué |
|---|---|
| **Responde la pregunta de verdad, en la respuesta** | Mandar a otro lado algo que se puede contestar ahí se siente como evasión |
| **El largo del mensaje del usuario** | A tres palabras no se le contesta un párrafo |
| **El nombre, una vez, al inicio** | Suena a persona |
| **De tú, nunca de usted ni de vos**, salvo que la voz de la ficha diga otra cosa | Así está publicado |
| **La voz de la marca de la ficha** | Dos marcas del mismo dueño no suenan igual |
| **Máximo un emoji por frase, y solo si la voz lo permite** | El emoji acompaña, no reemplaza |
| **Sin palabras de IA** | `humanizar.py` las marca |
| **Dato que no está en la ficha = no se escribe** | Pasa a `cm-escalado` |

## 3 · Por plataforma

| Dónde | Cómo |
|---|---|
| **Comentario de Instagram** | Público, corto, sin link (no se puede tocar). **El link va en el DM privado**, en texto plano |
| **DM** | Completo, con el link directo |
| **TikTok** | Público, corto. Si pide link: «te lo dejamos en el perfil» |
| **LinkedIn** | Más sobrio, sin emojis salvo que la voz los use |

## 4 · Las cajas especiales

| Caja | La respuesta |
|---|---|
| 🎉 **Evento** | Entusiasmo + el WhatsApp de eventos de la ficha + «¿nos compartes tu número para que te contacten?» |
| 📅 **Reserva** | Pide los datos que dice la ficha (nombre, fecha, hora, personas, teléfono) → «¡Listo! Te confirmamos en un momento». **Nunca «tu reserva está confirmada»** |
| ⏳ **Lo que viene** | «¡Viene pronto! ¿Te avisamos primero?» |
| 😠 **Queja** | Disculpa sin excusas, en sus palabras, y una salida concreta. **Queda en borrador hasta el OK del CEO** |

## 5 · Antes de entregar

```bash
python3 agents/08-community-management/brain/skills/cm-respuesta/humanizar.py respuesta.txt
```

Limpia guiones largos, comillas curvas y caracteres invisibles, y **marca** lo que suena a IA o a
plantilla. **Lo marcado se reescribe a mano.** Si el script dice `SIN CIERRE`, la respuesta no
está terminada.
