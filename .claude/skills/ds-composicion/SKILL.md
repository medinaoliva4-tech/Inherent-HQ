---
name: ds-composicion
description: >
  Capa D3 del método de Diseño — resuelve la composición de la pieza: grilla, punto focal, peso
  visual, jerarquía de 3 niveles, aire, dirección de lectura, contención, tipografía (escala,
  interlineado, tracking, cortes de línea) y contraste medido. Se compone en gris antes del color.
  Úsala cuando pidan "cómo compongo esta pieza", "no se entiende qué se lee primero", "revisá la
  jerarquía", "qué tamaño va el titular", "este texto no se lee sobre la foto", "el carrusel no
  tiene ritmo", o al bajar cualquier brief a diseño. Termina con dos tests obligatorios: miniatura
  y gris. Si fallan, se cambia el layout — no se arregla con elementos gráficos.
---

# D3 · Composición y Jerarquía

Leé `agents/design/systems/COMPOSICION-Y-JERARQUIA.md`, `TIPOGRAFIA.md` y `COLOR-Y-CONTRASTE.md`.
Requiere el brief de la pieza (D2).

## Regla madre

**Se compone en gris.** Si la pieza no funciona sin color, el color la está salvando — y el color
no siempre está disponible (feeds oscuros, compresión, daltonismo).

## Jerarquía — 3 niveles, no más

| Nivel | Qué es | Peso |
|---|---|---|
| **1** | El mensaje único. Se lee en 1,5 s | Dominante — **≥2x** el nivel 2 |
| **2** | El contexto que hace entendible al 1 | Claramente menor |
| **3** | Firma, CTA, dato chico, logo | Presente, nunca compitiendo |

Un elemento pesa por **tamaño × contraste × área × posición**. El nivel 1 gana en **al menos dos**.

## Las 6 decisiones

| Decisión | Regla |
|---|---|
| **Grilla** | Todo alineado. Los márgenes del sistema no se negocian pieza por pieza |
| **Punto focal** | Uno. Tercios o centro óptico. El centro geométrico es la opción de quien no eligió |
| **Peso visual** | Nivel 1 ≥2x nivel 2. Se verifica en gris y en miniatura |
| **Aire** | Mínimo 8% del alto del formato en el borde con texto |
| **Dirección de lectura** | Z (poco texto, foco fuerte) · F (texto denso, listas) · vertical (tipográfica, story). **Se declara** |
| **Contención** | Nada toca el borde salvo decisión del sistema, consistente en todo el lote |

## Tipografía — lo que más se rompe

- Máx. **4 tamaños**, ratio 1.5x-2x entre niveles
- Cuanto **más grande**, más apretado el interlineado y el tracking
- **Cortes de línea a mano**, por unidad de sentido. Máx. 3 líneas de titular
- Énfasis en orden: peso → color → pincelada → tamaño (último recurso)
- 🛑 Máx. **2 palabras destacadas** por pieza. Máx. 2 familias tipográficas

## Contraste — se mide

Piso: **4.5:1** para todo texto. Sobre foto: **7:1 o scrim**.
Sobre foto se mide contra la **zona más clara** del área del texto, no contra el promedio.
Soluciones en orden de robustez: bloque sólido → scrim de degradado → scrim plano → 🔴 sombra en el
texto (no es una solución de contraste).

## Carrusel — ritmo obligatorio

```
S01 PORTADA      el gancho, autosuficiente
S02 ENTRADA      baja la promesa a concreto
S03-Sn DESARROLLO un punto por slide, mismo layout
Sn-1 QUIEBRE     cambia el layout, rompe la inercia
Sn  CIERRE/CTA   una sola acción
```
**Continuidad obligatoria:** un elemento que cruza de slide a slide.

## Los 2 tests de cierre — obligatorios

```
TEST MINIATURA   al 10%. ¿Se entiende de qué se trata?     → SÍ / NO
TEST GRIS        en escala de grises. ¿Hay jerarquía?      → SÍ / NO
```

🛑 **Dos NO = volver a D2 y cambiar el layout.** No se arregla en D4 con overlays.

## Cierre

Corré el bloque D3 de `qa/QA-GATES.md`. Siguiente: `ds-elementos-graficos` (D4).
