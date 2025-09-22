// app/blog/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

/* ----------------------------- Types ----------------------------- */

type CSVRow = Record<string, string>;
type Post = {
  slug: string;
  title: string;
  subtitle?: string;
  hero?: string;
  html?: string;   // si N8N renvoie déjà du HTML
  intro?: string;  // intro en texte/markdown
  body?: string;   // corps en texte/markdown
  date?: string;
  tags?: string[];
  isPublished?: boolean;
};

type Params = { slug: string };
type PageProps = { params: Promise<Params> };

/* ---------------------------- Helpers ---------------------------- */

function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const hit = Object.keys(obj).find(
      (kk) => kk.trim().toLowerCase() === k.trim().toLowerCase()
    );
    if (!hit) continue;
    const v = obj[hit];
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length) return t;
    }
  }
  return undefined;
}

// CSV tolérant — pas de flag 's' (dotAll), compatible ES2017
function parseCSV(text: string): CSVRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const split = (line: string): string[] => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g; // virgule hors guillemets
    return line
      .split(re)
      .map((c) =>
        c
          .replace(/^"([\s\S]*)"$/, "$1") // remplace les guillemets englobants
          .replace(/""/g, `"`)            // échappement CSV
          .trim()
      );
  };

  const header = split(lines[0]);
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const row: CSVRow = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

async function fetchBlogCSV(): Promise<CSVRow[]> {
  const url = process.env.SHEETS_BLOG_CSV || process.env.N8N_BLOG_URL;
  if (!url) return [];
  const headers: Record<string, string> = {};
  if (process.env.N8N_BLOG_KEY) headers["x-api-key"] = String(process.env.N8N_BLOG_KEY);

  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate: 900 } };

  const res = await fetch(url, init);
  if (!res.ok) return [];

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const j = (await res.json()) as { items?: CSVRow[]; data?: CSVRow[] } | CSVRow[];
    if (Array.isArray(j)) return j;
    if (j?.items && Array.isArray(j.items)) return j.items;
    if (j?.data && Array.isArray(j.data)) return j.data;
    return [];
  }
  const text = await res.text();
  return parseCSV(text);
}

function toBool(v?: string): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return ["oui", "yes", "true", "1", "ok", "y"].includes(s);
}

function mapRowToPost(row: CSVRow): Post | null {
  const slug = pick(row, ["slug", "Slug"]);
  const title = pick(row, ["title", "Title"]);
  if (!slug || !title) return null;

  const subtitle = pick(row, ["subtitle", "Subtitle"]);
  // Hero/cover acceptés
  const hero = pick(row, ["hero", "Hero", "Hero_Image", "Hero URL", "Image", "Cover", "cover"]);
  const html = pick(row, ["html", "HTML"]);
  const intro = pick(row, ["intro", "Intro", "Description", "Excerpt"]);
  const body = pick(row, ["body", "Body", "Contenu"]);
  const date = pick(row, ["date", "Date"]);
  const tagsRaw = pick(row, ["tags", "Tags"]);
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const published = pick(row, ["published", "Published"]);

  return {
    slug: slug.trim(),
    title: title.trim(),
    subtitle,
    hero,
    html,
    intro,
    body,
    date,
    tags,
    isPublished: toBool(published),
  };
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

/* ---------------------- Metadata dynamique ---------------------- */

export async function generateMetadata(
  { params }: { params: Promise<Params> }
): Promise<Metadata> {
  const { slug } = await params;
  const rows = await fetchBlogCSV();
  const posts = rows.map(mapRowToPost).filter((p): p is Post => p !== null);
  const post = posts.find((p) => p.slug.trim().toLowerCase() === slug.trim().toLowerCase());

  const title = post?.title ? `${post.title} — Le Blog` : "Article — Le Blog";
  const description = post?.subtitle || post?.intro || "Article du blog beauté Booty & Cutie.";
  const images = post?.hero ? [post.hero] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/* ------------------------------ Page ---------------------------- */

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const rows = await fetchBlogCSV();
  const posts = rows.map(mapRowToPost).filter((p): p is Post => p !== null && p.isPublished !== false);

  const post = posts.find((p) => p.slug.trim().toLowerCase() === slug.trim().toLowerCase()) || null;

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

        {post.hero && (
          <div className="mb-8 overflow-hidden rounded-3xl bg-white p-2 shadow">
            <Image
              src={post.hero}
              alt={post.title}
              width={1200}
              height={675}
              unoptimized
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>
        )}

        <section className="prose prose-p:my-4 max-w-none">
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

        {post.tags && post.tags.length > 0 && (
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
          <Link href="/blog" className={`${nunito.className} underline`}>← Retour aux articles</Link>
        </div>
      </article>
    </div>
  );
}
