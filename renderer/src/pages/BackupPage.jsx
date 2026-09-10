import { RefreshCw } from 'lucide-react'
import { ScanPreview } from '../components/ScanPreview'
import { SyncProgress } from '../components/SyncProgress'
import { SetupGuide } from '../components/SetupGuide'
import { DestinationPicker } from '../components/DestinationPicker'
import { FolderSyncSection } from '../components/FolderSyncSection'

export function BackupPage({
  device,
  deviceStatus,
  destPath,
  setDestPath,
  folderTree,
  selectedFolders,
  setSelectedFolders,
  isLoadingTree,
  isScanning,
  isSyncing,
  scanResult,
  onWifiConnect,
  onBrowse,
  onScan,
  onSync,
  onCancelScan
}) {
  return (
    <main className="space-y-5">
      <section className="page-intro">
        <p className="eyebrow">02 / backup</p>
        <h1>Bring your phone home.</h1>
        <p className="page-lede">Select the folders that matter, scan for changes, and keep a clean local copy without guessing what has already been saved.</p>
      </section>

      {deviceStatus !== 'connected' ? (
        <SetupGuide status={deviceStatus} onWifiConnect={onWifiConnect} />
      ) : (
        <section className="space-y-3">
          <DestinationPicker destPath={destPath} onChange={setDestPath} onBrowse={onBrowse} />

          <FolderSyncSection
            folderTree={folderTree}
            selectedFolders={selectedFolders}
            setSelectedFolders={setSelectedFolders}
            isLoadingTree={isLoadingTree}
          />

          {scanResult && (
            <ScanPreview result={scanResult} onSync={onSync} onCancel={onCancelScan} />
          )}

          <button
            onClick={onScan}
            disabled={isScanning || selectedFolders.length === 0 || !destPath}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {isScanning && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isScanning ? 'Scanning...' : 'Scan for changes'}
          </button>

          {isSyncing && <SyncProgress result={scanResult} />}
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="feature-note"><span>01</span><p>Incremental by default</p></div>
        <div className="feature-note"><span>02</span><p>Your files stay local</p></div>
        <div className="feature-note"><span>03</span><p>USB or wireless</p></div>
      </div>
    </main>
  )
}
