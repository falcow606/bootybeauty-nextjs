export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

type ContentSummary = { slug: string; title: string; brand?: string };

function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produit";
}
function normalize(input?: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  // clé affiliée très défensive (toutes les variantes courantes)
  const affiliate =
    getStr(row, [
      "Affiliate_URL",
      "Affiliate URL",
      "Affiliate Url",
      "affiliateUrl",
      "FinalURL",
      "finalUrl",
      "BuyLink",
      "Buy Link",
      "Product_URL",
      "Product URL",
      "URL produit",
      "url",
      "link",
    ]) || undefined;

  return {
    id: getStr(row, ["Product_ID", "ID", "id"]),
    title: getStr(row, ["Title", "Nom", "name"]) ?? "Produit",
    brand: getStr(row, ["Marque", "Brand", "Marchand"]),
    imageUrl: getStr(row, [
      "imageUrl",
      "Image_URL",
      "Image Url",
      "Image URL",
      "image_url",
      "Image",
      "image",
      "Hero",
      "Hero_Image",
      "Hero URL",
      "Image_Hero",
    ]),
    price: getStr(row, ["Prix (€)", "Price", "price"]),
    affiliateUrl: affiliate,
    slug: getStr(row, ["Slug", "slug"]),
  };
}

function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (host) return `https://${host.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

async function getFeaturedOffers(): Promise<FeaturedProduct[]> {
  // On lit la source N8N (ou OFFERS) puis on filtre Featured
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

  // si N8N_FEATURED_URL n’est pas défini, on prend les lignes où Featured == oui/true
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

async function getContentSummary(): Promise<ContentSummary[]> {
  const res = await fetch(`${getBaseUrl()}/api/content`, { cache: "no-store" });
  if (!res.ok) return [];
  const list = (await res.json()) as Array<{ slug: string; title: string; brand?: string }>;
  // Nettoyage défensif
  return Array.isArray(list)
    ? list
        .filter((x) => typeof x?.slug === "string" && typeof x?.title === "string")
        .map((x) => ({ slug: x.slug, title: x.title, brand: x.brand }))
    : [];
}

function findCanonicalSlug(p: FeaturedProduct, content: ContentSummary[]): string | undefined {
  // 1) slug exact si fourni par la source et existant côté /api/content
  if (p.slug) {
    const exact = content.find((c) => c.slug.toLowerCase() === p.slug!.toLowerCase());
    if (exact) return exact.slug;
  }
  // 2) match slugifié par titre
  if (p.title) {
    const s = slugify(p.title);
    const byTitle = content.find((c) => slugify(c.title) === s);
    if (byTitle) return byTitle.slug;
  }
  // 3) score tolérant (titre + marque)
  const nTitle = normalize(p.title);
  const nBrand = normalize(p.brand);
  let best: { slug: string; score: number } | undefined;
  for (const c of content) {
    let score = 0;
    const ct = normalize(c.title);
    const cb = normalize(c.brand);
    if (nTitle && ct.includes(nTitle)) score += 3;
    if (nBrand && cb && cb.includes(nBrand)) score += 2;
    if (nBrand && ct.includes(nBrand)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { slug: c.slug, score };
  }
  return best?.slug;
}

type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

export default async function HomePage() {
  const [featured, content] = await Promise.all([getFeaturedOffers(), getContentSummary()]);

  const rootStyle: CSSVars = {
    "--accent": "#C4A092",
    "--secondary": "#DABCB2",
    "--bg-light": "#EBC8B2",
    "--bg-main": "#FAF0E6",
    "--text": "#333333",
    backgroundColor: "var(--bg-main)",
  };

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
            Bienvenue sur Booty & Cutie, le blog beauté qui t’aide à trouver les meilleurs soins pour les fesses, les
            produits intimes sûrs et tous les bons plans beauté du moment.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrimaryButton href="/offers" aria-label="Voir les meilleures offres">
              Voir les Top 10
            </PrimaryButton>
            <SecondaryButton href="/blog">Notre méthode</SecondaryButton>
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
            // >>>>>>>>>>>>> NOUVELLE LOGIQUE DE LIEN (slug canonique depuis /api/content) <<<<<<<<<<<<<
            const canonical = findCanonicalSlug(p, content);
            const detailsSlug = canonical || p.slug || (p.title ? slugify(p.title) : "");
            const detailsHref = detailsSlug ? `/p/${detailsSlug}` : "/offers";
            const hasAff = typeof p.affiliateUrl === "string" && p.affiliateUrl.length > 0;

            return (
              <ProductCard
                key={p.id || p.slug || p.title || String(i)}
                title={p.title}
                price={p.price || ""}
                tag={featured?.length ? "À l'affiche" : undefined}
                imageSrc={p.imageUrl}
                brand={p.brand}
                detailsHref={detailsHref}
                href={hasAff ? p.affiliateUrl : undefined}
              />
            );
          })}
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <TrustItem title="Sélection éditoriale">Nos choix sont indépendants et argumentés.</TrustItem>
          <TrustItem title="Transparence affiliée">Nous le signalons clairement quand un lien est affilié.</TrustItem>
          <TrustItem title="Mises à jour">Offres et contenus rafraîchis régulièrement.</TrustItem>
        </section>

        <div className="mt-12 flex items-center justify-center">
          <PrimaryButton href="/offers">Voir toutes les offres</PrimaryButton>
        </div>
      </main>

      <footer className="mt-6">
        <div className="mx-auto max-w-6xl px-6 pb-16">
          <div className={`${nunito.className} rounded-3xl p-6`} style={{ backgroundColor: "var(--secondary)", color: "#333" }}>
            <p className="text-sm">
              <strong>Transparence&nbsp;:</strong> Certains liens sont affiliés. Nous pouvons percevoir une commission si vous
              achetez via nos liens. Cela ne change rien au prix et nous aide à maintenir ce site.
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

type ButtonLinkProps = {
  href?: string;
  target?: string;
  rel?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PrimaryButton({ children, href, target, rel, ...props }: React.PropsWithChildren<ButtonLinkProps>) {
  const className = `${nunito.className} rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60`;
  const style = { backgroundColor: "var(--accent)" } as React.CSSProperties;
  if (href) return (
    <Link href={href} className={className} style={style} target={target} rel={rel}>
      {children}
    </Link>
  );
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
}
function SecondaryButton({ children, href, target, rel, ...props }: React.PropsWithChildren<ButtonLinkProps>) {
  const className = `${nunito.className} rounded-2xl border px-5 py-3 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`;
  const style = { borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" } as React.CSSProperties;
  if (href) return (
    <Link href={href} className={className} style={style} target={target} rel={rel}>
      {children}
    </Link>
  );
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
}
function Badge({ children }: React.PropsWithChildren) {
  return (
    <span className={`${nunito.className} inline-block rounded-full px-3 py-1 text-sm`} style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--bg-light)", color: "var(--text)" }}>
      {children}
    </span>
  );
}
function ProductCard({
  title,
  price = "",
  tag,
  imageSrc = "/images/product-placeholder.jpg",
  brand,
  href,
  detailsHref,
}: {
  title: string;
  price?: string;
  tag?: string;
  imageSrc?: string;
  brand?: string;
  href?: string;
  detailsHref?: string;
}) {
  const hasAff = typeof href === "string" && href.length > 0;
  return (
    <article className="flex flex-col rounded-3xl bg-white p-5 shadow-md">
      <Image src={imageSrc} alt={`${title} — photo produit`} width={600} height={600} unoptimized className="aspect-square w-full rounded-2xl object-cover" />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--accent)" }}>{title}</h3>
          <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "var(--text)" }}>
            {brand ? brand : "Soin corps • 200 ml"}
          </p>
        </div>
        {tag ? <Badge>{tag}</Badge> : null}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>{price}</span>
        <div className="flex items-center gap-2">
          <SecondaryButton href={detailsHref || "/offers"}>Détails</SecondaryButton>
          {hasAff ? (
            <PrimaryButton href={href} target="_blank" rel="nofollow sponsored noopener">
              Voir l’offre
            </PrimaryButton>
          ) : (
            <PrimaryButton href="/offers">Voir l’offre</PrimaryButton>
          )}
        </div>
      </div>
    </article>
  );
}
function TrustItem({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
      <h4 className={`${bodoni.className} text-lg`} style={{ color: "var(--text)" }}>{title}</h4>
      <p className={`${nunito.className} mt-2 text-sm opacity-80`} style={{ color: "var(--text)" }}>{children}</p>
    </div>
  );
}
