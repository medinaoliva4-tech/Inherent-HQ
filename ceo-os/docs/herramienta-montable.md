# Herramienta montable

Una herramienta, **un solo dato**, dos lugares:

1. **En su área** (Marketing, Producción…): sus pasos como timeline y la herramienta completa.
2. **Como artefacto en el panel del Chat**: compacta, junto a la conversación.

Las dos vistas leen el mismo dato y se repintan con el mismo evento. Nada se copia entre ellas.

Módulo: `public/js/herramienta-montable.js`. Pruebas: `scripts/test-openui.mjs`.

## La interfaz mínima

```js
import { definirMontable, montar } from './herramienta-montable.js';

const MI_HERRAMIENTA = definirMontable({
  id: 'referencias-video',            // [a-z0-9-]
  nombre: 'Referencias de video',
  origen: 'os',                       // 'os' (vive en ceo-os) o 'code-os' (vive en code-os/ui, va por iframe)
  pasos: [{ id: 'platicar', nombre: 'Platicar qué buscamos' }, …],
  leer: (slug) => api(…),             // EL dato. Una sola fuente.
  pasosDe: (dato) => ({ platicar: 'hecho', … }),  // hecho · ahora · pendiente · bloqueado (sin estado: el primero es «ahora»)
  vacio: (dato) => …,                 // sin dato → vacío conversacional (vacio-chat.js) si hay vacioChat
  vacioChat: { tema, preguntas, modo, destino },
  area: (dato, ctx) => html,          // la vista del área (ya escapada)
  artefacto: (dato, ctx) => html,     // la vista del panel (si falta, usa area)
});

const quitar = await montar(el, MI_HERRAMIENTA, { modo: 'area' | 'artefacto', slug });
```

## Un dato, sin desfase

- Quien guarda (la herramienta, `guardarEnDestino` del vacío conversacional, una acción del Chat) emite
  `window.dispatchEvent(new CustomEvent('os:dato', { detail: { herramienta, slug } }))`.
- `montar` escucha ese evento y vuelve a llamar `leer(slug)`. Las dos vistas abiertas se repintan solas.

## Las de departamentos (code-os/ui)

Viven en `code-os/ui` (`PanelLateral.tsx · HERRAMIENTA`: `icp`, `adquisicion`, `dolores`, `pilares`, `radar`, `campanas`, `pre`,
`video`) y su dato es el hilo del cliente en el puente. Con `origen: 'code-os'`, las dos vistas son el mismo iframe:

```
https://code.inherentglobal.com/?embed=1&herramienta=<id>&cliente=<slug>
```

El pase, el contexto y los mensajes siguen `code-os/ui/docs/embebido.md` (`codeos:pase`, `codeos:contexto`, `codeos:al-chat`).
Desde el Chat, `Tool(id)` / `Artifact(ref)` con un id de Code OS dispara `os:herramienta { id, slug, embed: true }`.

**Pendiente:** `Embebido.tsx` todavía no lee `herramienta=` ni `cliente=` (abre la primera herramienta del rol), el panel de
Herramientas del Chat (PR #306) debe escuchar `os:herramienta`, y los pasos de una herramienta de Code OS saldrían de su
nodo del hilo (API del puente).

## Lo platicado vuelve a la herramienta

Lo mismo que los bloques `nodo` del Chat de Code OS: **el agente propone, la persona aprueba**.

1. El agente cierra con `Guardar(destino, slug, {datos}, resumen)` dentro de un bloque ` ```ui `.
2. El Chat lo dibuja como «Propuesta para guardar», con el detalle plegado y un botón **Guardar**.
3. Con el clic, `guardarEnDestino` valida los datos contra `DESTINOS[destino].limpiar`, lee lo que hay, **agrega** (nunca
   borra), escribe por la API de la herramienta y emite `os:dato`.

Para sumar un destino: una entrada en `DESTINOS` (`vacio-chat.js`) con `nombre`, `limpiar`, `unir`, `leer` y `escribir`.

## Ejemplo real

`REFERENCIAS_VIDEO` (Marcas · Referencias por pilar, `/api/content/refs`): pasos *Platicar → Referencias por pilar →
Similares → Desglose*; sin referencias monta el vacío conversacional; el Chat devuelve los links con `Guardar("referencias-video", …)`.
Se ve en `/openui-ejemplos.html` (área y artefacto con el mismo dato).
