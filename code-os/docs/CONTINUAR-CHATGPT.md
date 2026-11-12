# Relevo para ChatGPT (Codex) · InherentChat y el motor de Code

> Escrito el 2026-11-12 por Claude, por si al CEO se le acaban los créditos de Claude. Léelo completo antes de tocar nada.
> Es el mismo patrón de `ceo-os/CONTINUAR-KIMI.md`. La fuente de verdad del producto sigue siendo `ceo-os/PLAN-GATEWAY.md` y los diseños de `code-os/docs/`.

## 0. Cómo trabaja el CEO (obligatorio)

- **Rodrigo, CEO de Inherent.** Habla corto, en español, de tú, con TDAH: **una sola pregunta a la vez**, lo accionable arriba, sin muros de texto ni jerga. Mensajes mínimos.
- **Antes de construir algo visual, enséñaselo** (dibujo/mockup) y espera su «sí».
- **Nada se mergea sin su «Sí, merge» explícito.** Un PR por tema. Si el sistema de permisos bloquea un merge, no lo rodees: pídele el permiso.
- **Llaves y contraseñas nunca pasan por el chat ni se imprimen.** Las pone él: `ssh -t inherent-gw 'bash ~/set-keys.sh'` (entrada oculta). Tokens de la salida de un comando: no los repitas.
- **Producción** (VPS, Vercel, DNS, la Mac): respaldo antes, reinicia solo lo necesario, verifica `litellm`, `gw-worker`, `cuotas`, `code-os-puente` y `caddy` después. Cambios de producción solo con su OK en el chat.
- **Simple > completo.** Lo viejo que no encaja se **borra**, no se adapta. No 50 agentes ni 30 skills. Si propones mejoras, preséntalas primero.
- **«Code OS» no es un nombre que la persona vea.** Es el motor interno. La persona ve **InherentChat** (Chat y Code) dentro del Inherent OS.
- Su manual vive en `CLAUDE.md` y `inherent/`: **solo recibe lo que él aprobó en ese turno** y antes de escribir se presenta qué se va a escribir.

## 1. La idea del producto (decisiones del CEO)

- **Inherent OS** = dos áreas: **gestión del rol** (tareas, áreas con timelines y herramientas) e **InherentChat** (conversaciones y agentes). El Chat NO es una app aparte.
- Debe sentirse como **Claude** (Chat + Code con la misma forma de trabajar y hablar), usando el **arnés oficial de Claude Code** (Agent SDK) detrás de un puente, con modelos baratos o gratis por LiteLLM. Sin suscripción de Anthropic como proveedor compartido: cada persona usa **su propia** sesión de `claude` si quiere el nivel alto por suscripción.
- **Un solo chat flexible:** no «pasarse a otro chat»; **capacidades** (Código, Figwright, Imágenes, Radar, Video, Herramientas) que se activan en la misma conversación, a mano o por intención («entra a Figma y hazme este diseño»).
- **Figma se conecta por Figwright** (MCP local en la Mac del CEO, puerto 3055). No «Figma directo».
- **Modelos:** todos (tops y bajos). Patrón **«planifica fuerte, ejecuta barato»**: un modelo fuerte (Opus 5.5 o `nivel-alto`) planea y dirige a uno suave (Haiku o `nivel-medio`/`nivel-bajo`) que ejecuta. Orden de «cocineros» del CEO cuando haya Claude por login: chef = Fable/Astra, sous = Sonnet, línea = Opus, prep = Haiku.
- **Cada herramienta vive en su área del OS Y como artefacto en el chat con UN solo dato.** Las tarjetas **no** son la única forma: tabla densa, lista, formulario, timeline, matriz de calor, documento. Tarjeta = objeto que se elige/arrastra/abre/cita.
- **UI uniforme:** un solo switch, un solo botón, un solo toast en toda la plataforma. OpenUI para que las respuestas de agentes sean visuales, no muros de texto.
- **Video = prompting.** No hay editor tipo Premiere (Retoque se borró). El área visual son 3 vistas: **style menu por marca**, **referencias**, **desglose por video**.
- **Departamentos (9 agentes):** 00 account, 01 strategy (absorbió Growth y la adquisición), 02 branding, 03 marketing-creative, 04 production (pre y post), 05 graphic-design, 06 community, 07 posting, 08 ads. 31 skills en total (1 orquestador + ≤4 por agente). Regla agente/herramienta/persona en `code-os/docs/diseno-departamentos.md`.
- **Laya** (`ceo-os/tools/laya-puente`, puente local `127.0.0.1:7357`) = juicios rápidos (sí/no, escala, elegir) sin esperar a un LLM; las «puertas» las edita el CEO.
- Pendiente de estudio (no implementado): teoría de comparación (Elo ya está como «Criterio» en Creative Performance Analyzer; ver `ceo-os/docs/auditoria-criterio-comparacion.md` y PENDIENTES).

