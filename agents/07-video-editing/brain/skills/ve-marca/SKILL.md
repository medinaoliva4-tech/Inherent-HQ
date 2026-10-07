---
name: ve-marca
description: >
  Capa 2 de ⑥B Video Editing — aplica § Movimiento del sistema visual al corte principal:
  subtítulos con su fuente, tamaño y posición dentro de la safe zone, la entrada de texto en su
  única forma, el layout que ④ definió y el cierre de marca que lleva toda pieza. Es la capa que
  hace que 14 reels se vean de la misma marca. Úsala cuando pidan "ponele subtítulos", "aplicá
  la marca", "el cierre", "los textos en pantalla", "esto no se ve nuestro", "el logo se ve
  gris", "se ve azul", "se ve trabado". Incluye el QA medido (temblor, color, voces) antes de
  derivar. Requiere el corte principal armado.
---

# Capa 2 · Marca — § Movimiento aplicado

| | |
|---|---|
| **Consume** | El corte principal · `sistema-visual.md` **§ Movimiento** y **§ Color/Tipografía** · el layout de `cr-arte-video` · **los assets del kit en el Drive** *(link en `clients/<cliente>/02-marca/kit-de-redes/kit.md`)* — **los archivos de marca se usan si existen; no bloquean** |
| **Produce** | El corte principal **terminado y de marca**, listo para derivar |
| **Herramientas** | `motor/remotion/src/` (`brand.ts`, `components/type.tsx`, `endcard.tsx`) · `scripts/review.py` · `jitter_all.py` · `colorstats.py` · `finish_audio.sh` |

> **Los assets salen de la guía del cliente**: logos en SVG y fuentes del Figma de marca (con
> Figwright, `save_screenshots`/export SVG), a `public/brand/`. Los colores y fuentes se escriben
> **una vez** en `src/brand.ts`; ningún componente lleva un color suelto.

> 🔑 **Esta es la capa que hace que 14 reels distintos se vean de la misma marca.**
>
> **Logos, tipografías y elementos gráficos se toman del Drive del cliente, no de Figma.** No hace
> falta Figma para editar.

## 1 · Los subtítulos

**No son un extra: el 85% ve sin sonido.**

| | Regla |
|---|---|
| **Fuente, peso y tamaño** | Los de `sistema-visual.md`. **No los de la app de edición** |
| **Posición** | Dentro de la **safe zone** del formato. Nunca bajo la UI de la plataforma |
| **Fondo** | Como lo define ②B. Si no hay, se verifica contraste contra el video real |
| **Ritmo** | Una idea por tarjeta. **Nunca el párrafo entero** |
| **Ortografía** | Se revisa. Un subtítulo con error es un error en todas las copias |

🛑 **Los subtítulos automáticos no se publican sin revisar.** Transcriben mal los nombres propios
y los términos del cliente, que es justo lo que más importa.

## 2 · La entrada de texto

**Una sola forma, la que ②B definió.**

🛑 **Cinco animaciones distintas en un ciclo es ninguna.** La repetición es lo que vuelve
reconocible el movimiento.

**Si ②B todavía no la definió** (guía sin § Movimiento), el motor trae estas; se elige **una por
función** y se mantiene todo el ciclo:

| Función | Estilo | Entrada (fija) |
|---|---|---|
| Titular | Display de la marca, mayúsculas | **Revelado por líneas**: cada línea sube desde su máscara |
| Etiqueta (nombre del plato, dato) | **Píldora** del color claro | Se abre de izquierda a derecha |
| Remate / frase de cierre | Serif cursiva | **Suave**: fundido con leve desenfoque |
| Antetítulo | Kicker con filete | Filete que crece + texto suave |

| Detalle que sí se nota | Regla |
|---|---|
| **Tildes y descendentes** | La máscara del revelado tiene margen (≈ 0.34 em arriba). Una Í o Ó cortada es error de marca |
| **Velo detrás del texto** | Degradado del color oscuro **que entra y sale con el texto**. Nunca una franja oscura fija |
| **Un texto que acompaña varias escenas** | Se sostiene (`span`), no se repite escena por escena |
| **Salida** | Todo texto sale antes del cambio de escena (≈ 16 frames antes) |

## 3 · El layout

**④ lo definió en `cr-arte-video`: dónde va cada texto.** Acá se ejecuta.

| | |
|---|---|
| **Jerarquía** | Qué se lee primero, con el peso de `sistema-visual.md` |
| **Un foco visual** | Si todo resalta, nada resalta |
| **Elementos gráficos** | Solo los del vocabulario cerrado de ②B |
| **Sobre el doble cuadro** | El texto va **sobre la línea** o en la mitad que no tiene el detalle |
| **Primer frame** | El texto de arriba baja para dejarle lugar al logo; no compiten |

