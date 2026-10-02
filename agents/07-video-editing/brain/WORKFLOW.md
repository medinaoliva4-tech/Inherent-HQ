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
| **Horas grabadas** *(⑤)* | 2 h | 4 h | 6 h | 8 h |
| **Videos de grabación** | **8** | **12** | **18** | **20** |
| **Videos con b-roll** | **2** | **4** | **2** | **4** |
| **Total de videos** | **10** | **16** | **20** | **24** |
| **Segundo idioma** | ⬜ | ⬜ | ⬜ | ✅ |
| **Revisiones por pieza** | 1 | 2 | 2 | **3** |

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
