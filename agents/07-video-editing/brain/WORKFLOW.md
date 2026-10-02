# ⑥B Video Editing — cómo trabaja

> **En una frase:** convierte el material grabado en **las piezas finales listas para publicar**.
> ④ Creatividad dirigió, ⑤ Producción rodó, **⑥B ensambla y multiplica**.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/README.md`.

---

## 1 · Acá está la eficiencia del modelo

**⑤ Producción cuesta horas humanas. ⑥B multiplica ese material a Q0 marginal.**

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Horas grabadas** *(⑤)* | **3 h** | 4 h | 6 h | 8 h |
| **Horas de grabación** | **3h** | **4h** | **6h** | **8h** |
| **Videos planificados** *(20 min c/u)* | **9** | **12** | **18** | **24** |
| **Derivados — mínimo** *(1:2)* | **4** | **6** | **9** | **12** |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| *Derivados — tope (1:1)* | *9* | *12* | *18* | *24* |
| *TOTAL videos — tope* | *18* | *24* | *36* | *48* |
| **Segundo idioma** | ⬜ | ⬜ | ⬜ | ✅ |
| **Revisiones por pieza** | 1 | 2 | 2 | **3** |

> 🔑 **La regla de los 20 minutos.** Un video planificado se graba en **20 minutos — si se graba
> por SETUP y no por pieza.** Cada uno deja 5-7 escenas; las de apoyo se recombinan en derivados.
>
> **El rango no es flojera, es honestidad:** si el material salió muy scripted las escenas no se
> reusan y cae al **mínimo (1 derivado por cada 2 planificados)**. Si salió suelto llega al
> **tope (1:1)**.
>
> ⚠️ **Se promete el MÍNIMO. El tope es techo, no promesa** — y solo se entrega si el material
> lo permite **y** el operador tiene las horas.

### 🔴 Lo que ⑥B necesita de ④ Creatividad para que el número cierre

| Requisito | Por qué |
|---|---|
| **Shot list agrupado por SETUP, no por pieza** | 20 min por video solo se logra si se arma el lugar una vez y se graban todas sus escenas. Grabando pieza por pieza son 45+ min |
| **Escenas marcadas `hablada` o `apoyo`** | Solo las de apoyo se recombinan. Sin la marca, ⑥B no sabe qué puede reusar |
| **Mínimo 60% de escenas de apoyo** | Debajo de eso el material queda muy scripted y los derivados caen al mínimo |

⚠️ **Esto es un pedido abierto a ④ Creatividad** *(skill `cr-arte-video`)*. Hasta que esté,
⑥B marca las escenas a mano y lo declara en el loop.

> 🔑 **De 2 horas de grabación salen 16 piezas.** Ese número es la razón por la que el margen
> cierra. **Editar de menos no ahorra tiempo: tira producción pagada.**

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
| **Los reels finales**, uno por plataforma donde va | `clients/<cliente>/entregas/<ciclo>/video/` | `<id_creativo>_<plataforma>.mp4` |
| **Las derivadas** | Misma carpeta | `<id_creativo>_<variante>_<plataforma>.mp4` |
| **`entregas-video.md`** | El manifiesto: una fila por pieza, con ruta y estado | — |
| **`aprendizaje-de-video.md`** | Qué se devolvió, qué faltó, cuánto rindió cada grabación | — |

> 🛑 **El `id_creativo` en el nombre no es opcional.** ⑨ Posting cruza por ese campo; un archivo
> sin él se devuelve sin abrirse.

---

## 4 · El flujo, de 0 a 100

```
   0  RECEPCIÓN     qué llegó de ⑤ y es editable            → ve-recepcion
        ▼
   1  ARMADO        el corte principal, según el guion de ④ → ve-armado
        ▼
   2  MARCA         § Movimiento de ②B aplicado             → ve-marca
        ▼           🚦 GATE 1 — Allan aprueba el corte principal
   3  DERIVADAS     multiplicar en variantes y formatos     → ve-derivadas
        ▼
   4  EXPORT        specs por plataforma y nomenclatura     → ve-export
        ▼           🚦 GATE 2 — Allan aprueba el paquete
        ▼           →→→ pasa a QA y después a ⑨ Posting
   ↻  LOOP          qué se devolvió, qué material sobró     → ve-loop
```

### 🚦 Los dos gates

| Gate | Qué se aprueba | Por qué |
|---|---|---|
| **1** | **El corte principal** de cada reel | Derivar de un corte mal aprobado multiplica el error por 3 |
| **2** | **El paquete completo** | Es lo que entra a QA y después a publicación |

---

## 5 · Las acciones — qué MCP le da cada una

| Acción | MCP | |
|---|---|---|
| Multiplicar una grabación en variantes | Higgsfield workflow `ad-multiplier` | ⬜ |
| Reencuadrar para cada formato | Higgsfield `reframe` | ⬜ |
| Escalar calidad de video | Higgsfield `upscale_video` | ⬜ |
| Doblaje y segundo idioma | Higgsfield `dubbing` | ⬜ |
| Analizar el video antes de cortarlo | Higgsfield `video_analysis_create` | ⬜ |
| Generar video cuando no hay material | Higgsfield `generate_video` | ⬜ |

> ⚠️ **`⬜` = la tool existe, sin probar en cliente real.** No se promete lo que no se corrió.

---

## 6 · De dónde recibe

| De | Qué | Si falta |
|---|---|---|
| **④ Creatividad** | `plan-de-contenido.csv` con **Gate 3** · el `ideas-<formato>.md` con hook, guion, copy literal, escenas y layout | 🛑 BLOQUEADO |
| **⑤ Producción** | El material con **nomenclatura y selects**, y el manifiesto que cruza fila por fila | 🛑 BLOQUEADO |
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
- **No escribe copy ni captions.** El copy es de ④, el caption es de ⑨
- **No decide a qué plataforma va** cada pieza. Eso es ③
- **No arregla una pieza que incumple la guía.** La devuelve ②B y se corrige acá
- **No publica.** Eso es ⑨, con gate

---

## 9 · Antes de entregar

- [ ] Toda pieza con `rodaje = si` del Excel de ④ tiene su archivo, o su devolución escrita
- [ ] Cada archivo lleva su **`id_creativo`** en el nombre
- [ ] El **hook está montado literal**, como lo escribió ④
- [ ] Toda pieza lleva **activo distintivo en el primer frame**
- [ ] Los **subtítulos están dentro de la safe zone** del formato
- [ ] El **cierre de marca** está en toda pieza de video
- [ ] El total de piezas **entra en el techo del plan contratado**
- [ ] **Allan aprobó** los dos gates