## 4 · El cierre de marca

**Toda pieza de video termina igual.** Es activo distintivo.

| | |
|---|---|
| **Qué es** | Lo que define `sistema-visual.md` § Movimiento |
| **Cuánto dura** | Corto. El cierre no es media pieza |
| **Dónde** | Al final, **después del CTA** — nunca antes |

## 5 · El activo del primer frame

**Se verifica que siga ahí después de aplicar todo.** Es el error más común: se aplica el layout
y el activo queda tapado.

| Regla del logo *(cliente real, oct 2026)* | |
|---|---|
| **Dónde** | Centrado arriba, **debajo de la barra superior** de Instagram/TikTok (≈ 200 px de 2560) |
| **Cómo** | **Al 100 %**, entra en ≤ 10 frames, sin desenfoque ni sombra. Sale con la primera escena |
| **Capa** | **Por encima de los velos.** Si un velo queda encima, el logo se ve gris — fue un error real |
| **Variante** | La que la guía define para ir sobre foto (en AKAI: logo claro en píldora) |

## 6 · El QA medido — antes de mostrar nada

**Los problemas que el cliente nota primero son de movimiento, color y sonido. Se miden; no se
deciden a ojo ni con un filtro general.**

| Qué | Cómo | Regla |
|---|---|---|
| **Hoja de revisión** | `review.py` — un fotograma cada 0.5 s del render | Claude la mira entera antes de entregar: textos cortados, logo, saltos, tomas repetidas |
| **Temblor** | `jitter_all.py` compara original vs estabilizado por tramo | **Se estabiliza solo si mide mejor.** 🛑 El estabilizador sigue las manos, no el fondo: en tomas con manos u objetos en movimiento empeora y se ve «trabado». Si una toma tiembla mucho aun en original, **se reemplaza** |
| **Color** | `colorstats.py` mide temperatura (b\*) y brillo (L\*) de las zonas neutras de **cada toma** | Se corrige **toma por toma**, solo las que se desvían (p. ej. mesas que salen azules). Preferir el **original + un toque de temperatura** (`colortemperature`). 🛑 Ni filtro global ni «neutralizar» canal por canal: el cliente lo vio peor |
| **Voces del equipo** | Espectrograma del audio; `finish_audio.sh` silencia los tramos y normaliza a −20 LUFS | Solo si la pieza va con sonido directo. Si la música se pone en la app, la entrega va **sin audio** (`ve-export`) |
| **Texto vs glosario** | El texto en pantalla contra el glosario de voz del cliente (palabras prohibidas) | Si choca, **vuelve a ④**. No se reescribe acá |

> 🔑 **Cada medición queda escrita en el guion de montaje** (`grade`, modo de estabilización por
> toma). Así la siguiente ronda no la deshace.

## 7 · La auto-revisión contra ②B

**Antes de derivar se corre el checklist del guardián sobre la propia pieza:**

- [ ] ¿Un solo acento de color?
- [ ] ¿Las tipografías son las del sistema, con su peso?
- [ ] ¿Todo el texto dentro de las safe zones?
- [ ] ¿Los activos distintivos que el formato exige?
- [ ] ¿Activo en el primer frame?
- [ ] **Logo tapado: ¿se reconoce la marca?**
- [ ] ¿El logo está al 100 %, por encima de los velos?

> 🔑 **Auto-revisarse acá es más barato que que lo devuelva `br-guardian` después de derivar.**

## 8 · Antes de derivar

**El corte principal no para a pedir aprobación:** con el QA medido (§6), la auto-revisión (§7) y
el checklist de §9 completos, pasa a `ve-derivadas`.

🛑 **De este corte salen todas las derivadas.** Dejarlo flojo multiplica el error por 3.

## 9 · Checklist

- [ ] Subtítulos con la **fuente del sistema**, dentro de la safe zone
- [ ] Los subtítulos automáticos **se revisaron**
- [ ] **Una sola forma** de entrada de texto en todo el ciclo
- [ ] El layout es el que ④ definió
- [ ] **Un solo foco visual** por momento
- [ ] El **cierre de marca** está, después del CTA
- [ ] El **activo del primer frame** sigue visible
- [ ] Pasa la **prueba del logo tapado**
- [ ] **QA medido**: hoja de revisión vista, temblor y color medidos por toma, sin voces del equipo
- [ ] Ninguna tilde cortada; ningún velo fijo
