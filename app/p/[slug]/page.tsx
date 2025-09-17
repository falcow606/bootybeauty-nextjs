// app/p/[slug]/page.tsx
export const revalidate = 1800;
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard, { type CardOffer } from "@/components/OfferCard";
import { getContentBySlug } from "@/lib/sheets";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

type ContentPayload = {
  slug: string;
  title: string;
  html?: string;
  image?: string;
  schema?: Record<string, unknown>;
  brand?: string;
  rating?: number;
};

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick<T>(obj: Record<string, unknown> | undefined, key: string): T | undefined {
  const v = obj?.[key];
  return v as T | undefined;
}

function euro(p?: number | string) {
  if (p == null || p === "") return "";
  const num = Number(String(p).replace(",", "."));
  return Number.isFinite(num)
    ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}

async function fetchOffers(): Promise<CardOffer[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";
  const res = await fetch(`${site}/api/offers`, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  return (await res.json()) as CardOffer[];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  // 1) OFFRES
  const offers = await fetchOffers();
  const offer =
    offers.find((o) => (o.slug && o.slug === slug)) ||
    offers.find((o) => slugify(o.title || "") === slug);

  // 2) CONTENU (GS -> lib/sheets)
  const content = (await getContentBySlug(slug)) as ContentPayload | null;

  // Fallbacks sûrs
  const title =
    content?.title || offer?.title || slug.replace(/-/g, " ");
  const brand = content?.brand || offer?.brand || offer?.merchant || "";
  const heroImg =
    content?.image || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price);

  // CTA affilié (quand dispo)
  const affiliateUrl = offer?.affiliateUrl;
  const hasAff =
    !!affiliateUrl && String(offer?.httpStatus ?? "200") === "200";

  // Fallbacks texte (si pas de HTML déjà généré)
  const schema = content?.schema;
  const intro = pick<string>(schema, "intro");
  const pros = pick<string>(schema, "pros");
  const cons = pick<string>(schema, "cons");
  const howto = pick<string>(schema, "howto") || pick<string>(schema, "howTo");
  const rating = pick<number>(schema, "rating") ?? content?.rating;

  // Produits liés (autres offres)
  const related = offers
    .filter((o) => (o.title && slugify(o.title) !== slug))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
      {/* HERO ROW */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-[24px] bg-white p-4 shadow-md ring-1 ring-[var(--bg-light)]">
          <Image
            src={heroImg}
            alt={title}
            width={1200}
            height={1200}
            unoptimized
            className="aspect-square w-full rounded-2xl object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <h1 className={`${bodoni.className} text-4xl leading-tight`} style={{ color: "var(--text)" }}>
            {title}
          </h1>
          {brand ? (
            <p className="mt-2 text-lg opacity-80">— {brand}</p>
          ) : null}
          {price ? (
            <p className={`${bodoni.className} mt-6 text-2xl`} style={{ color: "var(--text)" }}>
              {price}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {hasAff ? (
              <Link
                href={affiliateUrl as string}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Voir l’offre
              </Link>
            ) : null}

            <Link
              href="/offers"
              className="rounded-2xl border px-5 py-3 transition"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              prefetch
            >
              Voir toutes les offres
            </Link>
          </div>
        </div>
      </div>

      {/* INTRO */}
      {intro ? (
        <p className={`${nunito.className} mt-10 text-base opacity-90`} style={{ color: "var(--text)" }}>
          {intro}
        </p>
      ) : null}

      {/* NOTE */}
      {typeof rating === "number" ? (
        <div className="mt-4 flex items-center gap-2">
          <span aria-label={`Note ${rating}/5`} className="select-none">
            {Array.from({ length: 5 }).map((_, i) => (i < Math.round(rating!) ? "🍑" : "🖤"))}
          </span>
          <span className="opacity-70">{String(rating)}/5</span>
        </div>
      ) : null}

      {/* BLOCS : Pros / Cons / HowTo */}
      {(pros || cons || howto) ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--bg-light)]">
            <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>
              Pourquoi on aime
            </h3>
            {pros ? (
              <ul className="mt-3 list-disc pl-5">
                {pros.split("\n").map((li, i) => (
                  <li key={i}>{li.replace(/^•\s*/, "")}</li>
                ))}
              </ul>
            ) : <p className="opacity-70">—</p>}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--bg-light)]">
            <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>
              À noter
            </h3>
            {cons ? (
              <ul className="mt-3 list-disc pl-5">
                {cons.split("\n").map((li, i) => (
                  <li key={i}>{li.replace(/^•\s*/, "")}</li>
                ))}
              </ul>
            ) : <p className="opacity-70">—</p>}
          </div>

          <div className="md:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--bg-light)]">
            <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>
              Comment l’utiliser
            </h3>
            {howto ? (
              <p className="mt-3 whitespace-pre-line">{howto}</p>
            ) : <p className="opacity-70">—</p>}
          </div>
        </div>
      ) : null}

      {/* PRODUITS LIÉS */}
      <section className="mt-12">
        <h2 className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>
          Produits liés
        </h2>
        {related.length ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.slice(0, 2).map((o, i) => (
              <OfferCard key={`${o.productId}-${i}`} offer={o} />
            ))}
          </div>
        ) : (
          <p className="mt-3 opacity-70">Aucun autre produit pour le moment.</p>
        )}
      </section>
    </div>
  );
}
