# Zag.js 1.47.0 + Floating UI 1.8.0 (vendorizado)

Comportamiento y accesibilidad de los menús, popovers y tooltips del OS. Sin estilos: el aspecto sale de los tokens
`--ui-*` (primitives.css) y de las reglas `.ui-*` de app.css. La única puerta es `public/js/ui.js`; ninguna pantalla
importa esta carpeta directo.

- Generado con `node scripts/vendor-ui.mjs` (esbuild 0.25.0, ESM, minificado, con trozos compartidos).
- Comprobar que no se tocó a mano: `node scripts/vendor-ui.mjs --check`.
- Licencias: `LICENSES.txt` (MIT: Chakra UI / Segun Adebayo para Zag; Floating UI contributors).
- Entradas: `menu.js` (@zag-js/menu), `popover.js` (@zag-js/popover), `tooltip.js` (@zag-js/tooltip). Cada una
  reexporta `VanillaMachine`, `normalizeProps` y `spreadProps` de @zag-js/vanilla. La posición (flip, shift, offset,
  arrow, size) es @floating-ui/dom 1.8.0, que entra por @zag-js/popper dentro de los trozos `comun-*`.

Peso total: 136.7 KB sin comprimir.

| archivo | bytes | sha256 |
|---|---:|---|
| comun-AEMN4PUD.js | 62099 | `0306b966d85d67c273b15e471e1a41f63c01d7c3a6d5f037c923a67efbdbfad2` |
| comun-GSLFWU66.js | 3556 | `ff73b9df044af21c04a62aacd6dec8b683733e76f94a2eb67aade696fd60b862` |
| comun-TEHIPSKC.js | 9015 | `9a2c45d7f04ca9c4c528094caa41aee1a1a98abde873c234e77ba5a00faa0ec8` |
| menu.js | 28626 | `dfe9008faf59dac0e9540f2a13e3e2d0b84e35f37e16cd85890b191daa2732fc` |
| popover.js | 25732 | `05909116d69f15b532f723c51790b0ee3576d50ea1f56c2d8725d02111e304f2` |
| tooltip.js | 10973 | `372616347e7f715196d6a778eb36069cd741ee30cdff4c29558bca60dd93eb1c` |

sha256 (formato de `shasum -a 256`):

```
0306b966d85d67c273b15e471e1a41f63c01d7c3a6d5f037c923a67efbdbfad2  comun-AEMN4PUD.js
ff73b9df044af21c04a62aacd6dec8b683733e76f94a2eb67aade696fd60b862  comun-GSLFWU66.js
9a2c45d7f04ca9c4c528094caa41aee1a1a98abde873c234e77ba5a00faa0ec8  comun-TEHIPSKC.js
dfe9008faf59dac0e9540f2a13e3e2d0b84e35f37e16cd85890b191daa2732fc  menu.js
05909116d69f15b532f723c51790b0ee3576d50ea1f56c2d8725d02111e304f2  popover.js
372616347e7f715196d6a778eb36069cd741ee30cdff4c29558bca60dd93eb1c  tooltip.js
```
