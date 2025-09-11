// app/layout.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const heading = Playfair_Display({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  metadataBase: new URL('https://bootybeauty-nextjs.vercel.app'),
  title: {
    default: 'Booty Beauty',
    template: '%s — Booty Beauty',
  },
  description:
    "Comparateur de soins booty : sélection éditoriale, prix comparés, offres mises à jour. Liens d'affiliation sans surcoût.",
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Booty Beauty',
    description:
      "Comparateur de soins booty : sélection éditoriale, prix comparés, offres mises à jour.",
    type: 'website',
    siteName: 'Booty Beauty',
    url: 'https://bootybeauty-nextjs.vercel.app',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${body.variable} ${heading.variable} h-full`}>
      <body className="min-h-screen bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {/* Header */}
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold font-serif tracking-tight">
              Booty Beauty
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300">
              <Link className="nav-link" href="/offers">
                Offres
              </Link>
              <Link className="nav-link" href="/top-10/booty-beauty-2025">
                Top 10
              </Link>
              <Link className="nav-link" href="/about">
                À propos
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} Booty Beauty — Sélection éditoriale & liens
                marchands partenaires.
              </p>
              <nav className="flex flex-wrap items-center gap-4">
                <Link className="nav-link" href="/about">
                  À propos
                </Link>
                <Link className="nav-link" href="/disclosure">
                  Disclosure
                </Link>
                <Link className="nav-link" href="/legal">
                  Mentions légales
                </Link>
              </nav>
            </div>
            <p className="mt-3 text-xs">
              Certains liens sont affiliés et peuvent nous rémunérer sans surcoût pour vous.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
