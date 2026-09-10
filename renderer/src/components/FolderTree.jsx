import { useState } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'

function getAllDescendantPaths(node) {
  const paths = []
  if (node.path) paths.push(node.path)
  for (const child of node.children) {
    paths.push(...getAllDescendantPaths(child))
  }
  return paths
}

function getChildPaths(node) {
  const paths = []
  for (const child of node.children) {
    if (child.path) paths.push(child.path)
    paths.push(...getChildPaths(child))
  }
  return paths
}

function getFileCount(node) {
  let count = 0
  for (const child of node.children) {
    if (!child.children || child.children.length === 0) {
      count++
    } else {
      count += getFileCount(child)
    }
  }
  return count
}

function TreeNode({ node, selected, onChange, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const isFolder = node.children && node.children.length > 0
  const descendantPaths = isFolder ? getAllDescendantPaths(node) : []
  const childPaths = isFolder ? getChildPaths(node) : []
  const fileCount = isFolder ? getFileCount(node) : 0

  const allDescendantsSelected = isFolder && childPaths.length > 0 &&
    childPaths.every(p => selected.includes(p))
  const someDescendantsSelected = isFolder && childPaths.some(p => selected.includes(p))

  const isIndeterminate = someDescendantsSelected && !allDescendantsSelected

  function handleCheckboxChange(checked) {
    if (checked) {
      const newSelected = [...new Set([...selected, node.path, ...descendantPaths])]
      onChange(newSelected)
    } else {
      const pathsToRemove = new Set([node.path, ...descendantPaths])
      onChange(selected.filter(p => !pathsToRemove.has(p)))
    }
  }

  function handleDescendantChange(path, checked) {
    let newSelected
    if (checked) {
      newSelected = [...new Set([...selected, path])]
    } else {
      newSelected = selected.filter(p => p !== path)
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
        <Folder className="w-4 h-4 text-taupe-400" />
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
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-taupe-400" />
        ) : (
          <Folder className="w-4 h-4 text-taupe-400" />
        )}
        <span className="text-sm font-medium text-taupe-700 dark:text-taupe-300 flex-1">{node.name}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-0.5 rounded hover:bg-taupe-200 dark:hover:bg-taupe-600 transition-colors duration-150"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-taupe-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-taupe-400" />
          )}
        </button>
      </div>
      {isOpen && (
        <div className="ml-5 border-l border-taupe-200 dark:border-taupe-700 pl-2">
          {node.children.map(child => (
            <TreeNode
              key={child.path || child.name}
              node={child}
              selected={selected}
              onChange={onChange}
              defaultOpen={false}
            />
          ))}
          {fileCount > 0 && (
            <div className="text-xs text-taupe-500 dark:text-taupe-400 px-2 py-1">
              +{fileCount} file{fileCount !== 1 ? 's' : ''}
            </div>
          )}
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
          defaultOpen={true}
        />
      ))}
    </div>
  )
}
