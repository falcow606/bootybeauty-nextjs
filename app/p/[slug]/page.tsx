export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard, { type Offer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const revalidate = 0;

type UnknownRecord = Record<string, unknown>;

/* ---------------- utils ---------------- */
function slugify(input: string): string {
  const s = input.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "produit";
}
function normStr(v: unknown): string { return v == null ? "" : typeof v === "string" ? v : String(v); }
function getVal(obj: UnknownRecord, keys: string[]): unknown { for (const k of keys) if (k in obj) return obj[k]; }
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  const v = getVal(obj, keys);
  if (v == null) return undefined;
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}
function firstArray(json: unknown): UnknownRecord[] {
  if (Array.isArray(json)) return json as UnknownRecord[];
  if (json && typeof json === "object") {
    const obj = json as UnknownRecord;
    const keys = ["items","data","result","rows","records","list","values","results"];
    for (const k of keys) { const v = obj[k]; if (Array.isArray(v)) return v as UnknownRecord[]; }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (v && typeof v === "object") {
        const sub = v as UnknownRecord;
        for (const k of keys) { const vv = sub[k]; if (Array.isArray(vv)) return vv as UnknownRecord[]; }
      }
    }
  }
  return [];
}

/** Délimiteur d’après la 1ère ligne (hors guillemets). */
function guessDelimiter(header: string): "," | ";" {
  let inQuotes = false; let comma = 0, semi = 0;
  for (let i = 0; i < header.length; i++) {
    const ch = header[i];
    if (ch === '"') { if (inQuotes && header[i + 1] === '"') { i++; continue; } inQuotes = !inQuotes; }
    else if (!inQuotes) { if (ch === ",") comma++; else if (ch === ";") semi++; }
  }
  return semi > comma ? ";" : ",";
}

/** CSV robuste (guillemets + retours à la ligne en cellule). */
function parseCSV(text: string): UnknownRecord[] {
  if (!text.trim()) return [];
  const firstNL = text.indexOf("\n") === -1 ? text.length : text.indexOf("\n");
  const delim = guessDelimiter(text.slice(0, firstNL));
  const rows: string[][] = []; let row: string[] = []; let field = ""; let inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (inQuotes && text[i + 1] === '"') { field += '"'; i++; } else inQuotes = !inQuotes; continue; }
    if (!inQuotes && ch === delim) { pushField(); continue; }
    if (!inQuotes && (ch === "\n" || ch === "\r")) { if (ch === "\r" && text[i + 1] === "\n") i++; pushField(); pushRow(); continue; }
    field += ch;
  }
  pushField(); pushRow();
  if (!rows.length) return [];
  const clean = (s: string) => s.replace(/^\uFEFF/, "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  const headers = rows[0].map(clean);
  const out: UnknownRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const rec: UnknownRecord = {}; const cols = rows[r];
    headers.forEach((h, idx) => { rec[h] = (cols[idx] ?? "").replace(/\r$/, ""); });
    out.push(rec);
  }
  return out;
}
function splitList(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/\n|\r|\|/g).map((s) => s.replace(/^[•\-\u2022]\s*/, "").trim()).filter(Boolean);
}
function parseRating(raw?: string): number | undefined {
  if (!raw) return undefined;
  const s = raw.replace(",", ".").trim(); const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return undefined;
  return Math.min(5, Math.max(0, Math.round(n * 2) / 2));
}

/* ------------- mapping OFFERS ------------- */
function mapOffer(row: UnknownRecord): Offer {
  return {
    id: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    productId: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    slug: getStr(row, ["Slug","slug"]),
    title: getStr(row, ["Title","Nom","name","title"]),
    brand: getStr(row, ["Marque","Brand","Marchand","merchant","brand"]),
    imageUrl: getStr(row, [
      "imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image",
      "Hero","Hero_Image","Hero URL","Image_Hero"
    ]),
    price: getStr(row, ["Prix (€)","Prix€","Prix","Price","price"]),
    affiliateUrl: getStr(row, [
      // ⬇️ ton cas “Affiliate_URL” est bien couvert
      "affiliateUrl","Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
      "finalUrl","FinalURL","Final URL",
      "Url","URL","url","link",
      "Lien affilié","Lien","Lien_achat",
      "BuyLink","Buy Link",
      "Product_URL","Product URL","URL produit",
      "Amazon_URL","ASIN_URL"
    ]),
    httpStatus: getStr(row, ["httpStatus","status","code"]),
  };
}

