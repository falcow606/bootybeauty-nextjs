import { getContentBySlug } from '@/lib/sheets'
import Link from 'next/link'
import AffiliateLink from '@/components/AffiliateLink'

export const revalidate = 1800

type Props = { params: Promise<{ slug: string }> }

function extractDomain(u: string) {
  try {
    const url = new URL(u)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Lien “officiel” vers pages Livraison/Retours selon le marchand
function getPolicyLinks(affiliate?: string) {
  const host = affiliate ? extractDomain(affiliate) : ''

  // Amazon FR
  if (host.endsWith('amazon.fr')) {
    return {
      shippingSettingsLink:
        'https://www.amazon.fr/gp/help/customer/display.html?nodeId=G2S5FKXRFV8D2WVF',
      returnPolicyUrl:
        'https://www.amazon.fr/gp/help/customer/display.html?nodeId=G6Q8Z6FH9J9ZUXT5',
      sellerName: 'Amazon',
    }
  }

  // Sephora FR
  if (host.endsWith('sephora.fr')) {
    return {
      shippingSettingsLink:
        'https://www.sephora.fr/faq-livraison.html',
      returnPolicyUrl:
        'https://www.sephora.fr/faq-retours.html',
      sellerName: 'Sephora',
    }
  }

  // Par défaut : on ne met que le nom “Marchand partenaire”
  return {
    shippingSettingsLink: undefined as string | undefined,
    returnPolicyUrl: undefined as string | undefined,
    sellerName: 'Marchand partenaire',
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const data = await getContentBySlug(slug)

  if (!data) {
    return (
      <div className="prose">
        <h1>Introuvable (slug incorrect ou CSV non publié).</h1>
        <p><Link href="/">Retour à l’accueil</Link></p>
      </div>
    )
  }

  const { title, html, schema } = data

  // Essaie de récupérer une URL affiliée utilisable depuis le HTML (si tu en mets une dans ton contenu)
  // Sinon, Google utilisera juste l’URL de la page comme “url” produit.
  const affiliateMatch = html.match(/href="([^"]+)"[^>]*rel="nofollow sponsored"/i)
  const affiliate = affiliateMatch?.[1]

  const { shippingSettingsLink, returnPolicyUrl, sellerName } = getPolicyLinks(affiliate)

  // Image principale si tu en fournis une dans le schema JSON (sinon rien)
  const imageFromSchema =
    typeof schema === 'object' && schema?.image
      ? Array.isArray(schema.image) ? schema.image[0] : schema.image
      : undefined

  // ---- JSON-LD Produit enrichi (sans inventions) ----
  const jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description:
      (typeof schema === 'object' && schema?.description) ||
      `${title} — fiche avis & test.`,
    image: imageFromSchema,
    brand:
      (typeof schema === 'object' && schema?.brand) || {
        '@type': 'Brand',
        name: sellerName,
      },
    url: affiliate || `https://bootybeauty-nextjs.vercel.app/p/${slug}`,
    // Offre minimale : prix/monnaie/availability si tu les as mis dans ton CSV “Schema_JSON”
    ...(typeof schema === 'object' && schema?.offers
      ? {
          offers: {
            ...schema.offers,
            // On ajoute ici les 2 champs qui faisaient l’objet des warnings :
            ...(returnPolicyUrl && {
              hasMerchantReturnPolicy: {
                '@type': 'MerchantReturnPolicy',
                // On ne prétend pas une fenêtre/conditions → on pointe la page officielle
                url: returnPolicyUrl,
                // Option neutre : “NotSupported” évite d’annoncer des conditions qu’on ne maîtrise pas
                returnPolicyCategory:
                  'https://schema.org/MerchantReturnPolicyNotSupported',
              },
            }),
            ...(shippingSettingsLink && {
              shippingDetails: {
                '@type': 'OfferShippingDetails',
                // Lien d’info livraison du marchand (pas de tarifs/délais inventés)
                shippingSettingsLink,
              },
            }),
            // Un “seller” propre (nom dépendant du marchand détecté)
            seller: { '@type': 'Organization', name: sellerName },
          },
        }
      : {}),
  }

  return (
    <div className="prose max-w-none">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/">Accueil</Link> &rsaquo; <Link href="/top-10/booty-beauty-2025">Top 10</Link> &rsaquo; {title}
      </nav>

      <h1 className="!mb-2">{title}</h1>

      {/* CTA affilié si dispo */}
      {affiliate && <AffiliateLink href={affiliate} className="mt-2">Voir l’offre</AffiliateLink>}

      {/* Contenu HTML éditorial depuis le Sheet */}
      <article
        className="mt-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}
