// app/blog/[slug]/page.tsx
import Image from "next/image";

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

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (host) return `https://${host.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

type ApiResult = { ok: boolean; data: Article[]; status: number; error?: string };

async function fetchArticlesFromApi(): Promise<ApiResult> {
  const url = `${getBaseUrl()}/api/blog`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return { ok: false, data: [], status: res.status, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as Article[];
    return { ok: true, data, status: 200 };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, data: [], status: 0, error: msg };
  }
}

// NOTE: ton projet tape params comme une Promise — on respecte ce contrat ici
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const { ok, data, status, error } = await fetchArticlesFromApi();

  if (!ok) {
    return (
      <main className="prose mx-auto p-6">
        <h1>Blog indisponible</h1>
        <p>Impossible de charger <code>/api/blog</code>.</p>
        <ul>
          <li><strong>Status:</strong> {status}</li>
          <li><strong>Base URL:</strong> {getBaseUrl()}</li>
          {error && <li><strong>Error:</strong> {error}</li>}
        </ul>
        <p>Vérifie <code>NEXT_PUBLIC_SITE_URL</code> puis redéploie si besoin.</p>
      </main>
    );
  }

  const article =
    data.find(a => (a.slug ?? "").trim().toLowerCase() === s) ??
    data.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    return (
      <main className="prose mx-auto p-6">
        <h1>Article introuvable</h1>
        <p><strong>Recherché :</strong> {s}</p>
        <p><strong>Slugs disponibles :</strong></p>
        <pre>{JSON.stringify(data.map(a => a.slug), null, 2)}</pre>
        <p>Si le slug est listé ci-dessus, lance&nbsp;:</p>
        <code>/api/revalidate?secret=booty_secret_123&path=/blog/{s}</code>
      </main>
    );
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
    </main>
  );
}
