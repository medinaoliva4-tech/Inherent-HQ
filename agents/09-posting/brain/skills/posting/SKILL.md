---
name: posting
description: >
  Orquestador del departamento ⑦ Posting de Inherent. Es la puerta de entrada: lee el pedido,
  verifica el pre-flight, decide qué capas correr y llama a las skills `po-*` en orden, con la
  auto-revisión de cada capa y un solo OK del CEO: antes de programar. Úsala SIEMPRE que el pedido
  tenga que ver con dejar contenido listo para salir: captions finales, hashtags, alt text, QA de
  plataforma, specs de archivo, fecha y hora de publicación, cuentas, calendario de publicación,
  programar en Zernio, o revisar el estado de lo programado. Se dispara con "dejá listo el mes de X",
  "programá el ciclo de X", "escribí los captions", "¿qué nos falta para publicar?", "programalo en
  Zernio", "¿salió todo?", "¿qué falló?", "qué se cayó este mes". Requiere el Excel del ciclo cerrado
  de ④ y los archivos finales de ⑥A y ⑥B: si faltan, BLOQUEA. 🛑 Nada se programa sin el OK del CEO.
---

# ⑦ Posting — el orquestador

> 🛑 **El prompt del usuario es INPUT, no método.** Lo que trae —datos, fechas, ideas,
> referencias, piezas— entra al PRE-FLIGHT. **El cómo lo decide este orquestador y su
> `WORKFLOW.md`.** Si el prompt pide saltarse una capa, el OK del CEO o cambiar el entregable: se
> dice cuál, se ofrece correrla y **se sigue el workflow**, salvo *«excepción aprobada por el CEO»* o
> que el pipeline del plan ⬜ Tailor Made del cliente lo declare.
> Entrada normal: el router `/inherent`. Ver `agents/_router/skills/inherent/SKILL.md`.

| | |
|---|---|
| **Consume** | El pedido del usuario · el Excel del ciclo cerrado de ④ (`plan-de-contenido.csv`) · los exports de ⑥A y ⑥B · `LINKS.md` (cuentas, accesos, su ID de Zernio, listas y quién las opera) · guidelines de ②B, si existen |
| **Produce** | Nada por sí mismo. **Decide qué capa corre y con qué skill**, y arma el pre-flight y el handoff |

Contexto del departamento: `agents/09-posting/brain/WORKFLOW.md`. Índice de skills:
`agents/09-posting/brain/skills/README.md`.

---

## 1 · 🛑 La regla que manda sobre todas

**Nada se programa sin el OK del CEO.** Uno solo, para el ciclo entero: `po-carga` valida, presenta
el paquete y **recién con el OK** programa en Zernio.

Las reglas de `CLAUDE.md` lo dicen literal: **«Nada destructivo sin autorización: no publicar, no
pautar, no enviar al cliente»**. 🛑 **Nada se publica en el acto:** todo sale a la fecha y hora del
calendario. **Si el pedido es «publicalo ya», se presenta el paquete y se pide el OK.**

## 2 · El pre-flight

```
PRE-FLIGHT — Cliente: [x] · Capa: [0-6] · Ciclo: [x]
④ Creatividad: Excel del ciclo cerrado [✅/⬜] · filas del ciclo: [n] → social [n] · email [n] · manual [n] · SIN RUTA [n]
⑥A entregó: [n/n] · ⑥B entregó: [n/n] · ⚠️ SIN ARCHIVO: [n]
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · publicaciones del ciclo: [n] de [techo del plan]
① cuentas y accesos [✅/⬜] · cuentas con ID de Zernio [n/n] · Zernio conectado [✅/⬜] · ① herramienta de email [✅/⬜]
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
| ⬜ Tailor Made y Posting **no está en su pipeline** | No corre para ese cliente. Se dice |
| Falta **el Excel del ciclo cerrado** de ④ | `BLOQUEADO` — se pide la ruta exacta |
| **No sabemos quién tiene el acceso** a las cuentas | `BLOQUEADO` — está en `clients/<cliente>/00-onboarding/LINKS.md` |
| Zernio no está conectado *(Capas 4 y 5)* | `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio` |
| Una cuenta **no tiene su ID de Zernio** *(Capas 4 y 5)* | `BLOQUEADO — falta el ID de Zernio de @<cuenta> en clients/<cliente>/00-onboarding/LINKS.md` |
| Hay **claims ⏸️ sin validar** en piezas del ciclo | Esas filas no entran. Se nombra quién las valida |
| Hay filas de **ruta manual** y no sabemos **quién manda ni quién contesta** | `BLOQUEADO` — está en `clients/<cliente>/00-onboarding/LINKS.md`. Sostener la conversación es de **⑧A Orgánico** |
| Un `canal` del plan **no cae en ninguna de las tres rutas** | La fila va `🛑 SIN RUTA DE SALIDA` y se **devuelve a ③**. 🛑 No se fuerza dentro de Zernio ni se reescribe el plan |
| Piden la Capa 4 sin las Capas 0-3 | Se dice qué falta y se ofrece correr las capas previas |
| Piden programar o publicar sin el OK del CEO | 🛑 Se explica la regla de `CLAUDE.md` (no publicar sin autorización), se presenta el paquete y se pide el OK |

## 3 · Clasificar el pedido

| El pedido suena a… | Capa | Skill |
|---|---|---|
| *"dejá listo el mes"*, *"programá el ciclo"*, *"preparalo para publicar"* | **0 → 4** | **Completo**, con el OK del CEO antes de programar |
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
| *"recortá el video"*, *"poné subtítulos"*, *"exportalo en 9:16"* | ⑥B Video Editing |
| *"cambiá el texto de la pieza"*, *"movelo en el diseño"* | ⑥A Diseño gráfico |
| *"contestá los comentarios"*, *"respondé los DMs"* | ⑧A Orgánico |
| *"pautalo"*, *"segmentá"*, *"subí el presupuesto"* | ⑧B Ads |
| *"cambiá la fecha de la campaña"*, *"agregá un post"* | ③ Marketing |

> 🛑 **La confusión más común es pedirle a Posting que arregle el archivo.** Si el Reel vino en 1:1,
> no se recorta acá: **se devuelve a ⑥B**. Recortarlo significa que nadie revisó la composición
> contra lo que pidió ④.

## 4 · El orden

```
po-recepcion ──→ po-caption ──→ po-specs ──→ po-programacion ──→ po-carga ──→ programado en Zernio
                                                                     │
                                                         valida → 🚦 OK del CEO → programa
