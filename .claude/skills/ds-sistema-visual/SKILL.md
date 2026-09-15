---
name: ds-sistema-visual
description: >
  Capa D0 del método de Diseño — traduce la guía de marca de Branding a un sistema visual operable:
  design tokens (color, tipografía, espaciado, radios, sombras), matriz de contraste medida, escala
  tipográfica, grillas y safe areas por formato, inventario de elementos gráficos, activos
  distintivos y la biblioteca de **componentes de pieza** de social (portada de carrusel, bloque de
  cita, etiqueta, CTA de cierre…), cada uno con su ficha legible para IA. Úsala al arrancar con un
  cliente nuevo en Diseño, cuando pidan "armá el sistema visual de X", "armá la guía de marca de X",
  "no tenemos guía, solo referencias", "pasá la guía de marca a tokens", "qué tipografías y tamaños
  usamos", "qué colores puedo combinar", "armá las grillas", "armá los componentes", o cuando
  cualquier otra capa de Diseño detecte que no existe un sistema previo. Tiene dos modos: **A ·
  Traducción** cuando existe un manual formal, y **B · Construcción** cuando Branding solo entregó
  intel (dirección, inspiraciones, fuentes, material existente) — ahí produce además
  `guia-aplicable.md`, que consumen Diseño, Production y Content. Lo único que no se inventa es la
  dirección: cómo debe verse y cómo debe sentirse.
model: opus
effort: high
---

# D0 · Sistema Visual

Leé `agents/design/METHOD.md` → D0 y los archivos de `agents/design/systems/`.
Plantilla: `agents/design/templates/sistema-visual.md` → copiar a `clients/<cliente>/`.

## Primero: elegí el modo

| Modo | Cuándo | Qué producís |
|---|---|---|
| **A · Traducción** | Existe guía de marca formal | `sistema-visual.md` |
| **B · Construcción** | Solo hay **intel** de Branding | `guia-aplicable.md` **+** `sistema-visual.md` |

**Modo B — input mínimo:**
```
OBLIGATORIO  dirección (cómo debe verse y sentirse)
             + al menos uno de: inspiraciones · fuentes · material existente
FUERTE       posicionamiento.md de Strategy
```
🛑 **Sin dirección: BLOQUEADO.** Es lo único que no se inventa.

**En Modo B el gate es más duro:** todo sale como **propuesta**, y va sección obligatoria
**"Qué decidió Diseño"** con lo que no venía en el intel y su porqué.
Plantilla: `templates/guia-aplicable.md`.

⚠️ Modo B no te convierte en Branding. Construís **a partir del intel**, no en contra de él.

## Regla madre

```
Branding entrega DIRECCIÓN  →  cómo debe verse · cómo debe sentirse · inspiraciones · fuentes
Vos entregás REALIDAD       →  la guía aplicable, los valores concretos y el sistema operable
```

**Branding no te va a dar la opacidad del scrim, el ratio de la escala ni el margen de story.
Resolver eso es el trabajo, no una desviación.**

| ✅ Vos decidís | 🛑 No cambiás |
|---|---|
| Valores de scrim, espaciado, radios, sombras | La paleta base |
| Escala tipográfica, ratios, interlineado, tracking | Las familias tipográficas |
| Grillas, márgenes, safe areas | El logo y su uso |
| Qué componentes existen y cómo se comportan | La estética, el tono y la dirección |

`⚠️ FUERA DE GUÍA` se reserva para lo que **contradice o amplía la dirección** — no para cada valor
concreto que la guía no enumeró.

## Los 7 bloques

| # | Bloque | Referencia |
|---|---|---|
| D0.1 | **Tokens** — color, tipo, espaciado, radio, sombra, borde | `systems/DESIGN-TOKENS.md` |
| D0.2 | **Matriz de contraste** — cada par medido | `systems/COLOR-Y-CONTRASTE.md` |
| D0.3 | **Escala tipográfica** — máx. 4 tamaños por formato | `systems/TIPOGRAFIA.md` |
| D0.4 | **Grillas por formato** — márgenes, columnas, safe areas | `systems/FORMATOS-Y-CANALES.md` |
| D0.5 | **Inventario de elementos gráficos** — las 5 familias | `systems/ELEMENTOS-GRAFICOS.md` |
| D0.6 | **Activos distintivos** — qué se reconoce al 10% sin logo | `posicionamiento.md` de Strategy |
| D0.7 | **Componentes de pieza** — 3-8 que cubran el 80%, con ficha | `brain/COMPONENTES-SOCIAL.md` |

