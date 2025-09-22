// lib/sheets.ts
export type UnknownRecord = Record<string, string>;
export type OfferRow = {
  productId?: string;
  title?: string;
  brand?: string;
  imageUrl?: string;
  price?: string;
  affiliateUrl?: string;
  slug?: string;
};
export type ContentRow = {
  slug?: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  pros?: string;
  cons?: string;
  howto?: string;
  rating?: string;
};
export type BlogRow = {
  slug?: string;
  title?: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  html?: string;
  intro?: string;
  body?: string;
  date?: string;
  tags?: string;
  published?: string;
};

/* ---------------- Normalisation ultra tolérante ---------------- */

function normalizeKey(k: string): string {
  return (k || "")
    .replace(/\u00A0/g, " ") // NBSP -> espace
    .replace(/[–—]/g, "-")   // tirets typographiques -> "-"
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function normalizeText(v?: string): string {
  if (!v) return "";
  return v
    .replace(/\u00A0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .trim();
}
export function normalizeSlug(s: string): string {
  const t = normalizeText(s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return t || "";
}

/* ---------------- CSV parsing compatible ES2017 ---------------- */

function parseCSV(text: string): UnknownRecord[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const split = (line: string): string[] => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g; // virgules hors guillemets
    return line
      .split(re)
      .map(c => c.replace(/^"([\s\S]*)"$/, "$1").replace(/""/g, `"`));
  };
  const headerRaw = split(lines[0]).map(normalizeKey);
  const rows: UnknownRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const row: UnknownRecord = {};
    headerRaw.forEach((h, idx) => {
      row[h] = normalizeText(cols[idx] ?? "");
    });
    rows.push(row);
  }
  return rows;
}

/* ---------------- Fetch CSV (Sheets ou n8n) ---------------- */

async function fetchCSV(url?: string, headers: Record<string,string> = {}, revalidate = 600): Promise<UnknownRecord[]> {
  if (!url) return [];
  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate } };

  const res = await fetch(url, init);
  if (!res.ok) return [];

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await res.json();
    if (Array.isArray(j)) return j as UnknownRecord[];
    if (j?.items && Array.isArray(j.items)) return j.items as UnknownRecord[];
    if (j?.data && Array.isArray(j.data)) return j.data as UnknownRecord[];
    return [];
  }
  const text = await res.text();
  return parseCSV(text);
}

/* ---------------- Offers ---------------- */

export async function getOffers(): Promise<OfferRow[]> {
  const url = process.env.N8N_OFFERS_API || process.env.N8N_OFFERS_URL;
  const headers: Record<string,string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);
  const rows = await fetchCSV(url, headers, 900);

  const get = (r: UnknownRecord, keys: string[]) => {
    for (const k of keys) {
      const hit = r[normalizeKey(k)];
      if (typeof hit === "string" && hit.trim()) return hit.trim();
    }
    return "";
  };

  return rows.map(r => {
    const title = get(r, ["Title","Nom","name"]);
    const slug = normalizeSlug(get(r, ["Slug","slug"]) || title);
    return {
      productId: get(r, ["Product_ID","ID","id"]),
      title,
      brand: get(r, ["Marque","Brand","Marchand"]),
      imageUrl: get(r, ["imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image","Hero","Hero_Image","Hero URL","Image_Hero","Hero"]),
      price: get(r, ["Prix (€)","Price","price"]),
      affiliateUrl: get(r, [
        "FinalURL","finalUrl","affiliateUrl",
        "Affiliate_URL","Affiliate URL","Affiliate Link","Lien affilié","Lien","Lien_achat",
        "Product_URL","Product URL","URL produit","Amazon_URL","ASIN_URL","URL"
      ]),
      slug
    };
  });
}

/* ---------------- Content (fiche produit) ---------------- */

export async function getContent(): Promise<ContentRow[]> {
  const url = process.env.SHEETS_CONTENT_CSV;
  const rows = await fetchCSV(url, {}, 600);
  const get = (r: UnknownRecord, keys: string[]) => {
    for (const k of keys) {
      const hit = r[normalizeKey(k)];
      if (typeof hit === "string" && hit.trim()) return hit.trim();
    }
    return "";
  };
  return rows.map(r => ({
    slug: normalizeSlug(get(r, ["Slug","slug"]) || get(r,["Title","title"])),
    title: get(r, ["Title","title"]),
    subtitle: get(r, ["Subtitle","Sous-titre","Sous titre"]),
    hero: get(r, ["Hero","Hero_","Hero Image","Hero URL","Image","Cover"]),
    intro: get(r, ["Intro","intro","Description"]),
    pros: get(r, ["Pros","Pourquoi on aime","pourquoi on aime"]),
    cons: get(r, ["Cons","A noter","À noter"]),
    howto: get(r, ["How to","Howto","Comment l’utiliser","Comment l'utiliser"]),
    rating: get(r, ["Note globale (sur 5)","Note","rating"]),
  }));
}

export async function getContentBySlug(slugOrTitle: string): Promise<ContentRow | null> {
  const key = normalizeSlug(slugOrTitle);
  const rows = await getContent();
  let hit = rows.find(r => normalizeSlug(r.slug || "") === key);
  if (!hit) hit = rows.find(r => normalizeSlug(r.title || "") === key);
  return hit || null;
}

/* ---------------- Blog ---------------- */

export async function getBlogList(): Promise<BlogRow[]> {
  // >>> on passe par l’API unifiée si disponible
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (base) {
    try {
      const r = await fetch(`${base}/api/blog`, { cache: "no-store" });
      if (r.ok) return (await r.json()) as BlogRow[];
    } catch {}
  }
  // sinon lecture directe CSV
  const url = process.env.SHEETS_BLOG_CSV || process.env.N8N_BLOG_URL;
  const headers: Record<string,string> = {};
  if (process.env.N8N_BLOG_KEY) headers["x-api-key"] = String(process.env.N8N_BLOG_KEY);
  const rows = await fetchCSV(url, headers, 600);

  const get = (r: UnknownRecord, keys: string[]) => {
    for (const k of keys) {
      const hit = r[normalizeKey(k)];
      if (typeof hit === "string" && hit.trim()) return hit.trim();
    }
    return "";
  };
  const truthy = (v: string) => ["oui","yes","true","1","ok"].includes(v.trim().toLowerCase());

  return rows
    .map(r => ({
      slug: normalizeSlug(get(r,["slug","Slug"])),
      title: get(r,["title","Title"]),
      subtitle: get(r,["subtitle","Subtitle"]),
      excerpt: get(r,["excerpt","Intro","Description"]),
      cover: get(r,["cover","Cover","Hero","Image"]),
      date: get(r,["date","Date"]),
      tags: get(r,["tags","Tags"]),
      published: get(r,["published","Published"]),
    }))
    .filter(r => r.slug && r.title && truthy(r.published || "oui"));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogRow | null> {
  const list = await getBlogList();
  const key = normalizeSlug(slug);
  return list.find(p => normalizeSlug(p.slug || "") === key) || null;
}
