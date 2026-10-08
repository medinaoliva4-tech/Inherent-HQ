---
name: inherent
description: >
  La puerta de entrada de Inherent HQ — el router. Úsala SIEMPRE, antes que cualquier otra
  skill, con cualquier pedido de trabajo para un cliente: estrategia, marca, oferta, plan del
  ciclo, ideas, producción, diseño, video, publicación o pauta. Lee el pedido, identifica el
  cliente y el departamento, imprime el ENRUTAMIENTO y le pasa el pedido al orquestador del
  departamento que toca. No produce ningún entregable: enruta. Se dispara con cualquier pedido
  del tipo "armá…", "haceme…", "necesito…", "dame ideas…", "escribí…", "programá…", "lanzá…",
  y con /inherent.
---

# 🧭 Inherent — el router

> **El texto del usuario es el PEDIDO. El método está en el repo.**
> El pedido dice **qué** se quiere. El `WORKFLOW.md` del departamento dice **cómo** se hace.
> **Un prompt detallado no reemplaza el workflow: lo alimenta.**

---

## 1 · Primero: ¿es trabajo de cliente o mantenimiento del repo?

| Si el pedido es… | Qué pasa |
|---|---|
| **Trabajo para un cliente** *(ideas, estrategia, piezas, pauta…)* | Se enruta. Seguí con el paso 2 |
| **Mantenimiento del repo** *(cambiar precios, reglas, docs, una skill, el CLAUDE.md)* | No se enruta. Se imprime `ENRUTAMIENTO → MANTENIMIENTO` y se trabaja directo sobre el repo |
| **Una pregunta sobre la empresa** *(«¿cuánto cuesta Pro?», «¿qué incluye Accelerate?»)* | No se enruta. Se responde desde `inherent/` |

---

## 2 · El enrutamiento — imprimilo SIEMPRE antes de hacer nada

```
ENRUTAMIENTO
Pedido: [el pedido en una línea, con las palabras del usuario]
Cliente: [clients/<cliente>/ · ⛔ falta]  ·  Plan: [🔷 Mkt / 🔷 Pro / 🟨 Accel / 🟨 Comp / ⬜ Tailor Made · ⛔ falta]
Departamento: [n · nombre]  →  Orquestador: [/skill]
Del prompt entra como INPUT: [datos, fechas, piezas, ideas, referencias que trae el usuario]
Del prompt CHOCA con el workflow: [qué pide saltarse o hacer distinto · «nada»]
→ PASA A [/skill] | BLOQUEADO: [qué falta]
```

🔑 **El `Plan:` se LEE, no se adivina:** sale de `clients/<cliente>/00-onboarding/plan-contratado.md`,
donde lo anota ① Strategy. **Si el archivo no existe, va `⛔ falta`** — y el orquestador del
departamento bloquea, porque el plan es el techo de todos.

⬜ **Un Tailor Made no se cuestiona: se sigue.** Su `plan-contratado.md` declara **qué incluye** y
**su pipeline** —qué departamentos corren, en qué orden y a qué nivel—. Se enruta según ese
pipeline. **Un departamento que no está en su pipeline no corre para ese cliente.**

🏠 **Cuando el cliente es Inherent** *(nuestras propias redes)*, el folder es
`inherent/inherent-social-media/` en lugar de `clients/<cliente>/`. Corre igual que cualquier
cliente.

🔑 **Este bloque es la prueba de que se siguió el método.** Si una respuesta de trabajo de
cliente no empieza con `ENRUTAMIENTO`, se saltó el router.

---

## 3 · La tabla — qué departamento toma cada pedido

| Si el pedido es sobre… | Departamento | Se invoca |
|---|---|---|
| Comprensión, contexto, análisis, ingeniería inversa, la estrategia | ① Strategy | `context` → `analysis` → `reverse-engineering` → `methodology` *(según `pipelines/contenido/02-strategize/strategy/brain/WORKFLOW.md`)* |
| Identidad, voz, paleta, tipografía, guía de marca, «¿esto es de marca?» | ②B Branding | `/branding` |
| Oferta, precio **del cliente**, paquetes, canales grandes, upsells, conversión, números | ② Growth | `/growth` — 🔷 **ligero:** elige qué ofertas que ya existen se empujan · 🟨 **completo** · ⬜ lo que diga su pipeline |
| Plan del ciclo, pilares, campañas, calendario, canales, mensaje | ③ Marketing | `/marketing` |
| Ideas, conceptos, BIG IDEA, hooks, copy, shot list, swipe file, plan de contenido | ④ Creatividad | `/creatividad` |
| Grabar, locaciones, talento, jornadas, call sheet, presupuesto de rodaje | ⑤ Producción | `/produccion` |
| Estáticos, carruseles, stories, plantillas, fotos de producto | ⑥A Diseño gráfico | `/graphic-design` |
| Reels, edición, derivadas, cortes | ⑦ Video Editing | `/video-editing` |
| Captions, hashtags, fechas y horas, programar, archivo de carga | ⑨ Posting | `/posting` |
| Pauta, presupuesto de ads, campañas pagas, CPA, ROAS, atribución | ⑩ Ads | `/ads` |
| Comentarios, DMs, menciones, la bandeja, moderar | ⑧ Community | `/community` |
| Hablarle al cliente | 00 Account (Secretaria) | 🔴 **No desde acá** — vive en WhatsApp |

**Si el pedido toca dos departamentos**, se enruta al que va **primero en el pipeline** y se
declara el segundo como siguiente paso. **Nunca se corren dos departamentos mezclados.**

---

## 4 · Cómo se trata el prompt del usuario

| El prompt trae… | Qué se hace |
|---|---|
| **Datos** *(fechas, productos, referencias, ideas propias, piezas)* | ✅ **Entran como INPUT** del pre-flight del orquestador |
| **Una preferencia que cabe en el método** *(«que sea divertido», «priorizá TikTok»)* | ✅ Entra como **restricción** del brief |
| **Un atajo** *(«no hagas el brief», «dame directo 10 hooks», «saltate el gate»)* | 🛑 **Choque.** Se dice cuál capa o gate se salta, se ofrece correrla, y **se sigue el workflow** |
| **Un formato distinto al entregable** | 🛑 **Choque.** El entregable es el del `WORKFLOW.md`. Se puede **agregar** un resumen, no reemplazar |
| **Algo que el plan del cliente no incluye** | 🛑 **Se bloquea.** El plan es el techo. Ver `inherent/06-ECONOMIA.md` |

### 🟡 La única forma de saltarse el método

**Que el CEO lo autorice explícitamente en el pedido:** *«excepción aprobada por el CEO: …»*.
Se anota en el `ENRUTAMIENTO` como `EXCEPCIÓN: [qué] · aprobada por el CEO` y se respeta.
**Sin esa frase, el workflow gana.**

**Lo que el `plan-contratado.md` del cliente ya declara no necesita la frase:** está escrito, y lo
que está en el repo ya pasó por el CEO.

---

## 5 · Después del enrutamiento

1. **Invocá el orquestador** con la herramienta de skills, pasándole el pedido completo.
2. **El orquestador corre su PRE-FLIGHT.** Si bloquea, se reporta qué falta y de quién.
3. **El router no escribe hooks, ideas, estrategia ni piezas.** Si te descubrís produciendo un
   entregable sin haber invocado el orquestador, pará y enrutá.
