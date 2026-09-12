import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck, Usb, Wifi } from 'lucide-react'
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
  includeAndroid,
  onIncludeAndroidChange,
  onReloadTree,
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
  onCancelScan,
  syncSummary,
  onOpenFolder,
  onOpenFile,
  onOpenPhoneFile,
  onNewScan
}) {
  const [step, setStep] = useState(1)
  const [connectionType, setConnectionType] = useState(null)

  useEffect(() => {
    if (!connectionType || syncSummary) return

    const connectedWithSelectedMethod = deviceStatus === 'connected' && device?.transport === connectionType
    if (!connectedWithSelectedMethod && step > 2) {
      setStep(2)
    }
  }, [connectionType, deviceStatus, device?.transport, step, syncSummary])

  const stepTitles = ['Choose connection', 'Set up your connection', 'Choose a Sync folder', 'Choose files to back up', 'Finish']
  const stepDescriptions = [
    'Choose how you want to connect your phone for this backup.',
    connectionType === 'usb' ? 'Connect your phone with a USB cable and complete the setup.' : 'Pair your phone using Android wireless debugging.',
    'Choose where MinSync should save the files on this computer. Files located anywhere in this folder will be detected by MinSync.',
    'Select the folders and files you want to include in this backup.',
    'Your backup is complete. Take a moment to secure your phone.'
  ]
  const connectedWithSelectedMethod = deviceStatus === 'connected' && device?.transport === connectionType

  function StepNavigation({ nextDisabled, onNext, nextLabel = 'Next', showNext = true }) {
    return (
      <div className="flex items-center justify-start gap-2 pt-12">
        <button
          onClick={() => setStep(current => Math.max(1, current - 1))}
          disabled={step === 1}
          className="btn-secondary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {showNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="btn-primary flex items-center gap-1"
          >
            {nextLabel} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <main className="space-y-5">
      <section className="page-intro">
        <h1>Backup Files</h1>
        <p className="page-lede">Select the folders and files, scan for changes, and keep a clean local copy without guessing what has already been saved.</p>
      </section>

      <section className="space-y-5">
        <header className="space-y-1">
          <p className="text-sm text-taupe-500 dark:text-taupe-400">Step {step}/5</p>
          <h2 className="text-2xl tracking-tighter mt-6 font-semibold text-taupe-800 dark:text-taupe-100">{stepTitles[step - 1]}</h2>
          <p className="text-sm text-taupe-500 dark:text-taupe-400">{stepDescriptions[step - 1]}</p>
        </header>

        {step === 1 && (
          <section className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => setConnectionType('usb')} className={`card text-left hover:border-primary ${connectionType === 'usb' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <Usb className="w-5 h-5 text-primary mb-3" />
                <span className="block font-semibold text-taupe-800 dark:text-taupe-100">Use USB</span>
                <span className="block text-sm text-taupe-500 dark:text-taupe-400 mt-1">Connect your phone with a cable.</span>
              </button>
              <button onClick={() => setConnectionType('wifi')} className={`card text-left hover:border-primary ${connectionType === 'wifi' ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                <Wifi className="w-5 h-5 text-primary mb-3" />
                <span className="block font-semibold text-taupe-800 dark:text-taupe-100">Use Wi-Fi</span>
                <span className="block text-sm text-taupe-500 dark:text-taupe-400 mt-1">Pair using Android wireless debugging.</span>
              </button>
            </div>
            <StepNavigation nextDisabled={!connectionType} onNext={() => setStep(2)} />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            {connectedWithSelectedMethod ? (
              <SetupGuide status={deviceStatus} connectionType={connectionType} />
            ) : connectionType === 'usb' ? (
              <SetupGuide status={deviceStatus} connectionType={connectionType} />
            ) : (
              <div className="card space-y-3">
                <p className="text-sm text-taupe-500 dark:text-taupe-400">Finish pairing in the Wi-Fi setup window.</p>
                <button onClick={onWifiConnect} className="btn-secondary w-full">Open Wi-Fi setup</button>
              </div>
            )}
            <StepNavigation nextDisabled={!connectedWithSelectedMethod} onNext={() => setStep(3)} />
          </section>
        )}

        {step === 3 && (
          <section className="space-y-3">
            <DestinationPicker destPath={destPath} onChange={setDestPath} onBrowse={onBrowse} />
            <StepNavigation nextDisabled={!destPath} onNext={() => setStep(4)} />
          </section>
        )}

        {step === 4 && (
          <section className="space-y-3">
            <FolderSyncSection
              folderTree={folderTree}
              includeAndroid={includeAndroid}
              onIncludeAndroidChange={onIncludeAndroidChange}
              onReloadTree={onReloadTree}
              selectedFolders={selectedFolders}
              setSelectedFolders={setSelectedFolders}
              isLoadingTree={isLoadingTree}
              onScan={onScan}
              isScanning={isScanning}
              scanDisabled={isScanning || selectedFolders.length === 0 || !destPath}
            />
            {syncSummary ? (
              <ScanPreview summary={syncSummary} onOpenFolder={onOpenFolder} onOpenFile={onOpenFile} onOpenPhoneFile={onOpenPhoneFile} onNewScan={onNewScan} />
            ) : scanResult ? (
              <ScanPreview result={scanResult} onSync={onSync} onCancel={onCancelScan} onOpenFile={onOpenFile} onOpenPhoneFile={onOpenPhoneFile} />
            ) : null}
            {isSyncing && <SyncProgress result={scanResult} />}
            <StepNavigation
              nextDisabled={selectedFolders.length === 0 || !destPath}
              onNext={() => setStep(5)}
            />
          </section>
        )}

        {step === 5 && (
          <section className="space-y-3">
            <div className="card flex items-start gap-4">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <h3 className="font-semibold text-taupe-800 dark:text-taupe-100">Disable debugging when you are finished</h3>
                <p className="text-sm leading-6 text-taupe-600 dark:text-taupe-300">
                  For your safety, disable USB debugging and wireless debugging on your phone when you no longer need them.
                </p>
              </div>
            </div>
            <StepNavigation showNext={false} />
          </section>
        )}
      </section>
    </main>
  )
}
