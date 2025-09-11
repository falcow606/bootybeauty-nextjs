// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { getFeatured } from '@/lib/sheets';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bootybeauty-nextjs.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const featured = await getFeatured();
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now },
    { url: `${siteUrl}/offers`, lastModified: now },
    { url: `${siteUrl}/top-10/booty-beauty-2025`, lastModified: now },
    { url: `${siteUrl}/mentions-legales`, lastModified: now },  // ✅
    { url: `${siteUrl}/disclosure`, lastModified: now },        // ✅
    ...featured.map((f) => ({
      url: `${siteUrl}/p/${f.slug}`,
      lastModified: now,
    })),
  ];

  return pages;
}
