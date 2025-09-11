// app/offers/page.tsx
export const dynamic = 'force-dynamic';

import OffersClient from '@/components/OffersClient';
import type { Offer } from '@/components/OfferCard';

async function getOffers(): Promise<Offer[]> {
  const url = process.env.N8N_OFFERS_API;
  if (!url) return [];

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  if (!res.ok) return [];

  let data: unknown = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    return [];
  }

  const raw = Array.isArray(data) ? (data as Offer[]) : [];
  // garder uniquement les liens actifs
  return raw.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200');
}

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offres du moment</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sélection mise à jour automatiquement depuis nos marchands partenaires.
          </p>
        </div>
      </header>

      <OffersClient initialOffers={offers} />
    </main>
  );
}
