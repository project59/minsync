const db = new SyncDB()
let currentDevice = null
let scanResult = null
let selectedFolders = []
let isScanning = false
let isSyncing = false
let isLoadingTree = false

const $ = id => document.getElementById(id)

function logStatus(msg, count) {
  const el = $('status-log')
  el.classList.remove('hidden')
  $('status-msg').textContent = msg
  if (count !== undefined) $('status-count').textContent = count
}

async function init() {
  await db.open()
  await loadConfig()
  await loadHistory()

  $('browse-btn').addEventListener('click', async () => {
    const folder = await window.api.pickFolder()
    if (folder) { $('dest-path').value = folder; db.setConfig('dest_path', folder) }
  })

  $('dest-path').addEventListener('change', () => db.setConfig('dest_path', $('dest-path').value))
  $('select-all-btn').addEventListener('click', () => setAllCheckboxes(true))
  $('deselect-all-btn').addEventListener('click', () => setAllCheckboxes(false))
  $('folder-tree').addEventListener('change', onFolderTreeChange)
  $('scan-btn').addEventListener('click', scan)
  $('sync-btn').addEventListener('click', sync)

  pollStatus()
  setInterval(pollStatus, 3000)
}

async function loadConfig() {
  const dest = await db.getConfig('dest_path')
  if (dest) $('dest-path').value = dest
  const folders = await db.getConfig('selected_folders')
  if (folders) selectedFolders = folders
}

// --- Setup guide ---
const SETUP_STEPS = {
  adb_not_found: `
    <div class="space-y-4">
      <div class="flex items-center gap-3 text-amber-700 bg-amber-50 rounded-lg p-4 border border-amber-200">
        <span class="text-2xl">⚠️</span>
        <p class="text-sm"><strong>ADB not detected.</strong> PhoneSync bundles ADB, but it needs to be downloaded first.</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 border">
        <p class="font-medium mb-2">Automatic download failed. Install ADB manually:</p>
        <ol class="list-decimal ml-5 space-y-2 text-sm">
          <li>Download <a href="https://developer.android.com/studio/releases/platform-tools" class="text-primary underline" target="_blank">Android Platform Tools</a></li>
          <li>Extract the zip somewhere on your PC</li>
          <li>Add the folder to your system PATH</li>
          <li>Restart PhoneSync</li>
        </ol>
      </div>
    </div>`,
  no_device: `
    <div class="space-y-4">
      <div class="flex items-center gap-3 text-blue-700 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <span class="text-2xl">📱</span>
        <p class="text-sm"><strong>Phone not detected.</strong> Connect your phone to get started.</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 border">
        <p class="font-medium mb-2">One-time setup on your Android phone:</p>
        <ol class="list-decimal ml-5 space-y-2 text-sm">
          <li>Open <strong>Settings → About phone</strong></li>
          <li>Tap <strong>"Build number"</strong> 7 times (you'll see "You are now a developer")</li>
          <li>Go back → <strong>System → Developer options</strong></li>
          <li>Enable <strong>USB debugging</strong></li>
          <li>Plug in your phone via USB cable</li>
          <li>Set the USB mode to <strong>"File transfer"</strong></li>
          <li>Accept the <strong>RSA key fingerprint</strong> prompt on your phone</li>
        </ol>
      </div>
      <p class="text-xs text-gray-400">After connecting, the app will detect your phone automatically.</p>
    </div>`,
  adb_error: `
    <div class="flex items-center gap-3 text-red-700 bg-red-50 rounded-lg p-4 border border-red-200">
      <span class="text-2xl">❌</span>
      <p class="text-sm"><strong>ADB error.</strong> Please reconnect your phone and restart the app.</p>
    </div>`
}

function showSetup(key) {
  $('setup-panel').classList.remove('hidden')
  $('main-ui').classList.add('hidden')
  $('setup-content').innerHTML = SETUP_STEPS[key] || ''
}

function showMainUI() {
  $('setup-panel').classList.add('hidden')
  $('main-ui').classList.remove('hidden')
}

// --- Device polling ---
async function pollStatus() {
  const status = await window.api.getStatus()

  if (!status.available) {
    $('device-status').textContent = 'ADB missing'
    $('device-status').className = 'text-sm px-3 py-1 rounded-full bg-red-100 text-red-700'
    showSetup('adb_not_found')
    currentDevice = null
    return
  }

  if (!status.device) {
    $('device-status').textContent = 'No phone'
    $('device-status').className = 'text-sm px-3 py-1 rounded-full bg-amber-100 text-amber-700'
    showSetup('no_device')
    currentDevice = null
    return
  }

  currentDevice = status.device
  $('device-status').textContent = 'Connected'
  $('device-status').className = 'text-sm px-3 py-1 rounded-full bg-green-100 text-green-700'
  showMainUI()
  $('status-dot').className = 'w-3 h-3 rounded-full bg-green-500'
  $('device-name').textContent = `${currentDevice.model} (${currentDevice.id})`
  $('scan-btn').disabled = false
  $('scan-btn').className = 'flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 cursor-pointer'

  if (document.querySelectorAll('.folder-cb').length === 0 && !isLoadingTree) {
    isLoadingTree = true
    await buildFolderTree()
    isLoadingTree = false
  }
}

