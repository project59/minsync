import { Check, FileCheck, FilePlus, FolderOpen, RotateCcw } from 'lucide-react'

export function ScanPreview({ result, summary, onSync, onCancel, onOpenFolder, onNewScan }) {
  if (summary) {
    const hasFailures = summary.failed > 0
    return (
      <div className="mt-8 w-full overflow-hidden">
        <div className="flex items-start gap-4 200 pt-12">
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
      </div>
    )
  }

  const { newFiles, existingFiles } = result
  const totalSize = newFiles.reduce((s, f) => s + f.size, 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  return (
    <div className="mt-8 w-full overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div><p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Ready to sync</p><h2 className="mt-1 text-xl font-semibold text-taupe-800 dark:text-taupe-100">Scan results</h2></div>
        <span className="text-right text-xs text-taupe-500 dark:text-taupe-400">{sizeMB} MB to copy</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4 sm:max-w-md text-center">
        <div className="rounded border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FilePlus className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">{newFiles.length}</span>
          </div>
          <span className="text-xs text-taupe-500 dark:text-taupe-400">New files to copy</span>
          {newFiles.length > 0 && (
            <div className="text-xs text-primary mt-1 font-medium">{sizeMB} MB</div>
          )}
        </div>
        <div className="rounded border border-action/20 bg-action/5 p-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileCheck className="w-5 h-5 text-action" />
            <span className="text-2xl font-bold text-action">{existingFiles.length}</span>
          </div>
          <span className="text-xs text-taupe-500 dark:text-taupe-400">Already backed up</span>
        </div>
      </div>

      <p className="mb-4 text-xs text-taupe-500 dark:text-taupe-400">{existingFiles.length ? `${existingFiles.length} existing files will be skipped.` : 'No matching files were found in the destination.'}</p>

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
