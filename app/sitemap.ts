import type { MetadataRoute } from 'next'
import { getFeatured } from '@/lib/sheets'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://bootybeauty-nextjs.vercel.app'

  const featured = await getFeatured()

  const pages = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/top-10/booty-beauty-2025`, lastModified: new Date() },
    ...featured.map((f) => ({
      url: `${base}/p/${f.slug}`,
      lastModified: new Date(),
    })),
  ]

  return pages
}
