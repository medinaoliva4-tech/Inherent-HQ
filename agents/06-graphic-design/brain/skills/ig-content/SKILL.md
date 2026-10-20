---
name: ig-content
description: >
  Capa 3 de ⑥A Diseño gráfico, por red: produce las piezas de Instagram del ciclo —post estático,
  carrusel, story y portada de reel— llenando las plantillas HTML del cliente con el copy literal del
  calendario de contenido y exportándolas a PNG con el motor de render, sin que Claude dibuje. Laya
  elige plantilla y variante, compara 2 o 3 candidatas y se queda con una; el texto auxiliar que falte
  lo escribe el modelo local o, si no responde, el modelo más barato de Claude. Úsala cuando pidan
  "las piezas de Instagram del ciclo", "arma los carruseles", "las stories", "las portadas de reel",
  "renderiza el post CR-007". Bloquea sin ficha de oferta, design system, calendario o plantillas.
---

# ig-content — Instagram: post, carrusel, story y portada de reel

| | |
|---|---|
| **Consume** | `plan-de-contenido.csv` + `ideas-<formato>.md` del ciclo · `sistema-visual.md` + `kit-de-redes/kit.md` · las plantillas HTML con variantes del cliente |
| **Produce** | Los PNG de Instagram con su `id_creativo` · `decisiones.json` · las filas de `entregas-diseno.md` (`gd-export`) |

> 🔑 **Claude no dibuja.** La plantilla ya trae el diseño. Esta skill la llena y la exporta con
> `agents/06-graphic-design/brain/tools/render/` *(`$R` abajo)*. La IA solo decide.
> `$R` = `agents/06-graphic-design/brain/tools/render`.

## 1 · Pre-flight — sin esto, BLOQUEA y dice qué falta

| Input | De dónde | Si falta |
|---|---|---|
| **Ficha de oferta** | `clients/<cliente>/00-onboarding/plan-contratado.md` · Instagram en sus Redes | 🛑 BLOQUEADO — falta la ficha de oferta |
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

**Techo.** Se produce solo lo que tiene fila en el calendario. Si las filas de Instagram pasan el techo de la
ficha, se declara la diferencia y se devuelve a ③ Marketing.

## 2 · Specs de Instagram

| Pieza | Medidas | Slides | Peso | Safe zone |
|---|---|---|---|---|
| **Post estático** | 1080×1350 *(4:5)* · también 1080×1080 *(1:1)* | 1 | ≤ 8 MB · JPEG o PNG | La del sistema visual y la `safe` de la plantilla |
| **Carrusel** | Las de la plantilla; todas las slides con la proporción de la primera | 2 a 10 · las que fija la sección | ≤ 8 MB cada una | Ídem |
| **Story** | 1080×1920 *(9:16)* | 1 imagen por story | ≤ 8 MB | Ídem; sin ella en el sistema: ↩️ a ②B Branding |
| **Portada de reel** | 1080×1920 *(9:16)* | 1 | ≤ 8 MB | Lo importante dentro del recorte que fija el kit; si no lo fija: ⚠️ SIN DATOS |

*Fuente: documentación de Zernio, leída el 2026-10-20. Se confirma con `validate_media` antes de programar (`po-carga`).*

## 3 · El flujo, pieza por pieza

1. **Leer.** `node $R/calendario.mjs --dir <ideas/> --canal instagram [--formato carrusel]` → piezas y `omitidas`
   con su motivo. Las omitidas se declaran. Se agrupa por formato.
2. **Plantillas.** `node $R/render.mjs listar <plantillas/>`. Si la sección nombra una plantilla, se usa esa y Laya
   elige solo la variante. Las variantes con `requiere_imagen` salen si la pieza no tiene imagen.
3. **Contenido.** Se copia **literal** el `### Copy` de la sección a `contenido.json` *(título, subtítulo, CTA, slides)*.
   Texto auxiliar que falte *(campos `auxiliar` de la plantilla)*: `node $R/ia.mjs local …` con la voz de la marca,
   el límite `max` del campo y sin cifras, precios ni promesas. Exit 10 → el modelo más barato de Claude, anotado
   `engine: claude`. **Título, subtítulo, CTA o slide que falten: ↩️ devuelto a ④ Creatividad.**
4. **Laya elige.** `pieza.txt` = fila + objetivo del slot + etapa y consciencia + ICP + estrategia del mes + fecha +
   largo del copy + si hay imagen + plantillas y variantes usadas en las 3 piezas anteriores del formato.
   `node $R/ia.mjs elegir --texto-archivo pieza.txt --opciones-archivo opciones.json` *(`{"IG-POST/A": "descripción", …}`)*
   → plantilla/variante y probabilidades. Exit 10 → decide Claude con la misma pregunta.
5. **Render de candidatas**: las 2 o 3 variantes con más probabilidad: `render.mjs render … --variante A,B,C`.
   Se descartan las que traen avisos de medidas.
6. **Laya compara.** Con las candidatas limpias: descripción de cada variante + `medidas` del JSON *(líneas usadas
   por campo)* → `ia.mjs elegir`. Laya lee texto, no imágenes. **Se anota la elegida y las descartadas.**
7. **Render final.** `render.mjs render … --variante <elegida> --id <id_creativo> --formato <formato> --copy-de <ideas-formato.md> --estricto`.
   Si el copy no entra *(`demasiadas_lineas`, `texto_cortado`)*: ↩️ a ④ Creatividad con el máximo de caracteres de
   `campos.max`. **No se acorta.**
8. **Auto-revisión** y **entrega** — §4 y §5.

## 4 · Auto-revisión — la ficha de `08-CRITERIOS-DE-ACEPTACION.md`

| Pieza | Ficha |
|---|---|
| Post estático · portada de reel | **4 · Estático** |
| Carrusel | **3 · Carrusel** |
| Story | **2 · Story** *(los criterios de pieza compuesta: 4, 5, 6 y 8)* |

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

- Nombre: `<id_creativo>_<formato>.png` · slides y frames con dos dígitos: `_01`, `_02`. Si el PNG pasa de 8 MB: `--formato-salida jpg` y se anota.
- Carpeta `diseno/` del ciclo en el Drive del cliente. Filas en `entregas-diseno.md` con la columna **`plantilla`**
  *(`IG-POST/A`)* y `specs_ok` ✅ solo con la ficha completa.
- `decisiones.json`: por pieza, plantilla, variante, motor *(`laya-local` o `claude`)*, probabilidades, candidatas.
- No publica y no le envía nada al cliente: publicar es de ⑨ Posting. Lo sigue `gd-export`.

## 6 · Checklist

- [ ] Pre-flight completo; lo que faltó, dicho
- [ ] Solo piezas con fila en el calendario, dentro del techo
- [ ] Copy **literal**: `--copy-de` sin avisos
- [ ] Laya eligió plantilla y variante; se compararon 2 o 3 candidatas
- [ ] Cada pieza pasó su ficha de `08-CRITERIOS-DE-ACEPTACION.md`
- [ ] Texto auxiliar escrito por el modelo local o el más barato de Claude, y anotado
- [ ] Nada se acortó, nada se publicó
