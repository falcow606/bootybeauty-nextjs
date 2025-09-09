'use client'

type Offer = {
  productId: string | number
  merchant: string | null
  price: string | number | null
  availability: string | null
  affiliateUrl: string | null
  commissionPct: string | number | null
  httpStatus: number | string | null
  lastChecked: string | null
}

export default function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const trackClick = () => {
    if (!offer?.affiliateUrl) return

    const payload = {
      href: offer.affiliateUrl,
      merchant: offer.merchant || null,
      slug: String(offer.productId),
      pos: index + 1,
      pathname: typeof window !== 'undefined' ? window.location.pathname : null,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
    }

    try {
      // 1) sendBeacon vers notre API interne (même origine)
      if ('sendBeacon' in navigator) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
        const ok = (navigator as any).sendBeacon('/api/track-click', blob)
        if (ok) return
      }
      // 2) Fallback fetch
      fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // ne jamais bloquer la navigation
    }
  }

  return (
    <article className="border rounded-xl p-4 shadow-sm">
      <header className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Produit #{String(offer.productId)}</h2>
        <span className="text-sm text-gray-500">{offer.merchant ?? '—'}</span>
      </header>
      <p className="text-sm">Prix: {offer.price ?? 'n/a'}</p>
      <p className="text-sm">Disponibilité: {offer.availability ?? 'n/a'}</p>
      <p className="text-xs text-gray-500">Dernière vérif: {offer.lastChecked ?? 'n/a'}</p>

      {offer.affiliateUrl ? (
        <a
          href={offer.affiliateUrl}
          className="inline-block mt-3 px-3 py-2 border rounded-lg hover:bg-gray-50"
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackClick}
        >
          Voir l’offre
        </a>
      ) : (
        <span className="inline-block mt-3 text-red-600 text-sm">Lien affilié manquant</span>
      )}
    </article>
  )
}
