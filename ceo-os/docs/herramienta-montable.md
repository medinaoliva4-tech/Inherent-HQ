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

## Las ocho vistas de departamentos

`public/js/llm/mapa-trabajo.js` ubica `icp`, `adquisicion`, `dolores`, `pilares`, `radar`, `campanas`, `pre` y `video` en las
herramientas del OS. La pestaña Herramientas del Chat lee los mismos entregables, versiones y permisos que el área y monta
el Tool Shell junto a la conversación cuando la herramienta lo admite. Una vista sin equivalente se marca pendiente.

La opción `origen: 'code-os'` y su iframe quedan solo como compatibilidad del contrato anterior; ya no son la pantalla de
Herramientas del Chat. Una acción `Tool(id)` abre la herramienta equivalente del OS o avisa que todavía falta conectarla.

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
