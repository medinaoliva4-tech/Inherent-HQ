# Skills de Video Editing

Cada bloque del workflow es **un paso y además una skill**. Se corren en orden; cada una se
puede invocar suelta si ya existe el input de la anterior.

```
vd-brief → vd-analisis → vd-plan → [las disciplinas, en orden] → vd-entrega
```

**Puerta de entrada:** `video` — clasifica el pedido y dirige a la skill correcta.
Nunca se produce un entregable de Video Editing sin pasar por ahí.

## Las skills

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **V0** | `vd-brief` | Las 4 preguntas: goal, runtime, plataforma y tono. **Sin brief no se mira material** | el pedido y el Excel creativo |
| **V1** | `vd-analisis` | Frames, transcripción, ritmo y specs cruzados por timecode. Momentos oro y huecos | el material de Producción |
| **V2-V3** | `vd-plan` | Qué disciplinas necesita, beats, Story Cutter, EDL y orden de operaciones. 🚦 **gate** | `vd-brief` + `vd-analisis` |
| **1** | `vd-story-cutter` | Narrativa, documental, comercial y cinematográfica. **Produce el picture lock** | `vd-plan` |
| **2** | `vd-vfx` | Roto, tracking, chroma, limpieza de plano. **Antes del color** | picture lock |
| **3** | `vd-broll` | Tomas de apoyo, cubrir cortes y jump cuts | picture lock |
| **4** | `vd-ritmo-social` | Energía, beat cuts, vertical, hooks visuales y safe areas | picture lock |
| **5** | `vd-color` | Corrección y look de marca. **Después del picture lock, antes de la gráfica** | picture lock |
| **6** | `vd-motion` | Gráficas animadas y compositing. **Después del color** | `vd-color` |
| **7** | `vd-captions` | Subtítulos y texto animado. **Después del color, nunca antes** | `vd-color` |
| **8** | `vd-audio` | Limpieza de voz, música, efectos y la mezcla final | picture lock |
| **V5** | `vd-entrega` | QC técnico, de contenido, de marca y legal + un master por plataforma. 🚦 **gate** | la mezcla cerrada |

---

## Cómo se usan

1. El agente lee `../WORKFLOW.md` **completo** al arrancar.
2. Declara el **plan contratado** (`WORKFLOW.md` §3). Sin eso no sabe hasta dónde llega.
3. Corre los bloques **en orden**. Cada skill abre su `SKILL.md` y lo sigue entero.
4. Si falta el input de un bloque, **se corre el anterior**. Nunca se improvisa el faltante.
5. Cierra con los entregables de `../WORKFLOW.md` §7. **Cada agente entrega lo suyo**, con su
   propio formato — no hay skill de entrega compartida.

**No se inventan skills nuevas sobre la marcha.** Si un procedimiento se repite lo suficiente
como para merecer una, se propone a Allan primero.
