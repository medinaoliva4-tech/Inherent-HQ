---
name: cr-lectura-de-video
description: >
  Lee un video de referencia de verdad — la capacidad de "ver" videos del agente de Creatividad.
  Extrae los cortes y la duración media de plano (el ritmo), frames densos en la zona de hook y uno
  por plano, una hoja de contacto con timestamps, el texto en pantalla por plano (OCR), la paleta
  dominante y los datos técnicos; y lo deja todo en una ficha de referencia reutilizable. Úsala
  cuando pidan "mirá este video", "analizá esta referencia", "qué está haciendo este anuncio",
  "leé la ambientación de esto", "qué ritmo tiene", "de dónde sale el hook", o cuando llegue un
  archivo de video o un link de referencia en la Capa 1. Es parte de la Capa 1, no la reemplaza:
  leer no es validar.
---

# Lectura de video — la capacidad de "ver"

Leé `agents/creative/toolkit/09-lectura-de-video.md` **completo** antes de correr nada.
Plantilla de salida: `agents/creative/templates/ficha-de-referencia.md`.

## Lo primero: un modelo no mira videos, mira imágenes

Toda lectura de video es una **extracción**. Tu trabajo no es "ver el video": es decidir **qué
frames hacen falta** para poder leer el patrón, y no gastar contexto en el resto.

## Paso 0 — ¿Ya está leída?

Buscá la ficha en el swipe file del cliente antes de correr el pipeline. Una referencia leída **no se
vuelve a leer**: la ficha es la caché del departamento.

## Paso 1 — Elegí la vía

| Lo que necesitás leer | Vía | Qué hacer |
|---|---|---|
| El **mensaje**: gancho, promesa, oferta, estructura de guion | **A · MCP** | Pedir el ad al MCP de ads. Si trae transcripción con timestamps, alcanza |
| La **imagen**: ambientación, luz, encuadre, paleta, ritmo | **B · archivo** | Correr el pipeline sobre el archivo de video |

🛑 **Vía A primero.** Si lo que se busca es el patrón de mensaje, pedir el archivo es trabajo de más.

⚠️ **No podés bajar el video de TikTok, Instagram ni Meta.** Esos dominios están fuera de alcance de
red. Si hace falta leer la imagen y la referencia vive ahí, **pedí el archivo en una línea** y seguí
con el resto del bloque. No es un bloqueo del ciclo.

## Paso 2 — Corré el pipeline (Vía B)

```bash
python3 agents/creative/toolkit/leer-video.py <ruta-al-video> --hook 3 --scene 0.12
```

Deja en `<video>_lectura/`: `hoja-de-contacto.jpg`, los frames del hook y por plano, y
`lectura.json` con ritmo, texto en pantalla y paleta.

**Parámetros que se tocan y cuándo:**
- `--hook` — subilo a 5 si la pieza es de formato largo; el default de 3 s es para social.
- `--scene` — `0.12` por defecto. Si detecta demasiados cortes falsos (mucho movimiento de cámara),
  subilo a `0.20`. Si se pierde cortes entre planos de luminancia parecida, bajalo a `0.08`.

## Paso 3 — Leé, en este orden

1. **La hoja de contacto.** El arco completo de un vistazo. Esto responde el 80 % de las preguntas.
2. **El `lectura.json`.** Ritmo, texto por plano, paleta. Es texto: barato.
3. **Frames sueltos, solo si hace falta un detalle** — un encuadre puntual, una textura, cómo está
   resuelto un rótulo.

🛑 **No abras los 5 frames si la hoja ya te lo dijo.** Cada imagen cuesta.

## Paso 4 — Convertí la lectura en patrón

Por cada zona, lo que hay que sacar:

| Zona | Preguntas |
|---|---|
| **Hook (0-3 s)** | ¿Qué se ve en el cuadro 1? ¿Hay texto desde el arranque? ¿Hay corte dentro del hook? ¿Se entiende sin audio? |
| **Cuerpo** | Ambientación, luz, encuadre, paleta, dónde vive el texto |
| **Ritmo** | Duración media de plano, si acelera o desacelera, cuántos setups distintos |
| **Cierre** | Cómo remata, si hay CTA en pantalla, si cierra más claro o más oscuro que como abre |

**El patrón se escribe como estructura, nunca como pieza:**
- ✅ *"Placa de texto sobre negro sin audio, corte al hablante antes del segundo 3"*
- ❌ *"Hacer un video con fondo negro como el de esta marca"*

## Paso 5 — Emití la ficha

Completá `templates/ficha-de-referencia.md` y guardala en el swipe file del cliente. Incluye
siempre la fecha de lectura: la longevidad de un ad se mide al momento de la consulta.

## Paso 6 — Pasásela al filtro de señal

🛑 **Leer no es validar.** Una referencia leída entra a la bóveda **solo si pasa el filtro de
`playbooks/SWIPE-FILE.md`**: señal `⏱️` de rendimiento, conteo de fuentes para 🟢/🟡/⚪, y cubeta
70/20/10. Un video bien leído sin señal de rendimiento es `⚪ ruido` — bien leído, pero ruido.

## Lo que se declara cuando falta

| Falta | Cómo se escribe |
|---|---|
| El archivo | `⚠️ SIN ARCHIVO — solo metadata del MCP. No se leyó la imagen: sin ambientación, luz ni ritmo` |
| La transcripción | `⚠️ SIN TRANSCRIPCIÓN — se leyó el texto en pantalla. Confianza reducida sobre el tono, no sobre el mensaje` |
| El audio directamente | `⚠️ el video no tiene pista de audio` |
| Un plano ilegible | Se nombra el plano y por qué. **Nunca se describe un plano que no se vio** |

## Fronteras

- 🛑 **No genera media.** Leer una referencia no es producir una pieza — eso es ⑤ Producción y ⑥ Diseño.
- 🛑 **No decide si la referencia sirve.** Eso lo decide el filtro de señal, no la calidad de la lectura.
- 🛑 **No re-investiga la categoría.** El swipe file arranca de la tabla 15×7 de ② Estrategia; esta
  skill lee **el hueco**.

## QA

`agents/creative/qa/QA-GATES.md` → bloque **Capa 1**, con los checks de lectura de video.
