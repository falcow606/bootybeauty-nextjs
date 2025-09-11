// components/OffersClient.tsx
'use client';

import { useMemo, useState, ChangeEvent } from 'react';
import OfferCard, { Offer } from './OfferCard';

type SortKey = 'price-asc' | 'price-desc' | 'recent';

export default function OffersClient({ initialOffers }: { initialOffers: Offer[] }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [onlyInStock, setOnlyInStock] = useState(true);

  function onChangeSort(e: ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as SortKey;
    // garde-fou si quelqu’un modifie le DOM
    if (v === 'price-asc' || v === 'price-desc' || v === 'recent') {
      setSort(v);
    } else {
      setSort('recent');
    }
  }

  const filtered = useMemo(() => {
    let list = [...initialOffers];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (o) =>
          String(o.productId ?? '').toLowerCase().includes(s) ||
          String(o.merchant ?? '').toLowerCase().includes(s),
      );
    }

    if (onlyInStock) {
      list = list.filter((o) => (o.availability ?? '').toLowerCase().includes('stock'));
    }

    if (sort === 'price-asc' || sort === 'price-desc') {
      list.sort((a, b) => Number(a.price ?? Number.POSITIVE_INFINITY) - Number(b.price ?? Number.POSITIVE_INFINITY));
      if (sort === 'price-desc') list.reverse();
    } else {
      // recent: lastChecked desc
      list.sort(
        (a, b) =>
          new Date(String(b.lastChecked ?? 0)).getTime() -
          new Date(String(a.lastChecked ?? 0)).getTime(),
      );
    }

    return list;
  }, [initialOffers, q, sort, onlyInStock]);

  return (
    <>
      {/* Controls */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (produit ou marchand)"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-zinc-400 focus:border-rose-400 dark:border-zinc-700 dark:bg-zinc-900"
        />

        <select
          value={sort}
          onChange={onChangeSort}
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="recent">Plus récentes</option>
          <option value="price-asc">Prix : croissant</option>
          <option value="price-desc">Prix : décroissant</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
          <input
            type="checkbox"
            className="h-4 w-4 accent-rose-600"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          En stock uniquement
        </label>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune offre ne correspond à vos filtres.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((o, i) => (
            <OfferCard key={`${o.productId}-${i}`} offer={o} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
