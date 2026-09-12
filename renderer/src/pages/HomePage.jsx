import { ArrowUpRight, Check, Smartphone } from 'lucide-react'

export function HomePage({ onNavigate, deviceStatus }) {
  return (
    <main>
      <section className="flex flex-col items-center text-center py-12">
        <h1 className="text-4xl tracking-tighter font-medium max-w-3xl text-taupe-900 sm:text-6xl dark:text-taupe-50">A simpler way to manage your Android files</h1>
        <p className="page-lede font-mono">Back up your Android phone and share files over your own network. No accounts, internet, or complex setup needed.</p>
        <div className="flex flex-wrap items-center gap-3 mt-7">
          <button className="btn-primary flex items-center gap-2" onClick={() => onNavigate('/backup')}>
            Open backup <ArrowUpRight className="w-4 h-4" />
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('/quick-share')}>Try Quick Share</button>
        </div>
        <p className="micro-copy mt-4">{deviceStatus === 'connected' ? 'Your phone is connected and ready.' : 'Connect a phone when you are ready to begin.'}</p>
      </section>

      <section className="features-section">
        <div className="section-marker">01. Features</div>
        <div className="feature-stack">
          <article className="feature-panel feature-panel-sage">
            <div className="feature-placeholder feature-placeholder-sage h-96 relative" role="img" aria-label="Quick backup image placeholder">
              <img src="/image-1.png" alt="Quick backup" className="rounded-md w-96" />
            </div>
            <div className="flex flex-col">
              <p className="eyebrow">1.1 / quick backup</p>
              <h3 className="mt-3 max-w-md text-3xl font-medium leading-tight tracking-[-0.04em] text-taupe-900 dark:text-taupe-50">Only copy what is actually new.</h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-taupe-700 dark:text-taupe-200">MinSync checks the files already in your destination and skips them automatically, so every backup is faster and easier to trust.</p>
            </div>
          </article>

          <article className="feature-panel feature-panel-peach">
            <div className="feature-placeholder feature-placeholder-peach h-96" role="img" aria-label="File control image placeholder">
                            <img src="/image-2.png" alt="Quick backup" className="rounded-md w-96" />

            </div>
            <div className="flex flex-col">
              <p className="eyebrow">1.2 / file control</p>
              <h3 className="mt-3 max-w-md text-3xl font-medium leading-tight tracking-[-0.04em] text-taupe-900 dark:text-taupe-50">Your folders, your rules.</h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-taupe-700 dark:text-taupe-200">
                Choose exactly where files land, then reorganize the local copy however you like. The next backup still knows what has already been saved.
              </p>
            </div>
          </article>

          <article className="feature-panel feature-panel-lavender">
            <div className="feature-placeholder feature-placeholder-lavender h-96" role="img" aria-label="Quick Share image placeholder">
              <div className="placeholder-qr"><span /><span /><span /><span /><span /><span /></div>
              <div className="placeholder-phone" />
            </div>
            <div className="flex flex-col">
              <p className="eyebrow">1.3 / quick share</p>
              <h3 className="mt-3 max-w-md text-3xl font-medium leading-tight tracking-[-0.04em] text-taupe-900 dark:text-taupe-50">A private link between your devices.</h3>
              <p className="mt-4 max-w-md text-sm leading-6 text-taupe-700 dark:text-taupe-200">Start a local sharing page, scan its QR code, and send files through your browser without uploading them to a third-party service.</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
