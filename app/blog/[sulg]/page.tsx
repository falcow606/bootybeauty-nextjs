export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

type KV = Record<string, unknown>;

type Post = {
  slug: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  body?: string;
  author?: string;
  date?: string; // ISO ou lisible
  tags?: string[];
};

function getStr(obj: KV, keys: string[]): string | undefined {
  for (const k of keys) {
    // exact
    if (k in obj) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    // tolérant (espaces/casse)
    const hit = Object.keys(obj).find(
      (kk) => kk.trim().toLowerCase() === k.trim().toLowerCase()
    );
    if (hit) {
      const v = obj[hit];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return undefined;
}

function coerceTags(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return undefined;
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return undefined;
}

function mapRow(row: KV): Post {
  return {
    slug: getStr(row, ["Slug", "slug"]) ?? "",
    title: getStr(row, ["Title", "Titre"]),
    subtitle: getStr(row, ["Subtitle", "Sous-titre", "Sous titre"]),
    hero: getStr(row, ["Hero", "Image", "Hero_URL", "Hero URL"]),
    intro: getStr(row, ["Intro", "Chapo"]),
    body: getStr(row, ["Body", "Contenu", "Markdown", "HTML"]),
    author: getStr(row, ["Author", "Auteur"]),
    date: getStr(row, ["Date", "date", "PublishedAt"]),
    tags: coerceTags(getStr(row, ["Tags", "Mots-clés", "Mots clés"])),
  };
}

/** Parseur CSV minimal (supporte guillemets doubles). */
function parseCsv(text: string): KV[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const re = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
  const split = (line: string): string[] =>
    line
      .split(re)
      // pas de flag /s (compat build), on retire les quotes si présents
      .map((c) => c.replace(/^"(.*)"$/, "$1").replace(/""/g, `"`).trim());
  const header = split(lines[0]);
  const out: KV[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const row: KV = {};
    header.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });
    out.push(row);
  }
  return out;
}

async function fetchPosts(): Promise<Post[]> {
  const url = process.env.N8N_BLOG_URL || process.env.SHEETS_BLOG_CSV;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_BLOG_KEY) headers["x-api-key"] = String(process.env.N8N_BLOG_KEY);

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const json = (await res.json()) as unknown;
    const items: KV[] = Array.isArray(json)
      ? (json as KV[])
      : ((json as KV)["items"] as KV[]) ||
        ((json as KV)["data"] as KV[]) ||
        [];
    return items.map(mapRow).filter((p) => p.slug);
  } else {
    const text = await res.text();
    const rows = parseCsv(text);
    return rows.map(mapRow).filter((p) => p.slug);
  }
}

function toHtmlParagraphs(text?: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return parts.map((p, i) => (
    <p key={i} className="leading-relaxed">
      {p}
    </p>
  ));
}

// ⬇️ ICI: params est un Promise dans Next 15 (App Router)
export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ sulg: string }>;
}) {
  const { sulg } = await params;

  const posts = await fetchPosts();
  const post = posts.find((p) => p.slug === sulg);

  if (!post) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Article introuvable</h1>
        <p className="mt-4">
          Cet article n’existe pas (ou plus).{" "}
          <Link href="/blog" className="underline">
            Revenir au blog
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <article className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          {post.subtitle && (
            <p className="text-base opacity-80">{post.subtitle}</p>
          )}
          {(post.author || post.date) && (
            <p className="text-sm opacity-70">
              {post.author ? `Par ${post.author}` : ""}
              {post.author && post.date ? " — " : ""}
              {post.date || ""}
            </p>
          )}
        </header>

        {post.hero && (
          <div className="overflow-hidden rounded-2xl border">
            <Image
              src={post.hero}
              alt={post.title || "Image d’illustration"}
              width={1600}
              height={1000}
              unoptimized
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        )}

        {post.intro && (
          <section className="space-y-3">{toHtmlParagraphs(post.intro)}</section>
        )}

        {post.body && (
          <section className="prose max-w-none">
            {toHtmlParagraphs(post.body)}
          </section>
        )}

        {post.tags && post.tags.length > 0 && (
          <footer className="pt-4">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  #{t}
                </span>
              ))}
            </div>
          </footer>
        )}
      </article>

      <div className="mt-10">
        <Link href="/blog" className="underline">
          ← Retour au blog
        </Link>
      </div>
    </main>
  );
}
