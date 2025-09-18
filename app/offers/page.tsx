// app/offers/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import React from "react";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OffersClient from "@/components/OffersClient";
import type { CardOffer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type UnknownRecord = Record<string, unknown>;

function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    const hit = Object.keys(obj).find((kk) => kk.trim().toLowerCase() === k.trim().toLowerCase());
    if (hit) {
      const v = obj[hit];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return undefined;
}

async function getOffers(): Promise<CardOffer[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const base = isProd && site ? site : vercelUrl || "";
  const href = `${base}/api/offers`;

  try {
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) return [];
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) return [];

    const items = (raw as UnknownRecord[]).map<CardOffer>((r) => ({
      productId: getStr(r, ["productId", "Product_ID", "ID", "id"]),
      title: getStr(r, ["title", "Title", "Nom", "name"]),
      brand: getStr(r, ["brand", "Marque", "Brand", "Marchand", "merchant"]),
      merchant: getStr(r, ["merchant", "Marchand", "Brand"]),
      price: (() => {
        const s = getStr(r, ["price", "Prix (€)"]);
        if (!s) return null;
        const num = Number(String(s).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, ""));
        return Number.isFinite(num) ? num : s;
      })(),
      affiliateUrl: getStr(r, [
        "FinalURL","finalUrl","affiliateUrl","url","URL","link",
        "Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
        "Lien affilié","Lien","Lien_achat","BuyLink","Buy Link",
        "Product_URL","Product URL","URL produit","Amazon_URL","ASIN_URL",
      ]),
      imageUrl: getStr(r, ["imageUrl","Image_URL","Image Url","image_url","Image","image"]),
      httpStatus: getStr(r, ["httpStatus","HTTPStatus"]),
    }));

    // ne garder que httpStatus === 200
    return items.filter((o) => String(o.httpStatus || "") === "200");
  } catch {
    return [];
  }
}

export default async function OffersPage() {
  const items = await getOffers();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>Toutes les offres</h1>
      <p className={`${nunito.className} mt-2 opacity-80`}>Sélection triée et tenue à jour.</p>

      {!items?.length ? (
        <p className="mt-6 rounded-2xl bg-[#FFF7F2] p-4 text-sm" style={{ color: "#8a4a3b" }}>
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
