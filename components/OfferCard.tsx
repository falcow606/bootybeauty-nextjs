'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';

/** Type large pour couvrir Sheet/n8n (null-safe) */
export type AnyOffer = {
  id?: string | number | null;
  productId?: string | number | null;
  slug?: string | null;

  // libellés & visuels
  title?: string | null;
  name?: string | null;
  brand?: string | null;
  marchand?: string | null;
  merchant?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  image_url?: string | null;
  Image_URL?: string | null;

  // prix
  price?: string | number | null;
  priceEur?: string | number | null;
  ['Prix (€)']?: string | number | null;

  // liens
  affiliateUrl?: string | null;
  finalUrl?: string | null;
  url?: string | null;
  link?: string | null;
  // variantes fréquentes dans GS
  ['Affiliate URL']?: string | null;
  ['Affiliate Url']?: string | null;
  ['Affiliate Link']?: string | null;
  ['Affiliate']?: string | null;
  ['Lien affilié']?: string | null;
  ['Lien']?: string | null;
  ['Lien_achat']?: string | null;
  ['BuyLink']?: string | null;
  ['Buy Link']?: string | null;
  ['Product_URL']?: string | null;
  ['Product URL']?: string | null;
  ['URL produit']?: string | null;
  ['Amazon_URL']?: string | null;
  ['ASIN_URL']?: string | null;

  httpStatus?: number | string | null;
};

export type Offer = AnyOffer;

export type OfferCardProps = {
  offer: AnyOffer;
  index: number;
  originSlug?: string;
};

function slugify(input: string): string {
  const s = input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'produit';
}

function getStrLoose(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

export default function OfferCard({ offer, index, originSlug }: OfferCardProps) {
  const title = offer.title ?? offer.name ?? 'Produit';
  const brand = offer.brand ?? offer.merchant ?? offer.marchand ?? '';
  const img =
    getStrLoose(offer as Record<string, unknown>, [
      'imageUrl', 'Image_URL', 'Image Url', 'Image URL', 'image_url', 'Image', 'image',
      // fallback : certains mettent l’héro dans la même colonne
      'Hero', 'Hero_Image', 'Hero URL', 'Image_Hero'
    ]) ?? '';

  const priceRaw = offer.price ?? offer.priceEur ?? offer['Prix (€)'] ?? '';
  const price = typeof priceRaw === 'number' ? `${priceRaw.toFixed(2)}€` : (priceRaw || '');

  const rawSlug = (offer.slug ?? '').toString().trim();
  const computedSlug = rawSlug || (title !== 'Produit' ? slugify(title) : '');
  const detailsHref = computedSlug ? `/p/${computedSlug}` : '/offers';

  const affiliate =
    getStrLoose(offer as Record<string, unknown>, [
      'affiliateUrl', 'finalUrl', 'url', 'link',
      'Affiliate_URL', 'Affiliate URL', 'Affiliate Url', 'Affiliate Link', 'Affiliate',
      'Lien affilié', 'Lien', 'Lien_achat',
      'BuyLink', 'Buy Link',
      'Product_URL', 'Product URL', 'URL produit',
      'Amazon_URL', 'ASIN_URL'
    ]) ?? '';

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
      className="flex flex-col rounded-3xl bg-white p-5 shadow-md transition hover:shadow-lg"
      style={{ border: '1px solid var(--bg-light)' }}
    >
      {/* Image avec unoptimized pour tolérer tous les domaines */}
      <div className="relative overflow-hidden rounded-2xl">
        <Image
          src={img || '/images/product-placeholder.jpg'}
          alt={`${title} — photo produit`}
          width={800}
          height={800}
          unoptimized
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--accent)' }}>
            {title}
          </h3>
          <p className="mt-1 text-sm opacity-80" style={{ color: 'var(--text)' }}>
            {brand || 'Soin corps • 200 ml'}
          </p>
        </div>
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
    </article>
  );
}
