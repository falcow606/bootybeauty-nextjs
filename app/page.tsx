import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

// Web fonts via next/font (perf > <link>)
const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

// ————————————————————————————————————————————————————————
// Data helpers — Featured products from Google Sheet via n8n
// Modes:
// 1) N8N_FEATURED_URL -> endpoint déjà filtré
// 2) N8N_OFFERS_URL   -> endpoint générique (on filtre côté serveur sur colonne `Featured`)
// ————————————————————————————————————————————————————————

type RawOffer = Record<string, any>;
type FeaturedProduct = {
  id?: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  price?: string;
  affiliateUrl?: string;
  slug?: string;
};

function truthy(v: any): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "number") return v > 0;
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ["oui", "yes", "true", "1", "y", "ok"].includes(s);
}

function mapOffer(row: RawOffer): FeaturedProduct {
  return {
    id: row.Product_ID || row.ID || row.id,
    title: row.Title || row.Nom || row.name || "Produit",
    brand: row.Marque || row.Brand || row.Marchand || undefined,
    imageUrl: row.imageUrl || row.Image_URL || row.Image || row.image || undefined,
    price: row["Prix (€)"] || row.Price || row.price || undefined,
    affiliateUrl: row.Affiliate_URL || row.FinalURL || row.Url || row.url || undefined,
    slug: row.Slug || row.slug || undefined,
  };
}

