# Video en Code OS: primer corte por agente, Retoque y derivadas

El agente arma el primer corte y las derivadas. El editor humano solo corrige en **Retoque**, un
editor chico y visual que solo ve el rol de editor. Todo sale del mismo JSON de escenas, que el
agente puede escribir y leer.

```
shot list (⑤ Producción, Pre) + clips grabados
        │  corte_primer (MCP)
        ▼
corte.json (escenas[]) ──► CATÁLOGO DE ESTILOS: elegir estilo → «Copiar prompt» o «Aplicar» (estilos_aplicar)
        │                         │
        │                         ▼
        │                 cada escena recibe la receta del estilo (gancho · cuerpo · cierre)
        ▼                         ▼
Retoque · TABLERO de escenas (revisión por escena) → ESCENA (correcciones chicas) → guarda con versión
        ▼
corte_render / video_derive (MCP) ──► cola ──► ffmpeg (CPU) ──► MP4 9:16 · 1:1 · 16:9
```

**Flujo para el editor:** 1) elige un estilo en el catálogo, 2) copia el prompt para el agente o pulsa «Aplicar», 3) el agente edita el video con ese estilo y el editor revisa escena por escena en el tablero.

Código: `code-os/video/` (Node 22, sin dependencias de npm). Capturas: `code-os/video/docs/`.

## Por qué un editor propio y no FilmCraft, Twick u otro

| Opción | Qué es | Por qué no |
|---|---|---|
| FilmCraft | NLE completo tipo Premiere (Rust/WASM, 718 comandos, MCP) | Es lo contrario a «sencillo». WASM de 49 MB (15 MB con gzip). En el navegador no exporta H.264 (v0.19.0). Descartado por el CEO |
| Twick (`@twick/studio`) | Kit de editor en React | Licencia Sustainable Use: prohíbe ofrecerlo como servicio alojado sin contrato comercial. Unos 54 MB en paquetes. Sin cambios desde junio de 2026 |
| omniclip | Editor web completo (MIT) | Es una app entera (Lit, pixi, ffmpeg.wasm, service worker), no un componente. Interfaz de NLE |
| Remotion Player | Reproductor de composiciones Remotion | Para empresas de más de 3 personas pide licencia de empresa. Obliga a escribir la escena en React y no resuelve la interfaz |
| **Retoque (propio)** | Un archivo HTML: catálogo de estilos + tablero de escenas + vista de escena | **Elegido.** Pesa 59 KB (18 KB con gzip) y no tiene dependencias. La licencia es nuestra. La vista previa imita al render de ffmpeg |

## El proyecto: `corte.json`

```jsonc
{
  "id": "c…", "titulo": "Reel · Sal de la rutina", "formato": "9:16", "version": 3,
  "musica": { "ruta": "musica/calma.m4a", "volumen": 0.25, "inicio": 0 },
  "subtitulos": null,
  "origen": { "agente": "production", "shotlist": "…", "faltantes": [{ "toma": "E06", "motivo": "…" }] },
  "escenas": [{
    "id": "e-E03", "clip": "crudo/E03.mp4", "inicio": 1, "fin": 4,
    "nota": "E03 · Persona a cámara; el sol va detrás de la cabeza",
    "texto": "Hecho por gente real", "fuente": "DIN Condensed Bold",     // atajo de la capa «principal»
    "capas": [                                                           // encima del video, de abajo hacia arriba
      { "id": "sol", "tipo": "imagen", "ruta": "imagenes/sol.png", "x": 0.5, "y": 0.36, "escala": 0.62, "visible": true },
      { "id": "principal", "tipo": "texto", "texto": "Hecho por gente real", "fuente": "DIN Condensed Bold",
        "x": 0.5, "y": 0.8, "tam": 0.055, "color": "#f3ead8", "visible": true }
    ],
    "estilos": [                                                         // la receta de la escena
      { "tipo": "detras-de-persona", "capa": "sol", "mascara": "mascaras/E03.mp4" },
      { "tipo": "zoom", "desde": 1.05, "hasta": 1.15, "x": 0.5, "y": 0.35 },
      { "tipo": "color", "preset": "calido" },                           // calido · frio · bn · contraste
      { "tipo": "transicion", "entrada": "fundido", "duracion": 0.4 },   // corte · fundido
      { "tipo": "animacion-texto", "capa": "principal", "animacion": "aparecer" }  // aparecer · subir
    ]
  }]
}
```

