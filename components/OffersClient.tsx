// components/OffersClient.tsx
'use client';

import { useEffect, useState } from 'react';
import OfferCard, { type Offer } from './OfferCard';

export default function OffersClient({ apiUrl }: { apiUrl: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
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
        const list = Array.isArray(data) ? (data as Offer[]) : [];
        const ready = list.filter(o => o?.affiliateUrl && String(o?.httpStatus) === '200');
        if (!aborted) setOffers(ready);
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

  if (err) return <p className="text-sm text-red-600">Erreur chargement offres : {err}</p>;
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

