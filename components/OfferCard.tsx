// components/OfferCard.tsx
import Link from "next/link";
import Image from "next/image";

export type CardOffer = {
  productId?: string;
  slug?: string;
  title?: string;
  brand?: string;
  price?: number | string;
  imageUrl?: string;
  affiliateUrl?: string;
  merchant?: string;
  httpStatus?: number | string;
};

function euro(p?: number | string) {
  if (p == null || p === "") return "";
  const num = Number(String(p).replace(",", "."));
  return Number.isFinite(num)
    ? num.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
    : String(p);
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OfferCard({
  offer,
}: {
  offer: CardOffer;
  index?: number;
  originSlug?: string;
}) {
  const {
    title = "Produit",
    brand,
    imageUrl,
    price,
    slug,
    affiliateUrl,
    httpStatus,
  } = offer;

  const s = slug || slugify(title);
  const hasAff =
    !!affiliateUrl && String(httpStatus ?? "200") === "200";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-md ring-1 ring-[var(--bg-light)]">
      <div className="rounded-2xl bg-[var(--bg-main)] p-3">
        <Image
          src={imageUrl || "/images/product-placeholder.jpg"}
          alt={title}
          width={800}
          height={800}
          unoptimized
          className="aspect-square w-full rounded-xl object-cover"
        />
      </div>

      <div className="mt-4 flex-1">
        <h3 className="font-serif text-xl" style={{ color: "var(--text)" }}>
          {title}
        </h3>
        {brand ? (
          <p className="mt-1 text-sm opacity-80">{brand}</p>
        ) : null}
        <p className="mt-3 font-serif text-lg" style={{ color: "var(--text)" }}>
          {euro(price)}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href={`/p/${s}`}
          className="rounded-2xl border px-5 py-3 transition"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          prefetch
        >
          Détails
        </Link>

        {hasAff ? (
          <Link
            href={affiliateUrl as string}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="rounded-2xl px-5 py-3 text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Voir l’offre
          </Link>
        ) : null}
      </div>
    </article>
  );
}
