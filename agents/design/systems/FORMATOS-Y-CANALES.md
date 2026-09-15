# Formatos y Canales

Specs, grillas y safe areas por formato y canal.

> ⚠️ **Las specs de plataforma cambian.** Esta tabla es referencia operativa, no verdad permanente.
> **Última verificación: 2026-09-13.** Antes de un lote nuevo o de un formato que no se usó antes,
> verificar contra la documentación oficial de Meta y actualizar acá con la fecha.
> Marcado 🟡 = señal a confirmar, siguiendo la convención del repo.

---

## Specs por formato

| Formato | Ratio | Lienzo | Canales | Uso |
|---|---|---|---|---|
| **Feed vertical** | 4:5 | 1080 × 1350 | IG · FB | El que más pantalla ocupa en feed. **Default** |
| **Feed cuadrado** | 1:1 | 1080 × 1080 | IG · FB | Cuando el arte lo pide o hay reuso en grilla de perfil |
| **Feed horizontal** | 1.91:1 | 1080 × 566 | FB | Poco recomendable en móvil — solo si el canal lo exige |
| **Post FB clásico** | 1.91:1 | 1200 × 630 | FB | El lienzo tradicional de post/link de Facebook 🟡 |
| **Story** | 9:16 | 1080 × 1920 | IG · FB | Efímero, alta frecuencia, bajo texto |
| **Carrusel** | 4:5 o 1:1 | Igual en todas las slides | IG · FB | Desarrollo, educación, prueba |

**Regla:** todas las slides de un carrusel comparten **el mismo ratio**. Mezclar 1:1 y 4:5 en un
carrusel produce recortes al deslizar.

🟡 **Cantidad de slides:** el máximo por carrusel ha ido cambiando en Instagram. **Verificar antes
de armar un carrusel de más de 10 slides.** Recomendación de diseño independiente de la plataforma:
**5-8 slides**. Más de 10 y la tasa de llegada al cierre cae.

---

## Carrusel seamless — la matemática

Un carrusel continuo es **una sola composición larga** partida en slides, no N piezas separadas.

```
Ancho total = ancho_slide × N       Alto total = alto_slide

6 slides 1:1   → 6480 × 1080     guías en 0 · 1080 · 2160 · 3240 · 4320 · 5400
5 slides 4:5   → 5400 × 1350     guías en 0 · 1080 · 2160 · 3240 · 4320
```

**La regla que hace que funcione:** las formas y las imágenes **cruzan** las guías. Si todo termina
justo en el corte, se pierde el seamless y se lee como piezas sueltas.

Construcción paso a paso en `playbooks/FIGWRIGHT-PLAYBOOK.md` §4.

---

## Escala de espaciado en social

En un lienzo de 1080px, una escala de tres pasos alcanza para el 90% de las piezas:

| Paso | Valor sugerido | Para qué |
|---|---|---|
| **Grande** | ~96 px | Entre bloques de jerarquía distinta |
| **Medio** | ~80 px | Entre elementos del mismo bloque |
| **Chico** | ~24 px | Entre líneas de un mismo elemento |

🛑 **No mezcles medidas al azar.** Un espaciado de 22px "porque quedaba bien" rompe el ritmo del
lote entero. Se redondea al token más cercano de la escala de D0.1.

---

## Safe areas — Story (9:16, 1080 × 1920)

La UI del canal (nombre de cuenta, barra de respuesta, stickers, indicadores de progreso) **tapa
los extremos**. Nada crítico va ahí.

```
┌─────────────────────────┐  0
│      ZONA TAPADA        │  ← ~250 px · avatar, nombre, progreso
├─────────────────────────┤  250
│                         │
│                         │
│      ZONA SEGURA        │  ← 250–1500 px · todo lo crítico vive acá
│                         │     texto · logo · CTA · caras
│                         │
├─────────────────────────┤  1500
│      ZONA TAPADA        │  ← ~420 px · barra de respuesta, link, stickers
└─────────────────────────┘  1920
```

🟡 **Los valores son conservadores a propósito.** La UI real varía por app, versión, formato
(Story vs Reel) y si es orgánico o pauta. Diseñar al margen conservador cuesta poco; que el CTA
quede tapado cuesta la pieza.

**Regla del CTA en Story:** vive **arriba** del safe inferior, o va como sticker nativo del canal
(no dibujado en la pieza). Un CTA dibujado en los últimos 420px es un CTA perdido.

