// app/blog/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata: Metadata = {
  title: "Le Blog — Booty & Cutie",
  description: "Guides, routines et conseils beauté corps & booty, en douceur et sans tabou.",
};

type PostCard = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
};

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";
}

async function getPosts(): Promise<PostCard[]> {
  const base = siteUrl();
  const res = await fetch(`${base}/api/blog`, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) return [];
  return (json as PostCard[]).filter(p => typeof p.slug === "string" && typeof p.title === "string");
}

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAF0E6" }}>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8">
          <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "#333" }}>
            Le Blog
          </h1>
          <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "#333" }}>
            Conseils, routines et sélections pour un corps confortable et lumineux.
          </p>
        </header>

        {posts.length === 0 ? (
          <p className={`${nunito.className} opacity-80`} style={{ color: "#333" }}>
            Aucun article pour l’instant.
          </p>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <article key={p.slug} className="rounded-3xl bg-white p-3 shadow">
                <Link href={`/blog/${encodeURIComponent(p.slug)}`}>
                  <div className="overflow-hidden rounded-2xl">
                    <Image
                      src={p.cover || "/images/blog-placeholder.jpg"}
                      alt={p.title}
                      width={900}
                      height={600}
                      unoptimized
                      className="h-48 w-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h2 className={`${bodoni.className} text-xl`} style={{ color: "#333" }}>
                      {p.title}
                    </h2>
                    {p.subtitle && (
                      <p className={`${nunito.className} mt-1 text-sm opacity-80`} style={{ color: "#333" }}>
                        {p.subtitle}
                      </p>
                    )}
                    {p.excerpt && (
                      <p className={`${nunito.className} mt-3 text-sm opacity-80 line-clamp-3`} style={{ color: "#333" }}>
                        {p.excerpt}
                      </p>
                    )}
                    <span className={`${nunito.className} mt-3 inline-block underline`} style={{ color: "#C4A092" }}>
                      Lire l’article →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
