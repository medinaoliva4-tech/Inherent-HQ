# Playbook — Especificaciones de Entrega

Specs por plataforma + comandos de export. **Nunca se entrega un solo archivo para todas las
plataformas.**

---

## 1 · Specs por plataforma

| Plataforma | Aspecto | Resolución | FPS | Duración útil | Audio |
|---|---|---|---|---|---|
| **TikTok** | 9:16 | 1080×1920 | 30 | 15-60s | −14 LUFS |
| **Instagram Reels** | 9:16 | 1080×1920 | 30 | 15-90s | −14 LUFS |
| **YouTube Shorts** | 9:16 | 1080×1920 | 30/60 | ≤60s | −14 LUFS |
| **YouTube (largo)** | 16:9 | 1920×1080 / 3840×2160 | 24/30/60 | libre | −14 LUFS |
| **Instagram Feed** | 4:5 | 1080×1350 | 30 | 15-60s | −14 LUFS |
| **LinkedIn** | 1:1 o 4:5 | 1080×1080 / 1080×1350 | 30 | 30-90s | −14 LUFS |
| **Web / Landing (hero)** | 16:9 | 1920×1080 | 30 | 10-30s, loop, **mudo** | sin audio |
| **Meta Ads** | 9:16 + 1:1 | 1080×1920 / 1080×1080 | 30 | 15-30s | −14 LUFS |

### Safe areas — vertical (9:16, 1080×1920)
| Zona | Margen | Qué la tapa |
|---|---|---|
| Superior | 150 px | Reloj, barra de estado, header de la app |
| Inferior | 420 px | Caption, usuario, música, botones |
| Derecha | 150 px | Columna de acciones (like, share, comentar) |
| Izquierda | 60 px | Margen de lectura |

**Todo texto y todo logo viven dentro del safe area.** Un caption pisado por la UI es un QC fallado.

---

## 2 · Comandos de export

### Master (fuente de todas las versiones)
```bash
ffmpeg -i timeline.mov -c:v libx264 -preset slow -crf 16 \
  -pix_fmt yuv420p -c:a aac -b:a 320k master.mp4
```

### Entrega social (9:16)
```bash
ffmpeg -i master.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -movflags +faststart social_9x16.mp4
```

### Entrega 16:9
```bash
ffmpeg -i master.mp4 -vf "scale=1920:1080" -c:v libx264 -preset slow -crf 19 \
  -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart yt_16x9.mp4
```

### Web hero (mudo, loop, liviano)
```bash
ffmpeg -i master.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 24 \
  -preset slow -pix_fmt yuv420p -movflags +faststart web_hero.mp4
```

### Normalizar loudness a −14 LUFS
```bash
ffmpeg -i in.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy out.mp4
```

### Quemar subtítulos con estilo
```bash
ffmpeg -i in.mp4 -vf "subtitles=subs.srt:force_style='FontName=<marca>,FontSize=20,\
PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=3,MarginV=460'" \
  -c:a copy out_subs.mp4
```

### Miniatura / primer frame
```bash
ffmpeg -ss 00:00:00.5 -i master.mp4 -frames:v 1 -q:v 2 thumb.jpg
```

🛑 **El crop ciego no es reframe.** Pasar 16:9 a 9:16 con `crop` corta cabezas. Si el sujeto no está
centrado: se reencuadra plano por plano o se usa reframe asistido
(ver `MCP-PLAYBOOK.md`). Un crop automático sin revisar frames **no se entrega**.

---

## 3 · Nomenclatura

```
<cliente>_<proyecto>_<version>_<formato>.<ext>

inherent_lanzamiento_v04master_9x16.mp4
inherent_lanzamiento_v04master_16x9.mp4
inherent_lanzamiento_v03online.mp4
```

| Versión | Qué contiene |
|---|---|
| `v01roughcut` | Solo corte narrativo |
| `v02picturelock` | Ritmo y B-roll cerrados — **la estructura ya no cambia** |
| `v03online` | VFX + color + audio |
| `v04master` | Gráfica + master final |

**Nunca se sobrescribe.** Cada revisión sube de número.

---

## 4 · Checklist técnico de salida

- [ ] Resolución y aspecto correctos para **cada** plataforma de destino
- [ ] FPS constante, sin frames duplicados ni drops
- [ ] `-pix_fmt yuv420p` (si no, no reproduce en algunos dispositivos)
- [ ] `-movflags +faststart` en todo lo que va a web o social
- [ ] Loudness ≈ −14 LUFS, true peak ≤ −1.5 dBTP
- [ ] Sin clipping de audio, sin ruido de fondo audible
- [ ] Texto y logo dentro de safe areas en todos los formatos
- [ ] Primer frame legible y elegido (sirve de miniatura)
- [ ] Último frame no negro: marca + CTA, ≥1.5s
- [ ] Sin frames negros intermedios ni flashes de renders fallidos
- [ ] Peso razonable para la plataforma (social: <100 MB salvo pedido)
- [ ] Archivo abre y reproduce en móvil, no solo en el reproductor de escritorio
