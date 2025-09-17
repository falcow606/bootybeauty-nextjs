export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 900;

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard, { type CardOffer } from "@/components/OfferCard";
import { getContentBySlug } from "@/lib/sheets";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

/* -------------------- helpers -------------------- */

function slugify(input: string): string {
  return (input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "produit";
}

function resolveBaseUrl(): string {
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`.replace(/\/+$/, "");
  const pub = process.env.NEXT_PUBLIC_SITE_URL;
  if (pub) return pub.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return "";
}

async function fetchOffers(): Promise<CardOffer[]> {
  const base = resolveBaseUrl();
  if (base) {
    try {
      const res = await fetch(`${base}/api/offers`, { cache: "no-store" });
      if (res.ok) {
        const json: unknown = await res.json();
        if (Array.isArray(json)) return json as CardOffer[];
      }
    } catch { /* ignore */ }
  }
  const n8n = process.env.N8N_OFFERS_URL || process.env.N8N_OFFERS_API || "";
  if (n8n) {
    try {
      const init: RequestInit & { next?: { revalidate?: number } } = { next: { revalidate: 300 } };
      if (process.env.N8N_OFFERS_KEY) {
        init.headers = { "x-api-key": String(process.env.N8N_OFFERS_KEY) };
      }
      const res = await fetch(n8n, init);
      if (res.ok) {
        const j: unknown = await res.json();
        const rows =
          (Array.isArray(j) ? j :
            (typeof j === "object" && j !== null)
              ? ((j as { items?: unknown; data?: unknown }).items ??
                 (j as { items?: unknown; data?: unknown }).data)
              : []) as unknown;
        if (Array.isArray(rows)) return rows as CardOffer[];
      }
    } catch { /* ignore */ }
  }
  return [];
}

function displayPrice(p?: string | number): string {
  if (p == null || p === "") return "";
  if (typeof p === "number") {
    return p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }
  const num = Number(String(p).replace(",", "."));
  return Number.isFinite(num)
    ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}

function readSchema(
  schema: Record<string, unknown> | undefined
): {
  subtitle?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howTo?: string;
  rating?: number;
} {
  if (!schema || typeof schema !== "object") return {};
  const s = schema as Record<string, unknown>;
  const getStr = (k: string): string | undefined => (typeof s[k] === "string" ? (s[k] as string) : undefined);
  const getArr = (k: string): string[] | undefined => {
    const v = s[k];
    if (Array.isArray(v)) return v.filter(x => typeof x === "string") as string[];
    if (typeof v === "string") return v.split("\n").map(x => x.replace(/^[•\-\s]+/, "").trim()).filter(Boolean);
    return undefined;
  };
  const getNum = (k: string): number | undefined => (typeof s[k] === "number" ? (s[k] as number) : undefined);

  return {
    subtitle: getStr("subtitle") ?? getStr("subTitle"),
    intro: getStr("intro"),
    pros: getArr("pros"),
    cons: getArr("cons"),
    howTo: getStr("howTo") ?? getStr("howto"),
    rating: getNum("rating"),
  };
}

/* --- rating (abricots SVG) + nombre --- */

function ApricotIcon({ filled = 1 }: { filled?: 0 | 0.5 | 1 }) {
  const id = Math.random().toString(36).slice(2, 8);
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      {filled === 0.5 && (
        <defs>
          <linearGradient id={`half-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor="#FF8C5A" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 21c-4.2 0-7.5-3.4-7.5-7.6 0-2.9 1.9-5.4 4.6-6.4.6-.2 1.2-.3 1.9-.3.7 0 1.3.1 1.9.3 2.7 1 4.6 3.5 4.6 6.4 0 4.2-3.4 7.6-7.5 7.6z"
        fill={filled === 1 ? "#FF8C5A" : filled === 0.5 ? `url(#half-${id})` : "transparent"}
        stroke="#FF8C5A"
        strokeWidth="1.2"
      />
      <ellipse cx="12" cy="13" rx="2.1" ry="3.1" fill="#8B4B2E" opacity="0.9" />
      <path d="M14.5 6.2c1.7-.4 3-.9 3.8-2 .3-.4.4-.9.2-1.3-.2-.4-.7-.6-1.1-.5-1.3.3-2.8 1.3-3.8 2.8"
        fill="#5CAB67" />
    </svg>
  );
}

function ApricotRating({ value = 0 }: { value?: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center gap-1" aria-label={`Note ${v}/5`}>
      {Array.from({ length: full }).map((_, i) => <ApricotIcon key={`f-${i}`} filled={1} />)}
      {half ? <ApricotIcon filled={0.5} /> : null}
      {Array.from({ length: empty }).map((_, i) => <ApricotIcon key={`e-${i}`} filled={0} />)}
    </div>
  );
}

