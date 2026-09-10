import { Sun, Moon, PlugZap, RefreshCw, History, Smartphone } from 'lucide-react'

export function Header({ darkMode, setDarkMode, device, deviceStatus, tab,
  route, onNavigate, wifiDisconnecting, isSyncing, historyCount, onHistoryOpen, onWifiConnect, onWifiDisconnect }) {
  return (
    <header className="site-header">
      <button className="brand-mark" onClick={() => onNavigate('/')} aria-label="Go to PhoneSync home">
        <span className="brand-symbol"><Smartphone className="w-4 h-4" /></span>
        <span>PhoneSync</span>
      </button>
      <nav className="site-nav" aria-label="Primary navigation">
        {[
          ['/', 'Home'],
          ['/backup', 'Backup'],
          ['/quick-share', 'Quick Share'],
          ['/pricing', 'Pricing'],
          ['/faq', 'FAQ']
        ].map(([path, label]) => (
          <button key={path} onClick={() => onNavigate(path)} className={route === path ? ' nav-link active' : ' nav-link'}>
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <div className="hidden lg:flex items-center gap-2">
          {tab === 'backup' && deviceStatus === 'connected' && device && (
            <div className="device-pill">
              <span className="status-dot" />
              <span>{device.model}</span>
              <span className="uppercase">{device.transport || 'usb'}</span>
            </div>
          )}
          {tab === 'backup' && deviceStatus !== 'connected' && (
            <button onClick={onWifiConnect} className="btn-secondary">
              <PlugZap className="w-4 h-4" /> Connect WiFi
            </button>
          )}
          {tab === 'backup' && deviceStatus === 'connected' && device?.transport === 'wifi' && (
            <button onClick={onWifiDisconnect} disabled={wifiDisconnecting || isSyncing} className="btn-danger py-1 px-2 text-xs">
              {wifiDisconnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Disconnect'}
            </button>
          )}
        </div>
        <button onClick={onHistoryOpen} className="btn-secondary header-icon-button" aria-label="Open sync history" title="Sync history">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
          <span className="text-xs font-mono">{historyCount}</span>
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="btn-secondary header-icon-button" aria-label="Toggle theme">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
