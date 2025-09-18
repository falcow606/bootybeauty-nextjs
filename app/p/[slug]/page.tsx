export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import Papa from "papaparse";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ---------- Types ----------
type UnknownRecord = Record<string, unknown>;
type Params = { slug: string };

type CardOffer = {
  productId?: string;
  merchant?: string;
  title?: string;
  brand?: string;
  price?: number | string | null;
  availability?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  slug?: string;
  category?: string;
};

type Content = {
  slug: string;
  title: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howto?: string;
  rating?: number;
};

// ---------- Helpers ----------
function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produit";
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const raw of keys) {
    if (raw in obj) {
      const v = obj[raw];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    const hit = Object.keys(obj).find((k) => k.trim().toLowerCase() === raw.trim().toLowerCase());
    if (hit) {
      const v = obj[hit];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return undefined;
}
function euro(v: string | number | null | undefined): string {
  if (v == null) return "";
  const num =
    typeof v === "number"
      ? v
      : Number(String(v).replace(/\s/g, "").replace("€", "").replace(",", "."));
  if (!Number.isFinite(num)) return String(v);
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function isPromise(v: unknown): v is Promise<unknown> {
  return typeof v === "object" && v !== null && "then" in (v as Record<string, unknown>);
}

// ---------- Data loaders ----------
async function loadOffers(): Promise<CardOffer[]> {
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") ||
    "https://bootybeauty-nextjs.vercel.app";

  const url =
    process.env.N8N_OFFERS_API ||
    (typeof window === "undefined" ? `${base}/api/offers` : "/api/offers");

  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate: 900 } };

  const res = await fetch(url, init);
  if (!res.ok) return [];

  const raw = (await res.json()) as UnknownRecord[];
  const out: CardOffer[] = raw.map((r) => {
    const title = getStr(r, ["title", "Title"]) ?? "";
    const affiliate =
      getStr(r, [
        "affiliateUrl",
        "Affiliate_URL",
        "FinalURL",
        "finalUrl",
        "URL",
        "Product_URL",
        "Amazon_URL",
      ]) ?? "";
    const slug = slugify(title);
    const priceStr = getStr(r, ["price", "Prix (€)"]);
    const image =
      getStr(r, ["imageUrl", "Image_URL", "Image Url", "Image"]) ??
      "/images/product-placeholder.jpg";
    return {
      productId: getStr(r, ["productId", "Product_ID", "ID"]),
      merchant: getStr(r, ["merchant", "Marchand"]),
      title,
      brand: getStr(r, ["brand", "Marque"]),
      price: priceStr ?? null,
      availability: getStr(r, ["availability", "Disponibilité"]),
      affiliateUrl: affiliate,
      imageUrl: image,
      slug,
      category: getStr(r, ["Catégorie", "category"]),
    };
  });
  return out;
}

async function loadContent(): Promise<Content[]> {
  const csvUrl = process.env.SHEETS_CONTENT_CSV;
  if (!csvUrl) return [];
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) return [];
  const text = await res.text();

  // ✅ Papa Parse gère les sauts de ligne dans les champs entre guillemets (Pros/Cons/HowTo)
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = (parsed.data as unknown[]).filter((r) => r && typeof r === "object") as UnknownRecord[];

  const items: Content[] = rows.map((r) => {
    const slug =
      getStr(r, ["Slug"]) || slugify(getStr(r, ["Title"]) ?? getStr(r, ["Nom"]) ?? "produit");
    const noteStr = getStr(r, ["Note globale (sur 5)", "Note", "Rating"]);
    const rating = noteStr ? Number(String(noteStr).replace(",", ".")) : undefined;

    const prosRaw = getStr(r, ["Pros"]) ?? "";
    const consRaw = getStr(r, ["Cons"]) ?? "";
    const pros = prosRaw ? prosRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];
    const cons = consRaw ? consRaw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [];

    return {
      slug,
      title: getStr(r, ["Title", "Nom"]) ?? "Produit",
      subtitle: getStr(r, ["Subtitle"]),
      hero: getStr(r, ["Hero", "Image", "Hero_Image", "Hero URL"]),
      intro: getStr(r, ["Intro", "Description"]),
      pros,
      cons,
      howto: getStr(r, ["How to", "HowTo", "Comment l’utiliser", "Comment l'utiliser"]),
      rating,
    };
  });

  return items;
}

// ---------- Abricots ----------
function Apricots({ value = 0 }: { value?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-1 align-middle" aria-label={`${filled}/5`} title={`${filled}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < filled ? "" : "opacity-30"} aria-hidden="true">
          🍑
        </span>
      ))}
    </span>
  );
}

// =======================================================
// ===============   PAGE PRODUIT   ======================
// =======================================================