/* -------------------- page -------------------- */
/** Next types: `params` sous forme de Promise dans ton build */
type PageProps = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const [offers, content] = await Promise.all([fetchOffers(), getContentBySlug(slug)]);

  const bySlug = (o: CardOffer): boolean =>
    (o.slug ? slugify(o.slug) : slugify(o.title ?? "")) === slug;

  const offer = offers.find(bySlug);

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const brand = offer?.brand || offer?.merchant || "";
  const heroImg = (content as { image?: string } | undefined)?.image || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = displayPrice(offer?.price);

  // Lire les champs éditoriaux depuis content.schema si présent
  const schema = (content as { schema?: Record<string, unknown> } | undefined)?.schema;
  const meta = readSchema(schema);
  const subtitle = meta.subtitle;
  const intro = meta.intro;
  const pros = meta.pros;
  const cons = meta.cons;
  const howTo = meta.howTo;
  const rating = meta.rating;

  // Produits liés (3 max)
  const related: CardOffer[] = offers.filter(o => !bySlug(o)).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-6">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image à gauche — cadre validé + ratio maîtrisé */}
        <div className="rounded-3xl bg-white p-3 shadow-md">
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: "#FAF0E6" }}>
            <Image
              src={heroImg}
              alt={title || "Produit"}
              width={1200}
              height={900}
              unoptimized
              className="w-full object-contain md:aspect-[4/3]"
              priority
            />
          </div>
        </div>

        {/* À droite : titre + sous-titre + note + bouton “Voir toutes les offres” + intro */}
        <div className="flex flex-col">
          <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "#333" }}>
            {title}{brand ? <span className="opacity-60"> — {brand}</span> : null}
          </h1>

          {subtitle ? (
            <p className={`${nunito.className} mt-2 opacity-80`}>{subtitle}</p>
          ) : null}

          <div className="mt-3 flex items-center gap-4">
            {typeof rating === "number" && (
              <div className="flex items-center gap-2">
                <ApricotRating value={rating} />
                <span className={`${nunito.className} text-sm opacity-80`}>{rating}/5</span>
              </div>
            )}
            {price ? <span className={`${bodoni.className} text-lg`} style={{ color: "#333" }}>{price}</span> : null}
          </div>

          <div className="mt-5">
            <Link
              href="/offers"
              className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
              style={{ borderColor: "#C4A092", color: "#C4A092", background: "transparent" }}
            >
              Voir toutes les offres
            </Link>
          </div>

          {intro ? (
            <div className={`${nunito.className} prose prose-sm mt-6 max-w-none`}>
              <p style={{ color: "#333" }}>{intro}</p>
            </div>
          ) : null}

          {/* Pros sous l’intro */}
          {pros && pros.length ? (
            <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: "#EBC8B2" }}>
              <h3 className={`${bodoni.className} text-xl`} style={{ color: "#C4A092" }}>Pourquoi on aime</h3>
              <ul className={`${nunito.className} mt-2 list-disc pl-5`}>
                {pros.map((li, i) => (
                  <li key={i} className="opacity-90">{li}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {/* En dessous : “À noter” + “Comment l’utiliser” côte à côte */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {cons && cons.length ? (
          <div className="rounded-2xl border p-4" style={{ borderColor: "#EBC8B2" }}>
            <h3 className={`${bodoni.className} text-xl`} style={{ color: "#C4A092" }}>À noter</h3>
            <ul className={`${nunito.className} mt-2 list-disc pl-5`}>
              {cons.map((li, i) => (
                <li key={i} className="opacity-90">{li}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {howTo ? (
          <div className="rounded-2xl border p-4" style={{ borderColor: "#EBC8B2" }}>
            <h3 className={`${bodoni.className} text-xl`} style={{ color: "#C4A092" }}>Comment l’utiliser</h3>
            <p className={`${nunito.className} mt-2 opacity-90`}>{howTo}</p>
          </div>
        ) : null}
      </div>

      {/* Produits liés */}
      <div className="mt-10">
        <h2 className={`${bodoni.className} text-2xl`} style={{ color: "#333" }}>Produits liés</h2>
        {related.length === 0 ? (
          <p className={`${nunito.className} mt-2 opacity-70`}>Aucun autre produit pour le moment.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((o, i) => (
              <OfferCard key={`${o.productId || o.slug || o.title || i}-${i}`} offer={o} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
