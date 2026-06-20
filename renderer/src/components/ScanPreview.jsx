import { FileCheck, FilePlus, CheckCircle } from 'lucide-react'

export function ScanPreview({ result, onSync, onCancel }) {
  const { newFiles, existingFiles } = result
  const totalSize = newFiles.reduce((s, f) => s + f.size, 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  return (
    <div className="bg-white dark:bg-zinc-800 border p-5 mb-6">
      <h2 className="font-semibold mb-4">Scan results</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 dark:bg-zinc-900 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FilePlus className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{newFiles.length}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">New files to copy</span>
          {newFiles.length > 0 && (
            <div className="text-xs text-blue-600 mt-1 font-medium">{sizeMB} MB</div>
          )}
        </div>
        <div className="bg-green-50 dark:bg-zinc-900 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{existingFiles.length}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Already on PC</span>
        </div>
      </div>

      {existingFiles.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {existingFiles.length} files will be skipped (found elsewhere in destination folder)
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
        >
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