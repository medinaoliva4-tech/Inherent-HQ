---
name: vd-motion
description: >
  Disciplinas 5 y 10 — motion graphics y compositing. Elementos gráficos animados (flechas,
  stickers, íconos, lower thirds, barras, líneas, shapes) e integración de capas visuales (video,
  PNG, texto, overlays, fondos, máscaras y efectos). Úsala cuando pidan "ponele gráficas", "un lower
  third con el nombre", "flechas señalando", "animá este dato", "integrá este logo/PNG", "poné la
  captura de pantalla encima". Corre después del color.
---

# Motion Graphics y Compositing

**Requiere:** color cerrado. La gráfica se construye sobre la imagen ya graded.
**Referencia de marca:** `templates/brand-guideline-video.md` § Motion graphics, Tipografía, Logo.

## Motion graphics — qué entra

| Elemento | Para qué | Regla |
|---|---|---|
| **Lower third** | Nombre y rol de quien habla | Aparece una vez, 3-4s, no vuelve |
| **Flecha / círculo** | Señalar algo concreto en cuadro | Si hay que señalar, la imagen no era clara |
| **Íconos** | Listas, pasos, categorías | Del set de la marca, no de stock mezclado |
| **Barras / datos** | Visualizar una cifra | El dato tiene fuente o no se muestra |
| **Stickers** | Energía en social | Máximo 2-3 en toda la pieza |
| **Transiciones gráficas** | Separar bloques | Nunca decorativas: separan o sobran |

🛑 **Una gráfica sin función se elimina.** No se decora: se comunica.

## Compositing — integrar capas

| Paso | Qué se cuida |
|---|---|
| **Orden de capas** | Fondo → sujeto → overlays → texto → viñeta |
| **Máscaras** | Bordes limpios; un borde sucio se ve más que la capa entera |
| **Match de color** | La capa agregada se integra al grading, no queda pegada |
| **Perspectiva y escala** | Si no coincide, se lee como error aunque nadie sepa por qué |
| **Sombra y contacto** | Un PNG sin sombra flota |
| **Movimiento** | Si la cámara se mueve, la capa se trackea (`vd-vfx`) |

## Reglas duras

- 🛑 **Todo dentro del safe area.** Vertical: sup 150 · inf 420 · der 150 px.
- 🛑 **Tipografía, paleta y easing del guideline.** Sin guideline: `⚠️ SIN GUIDELINE — asumido`.
- **La animación sirve a la lectura.** Entrada rápida (6-10 frames), salida más rápida. Sin rebotes
  decorativos.
- **Timing:** aparece cuando la voz lo nombra, no antes ni tres segundos después.
- **Una idea gráfica a la vez.** Dos elementos animados simultáneos se anulan.
- **El logo respeta clear space y timing del guideline.** Nunca en el frame 1.
- **Contraste sobre cualquier fondo.** Si el plano cambia de luz, el texto necesita fondo o contorno.
- **Datos verificados** contra el brief. Un número mal en pantalla es peor que no ponerlo.

## Reglas de recorte

Si el deadline aprieta, motion graphics se reduce a lo imprescindible (datos y lower thirds), no
se elimina si hay información que solo vive en la gráfica. Compositing se recorta antes.

## Cierre
Revisar en móvil: tamaños, contraste y safe areas. Correr los ítems de gráfica del bloque
**Fase 4** de `qa/QC-GATES.md`.

## Handoff
→ `vd-captions` si faltan, y después `vd-entrega`.
