// Lo único que la app le pasa al OS: que corre en el escritorio y el token del puente (para no emparejar a mano).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inherentEscritorio', {
  token: ipcRenderer.sendSync('inherent:token'),
  plataforma: process.platform,
});
