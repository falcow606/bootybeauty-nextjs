// app/api/offers/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.N8N_OFFERS_API
  if (!url) {
    return NextResponse.json({ error: 'N8N_OFFERS_API manquant' }, { status: 500 })
  }

  // Côté serveur => pas de CORS, pas de cache pour avoir toujours du frais
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    return NextResponse.json({ error: `Erreur n8n: ${res.status}` }, { status: 502 })
  }

  const data = (await res.json()) as any[]

  // (Optionnel) on filtre ici pour ne renvoyer que les offres valides
  const filtered = data.filter(o => o.affiliateUrl && o.httpStatus === 200)

  return NextResponse.json(filtered, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store', // toujours frais
    },
  })
}
