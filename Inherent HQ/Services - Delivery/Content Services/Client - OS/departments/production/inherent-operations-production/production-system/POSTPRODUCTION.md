# Postproducción

## Entrada obligatoria

Recibir el handoff aprobado de [PRODUCTION_CAPTURE.md](PRODUCTION_CAPTURE.md). Nunca usar material no aprobado como base final.

## A. Fotografía

1. Clasificar fotos y mapearlas contra Brand Guidelines y objetivo de la pieza.
2. Usar **Higgsfield Skill** únicamente para generar, mejorar o transformar imágenes/assets visuales.
3. Presentar **cada imagen** al humano.
4. Solo conservar `APPROVED`; regenerar/revisar las rechazadas.

```text
Foto fuente → Higgsfield Skill (si aplica) → revisión humana individual → APPROVED
```

## B. Video

### 1. Video Edit Plan — bloqueante antes de Adobe

Antes de abrir o ejecutar cualquier operación en Premiere Pro/After Effects, analizar la referencia y presentar un **Video Edit Plan** para aprobación humana.

El plan debe incluir por tramo de tiempo: objetivo/hook, fuente o toma, selección de clip, texto, gráficos, transición, B-roll, audio, efectos, asset faltante, formato y CTA. Marcar qué se hará en Premiere, qué en After Effects y qué asset se debe generar.

```text
Referencia + footage aprobado → análisis → Video Edit Plan → APROBACIÓN → edición
```

Sin esta aprobación, no continuar a Adobe.

### 2. Descubrimiento y cortes

1. Buscar footage en **Jockey Knowledge Store** mediante significado, no solo nombre de archivo.
2. Seleccionar fuentes y extraer segmentos con **FFmpeg**.
3. Guardar cortes con ID/versionado.
4. Presentar clips al humano. Re-cortar los no aprobados.

```text
Jockey → FFmpeg → aprobación de clips → clips aprobados
```

### 3. Assets visuales y gráficos

- Usar **Higgsfield Skill** para B-roll generado, transiciones, VFX, shots de reemplazo o mejoras visuales. Para transiciones, usar Frame A y Frame B reales cuando sea posible.
- Usar **FigWright** para gráficos de marca: titles, lower thirds, CTA cards, overlays y elementos de interfaz. Ejecutar llamada de terminal; si no hay acceso, pedir al usuario abrir Terminal.
- Verificar Brand Guidelines y aprobar assets necesarios antes de la edición final.

### 4. Ejecución Adobe

Con plan, clips y assets aprobados, usar **Higgsfield Bridge** solo como capa de ejecución dentro de Adobe:

- **Premiere Pro:** montaje, timing, audio, captions y estructura.
- **After Effects:** motion graphics, compositing, VFX y transiciones complejas.

El Bridge no reemplaza la aprobación ni la generación de assets: ejecuta la edición aprobada en Adobe.

### 5. Revisión final

Validar estructura, cortes, transiciones, gráficos, tipografía, color, branding, audio, duración, aspect ratio, CTA y artefactos. Presentar el video final para aprobación humana y registrar versión final.

## Handoff a entrega

Entregar: finales aprobados, archivos fuente, Video Edit Plan aprobado, registro de clips/assets aprobados, QA y versión final.

Volver a [PRODUCTION.md](PRODUCTION.md) para la vista general.
