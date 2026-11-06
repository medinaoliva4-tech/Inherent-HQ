# Continuar Inherent OS con Kimi K3

Guía de relevo del 2026-11-05. Quien lea esto debe poder seguir el trabajo sin la conversación anterior.

**Cómo correr Kimi K3 sin costo extra:** usa el comando **`inherent`**, el arnés propio en `ceo-os/scripts/inherent.mjs`. Hace una llamada a la vez, recorta el contexto y resume con NVIDIA. OpenCode queda de respaldo, pero sus llamadas simultáneas chocan con el límite de Featherless. No uses Claude Code. Featherless limita Kimi a 32,768 tokens y Claude Code no compacta por debajo de 100,000. OpenCode sí respeta ese límite (`~/.config/opencode/opencode.json`). Trabaja en tareas cortas, una por sesión: en el spike, una tarea larga leyó y cerró sin escribir.

**Prompt para arrancar:**

> Lee `ceo-os/CONTINUAR-KIMI.md` completo y continúa con la primera tarea pendiente. Antes de escribir código, dime en tres líneas qué vas a hacer.

---

## 1 · Primero lee esto

Lee en este orden:

1. `inherent/00-PRINCIPIOS.md`: lo que nadie rompe.
2. `CLAUDE.md`: cómo está organizado el repo y cómo se le habla al CEO.
3. `ceo-os/PLAN-GATEWAY.md`: es la fuente de verdad. Lee §10 (fases), §13 (orquestador), §21 (F4.6), §23 (áreas) y §24 (lista del CEO).
4. Esta guía.

Si esta guía y `PLAN-GATEWAY.md` chocan, manda `PLAN-GATEWAY.md`. Si el código contradice a los dos, manda el código y lo dices.

## 2 · Reglas de trabajo

**Con el CEO:**
- Habla en español, de «tú», corto y humano. Tiene TDAH: primero lo que debe hacer, en pasos numerados.
- Una sola pregunta a la vez. Sin jerga. Sin muros de texto.
- Di siempre qué no probaste. Nunca digas «listo» por algo que solo compiló.

**Con el código:**
- Cada cambio va en su rama y su PR, desde `main`.
- **Nunca hagas merge sin un OK explícito del CEO para ese PR.** «Sí, merge» vale para el PR que tiene delante.
- No hagas commit de `.claude/launch.json`.
- Antes de abrir PR corre las cuatro suites de la sección 5.
- Termina commits con la atribución que corresponda a quien trabaje. No uses la de Claude.

**Con la seguridad:**
- `inherent/06-ECONOMIA.md` nunca entra a un modelo ni sale del repo.
- Nunca mezcles datos de dos clientes.
- Costos y márgenes de Inherent: solo el CEO. Revisa `CEO_READ` y `dineroDeInherent` en `api/_lib/access.js`.
- Nunca pidas ni repitas llaves o tokens en el chat. El CEO los pone directo en Vercel.
- Gemini Live está en plan gratis: Google puede usar esos datos. A la voz no le mandes datos confidenciales de clientes.
- Pauta y presupuesto necesitan OK del CEO.

## 3 · El sistema en dos minutos

- **OS web:** `ceo-os/`, JavaScript sin framework, Vercel y Neon. Producción: `https://inherent-work.vercel.app`. Proyecto Vercel `inherent-work`.
- **Interfaz:** `public/js/`. Pantallas en `public/js/screens/`. Todo el CSS está en `public/app.css`; lo nuevo va al final o antes del comentario `/* Áreas: propósito, número y tres mesas */`.
- **API:** `api/index.js` y rutas en `api/_lib/*.js`.
- **Patrón de datos:** `db/<colección>` se protege en `api/_lib/access.js`. Una colección nueva necesita `COLLS` y, si es por cliente, `SCOPED` y su función en `scoper`.
- **Patrón de código:** lo puro va en un archivo `*-datos.js` con pruebas. La pantalla va aparte en `*-ui.js`.
- **Trabajador:** `gateway/worker.mjs` corre en el VPS como servicio `gw-worker`. Toma etapas y turnos del Chat desde Neon.
- **App de Mac:** `escritorio/` es Electron. Carga la web de producción, con vibrancy y micrófono.
- **Modelos:** LiteLLM en el VPS. `PREP` en `worker.mjs` es el modelo barato.

