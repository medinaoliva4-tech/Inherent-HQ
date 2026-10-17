# ⑦ Video Editing — cómo trabaja

> **En una frase:** convierte el material grabado en **las piezas finales listas para publicar**.
> ④ Creatividad dirigió, ⑤ Producción rodó, **⑦ Video Editing ensambla y multiplica**.
>
> **Quién ejecuta:** el **editor de video** (una persona) da las instrucciones y aprueba; **Claude Code
> hace todo el trabajo** con el motor del departamento — `motor/README.md`. Probado de punta a punta
> en cliente real (AKAI, oct 2026).

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 📅 Tu ventana en el ciclo

> Calendario completo: `inherent/05-OPERACION.md` → «📅 El calendario del ciclo». 🔴 **Día 11:** último día para producir · 🔴 **Día 20:** presentación al cliente.

| Días | Qué corre | Entrega |
|---|---|---|
| **12 – 15** | **Montar el contenido** — `ve-recepcion` → `ve-armado` → `ve-marca` → `ve-derivadas` | Cortes principales y derivadas |
| **16 – 19** | **Cambios** — lo que devuelve `br-guardian` · `ve-export` | Paquete exportado **a más tardar el día 19** |

---

## 0 · El alcance contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer la ficha de oferta del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md` *(nivel, áreas, volumen, revisiones y qué queda
fuera)*. Los niveles: **Brand Foundation** · **Brand Growth** · **Growth Partnership** · alcance a medida.

- 🛑 **Sin ficha anotada, el departamento no arranca:** `BLOQUEADO — falta la ficha de oferta`.
- 🛑 **El alcance contratado es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar
  de menos rompe la promesa de la propuesta.
- Los números salen de la **ficha**: videos planificados, derivados, formatos, duración y revisiones.
  **Si cambia la ficha, cambia el ciclo** — este documento no manda sobre ella.

| Qué cambia | **BRAND FOUNDATION** | **BRAND GROWTH** | **GROWTH PARTNERSHIP** |
|---|---|---|---|
| **Qué hace ⑦ Video Editing** | Solo lo que la ficha pida para los ejemplos de aplicación de la marca | **Los videos del volumen acordado** y sus derivadas, con las revisiones de la ficha | Igual que Brand Growth, más lo que la ficha agregue para ventas, atención o comunidad |
| **Videos planificados** *(20 min c/u)* | Los de los ejemplos acordados | **Los de la ficha** | **Los de la ficha** |
| **Derivados — mínimo** *(1 por cada 2 planificados)* | — | **Mínimo 1:2 sobre los planificados de la ficha** | **Mínimo 1:2 sobre los planificados de la ficha** |
| *Derivados — tope (1:1)* | — | *Techo, no promesa* | *Techo, no promesa* |
| **Revisiones por pieza** | Las rondas de la ficha | Las de la ficha | Las de la ficha |

**Cómo se lee:**

- 🔑 **La regla de los 20 minutos.** Un video planificado se graba en **20 minutos — si se graba por
  SETUP y no por pieza.** Cada uno deja 5-7 escenas; las de apoyo se recombinan en derivados.
- **El rango no es flojera, es honestidad:** si el material salió muy scripted las escenas no se
  reusan y cae al **mínimo (1 derivado por cada 2 planificados)**. Si salió suelto llega al
  **tope (1:1)**. ⚠️ **Se promete el MÍNIMO. El tope es techo, no promesa** — y solo se entrega si
  el material lo permite **y** el operador tiene las horas.
- ⚠️ **La mezcla de la ficha manda.** Si la ficha lleva más video que otro cliente con las mismas
  piezas en total, se monta ese video: **copiar el reparto de otro cliente es un error.**
- 🔑 **Acá está la eficiencia del modelo:** ⑤ Producción cuesta horas humanas; ⑦ Video Editing multiplica ese
  material **dentro del mismo monto de Producción.** Por eso el mínimo 1:2 es piso, no aspiración.
- 🔑 **⑦ Video Editing edita con Claude Code y el motor (`motor/README.md`); el editor de video dirige y aprueba.**
  El techo de capacidad es el material rodado y las horas de revisión del editor, no la ficha.
- 🛑 **Una derivada nunca pide grabación extra.** Sale de material ya rodado. Si para llegar al
  número haría falta volver a grabar, **el número está mal, no el rodaje.**
- ⛔ **No hay segundo idioma salvo que la ficha lo declare.** No existe herramienta de doblaje — ver
  `skills/ve-derivadas/SKILL.md` → «5 · El segundo idioma».

### Alcance a medida — se sigue su pipeline

Se define en el onboarding, en `plan-contratado.md`, con dos secciones: **Qué incluye** y **Su
pipeline** —qué departamentos corren, en qué orden, qué entrega cada uno y a qué nivel—. **⑦ Video Editing lee
de ahí cuántos videos planificados, derivados y revisiones le tocan** y trabaja con esos números
igual que con una ficha estándar.

