import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Booty Beauty Project',
  description: 'Comparatifs et fiches produits beauté — niche Booty Beauty.',
  metadataBase: new URL('https://bootybeauty-nextjs.vercel.app'),
  verification: {
    google: 'google2093143cb4e5fd91',
  },
  alternates: { canonical: 'https://bootybeauty-nextjs.vercel.app' },
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
            <Link href="/" className="font-semibold">Booty Beauty Project</Link>
            <nav className="text-sm space-x-4">
              <Link href="/top-10/booty-beauty-2025">Top 10</Link>
              <a href="https://sites.google.com/view/bootybeautyproject" target="_blank" rel="noreferrer">À propos</a>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10">{children}</main>

        <footer className="max-w-5xl mx-auto px-4 py-10 text-sm text-gray-500">
          © {new Date().getFullYear()} Booty Beauty Project
        </footer>

        {/* Google Analytics (GA4) + mode debug via ?ga_debug=1 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;
                    gtag('js', new Date());

                    // Active le mode debug si l'URL contient ?ga_debug=1
                    var debug = typeof window !== 'undefined' && window.location && window.location.search.indexOf('ga_debug=1') > -1;
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { debug_mode: debug });
                  })();
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}
