---
name: po-caption
description: >
  Capa 1 de ⑦ Posting — convierte el copy literal de ④ Creatividad en el caption que sale, adaptado
  al largo y la forma de cada plataforma sin cambiar el mensaje. Pone el hook antes del corte (~125
  caracteres en feed de Instagram, ~55 en Reels), acomoda el cuerpo, deja el CTA de ④, elige los
  hashtags que corresponden y escribe el alt text. Si el mensaje no entra sin romperse, devuelve a ④
  con dos alternativas. Escribe el caption de cada sección de `publicaciones.md`. Úsala cuando pidan
  "escribí los captions", "el texto del post", "qué hashtags le ponemos", "el alt text", "adaptá
  este copy a TikTok". 🛑 No cambia la idea ni el hook.
---

# Capa 1 · Caption — qué texto sale

| | |
|---|---|
| **Consume** | Las filas de `calendario-de-publicacion.csv` con archivo (de `po-recepcion`) · el **copy y el caption literales** del `ideas-<formato>.md` de cada pieza en ④ · tono de voz y do's & don'ts de ②B |
| **Produce** | El **caption final** de cada sección de `publicaciones.md`, con su conteo, su corte, sus hashtags y su alt text · la columna `caption_ok` |

Contexto del departamento: `agents/posting/WORKFLOW.md`. Plantilla:
`agents/posting/entregables/publicaciones.md`.

## 1 · 🛑 Qué se puede tocar y qué no

| Se puede | No se puede |
|---|---|
| **Recortar** para que entre en el límite | Cambiar la idea o el ángulo |
| **Reordenar** para que el hook quede antes del corte | Cambiar **el hook** |
| **Partir** una frase larga en dos líneas | Cambiar el CTA por otro |
| **Elegir** los hashtags | Agregar una promesa, un precio o un claim que ④ no escribió |
| **Escribir** el alt text | Corregirle el tono a ④ — eso se devuelve |

> 🛑 **Si para que entre hay que sacarle el hook o el CTA, no es una adaptación: es una devolución.**
> Vuelve a ④ con motivo 5 y **dos alternativas concretas** de versión corta.

## 2 · La estructura del caption

```
Línea 1    EL HOOK          antes del corte. Es lo único que se lee sin tocar "… más"
(línea en blanco)
Cuerpo     EL VALOR         lo que ④ escribió, acomodado a la plataforma
(línea en blanco)
Cierre     EL CTA           el de ④, según la etapa
(línea en blanco)
Al final   LOS HASHTAGS     los que corresponden, no los que caben
```

🛑 **El hook va completo en la línea 1.** Si se parte a la mitad en el corte, la mitad que se lee no
engancha y el resto nadie lo abre.

**La prueba, siempre:** se copian los primeros caracteres visibles de la plataforma y se leen solos.
Si así sueltos no dan ganas de tocar *"… más"*, el caption está mal ordenado.

## 3 · Los límites — con su fecha

⏱️ **Verificados en 2026-09.** Las plataformas los cambian: **un límite sin fecha caduca**, y antes
de un ciclo nuevo se revisan contra la fuente de la plataforma.

| Plataforma | Caption máx. | Visible antes del corte | Hashtags |
|---|---|---|---|
| **Instagram — feed** | 2.200 | **~125 caracteres** | Máx. 30 · **recomendado 3-5** |
| **Instagram — Reels** | 2.200 | **~55 caracteres** | Máx. 30 · **recomendado 3-5** |
| **TikTok** | 4.000 *(incluye hashtags y menciones)* | Pocas líneas, varía | Dentro del límite total |

| Plataforma | Estado |
|---|---|
| Facebook · LinkedIn · X · YouTube | ⚠️ **SIN VERIFICAR.** Se consulta la fuente de la plataforma antes de usarlos y se anota la fecha acá |

🛑 **No se inventa un límite.** Un caption cortado por un límite que nadie verificó sale mal
publicado y no se puede editar en todas las plataformas.

> **El límite de Reels (~55) es el más cruel del repo.** Un hook de ④ de 80 caracteres entra en el
> caption pero **no se ve**. Ahí es donde el hook se reordena, nunca se reescribe.

## 4 · Hashtags — los que corresponden, no los que caben

| Regla | Por qué |
|---|---|
| **3-5 en Instagram**, no 30 | El máximo no es la recomendación |
| **Relacionados con la pieza**, no con la marca en general | Un hashtag genérico no trae a nadie |
| **Nunca inventados sobre volumen** | Si no sabemos cuánto se usa un hashtag, se dice: no se afirma que *"tiene alcance"* |
| **Los de marca van siempre**, si ②B los definió | Consistencia |
| 🛑 **Ninguno que prometa algo** que la pieza no cumple | Es un claim con otro formato |

## 5 · Alt text — obligatorio en toda pieza con imagen

**Describe lo que se ve, para alguien que no lo ve.** No es un caption corto ni un lugar para
hashtags.

| ❌ | ✅ |
|---|---|
| *"Nuestro delicioso menú ejecutivo"* | *"Plato con proteína, arroz y ensalada servido en mesa de madera, vapor visible"* |
| *"Promo imperdible #menu #almuerzo"* | *"Placa con texto: Menú ejecutivo Q85, lunes a viernes"* |

🛑 **No se autogenera con adjetivos.** Si la pieza tiene texto en pantalla, el alt text lo incluye:
es la única forma de que alguien con lector de pantalla sepa qué dice.

## 6 · Qué se anota de cada caption

```
| Caracteres         | 412 / 2.200                                          |
| Antes del corte    | "Tu almuerzo llega antes de que termines de conte..." |
| ¿Sobrevive el hook?| ✅                                                    |
| Hashtags           | 4 — #almuerzo #guatemala #menuejecutivo #zona10      |
| Alt text           | "Plato del menú servido en mesa, vapor visible"       |
```

**Y qué se cambió respecto de ④, y por qué.** Si la respuesta es *"nada, entró tal cual"*, se
escribe: es la mejor noticia posible y deja constancia de que no se tocó.

---

## Control de calidad de la Capa 1

- [ ] 🛑 **El mensaje no cambió** — ni la idea, ni el hook, ni el CTA
- [ ] El **hook entra completo antes del corte** de su plataforma, y se verificó leyéndolo solo
- [ ] El conteo de caracteres está anotado contra el límite **con su fecha de verificación**
- [ ] 🛑 **Ningún límite fue inventado** — los no verificados están marcados `⚠️ SIN VERIFICAR`
- [ ] Los hashtags son **3-5 en Instagram** y están relacionados con la pieza
- [ ] 🛑 **Ningún hashtag afirma alcance** sin dato que lo respalde
- [ ] **Alt text escrito** en toda pieza con imagen, describiendo lo que se ve y el texto en pantalla
- [ ] Está anotado **qué se cambió respecto de ④ y por qué** — o que no se cambió nada
- [ ] Lo que no entraba sin romperse se **devolvió a ④** con motivo 5 y **dos alternativas**
- [ ] El caption respeta el **tono de voz y los do's & don'ts** de ②B
