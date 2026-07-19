import { Database, Wifi } from 'lucide-react'

export function TabBar({ tab, setTab }) {
  return (
    <div className="flex bg-taupe-200/70 dark:bg-taupe-800/70 rounded-xl overflow-hidden p-1">
      <button
        onClick={() => setTab('backup')}
        className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer rounded-lg transition-all duration-150 ${
          tab === 'backup'
            ? 'bg-white dark:bg-taupe-700 text-taupe-800 dark:text-taupe-100 shadow-sm'
            : 'text-taupe-600 dark:text-taupe-400 hover:text-taupe-800 dark:hover:text-taupe-200'
        }`}
      >
        <Database className="w-4 h-4" /> Backup
      </button>
      <button
        onClick={() => setTab('share')}
        className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer rounded-lg transition-all duration-150 ${
          tab === 'share'
            ? 'bg-white dark:bg-taupe-700 text-taupe-800 dark:text-taupe-100 shadow-sm'
            : 'text-taupe-600 dark:text-taupe-400 hover:text-taupe-800 dark:hover:text-taupe-200'
        }`}
      >
        <Wifi className="w-4 h-4" /> Quick Share
      </button>
    </div>
  )
}
