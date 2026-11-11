# Inventario de videos vistos (Claude: Chat, Cowork y Code)

Fecha: 2026-11-11 · Complementa `code-os/docs/inventario-claude.md` (sección G en adelante resume lo que cambió por estos videos). Antes de esto ya se habían visto, solo con transcripción, «Key features of the NEW Claude Code desktop app» y «Desktop app: layout, diff view, and parallel sessions»; no se repiten aquí.

## Cómo se vieron (y qué faltó)

- **Herramienta**: skill `watch` (yt-dlp + ffmpeg). Subtítulos automáticos de YouTube para la transcripción; **no hay clave de Whisper** configurada, pero no hizo falta porque todos tenían subtítulos (salvo el video de Chrome de Anthropic, que no los tiene).
- **Fotogramas**: el script de `watch` falla en esta Mac (`ffmpeg: Unrecognized option 'vsync'`, ffmpeg nuevo). Se extrajeron los fotogramas con ffmpeg directo, en hojas de contacto (6 cuadros por imagen, 12 a 24 cuadros por video, 480 px de ancho). Los videos se bajaron a 480p y **no se guardaron en el repo**.
- **YouTube bloqueó la descarga**: en paralelo respondió 403 y, tras 3 descargas seguidas, 429 (demasiadas peticiones). No se intentó saltar el bloqueo. Por eso la columna «Visto» distingue **Fotogramas + transcripción** de **Solo transcripción**. Nada «visual» se afirma de los que son solo transcripción, salvo lo que el presentador muestra y dice en voz alta.
- La búsqueda se hizo con `yt-dlp ytsearch` (no hay WebSearch directo en esta sesión). Los canales «oficiales» son Anthropic y Claude; el resto son creadores con buena calidad y fecha 2026.

## Resumen en una tabla

| # | Título | Canal | Fecha | Visto | Función principal |
|---|---|---|---|---|---|
| 1 | Learn 80% of Claude Cowork in Under 20 Minutes | Jeff Su | 2026-04-07 | Fotogramas + transcripción | Cowork: archivos locales, memoria, conectores, skills, tareas programadas |
| 2 | Claude Cowork - Full Course for Beginners | Tech With Tim | 2026-03-31 | Fotogramas + transcripción | Cowork: pantalla, permisos de carpeta, proyectos, Claude en Chrome, skills, programadas |
| 3 | Claude Cowork Deep Dive: Live Artifacts, MCP Connectors, Dispatch and Remote Control | Claude Community Australia | 2026-05-14 | Fotogramas (baja calidad) + transcripción | Artefactos vivos, conectores MCP, rutinas, Dispatch, uso del ordenador |
| 4 | Claude Code: The Advanced Guide | Tech With Tim | 2026-09-07 | Solo transcripción | Subagentes, skills, hooks, MCP, worktrees, modo sin pantalla, rewind, ramas |
| 5 | Claude 2.0 Is Here. EVERYTHING in 15 Minutes | Futurepedia | 2026-11-03 | Solo transcripción | La app rediseñada: artefactos nuevos, rail, secciones, sesiones anidadas, mods |
| 6 | Claude Projects Just Got Rebuilt (Full Guide) | AI Foundations | 2026-10-12 | Solo transcripción | Proyectos nuevos: objetivo, coordinador, hilos, biblioteca, rutinas, memoria |
| 7 | Claude Cowork Just Became 10x Better (Scheduled Tasks) | Ben AI | 2026-03-11 | Solo transcripción | Tareas programadas y skills programadas |
| 8 | Claude Agent Skills Explained | Anthropic (oficial) | 2025-11-26 | Solo transcripción | Skills: carga progresiva y cómo encajan con CLAUDE.md, MCP y subagentes |
| 9 | MCP in Claude Code | Claude (oficial) | 2026-05-09 | Solo transcripción | MCP: alcance, `/mcp`, costo de contexto, búsqueda de herramientas |
| — | Let Claude handle work in your browser | Anthropic (oficial) | 2025-12-18 | **No se pudo ver** | Claude en Chrome. Sin subtítulos y la descarga dio 403; se usó lo que dicen los videos 1 y 2 |

Descartados por relleno o por ser muy largos para el valor: el curso de 3 h 20 min de «9x», los de 30+ min con la misma lista de funciones, y varios «tutorial para principiantes» que repiten el video 1.

