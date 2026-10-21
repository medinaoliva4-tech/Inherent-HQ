# Instalar — lo que necesita cada computadora

> **Si un agente dice `BLOQUEADO — falta <herramienta>`, la instalación está acá.**
> Sin la herramienta no hay acción: el bloqueo es correcto. Se instala y se vuelve a correr.

## Lo primero — en toda computadora

| Paso | Cómo |
|---|---|
| **Claude Code** | Terminal o pestaña Code de la app de escritorio |
| **El repo en `main`** | `git checkout main && git pull` |
| **Abrir en la raíz** | Claude Code se abre **en la carpeta del repo**: si no, no aparecen las skills ni `.mcp.json` |
| **Windows** | Las skills son atajos (*symlinks*): `git config --global core.symlinks true` **antes** de clonar |

**Para ver qué está conectado:** `/mcp` dentro de Claude Code.

---

## Si el chat de Estrategia no conecta

**El puente de Laya responde, pero el OS dice «Sin conectar»:** Chrome guardó una versión vieja del OS.
1. Toca el ícono a la izquierda de la dirección del OS.
2. «Configuración del sitio» → «Borrar datos».
3. Cierra la pestaña, ábrela de nuevo y vuelve a emparejar la compu.

**El chat dice «OAuth session expired» o «Failed to authenticate»:** se venció la sesión de Claude en esa compu.
1. Abre la Terminal.
2. Escribe `claude` y Enter, luego `/login` y Enter.
3. Inicia sesión en el navegador y vuelve al chat.

## Figma + Figwright

**Para qué:** leer y exportar el kit de redes. ②B Branding.

1. **Figma de escritorio** instalado y con sesión iniciada.
2. **Node.js** instalado *(trae `npx`)*: [nodejs.org](https://nodejs.org).
3. **`.mcp.json` en la raíz del repo** ya trae Figwright. Reiniciá Claude Code para que lo cargue.
4. **En Figma:** abrí el archivo y encendé el plugin **Figwright** *(Plugins → buscar «Figwright»)*.
5. **Probar:** pedile a Claude que corra `ping` de Figwright.

⚠️ **Solo funciona en la computadora que tiene Figma abierto.** Una sesión en la nube no llega.

## Apify

**Para qué:** scraping de redes, Google Maps y la biblioteca de anuncios. ① ② ④ ⑩.

1. Ya está en `.mcp.json`. La primera vez pide **iniciar sesión con tu cuenta de Apify**.
2. **Probar:** `/mcp` → `apify` conectado.

## Zernio

**Para qué:** programar y publicar, y la bandeja de comentarios y mensajes. ⑧ ⑨.

1. **claude.ai → Configuración → Conectores → Zernio**, con la cuenta de Inherent.
2. **Dentro de Zernio**, las cuentas del cliente tienen que estar conectadas *(Instagram, TikTok,
   Facebook, WhatsApp)*.
3. **Probar:** pedile a Claude `accounts_list` de Zernio.

## AdWhispr

**Para qué:** investigar competencia y lanzar pauta. ① ② ⑩.

1. **claude.ai → Configuración → Conectores → AdWhispr.**
2. Para pautar: la **cuenta publicitaria del cliente** conectada dentro de AdWhispr.

## Gmail

**Para qué:** los reportes de ⑧ Community y la bandeja de Administración.

1. **claude.ai → Configuración → Conectores → Gmail**, con el correo de Inherent.

## Google Drive

**Para qué:** el material de cada cliente — fotos, video, el kit exportado. Todos.

1. **claude.ai → Configuración → Conectores → Google Drive**, con la cuenta de Inherent.
2. Acceso a las carpetas de los clientes.

## Firecrawl

**Para qué:** búsqueda web y el research de la comprensión. ①.

1. **claude.ai → Configuración → Conectores → Firecrawl.**

## Herramientas de video

**Para qué:** leer videos de referencia, reencuadrar y el motor de ⑦ Video Editing. ④ ⑥A ⑦.

**Mac:**
```
brew install ffmpeg yt-dlp imagemagick tesseract tesseract-lang
python3 -m pip install numpy pillow opencv-python-headless
python3 -m pip install faster-whisper     # opcional: transcribir audio
```

**El motor de video, en cada proyecto** *(`<proyecto>/production/motion`)*:
```
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt pillow
```

**La skill `/watch`** *(califica los clips)*: no vive en este repo. Va en
`~/.claude/skills/watch/` *(o donde diga la variable `WATCH_SCRIPT`)*. Se la pide al CEO.

**Probar:** `ffmpeg -version`, `yt-dlp --version` y `tesseract --list-langs` *(tiene que aparecer `spa`)*.

⚠️ **Algunos scripts del motor usan una fuente de macOS:** corren en Mac.

## Node y Remotion

**Para qué:** el motor que arma los videos de ⑦ Video Editing y la página donde el cliente aprueba.

1. **Node 20 o más nuevo:** [nodejs.org](https://nodejs.org).
2. **En cada proyecto:**
   ```
   cp -R agents/07-video-editing/brain/motor/remotion <proyecto>/production/motion
   cd <proyecto>/production/motion && npm install
   ```
3. **Vercel** *(la página de aprobación del cliente)*: `npm i -g vercel` y `vercel login`.
   Un proyecto de Vercel por cliente, con un Blob store conectado y la variable `ADMIN_KEY`.

**Probar:** `node --version` *(20 o más)* y `npx remotion --version` dentro del proyecto.

## Plugin claude-ads

**Para qué:** auditar y monitorear cuentas de pauta. ⑩.

Dentro de Claude Code:
```
/plugin marketplace add agricidaniel/claude-ads
/plugin install claude-ads@ai-marketing-hub-claude-ads
```
