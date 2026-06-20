import { useState, useEffect } from 'react'
import { FolderTree } from './components/FolderTree'
import { ScanPreview } from './components/ScanPreview'
import { SyncProgress } from './components/SyncProgress'
import { SyncHistory } from './components/SyncHistory'
import { SetupGuide } from './components/SetupGuide'
import { QuickShare } from './components/QuickShare'
import { FolderOpen, RefreshCw, Sun, Moon, Wifi, Database } from 'lucide-react'
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
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6 border-b pb-4 dark:border-zinc-700">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold font-mono">PhoneSync</h1>
          {tab === 'backup' && deviceStatus === 'connected' && device && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l dark:border-zinc-700">
              <span className="w-3 h-3 bg-green-500" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{device.model}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-secondary p-2"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('backup')}
          className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-mono font-medium cursor-pointer border ${tab === 'backup' ? 'bg-zinc-100 dark:bg-zinc-800 border-emerald-400 text-emerald-600 dark:text-emerald-400' : 'bg-transparent text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800'}`}
        >
          <Database className="w-4 h-4" /> Backup
        </button>
        <button
          onClick={() => setTab('share')}
          className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-mono font-medium cursor-pointer border ${tab === 'share' ? 'bg-zinc-100 dark:bg-zinc-800 border-emerald-400 text-emerald-600 dark:text-emerald-400' : 'bg-transparent text-zinc-700 border-zinc-300 hover:bg-zinc-100 dark:text-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800'}`}
        >
          <Wifi className="w-4 h-4" /> Quick Share
        </button>
      </div>

      {tab === 'share' ? (
        <QuickShare />
      ) : deviceStatus !== 'connected' ? (
        <SetupGuide status={deviceStatus} />
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border-primary p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-zinc-400" />
              <span className="font-medium">Destination folder</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={destPath}
                onChange={(e) => setDestPath(e.target.value)}
                className="flex-1 border px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 font-mono"
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

          <div className="bg-white dark:bg-zinc-900 border-primary p-5 mb-6">
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
              <div className="flex items-center justify-center py-8 text-zinc-400">
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
  )
}