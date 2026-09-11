# Playbook — Análisis de Material

Cómo un agente de texto **ve y escucha** un video. Se analiza como **paquete**: frames + audio +
técnico + assets, cruzados por timecode. Nunca por separado.

```
Frames sin transcripción  = análisis ciego
Transcripción sin frames  = análisis sordo
```

---

## 0 · Verificación previa

```bash
ffmpeg -version && ffprobe -version
```

Sin `ffmpeg` → **BLOQUEADO**. Se pide instalación (`apt-get install -y ffmpeg` o `brew install
ffmpeg`) o se pide al usuario el análisis/transcripción ya hechos.

Trabajá siempre en el scratchpad, nunca dentro de `projects/`:
```bash
WORK=/tmp/claude-video/<proyecto> && mkdir -p "$WORK"/{frames,audio,probe}
```

---

## 1 · Radiografía técnica (ffprobe)

```bash
ffprobe -v error -show_format -show_streams -of json input.mp4 > "$WORK"/probe/tech.json
```

Se extrae y se registra:

| Dato | Por qué importa |
|---|---|
| `duration` | Cuánto material hay vs. runtime objetivo |
| `width x height` | Si banca vertical sin upscale |
| `r_frame_rate` | 24/25/30/60 — define speed ramps posibles |
| `codec_name` | Si hay que transcodificar a proxies |
| `bit_rate` | Margen de calidad para grading |
| `sample_rate` / `channels` | Audio mono/estéreo, calidad de voz |

Loudness del audio:
```bash
ffmpeg -i input.mp4 -af loudnorm=print_format=json -f null - 2>&1 | tail -20
```

---

## 2 · Ver la imagen (frames)

### 2.1 Muestreo regular — para inventario
```bash
ffmpeg -i input.mp4 -vf "fps=1/2,scale=640:-1" "$WORK"/frames/f_%04d.jpg
```
`fps=1/2` = un frame cada 2 segundos. Ajustar: material largo `1/5`, pieza corta `1/1`.

### 2.2 Detección de cortes — para leer el ritmo de una referencia
```bash
ffmpeg -i ref.mp4 -vf "select='gt(scene,0.3)',showinfo,scale=640:-1" \
  -vsync vfr "$WORK"/frames/cut_%03d.jpg 2>"$WORK"/probe/cuts.txt
```
De `cuts.txt` se sacan los timecodes de cada corte → **cortes por minuto** y **duración media de
plano**. Es la métrica de ritmo más útil que existe.

### 2.3 Contact sheet — para ver toda la pieza de un vistazo
```bash
ffmpeg -i input.mp4 -vf "fps=1/3,scale=320:-1,tile=5x6" "$WORK"/frames/sheet_%02d.jpg
```

### 2.4 Frame puntual
```bash
ffmpeg -ss 00:00:14.5 -i input.mp4 -frames:v 1 -q:v 2 "$WORK"/frames/tc_14.5.jpg
```

**Después de extraer: leer las imágenes con Read.** Nombrá cada frame con su timecode para que el
análisis quede anclado.

---

## 3 · Escuchar (transcripción)

### 3.1 Extraer audio
```bash
ffmpeg -i input.mp4 -vn -ac 1 -ar 16000 "$WORK"/audio/voz.wav
```

### 3.2 Transcribir — en orden de preferencia
| Vía | Cuándo |
|---|---|
| Subtítulos embebidos: `ffmpeg -i input.mp4 -map 0:s:0 subs.srt` | Si el archivo los trae |
| `.srt` / `.vtt` provisto por el usuario | Siempre que exista |
| Whisper local (`whisper voz.wav --model small --output_format srt`) | Si está instalado |
| MCP de análisis de video (ver `MCP-PLAYBOOK.md`) | Si el material está online |
| Pedirla al usuario | Último recurso, no inventarla |

🛑 **Nunca se inventa una transcripción.** Sin transcripción: `⚠️ SIN TRANSCRIPCIÓN — análisis solo
visual`, y se declara la limitación.

### 3.3 Detectar silencios — para cortar respiraciones
```bash
ffmpeg -i "$WORK"/audio/voz.wav -af silencedetect=n=-30dB:d=0.4 -f null - 2>&1 | grep silence
```
Cada silencio > 0.4s es un candidato a corte o pausa intencional.

---

## 4 · Cruzar todo por timecode

El entregable real es una tabla donde cada fila es un tramo:

| TC in | TC out | Qué se ve (frame) | Qué se dice (transcripción) | Calidad | Uso |
|---|---|---|---|---|---|
| 00:00 | 00:06 | Plano medio, ventana quemada | "Hace tres años…" | 🟡 exposición | A-roll |
| 00:06 | 00:11 | Manos sobre producto | — | 🟢 | B-roll |

**Uso:** `A-roll` (sostiene) · `B-roll` (cubre) · `descarte` (y por qué).

---

## 5 · Momentos oro

Los **3-8 fragmentos** que pueden sostener la pieza. Criterio:

| Es oro si… | No es oro si… |
|---|---|
| Dice algo que nadie más diría | Es información correcta pero genérica |
| La imagen cuenta sola, sin audio | Necesita tres frases de contexto |
| Tiene emoción o tensión real | Está bien iluminado y nada más |
| Es una demo clara de lo que se promete | Es un plano bonito sin función |

Cada momento oro se anota con timecode y con **para qué beat sirve**.

---

## 6 · Descomponer una referencia — 7 capas

Cuando el usuario trae un video de referencia, se descompone igual que el material propio, más:

| # | Capa | Cómo se obtiene |
|---|---|---|
| 1 | **Hook** | Frames 0-3s + primeras palabras de la transcripción |
| 2 | **Estructura** | Transcripción por bloques + timecodes de cambio de tema |
| 3 | **Ritmo** | `scene detect` → cortes por minuto + duración media de plano |
| 4 | **Gráfica** | Frames: tipografía, posición, estilo de captions, motion |
| 5 | **Sonido** | Waveform + escucha: música, SFX, mezcla voz/música |
| 6 | **Color** | Frames: contraste, temperatura, saturación, look |
| 7 | **CTA** | Últimos 5s: qué pide, cómo lo presenta |

🛑 **Se extrae el patrón, no se copia la pieza.** La referencia produce reglas
("cortes cada 1.8s", "captions centrados con palabra resaltada"), no un clon.

---

## 7 · Reglas duras

- 🛑 **Esta fase describe, no decide.** Sin "por lo tanto cortemos acá".
- 🛑 **Nunca reportes un plano que no viste.** Si no extrajiste el frame, no existe.
- **Todo con timecode.** "Por el medio del video" no es un dato.
- **Un error de ffmpeg no es un cero.** Se reporta el error, no "no hay material".
- **Todo output temporal va al scratchpad**, nunca a `projects/`.
- **El material original no se modifica jamás.** Solo lectura.
- Marcado: 🟢 usable · 🟡 usable con arreglo · 🔴 descarte · `⚠️ FALTA MATERIAL`.
