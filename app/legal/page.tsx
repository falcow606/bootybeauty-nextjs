import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata = {
  title: "Mentions légales — Booty & Cutie",
  description: "Mentions légales, affiliation, hébergeur et responsabilité.",
};

type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

export default function LegalPage() {
  const rootStyle: CSSVars = {
    "--accent": "#C4A092",
    "--secondary": "#DABCB2",
    "--bg-light": "#EBC8B2",
    "--bg-main": "#FAF0E6",
    "--text": "#333333",
    backgroundColor: "var(--bg-main)",
  };

  return (
    <div className="min-h-screen w-full" style={rootStyle}>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "var(--text)" }}>
          Mentions légales
        </h1>

        <section className="mt-8 space-y-6">
          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Éditeur du site</h2>
            <p>Contact : <strong>bootyandcutie@gmail.com</strong> (et/ou téléphone)</p>
          </article>

          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Hébergement</h2>
            <p>Hébergeur : <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
            <p>Site : <strong>vercel.com</strong></p>
          </article>

          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Propriété intellectuelle</h2>
            <p>
              Les contenus (textes, visuels, logos) présents sur le site sont protégés par le droit de la propriété
              intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation, est interdite.
            </p>
          </article>

          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Affiliation</h2>
            <p>
              Certains liens présents sur le site sont des liens d’affiliation. Un achat réalisé via ces liens peut générer
              une commission pour l’éditeur, sans surcoût pour l’utilisateur. Voir la page <a href="/disclosure" className="underline">Disclosure</a>.
            </p>
          </article>

          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Données personnelles</h2>
            <p>
              Le site ne collecte pas de données personnelles hors mesures d’audience et logs techniques nécessaires au
              fonctionnement. Pour toute demande liée à la confidentialité, contactez-nous à l’adresse indiquée ci-dessus.
            </p>
          </article>

          <article className={`${nunito.className} rounded-3xl border p-6`} style={{ borderColor: "var(--bg-light)", color: "var(--text)" }}>
            <h2 className="text-xl font-semibold mb-2">Responsabilité</h2>
            <p>
              Malgré le soin apporté à la sélection et à l’actualisation des informations, certaines données (prix, disponibilité)
              peuvent évoluer chez les marchands. Les informations fournies sur le site le sont à titre indicatif.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
