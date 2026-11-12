# Video en Code OS: producir por prompting, organizar en tres vistas

**No hay editor.** Un agente produce los videos con las herramientas del servicio de video (ffmpeg detrás). Las personas solo ven y ajustan la información que el agente usa, organizada en tres vistas separadas:

| Vista | Para qué | Captura |
|---|---|---|
| **Style menu de la marca** | Qué transiciones, efectos, animaciones de texto y estilos eligió la marca del catálogo base. También sus tipografías, colores, música, sonidos, assets y notas de edición. | `code-os/video/docs/vista-style-menu.jpg` y `vista-style-menu-completa.jpg` |
| **Referencias** | Videos de otros, o propios, que se pueden replicar. Cada uno trae por qué funciona y su desglose. Desde ahí se puede «Imitar este». | `vista-referencias.jpg` |
| **Desglose por video** | Las escenas de un video y lo que se le aplica a cada una: estilo, transición, efectos, texto y lo que imita. Aquí se cambian la música y los estilos. | `vista-desglose.jpg` y `vista-desglose-imitando.jpg` |

Dentro de Code OS están en **Herramientas → Video** (`code-os-herramientas-video.jpg`). Ahí antes estaba el contenedor vacío «Editor de video».

```
guion + clips ──► agente (MCP video) ──► video (escenas) ──► render ffmpeg ──► MP4
                     ▲      ▲                   │
   style menu de la marca   referencias          └─► vista Desglose: cambiar música y estilos por escena
```