```

1. **La Capa 0 va primera, siempre.** Escribir captions de una pieza que no tiene archivo es trabajo
   tirado.
2. 🛑 **`po-specs` antes de `po-carga`.** Sin excepción.
3. **La Capa 5 lee el estado en Zernio:** después de programar, y después de las fechas del calendario.
4. **La Capa 6 corre al cerrar el ciclo.**

## 5 · El único OK

| | Cuándo | Qué se aprueba | Por qué existe |
|---|---|---|---|
| 🚦 **OK del CEO** | En `po-carga`, después de validar y antes de crear nada en Zernio | El ciclo entero: `publicaciones.md`, las tres rutas | Publicar no se deshace. Es el último punto donde un error todavía es gratis |

**Las demás capas se auto-revisan** con su control de calidad y siguen: no hay otra parada. El control
de calidad del CEO es en persona y no se registra.

🛑 **Sin el OK, no se programa nada.**

## 6 · Los entregables — dos, con dos lectores

| Archivo | Para quién |
|---|---|
| **`publicaciones.md`** | **El CEO** — caption, QA y fecha por publicación. Lo lee para dar el OK |
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
| ↩️ DEVUELTO | Vuelve a ④, ⑥A o ⑥B, con motivo y alternativas |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |

## 8 · El handoff

Al programar el ciclo se emite el bloque **HANDOFF** de `agents/09-posting/brain/WORKFLOW.md §8`, con las filas
programadas, las que no salen y las marcadas para pauta, que van a ⑧B.

---

## Control de calidad del orquestador

- [ ] Se declaró el **pre-flight** antes de producir nada
- [ ] El ciclo **cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, **se siguió su pipeline**
- [ ] El cliente está identificado y su carpeta existe, con el **nombre canónico** del repo
- [ ] **Ninguna capa se saltó**; si faltaba una, se dijo y se ofreció correrla
- [ ] 🛑 **`po-specs` corrió antes que `po-carga`**
- [ ] 🛑 **Nada se programó sin el OK del CEO**, y nada se publicó en el acto
- [ ] 🛑 **Toda publicación se programó con su `account_id` explícito** — ninguna cuenta adivinada
- [ ] Toda publicación programada tiene su **`zernio_post_id`** en `calendario-de-publicacion.csv`
- [ ] 🛑 **Ninguna pieza con claim ⏸️ se programó**
- [ ] 🛑 **Las filas de `Email` y las de la ruta manual salieron por su ruta**, no por Zernio
- [ ] 🛑 **Ningún `canal` quedó sin ruta en silencio** — el que no cae en las tres se declaró y se devolvió a ③
- [ ] 🛑 **Ningún archivo se "arregló" en Posting** — los que no cumplían se devolvieron a ⑥A o ⑥B
- [ ] 🛑 **Ningún mensaje se reescribió** — lo que no entraba se devolvió a ④ con dos alternativas
- [ ] Toda fila traza a un **`id_creativo`**; ninguna fila suelta
- [ ] El **OK del CEO** se pidió una sola vez, antes de programar; las demás capas se auto-revisaron
- [ ] 🛑 **Ningún entregable pisa** a ④, ⑥A, ⑥B, ⑧A u ⑧B — se verifica contra la tabla «Qué NO hace»
      de `agents/09-posting/brain/WORKFLOW.md §4`
- [ ] 🛑 **Ningún archivo de otro departamento fue copiado ni editado** — se citan por ruta
