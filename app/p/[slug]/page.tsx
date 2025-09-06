import Link from 'next/link'
import { getContentBySlug, getTop10 } from '@/lib/sheets'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 1800

// ⚠️ Avec Next.js App Router (v15), params est un Promise.
// On "await" pour éviter l'erreur de typage vue précédemment.
type Params = Promise<{ slug: string }>

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params

  // Contenu (titre, HTML, schema déjà géré dans lib/sheets)
  const content = await getContentBySlug(slug)

  // Récupère l'affiliate URL depuis la liste Top10 (même logique que la page Top 10)
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

  return (
    <article className="prose prose-neutral max-w-none">
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

      {/* (Option futur) : si tu veux injecter du schema JSON-LD spécifique produit, on l’ajoutera ici */}
    </article>
  )
}
