// app/disclosure/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclosure — Booty Beauty',
  description:
    "Explication transparente de notre modèle : certains liens sont affiliés, cela nous rémunère sans surcoût pour vous.",
  alternates: { canonical: 'https://bootybeauty-nextjs.vercel.app/disclosure' },
};

export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Disclosure</h1>

      <div className="prose prose-compact mt-6 max-w-none text-zinc-800 dark:text-zinc-200">
        <p>
          Sur Booty Beauty, certains liens vers des marchands (ex. Amazon, YSL Beauty, etc.)
          sont des <strong>liens d’affiliation</strong>. Si vous achetez via ces liens, nous
          pouvons percevoir une commission. <strong>Le prix ne change pas pour vous</strong>.
        </p>

        <h2>Notre approche</h2>
        <ul>
          <li>Nous sélectionnons d’abord les produits pour leur intérêt (qualité, avis, prix).</li>
          <li>Nous comparons les offres et mettons en avant la plus intéressante au moment T.</li>
          <li>La présence d’un lien affilié n’influe pas nos avis ni nos choix éditoriaux.</li>
        </ul>

        <h2>Pourquoi l’affiliation&nbsp;?</h2>
        <p>
          C’est ce qui nous permet de financer la sélection éditoriale, la surveillance des prix,
          l’hébergement et les améliorations du site – <strong>sans publicité intrusive</strong>.
        </p>

        <h2>Transparence</h2>
        <p>
          Vous devez être informé·e : nous indiquons clairement lorsque des liens peuvent nous
          rémunérer. Si vous avez des questions, contactez-nous via la page{' '}
          <Link href="/about" className="underline">À propos</Link>.
        </p>
      </div>
    </main>
  );
}
