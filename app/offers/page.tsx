export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300;

import React from 'react';
import { Bodoni_Moda, Nunito_Sans } from 'next/font/google';
import OfferCard, { type CardOffer } from '@/components/OfferCard';

const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal'], weight: ['400','600','700'] });
const nunito = Nunito_Sans({ subsets: ['latin'], weight: ['300','400','600','700'] });

function resolveBaseUrl(): string {
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/,'');
  const pub = process.env.NEXT_PUBLIC_SITE_URL;
  if (pub) return pub.replace(/\/+$/,'');
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return '';
}

async function fetchOffers(): Promise<CardOffer[]> {
  // 1) API interne
  const base = resolveBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/api/offers`, { cache: 'no-store' });
      if (res.ok) {
        const json: unknown = await res.json();
        if (Array.isArray(json)) return json as CardOffer[];
      }
    } catch { /* noop */ }
  }
  // 2) n8n (fallback)
  const n8n = process.env.N8N_OFFERS_URL || process.env.N8N_OFFERS_API || '';
  if (n8n) {
    try {
      const init: RequestInit & { next?: { revalidate?: number } } = { next: { revalidate: 300 } };
      if (process.env.N8N_OFFERS_KEY) {
        init.headers = { 'x-api-key': String(process.env.N8N_OFFERS_KEY) };
      }
      const res = await fetch(n8n, init);
      if (res.ok) {
        const j: unknown = await res.json();
        const rows =
          (Array.isArray(j) ? j :
            (typeof j === 'object' && j !== null) ?
              ((j as { items?: unknown; data?: unknown }).items ??
               (j as { items?: unknown; data?: unknown }).data) : []) as unknown;
        if (Array.isArray(rows)) return rows as CardOffer[];
      }
    } catch { /* noop */ }
  }
  return [];
}

export default async function OffersPage() {
  const offers = await fetchOffers();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      <header className="mb-6">
        <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>Toutes nos offres</h1>
        <p className={`${nunito.className} mt-2 opacity-80`}>Sélection mise à jour régulièrement.</p>
      </header>

      {offers.length === 0 ? (
        <p className={`${nunito.className} opacity-70`}>
          Aucune offre à afficher. Vérifie les variables N8N_OFFERS_URL / N8N_OFFERS_API (et la clé) sur Vercel.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o, i) => (
            <OfferCard key={`${o.productId || o.slug || o.title || i}-${i}`} offer={o} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
