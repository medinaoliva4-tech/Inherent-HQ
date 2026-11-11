# Code OS embebido en el Chat del OS

La interfaz puede vivir **dentro del Chat del OS** (`work.inherentglobal.com`) como un iframe de
`code.inherentglobal.com`. Embebida, muestra **solo los paneles** (Cliente y el hilo, Agentes y sus portales,
Herramientas con el editor de video, y Código con Cambios, Archivos y Terminal). El chat es el nativo del OS: Code OS no
duplica la caja de mensajes, la barra lateral ni el login. Sin `?embed=1` sigue siendo la app completa.

Código: `src/lib/embebido.ts` (contrato y validación, con pruebas en `embebido.test.ts`) y `src/components/os/Embebido.tsx`.

## 1 · Cómo lo abre el OS

```html
<iframe
  src="https://code.inherentglobal.com/?embed=1&pase=<PASE>"
  title="Code OS"
  allow="clipboard-write"
  style="border:0;width:100%;height:100%"></iframe>
```

| Parámetro | Para qué |
|---|---|
| `embed=1` | Modo embebido: solo paneles, sin login propio. |
| `pase` | El pase corto que emite `POST /api/code/pase` (el mismo de `chat-code.js`). Solo sirve para la **primera carga**: el puente lo acepta como login de la página (`?pase=`), y la interfaz lo quita de la barra con `history.replaceState` para que no quede en el historial. |

Después, el pase viaja **solo por `postMessage`** y se renueva antes de caducar.

## 2 · Mensajes (`window.postMessage`)

Todos llevan `tipo`. La interfaz **solo acepta** mensajes de `window.parent` y de un origen de la lista
`VITE_EMBED_ORIGENES` (por defecto `https://work.inherentglobal.com`); responde solo a ese origen.

### OS → Code OS

| `tipo` | Campos | Cuándo |
|---|---|---|
| `codeos:pase` | `pase` (string), `expira` (ms epoch, opcional) | Al recibir `codeos:listo` y cada vez que llegue `codeos:pedir-pase`. |
| `codeos:contexto` | `cliente` (slug del selector), `sesion` (id de la sesión del puente de la conversación activa, UUID), `rol` (`ceo`, `coo`, `estrategia`, `creativo`, `produccion`, `editor`, `diseno`), `tema` (`dark` o `light`), `seccion` (`cliente`, `agentes`, `herramientas`, `codigo`), `nivel` (con qué nivel se construyó lo último), `aislada` (boolean) | Al abrir y cada vez que cambie la conversación, el cliente, el tema o el rol. Todos los campos son opcionales y se mezclan con lo anterior. |

### Code OS → OS

| `tipo` | Campos | Qué debe hacer el OS |
|---|---|---|
| `codeos:listo` | `version: 1` | Mandar `codeos:pase` y `codeos:contexto`. |
| `codeos:pedir-pase` | — | Pedir un pase nuevo (`POST /api/code/pase`) y mandarlo con `codeos:pase`. Llega un minuto antes de `expira` o cuando el puente responde 401. |
| `codeos:al-chat` | `texto`, `enviar` (boolean), `modelo` (opcional) | Poner `texto` en la caja del Chat. Si `enviar` es `true`, mandarlo ya (con `modelo` si viene: «Revisar» pide otro nivel distinto al que construyó). Lo usan Start (`@agente `), «Enviar comentarios» del diff y «Revisar». |

Ejemplo del lado del OS:

```js
const CODE = 'https://code.inherentglobal.com';
window.addEventListener('message', async (e) => {
  if (e.origin !== CODE || e.source !== iframe.contentWindow) return;
  const d = e.data || {};
  if (d.tipo === 'codeos:listo' || d.tipo === 'codeos:pedir-pase') {
    const p = await pase(true); // chat-code.js
    iframe.contentWindow.postMessage({ tipo: 'codeos:pase', pase: p.pase, expira: p.expira }, CODE);
    if (d.tipo === 'codeos:listo') iframe.contentWindow.postMessage({ tipo: 'codeos:contexto', cliente, sesion, rol, tema }, CODE);
  }
  if (d.tipo === 'codeos:al-chat') ponerEnLaCaja(d.texto, { enviar: d.enviar, modelo: d.modelo });
});
```

## 3 · Cómo llama al puente

- **HTTP:** `Authorization: Bearer <pase>` con el pase vigente (el puente ya acepta el pase del OS como login).
- **Terminal (WebSocket):** `wss://code.inherentglobal.com/sessions/<sesion>/terminal?pase=<pase>` (un WebSocket no puede mandar
  cabeceras). Protocolo del puente: texto = teclas; `{"t":"resize","cols":N,"rows":N}` = tamaño.
- **Sesión:** la crea el Chat del OS (`chat-code.js`). La interfaz embebida la usa por `contexto.sesion` para Cambios
  (`GET /sessions/:id/diff`), Archivos, Terminal y Fusionar (`POST /sessions/:id/merge`, solo si es aislada).

## 4 · Cabeceras que hacen falta (fuera de `code-os/ui`)

| Dónde | Cabecera | Por qué |
|---|---|---|
| Caddy de `code.inherentglobal.com` (`code-os/despliegue/Caddyfile`) | `Content-Security-Policy: frame-ancestors https://work.inherentglobal.com` | Solo el OS puede meter Code OS en un iframe. Hoy no hay `frame-ancestors` ni `X-Frame-Options`: cualquiera podría enmarcarlo. No poner `X-Frame-Options: DENY`. |
| Puente (`PUENTE_ALLOWED_ORIGINS`) | incluir `https://work.inherentglobal.com` | Ya se usa para el CORS de `chat-code.js`; el iframe es mismo origen, pero el OS sigue llamando directo. |
| OS (`work.`) | `Content-Security-Policy: frame-src https://code.inherentglobal.com` (si el OS tiene CSP) | Permitir el iframe. |
| Cookies | ninguna nueva | `work.` y `code.` son el mismo sitio (`inherentglobal.com`): la cookie `codeos_token` (SameSite=Lax) también viaja dentro del iframe si ya existía. |

## 5 · Qué falta (anotado en `pendiente.md`)

- En el puente: `/entrar?pase=…&volver=/?embed=1` evitaría el pase en la URL de la primera carga (hoy se quita de la
  barra en cuanto carga, y caduca en minutos).
- En el OS: escuchar estos mensajes, mandar el contexto y poner el iframe como pestaña del panel del Chat en modo Code.
