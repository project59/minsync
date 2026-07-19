import { RefreshCw } from 'lucide-react'

export function SyncProgress({ result }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4 text-action animate-spin" />
        <span className="text-sm font-medium text-taupe-700 dark:text-taupe-200">
          {result ? `${result.newFiles.length} files remaining` : 'Syncing...'}
        </span>
      </div>
      <div className="w-full bg-taupe-200 dark:bg-taupe-700 rounded-full h-2 overflow-hidden">
        <div className="bg-action h-full rounded-full animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  )
}
