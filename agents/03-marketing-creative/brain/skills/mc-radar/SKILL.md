---
name: mc-radar
description: >
  Paso 1 de ③ Marketing y Creative — el radar con sentido. Busca dónde vive el ICP y quién tiene
  sus ojos, los referentes por nivel (competencia local, mercados parecidos, aspiracional,
  crecimiento, lo propio), los winners adaptables aunque sean de otra industria, y el contenido
  quemado que ya no hay que hacer. Ve videos en volumen, los rankea por señal de ganador y lee a
  fondo los 10-15 mejores con leer-video.py. Úsala cuando pidan "el radar", "referentes", "qué
  está funcionando", "mirá este video", "analizá esta referencia", "qué está quemado", "quién le
  habla a nuestro cliente", "winners".
---

# Paso 1 · Radar — qué mira el ICP y qué le funciona

| | |
|---|---|
| **Consume** | Nodos `icp`, `dolor`, `deseo` · bloque 6 del brief *(qué buscar)* · las redes de la ficha |
| **Produce** | `clients/<cliente>/03-marketing/<AAAA-MM>/radar.md` *(nodo `radar`)* y una ficha por referente leído a fondo *(`ficha-de-referencia.md`)* |
| **Herramienta** | El radar del OS: el agente rankea, la persona marca qué se adapta |

## 1 · Las cinco preguntas del radar

| Pregunta | Dónde se busca |
|---|---|
| **¿Dónde vive el ICP?** | Las plataformas y comunidades de su nodo `icp` *(dónde vive)* |
| **¿Quién tiene sus ojos?** | Creadores, medios y marcas que el ICP sigue y a quienes les comenta |
| **¿Qué le funciona a la categoría?** | Los 5 niveles *(abajo)* |
| **¿Qué winner de otra industria se puede adaptar?** | Nivel 4: lo que crece más rápido que su categoría, sea cual sea |
| **¿Qué está quemado?** | Formatos, hooks y tendencias que la categoría ya repitió hasta cansar: **no se hacen** |

## 2 · Los 5 niveles — 5 cuentas por nivel, nunca mezclados

| # | Nivel | Para qué |
|---|---|---|
| 1 | **Competencia local** *(mercado del cliente)* | De qué despegarse: el código saturado |
| 2 | **Mercados parecidos** *(2-4 países de poder adquisitivo y cultura comparables)* | Estructuras que ya venden a un público como el nuestro |
| 3 | **Aspiracional** *(el mercado al que el cliente quiere llegar)* | Subir el estándar |
| 4 | **Crecimiento y engagement** *(cualquier industria)* | Mecánicas que retienen: formatos, frecuencia, hooks |
| 5 | **Lo propio** | Lo que ya le funciona al cliente, contra su propia mediana |

**Los países salen del mercado de cada cliente**, se escriben con su motivo. Cuántos contenidos por
plataforma lo fija la ficha *(mitad competencia, mitad referencias)*; si no lo fija, se escala.

## 3 · Ganador, reciente y resonancia

| | Regla |
|---|---|
| **Anuncio ganador** | **60-90+ días corriendo, leídos de la Ad Library** *(página o MCP)*. 🛑 Nunca de un modelo |
| **Orgánico ganador** | **2x o más** la mediana de vistas o interacciones de esa cuenta *(`multiplicador`)* |
| **Reciente** | Lo publicado después del radar anterior. La fecha de publicación va siempre |
| **Resonancia con el ICP** | Sobre los comentarios: **alta** si repiten su dolor, su lenguaje o preguntan cómo comprar *(con un comentario citado)* · media · baja · `⚠️ SIN DATOS` si no se leyeron |

## 4 · Cómo se corre

1. **Descubrir** por keyword qué páginas lideran → **scrapear** por página *(`search_type=page`,
   `view_all_page_id`)*. Nunca al revés.
2. **Apify**, un actor por plataforma: `apify/facebook-ads-scraper` · `apify/instagram-scraper` ·
   `clockworks/tiktok-scraper`. 🛑 **Toda corrida lleva `resultsLimit` y `maxTotalChargeUsd`.**
   El copy de los anuncios dinámicos está en `snapshot.cards[].body`; el video en `cards[].videoSdUrl`.
3. **Se scrapean todos, se rankean, y solo los 10-15 mejores se leen a fondo.**
4. **Leer un video** = extraer, no mirar: `python3 leer-video.py <video> --out <carpeta>` da hoja de
   contacto, frames del hook, cortes y ritmo, texto en pantalla, paleta y datos técnicos *(requiere
   ffmpeg, ImageMagick y tesseract; ver `INSTALAR.md`)*. Si basta el mensaje, se lee por MCP y no se
   baja el archivo.
5. **Una ficha por referente** con `ficha-de-referencia.md`: el hook literal y su caja, el patrón en
   7 capas *(el patrón, nunca la ejecución)*, la hipótesis para la marca y lo que no se pudo leer.
   **Una referencia leída no se vuelve a leer:** la ficha es la caché.

## 5 · Reglas

- 🛑 **Se adapta, nunca se copia el creativo.** Cruza la estructura y el ángulo, no la imagen.
- **Se refresca cada mes** en los días 1-3: se conservan las cuentas vigentes y se lee solo lo nuevo.
- Cada referente cumple la ficha 8 de `inherent/08-CRITERIOS-DE-ACEPTACION.md`.
