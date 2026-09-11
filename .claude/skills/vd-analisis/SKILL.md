---
name: vd-analisis
description: >
  Fase 1 del método de Video — comprende el MATERIAL antes de decidir el corte. Extrae frames con
  ffmpeg, lee la transcripción, mide ritmo y specs técnicas, y los cruza por timecode para producir
  un inventario de planos, los momentos oro y los huecos. Úsala cuando traigan material crudo o un
  video de referencia, o cuando pidan "analizá esta referencia", "qué hay en este material", "sacá
  los mejores momentos", "cómo está editado esto", "cuántos cortes tiene". Describe lo que hay — no
  decide el corte.
---

# Fase 1 — Análisis de Material

**Leé completo antes de empezar:** `agents/video/playbooks/ANALISIS-DE-MATERIAL.md`

**Plantilla:** `agents/video/templates/analisis-de-material.md`
**Output:** `projects/<cliente>/<proyecto>/analisis-de-material.md`

## Se analiza como paquete

```
Frames sin transcripción  = análisis ciego
Transcripción sin frames  = análisis sordo
```

| Bloque | Herramienta | Qué produce |
|---|---|---|
| **Técnico** | `ffprobe -show_format -show_streams` | Duración, resolución, fps, codec, audio, LUFS |
| **Imagen** | `ffmpeg -vf fps=1/2` → Read de los frames | Inventario de planos con timecode |
| **Ritmo** | `ffmpeg -vf select='gt(scene,0.3)',showinfo` | Cortes por minuto, duración media de plano |
| **Audio** | extraer wav → transcripción + `silencedetect` | Qué se dice, dónde, y dónde hay silencios |
| **Assets** | inventario de `_INPUTS/` | Logos, música, LUTs, tipografías |

**Todo el trabajo intermedio va al scratchpad, nunca a `projects/`.**
Sin `ffmpeg`: **BLOQUEADO** — pedir instalación o el análisis ya hecho.

## Qué entregás

1. **Inventario de planos**: `TC in · TC out · qué se ve · qué se dice · calidad · uso`
   (A-roll / B-roll / descarte)
2. **3-8 momentos oro**, cada uno con **para qué beat sirve**
3. **Huecos**: `⚠️ FALTA MATERIAL — [qué plano y para qué beat]`
4. **Problemas técnicos** con timecode y severidad
5. **Si hay referencia:** las 7 capas (hook · estructura · ritmo · gráfica · sonido · color · CTA)

## Reglas duras

- 🛑 **Esta fase NO decide.** Si escribís "por lo tanto cortemos acá", te saliste del rol.
- 🛑 **Nunca describas un plano que no viste.** Si no extrajiste el frame, no existe.
- 🛑 **Nunca inventes una transcripción.** Sin ella: `⚠️ SIN TRANSCRIPCIÓN — análisis solo visual`.
- **Todo con timecode.** "Por el medio del video" no es un dato.
- **El original no se modifica jamás.** Solo lectura.
- **Un error de ffmpeg no es un cero.** Se reporta el error, no "no hay material".
- **De una referencia se extrae el patrón, no la pieza.** Produce reglas
  ("cortes cada 1.8s"), no un clon.
- Marcado: 🟢 usable · 🟡 usable con arreglo · 🔴 descarte.

## Cierre

Correr el bloque **Fase 1** de `qa/QC-GATES.md`. Registrar fecha, herramientas usadas y no
disponibles, y confianza general 🟢/🟡/🔴.

## Handoff
→ `vd-plan`. El análisis se re-corre si entra material nuevo.
