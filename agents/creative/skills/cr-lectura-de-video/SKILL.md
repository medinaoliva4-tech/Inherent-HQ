---
name: cr-lectura-de-video
description: >
  Capa 1 del método de Creatividad — lee de verdad un video de referencia. Extrae los cortes y la
  duración media de plano (el ritmo), frames densos en la zona de hook y uno por plano, una hoja de
  contacto con timestamps quemados, el texto en pantalla por plano (OCR), la paleta dominante y los
  datos técnicos; y lo deja en una ficha de referencia reutilizable. Úsala cuando pidan "mirá este
  video", "analizá esta referencia", "qué está haciendo este anuncio", "leé la ambientación de
  esto", "qué ritmo tiene", "de dónde sale el hook", "cuántos setups tiene", o cuando llegue un
  archivo de video o un link de referencia. Es parte de la Capa 1, no la reemplaza: leer no es
  validar.
---

# Lectura de video — la capacidad de "ver"

**Qué consume**
- Un **link de anuncio** (vía A, por MCP) o **el archivo de video** (vía B, pipeline local).
- El hueco de referencia que la Capa 1 definió: qué canal, formato o tipo de hook falta cosechar.
- El método completo del departamento: `agents/creative/WORKFLOW.md`.

**Qué produce**
- Una **ficha de referencia** por pieza leída, según la plantilla
  `.claude/skills/cr-lectura-de-video/ficha-de-referencia.md`, guardada en el swipe file del cliente.
- Alimenta: `referencia_visual`, `hook`, `escenas`, `encuadres`, `duraciones` y `estética / mood`
  de las piezas del ciclo, y el número de **setups distintos** que viaja a ⑤ Producción.

---

## Lo primero: un modelo no mira videos, mira imágenes

🛑 **Cualquier lectura de video es en realidad una EXTRACCIÓN:** frames, texto en pantalla, audio,
tiempos. La pregunta no es *si* se puede, es **cuántos frames hacen falta** — y ahí se gana o se
pierde la eficiencia.

| Enfoque | Por qué falla |
|---|---|
| ❌ "Ver el video completo" | No existe: hay que convertirlo a frames igual. Solo cambia quién decide cuántos |
| ❌ 1 frame por segundo | Un video de 30 s da 30 imágenes, y la mitad son el mismo plano. Caro y redundante |
| ❌ 3 frames al azar | Barato y ciego: se pierde el hook, que es exactamente lo que hay que leer |
| ✅ Muestrear **por estructura, no por tiempo** | Denso donde la pieza se decide (los primeros segundos), uno por plano en el resto, y se descarta lo repetido |

---

## Paso 0 — ¿Ya está leída?

Buscá la ficha en el swipe file del cliente **antes** de correr nada. Una referencia leída **no se
vuelve a leer**: la ficha es la caché del departamento.

---

## Paso 1 — Elegí la vía

| Lo que necesitás leer | Vía | Qué hacer |
|---|---|---|
| **El mensaje**: gancho, promesa, oferta, estructura de guion | **A · por MCP** | Pedir el ad al MCP de ads: días corriendo, copy, CTA, landing y —si lo trae— transcripción con timestamps |
| **La imagen**: ambientación, luz, encuadre, paleta, ritmo de corte | **B · pipeline local** | Correr el pipeline sobre el archivo de video |

- **Vía A** es la barata y cubre la mayor parte de la cubeta `70·probado`. 🛑 **Vía A primero:** si lo
  que se busca es el patrón de mensaje, pedir el archivo es trabajo de más.
- **Vía A no alcanza** cuando hay que leer la imagen. Ambientación, luz, encuadre, paleta y ritmo
  **ningún MCP los devuelve masticados**.
- **Vía B requiere el archivo:** lo sube un humano, sale de Drive, o es material propio del cliente.

⚠️ **No podés bajar el video de TikTok, Instagram ni Meta.** Esos dominios están fuera de alcance de
red. Si hace falta leer la imagen y la referencia vive ahí, **pedí el archivo en una línea** y seguí
con el resto del bloque. No es un bloqueo del ciclo.

---

## Paso 2 — Corré el pipeline (vía B)

```bash
python3 .claude/skills/cr-lectura-de-video/leer-video.py <ruta-al-video> --hook 3 --scene 0.12
```

Deja en `<video>_lectura/`: `hoja-de-contacto.jpg`, los frames del hook y por plano, y
`lectura.json` con ritmo, texto en pantalla y paleta.

