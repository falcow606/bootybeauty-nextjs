'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

/** Type large pour couvrir Sheet/n8n (null-safe) */
export type AnyOffer = {
  // Identifiants
  id?: string | number | null;
  productId?: string | number | null;
  slug?: string | null;

  // Libellés & visuels
  title?: string | null;
  name?: string | null;
  brand?: string | null;
  marchand?: string | null;
  merchant?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  image_url?: string | null;
  Image_URL?: string | null;

  // Prix
  price?: string | number | null;
  priceEur?: string | number | null;
  ['Prix (€)']?: string | number | null;

  // Liens
  affiliateUrl?: string | null;
  finalUrl?: string | null;
  url?: string | null;

  // Statut HTTP (optionnel)
  httpStatus?: number | string | null;
};

export type Offer = AnyOffer;

export type OfferCardProps = {
  offer: AnyOffer;
  index: number;
  /** slug de la page d'origine (ex: 'offers' ou fiche courante) */
  originSlug?: string;
};

export default function OfferCard({ offer, index, originSlug }: OfferCardProps) {
  const title = offer.title ?? offer.name ?? 'Produit';
  const brand = offer.brand ?? offer.merchant ?? offer.marchand ?? '';
  const img = offer.imageUrl ?? offer.Image_URL ?? offer.image_url ?? offer.image ?? '';
  const priceRaw = offer.price ?? offer.priceEur ?? offer['Prix (€)'] ?? '';
  const price = typeof priceRaw === 'number' ? `${priceRaw.toFixed(2)}€` : (priceRaw || '');

  const detailsHref = offer.slug ? `/p/${offer.slug}` : '/offers';
  const affiliate = offer.affiliateUrl ?? offer.finalUrl ?? offer.url ?? '';

  async function trackClick() {
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productId: String(offer.productId ?? offer.id ?? title),
          index,
          originSlug,
          target: affiliate,
        }),
      });
    } catch {
      /* no-op */
    }
  }

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 transition hover:shadow-lg"
      style={{ ringColor: 'var(--bg-light)' as unknown as string, boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}
    >
      {/* Frame image avec bordure blanche bien visible */}
      <div className="p-3">
        <div className="relative rounded-2xl bg-[var(--bg-main)] p-2">
          <div className="overflow-hidden rounded-xl border-4 border-white shadow-sm">
            <Image
              src={img || '/images/product-placeholder.jpg'}
              alt={`${title} — photo produit`}
              width={800}
              height={800}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.01]"
              priority={false}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug" style={{ color: 'var(--accent)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm opacity-80" style={{ color: 'var(--text)' }}>
            {brand || 'Soin corps • 200 ml'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {price}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={detailsHref}
              className="rounded-2xl border px-4 py-2 text-sm transition hover:opacity-90"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'transparent' }}
            >
              Détails
            </Link>
            {affiliate ? (
              <Link
                href={affiliate}
                target="_blank"
                rel="nofollow sponsored noopener"
                onClick={trackClick}
                className="rounded-2xl px-4 py-2 text-sm text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Choisir
              </Link>
            ) : (
              <Link
                href="/offers"
                className="rounded-2xl px-4 py-2 text-sm text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Choisir
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
