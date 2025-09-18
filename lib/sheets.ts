// lib/sheets.ts
export type UnknownRecord = Record<string, unknown>;

export type Offer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  price?: number | string | null;
  affiliateUrl?: string;
  imageUrl?: string;
  httpStatus?: number | string;
  updatedAt?: string;
};

export type Content = {
  slug: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  pros?: string;
  cons?: string;
  howto?: string;
  rating?: number | null;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
};

function slugify(input: string): string {
  const s = (input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produit";
}

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

function truthy(v?: string): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}

function parseRating(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(5, n));
}

/** CSV parser simple et robuste (gère les quotes) */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => { cur.push(cell); cell = ""; };
  const pushRow = () => { rows.push(cur); cur = []; };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") pushCell();
      else if (ch === "\n") { pushCell(); pushRow(); }
      else if (ch === "\r") { /* ignore */ }
      else cell += ch;
    }
  }
  pushCell(); pushRow();
  if (rows.length && rows[rows.length - 1].every((c) => c === "")) rows.pop();
  return rows;
}

function tableToObjects(rows: string[][]): UnknownRecord[] {
  if (rows.length === 0) return [];
  const header = rows[0]?.map((h) => h?.trim()) ?? [];
  const out: UnknownRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const o: UnknownRecord = {};
    for (let c = 0; c < header.length; c++) o[header[c] || `col_${c}`] = r[c] ?? "";
    out.push(o);
  }
  return out;
}

async function absoluteBase(): Promise<string> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  return isProd && site ? site : vercelUrl || "";
}

/* =========================
   OFFERS
   ========================= */

export async function getOffers(): Promise<Offer[]> {
  const base = await absoluteBase();
  const href = `${base}/api/offers`;
  try {
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) return [];
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) return [];
    return (raw as UnknownRecord[]).map((r) => ({
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
        "Lien affilié","Lien","Lien_achat",
        "BuyLink","Buy Link",
        "Product_URL","Product URL","URL produit",
        "Amazon_URL","ASIN_URL",
      ]),
      imageUrl: getStr(r, ["imageUrl","Image_URL","Image Url","image_url","Image","image"]),
      httpStatus: getStr(r, ["httpStatus","HTTPStatus"]),
      updatedAt: getStr(r, ["UpdatedAt", "updatedAt", "LastChecked", "lastChecked"]),
    }));
  } catch {
    return [];
  }
}

