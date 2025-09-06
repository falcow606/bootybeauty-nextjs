// --- JSON-LD : Product avec offers valides (EUR, InStock, url affiliée) ---
type ProductOfferLD = {
  "@type": "Offer";
  price: string | number;
  priceCurrency: "EUR";
  availability: "https://schema.org/InStock" | "https://schema.org/OutOfStock";
  url: string;
  shippingDetails?: {
    "@type": "OfferShippingDetails";
    shippingRate?: {
      "@type": "MonetaryAmount";
      currency: "EUR";
      value: string | number;
    };
    deliveryTime?: {
      "@type": "ShippingDeliveryTime";
      handlingTime?: { "@type": "QuantitativeValue"; minValue: number; maxValue: number; unitCode: "DAY" };
      transitTime?: { "@type": "QuantitativeValue"; minValue: number; maxValue: number; unitCode: "DAY" };
    };
  };
};

type ProductLD = {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description?: string;
  image?: string;
  category?: string;
  brand?: { "@type": "Brand"; name: string };
  url?: string;
  offers: ProductOfferLD;
};

const jsonLd: ProductLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: title,                           // <- ton titre de produit déjà récupéré
  description:
    "Sol de Janeiro – Bom Dia Bright Cream — soin corps populaire, apprécié pour sa sensorialité et son confort.",
  image:
    "https://m.media-amazon.com/images/I/61Sbo3-5poL._AC_SL1500_.jpg", // mets l’URL d’image la plus pertinente si tu l’as
  category: "Body Care",
  brand: { "@type": "Brand", name: "Sol de Janeiro" },
  url: affiliate ?? undefined,           // peut rester undefined si pas d’URL
  offers: {
    "@type": "Offer",
    price: 24.90,                        // ← mets 0 si tu n’as pas de prix fiable
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url: affiliate || "https://www.amazon.fr/s?k=Sol+de+Janeiro+Bom+Dia+Bright+Cream",
    // Facultatif mais propre : enlève ou adapte si tu n’as pas l’info
    // shippingDetails: {
    //   "@type": "OfferShippingDetails",
    //   deliveryTime: {
    //     "@type": "ShippingDeliveryTime",
    //     handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 2, unitCode: "DAY" },
    //     transitTime:  { "@type": "QuantitativeValue", minValue: 2, maxValue: 7, unitCode: "DAY" },
    //   },
    // },
  },
};

// Balise unique JSON-LD (sans @ts-expect-error)
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