## Cada token lleva 5 campos

`nombre · valor · origen · uso · 🛑 anti-uso`

**Sin el anti-uso, el token se usa mal.** Es lo que evita que el sistema se degrade en tres lotes.

## Tipografía — el filtro que se olvida

🛑 **Una familia sin `ñ`, tildes o signos de apertura (`¿` `¡`) no entra al sistema.** No importa lo
linda que sea. Verificalo con `get_fonts` de Figwright y con el archivo real.

Máx. **2 familias** · máx. **4 tamaños** por formato · contraste de peso **grande**
(`Light`+`Bold`, nunca `Light`+`Regular`) · diseñá al **100% de zoom**.

## D0.7 — los componentes son de social, no de UI

**No hay botones ni navbars.** Un componente acá es una **pieza gráfica reutilizable**: portada de
carrusel, slide interna, slide de cierre, bloque de cita, etiqueta "Nuevo"/"Tip", marco de
testimonio, bloque de precio, sticker central.

**Cada uno lleva su ficha** — sin ficha el agente adivina el diseño:
```
Cuándo usarlo · Variantes · Qué contenido acepta · Reglas · 🛑 Cuándo NO usarlo
```
🛑 **Un componente sin bloque de anti-uso no está terminado.** Es lo que evita que el sistema se
degrade en tres lotes. Ver `brain/COMPONENTES-SOCIAL.md`.

⚠️ **El catálogo sale de los goals que Creative usa con ESE cliente**, no de una lista genérica.

## La matriz de contraste — lo más importante de D0

Se mide **cada** par fondo/texto de la paleta. Piso Inherent: **4.5:1** para todo texto legible en
miniatura; **7:1 o scrim** para texto sobre foto. Base: WCAG 2.2 AA.

Salidas obligatorias:
1. **Par seguro por defecto**
2. **Par de emergencia sobre foto**
3. Mínimo **3 scrims** por intensidad

🛑 **"Se ve bien" no es una medición.** Declará el método usado.

## Antes de empezar

1. ¿Existe `clients/<cliente>/`? Si no, crearla con la estructura de `clients/README.md`.
2. ¿Strategy produjo `posicionamiento.md`? De ahí salen los activos distintivos de D0.6.
3. ¿Qué hay en `_INPUTS/guia-de-marca/`? Si hay manual formal → **Modo A**. Si hay intel suelto
   (referencias, moodboard, fuentes, material publicado) → **Modo B**. Si no hay ni dirección →
   buscar en Drive o Notion, o **BLOQUEAR**.

## Si la guía es incompleta

Distinguí **qué tipo** de hueco es:

| Hueco | Qué hacés |
|---|---|
| **Un valor concreto** que la guía no enumeró (scrim, ratio, margen) | ✅ **Resolvelo.** Es tu oficio. Declarás el criterio en el campo `origen` del token |
| **Una decisión de dirección** (una familia nueva, un color que no está, otra estética) | ⚠️ `FUERA DE GUÍA — propuesta` + gate |
| **No hay manual pero sí intel** | **Modo B** — construís `guia-aplicable.md` desde el intel, todo como propuesta |
| **No hay ni dirección** | 🛑 `BLOQUEADO`. Pedí lo mínimo: cómo debe verse y cómo debe sentirse |

🛑 **No completes con gusto propio una decisión de dirección.** Pero tampoco bloquees por un valor
que Branding nunca iba a especificar.

## Cierre

🛑 **D0 no diseña piezas.** Si escribís "esta pieza debería…", te saliste del rol.

🚦 **GATE 1** — un humano aprueba tokens, contraste, escala, grillas y layouts **antes** de que se
diseñe una sola pieza. Corré el bloque D0 de `qa/QA-GATES.md` antes de proponerlo.
