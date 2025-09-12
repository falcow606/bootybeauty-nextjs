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
  // ✨ optionnels pour la grille avec visuels
  title?: string | null;
  image?: string | null;
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

async function trackClick(o: Offer, index: number, originSlug?: string) {
  try {
    await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        href: o.affiliateUrl,
        merchant: o.merchant,
        slug: originSlug ?? 'offers',
        pos: index,
        pathname: typeof window !== 'undefined' ? window.location.pathname : '/offers',
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      }),
      keepalive: true,
    });
  } catch {
    // non bloquant
  }
}

export default function OfferCard({
  offer,
  index,
  originSlug,
}: {
  offer: Offer;
  index: number;
  /** Optionnel : slug d’origine (ex: slug de la page produit) */
  originSlug?: string;
}) {
  const price = formatPrice(offer.price);
  const ok = String(offer.httpStatus) === '200';
  const merchant = offer.merchant || 'Boutique';
  const idLabel =
    typeof offer.productId === 'number'
      ? `#${offer.productId}`
      : String(offer.productId || '').trim();

  const title = (offer.title && String(offer.title).trim()) || `${merchant}${idLabel ? ` · ${idLabel}` : ''}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image / Fallback */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100">
        {offer.image ? (
          <img
            src={offer.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-zinc-200 bg-white/70 backdrop-blur">
              <span className="text-sm font-semibold text-zinc-700">
                {initials(merchant)}
              </span>
            </div>
          </div>
        )}
        {/* Badge état lien */}
        <div className="absolute left-3 top-3">
          {ok ? (
            <span className="rounded-md bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white">
              Lien OK
            </span>
          ) : (
            <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-white">
              À vérifier
            </span>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-zinc-900">{title}</h3>

        <div className="text-sm text-zinc-600">
          {price ? price : 'Prix variable'}
          {' · '}
          {offer.availability || 'Disponibilité —'}
        </div>

        <div className="flex items-center justify-between">
          {/* Commission (si fournie) */}
          {offer.commissionPct != null && String(offer.commissionPct).trim() !== '' ? (
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
              {String(offer.commissionPct)}%
            </span>
          ) : (
            <span />
          )}

          {/* CTA */}
          {offer.affiliateUrl && ok && (
            <a
              href={offer.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              onClick={() => trackClick(offer, index, originSlug)}
              className="inline-flex items-center rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Voir l’offre
            </a>
          )}
        </div>

        <div className="pt-1 text-xs text-zinc-500">Vérifié le {when(offer.lastChecked)}</div>
      </div>
    </article>
  );
}
