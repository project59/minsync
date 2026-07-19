import { Sun, Moon, PlugZap, RefreshCw } from 'lucide-react'

export function Header({ darkMode, setDarkMode, device, deviceStatus, tab,
  wifiDisconnecting, isSyncing, onWifiConnect, onWifiDisconnect }) {
  return (
    <header className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 flex-wrap px-1 mt-1">
        <h1 className="text-xl font-semibold text-taupe-700 dark:text-taupe-300">
          Minsync Android
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {tab === 'backup' && deviceStatus !== 'connected' && (
          <button onClick={onWifiConnect} className="btn-secondary">
            <PlugZap className="w-4 h-4" /> Connect WiFi
          </button>
        )}
        {tab === 'backup' && deviceStatus === 'connected' && device && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-taupe-600 dark:text-taupe-400">{device.model}</span>
            <span className="text-xs px-1.5 py-0.5 font-mono uppercase bg-taupe-200 dark:bg-taupe-700 text-taupe-700 dark:text-taupe-300 rounded-full">
              {device.transport || 'usb'}
            </span>
            {device.transport === 'wifi' && (
              <button
                onClick={onWifiDisconnect}
                disabled={wifiDisconnecting || isSyncing}
                className="btn-danger py-1 px-2 text-xs"
                title="Disconnect WiFi ADB (recommended after backup)"
              >
                {wifiDisconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Disconnect'}
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-secondary w-8 h-8 flex items-center justify-center"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
