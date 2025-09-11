// app/mentions-legales/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    'Informations légales de BootyBeauty : éditeur du site, hébergeur, propriété intellectuelle, responsabilité et contact.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  const updated = new Date().toLocaleDateString('fr-FR');

  return (
    <main className="max-w-3xl mx-auto p-6 prose prose-zinc">
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        <strong>BootyBeauty</strong><br />
        Raison sociale : <em>À compléter</em><br />
        Siège social : <em>À compléter</em><br />
        Contact : <a href="mailto:contact@bootybeauty.com">contact@bootybeauty.com</a>
      </p>

      <h2>Directeur de la publication</h2>
      <p>
        <em>À compléter</em>
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong> – vercel.com
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le contenu de ce site (textes, visuels, logos, marques) est protégé par le droit de la
        propriété intellectuelle. Toute reproduction, représentation, modification ou diffusion, en
        tout ou partie, est interdite sans autorisation préalable.
      </p>

      <h2>Responsabilité</h2>
      <p>
        BootyBeauty s’efforce d’assurer l’exactitude et la mise à jour des informations. Toutefois,
        aucune garantie n’est apportée quant à l’exhaustivité ou l’absence d’erreurs. Les liens vers
        des sites tiers ne sauraient engager la responsabilité de l’éditeur.
      </p>

      <h2>Affiliation</h2>
      <p>
        Certaines pages contiennent des liens d’affiliation. Si vous achetez via ces liens,
        BootyBeauty peut percevoir une commission, sans surcoût pour vous.
      </p>

      <h2>Données personnelles</h2>
      <p>
        BootyBeauty ne collecte pas de données personnelles sans votre consentement. Pour toute
        question, vous pouvez nous contacter à l’adresse ci-dessus.
      </p>

      <p className="text-sm text-zinc-500 mt-8">Dernière mise à jour : {updated}</p>
    </main>
  );
}