- **El pipeline se sigue, no se cuestiona:** no se bloquea por ser a medida ni se
  discute por precio.
- 🛑 **Si ⑦ Video Editing no está en su pipeline, no corre para ese cliente.**
- **Cambia el volumen, nunca el método:** la trazabilidad, las devoluciones y la auto-revisión son
  iguales en todos los niveles.
- **Cuando sube el volumen, el techo es el material rodado**, no la ficha: más derivadas de las que el
  rodaje aguanta es volumen que no existe.

---

## 1 · Acá está la eficiencia del modelo

**⑤ Producción cuesta horas humanas. ⑦ Video Editing multiplica ese material dentro del mismo costo fijo de Producción.**

> 📐 **Cuánto y a qué profundidad según el alcance contratado: §0.** Una sola tabla, y está allá.

---

## 2 · La distinción que define el departamento

**④ Creatividad decidió qué dice y cómo se ve. ⑦ Video Editing lo ejecuta — no lo reinterpreta.**

| ④ Creatividad entregó | ⑦ Video Editing ejecuta |
|---|---|
| El hook, literal | Lo monta en el primer frame |
| El guion, literal | Lo corta respetando HOOK-BODY-PAYOFF |
| Las escenas con encuadre y duración | Las ensambla en ese orden |
| El layout de texto | Lo aplica con las specs de ②B Branding |

🛑 **El hook se decidió en ④ Creatividad, no se cambia en edición.** Si el material no permite montarlo,
**se devuelve a ④ Creatividad con el problema escrito** — no se improvisa otro.

🛑 **⑦ Video Editing no escribe copy, no inventa textos y no cambia el orden narrativo.**

---

## 3 · Qué entrega

| Qué | Dónde | Nombre |
|---|---|---|
| **Los reels finales**, uno por plataforma donde va | El Drive del cliente, en `04-contenido/AAAA-MM/video/` | `<id_creativo>_<plataforma>.mp4` |
| **Las derivadas** | Misma carpeta | `<id_creativo>_<variante>_<plataforma>.mp4` |
| **`entregas-video.md`** | El manifiesto, en `clients/<cliente>/04-contenido/AAAA-MM/video/`: una fila por pieza, con el link al Drive y estado | — |
| **`aprendizaje-de-video.md`** | Qué se devolvió, qué faltó, cuánto rindió cada grabación | — |

> 🛑 **El `id_creativo` en el nombre no es opcional.** ⑨ Posting cruza por ese campo; un archivo
> sin él se devuelve sin abrirse.

---

## 4 · El flujo, de 0 a 100

```
   0  RECEPCIÓN     qué llegó de ⑤ Producción, editable     → ve-recepcion
        │           + SELECCIÓN con /watch si ⑤ Producción no marcó selects (§4 de la skill)
        ▼
   1  ARMADO        guion visual → corte principal          → ve-armado
        │           (el operador confirma el layout sobre el fotograma real antes de renderizar)
        ▼
   2  MARCA         § Movimiento de ②B Branding + QA medido → ve-marca
        ▼           (auto-revisión del corte principal antes de derivar)
   3  DERIVADAS     multiplicar en variantes y formatos     → ve-derivadas
        ▼
   4  EXPORT        specs, nomenclatura, previews           → ve-export
        ▼           → página de aprobación del CLIENTE (día 20) → QA → ⑨ Posting
   ↻  LOOP          rondas de cambios, qué se devolvió,     → ve-loop
                    qué material sobró
```

> 🔑 **Las rondas de cambios son normales y se guardan.** Cada render nuevo es una versión (`_v2`,
> `_v3`…) y la anterior se mueve a `<versión>-anterior/`. Nunca se sobreescribe un entregable.

### Sin paradas internas — cada capa se auto-revisa

| Qué | Cómo se controla | Por qué |
|---|---|---|
| **El corte principal** de cada reel | Auto-revisión: QA medido y checklist de `ve-marca`, **antes de derivar** | Derivar de un corte flojo multiplica el error por 3 |
| **El paquete completo** | Auto-revisión: QA técnico y checklist de `ve-export` | Es lo que entra a QA y después a publicación |
| **La página de aprobación del cliente** | Auto-revisión: el checklist de `ve-export` completo antes de publicarla y mandarle el link | Es lo que ve el cliente |

---

## 5 · Las acciones — con qué las hace

**Claude Code ejecuta; el editor de video dirige.** Las herramientas son locales y viven en
`motor/` — instalación y comandos en `motor/README.md`.

