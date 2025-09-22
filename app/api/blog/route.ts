// app/api/blog/route.ts
import { NextResponse } from "next/server";

const CSV_URL = process.env.SHEETS_BLOG_CSV || "";

function splitCsvLine(line: string): string[] {
  // Split par virgules en ignorant celles entre guillemets
  const parts: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // échappement ""
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

function normalizeHeader(h: string) {
  return h.toLowerCase().replace(/\s+/g, "_");
}

function strTrue(v: string | undefined) {
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
    const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);
    const items = lines.slice(1).map((line, idx) => {
      const cols = splitCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = cols[i] ?? ""));

      // Champs courants
      const title = row.title || row.titre || "";
      const subtitle = row.subtitle || row.sous_titre || "";
      const excerpt = row.excerpt || row.resume || row.chapo || "";
      const cover = row.cover || row.image || row.hero || "";
      const date = row.date || "";
      const tags = (row.tags || "").split("|").map(s => s.trim()).filter(Boolean);

      // Slug explicite ou dérivé du titre
      const slug = (row.slug || slugify(title)).trim();

      // Body : supporte plusieurs conventions de colonnes
      const bodyHtml = row.bodyhtml || row.html || row.corpshtml || "";
      const bodyMd   = row.bodymd || row.body || row.corps || row.content || "";

      // Published
      const published = strTrue(row.published) || strTrue(row.publish) || strTrue(row.is_published);

      const base = { slug, title, subtitle, excerpt, cover, date, tags, published };

      if (bodyHtml) return { ...base, bodyHtml };
      if (bodyMd)   return { ...base, bodyMd };
      return base;
    });

    const filtered = all ? items : items.filter(it => it.published);

    if (diag) {
      return NextResponse.json({
        ok: true,
        count: filtered.length,
        sample: filtered.slice(0, 3),
        headers,
      });
    }

    // ⚠️ Par défaut, on renvoie les champs publics (y compris body* si présents)
    return NextResponse.json(filtered.map(({ published, ...rest }) => rest));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
