// app/p/[slug]/page.tsx
import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import OfferCard, { type Offer } from '@/components/OfferCard';
import { getContentBySlug } from '@/lib/sheets';

export const revalidate = 1800;

type Params = Promise<{ slug: string }>;

// --- Utils ---
function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalizePrice(input?: unknown): string | undefined {
  if (input == null) return undefined;
  const s = String(input).replace(',', '.').trim();
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return n.toFixed(2);
  return undefined;
}
function normalizeCurrency(input?: unknown): string {
  const s = String(input || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(s) ? s : 'EUR';
}

// --- Offres liées (n8n) ---
async function getRelatedOffers(slug: string, title?: string): Promise<Offer[]> {
  const url = process.env.N8N_OFFERS_API;
  if (!url) return [];

  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();
  if (!res.ok) return [];

  let data: unknown = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    return [];
  }

  const all = Array.isArray(data) ? (data as Offer[]) : [];
  const valids = all.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200');

  // petite heuristique de matching slug/titre
  const base = (title ?? slug).toLowerCase();
  const words = base.split(/[^a-z0-9]+/i).filter((w) => w.length >= 3);
  const sSlug = slug.toLowerCase();

  const related = valids.filter((o) => {
    const hay = (
      String(o.productId ?? '') +
      ' ' +
      String(o.merchant ?? '')
    ).toLowerCase();
    return hay.includes(sSlug) || words.some((w) => hay.includes(w));
  });

  return related.slice(0, 6);
}

// --- Metadata dynamique ---
export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getContentBySlug(slug);
  const title = data?.title ?? 'Fiche produit';
  const description = data?.html ? stripHtml(data.html).slice(0, 160) : 'Fiche produit beauté';
  const canonical = `https://bootybeauty-nextjs.vercel.app/p/${slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Booty Beauty Project',
    },
  };
}

// --- Page Produit ---
export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const data = await getContentBySlug(slug);

  if (!data) {
    return (
      <div className="prose">
        <h1>Introuvable (slug incorrect ou CSV non publié).</h1>
        <Link href="/" className="text-blue-600 underline">
          ← Retour à l’accueil
        </Link>
      </div>
    );
  }

  const title = data.title as string;
  const html = data.html as string;
  const schema = (data.schema || {}) as Record<string, unknown>;

  // 1) Lecture "à plat"
  let affiliate = (schema['affiliate'] as string | undefined) || undefined;
  const image = (schema['image'] as string | undefined) || undefined;
  let price = normalizePrice(schema['price']);
  let priceCurrency = normalizeCurrency(schema['priceCurrency']);
  let availability =
    typeof schema['availability'] === 'string' &&
    (schema['availability'] as string).startsWith('http')
      ? (schema['availability'] as string)
      : 'https://schema.org/InStock';

  // Marque (si présente)
  let brandName: string | undefined;
  const brand = schema['brand'];
  if (brand && typeof brand === 'object' && 'name' in (brand as Record<string, unknown>)) {
    const n = (brand as Record<string, unknown>)['name'];
    if (typeof n === 'string' && n.trim()) brandName = n.trim();
  }

  // 2) Bloc "offers" éventuel dans Schema_JSON
  const offersInSchema = schema['offers'] as Record<string, unknown> | undefined;
  if (offersInSchema && typeof offersInSchema === 'object') {
    if (!affiliate && typeof offersInSchema['url'] === 'string') {
      affiliate = offersInSchema['url'] as string;
    }
    if (offersInSchema['price'] != null) price = normalizePrice(offersInSchema['price']);
    if (offersInSchema['priceCurrency'] != null)
      priceCurrency = normalizeCurrency(offersInSchema['priceCurrency']);
    if (
      typeof offersInSchema['availability'] === 'string' &&
      (offersInSchema['availability'] as string).startsWith('http')
    ) {
      availability = offersInSchema['availability'] as string;
    }
  }

  // 3) JSON-LD
  const canonical = `https://bootybeauty-nextjs.vercel.app/p/${slug}`;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: stripHtml(html).slice(0, 500),
    category: 'Body Care',
    url: affiliate || canonical, // si affilié, Google aime bien l’URL d’achat
  };
  if (brandName) jsonLd['brand'] = { '@type': 'Brand', name: brandName };
  if (image) jsonLd['image'] = [image];
  if (affiliate) {
    jsonLd['offers'] = {
      '@type': 'Offer',
      url: affiliate,
      price: price || '0.00',
      priceCurrency: priceCurrency || 'EUR',
      availability: availability || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    };
  }

  // 4) Offres liées depuis n8n (fallback si pas d’URL affiliée directe)
  const related = await getRelatedOffers(slug, title);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>

      {/* CTA principal si lien affilié direct */}
      {affiliate && (
        <div className="mt-4">
          <AffiliateLink
            href={affiliate}
            className="inline-flex items-center rounded-xl bg-[#C4A092] px-4 py-2 text-white hover:opacity-90"
          >
            Voir l’offre
          </AffiliateLink>
        </div>
      )}

      {/* Sticky CTA mobile si pas d’URL affiliée directe mais offres liées dispo */}
      {!affiliate && related[0]?.affiliateUrl && (
        <div className="sticky bottom-3 z-30 mt-4 sm:hidden">
          <a
            href={related[0].affiliateUrl}
            rel="nofollow sponsored noopener"
            target="_blank"
            className="block rounded-xl bg-rose-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg ring-1 ring-black/5"
          >
            Voir la meilleure offre
          </a>
        </div>
      )}

      {/* Contenu éditorial */}
      <article
        className="prose prose-neutral mt-6 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Offres liées (grid) */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Où l’acheter ?</h2>
        {related.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune offre associée trouvée. Consultez{' '}
            <a className="underline" href="/offers">
              toutes les offres
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((o, i) => (
              <OfferCard key={`${o.productId}-${i}`} offer={o} index={i} originSlug={slug} />
            ))}
          </div>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