// --- Folder tree ---
async function buildFolderTree() {
  const container = $('folder-tree')
  container.innerHTML = '<p class="text-gray-400 italic text-center py-4">Loading folders...</p>'
  if (!currentDevice) return
  const tree = await window.api.getFolderTree(currentDevice.id)
  container.innerHTML = ''
  if (tree.length === 0) {
    container.innerHTML = '<p class="text-gray-400 italic text-center py-4">No folders found on phone</p>'
    return
  }
  renderTree(tree, container, '')
  restoreCheckboxes()
}

function renderTree(nodes, parent, prefix) {
  for (const node of nodes) {
    const label = document.createElement('label')
    label.className = 'flex items-center gap-2 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.className = 'rounded border-gray-300 text-primary focus:ring-primary folder-cb'
    cb.dataset.path = node.path
    label.appendChild(cb)
    const icon = node.children.length > 0 ? '📁' : '📂'
    label.append(`${icon} ${node.name}`)
    parent.appendChild(label)
    if (node.children.length > 0) {
      const childDiv = document.createElement('div')
      childDiv.className = 'ml-5'
      renderTree(node.children, childDiv, prefix + node.name + '/')
      parent.appendChild(childDiv)
    }
  }
}

function onFolderTreeChange(e) {
  if (!e.target.matches('.folder-cb')) return
  selectedFolders = [...document.querySelectorAll('.folder-cb:checked')].map(c => c.dataset.path).filter(Boolean)
  console.log('Selected folders:', selectedFolders)
  db.setConfig('selected_folders', selectedFolders)
}

function restoreCheckboxes() {
  document.querySelectorAll('.folder-cb').forEach(cb => {
    if (selectedFolders.includes(cb.dataset.path)) cb.checked = true
  })
}

function setAllCheckboxes(checked) {
  document.querySelectorAll('.folder-cb').forEach(cb => { cb.checked = checked })
  // programmatic check doesn't fire change event, so update manually
  selectedFolders = checked
    ? [...document.querySelectorAll('.folder-cb')].map(c => c.dataset.path).filter(Boolean)
    : []
  console.log('Selected folders:', selectedFolders)
  db.setConfig('selected_folders', selectedFolders)
}

// --- Scan ---
async function scan() {
  if (!currentDevice) return
  console.log('scan clicked, selectedFolders:', selectedFolders)
  if (selectedFolders.length === 0) {
    alert('Select at least one folder to scan (check boxes in "Folders to sync").')
    return
  }
  if (isScanning) return
  isScanning = true
  $('scan-btn').disabled = true
  $('scan-btn').textContent = 'Scanning phone...'
  $('preview-panel').classList.add('hidden')

  try {
    logStatus('Scanning ' + selectedFolders.length + ' folder(s)...')
    const phoneFiles = await window.api.scanFiles(currentDevice.id, selectedFolders)
    logStatus('Found ' + phoneFiles.length + ' files on phone, comparing with database...')
    const dest = $('dest-path').value

    const knownFiles = await db.getAllFiles()
    const knownMap = new Map(knownFiles.map(f => [f.path, f]))
    const sizeMtimeMap = new Map()

    for (const f of knownFiles) {
      const key = `${f.size}_${f.mtime}`
      if (!sizeMtimeMap.has(key)) sizeMtimeMap.set(key, [])
      sizeMtimeMap.get(key).push(f)
    }

    const syncTime = Date.now()
    const newFiles = []
    const modifiedFiles = []
    const unchangedFiles = []
    const movedFiles = []

    for (const pf of phoneFiles) {
      const known = knownMap.get(pf.path)
      if (!known) {
        const potentialMoves = sizeMtimeMap.get(`${pf.size}_${pf.mtime}`)
        if (potentialMoves) {
          const idx = potentialMoves.findIndex(m => m.last_seen < syncTime)
          if (idx !== -1) {
            movedFiles.push({ oldPath: potentialMoves[idx].path, newPath: pf.path })
            await db.putFile({ ...potentialMoves[idx], path: pf.path, last_seen: syncTime })
            potentialMoves.splice(idx, 1)
            continue
          }
        }
        newFiles.push(pf)
      } else if (known.size !== pf.size || known.mtime !== pf.mtime) {
        modifiedFiles.push(pf)
      } else {
        unchangedFiles.push(pf)
      }
    }

    const unseenFiles = await db.getUnseenFiles(syncTime)
    const deletedFiles = unseenFiles.filter(uf => !movedFiles.find(m => m.oldPath === uf.path))

    scanResult = { newFiles, modifiedFiles, unchangedFiles, deletedFiles, movedFiles, syncTime, dest }

    $('count-new').textContent = newFiles.length
    $('count-modified').textContent = modifiedFiles.length
    $('count-unchanged').textContent = unchangedFiles.length
    $('count-deleted').textContent = deletedFiles.length

    const movedEl = $('moved-files')
    if (movedFiles.length > 0) {
      movedEl.textContent = `🔄 ${movedFiles.length} files were moved/renamed (no re-copy needed)`
      movedEl.classList.remove('hidden')
    } else {
      movedEl.classList.add('hidden')
    }

    $('preview-panel').classList.remove('hidden')

    const hasChanges = newFiles.length + modifiedFiles.length > 0
    $('sync-btn').disabled = !hasChanges
    if (hasChanges) {
      $('sync-btn').textContent = `Sync ${newFiles.length + modifiedFiles.length} files`
      $('sync-btn').className = 'flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 cursor-pointer'
    } else {
      $('sync-btn').textContent = 'Up to date'
      $('sync-btn').className = 'flex-1 py-2.5 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed'
    }
  } catch (err) {
    alert('Scan failed: ' + err.message)
  }

  isScanning = false
  $('scan-btn').disabled = false
  $('scan-btn').textContent = 'Scan for changes'
}

