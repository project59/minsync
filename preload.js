const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('adb:status'),
  getFolderTree: (deviceId) => ipcRenderer.invoke('adb:tree', deviceId),
  scanFiles: (deviceId, folders) => ipcRenderer.invoke('adb:scan', deviceId, folders),
  pullFile: (deviceId, src, dest) => ipcRenderer.invoke('adb:pull', deviceId, src, dest),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  checkPCForFiles: (destPath, phoneFiles) => ipcRenderer.invoke('files:checkPC', destPath, phoneFiles),

  share: {
    start: (opts) => ipcRenderer.invoke('share:start', opts),
    stop: () => ipcRenderer.invoke('share:stop'),
    status: () => ipcRenderer.invoke('share:status'),
    pickFolder: () => ipcRenderer.invoke('share:pickFolder'),
    listPcFiles: () => ipcRenderer.invoke('share:listPcFiles'),
    addFile: (filePath) => ipcRenderer.invoke('share:addFile', filePath),
    onEvent: (cb) => {
      const listener = (_, evt) => cb(evt)
      ipcRenderer.on('share:event', listener)
      return () => ipcRenderer.removeListener('share:event', listener)
    }
  }
})
