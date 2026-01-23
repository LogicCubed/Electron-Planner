const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
});