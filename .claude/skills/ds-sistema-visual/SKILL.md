---
name: ds-sistema-visual
description: >
  Capa D0 del método de Diseño — traduce la guía de marca de Branding a un sistema visual operable:
  design tokens (color, tipografía, espaciado, radios, sombras), matriz de contraste medida, escala
  tipográfica, grillas y safe areas por formato, inventario de elementos gráficos, activos
  distintivos y biblioteca de layouts base. Úsala al arrancar con un cliente nuevo en Diseño, cuando
  pidan "armá el sistema visual de X", "pasá la guía de marca a tokens", "qué tipografías y tamaños
  usamos", "qué colores puedo combinar", "armá las grillas", o cuando cualquier otra capa de Diseño
  detecte que no existe un sistema previo. Traduce — no inventa lenguaje visual: eso es de Branding.
---

# D0 · Sistema Visual

Leé `agents/design/METHOD.md` → D0 y los archivos de `agents/design/systems/`.
Plantilla: `agents/design/templates/sistema-visual.md` → copiar a `clients/<cliente>/`.

## Regla madre

**Traducís, no inventás.** Todo lo que no está en la guía de marca sale marcado
`⚠️ FUERA DE GUÍA — propuesta` y necesita gate. Definir el lenguaje visual es de **Branding**.

## Los 7 bloques

| # | Bloque | Referencia |
|---|---|---|
| D0.1 | **Tokens** — color, tipo, espaciado, radio, sombra, borde | `systems/DESIGN-TOKENS.md` |
| D0.2 | **Matriz de contraste** — cada par medido | `systems/COLOR-Y-CONTRASTE.md` |
| D0.3 | **Escala tipográfica** — máx. 4 tamaños por formato | `systems/TIPOGRAFIA.md` |
| D0.4 | **Grillas por formato** — márgenes, columnas, safe areas | `systems/FORMATOS-Y-CANALES.md` |
| D0.5 | **Inventario de elementos gráficos** — las 5 familias | `systems/ELEMENTOS-GRAFICOS.md` |
| D0.6 | **Activos distintivos** — qué se reconoce al 10% sin logo | `posicionamiento.md` de Strategy |
| D0.7 | **Biblioteca de layouts** — 3-6 que cubran el 80% | `systems/COMPOSICION-Y-JERARQUIA.md` |

## Cada token lleva 5 campos

`nombre · valor · origen · uso · 🛑 anti-uso`

**Sin el anti-uso, el token se usa mal.** Es lo que evita que el sistema se degrade en tres lotes.

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
3. ¿La guía de marca está en `_INPUTS/guia-de-marca/`? Si no: buscarla en Drive o Notion, o **BLOQUEAR**.

## Si la guía es incompleta

**Documentá menos, no completes con gusto propio.** Dos modos:
- **Modo normal** — se marcan los huecos `⚠️ FUERA DE GUÍA` y se propone el faltante como propuesta
- **Modo provisional** — no hay guía. Todo el sistema sale marcado
  `⚠️ SISTEMA PROVISIONAL — sin aprobar por Branding`, y se avisa en cada capa posterior

## Cierre

🛑 **D0 no diseña piezas.** Si escribís "esta pieza debería…", te saliste del rol.

🚦 **GATE 1** — un humano aprueba tokens, contraste, escala, grillas y layouts **antes** de que se
diseñe una sola pieza. Corré el bloque D0 de `qa/QA-GATES.md` antes de proponerlo.
