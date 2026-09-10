import { QuickShare } from '../components/QuickShare'

export function QuickSharePage() {
  return (
    <main className="space-y-5">
      <section className="page-intro">
        <p className="eyebrow">03 / quick share</p>
        <h1>Send a link, not an attachment.</h1>
        <p className="page-lede">Open a private, local sharing page on your phone. Drop files in, pull files out, and keep the transfer between devices you trust.</p>
      </section>
      <QuickShare />
    </main>
  )
}
