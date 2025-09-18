export const dynamic = 'force-dynamic';

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import { getContentBySlug } from "@/lib/sheets";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type OfferApi = {
  productId?: string;
  merchant?: string;
  price?: number | string;
  availability?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  title?: string;
  brand?: string;
};

function slugify(input: string): string {
  const s = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "produit";
}
function euro(p?: string | number | null): string {
  if (p === null || p === undefined) return "";
  const num = Number(String(p).replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num)) return String(p);
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function pickAffiliate(o?: OfferApi): string | undefined {
  const v = o?.affiliateUrl;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

async function getOffers(): Promise<OfferApi[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";
  const url = `${base}/api/offers`;
  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  return Array.isArray(json) ? (json as OfferApi[]) : [];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // donne priorité au contenu éditorial
  const content = await getContentBySlug(slug);

  // offres à afficher (prix + CTA + liés)
  const offers = await getOffers();
  const offer =
    offers.find((o) => slugify(o.title || "") === slug) ||
    offers.find((o) => slugify(o.productId || "") === slug) ||
    undefined;

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const brand = content?.brand || offer?.brand || offer?.merchant || "";
  const heroImg = content?.image || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price);
  const affiliate = pickAffiliate(offer);

  const related = offers
    .filter((o) => o.title && slugify(o.title) !== slug)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
        <div className="rounded-[24px] bg-white p-3 shadow-md">
          <Image
            src={heroImg}
            alt={title}
            width={1200}
            height={900}
            unoptimized
            className="aspect-square w-full rounded-[18px] object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h1 className={`${bodoni.className} text-4xl leading-tight`} style={{ color: "#2C2C2C" }}>
            {title}
          </h1>
          {brand ? (
            <p className="text-sm opacity-70" style={{ color: "#7A6D69" }}>— {brand}</p>
          ) : null}

          {price ? <p className={`${bodoni.className} text-xl`}>{price}</p> : null}

          <div className="mt-3 flex gap-3">
            {affiliate ? (
              <Link
                href={affiliate}
                className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "#C4A092" }}
                rel="nofollow sponsored noopener"
                target="_blank"
              >
                Voir l’offre
              </Link>
            ) : null}
            <Link
              href="/offers"
              className="rounded-2xl border px-5 py-3 transition"
              style={{ borderColor: "#C4A092", color: "#C4A092", backgroundColor: "transparent" }}
              prefetch
            >
              Voir toutes les offres
            </Link>
          </div>

          {/* Intro */}
          {content?.intro ? (
            <p className="mt-6 leading-7" style={{ color: "#3a2f2b" }}>
              {content.intro}
            </p>
          ) : null}

          {/* Pros sous l’intro */}
          {content?.pros?.length ? (
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
              <h3 className={`${bodoni.className} text-lg mb-2`} style={{ color: "#2C2C2C" }}>
                Pourquoi on aime
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                {content.pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Note éventuelle */}
          {typeof content?.rating === "number" ? (
            <div className="mt-2 text-sm opacity-70">
              Note : {content.rating}/5
            </div>
          ) : null}
        </div>
      </div>

      {/* Cons + HowTo côte à côte */}
      {(content?.cons?.length || content?.howTo) ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {content?.cons?.length ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className={`${bodoni.className} text-lg mb-2`} style={{ color: "#2C2C2C" }}>À noter</h3>
              <ul className="list-disc pl-5 space-y-1">
                {content.cons.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          ) : <div />}

          {content?.howTo ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className={`${bodoni.className} text-lg mb-2`} style={{ color: "#2C2C2C" }}>Comment l’utiliser</h3>
              <p className="leading-7">{content.howTo}</p>
            </div>
          ) : <div />}
        </div>
      ) : null}

      {/* Produits liés */}
      <section className="mt-12">
        <h2 className={`${bodoni.className} text-2xl mb-4`}>Produits liés</h2>
        {related.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => {
              const s = slugify(p.title || String(i));
              const price = euro(p.price);
              return (
                <article key={s} className="rounded-3xl bg-white p-4 shadow-md">
                  <Image
                    src={p.imageUrl || "/images/product-placeholder.jpg"}
                    alt={p.title || "Produit lié"}
                    width={600}
                    height={600}
                    unoptimized
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                  <div className="mt-3">
                    <h3 className="text-lg font-medium">{p.title}</h3>
                    <p className="text-sm opacity-70">{p.brand || p.merchant}</p>
                    {price ? <p className="mt-1">{price}</p> : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/p/${s}`}
                      className="rounded-2xl border px-5 py-2"
                      style={{ borderColor: "#C4A092", color: "#C4A092" }}
                    >
                      Détails
                    </Link>
                    {p.affiliateUrl ? (
                      <Link
                        href={p.affiliateUrl}
                        className="rounded-2xl px-5 py-2 text-white"
                        style={{ backgroundColor: "#C4A092" }}
                        rel="nofollow sponsored noopener"
                        target="_blank"
                      >
                        Voir l’offre
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="opacity-70">Aucun autre produit pour le moment.</p>
        )}
      </section>
    </div>
  );
}
