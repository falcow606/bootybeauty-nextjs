import { getTop10 } from '@/lib/sheets'
import Link from 'next/link'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 3600

export default async function Top10Page() {
  const top = await getTop10()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl font-semibold">Top 10 Booty Beauty 2025</h1>
      <p className="text-gray-600">
        Sélection des soins les plus recherchés (transparence : certains liens sont affiliés).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {top.map((x, i) => (
          <div key={x.slug} className="rounded-2xl shadow-sm border p-6">
            <div className="text-sm text-gray-500">#{i + 1}</div>

            <h3 className="text-lg font-semibold mb-2">
              <Link href={`/p/${x.slug}`}>{x.title}</Link>
            </h3>

            <div className="space-x-3">
              {x.affiliate && (
                <AffiliateLink
                  href={x.affiliate}
                  merchant="Amazon"
                  slug={x.slug}
                  pos={i + 1}
                  className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90"
                >
                  Voir l’offre
                </AffiliateLink>
              )}

              <Link
                className="inline-flex items-center rounded-xl px-4 py-2 border text-sm hover:bg-gray-50"
                href={`/p/${x.slug}`}
              >
                Voir la fiche
              </Link>
            </div>
          </div>
        ))}

        {top.length === 0 && (
          <div className="text-sm text-gray-500">
            Aucun produit. On branche le Google Sheet maintenant.
          </div>
        )}
      </div>
    </div>
  )
}
