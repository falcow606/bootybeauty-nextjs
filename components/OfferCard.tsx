// components/OfferCard.tsx
'use client';

export type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;
};

function formatPrice(p: Offer['price']) {
  if (p == null || p === '') return null;
  const n = Number(String(p).replace(',', '.'));
  return Number.isFinite(n) ? `${n.toFixed(2)} €` : null;
}

function initials(name?: string | null) {
  if (!name) return '—';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('') || '—';
}

function when(d?: string | null) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('fr-FR');
  } catch {
    return '—';
  }
}

async function trackClick(o: Offer, index: number) {
  try {
    await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        href: o.affiliateUrl,
        merchant: o.merchant,
        slug: 'offers',
        pos: index,
        pathname: '/offers',
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      }),
      keepalive: true,
    });
  } catch {
    // non bloquant
  }
}

export default function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const price = formatPrice(offer.price);
  const ok = String(offer.httpStatus) === '200';
  const merchant = offer.merchant || 'Boutique';
  const idLabel = typeof offer.productId === 'number' ? `#${offer.productId}` : String(offer.productId || '').trim();

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Avatar marchand */}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50"
          aria-label={merchant}
          title={merchant}
        >
          <span className="text-sm font-semibold text-zinc-700">{initials(merchant)}</span>
        </div>

        {/* Infos principales */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-900">
              {merchant}{idLabel ? ` · ${idLabel}` : ''}
            </h3>
            {ok ? (
              <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Lien OK
              </span>
            ) : (
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                À vérifier
              </span>
            )}
            {offer.commissionPct != null && String(offer.commissionPct).trim() !== '' && (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {String(offer.commissionPct)}%
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-zinc-600">
            {price ? price : 'Prix variable'} · {offer.availability || 'Disponibilité —'}
          </div>
        </div>

        {/* CTA */}
        {offer.affiliateUrl && ok && (
          <a
            href={offer.affiliateUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            onClick={() => trackClick(offer, index)}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Voir l’offre
          </a>
        )}
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Vérifié le {when(offer.lastChecked)}
      </div>
    </article>
  );
}
