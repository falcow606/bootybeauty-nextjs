// components/OfferCard.tsx
'use client';

import { useCallback } from 'react';

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

type Props = {
  offer: Offer;
  index?: number;
  /** slug de la page d’origine (ex: fiche produit) pour le tracking.
   *  Si non fourni, on met "offers". */
  originSlug?: string;
};

export default function OfferCard({ offer, index = 0, originSlug = 'offers' }: Props) {
  const {
    productId,
    merchant,
    price,
    availability,
    affiliateUrl,
    commissionPct,
    lastChecked,
  } = offer;

  const prettyPrice =
    price != null && String(price).trim() !== ''
      ? `${Number(price).toFixed(2)} €`
      : undefined;

  const onClick = useCallback(
    (href: string) => {
      const payload = {
        href,
        merchant,
        slug: originSlug,
        pos: index,
        pathname: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      };

      try {
        // sendBeacon si dispo, sinon fetch "fire-and-forget"
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok =
          typeof navigator !== 'undefined' &&
          typeof navigator.sendBeacon === 'function' &&
          navigator.sendBeacon('/api/track-click', blob);

        if (!ok) {
          fetch('/api/track-click', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // no-op
      }
    },
    [merchant, originSlug, index],
  );

  if (!affiliateUrl) return null;

  return (
    <div className="rounded-xl border border-zinc-200 p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm text-zinc-500">#{String(productId)}</div>
        {commissionPct ? (
          <div className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {String(commissionPct)}%
          </div>
        ) : null}
      </div>

      <div className="mt-1 text-base font-semibold">{merchant || 'Marchand'}</div>

      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {prettyPrice ? <span>Prix indicatif&nbsp;: {prettyPrice}</span> : <span>Prix variable</span>}
        {availability ? <span> • {availability}</span> : null}
      </div>

      <a
        href={affiliateUrl}
        target="_blank"
        rel="nofollow sponsored noopener"
        onClick={() => onClick(affiliateUrl)}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#C4A092] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Voir l’offre
      </a>

      <div className="mt-2 text-xs text-zinc-500">
        {lastChecked ? `Vérifié le ${new Date(lastChecked).toLocaleDateString()}` : '\u00A0'}
      </div>
    </div>
  );
}
