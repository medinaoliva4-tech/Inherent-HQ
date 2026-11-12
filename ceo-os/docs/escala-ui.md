# Escala de UI y primitives del OS

Un elemento se ve y se comporta igual en todo el OS. Los tokens viven en `public/primitives.css` (se carga antes de `app.css`); los primitives, en `app.css` (bloques «PRIMITIVE ·») y `public/js/`.

## Tokens

| Qué | Tokens |
|---|---|
| Color, tema, sombras | `--ui-*` (noche, día/light). Alias de transición: `--ink`, `--mut`, `--surface`, `--fill`, `--line`, `--hair`… (no usarlos en código nuevo). El Chat ya lee `--ui-*` directo; solo lo que difiere del OS (fondo de vidrio, superficies carbón de noche, gris de texto) vive en `--ui-ch-*` (primitives.css). La familia `--l-*` ya no existe |
| Tinta, vidrio y borde de luz | `--ui-tint` (rgb), `--ui-blur`, `--ui-edge` |
| Diagramas | `--ui-dg-*`, `--ui-dgf-*` |
| Letra | `--fs-1` 10 · `--fs-2` 11 · `--fs-3` 12 · `--fs-4` 13 · `--fs-5` 14 · `--fs-6` 15 · `--fs-7` 16 · `--fs-8` 18 · `--fs-9` 22 · `--fs-10` 28 · `--fs-11` 36 · `--fs-12` 44 · `--fs-13` 56 |
| Radios | `--r-0` 4 · `--r-1` 7 · `--r-2` 10 · `--r-3` 12 · `--r-4` 14 · `--r-5` 20 · `--r-6` 28 · `--r-pill` · círculo `50%`. Concéntricos: panel `--r-5`, tarjeta `--r-4`, control `--r-2` |
| Movimiento | `--d-1…5`, `--e-out`, `--e-std`, `--e-sheet`, `--e-pop` |

## Primitives

- **Interruptor**: `<label class="sw-row"><input type="checkbox" class="switch"> Texto</label>`. Es el único on/off. El checkbox queda solo para elegir ítems de una lista.
- **Botón**: `.btn` (primario), `.btn.ghost` (secundario), `.btn.danger` (destructivo). Tamaños: md y `.sm`. Solo ícono: `.btn-icon` (`.end` lo manda al final de la fila). Una clase propia sirve para posicionar, no para pintar.
- **Confirmar**: `confirmAsk(msg)` de `core.js`. Nunca `confirm()`.
- **Estado vacío**: `vacio({ icono, titulo, linea, boton })` de `visual.js`: qué es, por qué está vacío y una acción («Aún no hay X. ¿Lo armamos en el Chat?» con `boton: { texto, chat: { modo } }`). Un error se pinta con `fallo({ titulo, linea, detalle })`, nunca como vacío.
- **Toast**: `toast(msg)` neutro · `toast(msg, true)` error · `toast(msg, 'ok' | 'info' | 'error')` · `toast(msg, { tipo, accion: { texto, fn | href }, duracion })`. Se apilan hasta 3; el resto espera.

## Lint

`npm run lint:css` falla si aparece un hex, radio, `font-size`, `!important` o alias viejo nuevo fuera de los tokens (compara contra `scripts/lint-css.baseline.json`). Al migrar y bajar las cifras: `npm run lint:css -- --update`.

El CSS de OpenUI (`.gu-*`, `.sg`, `.vch-*`, `.hm-*`) y el del Chat (`.llm`, `.lc-`, `.ls-`, `.lm-`, `.lp-`, `.lt-`, `.lsg-`, `.bru-`) ya usan `--fs-*` y `--r-*`. Los valores intermedios se redondean al paso más cercano (13.5→14, 12.5→13, 11.5→12, 15.5→16, 19→18, 20→22; radios 6→7, 8→7, 9→10, 16→14, 18→20; empate hacia arriba).
