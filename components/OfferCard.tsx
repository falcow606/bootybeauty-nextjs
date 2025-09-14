// components/OfferCard.tsx
'use client';

type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;
  // Champs optionnels si dispos dans ton Google Sheet / API n8n
  title?: string | null;
  image?: string | null; // ex: Image_URL dans le Sheet
};

export default function OfferCard({
  offer,
  index,
  originSlug,
}: {
  offer: Offer;
  index: number;
  originSlug?: string;
}) {
  const id = String(offer.productId ?? index);
  const title =
    (offer as any).title?.toString().trim() ||
    `${offer.merchant ?? 'Marque'} – Réf. ${id}`;
  const img =
    (offer as any).image?.toString().trim() ||
    'https://via.placeholder.com/600x400?text=Booty+Beauty';
  const price =
    offer.price != null && String(offer.price).trim() !== ''
      ? String(offer.price)
      : undefined;

  return (
    <article className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm hover:shadow-md transition">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {/* pas de next/image pour éviter la config de domaines */}
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          {offer.merchant ?? '—'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-900">
          {title}
        </h3>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {price ? (
              <>
                <span className="text-lg font-semibold text-neutral-900">
                  {price}
                </span>{' '}
                <span className="text-xs">€</span>
              </>
            ) : (
              <span className="text-sm italic text-neutral-500">Prix à vérifier</span>
            )}
          </div>

          {offer.affiliateUrl ? (
            <a
              href={offer.affiliateUrl}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              onClick={() => {
                // tracking côté client → appelle /api/track-click
                fetch('/api/track-click', {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({
                    href: offer.affiliateUrl,
                    merchant: offer.merchant,
                    slug: originSlug || 'offers',
                    pos: index + 1,
                    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
                    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
                  }),
                  keepalive: true,
                }).catch(() => {});
              }}
            >
              Voir l’offre
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M7 17L17 7M7 7h10v10" />
              </svg>
            </a>
          ) : (
            <span className="text-xs text-neutral-400">Lien indisponible</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
          <span>ID: {id}</span>
          {String(offer.httpStatus || '') === '200' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              OK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              À vérifier
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