---

## 1. Learn 80% of Claude Cowork in Under 20 Minutes — Jeff Su (2026-04-07)

Enlace: https://youtu.be/z9rdrNrkvDY · Visto: fotogramas + transcripción.

- **Chat vs. Cowork**: Chat sube los archivos a la nube (20 por conversación, 30 MB cada uno) y entrega texto; Cowork trabaja sobre una **carpeta local**, sin ese tope, y **deja el archivo hecho en la carpeta** (Excel, PDF, PowerPoint). Se pide distinto: en Chat «paso a paso»; en Cowork **por resultado** (resultado final, restricciones, nivel de calidad).
- **Cómo se ve**: pantalla de inicio «Let's knock something off your list» con una caja de texto, selector de carpeta, botón «+» y botón «Let's go»; debajo, lista de «Active tasks». En una tarea, panel derecho con progreso. Las skills se muestran como tarjeta con el archivo `SKILL.md` y un botón «Copy to your skills».
- **Seguridad por instrucciones**: puso en las instrucciones globales de Cowork reglas como «antes de borrar, sobrescribir o renombrar, muéstrame qué va a cambiar y espera confirmación» y una carpeta de juego («Cowork Playground»). Cowork **solo lee archivos dentro de la carpeta concedida**.
- **Memoria en archivos**: Cowork escribe `CLAUDE.md` y `memory.md` **visibles en la carpeta** cuando se le pide «recuerda esto». Es memoria sin límite de tamaño de la nube y editable a mano. Un flujo «inbox cero» programado a las 6:00 usa esas dos reglas y las correcciones acumuladas.
- **Skills y conectores**: «convierte lo que acabas de hacer en una skill» (usa la skill `skill-creator`, hace preguntas, crea y prueba). Conectores en *Customize → Connectors → «+» → Browse* (Gmail, Calendar, Drive, Notion); «Add custom connector» pide nombre y URL de servidor MCP remoto con aviso de confianza. Opinión del autor: la extensión de Chrome es **lenta, poco fiable y gasta cuota**; solo Cowork puede programar tareas que funcionan porque combinan archivos, memoria y conectores.

## 2. Claude Cowork - Full Course for Beginners — Tech With Tim (2026-03-31)

Enlace: https://youtu.be/tf_KmDNZXzI · Visto: fotogramas + transcripción.

- **Pantalla (fotogramas)**: barra lateral izquierda con *New task, Search, Scheduled, Dispatch, Ideas, Customize*, luego *Projects* y *Recents*. Arriba, selector de tres pestañas **Chat / Cowork / Code**. Página de proyecto con caja «What would you like to work on in this project?», selector de modelo, y a la derecha tres bloques: **Instructions, Scheduled, Context** (carpeta local) y **Memory**. En la tarea, un panel «Progress» con tres círculos y «Working folder / Context».
- **Preguntas con opciones**: antes de actuar, Cowork muestra una tarjeta numerada («1 Consolidar (recomendado), 2 Catch-all, 3 Dejar como está») con «Skip»: es el equivalente de la herramienta de preguntas del SDK.
- **Las sesiones de Cowork no se acuerdan entre sí**; la solución es trabajar **dentro de un proyecto**, que añade pestaña de memoria. Permiso por carpeta: «solo toca lo que le concedes» y lo que hace **no se puede deshacer**.
- **Subagentes**: al buscar vuelos lanzó 17 búsquedas en paralelo. **Claude en Chrome**: extensión que se empareja con la app; abre una pestaña propia, se ve lo que hace y devuelve capturas por paso. Avisa del riesgo: tiene sesión iniciada en las cuentas del usuario.
- **Skills y programadas**: la skill es un `.md` con pasos; «Copy to my skills» y se invoca con `/nombre`. Una tarea programada tiene **descripción, prompt, frecuencia, modelo y carpeta**; **solo corre si la app está abierta y la computadora encendida**. Datos de plan: Cowork requiere plan de pago; Opus gasta mucho más cuota que Sonnet; Dispatch permite mandar tareas desde el teléfono.

## 3. Claude Cowork Deep Dive: Live Artifacts, MCP Connectors, Dispatch and Remote Control — Claude Community Australia (2026-05-14)

