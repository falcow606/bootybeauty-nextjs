// app/p/[slug]/page.tsx
export const dynamic = "force-dynamic";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type Dict = Record<string, unknown>;

type Offer = {
  productId?: string;
  merchant?: string;
  brand?: string;
  title?: string;
  imageUrl?: string;
  price?: number | string | null;
  availability?: string;
  affiliateUrl?: string;
  httpStatus?: number;
};

type Content = {
  slug: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howto?: string;
  rating?: number;
  brand?: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "produit";
}

/* ---------------- CSV parser tolérant ---------------- */
function parseCSV(text: string): Record<string,string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const split = (line: string): string[] => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/g;
    return line
      .split(re)
      .map(c => c.replace(/^"([\s\S]*)"$/, "$1").replace(/""/g, `"`).trim());
  };
  const header = split(lines[0]);
  const rows: Record<string,string>[] = [];
  for (let i=1;i<lines.length;i++){
    const cols = split(lines[i]);
    const row: Record<string,string> = {};
    header.forEach((h,idx)=>{ row[h] = cols[idx] ?? ""; });
    rows.push(row);
  }
  return rows;
}

function pick(obj: Dict, keys: string[]): string | undefined {
  for (const k of keys) {
    const hit = Object.keys(obj).find(kk => kk.trim().toLowerCase() === k.trim().toLowerCase());
    if (!hit) continue;
    const v = obj[hit];
    if (typeof v === "string") {
      const t = v.trim();
      if (t) return t;
    }
    if (typeof v === "number") return String(v);
  }
  return undefined;
}

function euro(v?: string | number | null): string {
  if (v == null) return "";
  const num = Number(String(v).replace(",", ".").replace(/[^\d.]/g,""));
  if (!Number.isFinite(num)) return String(v);
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/* ---------------- utils de narrowing ---------------- */
function toArrayOfDict(u: unknown): Dict[] {
  if (Array.isArray(u)) return u as Dict[];
  if (u && typeof u === "object") {
    const o = u as Dict;
    const items = o["items"];
    const data = o["data"];
    if (Array.isArray(items)) return items as Dict[];
    if (Array.isArray(data)) return data as Dict[];
  }
  return [];
}

/* ---------------------- FETCH OFFERS ---------------- */
async function fetchOffers(): Promise<Offer[]> {
  const url = process.env.N8N_OFFERS_API || process.env.N8N_OFFERS_URL;
  if (!url) return [];
  const headers: Record<string,string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate: 600 } };

  const res = await fetch(url, init);
  if (!res.ok) return [];
  const data: unknown = await res.json();
  const list = toArrayOfDict(data);

  return list.map((r): Offer => ({
    productId: pick(r, ["Product_ID","productId","ID"]),
    merchant: pick(r, ["Marchand","merchant"]),
    brand: pick(r, ["Marque","brand"]),
    title: pick(r, ["Title","Nom","name","title"]),
    imageUrl: pick(r, ["Image_URL","Image Url","Image URL","imageUrl","Image","image"]),
    price: pick(r, ["Prix (€)","price","Price"]),
    availability: pick(r, ["Disponibilité","availability"]),
    affiliateUrl: pick(r, ["FinalURL","finalUrl","affiliateUrl","Affiliate_URL","Affiliate URL","Lien","Lien affilié","BuyLink","Product_URL","Amazon_URL"]),
    httpStatus: Number(pick(r, ["HTTPStatus","httpStatus"]) || "0") || undefined,
  }));
}

/* ---------------------- FETCH CONTENT ---------------- */
async function fetchContent(): Promise<Content[]> {
  const url = process.env.SHEETS_CONTENT_CSV;
  if (!url) return [];
  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { cache: "no-store" }
      : { next: { revalidate: 600 } };
  const res = await fetch(url, init);
  if (!res.ok) return [];

  const rows = parseCSV(await res.text());
  return rows.map(row => {
    const slug = pick(row, ["Slug","slug"]) || slugify(pick(row, ["Title","title"]) || "");
    const title = pick(row, ["Title","title"]);
    const subtitle = pick(row, ["Subtitle","Sous-titre","subtitle"]);
    const hero = pick(row, ["Hero","Hero_Image","Hero URL","Image"]);
    const intro = pick(row, ["Intro","intro","Description"]);
    const howto = pick(row, ["How to","How_to","Howto","Comment l’utiliser","Comment utiliser","how to"]);
    const ratingStr = pick(row, ["Note globale (sur 5)","rating","note"]);
    const rating = ratingStr ? Number(String(ratingStr).replace(",", ".")) : undefined;

    const prosRaw = pick(row, ["Pros","Pourquoi on aime","Avantages"]);
    const consRaw = pick(row, ["Cons","À noter","Inconvénients"]);
    const splitLines = (t?: string) =>
      t ? t.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];

    return {
      slug,
      title,
      subtitle,
      hero,
      intro,
      pros: splitLines(prosRaw),
      cons: splitLines(consRaw),
      howto,
      rating,
      brand: pick(row, ["Brand","Marque"]),
    };
  });
}

