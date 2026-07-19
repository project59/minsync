import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { ScanPreview } from './components/ScanPreview'
import { SyncProgress } from './components/SyncProgress'
import { SyncHistory } from './components/SyncHistory'
import { SetupGuide } from './components/SetupGuide'
import { QuickShare } from './components/QuickShare'
import { WifiConnect } from './components/WifiConnect'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { DestinationPicker } from './components/DestinationPicker'
import { FolderSyncSection } from './components/FolderSyncSection'
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
    <div className="mx-auto p-2 h-screen flex flex-col">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        device={device}
        deviceStatus={deviceStatus}
        tab={tab}
        wifiDisconnecting={wifiDisconnecting}
        isSyncing={isSyncing}
        onWifiConnect={() => setWifiModalOpen(true)}
        onWifiDisconnect={handleWifiDisconnect}
      />

      <div className="bg-taupe-200/60 dark:bg-taupe-800/40 rounded-2xl p-3 flex flex-col gap-3 flex-1">
        <TabBar tab={tab} setTab={setTab} />

        {tab === 'share' ? (
          <QuickShare />
        ) : deviceStatus !== 'connected' ? (
          <SetupGuide status={deviceStatus} onWifiConnect={() => setWifiModalOpen(true)} />
        ) : (
          <>
            <DestinationPicker
              destPath={destPath}
              onChange={setDestPath}
              onBrowse={handleBrowse}
            />

            <FolderSyncSection
              folderTree={folderTree}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
              isLoadingTree={isLoadingTree}
            />

            {scanResult && (
              <ScanPreview
                result={scanResult}
                onSync={handleSync}
                onCancel={() => setScanResult(null)}
              />
            )}

            <button
              onClick={handleScan}
              disabled={isScanning || selectedFolders.length === 0 || !destPath}
              className="btn-action flex-1 py-3 flex items-center justify-center gap-2"
            >
              {isScanning && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isScanning ? 'Scanning...' : 'Scan for changes'}
            </button>

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
