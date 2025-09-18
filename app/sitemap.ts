// app/sitemap.ts
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const urls = [
    "/",
    "/offers",
    "/blog",
    "/about",
    "/mentions-legales",
    "/disclosure",
    "/top-10/booty-beauty-2025",
  ];

  return urls.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
