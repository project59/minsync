import { ChevronDown } from 'lucide-react'

export function PricingPage() {
  return (
    <main className="info-page">
      <p className="eyebrow">04 / pricing</p>
      <h1>Simple tools. No surprise plans.</h1>
      <p className="page-lede">PhoneSync is currently free to use. These placeholder plans show where future capabilities may land.</p>
      <div className="pricing-grid">
        <article className="price-card"><span className="eyebrow">Free / now</span><h2>$0</h2><p>Everything needed for local backup and Quick Share.</p><button className="btn-primary w-full">Current plan</button></article>
        <article className="price-card featured-price"><span className="eyebrow">Plus / soon</span><h2>$6 <small>/ month</small></h2><p>Automations, scheduled backups, and richer device history.</p><button className="btn-secondary w-full">Coming soon</button></article>
      </div>
    </main>
  )
}

const FAQS = [
  ['Where do my files go?', 'Backups are written to the destination folder you choose. Quick Share uses folders on this computer that you explicitly select.'],
  ['Does PhoneSync use the cloud?', 'No. The current app connects directly to your phone over USB or your local WiFi network.'],
  ['Can I use wireless backup?', 'Yes. Open Backup, choose Connect WiFi, and follow the Android wireless debugging steps.'],
  ['What is coming next?', 'Scheduled backups, richer history, and more device controls are planned.']
]

export function FAQPage() {
  return (
    <main className="info-page">
      <p className="eyebrow">05 / questions</p>
      <h1>The useful answers, in one place.</h1>
      <p className="page-lede">A few notes for getting started. This is a placeholder FAQ and will grow with the app.</p>
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
