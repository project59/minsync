import { History } from 'lucide-react'

export function SyncHistory({ history }) {
  return (
    <div className="bg-white dark:bg-slate-900 border-primary p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-slate-400" />
        <h2 className="font-semibold">Sync history</h2>
      </div>
      {history.length === 0 ? (
        <p className="text-slate-400 italic text-sm">No syncs yet</p>
      ) : (
        <div className="space-y-3">
          {history.map(h => (
            <div key={h.id || h.timestamp} className="flex justify-between text-sm py-2 border-b dark:border-slate-700 last:border-0">
              <span className="text-slate-500 dark:text-slate-400">
                {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {h.new_count} new · {(h.total_size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}