---
name: ds-adaptacion
description: >
  Capa D6 del método de Diseño — adapta una pieza maestra a cada formato y canal: feed 4:5, feed 1:1,
  story 9:16, carrusel y carrusel seamless, en Instagram y Facebook. Recompone en la grilla del
  formato destino, respeta safe areas, reencuadra la foto sin estirarla, ajusta densidad de texto y
  overlays, y aplica el ritmo obligatorio del carrusel y la técnica del lienzo largo para seamless.
  Úsala cuando pidan "adaptá esto a story", "pasalo a cuadrado", "hacelo también para Facebook",
  "esto no entra en 9:16", "el CTA queda tapado", "armá el carrusel seamless". Adaptar es recomponer,
  nunca escalar.
---

# D6 · Adaptación por Formato y Canal

Leé `systems/FORMATOS-Y-CANALES.md` y `playbooks/FIGWRIGHT-PLAYBOOK.md` §4.
Requiere la pieza maestra construida (D5).

## Regla madre

**Adaptar es recomponer, no escalar.** Escalar un 4:5 a 9:16 rompe márgenes, safe areas y jerarquía
de una sola vez.

## Qué cambia y qué no

| Cambia | No cambia |
|---|---|
| Grilla y márgenes | El goal y el mensaje único |
| Posición y tamaño relativo de los 3 niveles | **La jerarquía que definió Creative** |
| Cantidad de texto en pieza (menos en story) | El par de color |
| Recorte de la foto (**nuevo encuadre**, no estiramiento) | Los activos distintivos |
| Qué overlays entran (menos en formatos chicos) | El sistema tipográfico |

## Safe areas — Story (1080 × 1920)

```
0      ──────────────────  ZONA TAPADA  ~250 px  (avatar, nombre, progreso)
250    ──────────────────
                           ZONA SEGURA   todo lo crítico
1500   ──────────────────
                           ZONA TAPADA  ~420 px  (respuesta, link, stickers)
1920   ──────────────────
```
🟡 Conservadores a propósito — la UI varía por app, versión y si es orgánico o pauta.
**CTA en story:** arriba del safe inferior, o sticker nativo. Nunca en los últimos 420px.

## Feed

| Consideración | Regla |
|---|---|
| Grilla de perfil (IG) | Recorta a cuadrado: nada crítico en el 12,5% superior ni inferior |
| Miniatura del scroll | El nivel 1 vive en el tercio superior o en el centro |
| Ratio por defecto | **4:5** — ocupa más pantalla |

## Carrusel

| Regla | Por qué |
|---|---|
| **Mismo ratio en todas las slides** | Evita recortes al deslizar |
| Portada autosuficiente | Es lo único que ve quien no desliza |
| Continuidad visual entre slides | Un elemento que cruza |
| Numeración visible (`1/7`) | Sube el swipe |
| Quiebre de layout en la penúltima | Rompe la inercia antes del CTA |
| Un solo CTA, en la última | Dos CTAs = ninguno |

🟡 Verificá el máximo de slides vigente antes de armar más de 10. Recomendación de diseño: **5-8**.

## Seamless — la matemática

```
Ancho total = ancho_slide × N        6 slides 1:1 → 6480 × 1080
Guías en 0 · 1080 · 2160 · 3240 · 4320 · 5400

1. Un frame largo con la composición completa
2. Formas e imágenes CRUZAN las guías  ← esto es lo que produce el seamless
3. create_component del frame largo
4. N frames de 1080 × 1080 con una instancia, desplazada en X
5. Exportar los N frames — NUNCA el componente largo
```
🛑 **No cortes elementos justo sobre la guía.** Se lee como 6 piezas sueltas.

## Instagram vs Facebook

| | Instagram | Facebook |
|---|---|---|
| Densidad de texto en pieza | Baja — el copy vive en el caption | Media — el texto en pieza rinde más |
| Grilla de perfil | Importa | No aplica |

🛑 **Una pieza de IG no se sube igual a FB sin revisar.** Mínimo: densidad de texto y encuadre.

## Pauta

- Baja densidad de texto · CTA inequívoco
- 🛑 **Nada que imite UI nativa** (play, likes, barras de progreso dibujadas) → rechazo
- 🟡 Meta discontinuó el rechazo automático por >20% de texto; la recomendación de baja densidad
  sigue vigente como guía de rendimiento. **Verificar la política antes de cada campaña**

## En Figwright

| Qué | Cómo |
|---|---|
| Cambiar de formato | Instancia de la variante del formato destino |
| Reencuadrar la foto | Cambiar el fill (scaleMode / crop) — **nunca estirar el frame** |
| Menos overlays en story | **Sacar** capas, no reducirlas |
| Validar | `get_screenshot` de cada formato, y del lote junto |

## Cierre

Corré el bloque D6 de `qa/QA-GATES.md`. Siguiente: `ds-qa-visual` (D7).
