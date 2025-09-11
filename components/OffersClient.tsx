"use client";

import { useEffect, useState } from "react";
import OfferCard from "@/components/OfferCard";

export type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;
};

function isOffer(x: unknown): x is Offer {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "affiliateUrl" in o && "httpStatus" in o;
}

type Props = {
  /** Option 1 : l’URL de l’API à appeler côté client (ex: /api/offers) */
  apiUrl?: string;
  /** Option 2 : des offres déjà passées côté serveur (non utilisé si apiUrl est fourni) */
  initialOffers?: Offer[];
};

export default function OffersClient({ apiUrl, initialOffers = [] }: Props) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [loading, setLoading] = useState<boolean>(!initialOffers.length && !!apiUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) return;

    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(apiUrl, { cache: "no-store", signal: ctrl.signal });
        const text = await res.text();
        if (!res.ok) throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);

        const data: unknown = text ? JSON.parse(text) : [];
        const list: Offer[] = Array.isArray(data)
          ? (data as unknown[])
              .filter(isOffer)
              .filter((o) => o.affiliateUrl && String(o.httpStatus) === "200")
          : [];

        if (!cancelled) setOffers(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [apiUrl]);

  if (error) return <p className="text-red-600 text-sm">Erreur chargement offres : {error}</p>;
  if (loading) return <p className="text-sm text-neutral-500">Chargement des offres…</p>;
  if (offers.length === 0) return <p className="text-sm text-neutral-500">Aucune offre valide pour le moment.</p>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {offers.map((o, i) => (
        <OfferCard key={String(o.productId)} offer={o} index={i} />
      ))}
    </div>
  );
}
