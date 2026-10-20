---
name: presentation
description: >
  Capa 3 de ⑥A Diseño gráfico, por formato: produce la presentación 16:9 en PDF —una lámina por idea—
  llenando la plantilla HTML del cliente con el copy literal del calendario de contenido y exportándola
  con el motor de render, sin que Claude dibuje. Laya elige la variante, compara 2 o 3 candidatas y se
  queda con una; el texto auxiliar que falte lo escribe el modelo local o, si no responde, el modelo
  más barato de Claude. Úsala cuando pidan "la presentación", "el deck del cliente", "la presentación
  comercial en PDF", "renderiza la presentación". Bloquea sin ficha de oferta, design system, calendario
  o plantilla.
---

# presentation — presentación 16:9 en PDF

| | |
|---|---|
| **Consume** | La sección de la presentación en `ideas-<formato>.md` *(copy por lámina)* · `sistema-visual.md` + `kit-de-redes/kit.md` · la plantilla HTML con variantes del cliente |
| **Produce** | El PDF con su `id_creativo` · `decisiones.json` · la fila de `entregas-diseno.md` (`gd-export`) |

> 🔑 **Claude no dibuja.** La plantilla ya trae el diseño. Esta skill la llena y la exporta con
> `agents/06-graphic-design/brain/tools/render/` *(`$R` abajo)*. La IA solo decide.
> `$R` = `agents/06-graphic-design/brain/tools/render`.

## 1 · Pre-flight — sin esto, BLOQUEA y dice qué falta

| Input | De dónde | Si falta |
|---|---|---|
| **Ficha de oferta** | `clients/<cliente>/00-onboarding/plan-contratado.md` · presentación en sus Redes | 🛑 BLOQUEADO — falta la ficha de oferta |
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

**Techo.** Se produce solo lo que tiene fila en el calendario. Si las filas de presentación pasan el techo de la
ficha, se declara la diferencia y se devuelve a ③ Marketing.

## 2 · Specs de presentación

| Pieza | Medidas | Páginas | Peso | Safe zone |
|---|---|---|---|---|
| **Presentación** | 1920×1080 px *(16:9)* · todas las páginas del mismo tamaño | Las láminas que fija la sección. Tope: `⚠️ SIN DATOS` *(el manual no fija un número)* | `⚠️ SIN DATOS` *(no es de una red; si se sube como documento de LinkedIn: ≤ 100 MB y ≤ 300 páginas)* | La `safe` de la plantilla y los márgenes de presentación del sistema visual |

*Fuente: la plantilla del cliente y la documentación de Zernio para el caso LinkedIn, leída el 2026-10-20.*

## 3 · El flujo, pieza por pieza

1. **Leer.** `node $R/calendario.mjs --dir <ideas/> --canal presentacion` → piezas y `omitidas` con su motivo.
   Las omitidas se declaran. Se agrupa por formato.
2. **Plantillas.** `node $R/render.mjs listar <plantillas/>`. Si la sección nombra una plantilla, se usa esa y Laya
   elige solo la variante. Las variantes con `requiere_imagen` salen si la pieza no tiene imagen.
3. **Contenido.** Se copia **literal** el `### Copy` de la sección a `contenido.json` *(una entrada por lámina en `slides`, con su `tipo`: portada, contenido, cifra, cierre…)*.
   Texto auxiliar que falte *(campos `auxiliar` de la plantilla)*: `node $R/ia.mjs local …` con la voz de la marca,
   el límite `max` del campo y sin cifras, precios ni promesas. Exit 10 → el modelo más barato de Claude, anotado
   `engine: claude`. **Título, subtítulo, CTA o lámina que falten: ↩️ devuelto a ④ Creatividad.**
4. **Laya elige.** `pieza.txt` = fila + objetivo del slot + etapa y consciencia + ICP + estrategia del mes + fecha +
   largo del copy + si hay imagen + plantillas y variantes usadas en las 3 piezas anteriores del formato.
   `node $R/ia.mjs elegir --texto-archivo pieza.txt --opciones-archivo opciones.json` *(`{"ID/A": "descripción", …}`)*
   → plantilla/variante y probabilidades. Exit 10 → decide Claude con la misma pregunta.
5. **Render de candidatas** en **PNG** *(son las láminas para revisar; el PDF sale en el paso 7)*: las 2 o 3 variantes con más probabilidad, `render.mjs render … --variante A,B,C`.
   Se descartan las que traen avisos de medidas.
6. **Laya compara.** Con las candidatas limpias: descripción de cada variante + `medidas` del JSON *(líneas usadas
   por campo)* → `ia.mjs elegir`. Laya lee texto, no imágenes. **Se anota la elegida y las descartadas.**
7. **Render final.** `render.mjs render … --variante <elegida> --id <id_creativo> --formato <formato> --formato-salida pdf --copy-de <ideas-formato.md> --estricto`.
   Si el copy no entra *(`demasiadas_lineas`, `texto_cortado`)*: ↩️ a ④ Creatividad con el máximo de caracteres de
   `campos.max`. **No se acorta.**
8. **Auto-revisión** y **entrega** — §4 y §5.

## 4 · Auto-revisión — la ficha de `08-CRITERIOS-DE-ACEPTACION.md`

La presentación **no tiene ficha propia** en `08-CRITERIOS-DE-ACEPTACION.md`. Se aplican los criterios de
**3 · Carrusel** que valen para una lámina *(la lámina 1 hace de slide 1)*: 1, 2, 3, 4, 5, 6, 7, 8 y 9. Se anota
en el manifiesto: *«falta la ficha de presentación»*.

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

- Nombre: `<id_creativo>_presentacion.pdf` *(un solo archivo, láminas en orden)*.
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
- [ ] El PDF tiene todas sus láminas, del mismo tamaño
- [ ] Texto auxiliar escrito por el modelo local o el más barato de Claude, y anotado
- [ ] Nada se acortó, nada se publicó
