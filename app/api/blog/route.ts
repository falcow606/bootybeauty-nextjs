// app/api/blog/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------------------------- Types & helpers ---------------------------- */

type Row = Record<string, string>;

type ApiItem = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags: string[];
  // champs diag optionnels quand ?diag=1
  publishedRaw?: string;
  isPublished?: boolean;
};

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}

/** CSV robuste (guillemets, virgules, retours à la ligne) */
function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  const nonEmpty = lines.filter((l, idx) => idx === 0 || l.trim().length > 0);
  if (nonEmpty.length === 0) return [];

  const split = (line: string): string[] => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
    return line
      .split(re)
      .map((c) => c.replace(/^"([\s\S]*)"$/, "$1").replace(/""/g, `"`).trim());
  };

  const header = split(nonEmpty[0]).map((h) => h.replace(/^\uFEFF/, "")); // retire BOM si présent
  const out: Row[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const cols = split(nonEmpty[i]);
    const row: Row = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    out.push(row);
  }
  return out;
}

/** Récupère la valeur d’une clé parmi plusieurs libellés équivalents (trim/casse tolérés) */
function pickCaseInsensitive(row: Row, keys: string[]): string | undefined {
  const allKeys = Object.keys(row);
  for (const k of keys) {
    const hit = allKeys.find(
      (kk) => kk.trim().toLowerCase() === k.trim().toLowerCase()
    );
    if (!hit) continue;
    const t = row[hit].trim();
    if (t) return t;
  }
  return undefined;
}

async function fetchSource(): Promise<Row[]> {
  const url = process.env.SHEETS_BLOG_CSV || process.env.N8N_BLOG_URL;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_BLOG_KEY) headers["x-api-key"] = String(process.env.N8N_BLOG_KEY);

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    // j peut être un tableau ou un objet { items | data }
    const j = (await res.json()) as { items?: Row[]; data?: Row[] } | Row[];
    if (Array.isArray(j)) return j;
    if (j?.items && Array.isArray(j.items)) return j.items;
    if (j?.data && Array.isArray(j.data)) return j.data;
    return [];
  }
  const text = await res.text();
  return parseCSV(text);
}

/* --------------------------------- Route -------------------------------- */

export async function GET(req: Request) {
  if (!process.env.SHEETS_BLOG_CSV && !process.env.N8N_BLOG_URL) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "blog_env_missing",
        expected: ["SHEETS_BLOG_CSV (recommandé)", "N8N_BLOG_URL (fallback)"],
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const showAll = url.searchParams.get("all") === "1"; // bypass filtre Published si ?all=1
  const withDiag = url.searchParams.get("diag") === "1"; // inclure publishedRaw/isPublished

  try {
    const rows = await fetchSource();

    const list: ApiItem[] = rows
      .map((r): ApiItem | null => {
        const slug = pickCaseInsensitive(r, ["slug", "Slug"]);
        const title = pickCaseInsensitive(r, ["title", "Title"]);
        if (!slug || !title) return null;

        const publishedRaw =
          pickCaseInsensitive(r, ["Published", "published", "Publié", "publie"]) ?? "";
        const isPublished = truthy(publishedRaw);
        if (!showAll && !isPublished) return null;

        const cover = pickCaseInsensitive(r, ["Cover", "Hero", "Hero_Image", "Image"]);
        const subtitle = pickCaseInsensitive(r, ["Subtitle", "subtitle"]);
        const excerpt =
          pickCaseInsensitive(r, ["Excerpt", "excerpt", "Intro", "intro"]) ?? "";
        const date = pickCaseInsensitive(r, ["Date", "date"]);
        const tagsStr = pickCaseInsensitive(r, ["Tags", "tags"]) ?? "";
        const tags = tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);

        const base: ApiItem = { slug, title, subtitle, excerpt, cover, date, tags };
        return withDiag ? { ...base, publishedRaw, isPublished } : base;
      })
      .filter((x): x is ApiItem => x !== null);

    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "blog_fetch_failed" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