### Los 8 pasos

| # | Paso | Herramienta | Qué produce |
|---|---|---|---|
| 1 | **Datos técnicos** | `ffprobe` | Duración, relación de aspecto, fps, si tiene audio |
| 2 | **Detección de cortes** | `ffmpeg` filtro `scene` | Los segundos donde cambia el plano → **el ritmo** |
| 3 | **Frames del hook** | `ffmpeg -ss` | Uno por segundo dentro de la zona de hook (0-3 s por defecto) |
| 4 | **Un frame por plano** | `ffmpeg -ss` | El punto medio de cada plano detectado |
| 5 | **Descarte de repetidos** | firma perceptual | Si dos frames son el mismo cuadro, queda uno |
| 6 | **Hoja de contacto** | `montage` | **Un solo JPG** con el arco completo y el timestamp quemado en cada cuadro |
| 7 | **Texto en pantalla** | `tesseract` | Lo que dice sin voz, plano por plano. Dos pasadas: directa y con contraste forzado |
| 8 | **Paleta dominante** | Pillow | Los colores de cada plano → alimenta la estética / mood |

### El orden de magnitud, medido

Sobre un **video de 18 s con 5 planos**: **36 frames crudos** a 2 fps → **5 tiles** en la hoja de
contacto, 3 repetidos descartados, **~150 KB** de paquete total, **4,5 segundos de proceso en 2
núcleos**. Una imagen en lugar de treinta y seis.

### Los dos parámetros que se tocan

| Parámetro | Default | Cuándo se toca |
|---|---|---|
| `--hook` | `3` (segundos) | Subilo a `5` si la pieza es de formato largo. El default de 3 s es para social |
| `--scene` | `0.12` (umbral de corte) | Subilo a `0.20` si detecta cortes falsos por mucho movimiento de cámara. Bajalo a `0.08` si se pierde cortes entre planos de luminancia parecida |

🛑 **Por qué `0.12` y no `0.25`:** con `0.25` se pierden los cortes entre planos de luminancia
parecida — **probado: en un video con 4 cortes, `0.25` detectó 3.** Un corte perdido es un plano que
no se lee y un setup que ⑤ Producción no presupuesta.

---

## Paso 3 — Leé, en este orden

1. **La hoja de contacto.** El arco completo de un vistazo. Responde el 80 % de las preguntas.
2. **El `lectura.json`.** Ritmo, texto por plano, paleta. Es texto: barato.
3. **Frames sueltos, solo si hace falta un detalle** — un encuadre puntual, una textura, cómo está
   resuelto un rótulo.

🛑 **No abras los 5 frames si la hoja ya te lo dijo.** Cada imagen cuesta.

---

## Paso 4 — Qué se lee en cada zona

| Zona | Qué hay que sacar |
|---|---|
| **Hook (0-3 s)** | ¿Qué se ve en el cuadro 1: cara, producto, texto, movimiento? ¿Hay texto en pantalla desde el cuadro 1 —o sea, el hook **se lee** en vez de escucharse? ¿Hay un corte dentro del hook? ¿Se entiende sin audio? |
| **Cuerpo** (un frame por plano) | Ambientación (qué lugar es, qué hay en cuadro además del sujeto, qué se ve de fondo) · luz (dura o suave, de dónde viene, natural o armada) · encuadre (tamaño de plano, ángulo, fija o en mano) · paleta (si hay **un acento** o es un revoltijo) · rótulos (dónde vive el texto, qué peso, si respeta safe zones) |
| **Ritmo** (de los cortes) | Duración media de plano — **1,2 s es vértigo; 4 s es calma** · ¿acelera o desacelera? · **cuántos setups distintos** (el dato que ⑤ Producción necesita para presupuestar) |
| **Cierre** | Cómo remata, si hay CTA en pantalla, si cierra más claro o más oscuro que como abre |

**El patrón se escribe como estructura, nunca como pieza:**
- ✅ *"Placa de texto sobre negro sin audio, corte al hablante antes del segundo 3"*
- ❌ *"Hacer un video con fondo negro como el de esta marca"*

---

## La transcripción

Es el único paso que **no siempre está disponible**, y hay que decirlo en vez de fingirlo.

