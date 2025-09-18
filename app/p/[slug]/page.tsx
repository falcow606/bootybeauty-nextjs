export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard from "@/components/OfferCard";
import { getContentBySlug } from "@/lib/sheets";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

/* --------------------------- Types utilitaires --------------------------- */

type UnknownRecord = Record<string, unknown>;

type Offer = {
  productId?: string | number;
  title?: string;
  brand?: string;
  merchant?: string;
  imageUrl?: string;
  price?: number | string | null;
  affiliateUrl?: string;
  slug?: string;
  httpStatus?: number | string;
};

type ContentPayload = {
  slug: string;
  title: string;
  subtitle?: string;
  image?: string;
  brand?: string;
  intro?: string;
  pros?: string;
  cons?: string;
  howTo?: string;
  rating?: number;
};

type PageProps = { params: Promise<{ slug: string }> };

/* ------------------------------ Helpers -------------------------------- */

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickStr(obj: UnknownRecord | null | undefined, keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}
function pickNum(obj: UnknownRecord | null | undefined, keys: string[]): number | undefined {
  const s = pickStr(obj, keys);
  if (s == null) return undefined;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}
function euro(p?: number | string | null): string {
  if (p == null || p === "") return "";
  const n = Number(String(p).replace(",", "."));
  return Number.isFinite(n)
    ? n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}

function normalizeContent(raw: UnknownRecord | null): ContentPayload | null {
  if (!raw) return null;
  return {
    slug: pickStr(raw, ["Slug", "slug"]) ?? "",
    title: pickStr(raw, ["Title", "Titre", "title"]) ?? "",
    subtitle: pickStr(raw, ["Subtitle", "Sous-titre", "subtitle"]),
    image: pickStr(raw, ["Hero", "Hero_Image", "Hero URL", "Image_Hero", "Image", "image"]),
    brand: pickStr(raw, ["Brand", "Marque", "brand"]),
    intro: pickStr(raw, ["Intro", "Introduction"]),
    pros: pickStr(raw, ["Pros", "Pourquoi on aime"]),
    cons: pickStr(raw, ["Cons", "À noter", "A noter"]),
    howTo: pickStr(raw, ["How to", "HowTo", "Comment l’utiliser", "Comment l'utiliser"]),
    rating: pickNum(raw, ["Note globale (sur 5)", "Rating", "Note"]),
  };
}

async function fetchOffers(): Promise<Offer[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://bootybeauty-nextjs.vercel.app";
  const res = await fetch(`${site}/api/offers`, { next: { revalidate: 600 } });
  if (!res.ok) return [];
  const data = (await res.json()) as UnknownRecord[];
  // Garder les offres valides
  return data
    .map((r): Offer => ({
      productId: r["productId"] as string | number | undefined,
      title: pickStr(r, ["title"]),
      brand: pickStr(r, ["brand"]),
      merchant: pickStr(r, ["merchant"]),
      imageUrl: pickStr(r, ["imageUrl"]),
      price: (r["price"] as number | string | null) ?? null,
      affiliateUrl: pickStr(r, ["affiliateUrl"]),
      slug: pickStr(r, ["slug"]),
      httpStatus: (r["httpStatus"] as number | string | undefined) ?? 200,
    }))
    .filter((o) => String(o.httpStatus || "200") === "200");
}