## 2. Mapa del repo

| Carpeta | Qué es |
|---|---|
| `ceo-os/` | El OS (JS vanilla sin framework, Vercel). `public/js/screens/llm.js` = InherentChat. `api/` = rutas. `scripts/test-*.mjs` = pruebas. Comandos: `npm test`, `npm run test:ui`, `test:visual`, `test:openui`, `test:code`, `test:llm`, `test:tablas`, `lint:css`. Dev local: `npm run dev` → `http://localhost:3000` y «Entrar en modo prueba». |
| `code-os/puente/` | El Agent SDK detrás de HTTP+SSE (confinado con bubblewrap, llave virtual por usuario, token). Escucha en `127.0.0.1:4300`. |
| `code-os/ui/` | La interfaz React de Code OS (se muestra embebida con `?embed=1` en el panel Herramientas del Chat). |
| `code-os/herramientas/` | Memoria viva del cliente (nodos enlazados, avisos, ICP, calculadoras outbound/inbound) + API; hoy guarda en JSON por cliente. |
| `code-os/litellm/`, `cuotas/`, `planificador/` | Niveles de modelos con respaldo, medidor de cuotas, planificador por deadline. |
| `code-os/imagen/` | Generador de imágenes (OpenAI/Google/NVIDIA) con validación de PNG transparente, costos y topes. |
| `code-os/radar/` | Radar gratis sin Apify (yt-dlp, whisper.cpp, huellas). |
| `code-os/video/` | Style menu, referencias, desglose, `video.derive` con ffmpeg. |
| `code-os/vigia/` | Informe de tecnología (MCPs, open source). |
| `code-os/despliegue/` | Scripts de sincronizar/publicar, Caddyfile, unidad systemd. |
| `agents/` | Los 9 agentes (skills en `agents/<NN>/brain/skills/`). |
| `clients/` | Un folder por cliente. |
| `code-os/docs/` | Diseños y auditorías. **Empieza por** `diseno-departamentos.md`, `herramientas-api.md`, `inventario-claude.md`, `niveles-y-frontier.md`, `despliegue-code-os.md`. |

## 3. Producción hoy (2026-11-12)

