import Link from 'next/link'
import { getContentBySlug, getTop10 } from '@/lib/sheets'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 1800

// Avec l'App Router (v15), params est un Promise : on attend et on typpe.
type Params = Promise<{ slug: string }>

// Petit helper pour une description propre depuis le HTML
function stripHtml(html = '') {
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return txt.slice(0, 300)
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params

  // Contenu (titre, HTML, éventuel schema JSON côté sheet)
  const content = await getContentBySlug(slug)

  // Récupère un lien d’affiliation (même logique que Top 10)
  const top = await getTop10()
  const affiliate = top.find((x) => x.slug === slug)?.affiliate || ''

  if (!content) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Introuvable (slug incorrect ou CSV non publié).</h1>
        <Link href="/" className="text-[#C4A092] underline">← Retour à l’accueil</Link>
      </div>
    )
  }

  // Domaine absolu pour le JSON-LD
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://bootybeauty-nextjs.vercel.app'

  // JSON-LD Product + BreadcrumbList
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: content.title,
    description: stripHtml(content.html),
    url: `${site}/p/${slug}`,
    // image: [...] // à ajouter plus tard si tu as une image produit
    offers: affiliate
      ? {
          '@type': 'Offer',
          url: affiliate,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: `${site}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Top 10',
        item: `${site}/top-10/booty-beauty-2025`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: content.title,
        item: `${site}/p/${slug}`,
      },
    ],
  }

  return (
    <article className="prose prose-neutral max-w-none">
      {/* JSON-LD SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className="mb-6">
        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">← Accueil</Link>
      </nav>

      <header className="mb-4">
        <h1 className="!mb-2">{content.title}</h1>
        <p className="text-sm text-gray-500">
          Transparence : certains liens sont affiliés (cela n’impacte pas ton prix).
        </p>
      </header>

      {/* CTA affilié (si dispo) */}
      {affiliate && (
        <div className="my-6">
          <AffiliateLink
            href={affiliate}
            merchant="Amazon"
            slug={slug}
            pos="fiche"
            className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90"
          >
            Voir l’offre
          </AffiliateLink>
        </div>
      )}

      {/* Contenu HTML provenant du Google Sheet */}
      <section
        className="space-y-4"
        dangerouslySetInnerHTML={{ __html: content.html || '' }}
      />

      {/* Lien bas de page */}
      <div className="mt-10">
        <Link href="/top-10/booty-beauty-2025" className="text-[#C4A092] underline">
          ← Revenir au Top 10
        </Link>
      </div>
    </article>
  )
}