/* ------------- mapping CONTENT ------------- */
type ProductContent = {
  slug: string; title?: string; subtitle?: string; heroImage?: string; intro?: string;
  pros?: string[]; cons?: string[]; howTo?: string; ingredients?: string;
  faq?: { q: string; a: string }[]; rating?: number;
};
function mapContent(row: UnknownRecord): ProductContent | null {
  const slug = getStr(row, ["Slug","slug"]); if (!slug) return null;
  const title = getStr(row, ["Title","Titre","H1","h1","name"]);
  const subtitle = getStr(row, ["Subtitle","Sous-titre","sub"]);
  const heroImage = getStr(row, ["Hero","Hero_Image","Hero URL","Image_Hero","imageHero","Hero "]);
  const intro = getStr(row, ["Intro","Introduction","lead","chapo"]);
  const prosRaw = getStr(row, ["Pros","Pour","Plus","On_aime"]);
  const consRaw = getStr(row, ["Cons","Contre","Moins","A_savoir"]);
  const howTo = getStr(row, ["HowTo","How to","Utilisation","Mode_d_emploi","Conseils"]);
  const ingredients = getStr(row, ["Ingredients","Ingrédients","Key_Ingredients"]);
  const note = getStr(row, ["Note globale (sur 5)","Note","Rating","Score"]);
  const faq: { q: string; a: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    const q = getStr(row, [`FAQ_Q${i}`, `FAQ${i}_Q`, `Question${i}`]);
    const a = getStr(row, [`FAQ_A${i}`, `FAQ${i}_A`, `Answer${i}`]);
    if (q && a) faq.push({ q, a });
  }
  return {
    slug, title: title || undefined, subtitle: subtitle || undefined,
    heroImage: heroImage || undefined, intro: intro || undefined,
    pros: splitList(prosRaw), cons: splitList(consRaw),
    howTo: howTo || undefined, ingredients: ingredients || undefined,
    faq: faq.length ? faq : undefined, rating: parseRating(note),
  };
}

/* ------------- fetch (multi-sources) ------------- */
const baseInit: RequestInit & { next?: { revalidate?: number } } =
  process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
    ? { cache: "no-store" } : { next: { revalidate: 1800 } };

async function fetchRows(url?: string, needsKey = true): Promise<UnknownRecord[]> {
  if (!url) return [];
  const init: RequestInit & { next?: { revalidate?: number } } = { ...baseInit };
  if (needsKey && process.env.N8N_OFFERS_KEY) { init.headers = { "x-api-key": String(process.env.N8N_OFFERS_KEY) }; }
  const res = await fetch(url, init); if (!res.ok) return [];
  const ct = normStr(res.headers.get("content-type")).toLowerCase();
  if (ct.includes("application/json") || ct.includes("text/json")) return firstArray(await res.json() as unknown);
  const text = await res.text(); const tt = text.trim();
  if (tt.startsWith("{") || tt.startsWith("[")) return firstArray(JSON.parse(tt) as unknown);
  return parseCSV(text);
}

async function getAllOffers(): Promise<Offer[]> {
  const sources = [
    { url: process.env.N8N_OFFERS_URL, needsKey: true },
    { url: process.env.N8N_OFFERS_API, needsKey: true },
    { url: process.env.N8N_FEATURED_URL, needsKey: true },
    { url: process.env.SHEETS_OFFERS_CSV, needsKey: false },
  ].filter((s) => !!s.url) as { url: string; needsKey: boolean }[];
  for (const s of sources) {
    const rows = await fetchRows(s.url, s.needsKey);
    if (rows.length) return rows.map(mapOffer);
  }
  return [];
}
async function getAllContent(): Promise<ProductContent[]> {
  const rows = await fetchRows(process.env.SHEETS_CONTENT_CSV, false);
  return rows.map(mapContent).filter(Boolean) as ProductContent[];
}

