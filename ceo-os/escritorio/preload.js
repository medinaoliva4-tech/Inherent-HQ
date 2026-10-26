// Lo único que la app le pasa al OS: que corre en el escritorio y el token del puente (para no emparejar a mano).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inherentEscritorio', {
  token: ipcRenderer.sendSync('inherent:token'),
  hermes: ipcRenderer.sendSync('inherent:hermes'), // { url, key } de la API local de Hermes, o null si no está instalado
  plataforma: process.platform,
});
