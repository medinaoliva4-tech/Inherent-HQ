// Lo único que la app le pasa al OS: que corre en el escritorio, el token del puente (para no emparejar a mano) y
// su versión (para avisar si hay una nueva). Y un botón: buscar la versión nueva, como el menú.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inherentEscritorio', {
  token: ipcRenderer.sendSync('inherent:token'),
  plataforma: process.platform,
  vidrio: process.platform === 'darwin', // la ventana deja ver lo que hay detrás
  version: ipcRenderer.sendSync('inherent:version'), // la versión instalada, ej. 0.1.4 (una app sin este campo es más vieja)
  instalar: () => ipcRenderer.send('inherent:instalar'), // baja, cambia y reabre la app sin más preguntas
  alProgreso: (f) => ipcRenderer.on('inherent:progreso', (_, n) => f(n)),
  actualizar: () => ipcRenderer.send('inherent:actualizar'), // abre el diálogo «Hay una versión nueva» (o «Ya tienes la última»)
});
