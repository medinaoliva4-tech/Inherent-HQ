# Composición y Jerarquía Visual

La capa D3. Se compone **en gris**: si la pieza no funciona sin color, el color la está salvando.

> **La composición lo sostiene todo.** Podés tener buena tipografía, buenos colores, buenas imágenes
> y buenos recursos. Si la composición está mal, el diseño completo se cae.

---

## De dónde viene la jerarquía

```
Creative define la jerarquía del MENSAJE  →  qué se dice, qué se lee primero, cuál es el goal
Diseño resuelve la jerarquía VISUAL       →  cómo se logra que efectivamente se lea primero
```

🛑 **Diseño no reordena los niveles del brief.** Si el nivel 1 de Creative no entra en el formato o
no funciona, se **propone la alternativa y se pregunta** — no se cambia en silencio.

---

## Jerarquía — la regla de 3 niveles

| Nivel | Qué es | Cuánto pesa |
|---|---|---|
| **1** | El mensaje único de Creative. Lo que se lee en 1,5 segundos | Dominante — ≥2x el nivel 2 |
| **2** | El contexto que hace entendible al 1 | Secundario y claramente menor |
| **3** | La firma, el CTA, el dato chico, el logo | Presente pero nunca compitiendo |

**Si el brief no trae los tres, la pieza está mal briefeada.** Se devuelve a Creative.
**Si hay cuatro elementos peleando por el nivel 1, no hay jerarquía** — hay ruido.

### Componer es decidir con intención
No se trata de poner elementos "donde se vean lindos". Antes de mover nada:
```
¿Qué elemento debe verse primero?   ¿Cuál acompaña?   ¿Cuál es secundario?
¿Dónde necesita descansar el ojo?   ¿Qué estoy intentando comunicar?
```
A veces algo queda bien por casualidad. **No dependas de eso.**

### Cómo se construye peso visual
Un elemento pesa por **tamaño × contraste × área × posición**. Para que el nivel 1 domine,
necesita ganar en **al menos dos** de esas cuatro. Ganar solo en tamaño no alcanza.

---

## Las 6 decisiones de composición

### 1 · Grilla
Todo se alinea. Los márgenes de la grilla **no se negocian pieza por pieza** — si una pieza necesita
romper el margen, es una decisión del sistema y vale para todo el lote.

### 2 · Punto focal
**Uno solo.** Se ubica en un cruce de tercios o en el centro óptico (ligeramente arriba del centro
geométrico). El centro geométrico exacto es la opción por default de quien no eligió.

### 3 · Peso visual
El nivel 1 pesa ≥2x el nivel 2. Se verifica en gris y en miniatura, no en la mente.

### 4 · Aire
Mínimo **8% del alto del formato** como margen en el borde donde hay texto. El aire no es espacio
desperdiciado: es lo que hace que el nivel 1 se lea.

### 5 · Dirección de lectura
Se **declara** cuál se está usando:
- **Z** — piezas con poco texto y un foco visual fuerte (Hero)
- **F** — piezas con texto denso, listas, pasos (Utility, Proof)
- **Vertical centrada** — piezas tipográficas puras, stories

### 6 · Contención
Nada toca el borde salvo que sea una decisión del sistema, consistente en todo el lote
(ej: foto a sangre en todas las piezas Hero).

---

## Componentes de pieza — la biblioteca de D0.7

3-8 componentes cubren el 80% de las piezas. **No son componentes de UI** — ver
`brain/COMPONENTES-SOCIAL.md`. Patrones que funcionan en social:

| Layout | Estructura | Para qué función |
|---|---|---|
| **Titular pleno** | Tipografía dominante sobre color plano o textura | Hero · gancho · frase |
| **Foto + bloque** | Foto arriba o a sangre, bloque sólido con texto abajo | Proof · Series |
| **Foto + scrim** | Foto a sangre, texto sobre scrim | Hero · Community |
| **Split** | Mitad foto / mitad color | Proof · Utility |
| **Lista** | Bloque con 3-5 ítems, numerados o con viñeta gráfica | Utility · Educativo |
| **Sticker central** | Asset PNG recortado dominante sobre fondo simple | Producto · Conversion |

Cada componente se construye **una vez** en Figwright, con `VARIANTS` por formato, y cada pieza es
una instancia con overrides (D5). Cada uno lleva su ficha: cuándo usarlo · variantes · qué acepta ·
reglas · 🛑 cuándo NO usarlo.

---

## Ritmo de carrusel

Un carrusel no es N piezas: es **una pieza con desarrollo**.

```
S01  PORTADA     El gancho. Carga el 80% del trabajo. Si no funciona sola, el carrusel murió
S02  ENTRADA     Baja la promesa a concreto
S03-Sn DESARROLLO Un punto por slide. Mismo layout, distinto contenido
Sn-1 QUIEBRE     Cambia el layout. Rompe la inercia antes del cierre
Sn   CIERRE/CTA  Una sola acción. Inequívoca
```

**Continuidad obligatoria:** un elemento que cruza de slide a slide (una línea, un color, una forma,
una numeración). Sin continuidad no hay carrusel, hay piezas sueltas en una fila.

---

## Los dos tests de cierre de D3

```
TEST MINIATURA   Reducir al 10%. ¿Se entiende de qué se trata?        → SÍ / NO
TEST GRIS        En escala de grises. ¿Sigue habiendo jerarquía?      → SÍ / NO
```

**Dos NO = volver a D2 y cambiar el layout.** No se arregla en D4 con overlays.

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Todo centrado, todo del mismo tamaño | Sin jerarquía no hay lectura; el ojo no sabe dónde empezar | Elegir el nivel 1 y darle ≥2x de peso |
| Texto encima de la cara de la foto | Compite con el punto focal natural | Reencuadrar la foto o reservar zona de aire en la grilla |
| Márgenes distintos en cada pieza del lote | El lote no se lee como familia | Margen por token, fijo por formato |
| Titular de 14 palabras | No se lee en 1,5 s | Cortar a ≤8 palabras o pasarlo a nivel 2 |
| Punto focal en el centro geométrico por default | Lectura plana, sin tensión | Tercios o centro óptico, elegido |
| Carrusel sin quiebre | Inercia; se abandona antes del CTA | Cambiar layout en la penúltima slide |
