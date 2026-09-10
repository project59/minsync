import { FolderOpen } from 'lucide-react'

export function DestinationPicker({ destPath, onChange, onBrowse }) {
  return (

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={destPath}
          onChange={(e) => onChange(e.target.value)}
          className="input-main w-full max-w-md"
          disabled
          placeholder="Select a destination folder..."
        />
        <button onClick={onBrowse} className="btn-secondary whitespace-nowrap">
          Browse
        </button>
      </div>
  )
}
