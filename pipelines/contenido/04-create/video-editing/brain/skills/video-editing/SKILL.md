---
name: video-editing
description: >
  Orquestador del departamento ⑦ Video Editing de Inherent. Es la puerta de entrada: lee el
  pedido, verifica el pre-flight, decide qué capas correr y llama a las skills `ve-*` en orden,
  con la auto-revisión de cada capa.
  Úsala SIEMPRE que el pedido tenga que ver con editar, montar, cortar, subtitular, reencuadrar,
  multiplicar en variantes, exportar video, o el paquete de video de un ciclo. Se dispara con "editá el ciclo de X", "armá los reels", "sacá las
  derivadas", "reencuadrá esto para TikTok", "exportá el paquete", "ponele subtítulos", "qué nos
  falta para publicar video", "pasale el link al cliente". Requiere el Excel del ciclo cerrado
  de ④ Creatividad y el material de ⑤ Producción: si faltan, BLOQUEA. Si ⑤ Producción no marcó selects, los hace ve-recepcion con /watch.
---

# ⑦ Video Editing — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se dice cuál, se
> ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* o que el
> pipeline del ⬜ Tailor Made del cliente ya lo declare.
> Entrada normal: el router `/inherent`. Ver `pipelines/_router/skills/inherent/SKILL.md`.

**Si no sabés qué skill usar, es esta.**

> **Quién hace qué:** el **editor de video** (una persona) da las instrucciones, mira y aprueba;
> **Claude Code ejecuta todo** con el motor de `brain/motor/` (ver su `README.md`). Las skills
> dicen qué se hace en cada paso; el motor, con qué se corre.

## 1 · Pre-flight

```
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · videos del ciclo: [n] de [techo del plan]
```

| Input | De | Si falta |
|---|---|---|
| **El Excel del ciclo cerrado** — `plan-de-contenido.csv` + `ideas-<formato>.md` con **hook, guion y copy literales** | ④ Creatividad | 🛑 **BLOQUEADO** |
| El material con **nomenclatura y selects** + el manifiesto | ⑤ Producción | 🛑 **BLOQUEADO** |
| `sistema-visual.md` **§ Movimiento** · los assets del kit en el Drive | ②B Branding | 🟡 **Se usan si existen, no bloquean.** Sin § Movimiento, las entradas por defecto del motor (`ve-marca` §2) |
| `plan-por-canal.md` — a qué plataforma va cada pieza | ③ Marketing | 🟡 No bloquea — se usan las **Redes** del `plan-contratado.md` |
| El **plan contratado** | `clients/<cliente>/00-onboarding/plan-contratado.md` | 🛑 **BLOQUEADO** — define el techo *(en ⬜ Tailor Made, lo que declara **Su pipeline**; si ⑦ Video Editing no está ahí, no corre)* |
| Los **selects** de ⑤ Producción | ⑤ Producción | ⚠️ **Se seleccionan acá** con `/watch` (`ve-recepcion` §4) y se registra para ⑤ Producción en el loop |
| Las **herramientas** del motor | `brain/motor/README.md` § Instalación | 🛑 Sin `ffmpeg`, `yt-dlp`, `/watch` y Node no se puede ver ni montar: `BLOQUEADO — falta <herramienta>. Instalala: ver INSTALAR.md § <sección>` — **§ Herramientas de video** *(ffmpeg, yt-dlp, `/watch`, OpenCV)* · **§ Node y Remotion** *(Node, Remotion, CLI de Vercel)* |

⚠️ **Buscar la toma buena es trabajo de ⑤ Producción.** Si llega sin selects, Claude califica cada clip con
`/watch` (no el editor a mano) para no frenar el ciclo, y el loop lo devuelve a ⑤ Producción como dato.

## 2 · Qué capa corre según el pedido

| El pedido suena a… | Corre |
|---|---|
| *«editá el ciclo»*, *«armá el paquete»* | **Todas, en orden** |
| *«¿llegó todo?»*, *«qué nos falta»* | `ve-recepcion` |
| *«calificá el material»*, *«¿qué tomas sirven?»* | `ve-recepcion` §4 |
| *«armá este reel»*, *«montá esto»*, *«mostrame el guion»* | `ve-armado` |
| *«ponele subtítulos»*, *«el cierre de marca»*, *«se ve azul / trabado»* | `ve-marca` |
| *«sacá las derivadas»*, *«multiplicá esto»* | `ve-derivadas` |
| *«reencuadrá para TikTok»*, *«exportá»*, *«el link para el cliente»* | `ve-export` |
| *«qué se devolvió»*, la revisión del 20 | `ve-loop` |

## 3 · La regla que no se rompe

🛑 **El hook y el guion vienen literales de ④ Creatividad y no se cambian en edición.**

Si el material no permite montar el hook que ④ Creatividad escribió, **se devuelve a ④ Creatividad con el problema
escrito**. Improvisar otro hook rompe la traza con la MUST BE TRUE y nadie se entera hasta el
loop.

## 4 · Dónde para

**Las capas no paran: cada una se auto-revisa con su checklist y sigue.** La página del cliente
(`ve-export` §7) también: sale con el checklist de `ve-export` completo.

🛑 **Derivar de un corte flojo multiplica el error por 3.** Por eso la auto-revisión del corte
principal (`ve-marca` §6-7) va antes de las derivadas.

**El editor aprueba el guion visual** antes del primer render (`ve-armado` §2), y **el cliente**
responde en su página (`ve-export` §7).

## 5 · Las rondas de cambios

**Cada pedido de cambio —del editor o del cliente— se hace en el guion de montaje
(`build_reels.py`) y se renderiza una versión nueva.** Nunca se parchea un MP4 a mano. La versión
anterior se archiva. Lo que se pide dos veces se vuelve regla (`ve-loop`).

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada, con la **línea `Plan:`** completa
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, en lo que declara **su pipeline**
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] Cada capa pasó su **checklist de auto-revisión**
- [ ] Cada ronda de cambios quedó como **versión nueva**, con la anterior archivada
