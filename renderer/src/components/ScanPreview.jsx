import { FileCheck, FilePlus } from 'lucide-react'

export function ScanPreview({ result, onSync, onCancel }) {
  const { newFiles, existingFiles } = result
  const totalSize = newFiles.reduce((s, f) => s + f.size, 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  return (
    <div className="card">
      <h2 className="font-semibold text-taupe-700 dark:text-taupe-200 mb-3">Scan results</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-taupe-100 dark:bg-taupe-700/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FilePlus className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">{newFiles.length}</span>
          </div>
          <span className="text-xs text-taupe-500 dark:text-taupe-400">New files to copy</span>
          {newFiles.length > 0 && (
            <div className="text-xs text-primary mt-1 font-medium">{sizeMB} MB</div>
          )}
        </div>
        <div className="bg-taupe-100 dark:bg-taupe-700/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileCheck className="w-5 h-5 text-action" />
            <span className="text-2xl font-bold text-action">{existingFiles.length}</span>
          </div>
          <span className="text-xs text-taupe-500 dark:text-taupe-400">Already on PC</span>
        </div>
      </div>

      {existingFiles.length > 0 && (
        <p className="text-xs text-taupe-500 dark:text-taupe-400 mb-4">
          {existingFiles.length} files will be skipped (found elsewhere in destination folder)
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={onSync}
          disabled={newFiles.length === 0}
          className="btn-action flex-1"
        >
          Sync {newFiles.length} files
        </button>
      </div>
    </div>
  )
}
