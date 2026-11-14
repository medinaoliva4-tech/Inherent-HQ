# Prueba aislada de React Flow

Isla React local con React Flow, una gráfica sintética y un evento `CustomEvent` recibido por JavaScript vanilla. No usa API ni datos reales.

```sh
npm ci
npm run build
npm run serve -- --port 4173
```

En otra terminal: `node smoke.mjs`. Requiere Chromium de Google Chrome y Playwright instalado en `/Users/rodrigomedina/node_modules/playwright`.

Captura 2×: `capturas/vision-reactflow-dsf2.png`. `dist/` y `node_modules/` se generan localmente y no se versionan.
