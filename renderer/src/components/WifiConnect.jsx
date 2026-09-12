import { useState, useEffect } from 'react'
import {
  Dialog, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels
} from '@headlessui/react'
import {
  X, Wifi, RefreshCw, Link2, Search, AlertTriangle, ArrowRight,
  CheckCircle2, Smartphone, Trash2
} from 'lucide-react'

export function WifiConnect({ onClose, onConnected, db }) {
  const [version, setVersion] = useState(null)
  const [redownloading, setRedownloading] = useState(false)
  const [redownloadLog, setRedownloadLog] = useState('')

  const [pairIp, setPairIp] = useState('')
  const [pairPort, setPairPort] = useState('')
  const [pairCode, setPairCode] = useState('')
  const [pairBusy, setPairBusy] = useState(false)
  const [pairMsg, setPairMsg] = useState(null)

  const [mdnsDevices, setMdnsDevices] = useState([])
  const [mdnsScanning, setMdnsScanning] = useState(false)
  const [manualIp, setManualIp] = useState('')
  const [manualPort, setManualPort] = useState('')
  const [connectBusyId, setConnectBusyId] = useState(null)
  const [connectMsg, setConnectMsg] = useState(null)
  const [lastDevice, setLastDevice] = useState(null)

  useEffect(() => {
    window.api.adbVersion().then(setVersion)
    refreshMdns()
    if (db?.db) {
      db.getConfig('wifi_last_device').then(d => { if (d) setLastDevice(d) })
    }
  }, [])

  async function refreshMdns() {
    setMdnsScanning(true)
    const r = await window.api.wifi.mdns()
    setMdnsScanning(false)
    if (r.ok) setMdnsDevices(r.devices)
    else setMdnsDevices([])
  }

  async function handleRedownload() {
    setRedownloading(true)
    setRedownloadLog('')
    const r = await window.api.redownloadAdb()
    setRedownloading(false)
    setRedownloadLog(r.log || '')
    if (r.ok) {
      const v = await window.api.adbVersion()
      setVersion(v)
    }
  }

  async function handlePairAndConnect(e) {
    e?.preventDefault()
    setPairMsg(null)
    if (!pairIp || !pairPort || !pairCode) {
      setPairMsg({ ok: false, text: 'Fill in IP, pair port, and code' })
      return
    }
    setPairBusy(true)
    const r = await window.api.wifi.pairAndConnect(pairIp, pairPort, pairCode)
    setPairBusy(false)
    if (r.ok && r.device) {
      setPairMsg({ ok: true, text: `Connected to ${r.device.model}` })
      if (db?.db) {
        const entry = { ip: pairIp, model: r.device.model, ts: Date.now() }
        await db.setConfig('wifi_last_device', entry)
      }
      onConnected?.(r.device)
      setTimeout(onClose, 800)
    } else if (r.ok && r.paired) {
      if (db?.db) {
        const entry = { ip: pairIp, model: 'Device', ts: Date.now() }
        await db.setConfig('wifi_last_device', entry)
        setLastDevice(entry)
      }
      setPairMsg({ ok: true, text: 'Paired. Now open the Reconnect tab and tap your device.' })
      await refreshMdns()
    } else {
      setPairMsg({ ok: false, text: r.error || 'Pairing failed' })
    }
  }

  async function handleConnect(ip, port, id) {
    setConnectMsg(null)
    setConnectBusyId(id || `${ip}:${port}`)
    const r = await window.api.wifi.connect(ip, port)
    setConnectBusyId(null)
    if (r.ok) {
      if (db?.db) {
        await db.setConfig('wifi_last_device', { ip, model: r.device.model, ts: Date.now() })
      }
      onConnected?.(r.device)
      onClose?.()
    } else {
      setConnectMsg({ ok: false, text: r.error || 'Connect failed' })
    }
  }

  async function handleConnectByIp(targetIp, id) {
    setConnectMsg(null)
    setConnectBusyId(id)
    setMdnsScanning(true)
    const r = await window.api.wifi.mdns()
    setMdnsScanning(false)
    if (!r.ok) {
      setConnectBusyId(null)
      setConnectMsg({ ok: false, text: 'Could not scan for devices. Make sure wireless debugging is enabled.' })
      return
    }
    setMdnsDevices(r.devices)
    const match = r.devices.find(d => d.ip === targetIp)
    setConnectBusyId(null)
    if (!match) {
      setConnectMsg({ ok: false, text: `Phone at ${targetIp} not found. Make sure wireless debugging is on and it's on this WiFi. Pick it from the discovered list below if it appears.` })
      return
    }
    await handleConnect(match.ip, match.port, id)
  }

  async function handleDeleteLastDevice() {
    if (db?.db) await db.deleteConfig('wifi_last_device')
    setLastDevice(null)
  }

  const supportsWifi = version?.supportsWifi

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white dark:bg-taupe-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-xl border border-taupe-200 dark:border-taupe-700">
          <div className="flex items-center justify-between p-4 border-b border-taupe-200 dark:border-taupe-700">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-action" />
              <DialogTitle className="font-semibold text-taupe-700 dark:text-taupe-200">Connect via WiFi</DialogTitle>
            </div>
            <button onClick={onClose} className="btn-secondary p-1.5" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4">
            {!version && (
              <div className="flex items-center justify-center py-8 text-sm text-taupe-400">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Checking ADB version…
              </div>
            )}

            {version && !version.version && (
              <div className="bg-taupe-100 dark:bg-taupe-700/50 rounded-xl p-4 mb-4 border border-taupe-200 dark:border-taupe-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-taupe-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-taupe-700 dark:text-taupe-200 mb-1">ADB not available</p>
                    <p className="text-taupe-600 dark:text-taupe-400 mb-2">
                      MinSync needs ADB to connect to your phone. Try updating it below.
                    </p>
                    <button onClick={handleRedownload} disabled={redownloading} className="btn-action py-1.5 px-3 text-xs flex items-center gap-2">
                      {redownloading && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {redownloading ? 'Downloading…' : 'Download ADB'}
                    </button>
                    {redownloadLog && (
                      <pre className="mt-2 text-xs font-mono whitespace-pre-wrap text-taupe-600 dark:text-taupe-400 max-h-24 overflow-auto">{redownloadLog}</pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {version && version.version && !supportsWifi && (
              <div className="bg-taupe-100 dark:bg-taupe-700/50 rounded-xl p-4 mb-4 border border-taupe-200 dark:border-taupe-700">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-taupe-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-taupe-700 dark:text-taupe-200 mb-1">
                      ADB {version.version} is too old for wireless debugging
                    </p>
                    <p className="text-taupe-600 dark:text-taupe-400 mb-2">
                      Needs ADB 1.0.41+ for <code className="font-mono">adb pair</code> and <code className="font-mono">adb mdns</code>.
                    </p>
                    <button onClick={handleRedownload} disabled={redownloading} className="btn-action py-1.5 px-3 text-xs flex items-center gap-2">
                      {redownloading && <RefreshCw className="w-3 h-3 animate-spin" />}
                      {redownloading ? 'Updating…' : 'Update bundled ADB'}
                    </button>
                    {redownloadLog && (
                      <pre className="mt-2 text-xs font-mono whitespace-pre-wrap text-taupe-600 dark:text-taupe-400 max-h-24 overflow-auto">{redownloadLog}</pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {version && supportsWifi && (
              <TabGroup>
                <TabList className="flex gap-2 mb-4">
                  <Tab className="flex-1 py-2 text-sm font-medium cursor-pointer rounded-lg transition-all duration-150 data-[selected]:bg-white dark:data-[selected]:bg-taupe-700 data-[selected]:shadow-sm data-[selected]:text-taupe-800 dark:data-[selected]:text-taupe-200 text-taupe-500 dark:text-taupe-400 hover:text-taupe-700 dark:hover:text-taupe-300 border border-taupe-200 dark:border-taupe-700 data-[selected]:border-transparent flex items-center justify-center gap-2">
                    <Link2 className="w-4 h-4" /> Pair new
                  </Tab>
                  <Tab className="flex-1 py-2 text-sm font-medium cursor-pointer rounded-lg transition-all duration-150 data-[selected]:bg-white dark:data-[selected]:bg-taupe-700 data-[selected]:shadow-sm data-[selected]:text-taupe-800 dark:data-[selected]:text-taupe-200 text-taupe-500 dark:text-taupe-400 hover:text-taupe-700 dark:hover:text-taupe-300 border border-taupe-200 dark:border-taupe-700 data-[selected]:border-transparent flex items-center justify-center gap-2">
                    <Search className="w-4 h-4" /> Reconnect
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <div className="text-xs text-taupe-500 dark:text-taupe-400 mb-3 space-y-1">
                      <p className="font-medium text-taupe-700 dark:text-taupe-200">On your phone (Android 11+):</p>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>Settings → System → Developer options → <strong>Wireless debugging</strong></li>
                        <li>Tap <strong>Pair device with code</strong></li>
                        <li>Note the <strong>IP address</strong>, <strong>pair port</strong>, and 6-digit <strong>code</strong></li>
                      </ol>
                    </div>

                    <form onSubmit={handlePairAndConnect} className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-xs text-taupe-500 block mb-1">Phone IP</label>
                          <input
                            value={pairIp}
                            onChange={e => setPairIp(e.target.value)}
                            placeholder="192.168.1.50"
                            className="input-main"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-xs text-taupe-500 block mb-1">Pair port</label>
                          <input
                            value={pairPort}
                            onChange={e => setPairPort(e.target.value)}
                            placeholder="37553"
                            className="input-main"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-taupe-500 block mb-1">6-digit pairing code</label>
                        <input
                          value={pairCode}
                          onChange={e => setPairCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          inputMode="numeric"
                          className="input-main tracking-widest"
                        />
                      </div>

                      {pairMsg && (
                        <div className={`text-xs p-3 rounded-xl whitespace-pre-line ${
                          pairMsg.ok
                            ? 'bg-action/10 text-action'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {pairMsg.ok && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
                          {pairMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={pairBusy}
                        className="btn-action w-full py-2.5 flex items-center justify-center gap-2"
                      >
                        {pairBusy && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {pairBusy ? 'Pairing…' : 'Pair & connect'}
                      </button>
                      <p className="text-xs text-taupe-400 text-center">
                        Pairing is one-time. Future sessions just need a tap in the Reconnect tab.
                      </p>
                    </form>
                  </TabPanel>
                  <TabPanel>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-taupe-500 dark:text-taupe-400">
                        Discovered devices on your WiFi
                      </p>
                      <button onClick={refreshMdns} disabled={mdnsScanning} className="btn-secondary p-1.5">
                        <RefreshCw className={`w-3.5 h-3.5 ${mdnsScanning ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {lastDevice && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-taupe-400">Last used</p>
                          <button
                            onClick={handleDeleteLastDevice}
                            className="btn-danger p-1.5"
                            aria-label={`Forget ${lastDevice.model || 'last used device'}`}
                            title="Forget this device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleConnectByIp(lastDevice.ip, `last-${lastDevice.ip}`)}
                          disabled={connectBusyId === `last-${lastDevice.ip}`}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-taupe-100 dark:bg-taupe-700/50 border border-taupe-200 dark:border-taupe-700 hover:border-action/50 text-left transition-colors duration-150"
                        >
                          <span className="flex items-center gap-2 text-sm">
                            <Smartphone className="w-4 h-4 text-taupe-400" />
                            <span className="font-mono text-taupe-700 dark:text-taupe-200">{lastDevice.model || 'Device'}</span>
                            <span className="text-taupe-400 text-xs">{lastDevice.ip}</span>
                          </span>
                          {connectBusyId === `last-${lastDevice.ip}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 text-taupe-400" />}
                        </button>
                        <p className="text-xs text-taupe-400 mt-1">Scans for this phone's current port and reconnects.</p>
                      </div>
                    )}

                    {mdnsDevices.length === 0 && !mdnsScanning ? (
                      <div className="text-center py-6 text-sm text-taupe-400">
                        No devices found. Make sure wireless debugging is enabled on the phone and both devices are on the same WiFi.
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {mdnsDevices.map(d => (
                          <li key={d.id}>
                            <button
                              onClick={() => handleConnect(d.ip, d.port, d.id)}
                              disabled={connectBusyId === d.id}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-taupe-100 dark:bg-taupe-700/50 border border-taupe-200 dark:border-taupe-700 hover:border-action/50 text-left transition-colors duration-150"
                            >
                              <span className="flex items-center gap-2 text-sm font-mono text-taupe-700 dark:text-taupe-200">
                                <Smartphone className="w-4 h-4 text-taupe-400" />
                                {d.ip}:{d.port}
                              </span>
                              {connectBusyId === d.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 text-taupe-400" />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {connectMsg && (
                      <div className="text-xs p-3 rounded-xl mt-3 whitespace-pre-line bg-danger/10 text-danger">
                        {connectMsg.text}
                      </div>
                    )}

                    <details className="mt-4">
                      <summary className="text-xs text-taupe-500 cursor-pointer hover:text-taupe-700 dark:hover:text-taupe-300">Connect manually instead</summary>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={manualIp}
                          onChange={e => setManualIp(e.target.value)}
                          placeholder="192.168.1.50"
                          className="input-main flex-1"
                        />
                        <input
                          value={manualPort}
                          onChange={e => setManualPort(e.target.value)}
                          placeholder="43525"
                          className="input-main w-24"
                        />
                        <button
                          onClick={() => handleConnect(manualIp, manualPort, `manual-${manualIp}:${manualPort}`)}
                          disabled={connectBusyId === `manual-${manualIp}:${manualPort}` || !manualIp || !manualPort}
                          className="btn-secondary whitespace-nowrap"
                        >
                          {connectBusyId === `manual-${manualIp}:${manualPort}` ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Connect'}
                        </button>
                      </div>
                    </details>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
