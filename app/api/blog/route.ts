// app/api/blog/route.ts
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = Record<string, string>;

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}

function parseCSV(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const split = (line: string): string[] => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
    return line
      .split(re)
      .map((c) => c.replace(/^"([\s\S]*)"$/, "$1").replace(/""/g, `"`).trim());
  };
  const header = split(lines[0]);
  const out: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const row: Row = {};
    header.forEach((h, idx) => (row[h] = cols[idx] ?? ""));
    out.push(row);
  }
  return out;
}

function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const hit = Object.keys(obj).find(
      (kk) => kk.trim().toLowerCase() === k.trim().toLowerCase()
    );
    if (!hit) continue;
    const v = obj[hit];
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
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
    const j = (await res.json()) as { items?: Row[]; data?: Row[] } | Row[];
    if (Array.isArray(j)) return j;
    if (j?.items && Array.isArray(j.items)) return j.items;
    if (j?.data && Array.isArray(j.data)) return j.data;
    return [];
  }
  const text = await res.text();
  return parseCSV(text);
}

export async function GET() {
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

  try {
    const rows = await fetchSource();
    const list = rows
      .map((r) => {
        const slug = pick(r, ["slug", "Slug"]);
        const title = pick(r, ["title", "Title"]);
        if (!slug || !title) return null;

        const published = pick(r, ["Published", "published"]);
        const isPub = truthy(published);
        if (!isPub) return null;

        const cover = pick(r, ["Cover", "Hero", "Image"]);
        const subtitle = pick(r, ["Subtitle", "subtitle"]);
        const excerpt = pick(r, ["Excerpt", "excerpt"]);
        const date = pick(r, ["Date", "date"]);
        const tags = (pick(r, ["Tags", "tags"]) || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        return { slug, title, subtitle, excerpt, cover, date, tags };
      })
      .filter(Boolean);

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
