import Image from "next/image";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata = {
  title: "À propos — Booty & Cutie",
  description: "Notre mission, notre méthode et notre transparence sur l’affiliation.",
};

// Typage propre pour les variables CSS
type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

export default function AboutPage() {
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className={`${bodoni.className} text-4xl md:text-5xl`} style={{ color: "var(--text)" }}>
          À propos de <span style={{ color: "var(--accent)" }}>Booty & Cutie</span>
        </h1>

        <div className="mt-8 grid items-start gap-10 md:grid-cols-2">
          <div className={`${nunito.className} space-y-5 text-base leading-relaxed`} style={{ color: "var(--text)" }}>
            {/* ➜ Colle ici TON texte rédigé */}
            <p>
              Bienvenue sur Booty & Cutie — le blog beauté qui t’aide à trouver les meilleurs soins pour les fesses,
              des produits intimes sûrs et tous les bons plans du moment. Notre promesse : sélection éditoriale
              exigeante, tests transparents et recommandations argumentées.
            </p>
            <p>
              Nous comparons les formules, les textures, les retours d’expérience et les prix pour te proposer une shortlist
              claire. Lorsque tu achètes via nos liens, nous pouvons percevoir une commission d’affiliation ; cela n’affecte pas
              ton prix et nous permet de financer ce travail.
            </p>
            <p>
              Tu peux aussi lire nos guides pour comprendre comment choisir les produits adaptés à ta peau et à tes objectifs,
              ainsi que nos fiches détaillées, mises à jour régulièrement.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/offers"
                className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Voir les offres
              </Link>
              <Link
                href="/legal"
                className="rounded-2xl border px-5 py-3 transition hover:opacity-90"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "transparent" }}
              >
                Mentions & transparence
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* ➜ Remplace l’image par la tienne : /images/about.jpg (ou ton fichier) */}
            <Image
              src="/images/about.jpg"
              alt="Booty & Cutie — coulisses & intention éditoriale"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
              priority
            />
          </div>
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <Item title="Méthode claire">Critères publics, sources citées, choix expliqués.</Item>
          <Item title="Indépendance">Sélection éditoriale : pas d’articles sponsorisés déguisés.</Item>
          <Item title="Mises à jour">Offres & contenus révisés régulièrement.</Item>
        </section>
      </main>
    </div>
  );
}

function Item({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="rounded-3xl border p-5" style={{ borderColor: "var(--bg-light)" }}>
      <h3 className="text-lg" style={{ color: "var(--text)" }}>{title}</h3>
      <p className="mt-2 text-sm opacity-80" style={{ color: "var(--text)" }}>{children}</p>
    </div>
  );
}
