// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL || "www.bootyandcutie.com"}`).replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: ["/"], disallow: ["/api/", "/admin", "/draft", "/private"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
