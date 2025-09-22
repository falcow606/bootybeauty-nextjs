// app/p/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

// Canonical
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { alternates: { canonical: `/p/${slug}` } };
}

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type ContentItem = {
  slug: string;
  title: string;
  brand?: string;
  hero?: string;
  subtitle?: string;
  excerpt?: string;
  pros?: string[];
  cons?: string[];
  howto?: string;
  bodyHtml?: string;
  bodyMd?: string;
  rating?: number;
};

type Offer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  imageUrl?: string;
  price?: number | string;
  affiliateUrl?: string;
  slug?: string;
};

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (host) return `https://${host.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
function priceToText(value?: number | string) {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try { return `${value.toFixed(2)} €`; } catch { return `${value} €`; }
}
function priceToNumber(value?: number | string): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number") return value;
  const s = value.replace(/[^\d.,]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}
function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchContent(): Promise<ContentItem[]> {
  const res = await fetch(`${getBaseUrl()}/api/content`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}
async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch(`${getBaseUrl()}/api/offers`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function ApricotRating({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const empties = 5 - full;
  return (
    <span aria-label={`Note ${v}/5`} className="text-lg leading-none">
      {"🍑".repeat(full)}
      <span className="opacity-30">{"🍑".repeat(empties)}</span>
    </span>
  );
}

function RelatedCard({ o }: { o: Offer }) {
  const href = o.slug ? `/p/${o.slug}` : (o.title ? `/p/${slugify(o.title)}` : "/offers");
  const hasAff = !!o.affiliateUrl;
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-white p-2">
        <Image
          src={o.imageUrl || "/images/product-placeholder.jpg"}
          alt={o.title || "Produit lié"}
          width={800}
          height={800}
          className="h-auto w-full rounded-lg object-cover"
          unoptimized
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <h4 className={`${bodoni.className} text-base`} style={{ color: "#252525" }}>
            {o.title || "Produit"}
          </h4>
          <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "#333" }}>
            {o.brand || o.merchant || ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className={`${nunito.className} rounded-2xl border px-4 py-2 text-sm transition`}
            style={{ borderColor: "#C4A092", color: "#C4A092", backgroundColor: "transparent" }}
            prefetch
          >
            Détails
          </Link>
          {hasAff ? (
            <Link
              href={o.affiliateUrl as string}
              className="rounded-2xl px-4 py-2 text-sm text-white transition hover:opacity-90 hover:shadow-md"
              style={{ backgroundColor: "#C4A092" }}
              rel="nofollow sponsored noopener"
              target="_blank"
            >
              Voir l’offre
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default async function ProductPage({
  params,
}: {
  // NOTE: ton projet tape params comme Promise — on respecte
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const [contentList, offers] = await Promise.all([fetchContent(), fetchOffers()]);

  const content =
    contentList.find((c) => (c.slug ?? "").trim().toLowerCase() === s) ||
    contentList.find((c) => c.title && slugify(c.title) === s);

  if (!content) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Fiche introuvable</h1>
        <p className="mt-2 text-sm opacity-70">Slug recherché : {s}</p>
      </main>
    );
  }

  const offer = offers.find((o) => {
    const t = (o.title || "").toLowerCase();
    const b = (o.brand || "").toLowerCase();
    return t.includes((content.title || "").toLowerCase()) || (!!content.brand && b.includes(content.brand.toLowerCase()));
  }) || offers[0] || {};

  const heroImg =
    (content.hero && /^https?:\/\//.test(content.hero) ? content.hero : undefined) ||
    (offer.imageUrl && /^https?:\/\//.test(offer.imageUrl) ? offer.imageUrl : undefined);

  const title = content.title || offer.title || "Produit";
  const brand = content.brand || offer.brand;
  const rating = content.rating;
  const price = priceToText(offer.price);
  const priceNum = priceToNumber(offer.price);

  const intro =
    content.excerpt ??
    (typeof content.bodyMd === "string" ? content.bodyMd.split(/\n{2,}/)[0] : undefined);

  // Produits liés (fallback simple)
  const related = offers
    .filter((o) => (o.title || "").toLowerCase() !== (title || "").toLowerCase())
    .slice(0, 2);

  // Palette validée
  const rootStyle: React.CSSProperties & {
    ["--accent"]: string; ["--bgMain"]: string; ["--bgLight"]: string; ["--text"]: string;
  } = {
    "--accent": "#C4A092",
    "--bgMain": "#FAF0E6",
    "--bgLight": "#EBC8B2",
    "--text": "#333333",
    backgroundColor: "var(--bgMain)",
  };

  // ---------- JSON-LD Product / Offer ----------
  const base = getBaseUrl();
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: heroImg,
    description: intro || content.excerpt,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    aggregateRating:
      typeof rating === "number"
        ? { "@type": "AggregateRating", ratingValue: rating, reviewCount: 1 }
        : undefined,
    offers: offer?.affiliateUrl
      ? {
          "@type": "Offer",
          url: offer.affiliateUrl,
          priceCurrency: "EUR",
          price: priceNum,
          availability: "https://schema.org/InStock",
        }
      : undefined,
    mainEntityOfPage: `${base}/p/${content.slug}`,
  };

  return (
    <div className="min-h-screen w-full" style={rootStyle}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* ====== TOP GRID ====== */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* IMAGE GAUCHE — cadre blanc épais */}
          <div className="rounded-[28px] bg-white p-4 shadow-sm">
            <div className="overflow-hidden rounded-[20px]">
              {heroImg ? (
                <Image
                  src={heroImg}
                  alt={title || "Produit"}
                  width={1200}
                  height={900}
                  unoptimized
                  className="w-full object-contain md:aspect-[4/3]"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm opacity-50">
                  (Pas d’image)
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE — tout le bloc tient visuellement dans la hauteur image */}
          <div className="flex flex-col">
            {/* Titre & Sous-titre */}
            <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "var(--text)" }}>
              {title}{brand ? <span className="opacity-60"> — {brand}</span> : null}
            </h1>
            {content.subtitle ? (
              <p className={`${nunito.className} mt-2 opacity-80`} style={{ color: "var(--text)" }}>
                {content.subtitle}
              </p>
            ) : null}

            {/* Ligne méta : 🍑 note + marque + prix badge */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {typeof rating === "number" && (
                <div className="flex items-center gap-2">
                  <ApricotRating value={rating} />
                  <span className={`${nunito.className} text-sm opacity-80`}>{rating}/5</span>
                </div>
              )}
              {brand ? (
                <span className={`${nunito.className} rounded-full border px-2 py-0.5 text-sm opacity-80`} style={{ borderColor: "var(--bgLight)", color: "var(--text)" }}>
                  {brand}
                </span>
              ) : null}
              {price ? (
                <span className={`${bodoni.className} rounded-xl border px-3 py-1 text-sm`} style={{ borderColor: "var(--accent)", color: "var(--text)" }}>
                  {price}
                </span>
              ) : null}
            </div>

            {/* CTAs */}
            <div className="mt-5 flex flex-wrap gap-3">
              {offer.affiliateUrl ? (
                <Link
                  href={offer.affiliateUrl}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="rounded-2xl px-5 py-3 text-sm text-white transition hover:opacity-90 hover:shadow-md"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Voir l’offre
                </Link>
              ) : null}
              <Link
                href="/offers"
                className="rounded-2xl border px-5 py-3 text-sm transition hover:opacity-90"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "transparent" }}
              >
                Voir toutes les offres
              </Link>
            </div>

            {/* En bref */}
            {intro ? (
              <div className={`${nunito.className} prose prose-sm mt-6 max-w-none`}>
                <p className="whitespace-pre-wrap" style={{ color: "var(--text)" }}>{intro}</p>
              </div>
            ) : null}

            {/* Pourquoi on aime */}
            {content.pros && content.pros.length ? (
              <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "var(--bgLight)" }}>
                <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--accent)" }}>
                  Pourquoi on aime
                </h3>
                <ul className={`${nunito.className} mt-2 list-disc pl-5`}>
                  {content.pros.map((li, i) => (
                    <li key={`pro-${i}`} className="opacity-90" style={{ color: "var(--text)" }}>
                      {li}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        {/* ====== SOUS LA GRILLE : À noter & Comment l’utiliser (2 colonnes) ====== */}
        {(content.cons && content.cons.length) || content.howto ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {content.cons && content.cons.length ? (
              <section className="rounded-3xl bg-white/50 p-6">
                <h3 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "var(--text)" }}>
                  À noter
                </h3>
                <ul className={`${nunito.className} list-disc pl-6`}>
                  {content.cons.map((c, i) => (
                    <li key={`con-${i}`} style={{ color: "var(--text)" }}>{c}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {content.howto ? (
              <section className="rounded-3xl bg-white/50 p-6">
                <h3 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "var(--text)" }}>
                  Comment l’utiliser
                </h3>
                <p className={`${nunito.className}`} style={{ color: "var(--text)" }}>
                  {content.howto}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        {/* ====== PRODUITS LIÉS ====== */}
        <div className="mt-10">
          <h2 className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>
            Produits liés
          </h2>
          {related.length === 0 ? (
            <p className={`${nunito.className} mt-2 opacity-70`} style={{ color: "var(--text)" }}>
              Aucun autre produit pour le moment.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.map((o, i) => (
                <RelatedCard key={`${o.productId || o.slug || i}-${i}`} o={o} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
