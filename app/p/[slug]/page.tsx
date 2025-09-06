import type { Metadata } from 'next'
import Link from 'next/link'
import { getContentBySlug } from '@/lib/sheets'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 1800

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const data = await getContentBySlug(slug)
  if (!data) return { title: 'Introuvable' }
  return {
    title: data.title,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title: data.title,
      url: `/p/${slug}`,
      type: 'article',
      images: data.image ? [{ url: data.image }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const data = await getContentBySlug(slug)
  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Introuvable (slug incorrect ou CSV non publié).</h1>
        <p className="mt-2 text-sm text-gray-500">Veuillez vérifier la source de contenu.</p>
      </div>
    )
  }

  const { title, html, image, brand, price, currency, availability, affiliate, schema } = data

  // Base JSON-LD construit depuis les colonnes — on fusionne ensuite avec Schema_JSON si présent
  const productFromColumns: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    image,
    brand: brand ? { '@type': 'Brand', name: brand } : undefined,
    offers:
      price && currency
        ? {
            '@type': 'Offer',
            price,
            priceCurrency: currency,
            availability: availability || 'https://schema.org/InStock',
            url: affiliate || undefined,
          }
        : undefined,
  }

  // Fusion simple (les colonnes priment si elles existent)
  const jsonLd: Record<string, unknown> = {
    ...(schema as Record<string, unknown> | undefined),
    ...productFromColumns,
    // pour éviter d’écraser “offers” par une version vide :
    ...(schema?.offers || productFromColumns.offers
      ? {
          offers: {
            ...(schema?.offers as Record<string, unknown> | undefined),
            ...(productFromColumns.offers as Record<string, unknown> | undefined),
          },
        }
      : {}),
  }

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500">
        <Link href="/">Accueil</Link> &nbsp;/&nbsp; <span>Fiche produit</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

      {/* Bloc visuel + meta produit si fournis */}
      {(image || brand || price) && (
        <div className="flex items-start gap-6">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={title}
              className="w-40 h-40 object-cover rounded-2xl border"
              loading="eager"
              width={160}
              height={160}
            />
          )}
          <div className="space-y-1 text-sm">
            {brand && (
              <div>
                <span className="text-gray-500">Marque :</span> <strong>{brand}</strong>
              </div>
            )}
            {price && currency && (
              <div>
                <span className="text-gray-500">Prix indicatif :</span>{' '}
                <strong>
                  {price} {currency}
                </strong>
              </div>
            )}
            {availability && (
              <div className="text-gray-500">
                Disponibilité : {availability.replace('https://schema.org/', '')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA affilié si dispo */}
      {affiliate && <AffiliateLink href={affiliate} className="mt-2" label="Voir l’offre" />}

      {/* Contenu HTML éditorial depuis le Sheet */}
      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* JSON-LD Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
