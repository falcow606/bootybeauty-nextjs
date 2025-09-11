// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "Notre promesse : une sélection claire des meilleurs soins booty, prix comparés et offres mises à jour.",
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">À propos</h1>
      <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">
        <p>
          Booty Beauty est un sélecteur de soins pour fessiers : nous mettons en avant des produits
          pertinents, comparons les prix et pointons vers les meilleures offres disponibles.
        </p>
        <h2>Comment on choisit</h2>
        <ul>
          <li>Sélection éditoriale (efficacité, composition, popularité réelle).</li>
          <li>Prix surveillés et mises à jour automatiques.</li>
          <li>Transparence : liens affiliés indiqués, aucun surcoût pour vous.</li>
        </ul>
        <h2>Pourquoi on existe</h2>
        <p>
          Gagner du temps et de l’argent : au lieu d’onglets ouverts partout, une page claire
          présentant l’essentiel… et un bouton “Voir l’offre” quand c’est le bon moment.
        </p>
        <p>
          Une question, une marque à suggérer ? Écrivez-nous :{' '}
          <a className="underline" href="mailto:contact@bootybeauty.example">
            contact@bootybeauty.example
          </a>
          .
        </p>
      </div>
    </main>
  );
}
