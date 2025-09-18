// app/p/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 1800;

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

type UnknownRecord = Record<string, unknown>;
type Offer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  price?: number | string | null;
  affiliateUrl?: string;
  imageUrl?: string;
};
type Content = {
  slug: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  intro?: string;
  pros?: string;
  cons?: string;
  howto?: string;
  rating?: number | null;
};

function slugify(input: string): string {
  const s = input
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produit";
}
function euro(p: number | string | null | undefined): string {
  if (p == null) return "";
  const cleaned = String(p).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num)
    ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
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
function parseRating(v: string | undefined): number | null {
  if (!v) return null;
  const s = v.replace(",", ".").replace(/[^\d.]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n;
}
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => { cur.push(cell); cell = ""; };
  const pushRow = () => { rows.push(cur); cur = []; };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") pushCell();
      else if (ch === "\n") { pushCell(); pushRow(); }
      else if (ch === "\r") { /* ignore */ }
      else cell += ch;
    }
  }
  pushCell(); pushRow();
  if (rows.length && rows[rows.length - 1].every((c) => c === "")) rows.pop();
  return rows;
}
function tableToObjects(rows: string[][]): UnknownRecord[] {
  if (rows.length === 0) return [];
  const header = rows[0]?.map((h) => h?.trim()) ?? [];
  const out: UnknownRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const o: UnknownRecord = {};
    for (let c = 0; c < header.length; c++) {
      o[header[c] || `col_${c}`] = r[c] ?? "";
    }
    out.push(o);
  }
  return out;
}

async function getOffers(): Promise<Offer[]> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const base = isProd && site ? site : vercelUrl || "";
  const href = `${base}/api/offers`;

  try {
    const res = await fetch(href, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    return (data as UnknownRecord[]).map((r) => ({
      productId: getStr(r, ["productId", "Product_ID", "ID", "id"]),
      title: getStr(r, ["title", "Title", "Nom", "name"]),
      brand: getStr(r, ["brand", "Marque", "Brand", "Marchand", "merchant"]),
      merchant: getStr(r, ["merchant", "Marchand", "Brand"]),
      price: (() => {
        const s = getStr(r, ["price", "Prix (€)"]);
        if (!s) return null;
        const num = Number(String(s).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, ""));
        return Number.isFinite(num) ? num : s;
      })(),
      affiliateUrl: getStr(r, [
        "FinalURL","finalUrl","affiliateUrl","url","URL","link",
        "Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
        "Lien affilié","Lien","Lien_achat",
        "BuyLink","Buy Link",
        "Product_URL","Product URL","URL produit",
        "Amazon_URL","ASIN_URL",
      ]),
      imageUrl: getStr(r, ["imageUrl","Image_URL","Image Url","image_url","Image","image"]),
    }));
  } catch {
    return [];
  }
}
async function getContent(): Promise<Content[]> {
  const csvUrl = process.env.SHEETS_CONTENT_CSV;
  if (!csvUrl) return [];
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) return [];
    const text = await res.text();
    const rows = parseCSV(text);
    const objs = tableToObjects(rows);
    return objs
      .map((r) => {
        const slug = getStr(r, ["Slug", "slug"]) || "";
        if (!slug) return null;
        const ratingStr = getStr(r, ["Note globale (sur 5)", "Note", "Rating", "Score"]) || undefined;
        return {
          slug,
          title: getStr(r, ["Title", "Titre", "Nom", "name"]),
          subtitle: getStr(r, ["Subtitle", "Sous-titre", "Sous titre"]),
          hero: getStr(r, ["Hero", "Hero Image", "Hero_URL", "Hero URL", "Image_Hero", "Hero_Image"]),
          intro: getStr(r, ["Intro", "Introduction"]),
          pros: getStr(r, ["Pros", "Pourquoi on aime"]),
          cons: getStr(r, ["Cons", "À noter", "A noter"]),
          howto: getStr(r, ["How to", "HowTo", "Utilisation", "Mode d'emploi"]),
          rating: parseRating(ratingStr),
        } as Content;
      })
      .filter((x): x is Content => Boolean(x));
  } catch {
    return [];
  }
}

function pickOfferForSlug(slug: string, offers: Offer[], contentTitle?: string): Offer | undefined {
  const s = slug.toLowerCase();
  const exact = offers.find((o) => slugify(o.title || "") === s);
  if (exact) return exact;
  if (contentTitle) {
    const ct = slugify(contentTitle);
    const byTitle = offers.find((o) => slugify(o.title || "") === ct);
    if (byTitle) return byTitle;
  }
  const incl = offers.find((o) => {
    const ot = slugify(o.title || "");
    return ot.includes(s) || s.includes(ot);
  });
  if (incl) return incl;
  return offers.find((o) => o.imageUrl && o.title);
}

