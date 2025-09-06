// app/p/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getContentBySlug } from '@/lib/sheets'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 3600

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

  let jsonLd: ProductLD | null = null
  if (isProductLD(schema)) {
    jsonLd = sanitizeProduct(schema)
  } else {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
    }
  }

  const offers = ensureOfferArray(jsonLd.offers)
  const affiliate =
    offers?.find((o) => typeof o.url === 'string' && o.url.length > 0)?.url ?? ''

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/">Accueil</Link> / <span className="text-gray-700">{title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

      {/* CTA affilié si dispo (children requis) */}
      {affiliate && (
        <AffiliateLink
          href={affiliate}
          merchant="Amazon"
          slug={slug}
          pos="fiche"
          className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90"
        >
          Voir l’offre
        </AffiliateLink>
      )}

      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </div>
  )
}
