// app/sitemap.ts
import type { MetadataRoute } from "next";

export const revalidate = 3600; // régénère au max toutes les 1h (Google-friendly)

function baseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (env) return env;
  const host = (process.env.VERCEL_URL || "").replace(/\/$/, "");
  if (host) return `https://${host}`;
  return "https://www.bootyandcutie.com"; // fallback sûr côté prod
}

// petite validation défensive de slug
const isSlug = (s: unknown) =>
  typeof s === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { next: { revalidate: 1800 } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  // URLs statiques minimales (toujours présentes)
  const out: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/offers`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Blog
  type BlogItem = { slug: string; date?: string };
  const blog = await safeFetch<BlogItem[]>(`${base}/api/blog`);
  if (Array.isArray(blog)) {
    for (const b of blog) {
      if (!isSlug(b?.slug)) continue;
      out.push({
        url: `${base}/blog/${b.slug}`,
        lastModified: b?.date ? new Date(b.date) : undefined,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  // Produits
  type ProductItem = { slug: string };
  const products = await safeFetch<ProductItem[]>(`${base}/api/content`);
  if (Array.isArray(products)) {
    for (const p of products) {
      if (!isSlug(p?.slug)) continue;
      out.push({
        url: `${base}/p/${p.slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return out;
}
