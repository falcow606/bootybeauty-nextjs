// app/blog/[slug]/page.tsx
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { alternates: { canonical: `/blog/${params.slug}` } };
}

type Article = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
  bodyHtml?: string;
  bodyMd?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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

type ApiItem = Partial<Article> & Pick<Article, "slug" | "title">;
type ApiResult = { ok: boolean; data: ApiItem[]; status: number; error?: string };

async function fetchArticlesFromApi(): Promise<ApiResult> {
  const url = `${getBaseUrl()}/api/blog`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, data: [], status: res.status, error: `HTTP ${res.status}` };
    const data = (await res.json()) as ApiItem[];
    return { ok: true, data, status: 200 };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, data: [], status: 0, error: msg };
  }
}

// NOTE: ton projet tape params comme Promise — on respecte
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const { ok, data, status, error } = await fetchArticlesFromApi();
  if (!ok) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Blog indisponible</h1>
        <p className="mt-2 text-sm opacity-70">Impossible de charger <code>/api/blog</code>. (status {status})</p>
        {error && <p className="mt-2 text-sm opacity-70">{error}</p>}
      </main>
    );
  }

  const article = data.find(a => (a.slug ?? "").trim().toLowerCase() === s)
    ?? data.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Article introuvable</h1>
        <p className="mt-2 text-sm opacity-70"><strong>Recherché :</strong> {s}</p>
      </main>
    );
  }

  const bodyHtml = article.bodyHtml;
  const bodyMd = article.bodyMd;
  const safeCover =
    typeof article.cover === "string" && /^https?:\/\//.test(article.cover) ? article.cover : undefined;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* HERO */}
      {safeCover && (
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-sm">
          <Image
            src={safeCover}
            alt={article.title ?? "cover"}
            fill
            sizes="(max-width: 768px) 100vw, 1024px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* HEADER */}
      <header className="mt-6">
        <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">{article.title}</h1>
        {article.subtitle && (
          <p className="mt-2 text-lg md:text-xl italic opacity-80">{article.subtitle}</p>
        )}
        {(article.date || (article.tags && article.tags.length)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {article.date && <span className="text-sm opacity-70">{article.date}</span>}
            {article.tags?.map((t) => (
              <span key={t} className="text-xs rounded-full border px-2 py-0.5 opacity-80">{t}</span>
            ))}
          </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="prose prose-neutral md:prose-lg max-w-none mt-6">
        {bodyHtml ? (
          <article dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : bodyMd ? (
          // ✅ préserve les retours à la ligne de la Sheet
          <article className="whitespace-pre-wrap leading-relaxed">
            {bodyMd}
          </article>
        ) : (
          article.excerpt && <p>{article.excerpt}</p>
        )}
      </div>
    </article>
  );
}
