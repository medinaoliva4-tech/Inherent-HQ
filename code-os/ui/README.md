# Code OS · interfaz

Interfaz de Code OS con la estructura de la app de Claude: pestañas **Chat** y **Code**.
Vite + React + TypeScript + Tailwind v4 + shadcn/ui + AI Elements, con xterm.js (terminal), CodeMirror 6 (archivos)
y `@git-diff-view/react` (cambios). Todo MIT.

```bash
npm install
npm run dev        # http://localhost:5173 — sin variables usa el cliente de ejemplo (mock)
npm test           # pruebas (vitest)
npm run build      # tsc + vite build
```

## Conectar al puente

| Variable | Para qué |
|---|---|
| `VITE_PUENTE_URL` | URL del puente (`code-os/puente`). Sin ella → **mock**. `.` = mismo origen (cuando el puente sirve la interfaz compilada) |
| `VITE_PUENTE_TOKEN` | Token `Bearer` del puente. ⚠️ Queda dentro del JS compilado: úsalo solo en una red privada o detrás del login del servidor |
| `VITE_CUOTAS_URL` · `VITE_CUOTAS_TOKEN` | Opcional. Si no se ponen, `GET /cuotas` se pide al puente |
| `PUENTE_PROXY` | Solo en `npm run dev`: manda `/puente/*` a esa URL (evita CORS). Se usa con `VITE_PUENTE_URL=/puente` |

### Probar contra el puente (sin gastar cupo)
```bash
node scripts/anthropic-falso.mjs                          # «Anthropic» falso en :4199
cd ../puente && PUENTE_TOKENS=token-de-prueba-local-1234567890 LITELLM_KEY=x \
  LITELLM_URL=http://127.0.0.1:4199 PUENTE_PORT=4201 PUENTE_DEFAULT_MODEL=nivel-medio npm run dev
cd ../ui && PUENTE_PROXY=http://127.0.0.1:4201 VITE_PUENTE_URL=/puente \
  VITE_PUENTE_TOKEN=token-de-prueba-local-1234567890 npm run dev
```
Pide «Crea un archivo de prueba»: el arnés real de Claude Code pide permiso para `Write` y termina el turno.

## Cliente (`src/lib/cliente.ts`)
Una interfaz `Cliente`, dos implementaciones:
- `cliente-mock.ts` — datos de ejemplo (proyectos, archivos, diff, terminal, cuotas, MCP, skills). Nada es real.
- `cliente-http.ts` — HTTP + SSE contra el puente. Traduce sus eventos (`text_delta`, `tool_call`, `permission_request`,
  `turn_end`…) al contrato de la interfaz (`src/lib/eventos.ts`). Lo que el puente aún no tiene lanza `NoDisponible`
  y la pantalla lo dice («Falta en el puente: …»).

## Qué hay
- **Barra lateral**: Chat / Code, proyectos (carpetas con instrucciones), búsqueda en títulos y mensajes, fijar,
  renombrar, archivar, borrar, chat incógnito, medidor de cuotas y estado de la sesión de Claude.
- **Caja**: `/` comandos, `@` archivos, adjuntos (los de texto viajan dentro del mensaje), Manual / Plan, niveles.
- **Conversación**: razonamiento, herramientas, subagentes, tareas, permisos (S · N · T), preguntas con opciones,
  plan para aprobar, artefactos (HTML/SVG en iframe aislado, sin red).
- **Panel**: Tareas, Cambios (comentarios por línea que se mandan juntos), Archivos, Terminal, Artefactos, Vista previa.
- **Ajustes**: general, servidor, uso y cuotas (aviso al 80%), memoria, conectores MCP, skills, permisos, atajos.
- Lo que no entró y por qué: `docs/pendiente.md`. Capturas: `docs/capturas/v2/`.

## Tokens y movimiento
`src/index.css` copia los tokens `--ui-*` de `ceo-os/public/app.css` y los mapea a shadcn. Tema en
`<html data-theme="dark|light">`. Resortes con `motion` (`src/lib/movimiento.ts`); `prefers-reduced-motion` los
apaga y `prefers-reduced-transparency` quita el vidrio.
