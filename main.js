const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const os = require('os')
const { execFile, exec, spawn } = require('child_process')
const { promisify } = require('util')
const execFilePromise = promisify(execFile)
const execPromise = promisify(exec)

let mainWindow
let adbPath = 'adb'
const isDev = process.argv.includes('--dev')

// ---------- Quick Share (wireless HTTP server) ----------
let shareServer = null
const shareState = {
  port: 0,
  receiveDir: '',
  shareDir: '',
  pcName: os.hostname(),
  startedAt: 0
}

function getLocalIp() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return '127.0.0.1'
}

function broadcastShareEvent(type, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('share:event', { type, payload })
  }
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, target)
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error('Path traversal blocked')
  }
  return resolved
}

function listShareDir() {
  if (!shareState.shareDir || !fs.existsSync(shareState.shareDir)) return []
  const out = []
  function walk(dir, rel = '') {
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(full, r)
      else if (e.isFile()) {
        try {
          const st = fs.statSync(full)
          out.push({ path: r, name: e.name, size: st.size, mtime: Math.floor(st.mtimeMs / 1000) })
        } catch {}
      }
    }
  }
  walk(shareState.shareDir)
  return out.sort((a, b) => a.path.localeCompare(b.path))
}

function renderMobilePage(req) {
  const ip = getLocalIp()
  const port = shareState.port
  const pcName = shareState.pcName
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>PhoneSync Quick Share</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-monospace, Menlo, Consolas, monospace; background:#0a0a0a; color:#fafafa; padding:16px; padding-bottom:40px; }
  h1 { font-size:18px; margin:0 0 4px; }
  .sub { color:#888; font-size:12px; margin-bottom:20px; }
  .card { background:#161616; border:1px solid #262626; padding:16px; margin-bottom:16px; }
  .row { display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .btn { background:#34d399; color:#000; border:0; padding:12px 16px; font-family:inherit; font-size:14px; cursor:pointer; width:100%; }
  .btn.sec { background:#262626; color:#fafafa; }
  .drop { border:2px dashed #444; padding:28px 12px; text-align:center; color:#888; font-size:13px; margin-top:12px; }
  .drop.active { border-color:#34d399; color:#34d399; background:#0f1a17; }
  input[type=file] { display:none; }
  ul { list-style:none; padding:0; margin:0; }
  li { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid #222; font-size:13px; word-break:break-all; }
  li:last-child { border-bottom:0; }
  .name { flex:1; }
  .size { color:#777; font-size:11px; white-space:nowrap; }
  .dl { background:#262626; color:#fafafa; padding:6px 10px; font-size:11px; border:1px solid #333; cursor:pointer; font-family:inherit; }
  .tabs { display:flex; gap:4px; margin-bottom:12px; }
  .tab { flex:1; text-align:center; padding:10px; background:#161616; border:1px solid #262626; cursor:pointer; font-size:13px; }
  .tab.active { background:#262626; border-color:#34d399; }
  .empty { color:#666; text-align:center; padding:20px; font-size:12px; }
  .ok { color:#34d399; font-size:12px; margin-top:8px; text-align:center; }
  .err { color:#f87171; font-size:12px; margin-top:8px; text-align:center; }
  .spinner { display:inline-block; width:12px; height:12px; border:2px solid #444; border-top-color:#34d399; border-radius:50%; animation:sp 0.8s linear infinite; vertical-align:middle; }
  @keyframes sp { to { transform:rotate(360deg); } }
  a { color:#34d399; }
</style>
</head>
<body>
  <h1>PhoneSync Quick Share</h1>
  <div class="sub">Connected to <strong>${pcName}</strong> · ${ip}:${port}</div>

  <div class="tabs">
    <div class="tab active" id="tabUp" onclick="switchTab('up')">Upload to PC</div>
    <div class="tab" id="tabDn" onclick="switchTab('dn')">Download from PC</div>
  </div>

  <div id="viewUp">
    <div class="card">
      <div class="row">
        <span style="font-size:13px;color:#aaa">Send files from this phone to ${pcName}</span>
      </div>
      <button class="btn" onclick="pickFiles()">Choose files to upload</button>
      <input type="file" id="fileInput" multiple>
      <div class="drop" id="drop">…or drop files here</div>
      <div id="upStatus"></div>
    </div>
  </div>

  <div id="viewDn" style="display:none">
    <div class="card">
      <div class="row" style="margin-bottom:10px">
        <span style="font-size:13px;color:#aaa">Files shared from ${pcName}</span>
        <button class="dl" onclick="refreshList()">Refresh</button>
      </div>
      <ul id="fileList"><li class="empty">Loading…</li></ul>
    </div>
  </div>

<script>
let activeTab = 'up';
function switchTab(t) {
  activeTab = t;
  document.getElementById('tabUp').classList.toggle('active', t==='up');
  document.getElementById('tabDn').classList.toggle('active', t==='dn');
  document.getElementById('viewUp').style.display = t==='up' ? '' : 'none';
  document.getElementById('viewDn').style.display = t==='dn' ? '' : 'none';
  if (t==='dn') refreshList();
}

function setStatus(msg, cls) {
  const el = document.getElementById('upStatus');
  el.innerHTML = '';
  if (!msg) return;
  const d = document.createElement('div');
  d.className = cls || 'ok';
  d.innerHTML = msg;
  el.appendChild(d);
}

function pickFiles() { document.getElementById('fileInput').click(); }

document.getElementById('fileInput').addEventListener('change', e => {
  uploadFiles(Array.from(e.target.files));
});

const drop = document.getElementById('drop');
['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('active'); }));
['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('active'); }));
drop.addEventListener('drop', e => { e.preventDefault(); uploadFiles(Array.from(e.dataTransfer.files)); });

async function uploadFiles(files) {
  if (!files.length) return;
  let done = 0, failed = 0;
  for (const f of files) {
    setStatus('<span class="spinner"></span> Uploading ' + (done+1) + '/' + files.length + ': ' + escapeHtml(f.name));
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-Filename': encodeURIComponent(f.name), 'Content-Type': f.type || 'application/octet-stream' },
        body: f
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      done++;
    } catch (err) {
      failed++;
      console.error(err);
    }
  }
  if (failed) setStatus('Uploaded ' + done + ', failed ' + failed, 'err');
  else setStatus('Uploaded ' + done + ' file' + (done===1?'':'s') + ' ✓', 'ok');
  document.getElementById('fileInput').value = '';
}

async function refreshList() {
  const ul = document.getElementById('fileList');
  ul.innerHTML = '<li class="empty">Loading…</li>';
  try {
    const res = await fetch('/api/pc-files');
    const data = await res.json();
    if (!data.files.length) { ul.innerHTML = '<li class="empty">No files shared yet</li>'; return; }
    ul.innerHTML = '';
    for (const f of data.files) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="name">' + escapeHtml(f.path) + '</span>' +
                     '<span class="size">' + humanSize(f.size) + '</span>' +
                     '<a class="dl" href="/api/download?p=' + encodeURIComponent(f.path) + '" download="' + encodeURIComponent(f.name) + '">Get</a>';
      ul.appendChild(li);
    }
  } catch (err) {
    ul.innerHTML = '<li class="empty">Failed to load: ' + escapeHtml(err.message) + '</li>';
  }
}

function humanSize(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n/1024).toFixed(1) + ' KB';
  if (n < 1073741824) return (n/1048576).toFixed(1) + ' MB';
  return (n/1073741824).toFixed(1) + ' GB';
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
</script>
</body>
</html>`
}

function handleShareRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  if (url.pathname === '/' && req.method === 'GET') {
    const html = renderMobilePage(req)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }

  if (url.pathname === '/api/info' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ pcName: shareState.pcName, receiveDir: shareState.receiveDir, shareDir: shareState.shareDir }))
    return
  }

  if (url.pathname === '/api/pc-files' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ files: listShareDir() }))
    return
  }

  if (url.pathname === '/api/download' && req.method === 'GET') {
    const rel = url.searchParams.get('p') || ''
    if (!shareState.shareDir) { res.writeHead(400); res.end('No shared folder'); return }
    let full
    try { full = safeJoin(shareState.shareDir, decodeURIComponent(rel)) }
    catch { res.writeHead(400); res.end('Invalid path'); return }
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) { res.writeHead(404); res.end('Not found'); return }
    const stat = fs.statSync(full)
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(path.basename(full))}"`
    })
    fs.createReadStream(full).pipe(res)
    broadcastShareEvent('file-downloaded', { name: path.basename(full), size: stat.size, path: rel })
    return
  }

  if (url.pathname === '/api/upload' && req.method === 'POST') {
    if (!shareState.receiveDir) { res.writeHead(400); res.end('No receive folder set'); return }
    const filename = decodeURIComponent(req.headers['x-filename'] || `file-${Date.now()}`)
    const safeName = filename.replace(/[\\/:*?"<>|]/g, '_').replace(/^\.+/, '')
    const dest = path.join(shareState.receiveDir, safeName)
    let finalPath = dest
    let n = 1
    const ext = path.extname(safeName)
    const base = path.basename(safeName, ext)
    while (fs.existsSync(finalPath)) {
      finalPath = path.join(shareState.receiveDir, `${base} (${n})${ext}`)
      n++
    }
    const out = fs.createWriteStream(finalPath)
    let size = 0
    req.on('data', chunk => { size += chunk.length })
    req.pipe(out)
    out.on('finish', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, name: path.basename(finalPath), size }))
      broadcastShareEvent('file-received', { name: path.basename(finalPath), size, path: finalPath })
    })
    out.on('error', err => {
      res.writeHead(500); res.end('Write failed')
      console.error('[share] upload write error:', err)
    })
    return
  }

  res.writeHead(404)
  res.end('Not found')
}

function startShareServer(port, receiveDir, shareDir) {
  if (shareServer) stopShareServer()
  shareState.port = port
  shareState.receiveDir = receiveDir
  shareState.shareDir = shareDir
  shareState.startedAt = Date.now()
  if (receiveDir) fs.mkdirSync(receiveDir, { recursive: true })

  return new Promise((resolve, reject) => {
    shareServer = http.createServer(handleShareRequest)
    shareServer.on('error', err => { shareServer = null; reject(err) })
    shareServer.listen(port, '0.0.0.0', () => {
      const addr = shareServer.address()
      shareState.port = addr.port
      resolve({ port: addr.port, ip: getLocalIp(), url: `http://${getLocalIp()}:${addr.port}` })
    })
  })
}

function stopShareServer() {
  if (shareServer) {
    try { shareServer.closeAllConnections?.() } catch {}
    try { shareServer.close() } catch {}
    shareServer = null
  }
}
// ---------- end Quick Share ----------

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
    const transportToken = parts.find(p => p.startsWith('transport:'))
    const transport = transportToken && transportToken.includes('udp') ? 'wifi' : 'usb'
    return {
      available: true,
      error: null,
      device: {
        id: parts[0],
        model: parts.find(p => p.startsWith('model:'))?.replace('model:', '') || 'Unknown',
        transport
      }
    }
  } catch (err) {
    console.error('[ADB] Error:', err)
    return { available: false, error: 'adb_error', device: null }
  }
})

ipcMain.handle('adb:tree', async (_, deviceId, includeAndroid = false) => {
  try {
    const seen = new Set()
    const dirs = []

    for (let depth = 1; ; depth++) {
      const dirsBeforeDepth = seen.size
      const stars = '/*'.repeat(depth)
      const { stdout } = await safeAdbShell(deviceId, `ls -d /sdcard${stars}/ 2>/dev/null`)
      for (const line of stdout.split('\n')) {
        const d = line.trim().replace(/\/$/, '')
        const isAndroidPath = d === '/sdcard/Android' || d.startsWith('/sdcard/Android/')
        if (d && d.startsWith('/sdcard') && d !== '/sdcard' && (includeAndroid || !isAndroidPath) && !seen.has(d)) {
          seen.add(d)
          dirs.push(d)
        }
      }
      if (seen.size === dirsBeforeDepth) break
    }

    dirs.sort()
    const tree = []
    const directoryNodes = new Map()
    for (const dir of dirs) {
      const parts = dir.replace('/sdcard/', '').split('/')
      let current = tree
      let node = null
      for (const part of parts) {
        node = current.find(n => n.name === part)
        if (!node) {
          node = { name: part, path: '', type: 'folder', children: [] }
          current.push(node)
        }
        current = node.children
      }
      node.path = dir
      directoryNodes.set(dir, node)
    }

    for (let start = 0; start < dirs.length; start += 40) {
      const batch = dirs.slice(start, start + 40)
      const command = batch.map(dir => (
        `printf '__PHONESYNC_DIR__%s\\n' "${dir}"; ls -l "${dir}" 2>/dev/null`
      )).join('; ')
      const { stdout } = await safeAdbShell(deviceId, command)
      let currentDir = null
      for (const rawLine of stdout.split('\n')) {
        const line = rawLine.trim()
        if (line.startsWith('__PHONESYNC_DIR__')) {
          currentDir = line.slice('__PHONESYNC_DIR__'.length)
          continue
        }
        if (!currentDir || !line.startsWith('-')) continue
        const parts = line.split(/\s+/)
        if (parts.length < 8) continue
        const name = parts.slice(7).join(' ')
        if (!name) continue
        directoryNodes.get(currentDir)?.children.push({
          name,
          path: `${currentDir}/${name}`,
          type: 'file',
          children: []
        })
      }
    }
    return tree
  } catch {
    return []
  }
})

ipcMain.handle('adb:scan', async (_, deviceId, folders) => {
  const allFiles = []
  for (const folder of folders) {
    const { stdout: entry } = await safeAdbShell(deviceId, `ls -ld "${folder}" 2>/dev/null`)
    if (entry.trim().startsWith('-')) {
      const parsed = parseLsRecursive(`${folder}:\n${entry}`)
      if (parsed[0]) {
        parsed[0].path = folder
        allFiles.push(parsed[0])
      }
      continue
    }
    const { stdout } = await safeAdbShell(deviceId, `ls -lR "${folder}" 2>/dev/null`)
    allFiles.push(...parseLsRecursive(stdout))
  }
  return [...new Map(allFiles.map(file => [file.path, file])).values()]
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

// ---------- ADB version check + WiFi ADB ----------
function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0
    const db = pb[i] || 0
    if (da !== db) return da - db
  }
  return 0
}

function runAdbSpawn(args, { timeoutMs = 30000, stdinData = null } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(adbPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })
    let stdout = ''
    let stderr = ''
    let stdinSent = false
    let settled = false

    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { child.kill('SIGKILL') } catch {}
      reject(new Error(`Timed out after ${timeoutMs / 1000}s`))
    }, timeoutMs)

    child.stdout.on('data', (data) => {
      const text = data.toString()
      stdout += text
      if (stdinData && !stdinSent && /pairing code|enter.*code|code:/i.test(text)) {
        try { child.stdin.write(stdinData + '\n') } catch {}
        stdinSent = true
      }
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('error', (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(err)
    })

    child.on('close', (exitCode) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode })
    })
  })
}

async function getAdbVersionRaw() {
  if (!adbPath) return null
  try {
    const { stdout } = await execPromise(`${adbPath} version`)
    const m = stdout.match(/Android Debug Bridge version\s+([\d.]+)/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

ipcMain.handle('adb:version', async () => {
  const version = await getAdbVersionRaw()
  if (!version) return { version: null, supportsWifi: false, supportsMdns: false }
  return {
    version,
    supportsWifi: compareVersions(version, '1.0.41') >= 0,
    supportsMdns: compareVersions(version, '1.0.41') >= 0
  }
})

ipcMain.handle('adb:redownload', async () => {
  return new Promise((resolve) => {
    const child = require('child_process').spawn('node', [path.join(__dirname, 'scripts', 'download-adb.js'), '--force'], { stdio: 'pipe' })
    let out = ''
    child.stdout.on('data', d => { out += d.toString() })
    child.stderr.on('data', d => { out += d.toString() })
    child.on('close', code => {
      adbPath = findAdb()
      resolve({ ok: code === 0, log: out, adbPath })
    })
    child.on('error', err => resolve({ ok: false, log: err.message, adbPath }))
  })
})

async function doAdbMdns() {
  if (!adbPath) return { ok: false, error: 'adb_not_found', devices: [] }
  try {
    const { stdout } = await runAdbSpawn(['mdns', 'services'], { timeoutMs: 10000 })
    const devices = []
    const seen = new Set()
    for (const line of stdout.split('\n')) {
      const m = line.match(/^\s*_adb-tls-connect\._tcp\s+(\S+):(\d+)\s*$/)
      if (m) {
        const ip = m[1]
        const port = parseInt(m[2])
        const key = `${ip}:${port}`
        if (!seen.has(key)) {
          seen.add(key)
          devices.push({ ip, port, id: key })
        }
      }
    }
    return { ok: true, devices }
  } catch (err) {
    const msg = err.message || ''
    if (/timed out/i.test(msg)) {
      return { ok: false, error: 'mDNS scan timed out. Make sure both devices are on the same WiFi.', devices: [] }
    }
    return { ok: false, error: msg, devices: [] }
  }
}

async function doAdbPair(ip, port, code) {
  if (!adbPath) return { ok: false, error: 'adb_not_found' }
  if (!ip || !port || !code) return { ok: false, error: 'Missing ip/port/code' }
  try {
    const { stdout, stderr, exitCode } = await runAdbSpawn(
      ['pair', `${ip}:${port}`, code],
      { timeoutMs: 30000, stdinData: code }
    )
    const out = (stdout + ' ' + stderr).trim()
    if (/Successfully paired/i.test(out)) {
      return { ok: true, message: out }
    }
    if (/already paired|already connected/i.test(out)) {
      return { ok: true, message: 'Already paired with this device.' }
    }
    return { ok: false, error: out || `Pairing failed (exit code ${exitCode})` }
  } catch (err) {
    const msg = (err.message || '').toString().trim()
    if (/timed out/i.test(msg)) {
      return {
        ok: false,
        error: 'Pairing timed out. The most common causes:\n• The "Pair device with code" dialog on your phone closed (it only stays open ~30s). Reopen it and try again.\n• A firewall on your PC is blocking the outgoing connection.\n• Your PC and phone are on different WiFi networks or VLANs.'
      }
    }
    return { ok: false, error: msg || 'Pairing failed' }
  }
}

async function doAdbConnect(ip, port) {
  if (!adbPath) return { ok: false, error: 'adb_not_found' }
  if (!ip || !port) return { ok: false, error: 'Missing ip/port' }
  const target = `${ip}:${port}`
  try {
    const { stdout, stderr } = await runAdbSpawn(['connect', target], { timeoutMs: 15000 })
    const out = (stdout + ' ' + stderr).trim()
    if (/connected to|already connected/i.test(out)) {
      const { stdout: devOut } = await runAdbSpawn(['devices', '-l'], { timeoutMs: 10000 })
      const lines = devOut.split('\n').slice(1).filter(l => l.includes(target) && l.includes('device') && !l.includes('offline'))
      const parts = lines[0]?.split(/\s+/) || []
      return {
        ok: true,
        device: {
          id: parts[0] || target,
          model: parts.find(p => p.startsWith('model:'))?.replace('model:', '') || 'Unknown',
          transport: 'wifi'
        }
      }
    }
    return { ok: false, error: out || 'Connect failed' }
  } catch (err) {
    const msg = (err.message || '').toString().trim()
    if (/timed out/i.test(msg)) {
      return {
        ok: false,
        error: 'Connect timed out. Make sure wireless debugging is enabled on the phone and the port is current (it changes on reboot).'
      }
    }
    return { ok: false, error: msg || 'Connect failed' }
  }
}

ipcMain.handle('adb:wifi:mdns', async () => doAdbMdns())

ipcMain.handle('adb:wifi:pair', async (_, ip, port, code) => doAdbPair(ip, port, code))

ipcMain.handle('adb:wifi:connect', async (_, ip, port) => doAdbConnect(ip, port))

ipcMain.handle('adb:wifi:disconnect', async (_, target) => {
  if (!adbPath) return { ok: false, error: 'adb_not_found' }
  try {
    const args = target ? ['disconnect', target] : ['disconnect']
    await runAdbSpawn(args, { timeoutMs: 10000 })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

async function doPairAndConnect(ip, pairPort, code) {
  const pairRes = await doAdbPair(ip, pairPort, code)
  if (!pairRes.ok) return pairRes
  const mdnsRes = await doAdbMdns()
  const match = mdnsRes.devices?.find(d => d.ip === ip)
  if (match) {
    return await doAdbConnect(match.ip, match.port)
  }
  return { ok: true, paired: true, message: 'Paired. Tap the device in the reconnect list to connect.', connectPort: null }
}

ipcMain.handle('adb:wifi:pairAndConnect', async (_, ip, pairPort, code) => doPairAndConnect(ip, pairPort, code))
// ---------- end ADB WiFi ----------

// ---------- Quick Share IPC handlers ----------
ipcMain.handle('share:start', async (_, opts) => {
  const { port = 0, receiveDir, shareDir } = opts || {}
  try {
    const info = await startShareServer(port, receiveDir, shareDir)
    return { ok: true, ...info, pcName: shareState.pcName }
  } catch (err) {
    return { ok: false, error: err.message }
  }
})

ipcMain.handle('share:stop', async () => {
  stopShareServer()
  return { ok: true }
})

ipcMain.handle('share:status', async () => {
  return {
    running: !!shareServer,
    port: shareState.port,
    ip: getLocalIp(),
    url: shareServer ? `http://${getLocalIp()}:${shareState.port}` : null,
    pcName: shareState.pcName,
    receiveDir: shareState.receiveDir,
    shareDir: shareState.shareDir
  }
})

ipcMain.handle('share:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('share:listPcFiles', async () => {
  return { files: listShareDir() }
})

ipcMain.handle('share:addFile', async (_, filePath) => {
  if (!shareState.shareDir) return { ok: false, error: 'No shared folder set' }
  if (!fs.existsSync(filePath)) return { ok: false, error: 'File not found' }
  const dest = path.join(shareState.shareDir, path.basename(filePath))
  let finalPath = dest
  let n = 1
  while (fs.existsSync(finalPath)) {
    const ext = path.extname(dest)
    const base = path.basename(dest, ext)
    finalPath = path.join(shareState.shareDir, `${base} (${n})${ext}`)
    n++
  }
  await fs.promises.copyFile(filePath, finalPath)
  return { ok: true, path: finalPath }
})

app.on('before-quit', () => stopShareServer())
// ---------- end Quick Share IPC ----------
