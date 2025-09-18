// app/sitemap.ts
import type { MetadataRoute } from "next";

type UnknownRecord = Record<string, unknown>;

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://bootybeauty-nextjs.vercel.app");
  const now = new Date();

  const base: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now },
    { url: `${siteUrl}/offers`, lastModified: now },
    { url: `${siteUrl}/blog`, lastModified: now },
    { url: `${siteUrl}/about`, lastModified: now },
    { url: `${siteUrl}/mentions-legales`, lastModified: now },
    { url: `${siteUrl}/disclosure`, lastModified: now },
  ];

  // Ajouter les fiches produits depuis le CSV Content
  const contentCsv = process.env.SHEETS_CONTENT_CSV;
  if (!contentCsv) return base;

  try {
    const res = await fetch(contentCsv, { cache: "no-store" });
    if (!res.ok) return base;
    const text = await res.text();
    const rows = parseCSV(text);
    const objs = tableToObjects(rows);
    const slugs = objs
      .map((r) => getStr(r, ["Slug", "slug"]))
      .filter((s): s is string => Boolean(s && s.trim()));
    const p = slugs.map((s) => ({ url: `${siteUrl}/p/${s}`, lastModified: now }));
    return [...base, ...p];
  } catch {
    return base;
  }
}
