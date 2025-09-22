// app/api/blog/route.ts
import { NextResponse } from "next/server";

/**
 * URL du CSV publié depuis Google Sheets (onglet Blog)
 * -> Vercel Project Settings > Environment Variables > SHEETS_BLOG_CSV
 */
const CSV_URL = process.env.SHEETS_BLOG_CSV || "";

// ---- Helpers CSV ------------------------------------------------------------

/** Découpe une ligne CSV en tenant compte des guillemets et des virgules échappées */
function splitCsvLine(line: string): string[] {
  const parts: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Double guillemet = guillemet échappé
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts.map((s) => s.trim());
}

/** Normalise les entêtes : minuscules + underscores */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, "_");
}

/** Détermine si une chaîne représente le booléen vrai */
function strTrue(v: string | undefined): boolean {
  const s = (v || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "oui" || s === "yes";
}

/** Slugify simple (accents, ponctuation, espaces) */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---- Types -----------------------------------------------------------------

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

// ---- Route options ----------------------------------------------------------

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// ---- GET handler ------------------------------------------------------------

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
    const lines = text
      .replace(/\r\n/g, "\n")
      .split("\n")
      .filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      // Pas de données
      return NextResponse.json([] satisfies ItemPublic[]);
    }

    const headerKeys = splitCsvLine(lines[0]).map(normalizeHeader);

    const items: ItemRaw[] = lines.slice(1).map((line) => {
      const cols = splitCsvLine(line);
      const row: Record<string, string> = {};
      headerKeys.forEach((h, i) => (row[h] = cols[i] ?? ""));

      // Champs usuels
      const title = row.title || row.titre || "";
      const subtitle = row.subtitle || row.sous_titre || "";
      const excerpt = row.excerpt || row.resume || row.chapo || "";
      const cover = row.cover || row.image || row.hero || "";
      const date = row.date || "";
      const tags = (row.tags || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      // Slug explicite ou dérivé du titre
      const slug = (row.slug || slugify(title)).trim();

      // Corps : plusieurs conventions possibles
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

    // Supprime le champ "published" à l'export public
    const sanitized: ItemPublic[] = filtered.map((it) => {
      const { published: _p, ...rest } = it;
      return rest;
    });

    return NextResponse.json(sanitized);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
