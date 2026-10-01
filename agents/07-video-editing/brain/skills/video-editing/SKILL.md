---
name: video-editing
description: >
  Orquestador del departamento ⑥B Video Editing de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `ve-*` en orden,
  parando en los 2 gates humanos. Úsala SIEMPRE que el pedido tenga que ver con editar, montar,
  cortar, subtitular, reencuadrar, multiplicar en variantes, exportar video, o el paquete de
  video de un ciclo. Se dispara con "editá el ciclo de X", "armá los reels", "sacá las
  derivadas", "reencuadrá esto para TikTok", "exportá el paquete", "ponele subtítulos", "qué nos
  falta para publicar video". Requiere el Excel de ④ con Gate 3 y el material de ⑤ con selects:
  si faltan, BLOQUEA.
---

# ⑥B Video Editing — el orquestador

**Si no sabés qué skill usar, es esta.**

## 1 · Pre-flight

| Input | De | Si falta |
|---|---|---|
| `plan-de-contenido.csv` con **Gate 3** | ④ Creatividad | 🛑 **BLOQUEADO** |
| El `ideas-<formato>.md` con **hook, guion y copy literales** | ④ Creatividad | 🛑 **BLOQUEADO** |
| El material con **nomenclatura y selects** + el manifiesto | ⑤ Producción | 🛑 **BLOQUEADO** |
| `sistema-visual.md` **§ Movimiento** | ②B Branding | 🛑 **BLOQUEADO** |
| `plan-por-canal.md` — a qué plataforma va cada pieza | ③ Marketing | 🛑 **BLOQUEADO** |
| El **plan contratado** | `clients/<cliente>/` | 🛑 **BLOQUEADO** — define el techo |

🛑 **Sin selects marcados no se edita.** Buscar la toma buena entre todo el material es el
trabajo de ⑤, y hacerlo acá duplica horas que ya se pagaron.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«editá el ciclo»*, *«armá el paquete»* | **Todas, en orden** |
| *«¿llegó todo?»*, *«qué nos falta»* | `ve-recepcion` |
| *«armá este reel»*, *«montá esto»* | `ve-armado` |
| *«ponele subtítulos»*, *«el cierre de marca»* | `ve-marca` |
| *«sacá las derivadas»*, *«multiplicá esto»* | `ve-derivadas` |
| *«reencuadrá para TikTok»*, *«exportá»* | `ve-export` |
| *«qué se devolvió»*, la revisión del 20 | `ve-loop` |

## 3 · La regla que no se rompe

🛑 **El hook y el guion vienen literales de ④ y no se cambian en edición.**

Si el material no permite montar el hook que ④ escribió, **se devuelve a ④ con el problema
escrito**. Improvisar otro hook rompe la traza con la MUST BE TRUE y nadie se entera hasta el
loop.

## 4 · Dónde para

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `ve-marca` | El corte principal de cada reel |
| **GATE 2** | `ve-export` | El paquete completo |

🛑 **Derivar de un corte mal aprobado multiplica el error por 3.** Por eso el primer gate está
antes de las derivadas.
