// app/legal/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description:
    "Informations légales sur l'éditeur du site, l'hébergement et les conditions d'utilisation.",
  alternates: { canonical: '/legal' },
};

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mentions légales</h1>
      <div className="prose prose-neutral mt-6 max-w-none dark:prose-invert">
        <h2>Éditeur du site</h2>
        <p>
          <strong>Dénomination&nbsp;:</strong> <em>À compléter</em>
          <br />
          <strong>Forme juridique&nbsp;:</strong> <em>À compléter</em>
          <br />
          <strong>Adresse&nbsp;:</strong> <em>À compléter</em>
          <br />
          <strong>SIREN / SIRET&nbsp;:</strong> <em>À compléter</em>
          <br />
          <strong>Contact&nbsp;:</strong>{' '}
          <a className="underline" href="mailto:contact@bootybeauty.example">
            contact@bootybeauty.example
          </a>
        </p>

        <h2>Directeur de la publication</h2>
        <p>
          <em>À compléter (nom et qualité).</em>
        </p>

        <h2>Hébergement</h2>
        <p>
          <strong>Hébergeur&nbsp;:</strong> Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, USA
          <br />
          <a className="underline" href="https://vercel.com" target="_blank" rel="noopener">
            vercel.com
          </a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les contenus de ce site (textes, éléments graphiques, logos) sont protégés. Toute
          reproduction non autorisée est interdite.
        </p>

        <h2>Responsabilité</h2>
        <p>
          Les informations sont fournies à titre indicatif. Les prix, disponibilités et offres
          peuvent évoluer. Vérifiez toujours les informations sur le site marchand avant achat.
        </p>

        <h2>Liens d’affiliation</h2>
        <p>
          Certains liens sont susceptibles de générer une commission sans surcoût pour l’utilisateur.
          Voir la page <a className="underline" href="/disclosure">Disclosure</a>.
        </p>
      </div>
    </main>
  );
}
