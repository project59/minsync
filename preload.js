const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('adb:status'),
  getFolderTree: (deviceId) => ipcRenderer.invoke('adb:tree', deviceId),
  scanFiles: (deviceId, folders) => ipcRenderer.invoke('adb:scan', deviceId, folders),
  pullFile: (deviceId, src, dest) => ipcRenderer.invoke('adb:pull', deviceId, src, dest),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  checkPCForFiles: (destPath, phoneFiles) => ipcRenderer.invoke('files:checkPC', destPath, phoneFiles)
})