- **Posiciones y tamaños relativos al cuadro** (0 a 1): sirven igual en 9:16, 1:1 y 16:9. `x, y` es el centro.
- **`texto` y `fuente` son un atajo** de la capa `principal`. Si vienen, mandan: el agente cambia el texto sin tocar las capas.
- **La música es de todo el video.** La tarjeta de cada escena la muestra.
- **`version`** sube en cada guardado. Quien guarda con una versión vieja recibe `409` y no pisa la corrección del otro.
- Las rutas son relativas a la carpeta de medios (`VIDEO_RAIZ`). Nada fuera de ella entra, ni con `..` ni con enlaces simbólicos.
- Validación y mensajes de error en `code-os/video/corte.mjs` (`normalizarCorte`).

## Catálogo de estilos (`code-os/video/estilos/*.json`)

La entrada del editor (`docs/estilos-catalogo.jpg`, `docs/estilos-loops.gif`, `docs/estilos-cortos.jpg`). Cada estilo se muestra como una tarjeta vertical con:
- una vista previa en loop: silueta sintética + las capas y animaciones de la receta, repasando gancho → cuerpo → cierre;
- nombre, una línea de descripción, categoría, formato y los recursos que pide;
- ♥ para favoritos (se guardan en el navegador de cada persona);
- **Copiar prompt**: copia el pedido listo para el agente, con los recursos y el id del corte;
- **Aplicar**: pide los recursos, si hacen falta, y confirma antes de reemplazar la receta (`docs/estilos-aplicar.jpg`). Se puede deshacer.

**Pestañas:** Todos · Favoritos · Videos cortos (talking head, Reels, TikTok, Shorts) · Videos largos · Tarjetas y movimientos · CTAs · Posts y anuncios.

Si el corte todavía no tiene estilo, Retoque abre en el catálogo. Si ya lo tiene, abre en el tablero.

**Conjunto inicial (8 estilos):**

| id | Nombre | Categoría | Formato | Pide |
|---|---|---|---|---|
| `caja-subtitulos` | Talking head con caja | Videos cortos | 9:16 | — |
| `reels-sobre-la-cabeza` | Reels sobre la cabeza | Videos cortos | 9:16 | 3 portadas de reels |
| `detras-de-la-cabeza` | Título detrás de la cabeza | Videos cortos | 9:16 | máscara (la genera `video_mascara`) |
| `calido-y-lento` | Cálido y lento | Videos cortos | 9:16 | — |
| `entrevista-larga` | Entrevista con rótulo | Videos largos | 16:9 | — |
| `tarjetas-que-flotan` | Tarjetas que flotan | Tarjetas y movimientos | 9:16 | 2 imágenes |
| `cta-final` | CTA final | CTAs | 9:16 | — |
| `anuncio-corto` | Anuncio corto | Posts y anuncios | 1:1 | — |

**Formato de una receta:**

```jsonc
{
  "id": "reels-sobre-la-cabeza",                // minúsculas y guiones; es el nombre del archivo
  "nombre": "Reels sobre la cabeza",
  "categoria": "cortos",                        // cortos · largos · tarjetas · ctas · posts
  "descripcion": "Señalas hacia arriba y tres de tus mejores reels suben sobre tu cabeza y se abren en abanico.",
  "prompt": "Usa el estilo «Reels sobre la cabeza» (reels-sobre-la-cabeza) para editar este video. …",
  "formato": "9:16",                            // opcional: al aplicarse fija el formato del corte
  "requiere": [{ "recurso": "reels", "cantidad": 3, "descripcion": "portadas verticales de tus 3 mejores reels" }],
  "ejemplo": { "textos": ["Estos tres cambiaron todo", "…"] },   // textos de la vista previa del catálogo
  "escenas_plantilla": [
    { "rol": "gancho", "capas": [
        { "id": "reel1", "tipo": "imagen", "ruta": "{reels.0}", "x": 0.3, "y": 0.2, "escala": 0.22 },
        { "id": "principal", "tipo": "texto", "texto": "{texto}", "y": 0.8, "tam": 0.05 } ],
      "estilos": [ { "tipo": "animacion-capa", "capa": "reel1", "animacion": "abanico", "angulo": -14, "retraso": 0.35 },
                   { "tipo": "animacion-texto", "capa": "principal", "animacion": "subir" } ] },
    { "rol": "cuerpo", "capas": [ … ], "estilos": [ … ] },        // puede haber varios: se alternan
    { "rol": "cierre", "capas": [ … ], "estilos": [ … ] }
  ]
}
```

