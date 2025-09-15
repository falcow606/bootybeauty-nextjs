export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import OfferCard, { type Offer } from "@/components/OfferCard";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const revalidate = 0;

type UnknownRecord = Record<string, unknown>;

/* ===================== utils safe ===================== */
function normStr(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v : String(v);
}
function getVal(obj: UnknownRecord, keys: string[]): unknown {
  for (const k of keys) if (k in obj) return obj[k];
  return undefined;
}
function getStr(obj: UnknownRecord, keys: string[]): string | undefined {
  const v = getVal(obj, keys);
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}
function firstArray(json: unknown): UnknownRecord[] {
  if (Array.isArray(json)) return json as UnknownRecord[];
  if (json && typeof json === "object") {
    const obj = json as UnknownRecord;
    const keys = ["items","data","result","rows","records","list","values","results"];
    for (const k of keys) {
      const v = obj[k];
      if (Array.isArray(v)) return v as UnknownRecord[];
    }
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) return v as UnknownRecord[];
      if (v && typeof v === "object") {
        const sub = v as UnknownRecord;
        for (const k of keys) {
          const vv = sub[k];
          if (Array.isArray(vv)) return vv as UnknownRecord[];
        }
      }
    }
  }
  return [];
}
function parseCSV(text: string): UnknownRecord[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const head = lines[0];
  const comma = (head.match(/,/g) || []).length;
  const semi = (head.match(/;/g) || []).length;
  const delim = semi > comma ? ";" : ",";
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i+1] === '"') { cur += '"'; i++; }
        else q = !q;
      } else if (ch === delim && !q) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.replace(/^"(.*)"$/, "$1"));
  };
  const headers = split(lines[0]).map((h) => h.trim());
  const rows: UnknownRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = split(lines[i]);
    const row: UnknownRecord = {};
    headers.forEach((h, j) => (row[h] = cols[j] ?? ""));
    rows.push(row);
  }
  return rows;
}
function splitList(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/\n|\r|\|/g)
    .map((s) => s.replace(/^[•\-\u2022]\s*/, "").trim())
    .filter((s) => s.length > 0);
}
function parseRating(raw?: string): number | undefined {
  if (!raw) return undefined;
  const s = raw.replace(",", ".").trim();
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return undefined;
  return Math.min(5, Math.max(0, Math.round(n * 2) / 2)); // arrondi au 0,5
}

/* ===================== mapping OFFERS ===================== */
function mapOffer(row: UnknownRecord): Offer {
  return {
    id: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    productId: getStr(row, ["Product_ID","product_id","productId","ID","id"]),
    slug: getStr(row, ["Slug","slug"]),
    title: getStr(row, ["Title","Nom","name","title"]),
    brand: getStr(row, ["Marque","Brand","Marchand","merchant","brand"]),
    imageUrl: getStr(row, ["imageUrl","Image_URL","Image Url","Image URL","image_url","Image","image"]),
    price: getStr(row, ["Prix (€)","Prix€","Prix","Price","price"]),
    affiliateUrl: getStr(row, ["Affiliate_URL","Affiliate Url","Affiliate URL","FinalURL","Final URL","Url","URL","url","link"]),
    httpStatus: getStr(row, ["httpStatus","status","code"]),
  };
}

