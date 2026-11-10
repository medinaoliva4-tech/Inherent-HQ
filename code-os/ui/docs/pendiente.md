# Lo que no entró en la v2 de la interfaz

Funciones del inventario (`code-os/docs/inventario-claude.md`) que quedaron fuera, con la razón en una línea.
**Mock** = se ve en la interfaz con datos de ejemplo, pero falta el endpoint del puente para que sea real.

## Faltan endpoints o eventos del puente (la pantalla ya existe o está a medias)
- **Árbol y edición de archivos (mock)**: falta `GET/PUT /sessions/:id/files`.
- **Cambios / diff con comentarios (mock)**: falta `GET /sessions/:id/diff`.
- **Terminal (mock)**: falta una terminal real (`node-pty`) por WebSocket en la carpeta de la sesión.
- **@ mencionar archivos**: solo autocompleta con el árbol del punto anterior.
- **Conectores MCP y skills en ajustes (mock)**: faltan `GET /mcp` y `GET /skills`.
- **Estado de la sesión de Claude y cuotas**: `GET /me` y `GET /cuotas` existen en la rama `feat/code-os-puente-despliegue`, no en `main`.
- **Imágenes y PDF al modelo**: el puente solo acepta `{text}`; hoy los archivos de texto se pegan dentro del mensaje.
- **Corregir mientras trabaja** (mandar otro mensaje sin detener): el puente responde 409 si hay un turno en curso.
- **Reglas de permisos editables**: falta `GET/PUT` de reglas permitir/negar.
- **Modo «Aceptar ediciones» y «Saltar permisos»**: el puente solo tiene `chat`, `plan` y `code`.
- **Checkpoints y rebobinar**: el puente no expone `rewindFiles()`.
- **Separador de compactación**: el puente no emite `compact_boundary`.
- **Historial en el servidor**: hoy se guarda en el navegador (localStorage); falta leer los mensajes de una sesión.
- **Vista previa del servidor de desarrollo del VPS**: falta un proxy por puerto en el puente (hoy solo URLs alcanzables).
- **Panel de detalles de sesión (+líneas, qué corre)**: solo se muestra el contexto; falta el dato del puente.

## Fuera por tamaño o para no volver la interfaz un caos
- **Paneles arrastrables, vista dividida, sacar a ventana**: un panel lateral redimensionable cubre lo diario.
- **Worktree por sesión, entornos guardados, añadir carpetas**: dependen de git y carpetas en el servidor.
- **Crear PR, estado de CI, auto-fix**: necesitan `gh` en el servidor; va después del diff real.
- **Tarjeta de `/code-review` con «Arreglar este»**: hoy `/review` va como texto al motor.
- **Editar un mensaje anterior (ramas)**: necesita árbol de mensajes en el servidor.
- **Chat lateral (`/btw`) y sugerencia de siguiente prompt**: necesitan bifurcar sesión o una llamada extra al modelo.
- **Hooks, plugins y estilos de salida**: P2 del inventario; se editan en el servidor.
- **Esfuerzo (effort)**: no verificado con modelos que no son de Anthropic.
- **Voz y dictado**: P2; necesita voz a texto en el servidor.
- **Tareas programadas**: P2; cron en el servidor.
- **Menú contextual de archivo**: quedó en botones (mencionar, copiar ruta) dentro del visor.

## Dependen del servidor o no se replican
- **Proyectos con base de conocimiento (archivos + búsqueda)**: necesita almacenamiento y vectores en el servidor.
- **Búsqueda web, Research, pensamiento extendido**: son herramientas del servidor, no de la interfaz.
- **Conectores con OAuth, apps MCP UI**: el login y los procesos viven en el servidor.
- **Creación de archivos en contenedor y compartir chats o artefactos**: necesitan almacenamiento con enlaces firmados.
- **Plantillas de artefacto (Docs, Slides…) y artefactos que llaman a Claude**: no replicables como en claude.ai.
- **Modo Auto, Dispatch, nube, Remote Control, seguir otras sesiones, tareas sugeridas**: dependen de Anthropic o de la app de escritorio.
- **Login con la suscripción de Claude**: se hace en el servidor a propósito; la interfaz solo muestra el estado.
