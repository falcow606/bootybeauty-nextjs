export const dynamic = "force-dynamic";

import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OffersClient from "@/components/OffersClient";
import type { Offer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export const metadata = {
  title: "Offres — Booty & Cutie",
  description: "Notre sélection de soins et bons plans beauté.",
};

type UnknownRecord = Record<string, unknown>;

/* ===================== utils (sans any) ===================== */
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
function normalizeStr(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}

/** Renvoie le premier tableau trouvé dans un JSON, même imbriqué */
function firstArray(json: unknown): UnknownRecord[] {
  if (Array.isArray(json)) return json as UnknownRecord[];
  if (json && typeof json === "object") {
    const obj = json as UnknownRecord;
    const candidates = ["items", "data", "result", "rows", "records", "list", "values", "results"];
    for (const key of candidates) {
      const v = obj[key];
      if (Array.isArray(v)) return v as UnknownRecord[];
    }
    // recherche en sous-objets (profondeur 1)
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (v && typeof v === "object") {
        const sub = v as UnknownRecord;
        for (const key of candidates) {
          const vv = sub[key];
          if (Array.isArray(vv)) return vv as UnknownRecord[];
        }
      }
    }
  }
  return [];
}

/** Petit parseur CSV (gère guillemets + , ou ;) */
function parseCSV(text: string): UnknownRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return [];

  const head = lines[0];
  const comma = (head.match(/,/g) || []).length;
  const semi = (head.match(/;/g) || []).length;
  const delim = semi > comma ? ";" : ",";

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"'; // \"\" -> "
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delim && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.replace(/^"(.*)"$/, "$1"));
  };

  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows: UnknownRecord[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = splitLine(lines[li]);
    const row: UnknownRecord = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

/** Map générique -> Offer */
function mapOffer(row: UnknownRecord): Offer {
  return {
    id: getStr(row, ["Product_ID", "product_id", "productId", "ID", "id"]),
    productId: getStr(row, ["Product_ID", "product_id", "productId", "ID", "id"]),
    slug: getStr(row, ["Slug", "slug"]),
    title: getStr(row, ["Title", "Nom", "name", "title"]),
    brand: getStr(row, ["Marque", "Brand", "Marchand", "merchant", "brand"]),
    imageUrl: getStr(row, ["imageUrl", "Image_URL", "Image Url", "Image URL", "image_url", "Image", "image"]),
    price: getStr(row, ["Prix (€)", "Prix€", "Prix", "Price", "price"]),
    affiliateUrl: getStr(row, [
      "Affiliate_URL",
      "Affiliate Url",
      "Affiliate URL",
      "FinalURL",
      "Final URL",
      "Url",
      "URL",
      "url",
      "link",
    ]),
    httpStatus: getStr(row, ["httpStatus", "status", "code"]),
  };
}

/* ================ fetch des offres (multi-sources) ================ */
async function getAllOffers(): Promise<Offer[]> {
  // Ordre d’essai : OFFERS_URL → OFFERS_API → FEATURED_URL → SHEETS_OFFERS_CSV
  const sources = [
    { url: process.env.N8N_OFFERS_URL, needsKey: true },
    { url: process.env.N8N_OFFERS_API, needsKey: true },
    { url: process.env.N8N_FEATURED_URL, needsKey: true },
    { url: process.env.SHEETS_OFFERS_CSV, needsKey: false },
  ].filter((s) => !!s.url) as { url: string; needsKey: boolean }[];

  const baseHeaders: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) baseHeaders["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const baseInit: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { cache: "no-store" } // Preview : pas de cache (live)
      : { next: { revalidate: 1800 } }; // Prod : ISR 30 min

  for (const src of sources) {
    try {
      const init: RequestInit & { next?: { revalidate?: number } } = { ...baseInit };
      if (src.needsKey && baseHeaders["x-api-key"]) init.headers = baseHeaders;

      const res = await fetch(src.url, init);
      if (!res.ok) continue;

      const ct = normalizeStr(res.headers.get("content-type")).toLowerCase();
      let rows: UnknownRecord[] = [];

      if (ct.includes("application/json") || ct.includes("application/vnd.api+json") || ct.includes("text/json")) {
        const json = (await res.json()) as unknown;
        rows = firstArray(json);
      } else {
        const text = await res.text();
        const t = text.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
          const json = JSON.parse(t) as unknown;
          rows = firstArray(json);
        } else {
          rows = parseCSV(text);
        }
      }

      if (!rows.length) continue;

      // Tri léger A→Z par titre (peu de produits)
      rows.sort((a, b) => {
        const at = (getStr(a, ["Title", "Nom", "name", "title"]) ?? "").toLowerCase();
        const bt = (getStr(b, ["Title", "Nom", "name", "title"]) ?? "").toLowerCase();
        return at.localeCompare(bt);
      });

      return rows.map(mapOffer);
    } catch {
      // essaye la source suivante
      continue;
    }
  }

  return [];
}

/* ============================ Page ============================ */
export default async function OffersPage() {
  const offers = await getAllOffers();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "var(--text)" }}>
          Nos offres sélectionnées
        </h1>
        <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "var(--text)" }}>
          Peu d’items, bien choisis.
        </p>
      </header>

      {offers.length ? (
        <OffersClient items={offers} originSlug="offers" />
      ) : (
        <p className={`${nunito.className} opacity-80`} style={{ color: "var(--text)" }}>
          Aucune offre à afficher. Renseigne au moins l’une de ces variables :
          <code className="mx-1">N8N_OFFERS_URL</code> /
          <code className="mx-1">N8N_OFFERS_API</code> /
          <code className="mx-1">N8N_FEATURED_URL</code> /
          <code className="mx-1">SHEETS_OFFERS_CSV</code>.
        </p>
      )}
    </div>
  );
}
