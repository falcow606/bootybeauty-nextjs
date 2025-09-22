// app/p/[slug]/page.tsx
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type ContentItem = {
  slug: string;
  title: string;
  brand?: string;
  hero?: string;
  pros?: string[];
  cons?: string[];
  howto?: string;
  bodyHtml?: string;
  bodyMd?: string;
  rating?: number;
  subtitle?: string; // sous-titre éventuel
  excerpt?: string;  // intro courte éventuelle
};

type Offer = {
  productId?: string;
  merchant?: string;
  price?: number | string;
  availability?: string;
  affiliateUrl?: string;
  commissionPct?: number | string;
  httpStatus?: number;
  lastChecked?: string;
  imageUrl?: string;
  title?: string;
  brand?: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function normalize(s?: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
function getBaseUrl() {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/$/, "");
  const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
  if (host) return `https://${host.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}
function getOffersUrl() {
  return process.env.N8N_OFFERS_API || process.env.N8N_OFFERS_URL || "";
}
function getOffersKey() {
  return process.env.N8N_OFFERS_KEY || "";
}

async function fetchContent(): Promise<ContentItem[]> {
  const res = await fetch(`${getBaseUrl()}/api/content`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}
async function fetchOffers(): Promise<Offer[]> {
  const url = getOffersUrl();
  if (!url) return [];
  const headers: Record<string, string> = {};
  const key = getOffersKey();
  if (key) headers["x-api-key"] = key;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function pickBestOffer(content: ContentItem, offers: Offer[]): Offer | undefined {
  const nTitle = normalize(content.title);
  const nBrand = normalize(content.brand);
  let best: { offer: Offer; score: number } | undefined;

  for (const off of offers) {
    const oTitle = normalize(off.title);
    const oBrand = normalize(off.brand);
    let score = 0;
    if (nTitle && oTitle.includes(nTitle)) score += 3;
    if (nBrand && oBrand && oBrand.includes(nBrand)) score += 2;
    if (nBrand && oTitle.includes(nBrand)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { offer: off, score };
  }
  return best?.offer || offers[0];
}

function renderPrice(value?: number | string) {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  try {
    return `${value.toFixed(2)} €`;
  } catch {
    return `${value} €`;
  }
}

function Stars({ rating }: { rating?: number }) {
  if (!rating || rating <= 0) return null;
  const r = Math.max(0, Math.min(5, rating));
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <span className="text-yellow-500" aria-label={`Note ${r}/5`}>
      {"★".repeat(full)}
      {half ? "☆" : ""}
      {"☆".repeat(empty)}
      <span className="ml-1 text-xs text-black/60 align-middle">({r.toFixed(1)})</span>
    </span>
  );
}

// NOTE: votre projet tape params comme Promise — on respecte
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = decodeURIComponent(slug).trim().toLowerCase();

  const [contentList, offers] = await Promise.all([fetchContent(), fetchOffers()]);

  const content =
    contentList.find((c) => (c.slug ?? "").trim().toLowerCase() === s) ||
    contentList.find((c) => c.title && slugify(c.title) === s);

  if (!content) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Fiche introuvable</h1>
        <p className="mt-2 text-sm opacity-70">Slug recherché : {s}</p>
      </main>
    );
  }

  const offer = pickBestOffer(content, offers) || {};
  const price = renderPrice(offer.price);
  const safeHero =
    (content.hero && /^https?:\/\//.test(content.hero) ? content.hero : undefined) ||
    (offer.imageUrl && /^https?:\/\//.test(offer.imageUrl) ? offer.imageUrl : undefined);

  const title = content.title || offer.title || "Produit";
  const brand = content.brand || offer.brand;
  const availability = offer.availability;
  const merchant = offer.merchant;
  const lastChecked = offer.lastChecked;
  const affiliateUrl = offer.affiliateUrl;

  // Intro courte : priorité à excerpt, sinon 1er paragraphe du bodyMd
  const intro =
    content.excerpt ??
    (typeof content.bodyMd === "string"
      ? content.bodyMd.split(/\n{2,}/)[0]
      : undefined);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10">
      {/* === TOP AREA (image gauche / infos droite) === */}
      <div className="grid gap-8 md:grid-cols-2 items-start">
        {/* IMAGE LEFT */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm bg-white">
          {safeHero ? (
            <Image
              src={safeHero}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 640px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm opacity-50">
              (Pas d’image)
            </div>
          )}
        </div>

        {/* RIGHT INFO */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {content.subtitle && (
            <p className="mt-1 text-lg opacity-80 italic">{content.subtitle}</p>
          )}

          {/* Price / Brand / Rating */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {price && (
              <div className="rounded-xl border px-3 py-2 text-lg font-semibold bg-white/70 shadow-sm">
                {price}
              </div>
            )}
            {brand && (
              <span className="text-sm rounded-full border px-2 py-0.5">
                {brand}
              </span>
            )}
            {typeof content.rating === "number" && <Stars rating={content.rating} />}
          </div>

          {/* Intro */}
          {intro && (
            <p className="mt-4 text-[15px] leading-relaxed opacity-90 whitespace-pre-wrap">
              {intro}
            </p>
          )}

          {/* Pros (en haut, à droite) */}
          {content.pros && content.pros.length > 0 && (
            <div className="mt-4 rounded-2xl border p-4 bg-white/60">
              <h2 className="text-base font-semibold">Pourquoi on aime</h2>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {content.pros.map((p, i) => (
                  <li key={`pro-${i}`}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA + méta offre */}
          {(affiliateUrl || availability || merchant || lastChecked) && (
            <div className="mt-4 flex flex-col gap-3">
              {affiliateUrl && (
                <div>
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    className="inline-flex items-center justify-center rounded-xl bg-black text-white px-5 py-3 text-sm font-medium shadow-sm hover:opacity-90"
                  >
                    Voir l’offre
                  </a>
                  <p className="mt-1 text-xs opacity-60">
                    *Lien affilié : peut nous rapporter une petite commission
                    sans coût supplémentaire pour toi.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availability && (
                  <div className="rounded-xl border p-3 bg-white/60">
                    <div className="text-xs opacity-60 mb-1">Disponibilité</div>
                    <div className="text-sm">{availability}</div>
                  </div>
                )}
                {merchant && (
                  <div className="rounded-xl border p-3 bg-white/60">
                    <div className="text-xs opacity-60 mb-1">Marchand</div>
                    <div className="text-sm">{merchant}</div>
                  </div>
                )}
                {lastChecked && (
                  <div className="rounded-xl border p-3 bg-white/60">
                    <div className="text-xs opacity-60 mb-1">Vérifié le</div>
                    <div className="text-sm">
                      {new Date(lastChecked).toLocaleString("fr-FR")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === UNDER THE FOLD (full width): CONS, HOW TO, BODY === */}
      <div className="mt-10 space-y-8">
        {content.cons && content.cons.length > 0 && (
          <section className="rounded-2xl border p-5 bg-white/60">
            <h2 className="text-xl font-semibold">Points d’attention</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {content.cons.map((c, i) => (
                <li key={`con-${i}`}>{c}</li>
              ))}
            </ul>
          </section>
        )}

        {content.howto && (
          <section className="rounded-2xl border p-5 bg-white/60">
            <h2 className="text-xl font-semibold">Mode d’emploi</h2>
            <p className="mt-2 whitespace-pre-wrap">{content.howto}</p>
          </section>
        )}

        {(content.bodyHtml || content.bodyMd) && (
          <section className="prose prose-neutral md:prose-lg max-w-none">
            {content.bodyHtml ? (
              <article dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
            ) : (
              <article className="whitespace-pre-wrap leading-relaxed">
                {content.bodyMd}
              </article>
            )}
          </section>
        )}
      </div>
    </article>
  );
}
