export const dynamic = "force-dynamic";

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

function getVal(obj: UnknownRecord, keys: string[]): unknown {
  for (const k of keys) {
    if (k in obj) return obj[k];
  }
  return undefined;
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  const v = getVal(obj, keys);
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

/** Récupère le premier tableau pertinent où qu’il se cache */
function getFirstArray(json: unknown): UnknownRecord[] {
  if (Array.isArray(json)) return json as UnknownRecord[];
  if (json && typeof json === "object") {
    const obj = json as UnknownRecord;

    // chemins classiques
    const directKeys = ["items","data","result","rows","records","list","values"];
    for (const k of directKeys) {
      const v = obj[k];
      if (Array.isArray(v)) return v as UnknownRecord[];
    }

    // recherche dans sous-objets (ex: { result: { items: [...] } })
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (v && typeof v === "object") {
        const sub = v as UnknownRecord;
        for (const k of directKeys) {
          const vv = sub[k];
          if (Array.isArray(vv)) return vv as UnknownRecord[];
        }
      }
    }
  }
  return [];
}

function mapOffer(row: UnknownRecord): Offer {
  return {
    id: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    productId: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    slug: getStr(row, ["Slug","slug"]),
    title: getStr(row, ["Title","Nom","name","title"]),
    brand: getStr(row, ["Marque","Brand","Marchand","merchant","brand"]),
    imageUrl: getStr(row, ["imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image"]),
    price: getStr(row, ["Prix (€)","Prix€","Prix","Price","price"]),
    affiliateUrl: getStr(row, ["Affiliate_URL","Affiliate Url","Affiliate URL","FinalURL","Final URL","Url","URL","url","link"]),
    httpStatus: getStr(row, ["httpStatus","status","code"]),
  };
}

async function getAllOffers(): Promise<Offer[]> {
  // ✅ Fallback auto : N8N_OFFERS_URL → N8N_FEATURED_URL
  const url = process.env.N8N_OFFERS_URL || process.env.N8N_FEATURED_URL;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  // Preview: live (no-store) / Prod: ISR 30 min
  const fetchInit: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate: 1800 } };

  const res = await fetch(url, fetchInit);
  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const rows = getFirstArray(json);

  // Tri doux : titre A→Z (peu de produits)
  rows.sort((a, b) => {
    const at = (getStr(a, ["Title","Nom","name","title"]) ?? "").toLowerCase();
    const bt = (getStr(b, ["Title","Nom","name","title"]) ?? "").toLowerCase();
    return at.localeCompare(bt);
  });

  return rows.map(mapOffer);
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
          Aucune offre à afficher. Vérifie l’endpoint défini dans <code>N8N_OFFERS_URL</code> ou <code>N8N_FEATURED_URL</code>.
        </p>
      )}
    </div>
  );
}
