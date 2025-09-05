import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getContentBySlug } from '@/lib/sheets'

// Typage Next.js 15 : params est un Promise
type Params = Promise<{ slug: string }>

export async function generateMetadata(
  { params }: { params: Params }
): Promise<Metadata> {
  const { slug } = await params
  const content = await getContentBySlug(slug)
  return {
    title: content?.title ?? 'Fiche produit',
    description: content?.title
      ? `Découvrir ${content.title} — fiche produit Booty Beauty.`
      : 'Fiche produit Booty Beauty.',
  }
}

export default async function Page(
  { params }: { params: Params }
) {
  const { slug } = await params
  const content = await getContentBySlug(slug)
  if (!content) notFound()

  return (
    <article className="prose prose-neutral max-w-none">
      <h1 className="font-serif text-3xl mb-6">{content.title}</h1>

      {/* Contenu HTML issu du Google Sheet */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />

      {/* JSON-LD optionnel */}
      {content.schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(content.schema) }}
        />
      )}
    </article>
  )
}