Retoque, el editor anterior, y su modo manual se quitaron. Git guarda su historial (PR #299).

## Modelo de datos (`code-os/video/`)

**Catálogo base** (`catalogo.json`, editable a mano):
- Contiene `transiciones`, `efectos` y `animaciones_texto`.
- Cada elemento es `{id, nombre, descripcion, receta, render}`.
- `receta` es lo que se escribe en la escena. `render: false` quiere decir que se puede elegir, pero ffmpeg todavía no lo hace. El agente lo deja como nota para el editor humano.
- **Es una lista inicial.** El CEO compartirá la lista real de transiciones. Agregar o quitar elementos no rompe nada: si una marca había elegido algo que ya no existe, simplemente desaparece de su guía.
- Los **estilos** (recetas completas: gancho, cuerpo y cierre) siguen en `estilos/*.json`. Hay 8.

**Marca** (`<datos>/marcas/<id>.json`, en `marcas.mjs`):

```jsonc
{ "id": "cafe-lumbre", "nombre": "Café Lumbre",
  "elegidos": { "transiciones": ["corte", "fundido-lento"], "efectos": ["zoom-lento", "punch-in"], "animaciones_texto": ["aparecer", "caja"], "estilos": ["caja-subtitulos"] },
  "tipografias": [{ "nombre": "DIN Condensed Bold", "ruta": "marcas/cafe-lumbre/fuentes/DIN.ttf", "uso": "titulos" }],
  "colores": [{ "nombre": "Crema", "hex": "#f3ead8", "uso": "texto" }, { "nombre": "Tostado", "hex": "#8a5a44", "uso": "caja" }],
  "musica": [{ "nombre": "Lumbre calma", "ruta": "marcas/cafe-lumbre/musica/calma.m4a", "nota": "producto" }],
  "sonidos": [], "assets": [{ "nombre": "Logo", "ruta": "marcas/cafe-lumbre/imagenes/logo.png", "tipo": "logo" }],
  "guia": "Ritmo tranquilo; siempre cerrar con «Pídelo hoy»." }
```

- **Carpeta de assets de cada marca:** `<raíz de medios>/marcas/<id>/{fuentes,musica,sonidos,imagenes}/`. Se crea al guardar la marca. Lo que se sube ahí aparece en la vista como «sin registrar» y se registra con un clic.
- **Guía de edición** (`guiaDeEdicion`): es lo que el agente lee antes de editar. Trae solo lo elegido, con su receta y si tiene render, más tipografías, colores, música, assets, valores predeterminados y reglas.
- **Al aplicar la marca a un video** (`aplicarMarca`), los textos sin tipografía toman la de títulos. Toman también el color de texto, y las cajas el color de caja. Si el video no tiene música, entra la primera de la marca con *ducking*: la música baja sola cuando hay voz.

**Video** (el «corte», `corte.mjs`):
- `{id, titulo, formato, version, marca, imita, musica: {ruta, volumen, ducking}, subtitulos, notas, escenas[]}`.
- Cada escena es `{id, clip, inicio, fin, texto, fuente, estilo, referencia, capas[], estilos[]}`.
- `estilo` es la receta aplicada a esa escena y `referencia` es la escena de la referencia que imita.
- Se guarda con `version`: quien guarda con una versión vieja recibe 409 y no pisa el cambio del otro.

**Referencia** (`referencias/*.json` más `<datos>/referencias/`):
- `{id, titulo, autor, fuente_url, plataforma, duracion, miniatura_url, por_que_funciona, estilo_sugerido, origen, breakdown?}`.
- Solo guarda metadatos y el enlace: no se guardan videos de terceros.
- Hay 5 referencias públicas verificadas.
- El radar las alimenta: `node code-os/video/referencias.mjs importar-radar <salida-del-radar.json> <datos>/referencias`.

**Desglose** (`desglose.mjs`):
- Detecta los cortes con ffmpeg, también los fundidos desde negro.
- Calcula el ritmo y marca cada escena como gancho, cuerpo o cierre.
- Saca plano, texto en pantalla y efecto con un modelo de visión barato por LiteLLM. Sin modelo, deja solo lo que mide ffmpeg.
- **«Imitar este»** convierte el desglose en receta (mismo orden y ritmo) y la aplica con el style menu de la marca del video.

## API (`servidor.mjs`, puerto 4310)

| Método y ruta | Qué hace |
|---|---|
| `GET /catalogo` | Catálogo base y estilos |
| `GET /marcas` · `POST /marcas` · `GET`/`PUT /marcas/:id` | Marcas. El `GET` trae también los archivos de su carpeta y su guía |
| `POST /marcas/:id/elegir {seccion, id, elegido}` | Marcar o desmarcar algo del catálogo |
| `GET /marcas/:id/guia` | Guía de edición para el agente |
| `GET /referencias` · `POST /referencias` · `POST /desglose {ruta, referencia?}` · `POST /referencias/:id/imitar {video}` | Referencias y desglose |
| `GET /videos[?marca=]` · `POST /videos` · `POST /videos/primer` · `GET`/`PUT /videos/:id` | Videos (`/cortes/…` funciona igual) |
| `POST /videos/:id/estilo {estilo}` | Receta a todas las escenas |
| `POST /videos/:id/escenas/:n {estilo\|transicion\|efecto, quitar?}` | Cambiar una escena. Lo que no tiene render se rechaza con un mensaje claro |
| `PUT /videos/:id/musica {musica}` | Cambiar, ajustar o quitar la música |
| `POST /videos/:id/render` · `POST /derive` · `POST /mascaras` · `GET /trabajos/:id` | Producción con ffmpeg (cola de uno en uno) |
| `GET /vistas/{estilo-marca,referencias,desglose}.html` | Las tres vistas |

## Cómo produce el agente (MCP `video`)

```sh
claude mcp add video -e VIDEO_URL=http://127.0.0.1:4310 -e VIDEO_TOKEN=… -- node code-os/video/mcp.mjs
```

1. `marca_guia {marca}`: lee el style menu y usa solo lo que trae.
2. `corte_primer {shotlist, clips, marca}`: arma el video desde el guion y los clips.
3. `estilos_aplicar` con un estilo de la marca, o `referencias_listar` → `referencia_imitar`. Si la referencia no tiene desglose, primero `video_desglose`.
4. Ajustes finos: `video_escena` (estilo, transición o efecto de una escena) y `video_musica`. Para «algo detrás de la persona», `video_mascara`.
5. `corte_render` → `video_trabajo` hasta que quede listo. Para otros formatos o tramos, `video_derive`.

Herramientas: `marcas_listar`, `marca_guia`, `estilos_listar`, `estilos_aplicar`, `referencias_listar`, `video_desglose`, `referencia_imitar`, `corte_primer`, `corte_leer`, `corte_guardar`, `video_escena`, `video_musica`, `corte_render`, `video_derive`, `video_trabajo`, `video_mascara`.

## Contrato con Code OS (Herramientas → Video)

- `code-os/ui/src/components/os/herramientas/Video.tsx` muestra las tres vistas en un iframe, con un selector de tres segmentos. La URL es `${VITE_VIDEO_URL}/vistas/<vista>.html?api=…&marca=<marca del hilo>&t=<VITE_VIDEO_TOKEN>`.
- Sin `VITE_VIDEO_URL` dice que falta conectarlo y no inventa datos.
- **Parámetros de las vistas:** `marca` (fija la marca), `video` (Referencias imita directo sobre ese video y Desglose lo abre), `api` (URL del servicio) y `t` (token).
- **Mensajes al contenedor** (`postMessage`):
  - `{fuente: 'code-os-video', tipo: 'prompt', texto}` cuando alguien pulsa «Copiar prompt». Hoy Code OS muestra un aviso; el siguiente paso es mandarlo al chat con `@produccion`.
  - `{fuente: 'code-os-video', tipo: 'cambio', marca? | video?}` cuando se guardó algo.
- Las marcas del hilo y las del servicio de video se cruzan por **id**: si el hilo usa la marca `lumbre`, su style menu es `marcas/lumbre.json`.

## Pruebas y medidas

- `node --test code-os/video/test/*.test.mjs`: **42 de 42** en la Mac. Cubren catálogo, marcas, guía, aplicar marca, cambiar escenas y música, imitar, desglose, render y las vistas.
- `code-os/ui`: 88 de 88 en vitest y `tsc -b` limpio.
- **Probado en el navegador:** elegir y desmarcar del style menu, «Imitar este» desde Referencias, y en Desglose cambiar transición, agregar un efecto y cambiar la música. Cada cambio queda en el video con versión nueva.
- **En el VPS se midió en la primera versión, que no cambió:** derivada 9:16 de 30 s en 23 s, video de 30 s y 6 escenas en 66 s, máscara de persona de 30 s en 75 s.
- El render de la Mac salta los textos: su ffmpeg no trae libass.

## Para dejarlo en producción

1. **ffmpeg con libass en el VPS.** Hoy no hay ffmpeg: `sudo apt-get install -y ffmpeg fontconfig fonts-dejavu-core`.
2. Para recortar a la persona: un venv con `mediapipe==0.10.14` y `opencv-contrib-python-headless`, más el modelo `selfie_segmenter.tflite`.
3. Servicio systemd para `servidor.mjs`, la ruta `/video/` en el proxy y `VITE_VIDEO_URL=/video` en la interfaz.
4. Registrar el MCP `video` para el agente de ④ Producción.
5. Llenar el catálogo con la lista real de transiciones del CEO (`catalogo.json`) y crear el style menu de cada marca.
