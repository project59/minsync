import { CheckCircle } from 'lucide-react'

export function SyncProgress({ result }) {
  return (
    <div className="bg-white dark:bg-zinc-800 border p-5 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium truncate mr-4">
          {result ? result.newFiles.length + ' files remaining' : 'Syncing...'}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2.5">
        <div className="bg-primary h-2.5 transition-all duration-300 animate-pulse" style={{ width: '100%' }} />
      </div>
    </div>
  )
}