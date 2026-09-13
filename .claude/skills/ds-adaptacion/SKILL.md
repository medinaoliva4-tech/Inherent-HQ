---
name: ds-adaptacion
description: >
  Capa D6 del método de Diseño — adapta una pieza maestra a cada formato y canal: feed 4:5, feed
  1:1, story 9:16 y carrusel, en Instagram y Facebook. Recompone en la grilla del formato destino,
  respeta safe areas, reencuadra la foto sin estirarla, ajusta densidad de texto y overlays, y
  aplica el ritmo obligatorio del carrusel. Úsala cuando pidan "adaptá esto a story", "pasalo a
  cuadrado", "hacelo también para Facebook", "esto no entra en 9:16", "el CTA queda tapado", "armá
  el carrusel a partir de esta pieza". Adaptar es recomponer, nunca escalar.
---

# D6 · Adaptación por Formato y Canal

Leé `agents/design/systems/FORMATOS-Y-CANALES.md`.
Requiere la pieza maestra construida (D5).

## Regla madre

**Adaptar es recomponer, no escalar.** Cada formato tiene su grilla, su safe area y su jerarquía.
Escalar un 4:5 a 9:16 rompe márgenes, safe areas y jerarquía de una sola vez.

## Qué cambia y qué no

| Cambia | No cambia |
|---|---|
| Grilla y márgenes | El mensaje único |
| Posición y tamaño relativo de los 3 niveles | La jerarquía 1-2-3 |
| Cantidad de texto en pieza (menos en story) | El par de color |
| Recorte de la foto (**nuevo encuadre**, no estiramiento) | Los activos distintivos |
| Qué overlays entran (menos en formatos chicos) | El sistema tipográfico |

## Safe areas — Story (1080 × 1920)

```
0      ─────────────────────  ZONA TAPADA  ~250 px  (avatar, nombre, progreso)
250    ─────────────────────
                              ZONA SEGURA   todo lo crítico
1500   ─────────────────────
                              ZONA TAPADA  ~420 px  (respuesta, link, stickers)
1920   ─────────────────────
```

🟡 Valores **conservadores a propósito** — la UI real varía por app, versión y si es orgánico o
pauta. Diseñar al margen conservador cuesta poco; un CTA tapado cuesta la pieza.

**CTA en story:** arriba del safe inferior, o como sticker nativo del canal. Nunca dibujado en los
últimos 420px.

## Feed

| Consideración | Regla |
|---|---|
| Grilla de perfil (IG) | Recorta a cuadrado: nada crítico en el 12,5% superior ni inferior si la pieza tiene que sobrevivirla |
| Miniatura del scroll | El nivel 1 vive en el tercio superior o en el centro |
| Ratio por defecto | **4:5** — ocupa más pantalla |

## Carrusel

| Regla | Por qué |
|---|---|
| **Mismo ratio en todas las slides** | Evita recortes al deslizar |
| Portada autosuficiente | Es lo único que ve quien no desliza |
| Continuidad visual entre slides | Un elemento que cruza: línea, color, numeración |
| Numeración visible (`1/7`) | Sube el swipe |
| Quiebre de layout en la penúltima | Rompe la inercia antes del CTA |
| Un solo CTA, en la última | Dos CTAs = ninguno |

🟡 **Verificar el máximo de slides vigente** antes de armar más de 10. Recomendación de diseño,
independiente de la plataforma: **5-8 slides**.

## Instagram vs Facebook

| | Instagram | Facebook |
|---|---|---|
| Densidad de texto en pieza | Baja — el copy vive en el caption | Media — el texto en pieza rinde más |
| Grilla de perfil | Importa | No aplica |

🛑 **Una pieza de IG no se sube igual a FB sin revisar.** Mínimo: densidad de texto y encuadre.
Se marca en el lote si es reuso directo o adaptación.

## Pauta

- Baja densidad de texto en imagen · CTA inequívoco
- 🛑 **Nada que imite UI nativa** (botones de play, likes, barras de progreso dibujadas) → rechazo
- 🟡 Meta discontinuó el rechazo automático por >20% de texto; la recomendación de baja densidad
  sigue vigente como guía de rendimiento. **Verificar la política vigente antes de cada campaña**
- Las piezas de pauta van marcadas en el lote y listadas aparte en `entrega.md`

## En Figma

| Qué | Cómo |
|---|---|
| Cambiar de formato | `swapComponent` a la variante del formato destino |
| Reencuadrar la foto | Cambiar `scaleMode` y crop del fill — **nunca estirar el frame** |
| Menos overlays en story | **Sacar** capas, no reducirlas de tamaño |
| Validar | `get_screenshot` de cada formato, y del lote junto |

## Cierre

Corré el bloque D6 de `qa/QA-GATES.md`. Siguiente: `ds-qa-visual` (D7).
