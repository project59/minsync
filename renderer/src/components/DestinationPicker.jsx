import { FolderOpen } from 'lucide-react'

export function DestinationPicker({ destPath, onChange, onBrowse }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <FolderOpen className="w-4 h-4 text-taupe-500" />
        <span className="font-semibold text-taupe-700 dark:text-taupe-200">Destination folder</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={destPath}
          onChange={(e) => onChange(e.target.value)}
          className="input-main"
          disabled
          placeholder="Select a destination folder..."
        />
        <button onClick={onBrowse} className="btn-secondary whitespace-nowrap">
          Browse
        </button>
      </div>
    </div>
  )
}
