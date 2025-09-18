// app/top-10/booty-beauty-2025/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Bodoni_Moda, Nunito_Sans } from "next/font/google";

const bodoni = Bodoni_Moda({ subsets: ["latin"], style: ["normal"], weight: ["400","600","700"] });
const nunito = Nunito_Sans({ subsets: ["latin"], weight: ["300","400","600","700"] });

export default function Top10Page() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>Top 10 Booty & Cutie — 2025</h1>
      <p className={`${nunito.className} mt-2 opacity-80`}>
        Notre sélection des indispensables. (Page simplifiée — tu pourras la compléter plus tard.)
      </p>
      <div className="mt-6">
        <Link href="/offers" className="rounded-2xl bg-[#C4A092] px-5 py-3 text-white">Voir toutes les offres</Link>
      </div>
    </div>
  );
}
