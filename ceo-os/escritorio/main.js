// Inherent OS para escritorio: el OS en su propia ventana, con el puente de Laya adentro.
//   1. Al abrir, si el puente ya corre en la compu (el del instalador de un comando), lo usa; si no, prende el que trae la app.
//   2. Le pasa al OS el token del puente: ya no hay que emparejar la compu ni pegar nada.
//   3. Al cerrar la app, apaga el puente que prendió (el del instalador lo deja como estaba).
// El puente es el mismo archivo de la web (public/laya/puente.py) y corre con el Python de la Mac.
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
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

async function prenderPuente() {
  if (await salud()) return 'ya-corria';
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
  ventana.on('closed', () => { ventana = null; });
  ventana.loadURL(OS_URL);
}

function menu() {
  const m = [
    { role: 'appMenu' },
    { role: 'editMenu' },
    { label: 'Ver', submenu: [{ role: 'reload', label: 'Recargar' }, { role: 'forceReload', label: 'Recargar sin caché' }, { type: 'separator' }, { role: 'resetZoom', label: 'Tamaño real' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' }, { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }, { role: 'toggleDevTools', label: 'Herramientas de desarrollo' }] },
    { label: 'Puente', submenu: [
      { label: 'Reiniciar el puente', click: async () => { apagarPuente(); await prenderPuente(); ventana?.webContents.reload(); } },
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
    if (estado === 'sin-herramientas') avisarHerramientas();
  });
  app.on('activate', () => { if (!ventana) crearVentana(); });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  app.on('before-quit', apagarPuente);
}
