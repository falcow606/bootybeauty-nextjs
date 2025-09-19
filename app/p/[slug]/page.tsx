// app/p/[slug]/page.tsx
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import React from "react";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600", "700"],
});
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

type Offer = {
  productId: string;
  merchant?: string;
  price?: number | string | null;
  availability?: string;
  affiliateUrl?: string;
  imageUrl?: string;
  title?: string;
  brand?: string;
};

type ContentRow = {
  Slug: string;
  Title?: string;
  Subtitle?: string;
  Hero?: string;
  Intro?: string;
  Pros?: string;
  Cons?: string;
  ["How to"]?: string;
  ["Note globale (sur 5)"]?: string | number;
};

// -------- helpers ----------
function slugify(input: string): string {
  return (
    input
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "produit"
  );
}

function euro(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "string") {
    const s = v.trim();
    // si déjà formaté en € on le garde
    if (/[€]/.test(s)) return s;
    const maybe = Number(s.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (Number.isFinite(maybe)) {
      return maybe.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      });
    }
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/** CSV parser robuste (gère guillemets, virgules, retours ligne dans champs) */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // guillemet échappé
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r") {
        // ignore CR, on attend LF
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  // dernier champ/ligne si absence de \n final
  if (field.length > 0 || inQuotes || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseContentCSV(csvText: string): ContentRow[] {
  const grid = parseCSV(csvText).filter((r) => r.length > 0 && r.join("").trim() !== "");
  if (grid.length === 0) return [];
  const header = grid[0];
  const idx = (key: string): number =>
    header.findIndex((h) => (h || "").trim().toLowerCase() === key.trim().toLowerCase());

  const iSlug = idx("slug");
  const iTitle = idx("title");
  const iSubtitle = idx("subtitle");
  const iHero = idx("hero");
  const iIntro = idx("intro");
  const iPros = idx("pros");
  const iCons = idx("cons");
  const iHow = idx("how to");
  const iNote = idx("note globale (sur 5)");

  const out: ContentRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const row = grid[r];
    const get = (i: number): string => (i >= 0 && i < row.length ? (row[i] || "").trim() : "");
    const o: ContentRow = {
      Slug: get(iSlug),
      Title: get(iTitle),
      Subtitle: get(iSubtitle),
      Hero: get(iHero),
      Intro: get(iIntro),
      Pros: get(iPros),
      Cons: get(iCons),
      ["How to"]: get(iHow),
      ["Note globale (sur 5)"]: get(iNote).replace(",", "."),
    };
    if (o.Slug) out.push(o);
  }
  return out;
}

async function getOffers(): Promise<Offer[]> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://bootybeauty-nextjs.vercel.app";
  const res = await fetch(`${base}/api/offers`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? (data as Offer[]) : [];
}

async function getContentBySlug(slug: string): Promise<ContentRow | undefined> {
  const csvUrl = process.env.SHEETS_CONTENT_CSV;
  if (!csvUrl) return undefined;
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) return undefined;
  const text = await res.text();
  const rows = parseContentCSV(text);
  return rows.find((r) => (r.Slug ?? "").trim() === slug.trim());
}

function splitBullets(s?: string): string[] {
  if (!s) return [];
  const raw = s.split(/\r?\n|;|•|-/).map((x) => x.trim());
  return raw.filter((x) => x.length > 0);
}

function drawPeaches(note?: string | number): React.ReactNode {
  if (!note) return null;
  const val = typeof note === "string" ? Number(note) : note;
  if (!Number.isFinite(val)) return null;
  const rounded = Math.round(Number(val));
  const items = new Array(5).fill(0).map((_, i) => {
    const filled = i < rounded;
    return (
      <span
        key={i}
        aria-hidden
        style={{ opacity: filled ? 1 : 0.3 }}
        className="mr-1"
      >
        🍑
      </span>
    );
  });
  return <span className="inline-flex items-center">{items}</span>;
}

type Params = { slug: string };

