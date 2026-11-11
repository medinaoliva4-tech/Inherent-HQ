# Radar con sentido · alternativa abierta a Apify

**Qué es.** `code-os/radar/` toma los referentes del cliente y de su cliente ideal (`{plataforma, usuario}`), trae sus publicaciones con métricas públicas, mide cuánto rinde cada una frente a su propia cuenta, rankea los winners, transcribe, saca el gancho y marca lo **quemado** (el mismo contenido ya visto en otras cuentas o plataformas). Costo: **US$ 0** con herramientas abiertas y la IA gratis de `nivel-bajo`.

## Uso

```bash
node code-os/radar/radar.mjs referentes.json --out salida/ --max 5
#   --sin-video        solo métricas (sin bajar video, sin huellas ni whisper)
#   --sin-ia           gancho por heurística (primera frase), sin LiteLLM
#   --presupuesto-usd  tope de dólares de IA (0 = solo modelos gratis)
#   --max-ia           tope de llamadas a LiteLLM por corrida
node --test code-os/radar/test/         # pruebas (sin red)
```

`referentes.json`: `{"cliente": "akai", "referentes": [{"plataforma": "youtube", "usuario": "@cuenta", "rol": "icp"}]}`. Plataformas: `youtube` (por defecto `/shorts`; `"seccion": "videos"` para largos), `tiktok`, `instagram`.

**Salida** en `--out`: `radar.md` (tabla para leer), `radar.json` (todo), `nodos-radar.json` (nodos del hilo) y `fotogramas/` (primer cuadro de cada video).

## Cómo funciona

| Paso | Herramienta (licencia) | Notas |
|---|---|---|
| Lista y métricas de YouTube y TikTok | `yt-dlp` (Unlicense, commits diarios) | Vistas, likes, comentarios, compartidos (TikTok), fecha, duración, seguidores. Sin login. |
| Instagram | API oficial Graph, *Business Discovery* (gratis) | Likes, comentarios y seguidores de cuentas profesionales. Requiere una cuenta profesional nuestra + app de Meta (`IG_GRAPH_TOKEN`, `IG_USER_ID`). No da reproducciones de cuentas ajenas. |
| Transcripción | 1) subtítulos públicos vía `yt-dlp` · 2) `whisper.cpp` (MIT) en CPU | YouTube casi siempre trae subtítulos (`-orig` = idioma real). TikTok usa whisper. |
| Huella visual | `ffmpeg` + dHash de 64 bits, 1 cuadro/s | Aguanta recompresión, cambio de tamaño y brillo. Ignora cuadros planos. |
| Huella de audio | `fpcalc` de Chromaprint (LGPL) | Mismo audio con desfase. Solo audio igual = «mismo audio» (puede ser música de tendencia), no cuenta como contenido quemado. |
| Gancho | LiteLLM `nivel-bajo` (NVIDIA, gratis) | JSON `{gancho, tipo, por_que, angulo}`. Opcional `RADAR_NIVEL_VISION` para mandar el primer cuadro. Sin llave o sin presupuesto: heurística. |
| Visión detallada | `agents/04-creative/.../leer-video.py` | Para los winners: hoja de contacto, cortes y OCR. El radar no lo repite. |

**Métricas.** `engagement = (likes + comentarios + compartidos) / vistas`. `× cuenta = vistas / mediana de su cuenta`. `puntaje = × cuenta × √(engagement / mediana de engagement de su cuenta)`. **Winner** = puntaje ≥ 1.5 con al menos 3 publicaciones de muestra. ⏳ = publicada hace menos de 3 días.

**Quemado.** Cada publicación se compara con todo lo que el radar ya vio (índice en la caché, crece con cada corrida). `fresco` = sin parecidos · `visto` = aparece en 1 otra cuenta/plataforma · `quemado` = en ≥ 2 (`RADAR_CUENTAS_QUEMADO`). Umbrales: visual 0.6, audio 0.7, texto 0.5.

**Caché y topes.** Lista 12 h, métricas 24 h, transcripción/huellas/gancho sin vencimiento. Topes: 5 publicaciones por cuenta, 400 MB de video por corrida, 60 MB por video, 60 s analizados, 30 llamadas de IA, US$ 0. El video se borra apenas se sacan las huellas.

## Prueba real (2026-11-10, Mac, sin gastar)

Referentes: 1 cuenta de YouTube (Shorts), la misma marca en TikTok, y su Instagram. 5 publicaciones por cuenta.

- **Tiempo:** 152 s en frío (listar 5 s, métricas 44 s, video + huellas + whisper 103 s); **0.1 s** al repetir (caché).
- **Éxito:** YouTube 5/5 y TikTok 5/5 con métricas, transcripción, huella visual y de audio. Instagram sin token: 0, como se esperaba (sin login no da datos útiles; ver abajo).
- **Calidad:** las 4 publicaciones que la marca subió a YouTube y a TikTok salieron emparejadas (visual 1.0, audio 1.0, texto 0.71–0.80) y las 2 únicas de cada red quedaron `fresco`: **0 falsos positivos**. Subtítulos de YouTube y whisper `base` dieron transcripciones limpias. El ranking por cuenta sí distingue: el post de TikTok con 3.2× su mediana quedó primero aunque un Short tenga 43 M de vistas.
- **IA:** no se probó en vivo (el VPS no respondía por Tailscale); el cliente está probado con respuestas simuladas y cae a la heurística sin romper.
- **Descarga:** 35 MB para 10 videos cortos.

