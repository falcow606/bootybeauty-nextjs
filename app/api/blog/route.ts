// app/api/blog/route.ts
import { NextResponse } from "next/server";

/**
 * URL du CSV publié depuis Google Sheets (onglet Blog)
 * -> Vercel Project Settings > Environment Variables > SHEETS_BLOG_CSV
 */
const CSV_URL = process.env.SHEETS_BLOG_CSV || "";

// ---------------------------------------------------------------------------
// CSV PARSER ROBUSTE : gère guillemets, "" échappés, virgules et \n dans cellules
// ---------------------------------------------------------------------------
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // "" => guillemet littéral
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
        // ignore CR (géré avec LF)
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
  // si la dernière ligne n'est pas vide (au moins un champ non vide), on l'ajoute
  if (row.some((c) => c !== "")) {
    rows.push(row);
  }

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  tags: string[];
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
      return NextResponse.json(
        { ok: false, error: "SHEETS_BLOG_CSV missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";
    const diag = searchParams.get("diag") === "1";

    const res = await fetch(CSV_URL, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `CSV HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const text = await res.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      // Pas de données
      return NextResponse.json([] satisfies ItemPublic[]);
    }

    const headerKeys = table[0].map(normalizeHeader);

    const items: ItemRaw[] = table.slice(1).map((colsArr) => {
      const row: Record<string, string> = {};
      headerKeys.forEach((h, i) => (row[h] = colsArr[i] ?? ""));

      const title = row.title || row.titre || "";
      const subtitle = row.subtitle || row.sous_titre || "";
      const excerpt = row.excerpt || row.resume || row.chapo || "";
      const cover = row.cover || row.image || row.hero || "";
      const date = row.date || "";

      // tags séparés par | ou ,
      const tagsRaw = row.tags || "";
      const tags = tagsRaw
        .split(/[|,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      // Slug explicite ou dérivé du titre
      const slug = (row.slug || slugify(title)).trim();

      // Corps : conventions fréquentes
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

      // Publication
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
        tags,
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
        headers: headerKeys,
      });
    }

    // Sortie publique : recopier explicitement sans "published" (évite unused vars & any)
    const sanitized: ItemPublic[] = filtered.map((it) => {
      const out: ItemPublic = {
        slug: it.slug,
        title: it.title,
      };
      if (it.subtitle) out.subtitle = it.subtitle;
      if (it.excerpt) out.excerpt = it.excerpt;
      if (it.cover) out.cover = it.cover;
      if (it.date) out.date = it.date;
      if (it.tags && it.tags.length) out.tags = it.tags;
      if (it.bodyHtml) out.bodyHtml = it.bodyHtml;
      if (it.bodyMd) out.bodyMd = it.bodyMd;
      return out;
    });

    return NextResponse.json(sanitized);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
