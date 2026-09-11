import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { History, X } from 'lucide-react'

export function SyncHistory({ history, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white dark:bg-taupe-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden shadow-xl border border-taupe-200 dark:border-taupe-700">
          <div className="flex items-center justify-between p-4 border-b border-taupe-200 dark:border-taupe-700">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-taupe-500" />
              <DialogTitle className="font-semibold text-taupe-700 dark:text-taupe-200">Sync history</DialogTitle>
              <span className="text-xs text-taupe-400 bg-taupe-100 dark:bg-taupe-700 px-2 py-0.5 rounded-full font-mono">
                {history.length}
              </span>
            </div>
            <button onClick={onClose} className="btn-secondary p-1.5" aria-label="Close sync history">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-taupe-400 italic text-sm py-2">No syncs yet</p>
            ) : (
              <div className="divide-y divide-taupe-100 dark:divide-taupe-700">
                {history.map(h => (
                  <div key={h.id || h.timestamp} className="flex justify-between text-sm py-2">
                    <span className="text-taupe-500 dark:text-taupe-400">
                      {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-taupe-700 dark:text-taupe-300 font-medium">
                      {h.new_count} new &middot; {(h.total_size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
