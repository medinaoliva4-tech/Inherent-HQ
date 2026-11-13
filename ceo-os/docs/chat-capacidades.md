# Chat con capacidades: un solo chat, un solo motor

Cómo el Chat del OS usa el puente de Code (`code-os/puente`) como **un solo motor por conversación** y prende o apaga lo que puede hacer en cada turno.

## Piezas

| Archivo | Qué hace |
|---|---|
| `public/js/llm/capacidades.js` | Puro. Catálogo de capacidades, estado de los chips, activación por intención, PATCH entre turnos, presets, costo de permisos, pasos plegados. |
| `public/js/llm/modelos-tabla.js` | **La tabla que se edita** para cambiar modelos: la `COCINA` del CEO y el respaldo (mock) del catálogo y los presets. |
| `public/js/llm/router-code.js` | `rutear()` ahora también trae `capacidades` (por intención) y `preset` (Auto). `detectarCapacidades()` para frases en español. |
| `public/js/chat-code.js` | `capacidadesPuente()`, `catalogoPuente()` y `turnoCode()` con `capacidades` y `planEjecucion` (POST al crear, PATCH solo con lo que cambió). |
| `public/js/screens/llm.js` | Barra de chips, aviso en el hilo, selector de equipo, línea «X planifica · Y ejecuta», tarjeta de gasto y caída al chat de siempre. |
| `api/_lib/chat.js` | `POST chat/sesiones/:id/motor`: guarda en la conversación del OS los turnos que respondió el puente. |

## Contrato que consume (y qué pasa si falta)

| Del puente | Si responde | Si no |
|---|---|---|
| `GET /capacidades` | Toda la conversación va por el puente (`mode: chat` sin capacidades, `code` con ellas). | **Respaldo marcado `mock`:** solo Código «lista»; lo demás «sin conexión» con el motivo. El chat sin capacidades sigue por el chat de siempre, como hoy. |
| `GET /models` → `modelos`, `presets` | Selector con Altos · Medios · Bajos y los presets. | **Respaldo marcado `mock`** (`modelos-tabla.js`); los modelos que no existen en el puente caen a `nivel-*`. |
| `POST/PATCH /sessions` con `capacidades`, `plan_ejecucion` | Una sola sesión por conversación; el PATCH lleva solo lo distinto. | Sin el contrato solo viajan `model` y `mode` (lo que el puente de hoy acepta). |
| SSE `turn_start.planner/executor`, `parentToolUseId` | Línea sutil y pasos del ejecutor plegados bajo el plan. | No se pinta la línea. |
| `permission_request` con `aprobado_usd` / `costo_usd` | Tarjeta «Cuesta · necesita tu OK» con el costo; responde `{ decision: 'allow', aprobado_usd }` o `deny`. Nunca «siempre». | La tarjeta de permiso de siempre. |

Si el puente falla antes de responder y el chat de siempre está en línea, el turno **cae al chat de siempre** con un aviso claro (sin capacidades en ese turno).

## Probar en local

```bash
node scripts/puente-falso.mjs                 # :4100, imita el contrato completo (FIGWRIGHT=0 · PUENTE_FALSO_SIN_CONTRATO=1)
PORT=3200 CODEOS_URL=http://localhost:3100/__puente CODEOS_PASE_SECRET=<32+ caracteres> npm run dev
```

La CSP del OS solo deja hablar con su propio origen y con `code.inherentglobal.com`, así que en local hace falta un proxy que sirva el OS y el puente falso desde el mismo origen (`/__puente` → `:4100`). Pruebas: `npm run test:capacidades`. Capturas: `docs/capturas-capacidades/`.
