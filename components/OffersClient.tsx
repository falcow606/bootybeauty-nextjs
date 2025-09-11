// components/OffersClient.tsx
'use client';

import { useEffect, useState } from 'react';
import OfferCard from '@/components/OfferCard';

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

function isOffer(x: unknown): x is Offer {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return 'affiliateUrl' in o && 'httpStatus' in o;
}

type Props = {
  /** Option A: URL à appeler côté client (ex: /api/offers) */
  apiUrl?: string;
  /** Option B: offres déjà fournies côté serveur (fallback si pas d’apiUrl) */
  initialOffers?: Offer[];
};

export default function OffersClient({ apiUrl, initialOffers = [] }: Props) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [loading, setLoading] = useState<boolean>(!initialOffers.length && !!apiUrl);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) return; // si on a initialOffers, on ne fetch pas

    let aborted = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(apiUrl, { cache: 'no-store', signal: ctrl.signal });
        const text = await res.text();
        if (!res.ok) throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);

        const data: unknown = text ? JSON.parse(text) : [];
        const list: Offer[] = Array.isArray(data)
          ? (data as unknown[]).filter(isOffer).filter(o => o.affiliateUrl && String(o.httpStatus) === '200')
          : [];

        if (!aborted) setOffers(list);
      } catch (e) {
        if (!aborted) setErr(e instanceof Error ? e.message : 'unknown error');
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
      ctrl.abort();
    };
  }, [apiUrl]);

  if (err) return <p className="text-sm text-red-600">Erreur chargement offres : {err}</p>;
  if (loading) {
    return (
      <ul className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-zinc-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 rounded bg-zinc-100" />
                <div className="h-3 w-64 rounded bg-zinc-100" />
              </div>
              <div className="h-9 w-28 rounded-xl bg-zinc-100" />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (!offers.length) return <p className="text-sm text-neutral-600">Aucune offre valide pour le moment.</p>;

  return (
    <ul className="grid grid-cols-1 gap-4">
      {offers.map((o, i) => (
        <li key={String(o.productId)}>
          <OfferCard offer={o} index={i} />
        </li>
      ))}
    </ul>
  );
}
