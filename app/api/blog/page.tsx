// app/blog/page.tsx
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type BlogPost = {
  slug: string
  title: string
  hero: string | null
  excerpt: string | null
  html: string | null
  date: string | null
}

async function getPosts(): Promise<BlogPost[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/blog`, { cache: 'no-store' })
  if (!res.ok) return []
  try {
    return (await res.json()) as BlogPost[]
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Blog</h1>

      {posts.length === 0 ? (
        <p>Aucun article pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="border rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {p.hero ? (
                <div className="relative w-full h-56">
                  <Image
                    src={p.hero}
                    alt={p.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 700px"
                  />
                </div>
              ) : null}
              <div className="p-4">
                <h2 className="text-xl font-medium">{p.title}</h2>
                {p.excerpt ? <p className="text-sm text-neutral-600 mt-2">{p.excerpt}</p> : null}
                {p.date ? <p className="text-xs text-neutral-500 mt-3">Publié le {new Date(p.date).toLocaleDateString('fr-FR')}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