- **Qué plantilla le toca a cada escena:** la primera recibe `gancho`, la última `cierre` y las demás los `cuerpo`, alternándose (así sale el acercamiento alterno).
- **Comodines:** `"{texto}"` es el texto de la escena (el del guion). `"{reels.0}"` es `recursos.reels[0]`. Si una escena no tiene texto, su capa de texto y su animación se quitan.
- **Al aplicar:** cada escena conserva su clip, su tramo, su nota, su texto y la tipografía del guion. Las capas y los estilos se reemplazan por los de la plantilla. Los pendientes se devuelven, por ejemplo las máscaras de «detrás de la persona».
- **Agregar un estilo:** se pone otro `.json` en `estilos/`. El servicio lo valida y lo carga en el siguiente pedido, sin reiniciar. Una receta inválida da error con su nombre.
- **Agente:** `estilos_listar` (opcional `categoria`) y `estilos_aplicar {corte, estilo, recursos?, version?}`. API: `GET /estilos`, `GET /estilos/:id`, `POST /cortes/:id/estilo`.

**Nuevos ingredientes que usan los estilos** (también disponibles en el tablero):
- Texto con **caja** (`capa.caja: "#hex"`): subtítulo sobre fondo sólido. En el render es BorderStyle 3 de libass.
- **`animacion-capa`** para imágenes: `aparecer`, `subir`, `flotar` o `abanico` (gira hasta `angulo`), con `retraso`. ffmpeg y la vista previa usan la misma fórmula (`movimientoCapa` en `ffmpeg.mjs` y `animarNodos` en el editor).
- Los textos largos se cortan en líneas a lo ancho del 86 % del cuadro, igual en el editor y en el render.

## Retoque (el editor del rol de editor)

**Tablero** (la vista de entrada, `docs/tablero.jpg`, `docs/tablero-loops.gif`):
- Una tarjeta por escena con su **loop** (el tramo inicio–fin repitiéndose, con zoom, color, fundido, animación de texto y la persona recortada).
- Debajo de cada loop va **la receta en palabras**: «Zoom acercando 105→115 %», «sol.png detrás de la persona», «Texto «…» · DIN Condensed Bold», «Música: calma.m4a».
- Clic en un estilo para ajustarlo ahí mismo (`docs/tablero-ajustes.jpg`). ✕ lo quita. «+ Agregar estilo» suma otro.
- **Arrastrar tarjetas** cambia el orden (`docs/tablero-reordenado.jpg`). Arriba se elige la música y su volumen, y se avisa qué tomas faltan.

**Escena** (edición fina, `docs/escena.jpg`):
- Arrastrar un texto o una imagen en el video lo mueve, con imán al centro. El punto de la esquina lo agranda o lo achica. Doble clic en un texto para escribir.
- **Capas:** subir, bajar, ocultar, agregar texto o imagen. Si cambias el orden, el texto puede quedar detrás de la persona (`docs/escena-corregida.jpg`).
- Texto: contenido, **tipografía** (las de `<raíz>/fuentes`, cargadas con el mismo nombre que usa el render), tamaño y color.
- Recorte: dónde empieza y dónde termina. Alt + clic elige hacia dónde se acerca el zoom.
- Deshacer (⌘Z), guardar con versión y exportar, con el progreso de la cola.

Se abre en `/editor/?corte=<id>`. Opcionales: `&t=<token>`, `&vista=escena&escena=<n>`.

