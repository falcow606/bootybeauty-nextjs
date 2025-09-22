// app/blog/[slug]/page.tsx
import React from "react";
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
      <main className="prose mx-auto p-6">
        <h1>Blog indisponible</h1>
        <p>Impossible de charger <code>/api/blog</code>. ({status})</p>
        {error && <p><small>{error}</small></p>}
      </main>
    );
  }

  const article = data.find(a => (a.slug ?? "").trim().toLowerCase() === s)
    ?? data.find(a => a.title && slugify(a.title) === s);

  if (!article) {
    return (
      <main className="prose mx-auto p-6">
        <h1>Article introuvable</h1>
        <p><strong>Recherché :</strong> {s}</p>
        <p><strong>Slugs disponibles :</strong></p>
        <pre>{JSON.stringify(data.map(a => a.slug), null, 2)}</pre>
      </main>
    );
  }

  const bodyHtml = article.bodyHtml;
  const bodyMd = article.bodyMd;

  const mdToElements = (md: string): React.ReactNode[] => {
    const lines = md.split(/\r?\n/);
    const out: React.ReactNode[] = [];
    lines.forEach((ln, i) => {
      const l = ln.trim();
      if (!l) return;
      if (l.startsWith("### ")) out.push(<h3 key={`h3-${i}`}>{l.slice(4)}</h3>);
      else if (l.startsWith("## ")) out.push(<h2 key={`h2-${i}`}>{l.slice(3)}</h2>);
      else out.push(<p key={`p-${i}`}>{l}</p>);
    });
    return out;
  };

  // petit helper pour éviter l’icône image cassée
  const safeCover = typeof article.cover === "string" && /^https?:\/\//.test(article.cover) ? article.cover : undefined;

  return (
    <main className="prose mx-auto p-6">
      <h1>{article.title}</h1>
      {article.subtitle && <p><em>{article.subtitle}</em></p>}
      {article.date && <p><small>Publié le {article.date}</small></p>}

      {/* 🔥 Afficher le corps AVANT l'image pour valider que le contenu sort bien */}
      {bodyHtml
        ? <article dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        : bodyMd
          ? <article>{mdToElements(bodyMd)}</article>
          : (article.excerpt && <p>{article.excerpt}</p>)
      }

      {/* Image en bas + unoptimized pour by-passer les soucis de loader */}
      {safeCover && (
        <div className="relative w-full aspect-[16/9] mt-6">
          <Image
            src={safeCover}
            alt={article.title ?? "cover"}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            unoptimized        // <= clé pour stopper l’icône cassée tant qu’on débug
          />
        </div>
      )}
    </main>
  );
}
