export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bodoni_Moda, Nunito_Sans } from 'next/font/google';

const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal'], weight: ['400','600','700'] });
const nunito = Nunito_Sans({ subsets: ['latin'], weight: ['300','400','600','700'] });

type Rec = Record<string, unknown>;
type BlogPost = {
  slug: string;
  title?: string;
  subtitle?: string;
  hero?: string;
  date?: string;
  tags?: string[];
  html?: string;
  body?: string;
};

// Util: récupère une string tolérante aux variantes de clés
function getStr(o: Rec | null | undefined, keys: string[]): string | undefined {
  if (!o) return undefined;
  for (const want of keys) {
    const hit = Object.keys(o).find(k => k.trim().toLowerCase() === want.trim().toLowerCase());
    const v = hit ? (o as Rec)[hit] : undefined;
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

function normalizePost(r: Rec): BlogPost | null {
  const slug = getStr(r, ['slug', 'Slug']);
  if (!slug) return null;

  const rawTags = getStr(r, ['tags', 'Tags']);
  const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

  return {
    slug,
    title: getStr(r, ['title', 'Title', 'titre']),
    subtitle: getStr(r, ['subtitle', 'Sous-titre', 'excerpt']),
    hero: getStr(r, ['hero', 'Hero', 'image', 'Hero_Image', 'Hero URL']),
    date: getStr(r, ['date', 'PublishedAt']),
    tags,
    html: getStr(r, ['html', 'HTML', 'ContentHTML']),
    body: getStr(r, ['body', 'Body', 'Content', 'Markdown', 'Texte']),
  };
}

// Si on n’a pas de HTML fourni, on transforme du texte en blocs <p>
function bodyToHtml(body?: string): string | undefined {
  if (!body) return undefined;
  const blocks = body.replace(/\r/g, '').split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  if (!blocks.length) return undefined;
  return blocks.map(b => `<p>${b.replace(/\n/g, '<br/>')}</p>`).join('\n');
}

// On lit l’API interne pour rester aligné avec la liste /blog
async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  // URL absolue pour éviter tout souci d’origin
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
    'https://bootybeauty-nextjs.vercel.app';

  const url = `${base}/api/blog?slug=${encodeURIComponent(slug)}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;

  const json = (await res.json()) as Rec | Rec[] | { items?: Rec[] } | { data?: Rec[] } | null;
  let item: Rec | undefined;

  if (!json) return null;
  if (Array.isArray(json)) {
    item = json[0];
  } else if ('items' in json && Array.isArray((json as any).items)) {
    item = (json as any).items[0];
  } else if ('data' in json && Array.isArray((json as any).data)) {
    item = (json as any).data[0];
  } else {
    item = json as Rec;
  }

  if (!item) return null;
  return normalizePost(item);
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // Tente de charger via l’API interne
  const post = await fetchPostBySlug(slug);
  if (!post) {
    // 404 propre si l’article n’existe pas
    notFound();
  }

  const safeHtml = post.html || bodyToHtml(post.body);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Titre + méta */}
      <header className="mb-6">
        <h1 className={`${bodoni.className} text-3xl md:text-4xl`}>
          {post.title || slug.replace(/-/g, ' ')}
        </h1>
        {post.subtitle ? (
          <p className={`${nunito.className} mt-2 text-lg opacity-80`}>{post.subtitle}</p>
        ) : null}
        <div className={`${nunito.className} mt-3 text-sm opacity-70 flex gap-3 flex-wrap`}>
          {post.date ? <span>Publié le {post.date}</span> : null}
          {post.tags && post.tags.length ? (
            <span>
              Tags : {post.tags.map((t) => (
                <span key={t} className="mr-2">#{t}</span>
              ))}
            </span>
          ) : null}
        </div>
      </header>

      {/* Hero */}
      {post.hero ? (
        <div className="mb-8">
          <Image
            src={post.hero}
            alt={post.title || 'Illustration de l’article'}
            width={1400}
            height={900}
            className="w-full rounded-3xl object-cover"
            unoptimized
            priority
          />
        </div>
      ) : null}

      {/* Contenu */}
      {safeHtml ? (
        <article
          className={`${nunito.className} prose prose-neutral max-w-none`}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <p className={`${nunito.className} opacity-70`}>Contenu en cours de rédaction.</p>
      )}

      {/* Back */}
      <div className="mt-10">
        <Link href="/blog" className={`${nunito.className} underline`}>
          ← Retour au blog
        </Link>
      </div>
    </div>
  );
}
