import { ArrowUpRight, Check, Smartphone } from 'lucide-react'

export function HomePage({ onNavigate, deviceStatus }) {
  return (
    <main>
      <section className="hero-grid">
        <div className="hero-copy">
          <h1>A calmer way to move the things that matter.</h1>
          <p className="page-lede">Back up your Android phone and share files over your own network. No accounts, no cloud detours, no mystery.</p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <button className="btn-primary flex items-center gap-2" onClick={() => onNavigate('/backup')}>
              Open backup <ArrowUpRight className="w-4 h-4" />
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('/quick-share')}>Try Quick Share</button>
          </div>
          <p className="micro-copy mt-4">{deviceStatus === 'connected' ? 'Your phone is connected and ready.' : 'Connect a phone when you are ready to begin.'}</p>
        </div>
        <div className="hero-card">
          <div className="hero-card-top"><span>PhoneSync / 01</span><span>Local first</span></div>
          <div className="hero-orbit"><Smartphone className="w-8 h-8" /></div>
          <p className="text-lg font-medium mt-5">A small, focused toolkit for your phone.</p>
          <div className="hero-card-list">
            <span><Check className="w-4 h-4" /> Copy only what is new</span>
            <span><Check className="w-4 h-4" /> Share from any browser</span>
            <span><Check className="w-4 h-4" /> Keep control of your files</span>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-marker">Features <span>03 / 03</span></div>
        <div className="features-intro">
          <h2>The small details make the difference.</h2>
          <p>Designed to make moving files feel predictable, visible, and easy to undo.</p>
        </div>
        <div className="feature-stack">
          <article className="feature-panel feature-panel-sage">
            <div className="feature-placeholder feature-placeholder-sage h-96" role="img" aria-label="Quick backup image placeholder">
              <div className="placeholder-window">
                <div className="placeholder-toolbar"><span /><span /><span /></div>
                <div className="placeholder-lines"><i /><i /><i /><i /></div>
                <div className="placeholder-check">✓</div>
              </div>
              <span className="placeholder-label">image / quick backup</span>
            </div>
            <div className="feature-panel-copy">
              <p className="eyebrow">01 / quick backup</p>
              <h3>Only copy what is actually new.</h3>
              <p>PhoneSync checks the files already in your destination and skips them automatically, so every backup is faster and easier to trust.</p>
            </div>
          </article>

          <article className="feature-panel feature-panel-peach">
            <div className="feature-placeholder feature-placeholder-peach h-96" role="img" aria-label="File control image placeholder">
              <div className="placeholder-tree"><span /><span /><span /><span /></div>
              <div className="placeholder-folder">↗</div>
              <span className="placeholder-label">image / file control</span>
            </div>
            <div className="feature-panel-copy">
              <p className="eyebrow">02 / file control</p>
              <h3>Your folders, your rules.</h3>
              <p>Choose exactly where files land, then reorganize the local copy however you like. The next backup still knows what has already been saved.</p>
            </div>
          </article>

          <article className="feature-panel feature-panel-lavender">
            <div className="feature-placeholder feature-placeholder-lavender h-96" role="img" aria-label="Quick Share image placeholder">
              <div className="placeholder-qr"><span /><span /><span /><span /><span /><span /></div>
              <div className="placeholder-phone" />
              <span className="placeholder-label">image / quick share</span>
            </div>
            <div className="feature-panel-copy">
              <p className="eyebrow">03 / quick share</p>
              <h3>A private link between your devices.</h3>
              <p>Start a local sharing page, scan its QR code, and send files through your browser without uploading them to a third-party service.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
