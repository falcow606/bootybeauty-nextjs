import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export const metadata = {
  title: "Transparence (Affiliation) — Booty & Cutie",
  description: "Notre politique d’affiliation et de transparence.",
};

type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

export default function DisclosurePage() {
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
          Transparence & affiliation
        </h1>
        <div className={`${nunito.className} mt-6 space-y-5`} style={{ color: "var(--text)" }}>
          <p>
            Certains liens sur ce site sont des liens d’affiliation. Si tu achètes via ces liens, nous pouvons percevoir
            une commission. Cela ne change rien au prix que tu paies.
          </p>
          <p>
            Les sélections restent éditoriales et indépendantes. Les offres sont mises à jour régulièrement et indiquées
            comme affiliées lorsque c’est le cas.
          </p>
          <p>
            Merci — ces commissions aident à financer la création des contenus, tests et comparatifs.
          </p>
        </div>
      </main>
    </div>
  );
}
