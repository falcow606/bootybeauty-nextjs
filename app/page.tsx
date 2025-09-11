// app/page.tsx
import Link from "next/link";
import OffersClient from "@/components/OffersClient";
import { headers } from "next/headers";

export const revalidate = 0; // page live (pas de cache)

export default async function HomePage() {
  // Reconstruit l’URL absolue en prod comme en local pour /api/offers
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;
  const offersApi = `${base}/api/offers`;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="brand text-xl font-semibold">
          Booty Beauty
        </Link>
        <nav className="text-sm">
          <Link href="/top-10/booty-beauty-2025/" className="hover:underline">
            Top 10
          </Link>
          <span className="mx-2">·</span>
          <Link href="/offers" className="hover:underline">
            Offres
          </Link>
        </nav>
      </header>

      <section className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Soins booty : la sélection qui fait gagner du temps 💖
        </h1>
        <p className="text-neutral-600">
          On repère les produits qui valent le coup, on surveille les prix et on
          vous envoie direct vers la meilleure offre du moment.
        </p>
        <Link href="/offers" className="text-sm underline">
          Voir toutes les offres
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Offres à ne pas manquer</h2>
        {/* Le composant client charge l’API /api/offers */}
        <OffersClient apiUrl={offersApi} />
      </section>
    </div>
  );
}
