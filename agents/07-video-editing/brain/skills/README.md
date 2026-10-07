# Las skills de ⑥B Video Editing — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. El `WORKFLOW.md` dice qué pasa y en qué orden; acá está el
detalle de cada herramienta.

> **Quién hace qué:** el **editor de video** da las instrucciones y aprueba; **Claude Code ejecuta
> todo**. Las skills dicen **qué** se hace; **`brain/motor/`** es **con qué** se corre (Remotion,
> `/watch`, ffmpeg, OpenCV, la página del cliente en Vercel) — ver `motor/README.md`.

**Dónde viven:** acá mismo, una carpeta por skill: `agents/07-video-editing/brain/`.

> **Cómo cargan:** cada carpeta está **enlazada** en `.claude/skills/` de la raíz del repo.
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.**

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`video-editing`** | La puerta de entrada. **Si no sabés cuál usar, es esta.** |

## Las 6 capas, en orden del flujo

| # | Skill | Capa | Se dispara cuando… | Produce |
|---|---|---|---|---|
| 1 | **`ve-recepcion`** | 0 | *«¿llegó todo?»*, *«qué nos falta»*, *«calificá el material»* | Filas base de `entregas-video.md` · la selección si ⑤ no la hizo |
| 2 | **`ve-armado`** | 1 | *«armá este reel»*, *«mostrame el guion»* | El guion visual aprobado + el corte principal |
| 3 | **`ve-marca`** | 2 | *«ponele subtítulos»*, *«aplicá la marca»*, *«se ve azul»* | El corte de marca con QA medido · **🚦 GATE 1** |
| 4 | **`ve-derivadas`** | 3 | *«sacá las derivadas»*, *«variantes para pauta»* | Las 4 · 6 · 9 · 12 derivadas |
| 5 | **`ve-export`** | 4 | *«exportá el paquete»*, *«el link para el cliente»* | Archivos finales + manifiesto · **🚦 GATE 2** · página del cliente |
| 6 | **`ve-loop`** | 5 | La revisión del 20 | `aprendizaje-de-video.md` · rondas de cambios → reglas |

---

## Las dos reglas que no se rompen

🛑 **El hook y el guion vienen literales de ④ y no se cambian en edición.** Si el material no
permite montarlos, se devuelve a ④.

🛑 **No se deriva de un corte sin GATE 1.** Un corte principal flojo produce 3 derivadas flojas.

## Los dos gates

| 🚦 | Después de | Qué aprueba Allan |
|---|---|---|
| **GATE 1** | `ve-marca` | El corte principal de cada reel |
| **GATE 2** | `ve-export` | El paquete completo |
