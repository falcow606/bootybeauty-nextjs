import Link from 'next/link'
import AffiliateLink from '@/components/AffiliateLink'
import { getContentBySlug } from '@/lib/sheets'

export const revalidate = 1800

type Params = Promise<{ slug: string }>

// Transforme du HTML en texte court (meta/description)
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Nettoie/valide un prix -> "24.90"
function normalizePrice(input?: unknown): string | undefined {
  if (input == null) return undefined
  const s = String(input).replace(',', '.').trim()
  const n = Number(s)
  if (Number.isFinite(n) && n > 0) return n.toFixed(2)
  return undefined
}

// Normalise une devise en ISO 4217 (EUR/GBP/USD…), par défaut EUR
function normalizeCurrency(input?: unknown): string {
  const s = String(input || '').trim().toUpperCase()
  if (/^[A-Z]{3}$/.test(s)) return s
  return 'EUR'
}

// -------------------- Metadata dynamique --------------------
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

// -------------------- Page Produit --------------------
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

  const title = data.title
  const html = data.html

  // Les champs optionnels viennent de Schema_JSON dans Google Sheet
  // Exemple conseillé :
  // {
  //   "@type": "Product",
  //   "brand": {"@type":"Brand","name":"Sol de Janeiro"},
  //   "image":"https://…jpg",
  //   "price":"24.90",
  //   "priceCurrency":"EUR",
  //   "availability":"https://schema.org/InStock",
  //   "affiliate": "https://www.amazon.fr/…&tag=xxxxx"
  // }
  const schema = (data.schema || {}) as Record<string, unknown>

  const affiliate = (schema['affiliate'] as string | undefined) || undefined
  const image = (schema['image'] as string | undefined) || undefined
  const price = normalizePrice(schema['price'])
  const priceCurrency = normalizeCurrency(schema['priceCurrency'])
  const availability =
    (typeof schema['availability'] === 'string' && schema['availability'].startsWith('http'))
      ? (schema['availability'] as string)
      : 'https://schema.org/InStock'

  // Récupère la marque si fournie
  let brandName: string | undefined
  const brand = schema['brand']
  if (brand && typeof brand === 'object' && 'name' in (brand as Record<string, unknown>)) {
    const n = (brand as Record<string, unknown>)['name']
    if (typeof n === 'string' && n.trim()) brandName = n.trim()
  }

  // -------------------- JSON-LD Product --------------------
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
    jsonLd['brand'] = { '@type': 'Brand', name: brandName }
  }
  if (image) {
    jsonLd['image'] = [image]
  }

  // ✅ Ajoute OFFERS dès qu’on a un lien affilié + un prix valide
  if (affiliate && price) {
    jsonLd['offers'] = {
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
        // pas d'@ts-expect-error nécessaire ici
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