async function getFeaturedOffers(): Promise<FeaturedProduct[]> {
  const url = process.env.N8N_FEATURED_URL || process.env.N8N_OFFERS_URL;
  if (!url) return [];
  const headers: Record<string, string> = {};
  if (process.env.N8N_OFFERS_KEY) headers["x-api-key"] = process.env.N8N_OFFERS_KEY as string;

  const fetchInit: RequestInit & { next?: { revalidate?: number } } =
  process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'
    ? { headers, cache: 'no-store' }
    : { headers, next: { revalidate: 1800 } };
const res = await fetch(url, fetchInit);
  if (!res.ok) return [];
  const json = await res.json();
  let items: RawOffer[] = Array.isArray(json) ? json : json.items || json.data || [];

  // Si endpoint générique: filtrer via colonne `Featured` (oui/true/1)
  if (!process.env.N8N_FEATURED_URL) {
    items = items.filter((r) => truthy(r.Featured) || truthy(r["A l affiche"]) || truthy(r["Featured?"]));
  }

  // Ordonner par Featured_Order puis UpdatedAt desc
  items.sort((a, b) => {
    const ao = Number(a.Featured_Order ?? a.featured_order ?? 999);
    const bo = Number(b.Featured_Order ?? b.featured_order ?? 999);
    if (ao !== bo) return ao - bo;
    const ad = new Date(a.UpdatedAt || a.updatedAt || 0).getTime();
    const bd = new Date(b.UpdatedAt || b.updatedAt || 0).getTime();
    return bd - ad;
  });

  return items.slice(0, 3).map(mapOffer);
}

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await getFeaturedOffers();

  return (
    <div
      className="min-h-screen w-full"
      style={{
        // Design tokens
        // (Optionnel: déplacez dans globals.css :root {...})
        // @ts-ignore custom props ok
        "--accent": "#C4A092",
        "--secondary": "#DABCB2",
        "--bg-light": "#EBC8B2",
        "--bg-main": "#FAF0E6",
        "--text": "#333333",
        backgroundColor: "var(--bg-main)",
      }}
    >
      {/* HEADER */}
      

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-8 pt-4 md:grid-cols-2">
        <div>
          <h1 className={`${bodoni.className} text-4xl leading-tight md:text-5xl`} style={{ color: "var(--text)" }}>
            Sélection beauté <span style={{ color: "var(--accent)" }}>tendance</span> &
            <br />
            bons <span style={{ color: "var(--accent)" }}>plans</span>
          </h1>
          <p className={`${nunito.className} mt-4 text-base opacity-80 md:text-lg`} style={{ color: "var(--text)" }}>
            Bienvenue sur Booty & Cutie, le blog beauté qui t’aide à trouver les meilleurs soins pour les fesses, les produits intimes sûrs et tous les bons plans beauté du moment.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrimaryButton as={Link} href="/offers" aria-label="Voir les meilleures offres">
              Voir les Top 10
            </PrimaryButton>
            <SecondaryButton as={Link} href="/blog">
              Notre méthode
            </SecondaryButton>
          </div>
        </div>
        <div className="relative">
          <Image
            src="/images/hero-curves.jpg"
            alt="Courbes douces, esthétique clean — Booty & Cutie"
            width={1200}
            height={900}
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
          {/* Produits à l'affiche : 3 max, depuis Google Sheet (colonne `Featured`) */}
          {(featured && featured.length ? featured : [
            { title: "Bom Dia Bright Cream", price: "", imageUrl: "/images/bom-dia-bright-cream.jpg", brand: "", affiliateUrl: "" },
            { title: "Beauty Booty Whitening Brightening Lightening Cream", price: "", imageUrl: "/images/beauty-booty-whitening.jpg", brand: "", affiliateUrl: "" },
            { title: "Huile Corps Sublimatrice Body Sunshine", price: "", imageUrl: "/images/huile-corps-sunshine.jpg", brand: "", affiliateUrl: "" },
          ]).map((p, i) => (
            <ProductCard
              key={p.id || p.slug || p.title || i}
              title={p.title}
              price={p.price || ""}
              tag={featured?.length ? "À l'affiche" : undefined}
              imageSrc={p.imageUrl}
              brand={p.brand}
              href={p.affiliateUrl}
            />
          ))}
        </section>

        {/* Bandeau confiance */}
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <TrustItem title="Sélection éditoriale">Nos choix sont indépendants et argumentés.</TrustItem>
          <TrustItem title="Transparence affiliée">Nous le signalons clairement quand un lien est affilié.</TrustItem>
          <TrustItem title="Mises à jour">Offres et contenus rafraîchis régulièrement.</TrustItem>
        </section>

        {/* CTA vers toutes les offres */}
        <div className="mt-12 flex items-center justify-center">
          <PrimaryButton as={Link} href="/offers">Voir toutes les offres</PrimaryButton>
        </div>
      </main>

      {/* DISCLOSURE FOOTER CARD */}
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

// ————————————————————————————————————————————————————————
// UI Primitives (boutons, badges, cartes) – réutilisables
// ————————————————————————————————————————————————————————

type AsLinkProps = { as?: typeof Link; href?: string; [k: string]: any } & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PrimaryButton({ children, as: As, href, ...props }: React.PropsWithChildren<AsLinkProps>) {
  const className = `${Nunito()} rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60`;
  const style = { backgroundColor: "var(--accent)" } as React.CSSProperties;
  if (As && href) return (
    <As href={href} className={className} style={style} {...props}>
      {children}
    </As>
  );
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, as: As, href, ...props }: React.PropsWithChildren<AsLinkProps>) {
  const className = `${Nunito()} rounded-2xl border px-5 py-3 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`;
  const style = { borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" } as React.CSSProperties;
  if (As && href) return (
    <As href={href} className={className} style={style} {...props}>
      {children}
    </As>
  );
  return (
    <button className={className} style={style} {...props}>
      {children}
    </button>
  );
}

function Badge({ children }: React.PropsWithChildren) {
  return (
    <span
      className={`${Nunito()} inline-block rounded-full px-3 py-1 text-sm`}
      style={{ backgroundColor: "var(--bg-main)", border: "1px solid var(--bg-light)", color: "var(--text)" }}
    >
      {children}
    </span>
  );
}

function ProductCard({ title, price = "", tag = "À l'affiche", imageSrc = "/images/product-placeholder.jpg", brand, href }: { title: string; price?: string; tag?: string; imageSrc?: string; brand?: string; href?: string }) {
  return (
    <article className="flex flex-col rounded-3xl bg-white p-5 shadow-md">
      <Image src={imageSrc} alt={`${title} — photo produit`} width={600} height={600} className="aspect-square w-full rounded-2xl object-cover" />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className={`${bodoni.className} text-xl`} style={{ color: "var(--accent)" }}>
            {title}
          </h3>
          <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "var(--text)" }}>
            {brand ? brand : "Soin corps • 200 ml"}
          </p>
        </div>
        <Badge>{tag}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`${bodoni.className} text-xl`} style={{ color: "var(--text)" }}>
          {price}
        </span>
        <div className="flex items-center gap-2">
          <SecondaryButton as={Link} href={"/offers"}>
            Détails
          </SecondaryButton>
          {href ? (
            <PrimaryButton as={Link} href={href} target="_blank" rel="nofollow sponsored noopener">
              Choisir
            </PrimaryButton>
          ) : (
            <PrimaryButton as={Link} href="/offers">Choisir</PrimaryButton>
          )}
        </div>
      </div>
    </article>
  );
}

function TrustItem({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
      <h4 className={`${bodoni.className} text-lg`} style={{ color: "var(--text)" }}>
        {title}
      </h4>
      <p className={`${nunito.className} mt-2 text-sm opacity-80`} style={{ color: "var(--text)" }}>
        {children}
      </p>
    </div>
  );
}

// Helpers pour appliquer rapidement les fonts
function Nunito() {
  return nunito.className;
}