export default async function ProductPage(props: unknown) {
  // params peut être un objet OU une promesse (Next 15)
  let slug = "";
  const maybe = (props as { params?: unknown }).params;
  if (isPromise(maybe)) {
    const resolved = (await maybe) as { slug?: unknown };
    slug = typeof resolved?.slug === "string" ? resolved.slug : "";
  } else {
    slug = typeof (maybe as { slug?: unknown })?.slug === "string" ? (maybe as { slug: string }).slug : "";
  }
  if (!slug) slug = "produit";

  const [offers, contents] = await Promise.all([loadOffers(), loadContent()]);

  const offer = offers.find((o) => o.slug === slug) ?? null;
  const content = contents.find((c) => c.slug === slug) ?? null;

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const subtitle = content?.subtitle;
  const brand = offer?.brand || offer?.merchant || "";
  const heroImg = content?.hero || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price ?? null);
  const rating = content?.rating ?? undefined;

  const affiliateUrl = offer?.affiliateUrl;
  const hasAff = typeof affiliateUrl === "string" && affiliateUrl.trim().length > 0;

  // Produits liés
  const related = offers
    .filter((o) => o.slug !== slug && (o.category && o.category === offer?.category))
    .slice(0, 2);
  const fallbackRelated =
    related.length > 0 ? related : offers.filter((o) => o.slug !== slug).slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Bandeau principal */}
      <section className="grid gap-8 md:grid-cols-2">
        {/* Image avec cadre blanc épais */}
        <div className="rounded-[22px] bg-white p-3 shadow-sm">
          <Image
            src={heroImg}
            alt={title}
            width={1200}
            height={1200}
            className="h-auto w-full rounded-[18px] object-cover"
            unoptimized
            priority
          />
        </div>

        {/* Titre + meta + CTAs */}
        <div className="flex flex-col">
          <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>{title}</h1>
          {subtitle ? (
            <p className={`${nunito.className} mt-1 text-sm opacity-80`}>{subtitle}</p>
          ) : null}

          {/* rating / marque / prix */}
          <div className={`${nunito.className} mt-3 flex flex-wrap items-center gap-3 text-sm`}>
            <Apricots value={rating ?? 0} />
            {typeof rating === "number" ? <span>{Math.round(rating)}/5</span> : null}
            {brand ? <span>Marque&nbsp;: {brand}</span> : null}
            {price ? <span className="rounded-full bg-neutral-100 px-2 py-0.5">{price}</span> : null}
          </div>

          {/* CTAs */}
          <div className="mt-4 flex items-center gap-3">
            {hasAff ? (
              <Link
                href={affiliateUrl!}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="rounded-2xl bg-[#C4A092] px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
              >
                Voir l’offre
              </Link>
            ) : null}
            <Link
              href="/offers"
              className="rounded-2xl border border-[#C4A092] px-5 py-3 text-[#C4A092] transition hover:opacity-90"
            >
              Voir toutes les offres
            </Link>
          </div>
        </div>
      </section>

      {/* En bref */}
      {content?.intro ? (
        <section className={`${nunito.className} mt-8 leading-relaxed`}>
          <h2 className={`${bodoni.className} mb-2 text-xl`}>En bref</h2>
          <p>{content.intro}</p>
        </section>
      ) : null}

      {/* Pourquoi on aime */}
      {content?.pros && content.pros.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-white/50 p-6">
          <h3 className={`${bodoni.className} mb-2 text-lg`}>Pourquoi on aime</h3>
          <ul className={`${nunito.className} list-disc pl-6`}>
            {content.pros.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* À noter + Comment l’utiliser (côte à côte) */}
      {(content?.cons?.length ?? 0) > 0 || content?.howto ? (
        <section className="mt-6 grid gap-6 md:grid-cols-2">
          {content?.cons && content.cons.length > 0 ? (
            <div className="rounded-3xl bg-white/50 p-6">
              <h3 className={`${bodoni.className} mb-2 text-lg`}>À noter</h3>
              <ul className={`${nunito.className} list-disc pl-6`}>
                {content.cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {content?.howto ? (
            <div className="rounded-3xl bg-white/50 p-6">
              <h3 className={`${bodoni.className} mb-2 text-lg`}>Comment l’utiliser</h3>
              <p className={`${nunito.className}`}>{content.howto}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Produits liés */}
      <section className="mt-10">
        <h2 className={`${bodoni.className} mb-4 text-xl`}>Produits liés</h2>
        {fallbackRelated.length === 0 ? (
          <p className={`${nunito.className} text-sm opacity-70`}>Aucun autre produit pour le moment.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {fallbackRelated.map((o, i) => (
              <OfferCard key={o.slug ?? String(i)} offer={o} originSlug={slug} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
