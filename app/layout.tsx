import "./globals.css";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";
import type React from "react";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400", "600", "700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export const metadata = {
  title: "Booty & Cutie",
  description: "Sélection beauté tendance & bons plans. Guides, tests, comparatifs.",
  metadataBase: new URL("https://bootybeauty-nextjs.example.com"), // ← ajuste si besoin
};

// Typage propre pour variables CSS
export type CSSVars = React.CSSProperties & {
  ["--accent"]: string;
  ["--secondary"]: string;
  ["--bg-light"]: string;
  ["--bg-main"]: string;
  ["--text"]: string;
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const rootStyle: CSSVars = {
    "--accent": "#C4A092",
    "--secondary": "#DABCB2",
    "--bg-light": "#EBC8B2",
    "--bg-main": "#FAF0E6",
    "--text": "#333333",
    backgroundColor: "var(--bg-main)",
  };

  return (
    <html lang="fr">
      <body style={rootStyle} className={nunito.className}>
        {/* HEADER global (présent sur toutes les pages) */}
        <header className="mx-auto max-w-6xl px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3" aria-label="Booty & Cutie – Accueil">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span className={`${bodoni.className} text-2xl`} style={{ color: "var(--text)" }}>
                Booty & Cutie
              </span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex" style={{ color: "var(--text)" }}>
              <Link href="/offers" className="opacity-80 transition hover:opacity-100">Produits</Link>
              <Link href="/blog" className="opacity-80 transition hover:opacity-100">Guides</Link>
              <Link href="/about" className="opacity-80 transition hover:opacity-100">À propos</Link>
              <Link href="/legal" className="opacity-80 transition hover:opacity-100">Mentions légales</Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
