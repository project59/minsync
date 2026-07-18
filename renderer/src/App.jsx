import { useState, useEffect } from 'react'
import { FolderTree } from './components/FolderTree'
import { ScanPreview } from './components/ScanPreview'
import { SyncProgress } from './components/SyncProgress'
import { SyncHistory } from './components/SyncHistory'
import { SetupGuide } from './components/SetupGuide'
import { QuickShare } from './components/QuickShare'
import { WifiConnect } from './components/WifiConnect'
import { FolderOpen, RefreshCw, Sun, Moon, Wifi, Database, Usb, PlugZap } from 'lucide-react'
import { SyncDB } from '../db'

const db = new SyncDB()

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  const [device, setDevice] = useState(null)
  const [deviceStatus, setDeviceStatus] = useState('checking')
  const [destPath, setDestPath] = useState('')
  const [selectedFolders, setSelectedFolders] = useState([])
  const [folderTree, setFolderTree] = useState([])
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [history, setHistory] = useState([])
  const [tab, setTab] = useState('backup')
  const [wifiModalOpen, setWifiModalOpen] = useState(false)
  const [wifiDisconnecting, setWifiDisconnecting] = useState(false)

  useEffect(() => {
    pollStatus()
    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    db.open().then(() => {
      loadConfig()
      loadHistory()
    }).catch(err => console.error('DB open failed:', err))
  }, [])

  async function loadConfig() {
    const dest = await db.getConfig('dest_path')
    if (dest) setDestPath(dest)
    const folders = await db.getConfig('selected_folders')
    if (folders) setSelectedFolders(folders)
  }

  async function loadHistory() {
    if (!db.db) return
    const h = await db.getSyncHistory()
    setHistory(h)
  }

  async function pollStatus() {
    const status = await window.api.getStatus()
    if (!status.available) {
      setDeviceStatus('adb_not_found')
      setDevice(null)
      return
    }
    if (!status.device) {
      setDeviceStatus('no_device')
      setDevice(null)
      return
    }
    setDevice(status.device)
    setDeviceStatus('connected')
    if (folderTree.length === 0 && !isLoadingTree) {
      setIsLoadingTree(true)
      const tree = await window.api.getFolderTree(status.device.id)
      setFolderTree(tree)
      setIsLoadingTree(false)
    }
  }

  async function handleWifiConnected(connectedDevice) {
    setWifiModalOpen(false)
    if (connectedDevice) {
      setDevice(connectedDevice)
      setDeviceStatus('connected')
    }
    await pollStatus()
  }

  async function handleWifiDisconnect() {
    if (!device) return
    setWifiDisconnecting(true)
    await window.api.wifi.disconnect(device.id)
    setWifiDisconnecting(false)
    setDevice(null)
    setDeviceStatus('no_device')
    setFolderTree([])
    setScanResult(null)
  }

  async function handleBrowse() {
    const folder = await window.api.pickFolder()
    if (folder) {
      setDestPath(folder)
      db.setConfig('dest_path', folder)
    }
  }

  async function handleScan() {
    if (!device || selectedFolders.length === 0 || !destPath) return
    setIsScanning(true)

    try {
      const phoneFiles = await window.api.scanFiles(device.id, selectedFolders)
      const pcCheckResults = await window.api.checkPCForFiles(destPath, phoneFiles)

      const newFiles = []
      const existingFiles = []

      for (const result of pcCheckResults) {
        const phoneFile = phoneFiles.find(p => p.path === result.phonePath)
        if (result.existsOnPC) {
          existingFiles.push({ ...phoneFile, pcPaths: result.pcPaths })
        } else {
          newFiles.push(phoneFile)
        }
      }

      const deviceName = device.model.replace(/[^a-zA-Z0-9]/g, '_')
      setScanResult({
        newFiles,
        existingFiles,
        dest: destPath,
        deviceName,
        totalPhoneFiles: phoneFiles.length
      })
    } catch (err) {
      alert('Scan failed: ' + err.message)
    }

    setIsScanning(false)
  }

  async function handleSync() {
    if (!scanResult || scanResult.newFiles.length === 0) return
    setIsSyncing(true)

    const { newFiles, dest, deviceName } = scanResult
    const inboxFolder = `${dest}/${deviceName}-inbox`
    let completed = 0
    const total = newFiles.length

    for (const file of newFiles) {
      const rel = file.path.replace('/sdcard', '')
      const destPath = inboxFolder + '/' + rel.replace(/^\//, '')
      try {
        await window.api.pullFile(device.id, file.path, destPath)
      } catch (err) {
        console.error(`Failed: ${file.path}`, err)
      }
      completed++
    }

    await db.addSyncRecord({
      new_count: newFiles.length,
      total_size: newFiles.reduce((s, f) => s + f.size, 0),
      inbox: inboxFolder
    })

    setScanResult(null)
    setIsSyncing(false)
    loadHistory()

    if (device?.transport === 'wifi') {
      try { await window.api.wifi.disconnect(device.id) } catch { }
      setDevice(null)
      setDeviceStatus('no_device')
      setFolderTree([])
    }
  }

  return (
    <div className="mx-auto p-2">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-slate-700 mt-1">Minsync Android</h1>
          {tab === 'backup' && deviceStatus === 'connected' && device && (
            <div className="flex items-center gap-2 ml-2 pl-4 border-l dark:border-slate-700">
              {device.transport === 'wifi' ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Usb className="w-3.5 h-3.5 text-green-500" />
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400">{device.model}</span>
              <span className="text-xs px-1.5 py-0.5 font-mono uppercase border dark:border-slate-700 text-slate-500 dark:text-slate-400">
                {device.transport || 'usb'}
              </span>
              {device.transport === 'wifi' && (
                <button
                  onClick={handleWifiDisconnect}
                  disabled={wifiDisconnecting || isSyncing}
                  className="btn-danger py-1 px-2 text-xs ml-1"
                  title="Disconnect WiFi ADB (recommended after backup)"
                >
                  {wifiDisconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Disconnect'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tab === 'backup' && deviceStatus !== 'connected' && (
            <button
              onClick={() => setWifiModalOpen(true)}
              className="btn-secondary"
            >
              <PlugZap className="w-4 h-4" /> Connect WiFi
            </button>
          )}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn-secondary w-8"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </header>

      <div className='bg-slate-100 rounded-t-xl p-3'>

        <div className="flex mb-6 border border-slate-600/30 rounded-lg overflow-hidden">
          <button
            onClick={() => setTab('backup')}
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm  font-medium cursor-pointer rounded ${tab === 'backup' ? 'bg-white' : ''}`}
          >
            <Database className="w-4 h-4" /> Backup
          </button>
          <button
            onClick={() => setTab('share')}
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer rounded ${tab === 'share' ? 'bg-white' : ''}`}
          >
            <Wifi className="w-4 h-4" /> Quick Share
          </button>
        </div>

        {tab === 'share' ? (
          <QuickShare />
        ) : deviceStatus !== 'connected' ? (
          <SetupGuide status={deviceStatus} onWifiConnect={() => setWifiModalOpen(true)} />
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border-primary p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-5 h-5 text-slate-400" />
                <span className="font-medium">Destination folder</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={destPath}
                  onChange={(e) => setDestPath(e.target.value)}
                  className="flex-1 border px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 dark:text-white dark:border-slate-700 font-mono"
                  placeholder="Select a destination folder..."
                />
                <button
                  onClick={handleBrowse}
                  className="btn-secondary"
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border-primary p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Folders to sync</h2>
                <button
                  onClick={() => setSelectedFolders([])}
                  className="btn-secondary"
                >
                  Clear all
                </button>
              </div>
              {folderTree.length > 0 ? (
                <FolderTree
                  tree={folderTree}
                  selected={selectedFolders}
                  onChange={setSelectedFolders}
                />
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading folders...
                </div>
              )}
            </div>

            {scanResult && (
              <ScanPreview
                result={scanResult}
                onSync={handleSync}
                onCancel={() => setScanResult(null)}
              />
            )}

            <div className="flex gap-3 mb-8">
              <button
                onClick={handleScan}
                disabled={isScanning || selectedFolders.length === 0 || !destPath}
                className="btn-action flex-1 py-3 flex items-center justify-center gap-2"
              >
                {isScanning && <RefreshCw className="w-4 h-4 animate-spin" />}
                {isScanning ? 'Scanning...' : 'Scan for changes'}
              </button>
            </div>

            {isSyncing && <SyncProgress result={scanResult} />}

            <SyncHistory history={history} />
          </>
        )}
      </div>


      {wifiModalOpen && (
        <WifiConnect
          db={db}
          onClose={() => setWifiModalOpen(false)}
          onConnected={handleWifiConnected}
        />
      )}
    </div>
  )
}