/* ===================== mapping CONTENT ===================== */
type ProductContent = {
  slug: string;
  title?: string;
  subtitle?: string;
  heroImage?: string;
  intro?: string;
  pros?: string[];
  cons?: string[];
  howTo?: string;
  ingredients?: string;
  faq?: { q: string; a: string }[];
  rating?: number; // 0..5 (0,5 ok)
};
function mapContent(row: UnknownRecord): ProductContent | null {
  const slug = getStr(row, ["Slug","slug"]);
  if (!slug) return null;
  const title = getStr(row, ["Title","Titre","H1","h1","name"]);
  const subtitle = getStr(row, ["Subtitle","Sous-titre","sub"]);
  const heroImage = getStr(row, ["Hero","Hero_Image","Hero URL","Image_Hero","imageHero","Hero "]);
  const intro = getStr(row, ["Intro","Introduction","lead","chapo"]);
  const prosRaw = getStr(row, ["Pros","Pour","Plus","On_aime"]);
  const consRaw = getStr(row, ["Cons","Contre","Moins","A_savoir"]);
  const howTo = getStr(row, ["HowTo","How to","Utilisation","Mode_d_emploi","Conseils"]);
  const ingredients = getStr(row, ["Ingredients","Ingrédients","Key_Ingredients"]);
  const note = getStr(row, ["Note globale (sur 5)","Note","Rating","Score"]);

  // FAQ Q/A paires
  const faq: { q: string; a: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    const q = getStr(row, [`FAQ_Q${i}`, `FAQ${i}_Q`, `Question${i}`]);
    const a = getStr(row, [`FAQ_A${i}`, `FAQ${i}_A`, `Answer${i}`]);
    if (q && a) faq.push({ q, a });
  }

  return {
    slug,
    title: title || undefined,
    subtitle: subtitle || undefined,
    heroImage: heroImage || undefined,
    intro: intro || undefined,
    pros: splitList(prosRaw),
    cons: splitList(consRaw),
    howTo: howTo || undefined,
    ingredients: ingredients || undefined,
    faq: faq.length ? faq : undefined,
    rating: parseRating(note),
  };
}

/* ============== fetch data (multi-sources) ============== */
const baseInit: RequestInit & { next?: { revalidate?: number } } =
  process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production"
    ? { cache: "no-store" }
    : { next: { revalidate: 1800 } };

async function fetchRows(url?: string, needsKey = true): Promise<UnknownRecord[]> {
  if (!url) return [];
  const init: RequestInit & { next?: { revalidate?: number } } = { ...baseInit };
  if (needsKey && process.env.N8N_OFFERS_KEY) {
    init.headers = { "x-api-key": String(process.env.N8N_OFFERS_KEY) };
  }
  const res = await fetch(url, init);
  if (!res.ok) return [];
  const ct = normStr(res.headers.get("content-type")).toLowerCase();
  if (ct.includes("application/json") || ct.includes("text/json")) {
    const json = (await res.json()) as unknown;
    return firstArray(json);
  }
  const text = await res.text();
  const tt = text.trim();
  if (tt.startsWith("{") || tt.startsWith("[")) {
    const json = JSON.parse(tt) as unknown;
    return firstArray(json);
  }
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
  const mapped = rows.map(mapContent).filter(Boolean) as ProductContent[];
  return mapped;
}

/* ===================== SEO metadata ===================== */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [content, offers] = await Promise.all([getAllContent(), getAllOffers()]);
  const c = content.find((x) => x.slug === slug);
  const o = offers.find((x) => normStr(x.slug).toLowerCase() === slug.toLowerCase());
  const title = c?.title || o?.title || slug;
  const desc =
    c?.intro ||
    `Test et avis — ${title}. Sélection Booty & Cutie : conseils, utilisation et meilleures offres.`;
  return { title: `${title} — Test & avis`, description: desc };
}

