import Image from "next/image";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export const metadata = {
  title: "À propos — Booty & Cutie",
  description: "Le blog beauté dédié aux fesses, aux soins intimes et aux bons plans cosmétiques, animé par Linette.",
};

// Typage des variables CSS (no any)
type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

// ➜ Si ton image a un autre chemin, change cette constante :
const IMAGE_SRC = "/images/about.jpg";

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
          À propos de <span style={{ color: "var(--accent)" }}>Booty & Cutie</span> 💖
        </h1>

        <div className="mt-8 grid items-start gap-10 md:grid-cols-2">
          {/* Colonne texte */}
          <article className={`${nunito.className} space-y-5 text-base leading-relaxed`} style={{ color: "var(--text)" }}>
            <p><strong>Hello, moi c’est Linette !</strong><br />
              Bienvenue sur Booty & Cutie, le blog beauté qui t’aide à trouver les meilleurs soins pour les fesses,
              les produits intimes sûrs et tous les bons plans beauté du moment.
            </p>

            <p>
              Depuis plusieurs années, je teste et compare des cosmétiques : crèmes raffermissantes, gels dépigmentants,
              soins intimes respectueux ou encore astuces naturelles pour garder un booty ferme, lisse et sexy.
              Mon objectif est simple : t’éviter de perdre du temps (et de l’argent !) en partageant uniquement les
              produits qui fonctionnent vraiment.
            </p>

            <h2 className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>Pourquoi j’ai créé Booty & Cutie ?</h2>
            <p>
              Parce que je suis convaincue que la beauté ne se limite pas au visage.
              Prendre soin de son corps et de son intimité est essentiel pour se sentir bien dans sa peau.
              Sur ce blog, je veux :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Donner mon avis honnête sur les crèmes pour les fesses et autres soins intimes.</li>
              <li>Partager des comparatifs clairs avec mes recommandations.</li>
              <li>Dénicher pour toi les bons plans beauté et réductions disponibles en ligne.</li>
            </ul>

            <h2 className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>Ce que tu trouveras ici ✨</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Des articles complets sur les soins booty et les crèmes raffermissantes efficaces.</li>
              <li>Des guides pour choisir un dépigmentant intime sûr et testé.</li>
              <li>Des sélections de bons produits beauté disponibles sur Amazon ou chez mes partenaires affiliés.</li>
            </ul>

            <h2 className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>Mon approche</h2>
            <p>
              Je ne suis pas médecin, mais une passionnée de beauté qui adore tester et comparer.
              Chaque avis publié est basé sur mon expérience, mes recherches et ce que je constate dans la vraie vie.
              Ici, pas de blabla marketing : je partage mes coups de cœur, mes astuces, mais aussi mes déceptions
              pour que tu aies toutes les infos avant d’acheter.
            </p>

            <p className="mt-4">
              👉 <strong>En bref</strong>, Booty & Cutie, c’est le blog beauté dédié aux fesses, aux soins intimes et aux bons plans cosmétiques,
              animé par une vraie passionnée : moi, Linette 💕
            </p>
          </article>

          {/* Colonne image */}
          <div className="relative">
            <Image
              src={IMAGE_SRC}
              alt="Linette — Booty & Cutie, blog beauté dédié aux fesses et aux soins intimes"
              width={1200}
              height={900}
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-xl"
              priority
            />
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-3xl opacity-30 blur-md" style={{ backgroundColor: "var(--accent)" }} />
            <div className="pointer-events-none absolute -top-4 -right-4 h-20 w-20 rounded-3xl opacity-30 blur-md" style={{ backgroundColor: "var(--secondary)" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
