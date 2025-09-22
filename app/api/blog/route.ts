// app/api/blog/route.ts
import { NextResponse } from "next/server";

/** Vercel > Env: SHEETS_BLOG_CSV (URL "Publier sur le web" de l’onglet Blog) */
const CSV_URL = process.env.SHEETS_BLOG_CSV || "";

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
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
      } else if (ch === "\r") {
        // ignore CR
      } else if (ch === "\n") {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  // dernier champ / dernière ligne
  row.push(field.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, "_");
}
function strTrue(v: string | undefined): boolean {
  const s = (v || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "oui" || s === "yes";
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ItemRaw = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags: string[];         // toujours un tableau (évent. vide)
  published: boolean;
  bodyHtml?: string;
  bodyMd?: string;
};

type ItemPublic = Omit<ItemRaw, "published">;

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!CSV_URL) {
      return NextResponse.json({ ok: false, error: "SHEETS_BLOG_CSV missing" }, { status: 500 });
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
      return NextResponse.json([] satisfies ItemPublic[]);
    }

    const headers = table[0].map(normalizeHeader);

    const items: ItemRaw[] = table.slice(1).map((colsArr) => {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = colsArr[i] ?? "";
      });

      const title = row.title || row.titre || "";
      const subtitle = row.subtitle || row.sous_titre || "";
      const excerpt = row.excerpt || row.resume || row.chapo || "";
      const cover = row.cover || row.image || row.hero || "";
      const date = row.date || "";

      // tags : accepte séparateurs | ou ,
      const tagsRaw = row.tags || "";
      const tags = tagsRaw
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const slug = (row.slug || slugify(title)).trim();

      const bodyHtml =
        row.bodyhtml ||
        row.html ||
        row.corpshtml ||
        row.body_html ||
        row.articlehtml ||
        "";

      const bodyMd =
        row.bodymd ||
        row.body ||
        row.markdown ||
        row.corps ||
        row.content ||
        "";

      const published =
        strTrue(row.published) ||
        strTrue(row.publish) ||
        strTrue(row.is_published);

      const base: ItemRaw = {
        slug,
        title,
        subtitle,
        excerpt,
        cover,
        date,
        tags,           // toujours présent (potentiellement vide)
        published,
      };

      if (bodyHtml) return { ...base, bodyHtml };
      if (bodyMd) return { ...base, bodyMd };
      return base;
    });

    const filtered = all ? items : items.filter((it) => it.published);

    if (diag) {
      return NextResponse.json({
        ok: true,
        count: filtered.length,
        sample: filtered.slice(0, 3),
        headers,
      });
    }

    // Sortie publique : toujours fournir "tags" (tableau), pas de champ "published"
    const sanitized: ItemPublic[] = filtered.map((it) => ({
      slug: it.slug,
      title: it.title,
      subtitle: it.subtitle,
      excerpt: it.excerpt,
      cover: it.cover,
      date: it.date,
      tags: Array.isArray(it.tags) ? it.tags : [], // <= clé du fix
      bodyHtml: it.bodyHtml,
      bodyMd: it.bodyMd,
    }));

    return NextResponse.json(sanitized);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
