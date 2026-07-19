import { FolderSync, RefreshCw } from 'lucide-react'
import { FolderTree } from './FolderTree'

export function FolderSyncSection({ folderTree, selectedFolders, setSelectedFolders, isLoadingTree }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-taupe-500" />
          <span className="font-semibold text-taupe-700 dark:text-taupe-200">Folders to Sync</span>
        </div>
        <button onClick={() => setSelectedFolders([])} className="btn-secondary">
          Clear all
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
    </div>
  )
}