**Hecho y en `main`:** §23 áreas (Hoja de Movimientos, Embudo, Rentabilidad, Resultados, Radar, Mapa de la Meta, Voz del comprador, Costo y entrega), F4.6 Entregas 1–5, flechas y dirección, light mode y Chat de entrada con proyectos.

## 4 · Cómo probar en staging

1. Arranca el servidor local de `ceo-os` en el puerto 3000. La configuración de arranque está en `~/.claude/launch.json` o `.claude/launch.json`. Si la API cambió, reinícialo.
2. Entra con la sesión de desarrollo: `http://localhost:3000/api/auth/dev`.
3. Los POST desde pruebas en el navegador deben usar `api()` de `/js/core.js`, por CSRF.
4. El Chat local dice «servidor fuera de línea». Para ver la pantalla, simula `chat/servidor` con `{en_linea:true,modelos:['kimi-k3']}` antes de entrar a `#/chat`.
5. Si la captura sale vieja, recarga. Con el panel del navegador oculto las transiciones se traban: `document.startViewTransition=undefined`.
6. Borra siempre tus datos de prueba.

Staging es `ceo-os-staging`. La base `ep-steep-cake` es **producción**: no la toques en pruebas.

## 5 · Pruebas obligatorias antes de cada PR

```bash
cd ceo-os && node scripts/test-ui.mjs && npm run -s test:llm && node scripts/test-agentes.mjs && node scripts/test-herramientas.mjs
```

Hoy deben dar 65, 20, 74 y 50. Si agregas lógica, agrega su prueba.

## 6 · Cómo publicar

**Web:** el merge a `main` despliega solo en Vercel. Confirma con `curl` que el texto nuevo ya está en producción.

**Autor de los commits:** usa `269283319+medinaoliva4-tech@users.noreply.github.com`. Con otro correo, Vercel puede bloquear el deploy con «GitHub couldn’t verify an account for the commit».

**Si `git push` falla:** GitHub a veces falla sin razón. Reintenta y confirma con `git ls-remote origin refs/heads/<rama>`.

**Merge, solo con OK:**

```bash
gh api -X PUT repos/medinaoliva4-tech/Inherent-HQ/pulls/N/merge -f merge_method=merge -f sha=<head>
```

Confirma antes que el `head` del PR sea el de tu rama y que el estado de Vercel sea `success`.

**Trabajador del VPS:** no es un repo git. Si cambias `gateway/` o algo que importa, hay que copiarlo. Necesita Tailscale.

1. Compara: `ssh inherent-gw 'cd /home/deploy/gateway/gw/ceo-os && md5sum gateway/worker.mjs'`.
2. Revisa que no haya etapas corriendo en `journalctl -u gw-worker`.
3. Respalda en `~/respaldo-gw`.
4. Copia con `scp` a `/home/deploy/gateway/gw/ceo-os/...`.
5. Corre `node --check gateway/worker.mjs` en el servidor.
6. `sudo -n systemctl restart gw-worker`.
7. Confirma `systemctl is-active gw-worker`.

Reiniciar el trabajador en producción necesita OK del CEO.

**App de Mac:** un push a `main` que toque `ceo-os/escritorio/**` arma y publica sola por `.github/workflows/escritorio.yml`. Sube la versión en `escritorio/package.json`. Si falla «Publicar en Releases» con HTTP 500, usa `gh run rerun <id> --failed`: ya pasó dos veces y al tercer intento salió.

## 7 · Trabajo pendiente, en orden

### 7.1 · Actualizaciones de la app (urgente, bloqueado por token)

