import { getContentBySlug } from '@/lib/sheets'
import type { Metadata } from 'next'

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getContentBySlug(params.slug)
  return {
    title: item?.title ?? 'Fiche produit',
    description: item?.title,
  }
}

export default async function ProductPage({ params }: Props) {
  const item = await getContentBySlug(params.slug)
  if (!item) return <div>Introuvable (slug incorrect ou CSV non publié).</div>

  return (
    <article className="prose prose-neutral max-w-none">
      <h1>{item.title}</h1>
      <section dangerouslySetInnerHTML={{ __html: item.html }} />
      {item.schema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item.schema) }} />
      )}
    </article>
  )
}
