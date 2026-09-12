const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PLATFORM = process.platform
const BIN_DIR = path.join(__dirname, '..', 'bin')
const ADB_NAME = PLATFORM === 'win32' ? 'adb.exe' : 'adb'
const ADB_PATH = path.join(BIN_DIR, ADB_NAME)
const BUNDLED_FILES = PLATFORM === 'win32'
  ? ['adb.exe', 'AdbWinApi.dll', 'AdbWinUsbApi.dll']
  : ['adb']

const URLS = {
  linux: 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip',
  darwin: 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip',
  win32: 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip'
}

function download(url, dest) {
  console.log(`Downloading ADB from ${url}...`)
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(resolve))
      file.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  const force = process.argv.includes('--force')
  fs.mkdirSync(BIN_DIR, { recursive: true })

  const hasBundledFiles = BUNDLED_FILES.every(fileName => fs.existsSync(path.join(BIN_DIR, fileName)))
  if (hasBundledFiles && !force) {
    console.log(`ADB already at ${ADB_PATH}`)
    return
  }
  if (force || !hasBundledFiles) {
    console.log(`Re-downloading ADB (forced)...`)
    for (const fileName of BUNDLED_FILES) {
      try { fs.unlinkSync(path.join(BIN_DIR, fileName)) } catch {}
    }
  }

  const url = URLS[PLATFORM]
  if (!url) {
    console.error(`Unsupported: ${PLATFORM}. Install platform-tools manually.`)
    process.exit(1)
  }

  const zipPath = path.join(BIN_DIR, 'platform-tools.zip')

  try {
    await download(url, zipPath)

    if (PLATFORM === 'win32') {
      execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${BIN_DIR}' -Force"`, { stdio: 'pipe' })
    } else {
      execSync(`unzip -o "${zipPath}" -d "${BIN_DIR}" 2>/dev/null || (cd "${BIN_DIR}" && jar xf "${zipPath}")`, { stdio: 'pipe' })
    }

    const extractedDir = path.join(BIN_DIR, 'platform-tools')
    for (const fileName of BUNDLED_FILES) {
      const extractedPath = path.join(extractedDir, fileName)
      const bundledPath = path.join(BIN_DIR, fileName)
      if (!fs.existsSync(extractedPath)) {
        throw new Error(`Missing ${fileName} in downloaded platform-tools archive`)
      }
      fs.renameSync(extractedPath, bundledPath)
      if (fileName === ADB_NAME) fs.chmodSync(bundledPath, 0o755)
    }
    fs.rmSync(path.join(BIN_DIR, 'platform-tools'), { recursive: true, force: true })
    fs.unlinkSync(zipPath)
    console.log(`ADB ready at ${ADB_PATH}`)
  } catch (err) {
    console.error(`ADB download failed: ${err.message}`)
    console.log('Install manually: https://developer.android.com/studio/releases/platform-tools')
    process.exit(1)
  }
}

main()
