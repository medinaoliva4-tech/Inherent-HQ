# El Feed y la Grilla

**Un lote no son 40 piezas sueltas: es una secuencia.** Este archivo es lo que evita que un lote
técnicamente correcto se vea plano, repetitivo o desordenado en el perfil real.

Se lee en D1 (al leer el lote), en D4 (al cerrar la ruta visual) y en D7 (pasada 4 del QA).

---

## 1 · La regla base

> **La grilla es un chequeo secundario, no el objetivo.**

La gente también descubre posts sueltos en el feed y en explorar. **Se planifica en orden de
publicación**, y después se mira cómo queda la grilla — no al revés.

🛑 **Nunca prescribas patrones de tablero de ajedrez, sistemas rígidos de 3 columnas ni proporciones
fijas de foto/gráfico** salvo que encajen con la capacidad de producción real del cliente.
Un layout frágil donde un post atrasado rompe todo el feed es un mal diseño.

---

## 2 · Mezcla de contenido ≠ mezcla visual

Son dos ejes distintos y se planifican por separado:

| | Qué es | Ejemplo |
|---|---|---|
| **Mezcla de contenido** | Qué función cumple la pieza | Una reseña es *prueba* |
| **Mezcla visual** | Cómo se ve | Esa reseña puede ser retrato, video, captura o tarjeta tipográfica |

**Consecuencia:** tres piezas de prueba seguidas pueden ser correctas en contenido y desastrosas en
feed si las tres son tarjetas de texto.

---

## 3 · Ritmo visual — las 5 variables que se alternan

Ninguna pieza del lote debería repetir **todas** estas respecto a la anterior:

| Variable | Alternar entre |
|---|---|
| **Encuadre** | Escena amplia · composición media · detalle cerrado |
| **Sujeto** | Persona · producto · lugar · gráfico puro |
| **Color dominante** | Los tonos del sistema, no siempre el mismo |
| **Densidad de texto** | Mucho texto · poco texto · sin texto |
| **Espacio negativo** | Piezas llenas · piezas con mucho aire |

### Regla operativa (D7, pasada 4)
```
🛑 Dos piezas consecutivas NO pueden compartir encuadre + color dominante + densidad de texto.
   Si comparten las tres, se recompone una de las dos o se reordena la secuencia.
```

---

## 4 · Cuándo foto y cuándo gráfico

| Usá **foto o video original** cuando… | Usá **pieza diseñada / tipográfica** cuando… |
|---|---|
| El producto físico genera deseo | Hay una idea genuinamente útil que explicar |
| El lugar, la gente o el oficio generan confianza | Hay un anuncio o una información esencial |
| Hay una transformación que mostrar | Hay una frase de marca fuerte que sostiene sola |

🛑 **La pieza tipográfica no es relleno.** Si está ahí porque no había foto, se marca
`⚠️ ASSET FALTANTE` y se declara — no se disfraza de decisión de diseño.

---

## 5 · Formato según propósito

| Formato | Para qué sirve |
|---|---|
| **Carrusel** | Explicar, comparar, guiar, contar, responder una objeción, caso de estudio |
| **Foto sola** | Deseo, oficio, producto, persona, lugar, hito, prueba visual fuerte |
| **Pieza diseñada sola** | Anuncio corto, frase memorable, información esencial |
| **Story** | Inmediatez, interacción, prueba diaria, disponibilidad, recordatorio, link |
| **Reel** *(no es de Diseño)* | Movimiento, transformación, atmósfera, proceso, personalidad, alcance |

**Regla de altura:** si algo funciona mejor en Story o en destacados que como post permanente,
**decilo**. No todo tiene que ser feed.

---

## 6 · Consistencia sin uniformidad

> **La consistencia viene del tratamiento, no de forzar cada objeto a los colores de marca.**

| ✅ Sí | 🛑 No |
|---|---|
| Paleta chica de trabajo, con lugar para neutros y color fotográfico | Teñir todo de color de marca |
| Roles tipográficos fijos | La misma composición en todas las piezas |
| Tratamiento de foto consistente | Logo en cada pieza "para que se note la marca" |
| Un sistema de portadas reconocible | Portadas idénticas que nadie distingue en el feed |

**El logo no va en todas las piezas** salvo que sea funcionalmente necesario. Lo que hace reconocible
a la marca al 10% es el **activo distintivo** (D0.6), no el logo.

---

## 7 · Legibilidad en miniatura

Las portadas con texto **tienen que leerse a tamaño de miniatura de grilla**. Esto no es una
sugerencia estética: es la condición para que alguien entre al post.

Ver `TEST MINIATURA` en `systems/COMPOSICION-Y-JERARQUIA.md`.

---

## 8 · Accesibilidad — parte del QA, no un extra

```
□ Tipografía legible a tamaño real de teléfono
□ Contraste suficiente, medido (systems/COLOR-Y-CONTRASTE.md)
□ El color no es el único portador de información
□ Texto alternativo útil sugerido para las piezas donde importa
```

---

## 9 · Lo que Diseño NO promete

🛑 **Nunca prometas alcance ni ventas por la estética.**

El resultado depende también de la calidad de la oferta, la distribución, la consistencia y la
medición. Diseño responde por **claridad, jerarquía, marca reconocible y craft** — no por el
rendimiento del negocio. Eso se mide en Analytics y vuelve a Strategy.

---

## 10 · Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Diseñar para que la grilla quede linda | Se sacrifica cada post individual por una vista que casi nadie usa | Planificar en orden de publicación; grilla como chequeo |
| 3 tarjetas de texto seguidas | El feed se ve plano aunque el contenido esté bien | Alternar mezcla **visual**, no solo de contenido |
| Patrón rígido de 3 columnas | Un post atrasado rompe el sistema entero | Ritmo flexible |
| Logo en las 40 piezas | Come jerarquía y no aumenta recordación | Activo distintivo + logo donde hace falta |
| Todo teñido de color de marca | Se ve artificial y mata las fotos | Consistencia por tratamiento |
| Pieza tipográfica porque faltó la foto, sin declararlo | Se acumula deuda invisible | `⚠️ ASSET FALTANTE` en el lote |