// --- Sync ---
async function sync() {
  if (!scanResult || isSyncing) return
  const { newFiles, modifiedFiles, deletedFiles, movedFiles, syncTime, dest } = scanResult
  const targetFiles = [...newFiles, ...modifiedFiles]
  if (targetFiles.length === 0) return

  isSyncing = true
  $('sync-btn').disabled = true
  $('sync-btn').textContent = 'Syncing...'
  $('progress-panel').classList.remove('hidden')

  let completed = 0
  const total = targetFiles.length

  for (const file of targetFiles) {
    const rel = file.path.replace('/sdcard', '')
    const destPath = pathJoin(dest, rel)
    try {
      await window.api.pullFile(currentDevice.id, file.path, destPath)
      await db.putFile({
        path: file.path,
        size: file.size,
        mtime: file.mtime,
        last_seen: syncTime,
        dest_path: destPath
      })
    } catch (err) {
      console.error(`Failed: ${file.path}`, err)
    }
    completed++
    const pct = Math.round((completed / total) * 100)
    $('progress-bar').style.width = pct + '%'
    $('progress-count').textContent = `${completed} / ${total}`
    $('progress-label').textContent = file.path.split('/').pop()
  }

  for (const f of deletedFiles) {
    await db.putFile({ ...f, deleted_at: Date.now() })
  }

  await db.addSyncRecord({
    new_count: newFiles.length,
    modified_count: modifiedFiles.length,
    deleted_count: deletedFiles.length,
    moved_count: movedFiles.length,
    total_size: targetFiles.reduce((s, f) => s + f.size, 0)
  })

  $('progress-bar').style.width = '100%'
  $('progress-label').textContent = '✓ Sync complete'
  $('sync-btn').textContent = 'Up to date'
  $('sync-btn').className = 'flex-1 py-2.5 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed'
  scanResult = null
  isSyncing = false
  await loadHistory()
}

function pathJoin(a, b) {
  return a.replace(/\\/g, '/').replace(/\/$/, '') + '/' + b.replace(/^\//, '')
}

// --- History ---
async function loadHistory() {
  const history = await db.getSyncHistory()
  const container = $('sync-history')
  if (history.length === 0) {
    container.innerHTML = '<p class="text-gray-400 italic">No syncs yet</p>'
    return
  }
  container.innerHTML = history.map(h => {
    const d = new Date(h.timestamp)
    const total = h.new_count + h.modified_count
    const sizeMB = (h.total_size / (1024 * 1024)).toFixed(1)
    return `<div class="flex justify-between text-sm py-1.5 border-b last:border-0 text-gray-600">
      <span>${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span>${h.new_count} new · ${h.modified_count} modified · ${h.deleted_count} deleted · ${sizeMB} MB</span>
    </div>`
  }).join('')
}

document.addEventListener('DOMContentLoaded', init)
