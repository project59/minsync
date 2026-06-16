const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

let mainWindow
let adbPath = 'adb'

function findAdb() {
  const bundled = path.join(__dirname, 'bin', process.platform === 'win32' ? 'adb.exe' : 'adb')
  if (fs.existsSync(bundled)) return bundled

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
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
}

app.whenReady().then(() => {
  adbPath = findAdb()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function adb(...args) {
  const cmd = [`"${adbPath}"`, ...args].join(' ')
  return execPromise(cmd)
}

function safeAdb(...args) {
  return adb(...args).catch(() => ({ stdout: '', stderr: '' }))
}

function adbShell(deviceId, command) {
  return adb('-s', deviceId, 'shell', `'${command}'`)
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
  } catch {
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
  await adb('-s', deviceId, 'pull', `"${src}"`, `"${dest}"`)
})

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})
