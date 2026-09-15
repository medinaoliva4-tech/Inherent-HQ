# 09 · Lectura de video
`Capa 1 · alimenta: referencia_visual, hook, escenas, encuadres, duraciones, estetica_mood`

**Qué decide.** Cómo el agente **lee de verdad** un video de referencia: no solo lo que dice, sino
cómo está puesto en cuadro, con qué luz, en qué ambiente y a qué ritmo.

> 🛑 **Un modelo no "mira" un video: mira imágenes.** Cualquier lectura de video es en realidad una
> **extracción**: frames, texto en pantalla, audio, tiempos. La pregunta no es *si* se puede, es
> **cuántos frames hacen falta** — y ahí se gana o se pierde la eficiencia.

---

## El problema que resuelve

La tentación es mandar el video entero, o muestrear un frame por segundo. Las dos son malas:

| Enfoque | Por qué falla |
|---|---|
| «Ver el video completo» | No existe: hay que convertirlo a frames igual. Solo cambia quién decide cuántos |
| 1 frame por segundo | Un video de 30 s da 30 imágenes, y la mitad son el mismo plano. Caro y redundante |
| 3 frames al azar | Barato y ciego: se pierde el hook, que es exactamente lo que hay que leer |

**El enfoque correcto:** muestrear **por estructura, no por tiempo**. Denso donde la pieza se decide
(los primeros segundos), uno por plano en el resto, y descartar lo repetido.

---

## Las dos vías, y cuándo cada una

### Vía A · Por MCP — sin tocar un archivo
Para **referencias de pauta**. El MCP devuelve la metadata del ad: días corriendo, copy, CTA,
landing, y —si el MCP lo trae— **transcripción con timestamps**. Con eso alcanza para leer gancho,
promesa, oferta y estructura de guion.

**Cuándo alcanza:** cuando lo que se busca es el **patrón de mensaje**. Es la vía barata, y cubre la
mayor parte de la cubeta `70·probado`.

**Cuándo NO alcanza:** cuando hay que leer la **imagen** — ambientación, luz, encuadre, paleta,
ritmo de corte. Eso ningún MCP lo devuelve masticado.

### Vía B · Archivo local — el pipeline
Para cuando hay que leer la imagen. Requiere **el archivo de video**: lo sube un humano, sale de
Drive, o es material propio del cliente.

```bash
python3 agents/creative/toolkit/leer-video.py <video> [--hook 3] [--scene 0.12]
```

> ⚠️ **El agente no puede bajar el video de TikTok, Instagram o Meta por su cuenta.** Esos dominios
> están fuera de alcance de red. Si la referencia vive ahí y hace falta leer la imagen, **se pide el
> archivo**. Es una línea en el output, no un bloqueo del bloque entero.

---

## Qué hace el pipeline, paso por paso

| # | Paso | Herramienta | Qué produce |
|---|---|---|---|
| 1 | **Datos técnicos** | `ffprobe` | Duración, relación de aspecto, fps, si tiene audio |
| 2 | **Detección de cortes** | `ffmpeg` filtro `scene` | Los segundos donde cambia el plano → **el ritmo** |
| 3 | **Frames del hook** | `ffmpeg -ss` | Uno por segundo dentro de la zona de hook (0-3 s por defecto) |
| 4 | **Un frame por plano** | `ffmpeg -ss` | El punto medio de cada plano detectado |
| 5 | **Descarte de repetidos** | firma perceptual | Si dos frames son el mismo cuadro, queda uno |
| 6 | **Hoja de contacto** | `montage` | **Un solo JPG** con el arco completo y el timestamp quemado en cada cuadro |
| 7 | **Texto en pantalla** | `tesseract` | Lo que dice sin voz, plano por plano. Dos pasadas: directa y con contraste forzado |
| 8 | **Paleta dominante** | Pillow | Los colores de cada plano → alimenta `estetica_mood` |

**Lo que se lee primero es la hoja de contacto.** Los frames individuales se abren solo si hace falta
mirar un detalle: un encuadre puntual, una textura, cómo está resuelto un rótulo.

**Orden de magnitud real** (medido sobre un video de 18 s con 5 planos): 36 frames crudos a 2 fps →
**5 tiles** en la hoja de contacto, 3 repetidos descartados, ~150 KB de paquete total. Una imagen en
lugar de treinta y seis.

---

## La transcripción

Es el único paso que **no siempre está disponible**, y hay que decirlo en vez de fingirlo.

| Fuente | Cuándo se usa | Confianza |
|---|---|---|
| **Transcripción del MCP** | Si el MCP de ads la devuelve con timestamps | 🟢 Alta — es la vía preferida |
| **Subtítulos quemados vía OCR** | La mayoría del video social lleva el mensaje como texto en pantalla | 🟡 Buena para el mensaje, no para el tono |
| **Captions de la plataforma** | Si el humano las pega | 🟢 Alta |
| **Transcripción local** (`faster-whisper`) | Solo si el modelo está disponible en el entorno | 🟡 Verificar antes de prometerla |

> 🛑 **Si no hay transcripción, se declara `⚠️ SIN TRANSCRIPCIÓN` y se lee lo que sí hay.** El texto en
> pantalla suele traer el mensaje completo en video social: no tenerlo hablado baja la confianza sobre
> el **tono**, no sobre el mensaje.

---

## Qué se lee en cada zona

### La zona de hook — los primeros 3 segundos
Es donde la pieza se muere, así que es donde se muestrea denso.

