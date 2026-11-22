# Instrucciones para Codex (y cualquier agente) en `ceo-os/`

> Antes de escribir una línea, lee **`../CLAUDE.md`**, **`PROPOSITOS.md`** y **`MAPA.md`**. Si algo de aquí choca con ellos, mandan ellos.

## Lo que no se rompe
- **Español, de «tú».** Mensajes mínimos; lo accionable arriba.
- **El alcance contratado (ficha de oferta) es el techo.** Sin ficha, la marca se bloquea.
- **El CEO solo bloquea en ① Strategy y ⑧ Ads.** Todo lo demás fluye.
- **El cliente nunca ve** costos, márgenes, horas ni notas internas. **Finance es solo CEO.**
- **Nada destructivo ni hacia afuera:** no gastes, no publiques, no envíes mensajes reales, no borres (se archiva).
- **Nunca toques producción:** el servidor local usa PGlite aislado. No pongas llaves ni secretos en el repo.
- **No edites el manual** (`../CLAUDE.md`, `../inherent/`, `../agents/`, `../PENDIENTES.md`).

## Cómo se trabaja aquí
- Módulos ES **sin build**; tokens `--ui-*` / `--fs-*` / `--r-*` (`npm run lint:css` los vigila). Nada de colores ni tamaños sueltos.
- `cd ceo-os && npm ci && npm test` y los `test:*` de lo que toques. **Un cambio visual que no viste en un navegador no está validado.**
- Pruebas aisladas con PGlite (`LOCAL_DB` temporal). Sigue el estilo de `scripts/test-vision-*.mjs`.
- Rama propia (`codex/<tema>`); **no mergees ni toques `main`**. Commits pequeños en español.
- Si algo es una decisión de producto, **no la inventes**: déjala anotada en tu resumen.

## Al terminar
Resume: qué hiciste, qué pruebas corrieron (y su salida), qué **no** pudiste verificar.
