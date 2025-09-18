// components/OfferCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";

export type CardOffer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  price?: number | string | null;
  affiliateUrl?: string;
  imageUrl?: string;
  httpStatus?: number | string;
};

function slugify(input: string): string {
  const s = (input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "produit";
}

function euro(p: number | string | null | undefined): string {
  if (p == null) return "";
  const cleaned = String(p).replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num)
    ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}

export default function OfferCard({
  offer,
  index,
  originSlug,
}: {
  offer: CardOffer;
  index?: number;
  originSlug?: string;
}) {
  const title = offer.title || "Produit";
  const brand = offer.brand || offer.merchant || "";
  const img = offer.imageUrl || "/images/product-placeholder.jpg";
  const price = euro(offer.price);
  const detailsSlug = slugify(title);
  const detailsHref = `/p/${detailsSlug}`;
  const hasAff = typeof offer.affiliateUrl === "string" && offer.affiliateUrl.trim().length > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-[#EBC8B2] transition hover:shadow-lg">
      {/* Cadre blanc autour de l’image */}
      <div className="p-3">
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#F2E3DA]">
          <Image
            src={img}
            alt={title}
            width={600}
            height={600}
            unoptimized
            className="aspect-square w-full object-cover"
          />
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "#C4A092" }}>
              {title}
            </h3>
            <p className="text-sm opacity-80" style={{ color: "#333333" }}>
              {brand}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-semibold" style={{ color: "#333333" }}>
            {price}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={detailsHref}
              className="rounded-2xl border px-4 py-2 text-sm transition"
              style={{ borderColor: "#C4A092", color: "#C4A092", backgroundColor: "transparent" }}
              prefetch
            >
              Détails
            </Link>

            {hasAff ? (
              <Link
                href={offer.affiliateUrl as string}
                className="rounded-2xl px-4 py-2 text-sm text-white transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "#C4A092" }}
                rel="nofollow sponsored noopener"
                target="_blank"
              >
                Voir l’offre
              </Link>
            ) : (
              <Link
                href="/offers"
                className="rounded-2xl px-4 py-2 text-sm text-white transition hover:opacity-90 hover:shadow-md"
                style={{ backgroundColor: "#C4A092" }}
              >
                Voir l’offre
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
