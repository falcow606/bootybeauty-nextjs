import Image from "next/image";
import Link from "next/link";
import AffiliateLink from "@/components/AffiliateLink";

export type CardOffer = {
  productId?: string;
  title?: string;
  brand?: string;
  merchant?: string;
  imageUrl?: string;
  price?: string | number;
  affiliateUrl?: string;
  slug?: string;
};

function slugify(input: string): string {
  return (input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "produit";
}

function detailsHref(o: CardOffer): string {
  if (o.slug && o.slug.trim()) return `/p/${o.slug}`;
  if (o.title) return `/p/${slugify(o.title)}`;
  return "/offers";
}

function displayPrice(p?: string | number): string {
  if (p == null || p === "") return "";
  if (typeof p === "number") {
    return p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }
  const num = Number(String(p).replace(",", "."));
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
  const price = displayPrice(offer.price);
  const img = offer.imageUrl || "/images/product-placeholder.jpg";
  const hrefDetails = detailsHref(offer);
  const affiliate = offer.affiliateUrl && offer.affiliateUrl.trim() ? offer.affiliateUrl : undefined;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-1 ring-[#EBD9CC] transition hover:shadow-lg">
      {/* Frame image validé */}
      <div className="p-3">
        <div className="aspect-square w-full overflow-hidden rounded-2xl bg-[#FAF0E6]">
          <Image
            src={img}
            alt={`${title} — photo produit`}
            width={800}
            height={800}
            unoptimized
            className="h-full w-full object-contain"
            priority={index === 0}
          />
        </div>
      </div>

      {/* Texte */}
      <div className="px-5 pb-5">
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#C4A092]">{title}</h3>
            <p className="text-sm opacity-80">{brand}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-base font-medium text-[#333]">{price}</span>
          <div className="flex items-center gap-2">
            <Link
              href={hrefDetails}
              className="rounded-2xl border px-4 py-2 text-sm transition hover:opacity-90"
              style={{ borderColor: "#C4A092", color: "#C4A092" }}
              prefetch
            >
              Détails
            </Link>

            {affiliate ? (
              <AffiliateLink
                href={affiliate}
                merchant={brand || "Shop"}
                className="rounded-2xl px-4 py-2 text-sm text-white"
              >
                Voir l’offre
              </AffiliateLink>
            ) : (
              <Link
                href="/offers"
                className="rounded-2xl px-4 py-2 text-sm text-white"
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
