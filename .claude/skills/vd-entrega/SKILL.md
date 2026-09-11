---
name: vd-entrega
description: >
  Fase 5 del método de Video — QC y entrega. Corre el control de calidad técnico, de contenido, de
  marca y legal; exporta una versión por plataforma con las specs correctas (resolución, aspecto,
  fps, loudness, safe areas) y produce el documento de entrega y el handoff. Úsala cuando pidan
  "exportá", "¿está listo para publicar?", "pasámelo en vertical y horizontal", "revisá antes de
  mandarlo", "hacé el QC". Ninguna pieza sale sin esto. El agente no publica.
---

# Fase 5 — QC y Entrega

**Leé completo antes de empezar:** `agents/video/playbooks/ESPECIFICACIONES.md`
**Checklist:** `agents/video/qa/QC-GATES.md` § Fase 5
**Plantilla:** `agents/video/templates/qc-entrega.md`

## 1. Un export por plataforma

🛑 **Nunca un solo archivo para todas.** Cada destino tiene su aspecto, resolución y duración útil.

| Destino | Aspecto | Resolución | Loudness |
|---|---|---|---|
| TikTok / Reels / Shorts | 9:16 | 1080×1920 | −14 LUFS |
| YouTube largo | 16:9 | 1920×1080 / 4K | −14 LUFS |
| Feed / LinkedIn | 4:5 / 1:1 | 1080×1350 / 1080×1080 | −14 LUFS |
| Web hero | 16:9 | 1920×1080 | mudo |

**Reframe, no crop ciego.** Pasar 16:9 a 9:16 con `crop` corta cabezas: se revisan los frames.

## 2. Los 4 QC

| QC | Qué verifica |
|---|---|
| **Técnico** | Resolución · fps · `yuv420p` · `faststart` · LUFS · sin frames negros · safe areas |
| **Contenido** | Hook cumple lo prometido · un solo CTA · loops cerrados · ortografía · datos |
| **Marca** | Tipografía · paleta · LUT · logo · sonotipo · no contradice a Strategy |
| **Legal** | Música con licencia · stock · autorizaciones · material IA declarado |

## 3. Comandos base

```bash
# 9:16 social
ffmpeg -i master.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k \
  -movflags +faststart social_9x16.mp4

# Normalizar loudness
ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy out.mp4

# Miniatura / primer frame
ffmpeg -ss 00:00:00.5 -i master.mp4 -frames:v 1 -q:v 2 thumb.jpg
```

## 4. Reglas duras

- 🛑 **Ninguna pieza sale con un hallazgo 🔴 abierto.**
- 🛑 **El agente no publica ni programa.** Eso es de Social Media, y es irreversible.
- 🛑 **Nunca se sobrescribe un master aprobado.** Cada versión es un archivo nuevo.
- **Se mira la pieza entera, en mudo y con sonido, en móvil.** No se aprueba por scrub.
- **Primer frame elegido** (es la miniatura) · **último frame** con marca + CTA, ≥1.5s, no negro.
- **Material generado con IA declarado al cliente**, con qué planos.
- **Nomenclatura:** `<cliente>_<proyecto>_<version>_<formato>.<ext>`.

## 5. Cierre

Completar `qc-entrega.md` con los 4 QC, los hallazgos y el resultado.

🚦 **GATE 3 — Master aprobado** por un humano antes del handoff.

## Handoff

```markdown
## HANDOFF — Video → Content / Social Media
- Cliente: · Proyecto: · Fecha: · Goal: · Plataformas:
- Masters: [rutas] · Gates: brief/plan/master [✅/⬜]
- Disciplinas aplicadas: · Brand guideline: ✅ / ⚠️ SIN GUIDELINE
- Licencias: ✅ / ⚠️ · Material IA: [planos] / ninguno
- Huecos abiertos: [⚠️ FALTA MATERIAL]
```
