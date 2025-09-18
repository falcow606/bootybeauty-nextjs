// lib/sheets.ts
import Papa from "papaparse";

export type ContentRow = {
  slug: string;
  title?: string;
  subtitle?: string;
  image?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howTo?: string;
  rating?: number;
  brand?: string;
};

function slugify(input: string): string {
  const s = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "produit";
}

const ALIAS: Record<keyof ContentRow, string[]> = {
  slug: ["slug", "Slug"],
  title: ["title", "Title"],
  subtitle: ["subtitle", "Subtitle"],
  image: ["image","Image","Hero","Hero ","Hero_Image","Hero URL","Image_URL","Image URL","Hero URL"],
  intro: ["intro","Intro"],
  pros: ["pros","Pourquoi on aime","Avantages","Points positifs"],
  cons: ["cons","À noter","A noter","Points faibles"],
  howTo: ["how to","How to","How-to","Mode d'emploi","Mode d’utilisation","Mode d’utilisation "],
  rating: ["rating","Note globale (sur 5)","Note","Score"],
  brand: ["brand","Marque"]
};

function pick<T extends string>(row: Record<string, unknown>, keys: T[]): string | undefined {
  for (const k of keys) {
    const hit = Object.keys(row).find((kk) => kk.trim().toLowerCase() === k.trim().toLowerCase());
    if (hit) {
      const v = row[hit];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return undefined;
}
function toLines(v?: string): string[] | undefined {
  if (!v) return undefined;
  // accepte listes séparées par retours chariot, points ou puces
  const raw = v.replace(/\r/g, "\n");
  const parts = raw.split(/\n+|•\s*|-\s+/).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}
function toRating(v?: string): number | undefined {
  if (!v) return undefined;
  const num = Number(String(v).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(num) ? num : undefined;
}

export async function getContent(): Promise<ContentRow[]> {
  const url = process.env.SHEETS_CONTENT_CSV;
  if (!url) return [];
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();

  const parsed = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (!parsed.data?.length) return [];

  return parsed.data.map((row) => {
    const title = pick(row, ALIAS.title) ?? "";
    const slugCell = pick(row, ALIAS.slug);
    const slug = slugCell?.trim() || (title ? slugify(title) : "");

    const rec: ContentRow = {
      slug,
      title,
      subtitle: pick(row, ALIAS.subtitle),
      image: pick(row, ALIAS.image),
      intro: pick(row, ALIAS.intro),
      pros: toLines(pick(row, ALIAS.pros)),
      cons: toLines(pick(row, ALIAS.cons)),
      howTo: pick(row, ALIAS.howTo),
      rating: toRating(pick(row, ALIAS.rating)),
      brand: pick(row, ALIAS.brand),
    };
    return rec;
  }).filter(r => r.slug);
}

export async function getContentBySlug(slug: string): Promise<ContentRow | undefined> {
  const all = await getContent();
  const norm = slugify(slug);
  return all.find(r => slugify(r.slug) === norm);
}
