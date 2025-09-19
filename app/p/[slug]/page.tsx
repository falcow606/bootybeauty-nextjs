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
    const maybe = Number(s.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (Number.isFinite(maybe)) {
      return maybe.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
      });
    }
    if (/[€]/.test(s)) return s;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/** CSV parser tolérant (gère quotes et virgules internes) */
function parseCSV(csvText: string): ContentRow[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const split = (line: string): string[] => {
    const re = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
    return line
      .split(re)
      .map((c) => c.replace(/^"(.*)"$/s, "$1").replace(/""/g, `"`).trim());
  };
  const header = split(lines[0]);
  const rows: ContentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    if (cols.length === 1 && cols[0] === "") continue;
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    const r: ContentRow = {
      Slug: obj["Slug"] ?? "",
      Title: obj["Title"] ?? obj["Titre"] ?? "",
      Subtitle: obj["Subtitle"] ?? obj["Sous-titre"] ?? "",
      Hero: obj["Hero"] ?? obj["Hero "] ?? obj["Image"] ?? "",
      Intro: obj["Intro"] ?? "",
      Pros: obj["Pros"] ?? "",
      Cons: obj["Cons"] ?? "",
      ["How to"]: obj["How to"] ?? obj["How To"] ?? obj["HowTo"] ?? "",
      ["Note globale (sur 5)"]:
        (obj["Note globale (sur 5)"] ?? obj["Note"] ?? "").replace(",", "."),
    };
    rows.push(r);
  }
  return rows;
}

async function getOffers(): Promise<Offer[]> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://bootybeauty-nextjs.vercel.app";
  const res = await fetch(`${base}/api/offers`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as Offer[]) : [];
}

async function getContentBySlug(slug: string): Promise[ContentRow | undefined] {
  const csvUrl = process.env.SHEETS_CONTENT_CSV;
  if (!csvUrl) return undefined;
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) return undefined;
  const text = await res.text();
  const rows = parseCSV(text);
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

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  // >>> différence clé : Next 15 peut passer params en Promise
  const { slug } = await params;

  // 1) Contenu (Intro/Pros/Cons/HowTo/Note…)
  const content = await getContentBySlug(slug);

  // 2) Offres (image/prix/affiliation/brand…)
  const offers = await getOffers();

  // Association par slug sur titre d’offre
  const matchFromTitle = offers.find((o) =>
    o?.title ? slugify(o.title) === slug : false
  );

  // Fallback tolérant
  const matchFallback =
    matchFromTitle ||
    offers.find((o) => {
      const t = (o.title ?? "").toLowerCase();
      const s = slug.replace(/-/g, " ");
      return t.includes(s) || (content?.Title && t.includes(content.Title.toLowerCase()));
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
