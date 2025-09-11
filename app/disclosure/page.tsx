// app/disclosure/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclosure (transparence)',
  description:
    "Informations sur notre utilisation de liens d'affiliation et notre indépendance éditoriale.",
  alternates: { canonical: '/disclosure' },
};

export default function DisclosurePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Disclosure</h1>
      <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">
        <p>
          Certains liens présents sur Booty Beauty sont des liens d’affiliation. Si vous achetez un
          produit après avoir cliqué, nous pouvons percevoir une commission. Cela n’entraîne aucun
          surcoût pour vous.
        </p>
        <p>
          La sélection éditoriale est indépendante : nous choisissons les produits et les offres en
          fonction de leur intérêt pour nos lectrices/lecteurs (qualité, prix, disponibilité).
        </p>
        <p>
          Nous travaillons avec différents partenaires (ex. Amazon, Awin). Ces partenariats ne
          modifient pas notre avis ni l’ordre d’affichage si ce n’est pour refléter des promos ou
          la disponibilité.
        </p>
      </div>
    </main>
  );
}

