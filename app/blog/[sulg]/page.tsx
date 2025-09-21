// app/blog/[sulg]/page.tsx
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Bodoni_Moda, Nunito_Sans } from 'next/font/google';

const bodoni = Bodoni_Moda({ subsets: ['latin'], style: ['normal'], weight: ['400','600','700'] });
const nunito = Nunito_Sans({ subsets: ['latin'], weight: ['300','400','600','700'] });

type BlogRow = {
  Slug: string;
  Title?: string;
  Subtitle?: string;
  Hero?: string;
  Body?: string;
  Date?: string;
  Tags?: string;
  Published?: string;
};

function truthy(v?: string) {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === 'oui' || s === 'true' || s === '1' || s === 'yes' || s === 'ok' || s === 'y';
}

// CSV parser tolérant (gère guillemets + retours à la ligne)
function parseCSV(text: string): BlogRow[] {
  const rows: BlogRow[] = [];
  const rawLines = text.split(/\r?\n/);
  if (!rawLines.length) return rows;

  const splitLine = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim());
  };

  // recolle les lignes physiques si un champ multi-ligne a “cassé” la ligne
  const lines: string[] = [];
  let buf = '';
  let open = false;
  for (const raw of rawLines) {
    const q = (raw.match(/"/g) || []).length;
    if (!open) {
      buf = raw;
      open = q % 2 === 1;
    } else {
      buf += '\n' + raw;
      open = q % 2 === 0 ? false : true;
    }
    if (!open) {
      lines.push(buf);
      buf = '';
    }
  }
  if (buf) lines.push(buf);

  const headerCells = splitLine(lines[0] || '');
  const header = headerCells.map((h) => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.every((c) => !c)) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = cells[c] ?? '';
    }
    rows.push(obj as BlogRow);
  }
  return rows;
}

async function getBlogRowBySlug(s: string): Promise<BlogRow | null> {
  const url = process.env.SHEETS_BLOG_CSV;
  if (!url) return null;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const csv = await res.text();

  const rows = parseCSV(csv);
  const needle = s.trim().toLowerCase();

  // match strict sur Slug
  let row = rows.find((r) => (r.Slug || '').trim().toLowerCase() === needle);

  // fallback : normalisation sans accents
  if (!row) {
    const norm = (x: string) =>
      x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    row = rows.find((r) => norm(r.Slug || '') === norm(needle));
  }

  if (row && row.Published && !truthy(row.Published)) return null;
  return row || null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ sulg: string }> }
): Promise<Metadata> {
  const { sulg } = await params;
  const data = await getBlogRowBySlug(sulg);
  const title = data?.Title || 'Article';
  const desc = data?.Subtitle || 'Article du blog Booty & Cutie.';
  const img = data?.Hero;

  return {
    title: `${title} — Le Blog`,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ sulg: string }> }
) {
  const { sulg } = await params;
  const data = await getBlogRowBySlug(sulg);

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className={`${bodoni.className} text-3xl`}>Article introuvable</h1>
        <p className={`${nunito.className} mt-3 opacity-80`}>
          Cet article n’existe pas (ou plus).
        </p>
        <Link href="/blog" className="mt-6 inline-block underline">
          Revenir au blog
        </Link>
      </main>
    );
  }

  const title = data.Title || 'Article';
  const subtitle = data.Subtitle || '';
  const hero = data.Hero || '';
  const date = data.Date || '';
  const tags = (data.Tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const body = (data.Body || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen w-full" style={{ background: '#FAF0E6' }}>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <h1 className={`${bodoni.className} text-4xl leading-tight`} style={{ color: '#333' }}>
            {title}
          </h1>
          {subtitle ? (
            <p className={`${nunito.className} mt-2 text-lg opacity-80`} style={{ color: '#333' }}>
              {subtitle}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {date ? (
              <span className={`${nunito.className} text-sm opacity-70`} style={{ color: '#333' }}>
                Publié le {date}
              </span>
            ) : null}
            {tags.map((t, i) => (
              <span
                key={i}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: '#EBC8B2', color: '#333' }}
              >
                {t}
              </span>
            ))}
          </div>
        </header>

        {hero ? (
          <div className="mb-8 overflow-hidden rounded-3xl bg-white p-3 shadow">
            <Image
              src={hero}
              alt={title}
              width={1600}
              height={900}
              className="aspect-[16/9] w-full rounded-2xl object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <article className={`${nunito.className} prose max-w-none prose-p:leading-relaxed`} style={{ color: '#333' }}>
          {body.map((p, i) => (
            <p key={i} className="mb-5">{p}</p>
          ))}
        </article>

        <div className="mt-10">
          <Link
            href="/blog"
            className="rounded-2xl border px-5 py-3 text-sm"
            style={{ borderColor: '#C4A092', color: '#C4A092' }}
          >
            ← Retour au blog
          </Link>
        </div>
      </main>
    </div>
  );
}
