---
name: posting
description: >
  Orquestador del departamento ⑨ Posting de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `po-*` en orden, con la
  auto-revisión de cada capa y sin parada del CEO. Úsala SIEMPRE que el pedido
  tenga que ver con dejar contenido listo para salir: captions finales, hashtags, alt text, QA de
  plataforma, specs de archivo, fecha y hora de publicación, cuentas, calendario de publicación,
  programar en Zernio, o revisar el estado de lo programado. Se dispara con "dejá listo el mes de X",
  "programá el ciclo de X", "escribí los captions", "¿qué nos falta para publicar?", "programalo en
  Zernio", "¿salió todo?", "¿qué falló?", "qué se cayó este mes". Requiere el Excel del ciclo cerrado
  de ④ Creatividad y los archivos finales de ⑥A Diseño gráfico y ⑦ Video Editing: si faltan,
  BLOQUEA. 🛑 Nada se publica en el acto.
---

# ⑨ Posting — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa o cambiar el entregable: se
> dice cuál, se ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* o
> que el pipeline del alcance a medida del cliente lo declare.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

| | |
|---|---|
| **Consume** | El pedido del usuario · el Excel del ciclo cerrado de ④ Creatividad (`plan-de-contenido.csv`) · los exports de ⑥A Diseño gráfico y ⑦ Video Editing · `LINKS.md` (cuentas, accesos, su ID de Zernio, listas y quién las opera) · guidelines de ②B Branding, si existen |
| **Produce** | Nada por sí mismo. **Decide qué capa corre y con qué skill**, y arma el pre-flight y el handoff |

Contexto del departamento: `agents/09-posting/brain/WORKFLOW.md`. Índice de skills:
`agents/09-posting/brain/skills/README.md`.

---

## 1 · 🛑 La regla que manda sobre todas

**Nada se publica en el acto.** `po-carga` valida cada media y cada post en Zernio y programa cada
publicación a la fecha y hora del calendario — nunca con `publish_now`. Un error de copy o de fecha
que sale publicado no se puede despublicar del timeline de nadie.

**No hay parada del CEO:** cada capa se auto-revisa y sigue, y lo que está en el repo ya pasó por el
CEO. **Si el pedido es «publicalo ya», no se publica en el acto:** se programa a la fecha y hora del
calendario, y si piden otra fecha, se escala al CEO.

## 2 · El pre-flight