function matchBySlug(slug: string, offer: Offer): boolean {
  const fromTitle = offer.title ? slugify(offer.title) : "";
  return fromTitle === slug;
}

/* ---------------------- Page produit ---------------- */
type PageProps = { params: { slug: string } };

export default async function ProductPage({ params }: PageProps) {
  const slug = params.slug;

  const offers = await fetchOffers();
  const offer =
    offers.find(o => (pick(o as Dict, ["Slug","slug"]) || "").toLowerCase() === slug.toLowerCase()) ||
    offers.find(o => matchBySlug(slug, o)) ||
    null;

  const contents = await fetchContent();
  const content =
    contents.find(c => c.slug.toLowerCase() === slug.toLowerCase()) || null;

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const brand = content?.brand || offer?.brand || offer?.merchant || "";
  const hero = content?.hero || offer?.imageUrl || "/images/product-placeholder.jpg";
  const priceTxt = euro(offer?.price ?? null);
  const affiliateUrl = offer?.affiliateUrl;
  const hasAff = typeof affiliateUrl === "string" && affiliateUrl.trim().length > 0;

  const rating = content?.rating;
  const ratingIconsCount = rating ? Math.round(Math.min(5, Math.max(0, rating))) : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF0E6" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-3 shadow">
            <Image
              src={hero}
              alt={title}
              width={1280}
              height={1280}
              unoptimized
              className="h-auto w-full rounded-2xl object-cover"
              priority
            />
          </div>

          <div className="flex flex-col">
            <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "#333" }}>
              {title}
            </h1>
            {brand && (
              <p className="mt-1 opacity-70" style={{ color: "#333" }}>
                — {brand}
              </p>
            )}

            <div className="mt-4 flex items-center gap-4">
              {ratingIconsCount > 0 && (
                <div aria-label={`Note ${rating}/5`}>
                  {Array.from({ length: ratingIconsCount }).map((_, i) => (
                    <span key={i} aria-hidden>🍑</span>
                  ))}
                  {rating && <span className="ml-2 opacity-70">{rating}/5</span>}
                </div>
              )}
              {priceTxt && <span className="rounded-lg bg-white/70 px-2 py-1 text-sm">{priceTxt}</span>}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {hasAff && (
                <Link
                  href={affiliateUrl!}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className={`${nunito.className} rounded-2xl bg-[#C4A092] px-5 py-3 text-white hover:opacity-90`}
                >
                  Voir l’offre
                </Link>
              )}
              <Link
                href="/offers"
                className={`${nunito.className} rounded-2xl border px-5 py-3 hover:bg-white/40`}
              >
                Voir toutes les offres
              </Link>
            </div>
          </div>
        </section>

        {content?.intro && (
          <section className="mt-10">
            <h2 className={`${bodoni.className} mb-3 text-2xl`} style={{ color: "#333" }}>
              En bref
            </h2>
            <p className={`${nunito.className} leading-relaxed`} style={{ color: "#333" }}>
              {content.intro}
            </p>
          </section>
        )}

        {(content?.pros?.length || content?.cons?.length || content?.howto) && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            {content?.pros?.length ? (
              <div className="rounded-3xl border p-5" style={{ borderColor: "#EBC8B2" }}>
                <h3 className={`${bodoni.className} text-xl mb-2`} style={{ color: "#333" }}>
                  Pourquoi on aime
                </h3>
                <ul className={`${nunito.className} list-disc pl-5 space-y-1`} style={{ color: "#333" }}>
                  {content.pros.map((li, idx) => <li key={idx}>{li}</li>)}
                </ul>
              </div>
            ) : null}

            <div className="space-y-6">
              {content?.cons?.length ? (
                <div className="rounded-3xl border p-5" style={{ borderColor: "#EBC8B2" }}>
                  <h3 className={`${bodoni.className} text-xl mb-2`} style={{ color: "#333" }}>
                    À noter
                  </h3>
                  <ul className={`${nunito.className} list-disc pl-5 space-y-1`} style={{ color: "#333" }}>
                    {content.cons.map((li, idx) => <li key={idx}>{li}</li>)}
                  </ul>
                </div>
              ) : null}

              {content?.howto ? (
                <div className="rounded-3xl border p-5" style={{ borderColor: "#EBC8B2" }}>
                  <h3 className={`${bodoni.className} text-xl mb-2`} style={{ color: "#333" }}>
                    Comment l’utiliser
                  </h3>
                  <p className={`${nunito.className} leading-relaxed`} style={{ color: "#333" }}>
                    {content.howto}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className={`${bodoni.className} mb-3 text-2xl`} style={{ color: "#333" }}>
            Produits liés
          </h2>
          <p className={`${nunito.className} opacity-70`}>Aucun autre produit pour le moment.</p>
        </section>
      </main>
    </div>
  );
}
