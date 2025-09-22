// app/blog/[slug]/page.tsx
import Image from "next/image";
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

function getBaseUrl() {
  // VERCEL_URL (sans protocole) est présent en Preview/Prod Vercel.
  // Fallback sur ton domaine prod.
  const host =
    process.env.VERCEL_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    "www.bootyandcutie.com";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

async function fetchArticlesFromApi(): Promise<Article[]> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/blog`, { cache: "no-store" });
  if (!res.ok) throw new Error("Blog API error");
  return res.json();
}

// Ton projet typait PageProps avec params en Promise — on respecte ça ici.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const articles = await fetchArticlesFromApi();

  const article =
    articles.find(a => (a.slug ?? "").trim().toLowerCase() === s) ??
    articles.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    // eslint-disable-next-line no-console
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
      {/* TODO : si /api/blog expose un body HTML/MD, l'afficher ici */}
    </main>
  );
}