Enlace: https://youtu.be/IIqiNPavq08 · Visto: fotogramas (grabación de sala, poca resolución) + transcripción.

- **Artefactos vivos**: un tablero que no es estático sino que **lee datos de un conector MCP** y se refresca solo (ingresos de una tienda simulada cada 5 s). Se ve como panel a la derecha de la conversación con tarjetas y una gráfica. El demo **falló dos veces** («Tool call failed») y hubo que reiniciar: la función es frágil.
- **Rutinas**: se programan con nombre, descripción, prompt y frecuencia (hora, día, semana) dentro de un proyecto; por ejemplo, un resumen matutino del canal de soporte de Slack. «Convertir en skill» y luego ejecutar la skill.
- **`CLAUDE.md` por carpeta es jerárquico**: una carpeta de empresa con otra de finanzas y otra de publicidad, cada una con sus reglas.
- **Dispatch**: manda tareas desde la app del teléfono a la computadora; el historial de Dispatch es un canal aparte, no ve los otros chats; la computadora debe estar encendida y despierta.
- **Uso del ordenador** (ajuste «computer use» en la app de escritorio, Windows): controla aplicaciones fuera del navegador; el autor pide cuidado. Cambio de interfaz: el selector Chat/Cowork/Code pasó **a la derecha**. No hay traspaso real de Chat a Cowork.

## 4. Claude Code: The Advanced Guide — Tech With Tim (2026-09-07)

Enlace: https://youtu.be/kt5a-TXmWew · Visto: solo transcripción.

- **Subagentes propios**: archivos `.md` en una carpeta de agentes con nombre, descripción, herramientas permitidas y modelo opcional; `/context` los lista; trabajan en su propio hilo y **solo devuelven el resultado** al hilo principal (contexto más limpio).
- **Skills**: `name` y `description` son lo único que ve el modelo antes de decidir; la marca **disable-model-invocation** impide que Claude la use sola (aparece con candado en `/skills`) y solo corre con `/nombre argumentos`.
- **Hooks**: se enganchan a eventos (inicio de sesión, envío de prompt, antes y después de usar herramienta); un script que sale con código 2 **bloquea** la acción. Demos: formatear con Prettier tras cada edición y bloquear comandos peligrosos.
- **Worktrees** (`claude --worktree nombre`) para sesiones paralelas sin pisarse; luego una sesión aparte los fusiona. **Modo sin pantalla** (`claude -p`, salida JSON con resultado, costo, turnos y duración, `--allowedTools`) para scripts.
- **Rewind y sesiones**: `/rewind` muestra los puntos y permite «restaurar código y conversación»; `--continue`, `--resume nombre`, `-n` para nombrar, `/branch` para bifurcar sin tocar la original. MCP: ejemplo con Granola.

## 5. Claude 2.0 Is Here. EVERYTHING in 15 Minutes — Futurepedia (2026-11-03)

Enlace: https://youtu.be/tM0dwXhOv2o · Visto: solo transcripción (el video más importante; ver nota arriba sobre el bloqueo de YouTube).

- **Rediseño de la app**: ya **no hay pestaña Cowork**; queda **Home (Chat + Cowork) y Code**. Artefactos nuevos: **Documentos, Presentaciones (exporta a PowerPoint), Diseño (la plataforma aparte se apaga), Tableros vivos (datos de conectores) y Movimiento (animación por código)**; tableros y movimiento en beta.
- **Rail de sesión** (arriba a la derecha): dónde corre (local o nube), carpeta, control remoto, **contexto con desglose** (mensajes, conectores, skills, agentes, memoria) y un anillo de contexto junto al selector de modelo. Paneles: terminal, cambios, navegador, archivos. **Secciones** en la barra lateral (carpetas para agrupar sesiones, se arrastran).
- **Chat lateral** (no se guarda) vs **bifurcar** (copia la sesión desde ese punto); **vista dividida**; **/goal** (se le da una meta verificable y sigue hasta cumplirla); «mantener el equipo despierto»; sesiones en la nube.
- **Multitarea**: **sesiones anidadas** (sub-sesiones visibles bajo la principal, con «task chips» que las proponen), **sesión maestra** (una sesión fija que ve y gobierna las otras: «¿qué espera por mí?», ve las 20 últimas) y **Proyectos de Code** (chat coordinador que reparte hilos en la nube con la memoria del proyecto).
- **Mods**: Claude modifica su propia app («hazme un mod que…»). Ejemplos: «blast radius» (muestra qué se perdería antes de un comando destructivo, con botón de cancelar), «modo grabación» (oculta claves y correos) y uno que mantiene caliente el caché de prompt.