// -------- PAGE ----------
export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  // Next 15 peut fournir params en Promise
  const { slug } = await params;

  // 1) Contenu éditorial
  const content = await getContentBySlug(slug);

  // 2) Offres (prix, image, aff, brand…)
  const offers = await getOffers();

  // Assoc : match sur titre → slug
  const matchFromTitle = offers.find((o) =>
    o?.title ? slugify(o.title) === slug : false
  );

  // Fallback tolérant : contient le slug ou le Title éditorial
  const matchFallback =
    matchFromTitle ||
    offers.find((o) => {
      const t = (o.title ?? "").toLowerCase();
      const s = slug.replace(/-/g, " ");
      const ok1 = t.includes(s);
      const ok2 = content?.Title ? t.includes(content.Title.toLowerCase()) : false;
      return ok1 || ok2;
    });

  const offer = matchFallback;

  // Champs d’affichage
  const title =
    content?.Title || offer?.title || slug.replace(/-/g, " ").trim();
  const subtitle = content?.Subtitle || "";
  const brand = offer?.brand || offer?.merchant || "";
  const hero =
    content?.Hero || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer?.price);

  const rating = content?.["Note globale (sur 5)"]
    ? String(content["Note globale (sur 5)"])
    : undefined;

  const pros = splitBullets(content?.Pros);
  const cons = splitBullets(content?.Cons);
  const howto = content?.["How to"];

  const affiliate = (offer?.affiliateUrl ?? "").trim();
  const hasAff = affiliate.length > 0;

  // Produits liés : même brand/merchant (max 2)
  const related =
    offers
      .filter(
        (o) =>
          (o.brand || o.merchant) === brand &&
          slugify(o.title || "") !== slug
      )
      .slice(0, 2) || [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8" style={{ backgroundColor: "#FAF0E6" }}>
      {/* HEADER : Image + panneau droite */}
      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Carte image blanche */}
        <div className="rounded-[22px] bg-white p-3 shadow-sm">
          <Image
            src={hero}
            alt={title}
            width={1600}
            height={1600}
            className="h-auto w-full rounded-[18px] object-cover"
            unoptimized
            priority
          />
        </div>

        {/* Colonne droite */}
        <div>
          <h1
            className={`${bodoni.className} text-3xl md:text-4xl`}
            style={{ color: "#252525" }}
          >
            {title}
          </h1>

          {subtitle ? (
            <p
              className={`${nunito.className} mt-2 text-sm opacity-80`}
              style={{ color: "#333" }}
            >
              {subtitle}
            </p>
          ) : null}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {rating ? (
              <>
                <span aria-label={`Note ${rating}/5`}>{drawPeaches(rating)}</span>
                <span className={`${nunito.className}`}>{rating}/5</span>
              </>
            ) : null}
            {brand ? (
              <span className={`${nunito.className} opacity-80`}>
                Marque : {brand}
              </span>
            ) : null}
            {price ? (
              <span className={`${nunito.className} rounded-full bg-white/70 px-2 py-0.5`}>
                {price}
              </span>
            ) : null}
          </div>

          {/* CTAs */}
          <div className="mt-4 flex flex-wrap gap-3">
            {hasAff ? (
              <Link
                href={affiliate}
                className={`${nunito.className} rounded-2xl px-5 py-3 text-white shadow transition hover:opacity-90`}
                style={{ backgroundColor: "#C4A092" }}
                target="_blank"
                rel="nofollow sponsored noopener"
              >
                Voir l’offre
              </Link>
            ) : null}
            <Link
              href="/offers"
              className={`${nunito.className} rounded-2xl border px-5 py-3`}
              style={{ borderColor: "#C4A092", color: "#C4A092" }}
            >
              Voir toutes les offres
            </Link>
          </div>

          {/* En bref */}
          {content?.Intro ? (
            <div className="mt-8">
              <h2
                className={`${bodoni.className} text-xl`}
                style={{ color: "#252525" }}
              >
                En bref
              </h2>
              <p className={`${nunito.className} mt-2`} style={{ color: "#333" }}>
                {content.Intro}
              </p>
            </div>
          ) : null}

          {/* Pourquoi on aime */}
          {pros.length ? (
            <div className="mt-6">
              <h3
                className={`${bodoni.className} text-lg`}
                style={{ color: "#252525" }}
              >
                Pourquoi on aime
              </h3>
              <ul
                className={`${nunito.className} mt-2 list-disc space-y-1 pl-5`}
                style={{ color: "#333" }}
              >
                {pros.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {/* À noter / Comment l’utiliser */}
      {(cons.length || howto) ? (
        <section className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* À noter */}
          {cons.length ? (
            <div className="rounded-2xl bg-white/60 p-5">
              <h3 className={`${bodoni.className} text-lg`} style={{ color: "#252525" }}>
                À noter
              </h3>
              <ul
                className={`${nunito.className} mt-2 list-disc space-y-1 pl-5`}
                style={{ color: "#333" }}
              >
                {cons.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          {/* Comment l’utiliser */}
          {howto ? (
            <div className="rounded-2xl bg-white/60 p-5">
              <h3 className={`${bodoni.className} text-lg`} style={{ color: "#252525" }}>
                Comment l’utiliser
              </h3>
              <p className={`${nunito.className} mt-2`} style={{ color: "#333" }}>
                {howto}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Produits liés */}
      <section className="mt-12">
        <h3 className={`${bodoni.className} text-xl`} style={{ color: "#252525" }}>
          Produits liés
        </h3>

        {related.length ? (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            {related.map((r, i) => {
              const s = slugify(r.title || r.productId || `p-${i}`);
              return (
                <article
                  key={r.productId || `${s}-${i}`}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="rounded-xl bg-white p-2">
                    <Image
                      src={r.imageUrl || "/images/product-placeholder.jpg"}
                      alt={r.title || "Produit lié"}
                      width={800}
                      height={800}
                      className="h-auto w-full rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <h4 className={`${bodoni.className} text-base`} style={{ color: "#252525" }}>
                        {r.title || "Produit"}
                      </h4>
                      <p className={`${nunito.className} text-sm opacity-80`} style={{ color: "#333" }}>
                        {r.brand || r.merchant || ""}
                      </p>
                    </div>
                    <Link
                      href={`/p/${s}`}
                      className={`${nunito.className} rounded-2xl border px-4 py-2 text-sm`}
                      style={{ borderColor: "#C4A092", color: "#C4A092" }}
                    >
                      Détails
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={`${nunito.className} mt-2 opacity-70`} style={{ color: "#333" }}>
            Aucun autre produit pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