**Nota del 6 de noviembre:** con el token nuevo siguió el 404. El registro ahora dice qué permisos pide GitHub. Léelo con `escritorio/version` en Vercel antes de pedirle otro token al CEO. Revisa que el dueño del token sea `medinaoliva4-tech` y que no sea de solo repos públicos.

**Estado:** `GET /api/escritorio/version` sigue dando `GitHub respondió 404` en producción. El código ya consulta el repo correcto. El CEO agregó acceso al token y a las 02:45 UTC del 6 de noviembre seguía el 404.

**Cómo resolverlo:**
1. Pídele al CEO que cree un token nuevo de grano fino, dueño `medinaoliva4-tech`, repo `Inherent-HQ`, con Contents en Read and write. El OS también escribe en el repo.
2. Pídele que lo pegue él en Vercel, en `GITHUB_TOKEN`, para Production. No lo pidas en el chat.
3. Cambiar una variable de Vercel exige redesplegar: hazlo desde Vercel o con un merge.
4. Que recargue la app. Revisa los registros.
5. La prueba final es publicar una versión nueva y ver el aviso en `#lat-act`.

### 7.2 · Contexto de la voz

**Estado:** el CEO pidió que la voz tenga contexto. Desde el PR de este cambio recibe lo mismo que el Chat: quiénes somos, oferta, clientes, proyectos, leads y tareas. Falta probarlo en la app.

**Prueba:** por voz, «¿quiénes son mis clientes?» y «¿qué proyectos están abiertos?». Si dice que no tiene acceso:
1. Confirma que `chat/voz/token` devuelve `contexto` con texto.
2. Confirma que `setupVoz` lo manda en `systemInstruction`.
3. Pon el contexto antes de `PROMPT_VOZ` y refuerza la instrucción final de `saberEmpresa`.

Gemini está en plan gratis: Google puede usar estos datos. El CEO ya lo sabe. Finanzas no entra.

### 7.3 · Chat que busca en el OS

El contexto fijo es solo un resumen. La pieza correcta son herramientas de lectura.

1. En `worker.mjs`, `herramientasChat` ya arma herramientas. Agrega `leer_os` con acciones cerradas: `clientes`, `proyectos`, `leads`, `tareas`, `movimientos`, `embudo`.
2. Cada acción llama una ruta del OS con el permiso de la persona. Usa el patrón de `agentes/gateway/mcp` y `GATEWAY_TOKEN`.
3. Filtra con `scoper`, `visible` y `dineroDeInherent`. Finanzas solo CEO.
4. Solo lectura. Toda escritura sigue el flujo de propuestas que ya existe.
5. Este cambio toca el VPS: sigue la sección 6.

### 7.2b · Selector de modelos del Chat

El CEO lo pidió así. El menú `menuModelo` en `public/js/screens/llm.js` hoy mezcla «Cuánto piensa» y modelos en una lista.

1. Separa dos controles: esfuerzo y modelo. Que no se vean iguales.
2. En «Modelos», agrupa por proveedor con flecha: Featherless, NVIDIA y otros. Cada grupo despliega sus modelos.
3. Crea `grupoDeModelo(id)` en un archivo puro: `nv-` es NVIDIA, lo demás del servidor es Featherless. Pruébala. Si `chat/servidor` puede mandar el proveedor, úsalo en lugar del prefijo.
4. Mantén los recomendados y los íconos (`IAS`, `iaDe`, `PREFERIDOS`). Si faltan para contenido y diseño, agrégalos con una lista por modo.
5. Agrega «Agregar proveedor». Abre la sección de conexiones (`#/ajustes/ia`). Al guardar la llave, sus modelos deben aparecer solos: los lee `chat/servidor` desde LiteLLM.
6. La llave se guarda en el servidor y nunca vuelve al navegador. Agregar un proveedor a LiteLLM cambia el VPS: necesita OK del CEO.
7. Revisa computadora, iPhone y modo claro.