## 6. Claude Projects Just Got Rebuilt (Full Guide) — AI Foundations (2026-10-12)

Enlace: https://youtu.be/MLl41Q9p3Ps · Visto: solo transcripción.

- **Crear**: «+» junto a Projects → **nombre, ícono/color, objetivo (una frase: el trabajo permanente) y contexto** (archivos, carpeta o repositorio de GitHub). El objetivo no es una tarea: es el «puesto» que persigue el coordinador.
- **Una sola caja de prompt**: lo que se escribe va a un **agente coordinador** que lo divide en **hilos** en paralelo y devuelve un plan unificado. Panel derecho con **Hilos, Biblioteca (archivos propios y creados por Claude; «16 de 50.000») y Rutinas** (automatizaciones recurrentes), que se pueden ocultar con «+».
- **Ajustes de proyecto**: pestañas General (modelo y esfuerzo del coordinador, por defecto bajo, y de los hilos, por defecto medio), **Memoria** (instrucciones del proyecto + `memory.md`, ambos cargados al inicio de **cada hilo**), Entorno, Uso y Depuración. La memoria exige activar el ajuste de memoria de la cuenta.
- Dos usos: trabajo continuo (canal, boletín) o con meta final (lanzamiento de 90 días, luego se archiva).

## 7. Claude Cowork Just Became 10x Better (Scheduled Tasks) — Ben AI (2026-03-11)

Enlace: https://youtu.be/F6T3WkTWYX4 · Visto: solo transcripción.

- Barra lateral con **«Scheduled»**: nueva tarea con nombre, descripción, prompt, frecuencia (cada mes, semana, día o 10 minutos), modelo y carpeta. Lo que hace es **mandar un prompt a una sesión nueva** a esa hora. También se crea con `/schedule` o pidiéndolo al crear una skill.
- La utilidad real son las **skills programadas** («usa la skill de correo diario»): revisión de correo, repaso de tareas, seguimiento de pagos fallidos que **deja borradores en Gmail para revisar** (no envía), contabilidad mensual. Hay una lista de ejecuciones por tarea.
- Límite: solo corre con la app abierta; si estaba cerrada, corre al abrirla.

## 8. Claude Agent Skills Explained — Anthropic (2025-11-26)

Enlace: https://youtu.be/fOxC44g8vig · Visto: solo transcripción.

- Una skill es una **carpeta** con `SKILL.md`; al arrancar solo se cargan **nombre y descripción** (30 a 50 tokens por skill); el contenido completo y los scripts se cargan **al hacer falta** (carga progresiva), por eso se pueden instalar muchas.
- Reparto de papeles: `CLAUDE.md` = el proyecto; **skills** = experiencia portátil; **MCP** = acceso a datos y herramientas; **subagentes** = roles con su contexto y permisos. Son piezas que se combinan.

## 9. MCP in Claude Code — Claude (2026-05-09)

Enlace: https://youtu.be/kkBFmwkDzdo · Visto: solo transcripción.

- Dos tipos de servidor: **HTTP remoto** y **local por entrada/salida estándar**; `claude mcp add`; `/mcp` para ver estado y apagar; tres alcances: **local, usuario y proyecto** (`.mcp.json` versionado).
- Costo: los servidores **gastan contexto aunque no se usen**; si pasan del 10 % del contexto se activa **búsqueda de herramientas bajo demanda**. Si hay una CLI equivalente (`gh`, `aws`), conviene una skill con la CLI.

---

## Lo que NO se pudo ver

- **Claude en Chrome (video oficial de Anthropic)**: sin subtítulos y descarga bloqueada. Lo que se sabe sale de los videos 1 y 2.
- **Plantillas de «Ideas»** de la barra lateral de Cowork y **plugins**: aparecen en pantalla pero ningún video las abre.
- **Cómo se ve «Claude 2.0» y los Proyectos nuevos**: solo se tienen sus descripciones en voz; ver la sección E de `inventario-claude.md` para lo pendiente de verificar con la app abierta.
