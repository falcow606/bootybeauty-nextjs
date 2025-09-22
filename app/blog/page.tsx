export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type ListPost = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  cover?: string;
  date?: string;
  tags?: string[];
};

async function fetchList(): Promise<ListPost[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bootyandcutie.com";
    const res = await fetch(`${base}/api/blog`, { cache: "no-store" });
    if (!res.ok) return [];
    const j = (await res.json()) as unknown;
    if (Array.isArray(j)) return j as ListPost[];
    return [];
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const items = await fetchList();

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAF0E6" }}>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "#333" }}>
          Le Blog
        </h1>

        {items.length === 0 ? (
          <p className={`${nunito.className} mt-6 opacity-80`} style={{ color: "#333" }}>
            Aucun article pour l’instant.
          </p>
        ) : (
          <section className="mt-8 grid gap-8 md:grid-cols-2">
            {items.map((p) => (
              <article key={p.slug} className="overflow-hidden rounded-3xl bg-white shadow">
                {p.cover && (
                  <Image
                    src={p.cover}
                    alt={p.title}
                    width={1200}
                    height={675}
                    unoptimized
                    className="h-auto w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <h2 className={`${bodoni.className} text-2xl`} style={{ color: "#333" }}>
                    {p.title}
                  </h2>
                  {p.subtitle && (
                    <p className={`${nunito.className} mt-1 opacity-80`} style={{ color: "#333" }}>
                      {p.subtitle}
                    </p>
                  )}
                  {p.excerpt && (
                    <p className={`${nunito.className} mt-3`} style={{ color: "#333" }}>
                      {p.excerpt}
                    </p>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/blog/${p.slug}`}
                      className={`${nunito.className} inline-block rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md`}
                      style={{ backgroundColor: "#C4A092" }}
                    >
                      Lire l’article
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
