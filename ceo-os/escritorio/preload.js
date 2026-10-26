// Lo único que la app le pasa al OS: que corre en el escritorio, el token del puente (para no emparejar a mano), Hermes y
// su versión (para avisar si hay una nueva). Y un botón: buscar la versión nueva, como el menú.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inherentEscritorio', {
  token: ipcRenderer.sendSync('inherent:token'),
  hermes: ipcRenderer.sendSync('inherent:hermes'), // { url, key } de la API local de Hermes, o null si no está instalado
  plataforma: process.platform,
  version: ipcRenderer.sendSync('inherent:version'), // la versión instalada, ej. 0.1.4 (una app sin este campo es más vieja)
  actualizar: () => ipcRenderer.send('inherent:actualizar'), // abre el diálogo «Hay una versión nueva» (o «Ya tienes la última»)
});
