import { History } from 'lucide-react'

export function SyncHistory({ history }) {
  return (
    <div className="bg-white dark:bg-zinc-800 border p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-gray-400" />
        <h2 className="font-semibold">Sync history</h2>
      </div>
      {history.length === 0 ? (
        <p className="text-gray-400 italic text-sm">No syncs yet</p>
      ) : (
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.id || h.timestamp} className="flex justify-between text-sm py-2 border-b dark:border-zinc-700 last:border-0">
              <span className="text-gray-500 dark:text-gray-400">
                {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                {h.new_count} new · {(h.total_size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}