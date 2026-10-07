# Rúbrica de calificación de clips — <cliente> · <rodaje>

> Plantilla de ⑥B · `ve-recepcion` §4. Se copia a `production/grading/RUBRIC.md` del proyecto y se
> completa la cabecera con el objetivo del ciclo y la dirección de ④/②B.

Objetivo de los clips: **<formato y plataforma — p. ej. Reels/TikTok 9:16>**.
Dirección de ④ y ②B para este material: **<qué tiene que verse — p. ej. doble cuadro, detalle que dé
apetito, sensorial: vapor, salsa cayendo, corte, brillo, textura>** — citar la regla de § Imagen de la guía.

## Nota 0–10
- 9–10: toma protagonista. Nítida, bien expuesta, estable, apetitosa, fondo limpio, acción completa.
- 7–8: sólida, usable tal cual o con recortes menores.
- 5–6: usable como relleno/transición o solo en fragmentos.
- 3–4: débil; solo un fragmento corto se salva.
- 0–2: descartar.

## Veredicto
- `DESCARTADO`: fuera de foco la mayor parte; movimiento inusable; no pasa nada relevante; el encuadre corta el sujeto;
  dominado por distractores (basura, cables, impresora, trapo, desorden, mano sin guante); o **toma repetida inferior**
  (existe otra mejor de la misma acción → `duplicate_of`).
- `USAR CON RECORTES`: útil, pero partes lo arruinan → `keep` (rangos que se conservan) y `cut` (rangos con motivo).
- `USAR COMPLETO`: todo sirve (solo se recorta el arranque/paro de grabación).
- `SIN ARCHIVO`: el material no se pudo descargar → se nombra de quién se espera.

Siempre se recortan cabezas y colas donde la cámara se acomoda o la mano va a detener la grabación.

## Qué se anota por clip (esquema JSON, llaves exactas)
```
{"clip":"R1_16","file":"IMG_5593.MOV","duration":5.2,"grade":9,
 "verdict":"DESCARTADO | USAR CON RECORTES | USAR COMPLETO | SIN ARCHIVO",
 "summary":"qué se ve, 1 frase",
 "keep":[[inicio,fin]], "cut":[{"from":0,"to":2.0,"reason":"..."}],
 "hero":[{"from":3.2,"to":6.0,"what":"momento más apetitoso"}],
 "shot":"macro | close-up | plano medio | plano abierto", "angle":"cenital | 45° | frontal | lateral | POV",
 "camera":"fija | mano estable | mano inestable | paneo | órbita | acercamiento | alejamiento",
 "dish":"<categoría del producto>", "actions":["..."],
 "people":"ninguna | manos con guante | mano sin guante | chef sin rostro | chef con rostro | mesero | cliente",
 "split":{"ok":true,"focus_y":0.6,"note":"centro vertical del sujeto; ok si cabe en media altura"},
 "issues":["problema + rango"], "duplicate_of":null, "notes":"..."}
```
Tiempos en segundos con 1 decimal, del ORIGINAL (los proxies tienen la misma línea de tiempo).
