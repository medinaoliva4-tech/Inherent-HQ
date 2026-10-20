# Motor de render — de la plantilla al PNG o PDF, sin gastar créditos

**Claude no dibuja.** La plantilla ya trae el diseño: una página HTML/CSS hecha con los tokens del
design system del cliente. Aquí se llena con el texto del calendario y se exporta con Chrome. La IA solo
decide *(qué plantilla, qué variante)*. Lo usan las skills `ig-content`, `fb-content`, `linkedin-content` y
`presentation` de ⑥A Diseño gráfico.

## Instalar (una vez por compu)

```bash
cd agents/06-graphic-design/brain/tools/render && npm install
```

Baja solo `playwright-core` (unos 2 MB). **No baja navegador:** usa tu Google Chrome *(o Edge, o Chromium)*.
Si no lo encuentra: `--chrome <ruta>` o la variable `CHROME_PATH`. Necesita Node 18 o más nuevo.

## Las tres herramientas

| Archivo | Para qué | Gasta IA |
|---|---|---|
| `calendario.mjs` | Lee el `plan-de-contenido.csv` y los `ideas-<formato>.md`: una pieza = su fila + su sección. Dice qué piezas **no** entran y por qué | No |
| `render.mjs` | Llena la plantilla y exporta. Mide desbordes, safe zones, líneas, solapes y copy literal | No |
| `ia.mjs` | `elegir` → Laya decide *(plantilla, variante)* · `local` → modelo local escribe texto auxiliar · `estado` | Laya y el modelo local, no |

Si Laya o el modelo local no responden, `ia.mjs` sale con código **10** y dice por qué: la skill decide o
escribe con el modelo más barato de Claude y lo anota (`engine: claude`).

## El render

```bash
# una variante → el archivo final (CR-007_estatico.png)
node render.mjs render --plantilla P.html --tokens tokens.json --contenido pieza.json \
  --variante A --id CR-007 --formato estatico --salida ./out --copy-de ideas-estatico.md --estricto

# varias variantes → candidatas en ./out/_candidatas (CR-007_estatico__A.png, __B, __C)
node render.mjs render … --variante A,B,C

# carrusel de IG: contenido con "slides" → CR-009_carrusel_01.png, _02, _03…
# PDF de varias páginas (carrusel de LinkedIn, presentación): --formato-salida pdf → CR-010_carrusel.pdf
# hoja de contacto: una sola imagen con todas las piezas, para UNA revisión visual
node render.mjs hoja --entrada out/*.png --salida out/hoja.png --columnas 4

# el catálogo de plantillas (id, para qué sirve, variantes, campos) — lo que lee Laya
node render.mjs listar ../../../../clients/<cliente>/02-marca/kit-de-redes/plantillas
```

- **Medidas exactas:** salen de la plantilla (`medidas`). El PNG sale a esa medida, en sRGB. `--escala 2` da el doble.
- `--estricto` sale con código **3** si hay avisos. Sin él, los avisos van en el JSON.
- Los avisos que mide solo: `fuera_del_lienzo` · `fuera_de_safe_zone` · `demasiadas_lineas` · `texto_cortado` ·
  `texto_solapado` · `imagen_rota` · `fuente_no_disponible` · `copy_no_literal` · `copy_acortado_o_sin_comillas`.
- El PDF es vectorial *(el texto se puede seleccionar)*. Sus páginas pueden medir ±1 px por el redondeo de Chrome.
- Sale por stdout **un solo JSON** con los archivos, medidas, peso en KB y avisos.

## La plantilla — qué lleva para que el motor la entienda

Un HTML completo, con todo el CSS adentro, y un bloque de metadatos:

```html
<script type="application/json" id="plantilla">
{ "id": "IG-POST", "formato": "estatico", "medidas": [1080, 1350], "safe": [76, 76, 76, 76],
  "para": "cuándo sirve",
  "variantes": { "A": { "nombre": "…", "descripcion": "…", "requiere_imagen": true }, "B": {…}, "C": {…} },
  "campos": { "titulo": { "max": 70, "obligatorio": true }, "etiqueta": { "auxiliar": true } } }
</script>
```

- **Colores, tipografía y espacios salen de los tokens:** `var(--color-acento)`, `var(--tipografia-titulo-familia)`.
  Nunca un hex escrito en la plantilla.
- **Variantes:** el motor pone `data-variante="A"` en `<html>` y la plantilla las resuelve en CSS
  (`html[data-variante="B"] …`). Cada variante cambia layout, fondo, jerarquía o el acento **dentro del sistema**.
  En un carrusel o una presentación, `data-tipo="portada|contenido|cierre"` hace lo mismo por lámina.
- **Campos:** `{{titulo}}` escapa el texto · `{{titulo|rico}}` convierte `*palabra*` en énfasis y respeta saltos de
  línea · `{{titulo|mayus}}` · `{{#si campo}}…{{/si}}` · `{{#no campo}}…{{/no}}` · `{{#cada puntos}}{{.}}{{/cada}}` ·
  `{{tokens.assets.logo}}` · `{{_n}}` y `{{_total}}` *(número de lámina)*. Un campo que falta frena el render.
- **Marcas para medir:** `data-campo="titulo"` nombra el texto en los avisos · `data-max-lineas="3"` pone su tope ·
  `data-fuera-safe` exime a un elemento de la safe zone *(número de página, por ejemplo)*.
- `campos.<x>.auxiliar: true` = texto que **no es copy** de ④ Creatividad: ahí sí puede escribir el modelo barato.

## Los tokens (`tokens.json`)

```json
{ "color": { "fondo": "#1F1E1C", "acento": "#E4572E" },
  "tipografia": { "titulo": { "familia": "\"Inter Tight\", sans-serif", "peso": "500" } },
  "assets": { "logo": "../logos/logo-blanco.svg" },
  "fuentes": [ { "familia": "Inter Tight", "peso": 500, "archivo": "fuentes/InterTight-Medium.woff2" } ] }
```

Cada valor se vuelve `--color-fondo`, `--tipografia-titulo-familia`… Los `assets` y las fuentes con `archivo`
se incrustan *(rutas relativas al JSON)*. Una fuente sin `archivo` tiene que estar instalada en la compu: si no,
sale el aviso `fuente_no_disponible`.

## El contenido

Una pieza: `{ "titulo": "…", "subtitulo": "…", "imagen": "foto.jpg" }`. Varias láminas:
`{ "comun": { … }, "slides": [ { "tipo": "portada", … }, { "tipo": "contenido", … } ] }`. Cualquier valor que sea
la ruta de una imagen existente *(relativa al JSON)* se incrusta solo. Un `slide` puede traer su `variante` y
su `plantilla`.

## Probarlo

```bash
node render.mjs render --plantilla ejemplo/plantillas/ig-post-4x5.html --tokens ejemplo/tokens.json \
  --contenido ejemplo/contenido-ig-post.json --variante A,B,C --id CR-007 --formato estatico --salida /tmp/render
node render.mjs render --plantilla ejemplo/plantillas/presentacion-16x9.html --tokens ejemplo/tokens.json \
  --contenido ejemplo/contenido-presentacion.json --variante A --id PR-001 --formato presentacion \
  --formato-salida pdf --salida /tmp/render
node calendario.mjs --dir ejemplo/calendario --canal instagram
```

`ejemplo/` es una marca inventada *(«Marca Ejemplo»)*: sirve para probar el motor, no es de ningún cliente.
