// app/top-10/[slug]/page.tsx
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const pretty = slug.replace(/-/g, ' ');
  const title = `Top 10 ${pretty} — Booty Beauty`;
  const description =
    "Notre sélection indépendante des meilleurs produits, mise à jour régulièrement selon les offres partenaires.";
  const url = `https://bootybeauty-nextjs.vercel.app/top-10/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Booty Beauty Project',
    },
  };
}

export default async function TopPage({ params }: { params: Params }) {
  const { slug } = await params;
  const h = slug.replace(/-/g, ' ');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Top 10 {h}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Classement éditorial mis à jour régulièrement. Liens sortants affiliés, sans impact sur le
          prix final.
        </p>
      </header>

      <ol className="space-y-6 [counter-reset:rank]">
        {Array.from({ length: 10 }).map((_, i) => (
          <li
            key={i}
            className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="absolute -left-3 -top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="text-lg font-semibold">Produit #{i + 1} — Nom à définir</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Résumé en 1 ligne : pourquoi on l’aime, pour qui, et quand l’utiliser.
            </p>
            <div className="mt-4">
              <a
                href="/offers"
                className="inline-flex rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                Voir les offres
              </a>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
