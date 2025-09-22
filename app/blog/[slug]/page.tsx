// app/blog/[slug]/page.tsx
import { headers } from "next/headers";
import { notFound } from "next/navigation";

// Si tu avais generateStaticParams, supprime-le pour éviter un build “vide”.
// export async function generateStaticParams() { return []; }

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
  body?: string; // si l’API l’expose
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
  const proto = h.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/blog`, { cache: "no-store" });
  if (!res.ok) throw new Error("Blog API error");
  return res.json();
}

export default async function Page({ params }: { params: { slug: string } }) {
  const s = decodeURIComponent(params.slug).trim().toLowerCase();
  const articles = await fetchArticlesFromApi();

  let article =
    articles.find(a => (a.slug ?? "").trim().toLowerCase() === s) ||
    articles.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    // Option : log côté serveur pour debug
    console.error("[blog/[slug]] not found for", s, "have slugs:", articles.map(a => a.slug).join(", "));
    return notFound(); // ou retourne ton composant “Article introuvable”
  }

  // ---- Rendu minimal, adapte à ton design ----
  return (
    <main className="prose mx-auto p-6">
      <h1>{article.title}</h1>
      {article.subtitle && <p><em>{article.subtitle}</em></p>}
      {article.cover && <img src={article.cover} alt={article.title} style={{ width: "100%", height: "auto" }} />}
      <p><small>Publié le {article.date}</small></p>
      {article.excerpt && <p>{article.excerpt}</p>}
      {/* Si ton API renvoie le body en HTML/MD, injecte-le ici */}
    </main>
  );
}
