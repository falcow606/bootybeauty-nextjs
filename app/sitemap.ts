// app/sitemap.ts
import type { MetadataRoute } from "next";

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL || "www.bootyandcutie.com"}`).replace(/\/$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/offers`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let blog: Array<{ slug: string; date?: string }> = [];
  try {
    const r = await fetch(`${base}/api/blog`, { cache: "no-store" });
    if (r.ok) blog = await r.json();
  } catch {}

  let products: Array<{ slug: string }> = [];
  try {
    const r = await fetch(`${base}/api/content`, { cache: "no-store" });
    if (r.ok) products = await r.json();
  } catch {}

  const blogUrls = blog.map((b) => ({
    url: `${base}/blog/${encodeURIComponent(b.slug)}`,
    lastModified: b.date ? new Date(b.date) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const productUrls = products.map((p) => ({
    url: `${base}/p/${encodeURIComponent(p.slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...blogUrls, ...productUrls];
}
