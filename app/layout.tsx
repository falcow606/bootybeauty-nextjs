import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booty Beauty Project',
  description: 'Comparatifs et fiches produits beauté — niche Booty Beauty.',
metadataBase: new URL('https://bootybeauty-nextjs.vercel.app'),

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="border-b border-gray-200/60">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            {/* Logo → lien interne */}
            <Link href="/" className="font-semibold">
              Booty Beauty Project
            </Link>

            {/* Navigation */}
            <nav className="text-sm space-x-4">
              <Link href="/top-10/booty-beauty-2025">Top 10</Link>
              {/* Lien externe reste en <a> */}
              <a
                href="https://sites.google.com/view/bootybeautyproject"
                target="_blank"
                rel="noreferrer"
              >
                À propos
              </a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>

        <footer className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Booty Beauty Project
        </footer>
      </body>
    </html>
  )
}

