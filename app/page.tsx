// app/page.tsx
import Link from 'next/link';
import OffersClient from '@/components/OffersClient';
import { headers } from 'next/headers';

export const revalidate = 300;

export default async function Home() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const base = `${proto}://${host}`;
  const offersApi = `${base}/api/offers`;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-10 md:py-14">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold">
            Soins booty&nbsp;: la sélection qui fait gagner du temps 💖
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            On repère les bons produits, on surveille les prix et on vous envoie
            directement vers l’offre la plus intéressante du moment.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-600">
            <span className="badge">Sélection éditoriale</span>
            <span className="badge">Prix surveillés</span>
            <span className="badge">Liens partenaires sans surcoût</span>
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/offers" className="btn-primary">Voir toutes les offres</Link>
            <Link href="/top-10/booty-beauty-2025" className="btn-outline">Top 10</Link>
          </div>
        </div>
      </section>

      {/* Offres */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-semibold">Offres à ne pas manquer</h2>
          <Link href="/offers" className="nav-link text-sm">Tout voir →</Link>
        </div>

        <OffersClient apiUrl={offersApi} />
      </section>
    </div>
  );
}
