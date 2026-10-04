---
name: graphic-design
description: >
  Orquestador del departamento ⑥A Diseño gráfico de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `gd-*` en orden,
  parando en los 2 gates humanos. Úsala SIEMPRE que el pedido tenga que ver con estáticos,
  carruseles, stories, plantillas, composición, imágenes de producto, o el paquete de diseño de
  un ciclo. Se dispara con "diseñá el ciclo de X", "armá los carruseles", "las plantillas del
  mes", "necesito 40 estáticos", "fotos de producto", "exportá el paquete de diseño". Requiere
  el Excel de ④ con Gate 3 y el sistema visual de ②B: si faltan, BLOQUEA.
---

# ⑥A Diseño gráfico — el orquestador

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight

| Input | De | Si falta |
|---|---|---|
| `plan-de-contenido.csv` con **Gate 3** | ④ Creatividad | 🛑 **BLOQUEADO** |
| El `ideas-<formato>.md` con el **copy literal** y el layout | ④ Creatividad | 🛑 **BLOQUEADO** |
| **`sistema-visual.md`** | ②B Branding | 🛑 **BLOQUEADO** |
| `plan-por-canal.md` | ③ Marketing | 🛑 **BLOQUEADO** |
| El **plan contratado** | `clients/<cliente>/` | 🛑 **BLOQUEADO** — define el techo |

🛑 **Sin `sistema-visual.md` no se compone nada.** Diseñar sin sistema produce 168 piezas que no
se parecen entre sí, y eso es peor que no publicar.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«diseñá el ciclo»*, *«armá el paquete»* | **Todas, en orden** |
| *«¿llegó todo?»*, *«qué nos falta»* | `gd-recepcion` |
| *«las plantillas»*, *«el molde del mes»* | `gd-plantillas` |
| *«fotos de producto»*, *«de dónde sale la imagen»* | `gd-imagen` |
| *«armá este carrusel»*, *«componé esta pieza»* | `gd-composicion` |
| *«exportá»*, *«dejalo listo para posting»* | `gd-export` |
| *«qué plantilla rindió»*, la revisión del 20 | `gd-loop` |

## 3 · La regla que hace viable el departamento

🛑 **168 piezas no se diseñan una por una.**

**Se arma el sistema de plantillas en la Capa 1, se aprueba el molde en el GATE 1, y las piezas
son ejecución.** Si para cada pieza hace falta una decisión de diseño, el ciclo no entra en las
horas que paga el plan.

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `gd-plantillas` | **Las plantillas** — no las 168 piezas |
| **GATE 2** | `gd-export` | El paquete completo |
