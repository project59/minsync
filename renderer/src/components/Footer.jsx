export function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-topline">
        <span>PhoneSync / local utility</span>
        <span>Built for the files you keep</span>
      </div>
      <div className="footer-main">
        <div>
          <p className="footer-wordmark">Phone<span>Sync</span></p>
          <p className="footer-note">A quiet bridge between your phone and your computer.</p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          <span className="eyebrow">Explore</span>
          <button onClick={() => onNavigate('/')} className="btn-secondary footer-link">Home</button>
          <button onClick={() => onNavigate('/backup')} className="btn-secondary footer-link">Backup</button>
          <button onClick={() => onNavigate('/quick-share')} className="btn-secondary footer-link">Quick Share</button>
        </nav>
        <nav className="footer-nav" aria-label="Information navigation">
          <span className="eyebrow">Information</span>
          <button onClick={() => onNavigate('/pricing')} className="btn-secondary footer-link">Pricing</button>
          <button onClick={() => onNavigate('/faq')} className="btn-secondary footer-link">FAQ</button>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© 2026 PhoneSync</span>
      </div>
    </footer>
  )
}
