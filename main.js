const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { execFile, exec } = require('child_process')
const { promisify } = require('util')
const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

let mainWindow
let adbPath = 'adb'
const isDev = process.argv.includes('--dev')

function findAdb() {
  const bundled = path.join(__dirname, 'bin', process.platform === 'win32' ? 'adb.exe' : 'adb')
  if (fs.existsSync(bundled)) return bundled

  try {
    const { stdout } = require('child_process').execSync('which adb', { stdio: 'pipe' })
    const found = stdout.toString().trim()
    if (found && fs.existsSync(found)) return found
  } catch {}

  try {
    require('child_process').execSync('adb --version', { stdio: 'pipe' })
    return 'adb'
  } catch {
    return null
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 720,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist-renderer', 'index.html'))
  }
}

app.whenReady().then(() => {
  adbPath = findAdb()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function adb(...args) {
  return execPromise(`${adbPath} ${args.join(' ')}`)
}

function safeAdb(...args) {
  return adb(...args).catch(() => ({ stdout: '', stderr: '' }))
}

function adbShell(deviceId, command) {
  const cmd = `${adbPath} -s ${deviceId} shell '${command}'`
  return execPromise(cmd)
}

function safeAdbShell(deviceId, command) {
  return adbShell(deviceId, command).catch(() => ({ stdout: '', stderr: '' }))
}

ipcMain.handle('adb:status', async () => {
  if (!adbPath) {
    return { available: false, error: 'adb_not_found', device: null }
  }
  try {
    const { stdout } = await adb('devices', '-l')
    const lines = stdout.trim().split('\n').slice(1).filter(l => l.includes('device') && !l.includes('offline'))
    if (lines.length === 0) {
      return { available: true, error: 'no_device', device: null }
    }
    const parts = lines[0].split(/\s+/)
    return {
      available: true,
      error: null,
      device: {
        id: parts[0],
        model: parts.find(p => p.startsWith('model:'))?.replace('model:', '') || 'Unknown'
      }
    }
  } catch (err) {
    console.error('[ADB] Error:', err)
    return { available: false, error: 'adb_error', device: null }
  }
})

ipcMain.handle('adb:tree', async (_, deviceId) => {
  try {
    const seen = new Set()
    const dirs = []

    for (let depth = 1; depth <= 4; depth++) {
      const stars = '/*'.repeat(depth)
      const { stdout } = await safeAdbShell(deviceId, `ls -d /sdcard${stars}/ 2>/dev/null`)
      for (const line of stdout.split('\n')) {
        const d = line.trim().replace(/\/$/, '')
        if (d && d.startsWith('/sdcard') && d !== '/sdcard' && !seen.has(d)) {
          seen.add(d)
          dirs.push(d)
        }
      }
    }

    dirs.sort()
    const tree = []
    for (const dir of dirs) {
      const parts = dir.replace('/sdcard/', '').split('/')
      let current = tree
      let node = null
      for (const part of parts) {
        node = current.find(n => n.name === part)
        if (!node) {
          node = { name: part, path: '', children: [] }
          current.push(node)
        }
        current = node.children
      }
      node.path = dir
    }
    return tree
  } catch {
    return []
  }
})

ipcMain.handle('adb:scan', async (_, deviceId, folders) => {
  const allFiles = []
  for (const folder of folders) {
    const { stdout } = await safeAdbShell(deviceId, `ls -lR "${folder}" 2>/dev/null`)
    allFiles.push(...parseLsRecursive(stdout))
  }
  return allFiles
})

function parseLsRecursive(output) {
  const files = []
  let currentDir = ''
  for (const line of output.split('\n')) {
    if (line.endsWith(':')) {
      currentDir = line.slice(0, -1)
    } else if (line.startsWith('-')) {
      const parts = line.split(/\s+/)
      if (parts.length < 8) continue
      const size = parseInt(parts[4])
      if (isNaN(size)) continue
      const dateStr = `${parts[5]} ${parts[6]}`
      const name = parts.slice(7).join(' ')
      const mtime = Math.floor(new Date(dateStr.replace(/-/g, '/')).getTime() / 1000)
      if (!isNaN(mtime)) {
        files.push({ path: `${currentDir}/${name}`, size, mtime })
      }
    }
  }
  return files
}

ipcMain.handle('adb:pull', async (_, deviceId, src, dest) => {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const cmd = `${adbPath} -s ${deviceId} pull "${src}" "${dest}"`
  await execPromise(cmd)
})

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('files:checkPC', async (_, destPath, phoneFiles) => {
  const existingOnPC = new Map()
  const searchQueue = [destPath]

  while (searchQueue.length > 0) {
    const currentPath = searchQueue.pop()
    let entries
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        searchQueue.push(fullPath)
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath)
          const key = `${entry.name}_${stats.size}`
          if (!existingOnPC.has(key)) {
            existingOnPC.set(key, [])
          }
          existingOnPC.get(key).push(fullPath)
        } catch {
        }
      }
    }
  }

  const result = []
  for (const pf of phoneFiles) {
    const key = `${path.basename(pf.path)}_${pf.size}`
    const matches = existingOnPC.get(key) || []
    result.push({
      phonePath: pf.path,
      size: pf.size,
      existsOnPC: matches.length > 0,
      pcPaths: matches
    })
  }
  return result
})
