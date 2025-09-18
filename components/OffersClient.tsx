// components/OffersClient.tsx
import * as React from "react";
import OfferCard, { type CardOffer } from "@/components/OfferCard";

export type OffersClientProps = {
  items: CardOffer[];
  originSlug?: string;
};

export default function OffersClient({ items, originSlug }: OffersClientProps) {
  if (!items?.length) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o, i) => (
        <OfferCard key={`${o.productId || o.title || "o"}-${i}`} offer={o} index={i} originSlug={originSlug} />
      ))}
    </div>
  );
}
