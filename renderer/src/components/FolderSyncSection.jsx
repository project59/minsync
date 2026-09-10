import { RefreshCw } from 'lucide-react'
import { FolderTree } from './FolderTree'

export function FolderSyncSection({ folderTree, includeAndroid, onIncludeAndroidChange, onReloadTree, selectedFolders, setSelectedFolders, isLoadingTree }) {
  return (
    <div className="">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-taupe-200 bg-taupe-50 p-3 dark:border-taupe-700 dark:bg-taupe-800/50">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={includeAndroid}
            onChange={(event) => onIncludeAndroidChange(event.target.checked)}
            className="mt-0.5 rounded border-taupe-300 text-primary focus:ring-primary/30"
          />
          <span>
            <span className="block text-sm font-medium text-taupe-700 dark:text-taupe-200">Include system Android folder</span>
            <span className="block text-xs text-taupe-500 dark:text-taupe-400">This can contain many files and may make loading slower.</span>
          </span>
        </label>
        <button onClick={onReloadTree} disabled={isLoadingTree} className="btn-secondary flex items-center gap-1.5 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTree ? 'animate-spin' : ''}`} />
          Reload folders
        </button>
      </div>
      {folderTree.length > 0 ? (
        <FolderTree
          tree={folderTree}
          selected={selectedFolders}
          onChange={setSelectedFolders}
        />
      ) : (
        <div className="flex items-center justify-center py-8 text-taupe-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading folders...
        </div>
      )}
      <button onClick={() => setSelectedFolders([])} className="btn-secondary mt-3">
        Clear all
      </button>
    </div>
  )
}