## Términos de uso y bloqueo (léelo antes de escalar)

**Reglas del radar, sin excepción:** solo cuentas y publicaciones públicas · nunca cookies, contraseñas ni cuentas ajenas · nunca proxies rotativos, CAPTCHAs ni nada que esquive un bloqueo · una petición a la vez por plataforma, con pausa (YouTube 2.5 s, TikTok 5 s, Instagram 3 s + azar) · **si la plataforma frena (429, «confirma que no eres un bot», pide login), el radar para esa plataforma en esa corrida** · uso interno de análisis: no se republica nada y el video se borra.

| Plataforma | Riesgo de términos | Riesgo de bloqueo | Camino recomendado |
|---|---|---|---|
| YouTube | Sus términos prohíben acceso automatizado fuera de lo permitido y bajar contenido sin permiso. | Medio en IP de centro de datos (el VPS): YouTube pide «confirma que no eres un bot». | Métricas por **YouTube Data API v3** (oficial, gratis, 10 000 unidades/día ≈ miles de videos). `yt-dlp` solo para subtítulos y el clip a analizar. |
| TikTok | Sus términos prohíben el scraping. | Alto a volumen; bajo a ritmo educado. | `yt-dlp` a ritmo bajo, pocos referentes, uso interno. No hay API oficial abierta para cuentas ajenas (la Research API es solo académica). |
| Instagram | Meta prohíbe la recolección automatizada sin permiso. | Muy alto sin login: hoy no da posts (probado con yt-dlp e instaloader). | **API Graph Business Discovery** (oficial, gratis). Solo cuentas profesionales; sin reproducciones. |

Esto es una evaluación de riesgo operativa, no asesoría legal. Si el radar se vuelve parte de lo que se vende, conviene que un abogado lo revise.

## Comparación con Apify (precios publicados, nov 2026)

| Volumen al mes | Radar abierto (VPS) | Apify |
|---|---|---|
| 3 000 publicaciones (10 clientes × 10 referentes × 30) | US$ 0 | ≈ US$ 5–8 en métricas (TikTok desde 1.70, Instagram 1.50–2.70 por 1 000) + transcripción aparte; cabe en el plan de US$ 19 |
| 30 000 publicaciones | US$ 0 (≈ 3–5 h de CPU del VPS y ~10 GB de descarga temporal) | ≈ US$ 50–80 en métricas, más transcripción y descargas → plan de US$ 199 |

**Lectura honesta:** para solo métricas, Apify es barato a poco volumen y más estable con Instagram. Lo caro de Apify es ver los videos (descarga + transcripción) a volumen. El radar abierto hace eso gratis; su costo real es mantenimiento (actualizar `yt-dlp`, que cambia con cada cambio de las plataformas) y el riesgo de bloqueo. **Mezcla sugerida:** APIs oficiales para métricas (YouTube Data API, Instagram Business Discovery), `yt-dlp` para TikTok y para ver los videos, Apify solo si un cliente necesita Instagram de cuentas no profesionales.

## Para correrlo en el VPS como herramienta de un agente

1. Instalar: `pipx install yt-dlp` (y actualizarlo cada semana con un timer), `apt install ffmpeg libchromaprint-tools`, compilar `whisper.cpp` y bajar `ggml-base.bin` (142 MB). En CPU de 4 núcleos, whisper `base` tarda aprox. 0.3–0.5× la duración del clip *(estimado, no medido en el VPS)*.
2. Variables en `~/gateway/.env`: `RADAR_CACHE_DIR`, `WHISPER_MODEL`, `LITELLM_MASTER_KEY` (ya existe); opcionales `IG_GRAPH_TOKEN`, `IG_USER_ID`, `YOUTUBE_API_KEY` (el adaptador de la API de YouTube falta).
3. Exponerlo al agente de Marketing y Creative como herramienta (MCP o endpoint del puente) que recibe la lista de referentes del cliente y devuelve `radar.json`.
4. Correrlo en cola con el planificador (`code-os/planificador`) para que sus llamadas a `nivel-bajo` entren en el cupo.
5. Probar el bloqueo de YouTube desde la IP del VPS con 1 cuenta antes de programarlo.

## Cómo alimenta el hilo del cliente

Cada winner sale en `nodos-radar.json` como nodo `tipo: "radar"` con `estado: "hipotesis"`, `fuente` = enlace de la publicación y `contenido` = `{x_cuenta, engagement, gancho, tipo_gancho, angulo, por_que, quemado}`. Una persona lo aprueba en la herramienta del radar; aprobado, puede colgar de él un `angulo` o una `campana` (`viene_de: ["radar:…"]`). Lo `quemado` sirve para descartar ideas antes de producirlas.
