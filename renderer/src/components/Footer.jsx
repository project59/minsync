export function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-topline">
        <span>MinSync / local utility</span>
      </div>
      <div className="footer-main">
          <p className="footer-wordmark">MinSync</p>
        <nav className="footer-nav" aria-label="Footer navigation">
          <span className="eyebrow">Explore</span>
          <button onClick={() => onNavigate('/')} className="btn-secondary footer-link">Home</button>
          <button onClick={() => onNavigate('/backup')} className="btn-secondary footer-link">Backup</button>
          <button onClick={() => onNavigate('/quick-share')} className="btn-secondary footer-link">Quick Share</button>
        </nav>
        <nav className="footer-nav" aria-label="Information navigation">
          <span className="eyebrow">Information</span>
          <button onClick={() => onNavigate('/support')} className="btn-secondary footer-link">Support</button>
          <button onClick={() => onNavigate('/faq')} className="btn-secondary footer-link">FAQ</button>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 MinSync</span>
      </div>
    </footer>
  )
}
