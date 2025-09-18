// app/offers/page.tsx
export const revalidate = 900;
export const runtime = "nodejs";

import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OffersClient from "@/components/OffersClient";
import type { CardOffer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

async function fetchOffers(): Promise<CardOffer[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";
  const res = await fetch(`${base}/api/offers`, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const arr = (await res.json()) as unknown;
  const list = Array.isArray(arr) ? arr : [];
  // map propre (sans any)
  return list.map((o) => ({
    productId: (o as Record<string, unknown>)["productId"] as string | undefined,
    slug: (o as Record<string, unknown>)["slug"] as string | undefined,
    title: (o as Record<string, unknown>)["title"] as string | undefined,
    brand: (o as Record<string, unknown>)["brand"] as string | undefined,
    price: (o as Record<string, unknown>)["price"] as number | string | null,
    imageUrl: (o as Record<string, unknown>)["imageUrl"] as string | undefined,
    affiliateUrl: (o as Record<string, unknown>)["affiliateUrl"] as string | undefined,
    merchant: (o as Record<string, unknown>)["merchant"] as string | undefined,
    httpStatus: (o as Record<string, unknown>)["httpStatus"] as number | string | null,
  })) as CardOffer[];
}

export default async function OffersPage() {
  const items = await fetchOffers();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      <h1 className={`${bodoni.className} text-3xl`} style={{ color: "var(--text)" }}>
        Toutes les offres
      </h1>
      <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "var(--text)" }}>
        Sélection mise à jour régulièrement.
      </p>

      {items.length === 0 ? (
        <p className="mt-6 rounded-xl bg-[var(--bg-main)] p-4">
          Aucune offre à afficher. Vérifie les variables <code>N8N_OFFERS_URL</code> / <code>N8N_OFFERS_API</code> (et la clé) sur Vercel.
        </p>
      ) : (
        <div className="mt-6">
          <OffersClient items={items} />
        </div>
      )}
    </div>
  );
}
