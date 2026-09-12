import { ChevronDown, Coffee, Heart } from 'lucide-react'

export function SupportPage() {
  return (
    <main className="info-page">
      <h1>Support MinSync</h1>
      <p className="page-lede">MinSync is free to use. If it helps you move files more easily, you can support its continued development.</p>
      <div className="pricing-grid">
        <article className="price-card"><span className="eyebrow">Free / now</span><h2>$0</h2><p>Everything needed for local backup and Quick Share.</p><button className="btn-secondary w-fit">Current plan</button></article>
        <article className="price-card"><span className="eyebrow">Support / optional</span><h2>Donate</h2><p>Help keep MinSync free and support future improvements.</p>
          <div className="flex gap-2">
            <a className="btn-primary flex items-center gap-2" href="https://buymeacoffee.com/project59" target="_blank" rel="noreferrer">Buy me a coffee <Coffee className="w-4 h-4" /></a>
            <a className="btn-primary flex items-center gap-2" href="https://github.com/sponsors/project59" target="_blank" rel="noreferrer">GitHub <Heart className="w-4 h-4" /></a>
          </div>
        </article>
      </div>
    </main>
  )
}

const FAQS = [
  ['What is the best way to use the backup tool?', 'I recommend creating a dedicated folder on your PC for your backups, then selecting the folders on your phone that you want to back up. MinSync will only copy new or changed files, so you can run the backup as often as you like without worrying about duplicates.'],
  ['Can I rearrange files in my backup folder?', 'Yes. MinSync detects files that have already been copied, so you can move them around in your sync folder without affecting future backups - as long as they are within the same sync folder.'],
  ['Where do my files go?', 'Backups are written to the destination folder you choose. Quick Share uses folders on this computer that you explicitly select.'],
  ['Does MinSync use the cloud?', 'No. The current app connects directly to your phone over USB or your local WiFi network.'],
  ['Can I use wireless backup?', 'Yes. Open Backup, choose Connect WiFi, and follow the Android wireless debugging steps.'],
  ['What is coming next?', 'Scheduled backups, richer history, and more device controls are planned.']
]

export function FAQPage() {
  return (
    <main className="info-page">
      <h1>Frequently Asked Questions</h1>
      <p className="page-lede">A few notes for getting started. For development-related questions, please create an issue in the GitHub <a href="https://github.com/project59/minsync/issues" target="_blank" rel="noreferrer" className="text-primary hover:underline">repository</a>.</p>
      <div className="faq-list">
        {FAQS.map(([question, answer]) => (
          <details key={question} className="faq-item">
            <summary>{question}<ChevronDown className="w-4 h-4" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </main>
  )
}
