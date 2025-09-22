// app/p/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import { getOffers, getContentBySlug, normalizeSlug } from "@/lib/sheets";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type Params = { slug: string };
type PageProps = { params: Promise<Params> };

function euro(p?: string | number | null): string {
  if (p == null) return "";
  const num = typeof p === "number" ? p : Number(String(p).replace(",", ".").replace(/[^\d.]/g,""));
  return Number.isFinite(num) ? num.toLocaleString("fr-FR",{minimumFractionDigits:2, maximumFractionDigits:2}) + " €" : String(p);
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const key = normalizeSlug(slug);

  const [offers, content] = await Promise.all([
    getOffers(),
    getContentBySlug(key),
  ]);

  const offer = offers.find(o => normalizeSlug(o.slug || "") === key)
             || offers.find(o => normalizeSlug(o.title || "") === key);

  const title = content?.title || offer?.title || slug.replace(/-/g," ");
  const brand = offer?.brand || offer?.title?.split("—")?.[1] || "";
  const hero  = content?.hero || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price || "");

  const affiliateUrl = offer?.affiliateUrl;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FAF0E6" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-white p-2 shadow">
            <Image
              src={hero}
              alt={title}
              width={1200}
              height={1200}
              unoptimized
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>

          <div>
            <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color:"#333" }}>{title}</h1>
            {brand && <p className={`${nunito.className} mt-1 opacity-70`} style={{ color:"#333" }}>— {brand}</p>}
            {price && <p className={`${bodoni.className} mt-4 text-2xl`} style={{ color:"#333" }}>{price}</p>}

            <div className="mt-4 flex gap-3">
              {affiliateUrl ? (
                <Link href={affiliateUrl} target="_blank" rel="nofollow sponsored noopener"
                  className={`${nunito.className} rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md`}
                  style={{ backgroundColor:"#C4A092" }}>
                  Voir l’offre
                </Link>
              ) : null}
              <Link href="/offers"
                className={`${nunito.className} rounded-2xl border px-5 py-3`}
                style={{ borderColor:"#C4A092", color:"#C4A092" }}>
                Voir toutes les offres
              </Link>
            </div>
          </div>
        </section>

        {/* Ligne 2 : En bref + Pourquoi on aime | À noter + Comment l’utiliser */}
        {content && (
          <>
            {content.intro && (
              <section className="mt-10">
                <h2 className={`${bodoni.className} text-2xl`} style={{ color:"#333" }}>En bref</h2>
                <p className={`${nunito.className} mt-2 leading-relaxed`} style={{ color:"#333" }}>
                  {content.intro}
                </p>
              </section>
            )}

            <section className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow">
                <h3 className={`${bodoni.className} text-xl`} style={{ color:"#333" }}>Pourquoi on aime</h3>
                <ul className={`${nunito.className} mt-3 list-disc pl-5`} style={{ color:"#333" }}>
                  {(content.pros || "").split(/\n+/).filter(Boolean).map((li, i) => <li key={i}>{li}</li>)}
                </ul>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow">
                <h3 className={`${bodoni.className} text-xl`} style={{ color:"#333" }}>À noter</h3>
                <ul className={`${nunito.className} mt-3 list-disc pl-5`} style={{ color:"#333" }}>
                  {(content.cons || "").split(/\n+/).filter(Boolean).map((li, i) => <li key={i}>{li}</li>)}
                </ul>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow md:col-span-2">
                <h3 className={`${bodoni.className} text-xl`} style={{ color:"#333" }}>Comment l’utiliser</h3>
                <p className={`${nunito.className} mt-3 leading-relaxed`} style={{ color:"#333" }}>
                  {content.howto}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
