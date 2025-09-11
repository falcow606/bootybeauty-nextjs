// components/OffersClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import OfferCard, { type Offer } from '@/components/OfferCard';
import OffersToolbar, { type OffersUiState } from '@/components/OffersToolbar';

function isOffer(x: unknown): x is Offer {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return 'affiliateUrl' in o && 'httpStatus' in o;
}

function priceNumber(o: Offer): number | null {
  if (o.price == null || o.price === '') return null;
  const n = Number(String(o.price).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function OffersClient({
  apiUrl,
  initialOffers = [],
}: {
  apiUrl?: string;
  initialOffers?: Offer[];
}) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [loading, setLoading] = useState<boolean>(!initialOffers.length && !!apiUrl);
  const [err, setErr] = useState<string | null>(null);

  // UI state (filtres/tri)
  const [ui, setUi] = useState<OffersUiState>({
    q: '',
    merchant: '',
    onlyReady: true,
    sort: 'best',
  });

  // Fetch si apiUrl fourni
  useEffect(() => {
    if (!apiUrl) return;

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
        const list = Array.isArray(data) ? (data as unknown[]).filter(isOffer) : [];
        // on garde tout, le filtre "onlyReady" s’applique en UI
        if (!aborted) setOffers(list as Offer[]);
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

  // Liste des marchands pour le select
  const merchants = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      const m = (o.merchant || '').trim();
      if (m) set.add(m);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [offers]);

  // Application des filtres + tri
  const view = useMemo(() => {
    let list = [...offers];

    if (ui.onlyReady) {
      list = list.filter((o) => o.affiliateUrl && String(o.httpStatus) === '200');
    }

    if (ui.merchant) {
      list = list.filter((o) => (o.merchant || '').trim() === ui.merchant);
    }

    if (ui.q.trim()) {
      const q = ui.q.trim().toLowerCase();
      list = list.filter((o) => {
        const m = (o.merchant || '').toLowerCase();
        const id = String(o.productId || '').toLowerCase();
        return m.includes(q) || id.includes(q);
      });
    }

    switch (ui.sort) {
      case 'price_asc':
        list.sort((a, b) => {
          const na = priceNumber(a);
          const nb = priceNumber(b);
          if (na == null && nb == null) return 0;
          if (na == null) return 1;
          if (nb == null) return -1;
          return na - nb;
        });
        break;
      case 'price_desc':
        list.sort((a, b) => {
          const na = priceNumber(a);
          const nb = priceNumber(b);
          if (na == null && nb == null) return 0;
          if (na == null) return 1;
          if (nb == null) return -1;
          return nb - na;
        });
        break;
      case 'recent':
        list.sort((a, b) => {
          const da = a.lastChecked ? Date.parse(a.lastChecked) : 0;
          const db = b.lastChecked ? Date.parse(b.lastChecked) : 0;
          return db - da;
        });
        break;
      case 'best':
      default:
        // heuristique simple : lien OK d’abord, puis prix croissant si dispo
        list.sort((a, b) => {
          const oka = String(a.httpStatus) === '200' ? 0 : 1;
          const okb = String(b.httpStatus) === '200' ? 0 : 1;
          if (oka !== okb) return oka - okb;
          const na = priceNumber(a) ?? Number.POSITIVE_INFINITY;
          const nb = priceNumber(b) ?? Number.POSITIVE_INFINITY;
          return na - nb;
        });
        break;
    }

    return list;
  }, [offers, ui]);

  // UI states
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

  return (
    <div className="space-y-4">
      <OffersToolbar
        merchants={merchants}
        total={view.length}
        value={ui}
        onChange={setUi}
      />

      {view.length === 0 ? (
        <p className="text-sm text-neutral-600">Aucune offre selon ces filtres.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {view.map((o, i) => (
            <li key={`${o.productId}-${i}`}>
              <OfferCard offer={o} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