### 7.3b · Funciones del Chat contra Claude (el CEO quiere todas)

Antes de construir, abre Claude real y compara. Marca cada una como hecha solo si la probaste. Una por PR.

| Función | Estado | Cómo hacerla |
|---|---|---|
| Arrastrar, pegar y botón + | Hecho solo para texto | `public/js/chat-archivos.js` y `sumarArchivos` en `llm.js` |
| Imágenes | Falta | Confirma que el modelo acepta visión. Manda `content` como lista en `worker.mjs`; hoy el mensaje es texto |
| PDF y Word | Falta | Extrae el texto en el servidor antes de `conArchivos`. Agrega una ruta y una dependencia pequeña |
| Editar un mensaje enviado | Falta | Botón en el mensaje. Corta `mensajes` hasta ahí y reusa `ramificar` o una ruta nueva con `v` |
| Artefactos | Por revisar | Parte de `llm/genui.js`. Falta guardarlos, listarlos, editarlos y compartirlos |
| Memoria entre conversaciones | Por revisar | Debe poder leerse y editarse en Ajustes |
| Instrucciones personales | Por revisar | Una nota en Ajustes que entra a cada turno |
| Instrucciones y archivos por proyecto | Parcial | `chat/clientes/:id` e instrucciones por cliente. Faltan archivos del proyecto |
| Research largo con citas | Por revisar | Usa `investigar` de `gateway/web.mjs` como modo de varios pasos |
| Conectores | Parcial | MCP por persona ya existe en etapas; revisa el Chat |
| Compartir y exportar conversación | Falta | Exportar a Markdown primero. Compartir necesita permiso por persona |
| Estilos de respuesta | Falta | Selector que agrega un bloque al sistema |
| Chat incógnito | Falta | Conversación que no se guarda. Cuida que no llene la memoria |
| Mostrar el razonamiento | Por revisar | El worker ya recibe fragmentos |

La tabla sale de la documentación pública de Claude y de una búsqueda en el código. No es una auditoría completa.

### 7.4 · Error al cambiar de voz en iPhone

Falta el texto exacto. Pídeselo al CEO antes de tocar código. Hoy solo existe la voz Kore (`VOZ` en `api/_lib/chat.js`), así que primero aclara qué botón tocó.

### 7.5 · F6: orquestador

**Meta:** «Arma el mes de AKAI» crea y corre el trabajo correcto. Lee §13.

1. **Enrutador puro:** crea `public/js/orquestador.js` con `pedidoRuta(texto, agentes, clientes)` y `leerRuta(json)`, que devuelve `{ agente, cliente, objetivo, confianza }`. Pruébalo con casos.
2. **Ruta:** `POST agentes/orquestar` llama al modelo barato, valida que el agente y el cliente existan y que la persona los pueda ver.
3. **Chat:** si un mensaje empieza con `/orquesta` o el modo lo pide, muestra la tarjeta «Así lo voy a trabajar» reutilizando `proponerPlan` en `public/js/screens/llm.js`. Nunca arranca sin que la persona toque Empezar.
4. **Equipos:** si pide varios agentes, usa `equipo` y `modo` que ya existen.
5. **Ficha:** si el cliente no tiene ficha de oferta, se bloquea y lo dice.
6. Después sigue W1–W9 por impacto, una por PR.

### 7.6 · Lo que quedó fuera en F4.6

- **Council:** agrega `modo: 'council'`. Arranca como paralelo y, cuando todos terminen, crea una etapa que compare resultados. No decide sola: presenta opciones.
- **Patrones de mejora:** toma `correccionesDe`, agrupa con el modelo barato y propone una regla. Sigue aprobándola una persona. Prueba la regla contra casos anteriores antes de aceptarla.
- **Tarjeta de decisión en el hilo del Chat:** hoy aparece al abrir la etapa, en `agentes-ventana.js`.

### 7.7 · F5: segundo motor y Figma