| Fuente | Cuándo se usa | Confianza |
|---|---|---|
| **Transcripción del MCP** | Si el MCP de ads la devuelve con timestamps | 🟢 Alta — es la vía preferida |
| **Subtítulos quemados vía OCR** | La mayoría del video social lleva el mensaje como texto en pantalla | 🟡 Buena para el mensaje, no para el tono |
| **Captions de la plataforma** | Si el humano las pega | 🟢 Alta |
| **Transcripción local** (`faster-whisper`) | Solo si el modelo está disponible en el entorno | 🟡 Verificar antes de prometerla |

🛑 **Si no hay transcripción, se declara `⚠️ SIN TRANSCRIPCIÓN` y se lee lo que sí hay.** El texto en
pantalla suele traer el mensaje completo en video social: no tenerlo hablado baja la confianza sobre
el **tono**, no sobre el mensaje.

---

## Lo que no se pudo leer se declara

🛑 **Nunca se describe un plano que no se vio, ni un audio sin transcripción.**

| Falta | Cómo se escribe |
|---|---|
| El archivo | `⚠️ SIN ARCHIVO — solo metadata del MCP. No se leyó la imagen: sin ambientación, luz ni ritmo` |
| La transcripción | `⚠️ SIN TRANSCRIPCIÓN — se leyó el texto en pantalla. Confianza reducida sobre el tono, no sobre el mensaje` |
| El audio directamente | `⚠️ el video no tiene pista de audio` |
| Un plano ilegible | Se nombra el plano y por qué |

---

## Paso 5 — Emití la ficha

Completá `.claude/skills/cr-lectura-de-video/ficha-de-referencia.md` y guardala en el swipe file del
cliente. **Siempre con fecha de lectura:** la longevidad de un ad se mide al momento de la consulta.

---

## Paso 6 — Pasásela al filtro de señal

🛑 **Leer no es validar.** Una referencia leída entra a la bóveda **solo si pasa el filtro de señal**
de la skill `cr-swipe-file`: señal `⏱️` de rendimiento, conteo de fuentes independientes para
🟢/🟡/⚪, y una cubeta del reparto 70/20/10. Un video bien leído sin señal de rendimiento es
`⚪ ruido` — bien leído, pero ruido.

---

## Fronteras

- 🛑 **No genera media.** Leer una referencia no es producir una pieza — eso es ⑤ Producción y ⑥A Diseño.
- 🛑 **No decide si la referencia sirve.** Eso lo decide el filtro de señal, no la calidad de la lectura.
- 🛑 **No re-investiga la categoría.** Lo que la tabla 15×7 de ② Estrategia ya cubre se cita; acá se
  lee **el hueco**.
- 🛑 **Nunca se copia la ejecución.** De la lectura sale el patrón, no la pieza.

---

## QA

Bloque **Capa 1** — los checks relativos a lectura de video.

- [ ] **Toda referencia de video leída a fondo tiene su ficha de referencia**, con **fecha de lectura**
- [ ] **Ninguna referencia se leyó dos veces** — se buscó la ficha antes de correr el pipeline
- [ ] Se agotó la **vía A (MCP)** antes de pedir el archivo, cuando lo que se buscaba era el mensaje
- [ ] Lo que no se pudo leer está declarado: `⚠️ SIN ARCHIVO` / `⚠️ SIN TRANSCRIPCIÓN`
- [ ] 🛑 **Ningún plano descrito que no se vio, ningún audio descrito sin transcripción**
- [ ] La **fuente de la transcripción** está nombrada (MCP · captions · OCR · whisper local) con su confianza
- [ ] Las fichas con lectura de imagen traen **ritmo** (duración media de plano) y **setups distintos** — el segundo viaja a ⑤ Producción
- [ ] El **hook está leído aparte**: cuadro 1, texto desde el arranque, corte dentro del hook, si se entiende en mute
- [ ] El patrón está **descompuesto en los 6 elementos** (hook, ángulo, formato, estructura, prueba, CTA)
- [ ] Cada referencia tiene su señal de rendimiento en escala `⏱️` (`⏱️60-90+d` / `⏱️30-60d` / `⏱️outlier` / `⏱️estable`), **sin mezclarla** con 🟢/🟡/⚪, que marcan patrón por conteo de fuentes
- [ ] 🛑 **Leer no es validar:** ninguna referencia entró a la bóveda por gusto estético ni por estar bien leída
- [ ] Cada patrón tiene **exactamente una cubeta**: `70·probado` / `20·apuesta` / `10·propio`
- [ ] La hipótesis que sale de la ficha está **atada a un slot de este bloque**
- [ ] 🛑 **Ninguna referencia se llevó al brief como imagen a replicar** — solo el patrón
