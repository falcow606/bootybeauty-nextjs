import Papa from 'papaparse'

const CONTENT_URL = process.env.SHEETS_CONTENT_CSV || ''
const OFFERS_URL = process.env.SHEETS_OFFERS_CSV || ''
const AMAZON_TAG = process.env.AMAZON_TAG || ''

type ContentRow = {
  Slug: string
  Type: string
  Title: string
  Texte_HTML: string
  Schema_JSON?: string
  Image_URL?: string
  Brand?: string
  Price?: string
  PriceCurrency?: string
  Availability?: string
}

type OfferRow = {
  Affiliate_URL?: string
  Merchant?: string
}

async function fetchCSV<T extends Record<string, unknown>>(
  url: string,
  tag: 'content' | 'offers'
): Promise<T[]> {
  if (!url) return []
  const res = await fetch(url, { next: { tags: [tag], revalidate: 0 } })
  const text = await res.text()
  // Ne pas utiliser de générique sur Papa.parse -> on caste le résultat
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
  const data = (parsed.data as unknown as T[]) || []
  return data
}

export async function getContentBySlug(slug: string) {
  const rows = await fetchCSV<ContentRow>(CONTENT_URL, 'content')
  const row = rows.find((r) => r.Slug === slug)
  if (!row) return null

  // Affiliate (Amazon en priorité)
  let affiliate = ''
  const offers = await fetchCSV<OfferRow>(OFFERS_URL, 'offers')
  const baseAffiliate =
    offers.find((o) => (o.Affiliate_URL || '').includes('amazon.'))?.Affiliate_URL || ''
  if (baseAffiliate) {
    affiliate =
      baseAffiliate.includes('tag=') || !AMAZON_TAG
        ? baseAffiliate
        : `${baseAffiliate}${baseAffiliate.includes('?') ? '&' : '?'}tag=${AMAZON_TAG}`
  }

  const fromSchema = row.Schema_JSON
    ? (JSON.parse(row.Schema_JSON) as Record<string, unknown>)
    : undefined

  const image = row.Image_URL || (fromSchema?.image as string | undefined) || undefined
  const brand =
    row.Brand ||
    ((fromSchema?.brand as { name?: string } | undefined)?.name ??
      (typeof fromSchema?.brand === 'string' ? (fromSchema?.brand as string) : undefined))
  const price = row.Price ? Number(row.Price) : undefined
  const currency = row.PriceCurrency || undefined
  const availability = row.Availability || undefined

  return {
    slug: row.Slug,
    title: row.Title,
    html: row.Texte_HTML,
    schema: fromSchema,
    image,
    brand,
    price,
    currency,
    availability,
    affiliate,
  }
}

export async function getFeatured() {
  const rows = await fetchCSV<ContentRow>(CONTENT_URL, 'content')
  return rows
    .filter((r) => r.Type === 'fiche')
    .slice(0, 4)
    .map((r) => ({
      slug: r.Slug,
      title: r.Title,
      excerpt: (r.Texte_HTML || '').slice(0, 180) + '…',
    }))
}

export async function getTop10() {
  const rows = await fetchCSV<ContentRow>(CONTENT_URL, 'content')
  const offers = await fetchCSV<OfferRow>(OFFERS_URL, 'offers')
  const affiliate =
    offers.find((o) => (o.Affiliate_URL || '').includes('amazon.'))?.Affiliate_URL || ''
  return rows
    .filter((r) => r.Type === 'fiche')
    .slice(0, 10)
    .map((r) => ({
      slug: r.Slug,
      title: r.Title,
      affiliate:
        affiliate.includes('amazon.') && AMAZON_TAG && !affiliate.includes('tag=')
          ? `${affiliate}${affiliate.includes('?') ? '&' : '?'}tag=${AMAZON_TAG}`
          : affiliate,
    }))
}
