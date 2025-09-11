// components/OffersToolbar.tsx
'use client';

import { useId } from 'react';

export type SortKey = 'best' | 'price_asc' | 'price_desc' | 'recent';

export type OffersUiState = {
  q: string;
  merchant: string;     // '' = tous
  onlyReady: boolean;   // true = liens OK seulement
  sort: SortKey;
};

export default function OffersToolbar({
  merchants,
  total,
  value,
  onChange,
}: {
  merchants: string[];
  total: number;
  value: OffersUiState;
  onChange: (v: OffersUiState) => void;
}) {
  const qId = useId();
  const mId = useId();
  const sId = useId();
  const rId = useId();

  return (
    <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          {/* Recherche */}
          <div className="flex flex-col">
            <label htmlFor={qId} className="text-xs font-medium text-zinc-600">
              Rechercher
            </label>
            <input
              id={qId}
              value={value.q}
              onChange={(e) => onChange({ ...value, q: e.target.value })}
              placeholder="Produit, marchand…"
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {/* Marchand */}
          <div className="flex flex-col">
            <label htmlFor={mId} className="text-xs font-medium text-zinc-600">
              Marchand
            </label>
            <select
              id={mId}
              value={value.merchant}
              onChange={(e) => onChange({ ...value, merchant: e.target.value })}
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">Tous</option>
              {merchants.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Tri */}
          <div className="flex flex-col">
            <label htmlFor={sId} className="text-xs font-medium text-zinc-600">
              Trier par
            </label>
            <select
              id={sId}
              value={value.sort}
              onChange={(e) => onChange({ ...value, sort: e.target.value as SortKey })}
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="best">Pertinence</option>
              <option value="price_asc">Prix ↑</option>
              <option value="price_desc">Prix ↓</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>
        </div>

        {/* Options + compteur */}
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={rId} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              id={rId}
              type="checkbox"
              checked={value.onlyReady}
              onChange={(e) => onChange({ ...value, onlyReady: e.target.checked })}
            />
            Liens OK seulement
          </label>
          <div className="text-xs text-zinc-600">{total} offre(s)</div>
        </div>
      </div>
    </div>
  );
}
