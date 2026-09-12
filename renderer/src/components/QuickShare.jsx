import { useState, useEffect, useCallback } from 'react'
import {
  Wifi, WifiOff, QrCode, FolderOpen, Download, RefreshCw,
  Copy, Check, FileUp, FileDown
} from 'lucide-react'
import qrcode from '../qrcode.js'

export function QuickShare() {
  const [running, setRunning] = useState(false)
  const [receiveDir, setReceiveDir] = useState('')
  const [shareDir, setShareDir] = useState('')
  const [port, setPort] = useState(0)
  const [qrUrl, setQrUrl] = useState('')
  const [qrSvg, setQrSvg] = useState('')
  const [received, setReceived] = useState([])
  const [downloads, setDownloads] = useState([])
  const [pcFiles, setPcFiles] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  // function addLog(msg) {
  //   setLog(prev => [...prev.slice(-49), { time: new Date().toLocaleTimeString(), msg }])
  // }

  const refreshStatus = useCallback(async () => {
    const s = await window.api.share.status()
    setRunning(s.running)
    if (s.running) {
      setPort(s.port)
      setReceiveDir(s.receiveDir)
      setShareDir(s.shareDir)
      setQrUrl(s.url)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    const off = window.api.share.onEvent((evt) => {
      if (evt.type === 'file-received') {
        setReceived(prev => [{ ...evt.payload, ts: Date.now() }, ...prev])
        // addLog(`Received: ${evt.payload.name} (${humanSize(evt.payload.size)})`)
      } else if (evt.type === 'file-downloaded') {
        setDownloads(prev => [{ ...evt.payload, ts: Date.now() }, ...prev])
        // addLog(`Phone downloaded: ${evt.payload.name} (${humanSize(evt.payload.size)})`)
      }
    })
    return () => { if (off) off() }
  }, [refreshStatus])

  useEffect(() => {
    if (qrUrl) {
      try {
        const qr = qrcode(0, 'M')
        qr.addData(qrUrl)
        qr.make()
        setQrSvg(qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }))
      } catch (err) {
        console.error('QR build failed:', err)
        setQrSvg('')
      }
    } else {
      setQrSvg('')
    }
  }, [qrUrl])

  async function handlePickReceive() {
    const f = await window.api.share.pickFolder()
    if (f) {
      setReceiveDir(f)
      // addLog(`Receive folder: ${f}`)
    }
  }

  async function handlePickShare() {
    const f = await window.api.share.pickFolder()
    if (f) {
      setShareDir(f)
      // addLog(`Share folder: ${f}`)
      if (running) {
        const r = await window.api.share.start({ port, receiveDir, shareDir: f })
        if (r.ok) { setPort(r.port); setQrUrl(r.url); refreshPcFiles() }
      }
    }
  }

  async function refreshPcFiles() {
    const r = await window.api.share.listPcFiles()
    setPcFiles(r.files || [])
  }

  useEffect(() => {
    if (running && shareDir) refreshPcFiles()
  }, [running, shareDir])

  async function handleStart() {
    setError('')
    if (!receiveDir) { setError('Pick a receive folder first'); return }
    if (!shareDir) { setError('Pick a share folder first'); return }
    setBusy(true)
    const r = await window.api.share.start({ port, receiveDir, shareDir })
    setBusy(false)
    if (!r.ok) { setError(r.error || 'Failed to start'); return }
    setRunning(true)
    setPort(r.port)
    setQrUrl(r.url)
    // addLog(`Server started on ${r.url}`)
  }

  async function handleStop() {
    await window.api.share.stop()
    setRunning(false)
    setQrUrl('')
    // addLog('Server stopped')
    refreshStatus()
  }

  async function copyUrl() {
    if (!qrUrl) return
    try {
      await navigator.clipboard.writeText(qrUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { }
  }

  function humanSize(n) {
    if (n < 1024) return n + ' B'
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'
    if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB'
    return (n / 1073741824).toFixed(1) + ' GB'
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="card flex flex-col justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {running ? <Wifi className="w-5 h-5 text-action" /> : <WifiOff className="w-5 h-5 text-taupe-400" />}
              <h2 className="font-semibold text-taupe-700 dark:text-taupe-200">Quick Share</h2>
            </div>
            {running ? (
              <span className="flex items-center gap-2 text-xs text-action">
                <span className="w-2 h-2 bg-action rounded-full animate-pulse" /> Live on port {port}
              </span>
            ) : (
              <span className="text-xs text-taupe-400">Not running</span>
            )}
          </div>

          <p className="text-sm text-taupe-500 dark:text-taupe-400 mb-4">
            Start a wireless server on your PC. Scan the QR code with your phone's camera to open
            a web page for sending/receiving files — no app install needed, works on any phone with a browser on the same WiFi.
          </p>

          <div className="flex flex-col">
            <div className="flex flex-col gap-3">
              <label className="text-xs text-taupe-500 mb-1 block">Receive folder (phone → PC)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={receiveDir}
                  onChange={(e) => setReceiveDir(e.target.value)}
                  className="input-main"
                  placeholder="Where uploads from phone will land"
                />
                <button onClick={handlePickReceive} className="btn-secondary"><FolderOpen className="w-4 h-4" /></button>
              </div>
              <div>
                <label className="text-xs text-taupe-500 mb-1 block">Share folder (PC → phone)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareDir}
                    onChange={(e) => setShareDir(e.target.value)}
                    className="input-main"
                    placeholder="Files the phone can browse/download"
                  />
                  <button onClick={handlePickShare} className="btn-secondary"><FolderOpen className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-danger mb-3">{error}</div>}
          </div>
        </div>
        <div className="flex gap-3">
          {!running ? (
            <button onClick={handleStart} disabled={busy || !receiveDir || !shareDir} className="btn-action flex-1 flex items-center gap-2 justify-center">
              {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
              <Wifi className="w-4 h-4" /> Start sharing
            </button>
          ) : (
            <button onClick={handleStop} className="btn-danger flex-1 flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" /> Stop server
            </button>
          )}
        </div>
      </div>

      {running && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <QrCode className="w-5 h-5 text-taupe-500" />
            <h3 className="font-semibold text-taupe-700 dark:text-taupe-200">Scan with phone</h3>
          </div>
          <div className="flex flex-col items-center">
            {qrSvg ? (
              <div
                className="bg-white dark:bg-taupe-700 p-3 rounded-xl border border-taupe-200 dark:border-taupe-600 [&>svg]:block [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                style={{ width: 200, height: 200 }}
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-taupe-400 text-sm">
                Generating…
              </div>
            )}
            <div className="flex items-center gap-2 mt-3 w-full">
              <code className="flex-1 text-xs font-mono px-3 py-2 bg-taupe-100 dark:bg-taupe-800 text-taupe-600 dark:text-taupe-400 truncate rounded-lg">{qrUrl}</code>
              <button onClick={copyUrl} className="btn-secondary p-2" aria-label="Copy URL">
                {copied ? <Check className="w-4 h-4 text-action" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-taupe-400 mt-3 text-center">
              Make sure your phone is on the same WiFi as this PC.
            </p>
          </div>
        </div>
      )}

      {running && (
        <>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-taupe-500" />
                <h3 className="font-semibold text-taupe-700 dark:text-taupe-200">Files phone can download</h3>
              </div>
              <button onClick={refreshPcFiles} className="btn-secondary p-2"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {pcFiles.length === 0 ? (
              <p className="text-taupe-400 italic text-sm">Share folder is empty. Drop files above.</p>
            ) : (
              <ul className="divide-y divide-taupe-100 dark:divide-taupe-700 max-h-72 overflow-auto">
                {pcFiles.map(f => (
                  <li key={f.path} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate flex-1 font-mono text-taupe-700 dark:text-taupe-300">{f.path}</span>
                    <span className="text-taupe-400 text-xs ml-3 whitespace-nowrap">{humanSize(f.size)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <FileUp className="w-5 h-5 text-taupe-500" />
              <h3 className="font-semibold text-taupe-700 dark:text-taupe-200">Received from phone</h3>
            </div>
            {received.length === 0 ? (
              <p className="text-taupe-400 italic text-sm">No files received yet.</p>
            ) : (
              <ul className="divide-y divide-taupe-100 dark:divide-taupe-700 max-h-72 overflow-auto">
                {received.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate flex-1 font-mono text-taupe-700 dark:text-taupe-300">{r.name}</span>
                    <span className="text-taupe-400 text-xs ml-3 whitespace-nowrap">{humanSize(r.size)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {running && downloads.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Download className="w-5 h-5 text-taupe-500" />
            <h3 className="font-semibold text-taupe-700 dark:text-taupe-200">Recent phone downloads</h3>
          </div>
          <ul className="divide-y divide-taupe-100 dark:divide-taupe-700">
            {downloads.slice(0, 10).map((d, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate flex-1 font-mono text-taupe-700 dark:text-taupe-300">{d.name}</span>
                <span className="text-taupe-400 text-xs ml-3">{humanSize(d.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
