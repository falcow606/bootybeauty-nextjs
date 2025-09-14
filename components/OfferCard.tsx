// components/OfferCard.tsx
'use client';

import Image from 'next/image';

export type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null; // non affiché côté UI publique
  httpStatus: number | string | null;
  lastChecked: string | null;

  // Champs optionnels si un jour tu ajoutes des visuels / titres côté n8n
  imageUrl?: string | null;
  title?: string | null;
};

type Props = {
  offer: Offer;
  index: number;
  /** Optionnel : fourni par la page produit pour tracer l’origine */
  originSlug?: string;
};

function asNumber(value: string | number | null): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const n = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

export default function OfferCard({ offer, index, originSlug }: Props) {
  const href = offer.affiliateUrl || '';
  const priceNum = asNumber(offer.price);
  const priceLabel = priceNum != null ? `${priceNum.toFixed(2)} €` : undefined;

  const imgSrc = offer.imageUrl || '/og.svg';
  const imgAlt =
    offer.title ||
    `${offer.merchant ?? 'Marchand'}${offer.productId ? ` #${offer.productId}` : ''}`;

  async function handleClick() {
    try {
      if (!href) return;
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          href,
          merchant: offer.merchant,
          slug: originSlug ?? 'offers',
          pos: index + 1,
          pathname: typeof window !== 'undefined' ? window.location.pathname : null,
          referrer:
            typeof document !== 'undefined' ? (document.referrer || null) : null,
        }),
        keepalive: true,
      });
    } catch {
      // on ignore les erreurs réseau de tracking
    }
  }

  const isOk = String(offer.httpStatus || '') === '200';

  return (
    <article className="flex gap-4 rounded-2xl border border-zinc-200 p-4 shadow-sm">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={imgSrc}
          alt={imgAlt}
          fill
          sizes="112px"
          className="object-cover"
          priority={false}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">
            {offer.title || offer.merchant || 'Offre'}
          </h3>

          <p className="mt-1 text-sm text-zinc-600">
            {priceLabel ? (
              <>
                Prix estimé : <span className="font-medium text-zinc-900">{priceLabel}</span>
              </>
            ) : (
              'Prix non renseigné'
            )}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {isOk ? 'Lien vérifié' : 'Lien indisponible'}
            {offer.lastChecked ? ` · ${new Date(offer.lastChecked).toLocaleString()}` : ''}
          </p>
        </div>

        <div className="mt-3">
          <a
            href={href || '#'}
            target="_blank"
            rel="nofollow sponsored noopener"
            onClick={handleClick}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium ${
              href && isOk
                ? 'bg-black text-white hover:opacity-90'
                : 'cursor-not-allowed bg-zinc-300 text-zinc-600'
            }`}
            aria-disabled={!href || !isOk}
          >
            Voir l’offre
          </a>
        </div>
      </div>
    </article>
  );
}
