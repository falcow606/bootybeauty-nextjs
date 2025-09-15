import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OffersClient from "@/components/OffersClient";
import type { Offer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata = {
  title: "Offres — Booty & Cutie",
  description: "Notre sélection de soins et bons plans beauté.",
};

type UnknownRecord = Record<string, unknown>;

function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function mapOffer(row: UnknownRecord): Offer {
  return {
    id: getStr(row, ["Product_ID", "ID", "id"]),
    productId: getStr(row, ["Product_ID", "ID", "id"]),
    slug: getStr(row, ["Slug", "slug"]),
    title: getStr(row, ["Title", "Nom", "name"]),
    brand: getStr(row, ["Marque", "Brand", "Marchand", "merchant"]),
    imageUrl: getStr(row, ["imageUrl", "Image_URL", "Image", "image", "image_url"]),
    price: getStr(row, ["Prix (€)", "Price", "price"]),
    affiliateUrl: getStr(row, ["Affiliate_URL", "FinalURL", "Url", "url"]),
    // httpStatus optionnel, on ne filtre pas dessus
  };
}

async function getAllOffers(): Promise<Offer[]> {
  // ✅ Fallback automatique : OFFERS → FEATURED
  const url = process.env.N8N_OFFERS_URL || process.env.N8N_FEATURED_URL;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const fetchInit: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }          // Preview: live
      : { headers, next: { revalidate: 1800 } };// Prod: ISR 30 min

  const res = await fetch(url, fetchInit);
  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const items: UnknownRecord[] = Array.isArray(json)
    ? (json as UnknownRecord[])
    : ((json as UnknownRecord)?.items as UnknownRecord[]) ||
      ((json as UnknownRecord)?.data as UnknownRecord[]) ||
      [];

  // Pas de filtres (tu m’as dit “peu de produits”)
  // On applique juste un tri doux pour la lisibilité
  items.sort((a, b) => {
    const at = (getStr(a, ["Title", "Nom", "name"]) ?? "").toLowerCase();
    const bt = (getStr(b, ["Title", "Nom", "name"]) ?? "").toLowerCase();
    return at.localeCompare(bt);
  });

  return items.map(mapOffer);
}

export default async function OffersPage() {
  const offers = await getAllOffers();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "var(--text)" }}>
          Nos offres sélectionnées
        </h1>
        <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "var(--text)" }}>
          Peu d’items, bien choisis. Transparence sur l’affiliation.
        </p>
      </header>

      {offers.length ? (
        <OffersClient items={offers} originSlug="offers" />
      ) : (
        <p className={`${nunito.className} opacity-80`} style={{ color: "var(--text)" }}>
          Aucune offre à afficher. Vérifie les variables <code>N8N_OFFERS_URL</code> ou <code>N8N_FEATURED_URL</code> dans Vercel.
        </p>
      )}
    </div>
  );
}
