// app/robots.ts
import type { MetadataRoute } from 'next';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://bootybeauty-nextjs.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // optionnel : évite d’indexer des zones techniques
        disallow: ['/api/', '/_next/', '/admin', '/private'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