/* -------------------------------- Page --------------------------------- */

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const offers = await fetchOffers();
  const offer =
    offers.find((o) => o.slug === slug) ||
    offers.find((o) => (o.title ? slugify(o.title) : "") === slug);

  // Récupération du contenu éditorial
  let contentRaw = (await getContentBySlug(slug)) as UnknownRecord | null;
  if (!contentRaw && offer?.title) {
    // Fallback de slug si le titre a été modifié dans le Google Sheet
    contentRaw = (await getContentBySlug(slugify(offer.title))) as UnknownRecord | null;
  }
  const content = normalizeContent(contentRaw);

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const brand = content?.brand || offer?.brand || offer?.merchant || "";
  const heroImg = content?.image || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price);

  const affiliateUrl = offer?.affiliateUrl;
  const hasAff = typeof affiliateUrl === "string" && affiliateUrl.trim().length > 0;

  const rating = typeof content?.rating === "number" ? content.rating : undefined;

  // Produits liés (même brand/merchant, autres items)
  const related = offers
    .filter((o) => (o.brand || o.merchant) && (o.brand === brand || o.merchant === brand))
    .filter((o) => (o.slug ? o.slug !== slug : (o.title ? slugify(o.title) !== slug : true)))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      {/* Bandeau principal */}
      <section className="grid items-start gap-8 md:grid-cols-2">
        {/* Image encadrée */}
        <div className="rounded-[28px] border bg-white p-3" style={{ borderColor: "rgba(235,200,178,0.8)" }}>
          <Image
            src={heroImg}
            alt={title}
            width={1100}
            height={1100}
            unoptimized
            className="aspect-square w-full rounded-2xl object-contain"
            priority
          />
        </div>

        {/* Infos */}
        <div>
          <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "#1e1e1e" }}>
            {title}
          </h1>
          {brand ? (
            <p className={`${nunito.className} mt-1 text-base opacity-70`} style={{ color: "#1e1e1e" }}>
              — {brand}
            </p>
          ) : null}
          {price ? (
            <p className={`${bodoni.className} mt-5 text-xl`} style={{ color: "#1e1e1e" }}>
              {price}
            </p>
          ) : null}

          {/* Note en abricots */}
          {typeof rating === "number" ? (
            <div className="mt-3 flex items-center gap-2">
              <ApricotRating value={rating} />
              <span className={`${nunito.className} text-sm opacity-75`} style={{ color: "#1e1e1e" }}>
                {rating}/5
              </span>
            </div>
          ) : null}

          {/* CTAs */}
          <div className="mt-6 flex items-center gap-3">
            {hasAff ? (
              <Link
                href={affiliateUrl!}
                className={`${nunito.className} rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md`}
                style={{ backgroundColor: "#C4A092" }}
                rel="nofollow sponsored noopener"
                target="_blank"
              >
                Voir l’offre
              </Link>
            ) : null}
            <Link
              href="/offers"
              className={`${nunito.className} rounded-2xl border px-5 py-3 transition hover:opacity-90`}
              style={{ borderColor: "#C4A092", color: "#C4A092", backgroundColor: "transparent" }}
            >
              Voir toutes les offres
            </Link>
          </div>
        </div>
      </section>

      {/* Bloc éditorial */}
      {(content?.intro || content?.pros || content?.cons || content?.howTo) ? (
        <section className="mt-10 grid gap-8">
          {/* Intro */}
          {content?.intro ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className={`${bodoni.className} mb-2 text-xl`} style={{ color: "#1e1e1e" }}>
                À propos du produit
              </h2>
              <p className={`${nunito.className} leading-relaxed`} style={{ color: "#1e1e1e" }}>
                {content.intro}
              </p>
            </div>
          ) : null}

          {/* Pourquoi on aime (sous l’intro) */}
          {content?.pros ? (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "#1e1e1e" }}>
                Pourquoi on aime
              </h3>
              <RichBullets text={content.pros} />
            </div>
          ) : null}

          {/* Cons + HowTo côte à côte */}
          {content?.cons || content?.howTo ? (
            <div className="grid gap-6 md:grid-cols-2">
              {content?.cons ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "#1e1e1e" }}>
                    À noter
                  </h3>
                  <RichBullets text={content.cons} />
                </div>
              ) : null}
              {content?.howTo ? (
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <h3 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "#1e1e1e" }}>
                    Comment l’utiliser
                  </h3>
                  <RichBullets text={content.howTo} />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Produits liés */}
      <section className="mt-12">
        <h2 className={`${bodoni.className} mb-4 text-2xl`} style={{ color: "#1e1e1e" }}>
          Produits liés
        </h2>
        {related.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((o, i) => (
              <OfferCard key={`${o.productId}-${i}`} offer={o as any} index={i} originSlug={slug} />
            ))}
          </div>
        ) : (
          <p className={`${nunito.className} opacity-70`} style={{ color: "#1e1e1e" }}>
            Aucun autre produit pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}

/* --------------------------- Sous-composants --------------------------- */

function ApricotRating({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1 text-lg" aria-label={`Note ${v} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">{i < v ? "🍑" : "🖤"}</span>
      ))}
    </div>
  );
}

function RichBullets({ text }: { text: string }) {
  // Accepte un bloc avec puces séparées par sauts de ligne, "• ", "-", etc.
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-•–]\s*)?/, "").trim())
    .filter(Boolean);
  if (!lines.length) return <p>{text}</p>;
  return (
    <ul className="list-disc pl-5 leading-relaxed">
      {lines.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}
