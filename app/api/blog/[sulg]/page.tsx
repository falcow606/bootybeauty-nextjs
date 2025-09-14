// app/blog/[slug]/page.tsx
import Image from 'next/image'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type BlogPost = {
  slug: string
  title: string
  hero: string | null
  excerpt: string | null
  html: string | null
  date: string | null
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/blog`, { cache: 'no-store' })
  if (!res.ok) return null
  try {
    const list = (await res.json()) as BlogPost[]
    return list.find((p) => p.slug === slug) ?? null
  } catch {
    return null
  }
}

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getPost(slug)
  const title = post?.title ?? 'Article'
  const description = post?.excerpt ?? 'Avis & tests produits'
  const canonical = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/blog/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'article', siteName: 'Booty & Cutie' },
  }
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return notFound()

  return (
    <main className="max-w-3xl mx-auto p-6">
      <article className="prose prose-neutral max-w-none">
        <h1>{post.title}</h1>
        {post.hero ? (
          <div className="relative w-full h-72 my-4">
            <Image
              src={post.hero}
              alt={post.title}
              fill
              className="object-cover rounded-xl"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        ) : null}

        {post.html ? (
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        ) : (
          <p>Contenu en cours de génération…</p>
        )}
      </article>
    </main>
  )
}
