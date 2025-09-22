// app/blog/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

/* ----------------------------- Types & utils ----------------------------- */

type Row = Record<string, string>;

type Post = {
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  intro?: string;
  body?: string;
  html?: string;
  date?: string;
  tags: string[];
  publishedRaw?: string;
  isPublished: boolean;
};

function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "oui" || s === "yes" || s === "true" || s === "1" || s === "y" || s === "ok";
}

/** CSV RFC4180 parser (gère virgules ET retours-ligne dans les champs) */
function parseCSV(text: string): Row[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  // BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"'; i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field.trim()); field = ""; }
      else if (c === "\r") { /* ignore */ }
      else if (c === "\n") { row.push(field.trim()); rows.push(row); row = []; field = ""; }
      else { field += c; }
    }
  }
  row.push(field.trim());
  rows.push(row);

  if (rows.length === 0) return [];
  const header = rows[0];
  const out: Row[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length === 1 && r[0] === "") continue;
    const o: Row = {};
    header.forEach((h, idx) => { o[h] = r[idx] ?? ""; });
    out.push(o);
  }
  return out;
}

function pick(row: Row, keys: string[]): string | undefined {
  const all = Object.keys(row);
  for (const k of keys) {
    const hit = all.find(kk => kk.trim().toLowerCase() === k.trim().toLowerCase());
    if (!hit) continue;
    const v = row[hit].trim();
    if (v) return v;
  }
  return undefined;
}

async function fetchBlogRows(): Promise<Row[]> {
  const url = process.env.SHEETS_BLOG_CSV || process.env.N8N_BLOG_URL;
  if (!url) return [];
  const headers: Record<string, string> = {};
  if (process.env.N8N_BLOG_KEY) headers["x-api-key"] = String(process.env.N8N_BLOG_KEY);
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = await res.json() as { items?: Row[]; data?: Row[] } | Row[];
    if (Array.isArray(j)) return j;
    if (j?.items) return j.items ?? [];
    if (j?.data) return j.data ?? [];
    return [];
  }
  const csv = await res.text();
  return parseCSV(csv);
}

function rowToPost(row: Row): Post | null {
  const slug = pick(row, ["Slug","slug"]);
  const title = pick(row, ["Title","title"]);
  if (!slug || !title) return null;

  const subtitle = pick(row, ["Subtitle","subtitle"]);
  const cover = pick(row, ["Cover","Hero","Hero_Image","Image"]);
  const intro = pick(row, ["Intro","intro","Excerpt","excerpt"]);
  const body  = pick(row, ["Body","body","Contenu"]);
  const html  = pick(row, ["HTML","html"]);
  const date  = pick(row, ["Date","date"]);
  const tagsStr = pick(row, ["Tags","tags"]) ?? "";
  const tags = tagsStr.split(",").map(t => t.trim()).filter(t => t.length>0);
  const publishedRaw = pick(row, ["Published","published","Publié","publie"]) ?? "";
  const isPublished = truthy(publishedRaw);

  return { slug, title, subtitle, cover, intro, body, html, date, tags, publishedRaw, isPublished };
}

function normalizeSlug(s: string): string {
  return decodeURIComponent(s).trim().toLowerCase();
}

function toHtmlParagraphs(text?: string): React.ReactNode {
  if (!text) return null;
  return text
    .split(/\n{2,}/)
    .map((p, i) => (
      <p key={i} className={`${nunito.className} leading-relaxed`} style={{ color: "#333" }}>
        {p.trim()}
      </p>
    ));
}

/* ----------------------------- Metadata dyn ----------------------------- */

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const slug = normalizeSlug(params.slug);
  const rows = await fetchBlogRows();
  const posts = rows.map(rowToPost).filter((p): p is Post => p !== null);
  const post = posts.find(p => normalizeSlug(p.slug) === slug);

  const title = post?.title ? `${post.title} — Le Blog` : "Article — Le Blog";
  const description = post?.subtitle || post?.intro || "Article du blog beauté Booty & Cutie.";
  const images = post?.cover ? [post.cover] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter:   { card: "summary_large_image", title, description, images },
  };
}

/* --------------------------------- Page --------------------------------- */

type PageProps = { params: { slug: string } };

export default async function BlogPostPage({ params }: PageProps) {
  const slug = normalizeSlug(params.slug);

  const rows = await fetchBlogRows();
  const posts = rows.map(rowToPost).filter((p): p is Post => p !== null);

  // Filtre (si tu veux autoriser la preview, enlève ce filtre)
  const published = posts.filter(p => p.isPublished);

  const post = (published.find(p => normalizeSlug(p.slug) === slug)) ?? null;

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className={`${bodoni.className} mb-4 text-3xl`}>Article introuvable</h1>
        <p className={`${nunito.className} mb-6 opacity-80`}>Cet article n’existe pas (ou plus).</p>
        <Link href="/blog" className="underline">Revenir au blog</Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAF0E6" }}>
      <article className="mx-auto max-w-4xl px-6 py-12">
        <header className="mb-8">
          <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "#333" }}>
            {post.title}
          </h1>
          {post.subtitle && (
            <p className={`${nunito.className} mt-2 text-lg opacity-80`} style={{ color: "#333" }}>
              {post.subtitle}
            </p>
          )}
        </header>

        {post.cover && (
          <div className="mb-8 overflow-hidden rounded-3xl bg-white p-2 shadow">
            <Image
              src={post.cover}
              alt={post.title}
              width={1200}
              height={675}
              unoptimized
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>
        )}

        <section className="prose max-w-none">
          {post.html ? (
            <div
              className={`${nunito.className} leading-relaxed`}
              style={{ color: "#333" }}
              dangerouslySetInnerHTML={{ __html: post.html }}
            />
          ) : (
            <>
              {toHtmlParagraphs(post.intro)}
              {toHtmlParagraphs(post.body)}
            </>
          )}
        </section>

        {post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className={`${nunito.className} inline-block rounded-full border px-3 py-1 text-sm`}
                style={{ borderColor: "#EBC8B2", color: "#333", backgroundColor: "#FAF0E6" }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link href="/blog" className={`${nunito.className} underline`}>
            ← Retour aux articles
          </Link>
        </div>
      </article>
    </div>
  );
}
