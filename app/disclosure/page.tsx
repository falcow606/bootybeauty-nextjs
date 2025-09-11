// app/disclosure/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparence & Affiliation',
  description:
    'Explication claire de notre modèle d’affiliation : comment nous gagnons de l’argent et ce que cela change pour vous.',
  alternates: { canonical: '/disclosure' },
};

export default function DisclosurePage() {
  return (
    <main className="max-w-3xl mx-auto p-6 prose prose-zinc">
      <h1>Transparence &amp; affiliation</h1>

      <p>
        Certaines pages de BootyBeauty contiennent des liens d’affiliation. Cela signifie que si
        vous cliquez puis achetez un produit, nous pouvons percevoir une commission de la part du
        marchand. <strong>Le prix que vous payez ne change pas</strong>.
      </p>

      <h2>Pourquoi l’affiliation ?</h2>
      <p>
        L’affiliation nous permet de financer la sélection des bons plans, la vérification des
        disponibilités et l’hébergement du site, sans recourir à la publicité intrusive.
      </p>

      <h2>Comment nous sélectionnons les offres</h2>
      <ul>
        <li>Prix, disponibilité et qualité perçue</li>
        <li>Fiabilité du marchand (marques officielles, marketplaces connues)</li>
        <li>Expérience utilisateur (retours, livraison, service client)</li>
      </ul>

      <h2>Indépendance éditoriale</h2>
      <p>
        Les marchands ne paient pas pour apparaître dans nos listes. Nous pouvons retirer à tout
        moment une offre qui ne nous paraît plus pertinente.
      </p>

      <h2>Nous contacter</h2>
      <p>
        Une question ? Écrivez-nous : <a href="mailto:contact@bootybeauty.com">contact@bootybeauty.com</a>
      </p>
    </main>
  );
}
