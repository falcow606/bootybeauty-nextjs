export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Bodoni_Moda, Nunito_Sans } from 'next/font/google';

const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal'], weight: ['400','600','700'] });
const nunito = Nunito_Sans({ subsets: ['latin'], weight: ['300','400','600','700'] });

type Row = Record<string, string>;
type Post = {
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  content?: string; // HTML ou markdown déjà “à plat” si tu en fournis
  tags?: string[];
  date?: string;
};

function normalize(input: string | undefined | null): string {
  if (!input) return '';
  return String(input).trim();
}
function slugify(input: string): string {
  const s = input
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'article';
}

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  const lines = text.split(/\r?\n/);
  if (!lines.length) return rows;

  const split = (line: string): string[] => {
    const re = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
    return line
      .split(re)
      .map((c) => c.replace(/^"(.*)"$/s, '$1').replace(/""/g, '"').trim());
  };

  const header = split(lines[0]).map((h) => h.trim());
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;
    const cols = split(raw);
    const row: Row = {};
    header.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
    if (Object.values(row).some((v) => normalize(v) !== '')) rows.push(row);
  }
  return rows;
}

function toPost(row: Row): Post {
  const rawSlug   = normalize(row['Slug'] || row['slug'] || '');
  const title     = normalize(row['Title'] || row['Titre'] || row['title'] || '');
  const excerpt   = normalize(row['Excerpt'] || row['Intro'] || row['Résumé'] || row['excerpt'] || row['intro'] || '');
  const image     = normalize(row['Image'] || row['Hero'] || row['Cover'] || row['Image_URL'] || '');
  const content   = normalize(row['Content'] || row['HTML'] || row['Texte'] || row['content'] || '');
  const tagsStr   = normalize(row['Tags'] || row['tags'] || '');
  const date      = normalize(row['Date'] || row['date'] || '');

  const slug = rawSlug || slugify(title);
  const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return { slug, title, excerpt, image, content, tags, date };
}

async function getPostBySlug(slug: string): Promise<Post | null> {
  const url = process.env.SHEETS_BLOG_CSV;
  if (!url) return null;

  const init: RequestInit & { next?: { revalidate?: number } } =
    process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'
      ? { cache: 'no-store' }
      : { next: { revalidate: 1800 } };

  const res = await fetch(url, init);
  if (!res.ok) return null;
  const text = await res.text();
  const rows = parseCsv(text);
  const posts = rows.map(toPost);

  // match strict d’abord, puis fallback slugifié
  const direct = posts.find((p) => p.slug === slug);
  if (direct) return direct;

  const fallback = posts.find((p) => slugify(p.slug) === slug || slugify(p.title) === slug);
  return fallback ?? null;
}

type PageProps = { params: { slug: string } };

export default async function BlogPostPage({ params }: PageProps) {
  const slug = params.slug;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/blog" className={`${nunito.className} text-sm underline`}>← Retour au blog</Link>

      <h1 className={`${bodoni.className} mt-4 text-3xl md:text-4xl`} style={{ color: '#333' }}>
        {post.title}
      </h1>
      {post.date ? (
        <p className={`${nunito.className} mt-2 text-sm opacity-70`}>{new Date(post.date).toLocaleDateString('fr-FR')}</p>
      ) : null}

      {post.image ? (
        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-md">
          <Image
            src={post.image}
            alt={post.title}
            width={1200}
            height={800}
            unoptimized
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : null}

      {post.excerpt ? (
        <p className={`${nunito.className} mt-6 text-lg`} style={{ color: '#333' }}>
          {post.excerpt}
        </p>
      ) : null}

      {post.content ? (
        <article
          className={`${nunito.className} prose prose-neutral mt-6 max-w-none`}
          // si ton “Content” est en HTML basique :
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      ) : null}

      {post.tags?.length ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: '#EBC8B2', color: '#333' }}>
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </main>
  );
}
