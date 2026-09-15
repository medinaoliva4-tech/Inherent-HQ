---
name: ds-composicion
description: >
  Capa D3 del método de Diseño — toma la jerarquía del mensaje que definió Creative y la vuelve
  cierta visualmente: grilla, punto focal, peso visual, aire, dirección de lectura, contención,
  tipografía (escala, interlineado, tracking, cortes de línea) y contraste medido. Se compone en gris
  antes del color. Úsala cuando pidan "cómo compongo esta pieza", "no se entiende qué se lee
  primero", "revisá la jerarquía", "qué tamaño va el titular", "este texto no se lee sobre la foto",
  "el carrusel no tiene ritmo", o al bajar cualquier brief a diseño. Termina con tres tests
  obligatorios: miniatura, gris y atención. Si fallan, se cambia el componente — no se arregla con
  elementos gráficos.
---

# D3 · Composición y craft

Leé `systems/COMPOSICION-Y-JERARQUIA.md`, `TIPOGRAFIA.md`, `COLOR-Y-CONTRASTE.md` y
`brain/CRITERIO-VISUAL.md`. Requiere el brief de la pieza (D2).

## Regla madre

> **La composición lo sostiene todo.** Buena tipografía, buenos colores y buenas imágenes no salvan
> una composición mala.

**Se compone en gris.** Si la pieza no funciona sin color, el color la está salvando — y el color no
siempre está disponible (feeds oscuros, compresión, daltonismo).

## De dónde viene la jerarquía

```
Creative define la jerarquía del MENSAJE  →  ya viene en el brief
Diseño resuelve la jerarquía VISUAL       →  esto es lo tuyo
```
🛑 **No reordenes los niveles.** Si no entran, proponé y preguntá (`⚠️ OBSERVADO`).

## Los 3 niveles

| Nivel | Peso |
|---|---|
| **1** | Dominante — **≥2x** el nivel 2 |
| **2** | Claramente menor |
| **3** | Presente, nunca compitiendo |

Un elemento pesa por **tamaño × contraste × área × posición**. El nivel 1 gana en **al menos dos**.

## Las 6 decisiones

| Decisión | Regla |
|---|---|
| **Grilla** | Todo alineado. Los márgenes del sistema no se negocian pieza por pieza |
| **Punto focal** | Uno. Tercios o centro óptico. El centro geométrico es la opción de quien no eligió |
| **Peso visual** | Nivel 1 ≥2x nivel 2. Se verifica en gris y en miniatura |
| **Aire** | Mínimo 8% del alto del formato en el borde con texto |
| **Dirección de lectura** | Z (poco texto, foco fuerte) · F (texto denso) · vertical (story). **Se declara** |
| **Contención** | Nada toca el borde salvo decisión del sistema, consistente en todo el lote |

## Tipografía — lo que más se rompe

- Máx. **4 tamaños**, ratio 1.5x-2x entre niveles · máx. **2 familias**
- Cuanto **más grande**, más apretado el interlineado y el tracking
- **Cortes de línea a mano**, por unidad de sentido. Máx. 3 líneas de titular
- Contraste de peso **grande**: `Light`+`Bold`, nunca `Light`+`Regular`
- Énfasis en orden: peso → color → pincelada → tamaño (último recurso)
- Trabajá al **100% de zoom**. Verificá `ñ` y tildes
- 🛑 Máx. **2 palabras destacadas** por pieza

## Contraste — se mide

Piso **4.5:1** para todo texto. Sobre foto: **7:1 o scrim**, medido contra la **zona más clara** del
área del texto, no contra el promedio.
Robustez: bloque sólido → scrim de degradado → scrim plano → 🔴 sombra en el texto (no es solución).

## Espacio en blanco

No significa blanco: significa **ausencia de elementos**. El aire no es espacio desperdiciado — es lo
que hace que el nivel 1 se lea. Las marcas premium eligen no mostrar.

## Carrusel — ritmo obligatorio

```
S01 PORTADA       el hook, autosuficiente — es lo único que ve quien no desliza
S02 ENTRADA       baja la promesa a concreto
S03-Sn DESARROLLO un punto por slide
Sn-1 QUIEBRE      cambia el layout, rompe la inercia
Sn  CIERRE/CTA    una sola acción
```
**Continuidad obligatoria:** un elemento que cruza de slide a slide.

## Las 3 preguntas de craft

Reemplazan a "¿se ve bien?", que no se puede contestar ni discutir:
```
¿A dónde va la atención primero?
¿Qué se nota en segundo lugar?
¿Qué se pierde completamente?
```

## Los 3 tests de cierre — obligatorios

```
TEST MINIATURA   al 10%. ¿Se entiende de qué se trata?              → SÍ / NO
TEST GRIS        en escala de grises. ¿Hay jerarquía?               → SÍ / NO
TEST ATENCIÓN    ¿lo primero que se ve es el nivel 1 del brief?     → SÍ / NO
```

🛑 **Un NO = volver a D2 y cambiar el componente.** No se arregla en D4 con overlays.

## Cierre

Corré el bloque D3 de `qa/QA-GATES.md`. Siguiente: `ds-elementos-graficos` (D4).
