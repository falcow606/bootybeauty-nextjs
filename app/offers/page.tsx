import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OffersClient from "@/components/OffersClient";
import type { Offer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata = {
  title: "Offres — Booty & Cutie",
  description: "Notre sélection de soins et bons plans beauté (peu d’items, triés avec soin).",
};

type UnknownRecord = Record<string, unknown>;

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}

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
    httpStatus: getStr(row, ["httpStatus", "status"]),
  };
}

async function getAllOffers(): Promise<Offer[]> {
  const url = process.env.N8N_OFFERS_URL;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const fetchInit: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }         // Preview: live
      : { headers, next: { revalidate: 1800 } }; // Prod: ISR 30 min

  const res = await fetch(url, fetchInit);
  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const items: UnknownRecord[] = Array.isArray(json)
    ? (json as UnknownRecord[])
    : ((json as UnknownRecord)?.items as UnknownRecord[]) ||
      ((json as UnknownRecord)?.data as UnknownRecord[]) ||
      [];

  // on garde peu de produits → pas de filtres, juste un tri doux:
  // 1) Featured_Order si présent, 2) UpdatedAt desc, 3) Title asc
  items.sort((a, b) => {
    const ao = Number(getStr(a, ["Featured_Order", "featured_order"]) ?? "999");
    const bo = Number(getStr(b, ["Featured_Order", "featured_order"]) ?? "999");
    if (ao !== bo) return ao - bo;
    const ad = new Date(getStr(a, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
    const bd = new Date(getStr(b, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
    if (ad !== bd) return bd - ad;
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
          peu d’items, bien choisis. Mise à jour régulière, transparence sur l’affiliation.
        </p>
      </header>

      {offers.length ? (
        <OffersClient items={offers} originSlug="offers" />
      ) : (
        <p className={`${nunito.className} opacity-80`} style={{ color: "var(--text)" }}>
          Aucune offre pour le moment.
        </p>
      )}
    </div>
  );
}