---

## Safe areas — Feed

El feed no tapa la pieza, pero:

| Consideración | Regla |
|---|---|
| **Recorte de la grilla de perfil** | Instagram muestra el perfil en cuadrado — una pieza 4:5 se recorta al centro. Nada crítico en el 12,5% superior ni inferior si la pieza tiene que sobrevivir la grilla |
| **Miniatura del feed** | El scroll rápido muestra ~1/3 de la pieza. El nivel 1 vive en el tercio superior o en el centro |
| **Borde de la pieza** | Márgenes ≥ `space/margen/feed`. Texto pegado al borde se ve cortado en algunas vistas |

---

## Carrusel — reglas de formato

| Regla | Por qué |
|---|---|
| Mismo ratio en todas las slides | Evita recortes al deslizar |
| Portada autosuficiente | Es lo único que ve quien no desliza |
| Continuidad visual entre slides | Un elemento que cruza: línea, color, numeración |
| Numeración visible (`1/7`) | Da expectativa de recorrido y sube el swipe |
| Quiebre de layout en la penúltima | Rompe la inercia antes del CTA |
| CTA en la última, uno solo | Dos CTAs = ninguno |

---

## Diferencias por canal

| | Instagram | Facebook |
|---|---|---|
| Formato dominante | 4:5 vertical | 4:5 / 1:1 |
| Audiencia típica | Más joven, más visual | Más amplia, más texto tolerado |
| Densidad de texto en pieza | Baja — el copy vive en el caption | Media — el texto en pieza rinde más |
| Story | Alta frecuencia, muy efímero | Menor alcance orgánico |
| Grilla de perfil | Sí — importa cómo se ve el lote junto | No aplica |

**Regla de reuso:** una pieza de IG **no se sube igual a FB sin revisar**. Como mínimo se revisa
densidad de texto y encuadre. Se marca en el lote si la pieza es de reuso directo o adaptada.

---

## Pauta — qué cambia

| Regla | Detalle |
|---|---|
| **Densidad de texto** | 🟡 Meta discontinuó el rechazo automático por más de 20% de texto en la imagen. La recomendación de **baja densidad** sigue vigente como guía de rendimiento, no como regla de aprobación. **Verificar la política vigente antes de cada campaña.** |
| **CTA inequívoco** | Uno solo, claro, en el safe area |
| **Nada que imite UI nativa** | Botones falsos de "play", "me gusta" o barras de progreso dibujadas → rechazo |
| **Legibilidad en miniatura** | La pauta se ve más chica y más comprimida que lo orgánico |
| **Marcado en el lote** | Las piezas de pauta van marcadas en `lote-de-piezas.csv` y listadas aparte en `entrega.md` |

---

## Grillas por formato — qué se define en D0

Por cada formato activo del cliente:

| Campo | Ejemplo |
|---|---|
| Lienzo | 1080 × 1350 |
| Margen | `space/margen/feed` = 64 px |
| Columnas | 6 · gutter 24 px |
| Safe area | N/A en feed · 250/420 en story |
| Zona de nivel 1 | Tercio superior |
| Zona de nivel 3 / firma | Pie, dentro del margen |

---

## Anti-patrones

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Escalar el 4:5 a 9:16 | Rompe márgenes, safe areas y jerarquía | Recomponer en la grilla del formato destino |
| CTA en el pie de una Story | Lo tapa la barra de respuesta | Arriba del safe inferior, o sticker nativo |
| Carrusel con ratios mezclados | Recortes al deslizar | Un solo ratio por carrusel |
| Subir la pieza de IG a FB sin revisar | Distinta audiencia, distinta tolerancia a texto | Revisar densidad y encuadre; marcar en el lote |
| Diseñar 6 slides sueltas para un carrusel continuo | No hay continuidad y editar es imposible | Lienzo largo → componente → recortes |
| Cortar todos los elementos justo sobre la guía del seamless | Se pierde el efecto | Que crucen la guía |
| Espaciados ad-hoc por pieza | Destruye el ritmo del lote | La escala de 3 pasos |
| Botón de "play" dibujado en una pieza de pauta | Imita UI nativa → rechazo | CTA tipográfico o botón claramente no-nativo |
| Diseñar al borde exacto del safe area | La UI varía por versión y dispositivo | Margen conservador |
