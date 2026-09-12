const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getStatus: () => ipcRenderer.invoke('adb:status'),
  getFolderTree: (deviceId, includeAndroid) => ipcRenderer.invoke('adb:tree', deviceId, includeAndroid),
  scanFiles: (deviceId, folders) => ipcRenderer.invoke('adb:scan', deviceId, folders),
  pullFile: (deviceId, src, dest) => ipcRenderer.invoke('adb:pull', deviceId, src, dest),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  openFolder: (folderPath) => ipcRenderer.invoke('files:openFolder', folderPath),
  openFile: (filePath) => ipcRenderer.invoke('files:openFile', filePath),
  previewPhoneFile: (deviceId, filePath) => ipcRenderer.invoke('adb:previewFile', deviceId, filePath),
  checkPCForFiles: (destPath, phoneFiles) => ipcRenderer.invoke('files:checkPC', destPath, phoneFiles),

  adbVersion: () => ipcRenderer.invoke('adb:version'),
  redownloadAdb: () => ipcRenderer.invoke('adb:redownload'),

  wifi: {
    mdns: () => ipcRenderer.invoke('adb:wifi:mdns'),
    pair: (ip, port, code) => ipcRenderer.invoke('adb:wifi:pair', ip, port, code),
    connect: (ip, port) => ipcRenderer.invoke('adb:wifi:connect', ip, port),
    disconnect: (target) => ipcRenderer.invoke('adb:wifi:disconnect', target),
    pairAndConnect: (ip, pairPort, code) => ipcRenderer.invoke('adb:wifi:pairAndConnect', ip, pairPort, code)
  },

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
