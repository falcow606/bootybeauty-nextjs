// app/offers/page.tsx
import { headers } from 'next/headers';
import OffersClient from '@/components/OffersClient';
import type { Metadata } from 'next';

export const revalidate = 0; // page live (pas de cache)

export const metadata: Metadata = {
  title: 'Offres — Booty Beauty',
  description:
    "Toutes nos offres beauté prêtes à l’achat, mises à jour et vérifiées.",
  alternates: {
    canonical: 'https://bootybeauty-nextjs.vercel.app/offers',
  },
};

export default async function OffersPage() {
  // Reconstruit l’URL absolue pour appeler /api/offers (OK en local et Vercel)
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto =
    h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const base = `${proto}://${host}`;
  const apiUrl = `${base}/api/offers`;

  return (
    <main className="max-w-5xl mx-auto px-5 py-8">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold">Toutes les offres</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Prix indicatifs, disponibilité et liens partenaires sans surcoût pour vous.
        </p>
      </header>

      {/* ⬇️ Le composant client charge l’API /api/offers */}
      <OffersClient apiUrl={apiUrl} />
    </main>
  );
}