/* ---------------- helpers page ---------------- */
function displayPrice(p?: string): string {
  if (!p) return "";
  const s = p.trim();
  return /€/.test(s) ? s : `${s} €`;
}
function pickAffiliate(o?: Offer): string {
  if (!o) return "";
  const obj = o as unknown as Record<string, unknown>;
  return (
    getStr(obj, [
      "affiliateUrl","Affiliate_URL","Affiliate URL","Affiliate Url","Affiliate Link","Affiliate",
      "finalUrl","FinalURL","Final URL",
      "Url","URL","url","link",
      "Lien affilié","Lien","Lien_achat",
      "BuyLink","Buy Link",
      "Product_URL","Product URL","URL produit",
      "Amazon_URL","ASIN_URL"
    ]) || ""
  );
}

/* ------------- SEO ------------- */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [content, offers] = await Promise.all([getAllContent(), getAllOffers()]);
  const c = content.find((x) => x.slug.toLowerCase() === slug.toLowerCase())
    || content.find((x) => x.title && slugify(x.title) === slug);
  const o = offers.find((x) => normStr(x.slug).toLowerCase() === slug.toLowerCase())
    || offers.find((x) => x.title && slugify(x.title) === slug);
  const title = c?.title || o?.title || slug;
  const desc = c?.intro || `Test et avis — ${title}. Sélection Booty & Cutie : conseils, utilisation et meilleures offres.`;
  return { title: `${title} — Test & avis`, description: desc };
}

