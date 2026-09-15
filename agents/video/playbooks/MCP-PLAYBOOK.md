# Playbook — MCPs del Agente de Video

Qué herramienta para qué. **Los MCPs asisten; no reemplazan el criterio de edición ni el análisis
con `ffmpeg`.**

---

## Mapa por fase

| Fase | Necesidad | Herramienta |
|---|---|---|
| **0 · Brief** | Buscar el guion, concepto o brand guideline | `Notion` · `Google_Drive` · `Inherent_O_S` |
| **0 · Brief** | Traer la estrategia del cliente | `agents/strategy/clients/<cliente>/` (local) |
| **1 · Material** | Leer archivos locales | `ffmpeg` / `ffprobe` — **siempre primero** |
| **1 · Material** | Traer material del cliente | `Google_Drive` (`search_files`, `download_file_content`) |
| **1 · Material** | Analizar un video online o largo | `Higgsfield` `video_analysis_create` → `video_analysis_status` |
| **1 · Referencias** | Buscar referencias reales de la categoría | `Eden` `search_social_content` · `study_top_titles` |
| **1 · Referencias** | Ver qué anuncios en video corren hoy | `AdWhispr_Ads` `get_brand_ads` · `research_tiktok_ads` |
| **3 · Plan** | Música de tendencia para social | `Higgsfield` `tiktok_music_trending` |
| **4 · Edición** | Generar B-roll que no existe | `Higgsfield` `generate_video` · `generate_image` |
| **4 · Edición** | Quitar fondo / key | `Higgsfield` `remove_background` |
| **4 · Edición** | Voz en off o doblaje | `Higgsfield` `generate_audio` · `dubbing` · `list_voices` |
| **4 · Edición** | Reencuadre asistido a vertical | `Higgsfield` `reframe` |
| **4 · Edición** | Cortes de pieza larga a social | `Higgsfield` `personal_clipper_create` · `shorts_studio_create` |
| **5 · Entrega** | Subir de resolución | `Higgsfield` `upscale_video` |
| **5 · Entrega** | Chequeo de potencial de retención | `Higgsfield` `virality_predictor` |
| **5 · Entrega** | Guardar el entregable | `Google_Drive` (con aprobación) |

---

## Reglas de uso

1. **`ffmpeg` primero.** Si el archivo está local, se analiza local. Un MCP no reemplaza extraer
   frames y leerlos.
2. **Lo generado se declara.** Todo plano creado con IA se marca en el EDL como
   `[GENERADO — Higgsfield]`. El cliente tiene que saber qué es real y qué no.
3. **Generar es el último recurso.** Primero se busca en el material, después en assets del cliente,
   después en stock autorizado, y recién ahí se genera.
4. **Nunca se genera una persona o un producto que representa algo real.** Un testimonio no se
   fabrica. Una demo de producto no se simula.
5. **El agente no publica.** `tiktok_publish`, `eden_publish_post_now` y `eden_schedule_post` están
   denegados. La publicación es de Social Media.
6. **Máximo 3 intentos de búsqueda por objetivo.** Después se le pide al usuario un link, un nombre
   o el archivo.
7. **Un error o timeout no es un cero.** Nunca reportes un fallo como "no hay material".
8. **Si falta un MCP:** `⚠️ SIN [MCP] — [qué no se pudo hacer]`. No se rellena con inferencia.
9. **Música con licencia.** Una pista de tendencia sirve de referencia de ritmo; no se entrega en un
   comercial sin licencia. Se declara el estado de licencia en el QC.

---

## Secuencia típica — pieza social desde material crudo

```
1  Drive           search_files + download          → material y assets
2  ffprobe         tech.json                        → qué banca el material
3  ffmpeg          frames + audio + silencios       → qué hay realmente
4  Eden            search_social_content             → 3-5 referencias de la categoría
5  ffmpeg          scene detect sobre referencias    → ritmo objetivo (cortes/min)
6  [Fase 2-3]      disciplinas + plan + EDL          → gate humano
7  Higgsfield      reframe / generate_video          → solo huecos declarados
8  ffmpeg          export por plataforma + loudnorm  → entrega
```

---

## Denegado (nunca, sin excepción)

| Acción | Por qué |
|---|---|
| Publicar o programar en cualquier red | Es de Social Media, y es irreversible |
| Lanzar o modificar campañas pagas | Es de Media Buy |
| Borrar o sobrescribir archivos del cliente en Drive | Destructivo |
| Enviar la pieza al cliente por mail | Requiere gate humano |
| Sobrescribir un master aprobado | Cada versión es un archivo nuevo |
