# Sistema visual — Cerantola

> **El documento que abren ⑥A Diseño gráfico y ⑦ Video Editing para ejecutar.**
> Todo acá son **valores**, no adjetivos. Si hace falta criterio, la regla está mal escrita.
> El entendimiento vive en `guia-de-marca.md`. El diseño, en la página **«Cerantola»** del Figma
> de branding *(link en `00-onboarding/LINKS.md`)*.
> Los valores salen de los referentes visuales que eligió el CEO. De Cerantola quedan el naranja y el logo.

---

## § De dónde sale

| Referente | Qué se toma |
|---|---|
| **Rockwell Group** | La foto a sangre, de noche y con vida. Sin bandas ni texto encima: solo el logo |
| **HBA** | La calma, el aire y las etiquetas chicas |
| **idX** | El formato de noticia: titulares grandes y las cifras al frente |
| **Foliot** | Tipografía enorme, sectores claros y la marca en cada pieza |

---

## § Color

| Rol | Nombre | Hex | Dónde se usa | Dónde NO |
|---|---|---|---|---|
| **Principal** | **Negro mate** | `#262523` | Fondos de casi todas las piezas | — |
| **Contraste** | Negro | `#000000` | Fotos de noche · fondos de video | Texto |
| **Tinta** | Blanco | `#FFFFFF` | Texto sobre negro · fondo de noticias y cifras | — |
| **Acento** *(uno solo)* | **Naranja Cerantola** | `#C4702A` | Cifras · el botón · un detalle por pieza | Fondos grandes · texto largo |
| **Apoyo** | Gris | `#6C757D` | Etiquetas y texto secundario **sobre blanco** | Texto chico sobre negro mate |

**Sobre negro mate, el texto secundario va en blanco al 60%,** no en gris.

**Contraste verificado:**

| | Contraste | |
|---|---|---|
| Blanco sobre negro mate | 15.3 | ✅ |
| Negro mate sobre blanco | 15.3 | ✅ |
| Gris sobre blanco | 4.7 | ✅ |
| Naranja sobre negro mate | 4.2 | ✅ cifras y títulos grandes |
| Blanco sobre naranja | 3.7 | ✅ solo el botón y el logo |
| Gris sobre negro mate | 3.3 | ❌ nunca en texto chico |

---

## § Tipografía

**Dos familias, gratuitas, en Google Fonts. Sin serif.**

| Familia | Para qué | Pesos |
|---|---|---|
| **Inter Tight** | Títulos y cifras | Medium 500 · SemiBold 600 |
| **Inter** | Texto, etiquetas y botones | Light 300 · Regular 400 · Medium 500 |

### La escala
*Tamaño en px / interlineado · espaciado entre letras*

| Nivel | Fuente | Tamaño | Espaciado |
|---|---|---|---|
| **Display** | Inter Tight Medium | 120 / 90% | −3.5% |
| **Título 1** | Inter Tight Medium | 88 / 95% | −3.5% |
| **Título 2** | Inter Tight Medium | 56 / 100% | −3% |
| **Título 3** | Inter Tight Medium | 32 / 110% | −2% |
| **Cifra** | Inter Tight Medium, **naranja** | 72 / 100% | −3% |
| **Texto** | Inter Light | 18–22 / 150% | 0 |
| **Etiqueta** | Inter Medium, mayúsculas | 13 / 130% | +12% |
| **Botón** | Inter Medium | 15 / 100% | 0 |

### Las combinaciones
| | Combinación |
|---|---|
| **01 · Titular + texto** | Inter Tight Medium 56 + Inter Light 18 |
| **02 · Etiqueta + titular** | Inter Medium 13 en mayúsculas + Inter Tight Medium 44 |
| **03 · Cifra + etiqueta** | Inter Tight Medium 72 en naranja + Inter Regular 15 |
| **04 · Menú + botón** | Inter Medium 15 · botón blanco sobre naranja, esquinas rectas |

- **La Avant Garde de la web** queda solo en el logo.
- **Alternativa web-safe:** Arial.

---

## § Logo

**El de la web** *(cerantola.webflow.io)*. Los archivos están en `logos/`.

| Versión | Archivo | Dónde |
|---|---|---|
| **Blanco sobre negro mate** *(el principal)* | `logo-blanco.svg` | Casi todas las piezas |
| Negro mate sobre blanco | `logo-negro-mate.svg` | Noticias y documentos |
| Naranja sobre negro mate | `logo-naranja.svg` | Un acento, nunca junto a otra cifra naranja |
| Blanco sobre naranja | `logo-blanco.svg` | Solo en bloques naranja chicos |

## § Composición

| | |
|---|---|
| **Grilla** | 12 columnas en la presentación y la web · 6 columnas en redes · canaleta de 2% del lado largo |
| **Márgenes** | 7% del lado corto |
| **Safe zones** | Reel y story: nada en el 14% de arriba, el 22% de abajo ni el 12% derecho · Post: márgenes de 7% |
| **Jerarquía** | 1° la imagen · 2° el título · 3° el dato · 4° el cuerpo |
| **Densidad** | Mínimo 50% de espacio vacío |
| **Formas** | Esquinas rectas siempre *(0 px)* · línea fina de 1 px · **un círculo como máximo** por pieza, de 1 px, en blanco o naranja |

---

## § Imagen

**Ruta principal:** fotografía.

| | |
|---|---|
| **Luz** | Cálida, 2700–3200 K. Interior encendido u hora dorada |
| **Encuadre** | A la altura de los ojos o un poco más bajo. **Las líneas verticales siempre rectas** |
| **Qué se ve** | Siempre el espacio terminado. La obra solo aparece como «antes» en los casos |
| **Gente** | De 1 a 3 personas, naturales, nunca mirando a cámara. Se permite el movimiento desenfocado |
| **Macro** | Una de cada 4 fotos es un detalle de acabado: una unión de madera, un borde de piedra |
| **Color** | Negros profundos, tonos cálidos, saturación −10%. **Un solo filtro para todas** |
| **Qué nunca** | Renders · obra con casco · fotos de celular sin retoque · logos de clientes dominando la foto |

### El retoque con IA
| ✅ Se cambia | ❌ Nunca se cambia |
|---|---|
| Luz · cielo · limpieza *(cables, cajas, basura)* · perspectiva · gente y ambiente · calidad de la imagen | La forma · los materiales · los acabados · el mobiliario |

**Herramienta:** Higgsfield *(conectada)*. **Cómo se sostiene:** las fotos actuales retocadas hoy;
⑤ Producción graba en Guatemala con este mismo estilo. El tablero de Pinterest afina estas reglas.

---

## § Movimiento
*Para ⑦ Video Editing*

| | |
|---|---|
| **Cómo entra el texto** | Fundido y sube 8 px en 0.4 s. Siempre igual |
| **Ritmo** | Planos sostenidos de 2 a 4 s. Cámara lenta *(dolly o gimbal)*. Sin cortes rápidos |
| **Subtítulos** | Inter Regular, 40 px, blanco, centrados, dentro de la safe zone |
| **El cierre** | La toma firma *(luces que se encienden o puerta que se abre)* → negro mate → logo blanco, 2 s |

---

## § Qué está prohibido

- Dos acentos.
- El naranja en fondos grandes o en texto largo.
- El gris en texto chico sobre negro mate.
- Degradados.
- Esquinas redondeadas.
- Emojis.
- Fotos de celular sin retoque.
- Renders.
- El muro de logos en la portada.
- Una tercera tipografía.
