// components/OfferCard.tsx
import Image from 'next/image';
import AffiliateLink from '@/components/AffiliateLink';

export type Offer = {
  productId: string | number;
  merchant: string | null;
  price: string | number | null;
  availability: string | null;
  affiliateUrl: string | null;
  commissionPct: string | number | null;
  httpStatus: number | string | null;
  lastChecked: string | null;

  // champs enrichis par l’API n8n
  imageUrl?: string | null;
  title?: string | null;
  brand?: string | null;
};

function asNumber(value: string | number | null): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : null;
  const n = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : null; // 0 => null
}

export default function OfferCard({ offer, index }: { offer: Offer; index: number }) {
  const priceNum = asNumber(offer.price);
  const ts = offer.lastChecked ? new Date(offer.lastChecked) : null;

  const displayTitle =
    (offer.title && offer.title.trim()) ||
    (offer.brand && offer.brand.trim()) ||
    (offer.merchant ?? '') ||
    `#${offer.productId}`;

  const imgSrc = offer.imageUrl && offer.imageUrl.trim().length > 0 ? offer.imageUrl : null;

  return (
    <article className="flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="relative h-28 w-28 overflow-hidden rounded-xl bg-neutral-100">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={displayTitle}
            fill
            sizes="112px"
            className="object-cover"
            priority={index < 2}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            # {String(offer.productId)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold">{displayTitle}</h3>

        <div className="mt-1 text-sm text-neutral-500">
          {offer.merchant && <span className="mr-2">{offer.merchant}</span>}
          {priceNum != null ? (
            <span className="font-medium text-neutral-900">
              — Prix estimé : {priceNum.toFixed(2)} €
            </span>
          ) : (
            <span className="text-neutral-500">— Prix non renseigné</span>
          )}
        </div>

        <div className="mt-1 text-xs text-neutral-400">
          {ts ? <>Lien vérifié · {ts.toLocaleDateString()} {ts.toLocaleTimeString()}</> : 'Lien non vérifié'}
        </div>

        <div className="mt-3">
          {offer.affiliateUrl ? (
            <AffiliateLink
              href={offer.affiliateUrl}
              className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
            >
              Voir l’offre
            </AffiliateLink>
          ) : (
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-xl bg-neutral-200 px-4 py-2 text-neutral-500"
            >
              Indisponible
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
