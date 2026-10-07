# El motor de ⑥B — las herramientas con las que Claude edita

> **Quién hace qué:** el **editor de video** (una persona) da las instrucciones y aprueba; **Claude Code
> ejecuta todo** con este kit. Probado de punta a punta en cliente real (AKAI, oct 2026: 123 clips
> calificados, 7 reels entregados, 11 rondas de cambios).
> **Qué se hace en cada paso lo dicen las skills `ve-*`.** Este archivo solo dice con qué y cómo se corre.

## Qué hay acá

| Carpeta | Qué es | Lo usa |
|---|---|---|
| `remotion/` | El motor de montaje: Remotion (React → MP4) + scripts de Python/ffmpeg | todas las capas |
| `remotion/scripts/` | Índice de clips, proxies, hojas `/watch`, originales 4K, estabilización, color, revisión | `ve-recepcion` · `ve-marca` · `ve-export` |
| `remotion/edit/` | La rúbrica de selección, el brief para subagentes y `build_reels.py` (el guion de montaje) | `ve-recepcion` · `ve-armado` |
| `guion-visual/` | La página con el fotograma real de cada escena donde el operador confirma el layout | `ve-armado` §2 |
| `aprobacion/vercel/` | La página pública donde el **cliente** califica, aprueba o pide cambios | `ve-export` §7 |

## Instalación — una vez por máquina

| Herramienta | Para qué | Instalar |
|---|---|---|
| `ffmpeg` / `ffprobe` | Cortar, escalar, medir, revisar | `brew install ffmpeg` |
| `yt-dlp` | Bajar de Drive (proxies y originales) | `brew install yt-dlp` |
| Node 20+ | Remotion | — |
| Skill **`/watch`** | Que Claude "vea" cada clip con tiempos exactos | `~/.claude/skills/watch/` (o `WATCH_SCRIPT=<ruta a watch.py>`) |
| Python + OpenCV | Medir temblor y color, estabilizar | `python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt` |
| Vercel CLI | Publicar la página del cliente | `npm i -g vercel` + `vercel login` |

🛑 **Si falta una:** `BLOQUEADO — falta <herramienta>. Instalala: ver INSTALAR.md § <sección>` —
`ffmpeg`, `yt-dlp`, `/watch` y OpenCV → **§ Herramientas de video** · Node, Remotion y la CLI de
Vercel → **§ Node y Remotion**.

## El proyecto de edición — uno por cliente y rodaje

**El material no vive en el repo** (lo dice ⑤ Producción). Se arma afuera, en la carpeta de trabajo del cliente:

```
<proyecto>/
├── assets/videos/
│   ├── clips_index.json      ← clip → archivo, id de Drive, duración, proxy
│   ├── proxies/R<n>/NN.mp4   ← 360p sin audio, para calificar
│   └── source/               ← originales 4K 60 fps, solo los que se usan
├── production/
│   ├── grading/              ← RUBRIC.md · *.jsonl por grupo · grading.json
│   ├── post-production-list.md
│   ├── guion-visual/         ← copia de motor/guion-visual
│   └── motion/               ← copia de motor/remotion
│       └── public/brand/     ← logos SVG y fuentes de la guía del cliente
└── outputs/video/            ← masters, previews y <versión>-anterior/
```

```bash
cp -R agents/07-video-editing/brain/motor/remotion "<proyecto>/production/motion"
cp -R agents/07-video-editing/brain/motor/guion-visual "<proyecto>/production/guion-visual"
cd "<proyecto>/production/motion" && npm install && python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
```

## Los comandos, por capa

Todos se corren desde `<proyecto>/production/motion`.

**Capa 0 · Recepción y selección** (`ve-recepcion`)
```bash
# 1. Listar el Drive: scripts/drive_listar_carpetas.js en el navegador integrado → listado.json
python3 scripts/index_clips.py listado.json                 # índice + proxies 360p
python3 scripts/watch_sheet.py R1_01 R1_02 --step 1.0       # hoja /watch con el tiempo real quemado
python3 scripts/watch_sheet.py R1_30:2.5-6.0 --step 0.25    # hoja fina para un punto de corte
python3 scripts/grade_add.py < calificaciones.json          # guarda la calificación (incremental)
python3 scripts/merge_grading.py                            # grading.json + post-production-list.md
```

**Capa 1 · Armado** (`ve-armado`)
```bash
python3 scripts/fetch_all.py 3                              # originales 4K de lo que se usa (3 descargas a la vez)
python3 edit/build_reels.py                                 # el guion de montaje → edit/reels.json
python3 edit/stab_shots.py 4                                # cada tramo: original, color por toma, estabilizado si aplica
npx remotion render src/index.ts CLIENTE-V01 out/V01_v1.mp4 --muted
```

**Capa 2 · Marca y QA medido** (`ve-marca`)
```bash
python3 scripts/review.py out/V01_v1.mp4 15                 # hoja de revisión: un fotograma cada 0.5 s
.venv/bin/python scripts/jitter_all.py                      # temblor original vs estabilizado, por tramo
.venv/bin/python scripts/colorstats.py R7_12 4.9 6.9        # temperatura (b*) y brillo (L*) de una toma
scripts/finish_audio.sh out/V01_raw.mp4 out/V01 "1.6-2.7"   # solo si va con sonido: limpia y silencia voces
```

**Capa 4 · Export y aprobación del cliente** (`ve-export`)
```bash
ffmpeg -i master.mp4 -c:v libx264 -crf 24 -an -movflags +faststart preview.mp4   # preview < 30 MB
cd aprobacion/vercel && python3 build.py data.json display.ttf sans.ttf <carpeta-videos> && vercel deploy --prod
```

🛑 **`vercel deploy --prod` y el link al cliente, solo con el OK del CEO** (`ve-export` §6).

## Lo que el kit NO hace

- ⛔ **No genera video, no escala calidad, no dobla.** Edita material real.
- ⛔ **No publica.** Eso es ⑨ con su gate.
- ⚠️ **Reencuadre a otros formatos (1:1, 16:9) sin probar en cliente real.** El motor lo permite (cambiar `W`/`H`), no se ha entregado todavía.
