// app/blog/[slug]/page.tsx
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// ⚠️ Dans ton projet, Next tape params comme une Promise — on respecte ce contrat
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { alternates: { canonical: `/blog/${slug}` } };
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

async function fetchArticlesFromApi(): Promise<{ ok: boolean; data: ApiItem[]; status: number; error?: string }> {
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

function htmlToText(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const { ok, data, status, error } = await fetchArticlesFromApi();
  if (!ok) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Blog indisponible</h1>
        <p className="mt-2 text-sm opacity-70">
          Impossible de charger <code>/api/blog</code>. (status {status})
        </p>
        {error && <p className="mt-2 text-sm opacity-70">{error}</p>}
      </main>
    );
  }

  const article =
    data.find((a) => (a.slug ?? "").trim().toLowerCase() === s) ??
    data.find((a) => a.title && slugify(a.title) === s);

  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Article introuvable</h1>
        <p className="mt-2 text-sm opacity-70">
          <strong>Recherché :</strong> {s}
        </p>
      </main>
    );
  }

  const bodyHtml = article.bodyHtml;
  const bodyMd = article.bodyMd;
  const safeCover = typeof article.cover === "string" && /^https?:\/\//.test(article.cover) ? article.cover : undefined;

  // ---- JSON-LD (rich snippet BlogPosting) ----
  const base = getBaseUrl();
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description:
      article.excerpt ??
      (bodyHtml ? htmlToText(bodyHtml).slice(0, 300) : bodyMd ? bodyMd.slice(0, 300) : undefined),
    image: safeCover,
    datePublished: article.date,
    author: { "@type": "Person", name: "Booty & Cutie" },
    publisher: { "@type": "Organization", name: "Booty & Cutie" },
    mainEntityOfPage: `${base}/blog/${article.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      {safeCover && (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm">
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
        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {article.title}
        </h1>
        {article.subtitle && <p className="mt-2 text-lg italic opacity-80 md:text-xl">{article.subtitle}</p>}
        {(article.date || (article.tags && article.tags.length)) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {article.date && <span className="text-sm opacity-70">{article.date}</span>}
            {article.tags?.map((t) => (
              <span key={t} className="rounded-full border px-2 py-0.5 text-xs opacity-80">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="prose prose-neutral mt-6 max-w-none md:prose-lg">
        {bodyHtml ? (
          <article dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        ) : bodyMd ? (
          <article className="whitespace-pre-wrap leading-relaxed">{bodyMd}</article>
        ) : (
          article.excerpt && <p>{article.excerpt}</p>
        )}
      </div>
    </article>
  );
}
