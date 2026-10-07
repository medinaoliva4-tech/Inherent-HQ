# ⑥B Video Editing — cómo trabaja

> **En una frase:** convierte el material grabado en **las piezas finales listas para publicar**.
> ④ Creatividad dirigió, ⑤ Producción rodó, **⑥B ensambla y multiplica**.
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

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ② Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Videos planificados** *(20 min c/u)* | **9** | **12** | **18** | **24** |
| **Derivados — mínimo** *(1:2)* | **4** | **6** | **9** | **12** |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| *Derivados — tope (1:1)* | *9* | *12* | *18* | *24* |
| *TOTAL videos — tope* | *18* | *24* | *36* | *48* |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |

**Cómo se lee:**

- 🔑 **La regla de los 20 minutos.** Un video planificado se graba en **20 minutos — si se graba por
  SETUP y no por pieza.** Cada uno deja 5-7 escenas; las de apoyo se recombinan en derivados.
- **El rango no es flojera, es honestidad:** si el material salió muy scripted las escenas no se
  reusan y cae al **mínimo (1 derivado por cada 2 planificados)**. Si salió suelto llega al
  **tope (1:1)**. ⚠️ **Se promete el MÍNIMO. El tope es techo, no promesa** — y solo se entrega si
  el material lo permite **y** el operador tiene las horas.
- ⚠️ **🟨 Accelerate monta 50% más video que 🔷 Pro** *(18 planificados contra 12)* con el mismo
  total de 145 piezas del plan. **Copiar el reparto de Pro es un error.**
- 🔑 **Acá está la eficiencia del modelo:** ⑤ Producción cuesta horas humanas; ⑥B multiplica ese
  material **dentro del mismo monto de Producción.** Por eso el mínimo 1:2 es piso, no aspiración.
- 🔑 **⑥B edita con Claude Code y el motor (`motor/README.md`); el editor de video dirige y aprueba.**
  El techo de capacidad es el material rodado y las horas de revisión del editor, no el plan.
- 🛑 **Una derivada nunca pide grabación extra.** Sale de material ya rodado. Si para llegar al
  número haría falta volver a grabar, **el número está mal, no el rodaje.**
- ⛔ **No hay segundo idioma en ningún plan.** No existe herramienta de doblaje — ver
  `skills/ve-derivadas/SKILL.md` → «5 · El segundo idioma».

### ⬜ Tailor Made — cuando el presupuesto no calza en un plan

Allan lo cotiza **en las mismas unidades de la tabla de arriba** —videos planificados, derivados,
revisiones— y el departamento trabaja con esos números igual que con un plan estándar.
**El precio lo define Allan.**

- 🛑 **Una fila sin número es un bloqueo, no una invitación a suponer:** se le pide a Allan.
- 🛑 **No existe un plan por debajo de 🔷 Marketing** (`inherent/06-ECONOMIA.md` → «📦 El volumen»).
- **Se baja el volumen, nunca el método:** los gates, la trazabilidad y las devoluciones son iguales
  en todos los planes.
- **Arriba de 🟨 Compound el techo es el material rodado**, no el plan: más derivadas de las que el
  rodaje aguanta es volumen que no existe.

---

## 1 · Acá está la eficiencia del modelo

**⑤ Producción cuesta horas humanas. ⑥B multiplica ese material dentro del mismo costo fijo de Producción.**

> 📐 **Cuánto y a qué profundidad según el plan contratado: §0.** Una sola tabla, y está allá.

---

## 2 · La distinción que define el departamento

**④ decidió qué dice y cómo se ve. ⑥B lo ejecuta — no lo reinterpreta.**

| ④ Creatividad entregó | ⑥B ejecuta |
|---|---|
| El hook, literal | Lo monta en el primer frame |
| El guion, literal | Lo corta respetando HOOK-BODY-PAYOFF |
| Las escenas con encuadre y duración | Las ensambla en ese orden |
| El layout de texto | Lo aplica con las specs de ②B |

🛑 **El hook se decidió en ④, no se cambia en edición.** Si el material no permite montarlo,
**se devuelve a ④ con el problema escrito** — no se improvisa otro.

