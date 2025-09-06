import Link from 'next/link'
import AffiliateLink from '@/components/AffiliateLink'
import { getContentBySlug } from '@/lib/sheets'

export const revalidate = 1800

type Params = Promise<{ slug: string }>

// Petite aide pour échapper le HTML => texte court pour la meta/description
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Optionnel : metadata dynamique (title par fiche)
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const data = await getContentBySlug(slug)
  const title = data?.title ?? 'Fiche produit'
  const description = data?.html ? stripHtml(data.html).slice(0, 160) : 'Fiche produit beauté'
  const canonical = `https://bootybeauty-nextjs.vercel.app/p/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Booty Beauty Project',
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const data = await getContentBySlug(slug)

  if (!data) {
    return (
      <div className="prose">
        <h1>Introuvable (slug incorrect ou CSV non publié).</h1>
        <Link href="/" className="text-blue-600 underline">← Retour à l’accueil</Link>
      </div>
    )
  }

  // --- Données de la fiche ---
  const title = data.title
  const html = data.html

  // On accepte des champs optionnels dans Schema_JSON du Google Sheet
  // Exemple attendu :
  // {
  //   "@type": "Product",
  //   "brand": {"@type":"Brand","name":"Sol de Janeiro"},
  //   "image":"https://…jpg",
  //   "price":"24.90",
  //   "priceCurrency":"EUR",
  //   "availability":"http://schema.org/InStock",
  //   "affiliate": "https://www.amazon.fr/…&tag=xxxxx"
  // }
  const schema = (data.schema || {}) as Record<string, unknown>

  const affiliate = (schema.affiliate as string | undefined) || undefined
  const image = (schema.image as string | undefined) || undefined
  const price = (schema.price as string | number | undefined)?.toString()
  const priceCurrency = (schema.priceCurrency as string | undefined) || undefined
  const availability =
    (schema.availability as string | undefined) || 'http://schema.org/InStock'
  const brandName =
    typeof schema.brand === 'object' && schema.brand && 'name' in (schema.brand as object)
      ? (schema.brand as { name?: string }).name
      : undefined

  // --- JSON-LD Product ---
  const canonical = `https://bootybeauty-nextjs.vercel.app/p/${slug}`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: stripHtml(html).slice(0, 500),
    category: 'Body Care',
    url: affiliate || canonical,
  }

  if (brandName) {
    jsonLd.brand = { '@type': 'Brand', name: brandName }
  }
  if (image) {
    jsonLd.image = [image]
  }
  // On ne met offers que si on a au moins prix + devise (sinon Google râle)
  if (affiliate && price && priceCurrency) {
    jsonLd.offers = {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability,
      url: affiliate,
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

      {/* CTA affilié si dispo */}
      {affiliate && (
        <AffiliateLink
          href={affiliate}
          className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90 mt-2"
        >
          Voir l’offre
        </AffiliateLink>
      )}

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