| Acción | Con qué | |
|---|---|---|
| Bajar el material de Drive *(proxies 360p y originales 4K)* | `yt-dlp` + `scripts/index_clips.py` · `prep.py` | ✅ |
| **Ver** cada clip y elegir las tomas *(selects)* | Skill **`/watch`** con tiempos exactos + `ffmpeg` | ✅ |
| Cortar, editar y armar el reel *(doble cuadro, cámara lenta, texto, cierre)* | **Remotion** — `motor/remotion` | ✅ |
| Mostrar el guion con el fotograma real para aprobar el layout | `motor/guion-visual` — Artifact con base de datos | ✅ |
| Medir temblor y estabilizar *(solo si mejora)* | OpenCV — `jitter.py` · `stabilize.py` | ✅ |
| Medir y ajustar el color por toma | `colorstats.py` + `ffmpeg` | ✅ |
| Revisar cada render cuadro por cuadro | `review.py` — hoja de fotogramas | ✅ |
| Página para que el **cliente** apruebe o pida cambios | Vercel + Blob privado — `motor/aprobacion/vercel` | ✅ |
| Multiplicar una grabación en variantes *(derivadas)* | El mismo motor, recombinando escenas | ⬜ |
| Reencuadrar para otros formatos *(1:1, 16:9)* | Remotion / `ffmpeg` | ⬜ |
| Escalar calidad · doblaje · generar video | ⛔ **Sin herramienta — no se promete** | 🔴 |

> ⚠️ **`✅` = probado en cliente real · `⬜` = la tool existe, sin entregar todavía en cliente real.**
> 🛑 **Si falta una herramienta:** `BLOQUEADO — falta <herramienta>. Instalala: ver INSTALAR.md § <sección>`
> — `ffmpeg`, `yt-dlp`, `/watch` y OpenCV → **§ Herramientas de video** · Node, Remotion y la CLI de
> Vercel → **§ Node y Remotion**.
> 🛑 **El editor de video no edita a mano lo que el motor puede hacer:** si algo no sale, se
> corrige el guion de montaje (`edit/build_reels.py`) y se vuelve a renderizar. Así cada cambio
> queda escrito y se puede repetir.

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **④ Creatividad** | **El Excel del ciclo cerrado** — `plan-de-contenido.csv` + `ideas-<formato>.md` con hook, guion, copy literal, escenas y layout | 🛑 BLOQUEADO |
| **⑤ Producción** | El material con **nomenclatura y selects**, y el manifiesto que cruza fila por fila | 🛑 BLOQUEADO sin material · ⚠️ **sin selects, se seleccionan acá** con `/watch` (`ve-recepcion` §4) y se registra para ⑤ Producción en el loop |
| **②B Branding** | `sistema-visual.md` § Movimiento — subtítulos, entrada de texto, ritmo, cierre · los assets del kit en el Drive | 🟡 **Se usan si existen, no bloquean.** Sin § Movimiento, las entradas por defecto del motor (`ve-marca` §2) |
| **③ Marketing** | `plan-por-canal.md` — a qué plataforma va cada pieza | 🟡 No bloqueante — se usan las **Redes** del `plan-contratado.md` |

🛑 **Ningún archivo se copia: se cita su ruta.**

---

## 7 · A quién entrega

| A | Qué |
|---|---|
| **QA** | El paquete completo, antes de que salga |
| **⑨ Posting** | Los archivos finales con su `id_creativo` |
| **⑩ Ads** | Las variantes que van a pauta |

---

## 8 · Lo que este departamento NO hace

- **No cambia el hook ni el guion.** Si no se puede montar, se devuelve a ④ Creatividad
- **No escribe copy ni captions.** El copy es de ④ Creatividad, el caption es de ⑨ Posting. En el guion visual el
  operador decide **posición, estilo y efecto** del texto; si cambia una **palabra**, es un cambio de
  copy: se registra y se avisa a ④ Creatividad por escrito
- **No decide a qué plataforma va** cada pieza. Eso es ③ Marketing
- **No arregla una pieza que incumple la guía.** La devuelve ②B Branding y se corrige acá
- **No publica.** Eso es ⑨ Posting

---

## 9 · Antes de entregar

- [ ] Toda pieza con `material = video` del Excel de ④ Creatividad tiene su archivo, o su devolución escrita
- [ ] Cada archivo lleva su **`id_creativo`** en el nombre
- [ ] El **hook está montado literal**, como lo escribió ④ Creatividad
- [ ] Toda pieza lleva **activo distintivo en el primer frame**
- [ ] Los **subtítulos están dentro de la safe zone** del formato
- [ ] El **cierre de marca** está en toda pieza de video
- [ ] El total de piezas **entra en el techo del alcance contratado** *(en un alcance a medida, el de su pipeline)*
- [ ] Cada pieza pasó el **QA medido** de `ve-marca` §6: hoja de revisión, temblor y color
- [ ] Hay **master + preview** de cada pieza, y las versiones anteriores quedaron archivadas