```
PRE-FLIGHT — Cliente: [x] · Capa: [0-6] · Ciclo: [x]
④ Creatividad: Excel del ciclo cerrado [✅/⬜] · filas del ciclo: [n] → social [n] · email [n] · manual [n] · SIN RUTA [n]
⑥A Diseño gráfico entregó: [n/n] · ⑦ Video Editing entregó: [n/n] · ⚠️ SIN ARCHIVO: [n]
Nivel: [Brand Foundation / Brand Growth / Growth Partnership / a medida] · publicaciones del ciclo: [n] de [techo de la ficha]
① Strategy: cuentas y accesos [✅/⬜] · cuentas con ID de Zernio [n/n] · Zernio conectado [✅/⬜] · herramienta de email [✅/⬜]
②B Branding [✅ / — no bloquea] · claims pendientes: [n]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

🛑 **El reparto social / email / manual se declara desde el pre-flight.** Solo la ruta social se
programa en Zernio, y descubrir al programar que una fila no va ahí cuesta la ventana del ciclo.
**`SIN RUTA` son las filas cuyo `canal` no cae en ninguna de las tres**: no se fuerzan dentro de
Zernio, se devuelven a ③ Marketing.

**Se bloquea si:**

| Situación | Qué se responde |
|---|---|
| No se nombró el cliente | `BLOQUEADO — ¿de qué cliente?` |
| Alcance a medida y Posting **no está en su pipeline** | No corre para ese cliente. Se dice |
| Falta **el Excel del ciclo cerrado** de ④ Creatividad | `BLOQUEADO` — se pide la ruta exacta |
| **No sabemos quién tiene el acceso** a las cuentas | `BLOQUEADO` — está en `clients/<cliente>/00-onboarding/LINKS.md` |
| Zernio no está conectado *(Capas 4 y 5)* | `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio` |
| Una cuenta **no tiene su ID de Zernio** *(Capas 4 y 5)* | `BLOQUEADO — falta el ID de Zernio de @<cuenta> en clients/<cliente>/00-onboarding/LINKS.md` |
| Hay **claims ⏸️ sin validar** en piezas del ciclo | Esas filas no entran. Se nombra quién las valida |
| Hay filas de **ruta manual** y no sabemos **quién manda ni quién contesta** | `BLOQUEADO` — está en `clients/<cliente>/00-onboarding/LINKS.md`. Sostener la conversación es de **⑧ Community** |
| Un `canal` del plan **no cae en ninguna de las tres rutas** | La fila va `🛑 SIN RUTA DE SALIDA` y se **devuelve a ③ Marketing**. 🛑 No se fuerza dentro de Zernio ni se reescribe el plan |
| Piden la Capa 4 sin las Capas 0-3 | Se dice qué falta y se ofrece correr las capas previas |
| Piden publicar en el acto | 🛑 Nunca `publish_now`: se programa a la fecha y hora del calendario. Si piden otra fecha, se escala al CEO |

## 3 · Clasificar el pedido

| El pedido suena a… | Capa | Skill |
|---|---|---|
| *"dejá listo el mes"*, *"programá el ciclo"*, *"preparalo para publicar"* | **0 → 4** | **Completo**, con la auto-revisión de cada capa |
| *"¿qué nos falta para publicar?"*, *"¿llegó todo?"* | 0 | `po-recepcion` |
| *"escribí los captions"*, *"el texto del post"*, *"qué hashtags"* | 1 | `po-caption` |
| *"¿esto cumple?"*, *"revisá los archivos"*, *"¿entra en Reels?"* | 2 | `po-specs` |
| *"¿a qué hora sale?"*, *"armá el calendario"*, *"en qué cuenta va"* | 3 | `po-programacion` |
| *"programalo en Zernio"*, *"dejalo programado"* | 4 | `po-carga` |
| *"¿salió todo?"*, *"¿qué falló?"*, *"revisá lo programado"* | 5 | `po-verificacion` |
| *"¿qué se cayó este mes?"*, *"por qué llegó tarde"* | 6 | `po-loop` |

### Los que NO son de este departamento

| Pedido | De quién es |
|---|---|
| *"cambiá el copy"*, *"no me gusta el hook"*, *"otra idea"* | ④ Creatividad |
| *"recortá el video"*, *"poné subtítulos"*, *"exportalo en 9:16"* | ⑦ Video Editing |
| *"cambiá el texto de la pieza"*, *"movelo en el diseño"* | ⑥A Diseño gráfico |
| *"contestá los comentarios"*, *"respondé los DMs"* | ⑧ Community |
| *"pautalo"*, *"segmentá"*, *"subí el presupuesto"* | ⑩ Ads |
| *"cambiá la fecha de la campaña"*, *"agregá un post"* | ③ Marketing |

> 🛑 **La confusión más común es pedirle a Posting que arregle el archivo.** Si el Reel vino en 1:1,
> no se recorta acá: **se devuelve a ⑦ Video Editing**. Recortarlo significa que nadie revisó la
> composición contra lo que pidió ④ Creatividad.

## 4 · El orden

```
po-recepcion ──→ po-caption ──→ po-specs ──→ po-programacion ──→ po-carga ──→ programado en Zernio
                                                                     │
                                                         valida → auto-revisión → programa