/* ------------- PAGE ------------- */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [offers, contents] = await Promise.all([getAllOffers(), getAllContent()]);
  const offer =
    offers.find((o) => normStr(o.slug).toLowerCase() === slug.toLowerCase()) ||
    offers.find((o) => o.title && slugify(o.title) === slug);

  const content =
    contents.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) ||
    contents.find((c) => c.title && slugify(c.title) === slug) ||
    (offer?.title ? contents.find((c) => c.title && slugify(c.title) === slugify(offer.title!)) : undefined);

  const title = content?.title || offer?.title || slug;
  // ⚠️ on n’utilise PAS brand ici pour éviter le doublon — on l’affiche sous la note
  const subtitle = content?.subtitle || "";
  const brand = offer?.brand;
  const heroImg = content?.heroImage || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = displayPrice(offer?.price || "");
  const affiliate = pickAffiliate(offer);
  const rating = content?.rating;

  const sameBrand = offer?.brand
    ? offers.filter((o) => o.brand === offer.brand && normStr(o.slug).toLowerCase() !== slug.toLowerCase())
    : [];
  const fallbackRelated = offers.filter((o) => normStr(o.slug).toLowerCase() !== slug.toLowerCase());
  const related = (sameBrand.length ? sameBrand : fallbackRelated).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* HERO */}
      <section className="grid items-start gap-8 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-white p-3 shadow-md">
          <div className="overflow-hidden rounded-2xl">
            <Image
              src={heroImg}
              alt={`${title} — photo produit`}
              width={1200}
              height={1200}
              unoptimized
              className="aspect-square w-full object-cover"
              priority
            />
          </div>
        </div>

        <div>
          <h1 className={`${bodoni.className} text-3xl md:text-4xl`} style={{ color: "var(--text)" }}>
            {title}
          </h1>

          {subtitle ? (
            <p className={`${nunito.className} mt-1 text-base opacity-80`} style={{ color: "var(--text)" }}>
              {subtitle}
            </p>
          ) : null}

          {/* Note / 5 + Marque sous la note */}
          {(typeof rating === "number" || brand) ? (
            <div className="mt-3">
              {typeof rating === "number" ? (
                <div className="flex items-center gap-2">
                  <ApricotRating rating={rating} />
                  <span className={`${nunito.className} text-sm opacity-70`} style={{ color: "var(--text)" }}>
                    {String(rating).replace(".", ",")}/5
                  </span>
                </div>
              ) : null}
              {brand ? (
                <div className={`${nunito.className} mt-1 text-sm opacity-80`} style={{ color: "var(--text)" }}>
                  {brand}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {affiliate ? (
              <>
                <Link
                  href={affiliate}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
                  style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" }}
                >
                  Voir l’offre
                </Link>
                <Link
                  href={affiliate}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  Choisir
                </Link>
              </>
            ) : (
              <Link
                href="/offers"
                className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" }}
              >
                Voir toutes les offres
              </Link>
            )}
            {price ? (
              <span className={`${bodoni.className} ml-auto text-xl`} style={{ color: "var(--text)" }}>
                {price}
              </span>
            ) : null}
          </div>

          {content?.intro ? (
            <p className={`${nunito.className} mt-6 text-base leading-relaxed whitespace-pre-line`} style={{ color: "var(--text)" }}>
              {content.intro}
            </p>
          ) : null}

          {/* Pros sous l’intro */}
          {content?.pros?.length ? (
            <div className="mt-6">
              <Card title="Pourquoi on aime">
                <ul className="list-disc pl-5">
                  {content.pros.map((li, i) => (
                    <li key={`pro-${i}`} className="mb-1">{li}</li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : null}
        </div>
      </section>

      {/* Cons + HowTo côte à côte, Ingrédients en dessous */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {content?.cons?.length ? (
          <Card title="À savoir">
            <ul className="list-disc pl-5">
              {content.cons.map((li, i) => (
                <li key={`con-${i}`} className="mb-1">{li}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        {content?.howTo ? (
          <Card title="Comment l’utiliser">
            <p className="whitespace-pre-line">{content.howTo}</p>
          </Card>
        ) : null}

        {content?.ingredients ? (
          <div className="md:col-span-2">
            <Card title="Ingrédients clés">
              <p className="whitespace-pre-line">{content.ingredients}</p>
            </Card>
          </div>
        ) : null}
      </section>

      {/* FAQ */}
      {content?.faq?.length ? (
        <section className="mt-10">
          <h2 className={`${bodoni.className} text-2xl mb-4`} style={{ color: "var(--text)" }}>
            FAQ
          </h2>
          <div className="divide-y rounded-3xl border" style={{ borderColor: "var(--bg-light)" }}>
            {content.faq.map((f, i) => (
              <details key={`faq-${i}`} className="p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 opacity-90 whitespace-pre-line">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* RELATED */}
      {related.length ? (
        <section className="mt-12">
          <h2 className={`${bodoni.className} text-2xl mb-4`} style={{ color: "var(--text)" }}>
            Produits liés
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((o, i) => (
              <OfferCard key={`${o.productId}-${i}`} offer={o} index={i} originSlug={slug} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ------------ UI helpers ------------ */
function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <article className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
      <h3 className={`${bodoni.className} text-lg mb-2`}>{title}</h3>
      <div className={`${nunito.className} text-sm opacity-90`}>{children}</div>
    </article>
  );
}

/* ---- Abricots (0..5, demi-points) ---- */
function ApricotRating({ rating }: { rating: number }) {
  const items = Array.from({ length: 5 }, (_, i) => {
    const idx = i + 1;
    if (rating >= idx) return "full" as const;
    if (rating >= idx - 0.5) return "half" as const;
    return "empty" as const;
  });
  return (
    <div className="flex items-center gap-1">
      {items.map((state, i) => (
        <ApricotIcon key={i} state={state} />
      ))}
    </div>
  );
}
function ApricotIcon({ state }: { state: "full" | "half" | "empty" }) {
  const size = 18; const accent = "var(--accent)"; const stroke = "var(--accent)"; const emptyFill = "transparent";
  if (state === "half") {
    return (
      <span className="relative inline-block" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" className="absolute left-0 top-0">
          <path d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z" fill={emptyFill} stroke={stroke} strokeWidth="1.4" />
          <path d="M14.8 4.5c1.1-.8 2.6-.9 3.7.2 1.4 1.4 1.4 3.7 0 5.1l-4.2 4.2c-.7.7-1.8.7-2.5 0L7.6 9c-1.4-1.4-1.4-3.7 0-5.1.6-.6 1.3-.9 2-.9" fill="none" stroke={stroke} strokeWidth="1.4" />
        </svg>
        <span className="absolute left-0 top-0 h-full overflow-hidden" style={{ width: size / 2 }}>
          <svg width={size} height={size} viewBox="0 0 24 24">
            <path d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z" fill={accent} stroke={stroke} strokeWidth="1.4" />
          </svg>
        </span>
      </span>
    );
  }
  const fill = state === "full" ? accent : emptyFill;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z" fill={fill} stroke={stroke} strokeWidth="1.4" />
      <path d="M14.8 4.5c1.1-.8 2.6-.9 3.7.2 1.4 1.4 1.4 3.7 0 5.1l-4.2 4.2c-.7.7-1.8.7-2.5 0L7.6 9c-1.4-1.4-1.4-3.7 0-5.1.6-.6 1.3-.9 2-.9" fill="none" stroke={stroke} strokeWidth="1.4" />
    </svg>
  );
}
