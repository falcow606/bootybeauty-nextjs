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
  const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true })
  return parsed.data
}

export async function getContentBySlug(slug: string) {
  const rows = await fetchCSV<ContentRow>(CONTENT_URL, 'content')
  const row = rows.find((r) => r.Slug === slug)
  if (!row) return null
  const schema = row.Schema_JSON ? JSON.parse(row.Schema_JSON) : null
  return { slug: row.Slug, title: row.Title, html: row.Texte_HTML, schema }
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
    offers.find((o) => (o.Affiliate_URL || '').includes('amazon.fr'))?.Affiliate_URL || ''
  return rows
    .filter((r) => r.Type === 'fiche')
    .slice(0, 10)
    .map((r) => ({
      slug: r.Slug,
      title: r.Title,
      affiliate:
        affiliate.includes('amazon.fr') && AMAZON_TAG && !affiliate.includes('tag=')
          ? `${affiliate}${affiliate.includes('?') ? '&' : '?'}tag=${AMAZON_TAG}`
          : affiliate,
    }))
}
