import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booty Beauty Project',
  description: 'Comparatifs et fiches produits beauté — niche Booty Beauty.',
  metadataBase: new URL('https://bootybeauty-nextjs.vercel.app'),
  verification: {
    google: 'google2093143cb4e5fd91', // ✅ code Search Console
  },
  alternates: {
    canonical: 'https://bootybeauty-nextjs.vercel.app',
  },
  openGraph: {
    siteName: 'Booty Beauty Project',
    url: 'https://bootybeauty-nextjs.vercel.app',
    type: 'website',
    title: 'Booty Beauty Project',
    description: 'Comparatifs et fiches produits beauté — niche Booty Beauty.',
  },
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
              {/* Lien externe → <a> OK */}
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

        {/* Google Analytics (GA4) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}
