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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchArticlesFromApi(): Promise<Article[]> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/blog`, { cache: "no-store" });
  if (!res.ok) throw new Error("Blog API error");
  return res.json();
}

export default async function Page({ params }: { params: { slug: string } }) {
  const s = decodeURIComponent(params.slug).trim().toLowerCase();
  const articles = await fetchArticlesFromApi();

  const article =
    articles.find((a) => (a.slug ?? "").trim().toLowerCase() === s) ??
    articles.find((a) => a.title && slugify(a.title) === s);

  if (!article) {
    console.error("[blog/[slug]] not found for", s, "have slugs:", articles.map(a => a.slug).join(", "));
    notFound();
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
      {/* Si tu exposes un body HTML/MD dans l'API, tu peux l'injecter ici */}
    </main>
  );
}
