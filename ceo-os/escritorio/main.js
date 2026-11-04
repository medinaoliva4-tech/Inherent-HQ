// Inherent OS para escritorio: el OS en su propia ventana, con el puente de Laya adentro.
//   1. Al abrir, si el puente ya corre en la compu (el del instalador de un comando), lo usa; si no, prende el que trae la app.
//   2. Le pasa al OS el token del puente: ya no hay que emparejar la compu ni pegar nada.
//   3. Al cerrar la app, apaga el puente que prendió (el del instalador lo deja como estaba).
//   4. Si Laya no está en la Mac, la instala la primera vez (con tu OK): el mismo instalador de un comando, que trae adentro.
//   5. Se pone al día sola: si hay una versión nueva de la app, avisa y con un clic se reemplaza y se vuelve a abrir.
//   6. Arranca al 85% del tamaño y recuerda el que elijas (⌘ − / ⌘ + / ⌘ 0).
// El puente es el mismo archivo de la web (public/laya/puente.py) y corre con el Python de la Mac.
const { app, BrowserWindow, Menu, shell, dialog, ipcMain, Notification, net } = require('electron');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const OS_URL = process.env.INHERENT_OS_URL || 'https://inherent-work.vercel.app';
const OS_HOST = new URL(OS_URL).host;
const PUERTO = 7357;
const DATOS = path.join(os.homedir(), '.inherent', 'laya');
const CASA = os.homedir();
// Donde suelen estar Claude Code, git y Python: una app de la Mac no hereda el PATH de la terminal.
const RUTAS = [path.join(CASA, '.claude', 'local'), path.join(CASA, '.local', 'bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];

let ventana = null;
let puente = null; // el proceso del puente, solo si lo prendió la app

// Google no deja iniciar sesión desde un navegador «embebido»: la app se presenta como el Chrome que lleva adentro.
app.userAgentFallback = app.userAgentFallback.replace(/\s(Electron|inherent-os-escritorio|Inherent OS)\/\S+/g, '');

// ---------- El puente ----------
const salud = (ms = 1500) => new Promise((ok) => {
  const r = http.get({ host: '127.0.0.1', port: PUERTO, path: '/health', timeout: ms }, (res) => { res.resume(); ok(res.statusCode === 200); });
  r.on('timeout', () => { r.destroy(); ok(false); });
  r.on('error', () => ok(false));
});
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// El Python con el que corre el puente: el del instalador de un comando, el de Homebrew o el de la Mac.
function python() {
  const opciones = [path.join(DATOS, 'venv', 'bin', 'python'), '/opt/homebrew/bin/python3', '/usr/local/bin/python3'];
  for (const p of opciones) if (fs.existsSync(p)) return p;
  // /usr/bin/python3 existe siempre, pero sin las herramientas de línea de comandos de Apple solo abre su instalador.
  try { execFileSync('/usr/bin/xcode-select', ['-p'], { stdio: 'ignore' }); return '/usr/bin/python3'; } catch { return null; }
}

// El puente de siempre (el del instalador) arranca solo con la Mac: si recién se encendió, se le dan unos segundos.
const PLIST = path.join(CASA, 'Library', 'LaunchAgents', 'global.inherent.laya.plist');

async function prenderPuente() {
  if (await salud()) return 'ya-corria';
  if (fs.existsSync(PLIST)) for (let i = 0; i < 8; i++) { await esperar(600); if (await salud(800)) return 'ya-corria'; }
  const py = python();
  if (!py) return 'sin-herramientas';
  const script = app.isPackaged ? path.join(process.resourcesPath, 'puente', 'puente.py') : path.join(__dirname, '..', 'public', 'laya', 'puente.py');
  const logs = path.join(DATOS, 'logs');
  fs.mkdirSync(logs, { recursive: true });
  puente = spawn(py, [script, '--log', logs], {
    env: { ...process.env, PATH: [...RUTAS, process.env.PATH || ''].join(':'), PYTHONUNBUFFERED: '1', LAYA_PUENTE_DATOS: DATOS },
    stdio: 'ignore',
  });
  puente.on('exit', () => { puente = null; });
  for (let i = 0; i < 40; i++) { if (await salud(800)) return 'prendido'; if (!puente) break; await esperar(500); }
  return 'no-respondio';
}
function apagarPuente() { if (puente) { try { puente.kill('SIGTERM'); } catch { /* ya estaba apagado */ } puente = null; } }

// El token del puente (lo crea el puente la primera vez): se le pasa al OS para que no haya que emparejar.
const token = () => { try { return fs.readFileSync(path.join(DATOS, 'chat-token'), 'utf8').trim(); } catch { return ''; } };
// Solo al OS: una página de Google (el inicio de sesión) nunca lo recibe.
ipcMain.on('inherent:token', (e) => { e.returnValue = delOS(e.senderFrame?.url || '') ? token() : ''; });
// Hermes se retiró (PLAN-GATEWAY F3): el Chat corre en el servidor de Inherent. La app ya no lo instala ni le pasa su llave al OS.
ipcMain.on('inherent:hermes', (e) => { e.returnValue = null; }); // apps viejas lo siguen pidiendo
// La versión instalada (no es secreta): el OS la compara con la última publicada y avisa si hay una nueva (aviso pla-app-mac).
ipcMain.on('inherent:version', (e) => { e.returnValue = app.getVersion(); });
// «Actualizar la app» desde el OS: el mismo diálogo del menú Inherent OS › Buscar actualizaciones… (solo desde el OS).
ipcMain.on('inherent:actualizar', (e) => { if (delOS(e.senderFrame?.url || '')) buscarActualizacion(true); });

// Sin las herramientas de Apple no hay git ni Python: se ofrece instalarlas (un clic, las instala la Mac).
async function avisarHerramientas() {
  const r = await dialog.showMessageBox(ventana, {
    type: 'info',
    message: 'Falta un paso para que el chat corra en tu compu',
    detail: 'La Mac necesita sus «herramientas de línea de comandos» (traen git y Python). Se instalan una sola vez, con el instalador de Apple. Cuando termine, vuelve a abrir Inherent OS.',
    buttons: ['Instalarlas', 'Ahora no'],
    defaultId: 0,
  });
  if (r.response === 0) { try { spawn('/usr/bin/xcode-select', ['--install'], { stdio: 'ignore', detached: true }).unref(); } catch { /* sin xcode-select */ } }
}

// ---------- Laya: si no está en la Mac, la app la instala (una sola vez, con tu OK) ----------
const PY_LAYA = path.join(DATOS, 'venv', 'bin', 'python');
const NO_PREGUNTAR = path.join(DATOS, 'app-sin-laya'); // «Ahora no»: no se vuelve a preguntar al abrir; queda en el menú Puente
let instalando = null; // { proc, ventana }

function layaInstalada() {
  if (!fs.existsSync(PY_LAYA)) return false;
  try { execFileSync(PY_LAYA, ['-c', 'import importlib.util, sys; sys.exit(0 if importlib.util.find_spec("laya") else 1)'], { stdio: 'ignore', timeout: 20000 }); return true; } catch { return false; }
}

// Devuelve true si empezó a instalar.
async function ofrecerLaya() {
  if (process.platform !== 'darwin' || instalando || fs.existsSync(NO_PREGUNTAR) || layaInstalada()) return false;
  const r = await dialog.showMessageBox(ventana, {
    type: 'info',
    message: 'Falta instalar Laya en esta Mac',
    detail: 'Laya es el modelo que juzga y ordena el trabajo, y corre en tu compu. Se instala una sola vez: 5 a 15 minutos y baja cerca de 1.5 GB. Mientras tanto, el OS funciona normal.',
    buttons: ['Instalar ahora', 'Ahora no'],
    defaultId: 0,
    cancelId: 1,
  });
  if (r.response === 0) { instalarLaya(); return true; }
  try { fs.mkdirSync(DATOS, { recursive: true }); fs.writeFileSync(NO_PREGUNTAR, new Date().toISOString()); } catch { /* sin carpeta: se vuelve a preguntar */ }
  return false;
}

const PANTALLA = `<!doctype html><meta charset="utf-8"><title>Instalando Laya</title><style>
body{font:14px -apple-system,system-ui,sans-serif;background:#f1eadf;color:#2b2118;margin:0;padding:24px 28px}
h1{font-size:17px;margin:0 0 6px}p{margin:0;color:#6b5d50;line-height:1.45}#p{margin-top:18px;font-weight:600;color:#2b2118}
.b{margin-top:12px;height:6px;border-radius:3px;background:#e2d8ca;overflow:hidden}.b i{display:block;height:100%;width:35%;background:#2b2118;border-radius:3px;animation:a 1.4s ease-in-out infinite}
@keyframes a{from{transform:translateX(-100%)}to{transform:translateX(300%)}}</style>
<h1>Instalando Laya</h1><p>Una sola vez, de 5 a 15 minutos. Puedes cerrar esta ventana: sigue sola y te aviso al terminar.</p>
<div id="p">Empezando…</div><div class="b"><i></i></div><script>function paso(t){document.getElementById('p').textContent=t}</script>`;

function instalarLaya() {
  if (instalando) { instalando.ventana?.show(); return; }
  try { fs.rmSync(NO_PREGUNTAR, { force: true }); } catch { /* no estaba */ }
  const script = app.isPackaged ? path.join(process.resourcesPath, 'puente', 'instalar.sh') : path.join(__dirname, '..', 'public', 'laya', 'instalar.sh');
  const w = new BrowserWindow({ width: 460, height: 210, resizable: false, maximizable: false, fullscreenable: false, title: 'Instalando Laya', backgroundColor: '#f1eadf', webPreferences: { sandbox: true, contextIsolation: true } });
  w.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(PANTALLA));
  // LAYA_DESDE_APP: el instalador avisa «Cambiando al puente de siempre» y espera a que la app apague el suyo.
  const proc = spawn('/bin/bash', [script], { env: { ...process.env, PATH: [...RUTAS, process.env.PATH || ''].join(':'), LAYA_DESDE_APP: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  instalando = { proc, ventana: w };
  w.on('closed', () => { if (instalando) instalando.ventana = null; });
  let error = '';
  const leer = (buf) => {
    for (const linea of String(buf).split('\n')) {
      const t = linea.trim();
      if (t.startsWith('→ ')) {
        const paso = t.slice(2);
        if (!w.isDestroyed()) w.webContents.executeJavaScript(`paso(${JSON.stringify(paso)})`).catch(() => {});
        if (paso.startsWith('Cambiando al puente de siempre')) apagarPuente();
      } else if (t.startsWith('❌')) error = t.slice(1).trim();
    }
  };
  proc.stdout.on('data', leer);
  proc.stderr.on('data', leer);
  proc.on('error', (e) => { error = String(e.message || e); });
  proc.on('close', async (code) => {
    instalando = null;
    if (!w.isDestroyed()) w.close();
    if (code === 0) new Notification({ title: 'Laya quedó instalada', body: 'Ya corre en tu Mac, también al reiniciar.' }).show();
    else await dialog.showMessageBox(ventana, { type: 'warning', message: 'Laya no se pudo instalar', detail: `${error || 'Algo falló a medio camino.'}\n\nEl OS funciona igual. Para intentarlo otra vez: menú Puente › Instalar Laya.`, buttons: ['Entendido'] });
    if (!(await salud())) await prenderPuente(); // si el puerto quedó vacío, la app prende el suyo
  });
}

// ---------- El tamaño: arranca al 85% y recuerda el que elijas ----------
const AJUSTES = path.join(DATOS, 'app-ajustes.json');
const ZOOM_BASE = 0.85;
const PASOS_ZOOM = [0.67, 0.75, 0.8, 0.85, 0.9, 1, 1.1, 1.25, 1.5];
const ajustes = () => { try { return JSON.parse(fs.readFileSync(AJUSTES, 'utf8')); } catch { return {}; } };
const guardarAjuste = (k, v) => { try { fs.mkdirSync(DATOS, { recursive: true }); fs.writeFileSync(AJUSTES, JSON.stringify({ ...ajustes(), [k]: v })); } catch { /* sin carpeta: no se recuerda */ } };
const zoom = () => { const z = Number(ajustes().zoom); return z >= 0.5 && z <= 2 ? z : ZOOM_BASE; };
function ponerZoom(z) { ventana?.webContents.setZoomFactor(z); guardarAjuste('zoom', z); }
function moverZoom(d) {
  const z = zoom(); let i = 0;
  PASOS_ZOOM.forEach((p, k) => { if (Math.abs(p - z) < Math.abs(PASOS_ZOOM[i] - z)) i = k; });
  ponerZoom(PASOS_ZOOM[Math.max(0, Math.min(PASOS_ZOOM.length - 1, i + d))]);
}

// ---------- Actualizaciones: la app se pone al día sola ----------
// Al abrir (y cada 6 horas) le pregunta al OS por la última versión publicada desde main (el repo es privado: el OS la lee
// con su token y la app pregunta con tu sesión). Si hay una más nueva, avisa. «Actualizar» baja el .zip, cambia la app y la
// vuelve a abrir. Si macOS no deja cambiarla, muestra la nueva en el Finder para arrastrarla a Aplicaciones.
const mayor = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
let actualizando = false, revisando = false, revisado = false, saltada = null;

// Una ruta del OS con la sesión de la ventana. null si la ventana no está en el OS o no respondió.
async function preguntarOS(ruta) {
  if (!ventana || !delOS(ventana.webContents.getURL())) return null;
  const js = `fetch(${JSON.stringify('/api/' + ruta)}, { credentials: 'same-origin', cache: 'no-store' }).then((r) => r.json().then((j) => (r.ok ? j : { error: j.error || r.status }), () => ({ error: r.status }))).catch(() => null)`;
  try { return await ventana.webContents.executeJavaScript(js, true); } catch { return null; }
}

// Devuelve true si el OS contestó (haya o no versión nueva).
async function buscarActualizacion(aMano = false) {
  if (actualizando || revisando) return false;
  revisando = true;
  try {
    const v = await preguntarOS('escritorio/version');
    if (!v || v.error) {
      if (aMano) await dialog.showMessageBox(ventana, { type: 'info', message: 'No pude revisar si hay una versión nueva', detail: 'Abre el OS con tu sesión iniciada y vuelve a intentarlo.', buttons: ['Entendido'] });
      return false;
    }
    if (!v.version || !mayor(v.version, app.getVersion())) {
      if (aMano) await dialog.showMessageBox(ventana, { type: 'info', message: `Ya tienes la última versión (${app.getVersion()})`, buttons: ['Entendido'] });
      return true;
    }
    if (!aMano && saltada === v.version) return true;
    const r = await dialog.showMessageBox(ventana, {
      type: 'info',
      message: `Hay una versión nueva de Inherent OS (${v.version})`,
      detail: `Tienes la ${app.getVersion()}. Se baja, se cambia y la app se vuelve a abrir sola. Tarda un par de minutos.`,
      buttons: ['Actualizar', 'Después'],
      defaultId: 0,
      cancelId: 1,
    });
    if (r.response === 0) actualizar(); else saltada = v.version;
    return true;
  } finally { revisando = false; }
}

const CAMBIAR = `#!/bin/bash
# Cambia la app por la versión nueva cuando la vieja termina de cerrarse, y la vuelve a abrir.
pid="$1"; actual="$2"; nueva="$3"
for _ in $(seq 1 60); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
xattr -dr com.apple.quarantine "$nueva" 2>/dev/null
if mv "$actual" "$actual.vieja" 2>/dev/null; then
  if mv "$nueva" "$actual"; then rm -rf "$actual.vieja"; open "$actual"; exit 0; fi
  mv "$actual.vieja" "$actual"
fi
open -R "$nueva"
osascript -e 'display dialog "macOS no dejó que Inherent OS se cambiara sola. Arrastra la app nueva (la que ves en el Finder) a Aplicaciones y reemplaza la anterior." buttons {"Entendido"} default button 1 with title "Inherent OS"' >/dev/null 2>&1
`;

async function actualizar() {
  actualizando = true;
  const fallo = async (m) => {
    actualizando = false; ventana?.setProgressBar(-1);
    await dialog.showMessageBox(ventana, { type: 'warning', message: 'No se pudo actualizar', detail: `${m}\n\nLa app sigue funcionando. Puedes bajar la versión nueva desde la página de descargas.`, buttons: ['Entendido'] });
  };
  if (process.platform !== 'darwin') return fallo('La actualización automática es para Mac.');
  const d = await preguntarOS(`escritorio/descarga?arch=${process.arch === 'x64' ? 'x64' : 'arm64'}`);
  if (!d?.url) return fallo(d?.error ? String(d.error) : 'El OS no respondió.');
  let host = ''; try { host = new URL(d.url).host; } catch { /* link raro */ }
  if (!/(^|\.)githubusercontent\.com$|(^|\.)github\.com$/.test(host)) return fallo('El link de descarga no es de GitHub.');
  const dir = path.join(app.getPath('temp'), 'inherent-os-actualizacion');
  const zip = path.join(dir, 'app.zip');
  try {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const r = await net.fetch(d.url);
    if (!r.ok || !r.body) throw new Error(`La descarga respondió ${r.status}.`);
    const total = Number(r.headers.get('content-length')) || d.tam || 0;
    const out = fs.createWriteStream(zip); let bajado = 0;
    for await (const parte of r.body) {
      bajado += parte.length;
      if (!out.write(parte)) await new Promise((ok) => out.once('drain', ok));
      if (total) ventana?.setProgressBar(Math.min(1, bajado / total));
    }
    await new Promise((ok, mal) => { out.on('error', mal); out.end(ok); });
    ventana?.setProgressBar(2); // sin porcentaje mientras se abre el .zip
    execFileSync('/usr/bin/ditto', ['-x', '-k', zip, dir]);
  } catch (e) { return fallo(String(e.message || e)); }
  const nombre = fs.readdirSync(dir).find((n) => n.endsWith('.app'));
  if (!nombre) return fallo('El .zip no traía la app.');
  const nueva = path.join(dir, nombre);
  const actual = path.resolve(process.execPath, '..', '..', '..'); // …/Inherent OS.app
  if (!app.isPackaged || !actual.endsWith('.app')) { actualizando = false; ventana?.setProgressBar(-1); shell.showItemInFolder(nueva); return; }
  const script = path.join(dir, 'cambiar.sh');
  fs.writeFileSync(script, CAMBIAR);
  spawn('/bin/bash', [script, String(process.pid), actual, nueva], { detached: true, stdio: 'ignore' }).unref();
  app.quit();
}

// ---------- La ventana ----------
const delOS = (u) => { try { return new URL(u).host === OS_HOST; } catch { return false; } };
// El inicio de sesión con Google pasa por estas páginas: se quedan en la ventana para volver al OS con la sesión.
const deGoogle = (u) => { try { return /(^|\.)google\.com$|(^|\.)googleusercontent\.com$/.test(new URL(u).host); } catch { return false; } };

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600,
    title: 'Inherent OS',
    backgroundColor: '#f1eadf',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true },
  });
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (delOS(url)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
  ventana.webContents.on('will-navigate', (e, url) => {
    if (delOS(url) || deGoogle(url)) return;
    e.preventDefault();
    shell.openExternal(url);
  });
  ventana.webContents.on('did-finish-load', () => {
    if (!ventana) return;
    ventana.webContents.setZoomFactor(zoom());
    // La primera vez que el OS carga con sesión, se revisa si hay versión nueva.
    if (!revisado && delOS(ventana.webContents.getURL())) setTimeout(async () => { if (await buscarActualizacion()) revisado = true; }, 5000);
  });
  ventana.webContents.on('zoom-changed', (e, dir) => moverZoom(dir === 'in' ? 1 : -1));
  ventana.on('closed', () => { ventana = null; });
  ventana.loadURL(OS_URL);
}

function menu() {
  const m = [
    { label: app.name, submenu: [
      { role: 'about', label: `Acerca de ${app.name}` },
      { label: 'Buscar actualizaciones…', click: () => buscarActualizacion(true) },
      { type: 'separator' },
      { role: 'hide', label: `Ocultar ${app.name}` }, { role: 'hideOthers', label: 'Ocultar otros' }, { role: 'unhide', label: 'Mostrar todo' },
      { type: 'separator' },
      { role: 'quit', label: `Salir de ${app.name}` },
    ] },
    { role: 'editMenu' },
    { label: 'Ver', submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'forceReload', label: 'Recargar sin caché' }, { type: 'separator' },
      { label: 'Tamaño normal', accelerator: 'CmdOrCtrl+0', click: () => ponerZoom(ZOOM_BASE) },
      { label: 'Acercar', accelerator: 'CmdOrCtrl+Plus', click: () => moverZoom(1) },
      { label: 'Acercar', accelerator: 'CmdOrCtrl+=', visible: false, click: () => moverZoom(1) },
      { label: 'Alejar', accelerator: 'CmdOrCtrl+-', click: () => moverZoom(-1) },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }] },
    { label: 'Puente', submenu: [
      { label: 'Reiniciar el puente', click: async () => { apagarPuente(); await prenderPuente(); ventana?.webContents.reload(); } },
      { label: 'Instalar Laya', click: () => instalarLaya() },
      { label: 'Abrir la carpeta de registros', click: () => shell.openPath(path.join(DATOS, 'logs')) },
    ] },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(m));
}

// Una sola app abierta a la vez: si la abren otra vez, se trae al frente la que ya está.
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (ventana) { if (ventana.isMinimized()) ventana.restore(); ventana.focus(); } });
  app.whenReady().then(async () => {
    menu();
    const estado = await prenderPuente();
    crearVentana();
    // Un aviso a la vez: primero Laya (trae su propio Python); si no se instala y falta Python, las herramientas de Apple.
    if (!(await ofrecerLaya()) && estado === 'sin-herramientas') avisarHerramientas();
  });
  app.on('activate', () => { if (!ventana) crearVentana(); });
  setInterval(() => buscarActualizacion(), 6 * 60 * 60 * 1000);
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', () => { apagarPuente(); if (instalando) { try { instalando.proc.kill('SIGTERM'); } catch { /* ya terminó */ } } });
}
