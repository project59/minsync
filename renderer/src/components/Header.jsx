import { Sun, Moon, History, Smartphone } from 'lucide-react'

export function Header({ darkMode, setDarkMode, device, deviceStatus, tab,
  route, onNavigate, historyCount, onHistoryOpen }) {
  return (
    <header className="site-header">
      <button className="brand-mark" onClick={() => onNavigate('/')} aria-label="Go to MinSync home">
        <span className="brand-symbol"><Smartphone className="w-4 h-4" /></span>
        <span>MinSync</span>
      </button>
      <nav className="site-nav" aria-label="Primary navigation">
        {[
          ['/', 'Home'],
          ['/backup', 'Backup'],
          ['/quick-share', 'Quick Share'],
          ['/support', 'Support'],
          ['/faq', 'FAQ']
        ].map(([path, label]) => (
          <button key={path} onClick={() => onNavigate(path)} className={route === path ? ' nav-link active' : ' nav-link'}>
            {label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button onClick={onHistoryOpen} className="btn-secondary header-icon-button" aria-label="Open sync history" title="Sync history">
          <span className="hidden sm:inline">History</span>
          <span className="text-xs font-mono">{historyCount}</span>
          <History className="w-4 h-4" />
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="btn-secondary header-icon-button" aria-label="Toggle theme">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