- **Frame 1:** ¿qué se ve en el primer cuadro? ¿Cara, producto, texto, movimiento?
- **¿Hay texto en pantalla desde el cuadro 1?** Cambia todo: significa que el hook se lee, no se escucha
- **¿Hay un corte dentro del hook?** El pipeline lo marca. Un corte antes del segundo 3 es una decisión de ritmo deliberada
- **¿El audio es necesario para entenderlo?** Si sí, la pieza pierde a quien mira sin sonido

### El cuerpo — un frame por plano
- **Ambientación:** qué lugar es, qué hay en cuadro además del sujeto, qué se ve de fondo
- **Luz:** dura o suave, de dónde viene, natural o armada
- **Encuadre:** tamaño de plano, ángulo, si la cámara está fija o en mano
- **Paleta:** la salida del pipeline da los dominantes; lo que importa es si hay **un acento** o es un revoltijo
- **Rótulos:** dónde vive el texto, qué peso tiene, si respeta safe zones

### El ritmo — de los cortes
- **Duración media de plano:** 1,2 s es vértigo; 4 s es calma. Define la energía de la pieza
- **¿Acelera o desacelera?** Planos cortos al principio y largos al final es una estructura; al revés es otra
- **¿Cuántos setups distintos?** Es el dato que ⑤ Producción va a necesitar para presupuestar

---

## Reglas duras

1. **Se lee por estructura, no por tiempo.** Denso en el hook, uno por plano en el resto.
2. **La hoja de contacto primero.** Los frames sueltos solo para un detalle concreto.
3. **El umbral de corte es `0.12` por defecto.** Con `0.25` se pierden los cortes entre planos de
   luminancia parecida — probado: en un video con 4 cortes, `0.25` detectó 3.
4. **Lo que no se pudo leer se declara.** `⚠️ SIN TRANSCRIPCIÓN`, `⚠️ SIN ARCHIVO — solo metadata del
   MCP`. Nunca se describe un plano que no se vio.
5. **Una referencia leída no se vuelve a leer.** El resultado se guarda como
   `ficha-de-referencia` en el swipe file del cliente. Es la caché del departamento.
6. **Leer no es guardar.** Una referencia leída entra a la bóveda **solo si pasa el filtro de señal**
   de `playbooks/SWIPE-FILE.md`. Leer un video lindo sin señal de rendimiento es perder el tiempo
   dos veces.
7. **Nunca se copia la ejecución.** De la lectura sale el **patrón**: *"texto en pantalla desde el
   cuadro 1, corte a los 2 s, plano medio fijo"*. No *"replicar esta pieza"*.

---

## Ejemplo trabajado

Referencia de 18 s, formato vertical, 5 planos. Salida del pipeline:

```
608x1080 (9:16) · 18.0s · 25fps · audio: sí
ritmo: 5 planos · promedio 3.6s · cortes en [2.0, 6.0, 10.0, 15.0]
hook (3s): corte dentro del hook: sí · texto: "EL PRIMER SEGUNDO"
plano 1: 0.0-2.0s  · #000000 #494949 · "EL PRIMER SEGUNDO"
plano 2: 2.0-6.0s  · #1B395D #526982 · "mira esto"
plano 3: 6.0-10.0s · #8B2F3A #A25C64 · "tres arranques"
plano 4: 10.0-15.0s · #D9CAA3 #E3D8BD · "el resultado"
plano 5: 15.0-18.0s · #132319 #4A564E · "probalo"
```

**La lectura creativa que sale de ahí:**

| Capa | Patrón extraído |
|---|---|
| **Gancho** | Placa de texto sobre negro, sin audio, 2 s. El hook **se lee**, no se escucha |
| **Estructura** | Corte a los 2 s → entra el hablante. Promesa antes del segundo 3 |
| **Ritmo** | 3,6 s de plano promedio: expositivo, no vertiginoso. Coherente con función Proof |
| **Paleta** | Oscuro → azul → rojo → crema → verde oscuro. **Va abriendo**: cierra más claro que como abre |
| **Texto** | Presente en los 5 planos. La pieza funciona en silencio |
| **Producción** | 5 setups, uno de ellos placa generada → 4 planos a grabar. Dato para ⑤ |

**Hipótesis para nuestra marca:** *"Abrir con placa de texto sobre negro, sin audio, y cortar al
hablante antes del segundo 3"* — no *"hacer un video con fondo negro"*.

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| Muestrear 1 frame por segundo | La mitad son el mismo plano; se paga contexto por nada | Uno por plano + denso en el hook |
| Leer solo el frame del medio | Se pierde el hook, que es el 80 % del valor de la referencia | La zona de hook se muestrea aparte |
| Describir el audio sin transcripción | Es inventar | `⚠️ SIN TRANSCRIPCIÓN` y leer el texto en pantalla |
| Pedir el archivo antes de agotar el MCP | Si lo que se busca es el mensaje, el MCP alcanza | Vía A primero; Vía B solo si hay que leer la imagen |
| Volver a leer una referencia ya leída | El trabajo ya está hecho y guardado | Buscar la ficha antes de correr el pipeline |
| Guardar la referencia porque «se ve bien» | Leer no es validar. Sin señal de rendimiento es ⚪ ruido | El filtro de señal manda, no la lectura |

---

**Se usa en:** Capa 1 (Referencia). **Alimenta:** `referencia_visual`, `hook`, `escenas`,
`encuadres`, `duraciones`, `estetica_mood`. **Skill:** `cr-lectura-de-video`.
**Plantilla de salida:** `templates/ficha-de-referencia.md`.
