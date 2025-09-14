// components/OffersClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import OfferCard from './OfferCard';

type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;
  title?: string | null;
  image?: string | null;
};

export default function OffersClient({
  apiUrl,
  initialOffers,
  originSlug = 'offers',
}: {
  apiUrl?: string;
  initialOffers?: Offer[];
  originSlug?: string;
}) {
  const [offers, setOffers] = useState<Offer[]>(() => initialOffers ?? []);
  const [loading, setLoading] = useState<boolean>(!initialOffers && !!apiUrl);
  const [error, setError] = useState<string | null>(null);

  // charge depuis /api/offers si apiUrl fourni
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(apiUrl, { cache: 'no-store' });
        const text = await res.text();
        if (!res.ok) throw new Error(`API ${res.status}: ${text.slice(0, 120)}`);
        const data = text ? (JSON.parse(text) as unknown) : [];
        const list = Array.isArray(data) ? (data as Offer[]) : [];
        if (!cancelled) setOffers(list.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200'));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'fetch_failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const ready = useMemo(
    () => offers.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200'),
    [offers],
  );

  if (loading) {
    return <p className="text-sm text-neutral-500">Chargement des offres…</p>;
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">
        Erreur de chargement : <span className="font-mono">{error}</span>
      </p>
    );
  }
  if (ready.length === 0) {
    return <p className="text-neutral-600">Aucune offre valide pour le moment.</p>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ready.map((o, i) => (
        <OfferCard key={`${o.productId}-${i}`} offer={o} index={i} originSlug={originSlug} />
      ))}
    </div>
  );
}
