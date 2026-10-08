# Barrido nocturno — recolección propia de anuncios

> 🔴 **ESTADO: REEMPLAZADO.** La recolección de anuncios la hace **Apify
> `apify/facebook-ads-scraper`**, por MCP y sin servidor. **Este barrido no se construye.**
> La fuente oficial y sus reglas están en `cr-fuentes`.
>
> **Qué sobrevive de acá:** la regla dura de la antigüedad y el aviso de fallo. Lo demás —VPS,
> cron, Chromium headless— era la forma de conseguir lo que Apify ya entrega.
> El documento queda como histórico de la decisión, no como plan.

---

## La decisión que lo originó — y la que la reemplazó

Se evaluó pagar **Foreplay Basic ($49/mes)** contra recolectar por cuenta propia. Se eligió **la
vía propia**: un VPS con Chromium headless leyendo el DOM de la Ad Library.

🔴 **Esa decisión quedó sin efecto.** Apify `apify/facebook-ads-scraper` entrega lo mismo —y el
copy de los DCO, que el DOM no daba limpio— por **~US$0,006 por anuncio**, sin servidor que
mantener ni IP que Meta pueda bloquear. **Las tres condiciones de compra de Foreplay de abajo ya no
aplican.**

**Lo que se probó y funcionó** (16-sep-2026, sobre la Ad Library real de Guatemala):

- Se extrajeron **48 anuncios** con id de biblioteca, anunciante, copy, plataformas y fecha de
  inicio, leyendo el DOM de la página.
- Se calculó la antigüedad y se ordenó por ella. Resultado real: Melolo 216 d · Steren 198 d ·
  Villas Le Suisse 193 d · Pollo Campero 190 d · Le Suisse Spa 187 d.
- **Las URLs de los videos están en el DOM** (`video-*.xx.fbcdn.net`). Son descargables desde una
  máquina con internet normal.
- Confirmado: la Ad Library **solo ordena** por «impresiones» o «más recientes». **No hay orden por
  antigüedad** — por eso hay que extraer y ordenar nosotros.

## La regla dura que salió de esto

> **Ninguna fecha de antigüedad entra al swipe file si no fue leída directamente de la Ad
> Library** — de la página, o de un MCP que la lea. **Nunca de un modelo.**

**Por qué.** Se le pidió a Meta Muse Spark (vía OpenRouter) que listara anuncios activos en
Guatemala. Reconoció no tener acceso privado a la Ad Library — y **aun así devolvió 5 anuncios con
id, fecha y link**. Verificados uno por uno: la marca *Patsy* existe, pero su anuncio real es id
`1050002464327310`, **9 sep 2026**, **Inactivo**, con copy *«¡Ya falta muy poco, Próceres!»* — ni la
fecha, ni el estado, ni la creatividad coincidían. *La Llorona Guatemala* no aparece como anunciante
en GT. Marcas reales, direcciones reales, datos duros inventados.

El 70 % de la mezcla 70/20/10 se apoya en evidencia de rendimiento. Si esa evidencia la rellena un
modelo, el 70 % es opinión disfrazada de dato.

---

## 🔴 De acá para abajo: histórico

> Lo que sigue describe el barrido que **no se construyó**. Se conserva porque explica por qué la
> regla dura existe y qué hay que exigirle a cualquier fuente. **No es un plan de trabajo.**

## Arquitectura: separar **recolectar** de **pensar**

```
3:00 AM · el VPS solo, sin nadie conectado
  ① cron dispara
  ② Chromium headless abre la Ad Library, hace scroll, extrae
  ③ escribe anuncios.csv en la carpeta del cliente
  ④ baja los videos de las URLs de fbcdn
  ⑤ corre leer-video.py sobre cada uno
  ⑥ manda el audio a Muse Spark (OpenRouter) → transcripción
  ⑦ escribe las fichas de referencia
A la mañana
  ⑧ el agente abre archivos ya listos y hace su trabajo
```

**El agente nunca scrapea.** Lee archivos ya escritos. Un script determinista es más barato, más
rápido, y cuando falla falla fuerte en vez de fallar raro.

## Entorno

VPS Hostinger **KVM 2** — 2 vCPU, 8 GB RAM, 100 GB NVMe. **Medido en hardware idéntico:** el
pipeline de lectura procesa un video de 18 s en **4,5 s** y deja 152 KB de salida.

```bash
sudo apt update
sudo apt install -y ffmpeg imagemagick tesseract-ocr tesseract-ocr-spa \
                    python3-pip nodejs npm
pip3 install --break-system-packages pillow numpy
npm install -g playwright && npx playwright install --with-deps chromium
```

`tesseract-ocr-spa` no es opcional: sin él el OCR pierde acentos y ñ.

**Reglas de disciplina en 2 núcleos:** correr de madrugada · un cliente por noche · secuencial
(Chromium → ffmpeg → transcripción) · **borrar el video fuente después de leerlo** (el video pesa
2-5 MB, la ficha 150 KB) · 4 GB de swap como seguro.

## El aviso de fallo — no es opcional

Si un barrido devuelve **cero anuncios, o menos de la mitad de lo normal**, manda un mensaje.
Sin esto, un rediseño de Meta deja al departamento trabajando con datos viejos en silencio, y el
70 % vuelve a ser opinión — justo lo que la regla dura prohíbe.

## Lo que faltaba probar — 🔴 sin efecto

El riesgo sin medir era que Meta tratara con más sospecha la IP de un datacenter. **Dejó de
importar:** la corrida la hace la infraestructura de Apify, no una IP nuestra.

## Cuándo se compraba Foreplay — 🔴 sin efecto

Las tres condiciones eran: Meta bloquea la IP del VPS · el extractor se rompe dos veces en un mes ·
se pasan de 4 clientes y hace falta TikTok en serio.

🔴 **Ninguna aplica ya:** no hay VPS ni extractor propio. **Si algún día hace falta TikTok en serio,
se evalúa de cero contra lo que Apify cubre**, no contra este documento.

## Lo que Muse Spark sí aporta

Acepta **audio y video** como entrada. Cubre la transcripción por centavos sin gastar el CPU del
VPS, y sirve como segunda lectura de ambientación y como crítico de hipótesis.
**Nunca como fuente de datos de anuncios.**
