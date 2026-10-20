---
name: linkedin-content
description: >
  Capa 3 de ⑥A Diseño gráfico, por red: produce las piezas de LinkedIn del ciclo —post con imagen y
  carrusel en PDF— llenando las plantillas HTML del cliente con el copy literal del calendario de
  contenido y exportándolas con el motor de render (PNG o un PDF de varias páginas), sin que Claude
  dibuje. Laya elige plantilla y variante, compara 2 o 3 candidatas y se queda con una; el texto
  auxiliar que falte lo escribe el modelo local o, si no responde, el modelo más barato de Claude.
  Úsala cuando pidan "las piezas de LinkedIn del ciclo", "el carrusel en PDF", "el post con imagen
  de LinkedIn", "renderiza CR-010". Bloquea sin ficha de oferta, design system, calendario o plantillas.
---

# linkedin-content — LinkedIn: post con imagen y carrusel en PDF

| | |
|---|---|
| **Consume** | `plan-de-contenido.csv` + `ideas-<formato>.md` del ciclo · `sistema-visual.md` + `kit-de-redes/kit.md` · las plantillas HTML con variantes del cliente |
| **Produce** | Los PNG y PDF de LinkedIn con su `id_creativo` · `decisiones.json` · las filas de `entregas-diseno.md` (`gd-export`) |

> 🔑 **Claude no dibuja.** La plantilla ya trae el diseño. Esta skill la llena y la exporta con
> `agents/06-graphic-design/brain/tools/render/` *(`$R` abajo)*. La IA solo decide.
> `$R` = `agents/06-graphic-design/brain/tools/render`.

## 1 · Pre-flight — sin esto, BLOQUEA y dice qué falta

| Input | De dónde | Si falta |
|---|---|---|
| **Ficha de oferta** | `clients/<cliente>/00-onboarding/plan-contratado.md` · LinkedIn en sus Redes | 🛑 BLOQUEADO — falta la ficha de oferta |
| **Design system / kit** | `02-marca/sistema-visual.md` + `02-marca/kit-de-redes/kit.md` | 🛑 BLOQUEADO — se pide a ②B Branding |
| **Calendario de contenido** | `04-contenido/AAAA-MM/ideas/plan-de-contenido.csv` + `ideas-<formato>.md` | 🛑 BLOQUEADO — se pide a ④ Creatividad |
| **Plantillas con variantes** | `02-marca/kit-de-redes/plantillas/` · HTML + `tokens.json` | 🛑 BLOQUEADO — se piden a `gd-plantillas`. Esta skill no las crea |
| **Motor de render** | Node 18+ y Chrome · `$R/README.md` § Instalar | 🛑 BLOQUEADO — falta Node, Chrome o `npm install` |
| **Fotos** de las filas con `material = foto` | Banco del cliente o ⑤ Producción (`gd-imagen`) | `⚠️ SIN IMAGEN` — la pieza espera |
| **Formatos a replicar** | La `Plantilla` y la `Referencia` de cada sección · las secuencias de `kit.md` | Se usa la plantilla del formato y se anota |
| **Contexto del ciclo** | ICP · estrategia del mes · fechas — ver abajo | `⚠️ SIN DATOS` — no bloquea, no se inventa |

**Contexto del ciclo.** Si `brief-del-ciclo.md` trae el bloque «Contexto del ciclo», se lee de ahí. Si no, de su fuente:
ICP → `01-estrategia/brief-de-comunicacion-AAAA-MM.md` *(bloque persona)* o `posicionamiento.md` *(audiencia profunda)* ·
estrategia del mes → `brief-del-ciclo.md` + `03-marketing/AAAA-MM/estrategia-de-contenido.md` ·
fechas → la `fecha` de cada fila + las fechas duras de `estrategia-de-contenido.md`.

**Techo.** Se produce solo lo que tiene fila en el calendario. Si las filas de LinkedIn pasan el techo de la
ficha, se declara la diferencia y se devuelve a ③ Marketing.

## 2 · Specs de LinkedIn

| Pieza | Medidas | Páginas o imágenes | Peso | Safe zone |
|---|---|---|---|---|
| **Post con imagen** | Las de la plantilla del kit · referencias de la plataforma: 1200×627 · 1080×1080 · 1080×1350 | 1 a 20 imágenes | ⚠️ ≤ 8 MB cada una *(sin confirmar, ver abajo)* · JPEG, PNG o GIF | La del sistema visual y la `safe` de la plantilla |
| **Carrusel en PDF** | Las de la plantilla del kit; **todas las páginas del mismo tamaño** | Hasta 300 páginas · las que fija la sección | **≤ 100 MB** · un PDF por post, sin imágenes ni video al lado | Ídem |

Del PDF: la **primera página es la portada**; sin contraseña; LinkedIn pide un título del documento
*(`documentTitle`, lo pone ⑨ Posting)*.

*Fuente: documentación de Zernio, leída el 2026-10-20. Los límites del PDF están confirmados. El de la imagen sale de una tabla sin título de plataforma en el resultado: se confirma con `validate_media` antes de programar (`po-carga`).*

## 3 · El flujo, pieza por pieza

