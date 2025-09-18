export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import Papa from "papaparse";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

/* ---------- Helpers ---------- */

type Rec = Record<string, unknown>;

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "produit";
}

function pick(obj: Rec | undefined, keys: string[]): string | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (k in obj) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    const hit = Object.keys(obj).find((kk) => kk.trim().toLowerCase() === k.trim().toLowerCase());
    if (hit) {
      const v = obj[hit];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return undefined;
}

function bullets(src?: string): string[] {
  if (!src) return [];
  return src
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function euro(v: string | number | undefined): string | undefined {
  if (v === undefined) return undefined;
  const num = typeof v === "number" ? v : Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isFinite(num)) return undefined;
  return num.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
}

/* ---------- Types ---------- */

type Offer = {
  productId: string;
  merchant?: string;
  price?: number;
  affiliateUrl?: string;
  imageUrl?: string;
  title?: string;
  brand?: string;
};

type Content = {
  slug: string;
  title?: string;
  subtitle?: string;
  image?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howto?: string[];
  rating?: number;
};

/* ---------- Data fetch ---------- */

async function fetchOffers(): Promise<Offer[]> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.bootyandcutie.com";
  const url = `${base}/api/offers`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json)) return [];
  return (json as Rec[]).map((r) => ({
    productId: String(pick(r, ["productId", "Product_ID", "ID"]) || ""),
    merchant: pick(r, ["merchant", "Marchand"]),
    price: Number(pick(r, ["price", "Prix (€)"])?.replace(",", ".")),
    affiliateUrl:
      pick(r, [
        "affiliateUrl",
        "Affiliate_URL",
        "FinalURL",
        "finalUrl",
        "Product_URL",
        "Amazon_URL",
        "URL",
        "url",
        "link",
      ]) || undefined,
    imageUrl: pick(r, ["imageUrl", "Image_URL", "Image", "Hero"]),
    title: pick(r, ["title", "Title", "Nom"]),
    brand: pick(r, ["brand", "Marque", "Merchant", "Marchand"]),
  }));
}

async function fetchContent(): Promise<Content[]> {
  const src = process.env.SHEETS_CONTENT_CSV;
  if (!src) return [];
  const res = await fetch(src, { cache: "no-store" });
  if (!res.ok) return [];
  const csv = await res.text();
  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (!parsed.data || !Array.isArray(parsed.data)) return [];

  return (parsed.data as Rec[]).map((row) => ({
    slug: slugify(pick(row, ["Slug"]) || ""),
    title: pick(row, ["Title", "Titre"]),
    subtitle: pick(row, ["Subtitle", "Sous-titre"]),
    image: pick(row, ["Hero", "Hero_Image", "Image", "Hero URL"]),
    intro: pick(row, ["Intro", "En bref"]),
    pros: bullets(pick(row, ["Pros", "Pourquoi on aime"])),
    cons: bullets(pick(row, ["Cons", "À noter"])),
    howto: bullets(pick(row, ["How to", "HowTo", "Comment l’utiliser"])),
    rating: (() => {
      const raw = pick(row, ["Note globale (sur 5)", "Note", "Rating"]);
      if (!raw) return undefined;
      const num = Number(String(raw).replace(",", "."));
      return Number.isFinite(num) ? num : undefined;
    })(),
  }));
}

/* ---------- UI bits ---------- */

function RatingApricots({ value = 0, outOf = 5 }: { value?: number; outOf?: number }) {
  const full = Math.floor(Math.max(0, Math.min(value, outOf)));
  const empty = Math.max(0, outOf - full);
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f-${i}`} aria-hidden>
          🧡
        </span>
      ))}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e-${i}`} aria-hidden style={{ opacity: 0.3 }}>
          🧡
        </span>
      ))}
    </span>
  );
}

