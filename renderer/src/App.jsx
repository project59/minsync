import { useState, useEffect } from 'react'
import { SyncHistory } from './components/SyncHistory'
import { WifiConnect } from './components/WifiConnect'
import { Header } from './components/Header'
import { SyncDB } from '../db'
import { HomePage } from './pages/HomePage'
import { BackupPage } from './pages/BackupPage'
import { QuickSharePage } from './pages/QuickSharePage'
import { PricingPage, FAQPage } from './pages/InfoPages'
import { Footer } from './components/Footer'

const db = new SyncDB()
const ROUTES = ['/', '/backup', '/quick-share', '/pricing', '/faq']

function getRoute() {
  const path = window.location.hash.replace(/^#/, '') || '/'
  return ROUTES.includes(path) ? path : '/'
}

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
  const [includeAndroid, setIncludeAndroid] = useState(false)
  const [treeReloadKey, setTreeReloadKey] = useState(0)
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [syncSummary, setSyncSummary] = useState(null)
  const [history, setHistory] = useState([])
  const [route, setRoute] = useState(getRoute)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [wifiModalOpen, setWifiModalOpen] = useState(false)

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function navigate(path) {
    if (path === route) return
    window.location.hash = path
  }

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
    if (folders) {
      setSelectedFolders(folders.filter(folder => includeAndroid || (folder !== '/sdcard/Android' && !folder.startsWith('/sdcard/Android/'))))
    }
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
  }

  useEffect(() => {
    if (!device?.id) return
    let cancelled = false
    setIsLoadingTree(true)
    window.api.getFolderTree(device.id, includeAndroid).then(tree => {
      if (!cancelled) {
        setFolderTree(tree)
        setIsLoadingTree(false)
      }
    }).catch(() => {
      if (!cancelled) {
        setFolderTree([])
        setIsLoadingTree(false)
      }
    })
    return () => { cancelled = true }
  }, [device?.id, includeAndroid, treeReloadKey])

  function handleIncludeAndroidChange(value) {
    setIncludeAndroid(value)
    if (!value) {
      setSelectedFolders(current => current.filter(folder => folder !== '/sdcard/Android' && !folder.startsWith('/sdcard/Android/')))
    }
  }

  function handleReloadTree() {
    setTreeReloadKey(key => key + 1)
  }

  async function handleWifiConnected(connectedDevice) {
    setWifiModalOpen(false)
    if (connectedDevice) {
      setDevice(connectedDevice)
      setDeviceStatus('connected')
    }
    await pollStatus()
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
    setSyncSummary(null)
    setIsScanning(true)

    try {
      const phoneFiles = await window.api.scanFiles(device.id, selectedFolders)
      const pcCheckResults = await window.api.checkPCForFiles(destPath, phoneFiles)
      const phoneFilesByPath = new Map(phoneFiles.map(file => [file.path, file]))

      const newFiles = []
      const existingFiles = []

      for (const result of pcCheckResults) {
        const phoneFile = phoneFilesByPath.get(result.phonePath)
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
    let failed = 0
    const total = newFiles.length

    for (const file of newFiles) {
      const rel = file.path.replace('/sdcard', '')
      const destPath = inboxFolder + '/' + rel.replace(/^\//, '')
      try {
        await window.api.pullFile(device.id, file.path, destPath)
        file.localPath = destPath
      } catch (err) {
        console.error(`Failed: ${file.path}`, err)
        failed++
      }
      completed++
    }

    await db.addSyncRecord({
      new_count: completed - failed,
      total_size: newFiles.reduce((s, f) => s + f.size, 0),
      inbox: inboxFolder
    })

    setScanResult(null)
    setSyncSummary({
      copied: completed - failed,
      failed,
      skipped: scanResult.existingFiles.length,
      inbox: inboxFolder,
      files: newFiles.filter(file => file.localPath)
    })
    setIsSyncing(false)
    loadHistory()
  }

  return (
    <div className="app-shell">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        device={device}
        deviceStatus={deviceStatus}
        route={route}
        tab={route === '/backup' ? 'backup' : 'share'}
        onNavigate={navigate}
        historyCount={history.length}
        onHistoryOpen={() => setHistoryModalOpen(true)}
      />

      <div className="app-content">
        {route === '/' && <HomePage onNavigate={navigate} deviceStatus={deviceStatus} />}
        {route === '/backup' && (
          <BackupPage
            device={device}
            deviceStatus={deviceStatus}
            destPath={destPath}
            setDestPath={setDestPath}
            folderTree={folderTree}
            includeAndroid={includeAndroid}
            onIncludeAndroidChange={handleIncludeAndroidChange}
            onReloadTree={handleReloadTree}
            selectedFolders={selectedFolders}
            setSelectedFolders={setSelectedFolders}
            isLoadingTree={isLoadingTree}
            isScanning={isScanning}
            isSyncing={isSyncing}
            scanResult={scanResult}
            onWifiConnect={() => setWifiModalOpen(true)}
            onBrowse={handleBrowse}
            onScan={handleScan}
            onSync={handleSync}
            onCancelScan={() => { setScanResult(null); setSyncSummary(null) }}
            syncSummary={syncSummary}
            onOpenFolder={() => window.api.openFolder(syncSummary?.inbox)}
            onOpenFile={(filePath) => window.api.openFile(filePath)}
            onOpenPhoneFile={(filePath) => window.api.previewPhoneFile(device?.id, filePath)}
            onNewScan={() => setSyncSummary(null)}
          />
        )}
        {route === '/quick-share' && <QuickSharePage />}
        {route === '/pricing' && <PricingPage />}
        {route === '/faq' && <FAQPage />}
      </div>

      <Footer onNavigate={navigate} />

      {wifiModalOpen && (
        <WifiConnect
          db={db}
          onClose={() => setWifiModalOpen(false)}
          onConnected={handleWifiConnected}
        />
      )}

      <SyncHistory
        history={history}
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  )
}