- **OS (Vercel):** proyecto `inherent-work`, equipo `medinaoliva4-techs-projects`; alias `inherent-work.vercel.app`. Se despliega solo al mergear a `main`. Variable `CODEOS_URL=https://work.inherentglobal.com`. Base: Supabase (esquema `inherent_os`) — la Neon vieja quedó sin cuota.
- **VPS Contabo (`ssh inherent-gw`, usuario `deploy`, solo con Tailscale encendido):** `litellm` (4000), `gw-worker`, `cuotas` (4200), `code-os-puente` (4300), `caddy`. Código en `~/code-os`, datos en `~/code-os-data` (`users.json`, `puente.env`, `pase.secret`, `herramientas/`). Llaves del Gateway en `/home/deploy/gateway/.env` (nunca en el repo).
- **Motor público:** `https://work.inherentglobal.com` (DNS → `5.189.136.160`, Caddy con TLS). `code.inherentglobal.com` **no tiene registro A** (DNS en Squarespace; solo el CEO puede agregarlo). Cuando exista: correr `CODEOS_DOMINIO=code.inherentglobal.com bash ~/code-os/despliegue/publicar.sh` y cambiar `CODEOS_URL` en Vercel.
- **Despliegue del motor:** desde la Mac, `bash code-os/despliegue/sincronizar.sh` (rsync + build) y luego en el VPS `publicar.sh`. Reinicia con `sudo -n systemctl restart code-os-puente`.
- **Usuarios del puente:** `rodrigo` (llave virtual con $5/30 días). Crear otro: `cd ~/code-os/asistente && node asistente.mjs usuario <id> --directos nv-`. Revisión: `node asistente.mjs`.
- **Niveles** (`litellm.yaml`): `nivel-alto` → Cline Pass `kimi-k3.1-pro`, `nivel-medio` → Cline, `nivel-bajo` → NVIDIA (gratis, lento: 1–3 min por tarea). ModelScope se descartó; Featherless se cancela (aliases aún sin borrar). Cline Pass llegó a marcar cupo agotado (429); los topes del medidor son estimaciones.
- **App de Mac:** releases `escritorio-v0.1.12-20` o más nuevas. La app carga el OS desde Vercel; trae un panel pequeño «Actualización lista» y «Hay cambios nuevos» (PR #308). Solo se arma una app nueva cuando cambia `ceo-os/escritorio/**` o `public/laya/*`.
- **Prueba fuerte con modelos gratis (2026-11-11):** chat, código y plan funcionaron con `nivel-bajo`; la calculadora outbound dio 913/229/46 escrita por el modelo.

## 4. Qué está en `main` (resumen por PR)

#278 inventario de funciones de Claude · #279/#283/#298 interfaz React de Code (chat, panel, artefactos, departamentos, tarjetas de decisión) · #280/#284/#285/#293 puente, seguridad, asistente y sesiones aisladas con worktree · #281 niveles, cuotas y planificador · #286–#292 acceso público, terminal por WebSocket, despliegue · #294 herramientas y memoria viva · #295 vigía · #296 radar · #297 agentes simples (9/31) · #299/#307 video (Retoque se borró) · #300 inventario v2 · #301 imágenes · #302/#312 despliegue (pase del OS y `frame-ancestors`) · #303/#305 primitives y fuente serif (ChatGPT) · #306 departamentos en el Chat, Hormozi como dato, Laya · #308 aviso de actualización · #309 OpenUI visual (sugerencia sobre la caja, vacío conversacional, herramienta montable) · #310 primitives únicos + lint CSS · #311 luz del mouse y carbón del chat · #313–#316 (ChatGPT) herramientas nativas, criterio Elo, Chat y Code nativos · #317 tokens (adiós `--l-*`) · #318 tablas, listas y cifras (Finanzas, Ventas, Paquetes) · #319 `ui.js` con Zag.js 1.47 + Floating UI.

## 5. Trabajo en curso (puede estar a medias)

| Qué | Rama / dónde | Estado |
|---|---|---|
| **Puente: capacidades, Figwright y planifica/ejecuta** | `feat/puente-capacidades-figwright` (agente Opus) | En marcha. Contrato: `GET /capacidades`, `POST/PATCH /sessions` con `capacidades` y `plan_ejecucion`, `GET /models` con `modelos` y `presets`. Entrega scripts `figwright-seguidor.sh`, `figwright-tunel-mac.sh`, plantilla `puente-mcp.json`. **No instala nada**: faltan los comandos de producción (abajo). |
| **Chat del OS: capacidades y modelos en la misma conversación** | `feat/os-chat-capacidades` (agente Opus) | En marcha. Chips de capacidades, activación por intención, selector de modelos con presets, planifica/ejecuta visible. |
| **Adquisición y Dolores nativos + hilo con datos únicos** | worktree `.claude/worktrees/agent-a4492edfa99873687` (rama `feat/os-adquisicion-dolores-hilo`) | **Detenido por el CEO**; el avance quedó guardado sin PR. Objetivo: las 2 vistas nativas pendientes (`ceo-os/public/js/llm/mapa-trabajo.js` tiene `pendiente: true`) y unificar el hilo del cliente en la base del OS (hay dos almacenes: JSON del puente y Supabase). Pregúntale al CEO si se reanuda. |

Si no hay PR abierto de las dos primeras, revisa `git branch -r` y `gh pr list`; si no existe nada, rehazlas desde los contratos de esta sección.

## 6. Lo que sigue (por orden)

1. **Terminar y mergear** los dos PR en curso (revisar, probar, pedir «Sí, merge»).
2. **Figwright desde el chat** (producción, con OK del CEO): en el VPS instalar el seguidor (`figwright-seguidor.sh`), en la Mac cargar el túnel permanente (`figwright-tunel-mac.sh`, LaunchAgent `global.inherent.figwright-tunel`; requiere Mac encendida con Figma y el plugin abiertos), poner `PUENTE_MCP_CONFIG` en `puente.env`/unidad, sincronizar y reiniciar el puente. Verificar con una sesión de prueba que fije el archivo correcto con `list_files`/`use_file` (suele haber 2 archivos abiertos).
3. **Sesiones aisladas por defecto en Code**: «Fusionar» del panel Cambios solo funciona en sesiones aisladas (`isolate:true`) y el Chat crea sesiones normales.
4. **Iniciar sesión de Claude en el servidor**: la persona corre `code-os-login rodrigo` (con SU cuenta; nadie más ve contraseñas). Sin eso el nivel alto cae a Cline Pass.
5. **Llave de imágenes**: `OPENAI_API_KEY` (y opcional `GEMINI_API_KEY`) con `set-keys.sh`; primera prueba real: `imagen estimar` y un lote de 1 imagen. Falta fijar el techo de gasto por cliente. Las declaraciones `openai_imagen`/`google_imagen`/`nvidia_imagen` van en `limites.json` del medidor.
6. **ffmpeg en el VPS** (hoy no hay): `sudo apt-get install -y ffmpeg fontconfig fonts-dejavu-core`, luego probar `video.derive` y el recorte de persona (MediaPipe 0.10.14) con tomas reales. Falta la lista real de transiciones del CEO (`code-os/video/catalogo.json` es editable).
7. **Hilo único en la base del OS** (item 3 de «en curso»): `AlmacenCeoOs` según la guía de `code-os/docs/herramientas-api.md`; sin romper `AlmacenJson`.
8. **UI pendiente:** migrar con `tabla.js`/`lista.js` las pantallas `work.js`, `content.js`, `strategy.js`, `clients.js`, y «Costos por cliente»/`servicesCard`; vistas del Chat con `ui.js` (`.dz-ctxp`, `.hoja` del celular, listas de `@`); 2,022 usos de tokens viejos (`--ink`, `--mut`…) en `app.css`; estados vacíos que quedan (`production/review-ui.js`, `marketing/funnel-ui.js`, `mentors.js`, `screens/workspace.js`, `screens/content.js`, `project-page.js`, `screens/operations.js`); `ceo-os/MAPA.md` y `PLAN-WORKSPACES.md` aún nombran archivos borrados; la página `openui-ejemplos.html` debe enlazar `primitives.css`. Revisar en un navegador con login el Chat real (menús Modelo/Modo, panel de Cambios/Archivos/Terminal, bloques OpenUI) porque en local el servidor de conversaciones suele estar caído.
9. **OpenUI en Code:** el puente debe inyectar `PROMPT_GENUI_MIN` en el sistema de las sesiones de Code; la voz sigue sin OpenUI (`conversacion.js` debe leer `sinUi(texto)`).
10. **Agentes y datos del OS:** la numeración vieja de departamentos (②B, ⑥A, ⑩…) sigue en datos guardados y en `clients/*`; hay 5 pruebas de `ceo-os` que fallan solo en worktrees sin `agents/` (`test:agentes`, `harness`, `strategy`, `produccion`, `consulting`). Decisión abierta: ¿importar los 9 departamentos como «trabajos por etapas» del Agent Area? Si «Creative» sigue nombrándose en `01-IDENTIDAD`/`02-METODO` como capacidad.
11. **Calculadora inbound** con métricas reales de Zernio (adaptador listo, sin cablear); **radar**: falta el adaptador de la API de YouTube, instalar yt-dlp/whisper.cpp/chromaprint en el VPS y probar el bloqueo de IP; **vigía**: el CEO debe aprobar el cron semanal (lunes 7:00 Guatemala) y pasar sus fuentes extra.
12. **Alinear** el aviso `pla-app-mac` (`avisos-reglas/compu.js`) con el número de armado (solo compara semver).
13. **Limpieza con OK:** aliases de Featherless en `litellm.yaml`, arnés propio `inherent`/`kimi`, leftovers de `~/exp-cc`, PR viejos #77 y #3.
14. **Revisiones de seguridad abiertas:** el puente sirve la interfaz sin token (la protege la red); el login de Claude vive en el HOME que el arnés puede leer dentro de su jaula; `VITE_PUENTE_TOKEN` queda en el JS compilado (usar el pase del OS).

## 7. Trampas conocidas

- **Squash merges**: si un PR contiene commits de otra rama ya squasheada, vuelve a chocar; resuelve con `git merge origin/main` en la rama (si el mismo contenido, quédate con la versión de la rama) y revisa `app.css` y `scripts/lint-css.baseline.json`.
- **Lint CSS:** `npm test` falla si hay hex, radios, `font-size` o `!important` **nuevos**; usa tokens (`--ui-*`, `--fs-*`, `--r-*`). Solo actualiza la línea base (`npm run lint:css -- --update`) cuando las cifras bajan.
- **CSP del OS:** `script-src 'self'`; los módulos externos se **vendorizan** en `ceo-os/public/vendor/` (ver `scripts/vendor-ui.mjs`).
- **Worktrees:** el repo local está en `~/Inherent-HQ`; los agentes trabajan en `.claude/worktrees/agent-*`. Una rama no puede estar en dos worktrees a la vez.
- **LiteLLM** tarda 15–30 s en volver tras reiniciar. Cline Pass con `max_tokens` bajo da 500 (el callback sube el mínimo). `--dangerously-skip-permissions` está bloqueado en este entorno.
- **Figwright** necesita `use_file` cuando hay varios archivos abiertos; sus escrituras solo se probaron desde la Mac, no desde el VPS.
- **Zsh:** `echo ====` falla; usa otro separador.

## 8. Cómo retomar en 5 minutos

```bash
cd ~/Inherent-HQ && git checkout main && git pull
gh pr list                       # PR abiertos
git branch -r | grep -E "feat/"  # ramas en curso
cd ceo-os && npm test            # debe pasar todo (5 pruebas de agents/ pueden fallar fuera de main)
ssh inherent-gw 'for s in litellm gw-worker cuotas code-os-puente caddy; do echo $s=$(systemctl is-active $s); done'
```

Memoria del proyecto de Claude (resumen de decisiones, por si no la ves): archivo `inherentchat-arquitectura` y `inherent-gateway-plan` en `~/.claude/projects/-Users-rodrigomedina/memory/`.
