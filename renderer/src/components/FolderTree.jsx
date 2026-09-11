import { useState } from 'react'
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'

function getSelectablePaths(node) {
  const paths = []
  if (node.path) paths.push(node.path)
  for (const child of node.children || []) {
    paths.push(...getSelectablePaths(child))
  }
  return paths
}

function getFileCount(node) {
  if (node.type === 'file') return 1
  return (node.children || []).reduce((count, child) => count + getFileCount(child), 0)
}

function isAncestorPath(ancestor, path) {
  return path.startsWith(`${ancestor}/`)
}

function TreeNode({ node, selected, onChange, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isFolder = node.type !== 'file'
  const children = node.children || []
  const isExpandable = isFolder && children.length > 0
  const selectablePaths = getSelectablePaths(node)
  const fileCount = isFolder ? getFileCount(node) : 0

  const allDescendantsSelected = isFolder && selectablePaths.length > 0 &&
    selectablePaths.every(p => selected.includes(p))
  const someDescendantsSelected = isFolder && selectablePaths.some(p => selected.includes(p))

  const isIndeterminate = someDescendantsSelected && !allDescendantsSelected

  function handleCheckboxChange(checked) {
    if (checked) {
      const newSelected = [...new Set([...selected, ...selectablePaths])]
      onChange(newSelected)
    } else {
      const pathsToRemove = new Set(selectablePaths)
      onChange(selected.filter(p => (
        !pathsToRemove.has(p) && !isAncestorPath(p, node.path)
      )))
    }
  }

  function handleDescendantChange(path, checked) {
    let newSelected
    if (checked) {
      newSelected = [...new Set([...selected, path])]
    } else {
      newSelected = selected.filter(p => p !== path && !isAncestorPath(p, path))
    }
    onChange(newSelected)
  }

  if (!isFolder) {
    return (
      <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-taupe-100 dark:hover:bg-taupe-700/50 cursor-pointer rounded-lg transition-colors duration-150">
        <input
          type="checkbox"
          checked={selected.includes(node.path)}
          onChange={(e) => handleDescendantChange(node.path, e.target.checked)}
          className="rounded border-taupe-300 text-primary focus:ring-primary/30"
        />
        <File className="w-4 h-4 text-taupe-400" />
        <span className="text-sm text-taupe-700 dark:text-taupe-300">{node.name}</span>
      </label>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-taupe-100 dark:hover:bg-taupe-700/50 rounded-lg transition-colors duration-150">
        <input
          type="checkbox"
          checked={allDescendantsSelected}
          ref={el => { if (el) el.indeterminate = isIndeterminate }}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="rounded border-taupe-300 text-primary focus:ring-primary/30"
        />
        {isOpen && isExpandable ? (
          <FolderOpen className="w-4 h-4 text-taupe-400" />
        ) : (
          <Folder className="w-4 h-4 text-taupe-400" />
        )}
        <span className="text-sm font-medium text-taupe-700 dark:text-taupe-300 flex-1">{node.name}</span>
        <span className="text-xs text-taupe-400 dark:text-taupe-500">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isExpandable}
          className="p-0.5 rounded hover:bg-taupe-200 dark:hover:bg-taupe-600 transition-colors duration-150"
        >
          {isOpen && isExpandable ? (
            <ChevronDown className="w-4 h-4 text-taupe-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-taupe-400" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="ml-5 border-l border-taupe-200 dark:border-taupe-700 pl-2">
          {children.map(child => (
            <TreeNode
              key={child.path || child.name}
              node={child}
              selected={selected}
              onChange={onChange}
              defaultOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FolderTree({ tree, selected, onChange }) {
  return (
    <div className="max-h-96 overflow-y-auto rounded-xl bg-gray-50 dark:bg-taupe-800/50 p-2 space-y-1">
      {tree.map(node => (
        <TreeNode
          key={node.path || node.name}
          node={node}
          selected={selected}
          onChange={onChange}
          defaultOpen={false}
        />
      ))}
    </div>
  )
}