/* ============================== PAGE ============================== */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [offers, contents] = await Promise.all([getAllOffers(), getAllContent()]);
  const offer =
    offers.find((o) => normStr(o.slug).toLowerCase() === slug.toLowerCase()) ||
    offers.find((o) => normStr(o.title).toLowerCase() === slug.replace(/-/g, " ").toLowerCase());

  const content = contents.find((c) => c.slug.toLowerCase() === slug.toLowerCase());

  // Données d’affichage
  const title = content?.title || offer?.title || slug;
  const subtitle = content?.subtitle || offer?.brand || "";
  const heroImg = content?.heroImage || offer?.imageUrl || "/images/product-placeholder.jpg";
  const price = offer?.price || "";
  const affiliate = offer?.affiliateUrl || "";
  const rating = content?.rating;

  // Produits liés : même marque sinon aléatoire
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

          {/* Note / 5 avec abricots */}
          {typeof rating === "number" ? (
            <div className="mt-3 flex items-center gap-2">
              <ApricotRating rating={rating} />
              <span className={`${nunito.className} text-sm opacity-70`} style={{ color: "var(--text)" }}>
                {String(rating).replace(".", ",")}/5
              </span>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            {affiliate ? (
              <Link
                href={affiliate}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Choisir
              </Link>
            ) : null}
            <Link
              href="/offers"
              className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
              style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" }}
            >
              Voir toutes les offres
            </Link>
            {price ? (
              <span className={`${bodoni.className} ml-auto text-xl`} style={{ color: "var(--text)" }}>
                {price}
              </span>
            ) : null}
          </div>

          {content?.intro ? (
            <p className={`${nunito.className} mt-6 text-base leading-relaxed`} style={{ color: "var(--text)" }}>
              {content.intro}
            </p>
          ) : null}
        </div>
      </section>

      {/* SECTIONS */}
      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {content?.pros?.length ? (
          <Card title="Pourquoi on aime">
            <ul className="list-disc pl-5">
              {content.pros.map((li, i) => (
                <li key={`pro-${i}`} className="mb-1">{li}</li>
              ))}
            </ul>
          </Card>
        ) : null}

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
          <Card title="Ingrédients clés">
            <p className="whitespace-pre-line">{content.ingredients}</p>
          </Card>
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
                <p className="mt-2 opacity-90">{f.a}</p>
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

/* ===================== UI helpers ===================== */
function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <article className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
      <h3 className={`${bodoni.className} text-lg mb-2`}>{title}</h3>
      <div className={`${nunito.className} text-sm opacity-90`}>{children}</div>
    </article>
  );
}

/* ================ Apricot rating (0..5, demi-points) ================ */
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
  const size = 18;
  const accent = "var(--accent)";
  const stroke = "var(--accent)";
  const emptyFill = "transparent";

  if (state === "half") {
    return (
      <span className="relative inline-block" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 24 24" className="absolute left-0 top-0">
          <path
            d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z"
            fill={emptyFill}
            stroke={stroke}
            strokeWidth="1.4"
          />
          <path
            d="M14.8 4.5c1.1-.8 2.6-.9 3.7.2 1.4 1.4 1.4 3.7 0 5.1l-4.2 4.2c-.7.7-1.8.7-2.5 0L7.6 9c-1.4-1.4-1.4-3.7 0-5.1.6-.6 1.3-.9 2-.9"
            fill="none"
            stroke={stroke}
            strokeWidth="1.4"
          />
        </svg>
        <span className="absolute left-0 top-0 h-full overflow-hidden" style={{ width: size / 2 }}>
          <svg width={size} height={size} viewBox="0 0 24 24">
            <path
              d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z"
              fill={accent}
              stroke={stroke}
              strokeWidth="1.4"
            />
          </svg>
        </span>
      </span>
    );
  }

  const fill = state === "full" ? accent : emptyFill;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 6c1.8-2 4.6-2.3 6.5-.4 2 2 2 5.3 0 7.3l-4.2 4.2c-1.3 1.3-3.3 1.3-4.6 0L5.5 13c-2-2-2-5.3 0-7.3C7.4 3.8 10.2 4 12 6Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.4"
      />
      <path
        d="M14.8 4.5c1.1-.8 2.6-.9 3.7.2 1.4 1.4 1.4 3.7 0 5.1l-4.2 4.2c-.7.7-1.8.7-2.5 0L7.6 9c-1.4-1.4-1.4-3.7 0-5.1.6-.6 1.3-.9 2-.9"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      />
    </svg>
  );
}
