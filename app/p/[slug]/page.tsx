import Link from 'next/link'
import AffiliateLink from '@/components/AffiliateLink'
import { getContentBySlug } from '@/lib/sheets'

export const revalidate = 1800

type Params = Promise<{ slug: string }>

// --- Utils ---
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}
function normalizePrice(input?: unknown): string | undefined {
  if (input == null) return undefined
  const s = String(input).replace(',', '.').trim()
  const n = Number(s)
  if (Number.isFinite(n) && n > 0) return n.toFixed(2)
  return undefined
}
function normalizeCurrency(input?: unknown): string {
  const s = String(input || '').trim().toUpperCase()
  return /^[A-Z]{3}$/.test(s) ? s : 'EUR'
}

// --- Metadata dynamique ---
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

// --- Page Produit ---
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
  const schema = (data.schema || {}) as Record<string, unknown>

  // 1) Lecture "à plat"
  let affiliate = (schema['affiliate'] as string | undefined) || undefined
  const image = (schema['image'] as string | undefined) || undefined
  let price = normalizePrice(schema['price'])
  let priceCurrency = normalizeCurrency(schema['priceCurrency'])
  let availability =
    typeof schema['availability'] === 'string' && schema['availability'].startsWith('http')
      ? (schema['availability'] as string)
      : 'https://schema.org/InStock'

  // Marque (si présente)
  let brandName: string | undefined
  const brand = schema['brand']
  if (brand && typeof brand === 'object' && 'name' in (brand as Record<string, unknown>)) {
    const n = (brand as Record<string, unknown>)['name']
    if (typeof n === 'string' && n.trim()) brandName = n.trim()
  }

  // 2) Lecture d'un bloc "offers" fourni dans Schema_JSON
  const offersInSchema = schema['offers'] as Record<string, unknown> | undefined
  if (offersInSchema && typeof offersInSchema === 'object') {
    // Si l’URL n’est pas encore définie, on prend celle d’offers
    if (!affiliate && typeof offersInSchema['url'] === 'string') {
      affiliate = offersInSchema['url'] as string
    }
    // On laisse la priorité aux champs d’offers si fournis
    if (offersInSchema['price'] != null) {
      price = normalizePrice(offersInSchema['price'])
    }
    if (offersInSchema['priceCurrency'] != null) {
      priceCurrency = normalizeCurrency(offersInSchema['priceCurrency'])
    }
    if (typeof offersInSchema['availability'] === 'string' && offersInSchema['availability'].startsWith('http')) {
      availability = offersInSchema['availability'] as string
    }
  }

  // 3) Construction du JSON-LD
  const canonical = `https://bootybeauty-nextjs.vercel.app/p/${slug}`
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: stripHtml(html).slice(0, 500),
    category: 'Body Care',
    url: affiliate || canonical, // si affilié, Google apprécie d’avoir l’URL d’achat
  }
  if (brandName) jsonLd['brand'] = { '@type': 'Brand', name: brandName }
  if (image) jsonLd['image'] = [image]

  // ✅ On met OFFERS dans tous les cas où on a un lien d’achat (affiliate ou offers.url)
  //    – si pas de prix en base, on met un fallback "0.00" + "EUR" (Google arrête d’exiger offers)
  if (affiliate) {
    jsonLd['offers'] = {
      '@type': 'Offer',
      url: affiliate,
      price: price || '0.00',
      priceCurrency: priceCurrency || 'EUR',
      availability: availability || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

      {affiliate && (
        <AffiliateLink
          href={affiliate}
          className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90 mt-2"
        >
          Voir l’offre
        </AffiliateLink>
      )}

      <article
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
