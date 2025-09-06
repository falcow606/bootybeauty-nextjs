// app/p/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContentBySlug } from '@/lib/sheets'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 3600

// ---------- Types JSON-LD (sans any) ----------
type MonetaryAmountLD = {
  '@type': 'MonetaryAmount'
  value?: number | string
  currency?: string
}

type OfferShippingDetailsLD = {
  '@type': 'OfferShippingDetails'
  shippingRate?: MonetaryAmountLD
}

type MerchantReturnPolicyLD = {
  '@type': 'MerchantReturnPolicy'
  applicableCountry?: string
  returnPolicyCategory?: string
}

type OfferLD = {
  '@type': 'Offer'
  price?: number | string
  priceCurrency?: string
  availability?: string
  url?: string
  shippingDetails?: OfferShippingDetailsLD
  hasMerchantReturnPolicy?: MerchantReturnPolicyLD
}

type BrandLD = {
  '@type': 'Brand'
  name?: string
}

type ProductLD = {
  '@context': 'https://schema.org'
  '@type': 'Product'
  name?: string
  brand?: BrandLD
  description?: string
  category?: string
  url?: string
  image?: string | string[]
  offers?: OfferLD | OfferLD[]
}

// ---------- Helpers de typage / sanitation ----------
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function isProductLD(x: unknown): x is ProductLD {
  return (
    isRecord(x) &&
    (x['@type'] === 'Product' || x['@type'] === 'schema:Product') &&
    (x['@context'] === 'https://schema.org' || x['@context'] === 'http://schema.org')
  )
}

function normalizeCurrency(code?: string): string | undefined {
  if (!code) return undefined
  const c = code.trim().toUpperCase()
  // assure un code ISO 4217 (ex: EUR, USD…)
  return /^[A-Z]{3}$/.test(c) ? c : undefined
}

function ensureOfferArray(offers?: OfferLD | OfferLD[]): OfferLD[] | undefined {
  if (!offers) return undefined
  return Array.isArray(offers) ? offers : [offers]
}

function sanitizeProduct(input: ProductLD): ProductLD {
  const offers = ensureOfferArray(input.offers)?.map((o) => ({
    ...o,
    priceCurrency: normalizeCurrency(o.priceCurrency),
    availability: o.availability ?? 'http://schema.org/InStock',
  }))
  return {
    ...input,
    '@context': 'https://schema.org',
    '@type': 'Product',
    offers,
  }
}

// ---------- Page ----------
type Params = Promise<{ slug: string }>

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const content = await getContentBySlug(slug)

  if (!content) return notFound()

  const { title, html, schema } = content as {
    title: string
    html: string
    schema: unknown
  }

  // Construit le JSON-LD en sécurité, sans any
  let jsonLd: ProductLD | null = null
  if (isProductLD(schema)) {
    jsonLd = sanitizeProduct(schema)
  } else {
    // Fallback minimal si pas de schema dans le Sheet
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
    }
  }

  // Lien affilié (si présent dans le schema.offers)
  const offers = ensureOfferArray(jsonLd.offers)
  const affiliate =
    offers?.find((o) => typeof o.url === 'string' && o.url.length > 0)?.url ?? ''

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/">Accueil</Link> / <span className="text-gray-700">{title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

      {/* CTA affilié si dispo */}
      {affiliate && <AffiliateLink href={affiliate} className="mt-2" />}

      {/* Contenu HTML éditorial depuis le Sheet */}
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* JSON-LD Product proprement typé */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  )
}