🛑 **⑥B no escribe copy, no inventa textos y no cambia el orden narrativo.**

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
   0  RECEPCIÓN     qué llegó de ⑤ y es editable            → ve-recepcion
        │           + SELECCIÓN con /watch si ⑤ no marcó selects (§4 de la skill)
        ▼
   1  ARMADO        guion visual → corte principal          → ve-armado
        │           (el operador confirma el layout sobre el fotograma real antes de renderizar)
        ▼
   2  MARCA         § Movimiento de ②B + QA medido          → ve-marca
        ▼           🚦 GATE 1 — Allan aprueba el corte principal
   3  DERIVADAS     multiplicar en variantes y formatos     → ve-derivadas
        ▼
   4  EXPORT        specs, nomenclatura, previews           → ve-export
        ▼           🚦 GATE 2 — Allan aprueba el paquete
        ▼           → página de aprobación del CLIENTE (día 20) → QA → ⑨ Posting
   ↻  LOOP          rondas de cambios, qué se devolvió,     → ve-loop
                    qué material sobró
```

> 🔑 **Las rondas de cambios son normales y se guardan.** Cada render nuevo es una versión (`_v2`,
> `_v3`…) y la anterior se mueve a `<versión>-anterior/`. Nunca se sobreescribe un entregable.

### 🚦 Los dos gates

| Gate | Qué se aprueba | Por qué |
|---|---|---|
| **1** | **El corte principal** de cada reel | Derivar de un corte mal aprobado multiplica el error por 3 |
| **2** | **El paquete completo** | Es lo que entra a QA y después a publicación |

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
> 🛑 **El editor de video no edita a mano lo que el motor puede hacer:** si algo no sale, se
> corrige el guion de montaje (`edit/build_reels.py`) y se vuelve a renderizar. Así cada cambio
> queda escrito y se puede repetir.

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **④ Creatividad** | `plan-de-contenido.csv` con **Gate 3** · el `ideas-<formato>.md` con hook, guion, copy literal, escenas y layout | 🛑 BLOQUEADO |
| **⑤ Producción** | El material con **nomenclatura y selects**, y el manifiesto que cruza fila por fila | 🛑 BLOQUEADO sin material · ⚠️ **sin selects, se seleccionan acá** con `/watch` (`ve-recepcion` §4) y se registra para ⑤ en el loop |
| **②B Branding** | `sistema-visual.md` § Movimiento — subtítulos, entrada de texto, ritmo, cierre | 🛑 BLOQUEADO |
| **③ Marketing** | `plan-por-canal.md` — a qué plataforma va cada pieza | 🛑 BLOQUEADO |

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

- **No cambia el hook ni el guion.** Si no se puede montar, se devuelve a ④
- **No escribe copy ni captions.** El copy es de ④, el caption es de ⑨. En el guion visual el
  operador decide **posición, estilo y efecto** del texto; si cambia una **palabra**, es un cambio de
  copy: lo aprueba Allan y se avisa a ④ por escrito
- **No decide a qué plataforma va** cada pieza. Eso es ③
- **No arregla una pieza que incumple la guía.** La devuelve ②B y se corrige acá
- **No publica.** Eso es ⑨, con gate

---

## 9 · Antes de entregar

- [ ] Toda pieza con `material = video` del Excel de ④ tiene su archivo, o su devolución escrita
- [ ] Cada archivo lleva su **`id_creativo`** en el nombre
- [ ] El **hook está montado literal**, como lo escribió ④
- [ ] Toda pieza lleva **activo distintivo en el primer frame**
- [ ] Los **subtítulos están dentro de la safe zone** del formato
- [ ] El **cierre de marca** está en toda pieza de video
- [ ] El total de piezas **entra en el techo del plan contratado**
- [ ] Cada pieza pasó el **QA medido** de `ve-marca` §6: hoja de revisión, temblor y color
- [ ] Hay **master + preview** de cada pieza, y las versiones anteriores quedaron archivadas
- [ ] **Allan aprobó** los dos gates
