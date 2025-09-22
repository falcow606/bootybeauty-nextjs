// app/api/content/route.ts
import { NextResponse } from "next/server";

/** Vercel/Local ENV: SHEETS_CONTENT_CSV = URL CSV "Publier sur le web" (onglet Content) */
const CSV_URL = process.env.SHEETS_CONTENT_CSV || "";

/** Parser CSV robuste (guillemets, "" échappés, virgules et sauts de ligne dans cellules) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field.trim()); field = ""; }
      else if (ch === "\r") { /* ignore */ }
      else if (ch === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
      else { field += ch; }
    }
  }
  row.push(field.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/\s+/g, "_");
}
function strTrue(v: string | undefined): boolean {
  const s = (v || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "oui" || s === "yes";
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ContentItemRaw = {
  slug: string;
  title: string;
  brand?: string;
  hero?: string;
  pros: string[];
  cons: string[];
  howto?: string;
  bodyHtml?: string;
  bodyMd?: string;
  rating?: number;
  subtitle?: string;
  excerpt?: string;
  published: boolean;
};
type ContentItemPublic = Omit<ContentItemRaw, "published">;

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!CSV_URL) {
      return NextResponse.json({ ok: false, error: "SHEETS_CONTENT_CSV missing" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    const diag = searchParams.get("diag") === "1";

    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `CSV HTTP ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      return NextResponse.json([] satisfies ContentItemPublic[]);
    }

    const headers = table[0].map(normalizeHeader);

    // Si aucune colonne de publication n'existe, on publie par défaut
    const hasPublishCol = headers.some((h) =>
      ["published", "publish", "is_published", "status", "etat"].includes(h)
    );

    const items: ContentItemRaw[] = table.slice(1).map((cols) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cols[i] ?? ""));

      const title    = row.title || row.nom || "";
      const brand    = row.brand || row.marque || "";
      const hero     = row.hero || row.image || "";
      const subtitle = row.subtitle || row.sous_titre || "";
      const excerpt  = row.excerpt || row.intro || "";

      const slug = (row.slug || slugify(title)).trim();

      // Note: accepte "note_globale_(sur_5)" (entête vu dans ton diag)
      const ratingRaw =
        row.rating ||
        row.note ||
        row["note_globale_(sur_5)"];
      const rating = ratingRaw ? parseFloat(ratingRaw.replace(",", ".")) : NaN;

      const pros = (row.pros || row.avantages || "")
        .split(/\n|\|/)
        .map((s) => s.trim())
        .filter(Boolean);

      const cons = (row.cons || row.inconvenients || "")
        .split(/\n|\|/)
        .map((s) => s.trim())
        .filter(Boolean);

      const howto =
        row.howto ||
        row.how_to ||
        row.routine ||
        row.conseils ||
        "";

      const bodyHtml =
        row.bodyhtml ||
        row.html ||
        row.corpshtml ||
        "";

      const bodyMd =
        row.bodymd ||
        row.body ||
        row.corps ||
        row.content ||
        "";

      // Publication : si la colonne est absente → TRUE par défaut
      let published = hasPublishCol
        ? (
            strTrue(row.published) ||
            strTrue(row.publish) ||
            strTrue(row.is_published) ||
            ["published", "online", "live", "publié", "publie"].includes(
              (row.status || row.etat || "").trim().toLowerCase()
            )
          )
        : true;

      const base: ContentItemRaw = {
        slug,
        title,
        brand: brand || undefined,
        hero: hero || undefined,
        subtitle: subtitle || undefined,
        excerpt: excerpt || undefined,
        pros,
        cons,
        howto: howto || undefined,
        rating: Number.isFinite(rating) ? rating : undefined,
        published,
      };

      if (bodyHtml) return { ...base, bodyHtml };
      if (bodyMd)   return { ...base, bodyMd };
      return base;
    });

    const filtered = all ? items : items.filter((i) => i.published);

    if (diag) {
      return NextResponse.json({
        ok: true,
        count: filtered.length,
        sample: filtered.slice(0, 3),
        headers,
      });
    }

    const sanitized: ContentItemPublic[] = filtered.map((it) => ({
      slug: it.slug,
      title: it.title,
      brand: it.brand,
      hero: it.hero,
      subtitle: it.subtitle,
      excerpt: it.excerpt,
      pros: Array.isArray(it.pros) ? it.pros : [],
      cons: Array.isArray(it.cons) ? it.cons : [],
      howto: it.howto,
      bodyHtml: it.bodyHtml,
      bodyMd: it.bodyMd,
      rating: it.rating,
    }));

    return NextResponse.json(sanitized);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