```

1. **La Capa 0 va primera, siempre.** Escribir captions de una pieza que no tiene archivo es trabajo
   tirado.
2. 🛑 **`po-specs` antes de `po-carga`.** Sin excepción.
3. **La Capa 5 lee el estado en Zernio:** después de programar, y después de las fechas del calendario.
4. **La Capa 6 corre al cerrar el ciclo.**

## 5 · Sin parada del CEO

**Posting no espera un OK para programar.** Cada capa se auto-revisa con su control de calidad y
sigue; `po-carga` programa lo que pasó la validación de Zernio. Lo que está en el repo ya pasó por
el CEO, y las piezas ya pasaron por ②B Branding (`br-guardian`). El control de calidad del CEO es
en persona y no se registra.

📣 **Lo que no se resuelve acá se escala, y el flujo sigue:** precio, alcance y fechas → **el CEO** ·
todo lo demás → **el COO**.

🛑 **Lo que no pasó su validación no se programa:** se declara.

## 6 · Los entregables — dos, con dos lectores

| Archivo | Para quién |
|---|---|
| **`publicaciones.md`** | **El COO** — caption, QA y fecha por publicación. Lo lee para el QA final |
| **`calendario-de-publicacion.csv`** | **El registro** — una fila por publicación, 13 columnas, con su `zernio_post_id` y su `estado` |
| `aprendizaje-de-posting.md` | Interno · el cierre del ciclo |

Plantillas en `agents/09-posting/brain/entregables/`. **Ninguna skill inventa un archivo nuevo.**

## 7 · Cómo responde

Español, con los términos de plataforma fijos (`CAPTION`, `ALT TEXT`, `SAFE ZONE`, `FEED`, `REEL`,
`STORY`, `CAROUSEL`, `HANDLE`). Tablas y bullets. **Lo accionable arriba: qué falta para poder
programar.** Toda fecha con hora y zona horaria.

| Marca | Significado |
|---|---|
| 🟢 | Listo — archivo, caption y specs verificados |
| 🟡 | Falta algo menor, con responsable y fecha |
| 🔴 | No sale este ciclo |
| ⚠️ SIN ARCHIVO | La pieza no tiene export. Se nombra de quién se espera |
| ⚠️ SIN DATOS | Falta el dato — típicamente la hora óptima de la cuenta |
| ⏸️ PENDIENTE APROBACIÓN | Claim sin validar. **No se programa** |
| ↩️ DEVUELTO | Vuelve a ④ Creatividad, ⑥A Diseño gráfico o ⑦ Video Editing, con motivo y alternativas |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |

## 8 · El handoff

Al programar el ciclo se emite el bloque **HANDOFF** de `agents/09-posting/brain/WORKFLOW.md §8`,
con las filas programadas, las que no salen y las marcadas para pauta, que van a ⑩ Ads.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada
- [ ] El ciclo **cabe en el alcance contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es a medida, **se siguió su pipeline**
- [ ] El cliente está identificado y su carpeta existe, con el **nombre canónico** del repo
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] 🛑 **`po-specs` corrió antes que `po-carga`**
- [ ] 🛑 **Nada se publicó en el acto** — todo se programó a la fecha y hora del calendario
- [ ] 🛑 **Toda publicación se programó con su `account_id` explícito** — ninguna cuenta adivinada
- [ ] Toda publicación programada tiene su **`zernio_post_id`** en `calendario-de-publicacion.csv`
- [ ] 🛑 **Ninguna pieza con claim ⏸️ se programó**
- [ ] 🛑 **Las filas de `Email` y las de la ruta manual salieron por su ruta**, no por Zernio
- [ ] 🛑 **Ningún `canal` quedó sin ruta en silencio** — el que no cae en las tres se declaró y se devolvió a ③ Marketing
- [ ] 🛑 **Ningún archivo se "arregló" en Posting** — los que no cumplían se devolvieron a ⑥A Diseño gráfico o ⑦ Video Editing
- [ ] 🛑 **Ningún mensaje se reescribió** — lo que no entraba se devolvió a ④ Creatividad con dos alternativas
- [ ] Toda fila traza a un **`id_creativo`**; ninguna fila suelta
- [ ] **Cada capa se auto-revisó** antes de seguir; lo escalado fue al CEO *(precio, alcance, fechas)* o al COO *(lo demás)*
- [ ] 🛑 **Ningún entregable pisa** a ④ Creatividad, ⑥A Diseño gráfico, ⑦ Video Editing, ⑧ Community o ⑩ Ads — se verifica contra la tabla «Qué NO hace»
      de `agents/09-posting/brain/WORKFLOW.md §4`
- [ ] 🛑 **Ningún archivo de otro departamento fue copiado ni editado** — se citan por ruta