## Servicio (`servidor.mjs`) y cola (`cola.mjs`)

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/derive` | `{videoId\|ruta, formato, inicio, fin, subtitulos?, musica?}` → 202 `{trabajo}` |
| GET | `/trabajos`, `/trabajos/:id`, `/trabajos/:id/archivo` | Estado (`pendiente · procesando · listo · error`), progreso de 0 a 1 y el MP4 (admite Range) |
| POST | `/cortes/primer` | `{shotlist, clips}` → primer corte + `faltantes` |
| POST · GET · PUT | `/cortes`, `/cortes/:id` | Guardar o leer un corte. `PUT {corte, version}` |
| POST | `/cortes/:id/render` | Encola el render del corte |
| POST | `/mascaras` | `{clip}` → recorte de la persona (`resultado.mascara`) |
| GET | `/medios?ruta=`, `/medios/musica`, `/medios/imagenes`, `/medios/fuentes` | Lo que usa el editor |
| GET | `/editor/` | Retoque |

- **Cola de uno en uno.** En el VPS, un ffmpeg ya usa los 4 núcleos. El estado se guarda en `datos/trabajos.json`; lo que quedó a medias vuelve a la cola al reiniciar.
- **Variables:** `VIDEO_RAIZ` (carpeta de medios: `crudo/ musica/ imagenes/ fuentes/ mascaras/`), `VIDEO_DATOS`, `VIDEO_PUERTO` (4310, solo `127.0.0.1`), `VIDEO_TOKEN`, `VIDEO_FFMPEG`, `VIDEO_FFPROBE`, `VIDEO_PYTHON`, `VIDEO_MODELO_MASCARA`.
- **Render de una escena:** cubrir el cuadro → zoom (`zoompan`) → color → capas en orden (imágenes con `overlay`, textos como subtítulo ASS con libass) → fundido. Después se unen las escenas sin recodificar y se mezcla la música.
- Los textos usan **libass** y no `drawtext`: los ffmpeg estáticos y el de Homebrew suelen venir sin `drawtext`. El de Homebrew tampoco trae libass, así que en la Mac la prueba de punta a punta se salta el texto. En el VPS corre completa.

## Cómo lo usa un agente (MCP)

```sh
claude mcp add video -e VIDEO_URL=http://127.0.0.1:4310 -e VIDEO_TOKEN=… -- node code-os/video/mcp.mjs
```

Herramientas: `corte_primer`, `corte_leer`, `corte_guardar`, `corte_render`, `estilos_listar`, `estilos_aplicar`, `video_derive`, `video_trabajo`, `video_mascara`.

**Production Post con estilos:** armar el primer corte (`corte_primer`) → `estilos_listar` → `estilos_aplicar` con el estilo que eligió el editor (o el que pide su prompt) → resolver los pendientes (`video_mascara`) → `corte_render`. El editor revisa en el tablero.

**Primer corte por agente:**
1. ⑤ Producción (Pre) deja el shot list con cada toma: `{id, duracion, texto, fuente?, capas?, estilos?, nota}`. Los `estilos` son la receta que pide el guion.
2. Con los clips grabados (`{ruta, toma?, duracion, inicio?}`), el agente llama a `corte_primer`. Empata cada toma con su clip (por `toma` o por el id en el nombre del archivo), recorta a la duración, pone el texto del guion y la receta. Si la toma no trae receta, pone un zoom lento. Lo que falta va en `faltantes`.
3. Si una escena lleva «detrás de la persona», el agente llama a `video_mascara` con el clip y pone `resultado.mascara` en el estilo.
4. `corte_render` genera el MP4 del primer corte. El editor abre el tablero, corrige y exporta.
5. Las derivadas (otro formato, otro tramo, con subtítulos o música) salen con `video_derive`, sin pasar por el editor.

## «Algo detrás de la persona»: qué se puede hacer y dónde

| Modelo | Licencia | En el VPS (CPU, 4 núcleos, 1080×1920) | Nota |
|---|---|---|---|
| **MediaPipe Selfie Segmenter** (`mascara.py`) | Apache-2.0 | **12 cuadros/s**: 30 s de clip en 75 s (medido, con suavizado y codificación) | Elegido. Bordes suaves, pelo regular. Usa `mediapipe==0.10.14`: la 1.x pide `libEGL`, que el VPS no tiene |
| Robust Video Matting (MobileNetV3, ONNX) | **GPL-3.0** | **4.2 cuadros/s**: 30 s en unos 3.5 min (medido) | Mejor borde y pelo. GPL sirve para uso interno en el servidor; no se puede distribuir dentro de un producto |
| rembg (U²-Net, BiRefNet) | MIT | No medido. Es de imagen fija: cuadro por cuadro parpadea y es lento | No sirve para video |

- **Dónde:** la máscara se genera **una vez en el VPS** (trabajo `mascara` en la cola). El navegador **no corre modelos**: Retoque compone la persona con el video de la máscara en un canvas a resolución reducida. Así la vista previa es liviana y coincide con el render.
- **Calidad sin verificar con gente real:** la velocidad se midió con video sintético porque no había clips de personas sin datos de clientes. Las capturas usan una silueta sintética. Antes de prometerlo hay que probar con 2 o 3 tomas reales.
- **Si la calidad no alcanza:** se ofrecen solo poses de cámara fija y medio cuerpo, o la alternativa más simple, que es poner la animación arriba de la cabeza (sin recorte), como una capa más.

## Medidas

| Qué | Dónde | Tiempo |
|---|---|---|
| Derivada 9:16 de 30 s desde 16:9, con música | VPS, CPU | **23 s** |
| Corte 9:16 de 30 s, 6 escenas (zoom, color, texto animado, fundido, imagen detrás de la persona, música) | VPS, CPU | **66 s** |
| Corte de demo de 13 s con 5 escenas y 3 tipografías | VPS, CPU | **26 s** |
| Máscara MediaPipe de 30 s, 1080×1920 | VPS, CPU | **75 s** |
| Pruebas (`node --test test/*.test.mjs`) | Mac | 28 de 28. El render de textos se salta (ffmpeg sin libass). La versión anterior pasó 19 de 19 en el VPS; esta, con catálogo, no se corrió ahí |
| 4 estilos aplicados al corte de demo y renderizados, sin textos (`docs/render-estilos-imagenes.jpg`) | Mac | 2 a 3 s cada uno |
| Peso de Retoque con catálogo | Navegador | 59 KB (18 KB con gzip), sin dependencias |

## Para dejarlo en producción

1. **ffmpeg en el VPS:** hoy no hay ffmpeg instalado. Hace falta uno con libass (el `ffmpeg` de Ubuntu 24.04 lo trae, o el estático).
2. **Máscaras:** Python 3.12 en un venv con `mediapipe==0.10.14` y `opencv-contrib-python-headless`, más el modelo `selfie_segmenter.tflite`.
3. Servicio systemd para `servidor.mjs` y una ruta del proxy (`/video/…` → `127.0.0.1:4310`) con `VIDEO_TOKEN`.
4. **`code-os/ui`:** una pestaña «Editor de video» en el panel, cargada solo si la persona tiene el rol de editor. Es un iframe a `/video/editor/?corte=…` y sigue el patrón de carga diferida de `PanelLateral`.
5. Registrar el MCP `video` en la sesión de los agentes de Producción.
6. Tipografías de marca de cada cliente en `<raíz>/fuentes`. El editor y el render las toman por su nombre.

**Esfuerzo estimado:** 2.5 a 3 días (UI y rol 1–1.5 · VPS y proxy 0.5–1 · prueba con clips reales de personas 0.5).

## Límites conocidos

- **Sin verificar en un render real con libass:** la caja de texto y el corte de líneas de los textos largos. Hay pruebas unitarias del .ass que se genera, pero la Mac no tiene libass y no se volvió a montar ffmpeg en el VPS. Las animaciones de imagen (abanico, flotar, subir) sí se renderizaron.
- La vista previa del catálogo usa una silueta sintética. Con video real, la posición de la cabeza cambia y el editor ajusta las capas en la vista Escena.
- La vista previa imita el render, pero no es idéntica: el tamaño de texto puede variar entre un 10 y un 15 % según la tipografía, y el zoom de `zoompan` tiene un leve escalonado.
- Las escenas no se superponen. El fundido es de entrada (desde negro), no un cruce entre dos escenas.
- La máscara se genera para el clip entero, aunque la escena use un tramo.
