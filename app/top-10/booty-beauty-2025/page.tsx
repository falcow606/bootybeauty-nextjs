// app/top-10/booty-beauty-2025/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

type Offer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  price?: number | string | null;
  affiliateUrl?: string;
  imageUrl?: string;
};

function euro(p: number | string | null | undefined): string {
  if (p == null) return "";
  const num = Number(String(p).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" : String(p);
}

async function getOffers(): Promise<Offer[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const href = isProd && base ? `${base}/api/offers` : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""}/api/offers`;

  try {
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    return Array.isArray(data) ? (data as Offer[]) : [];
  } catch {
    return [];
  }
}

export default async function Top10Page() {
  const all = await getOffers();
  const picks = all.slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className={`${bodoni.className} text-4xl`}>Top 10 Booty & Cutie — 2025</h1>
      <p className={`${nunito.className} mt-3 opacity-80`}>
        Notre sélection des meilleurs produits du moment. Liens affiliés possibles.
      </p>

      <ol className="mt-8 grid gap-6 md:grid-cols-2">
        {picks.map((o, i) => (
          <li key={`${o.productId}-${i}`} className="rounded-3xl bg-white p-4 shadow">
            <div className="flex gap-4">
              <div className="w-28 shrink-0">
                <Image
                  src={o.imageUrl || "/images/product-placeholder.jpg"}
                  alt={o.title || "Produit"}
                  width={400}
                  height={400}
                  unoptimized
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className={`${bodoni.className} text-xl`}>{o.title || "Produit"}</h3>
                <p className={`${nunito.className} text-sm opacity-70`}>
                  {o.brand || o.merchant || ""}
                </p>
                <div className="mt-2 text-base font-medium">{euro(o.price)}</div>
                <div className="mt-3 flex gap-2">
                  {o.affiliateUrl ? (
                    <Link
                      href={o.affiliateUrl}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className="rounded-2xl bg-[#C4A092] px-4 py-2 text-white"
                    >
                      Voir l’offre
                    </Link>
                  ) : null}
                  <Link href="/offers" className="rounded-2xl border px-4 py-2">
                    Toutes les offres
                  </Link>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
