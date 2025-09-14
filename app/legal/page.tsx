// app/legal/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — Booty Beauty',
  description:
    "Mentions obligatoires : éditeur du site, contact, hébergeur, propriété intellectuelle.",
  alternates: { canonical: 'https://bootybeauty-nextjs.vercel.app/legal' },
};

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Mentions légales</h1>

      <section className="prose prose-compact mt-6 max-w-none text-zinc-800 dark:text-zinc-200">
        <h2>Éditeur du site</h2>
        <p>
          <strong>Nom / Raison sociale :</strong> TODO_NOM_ENTREPRISE<br />
          <strong>Forme / Capital :</strong> TODO_FORME_SOCIALE (ex. micro-entreprise / SAS / etc.)<br />
          <strong>Siège social :</strong> TODO_ADRESSE_POSTALE<br />
          <strong>Responsable de la publication :</strong> TODO_NOM_RESPONSABLE<br />
          <strong>Contact :</strong> TODO_EMAIL (et/ou téléphone)
        </p>

        <h2>Hébergement</h2>
        <p>
          <strong>Hébergeur :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA<br />
          <strong>Site :</strong> vercel.com
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus (textes, visuels, logos) présents sur le site sont protégés par le droit
          de la propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle,
          sans autorisation, est interdite.
        </p>

        <h2>Affiliation</h2>
        <p>
          Certains liens présents sur le site sont des liens d’affiliation. Un achat réalisé via
          ces liens peut générer une commission pour l’éditeur, <strong>sans surcoût</strong> pour
          l’utilisateur. Voir la page <a href="/disclosure" className="underline">Disclosure</a>.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le site ne collecte pas de données personnelles hors mesures d’audience et logs
          techniques nécessaires au fonctionnement. Pour toute demande liée à la confidentialité,
          contactez-nous à l’adresse indiquée ci-dessus.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Malgré le soin apporté à la sélection et à l’actualisation des informations, certaines
          données (prix, disponibilité) peuvent évoluer chez les marchands. Les informations
          fournies sur le site le sont à titre indicatif.
        </p>
      </section>
    </main>
  );
}
