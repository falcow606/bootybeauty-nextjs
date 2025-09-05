import { getFeatured } from '@/lib/sheets'
import Link from 'next/link'

export default async function Home() {
  const items = await getFeatured()
  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-semibold">Comparatifs & Soins — Booty Beauty</h1>
      <p className="text-gray-600">Guides d’achat, fiches produits et comparatifs pour choisir les meilleurs soins.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((x) => (
          <Link key={x.slug} href={`/p/${x.slug}`} className="rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
            <h3 className="text-lg font-semibold">{x.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{__html: x.excerpt}} />
            <div className="mt-3 text-sm underline">Voir la fiche →</div>
          </Link>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-500">
            Aucune fiche pour l’instant. Ajoute des lignes dans ton Google Sheet (onglet <em>Content</em>) et publie-le en CSV (on le fait juste après).
          </div>
        )}
      </div>
    </div>
  )
}
// trigger build