1. **Leer.** `node $R/calendario.mjs --dir <ideas/> --canal linkedin` → piezas y `omitidas` con su motivo.
   Las omitidas se declaran. Se agrupa por formato.
2. **Plantillas.** `node $R/render.mjs listar <plantillas/>`. Si la sección nombra una plantilla, se usa esa y Laya
   elige solo la variante. Las variantes con `requiere_imagen` salen si la pieza no tiene imagen.
3. **Contenido.** Se copia **literal** el `### Copy` de la sección a `contenido.json` *(carrusel: una entrada por página en `slides`)*.
   Texto auxiliar que falte *(campos `auxiliar` de la plantilla)*: `node $R/ia.mjs local …` con la voz de la marca,
   el límite `max` del campo y sin cifras, precios ni promesas. Exit 10 → el modelo más barato de Claude, anotado
   `engine: claude`. **Título, subtítulo, CTA o lámina que falten: ↩️ devuelto a ④ Creatividad.**
4. **Laya elige.** `pieza.txt` = fila + objetivo del slot + etapa y consciencia + ICP + estrategia del mes + fecha +
   largo del copy + si hay imagen + plantillas y variantes usadas en las 3 piezas anteriores del formato.
   `node $R/ia.mjs elegir --texto-archivo pieza.txt --opciones-archivo opciones.json` *(`{"ID/A": "descripción", …}`)*
   → plantilla/variante y probabilidades. Exit 10 → decide Claude con la misma pregunta.
5. **Render de candidatas** en **PNG** *(son las páginas para revisar; el PDF sale en el paso 7)*: las 2 o 3 variantes con más probabilidad, `render.mjs render … --variante A,B,C`.
   Se descartan las que traen avisos de medidas.
6. **Laya compara.** Con las candidatas limpias: descripción de cada variante + `medidas` del JSON *(líneas usadas
   por campo)* → `ia.mjs elegir`. Laya lee texto, no imágenes. **Se anota la elegida y las descartadas.**
7. **Render final.** `render.mjs render … --variante <elegida> --id <id_creativo> --formato <formato> --copy-de <ideas-formato.md> --estricto`; el carrusel en PDF suma `--formato-salida pdf`.
   Si el copy no entra *(`demasiadas_lineas`, `texto_cortado`)*: ↩️ a ④ Creatividad con el máximo de caracteres de
   `campos.max`. **No se acorta.**
8. **Auto-revisión** y **entrega** — §4 y §5.

## 4 · Auto-revisión — la ficha de `08-CRITERIOS-DE-ACEPTACION.md`

| Pieza | Ficha |
|---|---|
| Post con una imagen | **4 · Estático** |
| Post con varias imágenes · carrusel en PDF | **3 · Carrusel** *(la «slide» es la página)* |

| Quién revisa | Cómo se cubre |
|---|---|
| ⚙️ Medidas, peso, sRGB, safe zone, copy literal, techo | El JSON del render con `--estricto` y `--copy-de` |
| 🧠 *«Una frase que se sostiene sola»*, *«slide 1 = hook»* | `ia.mjs juzgar` con preguntas sí/no sobre el copy |
| 🔍 Foco, acento, jerarquía, activo distintivo, legible en el feed | **Una** imagen: `render.mjs hoja --entrada <PNG del formato> --celda 360` *(máx. 12 piezas)* y Claude la mira |
| 👁️ Parecido a la marca, logo tapado | `⚠️ SIN HERRAMIENTA` — el ojo visual no está conectado; lo cubre 🔍 y el COO en el QA final |
| 🙋 Visto final | El COO |

Una pieza que no pasa se rehace con la siguiente candidata o se devuelve, con el motivo escrito: a ④ Creatividad
*(copy)*, a `gd-plantillas` *(la plantilla no resuelve el caso)* o a ②B Branding *(falta la regla)*.

## 5 · Entrega

- Nombre: `<id_creativo>_<formato>.png` · carrusel en PDF: `<id_creativo>_carrusel.pdf` *(un solo archivo, páginas en orden)*. Varias imágenes con dos dígitos: `_01`, `_02`.
- Carpeta `diseno/` del ciclo en el Drive del cliente. Filas en `entregas-diseno.md` con la columna **`plantilla`**
  *(`ID/A`)* y `specs_ok` ✅ solo con la ficha completa.
- `decisiones.json`: por pieza, plantilla, variante, motor *(`laya-local` o `claude`)*, probabilidades, candidatas.
- No publica y no le envía nada al cliente: publicar es de ⑨ Posting. Lo sigue `gd-export`.

## 6 · Checklist

- [ ] Pre-flight completo; lo que faltó, dicho
- [ ] Solo piezas con fila en el calendario, dentro del techo
- [ ] Copy **literal**: `--copy-de` sin avisos
- [ ] Laya eligió plantilla y variante; se compararon 2 o 3 candidatas
- [ ] Cada pieza pasó su ficha de `08-CRITERIOS-DE-ACEPTACION.md`
- [ ] El PDF tiene todas sus páginas, del mismo tamaño, y su primera página es la portada
- [ ] Texto auxiliar escrito por el modelo local o el más barato de Claude, y anotado
- [ ] Nada se acortó, nada se publicó
