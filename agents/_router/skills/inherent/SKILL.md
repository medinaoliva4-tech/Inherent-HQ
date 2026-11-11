---
name: inherent
description: >
  La puerta de entrada de Inherent HQ — el router. Úsala SIEMPRE, antes que cualquier otra
  skill, con cualquier pedido de trabajo para un cliente: estrategia, cliente ideal, adquisición,
  marca, plan del ciclo, ideas, producción, edición, diseño, publicación, comunidad o pauta. Lee
  el pedido, identifica el cliente y el área, imprime el ENRUTAMIENTO y le pasa el pedido al
  orquestador que toca. No produce ningún entregable: enruta. Se dispara con cualquier pedido del
  tipo "armá…", "haceme…", "necesito…", "dame ideas…", "escribí…", "programá…", "lanzá…", y
  con /inherent.
---

# 🧭 Inherent — el router

> **El texto del usuario es el PEDIDO. El método está en el repo.**
> El pedido dice **qué** se quiere. El `WORKFLOW.md` del área dice **cómo** se hace.
> **Un prompt detallado no reemplaza el workflow: lo alimenta.**

## 1 · Primero: ¿es trabajo de cliente o mantenimiento del repo?

| Si el pedido es… | Qué pasa |
|---|---|
| **Trabajo para un cliente** | Se enruta. Sigue con el paso 2 |
| **Mantenimiento del repo** *(precios, reglas, docs, una skill, el CLAUDE.md)* | `ENRUTAMIENTO → MANTENIMIENTO` y se trabaja directo |
| **Una pregunta sobre la empresa** | No se enruta. Se responde desde `inherent/` |

## 2 · El enrutamiento — imprímelo SIEMPRE antes de hacer nada

```
ENRUTAMIENTO
Pedido: [el pedido en una línea, con las palabras del usuario]
Cliente: [clients/<cliente>/ · ⛔ falta]  ·  Nivel: [Brand Foundation / Brand Growth / Growth Partnership / a medida · ⛔ falta]
Área: [n · nombre]  →  Orquestador: [/skill]
Del prompt entra como INPUT: [datos, fechas, piezas, ideas, referencias]
Del prompt CHOCA con el workflow: [qué pide saltarse o hacer distinto · «nada»]
→ PASA A [/skill] | BLOQUEADO: [qué falta]
```

🔑 **El `Nivel:` se LEE, no se adivina:** sale de `clients/<cliente>/00-onboarding/plan-contratado.md`.
Si no existe, va `⛔ falta` y el orquestador bloquea. **Un alcance a medida se sigue según su
pipeline**: un área que no está ahí no corre para ese cliente.

🏠 **Cuando el cliente es Inherent**, el folder es `inherent/inherent-social-media/`.

## 3 · La tabla — qué área toma cada pedido

| Si el pedido es sobre… | Área | Se invoca |
|---|---|---|
| Producto, oferta y precio **del cliente**, cliente ideal (ICP), dolores, deseos, entrevistas, historia, mensaje, adquisición, prospectos, captura, embudo, referidos, el brief del ciclo, el onboarding | ① Strategy | `/strategy` |
| Identidad, voz, paleta, tipografía, activos, guía de marca, «¿esto es de marca?», «¿podemos decir esto?» | ② Branding | `/branding` |
| Radar, referentes, contenido quemado, pilares, ángulos, campañas, calendario, ideas, hooks, copy, guiones, estructura de reel o story | ③ Marketing y Creative | `/marketing-creative` |
| Grabar, fotos, jornada, call sheet, shot list, permisos, compras, presupuesto de rodaje, editar, primer corte, derivadas, exportar video | ④ Producción | `/produccion` |
| Estáticos, carruseles, stories, plantillas, borradores en Figma | ⑤ Diseño gráfico | `/graphic-design` |
| Comentarios, DMs, menciones, la bandeja, moderar | ⑥ Community | `/community` |
| Captions, hashtags, specs, fechas y horas, programar, publicar | ⑦ Posting | `/posting` |
| Pauta, presupuesto de ads, campañas pagas, CPA, ROAS, atribución | ⑧ Ads | `/ads` |
| Qué funcionó, cerrar el mes, la revisión del 20 | ↻ Resultados | `/resultados` |
| Hablarle al cliente | 00 Account | 🔴 **No desde aquí** — vive en WhatsApp |

**Si el pedido toca dos áreas**, se enruta a la que va **primero en el pipeline** y se declara la
segunda como siguiente paso. **Nunca se corren dos áreas mezcladas.**

## 4 · Cómo se trata el prompt del usuario

| El prompt trae… | Qué se hace |
|---|---|
| **Datos** *(fechas, productos, referencias, ideas, piezas)* | ✅ Entran como input del pre-flight |
| **Una preferencia que cabe en el método** | ✅ Entra como restricción |
| **Un atajo** *(«no hagas el brief», «dame directo 10 hooks», «sáltate el gate»)* | 🛑 **Choque.** Se dice qué paso o gate se salta, se ofrece correrlo y **se sigue el workflow** |
| **Un formato distinto al entregable** | 🛑 **Choque.** Se puede **agregar** un resumen, no reemplazar |
| **Algo que la ficha no incluye** | 🛑 **Se bloquea.** La ficha es el techo |

**La única forma de saltarse el método:** que el CEO lo autorice en el pedido —
*«excepción aprobada por el CEO: …»*. Se anota como `EXCEPCIÓN: [qué] · aprobada por el CEO`.
Lo que el `plan-contratado.md` ya declara no necesita la frase.

## 5 · Después del enrutamiento

1. **Invoca el orquestador** con el pedido completo.
2. **El orquestador corre su PRE-FLIGHT** *(con `recepcion`)*. Si bloquea, se reporta qué falta y de quién.
3. **El router no escribe estrategia, ideas ni piezas.** Si te descubres produciendo un entregable sin
   haber invocado el orquestador, para y enruta.
