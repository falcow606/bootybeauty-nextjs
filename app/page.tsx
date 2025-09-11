// app/page.tsx
export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import Link from 'next/link';
import OfferCard, { type Offer } from '@/components/OfferCard';

async function getOffers(): Promise<Offer[]> {
  // Récupère l’URL absolue de l’API interne (compatible Vercel)
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/offers`, { cache: 'no-store' });
  if (!res.ok) return [];

  const data = (await res.json()) as unknown;
  const list = Array.isArray(data) ? (data as Offer[]) : [];
  const valids = list.filter((o) => o?.affiliateUrl && String(o?.httpStatus) === '200');

  // Tri fraicheur puis prix
  valids.sort((a, b) => {
    const t = (d: unknown) => new Date(String(d ?? 0)).getTime();
    const dt = t(b.lastChecked) - t(a.lastChecked);
    if (dt !== 0) return dt;
    return Number(a.price ?? Number.POSITIVE_INFINITY) - Number(b.price ?? Number.POSITIVE_INFINITY);
  });

  return valids.slice(0, 6);
}

export default async function HomePage() {
  const top = await getOffers();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* HERO */}
      <section className="rounded-3xl bg-gradient-to-br from-rose-100 via-rose-50 to-white p-8 ring-1 ring-rose-200/60 dark:from-rose-900/10 dark:via-zinc-900 dark:to-zinc-950 dark:ring-zinc-800">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Soins booty : la sélection qui fait gagner du temps 💖
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
          On repère les produits qui valent le coup, on compare les prix et on vous envoie direct
          vers <span className="font-medium">la meilleure offre du moment</span>.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/offers"
            className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            Voir toutes les offres
          </Link>
          <Link
            href="/top-10/booty-beauty-2025"
            className="inline-flex items-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Top 10 2025
          </Link>
        </div>
        <ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-3">
          <li className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            ✅ Sélection éditoriale
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            🔎 Prix surveillés
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            🤝 Liens partenaires sans surcoût
          </li>
        </ul>
      </section>

      {/* OFFRES EN AVANT */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Offres à ne pas manquer</h2>
          <Link href="/offers" className="text-sm text-rose-700 underline hover:text-rose-800">
            Tout voir
          </Link>
        </div>

        {top.length === 0 ? (
          <p className="text-sm text-zinc-500">Revenez bientôt : les offres se mettent en place.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {top.map((o, i) => (
              <OfferCard key={`${o.productId}-${i}`} offer={o} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* GUIDES / CONFIANCE */}
      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-base font-semibold">Comment on choisit</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Efficacité, compo, avis réels : on garde l’essentiel et on coupe le bruit.
          </p>
          <Link href="/about" className="mt-3 inline-block text-sm text-rose-700 underline">
            En savoir plus
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-base font-semibold">Transparence</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Certains liens sont affiliés. Ça nous rémunère, jamais de surcoût pour vous.
          </p>
          <Link href="/disclosure" className="mt-3 inline-block text-sm text-rose-700 underline">
            Notre disclosure
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <h3 className="text-base font-semibold">Top 10</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Le condensé : 10 produits qui cochent toutes les cases, mis à jour.
          </p>
          <Link
            href="/top-10/booty-beauty-2025"
            className="mt-3 inline-block text-sm text-rose-700 underline"
          >
            Voir le classement
          </Link>
        </div>
      </section>
    </main>
  );
}
