# Code OS · interfaz

Base de la interfaz de Code OS (Vite + React + TypeScript + Tailwind v4 + shadcn/ui + AI Elements).
**Aún no está conectada al puente**: lee eventos de un cliente de ejemplo (`src/lib/cliente-mock.ts`).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas (vitest)
npm run build      # tsc + vite build
```

## Tokens
`src/index.css` copia los tokens `--ui-*` y `--tinta` de `ceo-os/public/app.css` (bloque «SISTEMA v3») y los
mapea a las variables de shadcn (`--background`, `--primary`, `--border`…). El tema vive en
`<html data-theme="dark|light">`; oscuro por defecto. Para cambiar un color, cámbialo en `--ui-*`.

## Contrato de eventos (`src/lib/eventos.ts`)
`texto`, `razonamiento`, `herramienta_inicio`, `herramienta_fin`, `permiso_pedido`, `uso`, `error`, `fin`.
El puente real implementará `ClienteEventos` (`enviar` + `responderPermiso`) y se pasa a `<App cliente={…} />`.
Respuesta a permisos: `s` sí (esta vez) · `n` no · `t` sí, siempre en la sesión.

## Estructura
- `src/components/ai-elements/` — instalados desde shadcn (`npx shadcn add @ai-elements/…`), traducidos y ajustados a base-ui.
- `src/components/os/` — barra lateral, panel redimensionable, paleta (⌘K), selector de modelo, caja de entrada.
- `src/data/ejemplo.ts` — proyectos, conversaciones y niveles/modelos de ejemplo.
- Movimiento: resortes con `motion` (`src/lib/movimiento.ts`); `prefers-reduced-motion` los desactiva.
