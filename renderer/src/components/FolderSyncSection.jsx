import { FolderSync, RefreshCw } from 'lucide-react'
import { FolderTree } from './FolderTree'

export function FolderSyncSection({ folderTree, selectedFolders, setSelectedFolders, isLoadingTree }) {
  return (
    <div className="">
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
