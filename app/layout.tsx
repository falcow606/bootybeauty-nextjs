import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// bannière côté client (import dynamique pour éviter le SSR)
const CookieBanner = dynamic(() => import('@/components/CookieBanner'), { ssr: false })

export const metadata: Metadata = {
  title: 'Booty Beauty Project',
  description: 'Comparatifs et fiches produits beauté — niche Booty Beauty.',
  metadataBase: new URL('https://bootybeauty-nextjs.vercel.app'),
  verification: { google: 'google2093143cb4e5fd91' },
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

        {/* ---- Google Analytics (GA4) avec Consent Mode ---- */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            {/* Charge gtag */}
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            {/* Consent par défaut = denied ; config GA4 seulement si consent=granted */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    window.gtag = gtag;

                    // Consentement par défaut : tout refusé
                    gtag('consent', 'default', {
                      ad_user_data: 'denied',
                      ad_personalization: 'denied',
                      ad_storage: 'denied',
                      analytics_storage: 'denied'
                    });

                    // Aide : stocker l'ID pour re-config après accept
                    window.__bb_gaid = '${process.env.NEXT_PUBLIC_GA_ID}';

                    // Mode debug via ?ga_debug=1
                    var debug = typeof window !== 'undefined' && window.location && window.location.search.indexOf('ga_debug=1') > -1;

                    // Si le cookie bb_consent=granted existe, on autorise l'analyse et on configure GA
                    var hasGranted = (document.cookie || '').indexOf('bb_consent=granted') > -1;
                    if (hasGranted) {
                      gtag('consent', 'update', {
                        ad_user_data: 'granted',
                        ad_personalization: 'granted',
                        ad_storage: 'granted',
                        analytics_storage: 'granted'
                      });
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', { debug_mode: debug });
                    }

                    // --- Auto-tracking des clics sortants & d'affiliation (uniquement si GA est configuré) ---
                    document.addEventListener('click', function(e) {
                      var el = e.target;
                      if (!el) return;
                      var a = el.closest && el.closest('a');
                      if (!a) return;

                      var href = a.getAttribute('href') || '';
                      if (!href) return;

                      var sameHost = false;
                      try { sameHost = new URL(href, location.href).host === location.host; } catch(_) {}

                      var isExternal = href.startsWith('http') && !sameHost;
                      var isAffiliateTag =
                        /[?&](tag|aff_id|affid|aff|utm_affiliate)=/i.test(href) ||
                        /awin|cj\\.com|rakuten|partnerize/i.test(href);
                      var isAffiliateData = a.dataset && a.dataset.aff === '1';
                      var isAffiliate = isAffiliateTag || isAffiliateData;

                      // On n'envoie des events que si l'analyse est autorisée
                      var consentGranted = (document.cookie || '').indexOf('bb_consent=granted') > -1;

                      if (consentGranted && isExternal) {
                        gtag('event', 'outbound_click', {
                          link_url: href,
                          link_text: (a.textContent || '').trim().slice(0,100),
                        });
                      }

                      if (consentGranted && isAffiliate) {
                        gtag('event', 'affiliate_click', {
                          link_url: href,
                          merchant: a.dataset.merchant || null,
                          product_slug: a.dataset.slug || null,
                          position: a.dataset.pos || null
                        });
                      }
                    }, { capture: true, passive: true });
                  })();
                `,
              }}
            />
          </>
        )}

        {/* Bannière cookies (accepter / refuser) */}
        <CookieBanner />
      </body>
    </html>
  )
}
