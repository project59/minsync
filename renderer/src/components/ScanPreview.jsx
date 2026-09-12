import { Check, CheckCircle, ChevronDown, ExternalLink, FilePlus, FileText, FolderOpen, HardDrive, RotateCcw } from 'lucide-react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileList({ files, title, emptyText, onOpenFile, onOpenPhoneFile, existing = false, phone = false }) {
  return (
    <details className="group border-t border-taupe-200 dark:border-taupe-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium text-taupe-800 dark:text-taupe-200">
        <span>{title} <span className="text-taupe-500">({files.length})</span></span>
        <ChevronDown className="h-4 w-4 text-taupe-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mb-3 max-h-64 space-y-1 overflow-y-auto pr-1">
        {files.length === 0 ? (
          <p className="py-2 text-xs text-taupe-500 dark:text-taupe-400">{emptyText}</p>
        ) : files.map((file, index) => {
          const localPath = existing ? file.pcPaths?.[0] : file.localPath
          const displayPath = existing ? localPath : file.path
          const displayName = displayPath?.split(/[\\/]/).pop() || file.path
          const canOpen = phone ? Boolean(onOpenPhoneFile) : Boolean(localPath)
          return (
            <div key={`${file.path}-${index}`} className="flex items-center gap-3 rounded-lg bg-taupe-100/70 px-3 py-2 dark:bg-taupe-800/60">
              <FileText className="h-4 w-4 shrink-0 text-taupe-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-taupe-800 dark:text-taupe-200" title={displayPath}>{displayName}</p>
                <p className="truncate text-[11px] text-taupe-500 dark:text-taupe-400" title={displayPath}>{displayPath} · {formatSize(file.size)}</p>
              </div>
              <button
                onClick={() => phone ? onOpenPhoneFile(file.path) : onOpenFile(localPath)}
                disabled={!canOpen}
                className="btn-secondary flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs"
                title={phone ? 'Preview on PC' : 'Open file'}
              >
                <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{phone ? 'Preview on PC' : 'Open'}</span>
              </button>
            </div>
          )
        })}
      </div>
    </details>
  )
}

export function ScanPreview({ result, summary, onSync, onCancel, onOpenFolder, onOpenFile, onOpenPhoneFile, onNewScan }) {
  if (summary) {
    const hasFailures = summary.failed > 0
    return (
      <div className="mt-8 w-full overflow-hidden card">
        <div className="flex items-start gap-4 200 ">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action/15 text-action">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-action">Backup complete</p>
            <h2 className="mt-1 text-xl font-semibold text-taupe-800 dark:text-taupe-100">
              {hasFailures ? 'Backup finished with some issues' : 'Your files are safely backed up'}
            </h2>
            <p className="mt-1 text-sm text-taupe-500 dark:text-taupe-400">
              {hasFailures ? `${summary.copied} copied, ${summary.failed} could not be copied.` : `${summary.copied} ${summary.copied === 1 ? 'file' : 'files'} copied to your backup folder.`}
            </p>
          </div>
        </div>
         <div className="flex flex-wrap gap-2 mt-6">
          <button onClick={onOpenFolder} className="btn-action flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Open backup folder</button>
           <button onClick={onNewScan} className="btn-secondary flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Scan again</button>
         </div>
         {summary.files && <div className="mt-6"><FileList files={summary.files} title="Files copied in this backup" emptyText="No files were copied." onOpenFile={onOpenFile} /></div>}
       </div>
    )
  }

  const { newFiles, existingFiles } = result
  const totalSize = newFiles.reduce((s, f) => s + f.size, 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  return (
    <div className="mt-8 w-full overflow-hidden card">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Ready to sync</p><h2 className="mt-1 text-xl font-semibold text-taupe-800 dark:text-taupe-100">Scan results</h2></div>

      </div>
      <div className="grid grid-cols-2 gap-2 mb-4 sm:max-w-md text-center">
        <div className="flex flex-col justify-between rounded-lg border border-primary/20 bg-primary/5 p-3 aspect-square text-left">
          <div className="flex flex-col gap-2">
            <span className="text-5xl font-semibold text-primary">{newFiles.length}</span>
            {newFiles.length > 0 && (
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3 text-primary" />
                <div className="text-xs text-primary font-medium">{sizeMB} MB</div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <FilePlus className="h-8 w-8 text-primary" />
            <span className="text-lg font-medium text-taupe-800 dark:text-taupe-400">New files to copy</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-lg border border-action/20 bg-action/5 p-3 aspect-square text-left">
          <span className="text-5xl font-semibold text-action">{existingFiles.length}</span>
          <div className="flex flex-col gap-2">
            <CheckCircle className="text-action" size={30} />
            <span className="text-lg font-medium text-taupe-800 dark:text-taupe-400">Files already existing</span>
          </div>
        </div>
      </div>

      <p className="mb-4 text-xs text-taupe-500 dark:text-taupe-400">{existingFiles.length ? `${existingFiles.length} existing files will be skipped.` : 'No matching files were found in the destination.'}</p>

      <div className="mb-2">
        <FileList files={newFiles} title="Files to copy" emptyText="Everything selected is already backed up." onOpenPhoneFile={onOpenPhoneFile} phone />
        <FileList files={existingFiles} title="Already backed up" emptyText="No matching files were found in the destination." onOpenFile={onOpenFile} existing />
      </div>

      <div className="flex flex-wrap justify-start gap-2">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={onSync}
          disabled={newFiles.length === 0}
          className="btn-action flex-1 sm:flex-none"
        >
          Sync {newFiles.length} files
        </button>
      </div>
    </div>
  )
}
