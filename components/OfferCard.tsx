'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type CardOffer = {
  // Identifiants
  id?: string | number;
  productId?: string | number;
  slug?: string;

  // Libellés & visuels
  title?: string;
  name?: string;
  brand?: string;
  marchand?: string;
  merchant?: string;
  imageUrl?: string;
  image?: string;
  image_url?: string;
  Image_URL?: string;

  // Prix
  price?: string | number;
  priceEur?: string | number;
  ['Prix (€)']?: string | number;

  // Liens
  affiliateUrl?: string;
  finalUrl?: string;
  url?: string;

  // Statut HTTP (pour filtrage côté fiche produit)
  httpStatus?: number | string;
};

/** Compat pour `import OfferCard, { type Offer } from '@/components/OfferCard'` */
export type Offer = CardOffer;

export type OfferCardProps = {
  offer: CardOffer;
  index: number;
  /** slug de la page d'origine (ex: fiche produit courante) */
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
    <article className="flex flex-col rounded-3xl bg-white p-5 shadow-md">
      <div className="relative">
        <Image
          src={img || '/images/product-placeholder.jpg'}
          alt={`${title} — photo produit`}
          width={600}
          height={600}
          className="aspect-square w-full rounded-2xl object-cover"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold" style={{ color: 'var(--accent)' }}>
            {title}
          </h3>
          <p className="text-sm opacity-80" style={{ color: 'var(--text)' }}>
            {brand || 'Soin corps • 200 ml'}
          </p>
        </div>
        <span className="inline-block rounded-full border px-3 py-1 text-sm" style={{ borderColor: 'var(--bg-light)' }}>
          Recommandé
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {price}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={detailsHref}
            className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
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
              className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Choisir
            </Link>
          ) : (
            <Link
              href="/offers"
              className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Choisir
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
