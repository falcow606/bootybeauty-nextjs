// app/offers/page.tsx
export const dynamic = 'force-dynamic' // pas de cache côté Next

import OfferCard from '@/components/OfferCard'

type Offer = {
  productId: string | number
  merchant: string | null
  price: string | number | null
  availability: string | null
  affiliateUrl: string | null
  commissionPct: string | number | null
  httpStatus: number | string | null
  lastChecked: string | null
}

async function getOffers(): Promise<Offer[]> {
  const url = process.env.N8N_OFFERS_API
  if (!url) throw new Error('Variable env N8N_OFFERS_API manquante (.env.local)')

  const res = await fetch(url, { cache: 'no-store' })
  const raw = await res.text()

  if (!res.ok) {
    throw new Error(`Erreur n8n ${res.status}: ${raw.slice(0, 200)}`)
  }

  let data: unknown
  try {
    data = raw ? JSON.parse(raw) : []
  } catch {
    throw new Error(`Réponse non-JSON de n8n. Début du corps: ${raw.slice(0, 200)}`)
  }

  const list = Array.isArray(data) ? (data as Offer[]) : []
  // ne garder que les offres prêtes (lien + 200)
  return list.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200')
}

export default async function OffersPage() {
  const offers = await getOffers()

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Offers</h1>

      {offers.length === 0 ? (
        <p>Aucune offre valide pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((o, i) => (
            <OfferCard key={String(o.productId)} offer={o} index={i} />
          ))}
        </div>
      )}
    </main>
  )
}