export async function getFeatured(): Promise<Offer[]> {
  const url = process.env.N8N_FEATURED_URL || process.env.N8N_OFFERS_URL || "";
  try {
    if (url) {
      const headers: Record<string, string> = {};
      if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

      const fetchInit: RequestInit & { next?: { revalidate?: number } } =
        process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
          ? { headers, cache: "no-store" }
          : { headers, next: { revalidate: 1800 } };

      const res = await fetch(url, fetchInit);
      if (!res.ok) return [];
      const json = (await res.json()) as unknown;
      const items: UnknownRecord[] = Array.isArray(json)
        ? (json as UnknownRecord[])
        : ((json as UnknownRecord)?.items as UnknownRecord[]) ||
          ((json as UnknownRecord)?.data as UnknownRecord[]) ||
          [];

      const filtered = process.env.N8N_FEATURED_URL
        ? items
        : items.filter((r) =>
            truthy(getStr(r, ["Featured"])) ||
            truthy(getStr(r, ["A l affiche"])) ||
            truthy(getStr(r, ["Featured?"]))
          );

      filtered.sort((a, b) => {
        const ao = Number(getStr(a, ["Featured_Order", "featured_order"]) ?? "999");
        const bo = Number(getStr(b, ["Featured_Order", "featured_order"]) ?? "999");
        if (ao !== bo) return ao - bo;
        const ad = new Date(getStr(a, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
        const bd = new Date(getStr(b, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
        return bd - ad;
      });

      // map vers Offer
      const mapOffer = (row: UnknownRecord): Offer => ({
        productId: getStr(row, ["Product_ID", "ID", "id"]),
        title: getStr(row, ["Title", "Nom", "name"]),
        brand: getStr(row, ["Marque", "Brand", "Marchand"]),
        merchant: getStr(row, ["merchant", "Marchand", "Brand"]),
        imageUrl: getStr(row, [
          "imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image",
          "Hero","Hero_Image","Hero URL","Image_Hero","Hero "
        ]),
        price: getStr(row, ["Prix (€)", "Price", "price"]) || null,
        affiliateUrl: getStr(row, [
          "FinalURL","finalUrl","affiliateUrl","url","URL","link",
          "Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
          "Lien affilié","Lien","Lien_achat","BuyLink","Buy Link",
          "Product_URL","Product URL","URL produit","Amazon_URL","ASIN_URL"
        ]),
        httpStatus: getStr(row, ["httpStatus","HTTPStatus"]),
      });

      return filtered.slice(0, 3).map(mapOffer);
    }
  } catch {
    // ignore
  }

  // fallback: prendre 3 depuis /api/offers
  const list = await getOffers();
  return list.slice(0, 3);
}

/* =========================
   CONTENT (fiches)
   ========================= */

export async function getContent(): Promise<Content[]> {
  const csvUrl = process.env.SHEETS_CONTENT_CSV;
  if (!csvUrl) return [];
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCSV(text);
    const objs = tableToObjects(rows);
    return objs
      .map((r) => {
        const slug = getStr(r, ["Slug", "slug"]) || "";
        if (!slug) return null;
        const ratingStr = getStr(r, ["Note globale (sur 5)", "Note", "Rating", "Score"]) || undefined;
        return {
          slug,
          title: getStr(r, ["Title", "Titre", "Nom", "name"]),
          subtitle: getStr(r, ["Subtitle", "Sous-titre", "Sous titre"]),
          hero: getStr(r, ["Hero", "Hero Image", "Hero_URL", "Hero URL", "Image_Hero", "Hero_Image"]),
          intro: getStr(r, ["Intro", "Introduction"]),
          pros: getStr(r, ["Pros", "Pourquoi on aime"]),
          cons: getStr(r, ["Cons", "À noter", "A noter"]),
          howto: getStr(r, ["How to", "HowTo", "Utilisation", "Mode d'emploi"]),
          rating: parseRating(ratingStr),
        } as Content;
      })
      .filter((x): x is Content => Boolean(x));
  } catch {
    return [];
  }
}

export async function getContentBySlug(slug: string): Promise<Content | undefined> {
  const all = await getContent();
  return all.find((c) => c.slug === slug);
}

/* =========================
   BLOG (CSV simple)
   ========================= */

export async function getBlogPosts(): Promise<BlogPost[]> {
  const csvUrl = process.env.SHEETS_BLOG_CSV;
  if (!csvUrl) return [];
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCSV(text);
    const objs = tableToObjects(rows);
    return objs
      .map((r) => {
        const slug = getStr(r, ["Slug", "slug"]) || "";
        const title = getStr(r, ["Title", "Titre", "Nom"]) || "";
        if (!slug || !title) return null;
        const tagsStr = getStr(r, ["Tags", "Mots-clés"]) || "";
        return {
          slug,
          title,
          excerpt: getStr(r, ["Excerpt", "Intro", "Résumé"]),
          cover: getStr(r, ["Cover", "Image", "Hero"]),
          date: getStr(r, ["Date"]),
          tags: tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [],
        } as BlogPost;
      })
      .filter((x): x is BlogPost => Boolean(x));
  } catch {
    return [];
  }
}

/* =========================
   TOP 10 (stub safe)
   ========================= */

export async function getTop10(): Promise<Offer[]> {
  // Tu pourras remplacer par un vrai CSV/Workflow si besoin.
  return [];
}
