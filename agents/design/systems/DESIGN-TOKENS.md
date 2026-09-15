# Design Tokens — cómo se traduce una guía de marca a valores operables

Una guía de marca es un documento de lectura. Un sistema de tokens es un conjunto de **valores
nombrados** que se usan igual en Figma, en el brief y en el QA. Este archivo dice cómo se hace la
traducción.

---

## Regla base

**Un token = un valor + un nombre + un uso + un anti-uso.**

Sin el anti-uso, el token se usa mal. El anti-uso es lo que evita que el sistema se degrade en
tres lotes.

```
color/marca/primario   #XXXXXX   Fondo de piezas Hero y Conversion
                                 🛑 NO usar como color de texto sobre fondo claro (ratio 2.1:1)
```

---

## Las 6 familias de token

| Familia | Prefijo | Qué contiene |
|---|---|---|
| **Color** | `color/` | Marca, neutros, semánticos, scrims |
| **Tipografía** | `type/` | Familia, peso, tamaño, interlineado, tracking |
| **Espaciado** | `space/` | La escala de aire y gaps |
| **Radio** | `radius/` | Esquinas de bloques, botones, marcos |
| **Sombra** | `shadow/` | Elevación de stickers y bloques flotantes |
| **Borde** | `stroke/` | Grosor de marcos, líneas y subrayados |

---

## Color

### Estructura de nombres
```
color/marca/<nombre>          los colores propios de la marca
color/neutro/<0-900>          la escala de grises/neutros
color/texto/<rol>             primario · secundario · inverso · sobre-foto
color/fondo/<rol>             base · alterno · oscuro · sobre-foto
color/scrim/<intensidad>      las capas de oscurecimiento sobre foto
```

### Scrims — obligatorio definirlos en D0
Un scrim es una capa entre la foto y el texto. Sin scrims definidos, cada diseñador inventa el suyo
y el lote pierde familia.

| Token | Qué es | Cuándo |
|---|---|---|
| `color/scrim/suave` | Negro 30-40% o degradado | Foto oscura, texto chico |
| `color/scrim/medio` | Negro 50-60% | Foto media, titular |
| `color/scrim/fuerte` | Negro 70%+ o bloque sólido | Foto clara o muy ruidosa |
| `color/scrim/degradado` | De transparente a opaco | Texto al pie o al tope |

**Regla:** el scrim se elige por el **ratio medido**, no por gusto. Ver `COLOR-Y-CONTRASTE.md`.

---

## Espaciado

Escala geométrica, no arbitraria. Base recomendada para social: **múltiplos de 8 sobre 1080px**.

```
space/100 = 8     space/200 = 16    space/300 = 24    space/400 = 32
space/500 = 48    space/600 = 64    space/700 = 96    space/800 = 128
```

**Márgenes de pieza** se declaran como token propio por formato, no se improvisan:
`space/margen/feed` · `space/margen/story` · `space/margen/carrusel`.

---

## Cómo se completa el token en D0

Por cada token:

| Campo | Obligatorio | Ejemplo |
|---|---|---|
| Nombre | ✅ | `color/texto/sobre-foto` |
| Valor | ✅ | `#FFFFFF` |
| Origen | ✅ | `Guía de marca p.12` o `⚠️ FUERA DE GUÍA — propuesta` |
| Uso | ✅ | Titulares sobre imagen con scrim medio o fuerte |
| Anti-uso | ✅ | 🛑 Nunca sin scrim. Ratio sobre foto clara: 1.4:1 |

**Todo token sin origen en la guía sale marcado `⚠️ FUERA DE GUÍA — propuesta`** y necesita gate.

---

## Anti-patrones de tokens

| Escenario | Por qué falla | En cambio |
|---|---|---|
| Token nombrado por su valor (`color/azul`) | Cuando la marca cambia de azul, el nombre miente | Nombrar por rol (`color/marca/primario`) |
| Escala de 12 tamaños tipográficos | Nadie la respeta; el lote pierde familia | Máx. 4 por formato |
| Un solo scrim para todas las fotos | Falla en el 40% de las fotos | 3-4 scrims por intensidad, elegidos por ratio |
| Tokens definidos pero no enlazados en Figma | El sistema existe en el .md y no en el archivo | Variables de Figma enlazadas, nunca hex literal |
| Espaciado ad-hoc ("acá le pongo 22px") | Destruye el ritmo del lote | Redondear al token más cercano de la escala |
