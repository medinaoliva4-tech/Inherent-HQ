# 08 · Elementos gráficos superpuestos
`Capa 5 · columna: elementos_graficos`

**Qué decide.** Qué se le **agrega encima** a la pieza además del material fotográfico o filmado:
las capas gráficas que hacen que un video crudo o una foto de producto se vean como la marca.

> 🛑 **Esta ficha es la frontera con ⑥A Diseño gráfico.** Creatividad **pide por nombre** qué
> elementos lleva la pieza y por qué. Diseño **los crea, los elige del banco y los aplica**, y decide
> el tamaño, la posición fina y el acabado. Si la fila dice *"algo que se vea lindo arriba"*, la
> frontera se rompió: Diseño va a tener que inventar la intención.

---

## La taxonomía — 4 familias, cerradas

Todo elemento gráfico cae en una de estas cuatro. **No se inventan familias nuevas**: si algo no
entra en ninguna, es porque es composición o tipografía, y eso es decisión de Diseño.

| Familia | Qué es | Ejemplos | Cuándo la pide Creatividad |
|---|---|---|---|
| **① Ilustraciones** | Dibujo hecho a mano o vectorial, no fotográfico | Trazos, iconos ilustrados, doodles, subrayados a mano, garabatos, flechas dibujadas | Cuando la pieza necesita **calidez o humor** y la foto sola sale fría. También para señalar sin tapar |
| **② Assets PNG** | Imagen recortada sin fondo, que se pega encima | Stickers, sellos, recortes de producto, badges, cintas, etiquetas de precio | Cuando hay que **destacar un objeto o un dato** sin rehacer la toma |
| **③ Texturas** | Capa de material que cubre total o parcialmente | Papel, grano, polvo, tela, pinceladas, brochas, manchas de tinta | Cuando la pieza necesita **época, oficio o imperfección** — lo opuesto a lo corporativo limpio |
| **④ Formas gráficas** | Geometría pura, generalmente del sistema de marca | Círculos, líneas, flechas, marcos, barras, bloques de color, contenedores | Cuando hay que **ordenar la lectura**: separar, encuadrar, dirigir el ojo |

---

## Cómo se escribe en la columna `elementos_graficos`

El formato es **familia + qué + para qué**, separados por `·`. Una línea por elemento.

```
② sello "agotado" sobre el producto · marca la escasez sin decirla en el copy
④ marco fino en el tercio inferior · contiene el precio y lo separa de la foto
③ grano de papel al 12% sobre toda la pieza · le saca el brillo de render
```

**Si la pieza no lleva ninguno:** se escribe `ninguno` **y por qué**. `ninguno · la foto ya tiene
demasiada información y cualquier capa compite` es un entregable. Una celda vacía no.

---

## Reglas duras

1. **Una familia por función, no por gusto.** Si dos elementos hacen lo mismo (un círculo y una
   flecha señalando lo mismo), uno sobra. Vale la regla general: **1 foco visual por pieza**.
2. **Máximo 3 elementos por pieza.** A partir del cuarto, la pieza ya no tiene jerarquía: tiene
   ruido. Si hacen falta más, el problema está en el concepto, no en la capa gráfica.
3. **Del banco antes que nuevo.** Si ②B Branding tiene el asset en su banco, se pide **ese**. Pedir
   uno nuevo cuando ya existe uno equivalente multiplica versiones de lo mismo.
4. **Nunca se especifica el color exacto ni la tipografía.** Eso es de ②B Branding y lo aplica ⑥A
   Diseño. Creatividad dice *"acento de marca"*, no un código hexadecimal.
5. **Nunca se especifica tamaño en píxeles ni posición en coordenadas.** Se dice la **zona**
   (tercio superior, esquina inferior, sobre el producto). El resto lo resuelve Diseño.
6. **Lo que tapa, se declara.** Si un elemento va encima de algo que importa, la fila dice qué puede
   taparse y qué no. Es lo que más se corrige tarde.

---

## Ejemplo trabajado

**Fila C-002** — carrusel, función Proof, `goal_del_arte = confianza`, objeción #1.

| Paso | Decisión |
|---|---|
| **Qué tiene que pasar** | Que la objeción se lea como una cita real de alguien, no como copy de marca |
| **Familia elegida** | ① Ilustraciones — comillas dibujadas a mano, no tipográficas |
| **Segundo elemento** | ④ Forma gráfica — línea fina bajo cada objeción, separa una de otra |
| **Descartado** | ③ Textura de papel: sumaba "artesanal" y la pieza necesita **credibilidad**, no calidez |
| **Celda final** | `① comillas a mano al inicio de cada objeción · la vuelven testimonio y no claim`<br>`④ línea fina entre objeciones · separa sin cajas, que agregarían peso` |

---

## Anti-patterns

| Error | Por qué falla | Qué hacer |
|---|---|---|
| *"Elementos gráficos de marca"* | No es una instrucción. Diseño elige a ciegas y después se corrige en revisión | Nombrar familia y función |
| Pedir 5 o 6 elementos "por si acaso" | La pieza pierde foco y Diseño termina decidiendo qué sacar — o sea, decidiendo la intención | Máximo 3, y justificar cada uno |
| Especificar hex, tipografía o tamaño | Se pisa a ②B Branding y a ⑥A Diseño en la misma celda | Zona y función, nada más |
| Repetir el mismo set en todas las filas del ciclo | Deja de ser decisión creativa y pasa a ser plantilla | Si de verdad es igual, se declara como sistema del ciclo una vez |
| Usar una textura para tapar una foto mala | El problema es la foto, y vuelve en la siguiente pieza | Devolver a ⑤ Producción |

---

**Se usa en:** Capa 5 (Forma). **Alimenta:** `elementos_graficos`. **Handoff:** ⑥A Diseño gráfico.