function ApricotRating({ value }: { value: number }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const empties = 5 - full;
  return (
    <div className="flex items-center gap-2">
      <div className="text-xl" aria-hidden>
        {"🍑".repeat(full)}
        {"🍑".repeat(empties).replace(/🍑/g, "🍑")}
      </div>
      <span className={`${nunito.className} text-sm opacity-70`}>{v.toString().replace(".", ",")}/5</span>
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  // important pour ton setup
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [offers, contents] = await Promise.all([getOffers(), getContent()]);
  const content = contents.find((c) => c.slug === slug);
  const offer = pickOfferForSlug(slug, offers, content?.title);

  const title = content?.title || offer?.title || slug.replace(/-/g, " ");
  const subtitle = content?.subtitle || "";
  const brand = offer?.brand || offer?.merchant || "";
  const heroImg = content?.hero || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price ?? null);
  const affiliateUrl = offer?.affiliateUrl;
  const hasAff = typeof affiliateUrl === "string" && affiliateUrl.trim().length > 0;

  const rating = typeof content?.rating === "number" ? content.rating : null;
  const intro = content?.intro || "";
  const pros = content?.pros || "";
  const cons = content?.cons || "";
  const howto = content?.howto || "";

  const related = offers
    .filter((o) => slugify(o.title || "") !== slugify(offer?.title || ""))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* ligne: image + bloc titre/sous-titre/note/prix/cta */}
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white shadow">
          <Image
            src={heroImg}
            alt={title}
            width={1200}
            height={1200}
            unoptimized
            className="aspect-square w-full object-cover"
            priority
          />
        </div>

        <div>
          <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>{title}</h1>
          {subtitle ? <p className={`${nunito.className} mt-2 text-lg opacity-80`}>{subtitle}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {rating != null ? <ApricotRating value={rating} /> : null}
            {brand ? <span className={`${nunito.className} text-sm opacity-70`}>Marque&nbsp;: {brand}</span> : null}
            {price ? <span className={`${nunito.className} rounded-full bg-white px-3 py-1 text-sm shadow`}>{price}</span> : null}
          </div>

          {hasAff ? (
            <div className="mt-6">
              <Link
                href={affiliateUrl!}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="inline-block rounded-2xl bg-[#C4A092] px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
              >
                Voir l’offre
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Intro */}
      {intro ? (
        <section className="mt-10">
          <h2 className={`${bodoni.className} text-2xl`}>En bref</h2>
          <p className={`${nunito.className} mt-3 leading-relaxed`}>{intro}</p>
        </section>
      ) : null}

      {/* Pros sous l’intro */}
      {pros ? (
        <section className="mt-8">
          <div className="rounded-3xl bg-white p-5 shadow">
            <h3 className={`${bodoni.className} text-xl`}>Pourquoi on aime</h3>
            <ul className={`${nunito.className} mt-3 list-disc space-y-2 pl-5`}>
              {pros.split("\n").map((li, i) => (
                <li key={i}>{li.replace(/^[-•\s]+/, "").trim()}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Cons + HowTo côte à côte */}
      {(cons || howto) ? (
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          {cons ? (
            <div className="rounded-3xl bg-white p-5 shadow">
              <h3 className={`${bodoni.className} text-xl`}>À noter</h3>
              <ul className={`${nunito.className} mt-3 list-disc space-y-2 pl-5`}>
                {cons.split("\n").map((li, i) => (
                  <li key={i}>{li.replace(/^[-•\s]+/, "").trim()}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {howto ? (
            <div className="rounded-3xl bg-white p-5 shadow">
              <h3 className={`${bodoni.className} text-xl`}>Comment l’utiliser</h3>
              <p className={`${nunito.className} mt-3 leading-relaxed whitespace-pre-line`}>{howto}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Produits liés */}
      {related.length ? (
        <section className="mt-12">
          <h3 className={`${bodoni.className} text-2xl`}>Produits liés</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((o, i) => {
              const rSlug = slugify(o.title || `produit-${i}`);
              return (
                <article key={`${o.productId}-${i}`} className="overflow-hidden rounded-3xl bg-white shadow">
                  <Image
                    src={o.imageUrl || "/images/product-placeholder.jpg"}
                    alt={o.title || "Produit"}
                    width={600}
                    height={600}
                    unoptimized
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-4">
                    <h4 className={`${bodoni.className} text-lg`}>{o.title || "Produit"}</h4>
                    <p className={`${nunito.className} text-sm opacity-70`}>{o.brand || o.merchant || ""}</p>
                    <div className="mt-2 text-sm font-medium">{euro(o.price)}</div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/p/${rSlug}`} className="rounded-2xl border px-4 py-2" prefetch>
                        Détails
                      </Link>
                      {o.affiliateUrl ? (
                        <Link
                          href={o.affiliateUrl}
                          target="_blank"
                          rel="nofollow sponsored noopener"
                          className="rounded-2xl bg-[#C4A092] px-4 py-2 text-white"
                        >
                          Voir l’offre
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
