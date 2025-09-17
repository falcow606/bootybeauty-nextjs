// app/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

type UnknownRecord = Record<string, unknown>;
type FeaturedProduct = {
  id?: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  price?: string;
  affiliateUrl?: string;
  slug?: string;
};

function slugify(input: string): string {
  const s = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "produit";
}
function truthy(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v > 0;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return undefined;
}
function mapOffer(row: UnknownRecord): FeaturedProduct {
  return {
    id: getStr(row, ["Product_ID", "ID", "id"]),
    title: getStr(row, ["Title", "Nom", "name"]) ?? "Produit",
    brand: getStr(row, ["Marque", "Brand", "Marchand"]),
    imageUrl: getStr(row, ["imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image","Hero","Hero_Image","Hero URL","Image_Hero"]),
    price: getStr(row, ["Prix (€)", "Price", "price"]),
    affiliateUrl: getStr(row, [
      "affiliateUrl","finalUrl","url","link",
      "Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
      "Lien affilié","Lien","Lien_achat","BuyLink","Buy Link",
      "Product_URL","Product URL","URL produit","Amazon_URL","ASIN_URL"
    ]),
    slug: getStr(row, ["Slug", "slug"]),
  };
}

async function getFeaturedOffers(): Promise<FeaturedProduct[]> {
  const url = process.env.N8N_FEATURED_URL || process.env.N8N_OFFERS_URL;
  if (!url) return [];

  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = String(process.env.N8N_OFFERS_KEY);

  const fetchInit: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate: 1800 } };

  const res = await fetch(url, fetchInit);
  if (!res.ok) return [];

  const json = (await res.json()) as unknown;
  const items: UnknownRecord[] = Array.isArray(json)
    ? (json as UnknownRecord[])
    : ((json as UnknownRecord)?.items as UnknownRecord[]) ||
      ((json as UnknownRecord)?.data as UnknownRecord[]) ||
      [];

  const filtered = process.env.N8N_FEATURED_URL
    ? items
    : items.filter((r) => truthy(r["Featured"]) || truthy(r["A l affiche"]) || truthy(r["Featured?"]));

  filtered.sort((a, b) => {
    const ao = Number(getStr(a, ["Featured_Order", "featured_order"]) ?? "999");
    const bo = Number(getStr(b, ["Featured_Order", "featured_order"]) ?? "999");
    if (ao !== bo) return ao - bo;
    const ad = new Date(getStr(a, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
    const bd = new Date(getStr(b, ["UpdatedAt", "updatedAt"]) ?? 0).getTime();
    return bd - ad;
  });

  return filtered.slice(0, 3).map(mapOffer);
}

// —————————————————————————————————————

export default async function HomePage() {
  const featured = await getFeaturedOffers();

  const rootStyle = {
    ["--accent" as any]: "#C4A092",
    ["--secondary" as any]: "#DABCB2",
    ["--bg-light" as any]: "#EBC8B2",
    ["--bg-main" as any]: "#FAF0E6",
    ["--text" as any]: "#333333",
    backgroundColor: "var(--bg-main)",
  } as React.CSSProperties;

  return (
    <div className="min-h-screen w-full" style={rootStyle}>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-8 pt-10 md:grid-cols-2">
        <div>
          <h1 className={`${bodoni.className} text-4xl leading-tight md:text-5xl`} style={{ color: "var(--text)" }}>
            Sélection beauté <span style={{ color: "var(--accent)" }}>tendance</span> &<br />
            bons <span style={{ color: "var(--accent)" }}>plans</span>
          </h1>
          <p className={`${nunito.className} mt-4 text-base opacity-80 md:text-lg`} style={{ color: "var(--text)" }}>
            Bienvenue sur Booty & Cutie, le blog beauté qui t’aide à trouver les meilleurs soins pour les fesses, les produits intimes sûrs et tous les bons plans beauté du moment.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/offers" className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md" style={{ backgroundColor: "var(--accent)" }}>
              Voir les Top 10
            </Link>
            <Link href="/blog" className="rounded-2xl border px-5 py-3 transition" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
              Notre méthode
            </Link>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/images/hero-curves.jpg"
            alt="Courbes douces, esthétique clean — Booty & Cutie"
            width={1200}
            height={900}
            unoptimized
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
            priority
          />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-3xl opacity-30 blur-md" style={{ backgroundColor: "var(--accent)" }} />
          <div className="absolute -top-4 -right-4 h-20 w-20 rounded-3xl opacity-30 blur-md" style={{ backgroundColor: "var(--secondary)" }} />
        </div>
      </section>

      {/* SÉLECTION DU MOMENT */}
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="grid gap-8 md:grid-cols-3">
          {(featured && featured.length
            ? featured
            : [
                { title: "Bom Dia Bright Cream", price: "", imageUrl: "/images/bom-dia-bright-cream.jpg", brand: "", affiliateUrl: "" },
                { title: "Beauty Booty Lightening Cream", price: "", imageUrl: "/images/beauty-booty-whitening.jpg", brand: "", affiliateUrl: "" },
                { title: "Huile Corps Sublimatrice Body Sunshine", price: "", imageUrl: "/images/huile-corps-sunshine.jpg", brand: "", affiliateUrl: "" },
              ]
          ).map((p, i) => {
            const detailsSlug = p.slug || (p.title ? slugify(p.title) : "");
            const detailsHref = detailsSlug ? `/p/${detailsSlug}` : "/offers";
            const hasAff = typeof p.affiliateUrl === "string" && p.affiliateUrl.trim().length > 0;
            return (
              <article key={p.id || p.slug || p.title || String(i)} className="flex flex-col rounded-3xl bg-white p-5 shadow-md">
                <Image src={p.imageUrl || "/images/product-placeholder.jpg"} alt={`${p.title} — photo produit`} width={600} height={600} unoptimized className="aspect-square w-full rounded-2xl object-cover" />
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--accent)" }}>{p.title}</h3>
                    <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "var(--text)" }}>
                      {p.brand ? p.brand : "Soin corps • 200 ml"}
                    </p>
                  </div>
                  {featured?.length ? (
                    <span className={`${nunito.className} inline-block rounded-full px-3 py-1 text-sm`} style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--bg-light)", color: "var(--text)" }}>
                      À l'affiche
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>{p.price || ""}</span>
                  <div className="flex items-center gap-2">
                    <Link href={detailsHref} className="rounded-2xl border px-5 py-3 transition" style={{ borderColor: "var(--accent)", color: "var(--accent)" }} prefetch>
                      Détails
                    </Link>
                    {hasAff ? (
                      <a
                        href={p.affiliateUrl as string}
                        target="_blank"
                        rel="nofollow sponsored noopener"
                        className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        Voir l’offre
                      </a>
                    ) : (
                      <Link href="/offers" className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md" style={{ backgroundColor: "var(--accent)" }}>
                        Voir l’offre
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
            <h4 className={`${bodoni.className} text-lg`} style={{ color: "var(--text)" }}>Sélection éditoriale</h4>
            <p className={`${nunito.className} mt-2 text-sm opacity-80`} style={{ color: "var(--text)" }}>Nos choix sont indépendants et argumentés.</p>
          </div>
          <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
            <h4 className={`${bodoni.className} text-lg`} style={{ color: "var(--text)" }}>Transparence affiliée</h4>
            <p className={`${nunito.className} mt-2 text-sm opacity-80`} style={{ color: "var(--text)" }}>Nous le signalons clairement quand un lien est affilié.</p>
          </div>
          <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
            <h4 className={`${bodoni.className} text-lg`} style={{ color: "var(--text)" }}>Mises à jour</h4>
            <p className={`${nunito.className} mt-2 text-sm opacity-80`} style={{ color: "var(--text)" }}>Offres et contenus rafraîchis régulièrement.</p>
          </div>
        </section>

        <div className="mt-12 flex items-center justify-center">
          <Link href="/offers" className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md" style={{ backgroundColor: "var(--accent)" }}>
            Voir toutes les offres
          </Link>
        </div>
      </main>

      <footer className="mt-6">
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className={`${nunito.className} rounded-3xl p-6`} style={{ backgroundColor: "var(--secondary)", color: "#333" }}>
            <p className="text-sm">
              <strong>Transparence&nbsp;:</strong> Certains liens sont affiliés. Nous pouvons percevoir une commission si vous achetez via nos liens. Cela ne change rien au prix et nous aide à maintenir ce site.
            </p>
          </div>
          <p className={`${nunito.className} mt-6 text-center text-xs opacity-70`} style={{ color: "var(--text)" }}>
            © {new Date().getFullYear()} Booty & Cutie — Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
