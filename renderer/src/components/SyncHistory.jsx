import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { History, ChevronDown } from 'lucide-react'

export function SyncHistory({ history }) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="card">
          <DisclosureButton className="flex items-center justify-between w-full cursor-pointer group">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-taupe-500" />
              <span className="font-semibold text-taupe-700 dark:text-taupe-200">Sync history</span>
              <span className="text-xs text-taupe-400 bg-taupe-100 dark:bg-taupe-700 px-2 py-0.5 rounded-full font-mono">
                {history.length}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-taupe-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </DisclosureButton>
          <DisclosurePanel className="mt-3 space-y-1">
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
          </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  )
}
