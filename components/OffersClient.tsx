'use client';

import * as React from 'react';
import OfferCard, { type Offer } from '@/components/OfferCard';

export type OffersClientProps = {
  items: Offer[];
  originSlug?: string;
};

export default function OffersClient({ items, originSlug = 'offers' }: OffersClientProps) {
  const ready = Array.isArray(items) ? items : [];

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ready.map((o, i) => (
        <OfferCard key={`${String(o.productId ?? o.id ?? i)}`} offer={o} index={i} originSlug={originSlug} />
      ))}
    </div>
  );
}
