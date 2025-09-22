// app/blog/[slug]/page.tsx
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Article = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
  body?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchArticlesFromApi(): Promise<Article[]> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/blog`, { cache: "no-store" });
  if (!res.ok) throw new Error("Blog API error");
  return res.json();
}

// NOTE: Ici on tape explicitement sur un params "Promise<{ slug: string }>" pour matcher ton PageProps custom
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // ✅ attend le Promise attendu par ton type
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const articles = await fetchArticlesFromApi();

  const article =
    articles.find(a => (a.slug ?? "").trim().toLowerCase() === s) ??
    articles.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    // log serveur utile dans Vercel
    console.error("[blog/[slug]] not found for", s, "have slugs:", articles.map(a => a.slug).join(", "));
    return notFound();
  }

  return (
    <main className="prose mx-auto p-6">
      <h1>{article.title}</h1>
      {article.subtitle && <p><em>{article.subtitle}</em></p>}

      {article.cover && (
        <div className="relative w-full aspect-[16/9] mb-4">
          <Image
            src={article.cover}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {article.date && <p><small>Publié le {article.date}</small></p>}
      {article.excerpt && <p>{article.excerpt}</p>}
      {/* TODO: si tu exposes un body HTML/MD dans /api/blog, rends-le ici */}
    </main>
  );
}
