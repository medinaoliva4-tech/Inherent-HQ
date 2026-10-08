# Brief para subagentes de calificación — <cliente>

> Plantilla de Video Editing · `ve-recepcion` §4. Se usa cuando hay muchos clips y la calificación se reparte entre
> subagentes en paralelo (un grupo de clips por subagente). Se copia a `production/grading/AGENT_BRIEF.md`.

Proyecto (P): `<ruta del proyecto de edición>` — si tiene espacios, citarla entre comillas.

Antes de empezar: leer `P/production/grading/RUBRIC.md` y `P/assets/videos/clips_index.json`.
Proxies 360x640 sin audio: `P/assets/videos/proxies/<REEL>/<NN>.mp4`. Los tiempos del proxy = tiempos del original.

## Método (obligatorio: skill /watch, con tiempos exactos)
1. Hoja de contacto por clip, con un fotograma por segundo y el tiempo REAL quemado:
   `python3 production/motion/scripts/watch_sheet.py R1_01 R1_02 … --step 1.0 --w 160`
   (usa la skill /watch en modo `--timestamps`; las etiquetas de la pasada uniforme de /watch vienen
   adelantadas ~0.4 s y NO sirven para cortar).
2. Para cada punto de corte o momento protagonista, hoja fina: `watch_sheet.py R1_30:2.5-6.0 --step 0.25`.
3. Leer las hojas con Read (máximo ~20 imágenes por mensaje). No volver a leer lo ya visto: anotar.

## Guardado incremental (obligatorio)
- Apenas se califica un clip, se agrega como UNA línea JSON a `P/production/grading/<GRUPO>.jsonl`
  (`python3 production/motion/scripts/grade_add.py < lista.json` completa archivo y duración).
- Si el `.jsonl` ya existe al empezar, se saltan los clips que ya estén. Así una sesión cortada no pierde trabajo.

Al terminar: resumen corto — conteo por veredicto, mejores momentos (clip + segundos), observaciones.