function Box({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-3xl border border-[#EBD3C8] bg-[#F7ECE4]/60 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Page ---------- */

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  const [offers, contents] = await Promise.all([fetchOffers(), fetchContent()]);
  const offer = offers.find((o) => slugify(o.title || "") === slug);
  const content = contents.find((c) => c.slug === slug);

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const subtitle = content?.subtitle || "";
  const brand = offer?.brand || offer?.merchant || "";
  const heroImg =
    content?.image || offer?.imageUrl || "/images/product-placeholder.jpg";
  const priceLabel = euro(offer?.price);
  const rating = content?.rating;

  const affiliateUrl = offer?.affiliateUrl;
  const hasAff = Boolean(affiliateUrl && affiliateUrl.trim().length > 0);

  /* Produits liés simples : autres offres (max 2) */
  const related = offers
    .filter((o) => slugify(o.title || "") !== slug)
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* HERO: image gauche (bordure blanche), contenu droite */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image encadrée (épaisse bordure blanche) */}
        <div className="rounded-[28px] bg-white p-4 shadow-sm">
          <Image
            src={heroImg}
            alt={title}
            width={1200}
            height={1200}
            unoptimized
            className="h-auto w-full rounded-2xl object-contain"
            priority
          />
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          <h1
            className={`${bodoni.className} text-3xl leading-tight md:text-[34px]`}
            style={{ color: "#2E2A27" }}
          >
            {title}
          </h1>

          {subtitle ? (
            <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "#2E2A27" }}>
              {subtitle}
            </p>
          ) : null}

          {/* Ligne note + marque + prix */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {typeof rating === "number" ? (
              <>
                <RatingApricots value={rating} />
                <span className="opacity-80">{rating}/5</span>
              </>
            ) : null}
            {brand ? <span className="opacity-80">Marque : {brand}</span> : null}
            {priceLabel ? (
              <span className="rounded-full bg-[#F1E5DE] px-2 py-1">{priceLabel}</span>
            ) : null}
          </div>

          {/* CTA */}
          <div className="mt-1 flex items-center gap-3">
            {hasAff ? (
              <Link
                href={affiliateUrl as string}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="rounded-2xl bg-[#C4A092] px-5 py-3 text-white shadow-sm hover:opacity-90"
              >
                Voir l’offre
              </Link>
            ) : (
              <Link
                href="/offers"
                className="rounded-2xl bg-[#C4A092] px-5 py-3 text-white shadow-sm hover:opacity-90"
              >
                Voir l’offre
              </Link>
            )}
            <Link
              href="/offers"
              className="rounded-2xl border border-[#C4A092] px-5 py-3 text-[#C4A092] hover:opacity-90"
            >
              Voir toutes les offres
            </Link>
          </div>

          {/* Intro & Pourquoi on aime — dans la colonne droite */}
          {content?.intro ? (
            <div className="mt-2">
              <h2 className={`${bodoni.className} mb-2 text-lg`} style={{ color: "#2E2A27" }}>
                En bref
              </h2>
              <p className={`${nunito.className} text-sm leading-relaxed opacity-90`}>
                {content.intro}
              </p>
            </div>
          ) : null}

          {content?.pros?.length ? (
            <Box className="mt-2">
              <h3 className={`${bodoni.className} mb-2 text-base`} style={{ color: "#2E2A27" }}>
                Pourquoi on aime
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {content.pros.map((li, i) => (
                  <li key={`pro-${i}`}>{li}</li>
                ))}
              </ul>
            </Box>
          ) : null}
        </div>
      </section>

      {/* Sous le hero : À noter + Comment l’utiliser côte à côte */}
      {(content?.cons?.length || content?.howto?.length) && (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {content?.cons?.length ? (
            <Box>
              <h3 className={`${bodoni.className} mb-2 text-base`} style={{ color: "#2E2A27" }}>
                À noter
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {content.cons.map((li, i) => (
                  <li key={`con-${i}`}>{li}</li>
                ))}
              </ul>
            </Box>
          ) : null}

          {content?.howto?.length ? (
            <Box>
              <h3 className={`${bodoni.className} mb-2 text-base`} style={{ color: "#2E2A27" }}>
                Comment l’utiliser
              </h3>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {content.howto.map((li, i) => (
                  <li key={`how-${i}`}>{li}</li>
                ))}
              </ul>
            </Box>
          ) : null}
        </section>
      )}

      {/* Produits liés */}
      <section className="mt-10">
        <h2 className={`${bodoni.className} mb-4 text-xl`} style={{ color: "#2E2A27" }}>
          Produits liés
        </h2>
        {related.length === 0 ? (
          <p className={`${nunito.className} text-sm opacity-70`}>Aucun autre produit pour le moment.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {related.map((o) => {
              const href = `/p/${slugify(o.title || "")}`;
              return (
                <div key={o.productId} className="rounded-3xl bg-white p-4 shadow-sm">
                  <Image
                    src={o.imageUrl || "/images/product-placeholder.jpg"}
                    alt={o.title || ""}
                    width={800}
                    height={800}
                    unoptimized
                    className="h-auto w-full rounded-2xl object-contain"
                  />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <h3 className={`${bodoni.className} text-lg`} style={{ color: "#2E2A27" }}>
                        {o.title}
                      </h3>
                      <p className={`${nunito.className} text-sm opacity-80`}>{o.brand || o.merchant || ""}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={href}
                        className="rounded-2xl border border-[#C4A092] px-4 py-2 text-sm text-[#C4A092] hover:opacity-90"
                      >
                        Détails
                      </Link>
                      {o.affiliateUrl ? (
                        <Link
                          href={o.affiliateUrl}
                          target="_blank"
                          rel="nofollow sponsored noopener"
                          className="rounded-2xl bg-[#C4A092] px-4 py-2 text-sm text-white hover:opacity-90"
                        >
                          Voir l’offre
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