Claude Code detrás del Gateway y ruta de Figwright. Lee §10 y §14. El servidor de Figwright escucha solo en `127.0.0.1:3055`; desde el VPS hace falta un túnel abierto desde la Mac. Empieza con una prueba mínima en una rama y pide OK antes de instalar nada en el VPS.

### 7.8 · Sonido dentro de la app de Mac

Rama `mac-widevine`, ya en GitHub, sin merge. Cambia Electron por la versión de castLabs `v44.10.1+wvcus`. Widevine carga, y Spotify registró «Inherent OS» como equipo, pero dio `Playback error`. Lo más probable es que falte la firma VMP.

1. El CEO crea su cuenta con `python3 -m castlabs_evs.account signup`.
2. Actualiza la rama con `main`; `main` ya usa 0.1.10.
3. Firma con `python3 -m castlabs_evs.vmp sign-pkg` antes de `codesign`, en `escritorio/firmar.js`.
4. Prueba con la cuenta real.
5. Si suena, guarda las credenciales como secretos de GitHub y agrega el paso al workflow.

El CEO dijo que el sonido ya le funcionó, pero no aclaró dónde. Pregúntale antes de gastar tiempo aquí.

### 7.9 · Detalles (al final)

- Salto raro de Inherent OS a Chat: revisa `startViewTransition` en `app.js` y `data-pantalla`.
- Light mode: pantallas antiguas con texto blanco o colores fijos. Solo se revisaron Hoy, Embudo, CRM y parte del Chat. Reemplaza colores fijos por tokens o por `--tinta`.
- iPhone: tamaños pequeños.
- Notificaciones: ya existen claves VAPID en Vercel. Revisa `pushListo` y prueba con la app instalada desde Safari.
- Print-and-correct: imprimir, marcar con pluma, subir foto y que la IA lea los cambios.

## Registro local del arnés

Cada turno guarda una línea en `~/.inherent/turnos.jsonl`: identificador, fecha, estado, duración y llamadas con modelo, tiempo, espera en cola, espera de reintentos, reintentos iniciados, HTTP y tokens informados por el proveedor. Si no llegaron tokens, se guarda `null`, no cero. No incluye prompts, resultados ni errores crudos. El archivo se crea con permisos 600. `INHERENT_DIR` permite aislar pruebas; no cambia la ruta predeterminada.

El arnés muestra espera en cola incluso sin TTY y un cierre visible (terminado, fallo o límite de pasos). Para comprobar: `node scripts/test-metricas-turno.mjs` y `node scripts/test-estabilidad.mjs`. La prueba del arnés usa un proveedor HTTP simulado; todavía no certifica métricas de una sesión real larga ni notificaciones del sistema operativo.

## 8 · Sin probar en real

Haz estas pruebas cuando el CEO pueda, y corrige lo que falle antes de construir encima:

1. Una etapa real con el revisor y su tarjeta.
2. Un equipo `@A @B` de punta a punta.
3. Una regla aprobada llegando a una etapa.
4. Radar, Resultados y Costo con un rol limitado.
5. Light mode en iPhone y app de Mac.

## 9 · Lo que aprendimos a golpes

- En CSS, `input[type=range]` le gana a una clase: usa `input[type=range].clase`.
- `.llm-compw::before` es un degradado que puede dejar franjas.
- Los errores 5xx se muestran como «Algo falló»: si el mensaje debe llegar a la persona, responde 409.
- `git checkout` y `npm install` en `escritorio/` pueden cambiar el `package-lock.json`: revisa antes de hacer commit.
- Vercel guarda registros solo una hora.
- `--tinta` existe solo desde la línea ~9200 de `app.css`; lo anterior sigue con colores fijos.
- La emulación móvil del navegador cierra la sesión: vuelve a entrar a `/api/auth/dev`.
- Si una prueba de permisos te bloquea, para y dile al CEO qué necesitas. No busques otro camino.
